import { useState, useRef, useEffect, useCallback } from "react";
import type { KeyboardEvent } from "react";
import { MessageCircle, X, Send, Bot, User, Sparkles, Cpu, Zap, ChevronRight } from "lucide-react";
import { useShop } from "../context/ShopContext";

interface Message {
  id: string;
  text: string;
  sender: "user" | "bot";
  timestamp: Date;
  mode?: "ai" | "smart" | "rule" | "error";
  confidence?: number;
  suggestions?: string[];
}

interface ChatApiResult {
  text: string;
  mode: "ai" | "smart" | "rule" | "error";
  confidence?: number;
  suggestions?: string[];
}

const CHAT_API = "/api/chat";

export function Chatbot() {
  const { products, cart, customerTier, vouchers, storeProfile } = useShop();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [serverAvailable, setServerAvailable] = useState<boolean | null>(null);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      text: "Xin chào! 🌾 Tôi là trợ lý ảo của Nông Sản Việt. Bạn có thể hỏi về sản phẩm, giá, tồn kho, nguồn gốc, bảo quản, giao hàng, thanh toán hoặc khuyến mãi.",
      sender: "bot",
      timestamp: new Date(),
      mode: "smart",
    },
  ]);
  const [inputText, setInputText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/health", { signal: AbortSignal.timeout(3000) })
      .then((r) => r.json())
      .then((data) => setServerAvailable(data.status === "ok"))
      .catch(() => setServerAvailable(false));
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const buildShopContext = useCallback(() => ({
    products,
    cart,
    customerTier,
    vouchers,
    storeProfile,
  }), [products, cart, customerTier, vouchers, storeProfile]);

  const fetchChatResponse = useCallback(async (
    userMessage: string,
    history: Message[],
  ): Promise<ChatApiResult> => {
    try {
      const chatHistory = history
        .filter((m) => m.id !== "welcome")
        .slice(-10)
        .map((m) => ({ role: m.sender === "user" ? "user" : "assistant", content: m.text }));

      const res = await fetch(CHAT_API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessage,
          history: chatHistory,
          shopContext: buildShopContext(),
        }),
        signal: AbortSignal.timeout(15000),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      setServerAvailable(true);

      const mode = data.mode === "error"
        ? "error"
        : data.mode === "smart"
          ? "smart"
          : data.mode === "rule"
            ? "rule"
            : "ai";

      return {
        text: data.reply || "Máy chủ chatbot chưa trả về nội dung phản hồi.",
        mode,
        confidence: data.confidence,
        suggestions: data.suggestions,
      };
    } catch {
      setServerAvailable(false);
      return {
        text: "Không thể kết nối tới chatbot-server. Vui lòng khởi động backend chatbot rồi thử lại.",
        mode: "error",
      };
    }
  }, [buildShopContext]);

  const handleSendMessage = useCallback(async () => {
    const trimmed = inputText.trim();
    if (!trimmed || isLoading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      text: trimmed,
      sender: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText("");
    setIsLoading(true);

    const allMessages = [...messages, userMsg];
    const result = await fetchChatResponse(trimmed, allMessages);

    setMessages((prev) => [...prev, {
      id: (Date.now() + 1).toString(),
      text: result.text,
      sender: "bot",
      timestamp: new Date(),
      mode: result.mode,
      confidence: result.confidence,
      suggestions: result.suggestions,
    }]);
    setIsLoading(false);
  }, [inputText, isLoading, messages, fetchChatResponse]);

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const modeLabel = serverAvailable === true ? "AI / Smart / Rule" : serverAvailable === false ? "Server offline" : "Đang kiểm tra...";
  const ModeIcon = serverAvailable ? Sparkles : Cpu;

  const renderConfidenceBadge = (confidence?: number) => {
    if (confidence === undefined || confidence <= 0) return null;
    const color = confidence >= 0.7 ? "text-emerald-500" : confidence >= 0.4 ? "text-amber-500" : "text-red-400";
    const label = confidence >= 0.7 ? "Độ tin cậy cao" : confidence >= 0.4 ? "Độ tin cậy trung bình" : "Độ tin cậy thấp";
    return <span className={`text-xs ${color} ml-1`} title={label}>●</span>;
  };

  const renderFormattedText = (text: string) => {
    const parts = text.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return <strong key={i}>{part.slice(2, -2)}</strong>;
      }
      return <span key={i}>{part}</span>;
    });
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInputText(suggestion);
  };

  return (
    <>
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          id="chatbot-toggle"
          className="fixed bottom-6 right-6 bg-primary text-white p-4 rounded-full shadow-lg hover:bg-primary/90 transition-all z-50 flex items-center gap-2 hover:scale-105"
        >
          <MessageCircle className="w-6 h-6" />
          <span className="hidden sm:inline">Trợ lý</span>
        </button>
      )}

      {isOpen && (
        <div className="fixed bottom-4 right-4 left-4 sm:left-auto sm:bottom-6 sm:right-6 sm:w-96 h-[min(600px,calc(100vh-2rem))] bg-white rounded-lg shadow-2xl flex flex-col z-50 border border-border">
          <div className="bg-primary text-white p-4 rounded-t-lg flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bot className="w-6 h-6" />
              <div>
                <h3 className="font-semibold">Trợ Lý Nông Sản Việt</h3>
                <p className="text-xs opacity-90 flex items-center gap-1">
                  <ModeIcon className="w-3 h-3" />
                  {modeLabel}
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="hover:bg-white/20 p-1 rounded transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-background">
            {messages.map((message) => (
              <div key={message.id} className="flex flex-col">
                <div
                  className={`flex gap-2 ${message.sender === "user" ? "justify-end" : "justify-start"}`}
                >
                  {message.sender === "bot" && (
                    <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                      <Bot className="w-5 h-5 text-white" />
                    </div>
                  )}
                  <div
                    className={`max-w-[78%] p-3 rounded-lg ${
                      message.sender === "user"
                        ? "bg-primary text-white"
                        : "bg-white border border-border"
                    }`}
                  >
                    <p className="text-sm whitespace-pre-line">{renderFormattedText(message.text)}</p>
                    <div className={`flex items-center gap-1 mt-1 ${message.sender === "user" ? "text-white/70" : "text-muted-foreground"}`}>
                      <p className="text-xs">
                        {message.timestamp.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}
                      </p>
                      {message.sender === "bot" && message.mode === "ai" && (
                        <Sparkles className="w-3 h-3 text-amber-500" title="AI (RAG + LLM)" />
                      )}
                      {message.sender === "bot" && message.mode === "smart" && (
                        <Zap className="w-3 h-3 text-blue-500" title="Smart (TF-IDF)" />
                      )}
                      {message.sender === "bot" && message.mode === "rule" && (
                        <Cpu className="w-3 h-3 text-gray-400" title="Rule-based from chatbot-server" />
                      )}
                      {message.sender === "bot" && renderConfidenceBadge(message.confidence)}
                    </div>
                  </div>
                  {message.sender === "user" && (
                    <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
                      <User className="w-5 h-5 text-foreground" />
                    </div>
                  )}
                </div>
                {message.sender === "bot" && message.suggestions && message.suggestions.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2 ml-10">
                    {message.suggestions.map((s, i) => (
                      <button
                        key={i}
                        onClick={() => handleSuggestionClick(s)}
                        className="text-xs px-3 py-1.5 rounded-full border border-primary/30 text-primary bg-primary/5 hover:bg-primary/15 transition-colors flex items-center gap-1"
                      >
                        <ChevronRight className="w-3 h-3" />
                        {s}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {isLoading && (
              <div className="flex gap-2 justify-start">
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                  <Bot className="w-5 h-5 text-white" />
                </div>
                <div className="bg-white border border-border p-3 rounded-lg flex items-center gap-1">
                  <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          <div className="p-4 border-t border-border bg-white rounded-b-lg">
            <div className="flex gap-2">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Nhập tin nhắn..."
                disabled={isLoading}
                className="flex-1 px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background disabled:opacity-50"
              />
              <button
                onClick={handleSendMessage}
                disabled={isLoading || !inputText.trim()}
                className="bg-primary text-white p-2 rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Gợi ý: "giá gạo ST25", "voucher", "giao hàng", "bảo quản xoài"
            </p>
          </div>
        </div>
      )}
    </>
  );
}
