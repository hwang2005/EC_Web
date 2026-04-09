import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Bot, User } from "lucide-react";

interface Message {
  id: string;
  text: string;
  sender: "user" | "bot";
  timestamp: Date;
}

const BOT_RESPONSES = [
  {
    keywords: ["gạo", "rice", "st25"],
    response: "Gạo ST25 của chúng tôi là giống gạo đoạt giải gạo ngon nhất thế giới! Được trồng tại Sóc Trăng với chất lượng cao cấp. Bạn có muốn xem thêm sản phẩm gạo không?"
  },
  {
    keywords: ["cà phê", "coffee", "robusta"],
    response: "Cà phê Robusta Đắk Lắk của chúng tôi có hương vị đậm đà, mạnh mẽ với hậu vị chocolate. Bạn có cần tư vấn về cách pha chế không?"
  },
  {
    keywords: ["giá", "price", "bao nhiêu", "cost"],
    response: "Giá sản phẩm của chúng tôi tùy thuộc vào hạng khách hàng. Bạn là khách hàng Bạc, Vàng, hay Kim Cương sẽ nhận được mức giá ưu đãi khác nhau. Bạn muốn biết về chương trình khách hàng thân thiết không?"
  },
  {
    keywords: ["giao hàng", "delivery", "ship", "vận chuyển"],
    response: "Chúng tôi có 4 phương thức giao hàng: Tiêu chuẩn (3-5 ngày), Nhanh (1-2 ngày), Trong ngày (nội thành), và Miễn phí (đơn từ 500k). Bạn ở khu vực nào?"
  },
  {
    keywords: ["thanh toán", "payment", "pay"],
    response: "Chúng tôi chấp nhận thanh toán qua: Thẻ tín dụng/ghi nợ, MoMo, Chuyển khoản ngân hàng, và COD. Bạn muốn dùng phương thức nào?"
  },
  {
    keywords: ["hoa", "fruit", "trái cây"],
    response: "Trái cây tươi của chúng tôi đến từ các vùng nổi tiếng: Thanh long Bình Thuận, Xoài Hòa Lộc Tiền Giang, Chôm chôm Bến Tre... Tất cả đều tươi ngon và giàu dinh dưỡng!"
  },
  {
    keywords: ["hữu cơ", "organic"],
    response: "Chúng tôi có nhiều sản phẩm hữu cơ như: Rau Đà Lạt, Lúa mạch Lâm Đồng... Tất cả đều được chứng nhận hữu cơ và an toàn cho sức khỏe."
  },
  {
    keywords: ["giảm giá", "discount", "khuyến mãi", "promotion"],
    response: "Hiện tại chúng tôi có chương trình giảm giá theo hạng khách hàng: Bạc 5%, Vàng 10%, Kim Cương 15%. Ngoài ra miễn phí ship cho đơn từ 500.000₫!"
  },
];

export function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      text: "Xin chào! Tôi là trợ lý ảo của Nông Sản Việt. Tôi có thể giúp bạn tìm hiểu về sản phẩm, giá cả, giao hàng, và chương trình khuyến mãi. Bạn cần hỗ trợ gì?",
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
    const lowerMessage = userMessage.toLowerCase();

    for (const response of BOT_RESPONSES) {
      if (response.keywords.some(keyword => lowerMessage.includes(keyword))) {
        return response.response;
      }
    }

    return "Cảm ơn bạn đã liên hệ! Tôi có thể giúp bạn về: sản phẩm nông sản, giá cả, giao hàng, thanh toán, và chương trình khuyến mãi. Bạn muốn biết về vấn đề gì?";
  };

  const handleSendMessage = () => {
    if (!inputText.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText,
      sender: "user",
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText("");

    setTimeout(() => {
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: getBotResponse(inputText),
        sender: "bot",
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, botMessage]);
    }, 500);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
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
        <div className="fixed bottom-6 right-6 w-96 h-[600px] bg-white rounded-lg shadow-2xl flex flex-col z-50 border border-border">
          <div className="bg-primary text-white p-4 rounded-t-lg flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bot className="w-6 h-6" />
              <div>
                <h3 className="font-semibold">Trợ Lý Nông Sản Việt</h3>
                <p className="text-xs opacity-90">Luôn sẵn sàng hỗ trợ</p>
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
                  className={`max-w-[70%] p-3 rounded-lg ${
                    message.sender === "user"
                      ? "bg-primary text-white"
                      : "bg-white border border-border"
                  }`}
                >
                  <p className="text-sm">{message.text}</p>
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
                onKeyPress={handleKeyPress}
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
              Trợ lý ảo - Hỗ trợ 24/7
            </p>
          </div>
        </div>
      )}
    </>
  );
}
