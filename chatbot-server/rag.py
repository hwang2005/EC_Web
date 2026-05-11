"""
RAG Engine — ChromaDB + OpenAI for the Nông Sản Việt chatbot.

Responsibilities:
  1. Load markdown knowledge documents from knowledge_base/
  2. Chunk and embed them into a ChromaDB collection
  3. Retrieve relevant context for a user query
  4. Generate a grounded response via OpenAI Chat API
"""

import os
import sys
import io
import hashlib
from pathlib import Path
from typing import List, Dict, Optional

# Fix Windows console encoding
if sys.stdout.encoding != "utf-8":
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")
if sys.stderr.encoding != "utf-8":
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding="utf-8", errors="replace")

import chromadb
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()

KNOWLEDGE_DIR = Path(__file__).parent / "knowledge_base"
CHROMA_DIR = Path(__file__).parent / "chroma_data"

OPENAI_MODEL = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
EMBEDDING_MODEL = os.getenv("EMBEDDING_MODEL", "text-embedding-3-small")

SYSTEM_PROMPT = """Bạn là "Trợ Lý Nông Sản Việt", chatbot hỗ trợ khách hàng của cửa hàng thương mại điện tử nông sản Nông Sản Việt.

QUY TẮC:
1. Luôn trả lời bằng tiếng Việt, thân thiện và chuyên nghiệp.
2. Chỉ trả lời dựa trên thông tin được cung cấp trong ngữ cảnh bên dưới. KHÔNG bịa đặt thông tin.
3. Nếu không tìm thấy câu trả lời trong ngữ cảnh, hãy nói rõ rằng bạn không có thông tin và gợi ý khách liên hệ hotline 0912 345 678 hoặc email seller@demo.com.
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
    current_lines: list[str] = []

    for line in text.splitlines():
        if line.startswith("## ") or line.startswith("# "):
            # Flush previous chunk
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

    # Flush last chunk
    if current_lines:
        content = "\n".join(current_lines).strip()
        if content:
            chunks.append({
                "content": content,
                "source": source_file,
                "heading": current_heading,
            })

    # Further split any chunk that exceeds max_chunk_size
    final_chunks = []
    for chunk in chunks:
        text_content = chunk["content"]
        if len(text_content) <= max_chunk_size:
            final_chunks.append(chunk)
        else:
            # Split by double newline (paragraphs)
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
    """Retrieval-Augmented Generation engine using ChromaDB + OpenAI."""

    def __init__(self):
        api_key = os.getenv("OPENAI_API_KEY", "")
        self.has_openai = bool(api_key and not api_key.startswith("sk-your-"))
        self.client = OpenAI(api_key=api_key) if self.has_openai else None

        # ChromaDB — persistent local storage
        self.chroma_client = chromadb.PersistentClient(path=str(CHROMA_DIR))
        self.collection_name = "nong_san_viet"

        # Load and index knowledge
        self._load_knowledge()

    def _load_knowledge(self):
        """Load all markdown files from knowledge_base/ and index into ChromaDB."""
        all_chunks: List[Dict] = []

        if not KNOWLEDGE_DIR.exists():
            print(f"[WARN] Knowledge directory not found: {KNOWLEDGE_DIR}")
            self.collection = self.chroma_client.get_or_create_collection(
                name=self.collection_name
            )
            return

        for md_file in sorted(KNOWLEDGE_DIR.glob("*.md")):
            text = md_file.read_text(encoding="utf-8")
            chunks = _chunk_markdown(text, md_file.stem)
            all_chunks.extend(chunks)

        if not all_chunks:
            print("[WARN] No knowledge chunks found.")
            self.collection = self.chroma_client.get_or_create_collection(
                name=self.collection_name
            )
            return

        content_hash = _compute_content_hash(all_chunks)

        # Check if we need to re-index
        try:
            existing = self.chroma_client.get_collection(self.collection_name)
            existing_meta = existing.metadata or {}
            if existing_meta.get("content_hash") == content_hash:
                print(f"[OK] ChromaDB collection up-to-date ({existing.count()} chunks)")
                self.collection = existing
                return
            else:
                print("[UPDATE] Knowledge changed, re-indexing...")
                self.chroma_client.delete_collection(self.collection_name)
        except Exception:
            print("[NEW] Creating new ChromaDB collection...")

        # Create collection and index
        self.collection = self.chroma_client.create_collection(
            name=self.collection_name,
            metadata={"content_hash": content_hash},
        )

        ids = []
        documents = []
        metadatas = []
        embeddings_list = []

        for i, chunk in enumerate(all_chunks):
            chunk_id = f"{chunk['source']}-{i}"
            ids.append(chunk_id)
            documents.append(chunk["content"])
            metadatas.append({
                "source": chunk["source"],
                "heading": chunk["heading"],
            })

        # Embed with OpenAI if available, otherwise use ChromaDB default
        if self.has_openai:
            print(f"[EMBED] Embedding {len(documents)} chunks with OpenAI...")
            batch_size = 20
            for start in range(0, len(documents), batch_size):
                batch_docs = documents[start:start + batch_size]
                resp = self.client.embeddings.create(
                    model=EMBEDDING_MODEL,
                    input=batch_docs,
                )
                for item in resp.data:
                    embeddings_list.append(item.embedding)

            self.collection.add(
                ids=ids,
                documents=documents,
                metadatas=metadatas,
                embeddings=embeddings_list,
            )
        else:
            # Use ChromaDB's default embedding function
            print(f"[INDEX] Indexing {len(documents)} chunks with default embeddings...")
            self.collection.add(
                ids=ids,
                documents=documents,
                metadatas=metadatas,
            )

        print(f"[OK] Indexed {len(documents)} knowledge chunks into ChromaDB")

    def retrieve(self, query: str, top_k: int = 5) -> List[Dict]:
        """Retrieve the most relevant knowledge chunks for a query."""
        if self.collection.count() == 0:
            return []

        if self.has_openai:
            # Embed query with OpenAI
            resp = self.client.embeddings.create(
                model=EMBEDDING_MODEL,
                input=[query],
            )
            query_embedding = resp.data[0].embedding
            results = self.collection.query(
                query_embeddings=[query_embedding],
                n_results=min(top_k, self.collection.count()),
            )
        else:
            # Use ChromaDB default query
            results = self.collection.query(
                query_texts=[query],
                n_results=min(top_k, self.collection.count()),
            )

        retrieved = []
        if results and results["documents"]:
            for doc, meta in zip(results["documents"][0], results["metadatas"][0]):
                retrieved.append({
                    "content": doc,
                    "source": meta.get("source", ""),
                    "heading": meta.get("heading", ""),
                })
        return retrieved

    def generate(
        self,
        query: str,
        chat_history: Optional[List[Dict]] = None,
    ) -> Dict:
        """Generate a response using RAG: retrieve context then call OpenAI."""
        if not self.has_openai:
            return {
                "reply": "⚠️ Chưa cấu hình OpenAI API key. Vui lòng cập nhật file .env với API key hợp lệ.",
                "sources": [],
                "mode": "error",
            }

        # 1. Retrieve relevant context
        context_chunks = self.retrieve(query, top_k=5)
        context_text = "\n\n---\n\n".join(
            f"[{c['source']}/{c['heading']}]\n{c['content']}"
            for c in context_chunks
        )
        sources = list(set(c["source"] for c in context_chunks))

        # 2. Build messages
        messages = [{"role": "system", "content": SYSTEM_PROMPT}]

        # Add context
        messages.append({
            "role": "system",
            "content": f"NGỮ CẢNH TỪ CƠ SỞ DỮ LIỆU:\n\n{context_text}",
        })

        # Add chat history (last 10 messages)
        if chat_history:
            for msg in chat_history[-10:]:
                role = msg.get("role", "user")
                if role in ("user", "assistant"):
                    messages.append({
                        "role": role,
                        "content": msg.get("content", ""),
                    })

        # Add current query
        messages.append({"role": "user", "content": query})

        # 3. Call OpenAI
        try:
            response = self.client.chat.completions.create(
                model=OPENAI_MODEL,
                messages=messages,
                temperature=0.3,
                max_tokens=800,
            )
            reply = response.choices[0].message.content or "Xin lỗi, tôi không thể trả lời lúc này."
        except Exception as e:
            reply = f"⚠️ Lỗi khi gọi OpenAI: {str(e)}"
            sources = []

        return {
            "reply": reply,
            "sources": sources,
            "mode": "ai",
        }
