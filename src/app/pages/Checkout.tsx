import { useState } from "react";
import { useNavigate } from "react-router";
import { useShop } from "../context/ShopContext";
import { useAuth } from "../context/AuthContext";
import { DELIVERY_OPTIONS, PAYMENT_METHODS } from "../data/products";
import { ShippingAddress, DeliveryOption, Order } from "../types";
import { CreditCard, Truck, ShieldCheck, Lock } from "lucide-react";
import { toast } from "sonner";

export function Checkout() {
  const { role } = useAuth();
  const { cart, getCartTotal, placeOrder } = useShop();
  const navigate = useNavigate();
  
  const [step, setStep] = useState(1); // 1: Shipping, 2: Delivery, 3: Payment
  
  const [shippingAddress, setShippingAddress] = useState<ShippingAddress>({
    fullName: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    country: "",
    phone: "",
  });

  const [selectedDelivery, setSelectedDelivery] = useState<DeliveryOption>(DELIVERY_OPTIONS[0]);
  const [selectedPayment, setSelectedPayment] = useState(PAYMENT_METHODS[0].id);
  
  const [cardDetails, setCardDetails] = useState({
    number: "",
    name: "",
    expiry: "",
    cvv: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const subtotal = getCartTotal();
  const tax = subtotal * 0.1;
  const deliveryFee = selectedDelivery.price;
  const total = subtotal + tax + deliveryFee;

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
    if (!shippingAddress.city.trim() || shippingAddress.city.length < 2) {
      newErrors.city = "Cần nhập thành phố";
    }
    if (!shippingAddress.state.trim()) {
      newErrors.state = "Cần nhập tỉnh/thành";
    }
    if (!/^\d{5}(-\d{4})?$/.test(shippingAddress.zipCode)) {
      newErrors.zipCode = "Cần nhập mã bưu điện hợp lệ";
    }
    if (!shippingAddress.country.trim()) {
      newErrors.country = "Cần nhập quốc gia";
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

  const handleNext = () => {
    if (step === 1 && validateShipping()) {
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
      };

      placeOrder(order);
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

              <div className="space-y-4">
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
                    placeholder="John Doe"
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
                    placeholder="123 Main Street, Apt 4B"
                  />
                  {errors.address && (
                    <p className="text-red-500 text-sm mt-1">{errors.address}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold mb-1">Thành phố *</label>
                    <input
                      type="text"
                      value={shippingAddress.city}
                      onChange={(e) =>
                        setShippingAddress({ ...shippingAddress, city: e.target.value })
                      }
                      className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.city ? "border-red-500" : "border-gray-300"
                      }`}
                      placeholder="New York"
                    />
                    {errors.city && (
                      <p className="text-red-500 text-sm mt-1">{errors.city}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold mb-1">Tỉnh/Thành phố *</label>
                    <input
                      type="text"
                      value={shippingAddress.state}
                      onChange={(e) =>
                        setShippingAddress({ ...shippingAddress, state: e.target.value })
                      }
                      className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.state ? "border-red-500" : "border-gray-300"
                      }`}
                      placeholder="NY"
                    />
                    {errors.state && (
                      <p className="text-red-500 text-sm mt-1">{errors.state}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold mb-1">
                      Mã bưu điện *
                    </label>
                    <input
                      type="text"
                      value={shippingAddress.zipCode}
                      onChange={(e) =>
                        setShippingAddress({ ...shippingAddress, zipCode: e.target.value })
                      }
                      className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.zipCode ? "border-red-500" : "border-gray-300"
                      }`}
                      placeholder="10001"
                    />
                    {errors.zipCode && (
                      <p className="text-red-500 text-sm mt-1">{errors.zipCode}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold mb-1">
                      Quốc gia *
                    </label>
                    <input
                      type="text"
                      value={shippingAddress.country}
                      onChange={(e) =>
                        setShippingAddress({ ...shippingAddress, country: e.target.value })
                      }
                      className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.country ? "border-red-500" : "border-gray-300"
                      }`}
                      placeholder="United States"
                    />
                    {errors.country && (
                      <p className="text-red-500 text-sm mt-1">{errors.country}</p>
                    )}
                  </div>
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
                    placeholder="+1 (555) 123-4567"
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

              <div className="space-y-3 mb-6">
                {DELIVERY_OPTIONS.map((option) => (
                  <label
                    key={option.id}
                    className={`block p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                      selectedDelivery.id === option.id
                        ? "border-blue-600 bg-blue-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <input
                          type="radio"
                          name="delivery"
                          checked={selectedDelivery.id === option.id}
                          onChange={() => setSelectedDelivery(option)}
                          className="w-5 h-5 text-blue-600"
                        />
                        <div>
                          <p className="font-semibold">{option.name}</p>
                          <p className="text-sm text-gray-600">{option.estimatedDays}</p>
                        </div>
                      </div>
                      <p className="font-bold">
                        {option.price === 0 ? "MIỄN PHÍ" : `${option.price.toLocaleString("vi-VN")}₫`}
                      </p>
                    </div>
                  </label>
                ))}
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
                      placeholder="John Doe"
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
                    <p className="text-sm font-bold">
                      {(item.product.price * item.quantity).toLocaleString("vi-VN")}₫
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t pt-4 space-y-2 mb-4">
              <div className="flex justify-between text-gray-700">
                <span>Tạm tính</span>
                <span>{subtotal.toLocaleString("vi-VN")}₫</span>
              </div>
              <div className="flex justify-between text-gray-700">
                <span>Thuế (10%)</span>
                <span>{tax.toLocaleString("vi-VN")}₫</span>
              </div>
              {step >= 2 && (
                <div className="flex justify-between text-gray-700">
                  <span>Vận chuyển</span>
                  <span>
                    {deliveryFee === 0 ? "MIỄN PHÍ" : `${deliveryFee.toLocaleString("vi-VN")}₫`}
                  </span>
                </div>
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
