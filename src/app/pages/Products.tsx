import { useState } from "react";
import { Link } from "react-router";
import { useShop } from "../context/ShopContext";
import { Search, Filter, Tag } from "lucide-react";
import { CustomerTierSelector } from "../components/CustomerTierSelector";
import { CUSTOMER_TIERS } from "../data/products";

export function Products() {
  const { products, customerTier, getPersonalizedPrice } = useShop();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Tất Cả");
  const [sortBy, setSortBy] = useState("name");

  const categories = ["Tất Cả", ...Array.from(new Set(products.map((p) => p.category)))];

  const filteredProducts = products
    .filter((product) => {
      const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           product.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === "Tất Cả" || product.category === selectedCategory;
      return matchesSearch && matchesCategory;
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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="mb-2">Sản Phẩm Nông Sản</h1>
      <p className="text-muted-foreground mb-8">
        Khám phá các sản phẩm nông sản Việt Nam chất lượng cao
      </p>

      <div className="mb-8">
        <CustomerTierSelector />
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-8 border border-border">
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

      {/* Results Count */}
      <p className="text-muted-foreground mb-4">
        Hiển thị {filteredProducts.length} / {products.length} sản phẩm
      </p>

      {/* Products Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredProducts.map((product) => {
          const personalizedPrice = getPersonalizedPrice(product.price);
          const hasDiscount = customerTier !== "standard";

          return (
            <Link
              key={product.id}
              to={`/products/${product.id}`}
              className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow group border border-border"
            >
              <div className="aspect-square overflow-hidden bg-muted">
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                />
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
