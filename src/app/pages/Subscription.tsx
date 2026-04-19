import { useState } from "react";
import { Link } from "react-router";
import { useShop } from "../context/ShopContext";
import { useAuth } from "../context/AuthContext";
import { Package, CalendarDays, Leaf, ArrowRight, Check, ShoppingCart, Pause, Play, X } from "lucide-react";
import { toast } from "sonner";

interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  frequency: string;
  icon: string;
  color: string;
  gradientFrom: string;
  gradientTo: string;
  features: string[];
  sampleProducts: string[];
}

const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: "weekly-veg",
    name: "Combo Rau Gia Đình",
    description: "Rau củ hữu cơ tươi mỗi tuần cho bữa ăn lành mạnh. Rau được thu hoạch sáng sớm và giao trong ngày.",
    price: 250000,
    frequency: "Hàng tuần",
    icon: "🥬",
    color: "green",
    gradientFrom: "from-green-500",
    gradientTo: "to-emerald-600",
    features: [
      "4-6 loại rau củ tươi mỗi tuần",
      "Rau hữu cơ Đà Lạt, VietGAP",
      "Giao sáng sớm (6:00 - 8:00)",
      "Thay đổi rau theo mùa",
      "Tạm dừng / đổi lịch bất kỳ lúc nào",
    ],
    sampleProducts: ["Rau Hữu Cơ Đà Lạt", "Cà chua bi", "Dưa leo", "Bông cải", "Rau muống", "Bí ngồi"],
  },
  {
    id: "biweekly-fruit",
    name: "Combo Trái Cây Mùa",
    description: "Trái cây theo mùa, tuyển chọn từ các vườn nổi tiếng. Luôn tươi ngon và đúng mùa vụ.",
    price: 350000,
    frequency: "2 tuần / lần",
    icon: "🍉",
    color: "orange",
    gradientFrom: "from-orange-500",
    gradientTo: "to-amber-600",
    features: [
      "3-5 loại trái cây theo mùa",
      "Tuyển chọn từ vườn VietGAP/GlobalGAP",
      "Đóng gói bảo quản lạnh",
      "Giao hàng linh hoạt",
      "Miễn phí giao nội thành",
    ],
    sampleProducts: ["Xoài Cát Hòa Lộc", "Thanh Long Ruột Đỏ", "Chôm Chôm Bến Tre", "Bưởi da xanh"],
  },
  {
    id: "monthly-special",
    name: "Combo Đặc Sản Vùng Miền",
    description: "Khám phá đặc sản từ khắp các vùng miền Việt Nam. Mỗi tháng một câu chuyện ẩm thực mới.",
    price: 500000,
    frequency: "Hàng tháng",
    icon: "🎁",
    color: "purple",
    gradientFrom: "from-purple-500",
    gradientTo: "to-indigo-600",
    features: [
      "5-8 sản phẩm đặc sản thay đổi",
      "Kèm câu chuyện vùng miền",
      "Trà, gia vị, mắm, đặc sản khô",
      "Bao bì quà tặng cao cấp",
      "Giảm 10% cho đơn từ tháng thứ 3",
    ],
    sampleProducts: ["Hồ Tiêu Phú Quốc", "Nước Mắm Phú Quốc", "Trà Xanh Thái Nguyên", "Măng Khô Tây Nguyên"],
  },
];

export function Subscription() {
  const { role } = useAuth();
  const isCustomer = role === "consumer";
  const [subscribedPlan, setSubscribedPlan] = useState<string | null>(() => {
    return localStorage.getItem("subscriptionPlan");
  });
  const [pausedPlan, setPausedPlan] = useState<boolean>(() => {
    return localStorage.getItem("subscriptionPaused") === "true";
  });

  const handleSubscribe = (planId: string) => {
    if (!isCustomer) {
      toast.error("Vui lòng đăng nhập tài khoản khách hàng để đăng ký gói");
      return;
    }
    setSubscribedPlan(planId);
    setPausedPlan(false);
    localStorage.setItem("subscriptionPlan", planId);
    localStorage.removeItem("subscriptionPaused");
    toast.success("Đăng ký gói thành công! 🎉");
  };

  const handlePause = () => {
    setPausedPlan(true);
    localStorage.setItem("subscriptionPaused", "true");
    toast.success("Đã tạm dừng gói định kỳ");
  };

  const handleResume = () => {
    setPausedPlan(false);
    localStorage.removeItem("subscriptionPaused");
    toast.success("Đã tiếp tục gói định kỳ");
  };

  const handleCancel = () => {
    setSubscribedPlan(null);
    setPausedPlan(false);
    localStorage.removeItem("subscriptionPlan");
    localStorage.removeItem("subscriptionPaused");
    toast.success("Đã hủy gói định kỳ");
  };

  const activePlan = SUBSCRIPTION_PLANS.find((p) => p.id === subscribedPlan);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-50 rounded-full text-green-700 text-sm font-semibold mb-4">
          <CalendarDays className="w-4 h-4" />
          Giao hàng định kỳ
        </div>
        <h1 className="text-foreground font-bold mb-3">Gói Mua Hàng Định Kỳ</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Nhận nông sản tươi ngon đến tận nhà theo lịch trình bạn chọn. Tiết kiệm thời gian, luôn có thực phẩm sạch cho gia đình.
        </p>
      </div>

      {/* Active Subscription Banner */}
      {activePlan && (
        <div className={`mb-10 rounded-xl overflow-hidden shadow-lg bg-gradient-to-r ${activePlan.gradientFrom} ${activePlan.gradientTo}`}>
          <div className="p-6 md:p-8 text-white">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <span className="text-4xl">{activePlan.icon}</span>
                <div>
                  <p className="text-white/80 text-sm font-medium">Gói đang hoạt động</p>
                  <h3 className="text-xl font-bold">{activePlan.name}</h3>
                  <p className="text-white/80 text-sm mt-1">
                    {activePlan.price.toLocaleString("vi-VN")}₫ / {activePlan.frequency.toLowerCase()}
                    {pausedPlan && (
                      <span className="ml-2 inline-flex items-center gap-1 bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-0.5 rounded-full">
                        <Pause className="w-3 h-3" /> Tạm dừng
                      </span>
                    )}
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                {pausedPlan ? (
                  <button
                    onClick={handleResume}
                    className="flex items-center gap-2 bg-white text-green-700 px-4 py-2 rounded-lg font-semibold text-sm hover:bg-white/90 transition-colors"
                  >
                    <Play className="w-4 h-4" /> Tiếp tục
                  </button>
                ) : (
                  <button
                    onClick={handlePause}
                    className="flex items-center gap-2 bg-white/20 text-white px-4 py-2 rounded-lg font-semibold text-sm hover:bg-white/30 transition-colors"
                  >
                    <Pause className="w-4 h-4" /> Tạm dừng
                  </button>
                )}
                <button
                  onClick={handleCancel}
                  className="flex items-center gap-2 bg-white/20 text-white px-4 py-2 rounded-lg font-semibold text-sm hover:bg-red-500 hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" /> Hủy gói
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Subscription Plans */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {SUBSCRIPTION_PLANS.map((plan) => {
          const isActive = subscribedPlan === plan.id;

          return (
            <div
              key={plan.id}
              className={`bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all border-2 ${
                isActive ? "border-primary ring-2 ring-primary/20" : "border-border"
              }`}
            >
              {/* Plan Header */}
              <div className={`bg-gradient-to-r ${plan.gradientFrom} ${plan.gradientTo} p-6 text-white`}>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-4xl">{plan.icon}</span>
                  {isActive && (
                    <span className="bg-white text-green-700 text-xs font-bold px-3 py-1 rounded-full">
                      Đang dùng
                    </span>
                  )}
                </div>
                <h3 className="text-xl font-bold mb-1">{plan.name}</h3>
                <p className="text-white/80 text-sm">{plan.description}</p>
              </div>

              {/* Price */}
              <div className="px-6 py-4 border-b border-border bg-gray-50">
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold text-foreground">
                    {plan.price.toLocaleString("vi-VN")}₫
                  </span>
                  <span className="text-muted-foreground text-sm">/ {plan.frequency.toLowerCase()}</span>
                </div>
              </div>

              {/* Features */}
              <div className="p-6">
                <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-4">
                  Bao gồm
                </h4>
                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2 text-sm text-foreground">
                      <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                      {feature}
                    </li>
                  ))}
                </ul>

                {/* Sample Products */}
                <div className="mb-6">
                  <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-3">
                    Sản phẩm mẫu
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {plan.sampleProducts.map((product) => (
                      <span
                        key={product}
                        className="text-xs bg-accent text-foreground px-2 py-1 rounded-full"
                      >
                        {product}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Subscribe Button */}
                <button
                  onClick={() => handleSubscribe(plan.id)}
                  disabled={isActive}
                  className={`w-full py-3 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2 ${
                    isActive
                      ? "bg-green-100 text-green-700 cursor-default"
                      : "bg-primary text-white hover:bg-primary/90"
                  }`}
                >
                  {isActive ? (
                    <>
                      <Check className="w-5 h-5" />
                      Đã đăng ký
                    </>
                  ) : (
                    <>
                      <ShoppingCart className="w-5 h-5" />
                      Đăng Ký Gói Này
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* How It Works */}
      <div className="mt-16 bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-8 md:p-12">
        <h2 className="text-center text-foreground font-bold mb-8">Cách Hoạt Động</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[
            { step: 1, icon: "📦", title: "Chọn Gói", desc: "Chọn gói phù hợp với nhu cầu gia đình bạn" },
            { step: 2, icon: "📅", title: "Chọn Lịch", desc: "Chọn tần suất và khung giờ giao hàng" },
            { step: 3, icon: "🚚", title: "Nhận Hàng", desc: "Nông sản tươi được giao đến tận nhà" },
            { step: 4, icon: "🔄", title: "Linh Hoạt", desc: "Tạm dừng, đổi gói hoặc hủy bất kỳ lúc nào" },
          ].map((item) => (
            <div key={item.step} className="text-center">
              <div className="text-3xl mb-3">{item.icon}</div>
              <div className="inline-flex items-center justify-center w-8 h-8 bg-green-600 text-white rounded-full text-sm font-bold mb-2">
                {item.step}
              </div>
              <h3 className="font-bold text-foreground mb-1">{item.title}</h3>
              <p className="text-sm text-muted-foreground">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* FAQ */}
      <div className="mt-12 text-center">
        <p className="text-muted-foreground">
          Có thắc mắc về gói định kỳ?{" "}
          <Link to="/contact" className="text-primary hover:underline font-semibold">
            Liên hệ chúng tôi
          </Link>
        </p>
      </div>
    </div>
  );
}
