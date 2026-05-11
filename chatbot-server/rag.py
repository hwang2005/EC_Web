"""
RAG Engine - ChromaDB + Ollama Llama 3 for the Nong San Viet chatbot.

Responsibilities:
  1. Load markdown knowledge documents from knowledge_base/
  2. Chunk and embed them into a ChromaDB collection
  3. Retrieve relevant context for a user query
  4. Generate a grounded response via Ollama's chat API
"""

import hashlib
import io
import json
import os
import shutil
import subprocess
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path
from typing import Dict, List, Optional

import chromadb
from dotenv import load_dotenv

# Fix Windows console encoding
if sys.stdout.encoding != "utf-8":
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")
if sys.stderr.encoding != "utf-8":
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding="utf-8", errors="replace")

load_dotenv()

KNOWLEDGE_DIR = Path(__file__).parent / "knowledge_base"
CHROMA_DIR = Path(__file__).parent / "chroma_data"
EMBEDDING_PROVIDER = "ollama"

OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434").rstrip("/")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "llama3")
OLLAMA_EMBED_MODEL = os.getenv("OLLAMA_EMBED_MODEL", OLLAMA_MODEL)
OLLAMA_TIMEOUT_SECONDS = float(os.getenv("OLLAMA_TIMEOUT_SECONDS", "120"))
OLLAMA_EMBED_TIMEOUT_SECONDS = float(os.getenv("OLLAMA_EMBED_TIMEOUT_SECONDS", "300"))
OLLAMA_EMBED_BATCH_SIZE = int(os.getenv("OLLAMA_EMBED_BATCH_SIZE", "10"))
OLLAMA_MODELS_DIR = Path(
    os.getenv("OLLAMA_MODELS", str(Path.home() / ".ollama" / "models"))
).expanduser()

SYSTEM_PROMPT = """Bạn là "Trợ Lý Nông Sản Việt", chatbot hỗ trợ khách hàng của cửa hàng thương mại điện tử nông sản Nông Sản Việt.

QUY TẮC:
1. Luôn trả lời bằng tiếng Việt, thân thiện và chuyên nghiệp.
2. Chỉ trả lời dựa trên thông tin được cung cấp trong ngữ cảnh bên dưới. KHÔNG bịa đặt thông tin.
3. Nếu không tìm thấy câu trả lời trong ngữ cảnh, hãy nói rõ ràng bạn không có thông tin và gợi ý khách liên hệ hotline 0912 345 678 hoặc email seller@demo.com.
4. Khi nói về giá, luôn nhắc đơn vị tính (kg, gói, chai, hộp, trái) và lưu ý giá chưa bao gồm VAT 10%.
5. Khi nói về sản phẩm tươi, nhắc hướng dẫn bảo quản.
6. Sử dụng emoji phù hợp để thân thiện hơn (🌾🥬🍉☕ v.v.), nhưng đừng lạm dụng.
7. Trả lời ngắn gọn, dễ hiểu, chia thành các gạch đầu dòng khi liệt kê.
8. Nếu khách hỏi về hạng thành viên, giải thích cách tính và ưu đãi tương ứng.
9. Luôn khuyến khích khách hàng mua sắm nông sản sạch, tự nhiên.
"""


def _chunk_markdown(text: str, source_file: str, max_chunk_size: int = 800) -> List[Dict]:
    """Split a markdown document into chunks by heading sections."""
    chunks = []
    current_heading = source_file
    current_lines: List[str] = []

    for line in text.splitlines():
        if line.startswith("## ") or line.startswith("# "):
            if current_lines:
                content = "\n".join(current_lines).strip()
                if content:
                    chunks.append({
                        "content": content,
                        "source": source_file,
                        "heading": current_heading,
                    })
            current_heading = line.lstrip("#").strip()
            current_lines = [line]
        else:
            current_lines.append(line)

    if current_lines:
        content = "\n".join(current_lines).strip()
        if content:
            chunks.append({
                "content": content,
                "source": source_file,
                "heading": current_heading,
            })

    final_chunks = []
    for chunk in chunks:
        text_content = chunk["content"]
        if len(text_content) <= max_chunk_size:
            final_chunks.append(chunk)
            continue

        paragraphs = text_content.split("\n\n")
        buffer = ""
        for para in paragraphs:
            if len(buffer) + len(para) + 2 > max_chunk_size and buffer:
                final_chunks.append({
                    "content": buffer.strip(),
                    "source": chunk["source"],
                    "heading": chunk["heading"],
                })
                buffer = para
            else:
                buffer = buffer + "\n\n" + para if buffer else para

        if buffer.strip():
            final_chunks.append({
                "content": buffer.strip(),
                "source": chunk["source"],
                "heading": chunk["heading"],
            })

    return final_chunks


def _compute_content_hash(chunks: List[Dict]) -> str:
    """Create a deterministic hash of all chunk contents for change detection."""
    combined = "".join(c["content"] for c in chunks)
    return hashlib.sha256(combined.encode("utf-8")).hexdigest()[:16]


class RAGEngine:
    """Retrieval-Augmented Generation engine using ChromaDB + Ollama."""

    def __init__(self):
        self.ollama_base_url = OLLAMA_BASE_URL
        self.ollama_model = OLLAMA_MODEL
        self.ollama_embed_model = OLLAMA_EMBED_MODEL
        self.ollama_timeout = OLLAMA_TIMEOUT_SECONDS
        self.ollama_models_dir = OLLAMA_MODELS_DIR
        self.has_llama = False
        # Keep legacy name for compatibility with existing health checks.
        self.has_openai = False
        self.provider_status_message = ""
        self.embedding_status_message = ""
        self._ollama_autostart_attempted = False

        self.chroma_client = chromadb.PersistentClient(path=str(CHROMA_DIR))
        self.collection_name = "nong_san_viet"

        if self._list_local_model_names():
            self._start_ollama_server()
        self._load_knowledge()
        self.refresh_provider_status()

    def _load_knowledge(self):
        """Load all markdown files from knowledge_base/ and index into ChromaDB."""
        all_chunks: List[Dict] = []

        if not KNOWLEDGE_DIR.exists():
            print(f"[WARN] Knowledge directory not found: {KNOWLEDGE_DIR}")
            self.collection = self.chroma_client.get_or_create_collection(
                name=self.collection_name,
                metadata={"embedding_provider": EMBEDDING_PROVIDER},
            )
            return

        for md_file in sorted(KNOWLEDGE_DIR.glob("*.md")):
            text = md_file.read_text(encoding="utf-8")
            chunks = _chunk_markdown(text, md_file.stem)
            all_chunks.extend(chunks)

        if not all_chunks:
            print("[WARN] No knowledge chunks found.")
            self.collection = self.chroma_client.get_or_create_collection(
                name=self.collection_name,
                metadata={"embedding_provider": EMBEDDING_PROVIDER},
            )
            return

        content_hash = _compute_content_hash(all_chunks)

        expected_embedding_config = f"{EMBEDDING_PROVIDER}:{self.ollama_embed_model}"

        try:
            existing = self.chroma_client.get_collection(self.collection_name)
            existing_meta = existing.metadata or {}
            hash_matches = existing_meta.get("content_hash") == content_hash
            provider_matches = existing_meta.get("embedding_provider") == expected_embedding_config
            if hash_matches and provider_matches:
                print(f"[OK] ChromaDB collection up-to-date ({existing.count()} chunks)")
                self.collection = existing
                return

            print("[UPDATE] Knowledge or embedding strategy changed, re-indexing...")
            self.chroma_client.delete_collection(self.collection_name)
        except Exception:
            print("[NEW] Creating new ChromaDB collection...")

        self.collection = self.chroma_client.create_collection(
            name=self.collection_name,
            metadata={
                "content_hash": content_hash,
                "embedding_provider": expected_embedding_config,
            },
        )

        ids = []
        documents = []
        embeddings = []
        metadatas = []

        for i, chunk in enumerate(all_chunks):
            chunk_id = f"{chunk['source']}-{i}"
            ids.append(chunk_id)
            documents.append(chunk["content"])
            metadatas.append({
                "source": chunk["source"],
                "heading": chunk["heading"],
            })

        print(
            f"[EMBED] Indexing {len(documents)} chunks with Ollama embeddings "
            f"({self.ollama_embed_model})..."
        )
        self._warmup_model()
        indexed_count = 0
        try:
            embeddings = self._embed_texts(documents)
            self.collection.add(
                ids=ids,
                documents=documents,
                metadatas=metadatas,
                embeddings=embeddings,
            )
            indexed_count = len(documents)
        except Exception as exc:
            print(f"[WARN] Failed to build embeddings with Ollama: {exc}")

        print(f"[OK] Indexed {indexed_count} knowledge chunks into ChromaDB")

    def _post_json(
        self,
        endpoint: str,
        payload: Optional[Dict] = None,
        timeout_override: Optional[float] = None,
    ) -> Dict:
        data = None if payload is None else json.dumps(payload).encode("utf-8")
        request = urllib.request.Request(
            url=f"{self.ollama_base_url}{endpoint}",
            data=data,
            headers={"Content-Type": "application/json"},
            method="POST" if payload is not None else "GET",
        )
        timeout = timeout_override if timeout_override is not None else self.ollama_timeout
        with urllib.request.urlopen(request, timeout=timeout) as response:
            return json.loads(response.read().decode("utf-8"))

    def _list_local_model_names(self) -> List[str]:
        """Read Ollama manifests to discover locally installed models."""
        manifests_root = self.ollama_models_dir / "manifests" / "registry.ollama.ai" / "library"
        if not manifests_root.exists():
            return []

        local_models = set()
        for model_dir in manifests_root.iterdir():
            if not model_dir.is_dir():
                continue
            tags = [tag_file.name for tag_file in model_dir.iterdir() if tag_file.is_file()]
            if not tags:
                continue
            local_models.add(model_dir.name)
            for tag in tags:
                local_models.add(f"{model_dir.name}:{tag}")
        return sorted(local_models)

    def _start_ollama_server(self) -> bool:
        """Start `ollama serve` with the configured local model store."""
        if self._ollama_autostart_attempted:
            return False
        self._ollama_autostart_attempted = True

        ollama_executable = shutil.which("ollama")
        if not ollama_executable:
            return False

        env = os.environ.copy()
        env["OLLAMA_MODELS"] = str(self.ollama_models_dir)

        startupinfo = None
        creationflags = 0
        if os.name == "nt":
            startupinfo = subprocess.STARTUPINFO()
            startupinfo.dwFlags |= subprocess.STARTF_USESHOWWINDOW
            creationflags = getattr(subprocess, "CREATE_NO_WINDOW", 0)

        try:
            subprocess.Popen(
                [ollama_executable, "serve"],
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL,
                stdin=subprocess.DEVNULL,
                env=env,
                startupinfo=startupinfo,
                creationflags=creationflags,
            )
        except Exception:
            return False

        for _ in range(10):
            time.sleep(1)
            try:
                self._post_json("/api/tags")
                return True
            except Exception:
                continue
        return False

    def _model_exists(self, available_models: List[str], expected_model: str) -> bool:
        return any(
            model_name == expected_model or model_name.startswith(f"{expected_model}:")
            for model_name in available_models
        )

    def _warmup_model(self):
        """Pre-load the embedding model into memory with a trivial request."""
        print(f"[LOAD] Pre-loading model '{self.ollama_embed_model}' into memory...")
        try:
            payload = {"model": self.ollama_embed_model, "input": ["warmup"]}
            self._post_json("/api/embed", payload, timeout_override=OLLAMA_EMBED_TIMEOUT_SECONDS)
            print(f"[OK] Model '{self.ollama_embed_model}' loaded successfully.")
        except Exception as exc:
            print(f"[WARN] Model warmup failed: {exc}")

    def _embed_texts(self, texts: List[str]) -> List[List[float]]:
        """Generate embeddings for a batch of texts using Ollama (batched)."""
        if not texts:
            return []

        all_embeddings: List[List[float]] = []
        batch_size = OLLAMA_EMBED_BATCH_SIZE
        total_batches = (len(texts) + batch_size - 1) // batch_size

        for batch_idx in range(total_batches):
            start = batch_idx * batch_size
            end = min(start + batch_size, len(texts))
            batch = texts[start:end]

            if total_batches > 1:
                print(f"  Batch {batch_idx + 1}/{total_batches} ({len(batch)} texts)...")

            payload = {
                "model": self.ollama_embed_model,
                "input": batch,
            }
            response = self._post_json(
                "/api/embed", payload, timeout_override=OLLAMA_EMBED_TIMEOUT_SECONDS
            )
            embeddings = response.get("embeddings")
            if not embeddings:
                raise RuntimeError(
                    f"Ollama model '{self.ollama_embed_model}' không trả về embeddings."
                )
            all_embeddings.extend(embeddings)

        return all_embeddings

    def _can_embed(self) -> bool:
        """Check whether the configured embedding model can produce vectors."""
        try:
            self._embed_texts(["kiem tra embedding"])
            self.embedding_status_message = ""
            return True
        except Exception as exc:
            self.embedding_status_message = (
                f"⚠️ Không thể tạo embeddings bằng model '{self.ollama_embed_model}': {exc}"
            )
            return False

    def refresh_provider_status(self) -> bool:
        """Check whether Ollama is running and the configured models are available."""
        try:
            data = self._post_json("/api/tags")
            available_models = sorted({
                model.get("name", "")
                for model in data.get("models", [])
                if isinstance(model, dict)
            })
            chat_model_exists = self._model_exists(available_models, self.ollama_model)
            embed_model_exists = self._model_exists(available_models, self.ollama_embed_model)
            if chat_model_exists and embed_model_exists and self._can_embed():
                self.has_llama = True
                self.has_openai = True
                self.provider_status_message = ""
                return True

            self.has_llama = False
            self.has_openai = False
            local_models = self._list_local_model_names()
            missing_models = []
            if not chat_model_exists:
                missing_models.append(self.ollama_model)
            if not embed_model_exists and self.ollama_embed_model not in missing_models:
                missing_models.append(self.ollama_embed_model)
            model_list = ", ".join(f"'{name}'" for name in missing_models)
            pull_hint = " và ".join(f"`ollama pull {name}`" for name in missing_models)
            self.provider_status_message = (
                f"⚠️ Chưa tìm thấy model {model_list} trong Ollama. "
                f"Hãy chạy {pull_hint} rồi thử lại."
            )
            self.embedding_status_message = self.provider_status_message
            return False
        except urllib.error.URLError:
            self.has_llama = False
            self.has_openai = False
            self.provider_status_message = (
                "⚠️ Không kết nối được tới Ollama. Hãy đảm bảo `ollama serve` đang chạy "
                f"tại {self.ollama_base_url}."
            )
            self.embedding_status_message = self.provider_status_message
            return False
        except Exception as exc:
            self.has_llama = False
            self.has_openai = False
            self.provider_status_message = f"⚠️ Không thể kiểm tra trạng thái Ollama: {exc}"
            self.embedding_status_message = self.provider_status_message
            return False

    def retrieve(self, query: str, top_k: int = 5) -> List[Dict]:
        """Retrieve the most relevant knowledge chunks for a query."""
        if self.collection.count() == 0:
            return []

        if not self._can_embed():
            raise RuntimeError(self.embedding_status_message)

        query_embedding = self._embed_texts([query])[0]
        results = self.collection.query(
            query_embeddings=[query_embedding],
            n_results=min(top_k, self.collection.count()),
        )

        retrieved = []
        if results and results.get("documents"):
            for doc, meta in zip(results["documents"][0], results["metadatas"][0]):
                retrieved.append({
                    "content": doc,
                    "source": meta.get("source", ""),
                    "heading": meta.get("heading", ""),
                })
        return retrieved

    def _chat_with_ollama(self, messages: List[Dict]) -> str:
        payload = {
            "model": self.ollama_model,
            "messages": messages,
            "stream": False,
            "options": {
                "temperature": 0.3,
                "num_predict": 800,
            },
        }

        response = self._post_json("/api/chat", payload)
        message = response.get("message") or {}
        content = message.get("content", "").strip()
        if not content:
            raise RuntimeError("Ollama không trả về nội dung phản hồi.")
        return content

    def generate(
        self,
        query: str,
        chat_history: Optional[List[Dict]] = None,
    ) -> Dict:
        """Generate a response using RAG: retrieve context then call Ollama."""
        if not self.refresh_provider_status():
            return {
                "reply": self.provider_status_message,
                "sources": [],
                "mode": "error",
            }

        try:
            context_chunks = self.retrieve(query, top_k=5)
        except Exception as exc:
            self.has_llama = False
            self.has_openai = False
            return {
                "reply": f"⚠️ Lỗi khi tạo vector embedding bằng Ollama: {exc}",
                "sources": [],
                "mode": "error",
            }

        context_text = "\n\n---\n\n".join(
            f"[{c['source']}/{c['heading']}]\n{c['content']}"
            for c in context_chunks
        )
        sources = list(dict.fromkeys(c["source"] for c in context_chunks))

        messages = [{"role": "system", "content": SYSTEM_PROMPT}]
        messages.append({
            "role": "system",
            "content": f"NGỮ CẢNH TỪ CƠ SỞ DỮ LIỆU:\n\n{context_text}",
        })

        if chat_history:
            for msg in chat_history[-10:]:
                role = msg.get("role", "user")
                if role in ("user", "assistant"):
                    messages.append({
                        "role": role,
                        "content": msg.get("content", ""),
                    })

        messages.append({"role": "user", "content": query})

        try:
            reply = self._chat_with_ollama(messages)
        except urllib.error.HTTPError as exc:
            error_body = exc.read().decode("utf-8", errors="replace")
            reply = (
                f"⚠️ Lỗi khi gọi Ollama ({exc.code}). "
                f"Chi tiết: {error_body or 'Không có nội dung lỗi.'}"
            )
            sources = []
            self.has_llama = False
            self.has_openai = False
        except urllib.error.URLError:
            reply = (
                "⚠️ Không kết nối được tới Ollama. Hãy đảm bảo `ollama serve` đang chạy "
                f"tại {self.ollama_base_url}."
            )
            sources = []
            self.has_llama = False
            self.has_openai = False
        except Exception as exc:
            reply = f"⚠️ Lỗi khi gọi Ollama: {exc}"
            sources = []
            self.has_llama = False
            self.has_openai = False

        return {
            "reply": reply,
            "sources": sources,
            "mode": "error" if reply.startswith("⚠️") else "ai",
        }
