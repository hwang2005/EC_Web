import { Link } from "react-router";
import { useShop } from "../context/ShopContext";
import { useAuth } from "../context/AuthContext";
import { Package, Truck, CheckCircle, XCircle, Clock } from "lucide-react";

export function Orders() {
  const { role } = useAuth();
  const { orders } = useShop();

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

  if (orders.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center">
          <Package className="w-24 h-24 text-gray-300 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">No orders yet</h2>
          <p className="text-gray-600 mb-8">
            When you place orders, they will appear here.
          </p>
          <Link
            to="/products"
            className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Start Shopping
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold mb-8">Order History</h1>

      <div className="space-y-6">
        {orders.map((order) => (
          <div key={order.id} className="bg-white rounded-lg shadow-sm overflow-hidden">
            {/* Order Header */}
            <div className="bg-gray-50 px-6 py-4 border-b">
              <div className="flex flex-wrap justify-between items-center gap-4">
                <div>
                  <p className="font-semibold text-lg">{order.id}</p>
                  <p className="text-sm text-gray-600">
                    Placed on {new Date(order.orderDate).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-sm text-gray-600">Total</p>
                    <p className="font-bold text-lg">${order.total.toFixed(2)}</p>
                  </div>
                  <div className={`flex items-center gap-2 px-4 py-2 rounded-full ${getStatusColor(order.status)}`}>
                    {getStatusIcon(order.status)}
                    <span className="font-semibold capitalize">{order.status}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Order Details */}
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                {/* Shipping Address */}
                <div>
                  <h3 className="font-semibold mb-2 flex items-center gap-2">
                    <Truck className="w-4 h-4" />
                    Shipping Address
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
                    Delivery Information
                  </h3>
                  <div className="text-sm text-gray-700 space-y-1">
                    <p>
                      <span className="font-semibold">Method:</span>{" "}
                      {order.deliveryOption.name}
                    </p>
                    <p>
                      <span className="font-semibold">Estimated:</span>{" "}
                      {new Date(order.estimatedDelivery).toLocaleDateString()}
                    </p>
                    <p>
                      <span className="font-semibold">Payment:</span> {order.paymentMethod}
                    </p>
                  </div>
                </div>
              </div>

              {/* Order Items */}
              <div>
                <h3 className="font-semibold mb-3">Items ({order.items.length})</h3>
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
                          Quantity: {item.quantity}
                        </p>
                        <p className="text-sm font-semibold mt-1">
                          ${(item.product.price * item.quantity).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Order Tracking */}
              {order.status !== "cancelled" && (
                <div className="mt-6 pt-6 border-t">
                  <h3 className="font-semibold mb-3">Order Progress</h3>
                  <div className="flex items-center justify-between">
                    {[
                      { label: "Pending", status: "pending" },
                      { label: "Processing", status: "processing" },
                      { label: "Shipped", status: "shipped" },
                      { label: "Delivered", status: "delivered" },
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
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
