import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router";
import { useShop } from "../context/ShopContext";
import { useAuth } from "../context/AuthContext";
import { SubscriptionOrder, ShippingAddress } from "../types";
import { fetchProvinces, fetchWardsByProvinceCode, type Province, type Ward } from "../data/vietnam-provinces";
import { DELIVERY_SLOTS, PAYMENT_METHODS } from "../data/products";
import {
  Package, CalendarDays, Leaf, ArrowRight, Check, ShoppingCart,
  Pause, Play, X, Clock, Truck, CreditCard, MapPin, Settings,
  ChevronDown, ChevronUp, History, AlertTriangle, Edit3, Save,
  RefreshCw, Gift, Star, TrendingUp, Calendar, CheckCircle2
} from "lucide-react";
import { toast } from "sonner";

// ── Plan definitions ──────────────────────────────────────────────────────────
interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  frequency: "weekly" | "biweekly" | "monthly";
  frequencyLabel: string;
  icon: string;
  color: string;
  gradientFrom: string;
  gradientTo: string;
  features: string[];
  defaultProductIds: string[];  // Product IDs in the plan
  sampleProducts: string[];
  savings: number; // percentage saved vs individual purchases
}

const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: "weekly-veg",
    name: "Combo Rau Gia Đình",
    description: "Rau củ hữu cơ tươi mỗi tuần cho bữa ăn lành mạnh. Rau được thu hoạch sáng sớm và giao trong ngày.",
    price: 250000,
    frequency: "weekly",
    frequencyLabel: "Hàng tuần",
    icon: "🥬",
    color: "green",
    gradientFrom: "from-green-500",
    gradientTo: "to-emerald-600",
    features: [
      "4-6 loại rau củ tươi mỗi tuần",
      "Rau hữu cơ Đà Lạt, VietGAP",
      "Giao buổi sáng (8:00 - 12:00)",
      "Thay đổi rau theo mùa",
      "Tạm dừng / đổi lịch bất kỳ lúc nào",
    ],
    defaultProductIds: ["6", "3", "12"],
    sampleProducts: ["Rau Hữu Cơ Đà Lạt", "Thanh Long Ruột Đỏ", "Bưởi Da Xanh"],
    savings: 12,
  },
  {
    id: "biweekly-fruit",
    name: "Combo Trái Cây Mùa",
    description: "Trái cây theo mùa, tuyển chọn từ các vườn nổi tiếng. Luôn tươi ngon và đúng mùa vụ.",
    price: 350000,
    frequency: "biweekly",
    frequencyLabel: "2 tuần / lần",
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
    defaultProductIds: ["7", "3", "5", "12"],
    sampleProducts: ["Xoài Cát Hòa Lộc", "Thanh Long Ruột Đỏ", "Chôm Chôm Bến Tre", "Bưởi Da Xanh"],
    savings: 15,
  },
  {
    id: "monthly-special",
    name: "Combo Đặc Sản Vùng Miền",
    description: "Khám phá đặc sản từ khắp các vùng miền Việt Nam. Mỗi tháng một câu chuyện ẩm thực mới.",
    price: 500000,
    frequency: "monthly",
    frequencyLabel: "Hàng tháng",
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
    defaultProductIds: ["4", "8", "11", "10"],
    sampleProducts: ["Hồ Tiêu Phú Quốc", "Nước Mắm Phú Quốc", "Trà Xanh Thái Nguyên", "Măng Khô Tây Nguyên"],
    savings: 20,
  },
];

const WEEKDAYS = [
  { id: "monday", label: "Thứ 2" },
  { id: "tuesday", label: "Thứ 3" },
  { id: "wednesday", label: "Thứ 4" },
  { id: "thursday", label: "Thứ 5" },
  { id: "friday", label: "Thứ 6" },
  { id: "saturday", label: "Thứ 7" },
];

// ── Helper: compute next delivery date ──────────────────────────────────────
function computeNextDeliveryDate(
  frequency: "weekly" | "biweekly" | "monthly",
  preferredDay: string
): Date {
  const dayMap: Record<string, number> = {
    monday: 1, tuesday: 2, wednesday: 3, thursday: 4, friday: 5, saturday: 6,
  };
  const now = new Date();
  const next = new Date(now);
  next.setHours(9, 0, 0, 0);
  const target = dayMap[preferredDay] ?? 3;
  const daysUntil = (target - next.getDay() + 7) % 7 || 7;
  next.setDate(next.getDate() + daysUntil);
  return next;
}

function formatDateVN(d: string | Date): string {
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleDateString("vi-VN", { weekday: "long", day: "2-digit", month: "2-digit", year: "numeric" });
}

function daysUntil(dateStr: string): number {
  const target = new Date(dateStr);
  const now = new Date();
  return Math.max(0, Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
}

// ══════════════════════════════════════════════════════════════════════════════
// Main Component
// ══════════════════════════════════════════════════════════════════════════════
export function Subscription() {
  const { role } = useAuth();
  const {
    products, getActiveSubscription, createSubscription,
    pauseSubscription, resumeSubscription, cancelSubscription,
    updateSubscription, orders,
  } = useShop();

  const isCustomer = role === "consumer";
  const activeSub = getActiveSubscription();

  // ── View state ──
  const [view, setView] = useState<"plans" | "configure" | "dashboard">(
    activeSub ? "dashboard" : "plans"
  );

  // Re-sync view when activeSub changes
  useEffect(() => {
    if (activeSub && view === "plans") setView("dashboard");
    else if (!activeSub && view === "dashboard") setView("plans");
  }, [activeSub]);

  // ── Configuration State (Step-by-step setup) ──
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [configStep, setConfigStep] = useState(1); // 1: Products, 2: Schedule, 3: Address, 4: Payment & Confirm
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [preferredDay, setPreferredDay] = useState("wednesday");
  const [preferredSlot, setPreferredSlot] = useState("morning");
  const [deliveryNote, setDeliveryNote] = useState("");
  const [substitutionPref, setSubstitutionPref] = useState("call-first");
  const [selectedPayment, setSelectedPayment] = useState(PAYMENT_METHODS[0].id);

  // Address state
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [wards, setWards] = useState<Ward[]>([]);
  const [loadingProvinces, setLoadingProvinces] = useState(true);
  const [loadingWards, setLoadingWards] = useState(false);
  const [selectedProvinceCode, setSelectedProvinceCode] = useState<number | null>(null);
  const [shippingAddress, setShippingAddress] = useState<ShippingAddress>({
    fullName: "", address: "", ward: "", province: "", phone: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Dashboard edit state
  const [editingSchedule, setEditingSchedule] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);

  // Past addresses
  const currentUserEmail = localStorage.getItem("current_user_email") || "";
  const pastAddresses = useMemo(() => Array.from(
    new Map(
      orders
        .filter((o) => o.buyerEmail === currentUserEmail)
        .map((o) => [o.shippingAddress.address + o.shippingAddress.province, o.shippingAddress])
    ).values()
  ).slice(0, 5), [orders, currentUserEmail]);

  // Fetch provinces
  useEffect(() => {
    fetchProvinces()
      .then(setProvinces)
      .catch(() => { })
      .finally(() => setLoadingProvinces(false));
  }, []);

  // Fetch wards
  useEffect(() => {
    if (selectedProvinceCode === null) { setWards([]); return; }
    setLoadingWards(true);
    fetchWardsByProvinceCode(selectedProvinceCode)
      .then(setWards)
      .catch(() => { })
      .finally(() => setLoadingWards(false));
  }, [selectedProvinceCode]);

  const selectedPlan = SUBSCRIPTION_PLANS.find((p) => p.id === selectedPlanId);
  const activePlanDef = activeSub
    ? SUBSCRIPTION_PLANS.find((p) => p.id === activeSub.planId)
    : null;
  const subscriptionOrders = useMemo(
    () => (activeSub ? orders.filter((order) => order.subscriptionId === activeSub.id) : []),
    [activeSub, orders]
  );
  const latestSubscriptionOrder = subscriptionOrders[0];

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleSelectPlan = (planId: string) => {
    if (!isCustomer) {
      toast.error("Vui lòng đăng nhập tài khoản khách hàng để đăng ký gói");
      return;
    }
    const plan = SUBSCRIPTION_PLANS.find((p) => p.id === planId);
    if (!plan) return;
    setSelectedPlanId(planId);
    setSelectedProducts(plan.defaultProductIds);
    setConfigStep(1);
    setView("configure");
  };

  const toggleProduct = (productId: string) => {
    setSelectedProducts((prev) =>
      prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId]
    );
  };

  const validateAddress = () => {
    const newErrors: Record<string, string> = {};
    if (!shippingAddress.fullName.trim() || shippingAddress.fullName.length < 2)
      newErrors.fullName = "Cần nhập họ tên đầy đủ";
    if (!shippingAddress.address.trim() || shippingAddress.address.length < 5)
      newErrors.address = "Cần nhập địa chỉ hợp lệ";
    if (!shippingAddress.province)
      newErrors.province = "Cần chọn tỉnh/thành phố";
    if (!shippingAddress.ward)
      newErrors.ward = "Cần chọn phường/xã";
    if (!/^\+?[\d\s-()]{10,}$/.test(shippingAddress.phone))
      newErrors.phone = "Cần nhập số điện thoại hợp lệ";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleConfigNext = () => {
    if (configStep === 1) {
      if (selectedProducts.length === 0) {
        toast.error("Vui lòng chọn ít nhất 1 sản phẩm");
        return;
      }
      setConfigStep(2);
    } else if (configStep === 2) {
      setConfigStep(3);
    } else if (configStep === 3) {
      if (!validateAddress()) return;
      setConfigStep(4);
    }
  };

  const handleConfirmSubscription = () => {
    if (!selectedPlan) return;
    const nextDate = computeNextDeliveryDate(selectedPlan.frequency, preferredDay);

    const sub: SubscriptionOrder = {
      id: `SUB-${Date.now()}`,
      planId: selectedPlan.id,
      planName: selectedPlan.name,
      planIcon: selectedPlan.icon,
      frequency: selectedPlan.frequency,
      price: selectedPlan.price,
      status: "active",
      preferredDay,
      preferredSlot,
      shippingAddress,
      paymentMethod: PAYMENT_METHODS.find((m) => m.id === selectedPayment)?.name || "",
      selectedProducts,
      excludedProducts: selectedPlan.defaultProductIds.filter((id) => !selectedProducts.includes(id)),
      startDate: new Date().toISOString(),
      nextDeliveryDate: nextDate.toISOString(),
      deliveryHistory: [],
      deliveryNote: deliveryNote.trim() || undefined,
      substitutionPref: substitutionPref === "no-sub" ? "Không cho thay thế" : "Gọi xác nhận trước khi thay",
      buyerEmail: currentUserEmail,
    };

    createSubscription(sub);
    // Clean up old localStorage keys
    localStorage.removeItem("subscriptionPlan");
    localStorage.removeItem("subscriptionPaused");
    toast.success("🎉 Đăng ký gói định kỳ thành công!");
    setView("dashboard");
  };

  const handlePause = () => {
    if (!activeSub) return;
    pauseSubscription(activeSub.id);
    toast.success("Đã tạm dừng gói định kỳ");
  };

  const handleResume = () => {
    if (!activeSub) return;
    resumeSubscription(activeSub.id);
    toast.success("Đã tiếp tục gói định kỳ");
  };

  const handleCancel = () => {
    if (!activeSub) return;
    cancelSubscription(activeSub.id);
    setConfirmCancel(false);
    toast.success("Đã hủy gói định kỳ");
    setView("plans");
  };

  const handleSaveSchedule = () => {
    if (!activeSub) return;
    const nextDate = computeNextDeliveryDate(
      activeSub.frequency,
      preferredDay
    );
    updateSubscription({
      ...activeSub,
      preferredDay,
      preferredSlot,
      nextDeliveryDate: nextDate.toISOString(),
      deliveryNote: deliveryNote.trim() || undefined,
    });
    setEditingSchedule(false);
    toast.success("Đã cập nhật lịch giao hàng");
  };

  // ══════════════════════════════════════════════════════════════════════════
  // RENDER
  // ══════════════════════════════════════════════════════════════════════════
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-50 rounded-full text-green-700 text-sm font-semibold mb-4">
          <CalendarDays className="w-4 h-4" />
          Giao hàng định kỳ
        </div>
        <h1 className="text-foreground font-bold mb-3">Gói Mua Hàng Định Kỳ</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Nhận nông sản tươi ngon đến tận nhà theo lịch trình bạn chọn. Tiết kiệm thời gian, luôn có thực phẩm sạch cho gia đình.
        </p>
        {/* View toggle for users with active sub */}
        {activeSub && view !== "configure" && (
          <div className="flex justify-center gap-3 mt-6">
            <button
              onClick={() => setView("dashboard")}
              className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${view === "dashboard"
                ? "bg-primary text-white shadow-sm"
                : "bg-muted text-foreground hover:bg-accent"
                }`}
            >
              <Settings className="w-4 h-4 inline mr-1.5" /> Quản lý gói
            </button>
            <button
              onClick={() => setView("plans")}
              className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${view === "plans"
                ? "bg-primary text-white shadow-sm"
                : "bg-muted text-foreground hover:bg-accent"
                }`}
            >
              <Package className="w-4 h-4 inline mr-1.5" /> Xem các gói
            </button>
          </div>
        )}
      </div>

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* PLAN SELECTION VIEW */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      {view === "plans" && (
        <>
          {/* Plan Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            {SUBSCRIPTION_PLANS.map((plan) => {
              const isActive = activeSub?.planId === plan.id;
              return (
                <div
                  key={plan.id}
                  className={`bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all border-2 ${isActive ? "border-primary ring-2 ring-primary/20" : "border-border"
                    }`}
                >
                  {/* Plan Header */}
                  <div className={`bg-gradient-to-r ${plan.gradientFrom} ${plan.gradientTo} p-6 text-white relative overflow-hidden`}>
                    <div className="absolute top-3 right-3 bg-white/20 backdrop-blur-sm px-2.5 py-1 rounded-full text-xs font-bold">
                      Tiết kiệm {plan.savings}%
                    </div>
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
                      <span className="text-muted-foreground text-sm">/ {plan.frequencyLabel.toLowerCase()}</span>
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
                          <span key={product} className="text-xs bg-accent text-foreground px-2 py-1 rounded-full">
                            {product}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Subscribe Button */}
                    <button
                      onClick={() => handleSelectPlan(plan.id)}
                      disabled={isActive}
                      className={`w-full py-3 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2 ${isActive
                        ? "bg-green-100 text-green-700 cursor-default"
                        : "bg-primary text-white hover:bg-primary/90"
                        }`}
                    >
                      {isActive ? (
                        <>
                          <Check className="w-5 h-5" /> Đã đăng ký
                        </>
                      ) : (
                        <>
                          <ShoppingCart className="w-5 h-5" /> Đăng Ký Gói Này
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* How It Works */}
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-8 md:p-12 mb-12">
            <h2 className="text-center text-foreground font-bold mb-8">Cách Hoạt Động</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[
                { step: 1, icon: "📦", title: "Chọn Gói", desc: "Chọn gói phù hợp với nhu cầu gia đình bạn" },
                { step: 2, icon: "🛒", title: "Tùy Chọn SP", desc: "Chọn sản phẩm yêu thích trong gói" },
                { step: 3, icon: "📅", title: "Đặt Lịch", desc: "Chọn ngày, giờ giao hàng thuận tiện" },
                { step: 4, icon: "🚚", title: "Nhận Hàng", desc: "Tự động giao đến tận nhà theo lịch" },
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
        </>
      )}

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* CONFIGURE VIEW (Multi-step) */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      {view === "configure" && selectedPlan && (
        <div className="max-w-4xl mx-auto">
          {/* Progress */}
          <div className="mb-8">
            <div className="flex items-center justify-between max-w-2xl mx-auto">
              {[
                { num: 1, label: "Sản phẩm" },
                { num: 2, label: "Lịch giao" },
                { num: 3, label: "Địa chỉ" },
                { num: 4, label: "Xác nhận" },
              ].map((s, idx) => (
                <div key={s.num} className="flex items-center flex-1">
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all ${configStep >= s.num
                        ? `bg-gradient-to-r ${selectedPlan.gradientFrom} ${selectedPlan.gradientTo} text-white`
                        : "bg-gray-200 text-gray-600"
                        }`}
                    >
                      {configStep > s.num ? <Check className="w-5 h-5" /> : s.num}
                    </div>
                    <span className="text-xs mt-2 text-foreground font-medium">{s.label}</span>
                  </div>
                  {idx < 3 && (
                    <div className={`h-1 flex-1 mx-3 rounded ${configStep > s.num ? "bg-primary" : "bg-gray-200"}`} />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Plan badge */}
          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-white text-sm font-semibold mb-6 bg-gradient-to-r ${selectedPlan.gradientFrom} ${selectedPlan.gradientTo}`}>
            <span className="text-lg">{selectedPlan.icon}</span>
            {selectedPlan.name} — {selectedPlan.price.toLocaleString("vi-VN")}₫ / {selectedPlan.frequencyLabel.toLowerCase()}
          </div>

          {/* ── Step 1: Product Customization ── */}
          {configStep === 1 && (
            <div className="bg-white rounded-xl shadow-sm p-6 border border-border">
              <div className="flex items-center gap-2 mb-2">
                <ShoppingCart className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-bold text-foreground">Chọn Sản Phẩm Trong Gói</h2>
              </div>
              <p className="text-sm text-muted-foreground mb-6">
                Tùy chỉnh sản phẩm bạn muốn nhận trong mỗi lần giao. Bạn có thể thay đổi sau.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                {products.map((product) => {
                  const isSelected = selectedProducts.includes(product.id);
                  const isDefault = selectedPlan.defaultProductIds.includes(product.id);
                  return (
                    <label
                      key={product.id}
                      className={`flex items-center gap-3 p-3 border-2 rounded-lg cursor-pointer transition-all ${isSelected
                        ? "border-primary bg-primary/5 shadow-sm"
                        : "border-border hover:border-primary/30"
                        }`}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleProduct(product.id)}
                        className="w-5 h-5 rounded text-primary accent-green-600"
                      />
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground truncate">{product.name}</p>
                        <p className="text-xs text-muted-foreground">{product.price.toLocaleString("vi-VN")}₫ / {product.unit || "sp"}</p>
                      </div>
                      {isDefault && (
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium shrink-0">
                          Mặc định
                        </span>
                      )}
                    </label>
                  );
                })}
              </div>

              <p className="text-sm text-muted-foreground mb-4">
                Đã chọn <strong className="text-foreground">{selectedProducts.length}</strong> sản phẩm
              </p>

              <div className="flex gap-4">
                <button
                  onClick={() => setView("plans")}
                  className="flex-1 border-2 border-gray-300 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
                >
                  Quay lại
                </button>
                <button
                  onClick={handleConfigNext}
                  className={`flex-1 py-3 rounded-lg font-semibold text-white transition-colors bg-gradient-to-r ${selectedPlan.gradientFrom} ${selectedPlan.gradientTo} hover:opacity-90`}
                >
                  Tiếp theo <ArrowRight className="w-4 h-4 inline ml-1" />
                </button>
              </div>
            </div>
          )}

          {/* ── Step 2: Schedule ── */}
          {configStep === 2 && (
            <div className="bg-white rounded-xl shadow-sm p-6 border border-border">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-bold text-foreground">Lịch Giao Hàng</h2>
              </div>
              <p className="text-sm text-muted-foreground mb-6">
                Chọn ngày và khung giờ bạn muốn nhận hàng.
              </p>

              {/* Day of week */}
              <div className="mb-6">
                <label className="block text-sm font-semibold mb-3 text-foreground">
                  <CalendarDays className="w-4 h-4 inline mr-1 text-primary" />
                  Ngày giao trong tuần
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {WEEKDAYS.map((day) => (
                    <label
                      key={day.id}
                      className={`text-center p-3 border-2 rounded-lg cursor-pointer transition-all ${preferredDay === day.id
                        ? "border-primary bg-primary/5 shadow-sm"
                        : "border-border hover:border-primary/30"
                        }`}
                    >
                      <input
                        type="radio" name="day" value={day.id}
                        checked={preferredDay === day.id}
                        onChange={() => setPreferredDay(day.id)}
                        className="sr-only"
                      />
                      <p className="text-sm font-semibold text-foreground">{day.label}</p>
                    </label>
                  ))}
                </div>
              </div>

              {/* Time slot */}
              <div className="mb-6">
                <label className="block text-sm font-semibold mb-3 text-foreground">
                  <Clock className="w-4 h-4 inline mr-1 text-primary" />
                  Khung giờ nhận hàng
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {DELIVERY_SLOTS.map((slot) => (
                    <label
                      key={slot.id}
                      className={`block p-4 border-2 rounded-lg cursor-pointer transition-all text-center ${preferredSlot === slot.id
                        ? "border-primary bg-primary/5 shadow-sm"
                        : "border-border hover:border-primary/30"
                        }`}
                    >
                      <input
                        type="radio" name="slot" value={slot.id}
                        checked={preferredSlot === slot.id}
                        onChange={() => setPreferredSlot(slot.id)}
                        className="sr-only"
                      />
                      <span className="text-2xl block mb-2">{slot.icon}</span>
                      <p className="font-semibold text-sm">{slot.label}</p>
                      <p className="text-xs text-muted-foreground mt-1">{slot.timeRange}</p>
                    </label>
                  ))}
                </div>
              </div>

              {/* Substitution */}
              <div className="mb-6">
                <label className="block text-sm font-semibold mb-3 text-foreground">
                  <RefreshCw className="w-4 h-4 inline mr-1 text-primary" />
                  Tùy chọn thay thế sản phẩm
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { id: "no-sub", label: "Không thay thế", desc: "Bỏ qua SP hết hàng", icon: "🚫" },
                    { id: "call-first", label: "Gọi xác nhận trước", desc: "Nhân viên gọi trước khi thay", icon: "📞" },
                  ].map((opt) => (
                    <label
                      key={opt.id}
                      className={`flex items-center gap-3 p-4 border-2 rounded-lg cursor-pointer transition-all ${substitutionPref === opt.id
                        ? "border-primary bg-primary/5 shadow-sm"
                        : "border-border hover:border-primary/30"
                        }`}
                    >
                      <input type="radio" name="sub" value={opt.id} checked={substitutionPref === opt.id}
                        onChange={() => setSubstitutionPref(opt.id)} className="sr-only" />
                      <span className="text-lg">{opt.icon}</span>
                      <div>
                        <p className="font-semibold text-sm">{opt.label}</p>
                        <p className="text-xs text-muted-foreground">{opt.desc}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Delivery Note */}
              <div className="mb-6">
                <label className="block text-sm font-semibold mb-2 text-foreground">
                  Ghi chú giao hàng
                </label>
                <textarea
                  value={deliveryNote}
                  onChange={(e) => setDeliveryNote(e.target.value)}
                  rows={2}
                  className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none bg-background"
                  placeholder="Ví dụ: Gọi trước khi giao, để ở bảo vệ..."
                />
              </div>

              {/* Next delivery preview */}
              <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl">
                <p className="text-sm text-green-800">
                  📅 <strong>Giao hàng đầu tiên dự kiến:</strong>{" "}
                  {formatDateVN(computeNextDeliveryDate(selectedPlan.frequency, preferredDay))}
                </p>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => setConfigStep(1)}
                  className="flex-1 border-2 border-gray-300 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
                >
                  Quay lại
                </button>
                <button
                  onClick={handleConfigNext}
                  className={`flex-1 py-3 rounded-lg font-semibold text-white transition-colors bg-gradient-to-r ${selectedPlan.gradientFrom} ${selectedPlan.gradientTo} hover:opacity-90`}
                >
                  Tiếp theo <ArrowRight className="w-4 h-4 inline ml-1" />
                </button>
              </div>
            </div>
          )}

          {/* ── Step 3: Address ── */}
          {configStep === 3 && (
            <div className="bg-white rounded-xl shadow-sm p-6 border border-border">
              <div className="flex items-center gap-2 mb-2">
                <MapPin className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-bold text-foreground">Địa Chỉ Giao Hàng</h2>
              </div>
              <p className="text-sm text-muted-foreground mb-6">
                Địa chỉ cố định cho giao hàng định kỳ. Bạn có thể thay đổi sau.
              </p>

              <div className="space-y-4">
                {pastAddresses.length > 0 && (
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <label className="block text-sm font-semibold mb-2 text-blue-800">Chọn địa chỉ đã dùng:</label>
                    <select
                      className="w-full px-3 py-2 border border-blue-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                      onChange={(e) => {
                        const addr = pastAddresses.find((a) => a.address + a.province === e.target.value);
                        if (addr) setShippingAddress(addr as ShippingAddress);
                      }}
                      defaultValue=""
                    >
                      <option value="" disabled>-- Chọn địa chỉ --</option>
                      {pastAddresses.map((addr: any, idx) => (
                        <option key={idx} value={addr.address + addr.province}>
                          {addr.address}, {addr.ward}, {addr.province}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-semibold mb-1">Họ Tên *</label>
                  <input
                    type="text" value={shippingAddress.fullName}
                    onChange={(e) => setShippingAddress({ ...shippingAddress, fullName: e.target.value })}
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background ${errors.fullName ? "border-red-500" : "border-border"}`}
                    placeholder="Nguyễn Văn A"
                  />
                  {errors.fullName && <p className="text-red-500 text-sm mt-1">{errors.fullName}</p>}
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-1">Địa chỉ *</label>
                  <input
                    type="text" value={shippingAddress.address}
                    onChange={(e) => setShippingAddress({ ...shippingAddress, address: e.target.value })}
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background ${errors.address ? "border-red-500" : "border-border"}`}
                    placeholder="123 Nguyễn Huệ, Phường Bến Nghé"
                  />
                  {errors.address && <p className="text-red-500 text-sm mt-1">{errors.address}</p>}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold mb-1">Tỉnh/Thành phố *</label>
                    <select
                      value={shippingAddress.province}
                      onChange={(e) => {
                        const sel = provinces.find((p) => p.name === e.target.value);
                        setShippingAddress({ ...shippingAddress, province: e.target.value, ward: "" });
                        setSelectedProvinceCode(sel ? sel.code : null);
                      }}
                      disabled={loadingProvinces}
                      className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary disabled:bg-gray-100 bg-background ${errors.province ? "border-red-500" : "border-border"}`}
                    >
                      <option value="">{loadingProvinces ? "Đang tải..." : "Chọn Tỉnh/Thành"}</option>
                      {provinces.map((p) => (<option key={p.code} value={p.name}>{p.name}</option>))}
                    </select>
                    {errors.province && <p className="text-red-500 text-sm mt-1">{errors.province}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-1">Phường/Xã *</label>
                    <select
                      value={shippingAddress.ward}
                      onChange={(e) => setShippingAddress({ ...shippingAddress, ward: e.target.value })}
                      disabled={!shippingAddress.province || loadingWards}
                      className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary disabled:bg-gray-100 bg-background ${errors.ward ? "border-red-500" : "border-border"}`}
                    >
                      <option value="">{loadingWards ? "Đang tải..." : "Chọn Phường/Xã"}</option>
                      {wards.map((w) => (<option key={w.code} value={w.name}>{w.name}</option>))}
                    </select>
                    {errors.ward && <p className="text-red-500 text-sm mt-1">{errors.ward}</p>}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-1">Số điện thoại *</label>
                  <input
                    type="tel" value={shippingAddress.phone}
                    onChange={(e) => setShippingAddress({ ...shippingAddress, phone: e.target.value })}
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background ${errors.phone ? "border-red-500" : "border-border"}`}
                    placeholder="0912 345 678"
                  />
                  {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
                </div>
              </div>

              <div className="flex gap-4 mt-6">
                <button
                  onClick={() => setConfigStep(2)}
                  className="flex-1 border-2 border-gray-300 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
                >
                  Quay lại
                </button>
                <button
                  onClick={handleConfigNext}
                  className={`flex-1 py-3 rounded-lg font-semibold text-white transition-colors bg-gradient-to-r ${selectedPlan.gradientFrom} ${selectedPlan.gradientTo} hover:opacity-90`}
                >
                  Tiếp theo <ArrowRight className="w-4 h-4 inline ml-1" />
                </button>
              </div>
            </div>
          )}

          {/* ── Step 4: Payment & Confirm ── */}
          {configStep === 4 && (
            <div className="bg-white rounded-xl shadow-sm p-6 border border-border">
              <div className="flex items-center gap-2 mb-2">
                <CreditCard className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-bold text-foreground">Thanh Toán & Xác Nhận</h2>
              </div>

              {/* Payment Methods */}
              <div className="mb-6">
                <label className="block text-sm font-semibold mb-3">Phương thức thanh toán</label>
                <div className="space-y-2">
                  {PAYMENT_METHODS.map((method) => (
                    <label
                      key={method.id}
                      className={`block p-3 border-2 rounded-lg cursor-pointer transition-colors ${selectedPayment === method.id
                        ? "border-primary bg-primary/5" : "border-border hover:border-primary/30"
                        }`}
                    >
                      <div className="flex items-center gap-3">
                        <input type="radio" name="payment" checked={selectedPayment === method.id}
                          onChange={() => setSelectedPayment(method.id)} className="w-4 h-4 text-primary" />
                        <p className="font-semibold text-sm">{method.name}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Order Summary */}
              <div className="bg-gradient-to-br from-gray-50 to-background rounded-xl p-5 border border-border mb-6">
                <h3 className="font-bold text-foreground mb-4">Tóm tắt đăng ký</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Gói</span>
                    <span className="font-semibold">{selectedPlan.icon} {selectedPlan.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tần suất</span>
                    <span className="font-semibold">{selectedPlan.frequencyLabel}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Số sản phẩm</span>
                    <span className="font-semibold">{selectedProducts.length} sản phẩm</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Ngày giao</span>
                    <span className="font-semibold">{WEEKDAYS.find((d) => d.id === preferredDay)?.label}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Khung giờ</span>
                    <span className="font-semibold">{DELIVERY_SLOTS.find((s) => s.id === preferredSlot)?.label} ({DELIVERY_SLOTS.find((s) => s.id === preferredSlot)?.timeRange})</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Địa chỉ</span>
                    <span className="font-semibold text-right max-w-[60%]">{shippingAddress.address}, {shippingAddress.ward}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Giao hàng đầu tiên</span>
                    <span className="font-semibold text-green-700">{formatDateVN(computeNextDeliveryDate(selectedPlan.frequency, preferredDay))}</span>
                  </div>
                  <div className="border-t border-border pt-3 mt-3 flex justify-between">
                    <span className="font-bold text-foreground">Giá mỗi lần giao</span>
                    <span className="font-bold text-lg text-primary">{selectedPlan.price.toLocaleString("vi-VN")}₫</span>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-green-50 border border-green-200 rounded-xl mb-6">
                <p className="text-sm text-green-800 flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                  Bạn có thể tạm dừng, thay đổi hoặc hủy gói bất kỳ lúc nào. Không phí cam kết.
                </p>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => setConfigStep(3)}
                  className="flex-1 border-2 border-gray-300 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
                >
                  Quay lại
                </button>
                <button
                  onClick={handleConfirmSubscription}
                  className={`flex-1 py-3 rounded-lg font-bold text-white transition-all bg-gradient-to-r ${selectedPlan.gradientFrom} ${selectedPlan.gradientTo} hover:opacity-90 shadow-lg hover:shadow-xl`}
                >
                  ✅ Xác Nhận Đăng Ký
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* DASHBOARD VIEW */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      {view === "dashboard" && activeSub && activePlanDef && (
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Status Banner */}
          <div className={`rounded-xl overflow-hidden shadow-lg bg-gradient-to-r ${activePlanDef.gradientFrom} ${activePlanDef.gradientTo}`}>
            <div className="p-6 md:p-8 text-white">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex items-center gap-4">
                  <span className="text-5xl">{activeSub.planIcon}</span>
                  <div>
                    <p className="text-white/70 text-sm font-medium">
                      {activeSub.status === "active" ? "Gói đang hoạt động" : "Gói tạm dừng"}
                    </p>
                    <h3 className="text-2xl font-bold">{activeSub.planName}</h3>
                    <p className="text-white/80 text-sm mt-1">
                      {activeSub.price.toLocaleString("vi-VN")}₫ / {activePlanDef.frequencyLabel.toLowerCase()}
                      {activeSub.status === "paused" && (
                        <span className="ml-2 inline-flex items-center gap-1 bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-0.5 rounded-full">
                          <Pause className="w-3 h-3" /> Tạm dừng
                        </span>
                      )}
                    </p>
                    {latestSubscriptionOrder && latestSubscriptionOrder.status !== "delivered" && latestSubscriptionOrder.status !== "cancelled" && (
                      <p className="text-white/80 text-xs mt-2">
                        Don ky gan nhat: {latestSubscriptionOrder.id}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex gap-3 flex-wrap">
                  {activeSub.status === "paused" ? (
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
                  {!confirmCancel ? (
                    <button
                      onClick={() => setConfirmCancel(true)}
                      className="flex items-center gap-2 bg-white/20 text-white px-4 py-2 rounded-lg font-semibold text-sm hover:bg-red-500 transition-colors"
                    >
                      <X className="w-4 h-4" /> Hủy gói
                    </button>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="text-white text-sm">Bạn chắc chắn?</span>
                      <button
                        onClick={handleCancel}
                        className="bg-red-500 text-white px-4 py-2 rounded-lg font-semibold text-sm hover:bg-red-600 transition-colors"
                      >
                        Xác nhận hủy
                      </button>
                      <button
                        onClick={() => setConfirmCancel(false)}
                        className="bg-white/20 text-white px-3 py-2 rounded-lg text-sm hover:bg-white/30 transition-colors"
                      >
                        Không
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              {
                icon: <Calendar className="w-5 h-5 text-green-600" />,
                label: "Giao tiếp theo",
                value: activeSub.status === "active"
                  ? `${daysUntil(activeSub.nextDeliveryDate)} ngày`
                  : "—",
                sub: activeSub.status === "active" ? formatDateVN(activeSub.nextDeliveryDate).split(",")[0] : "Tạm dừng",
                bg: "bg-green-50",
              },
              {
                icon: <Package className="w-5 h-5 text-blue-600" />,
                label: "Đã giao",
                value: `${subscriptionOrders.filter((order) => order.status === "delivered").length} lần`,
                sub: "Tất cả thành công",
                bg: "bg-blue-50",
              },
              {
                icon: <TrendingUp className="w-5 h-5 text-purple-600" />,
                label: "Tổng chi tiêu",
                value: `${(subscriptionOrders.filter((order) => order.status !== "cancelled").reduce((sum, order) => sum + order.total, 0)).toLocaleString("vi-VN")}₫`,
                sub: "Qua các lần giao",
                bg: "bg-purple-50",
              },
              {
                icon: <Star className="w-5 h-5 text-amber-600" />,
                label: "Tiết kiệm",
                value: `~${activePlanDef.savings}%`,
                sub: "So với mua lẻ",
                bg: "bg-amber-50",
              },
            ].map((stat) => (
              <div key={stat.label} className={`${stat.bg} rounded-xl p-4 border border-border`}>
                <div className="flex items-center gap-2 mb-2">{stat.icon}<span className="text-xs font-semibold text-muted-foreground">{stat.label}</span></div>
                <p className="text-lg font-bold text-foreground">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.sub}</p>
              </div>
            ))}
          </div>

          {/* Delivery Schedule & Products */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Schedule Card */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-border">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-foreground flex items-center gap-2">
                  <CalendarDays className="w-5 h-5 text-primary" /> Lịch Giao Hàng
                </h3>
                <button
                  onClick={() => {
                    if (editingSchedule) handleSaveSchedule();
                    else {
                      setPreferredDay(activeSub.preferredDay);
                      setPreferredSlot(activeSub.preferredSlot);
                      setDeliveryNote(activeSub.deliveryNote || "");
                      setEditingSchedule(true);
                    }
                  }}
                  className="flex items-center gap-1 text-primary text-sm font-semibold hover:text-primary/80"
                >
                  {editingSchedule ? <><Save className="w-4 h-4" /> Lưu</> : <><Edit3 className="w-4 h-4" /> Sửa</>}
                </button>
              </div>

              {!editingSchedule ? (
                <div className="space-y-3 text-sm">
                  <div className="flex items-center gap-3 p-3 bg-accent rounded-lg">
                    <CalendarDays className="w-4 h-4 text-primary shrink-0" />
                    <div>
                      <p className="text-xs text-muted-foreground">Ngày giao</p>
                      <p className="font-semibold text-foreground">{WEEKDAYS.find((d) => d.id === activeSub.preferredDay)?.label} hàng tuần</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-accent rounded-lg">
                    <Clock className="w-4 h-4 text-primary shrink-0" />
                    <div>
                      <p className="text-xs text-muted-foreground">Khung giờ</p>
                      <p className="font-semibold text-foreground">{DELIVERY_SLOTS.find((s) => s.id === activeSub.preferredSlot)?.label} ({DELIVERY_SLOTS.find((s) => s.id === activeSub.preferredSlot)?.timeRange})</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-accent rounded-lg">
                    <RefreshCw className="w-4 h-4 text-primary shrink-0" />
                    <div>
                      <p className="text-xs text-muted-foreground">Thay thế SP</p>
                      <p className="font-semibold text-foreground">{activeSub.substitutionPref}</p>
                    </div>
                  </div>
                  {activeSub.deliveryNote && (
                    <div className="flex items-center gap-3 p-3 bg-accent rounded-lg">
                      <Truck className="w-4 h-4 text-primary shrink-0" />
                      <div>
                        <p className="text-xs text-muted-foreground">Ghi chú</p>
                        <p className="font-semibold text-foreground">{activeSub.deliveryNote}</p>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold mb-2">Ngày giao</label>
                    <div className="grid grid-cols-3 gap-1.5">
                      {WEEKDAYS.map((day) => (
                        <label key={day.id} className={`text-center p-2 border rounded-lg cursor-pointer text-xs transition-all ${preferredDay === day.id ? "border-primary bg-primary/5" : "border-border"}`}>
                          <input type="radio" name="editDay" value={day.id} checked={preferredDay === day.id} onChange={() => setPreferredDay(day.id)} className="sr-only" />
                          {day.label}
                        </label>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-2">Khung giờ</label>
                    <div className="grid grid-cols-2 gap-1.5">
                      {DELIVERY_SLOTS.map((slot) => (
                        <label key={slot.id} className={`text-center p-2 border rounded-lg cursor-pointer text-xs transition-all ${preferredSlot === slot.id ? "border-primary bg-primary/5" : "border-border"}`}>
                          <input type="radio" name="editSlot" value={slot.id} checked={preferredSlot === slot.id} onChange={() => setPreferredSlot(slot.id)} className="sr-only" />
                          {slot.icon} {slot.label}
                        </label>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1">Ghi chú</label>
                    <input type="text" value={deliveryNote} onChange={(e) => setDeliveryNote(e.target.value)}
                      className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Address Card */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-border">
              <h3 className="font-bold text-foreground flex items-center gap-2 mb-4">
                <MapPin className="w-5 h-5 text-primary" /> Địa Chỉ Giao Hàng
              </h3>
              <div className="p-4 bg-accent rounded-lg space-y-1 text-sm">
                <p className="font-semibold text-foreground">{activeSub.shippingAddress.fullName}</p>
                <p className="text-muted-foreground">{activeSub.shippingAddress.address}</p>
                <p className="text-muted-foreground">{activeSub.shippingAddress.ward}, {activeSub.shippingAddress.province}</p>
                <p className="text-muted-foreground">{activeSub.shippingAddress.phone}</p>
              </div>

              <h3 className="font-bold text-foreground flex items-center gap-2 mb-3 mt-6">
                <CreditCard className="w-5 h-5 text-primary" /> Thanh Toán
              </h3>
              <div className="p-4 bg-accent rounded-lg text-sm">
                <p className="font-semibold text-foreground">{activeSub.paymentMethod}</p>
                <p className="text-xs text-muted-foreground mt-1">Tự động thanh toán mỗi lần giao</p>
              </div>
            </div>
          </div>

          {/* Product List */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-border">
            <h3 className="font-bold text-foreground flex items-center gap-2 mb-4">
              <ShoppingCart className="w-5 h-5 text-primary" /> Sản Phẩm Trong Gói ({activeSub.selectedProducts.length})
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {activeSub.selectedProducts.map((pid) => {
                const p = products.find((pr) => pr.id === pid);
                if (!p) return null;
                return (
                  <div key={pid} className="flex items-center gap-3 p-3 bg-accent rounded-lg">
                    <img src={p.image} alt={p.name} className="w-12 h-12 rounded-lg object-cover" />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">{p.name}</p>
                      <p className="text-xs text-muted-foreground">{p.price.toLocaleString("vi-VN")}₫ / {p.unit || "sp"}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Delivery History */}
          <div className="bg-white rounded-xl shadow-sm border border-border overflow-hidden">
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="w-full flex items-center justify-between p-6 hover:bg-accent/50 transition-colors"
            >
              <h3 className="font-bold text-foreground flex items-center gap-2">
                <History className="w-5 h-5 text-primary" /> Lịch Sử Giao Hàng ({activeSub.deliveryHistory.length})
              </h3>
              {showHistory ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </button>
            {showHistory && (
              <div className="px-6 pb-6">
                {activeSub.deliveryHistory.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4">Chưa có lần giao hàng nào.</p>
                ) : (
                  <div className="space-y-3">
                    {activeSub.deliveryHistory.map((delivery) => (
                      <div key={delivery.id} className="flex items-center justify-between p-4 bg-accent rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${delivery.status === "delivered"
                            ? "bg-green-100 text-green-600"
                            : delivery.status === "scheduled"
                              ? "bg-blue-100 text-blue-600"
                              : "bg-gray-100 text-gray-600"
                            }`}>
                            {delivery.status === "delivered" ? <Check className="w-5 h-5" /> :
                              delivery.status === "scheduled" ? <Clock className="w-5 h-5" /> :
                                <X className="w-5 h-5" />}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-foreground">
                              {formatDateVN(delivery.deliveryDate)}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {delivery.items.length} sản phẩm •{" "}
                              {delivery.status === "delivered" ? "Đã giao" : delivery.status === "scheduled" ? "Đã lên lịch" : "Đã bỏ qua"}
                            </p>
                          </div>
                        </div>
                        <p className="font-bold text-foreground text-sm">
                          {delivery.total.toLocaleString("vi-VN")}₫
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

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
