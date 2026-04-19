import { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router";
import { useShop } from "../context/ShopContext";
import { useAuth } from "../context/AuthContext";
import { Package, Truck, CheckCircle, XCircle, Clock, AlertTriangle, ShoppingCart, RotateCcw } from "lucide-react";
import { Order } from "../types";
import { toast } from "sonner";

const CANCEL_WINDOW_MS = 5 * 60 * 1000; // 5 minutes

/** Returns remaining ms in the cancellation window, or 0 if expired. */
function getRemainingMs(order: Order): number {
  const elapsed = Date.now() - new Date(order.orderDate).getTime();
  return Math.max(0, CANCEL_WINDOW_MS - elapsed);
}

/** Format ms as "M:SS" */
function formatCountdown(ms: number): string {
  const totalSeconds = Math.ceil(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

/** Returns true if this order is eligible for cancellation (within 5 min + right status). */
function isCancellable(order: Order): boolean {
  if (order.status !== "pending" && order.status !== "processing") return false;
  return getRemainingMs(order) > 0;
}

/**
 * A self-updating countdown badge that shows the remaining time to cancel.
 * When time runs out it hides the cancel button automatically.
 */
function CancelCountdown({
  order,
  onCancel,
}: {
  order: Order;
  onCancel: (orderId: string) => void;
}) {
  const [remaining, setRemaining] = useState(() => getRemainingMs(order));
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    if (remaining <= 0) return;
    const timer = setInterval(() => {
      const r = getRemainingMs(order);
      setRemaining(r);
      if (r <= 0) clearInterval(timer);
    }, 1000);
    return () => clearInterval(timer);
  }, [order]);

  const handleCancel = useCallback(() => {
    if (!confirming) {
      setConfirming(true);
      return;
    }
    onCancel(order.id);
    setConfirming(false);
  }, [confirming, onCancel, order.id]);

  if (remaining <= 0) return null;

  const urgency = remaining < 60_000; // less than 1 minute

  return (
    <div className="mt-4 pt-4 border-t border-dashed border-orange-200">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold ${
              urgency
                ? "bg-red-100 text-red-700 animate-pulse"
                : "bg-orange-100 text-orange-700"
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Hủy trong {formatCountdown(remaining)}</span>
          </div>
          {urgency && (
            <span className="text-xs text-red-500 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />
              Sắp hết hạn!
            </span>
          )}
        </div>

        {confirming ? (
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Bạn chắc chắn muốn hủy?</span>
            <button
              onClick={handleCancel}
              className="px-4 py-2 bg-red-600 text-white text-sm font-semibold rounded-lg hover:bg-red-700 transition-colors"
            >
              Xác nhận hủy
            </button>
            <button
              onClick={() => setConfirming(false)}
              className="px-4 py-2 border border-gray-300 text-sm font-semibold rounded-lg hover:bg-gray-50 transition-colors"
            >
              Không
            </button>
          </div>
        ) : (
          <button
            onClick={handleCancel}
            className="flex items-center gap-2 px-4 py-2 border-2 border-red-300 text-red-600 text-sm font-semibold rounded-lg hover:bg-red-50 hover:border-red-400 transition-colors"
          >
            <XCircle className="w-4 h-4" />
            Hủy đơn hàng
          </button>
        )}
      </div>

      {/* Progress bar showing remaining time */}
      <div className="mt-3">
        <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-1000 ${
              urgency ? "bg-red-500" : "bg-orange-400"
            }`}
            style={{ width: `${(remaining / CANCEL_WINDOW_MS) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
}

export function Orders() {
  const { role } = useAuth();
  const { orders, cancelOrder, addToCart, products } = useShop();
  const navigate = useNavigate();

  // Force a re-render every second so the cancellable check stays fresh
  const [, setTick] = useState(0);
  useEffect(() => {
    const hasCancellable = orders.some(isCancellable);
    if (!hasCancellable) return;
    const timer = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(timer);
  }, [orders]);

  const handleCancelOrder = useCallback(
    (orderId: string) => {
      const success = cancelOrder(orderId);
      if (success) {
        toast.success("Đơn hàng đã được hủy thành công!");
      } else {
        toast.error("Không thể hủy đơn hàng. Đã quá thời hạn 5 phút hoặc đơn đã xử lý.");
      }
    },
    [cancelOrder],
  );

  /** Buy Again: re-add all available items from a past order to the cart */
  const handleBuyAgain = useCallback(
    (order: Order) => {
      let addedCount = 0;
      let outOfStockItems: string[] = [];

      order.items.forEach((item) => {
        // Find the current version of the product (in case stock changed)
        const currentProduct = products.find((p) => p.id === item.product.id);
        if (currentProduct && currentProduct.stock > 0) {
          const qty = Math.min(item.quantity, currentProduct.stock);
          addToCart(currentProduct, qty);
          addedCount += qty;
        } else {
          outOfStockItems.push(item.product.name);
        }
      });

      if (addedCount > 0) {
        toast.success(`Đã thêm ${addedCount} sản phẩm vào giỏ hàng!`);
      }
      if (outOfStockItems.length > 0) {
        toast.error(`Hết hàng: ${outOfStockItems.join(", ")}`);
      }
      if (addedCount > 0) {
        navigate("/cart");
      }
    },
    [products, addToCart, navigate],
  );

  if (role !== "consumer") {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center">
          <Package className="w-24 h-24 text-gray-300 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Đăng nhập để xem đơn hàng</h2>
          <p className="text-gray-600 mb-8">
            Lịch sử mua hàng chỉ dành cho khách hàng đã đăng nhập.
          </p>
          <Link
            to="/auth"
            className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Đăng nhập khách hàng
          </Link>
        </div>
      </div>
    );
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="w-5 h-5 text-yellow-600" />;
      case "processing":
        return <Package className="w-5 h-5 text-blue-600" />;
      case "shipped":
        return <Truck className="w-5 h-5 text-purple-600" />;
      case "delivered":
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case "cancelled":
        return <XCircle className="w-5 h-5 text-red-600" />;
      default:
        return <Package className="w-5 h-5 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "processing":
        return "bg-blue-100 text-blue-800";
      case "shipped":
        return "bg-purple-100 text-purple-800";
      case "delivered":
        return "bg-green-100 text-green-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "pending":
        return "Chờ xử lý";
      case "processing":
        return "Đang xử lý";
      case "shipped":
        return "Đang giao";
      case "delivered":
        return "Đã giao";
      case "cancelled":
        return "Đã hủy";
      default:
        return status;
    }
  };

  if (orders.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center">
          <Package className="w-24 h-24 text-gray-300 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Chưa có đơn hàng nào</h2>
          <p className="text-gray-600 mb-8">
            Các đơn hàng bạn đặt sẽ xuất hiện ở đây.
          </p>
          <Link
            to="/products"
            className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Bắt Đầu Mua Sắm
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold mb-8">Lịch Sử Đơn Hàng</h1>

      <div className="space-y-6">
        {orders.map((order) => (
          <div key={order.id} className="bg-white rounded-lg shadow-sm overflow-hidden">
            {/* Order Header */}
            <div className="bg-gray-50 px-6 py-4 border-b">
              <div className="flex flex-wrap justify-between items-center gap-4">
                <div>
                  <p className="font-semibold text-lg">{order.id}</p>
                  <p className="text-sm text-gray-600">
                    Đặt lúc {new Date(order.orderDate).toLocaleDateString("vi-VN")}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-sm text-gray-600">Tổng</p>
                    <p className="font-bold text-lg">{order.total.toLocaleString("vi-VN")}₫</p>
                  </div>
                  <div className={`flex items-center gap-2 px-4 py-2 rounded-full ${getStatusColor(order.status)}`}>
                    {getStatusIcon(order.status)}
                    <span className="font-semibold">{getStatusLabel(order.status)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Order Details */}
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                {/* Địa chỉ giao hàng */}
                <div>
                  <h3 className="font-semibold mb-2 flex items-center gap-2">
                    <Truck className="w-4 h-4" />
                    Địa chỉ giao hàng
                  </h3>
                  <div className="text-sm text-gray-700 space-y-1">
                    <p>{order.shippingAddress.fullName}</p>
                    <p>{order.shippingAddress.address}</p>
                    <p>
                      {order.shippingAddress.city}, {order.shippingAddress.state}{" "}
                      {order.shippingAddress.zipCode}
                    </p>
                    <p>{order.shippingAddress.country}</p>
                    <p>{order.shippingAddress.phone}</p>
                  </div>
                </div>

                {/* Delivery Info */}
                <div>
                  <h3 className="font-semibold mb-2 flex items-center gap-2">
                    <Package className="w-4 h-4" />
                    Thông tin vận chuyển
                  </h3>
                  <div className="text-sm text-gray-700 space-y-1">
                    <p>
                      <span className="font-semibold">Phương thức:</span>{" "}
                      {order.deliveryOption.name}
                    </p>
                    <p>
                      <span className="font-semibold">Dự kiến:</span>{" "}
                      {new Date(order.estimatedDelivery).toLocaleDateString("vi-VN")}
                    </p>
                    <p>
                      <span className="font-semibold">Thanh toán:</span> {order.paymentMethod}
                    </p>
                    {order.deliverySlot && (
                      <p>
                        <span className="font-semibold">Khung giờ:</span>{" "}
                        <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 px-2 py-0.5 rounded text-xs font-medium">
                          <Clock className="w-3 h-3" />
                          {order.deliverySlot}
                        </span>
                      </p>
                    )}
                    {order.deliveryNote && (
                      <p>
                        <span className="font-semibold">Ghi chú:</span>{" "}
                        <span className="italic text-gray-600">{order.deliveryNote}</span>
                      </p>
                    )}
                    {order.substitutionPref && (
                      <p>
                        <span className="font-semibold">Thay thế SP:</span>{" "}
                        <span className="inline-flex items-center gap-1 bg-purple-50 text-purple-700 px-2 py-0.5 rounded text-xs font-medium">
                          {order.substitutionPref}
                        </span>
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Order Items */}
              <div>
                <h3 className="font-semibold mb-3">Sản phẩm ({order.items.length})</h3>
                <div className="space-y-3">
                  {order.items.map((item) => (
                    <div
                      key={item.product.id}
                      className="flex gap-4 p-3 bg-gray-50 rounded-lg"
                    >
                      <img
                        src={item.product.image}
                        alt={item.product.name}
                        className="w-20 h-20 object-cover rounded"
                      />
                      <div className="flex-1">
                        <Link
                          to={`/products/${item.product.id}`}
                          className="font-semibold hover:text-blue-600"
                        >
                          {item.product.name}
                        </Link>
                        <p className="text-sm text-gray-600">
                          Số lượng: {item.quantity}
                        </p>
                        <p className="text-sm font-semibold mt-1">
                          {(item.product.price * item.quantity).toLocaleString("vi-VN")}₫
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Order Tracking */}
              {order.status !== "cancelled" && (
                <div className="mt-6 pt-6 border-t">
                  <h3 className="font-semibold mb-3">Tiến trình đơn hàng</h3>
                  <div className="flex items-center justify-between">
                    {[
                      { label: "Chờ xử lý", status: "pending" },
                      { label: "Đang xử lý", status: "processing" },
                      { label: "Đang giao", status: "shipped" },
                      { label: "Đã giao", status: "delivered" },
                    ].map((step, idx, arr) => {
                      const isCompleted =
                        arr.findIndex((s) => s.status === order.status) >= idx;
                      return (
                        <div key={step.status} className="flex items-center flex-1">
                          <div className="flex flex-col items-center">
                            <div
                              className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                isCompleted
                                  ? "bg-blue-600 text-white"
                                  : "bg-gray-200 text-gray-600"
                              }`}
                            >
                              {isCompleted ? "✓" : idx + 1}
                            </div>
                            <span className="text-xs mt-1">{step.label}</span>
                          </div>
                          {idx < arr.length - 1 && (
                            <div
                              className={`h-1 flex-1 mx-2 ${
                                isCompleted ? "bg-blue-600" : "bg-gray-200"
                              }`}
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Cancelled notice */}
              {order.status === "cancelled" && (
                <div className="mt-6 pt-6 border-t">
                  <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-lg p-4">
                    <XCircle className="w-6 h-6 text-red-500 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-red-800">Đơn hàng đã bị hủy</p>
                      <p className="text-sm text-red-600">
                        Đơn hàng này đã được hủy bởi bạn. Số tiền sẽ được hoàn trả trong 3-5 ngày làm việc.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Cancel order section — shown only while within the 5-min window */}
              {isCancellable(order) && (
                <CancelCountdown order={order} onCancel={handleCancelOrder} />
              )}

              {/* ═══ Buy Again Button ═══ */}
              {(order.status === "delivered" || order.status === "cancelled") && (
                <div className="mt-6 pt-6 border-t border-dashed border-green-200">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <RotateCcw className="w-4 h-4 text-green-600" />
                      <span>Muốn đặt lại đơn hàng này?</span>
                    </div>
                    <button
                      onClick={() => handleBuyAgain(order)}
                      className="flex items-center gap-2 px-5 py-2.5 bg-green-600 text-white text-sm font-semibold rounded-lg hover:bg-green-700 transition-colors shadow-sm"
                    >
                      <ShoppingCart className="w-4 h-4" />
                      Mua Lại
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
