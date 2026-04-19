import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { useShop } from "../context/ShopContext";
import { useAuth } from "../context/AuthContext";
import { DELIVERY_OPTIONS, PAYMENT_METHODS, DELIVERY_SLOTS } from "../data/products";
import { fetchProvinces, fetchWardsByProvinceCode, type Province, type Ward } from "../data/vietnam-provinces";
import { ShippingAddress, DeliveryOption, Order, Voucher } from "../types";
import { CreditCard, Truck, ShieldCheck, Lock, AlertTriangle, Clock, MessageSquare, RefreshCw, Tag, CheckCircle2, XCircle, Info, MapPin } from "lucide-react";
import { toast } from "sonner";

export function Checkout() {
  const { role } = useAuth();
  const { cart, orders, getCartTotal, placeOrder, validateVoucher, applyVoucher } = useShop();
  const navigate = useNavigate();
  
  const [step, setStep] = useState(1); // 1: Shipping, 2: Delivery, 3: Payment

  // ── Province / Ward API state ──
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [wards, setWards] = useState<Ward[]>([]);
  const [loadingProvinces, setLoadingProvinces] = useState(true);
  const [loadingWards, setLoadingWards] = useState(false);
  const [selectedProvinceCode, setSelectedProvinceCode] = useState<number | null>(null);

  // Fetch danh sách tỉnh/thành phố khi mount
  useEffect(() => {
    fetchProvinces()
      .then(setProvinces)
      .catch(() => toast.error("Không thể tải danh sách tỉnh/thành phố"))
      .finally(() => setLoadingProvinces(false));
  }, []);

  // Fetch danh sách phường/xã khi chọn tỉnh
  useEffect(() => {
    if (selectedProvinceCode === null) {
      setWards([]);
      return;
    }
    setLoadingWards(true);
    fetchWardsByProvinceCode(selectedProvinceCode)
      .then(setWards)
      .catch(() => toast.error("Không thể tải danh sách phường/xã"))
      .finally(() => setLoadingWards(false));
  }, [selectedProvinceCode]);
  
  const [shippingAddress, setShippingAddress] = useState<ShippingAddress>({
    fullName: "",
    address: "",
    ward: "",
    province: "",
    phone: "",
  });

  const [dynamicDeliveryFee, setDynamicDeliveryFee] = useState<number | null>(null);
  const [shippingBreakdown, setShippingBreakdown] = useState<{
    baseFee: number;
    distanceFee: number;
    weightFee: number;
    surcharge: number;
    distanceKm: number;
    itemCount: number;
  } | null>(null);

  const currentUserEmail = localStorage.getItem("current_user_email") || "";
  const pastAddresses = Array.from(
    new Map(
      orders
        .filter(o => o.buyerEmail === currentUserEmail)
        .map(o => [
          o.shippingAddress.address + o.shippingAddress.province, 
          o.shippingAddress
        ])
    ).values()
  ).slice(0, 5);

  const [selectedDelivery, setSelectedDelivery] = useState<DeliveryOption>(DELIVERY_OPTIONS[0]);
  const [selectedPayment, setSelectedPayment] = useState(PAYMENT_METHODS[0].id);
  const [selectedSlot, setSelectedSlot] = useState(DELIVERY_SLOTS[1].id); // Default: morning
  const [deliveryNote, setDeliveryNote] = useState("");
  const [substitutionPref, setSubstitutionPref] = useState("no-sub");
  
  const [cardDetails, setCardDetails] = useState({
    number: "",
    name: "",
    expiry: "",
    cvv: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // ── Voucher state ──
  const [voucherCode, setVoucherCode] = useState("");
  const [appliedVoucher, setAppliedVoucher] = useState<Voucher | null>(null);
  const [voucherError, setVoucherError] = useState("");
  const [voucherSuccess, setVoucherSuccess] = useState("");

  const subtotal = getCartTotal();

  // Compute voucher discount
  const cartCategories = [...new Set(cart.map((item) => item.product.category))];
  const computeVoucherDiscount = (voucher: Voucher | null): number => {
    if (!voucher) return 0;
    if (voucher.discountType === "fixed") return voucher.discountValue;
    const pctOff = subtotal * (voucher.discountValue / 100);
    return voucher.maxDiscountAmount ? Math.min(pctOff, voucher.maxDiscountAmount) : pctOff;
  };
  const voucherDiscount = computeVoucherDiscount(appliedVoucher);

  const tax = subtotal * 0.1;
  const deliveryFee = dynamicDeliveryFee !== null ? dynamicDeliveryFee : selectedDelivery.price;
  const total = subtotal - voucherDiscount + tax + deliveryFee;

  // Check if cart has perishable items
  const hasPerishableItems = cart.some((item) => item.product.isPerishable);

  if (role !== "consumer") {
    navigate("/auth");
    return null;
  }

  if (cart.length === 0) {
    navigate("/cart");
    return null;
  }

  // Input validation with security considerations
  const validateShipping = () => {
    const newErrors: Record<string, string> = {};
    
    // Sanitize and validate inputs
    if (!shippingAddress.fullName.trim() || shippingAddress.fullName.length < 2) {
      newErrors.fullName = "Cần nhập họ tên đầy đủ";
    }
    if (!shippingAddress.address.trim() || shippingAddress.address.length < 5) {
      newErrors.address = "Cần nhập địa chỉ hợp lệ";
    }
    if (!shippingAddress.province) {
      newErrors.province = "Cần chọn tỉnh/thành phố";
    }
    if (!shippingAddress.ward) {
      newErrors.ward = "Cần chọn phường/xã";
    }
    if (!/^\+?[\d\s-()]{10,}$/.test(shippingAddress.phone)) {
      newErrors.phone = "Cần nhập số điện thoại hợp lệ";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validatePayment = () => {
    const newErrors: Record<string, string> = {};
    
    if (selectedPayment === "card") {
      // Basic card validation (in real app, use payment gateway)
      if (!/^\d{16}$/.test(cardDetails.number.replace(/\s/g, ""))) {
        newErrors.cardNumber = "Cần nhập số thẻ 16 số hợp lệ";
      }
      if (!cardDetails.name.trim() || cardDetails.name.length < 3) {
        newErrors.cardName = "Cần nhập tên chủ thẻ";
      }
      if (!/^\d{2}\/\d{2}$/.test(cardDetails.expiry)) {
        newErrors.cardExpiry = "Cần nhập ngày hết hạn hợp lệ (MM/YY)";
      }
      if (!/^\d{3,4}$/.test(cardDetails.cvv)) {
        newErrors.cardCvv = "Cần nhập mã CVV hợp lệ";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Lưu khoảng cách đã tính (GPS) để tái sử dụng khi đổi phương thức vận chuyển
  const [cachedDistanceKm, setCachedDistanceKm] = useState<number | null>(null);
  const [isRecalculating, setIsRecalculating] = useState(false);

  /**
   * Tính phí vận chuyển động dựa trên:
   * - deliveryOpt: phương thức vận chuyển được chọn
   * - useCache: true → dùng khoảng cách GPS đã cache, false → gọi API mới
   */
  const calculateDynamicShippingFee = async (
    deliveryOpt: DeliveryOption = selectedDelivery,
    useCache: boolean = false
  ) => {
    // Miễn phí vận chuyển – bỏ qua tính toán
    if (deliveryOpt.id === "free") {
      setShippingBreakdown(null);
      setDynamicDeliveryFee(0);
      return;
    }

    const cartItemsCount = cart.reduce((acc, curr) => acc + curr.quantity, 0);
    let distanceKm = useCache && cachedDistanceKm !== null ? cachedDistanceKm : 10;

    if (!useCache || cachedDistanceKm === null) {
      try {
        const q = encodeURIComponent(`${shippingAddress.ward}, ${shippingAddress.province}, Vietnam`);
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${q}`);
        const data = await res.json();
        if (data && data.length > 0) {
          const storeLat = 10.7732;
          const storeLon = 106.7027;
          const userLat = parseFloat(data[0].lat);
          const userLon = parseFloat(data[0].lon);

          const R = 6371;
          const dLat = (userLat - storeLat) * Math.PI / 180;
          const dLon = (userLon - storeLon) * Math.PI / 180;
          const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                    Math.cos(storeLat * Math.PI / 180) * Math.cos(userLat * Math.PI / 180) *
                    Math.sin(dLon/2) * Math.sin(dLon/2);
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
          distanceKm = R * c;
        } else {
          if (!shippingAddress.province.toLowerCase().includes("hồ chí minh")) distanceKm = 300;
        }
      } catch (err) {
        if (!shippingAddress.province.toLowerCase().includes("hồ chí minh")) distanceKm = 300;
      }
      setCachedDistanceKm(distanceKm);
    }

    const ratePerKm = 500;
    const weightBuffer = cartItemsCount * 2000;
    const surcharge = distanceKm > 100 ? 25000 : distanceKm > 30 ? 10000 : 0; 
    
    const baseFee = deliveryOpt.price;
    const distanceFee = Math.round(distanceKm) * ratePerKm;
    const totalFee = baseFee + distanceFee + weightBuffer + surcharge;

    setShippingBreakdown({
      baseFee,
      distanceFee,
      weightFee: weightBuffer,
      surcharge,
      distanceKm: Math.round(distanceKm),
      itemCount: cartItemsCount,
    });
    setDynamicDeliveryFee(totalFee);
  };

  // Tự động tính lại phí khi đổi phương thức vận chuyển (step >= 2)
  useEffect(() => {
    if (step < 2) return; // Chưa tới bước chọn vận chuyển
    setIsRecalculating(true);
    calculateDynamicShippingFee(selectedDelivery, true).finally(() =>
      setIsRecalculating(false)
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDelivery]);

  const handleNext = async () => {
    if (step === 1 && validateShipping()) {
      toast.loading("Đang tính phí vận chuyển...");
      await calculateDynamicShippingFee(selectedDelivery, false);
      toast.dismiss();
      setStep(2);
    } else if (step === 2) {
      setStep(3);
    }
  };

  const handlePlaceOrder = () => {
    if (!validatePayment()) {
      return;
    }

    // Simulate payment processing
    toast.loading("Đang xử lý thanh toán...");
    
    setTimeout(() => {
      const orderDate = new Date();
      const estimatedDelivery = new Date();
      estimatedDelivery.setDate(
        estimatedDelivery.getDate() + 
        parseInt(selectedDelivery.estimatedDays.split("-")[0])
      );

      const slotInfo = DELIVERY_SLOTS.find(s => s.id === selectedSlot);

      const order: Order = {
        id: `ORD-${Date.now()}`,
        items: cart,
        total,
        status: "processing",
        deliveryOption: selectedDelivery,
        shippingAddress,
        paymentMethod: PAYMENT_METHODS.find(p => p.id === selectedPayment)?.name || "",
        orderDate: orderDate.toISOString(),
        estimatedDelivery: estimatedDelivery.toISOString(),
        buyerEmail: localStorage.getItem("current_user_email") || "",
        deliverySlot: slotInfo ? `${slotInfo.label} (${slotInfo.timeRange})` : undefined,
        deliveryNote: deliveryNote.trim() || undefined,
        substitutionPref: substitutionPref === "no-sub" ? "Không cho thay thế" : "Gọi xác nhận trước khi thay",
      };

      placeOrder(order);
      // Increment voucher usage
      if (appliedVoucher) {
        applyVoucher(appliedVoucher.id);
      }
      toast.dismiss();
      toast.success("Đặt hàng thành công!");
      navigate("/orders");
    }, 2000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold mb-8">Thanh toán</h1>

      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between max-w-2xl mx-auto">
          {[
            { num: 1, label: "Giao hàng" },
            { num: 2, label: "Vận chuyển" },
            { num: 3, label: "Thanh toán" },
          ].map((s, idx) => (
            <div key={s.num} className="flex items-center flex-1">
              <div className="flex flex-col items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                    step >= s.num
                      ? "bg-blue-600 text-white"
                      : "bg-gray-200 text-gray-600"
                  }`}
                >
                  {s.num}
                </div>
                <span className="text-sm mt-2">{s.label}</span>
              </div>
              {idx < 2 && (
                <div
                  className={`h-1 flex-1 mx-4 ${
                    step > s.num ? "bg-blue-600" : "bg-gray-200"
                  }`}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Form Section */}
        <div className="lg:col-span-2">
          {/* Step 1: Shipping Địa chỉ */}
          {step === 1 && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center gap-2 mb-6">
                <Truck className="w-6 h-6 text-blue-600" />
                <h2 className="text-xl font-bold">Địa chỉ giao hàng</h2>
              </div>

              {/* ═══ Cách tính phí vận chuyển ═══ */}
              <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl">
                <div className="flex items-center gap-2 mb-3">
                  <Info className="w-5 h-5 text-blue-600" />
                  <h3 className="font-bold text-blue-900 text-sm">Cách tính phí vận chuyển</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-blue-800">
                  <div className="flex items-start gap-2 p-2 bg-white/60 rounded-lg">
                    <span className="text-base leading-none">📦</span>
                    <div>
                      <p className="font-semibold">Phí cơ bản</p>
                      <p>Theo phương thức vận chuyển bạn chọn (Tiêu chuẩn / Nhanh / Trong ngày)</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2 p-2 bg-white/60 rounded-lg">
                    <span className="text-base leading-none">📍</span>
                    <div>
                      <p className="font-semibold">Phí khoảng cách</p>
                      <p>500₫/km từ kho hàng đến địa chỉ giao, tính bằng GPS</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2 p-2 bg-white/60 rounded-lg">
                    <span className="text-base leading-none">⚖️</span>
                    <div>
                      <p className="font-semibold">Phí đóng gói</p>
                      <p>2.000₫ mỗi sản phẩm (bao gồm bao bì, đóng gói an toàn)</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2 p-2 bg-white/60 rounded-lg">
                    <span className="text-base leading-none">🚛</span>
                    <div>
                      <p className="font-semibold">Phụ phí vùng xa</p>
                      <p>+10.000₫ nếu &gt;30km, +25.000₫ nếu &gt;100km</p>
                    </div>
                  </div>
                </div>
                <p className="text-xs text-blue-700 mt-3 italic">
                  💡 Phí vận chuyển sẽ được tính chính xác sau khi bạn điền đầy đủ địa chỉ.
                </p>
              </div>

              <div className="space-y-4">
                {pastAddresses.length > 0 && (
                  <div className="mb-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <label className="block text-sm font-semibold mb-2 text-blue-800">
                      Hoặc chọn địa chỉ đã dùng:
                    </label>
                    <select
                      className="w-full px-3 py-2 border border-blue-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                      onChange={(e) => {
                        const addr = pastAddresses.find((a: any) => a.address + a.province === e.target.value);
                        if (addr) {
                          setShippingAddress(addr as ShippingAddress);
                        }
                      }}
                      defaultValue=""
                    >
                      <option value="" disabled>-- Chọn địa chỉ đã dùng --</option>
                      {pastAddresses.map((addr: any, idx) => (
                        <option key={idx} value={addr.address + addr.province}>
                          {addr.address}, {addr.ward}, {addr.province}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                <div>
                  <label className="block text-sm font-semibold mb-1">
                    Họ Tên *
                  </label>
                  <input
                    type="text"
                    value={shippingAddress.fullName}
                    onChange={(e) =>
                      setShippingAddress({ ...shippingAddress, fullName: e.target.value })
                    }
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.fullName ? "border-red-500" : "border-gray-300"
                    }`}
                    placeholder="Nguyễn Văn A"
                  />
                  {errors.fullName && (
                    <p className="text-red-500 text-sm mt-1">{errors.fullName}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-1">
                    Địa chỉ *
                  </label>
                  <input
                    type="text"
                    value={shippingAddress.address}
                    onChange={(e) =>
                      setShippingAddress({ ...shippingAddress, address: e.target.value })
                    }
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.address ? "border-red-500" : "border-gray-300"
                    }`}
                    placeholder="123 Nguyễn Huệ, Phường Bến Nghé"
                  />
                  {errors.address && (
                    <p className="text-red-500 text-sm mt-1">{errors.address}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold mb-1">Tỉnh/Thành phố *</label>
                    <select
                      value={shippingAddress.province}
                      onChange={(e) => {
                        const selected = provinces.find((p) => p.name === e.target.value);
                        setShippingAddress({ ...shippingAddress, province: e.target.value, ward: "" });
                        setSelectedProvinceCode(selected ? selected.code : null);
                        setCachedDistanceKm(null); // Reset cache khi đổi tỉnh/thành
                      }}
                      disabled={loadingProvinces}
                      className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 ${
                        errors.province ? "border-red-500" : "border-gray-300"
                      }`}
                    >
                      <option value="">{loadingProvinces ? "Đang tải..." : "Chọn Tỉnh/Thành"}</option>
                      {provinces.map((p) => (
                        <option key={p.code} value={p.name}>{p.name}</option>
                      ))}
                    </select>
                    {errors.province && <p className="text-red-500 text-sm mt-1">{errors.province}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold mb-1">Phường/Xã *</label>
                    <select
                      value={shippingAddress.ward}
                      onChange={(e) => {
                        setShippingAddress({ ...shippingAddress, ward: e.target.value });
                        setCachedDistanceKm(null); // Reset cache khi đổi phường/xã
                      }}
                      disabled={!shippingAddress.province || loadingWards}
                      className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 ${
                        errors.ward ? "border-red-500" : "border-gray-300"
                      }`}
                    >
                      <option value="">{loadingWards ? "Đang tải..." : "Chọn Phường/Xã"}</option>
                      {wards.map((w) => (
                        <option key={w.code} value={w.name}>{w.name}</option>
                      ))}
                    </select>
                    {errors.ward && <p className="text-red-500 text-sm mt-1">{errors.ward}</p>}
                  </div>
                </div>

                {/* Ghi chú: Theo Nghị quyết 202/2025/QH15 */}
                <div className="mt-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="text-xs text-amber-800 flex items-center gap-1">
                    <Info className="w-3.5 h-3.5 flex-shrink-0" />
                    Địa giới hành chính theo Nghị quyết 202/2025/QH15 (mô hình 2 cấp: Tỉnh/TP → Phường/Xã, có hiệu lực từ 01/07/2025).
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-1">
                    Số điện thoại *
                  </label>
                  <input
                    type="tel"
                    value={shippingAddress.phone}
                    onChange={(e) =>
                      setShippingAddress({ ...shippingAddress, phone: e.target.value })
                    }
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.phone ? "border-red-500" : "border-gray-300"
                    }`}
                    placeholder="0912 345 678"
                  />
                  {errors.phone && (
                    <p className="text-red-500 text-sm mt-1">{errors.phone}</p>
                  )}
                </div>
              </div>

              <button
                onClick={handleNext}
                className="w-full mt-6 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors font-semibold"
              >
                Tiếp tục Vận chuyển
              </button>
            </div>
          )}

          {/* Step 2: Delivery Options */}
          {step === 2 && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center gap-2 mb-6">
                <Truck className="w-6 h-6 text-blue-600" />
                <h2 className="text-xl font-bold">Tùy chọn Vận chuyển</h2>
              </div>

              {/* Perishable Warning */}
              {hasPerishableItems && (
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-orange-900 text-sm">⚠️ Giỏ hàng có sản phẩm tươi sống</p>
                      <p className="text-sm text-orange-700 mt-1">
                        Đơn hàng của bạn có sản phẩm dễ hỏng. Chúng tôi khuyến nghị chọn <strong>Giao Hàng Nhanh</strong> hoặc <strong>Giao Trong Ngày</strong> và khung giờ <strong>Sáng sớm</strong> để đảm bảo độ tươi.
                      </p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {cart.filter(item => item.product.isPerishable).map(item => (
                          <span key={item.product.id} className="inline-flex items-center gap-1 text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded-full">
                            🧊 {item.product.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Delivery Method Selection */}
              <div className="space-y-3 mb-6">
                {DELIVERY_OPTIONS.map((option) => {
                  // Miễn Phí chỉ khả dụng khi đơn >= 500.000₫
                  const isFreeDisabled = option.id === "free" && subtotal < 500000;
                  return (
                  <label
                    key={option.id}
                    className={`block p-4 border-2 rounded-lg transition-colors ${
                      isFreeDisabled
                        ? "border-gray-100 bg-gray-50 opacity-50 cursor-not-allowed"
                        : selectedDelivery.id === option.id
                          ? "border-blue-600 bg-blue-50 cursor-pointer"
                          : "border-gray-200 hover:border-gray-300 cursor-pointer"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <input
                          type="radio"
                          name="delivery"
                          checked={selectedDelivery.id === option.id}
                          onChange={() => !isFreeDisabled && setSelectedDelivery(option)}
                          disabled={isFreeDisabled}
                          className="w-5 h-5 text-blue-600"
                        />
                        <div>
                          <p className="font-semibold">{option.name}</p>
                          <p className="text-sm text-gray-600">{option.estimatedDays}</p>
                          {isFreeDisabled && (
                            <p className="text-xs text-red-500 mt-0.5">Cần đơn tối thiểu 500.000₫</p>
                          )}
                        </div>
                      </div>
                      <p className="font-bold">
                        {option.price === 0 ? "MIỄN PHÍ" : `Phí cơ bản ${option.price.toLocaleString("vi-VN")}₫`}
                      </p>
                    </div>
                  </label>
                  );
                })}
              </div>

              {/* ═══ Delivery Slot Selection ═══ */}
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <Clock className="w-5 h-5 text-blue-600" />
                  <h3 className="font-bold text-lg">Chọn khung giờ nhận hàng</h3>
                </div>
                <p className="text-sm text-gray-600 mb-4">
                  Chọn khung giờ mong muốn nhận hàng. Với sản phẩm tươi sống, chúng tôi khuyến nghị nhận hàng vào buổi sáng sớm.
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {DELIVERY_SLOTS.map((slot) => (
                    <label
                      key={slot.id}
                      className={`block p-4 border-2 rounded-lg cursor-pointer transition-all text-center ${
                        selectedSlot === slot.id
                          ? "border-blue-600 bg-blue-50 shadow-sm"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <input
                        type="radio"
                        name="deliverySlot"
                        value={slot.id}
                        checked={selectedSlot === slot.id}
                        onChange={() => setSelectedSlot(slot.id)}
                        className="sr-only"
                      />
                      <span className="text-2xl block mb-2">{slot.icon}</span>
                      <p className="font-semibold text-sm">{slot.label}</p>
                      <p className="text-xs text-gray-500 mt-1">{slot.timeRange}</p>
                      {slot.id === "early-morning" && hasPerishableItems && (
                        <span className="inline-block mt-2 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Khuyến nghị</span>
                      )}
                    </label>
                  ))}
                </div>
              </div>

              {/* ═══ Substitution Preferences ═══ */}
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <RefreshCw className="w-5 h-5 text-blue-600" />
                  <h3 className="font-bold text-lg">Tùy chọn thay thế sản phẩm</h3>
                </div>
                <p className="text-sm text-gray-600 mb-4">
                  Nông sản có thể hết hàng hoặc không đạt chất lượng ở phút cuối. Vui lòng chọn cách xử lý.
                </p>
                <div className="space-y-3">
                  {[
                    { id: "no-sub", label: "Không cho thay thế", desc: "Bỏ qua sản phẩm hết hàng, không thay thế bằng sản phẩm khác", icon: "🚫" },
                    { id: "call-first", label: "Gọi xác nhận trước khi thay", desc: "Nhân viên sẽ gọi điện xác nhận trước khi thay thế bằng sản phẩm tương đương", icon: "📞" },
                  ].map((opt) => (
                    <label
                      key={opt.id}
                      className={`block p-4 border-2 rounded-lg cursor-pointer transition-all ${
                        substitutionPref === opt.id
                          ? "border-blue-600 bg-blue-50 shadow-sm"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="radio"
                          name="substitution"
                          value={opt.id}
                          checked={substitutionPref === opt.id}
                          onChange={() => setSubstitutionPref(opt.id)}
                          className="w-5 h-5 text-blue-600"
                        />
                        <span className="text-lg">{opt.icon}</span>
                        <div>
                          <p className="font-semibold">{opt.label}</p>
                          <p className="text-sm text-gray-500">{opt.desc}</p>
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* ═══ Delivery Note ═══ */}
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <MessageSquare className="w-5 h-5 text-blue-600" />
                  <h3 className="font-bold">Ghi chú giao hàng</h3>
                </div>
                <textarea
                  value={deliveryNote}
                  onChange={(e) => setDeliveryNote(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  placeholder="Ví dụ: Gọi điện trước khi giao, để hàng ở bảo vệ tòa nhà, giao cổng sau..."
                />
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => setStep(1)}
                  className="flex-1 border-2 border-gray-300 py-3 rounded-lg hover:bg-gray-50 transition-colors font-semibold"
                >
                  Quay lại
                </button>
                <button
                  onClick={handleNext}
                  className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors font-semibold"
                >
                  Tiếp tục Thanh toán
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Payment */}
          {step === 3 && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center gap-2 mb-6">
                <CreditCard className="w-6 h-6 text-blue-600" />
                <h2 className="text-xl font-bold">Phương thức Thanh toán</h2>
              </div>

              {/* Security Notice */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                <div className="flex items-start gap-3">
                  <Lock className="w-5 h-5 text-green-600 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-semibold text-green-900 mb-1">
                      Xử lý Thanh toán An toàn
                    </p>
                    <p className="text-green-700">
                      Thông tin thanh toán của bạn được mã hóa và không bao giờ được lưu trữ trên máy chủ của chúng tôi.
                      Chúng tôi sử dụng chuẩn mã hóa SSL/TLS.
                    </p>
                  </div>
                </div>
              </div>

              {/* Payment Method Selection */}
              <div className="space-y-3 mb-6">
                {PAYMENT_METHODS.map((method) => (
                  <label
                    key={method.id}
                    className={`block p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                      selectedPayment === method.id
                        ? "border-blue-600 bg-blue-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="payment"
                        checked={selectedPayment === method.id}
                        onChange={() => setSelectedPayment(method.id)}
                        className="w-5 h-5 text-blue-600"
                      />
                      <p className="font-semibold">{method.name}</p>
                    </div>
                  </label>
                ))}
              </div>

              {/* Card Details (only for card payment) */}
              {selectedPayment === "card" && (
                <div className="space-y-4 mb-6">
                  <div>
                    <label className="block text-sm font-semibold mb-1">
                      Số thẻ *
                    </label>
                    <input
                      type="text"
                      value={cardDetails.number}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\s/g, "");
                        if (/^\d{0,16}$/.test(value)) {
                          setCardDetails({ ...cardDetails, number: value });
                        }
                      }}
                      className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.cardNumber ? "border-red-500" : "border-gray-300"
                      }`}
                      placeholder="1234 5678 9012 3456"
                      maxLength={16}
                    />
                    {errors.cardNumber && (
                      <p className="text-red-500 text-sm mt-1">{errors.cardNumber}</p>
                    )}
                    <p className="text-xs text-gray-500 mt-1">
                      Demo: Dùng 4242424242424242 để thử nghiệm
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold mb-1">
                      Tên chủ thẻ *
                    </label>
                    <input
                      type="text"
                      value={cardDetails.name}
                      onChange={(e) =>
                        setCardDetails({ ...cardDetails, name: e.target.value })
                      }
                      className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.cardName ? "border-red-500" : "border-gray-300"
                      }`}
                      placeholder="NGUYEN VAN A"
                    />
                    {errors.cardName && (
                      <p className="text-red-500 text-sm mt-1">{errors.cardName}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold mb-1">
                        Ngày hết hạn *
                      </label>
                      <input
                        type="text"
                        value={cardDetails.expiry}
                        onChange={(e) => {
                          let value = e.target.value.replace(/\D/g, "");
                          if (value.length >= 2) {
                            value = value.slice(0, 2) + "/" + value.slice(2, 4);
                          }
                          setCardDetails({ ...cardDetails, expiry: value });
                        }}
                        className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          errors.cardExpiry ? "border-red-500" : "border-gray-300"
                        }`}
                        placeholder="MM/YY"
                        maxLength={5}
                      />
                      {errors.cardExpiry && (
                        <p className="text-red-500 text-sm mt-1">{errors.cardExpiry}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-semibold mb-1">CVV *</label>
                      <input
                        type="text"
                        value={cardDetails.cvv}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, "");
                          if (value.length <= 4) {
                            setCardDetails({ ...cardDetails, cvv: value });
                          }
                        }}
                        className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          errors.cardCvv ? "border-red-500" : "border-gray-300"
                        }`}
                        placeholder="123"
                        maxLength={4}
                      />
                      {errors.cardCvv && (
                        <p className="text-red-500 text-sm mt-1">{errors.cardCvv}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {selectedPayment !== "card" && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                  <p className="text-sm text-blue-900">
                    Bạn sẽ được chuyển hướng để hoàn tất thanh toán sau khi đặt hàng.
                  </p>
                </div>
              )}

              <div className="flex gap-4">
                <button
                  onClick={() => setStep(2)}
                  className="flex-1 border-2 border-gray-300 py-3 rounded-lg hover:bg-gray-50 transition-colors font-semibold"
                >
                  Quay lại
                </button>
                <button
                  onClick={handlePlaceOrder}
                  className="flex-1 bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition-colors font-semibold"
                >
                  Đặt hàng
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-sm p-6 sticky top-20">
            <h2 className="text-xl font-bold mb-4">Tóm Tắt Đơn Hàng</h2>
            
            <div className="space-y-3 mb-4 max-h-64 overflow-y-auto">
              {cart.map((item) => (
                <div key={item.product.id} className="flex gap-3">
                  <img
                    src={item.product.image}
                    alt={item.product.name}
                    className="w-16 h-16 object-cover rounded"
                  />
                  <div className="flex-1">
                    <p className="font-semibold text-sm">{item.product.name}</p>
                    <p className="text-sm text-gray-600">SL: {item.quantity}</p>
                    {item.product.isPerishable && (
                      <span className="inline-flex items-center gap-1 text-xs text-orange-600">
                        🧊 Hàng tươi
                      </span>
                    )}
                    <p className="text-sm font-bold">
                      {(item.product.price * item.quantity).toLocaleString("vi-VN")}₫
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* ── Voucher Input ── */}
            <div className="border-t pt-4 mb-4">
              <p className="text-sm font-semibold mb-2 flex items-center gap-1">
                <Tag className="w-4 h-4 text-blue-600" />
                Mã Voucher
              </p>
              {appliedVoucher ? (
                <div className="flex items-center gap-2 bg-green-50 border border-green-300 rounded-lg px-3 py-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-green-800">{appliedVoucher.code}</p>
                    <p className="text-xs text-green-700 truncate">{appliedVoucher.description}</p>
                  </div>
                  <button
                    onClick={() => {
                      setAppliedVoucher(null);
                      setVoucherCode("");
                      setVoucherSuccess("");
                    }}
                    className="text-gray-400 hover:text-red-500 flex-shrink-0"
                    title="Hủy voucher"
                  >
                    <XCircle className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={voucherCode}
                      onChange={(e) => {
                        setVoucherCode(e.target.value.toUpperCase());
                        setVoucherError("");
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          const result = validateVoucher(voucherCode.trim(), subtotal, cartCategories);
                          if (result.valid && result.voucher) {
                            setAppliedVoucher(result.voucher);
                            setVoucherError("");
                            setVoucherSuccess(`Áp dụng thành công! Giảm ${result.voucher.discountType === "fixed" ? result.voucher.discountValue.toLocaleString("vi-VN") + "₫" : result.voucher.discountValue + "%"}`);
                            toast.success("Đã áp dụng voucher!");
                          } else {
                            setVoucherError(result.error || "Voucher không hợp lệ.");
                          }
                        }
                      }}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase"
                      placeholder="Nhập mã voucher"
                    />
                    <button
                      onClick={() => {
                        const result = validateVoucher(voucherCode.trim(), subtotal, cartCategories);
                        if (result.valid && result.voucher) {
                          setAppliedVoucher(result.voucher);
                          setVoucherError("");
                          setVoucherSuccess(`Áp dụng thành công!`);
                          toast.success("Đã áp dụng voucher!");
                        } else {
                          setVoucherError(result.error || "Voucher không hợp lệ.");
                        }
                      }}
                      className="px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors whitespace-nowrap"
                    >
                      Áp dụng
                    </button>
                  </div>
                  {voucherError && (
                    <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                      <XCircle className="w-3 h-3" />
                      {voucherError}
                    </p>
                  )}
                  {voucherSuccess && !voucherError && (
                    <p className="text-green-600 text-xs mt-1 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      {voucherSuccess}
                    </p>
                  )}
                </>
              )}
            </div>

            <div className="border-t pt-4 space-y-2 mb-4">
              <div className="flex justify-between text-gray-700">
                <span>Tạm tính</span>
                <span>{subtotal.toLocaleString("vi-VN")}₫</span>
              </div>
              {voucherDiscount > 0 && (
                <div className="flex justify-between text-green-700 font-medium">
                  <span className="flex items-center gap-1">
                    <Tag className="w-3 h-3" />
                    Giảm giá ({appliedVoucher?.code})
                  </span>
                  <span>-{voucherDiscount.toLocaleString("vi-VN")}₫</span>
                </div>
              )}
              <div className="flex justify-between text-gray-700">
                <span>Thuế (10%)</span>
                <span>{tax.toLocaleString("vi-VN")}₫</span>
              </div>
              {step >= 2 && (
                <>
                  <div className="flex justify-between text-gray-700">
                    <span className="flex items-center gap-1">
                      Vận chuyển
                      {isRecalculating && (
                        <span className="inline-block w-3 h-3 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                      )}
                    </span>
                    <span>
                      {isRecalculating
                        ? "Đang tính..."
                        : deliveryFee === 0
                          ? "MIỄN PHÍ"
                          : `${deliveryFee.toLocaleString("vi-VN")}₫`}
                    </span>
                  </div>

                  {/* ── Chi tiết tính phí vận chuyển ── */}
                  {shippingBreakdown && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs space-y-1.5">
                      <p className="font-semibold text-blue-900 flex items-center gap-1 text-sm mb-2">
                        <MapPin className="w-3.5 h-3.5" />
                        Chi tiết phí vận chuyển
                      </p>
                      <div className="flex justify-between text-blue-800">
                        <span>Phí cơ bản ({selectedDelivery.name}):</span>
                        <span>{shippingBreakdown.baseFee.toLocaleString("vi-VN")}₫</span>
                      </div>
                      <div className="flex justify-between text-blue-800">
                        <span>Phí khoảng cách (~{shippingBreakdown.distanceKm} km × 500₫/km):</span>
                        <span>{shippingBreakdown.distanceFee.toLocaleString("vi-VN")}₫</span>
                      </div>
                      <div className="flex justify-between text-blue-800">
                        <span>Phí đóng gói ({shippingBreakdown.itemCount} sản phẩm × 2.000₫):</span>
                        <span>{shippingBreakdown.weightFee.toLocaleString("vi-VN")}₫</span>
                      </div>
                      {shippingBreakdown.surcharge > 0 && (
                        <div className="flex justify-between text-orange-700">
                          <span>Phụ phí vùng xa ({shippingBreakdown.distanceKm > 100 ? ">100km" : ">30km"}):</span>
                          <span>{shippingBreakdown.surcharge.toLocaleString("vi-VN")}₫</span>
                        </div>
                      )}
                      <div className="border-t border-blue-300 pt-1 mt-1 flex justify-between font-bold text-blue-900">
                        <span>Tổng phí vận chuyển:</span>
                        <span>{deliveryFee.toLocaleString("vi-VN")}₫</span>
                      </div>
                    </div>
                  )}

                  <div className="flex justify-between text-gray-600 text-sm">
                    <span>Khung giờ</span>
                    <span>{DELIVERY_SLOTS.find(s => s.id === selectedSlot)?.label} ({DELIVERY_SLOTS.find(s => s.id === selectedSlot)?.timeRange})</span>
                  </div>
                </>
              )}
              <div className="border-t pt-2 flex justify-between font-bold text-lg">
                <span>Tổng cộng</span>
                <span className="text-blue-600">{total.toLocaleString("vi-VN")}₫</span>
              </div>
            </div>

            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-green-600" />
                <span>Thanh toán an toàn</span>
              </div>
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-green-600" />
                <span>Mã hóa SSL</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
