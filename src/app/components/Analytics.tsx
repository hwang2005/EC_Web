import { useShop } from "../context/ShopContext";
import { useAuth } from "../context/AuthContext";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { TrendingUp, Package, ShoppingCart, Users, DollarSign } from "lucide-react";

const COLORS = ["#4a7c2f", "#8fbc5a", "#d4a574", "#6a9c42", "#3d5e26"];

export function Analytics() {
  const { products, orders, getSellerProducts, getSellerOrders } = useShop();
  const { profile } = useAuth();

  const sellerEmail = localStorage.getItem("current_user_email") || "";
  const sellerProducts = getSellerProducts(sellerEmail);
  const sellerOrders = getSellerOrders(sellerEmail);

  const totalRevenue = sellerOrders
    .filter((o) => o.status !== "cancelled")
    .reduce((sum, order) => sum + order.total, 0);
  const totalOrders = sellerOrders.length;
  const totalProducts = sellerProducts.length;
  const totalInStock = sellerProducts.reduce((sum, p) => sum + p.stock, 0);

  // Unique buyer emails (real data)
  const uniqueBuyers = new Set(sellerOrders.map((o) => o.buyerEmail).filter(Boolean)).size;

  const categoryData = sellerProducts.reduce((acc: any, product) => {
    const existing = acc.find((item: any) => item.name === product.category);
    if (existing) {
      existing.value += 1;
      existing.stock += product.stock;
    } else {
      acc.push({
        name: product.category,
        value: 1,
        stock: product.stock,
      });
    }
    return acc;
  }, []);

  // Revenue by category from real orders
  const revenueByCategory = sellerProducts.reduce((acc: any, product) => {
    const existing = acc.find((item: any) => item.category === product.category);
    // Calculate revenue from actual orders
    const productRevenue = sellerOrders
      .filter((o) => o.status !== "cancelled")
      .reduce((sum, order) => {
        const item = order.items.find((i) => i.product.id === product.id);
        return sum + (item ? item.product.price * item.quantity : 0);
      }, 0);
    if (existing) {
      existing.revenue += productRevenue;
    } else {
      acc.push({
        category: product.category,
        revenue: productRevenue,
      });
    }
    return acc;
  }, []);

  // Top products by actual order volume
  const topProducts = sellerProducts
    .map((p) => {
      const totalSold = sellerOrders
        .filter((o) => o.status !== "cancelled")
        .reduce((sum, order) => {
          const item = order.items.find((i) => i.product.id === p.id);
          return sum + (item ? item.quantity : 0);
        }, 0);
      return {
        name: p.name,
        sales: totalSold,
        revenue: totalSold * p.price,
        rating: p.rating,
      };
    })
    .sort((a, b) => b.sales - a.sales)
    .slice(0, 5);

  // Order status distribution
  const orderStatusData = [
    { name: "Chờ xử lý", value: sellerOrders.filter((o) => o.status === "pending").length, color: "#eab308" },
    { name: "Đang xử lý", value: sellerOrders.filter((o) => o.status === "processing").length, color: "#3b82f6" },
    { name: "Đang giao", value: sellerOrders.filter((o) => o.status === "shipped").length, color: "#8b5cf6" },
    { name: "Đã giao", value: sellerOrders.filter((o) => o.status === "delivered").length, color: "#22c55e" },
    { name: "Đã hủy", value: sellerOrders.filter((o) => o.status === "cancelled").length, color: "#ef4444" },
  ].filter((d) => d.value > 0);

  // Monthly data from real orders (group by month)
  const monthlyData = (() => {
    const months: Record<string, { orders: number; revenue: number }> = {};
    sellerOrders.forEach((order) => {
      if (order.status === "cancelled") return;
      const date = new Date(order.orderDate);
      const key = `T${date.getMonth() + 1}`;
      if (!months[key]) months[key] = { orders: 0, revenue: 0 };
      months[key].orders += 1;
      months[key].revenue += order.total;
    });
    return Object.entries(months)
      .map(([month, data]) => ({ month, ...data }))
      .sort((a, b) => {
        const aNum = parseInt(a.month.slice(1));
        const bNum = parseInt(b.month.slice(1));
        return aNum - bNum;
      });
  })();

  // If no real monthly data, show placeholder message
  const hasRealData = sellerOrders.length > 0;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-2">Bảng Phân Tích Dữ Liệu</h2>
        <p className="text-muted-foreground">
          Tổng quan về hiệu suất kinh doanh của cửa hàng bạn
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Tổng Doanh Thu</p>
              <p className="text-2xl font-bold text-foreground mt-1">
                {totalRevenue.toLocaleString("vi-VN")}₫
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Từ {sellerOrders.filter((o) => o.status !== "cancelled").length} đơn thành công
              </p>
            </div>
            <div className="bg-accent p-3 rounded-full">
              <DollarSign className="w-6 h-6 text-primary" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Tổng Đơn Hàng</p>
              <p className="text-2xl font-bold text-foreground mt-1">{totalOrders}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {sellerOrders.filter((o) => o.status === "pending" || o.status === "processing").length} đơn cần xử lý
              </p>
            </div>
            <div className="bg-accent p-3 rounded-full">
              <ShoppingCart className="w-6 h-6 text-primary" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Sản Phẩm</p>
              <p className="text-2xl font-bold text-foreground mt-1">{totalProducts}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {totalInStock} sản phẩm trong kho
              </p>
            </div>
            <div className="bg-accent p-3 rounded-full">
              <Package className="w-6 h-6 text-primary" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Khách Hàng</p>
              <p className="text-2xl font-bold text-foreground mt-1">{uniqueBuyers}</p>
              <p className="text-xs text-muted-foreground mt-1">
                Khách hàng đã mua hàng
              </p>
            </div>
            <div className="bg-accent p-3 rounded-full">
              <Users className="w-6 h-6 text-primary" />
            </div>
          </div>
        </div>
      </div>

      {hasRealData ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-border">
            <h3 className="font-bold text-foreground mb-4">Doanh Thu Theo Tháng</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip
                  formatter={(value: number) => `${value.toLocaleString("vi-VN")}₫`}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="#4a7c2f"
                  strokeWidth={2}
                  name="Doanh thu"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-border">
            <h3 className="font-bold text-foreground mb-4">Đơn Hàng Theo Tháng</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="orders" fill="#8fbc5a" name="Số đơn" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      ) : (
        <div className="bg-white p-8 rounded-lg shadow-sm border border-border text-center">
          <ShoppingCart className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-30" />
          <p className="text-muted-foreground">
            Chưa có dữ liệu đơn hàng. Biểu đồ doanh thu sẽ hiển thị khi có đơn hàng đầu tiên.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-border">
          <h3 className="font-bold text-foreground mb-4">Phân Bố Sản Phẩm Theo Danh Mục</h3>
          {categoryData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {categoryData.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-center text-muted-foreground py-12">Chưa có dữ liệu</p>
          )}
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-border">
          <h3 className="font-bold text-foreground mb-4">Trạng Thái Đơn Hàng</h3>
          {orderStatusData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={orderStatusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {orderStatusData.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-4 space-y-2">
                {orderStatusData.map((item) => (
                  <div key={item.name} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: item.color }}
                      />
                      <span>{item.name}</span>
                    </div>
                    <span className="font-semibold">{item.value} đơn</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p className="text-center text-muted-foreground py-12">Chưa có đơn hàng</p>
          )}
        </div>
      </div>

      {topProducts.some((p) => p.sales > 0) && (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-border">
          <h3 className="font-bold text-foreground mb-4">Top 5 Sản Phẩm Bán Chạy</h3>
          <div className="space-y-3">
            {topProducts.filter((p) => p.sales > 0).map((product, index) => (
              <div
                key={product.name}
                className="flex items-center justify-between p-3 bg-background rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center font-bold">
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">{product.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {product.sales} đã bán • ⭐ {product.rating}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-primary">
                    {product.revenue.toLocaleString("vi-VN")}₫
                  </p>
                  <p className="text-xs text-muted-foreground">doanh thu</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {revenueByCategory.some((r: any) => r.revenue > 0) && (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-border">
          <h3 className="font-bold text-foreground mb-4">Doanh Thu Theo Danh Mục</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={revenueByCategory.filter((r: any) => r.revenue > 0)}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="category" />
              <YAxis />
              <Tooltip
                formatter={(value: number) => `${value.toLocaleString("vi-VN")}₫`}
              />
              <Legend />
              <Bar dataKey="revenue" fill="#4a7c2f" name="Doanh thu" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="bg-accent border border-border rounded-lg p-4">
        <p className="text-sm text-foreground">
          <strong>Lưu ý:</strong> Dữ liệu phân tích được tính toán từ đơn hàng và sản phẩm thực tế của cửa hàng bạn.
          Các biểu đồ sẽ cập nhật tự động khi có đơn hàng mới.
        </p>
      </div>
    </div>
  );
}
