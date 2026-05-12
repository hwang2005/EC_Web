"""
Smart Engine - TF-IDF + Cosine Similarity for intelligent knowledge retrieval.

This module provides an intelligent fallback when Ollama/LLM is unavailable.
It uses scikit-learn's TF-IDF vectorizer to match user queries against
knowledge base chunks, returning relevant answers with confidence scores
and contextual follow-up suggestions.

Dependencies: scikit-learn (lightweight, no GPU required)
"""

import re
import unicodedata
from pathlib import Path
from typing import Dict, List, Optional, Tuple

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

KNOWLEDGE_DIR = Path(__file__).parent / "knowledge_base"

# ──────────────────────────────────────────────────────────────
# Vietnamese text normalization
# ──────────────────────────────────────────────────────────────

# Common Vietnamese abbreviations → full form
ABBREVIATIONS: Dict[str, str] = {
    "sp": "sản phẩm",
    "km": "khuyến mãi",
    "vc": "vận chuyển",
    "gh": "giao hàng",
    "tt": "thanh toán",
    "tv": "thành viên",
    "kh": "khách hàng",
    "dt": "điện thoại",
    "đt": "điện thoại",
    "hsd": "hạn sử dụng",
    "bq": "bảo quản",
    "htx": "hợp tác xã",
    "sl": "số lượng",
    "dk": "đăng ký",
    "đk": "đăng ký",
}

# Map for removing Vietnamese diacritics
_VIET_DIACRITICS = str.maketrans(
    "àáảãạăắằẳẵặâấầẩẫậèéẻẽẹêếềểễệìíỉĩịòóỏõọôốồổỗộơớờởỡợùúủũụưứừửữựỳýỷỹỵđ"
    "ÀÁẢÃẠĂẮẰẲẴẶÂẤẦẨẪẬÈÉẺẼẸÊẾỀỂỄỆÌÍỈĨỊÒÓỎÕỌÔỐỒỔỖỘƠỚỜỞỠỢÙÚỦŨỤƯỨỪỬỮỰỲÝỶỸỴĐ",
    "aaaaaaaaaaaaaaaaaeeeeeeeeeeeiiiiiooooooooooooooooouuuuuuuuuuuyyyyyd"
    "AAAAAAAAAAAAAAAAAEEEEEEEEEEEIIIIIOOOOOOOOOOOOOOOOOUUUUUUUUUUUYYYYYD",
)


def strip_diacritics(text: str) -> str:
    """Remove Vietnamese diacritical marks while preserving đ→d."""
    return text.translate(_VIET_DIACRITICS)


def normalize_vietnamese(text: str) -> str:
    """
    Normalize Vietnamese text for matching:
    - Unicode NFC normalization
    - Lowercase
    - Expand abbreviations
    - Remove special characters but keep Vietnamese letters
    - Collapse whitespace
    """
    text = unicodedata.normalize("NFC", text).lower().strip()

    # Expand abbreviations (word-boundary aware)
    words = text.split()
    expanded = []
    for word in words:
        clean_word = re.sub(r"[^a-zàáảãạăắằẳẵặâấầẩẫậèéẻẽẹêếềểễệìíỉĩịòóỏõọôốồổỗộơớờởỡợùúủũụưứừửữựỳýỷỹỵđ0-9]", "", word)
        if clean_word in ABBREVIATIONS:
            expanded.append(ABBREVIATIONS[clean_word])
        else:
            expanded.append(word)
    text = " ".join(expanded)

    # Remove non-letter, non-digit, non-space characters
    text = re.sub(r"[^\w\s]", " ", text)
    text = re.sub(r"\s+", " ", text).strip()

    return text


def normalize_for_tfidf(text: str) -> str:
    """Normalize and also strip diacritics for TF-IDF matching (accent-insensitive)."""
    normalized = normalize_vietnamese(text)
    return strip_diacritics(normalized)


# ──────────────────────────────────────────────────────────────
# Topic-based follow-up suggestions
# ──────────────────────────────────────────────────────────────

TOPIC_SUGGESTIONS: Dict[str, List[str]] = {
    "products": [
        "Sản phẩm nào bán chạy nhất?",
        "Có sản phẩm hữu cơ không?",
        "Giá gạo ST25 bao nhiêu?",
    ],
    "delivery": [
        "Phí giao hàng bao nhiêu?",
        "Giao trong ngày được không?",
        "Có miễn phí vận chuyển không?",
    ],
    "payment": [
        "Có thanh toán COD không?",
        "Có hỗ trợ MoMo không?",
        "Giá đã bao gồm VAT chưa?",
    ],
    "vouchers": [
        "Có mã giảm giá nào không?",
        "Voucher cho hạng Vàng?",
        "Cách sử dụng voucher?",
    ],
    "tiers": [
        "Làm sao lên hạng Vàng?",
        "Hạng Kim Cương được giảm bao nhiêu?",
        "Cách tính điểm thành viên?",
    ],
    "store_policies": [
        "Chính sách đổi trả thế nào?",
        "Cách hủy đơn hàng?",
        "Liên hệ cửa hàng qua đâu?",
    ],
    "farm_stories": [
        "Nông trại nào cung cấp rau hữu cơ?",
        "Gạo ST25 từ đâu?",
        "Cà phê được trồng ở đâu?",
    ],
}

# Map knowledge file stems to topic keys
_FILE_TO_TOPIC: Dict[str, str] = {
    "products": "products",
    "delivery": "delivery",
    "payment": "payment",
    "vouchers": "vouchers",
    "tiers": "tiers",
    "store_policies": "store_policies",
    "farm_stories": "farm_stories",
}


def _get_suggestions_for_source(source: str, asked_question: str) -> List[str]:
    """Get follow-up suggestions based on the knowledge source, excluding similar questions."""
    topic = _FILE_TO_TOPIC.get(source, "")
    suggestions = TOPIC_SUGGESTIONS.get(topic, [])

    # Filter out suggestions too similar to the asked question
    asked_norm = normalize_for_tfidf(asked_question)
    filtered = []
    for s in suggestions:
        s_norm = normalize_for_tfidf(s)
        # Simple overlap check: skip if >50% word overlap
        asked_words = set(asked_norm.split())
        s_words = set(s_norm.split())
        if asked_words and s_words:
            overlap = len(asked_words & s_words) / min(len(asked_words), len(s_words))
            if overlap < 0.5:
                filtered.append(s)
        else:
            filtered.append(s)

    return filtered[:3]


# ──────────────────────────────────────────────────────────────
# Query rewriting (pronoun/reference resolution)
# ──────────────────────────────────────────────────────────────

# Vietnamese pronouns/references that indicate the user is referring to a previous subject
_REFERENCE_PATTERNS = [
    r"\bnó\b", r"\bcái đó\b", r"\bsản phẩm đó\b", r"\bmón đó\b",
    r"\bcái này\b", r"\bmón này\b", r"\bsản phẩm này\b",
    r"\bchúng\b", r"\bchúng nó\b",
]

# Product names to look for in history
_PRODUCT_NAMES = [
    "gạo st25", "cà phê robusta", "thanh long", "hồ tiêu",
    "chôm chôm", "rau hữu cơ", "xoài", "nước mắm",
    "lúa mạch", "măng khô", "trà xanh", "bưởi da xanh",
]


def rewrite_query(query: str, chat_history: Optional[List[Dict]] = None) -> str:
    """
    Rewrite queries that contain pronouns/references by substituting
    the most recently mentioned product/topic from chat history.
    """
    if not chat_history:
        return query

    query_lower = query.lower()
    has_reference = any(re.search(pattern, query_lower) for pattern in _REFERENCE_PATTERNS)
    if not has_reference:
        return query

    # Search backwards through history for the most recent product mention
    for msg in reversed(chat_history[-10:]):
        content = msg.get("content", "").lower()
        for product_name in _PRODUCT_NAMES:
            if product_name in content:
                # Replace the reference with the product name
                rewritten = query
                for pattern in _REFERENCE_PATTERNS:
                    rewritten = re.sub(pattern, product_name, rewritten, flags=re.IGNORECASE)
                return rewritten

    return query


# ──────────────────────────────────────────────────────────────
# Smart Engine (TF-IDF based)
# ──────────────────────────────────────────────────────────────

class SmartEngine:
    """
    Intelligent knowledge retrieval using TF-IDF + cosine similarity.
    Works entirely offline with no LLM/API dependency.
    """

    def __init__(self):
        self.chunks: List[Dict] = []
        self.chunk_texts: List[str] = []
        self.vectorizer: Optional[TfidfVectorizer] = None
        self.tfidf_matrix = None
        self.is_ready = False

        self._load_and_index()

    def _load_and_index(self):
        """Load knowledge base markdown files and build TF-IDF index."""
        if not KNOWLEDGE_DIR.exists():
            print("[SMART] Knowledge directory not found, smart mode disabled.")
            return

        raw_chunks = []
        for md_file in sorted(KNOWLEDGE_DIR.glob("*.md")):
            text = md_file.read_text(encoding="utf-8")
            chunks = self._chunk_markdown(text, md_file.stem)
            raw_chunks.extend(chunks)

        if not raw_chunks:
            print("[SMART] No knowledge chunks found.")
            return

        self.chunks = raw_chunks
        # Normalize texts for TF-IDF (accent-insensitive)
        self.chunk_texts = [normalize_for_tfidf(c["content"]) for c in self.chunks]

        # Build TF-IDF index
        self.vectorizer = TfidfVectorizer(
            max_features=5000,
            ngram_range=(1, 2),  # Unigrams + bigrams for better matching
            min_df=1,
            max_df=0.95,
            sublinear_tf=True,
        )
        self.tfidf_matrix = self.vectorizer.fit_transform(self.chunk_texts)
        self.is_ready = True
        print(f"[SMART] Indexed {len(self.chunks)} chunks with TF-IDF ({self.tfidf_matrix.shape[1]} features)")

    @staticmethod
    def _chunk_markdown(text: str, source_file: str, max_chunk_size: int = 600) -> List[Dict]:
        """Split markdown into heading-based chunks (similar to rag.py but optimized for TF-IDF)."""
        chunks = []
        current_heading = source_file
        current_lines: List[str] = []

        for line in text.splitlines():
            if line.startswith("## ") or line.startswith("# "):
                if current_lines:
                    content = "\n".join(current_lines).strip()
                    if content and len(content) > 20:
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
            if content and len(content) > 20:
                chunks.append({
                    "content": content,
                    "source": source_file,
                    "heading": current_heading,
                })

        # Split oversized chunks by paragraph
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

    def query(
        self,
        user_query: str,
        chat_history: Optional[List[Dict]] = None,
        top_k: int = 3,
    ) -> Dict:
        """
        Process a user query and return a smart response.

        Returns:
            {
                "reply": str,
                "sources": List[str],
                "confidence": float (0.0 - 1.0),
                "suggestions": List[str],
                "mode": "smart" | "fallback",
            }
        """
        if not self.is_ready:
            return {
                "reply": "",
                "sources": [],
                "confidence": 0.0,
                "suggestions": [],
                "mode": "fallback",
            }

        # Rewrite query using chat history context
        rewritten = rewrite_query(user_query, chat_history)

        # Normalize query for TF-IDF matching
        query_normalized = normalize_for_tfidf(rewritten)

        if not query_normalized.strip():
            return {
                "reply": "",
                "sources": [],
                "confidence": 0.0,
                "suggestions": [],
                "mode": "fallback",
            }

        # Compute similarity
        query_vec = self.vectorizer.transform([query_normalized])
        similarities = cosine_similarity(query_vec, self.tfidf_matrix).flatten()

        # Get top-k results
        top_indices = similarities.argsort()[-top_k:][::-1]
        top_scores = [float(similarities[i]) for i in top_indices]

        best_score = top_scores[0] if top_scores else 0.0

        # Confidence threshold: below 0.08 is essentially no match
        if best_score < 0.08:
            return {
                "reply": "",
                "sources": [],
                "confidence": best_score,
                "suggestions": self._get_default_suggestions(),
                "mode": "fallback",
            }

        # Build response from matched chunks
        matched_chunks = []
        seen_headings = set()
        for idx, score in zip(top_indices, top_scores):
            if score < 0.05:
                continue
            chunk = self.chunks[idx]
            heading_key = f"{chunk['source']}/{chunk['heading']}"
            if heading_key not in seen_headings:
                matched_chunks.append((chunk, score))
                seen_headings.add(heading_key)

        if not matched_chunks:
            return {
                "reply": "",
                "sources": [],
                "confidence": 0.0,
                "suggestions": self._get_default_suggestions(),
                "mode": "fallback",
            }

        # Format the response
        reply = self._format_response(matched_chunks, user_query)
        sources = list(dict.fromkeys(c["source"] for c, _ in matched_chunks))

        # Get contextual suggestions
        primary_source = matched_chunks[0][0]["source"]
        suggestions = _get_suggestions_for_source(primary_source, user_query)

        # Normalize confidence to 0-1 range (TF-IDF cosine scores are typically 0-0.5)
        confidence = min(1.0, best_score * 2.5)

        return {
            "reply": reply,
            "sources": sources,
            "confidence": round(confidence, 2),
            "suggestions": suggestions,
            "mode": "smart",
        }

    def _format_response(self, matched_chunks: List[Tuple[Dict, float]], query: str) -> str:
        """Format matched knowledge chunks into a natural response."""
        if not matched_chunks:
            return ""

        query_lower = query.lower()
        best_chunk, best_score = matched_chunks[0]

        # For high confidence, return the primary chunk directly
        if best_score > 0.25 or len(matched_chunks) == 1:
            content = best_chunk["content"]
            heading = best_chunk["heading"]
            return self._clean_response(content, heading)

        # For multiple relevant chunks, combine them
        parts = []
        for chunk, score in matched_chunks[:3]:
            if score > 0.05:
                content = self._clean_response(chunk["content"], chunk["heading"])
                parts.append(content)

        return "\n\n---\n\n".join(parts)

    @staticmethod
    def _clean_response(content: str, heading: str) -> str:
        """Clean up markdown content for chat display."""
        lines = content.strip().splitlines()
        cleaned = []

        for line in lines:
            # Remove top-level heading (already shown as heading context)
            if line.startswith("# ") and not line.startswith("## "):
                continue
            # Keep sub-headings as bold text
            if line.startswith("## "):
                cleaned.append(f"**{line.lstrip('#').strip()}**")
            elif line.startswith("### "):
                cleaned.append(f"**{line.lstrip('#').strip()}**")
            else:
                cleaned.append(line)

        result = "\n".join(cleaned).strip()

        # Add heading context if not already present
        if heading and not result.startswith(f"**{heading}"):
            result = f"📋 **{heading}**\n\n{result}"

        return result

    @staticmethod
    def _get_default_suggestions() -> List[str]:
        """Default suggestions when no match is found."""
        return [
            "Có sản phẩm nào đang khuyến mãi?",
            "Cách giao hàng và phí ship?",
            "Hạng thành viên có ưu đãi gì?",
        ]
