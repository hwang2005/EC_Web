import { useState, useRef, useEffect, useCallback } from "react";
import { MessageCircle, X, Send, Bot, User, Sparkles, Cpu } from "lucide-react";
import { useShop } from "../context/ShopContext";
import {
  CUSTOMER_TIERS,
  DELIVERY_OPTIONS,
  PAYMENT_METHODS,
} from "../data/products";
import type { Product } from "../types";

interface Message {
  id: string;
  text: string;
  sender: "user" | "bot";
  timestamp: Date;
  mode?: "ai" | "rule" | "error";
}

/* ───────────── Rule-Based Fallback Logic (Enhanced) ───────────── */

type ChatIntent =
  | "greeting" | "product" | "price" | "stock" | "origin"
  | "storage" | "season" | "delivery" | "payment" | "promotion"
  | "tier" | "cart" | "thanks" | "help" | "compare" | "recommend"
  | "subscription" | "order_status" | "return_policy";

const RULES: Record<ChatIntent, string[]> = {
  greeting: ["xin chao", "chao", "hello", "hi", "hey", "chao ban"],
  product: ["san pham", "mat hang", "ban gi", "co gi", "danh muc", "nong san"],
  price: ["gia", "bao nhieu", "price", "cost", "tien", "dat", "re", "gia ca"],
  stock: ["con hang", "ton kho", "het hang", "so luong", "stock", "con khong"],
  origin: ["xuat xu", "nguon goc", "o dau", "vung trong", "chung nhan", "vietgap", "globalgap", "organic", "huu co", "tu dau", "nong trai"],
  storage: ["bao quan", "han su dung", "de duoc bao lau", "shelf", "storage", "giu tuoi", "cach giu"],
  season: ["mua vu", "vao mua", "mua nao", "thu hoach", "season", "chinh vu"],
  delivery: ["giao hang", "van chuyen", "ship", "delivery", "bao lau", "phi ship", "khung gio", "gio giao"],
  payment: ["thanh toan", "payment", "tra tien", "cod", "momo", "chuyen khoan", "the", "vi dien tu"],
  promotion: ["khuyen mai", "giam gia", "voucher", "ma giam", "uu dai", "coupon", "discount", "sale"],
  tier: ["hang", "thanh vien", "bac", "vang", "kim cuong", "diem", "loyalty", "tich diem", "cap bac"],
  cart: ["gio hang", "cart", "don hang", "mua hang", "dat hang"],
  thanks: ["cam on", "thank", "thanks", "cam on ban"],
  help: ["tro giup", "ho tro", "help", "tu van", "lien he", "hotline"],
  compare: ["so sanh", "khac nhau", "nao ngon hon", "chon gi", "compare"],
  recommend: ["goi y", "de xuat", "nen mua gi", "recommend", "pho bien", "ban chay", "ngon nhat"],
  subscription: ["dinh ky", "dang ky", "combo tuan", "goi tuan", "subscription"],
  order_status: ["trang thai don", "theo doi don", "don hang dau", "huy don", "tra hang"],
  return_policy: ["doi tra", "hoan tien", "khieu nai", "chat luong", "hu hong", "dap nat"],
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

const AMBIGUOUS_PRODUCT_WORDS = new Set(["tra"]);

const stripVietnamese = (value: string) =>
  value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D");

const normalizeText = (value: string) =>
  stripVietnamese(value).toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, " ").replace(/\s+/g, " ").trim();

const formatCurrency = (value: number) =>
  `${Math.round(value).toLocaleString("vi-VN")}₫`;

const getCategoryName = (category: string) => category.split("(")[0].trim();

const messageHasKeyword = (message: string, keyword: string) => {
  const nk = normalizeText(keyword);
  if (!nk) return false;
  return nk.includes(" ") ? message.includes(nk) : message.split(" ").includes(nk);
};

const includesAny = (message: string, keywords: string[]) =>
  keywords.some((k) => messageHasKeyword(message, k));

const detectIntent = (message: string): ChatIntent | undefined =>
  (Object.keys(RULES) as ChatIntent[]).find((intent) =>
    includesAny(message, RULES[intent]),
  );

const getProductKeywords = (product: Product) => {
  const words = normalizeText(`${product.name} ${product.category}`)
    .split(" ").filter((w) => w.length > 2 && !AMBIGUOUS_PRODUCT_WORDS.has(w));
  return [...words, ...(PRODUCT_ALIASES[product.id] || []).map(normalizeText)];
};

const findProductsByMessage = (message: string, products: Product[]) =>
  products.filter((p) => {
    const nn = normalizeText(p.name);
    if (message.includes(nn)) return true;
    return getProductKeywords(p).some((k) => k.length >= 3 && message.includes(k));
  }).slice(0, 4);

const formatProductSummary = (product: Product, personalizedPrice: number) => {
  const certs = product.certification?.join(", ") || "Chưa cập nhật";
  return [
    `🌿 **${product.name}**`,
    `💰 Giá: ${formatCurrency(personalizedPrice)} / ${product.unit || "sản phẩm"}${personalizedPrice < product.price ? ` (giá gốc ${formatCurrency(product.price)})` : ""}`,
    `📦 Danh mục: ${getCategoryName(product.category)} | Còn: ${product.stock}`,
    `📍 Xuất xứ: ${product.origin || "Chưa cập nhật"} | Chứng nhận: ${certs}`,
    product.isPerishable ? `❄️ Bảo quản: ${product.storageInstructions || "Tham khảo bao bì"}` : "",
  ].filter(Boolean).join("\n");
};

const formatProductList = (products: Product[], getPrice: (p: number) => number) =>
  products.slice(0, 5).map((p, i) => {
    const price = getPrice(p.price);
    return `${i + 1}. ${p.name} — ${formatCurrency(price)} / ${p.unit || "sp"} (⭐${p.rating})`;
  }).join("\n");

/* ───────────── Component ───────────── */

const CHAT_API = "/api/chat";

export function Chatbot() {
  const { products, cart, customerTier, getPersonalizedPrice, vouchers, storeProfile } = useShop();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [aiAvailable, setAiAvailable] = useState<boolean | null>(null);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      text: "Xin chào! 🌾 Tôi là trợ lý ảo của Nông Sản Việt. Bạn có thể hỏi về sản phẩm, giá, tồn kho, nguồn gốc, bảo quản, giao hàng, thanh toán hoặc khuyến mãi.",
      sender: "bot",
      timestamp: new Date(),
      mode: "rule",
    },
  ]);
  const [inputText, setInputText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Check AI backend availability on mount
  useEffect(() => {
    fetch("/api/health", { signal: AbortSignal.timeout(3000) })
      .then((r) => r.json())
      .then((data) => setAiAvailable(data.status === "ok" && data.openai_configured))
      .catch(() => setAiAvailable(false));
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  /* ── Enhanced Rule-Based Response ── */
  const getBotResponse = useCallback((userMessage: string): string => {
    const message = normalizeText(userMessage);
    const intent = detectIntent(message);
    const matchedProducts = findProductsByMessage(message, products);
    const activeVouchers = vouchers.filter((v) => v.isActive);
    const tierInfo = CUSTOMER_TIERS[customerTier];

    if (intent === "greeting") {
      return "Chào bạn! 👋 Tôi có thể giúp bạn tra cứu:\n• Sản phẩm nông sản & giá cả\n• Nguồn gốc & chứng nhận\n• Giao hàng & thanh toán\n• Voucher & khuyến mãi\n• Hạng thành viên\nHãy nhập câu hỏi nhé!";
    }

    if (intent === "thanks") {
      return "Rất vui được hỗ trợ bạn! 😊 Nếu cần thêm thông tin, cứ nhắn tôi nhé. Chúc bạn mua sắm vui vẻ! 🛒";
    }

    // Product-specific intents
    if (matchedProducts.length > 0) {
      const p = matchedProducts[0];
      if (intent === "price") {
        const pp = getPersonalizedPrice(p.price);
        return `💰 ${p.name}: ${formatCurrency(pp)} / ${p.unit || "sản phẩm"}\n${tierInfo.discount > 0 ? `🏷️ Hạng ${tierInfo.name} giảm ${tierInfo.discount}% (giá gốc ${formatCurrency(p.price)})` : "📌 Giá chưa bao gồm VAT 10%"}`;
      }
      if (intent === "stock") {
        return `📦 ${p.name}: ${p.stock > 0 ? `Còn ${p.stock} ${p.unit || "sản phẩm"}` : "⚠️ Tạm hết hàng"}${p.isPerishable ? "\n🍃 Sản phẩm tươi, nên đặt sớm!" : ""}`;
      }
      if (intent === "origin") {
        return [`📍 ${p.name}`, `Xuất xứ: ${p.origin || "Chưa cập nhật"}`, `Chứng nhận: ${p.certification?.join(", ") || "Chưa cập nhật"}`, `Mã lô: ${p.batchCode || "N/A"}`, `Thu hoạch: ${p.harvestDate || "N/A"}`].join("\n");
      }
      if (intent === "storage") {
        return [`❄️ ${p.name}`, `Hạn sử dụng: ${p.shelfLife || "Chưa cập nhật"}`, `Bảo quản: ${p.storageInstructions || "Chưa cập nhật"}`].join("\n");
      }
      if (intent === "season") {
        return `🌱 ${p.name}: ${p.season || "Chưa cập nhật mùa vụ"}`;
      }
      // Default: show full summary
      if (matchedProducts.length > 1) {
        return `Tìm thấy ${matchedProducts.length} sản phẩm liên quan:\n\n` + matchedProducts.map((mp) => formatProductSummary(mp, getPersonalizedPrice(mp.price))).join("\n\n");
      }
      return formatProductSummary(p, getPersonalizedPrice(p.price));
    }

    // General intents (no specific product)
    if (intent === "product") {
      const cats = Array.from(new Set(products.map((p) => getCategoryName(p.category))));
      return [`🌾 Hiện có ${products.length} sản phẩm, nhóm: ${cats.join(", ")}`, "⭐ Nổi bật:", formatProductList([...products].sort((a, b) => b.rating - a.rating), getPersonalizedPrice)].join("\n");
    }
    if (intent === "price") {
      return [`💰 Hạng ${tierInfo.name} được giảm ${tierInfo.discount}%`, "Nhập tên sản phẩm để xem giá, VD: \"giá gạo ST25\"", "Một vài sản phẩm:", formatProductList(products, getPersonalizedPrice)].join("\n");
    }
    if (intent === "recommend") {
      const top = [...products].sort((a, b) => b.rating - a.rating).slice(0, 5);
      return ["🌟 Sản phẩm được yêu thích nhất:", formatProductList(top, getPersonalizedPrice)].join("\n");
    }
    if (intent === "compare" && matchedProducts.length >= 2) {
      return matchedProducts.slice(0, 3).map((p) => formatProductSummary(p, getPersonalizedPrice(p.price))).join("\n\n━━━━━━━━━━━━━\n\n");
    }
    if (intent === "delivery") {
      return ["🚚 Phương thức giao hàng:", ...DELIVERY_OPTIONS.map((o) => `• ${o.name}: ${formatCurrency(o.price)} — ${o.estimatedDays}`), "\n⏰ Khung giờ: Sáng (8-12h), Trưa (12-15h), Chiều (15-18h), Tối (18-21h)"].join("\n");
    }
    if (intent === "payment") {
      return `💳 Thanh toán: ${PAYMENT_METHODS.map((m) => m.name).join(", ")}.\n📌 Giá chưa bao gồm VAT 10%.`;
    }
    if (intent === "promotion") {
      if (activeVouchers.length === 0) return "Hiện chưa có voucher. Ưu đãi hạng thành viên vẫn áp dụng tự động.";
      return ["🎫 Voucher đang hoạt động:", ...activeVouchers.slice(0, 6).map((v) => `• ${v.code}: ${v.description} (đơn từ ${formatCurrency(v.minOrderValue)})`)].join("\n");
    }
    if (intent === "tier") {
      return [`👑 Hạng hiện tại: ${tierInfo.name} (giảm ${tierInfo.discount}%)`, "Mốc thăng hạng:", "• Bạc: từ 1.000.000₫", "• Vàng: từ 5.000.000₫", "• Kim Cương: từ 15.000.000₫"].join("\n");
    }
    if (intent === "cart") {
      if (cart.length === 0) return "🛒 Giỏ hàng trống. Vào trang Sản Phẩm để mua sắm nhé!";
      const total = cart.reduce((s, i) => s + getPersonalizedPrice(i.product.price) * i.quantity, 0);
      return [`🛒 Giỏ hàng (${cart.reduce((s, i) => s + i.quantity, 0)} SP):`, ...cart.map((i) => `• ${i.product.name} x${i.quantity}: ${formatCurrency(getPersonalizedPrice(i.product.price) * i.quantity)}`), `Tạm tính: ${formatCurrency(total)} (chưa VAT & ship)`].join("\n");
    }
    if (intent === "subscription") {
      return "📦 Gói Định Kỳ cho phép bạn nhận nông sản tươi tự động:\n• Tần suất: Hàng tuần / 2 tuần / hàng tháng\n• Chọn ngày giao & khung giờ\n• Có thể tạm dừng / hủy bất kỳ lúc nào\nVào mục 'Gói Định Kỳ' để đăng ký!";
    }
    if (intent === "order_status") {
      return "📋 Đơn hàng có các trạng thái:\n• Chờ xử lý → Đang xử lý → Đang giao → Đã giao\n• Hủy đơn: trong 5 phút đầu nếu chưa xử lý\nVào mục 'Đơn Hàng' để theo dõi!";
    }
    if (intent === "return_policy") {
      return "🔄 Chính sách đổi trả:\n• Hàng tươi bị dập nát/hư hỏng: hoàn tiền hoặc đổi trả ngay\n• Báo cáo qua mục 'Hỗ Trợ Chất Lượng' trong tài khoản\n• Liên hệ: " + storeProfile.shopPhone;
    }
    if (intent === "help") {
      return [`📞 Liên hệ: ${storeProfile.shopName}`, `☎️ Hotline: ${storeProfile.shopPhone}`, `📧 Email: ${storeProfile.shopEmail}`, "Hoặc hỏi tôi về: sản phẩm, giá, giao hàng, thanh toán, voucher, hạng thành viên!"].join("\n");
    }

    return "🤔 Tôi chưa hiểu rõ ý bạn. Bạn có thể hỏi về:\n• Sản phẩm & giá (VD: \"giá gạo ST25\")\n• Giao hàng & thanh toán\n• Voucher & khuyến mãi\n• Bảo quản & nguồn gốc\n• Hạng thành viên";
  }, [products, cart, customerTier, getPersonalizedPrice, vouchers, storeProfile]);

  /* ── AI Response via Backend ── */
  const fetchAIResponse = useCallback(async (userMessage: string, history: Message[]): Promise<{ text: string; mode: "ai" | "rule" | "error" }> => {
    try {
      const chatHistory = history
        .filter((m) => m.id !== "welcome")
        .slice(-10)
        .map((m) => ({ role: m.sender === "user" ? "user" : "assistant", content: m.text }));

      const res = await fetch(CHAT_API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMessage, history: chatHistory }),
        signal: AbortSignal.timeout(15000),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      return { text: data.reply, mode: data.mode === "error" ? "error" : "ai" };
    } catch {
      // Fallback to rule-based
      return { text: getBotResponse(userMessage), mode: "rule" };
    }
  }, [getBotResponse]);

  /* ── Send Message ── */
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

    if (aiAvailable) {
      const result = await fetchAIResponse(trimmed, allMessages);
      setMessages((prev) => [...prev, {
        id: (Date.now() + 1).toString(),
        text: result.text,
        sender: "bot",
        timestamp: new Date(),
        mode: result.mode,
      }]);
    } else {
      // Rule-based with slight delay for natural feel
      await new Promise((r) => setTimeout(r, 400));
      setMessages((prev) => [...prev, {
        id: (Date.now() + 1).toString(),
        text: getBotResponse(trimmed),
        sender: "bot",
        timestamp: new Date(),
        mode: "rule",
      }]);
    }

    setIsLoading(false);
  }, [inputText, isLoading, messages, aiAvailable, fetchAIResponse, getBotResponse]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const modeLabel = aiAvailable === true ? "AI (RAG)" : aiAvailable === false ? "Rule-based" : "Đang kiểm tra...";
  const ModeIcon = aiAvailable ? Sparkles : Cpu;

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
          {/* Header */}
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

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-background">
            {messages.map((message) => (
              <div
                key={message.id}
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
                  <p className="text-sm whitespace-pre-line">{message.text}</p>
                  <div className={`flex items-center gap-1 mt-1 ${message.sender === "user" ? "text-white/70" : "text-muted-foreground"}`}>
                    <p className="text-xs">
                      {message.timestamp.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}
                    </p>
                    {message.sender === "bot" && message.mode === "ai" && (
                      <Sparkles className="w-3 h-3 text-amber-500" />
                    )}
                  </div>
                </div>
                {message.sender === "user" && (
                  <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
                    <User className="w-5 h-5 text-foreground" />
                  </div>
                )}
              </div>
            ))}

            {/* Typing indicator */}
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

          {/* Input */}
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
