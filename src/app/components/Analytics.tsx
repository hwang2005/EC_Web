import { useShop } from "../context/ShopContext";
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
  const { products, orders, cart } = useShop();

  const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);
  const totalOrders = orders.length;
  const totalProducts = products.length;
  const totalInStock = products.reduce((sum, p) => sum + p.stock, 0);

  const categoryData = products.reduce((acc: any, product) => {
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

  const revenueByCategory = products.reduce((acc: any, product) => {
    const existing = acc.find((item: any) => item.category === product.category);
    const revenue = product.price * (100 - product.stock);
    if (existing) {
      existing.revenue += revenue;
    } else {
      acc.push({
        category: product.category,
        revenue: revenue,
      });
    }
    return acc;
  }, []);

  const topProducts = products
    .map((p) => ({
      name: p.name,
      sales: 100 - p.stock,
      revenue: p.price * (100 - p.stock),
      rating: p.rating,
    }))
    .sort((a, b) => b.sales - a.sales)
    .slice(0, 5);

  const monthlyData = [
    { month: "T1", orders: 45, revenue: 12500000 },
    { month: "T2", orders: 52, revenue: 15200000 },
    { month: "T3", orders: 48, revenue: 13800000 },
    { month: "T4", orders: 61, revenue: 18900000 },
    { month: "T5", orders: 55, revenue: 16400000 },
    { month: "T6", orders: 67, revenue: 21300000 },
  ];

  const customerTierData = [
    { name: "Thường", value: 450, color: "#9ca3af" },
    { name: "Bạc", value: 180, color: "#64748b" },
    { name: "Vàng", value: 95, color: "#eab308" },
    { name: "Kim Cương", value: 42, color: "#a855f7" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-2">Bảng Phân Tích Dữ Liệu</h2>
        <p className="text-muted-foreground">
          Tổng quan về hiệu suất kinh doanh và xu hướng thị trường
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
              <p className="text-xs text-primary mt-1 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                +12.5% so với tháng trước
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
              <p className="text-sm text-muted-foreground">Đơn Hàng</p>
              <p className="text-2xl font-bold text-foreground mt-1">{totalOrders}</p>
              <p className="text-xs text-primary mt-1 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                +8.3% so với tháng trước
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
              <p className="text-2xl font-bold text-foreground mt-1">767</p>
              <p className="text-xs text-primary mt-1 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                +15.2% khách hàng mới
              </p>
            </div>
            <div className="bg-accent p-3 rounded-full">
              <Users className="w-6 h-6 text-primary" />
            </div>
          </div>
        </div>
      </div>

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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-border">
          <h3 className="font-bold text-foreground mb-4">Phân Bố Sản Phẩm Theo Danh Mục</h3>
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
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-border">
          <h3 className="font-bold text-foreground mb-4">Phân Tầng Khách Hàng</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={customerTierData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {customerTierData.map((entry: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-4 space-y-2">
            {customerTierData.map((tier) => (
              <div key={tier.name} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: tier.color }}
                  />
                  <span>{tier.name}</span>
                </div>
                <span className="font-semibold">{tier.value} khách</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm border border-border">
        <h3 className="font-bold text-foreground mb-4">Top 5 Sản Phẩm Bán Chạy</h3>
        <div className="space-y-3">
          {topProducts.map((product, index) => (
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

      <div className="bg-white p-6 rounded-lg shadow-sm border border-border">
        <h3 className="font-bold text-foreground mb-4">Doanh Thu Theo Danh Mục</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={revenueByCategory}>
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

      <div className="bg-accent border border-border rounded-lg p-4">
        <p className="text-sm text-foreground">
          <strong>Lưu ý:</strong> Dữ liệu phân tích được tính toán dựa trên thông tin sản phẩm,
          đơn hàng và khách hàng hiện có. Đây là phiên bản demo với dữ liệu mô phỏng.
        </p>
      </div>
    </div>
  );
}
