import { useState } from "react";
import { Link } from "react-router";
import { useAuth } from "../context/AuthContext";
import { useShop } from "../context/ShopContext";
import { CUSTOMER_TIERS } from "../data/products";
import {
  UserCircle,
  Save,
  Heart,
  Package,
  ShoppingCart,
  Award,
  MapPin,
  Mail,
  Phone,
  User,
} from "lucide-react";
import { toast } from "sonner";

export function Profile() {
  const { role, profile, updateProfile } = useAuth();
  const { orders, wishlist, customerTier, getCartCount } = useShop();

  if (!role) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center">
          <UserCircle className="w-24 h-24 text-gray-300 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Đăng nhập để xem tài khoản</h2>
          <p className="text-muted-foreground mb-8">
            Hồ sơ tài khoản chỉ khả dụng sau khi đăng nhập.
          </p>
          <Link
            to="/auth"
            className="inline-flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-lg hover:bg-primary/90 transition-colors"
          >
            Đăng nhập
          </Link>
        </div>
      </div>
    );
  }

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState(profile);

  const handleSave = () => {
    if (!formData.name.trim()) {
      toast.error("Vui lòng nhập họ tên");
      return;
    }
    updateProfile(formData);
    setIsEditing(false);
    toast.success("Thông tin đã được cập nhật");
  };

  const handleCancel = () => {
    setFormData(profile);
    setIsEditing(false);
  };

  const tierInfo = CUSTOMER_TIERS[customerTier];

  const tierColors: Record<string, string> = {
    standard: "bg-gray-100 text-gray-800 border-gray-300",
    silver: "bg-slate-100 text-slate-800 border-slate-400",
    gold: "bg-yellow-50 text-yellow-800 border-yellow-400",
    platinum: "bg-purple-50 text-purple-800 border-purple-400",
  };

  // Collect unique addresses from orders
  const savedAddresses = orders
    .map((o) => o.shippingAddress)
    .filter(
      (addr, idx, arr) =>
        arr.findIndex(
          (a) =>
            a.address === addr.address &&
            a.ward === addr.ward &&
            a.province === addr.province
        ) === idx
    )
    .slice(0, 3);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center gap-3 mb-8">
        <UserCircle className="w-8 h-8 text-primary" />
        <div>
          <h1 className="text-foreground">Tài Khoản Của Tôi</h1>
          <p className="text-muted-foreground">
            Quản lý thông tin cá nhân và cài đặt tài khoản
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Personal Info Card */}
          <div className="bg-white rounded-lg shadow-sm p-6 border border-border">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                <User className="w-5 h-5 text-primary" />
                Thông Tin Cá Nhân
              </h2>
              {!isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="text-primary hover:text-primary/80 text-sm font-semibold"
                >
                  Chỉnh Sửa
                </button>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={handleSave}
                    className="flex items-center gap-1 bg-primary text-white px-3 py-1.5 rounded-lg text-sm hover:bg-primary/90 transition-colors"
                  >
                    <Save className="w-4 h-4" />
                    Lưu
                  </button>
                  <button
                    onClick={handleCancel}
                    className="px-3 py-1.5 border border-border rounded-lg text-sm hover:bg-muted transition-colors"
                  >
                    Hủy
                  </button>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-1 text-foreground">
                  <User className="w-4 h-4 inline mr-1" />
                  Họ và Tên
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background"
                    placeholder="Nguyễn Văn A"
                  />
                ) : (
                  <p className="text-foreground px-4 py-2 bg-muted rounded-lg">
                    {profile.name || "Chưa cập nhật"}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1 text-foreground">
                  <Mail className="w-4 h-4 inline mr-1" />
                  Email
                </label>
                {isEditing ? (
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background"
                    placeholder="email@example.com"
                  />
                ) : (
                  <p className="text-foreground px-4 py-2 bg-muted rounded-lg">
                    {profile.email || "Chưa cập nhật"}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1 text-foreground">
                  <Phone className="w-4 h-4 inline mr-1" />
                  Số Điện Thoại
                </label>
                {isEditing ? (
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background"
                    placeholder="0901 234 567"
                  />
                ) : (
                  <p className="text-foreground px-4 py-2 bg-muted rounded-lg">
                    {profile.phone || "Chưa cập nhật"}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1 text-foreground">
                  Vai Trò
                </label>
                <p className="text-foreground px-4 py-2 bg-muted rounded-lg capitalize">
                  {role === "consumer"
                    ? "Người Tiêu Dùng"
                    : role === "seller"
                    ? "Người Bán Hàng"
                    : "Chưa đăng nhập"}
                </p>
              </div>
            </div>
          </div>

          {/* Saved Addresses */}
          <div className="bg-white rounded-lg shadow-sm p-6 border border-border">
            <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-primary" />
              Địa Chỉ Đã Lưu
            </h2>
            {savedAddresses.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                Chưa có địa chỉ nào được lưu. Địa chỉ sẽ được lưu tự động sau
                khi bạn đặt hàng lần đầu.
              </p>
            ) : (
              <div className="space-y-3">
                {savedAddresses.map((addr, idx) => (
                  <div
                    key={idx}
                    className="p-4 bg-background rounded-lg border border-border"
                  >
                    <p className="font-semibold text-foreground">
                      {addr.fullName}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {addr.address}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {addr.ward}, {addr.province}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {addr.phone}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Tier Card */}
          <div
            className={`rounded-lg p-6 border-2 ${tierColors[customerTier]}`}
          >
            <div className="flex items-center gap-3 mb-3">
              <Award className="w-8 h-8" />
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider opacity-70">
                  Hạng Thành Viên
                </p>
                <p className="text-xl font-bold">{tierInfo.name}</p>
              </div>
            </div>
            {tierInfo.discount > 0 && (
              <p className="text-sm font-semibold">
                Giảm {tierInfo.discount}% trên tất cả sản phẩm
              </p>
            )}
          </div>

          {/* Quick Links */}
          <div className="bg-white rounded-lg shadow-sm border border-border overflow-hidden">
            <h3 className="font-bold text-foreground p-4 border-b border-border">
              Truy Cập Nhanh
            </h3>
            <div className="divide-y divide-border">
              <Link
                to="/orders"
                className="flex items-center gap-3 p-4 hover:bg-muted transition-colors"
              >
                <Package className="w-5 h-5 text-primary" />
                <div className="flex-1">
                  <p className="font-semibold text-foreground text-sm">
                    Đơn Hàng
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {orders.length} đơn hàng
                  </p>
                </div>
              </Link>
              <Link
                to="/wishlist"
                className="flex items-center gap-3 p-4 hover:bg-muted transition-colors"
              >
                <Heart className="w-5 h-5 text-primary" />
                <div className="flex-1">
                  <p className="font-semibold text-foreground text-sm">
                    Yêu Thích
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {wishlist.length} sản phẩm
                  </p>
                </div>
              </Link>
              <Link
                to="/cart"
                className="flex items-center gap-3 p-4 hover:bg-muted transition-colors"
              >
                <ShoppingCart className="w-5 h-5 text-primary" />
                <div className="flex-1">
                  <p className="font-semibold text-foreground text-sm">
                    Giỏ Hàng
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {getCartCount()} sản phẩm
                  </p>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
