import { Link } from "react-router";
import { useShop } from "../context/ShopContext";
import { useAuth } from "../context/AuthContext";
import { Crown, Star, Gift, Percent, TrendingUp, ShieldCheck, Truck, Award } from "lucide-react";
import { CUSTOMER_TIERS } from "../data/products";
import type { CustomerTier } from "../data/products";

const TIER_DETAILS: Record<
  CustomerTier,
  { icon: string; benefits: string[]; requirement: string; color: string; bgGradient: string }
> = {
  standard: {
    icon: "🌱",
    benefits: [
      "Truy cập đầy đủ sản phẩm",
      "Hỗ trợ khách hàng 24/7",
      "Giao hàng tiêu chuẩn",
    ],
    requirement: "Mặc định",
    color: "from-gray-400 to-gray-500",
    bgGradient: "from-gray-50 to-gray-100",
  },
  silver: {
    icon: "🥈",
    benefits: [
      "Giảm 5% tất cả sản phẩm",
      "Giao hàng ưu tiên",
      "Voucher sinh nhật 50.000₫",
      "Thông báo sớm sản phẩm mới",
    ],
    requirement: "Tổng đơn hàng từ 1.000.000₫",
    color: "from-slate-400 to-slate-500",
    bgGradient: "from-slate-50 to-slate-100",
  },
  gold: {
    icon: "🥇",
    benefits: [
      "Giảm 10% tất cả sản phẩm",
      "Giao hàng nhanh miễn phí",
      "Voucher sinh nhật 100.000₫",
      "Ưu tiên hỗ trợ qua Zalo/Hotline",
      "Quà tặng mùa vụ đặc biệt",
    ],
    requirement: "Tổng đơn hàng từ 5.000.000₫",
    color: "from-yellow-500 to-amber-500",
    bgGradient: "from-yellow-50 to-amber-50",
  },
  platinum: {
    icon: "💎",
    benefits: [
      "Giảm 15% tất cả sản phẩm",
      "Giao hàng nhanh / trong ngày miễn phí",
      "Voucher sinh nhật 200.000₫",
      "Hotline riêng VIP",
      "Ưu tiên mua sản phẩm giới hạn",
      "Quà tặng đặc sản hàng quý",
      "Mời tham quan nông trại",
    ],
    requirement: "Tổng đơn hàng từ 15.000.000₫",
    color: "from-purple-500 to-indigo-600",
    bgGradient: "from-purple-50 to-indigo-50",
  },
};

const VOUCHERS = [
  { code: "TUOIMOI10", discount: "Giảm 10% đơn rau củ", minOrder: "200.000₫", expiry: "30/06/2026", icon: "🥬" },
  { code: "TRAICAY50K", discount: "Giảm 50.000₫ đơn trái cây", minOrder: "300.000₫", expiry: "31/05/2026", icon: "🍎" },
  { code: "FREESHIP", discount: "Miễn phí giao hàng", minOrder: "150.000₫", expiry: "30/04/2026", icon: "🚚" },
];

export function Loyalty() {
  const { role } = useAuth();
  const { orders, customerTier } = useShop();
  const isCustomer = role === "consumer";

  // Calculate total spent & points from orders
  const totalSpent = orders
    .filter((o) => o.status === "delivered")
    .reduce((sum, o) => sum + o.total, 0);
  const totalPoints = Math.floor(totalSpent / 1000);

  // Next tier calculation
  const tierOrder: CustomerTier[] = ["standard", "silver", "gold", "platinum"];
  const currentTierIndex = tierOrder.indexOf(customerTier);
  const nextTier = currentTierIndex < tierOrder.length - 1 ? tierOrder[currentTierIndex + 1] : null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-50 rounded-full text-amber-700 text-sm font-semibold mb-4">
          <Crown className="w-4 h-4" />
          Chương trình thành viên
        </div>
        <h1 className="text-foreground font-bold mb-3">Khách Hàng Thân Thiết</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Tích điểm mỗi đơn hàng, hưởng ưu đãi theo hạng thành viên. Mỗi 1.000₫ chi tiêu = 1 điểm thưởng.
        </p>
      </div>

      {/* Current Status */}
      {isCustomer && (
        <div className={`mb-10 rounded-xl overflow-hidden shadow-lg bg-gradient-to-r ${TIER_DETAILS[customerTier].color}`}>
          <div className="p-6 md:p-8 text-white">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
              <div className="flex items-center gap-4">
                <span className="text-5xl">{TIER_DETAILS[customerTier].icon}</span>
                <div>
                  <p className="text-white/80 text-sm">Hạng hiện tại</p>
                  <h3 className="text-2xl font-bold">{CUSTOMER_TIERS[customerTier].name}</h3>
                </div>
              </div>
              <div className="text-center">
                <p className="text-white/80 text-sm">Tổng điểm tích lũy</p>
                <p className="text-3xl font-bold">{totalPoints.toLocaleString("vi-VN")}</p>
                <p className="text-white/60 text-xs mt-1">≈ {totalSpent.toLocaleString("vi-VN")}₫ đã chi tiêu</p>
              </div>
              <div className="text-center md:text-right">
                <p className="text-white/80 text-sm">Giảm giá hiện tại</p>
                <p className="text-3xl font-bold">{CUSTOMER_TIERS[customerTier].discount}%</p>
                <p className="text-white/60 text-xs mt-1">Áp dụng tự động</p>
              </div>
            </div>

            {/* Progress to next tier */}
            {nextTier && (
              <div className="mt-6 pt-6 border-t border-white/20">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-white/80">
                    Tiến trình lên hạng {CUSTOMER_TIERS[nextTier].name}
                  </span>
                  <span className="font-semibold">{TIER_DETAILS[nextTier].requirement}</span>
                </div>
                <div className="w-full bg-white/20 rounded-full h-2.5">
                  <div
                    className="bg-white rounded-full h-2.5 transition-all"
                    style={{
                      width: `${Math.min(100, (totalSpent / (nextTier === "silver" ? 1000000 : nextTier === "gold" ? 5000000 : 15000000)) * 100)}%`,
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tier Cards */}
      <div className="mb-16">
        <h2 className="text-foreground font-bold mb-6 text-center">Bảng Quyền Lợi Thành Viên</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {tierOrder.map((tier) => {
            const details = TIER_DETAILS[tier];
            const tierInfo = CUSTOMER_TIERS[tier];
            const isCurrentTier = customerTier === tier;

            return (
              <div
                key={tier}
                className={`rounded-xl overflow-hidden border-2 transition-all ${
                  isCurrentTier
                    ? "border-primary shadow-lg scale-[1.02]"
                    : "border-border shadow-sm"
                }`}
              >
                <div className={`bg-gradient-to-r ${details.color} p-4 text-white text-center`}>
                  <span className="text-3xl block mb-2">{details.icon}</span>
                  <h3 className="font-bold text-lg">{tierInfo.name}</h3>
                  {isCurrentTier && (
                    <span className="inline-block mt-1 px-2 py-0.5 bg-white/20 rounded-full text-xs font-semibold">
                      Hạng của bạn
                    </span>
                  )}
                </div>
                <div className={`bg-gradient-to-b ${details.bgGradient} p-4`}>
                  <p className="text-center text-sm font-semibold text-foreground mb-1">
                    Giảm {tierInfo.discount}%
                  </p>
                  <p className="text-center text-xs text-muted-foreground mb-4">{details.requirement}</p>
                  <ul className="space-y-2">
                    {details.benefits.map((benefit) => (
                      <li key={benefit} className="flex items-start gap-2 text-sm text-foreground">
                        <span className="text-green-600 mt-0.5">✓</span>
                        {benefit}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Vouchers */}
      <div className="mb-12">
        <h2 className="text-foreground font-bold mb-6 flex items-center gap-2">
          <Gift className="w-6 h-6 text-primary" />
          Voucher Ưu Đãi
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {VOUCHERS.map((voucher) => (
            <div
              key={voucher.code}
              className="bg-white rounded-xl border border-border overflow-hidden shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="p-5">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-2xl">{voucher.icon}</span>
                  <div>
                    <p className="font-bold text-foreground">{voucher.discount}</p>
                    <p className="text-xs text-muted-foreground">Đơn tối thiểu {voucher.minOrder}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
                  <code className="text-sm font-mono bg-accent px-3 py-1 rounded font-bold text-primary">
                    {voucher.code}
                  </code>
                  <span className="text-xs text-muted-foreground">HSD: {voucher.expiry}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* How Points Work */}
      <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-8 md:p-12">
        <h2 className="text-center text-foreground font-bold mb-8">Cách Tích Điểm</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { icon: <ShieldCheck className="w-8 h-8 text-green-600" />, title: "Mua sắm", desc: "Mỗi 1.000₫ chi tiêu = 1 điểm. Điểm được cộng sau khi đơn hàng giao thành công." },
            { icon: <TrendingUp className="w-8 h-8 text-blue-600" />, title: "Lên hạng", desc: "Tổng chi tiêu tích lũy đạt mốc sẽ tự động lên hạng và hưởng ưu đãi tương ứng." },
            { icon: <Gift className="w-8 h-8 text-purple-600" />, title: "Đổi thưởng", desc: "Dùng điểm đổi voucher, quà tặng hoặc hưởng ưu tiên giao hàng." },
          ].map((item) => (
            <div key={item.title} className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-full shadow-sm mb-4">
                {item.icon}
              </div>
              <h3 className="font-bold text-foreground mb-2">{item.title}</h3>
              <p className="text-sm text-muted-foreground">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {!isCustomer && (
        <div className="mt-8 text-center">
          <p className="text-muted-foreground mb-4">Đăng nhập để xem hạng thành viên và tích điểm</p>
          <Link
            to="/auth"
            className="inline-flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-lg hover:bg-primary/90 transition-colors font-semibold"
          >
            Đăng Nhập Ngay
          </Link>
        </div>
      )}
    </div>
  );
}
