"""
FastAPI server for the Nong San Viet chatbot.

Endpoints:
  GET  /api/health  - Connectivity check
  POST /api/chat    - Chat with the RAG-powered chatbot
"""

import sys
import io

# Fix Windows console encoding for emoji/unicode
if sys.stdout.encoding != "utf-8":
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")
if sys.stderr.encoding != "utf-8":
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding="utf-8", errors="replace")

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional

from rag import RAGEngine

app = FastAPI(
    title="Nong San Viet Chatbot API",
    description="RAG-powered chatbot using ChromaDB + Ollama Llama 3",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

rag_engine: Optional[RAGEngine] = None


@app.on_event("startup")
async def startup():
    global rag_engine
    print("[START] Starting Nong San Viet Chatbot Server...")
    rag_engine = RAGEngine()
    print("[READY] Server ready!")


class ChatMessage(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    message: str
    history: List[ChatMessage] = []


class ChatResponse(BaseModel):
    reply: str
    sources: List[str] = []
    mode: str = "ai"


@app.get("/api/health")
async def health():
    has_llama = rag_engine.refresh_provider_status() if rag_engine else False
    chunk_count = rag_engine.collection.count() if rag_engine else 0
    return {
        "status": "ok",
        "openai_configured": has_llama,
        "llama_configured": has_llama,
        "knowledge_chunks": chunk_count,
    }


@app.post("/api/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    if not rag_engine:
        return ChatResponse(
            reply="Server dang khoi dong, vui long thu lai sau.",
            sources=[],
            mode="error",
        )

    history = [{"role": msg.role, "content": msg.content} for msg in request.history]
    result = rag_engine.generate(query=request.message, chat_history=history)

    return ChatResponse(
        reply=result["reply"],
        sources=result.get("sources", []),
        mode=result.get("mode", "ai"),
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
