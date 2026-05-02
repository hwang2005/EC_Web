import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Bot, User } from "lucide-react";
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
}

type ChatIntent =
  | "greeting"
  | "product"
  | "price"
  | "stock"
  | "origin"
  | "storage"
  | "season"
  | "delivery"
  | "payment"
  | "promotion"
  | "tier"
  | "cart"
  | "thanks"
  | "help";

const RULES: Record<ChatIntent, string[]> = {
  greeting: ["xin chao", "chao", "hello", "hi", "hey"],
  product: ["san pham", "mat hang", "ban gi", "co gi", "danh muc", "nong san"],
  price: ["gia", "bao nhieu", "price", "cost", "tien", "dat", "re"],
  stock: ["con hang", "ton kho", "het hang", "so luong", "stock"],
  origin: ["xuat xu", "nguon goc", "o dau", "vung trong", "chung nhan", "vietgap", "globalgap", "organic", "huu co"],
  storage: ["bao quan", "han su dung", "de duoc bao lau", "shelf", "storage"],
  season: ["mua vu", "vao mua", "mua nao", "thu hoach", "season"],
  delivery: ["giao hang", "van chuyen", "ship", "delivery", "bao lau", "phi ship"],
  payment: ["thanh toan", "payment", "tra tien", "cod", "momo", "chuyen khoan", "the"],
  promotion: ["khuyen mai", "giam gia", "voucher", "ma giam", "uu dai", "coupon", "discount"],
  tier: ["hang", "thanh vien", "bac", "vang", "kim cuong", "diem", "loyalty"],
  cart: ["gio hang", "cart", "don hang", "mua hang", "dat hang"],
  thanks: ["cam on", "thank", "thanks"],
  help: ["tro giup", "ho tro", "help", "tu van"],
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

const FALLBACK_RESPONSE =
  "Tôi chưa nhận ra chính xác ý bạn. Bạn có thể hỏi theo các nhóm: sản phẩm, giá, tồn kho, nguồn gốc/chứng nhận, bảo quản, mùa vụ, giao hàng, thanh toán, voucher hoặc hạng thành viên.";

const AMBIGUOUS_PRODUCT_WORDS = new Set(["tra"]);

const stripVietnamese = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D");

const normalizeText = (value: string) =>
  stripVietnamese(value)
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();

const formatCurrency = (value: number) =>
  `${Math.round(value).toLocaleString("vi-VN")}₫`;

const getCategoryName = (category: string) => category.split("(")[0].trim();

const messageHasKeyword = (message: string, keyword: string) => {
  const normalizedKeyword = normalizeText(keyword);
  if (!normalizedKeyword) return false;

  if (normalizedKeyword.includes(" ")) {
    return message.includes(normalizedKeyword);
  }

  return message.split(" ").includes(normalizedKeyword);
};

const includesAny = (message: string, keywords: string[]) =>
  keywords.some((keyword) => messageHasKeyword(message, keyword));

const detectIntent = (message: string): ChatIntent | undefined =>
  (Object.keys(RULES) as ChatIntent[]).find((intent) =>
    includesAny(message, RULES[intent]),
  );

const getProductKeywords = (product: Product) => {
  const words = normalizeText(`${product.name} ${product.category}`)
    .split(" ")
    .filter((word) => word.length > 2 && !AMBIGUOUS_PRODUCT_WORDS.has(word));

  return [...words, ...(PRODUCT_ALIASES[product.id] || []).map(normalizeText)];
};

const findProductsByMessage = (message: string, products: Product[]) =>
  products
    .filter((product) => {
      const normalizedName = normalizeText(product.name);
      if (message.includes(normalizedName)) return true;

      return getProductKeywords(product).some((keyword) => {
        if (keyword.length < 3) return false;
        return message.includes(keyword);
      });
    })
    .slice(0, 4);

const formatProductSummary = (product: Product, personalizedPrice: number) => {
  const certs = product.certification?.join(", ") || "Chưa cập nhật";

  return [
    product.name,
    `Giá: ${formatCurrency(personalizedPrice)} / ${product.unit || "sản phẩm"}${personalizedPrice < product.price ? ` (giá gốc ${formatCurrency(product.price)})` : ""}`,
    `Danh mục: ${getCategoryName(product.category)} | Còn: ${product.stock}`,
    `Xuất xứ: ${product.origin || "Chưa cập nhật"} | Chứng nhận: ${certs}`,
  ].join("\n");
};

const formatProductList = (
  products: Product[],
  getPersonalizedPrice: (price: number) => number,
) =>
  products
    .slice(0, 5)
    .map((product, index) => {
      const price = getPersonalizedPrice(product.price);
      return `${index + 1}. ${product.name} - ${formatCurrency(price)} / ${product.unit || "sp"} - còn ${product.stock}`;
    })
    .join("\n");

export function Chatbot() {
  const {
    products,
    cart,
    customerTier,
    getPersonalizedPrice,
    vouchers,
    storeProfile,
  } = useShop();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      text: "Xin chào! Tôi là trợ lý ảo của Nông Sản Việt. Bạn có thể hỏi về sản phẩm, giá, tồn kho, nguồn gốc, bảo quản, giao hàng, thanh toán hoặc khuyến mãi.",
      sender: "bot",
      timestamp: new Date(),
    },
  ]);
  const [inputText, setInputText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const getBotResponse = (userMessage: string): string => {
    const message = normalizeText(userMessage);
    const intent = detectIntent(message);
    const matchedProducts = findProductsByMessage(message, products);
    const activeVouchers = vouchers.filter((voucher) => voucher.isActive);
    const tierInfo = CUSTOMER_TIERS[customerTier];

    if (intent === "greeting") {
      return "Chào bạn! Tôi có thể tra cứu nhanh thông tin có sẵn trong hệ thống: danh sách nông sản, giá theo hạng thành viên, tồn kho, nguồn gốc, chứng nhận, giao hàng, thanh toán và voucher.";
    }

    if (intent === "thanks") {
      return "Rất sẵn lòng hỗ trợ. Khi cần tra cứu, bạn chỉ cần nhập tên sản phẩm hoặc chủ đề như “giá gạo ST25”, “voucher”, “giao hàng” hoặc “bảo quản xoài”.";
    }

    if (matchedProducts.length > 0) {
      const product = matchedProducts[0];

      if (intent === "price") {
        return `${product.name} hiện có giá ${formatCurrency(getPersonalizedPrice(product.price))} / ${product.unit || "sản phẩm"}. Giá gốc là ${formatCurrency(product.price)}${tierInfo.discount > 0 ? `, hạng ${tierInfo.name} của bạn đang được giảm ${tierInfo.discount}%.` : ". Giá hiển thị chưa bao gồm VAT 10% khi thanh toán."}`;
      }

      if (intent === "stock") {
        return `${product.name} hiện ${product.stock > 0 ? `còn ${product.stock} ${product.unit || "sản phẩm"}` : "đang hết hàng"}.`;
      }

      if (intent === "origin") {
        return [
          product.name,
          `Xuất xứ: ${product.origin || "Chưa cập nhật"}`,
          `Chứng nhận: ${product.certification?.join(", ") || "Chưa cập nhật"}`,
          `Mã lô: ${product.batchCode || "Chưa cập nhật"}`,
          `Ngày thu hoạch: ${product.harvestDate || "Chưa cập nhật"}`,
        ].join("\n");
      }

      if (intent === "storage") {
        return [
          product.name,
          `Hạn sử dụng: ${product.shelfLife || "Chưa cập nhật"}`,
          `Bảo quản: ${product.storageInstructions || "Chưa cập nhật"}`,
        ].join("\n");
      }

      if (intent === "season") {
        return `${product.name}: ${product.season || "Chưa cập nhật mùa vụ"}.`;
      }

      return formatProductSummary(product, getPersonalizedPrice(product.price));
    }

    if (intent === "product") {
      const categories = Array.from(
        new Set(products.map((product) => getCategoryName(product.category))),
      );

      return [
        `Hiện hệ thống có ${products.length} sản phẩm thuộc các nhóm: ${categories.join(", ")}.`,
        "Một số sản phẩm nổi bật:",
        formatProductList(
          [...products].sort((a, b) => b.rating - a.rating),
          getPersonalizedPrice,
        ),
      ].join("\n");
    }

    if (intent === "price") {
      return [
        `Giá sẽ áp dụng theo hạng thành viên hiện tại: ${tierInfo.name} (${tierInfo.discount}% giảm).`,
        "Bạn có thể nhập tên sản phẩm để xem giá cụ thể, ví dụ: “giá cà phê” hoặc “giá xoài”.",
        "Một vài sản phẩm:",
        formatProductList(products, getPersonalizedPrice),
      ].join("\n");
    }

    if (intent === "delivery") {
      return DELIVERY_OPTIONS.map(
        (option) =>
          `${option.name}: ${formatCurrency(option.price)} - ${option.estimatedDays}`,
      ).join("\n");
    }

    if (intent === "payment") {
      return `Các phương thức thanh toán hiện có: ${PAYMENT_METHODS.map((method) => method.name).join(", ")}.`;
    }

    if (intent === "promotion") {
      if (activeVouchers.length === 0) {
        return "Hiện chưa có voucher đang hoạt động. Ưu đãi theo hạng thành viên vẫn được áp dụng tự động khi đăng nhập.";
      }

      return [
        "Voucher đang hoạt động:",
        activeVouchers
          .slice(0, 6)
          .map(
            (voucher) =>
              `${voucher.code}: ${voucher.description} (đơn từ ${formatCurrency(voucher.minOrderValue)}, HSD ${voucher.expiryDate})`,
          )
          .join("\n"),
      ].join("\n");
    }

    if (intent === "tier") {
      return [
        `Hạng hiện tại của bạn: ${tierInfo.name}.`,
        `Mức giảm tự động: ${tierInfo.discount}%.`,
        "Mốc hạng: Bạc từ 1.000.000₫, Vàng từ 5.000.000₫, Kim Cương từ 15.000.000₫ tổng đơn đã giao thành công.",
      ].join("\n");
    }

    if (intent === "cart") {
      if (cart.length === 0) {
        return "Giỏ hàng của bạn đang trống. Bạn có thể vào trang Sản phẩm để thêm nông sản cần mua.";
      }

      const total = cart.reduce(
        (sum, item) =>
          sum + getPersonalizedPrice(item.product.price) * item.quantity,
        0,
      );

      return [
        `Giỏ hàng hiện có ${cart.reduce((sum, item) => sum + item.quantity, 0)} sản phẩm.`,
        cart
          .map(
            (item) =>
              `${item.product.name} x${item.quantity}: ${formatCurrency(getPersonalizedPrice(item.product.price) * item.quantity)}`,
          )
          .join("\n"),
        `Tạm tính: ${formatCurrency(total)}. Chưa bao gồm VAT 10% và phí vận chuyển.`,
      ].join("\n");
    }

    if (intent === "help") {
      return [
        FALLBACK_RESPONSE,
        `Thông tin cửa hàng: ${storeProfile.shopName} - ${storeProfile.shopPhone} - ${storeProfile.shopEmail}`,
      ].join("\n");
    }

    return FALLBACK_RESPONSE;
  };

  const handleSendMessage = () => {
    const trimmedInput = inputText.trim();
    if (!trimmedInput) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: trimmedInput,
      sender: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText("");

    setTimeout(() => {
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: getBotResponse(trimmedInput),
        sender: "bot",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, botMessage]);
    }, 500);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <>
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 bg-primary text-white p-4 rounded-full shadow-lg hover:bg-primary/90 transition-all z-50 flex items-center gap-2"
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
                <p className="text-xs opacity-90">Rule-based từ dữ liệu hệ thống</p>
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
              <div
                key={message.id}
                className={`flex gap-2 ${
                  message.sender === "user" ? "justify-end" : "justify-start"
                }`}
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
                  <p
                    className={`text-xs mt-1 ${
                      message.sender === "user"
                        ? "text-white/70"
                        : "text-muted-foreground"
                    }`}
                  >
                    {message.timestamp.toLocaleTimeString("vi-VN", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
                {message.sender === "user" && (
                  <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
                    <User className="w-5 h-5 text-foreground" />
                  </div>
                )}
              </div>
            ))}
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
                className="flex-1 px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background"
              />
              <button
                onClick={handleSendMessage}
                className="bg-primary text-white p-2 rounded-lg hover:bg-primary/90 transition-colors"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Gợi ý: “giá gạo ST25”, “voucher”, “giao hàng”, “bảo quản xoài”
            </p>
          </div>
        </div>
      )}
    </>
  );
}
