import { useState, useRef, useEffect, useCallback } from "react";
import type { KeyboardEvent } from "react";
import { MessageCircle, X, Send, Bot, User, Sparkles, Cpu, Zap, ChevronRight, Wifi, WifiOff } from "lucide-react";
import { useShop } from "../context/ShopContext";
import type { CartItem, Product, StoreProfile, Voucher } from "../types";
import type { CustomerTier } from "../data/products";

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

interface ShopContextSnapshot {
  products: Product[];
  cart: CartItem[];
  customerTier: CustomerTier;
  vouchers: Voucher[];
  storeProfile: StoreProfile;
}

const FALLBACK_SUGGESTIONS = [
  "Giá gạo ST25 bao nhiêu?",
  "Có voucher nào không?",
  "Phí giao hàng bao nhiêu?",
];

const TIER_INFO: Record<CustomerTier, { name: string; discount: number }> = {
  standard: { name: "Khách hàng thường", discount: 0 },
  silver: { name: "Khách hàng Bạc", discount: 5 },
  gold: { name: "Khách hàng Vàng", discount: 10 },
  platinum: { name: "Khách hàng Kim Cương", discount: 15 },
};

const PRODUCT_ALIASES: Record<string, string[]> = {
  "1": ["gao", "rice", "st25"],
  "2": ["ca phe", "coffee", "robusta", "dak lak"],
  "3": ["thanh long", "dragon fruit"],
  "4": ["ho tieu", "tieu", "pepper", "phu quoc"],
  "5": ["chom chom", "rambutan"],
  "6": ["rau", "rau cu", "rau huu co", "vegetable", "organic"],
  "7": ["xoai", "mango", "hoa loc"],
  "8": ["nuoc mam", "fish sauce"],
  "9": ["lua mach", "ngu coc", "grain"],
  "10": ["mang kho", "mang", "specialty"],
  "11": ["tra xanh", "thai nguyen", "tea"],
  "12": ["buoi", "pomelo", "da xanh"],
};

function normalizeText(value: string) {
  return (value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function formatCurrency(value: number) {
  return `${Math.round(value).toLocaleString("vi-VN")}đ`;
}

function fetchWithTimeout(url: string, options: RequestInit = {}, timeoutMs = 15000) {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs);

  return fetch(url, {
    ...options,
    signal: controller.signal,
  }).finally(() => window.clearTimeout(timeoutId));
}

function getPersonalizedPrice(price: number, tier: CustomerTier) {
  return price * (1 - TIER_INFO[tier].discount / 100);
}

function getCategoryName(category: string) {
  return (category || "").split("(")[0].trim();
}

function productKeywords(product: Product) {
  const productWords = normalizeText(`${product.name} ${product.category}`)
    .split(" ")
    .filter((word) => word.length > 2 && word !== "tra");

  return [...productWords, ...(PRODUCT_ALIASES[product.id] || [])].map(normalizeText);
}

function findProductsByMessage(message: string, products: Product[]) {
  return products.filter((product) => {
    const productName = normalizeText(product.name);
    return (
      (productName && message.includes(productName)) ||
      productKeywords(product).some((keyword) => keyword.length >= 3 && message.includes(keyword))
    );
  }).slice(0, 4);
}

function formatProductSummary(product: Product, tier: CustomerTier) {
  const personalizedPrice = getPersonalizedPrice(product.price, tier);
  const certification = product.certification?.join(", ") || "Chưa cập nhật";

  return [
    `**${product.name}**`,
    `Giá: ${formatCurrency(personalizedPrice)} / ${product.unit || "sản phẩm"}${personalizedPrice < product.price ? ` (giá gốc ${formatCurrency(product.price)})` : ""}`,
    `Danh mục: ${getCategoryName(product.category)} | Còn: ${product.stock}`,
    `Xuất xứ: ${product.origin || "Chưa cập nhật"} | Chứng nhận: ${certification}`,
    product.isPerishable ? `Bảo quản: ${product.storageInstructions || "Tham khảo bao bì"}` : "",
  ].filter(Boolean).join("\n");
}

function formatProductList(products: Product[], tier: CustomerTier) {
  return products.slice(0, 5).map((product, index) => (
    `${index + 1}. ${product.name} - ${formatCurrency(getPersonalizedPrice(product.price, tier))} / ${product.unit || "sp"} (rating ${product.rating})`
  )).join("\n");
}

function messageHasAny(message: string, keywords: string[]) {
  return keywords.some((keyword) => {
    const normalized = normalizeText(keyword);
    return normalized.includes(" ") ? message.includes(normalized) : message.split(" ").includes(normalized);
  });
}

function getLocalFallbackResponse(userMessage: string, context: ShopContextSnapshot): ChatApiResult {
  const message = normalizeText(userMessage);
  const matchedProducts = findProductsByMessage(message, context.products);
  const tier = TIER_INFO[context.customerTier];
  const activeVouchers = context.vouchers.filter((voucher) => voucher.isActive);

  let text: string;
  let confidence = 0.65;

  if (messageHasAny(message, ["xin chao", "chao", "hello", "hi"])) {
    text = "Chào bạn! Tôi có thể hỗ trợ tra cứu sản phẩm, giá, tồn kho, nguồn gốc, giao hàng, thanh toán, voucher và hạng thành viên.";
  } else if (matchedProducts.length > 0) {
    const product = matchedProducts[0];

    if (messageHasAny(message, ["gia", "bao nhieu", "price", "tien"])) {
      const personalizedPrice = getPersonalizedPrice(product.price, context.customerTier);
      text = `${product.name}: ${formatCurrency(personalizedPrice)} / ${product.unit || "sản phẩm"}\n${
        tier.discount > 0
          ? `Hạng ${tier.name} giảm ${tier.discount}% (giá gốc ${formatCurrency(product.price)})`
          : "Giá chưa bao gồm VAT 10%"
      }`;
    } else if (messageHasAny(message, ["con hang", "ton kho", "het hang", "so luong", "stock"])) {
      text = `${product.name}: ${product.stock > 0 ? `Còn ${product.stock} ${product.unit || "sản phẩm"}` : "Tạm hết hàng"}`;
    } else if (messageHasAny(message, ["xuat xu", "nguon goc", "o dau", "nong trai", "chung nhan"])) {
      text = [
        product.name,
        `Xuất xứ: ${product.origin || "Chưa cập nhật"}`,
        `Chứng nhận: ${product.certification?.join(", ") || "Chưa cập nhật"}`,
        `Mã lô: ${product.batchCode || "N/A"}`,
        `Thu hoạch: ${product.harvestDate || "N/A"}`,
      ].join("\n");
    } else if (messageHasAny(message, ["bao quan", "han su dung", "giu tuoi"])) {
      text = [
        product.name,
        `Hạn sử dụng: ${product.shelfLife || "Chưa cập nhật"}`,
        `Bảo quản: ${product.storageInstructions || "Chưa cập nhật"}`,
      ].join("\n");
    } else {
      text = matchedProducts.length > 1
        ? `Tìm thấy ${matchedProducts.length} sản phẩm liên quan:\n\n${matchedProducts.map((item) => formatProductSummary(item, context.customerTier)).join("\n\n")}`
        : formatProductSummary(product, context.customerTier);
    }
  } else if (messageHasAny(message, ["san pham", "mat hang", "ban gi", "nong san"])) {
    const categories = Array.from(new Set(context.products.map((product) => getCategoryName(product.category)).filter(Boolean)));
    const featured = [...context.products].sort((a, b) => b.rating - a.rating);
    text = `Hiện có ${context.products.length} sản phẩm, nhóm: ${categories.join(", ")}\nNổi bật:\n${formatProductList(featured, context.customerTier)}`;
  } else if (messageHasAny(message, ["gia", "bao nhieu", "price", "tien"])) {
    text = `Hạng ${tier.name} được giảm ${tier.discount}%.\nNhập tên sản phẩm để xem giá, ví dụ: giá gạo ST25.\n${formatProductList(context.products, context.customerTier)}`;
  } else if (messageHasAny(message, ["giao hang", "van chuyen", "ship", "delivery", "phi ship"])) {
    text = [
      "Phương thức giao hàng:",
      "- Giao hàng tiêu chuẩn: 25.000đ - 3-5 ngày làm việc",
      "- Giao hàng nhanh: 50.000đ - 1-2 ngày làm việc",
      "- Giao trong ngày: 80.000đ - khu vực nội thành",
      "- Miễn phí vận chuyển: đơn từ 500.000đ",
    ].join("\n");
  } else if (messageHasAny(message, ["thanh toan", "payment", "cod", "momo", "chuyen khoan"])) {
    text = "Thanh toán: thẻ tín dụng/ghi nợ, MoMo, chuyển khoản ngân hàng hoặc COD. Giá chưa bao gồm VAT 10%.";
  } else if (messageHasAny(message, ["khuyen mai", "giam gia", "voucher", "coupon", "sale"])) {
    text = activeVouchers.length > 0
      ? `Voucher đang hoạt động:\n${activeVouchers.slice(0, 6).map((voucher) => `- ${voucher.code}: ${voucher.description} (đơn từ ${formatCurrency(voucher.minOrderValue)})`).join("\n")}`
      : "Hiện chưa có voucher. Ưu đãi hạng thành viên vẫn được áp dụng tự động.";
  } else if (messageHasAny(message, ["hang", "thanh vien", "bac", "vang", "kim cuong", "diem", "loyalty"])) {
    text = [
      `Hạng hiện tại: ${tier.name} (giảm ${tier.discount}%)`,
      "Mốc thăng hạng:",
      "- Bạc: từ 1.000.000đ",
      "- Vàng: từ 5.000.000đ",
      "- Kim Cương: từ 15.000.000đ",
    ].join("\n");
  } else if (messageHasAny(message, ["gio hang", "cart", "don hang", "mua hang"])) {
    if (context.cart.length === 0) {
      text = "Giỏ hàng trống. Vào trang Sản Phẩm để mua sắm nhé.";
    } else {
      const total = context.cart.reduce((sum, item) => (
        sum + getPersonalizedPrice(item.product.price, context.customerTier) * item.quantity
      ), 0);
      text = `Giỏ hàng (${context.cart.reduce((sum, item) => sum + item.quantity, 0)} SP):\n${
        context.cart.map((item) => `- ${item.product.name} x${item.quantity}: ${formatCurrency(getPersonalizedPrice(item.product.price, context.customerTier) * item.quantity)}`).join("\n")
      }\nTạm tính: ${formatCurrency(total)} (chưa VAT và ship)`;
    }
  } else if (messageHasAny(message, ["tro giup", "ho tro", "help", "lien he", "hotline"])) {
    text = [
      `Liên hệ: ${context.storeProfile.shopName || "NOSAVI"}`,
      `Hotline: ${context.storeProfile.shopPhone || "0912 345 678"}`,
      `Email: ${context.storeProfile.shopEmail || "seller@demo.com"}`,
      "Hoặc hỏi tôi về sản phẩm, giá, giao hàng, thanh toán, voucher, hạng thành viên.",
    ].join("\n");
  } else {
    confidence = 0;
    text = "Tôi chưa hiểu rõ ý bạn. Bạn có thể hỏi về sản phẩm và giá, giao hàng, thanh toán, voucher, bảo quản, nguồn gốc hoặc hạng thành viên.";
  }

  return {
    text,
    mode: "rule",
    confidence,
    suggestions: FALLBACK_SUGGESTIONS,
  };
}

export function Chatbot() {
  const { products, cart, customerTier, vouchers, storeProfile } = useShop();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [serverInfo, setServerInfo] = useState<{
    available: boolean | null;
    engineLabel: string | null;
    ollamaModel: string | null;
    hasLlm: boolean;
    hasSmart: boolean;
  }>({
    available: null,
    engineLabel: null,
    ollamaModel: null,
    hasLlm: false,
    hasSmart: false,
  });
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      text: "Xin chào! 🌾 Tôi là trợ lý ảo của NOSAVI. Bạn có thể hỏi về sản phẩm, giá, tồn kho, nguồn gốc, bảo quản, giao hàng, thanh toán hoặc khuyến mãi.",
      sender: "bot",
      timestamp: new Date(),
      mode: "smart",
    },
  ]);
  const [inputText, setInputText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchWithTimeout("/api/health", {}, 3000)
      .then((r) => r.json())
      .then((data) => {
        if (data.status === "ok") {
          setServerInfo({
            available: true,
            engineLabel: data.engine_label ?? null,
            ollamaModel: data.ollama_model ?? null,
            hasLlm: !!data.llama_configured,
            hasSmart: !!data.smart_configured,
          });
        } else {
          setServerInfo({ available: false, engineLabel: null, ollamaModel: null, hasLlm: false, hasSmart: false });
        }
      })
      .catch(() => setServerInfo({ available: false, engineLabel: null, ollamaModel: null, hasLlm: false, hasSmart: false }));
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

      const res = await fetchWithTimeout(CHAT_API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessage,
          history: chatHistory,
          shopContext: buildShopContext(),
        }),
      }, 15000);

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      setServerInfo((prev) => ({ ...prev, available: true }));

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
      setServerInfo((prev) => ({ ...prev, available: false }));
      return getLocalFallbackResponse(userMessage, buildShopContext());
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

  // Derive header badge info from serverInfo
  const headerBadge = (() => {
    if (serverInfo.available === null) {
      return { label: "Đang kết nối...", icon: Cpu, color: "text-white/60", dot: "bg-white/40" };
    }
    if (!serverInfo.available) {
      return { label: "Offline · Rule-based", icon: WifiOff, color: "text-white/80", dot: "bg-red-400" };
    }
    if (serverInfo.hasLlm && serverInfo.ollamaModel) {
      return {
        label: `Online · AI (${serverInfo.ollamaModel})`,
        icon: Sparkles,
        color: "text-amber-300",
        dot: "bg-amber-400",
      };
    }
    if (serverInfo.hasSmart) {
      return { label: "Online · Smart Engine", icon: Zap, color: "text-sky-300", dot: "bg-sky-400" };
    }
    return { label: "Online · Rule-based", icon: Wifi, color: "text-emerald-300", dot: "bg-emerald-400" };
  })();

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
                <h3 className="font-semibold">Trợ Lý NOSAVI</h3>
                <p className={`text-xs flex items-center gap-1.5 mt-0.5 ${headerBadge.color}`}>
                  <span className={`inline-block w-1.5 h-1.5 rounded-full ${headerBadge.dot} animate-pulse`} />
                  <headerBadge.icon className="w-3 h-3" />
                  <span>{headerBadge.label}</span>
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
                        <span className="inline-flex items-center gap-0.5 text-xs text-amber-500 font-medium" title="Trả lời bằng AI · Offline LLM (Ollama)">
                          <Sparkles className="w-3 h-3" />
                          <span className="hidden sm:inline">AI offline</span>
                        </span>
                      )}
                      {message.sender === "bot" && message.mode === "smart" && (
                        <span className="inline-flex items-center gap-0.5 text-xs text-sky-500 font-medium" title="Trả lời bằng Smart Engine (TF-IDF · không cần mạng)">
                          <Zap className="w-3 h-3" />
                          <span className="hidden sm:inline">Smart</span>
                        </span>
                      )}
                      {message.sender === "bot" && message.mode === "rule" && (
                        <span className="inline-flex items-center gap-0.5 text-xs text-gray-400 font-medium" title="Trả lời bằng Rule-based (cục bộ)">
                          <Cpu className="w-3 h-3" />
                          <span className="hidden sm:inline">Rule</span>
                        </span>
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
