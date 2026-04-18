import { useState } from "react";
import {
  Mail,
  Phone,
  MapPin,
  Clock,
  Send,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  Sprout,
  HelpCircle,
} from "lucide-react";
import { toast } from "sonner";

interface FAQItem {
  question: string;
  answer: string;
}

const FAQ_ITEMS: FAQItem[] = [
  {
    question: "Sản phẩm có nguồn gốc từ đâu?",
    answer:
      "Tất cả sản phẩm trên Nông Sản Việt đều được thu mua trực tiếp từ các nông hộ và hợp tác xã uy tín trên khắp Việt Nam. Mỗi sản phẩm đều có thông tin rõ ràng về vùng trồng và phương pháp canh tác.",
  },
  {
    question: "Thời gian giao hàng là bao lâu?",
    answer:
      "Chúng tôi có 4 phương thức giao hàng: Tiêu chuẩn (3-5 ngày), Nhanh (1-2 ngày), Trong ngày (khu vực nội thành), và Miễn phí vận chuyển cho đơn hàng từ 500.000₫ trở lên (5-7 ngày).",
  },
  {
    question: "Chính sách đổi trả như thế nào?",
    answer:
      "Bạn có thể đổi trả sản phẩm trong vòng 7 ngày kể từ ngày nhận hàng nếu sản phẩm bị hư hỏng, không đúng mô tả, hoặc không đạt chất lượng. Vui lòng liên hệ bộ phận hỗ trợ để được xử lý.",
  },
  {
    question: "Làm sao để trở thành khách hàng thân thiết?",
    answer:
      "Chương trình khách hàng thân thiết gồm 4 hạng: Thường, Bạc (giảm 5%), Vàng (giảm 10%), và Kim Cương (giảm 15%). Hạng thành viên được tự động nâng cấp dựa trên tổng giá trị mua hàng tích lũy.",
  },
  {
    question: "Thanh toán có an toàn không?",
    answer:
      "Chúng tôi sử dụng mã hóa SSL/TLS tiêu chuẩn ngành để bảo vệ thông tin thanh toán. Thông tin thẻ của bạn không bao giờ được lưu trên máy chủ của chúng tôi. Chúng tôi hỗ trợ thanh toán qua thẻ, MoMo, chuyển khoản, và COD.",
  },
  {
    question: "Tôi có thể bán hàng trên nền tảng không?",
    answer:
      'Có! Nông Sản Việt là nền tảng D2C kết nối nông dân với người tiêu dùng. Bạn có thể đăng ký vai trò "Người Bán Hàng" để quản lý sản phẩm, theo dõi đơn hàng và xem phân tích doanh thu.',
  },
];

export function Contact() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim() || formData.name.length < 2) {
      newErrors.name = "Vui lòng nhập họ tên";
    }
    if (
      !formData.email.trim() ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)
    ) {
      newErrors.email = "Vui lòng nhập email hợp lệ";
    }
    if (!formData.subject.trim()) {
      newErrors.subject = "Vui lòng nhập chủ đề";
    }
    if (!formData.message.trim() || formData.message.length < 10) {
      newErrors.message = "Tin nhắn phải có ít nhất 10 ký tự";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    toast.success(
      "Tin nhắn đã được gửi thành công! Chúng tôi sẽ phản hồi trong 24 giờ."
    );
    setFormData({ name: "", email: "", subject: "", message: "" });
    setErrors({});
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Page Header */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-accent rounded-full mb-4">
          <MessageSquare className="w-8 h-8 text-primary" />
        </div>
        <h1 className="text-foreground mb-2">Liên Hệ Với Chúng Tôi</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Bạn có câu hỏi, góp ý, hoặc cần hỗ trợ? Hãy liên hệ với đội ngũ
          Nông Sản Việt — chúng tôi luôn sẵn sàng giúp đỡ.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16">
        {/* Contact Form */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-sm p-8 border border-border">
            <h2 className="text-xl font-bold text-foreground mb-6 flex items-center gap-2">
              <Send className="w-5 h-5 text-primary" />
              Gửi Tin Nhắn
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-1 text-foreground">
                    Họ và Tên *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background ${
                      errors.name ? "border-destructive" : "border-border"
                    }`}
                    placeholder="Nguyễn Văn A"
                  />
                  {errors.name && (
                    <p className="text-destructive text-sm mt-1">
                      {errors.name}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1 text-foreground">
                    Email *
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background ${
                      errors.email ? "border-destructive" : "border-border"
                    }`}
                    placeholder="email@example.com"
                  />
                  {errors.email && (
                    <p className="text-destructive text-sm mt-1">
                      {errors.email}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1 text-foreground">
                  Chủ Đề *
                </label>
                <input
                  type="text"
                  value={formData.subject}
                  onChange={(e) =>
                    setFormData({ ...formData, subject: e.target.value })
                  }
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background ${
                    errors.subject ? "border-destructive" : "border-border"
                  }`}
                  placeholder="Câu hỏi về sản phẩm, đơn hàng..."
                />
                {errors.subject && (
                  <p className="text-destructive text-sm mt-1">
                    {errors.subject}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1 text-foreground">
                  Tin Nhắn *
                </label>
                <textarea
                  value={formData.message}
                  onChange={(e) =>
                    setFormData({ ...formData, message: e.target.value })
                  }
                  rows={5}
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background resize-none ${
                    errors.message ? "border-destructive" : "border-border"
                  }`}
                  placeholder="Mô tả chi tiết vấn đề hoặc câu hỏi của bạn..."
                />
                {errors.message && (
                  <p className="text-destructive text-sm mt-1">
                    {errors.message}
                  </p>
                )}
              </div>

              <button
                type="submit"
                className="w-full bg-primary text-white py-3 rounded-lg hover:bg-primary/90 transition-colors font-semibold flex items-center justify-center gap-2"
              >
                <Send className="w-5 h-5" />
                Gửi Tin Nhắn
              </button>
            </form>
          </div>
        </div>

        {/* Store Info Sidebar */}
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm p-6 border border-border">
            <div className="flex items-center gap-2 mb-6">
              <Sprout className="w-6 h-6 text-primary" />
              <h2 className="text-lg font-bold text-foreground">
                Thông Tin Liên Hệ
              </h2>
            </div>
            <div className="space-y-5">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-accent rounded-full flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-sm text-foreground">
                    Địa Chỉ
                  </p>
                  <p className="text-sm text-muted-foreground">
                    123 Đường Nông Nghiệp, P. Tân Bình
                    <br />
                    TP. Hồ Chí Minh, Việt Nam
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-accent rounded-full flex items-center justify-center flex-shrink-0">
                  <Phone className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-sm text-foreground">
                    Điện Thoại
                  </p>
                  <p className="text-sm text-muted-foreground">
                    1900 0000 (Miễn phí)
                    <br />
                    +84 28 1234 5678
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-accent rounded-full flex items-center justify-center flex-shrink-0">
                  <Mail className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-sm text-foreground">Email</p>
                  <p className="text-sm text-muted-foreground">
                    hotro@nongsanviet.vn
                    <br />
                    info@nongsanviet.vn
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-accent rounded-full flex items-center justify-center flex-shrink-0">
                  <Clock className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-sm text-foreground">
                    Giờ Làm Việc
                  </p>
                  <p className="text-sm text-muted-foreground">
                    T2 - T6: 8:00 - 18:00
                    <br />
                    T7: 8:00 - 12:00
                    <br />
                    CN: Nghỉ
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="mb-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-accent rounded-full mb-3">
            <HelpCircle className="w-6 h-6 text-primary" />
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-1">
            Câu Hỏi Thường Gặp
          </h2>
          <p className="text-muted-foreground">
            Tìm câu trả lời cho các thắc mắc phổ biến
          </p>
        </div>

        <div className="max-w-3xl mx-auto space-y-3">
          {FAQ_ITEMS.map((faq, index) => (
            <div
              key={index}
              className="bg-white rounded-lg shadow-sm border border-border overflow-hidden"
            >
              <button
                onClick={() =>
                  setOpenFaqIndex(openFaqIndex === index ? null : index)
                }
                className="w-full flex items-center justify-between p-5 text-left hover:bg-muted/50 transition-colors"
              >
                <span className="font-semibold text-foreground pr-4">
                  {faq.question}
                </span>
                {openFaqIndex === index ? (
                  <ChevronUp className="w-5 h-5 text-primary flex-shrink-0" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                )}
              </button>
              {openFaqIndex === index && (
                <div className="px-5 pb-5">
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {faq.answer}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
