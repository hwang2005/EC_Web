import { useState, useEffect } from "react";
import { useShop } from "../context/ShopContext";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router";
import { Product, Order, StoreProfile, Voucher } from "../types";
import {
  Plus, Edit, Trash2, Save, X, BarChart3, Package,
  ShoppingBag, Star, Settings, AlertTriangle,
  ChevronRight, Clock, Truck, CheckCircle, XCircle,
  MessageSquare, Store, CalendarDays, Tag, ToggleLeft, ToggleRight,
} from "lucide-react";
import { toast } from "sonner";
import { Analytics } from "../components/Analytics";

type Tab = "analytics" | "products" | "orders" | "reviews" | "vouchers" | "settings";

export function Admin() {
  const {
    products, addProduct, updateProduct, deleteProduct,
    orders, updateOrderStatus, reviews,
    getSellerProducts, getSellerOrders, getSellerReviews,
    storeProfile, updateStoreProfile,
    vouchers, addVoucher, updateVoucher, deleteVoucher,
  } = useShop();
  const { role, profile } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>("analytics");
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<Product>>({});

  // Orders filtering
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>("all");
  const [orderSearch, setOrderSearch] = useState("");

  // Reviews filtering
  const [reviewProductFilter, setReviewProductFilter] = useState<string>("all");

  // Voucher state
  const BLANK_VOUCHER: Partial<Voucher> = {
    code: "",
    description: "",
    discountType: "percent",
    discountValue: 10,
    minOrderValue: 100000,
    maxDiscountAmount: undefined,
    applicableRanks: ["all"],
    applicableCategories: ["all"],
    expiryDate: "",
    isActive: true,
    usageLimit: undefined,
    usedCount: 0,
  };
  const [voucherForm, setVoucherForm] = useState<Partial<Voucher>>(BLANK_VOUCHER);
  const [isAddingVoucher, setIsAddingVoucher] = useState(false);
  const [editingVoucherId, setEditingVoucherId] = useState<string | null>(null);

  // Store settings form
  const [storeForm, setStoreForm] = useState<StoreProfile>(storeProfile);

  const sellerEmail = localStorage.getItem("current_user_email") || "";

  useEffect(() => {
    if (role !== "seller") {
      navigate("/");
    }
  }, [role, navigate]);

  if (role !== "seller") return null;

  // Seller-scoped data
  const sellerProducts = getSellerProducts(sellerEmail);
  const sellerOrders = getSellerOrders(sellerEmail);
  const sellerReviews = getSellerReviews(sellerEmail);

  // Low stock products (stock < 50)
  const lowStockProducts = sellerProducts.filter((p) => p.stock < 50);

  // Orders summary
  const pendingOrders = sellerOrders.filter((o) => o.status === "pending").length;
  const processingOrders = sellerOrders.filter((o) => o.status === "processing").length;
  const shippedOrders = sellerOrders.filter((o) => o.status === "shipped").length;
  const deliveredOrders = sellerOrders.filter((o) => o.status === "delivered").length;
  const cancelledOrders = sellerOrders.filter((o) => o.status === "cancelled").length;

  // Filtered orders
  const filteredOrders = sellerOrders
    .filter((o) => orderStatusFilter === "all" || o.status === orderStatusFilter)
    .filter((o) => orderSearch === "" || o.id.toLowerCase().includes(orderSearch.toLowerCase()));

  // Filtered reviews
  const filteredReviews = sellerReviews.filter(
    (r) => reviewProductFilter === "all" || r.productId === reviewProductFilter
  );

  const resetForm = () => {
    setFormData({});
    setIsAdding(false);
    setEditingId(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || formData.name.length < 2) {
      toast.error("Cần nhập tên sản phẩm (tối thiểu 2 ký tự)");
      return;
    }
    if (!formData.description || formData.description.length < 10) {
      toast.error("Cần nhập mô tả (tối thiểu 10 ký tự)");
      return;
    }
    if (!formData.price || formData.price <= 0) {
      toast.error("Cần nhập giá hợp lệ");
      return;
    }
    if (!formData.stock || formData.stock < 0) {
      toast.error("Cần nhập số lượng tồn kho hợp lệ");
      return;
    }
    if (!formData.category) {
      toast.error("Cần nhập phân loại");
      return;
    }
    if (!formData.image) {
      toast.error("Cần nhập đường dẫn hình ảnh");
      return;
    }

    if (isAdding) {
      const newProduct: Product = {
        id: `prod-${Date.now()}`,
        name: formData.name,
        description: formData.description,
        price: formData.price,
        image: formData.image,
        category: formData.category,
        stock: formData.stock,
        rating: formData.rating || 4.5,
        sellerId: sellerEmail,
      };
      addProduct(newProduct);
      toast.success("Đã thêm sản phẩm thành công");
    } else if (editingId) {
      const updatedProduct = products.find((p) => p.id === editingId);
      if (updatedProduct) {
        updateProduct({ ...updatedProduct, ...formData } as Product);
        toast.success("Đã cập nhật sản phẩm thành công");
      }
    }

    resetForm();
  };

  const handleEdit = (product: Product) => {
    setEditingId(product.id);
    setFormData(product);
    setIsAdding(false);
  };

  const handleDelete = (product: Product) => {
    if (confirm(`Bạn có chắc chắn muốn xóa "${product.name}"?`)) {
      deleteProduct(product.id);
      toast.success("Đã xóa sản phẩm thành công");
    }
  };

  const handleAddNew = () => {
    setIsAdding(true);
    setEditingId(null);
    setFormData({
      name: "",
      description: "",
      price: 0,
      image: "",
      category: "",
      stock: 0,
      rating: 4.5,
    });
  };

  const handleStatusUpdate = (orderId: string, newStatus: Order["status"]) => {
    updateOrderStatus(orderId, newStatus);
    toast.success(`Đã cập nhật trạng thái đơn hàng thành "${getStatusLabel(newStatus)}"`);
  };

  const handleSaveStoreProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!storeForm.shopName.trim()) {
      toast.error("Cần nhập tên cửa hàng");
      return;
    }
    updateStoreProfile(storeForm);
    toast.success("Đã lưu thông tin cửa hàng thành công");
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "pending": return "Chờ xử lý";
      case "processing": return "Đang xử lý";
      case "shipped": return "Đang giao";
      case "delivered": return "Đã giao";
      case "cancelled": return "Đã hủy";
      default: return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "bg-yellow-100 text-yellow-800";
      case "processing": return "bg-blue-100 text-blue-800";
      case "shipped": return "bg-purple-100 text-purple-800";
      case "delivered": return "bg-green-100 text-green-800";
      case "cancelled": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending": return <Clock className="w-4 h-4" />;
      case "processing": return <Package className="w-4 h-4" />;
      case "shipped": return <Truck className="w-4 h-4" />;
      case "delivered": return <CheckCircle className="w-4 h-4" />;
      case "cancelled": return <XCircle className="w-4 h-4" />;
      default: return <Package className="w-4 h-4" />;
    }
  };

  const getNextStatus = (status: string): Order["status"] | null => {
    switch (status) {
      case "pending": return "processing";
      case "processing": return "shipped";
      case "shipped": return "delivered";
      default: return null;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1>Kênh Người Bán</h1>
          <p className="text-muted-foreground mt-1">
            Quản lý cửa hàng, sản phẩm, đơn hàng và đánh giá
          </p>
        </div>
        {activeTab === "products" && (
          <button
            onClick={handleAddNew}
            className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Thêm Sản Phẩm
          </button>
        )}
      </div>

      {/* Low stock alert banner */}
      {lowStockProducts.length > 0 && (
        <div className="mb-6 bg-orange-50 border border-orange-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-semibold text-orange-900">
                Cảnh báo tồn kho thấp ({lowStockProducts.length} sản phẩm)
              </p>
              <div className="mt-2 space-y-1">
                {lowStockProducts.map((p) => (
                  <p key={p.id} className="text-sm text-orange-700">
                    • <strong>{p.name}</strong> — còn {p.stock} sản phẩm
                  </p>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Expiry / Freshness alert banner */}
      {(() => {
        const expiringProducts = sellerProducts.filter((p) => {
          if (!p.harvestDate || !p.isPerishable) return false;
          const harvest = new Date(p.harvestDate);
          const daysSinceHarvest = Math.floor((Date.now() - harvest.getTime()) / (1000 * 60 * 60 * 24));
          return daysSinceHarvest > 3; // Perishable items harvested more than 3 days ago
        });
        if (expiringProducts.length === 0) return null;
        return (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <CalendarDays className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-semibold text-red-900">
                  ⚠️ Cảnh báo hạn sử dụng ({expiringProducts.length} sản phẩm tươi sống)
                </p>
                <p className="text-sm text-red-700 mt-1 mb-2">
                  Các sản phẩm tươi sống dưới đây đã thu hoạch lâu, cần ưu tiên bán hoặc xử lý kịp thời.
                </p>
                <div className="space-y-2">
                  {expiringProducts.map((p) => {
                    const daysSince = Math.floor((Date.now() - new Date(p.harvestDate!).getTime()) / (1000 * 60 * 60 * 24));
                    return (
                      <div key={p.id} className="flex items-center justify-between bg-red-100/50 rounded-lg px-3 py-2">
                        <div className="flex items-center gap-3">
                          <img src={p.image} alt={p.name} className="w-8 h-8 rounded object-cover" />
                          <div>
                            <p className="text-sm font-semibold text-red-900">{p.name}</p>
                            <p className="text-xs text-red-700">
                              Lô: {p.batchCode} • Thu hoạch: {new Date(p.harvestDate!).toLocaleDateString("vi-VN")}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-200 text-red-800 text-xs font-bold rounded-full">
                            <Clock className="w-3 h-3" />
                            {daysSince} ngày trước
                          </span>
                          <p className="text-xs text-red-600 mt-1">{p.shelfLife}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <p className="text-xs text-red-600 mt-3 italic">
                  💡 Gợi ý: Áp dụng giảm giá hoặc combo để đẩy nhanh tiêu thụ sản phẩm gần hết hạn.
                </p>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Tab Navigation */}
      <div className="mb-6 flex gap-1 border-b border-border overflow-x-auto">
        {[
          { id: "analytics" as Tab, label: "Phân Tích", icon: <BarChart3 className="w-4 h-4" /> },
          { id: "products" as Tab, label: "Sản Phẩm", icon: <Package className="w-4 h-4" />, count: sellerProducts.length },
          { id: "orders" as Tab, label: "Đơn Hàng", icon: <ShoppingBag className="w-4 h-4" />, count: pendingOrders + processingOrders },
          { id: "reviews" as Tab, label: "Đánh Giá", icon: <MessageSquare className="w-4 h-4" />, count: sellerReviews.length },
          { id: "vouchers" as Tab, label: "Voucher", icon: <Tag className="w-4 h-4" />, count: vouchers.filter(v => v.isActive).length },
          { id: "settings" as Tab, label: "Cài Đặt", icon: <Settings className="w-4 h-4" /> },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 border-b-2 transition-colors whitespace-nowrap ${
              activeTab === tab.id
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.icon}
            {tab.label}
            {tab.count !== undefined && tab.count > 0 && (
              <span className={`text-xs font-bold rounded-full px-2 py-0.5 ${
                activeTab === tab.id ? "bg-primary text-white" : "bg-muted text-muted-foreground"
              }`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ═══════════════════ ANALYTICS TAB ═══════════════════ */}
      {activeTab === "analytics" && <Analytics />}

      {/* ═══════════════════ PRODUCTS TAB ═══════════════════ */}
      {activeTab === "products" && (
        <>
          {/* Product Form */}
          {(isAdding || editingId) && (
            <div className="bg-white rounded-lg shadow-sm p-6 mb-8 border border-border">
              <div className="flex justify-between items-center mb-4">
                <h2>
                  {isAdding ? "Thêm Sản Phẩm Mới" : "Chỉnh Sửa Sản Phẩm"}
                </h2>
                <button
                  onClick={resetForm}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block mb-1">
                      Tên Sản Phẩm *
                    </label>
                    <input
                      type="text"
                      value={formData.name || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background"
                      required
                    />
                  </div>

                  <div>
                    <label className="block mb-1">
                      Danh Mục *
                    </label>
                    <input
                      type="text"
                      value={formData.category || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, category: e.target.value })
                      }
                      className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block mb-1">
                    Mô Tả *
                  </label>
                  <textarea
                    value={formData.description || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background"
                    rows={3}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block mb-1">
                      Giá (₫) *
                    </label>
                    <input
                      type="number"
                      step="1000"
                      value={formData.price || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, price: parseFloat(e.target.value) })
                      }
                      className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background"
                      required
                    />
                  </div>

                  <div>
                    <label className="block mb-1">
                      Số Lượng *
                    </label>
                    <input
                      type="number"
                      value={formData.stock || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, stock: parseInt(e.target.value) })
                      }
                      className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background"
                      required
                    />
                  </div>

                  <div>
                    <label className="block mb-1">
                      Đánh Giá (0-5)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="5"
                      value={formData.rating || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, rating: parseFloat(e.target.value) })
                      }
                      className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background"
                    />
                  </div>
                </div>

                <div>
                  <label className="block mb-1">
                    URL Hình Ảnh *
                  </label>
                  <input
                    type="url"
                    value={formData.image || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, image: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background"
                    placeholder="https://example.com/image.jpg"
                    required
                  />
                </div>

                <div className="flex gap-4">
                  <button
                    type="submit"
                    className="flex items-center gap-2 bg-primary text-white px-6 py-2 rounded-lg hover:bg-primary/90 transition-colors"
                  >
                    <Save className="w-5 h-5" />
                    {isAdding ? "Thêm Sản Phẩm" : "Lưu Thay Đổi"}
                  </button>
                  <button
                    type="button"
                    onClick={resetForm}
                    className="border border-border px-6 py-2 rounded-lg hover:bg-muted transition-colors"
                  >
                    Hủy
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Products Table */}
          <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-border">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted border-b border-border">
                  <tr>
                    <th className="text-left px-6 py-3 text-foreground">
                      Sản Phẩm
                    </th>
                    <th className="text-left px-6 py-3 text-foreground">
                      Danh Mục
                    </th>
                    <th className="text-left px-6 py-3 text-foreground">
                      Giá
                    </th>
                    <th className="text-left px-6 py-3 text-foreground">
                      Tồn Kho
                    </th>
                    <th className="text-left px-6 py-3 text-foreground">
                      Đánh Giá
                    </th>
                    <th className="text-right px-6 py-3 text-foreground">
                      Hành Động
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {sellerProducts.map((product) => (
                    <tr key={product.id} className={`hover:bg-muted/50 ${product.stock < 50 ? "bg-orange-50/40" : ""}`}>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={product.image}
                            alt={product.name}
                            className="w-12 h-12 object-cover rounded"
                          />
                          <div>
                            <p className="font-semibold text-foreground">{product.name}</p>
                            <p className="text-sm text-muted-foreground line-clamp-1">
                              {product.description}
                            </p>
                            {product.batchCode && (
                              <p className="text-xs text-blue-600 mt-0.5 font-mono">
                                Lô: {product.batchCode}
                                {product.harvestDate && ` • Thu hoạch: ${new Date(product.harvestDate).toLocaleDateString("vi-VN")}`}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-block bg-accent text-foreground text-sm px-2 py-1 rounded">
                          {product.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-semibold text-foreground">
                        {product.price.toLocaleString("vi-VN")}₫
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-1 rounded text-sm ${
                            product.stock > 200
                              ? "bg-green-100 text-green-800"
                              : product.stock > 50
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {product.stock < 50 && <AlertTriangle className="w-3 h-3" />}
                          {product.stock}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="flex items-center gap-1 text-foreground">
                          ⭐ {product.rating}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleEdit(product)}
                            className="p-2 text-primary hover:bg-accent rounded transition-colors"
                          >
                            <Edit className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleDelete(product)}
                            className="p-2 text-destructive hover:bg-destructive/10 rounded transition-colors"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {sellerProducts.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                        <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
                        <p>Chưa có sản phẩm nào. Nhấn "Thêm Sản Phẩm" để bắt đầu.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-6 bg-accent border border-border rounded-lg p-4">
            <p className="text-sm text-foreground">
              <strong>Lưu ý:</strong> Thay đổi sản phẩm được lưu trong local storage của trình
              duyệt. Tất cả dữ liệu được xác thực ở phía client. Trong môi trường sản xuất thực tế,
              các thao tác này cần được xác thực và xử lý trên server.
            </p>
          </div>
        </>
      )}

      {/* ═══════════════════ ORDERS TAB ═══════════════════ */}
      {activeTab === "orders" && (
        <>
          {/* Order Status Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
            {[
              { label: "Chờ xử lý", count: pendingOrders, color: "bg-yellow-50 border-yellow-200 text-yellow-800", icon: <Clock className="w-5 h-5 text-yellow-600" /> },
              { label: "Đang xử lý", count: processingOrders, color: "bg-blue-50 border-blue-200 text-blue-800", icon: <Package className="w-5 h-5 text-blue-600" /> },
              { label: "Đang giao", count: shippedOrders, color: "bg-purple-50 border-purple-200 text-purple-800", icon: <Truck className="w-5 h-5 text-purple-600" /> },
              { label: "Đã giao", count: deliveredOrders, color: "bg-green-50 border-green-200 text-green-800", icon: <CheckCircle className="w-5 h-5 text-green-600" /> },
              { label: "Đã hủy", count: cancelledOrders, color: "bg-red-50 border-red-200 text-red-800", icon: <XCircle className="w-5 h-5 text-red-600" /> },
            ].map((card) => (
              <div key={card.label} className={`p-4 rounded-lg border ${card.color}`}>
                <div className="flex items-center justify-between">
                  {card.icon}
                  <span className="text-2xl font-bold">{card.count}</span>
                </div>
                <p className="text-sm mt-1 font-medium">{card.label}</p>
              </div>
            ))}
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-4 mb-6">
            <div className="flex-1 min-w-[200px]">
              <input
                type="text"
                placeholder="Tìm theo mã đơn hàng..."
                value={orderSearch}
                onChange={(e) => setOrderSearch(e.target.value)}
                className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background"
              />
            </div>
            <select
              value={orderStatusFilter}
              onChange={(e) => setOrderStatusFilter(e.target.value)}
              className="px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="pending">Chờ xử lý</option>
              <option value="processing">Đang xử lý</option>
              <option value="shipped">Đang giao</option>
              <option value="delivered">Đã giao</option>
              <option value="cancelled">Đã hủy</option>
            </select>
          </div>

          {/* Orders List */}
          <div className="space-y-4">
            {filteredOrders.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm p-12 text-center border border-border">
                <ShoppingBag className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-30" />
                <h3 className="text-lg font-semibold text-foreground mb-2">Chưa có đơn hàng nào</h3>
                <p className="text-muted-foreground">
                  Các đơn hàng từ khách hàng sẽ xuất hiện ở đây.
                </p>
              </div>
            ) : (
              filteredOrders.map((order) => {
                const nextStatus = getNextStatus(order.status);
                return (
                  <div key={order.id} className="bg-white rounded-lg shadow-sm border border-border overflow-hidden">
                    {/* Order Header */}
                    <div className="bg-muted/50 px-6 py-4 border-b border-border">
                      <div className="flex flex-wrap justify-between items-center gap-4">
                        <div>
                          <p className="font-semibold text-lg text-foreground">{order.id}</p>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                            <span>Đặt lúc {new Date(order.orderDate).toLocaleString("vi-VN")}</span>
                            <span>•</span>
                            <span>Khách: {order.buyerEmail || "N/A"}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="text-sm text-muted-foreground">Tổng</p>
                            <p className="font-bold text-lg text-foreground">{order.total.toLocaleString("vi-VN")}₫</p>
                          </div>
                          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-semibold ${getStatusColor(order.status)}`}>
                            {getStatusIcon(order.status)}
                            {getStatusLabel(order.status)}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Order Body */}
                    <div className="p-6">
                      {/* Items */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-3">Sản phẩm ({order.items.length})</h4>
                          <div className="space-y-2">
                            {order.items.map((item) => (
                              <div key={item.product.id} className="flex items-center gap-3">
                                <img
                                  src={item.product.image}
                                  alt={item.product.name}
                                  className="w-10 h-10 object-cover rounded"
                                />
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-foreground truncate">{item.product.name}</p>
                                  <p className="text-xs text-muted-foreground">
                                    SL: {item.quantity} × {item.product.price.toLocaleString("vi-VN")}₫
                                  </p>
                                </div>
                                <p className="text-sm font-semibold text-foreground">
                                  {(item.product.price * item.quantity).toLocaleString("vi-VN")}₫
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Shipping Info */}
                        <div>
                          <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-3">Giao hàng</h4>
                          <div className="text-sm text-foreground space-y-1">
                            <p className="font-medium">{order.shippingAddress.fullName}</p>
                            <p>{order.shippingAddress.address}</p>
                            <p>{order.shippingAddress.ward}, {order.shippingAddress.province}</p>
                            <p>{order.shippingAddress.phone}</p>
                            <p className="text-muted-foreground mt-2">
                              {order.deliveryOption.name} • {order.paymentMethod}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Status Update Actions */}
                      {order.status !== "cancelled" && order.status !== "delivered" && (
                        <div className="pt-4 border-t border-border flex items-center justify-between">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span>Tiến trình:</span>
                            {["pending", "processing", "shipped", "delivered"].map((step, idx, arr) => {
                              const statusOrder = arr.indexOf(order.status);
                              const isComplete = idx <= statusOrder;
                              return (
                                <div key={step} className="flex items-center">
                                  <div className={`w-2.5 h-2.5 rounded-full ${isComplete ? "bg-primary" : "bg-gray-300"}`} />
                                  {idx < arr.length - 1 && (
                                    <div className={`w-6 h-0.5 ${isComplete ? "bg-primary" : "bg-gray-300"}`} />
                                  )}
                                </div>
                              );
                            })}
                          </div>
                          {nextStatus && (
                            <button
                              onClick={() => handleStatusUpdate(order.id, nextStatus)}
                              className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium"
                            >
                              <ChevronRight className="w-4 h-4" />
                              Chuyển sang "{getStatusLabel(nextStatus)}"
                            </button>
                          )}
                        </div>
                      )}

                      {order.status === "cancelled" && (
                        <div className="pt-4 border-t border-border">
                          <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-3 rounded-lg">
                            <XCircle className="w-4 h-4" />
                            Đơn hàng đã bị hủy bởi khách hàng
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </>
      )}

      {/* ═══════════════════ REVIEWS TAB ═══════════════════ */}
      {activeTab === "reviews" && (
        <>
          {/* Filter by product */}
          <div className="mb-6">
            <select
              value={reviewProductFilter}
              onChange={(e) => setReviewProductFilter(e.target.value)}
              className="px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background"
            >
              <option value="all">Tất cả sản phẩm</option>
              {sellerProducts.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          {filteredReviews.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm p-12 text-center border border-border">
              <Star className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-30" />
              <h3 className="text-lg font-semibold text-foreground mb-2">Chưa có đánh giá nào</h3>
              <p className="text-muted-foreground">
                Đánh giá từ khách hàng sẽ xuất hiện ở đây.
              </p>
            </div>
          ) : (
            <>
              {/* Review Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-white p-6 rounded-lg shadow-sm border border-border">
                  <p className="text-sm text-muted-foreground">Tổng đánh giá</p>
                  <p className="text-3xl font-bold text-foreground mt-1">{filteredReviews.length}</p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-sm border border-border">
                  <p className="text-sm text-muted-foreground">Điểm trung bình</p>
                  <p className="text-3xl font-bold text-foreground mt-1">
                    ⭐ {(filteredReviews.reduce((s, r) => s + r.rating, 0) / filteredReviews.length).toFixed(1)}
                  </p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-sm border border-border">
                  <p className="text-sm text-muted-foreground">Đánh giá 5 sao</p>
                  <p className="text-3xl font-bold text-foreground mt-1">
                    {filteredReviews.filter((r) => r.rating === 5).length}
                  </p>
                </div>
              </div>

              {/* Reviews List */}
              <div className="space-y-4">
                {filteredReviews.map((review) => {
                  const product = products.find((p) => p.id === review.productId);
                  return (
                    <div key={review.id} className="bg-white rounded-lg shadow-sm p-6 border border-border">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-primary/10 text-primary rounded-full flex items-center justify-center font-bold text-sm">
                            {review.author.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-foreground">{review.author}</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(review.date).toLocaleDateString("vi-VN")}
                              {product && <span> • {product.name}</span>}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star
                              key={s}
                              className={`w-4 h-4 ${s <= review.rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300"}`}
                            />
                          ))}
                        </div>
                      </div>
                      <p className="text-foreground">{review.comment}</p>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </>
      )}

      {/* ═══════════════════ VOUCHERS TAB ═══════════════════ */}
      {activeTab === "vouchers" && (
        <>
          {/* Header action */}
          <div className="flex justify-between items-center mb-4">
            <p className="text-muted-foreground text-sm">
              Quản lý mã giảm giá. Kiểm tra hạng thành viên và danh mục sản phẩm khi áp dụng.
            </p>
            <button
              onClick={() => { setIsAddingVoucher(true); setEditingVoucherId(null); setVoucherForm(BLANK_VOUCHER); }}
              className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors text-sm"
            >
              <Plus className="w-4 h-4" />
              Tạo Voucher
            </button>
          </div>

          {/* Voucher Form */}
          {(isAddingVoucher || editingVoucherId) && (
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6 border border-border">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold">{isAddingVoucher ? "Tạo Voucher Mới" : "Chỉnh Sửa Voucher"}</h2>
                <button onClick={() => { setIsAddingVoucher(false); setEditingVoucherId(null); }} className="text-muted-foreground hover:text-foreground">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Code */}
                <div>
                  <label className="block text-sm font-semibold mb-1">Mã Voucher *</label>
                  <input
                    type="text"
                    value={voucherForm.code || ""}
                    onChange={(e) => setVoucherForm({ ...voucherForm, code: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background text-sm uppercase"
                    placeholder="VD: SUMMER20"
                  />
                </div>

                {/* Discount Type */}
                <div>
                  <label className="block text-sm font-semibold mb-1">Loại Giảm Giá *</label>
                  <select
                    value={voucherForm.discountType || "percent"}
                    onChange={(e) => setVoucherForm({ ...voucherForm, discountType: e.target.value as "percent" | "fixed" })}
                    className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background text-sm"
                  >
                    <option value="percent">Phần trăm (%)</option>
                    <option value="fixed">Số tiền cố định (₫)</option>
                  </select>
                </div>

                {/* Discount Value */}
                <div>
                  <label className="block text-sm font-semibold mb-1">
                    Giá Trị Giảm * {voucherForm.discountType === "percent" ? "(%)" : "(₫)"}
                  </label>
                  <input
                    type="number"
                    value={voucherForm.discountValue || ""}
                    onChange={(e) => setVoucherForm({ ...voucherForm, discountValue: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background text-sm"
                    min={1}
                    max={voucherForm.discountType === "percent" ? 100 : undefined}
                  />
                </div>

                {/* Min Order Value */}
                <div>
                  <label className="block text-sm font-semibold mb-1">Đơn Hàng Tối Thiểu (₫) *</label>
                  <input
                    type="number"
                    step="10000"
                    value={voucherForm.minOrderValue ?? ""}
                    onChange={(e) => setVoucherForm({ ...voucherForm, minOrderValue: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background text-sm"
                  />
                </div>

                {/* Max Discount (only for percent) */}
                {voucherForm.discountType === "percent" && (
                  <div>
                    <label className="block text-sm font-semibold mb-1">Giảm Tối Đa (₫, tùy chọn)</label>
                    <input
                      type="number"
                      step="10000"
                      value={voucherForm.maxDiscountAmount ?? ""}
                      onChange={(e) => setVoucherForm({ ...voucherForm, maxDiscountAmount: e.target.value ? parseFloat(e.target.value) : undefined })}
                      className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background text-sm"
                      placeholder="Để trống = không giới hạn"
                    />
                  </div>
                )}

                {/* Usage Limit */}
                <div>
                  <label className="block text-sm font-semibold mb-1">Giới Hạn Sử Dụng (tùy chọn)</label>
                  <input
                    type="number"
                    value={voucherForm.usageLimit ?? ""}
                    onChange={(e) => setVoucherForm({ ...voucherForm, usageLimit: e.target.value ? parseInt(e.target.value) : undefined })}
                    className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background text-sm"
                    placeholder="Để trống = không giới hạn"
                  />
                </div>

                {/* Expiry Date */}
                <div>
                  <label className="block text-sm font-semibold mb-1">Ngày Hết Hạn *</label>
                  <input
                    type="date"
                    value={voucherForm.expiryDate || ""}
                    onChange={(e) => setVoucherForm({ ...voucherForm, expiryDate: e.target.value })}
                    className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background text-sm"
                  />
                </div>

                {/* Applicable Ranks */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold mb-2">Hạng Thành Viên Áp Dụng</label>
                  <div className="flex flex-wrap gap-2">
                    {["all", "standard", "silver", "gold", "platinum"].map((rank) => {
                      const selected = (voucherForm.applicableRanks || []).includes(rank);
                      const rankLabel: Record<string, string> = { all: "Tất cả", standard: "Thường", silver: "Bạc", gold: "Vàng", platinum: "Kim Cương" };
                      return (
                        <button
                          key={rank}
                          type="button"
                          onClick={() => {
                            const current = voucherForm.applicableRanks || [];
                            if (rank === "all") {
                              setVoucherForm({ ...voucherForm, applicableRanks: ["all"] });
                            } else {
                              const without = current.filter(r => r !== "all" && r !== rank);
                              const next = selected ? without : [...without, rank];
                              setVoucherForm({ ...voucherForm, applicableRanks: next.length === 0 ? ["all"] : next });
                            }
                          }}
                          className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                            selected ? "bg-primary text-white border-primary" : "bg-background text-muted-foreground border-border hover:border-primary"
                          }`}
                        >
                          {rankLabel[rank]}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Applicable Categories */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold mb-2">Danh Mục Sản Phẩm Áp Dụng</label>
                  <div className="flex flex-wrap gap-2">
                    {["all", ...Array.from(new Set(products.map(p => p.category)))].map((cat) => {
                      const selected = (voucherForm.applicableCategories || []).includes(cat);
                      return (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => {
                            const current = voucherForm.applicableCategories || [];
                            if (cat === "all") {
                              setVoucherForm({ ...voucherForm, applicableCategories: ["all"] });
                            } else {
                              const without = current.filter(c => c !== "all" && c !== cat);
                              const next = selected ? without : [...without, cat];
                              setVoucherForm({ ...voucherForm, applicableCategories: next.length === 0 ? ["all"] : next });
                            }
                          }}
                          className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                            selected ? "bg-primary text-white border-primary" : "bg-background text-muted-foreground border-border hover:border-primary"
                          }`}
                        >
                          {cat === "all" ? "Tất cả" : cat}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Description */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold mb-1">Mô Tả *</label>
                  <input
                    type="text"
                    value={voucherForm.description || ""}
                    onChange={(e) => setVoucherForm({ ...voucherForm, description: e.target.value })}
                    className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background text-sm"
                    placeholder="Mô tả ngắn gọn về voucher này"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-4">
                <button
                  onClick={() => {
                    // Validation
                    if (!voucherForm.code?.trim()) { toast.error("Cần nhập mã voucher"); return; }
                    if (!voucherForm.discountValue || voucherForm.discountValue <= 0) { toast.error("Cần nhập giá trị giảm giá hợp lệ"); return; }
                    if (!voucherForm.expiryDate) { toast.error("Cần chọn ngày hết hạn"); return; }
                    if (!voucherForm.description?.trim()) { toast.error("Cần nhập mô tả"); return; }
                    if (voucherForm.minOrderValue === undefined || voucherForm.minOrderValue < 0) { toast.error("Cần nhập giá trị đơn hàng tối thiểu"); return; }

                    if (isAddingVoucher) {
                      // Check duplicate code
                      if (vouchers.some(v => v.code.toUpperCase() === voucherForm.code?.toUpperCase())) {
                        toast.error("Mã voucher này đã tồn tại");
                        return;
                      }
                      addVoucher({
                        ...voucherForm,
                        id: `vc-${Date.now()}`,
                        usedCount: 0,
                        isActive: true,
                      } as Voucher);
                      toast.success("Tạo voucher thành công");
                    } else if (editingVoucherId) {
                      updateVoucher({ ...voucherForm, id: editingVoucherId } as Voucher);
                      toast.success("Cập nhật voucher thành công");
                    }
                    setIsAddingVoucher(false);
                    setEditingVoucherId(null);
                  }}
                  className="flex items-center gap-2 bg-primary text-white px-5 py-2 rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium"
                >
                  <Save className="w-4 h-4" />
                  {isAddingVoucher ? "Tạo Voucher" : "Lưu Thay Đổi"}
                </button>
                <button
                  onClick={() => { setIsAddingVoucher(false); setEditingVoucherId(null); }}
                  className="border border-border px-5 py-2 rounded-lg hover:bg-muted transition-colors text-sm"
                >
                  Hủy
                </button>
              </div>
            </div>
          )}

          {/* Voucher List */}
          <div className="bg-white rounded-lg shadow-sm border border-border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted border-b border-border">
                  <tr>
                    <th className="text-left px-4 py-3 text-foreground">Mã</th>
                    <th className="text-left px-4 py-3 text-foreground">Mô Tả</th>
                    <th className="text-left px-4 py-3 text-foreground">Giảm Giá</th>
                    <th className="text-left px-4 py-3 text-foreground">Hạng</th>
                    <th className="text-left px-4 py-3 text-foreground">Danh Mục</th>
                    <th className="text-left px-4 py-3 text-foreground">Hết Hạn</th>
                    <th className="text-center px-4 py-3 text-foreground">Sử Dụng</th>
                    <th className="text-center px-4 py-3 text-foreground">Trạng Thái</th>
                    <th className="text-right px-4 py-3 text-foreground">Hành Động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {vouchers.length === 0 && (
                    <tr><td colSpan={9} className="text-center py-12 text-muted-foreground">
                      <Tag className="w-10 h-10 mx-auto mb-2 opacity-20" />
                      <p>Chưa có voucher nào.
                    </p></td></tr>
                  )}
                  {vouchers.map((v) => {
                    const isExpired = new Date(v.expiryDate) < new Date();
                    const rankColors: Record<string, string> = { all: "bg-gray-100 text-gray-700", standard: "bg-gray-100 text-gray-700", silver: "bg-slate-100 text-slate-700", gold: "bg-yellow-100 text-yellow-800", platinum: "bg-purple-100 text-purple-800" };
                    return (
                      <tr key={v.id} className={`hover:bg-muted/40 ${!v.isActive || isExpired ? "opacity-50" : ""}`}>
                        <td className="px-4 py-3">
                          <span className="font-mono font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">{v.code}</span>
                        </td>
                        <td className="px-4 py-3 max-w-[180px]">
                          <p className="truncate text-foreground">{v.description}</p>
                          {v.minOrderValue > 0 && (
                            <p className="text-xs text-muted-foreground">Tối thiểu: {v.minOrderValue.toLocaleString("vi-VN")}₫</p>
                          )}
                        </td>
                        <td className="px-4 py-3 font-semibold text-green-700">
                          {v.discountType === "percent" ? `${v.discountValue}%` : `${v.discountValue.toLocaleString("vi-VN")}₫`}
                          {v.maxDiscountAmount && (
                            <p className="text-xs text-muted-foreground font-normal">tối đa {v.maxDiscountAmount.toLocaleString("vi-VN")}₫</p>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-1">
                            {v.applicableRanks.map(r => (
                              <span key={r} className={`inline-block text-xs px-1.5 py-0.5 rounded-full font-medium ${rankColors[r] || "bg-gray-100 text-gray-700"}`}>
                                {r === "all" ? "Tất cả" : r === "standard" ? "Thường" : r === "silver" ? "Bạc" : r === "gold" ? "Vàng" : "Kim Cương"}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-1">
                            {v.applicableCategories.map(c => (
                              <span key={c} className="inline-block text-xs bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded-full">
                                {c === "all" ? "Tất cả" : c}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={isExpired ? "text-red-600 font-semibold" : "text-foreground"}>
                            {new Date(v.expiryDate).toLocaleDateString("vi-VN")}
                            {isExpired && <span className="block text-xs text-red-500">Hết hạn</span>}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="font-semibold">{v.usedCount}</span>
                          {v.usageLimit && <span className="text-muted-foreground">/{v.usageLimit}</span>}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => updateVoucher({ ...v, isActive: !v.isActive })}
                            className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold transition-colors ${
                              v.isActive ? "bg-green-100 text-green-800 hover:bg-green-200" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                            }`}
                            title={v.isActive ? "Vô hiệu hóa" : "Kích hoạt"}
                          >
                            {v.isActive ? <ToggleRight className="w-3 h-3" /> : <ToggleLeft className="w-3 h-3" />}
                            {v.isActive ? "Hoạt động" : "Tắt"}
                          </button>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex justify-end gap-1">
                            <button
                              onClick={() => { setEditingVoucherId(v.id); setVoucherForm({ ...v }); setIsAddingVoucher(false); }}
                              className="p-1.5 text-primary hover:bg-accent rounded transition-colors"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                if (confirm(`Xóa voucher "${v.code}"?`)) { deleteVoucher(v.id); toast.success("Xóa voucher thành công"); }
                              }}
                              className="p-1.5 text-destructive hover:bg-destructive/10 rounded transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* ═══════════════════ SETTINGS TAB ═══════════════════ */}
      {activeTab === "settings" && (
        <div className="max-w-2xl">
          <div className="bg-white rounded-lg shadow-sm p-6 border border-border">
            <div className="flex items-center gap-3 mb-6">
              <Store className="w-6 h-6 text-primary" />
              <h2 className="text-xl font-bold text-foreground">Thông Tin Cửa Hàng</h2>
            </div>

            <form onSubmit={handleSaveStoreProfile} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-1">Tên Cửa Hàng *</label>
                <input
                  type="text"
                  value={storeForm.shopName}
                  onChange={(e) => setStoreForm({ ...storeForm, shopName: e.target.value })}
                  className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1">Mô Tả Cửa Hàng</label>
                <textarea
                  value={storeForm.shopDescription}
                  onChange={(e) => setStoreForm({ ...storeForm, shopDescription: e.target.value })}
                  className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background"
                  rows={4}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1">Địa Chỉ</label>
                <input
                  type="text"
                  value={storeForm.shopAddress}
                  onChange={(e) => setStoreForm({ ...storeForm, shopAddress: e.target.value })}
                  className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-1">Số Điện Thoại</label>
                  <input
                    type="tel"
                    value={storeForm.shopPhone}
                    onChange={(e) => setStoreForm({ ...storeForm, shopPhone: e.target.value })}
                    className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1">Email Liên Hệ</label>
                  <input
                    type="email"
                    value={storeForm.shopEmail}
                    onChange={(e) => setStoreForm({ ...storeForm, shopEmail: e.target.value })}
                    className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background"
                  />
                </div>
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  className="flex items-center gap-2 bg-primary text-white px-6 py-2.5 rounded-lg hover:bg-primary/90 transition-colors font-medium"
                >
                  <Save className="w-5 h-5" />
                  Lưu Thông Tin
                </button>
              </div>
            </form>
          </div>

          {/* Seller Account Info */}
          <div className="bg-white rounded-lg shadow-sm p-6 border border-border mt-6">
            <h3 className="font-bold text-foreground mb-4">Thông Tin Tài Khoản</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between py-2 border-b border-border">
                <span className="text-muted-foreground">Tên người bán</span>
                <span className="font-medium text-foreground">{profile.name}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-border">
                <span className="text-muted-foreground">Email</span>
                <span className="font-medium text-foreground">{profile.email}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-border">
                <span className="text-muted-foreground">Số điện thoại</span>
                <span className="font-medium text-foreground">{profile.phone}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-muted-foreground">Số sản phẩm</span>
                <span className="font-medium text-foreground">{sellerProducts.length}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
