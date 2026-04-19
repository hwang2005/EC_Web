import { useState } from "react";
import { Link } from "react-router";
import { useShop } from "../context/ShopContext";
import { useAuth } from "../context/AuthContext";
import { Search, Filter, Tag, Heart, Leaf, Snowflake, PackageCheck, Crown, Info, Receipt } from "lucide-react";
import { CUSTOMER_TIERS, SEASONAL_CALENDAR } from "../data/products";
import type { CustomerTier } from "../data/products";
import { toast } from "sonner";

export function Products() {
  const { role } = useAuth();
  const { products, customerTier, getPersonalizedPrice, isInWishlist, addToWishlist, removeFromWishlist, orders } = useShop();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Tất Cả");
  const [sortBy, setSortBy] = useState("name");

  // Agricultural filters
  const [filterInSeason, setFilterInSeason] = useState(false);
  const [filterPerishable, setFilterPerishable] = useState(false);
  const [filterCert, setFilterCert] = useState<string>("");
  const [filterInStock, setFilterInStock] = useState(false);

  const currentMonth = new Date().getMonth() + 1;
  const inSeasonProductIds = new Set(
    SEASONAL_CALENDAR
      .filter((sp) => sp.peakMonths.includes(currentMonth))
      .map((sp) => sp.productId)
  );

  // Gather all unique certifications
  const allCertifications = Array.from(
    new Set(products.flatMap((p) => p.certification || []))
  ).sort();

  const categories = ["Tất Cả", ...Array.from(new Set(products.map((p) => p.category)))];

  const filteredProducts = products
    .filter((product) => {
      const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           product.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === "Tất Cả" || product.category === selectedCategory;
      const matchesSeason = !filterInSeason || inSeasonProductIds.has(product.id);
      const matchesPerishable = !filterPerishable || product.isPerishable;
      const matchesCert = !filterCert || (product.certification && product.certification.some(c => c.includes(filterCert)));
      const matchesStock = !filterInStock || product.stock > 0;
      return matchesSearch && matchesCategory && matchesSeason && matchesPerishable && matchesCert && matchesStock;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "price-low":
          return a.price - b.price;
        case "price-high":
          return b.price - a.price;
        case "rating":
          return b.rating - a.rating;
        default:
          return a.name.localeCompare(b.name);
      }
    });

  const hasActiveAgriFilter = filterInSeason || filterPerishable || !!filterCert || filterInStock;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="mb-2">Sản Phẩm Nông Sản</h1>
      <p className="text-muted-foreground mb-8">
        Khám phá các sản phẩm nông sản Việt Nam chất lượng cao
      </p>

      {role === "consumer" && (() => {
        const totalSpent = orders
          .filter((o) => o.status === "delivered")
          .reduce((sum, o) => sum + o.total, 0);
        const tierInfo = CUSTOMER_TIERS[customerTier];
        const tierOrder: CustomerTier[] = ["standard", "silver", "gold", "platinum"];
        const currentIdx = tierOrder.indexOf(customerTier);
        const nextTier = currentIdx < tierOrder.length - 1 ? tierOrder[currentIdx + 1] : null;
        const nextThreshold = nextTier === "silver" ? 1_000_000 : nextTier === "gold" ? 5_000_000 : 15_000_000;

        const tierColorMap: Record<CustomerTier, { border: string; bg: string; text: string; icon: string }> = {
          standard: { border: "border-gray-300", bg: "bg-gray-50", text: "text-gray-700", icon: "🌱" },
          silver: { border: "border-slate-400", bg: "bg-slate-50", text: "text-slate-700", icon: "🥈" },
          gold: { border: "border-yellow-400", bg: "bg-yellow-50", text: "text-yellow-800", icon: "🥇" },
          platinum: { border: "border-purple-400", bg: "bg-purple-50", text: "text-purple-800", icon: "💎" },
        };
        const colors = tierColorMap[customerTier];

        return (
          <div className="mb-8 space-y-4">
            {/* Auto Tier Banner */}
            <div className={`rounded-xl border-2 ${colors.border} ${colors.bg} p-5 shadow-sm`}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{colors.icon}</span>
                  <div>
                    <div className="flex items-center gap-2">
                      <Crown className={`w-5 h-5 ${colors.text}`} />
                      <h3 className={`font-bold text-lg ${colors.text}`}>{tierInfo.name}</h3>
                    </div>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      Hạng tự động dựa trên tổng chi tiêu: <strong>{totalSpent.toLocaleString("vi-VN")}₫</strong>
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  {tierInfo.discount > 0 ? (
                    <div>
                      <p className={`text-2xl font-bold ${colors.text}`}>-{tierInfo.discount}%</p>
                      <p className="text-xs text-muted-foreground">Giảm giá tự động áp dụng</p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-lg font-semibold text-muted-foreground">Giá gốc</p>
                      <p className="text-xs text-muted-foreground">Chưa có giảm giá hạng thành viên</p>
                    </div>
                  )}
                </div>
              </div>
              {nextTier && (
                <div className="mt-4 pt-3 border-t border-border/50">
                  <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
                    <span>Tiến trình lên <strong>{CUSTOMER_TIERS[nextTier].name}</strong></span>
                    <span>{totalSpent.toLocaleString("vi-VN")}₫ / {nextThreshold.toLocaleString("vi-VN")}₫</span>
                  </div>
                  <div className="w-full bg-white/60 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all bg-gradient-to-r ${
                        customerTier === "standard" ? "from-gray-400 to-slate-400" :
                        customerTier === "silver" ? "from-slate-400 to-yellow-400" :
                        "from-yellow-400 to-purple-500"
                      }`}
                      style={{ width: `${Math.min(100, (totalSpent / nextThreshold) * 100)}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Tax Info Banner for Registered Users */}
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
              <div className="flex items-start gap-3">
                <Receipt className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-blue-900 text-sm mb-1">Thông tin thuế & giá hiển thị</p>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li className="flex items-start gap-1.5">
                      <span className="text-blue-500 mt-0.5">•</span>
                      <span>Giá hiển thị trên trang sản phẩm là <strong>giá trước thuế</strong> (chưa bao gồm VAT).</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <span className="text-blue-500 mt-0.5">•</span>
                      <span>Thuế GTGT (VAT) <strong>10%</strong> sẽ được tính thêm khi thanh toán theo quy định của pháp luật Việt Nam.</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <span className="text-blue-500 mt-0.5">•</span>
                      <span>Giảm giá thành viên <strong>{tierInfo.discount}%</strong> đã được áp dụng tự động vào giá hiển thị (nếu có).</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <span className="text-blue-500 mt-0.5">•</span>
                      <span>Tổng thanh toán = Giá sản phẩm (sau giảm giá) + VAT 10% + Phí vận chuyển.</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Tax Info Banner for Guest / Non-consumer users */}
      {role !== "consumer" && (
        <div className="mb-8 rounded-lg border border-amber-200 bg-amber-50 p-4">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-semibold text-amber-900 text-sm mb-1">Quy định về giá & thuế</p>
              <ul className="text-sm text-amber-800 space-y-1">
                <li className="flex items-start gap-1.5">
                  <span className="text-amber-500 mt-0.5">•</span>
                  <span>Giá hiển thị là <strong>giá trước thuế</strong> (chưa bao gồm VAT 10%).</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-amber-500 mt-0.5">•</span>
                  <span>Thuế GTGT (VAT) 10% sẽ được cộng thêm khi thanh toán theo quy định pháp luật Việt Nam.</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-amber-500 mt-0.5">•</span>
                  <span><strong>Đăng nhập</strong> để hưởng giảm giá thành viên lên đến 15% tùy theo hạng khách hàng.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-4 border border-border">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Tìm kiếm sản phẩm..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background"
            />
          </div>

          {/* Category Filter */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary appearance-none bg-background"
            >
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>

          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary appearance-none bg-background"
          >
            <option value="name">Sắp xếp theo Tên</option>
            <option value="price-low">Giá: Thấp đến Cao</option>
            <option value="price-high">Giá: Cao đến Thấp</option>
            <option value="rating">Đánh Giá Cao Nhất</option>
          </select>
        </div>
      </div>

      {/* Agricultural Filter Chips */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-6 border border-border">
        <div className="flex items-center gap-2 mb-3">
          <Tag className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-semibold text-foreground">Lọc nông sản:</span>
          {hasActiveAgriFilter && (
            <button
              onClick={() => { setFilterInSeason(false); setFilterPerishable(false); setFilterCert(""); setFilterInStock(false); }}
              className="text-xs text-destructive hover:underline ml-auto"
            >
              Xóa bộ lọc
            </button>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFilterInSeason(!filterInSeason)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
              filterInSeason
                ? "bg-green-600 text-white border-green-600"
                : "bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
            }`}
          >
            <Leaf className="w-3.5 h-3.5" />
            Đang vào mùa
          </button>
          <button
            onClick={() => setFilterPerishable(!filterPerishable)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
              filterPerishable
                ? "bg-orange-600 text-white border-orange-600"
                : "bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100"
            }`}
          >
            <Snowflake className="w-3.5 h-3.5" />
            Hàng tươi sống
          </button>
          <button
            onClick={() => setFilterInStock(!filterInStock)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
              filterInStock
                ? "bg-blue-600 text-white border-blue-600"
                : "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100"
            }`}
          >
            <PackageCheck className="w-3.5 h-3.5" />
            Còn hàng
          </button>
          <div className="h-6 w-px bg-border mx-1" />
          <select
            value={filterCert}
            onChange={(e) => setFilterCert(e.target.value)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium border appearance-none cursor-pointer transition-colors ${
              filterCert
                ? "bg-amber-600 text-white border-amber-600"
                : "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100"
            }`}
          >
            <option value="">🏅 Chứng nhận</option>
            {allCertifications.map((cert) => (
              <option key={cert} value={cert}>{cert}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Results Count */}
      <p className="text-muted-foreground mb-4">
        Hiển thị {filteredProducts.length} / {products.length} sản phẩm
      </p>

      {/* Products Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredProducts.map((product) => {
          const personalizedPrice = getPersonalizedPrice(product.price);
          const hasDiscount = customerTier !== "standard";
          const inWishlist = isInWishlist(product.id);

          const handleToggleWishlist = (e: React.MouseEvent) => {
            e.preventDefault();
            e.stopPropagation();
            if (role !== "consumer") {
              toast.error("Vui lòng đăng nhập tài khoản khách hàng để dùng danh sách yêu thích");
              return;
            }
            if (inWishlist) {
              removeFromWishlist(product.id);
              toast.success(`${product.name} đã xóa khỏi yêu thích`);
            } else {
              addToWishlist(product);
              toast.success(`${product.name} đã thêm vào yêu thích`);
            }
          };

          return (
            <Link
              key={product.id}
              to={`/products/${product.id}`}
              className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow group border border-border"
            >
              <div className="aspect-square overflow-hidden bg-muted relative">
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                />
                <button
                  onClick={handleToggleWishlist}
                  title={role === "consumer" ? "Yêu thích" : "Đăng nhập để thêm vào yêu thích"}
                  className={`absolute top-3 right-3 p-2 rounded-full shadow-md transition-colors ${
                    inWishlist
                      ? "bg-red-50 text-red-500"
                      : "bg-white/90 text-muted-foreground hover:text-red-500"
                  }`}
                >
                  <Heart className={`w-5 h-5 ${inWishlist ? "fill-current" : ""}`} />
                </button>
              </div>
              <div className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold group-hover:text-primary transition-colors">
                    {product.name}
                  </h3>
                  <span className="text-xs text-foreground bg-accent px-2 py-1 rounded">
                    {product.category}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                  {product.description}
                </p>
                <div className="flex justify-between items-center">
                  <div>
                    {hasDiscount && (
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground line-through">
                          {product.price.toLocaleString("vi-VN")}₫
                        </span>
                        <span className="text-xs bg-destructive text-white px-2 py-0.5 rounded">
                          -{CUSTOMER_TIERS[customerTier].discount}%
                        </span>
                      </div>
                    )}
                    <span className="font-bold text-primary block">
                      {personalizedPrice.toLocaleString("vi-VN")}₫
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-yellow-500">⭐</span>
                    <span className="text-sm font-semibold">{product.rating}</span>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {product.stock > 0 ? `Còn ${product.stock} sản phẩm` : "Hết hàng"}
                </p>
                <p className="text-[10px] text-muted-foreground mt-1 italic">
                  Giá chưa bao gồm VAT 10%
                </p>
              </div>
            </Link>
          );
        })}
      </div>

      {filteredProducts.length === 0 && (
        <div className="text-center py-16">
          <p className="text-muted-foreground">Không tìm thấy sản phẩm phù hợp.</p>
        </div>
      )}
    </div>
  );
}
