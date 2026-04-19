import { useState, useEffect } from "react";
import { Link } from "react-router";
import { useShop } from "../context/ShopContext";
import { useAuth } from "../context/AuthContext";
import { AlertTriangle, Camera, CheckCircle, Clock, Send, MessageSquare, Package, RefreshCw, Banknote, Ticket } from "lucide-react";
import { toast } from "sonner";
import { Order } from "../types";

interface IssueReport {
  id: string;
  orderId: string;
  issueType: string;
  description: string;
  imageUrl: string;
  resolution: string;
  status: "pending" | "reviewing" | "resolved";
  createdAt: string;
}

const ISSUE_TYPES = [
  { id: "damaged", label: "Hàng hỏng / dập nát", icon: "📦💥" },
  { id: "wrong-item", label: "Sai sản phẩm", icon: "❌📦" },
  { id: "quality", label: "Chất lượng kém / không tươi", icon: "🥀" },
  { id: "late-delivery", label: "Giao hàng trễ", icon: "⏰" },
  { id: "missing-item", label: "Thiếu sản phẩm", icon: "❓" },
];

const RESOLUTIONS = [
  { id: "refund", label: "Hoàn tiền", icon: <Banknote className="w-4 h-4" /> },
  { id: "replace", label: "Gửi lại sản phẩm", icon: <RefreshCw className="w-4 h-4" /> },
  { id: "voucher", label: "Cấp voucher bù", icon: <Ticket className="w-4 h-4" /> },
];

export function IssueCenter() {
  const { role } = useAuth();
  const { orders } = useShop();
  const isCustomer = role === "consumer";

  const [issues, setIssues] = useState<IssueReport[]>(() => {
    const stored = localStorage.getItem("issueReports");
    return stored ? JSON.parse(stored) : [];
  });

  // Form state
  const [selectedOrderId, setSelectedOrderId] = useState("");
  const [issueType, setIssueType] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [resolution, setResolution] = useState("refund");
  const [showForm, setShowForm] = useState(false);

  // Persist issues
  useEffect(() => {
    localStorage.setItem("issueReports", JSON.stringify(issues));
  }, [issues]);

  // Only show delivered orders for complaints
  const deliveredOrders = orders.filter((o) => o.status === "delivered" || o.status === "shipped");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedOrderId) {
      toast.error("Vui lòng chọn đơn hàng");
      return;
    }
    if (!issueType) {
      toast.error("Vui lòng chọn loại vấn đề");
      return;
    }
    if (!description.trim() || description.length < 10) {
      toast.error("Vui lòng mô tả chi tiết vấn đề (tối thiểu 10 ký tự)");
      return;
    }

    const newIssue: IssueReport = {
      id: `ISS-${Date.now()}`,
      orderId: selectedOrderId,
      issueType,
      description: description.trim(),
      imageUrl: imageUrl.trim(),
      resolution,
      status: "pending",
      createdAt: new Date().toISOString(),
    };

    setIssues((prev) => [newIssue, ...prev]);
    // Reset form
    setSelectedOrderId("");
    setIssueType("");
    setDescription("");
    setImageUrl("");
    setResolution("refund");
    setShowForm(false);
    toast.success("Đã gửi khiếu nại thành công! Chúng tôi sẽ phản hồi trong 24 giờ.");
  };

  const getStatusBadge = (status: IssueReport["status"]) => {
    switch (status) {
      case "pending":
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-semibold">
            <Clock className="w-3 h-3" /> Chờ xử lý
          </span>
        );
      case "reviewing":
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-semibold">
            <MessageSquare className="w-3 h-3" /> Đang xem xét
          </span>
        );
      case "resolved":
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold">
            <CheckCircle className="w-3 h-3" /> Đã giải quyết
          </span>
        );
    }
  };

  const getIssueLabel = (type: string) => {
    return ISSUE_TYPES.find((t) => t.id === type)?.label || type;
  };

  const getResolutionLabel = (res: string) => {
    return RESOLUTIONS.find((r) => r.id === res)?.label || res;
  };

  if (!isCustomer) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center">
          <AlertTriangle className="w-24 h-24 text-gray-300 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2 text-foreground">Đăng nhập để sử dụng</h2>
          <p className="text-muted-foreground mb-8">
            Tính năng hỗ trợ chất lượng chỉ dành cho khách hàng đã đăng nhập.
          </p>
          <Link
            to="/auth"
            className="inline-flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-lg hover:bg-primary/90 transition-colors"
          >
            Đăng nhập khách hàng
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div>
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-red-50 rounded-full text-red-700 text-sm font-semibold mb-3">
            <AlertTriangle className="w-4 h-4" />
            Hỗ trợ chất lượng
          </div>
          <h1 className="text-foreground font-bold">Trung Tâm Hỗ Trợ Chất Lượng</h1>
          <p className="text-muted-foreground mt-1">
            Báo cáo vấn đề về sản phẩm, yêu cầu hoàn tiền hoặc gửi lại hàng
          </p>
        </div>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-lg hover:bg-primary/90 transition-colors font-semibold"
          >
            <Send className="w-5 h-5" />
            Gửi Khiếu Nại Mới
          </button>
        )}
      </div>

      {/* Complaint Form */}
      {showForm && (
        <div className="bg-white rounded-xl shadow-sm border border-border p-6 md:p-8 mb-8">
          <h2 className="text-lg font-bold text-foreground mb-6 flex items-center gap-2">
            <Send className="w-5 h-5 text-primary" />
            Gửi Khiếu Nại Chất Lượng
          </h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Select Order */}
            <div>
              <label className="block text-sm font-semibold mb-2 text-foreground">
                Chọn đơn hàng *
              </label>
              {deliveredOrders.length === 0 ? (
                <p className="text-sm text-muted-foreground bg-accent rounded-lg p-4">
                  Chưa có đơn hàng nào đã giao. Chỉ có thể khiếu nại đơn hàng đã giao hoặc đang giao.
                </p>
              ) : (
                <select
                  value={selectedOrderId}
                  onChange={(e) => setSelectedOrderId(e.target.value)}
                  className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background"
                >
                  <option value="">-- Chọn đơn hàng --</option>
                  {deliveredOrders.map((order) => (
                    <option key={order.id} value={order.id}>
                      {order.id} — {new Date(order.orderDate).toLocaleDateString("vi-VN")} — {order.total.toLocaleString("vi-VN")}₫
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Issue Type */}
            <div>
              <label className="block text-sm font-semibold mb-2 text-foreground">
                Loại vấn đề *
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {ISSUE_TYPES.map((type) => (
                  <label
                    key={type.id}
                    className={`block p-3 border-2 rounded-lg cursor-pointer transition-all text-center ${
                      issueType === type.id
                        ? "border-primary bg-primary/5 shadow-sm"
                        : "border-border hover:border-primary/30"
                    }`}
                  >
                    <input
                      type="radio"
                      name="issueType"
                      value={type.id}
                      checked={issueType === type.id}
                      onChange={() => setIssueType(type.id)}
                      className="sr-only"
                    />
                    <span className="text-xl block mb-1">{type.icon}</span>
                    <span className="text-sm font-medium text-foreground">{type.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-semibold mb-2 text-foreground">
                Mô tả chi tiết *
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background resize-none"
                placeholder="Mô tả vấn đề gặp phải: sản phẩm bị dập, không tươi, sai hàng..."
              />
            </div>

            {/* Image URL */}
            <div>
              <label className="block text-sm font-semibold mb-2 text-foreground flex items-center gap-2">
                <Camera className="w-4 h-4" />
                Link ảnh minh chứng (không bắt buộc)
              </label>
              <input
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background"
                placeholder="https://example.com/anh-minh-chung.jpg"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Gửi ảnh minh chứng giúp xử lý nhanh hơn. Chụp rõ sản phẩm bị lỗi.
              </p>
            </div>

            {/* Resolution Preference */}
            <div>
              <label className="block text-sm font-semibold mb-2 text-foreground">
                Giải pháp mong muốn
              </label>
              <div className="flex flex-wrap gap-3">
                {RESOLUTIONS.map((res) => (
                  <label
                    key={res.id}
                    className={`inline-flex items-center gap-2 px-4 py-2 border-2 rounded-lg cursor-pointer transition-all text-sm font-medium ${
                      resolution === res.id
                        ? "border-primary bg-primary/5 text-primary"
                        : "border-border text-foreground hover:border-primary/30"
                    }`}
                  >
                    <input
                      type="radio"
                      name="resolution"
                      value={res.id}
                      checked={resolution === res.id}
                      onChange={() => setResolution(res.id)}
                      className="sr-only"
                    />
                    {res.icon}
                    {res.label}
                  </label>
                ))}
              </div>
            </div>

            {/* Submit */}
            <div className="flex gap-4 pt-2">
              <button
                type="submit"
                className="flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-lg hover:bg-primary/90 transition-colors font-semibold"
              >
                <Send className="w-5 h-5" />
                Gửi Khiếu Nại
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-6 py-3 border border-border rounded-lg hover:bg-muted transition-colors font-semibold"
              >
                Hủy
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Guarantee Banner */}
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-6 mb-8">
        <div className="flex items-start gap-4">
          <CheckCircle className="w-8 h-8 text-green-600 flex-shrink-0" />
          <div>
            <h3 className="font-bold text-foreground mb-2">Cam kết của Nông Sản Việt</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-foreground">
              <p>✅ Phản hồi khiếu nại trong vòng 24 giờ</p>
              <p>✅ Hoàn tiền 100% nếu hàng không đạt chất lượng</p>
              <p>✅ Gửi lại hàng miễn phí nếu sai sản phẩm</p>
              <p>✅ Cấp voucher bù cho trải nghiệm không tốt</p>
            </div>
          </div>
        </div>
      </div>

      {/* Issue History */}
      <div>
        <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
          <Package className="w-5 h-5 text-primary" />
          Lịch Sử Khiếu Nại ({issues.length})
        </h2>

        {issues.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-border p-12 text-center">
            <CheckCircle className="w-16 h-16 text-green-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">Chưa có khiếu nại nào</h3>
            <p className="text-muted-foreground">
              Nếu gặp vấn đề về chất lượng sản phẩm, hãy gửi khiếu nại để chúng tôi hỗ trợ.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {issues.map((issue) => (
              <div key={issue.id} className="bg-white rounded-xl shadow-sm border border-border overflow-hidden">
                <div className="px-6 py-4 bg-gray-50 border-b border-border flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <p className="font-semibold text-foreground">{issue.id}</p>
                    <p className="text-sm text-muted-foreground">
                      Đơn hàng: {issue.orderId} • Ngày gửi: {new Date(issue.createdAt).toLocaleDateString("vi-VN")}
                    </p>
                  </div>
                  {getStatusBadge(issue.status)}
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground font-medium mb-1">Loại vấn đề</p>
                      <p className="text-foreground font-semibold">{getIssueLabel(issue.issueType)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground font-medium mb-1">Giải pháp mong muốn</p>
                      <p className="text-foreground font-semibold">{getResolutionLabel(issue.resolution)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground font-medium mb-1">Mô tả</p>
                      <p className="text-foreground text-sm">{issue.description}</p>
                    </div>
                  </div>
                  {issue.imageUrl && (
                    <div className="mt-4 pt-4 border-t border-border">
                      <p className="text-sm text-muted-foreground font-medium mb-2">Ảnh minh chứng</p>
                      <a href={issue.imageUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline text-sm">
                        {issue.imageUrl}
                      </a>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
