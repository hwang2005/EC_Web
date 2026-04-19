import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router";
import { useShop } from "../context/ShopContext";
import { useAuth } from "../context/AuthContext";
import { ArrowLeft, ShoppingCart, Star, Truck, ShieldCheck, Heart, Send, MapPin, CalendarDays, Hash, Award, Thermometer, Leaf, AlertTriangle, Clock } from "lucide-react";
import { toast } from "sonner";
import { Review } from "../types";

export function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { products, addToCart, isInWishlist, addToWishlist, removeFromWishlist, getProductReviews, addReview, getPersonalizedPrice, customerTier } = useShop();
  const { role, profile } = useAuth();
  const [quantity, setQuantity] = useState(1);
  const isCustomer = role === "consumer";

  // Review form state
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [hoverRating, setHoverRating] = useState(0);

  const product = products.find((p) => p.id === id);

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <h2 className="text-2xl font-bold mb-4 text-foreground">Không tìm thấy sản phẩm</h2>
        <Link to="/products" className="text-primary hover:underline">
          Quay lại Sản Phẩm
        </Link>
      </div>
    );
  }

  const inWishlist = isInWishlist(product.id);
  const productReviews = getProductReviews(product.id);
  const averageRating = productReviews.length > 0
    ? productReviews.reduce((sum, r) => sum + r.rating, 0) / productReviews.length
    : product.rating;
  const personalizedPrice = getPersonalizedPrice(product.price);
  const hasDiscount = customerTier !== "standard";

  const handleAddToCart = () => {
    if (!isCustomer) {
      toast.error("Vui lòng đăng nhập tài khoản khách hàng để mua sản phẩm");
      navigate("/auth");
      return;
    }
    if (quantity > product.stock) {
      toast.error("Không đủ hàng trong kho");
      return;
    }
    addToCart(product, quantity);
    toast.success(`Đã thêm ${quantity} ${product.name} vào giỏ hàng`);
  };

  const handleBuyNow = () => {
    if (!isCustomer) {
      toast.error("Vui lòng đăng nhập tài khoản khách hàng để mua sản phẩm");
      navigate("/auth");
      return;
    }
    if (quantity > product.stock) {
      toast.error("Không đủ hàng trong kho");
      return;
    }
    addToCart(product, quantity);
    navigate("/checkout");
  };

  const handleToggleWishlist = () => {
    if (!isCustomer) {
      toast.error("Vui lòng đăng nhập tài khoản khách hàng để dùng danh sách yêu thích");
      navigate("/auth");
      return;
    }
    if (inWishlist) {
      removeFromWishlist(product.id);
      toast.success("Đã xóa khỏi danh sách yêu thích");
    } else {
      addToWishlist(product);
      toast.success("Đã thêm vào danh sách yêu thích");
    }
  };

  const handleSubmitReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isCustomer) {
      toast.error("Vui lòng đăng nhập tài khoản khách hàng để thêm đánh giá");
      navigate("/auth");
      return;
    }
    if (!reviewComment.trim() || reviewComment.length < 5) {
      toast.error("Vui lòng nhập đánh giá (ít nhất 5 ký tự)");
      return;
    }

    const review: Review = {
      id: `rev-${Date.now()}`,
      productId: product.id,
      author: profile.name || "Khách hàng ẩn danh",
      rating: reviewRating,
      comment: reviewComment,
      date: new Date().toISOString(),
    };

    addReview(review);
    setReviewComment("");
    setReviewRating(5);
    toast.success("Cảm ơn bạn đã đánh giá sản phẩm!");
  };

  // Helper to get certification badge color
  const getCertBadgeStyle = (cert: string) => {
    if (cert.includes("Hữu Cơ") || cert.includes("Organic")) return "bg-green-100 text-green-800 border-green-200";
    if (cert.includes("VietGAP")) return "bg-emerald-100 text-emerald-800 border-emerald-200";
    if (cert.includes("GlobalGAP")) return "bg-blue-100 text-blue-800 border-blue-200";
    if (cert.includes("OCOP")) return "bg-amber-100 text-amber-800 border-amber-200";
    if (cert.includes("UTZ") || cert.includes("4C")) return "bg-teal-100 text-teal-800 border-teal-200";
    if (cert.includes("ISO")) return "bg-indigo-100 text-indigo-800 border-indigo-200";
    return "bg-gray-100 text-gray-800 border-gray-200";
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link
        to="/products"
        className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Quay lại Sản Phẩm
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Product Image */}
        <div className="bg-white rounded-lg overflow-hidden shadow-sm border border-border">
          <div className="aspect-square relative">
            <img
              src={product.image}
              alt={product.name}
              className="w-full h-full object-cover"
            />
            {/* Perishable Badge */}
            {product.isPerishable && (
              <div className="absolute top-4 left-4 flex items-center gap-1.5 px-3 py-1.5 bg-orange-500 text-white text-sm font-semibold rounded-full shadow-md">
                <Thermometer className="w-4 h-4" />
                Hàng tươi sống
              </div>
            )}
            {/* Season Badge */}
            {product.season && (
              <div className="absolute top-4 right-4 flex items-center gap-1.5 px-3 py-1.5 bg-green-600 text-white text-sm font-semibold rounded-full shadow-md">
                <Leaf className="w-4 h-4" />
                {product.season.length > 20 ? "Đang vào mùa" : product.season}
              </div>
            )}
          </div>
        </div>

        {/* Product Info */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="inline-block bg-accent text-foreground text-sm px-3 py-1 rounded-full">
                {product.category}
              </span>
              {product.unit && (
                <span className="inline-block bg-blue-50 text-blue-700 text-sm px-3 py-1 rounded-full border border-blue-200">
                  Đơn vị: {product.unit}
                </span>
              )}
            </div>
            <button
              onClick={handleToggleWishlist}
              className={`p-2 rounded-full transition-colors ${
                inWishlist
                  ? "bg-red-50 text-red-500 hover:bg-red-100"
                  : "bg-muted text-muted-foreground hover:text-red-500 hover:bg-red-50"
              }`}
              title={inWishlist ? "Xóa khỏi yêu thích" : "Thêm vào yêu thích"}
            >
              <Heart className={`w-6 h-6 ${inWishlist ? "fill-current" : ""}`} />
            </button>
          </div>

          <h1 className="text-3xl font-bold mb-4 text-foreground">{product.name}</h1>

          <div className="flex items-center gap-4 mb-6">
            <div className="flex items-center gap-1">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`w-5 h-5 ${
                    i < Math.floor(averageRating)
                      ? "fill-yellow-400 text-yellow-400"
                      : "text-gray-300"
                  }`}
                />
              ))}
            </div>
            <span className="font-semibold text-foreground">{averageRating.toFixed(1)}</span>
            <span className="text-muted-foreground">•</span>
            <span className="text-muted-foreground">{productReviews.length} đánh giá</span>
            <span className="text-muted-foreground">•</span>
            <span className="text-muted-foreground">Còn {product.stock} sản phẩm</span>
          </div>

          <div className="mb-6">
            {hasDiscount && (
              <span className="text-lg text-muted-foreground line-through mr-3">
                {product.price.toLocaleString("vi-VN")}₫
              </span>
            )}
            <span className="text-4xl font-bold text-primary">
              {personalizedPrice.toLocaleString("vi-VN")}₫
            </span>
            {product.unit && (
              <span className="text-lg text-muted-foreground ml-2">/ {product.unit}</span>
            )}
          </div>

          {/* Certification Badges */}
          {product.certification && product.certification.length > 0 && (
            <div className="mb-6 flex flex-wrap gap-2">
              {product.certification.map((cert) => (
                <span
                  key={cert}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-full border ${getCertBadgeStyle(cert)}`}
                >
                  <Award className="w-3.5 h-3.5" />
                  {cert}
                </span>
              ))}
            </div>
          )}

          {!isCustomer && (
            <div className="mb-6 rounded-lg border border-border bg-accent/40 px-4 py-3 text-sm text-foreground">
              Khách có thể xem chi tiết sản phẩm. Đăng nhập tài khoản khách hàng để mua hàng, lưu yêu thích và thêm đánh giá.
            </div>
          )}

          <p className="text-muted-foreground mb-8 leading-relaxed">
            {product.description}
          </p>

          {/* Quantity Selector */}
          <div className="mb-6">
            <label className="block text-sm font-semibold mb-2 text-foreground">Số Lượng</label>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="w-10 h-10 border border-border rounded-lg hover:bg-muted font-semibold transition-colors"
              >
                -
              </button>
              <input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-20 text-center border border-border rounded-lg py-2 focus:outline-none focus:ring-2 focus:ring-primary bg-background"
                min="1"
                max={product.stock}
              />
              <button
                onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                className="w-10 h-10 border border-border rounded-lg hover:bg-muted font-semibold transition-colors"
              >
                +
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 mb-8">
            <button
              onClick={handleAddToCart}
              disabled={product.stock === 0}
              className="flex-1 flex items-center justify-center gap-2 bg-primary text-white px-6 py-3 rounded-lg hover:bg-primary/90 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              <ShoppingCart className="w-5 h-5" />
              {isCustomer ? "Thêm Vào Giỏ" : "Đăng Nhập Để Mua"}
            </button>
            <button
              onClick={handleBuyNow}
              disabled={product.stock === 0}
              className="flex-1 bg-foreground text-white px-6 py-3 rounded-lg hover:bg-foreground/90 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              {isCustomer ? "Mua Ngay" : "Đăng Nhập Ngay"}
            </button>
          </div>

          {/* Perishable Warning */}
          {product.isPerishable && (
            <div className="mb-6 bg-orange-50 border border-orange-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-orange-900 text-sm">Sản phẩm tươi sống — Cần bảo quản đặc biệt</p>
                  <p className="text-sm text-orange-700 mt-1">
                    Sản phẩm này là hàng tươi sống, cần được giao nhanh và bảo quản đúng cách. Chúng tôi khuyến nghị chọn phương thức giao hàng nhanh hoặc giao trong ngày.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Features */}
          <div className="border-t border-border pt-6 space-y-4">
            <div className="flex items-center gap-3 text-muted-foreground">
              <Truck className="w-5 h-5 text-primary" />
              <span>Miễn phí vận chuyển cho đơn hàng từ 500.000₫</span>
            </div>
            <div className="flex items-center gap-3 text-muted-foreground">
              <ShieldCheck className="w-5 h-5 text-primary" />
              <span>Thanh toán an toàn, bảo mật SSL/TLS</span>
            </div>
            <div className="flex items-center gap-3 text-muted-foreground">
              <Star className="w-5 h-5 text-primary" />
              <span>Đổi trả trong 7 ngày nếu không hài lòng</span>
            </div>
          </div>
        </div>
      </div>

      {/* ═══════ Traceability Section ═══════ */}
      {(product.origin || product.batchCode || product.harvestDate) && (
        <div className="mt-12 grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Truy Xuất Nguồn Gốc */}
          <div className="bg-white rounded-lg shadow-sm border border-border overflow-hidden">
            <div className="bg-gradient-to-r from-green-600 to-emerald-600 px-6 py-4">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                Truy Xuất Nguồn Gốc
              </h2>
              <p className="text-green-100 text-sm mt-1">Thông tin lô hàng và xuất xứ sản phẩm</p>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {product.origin && (
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <MapPin className="w-5 h-5 text-green-700" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground font-medium">Vùng trồng / Nông trại</p>
                      <p className="text-foreground font-semibold">{product.origin}</p>
                    </div>
                  </div>
                )}
                {product.harvestDate && (
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <CalendarDays className="w-5 h-5 text-blue-700" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground font-medium">Ngày thu hoạch / Đóng gói</p>
                      <p className="text-foreground font-semibold">
                        {new Date(product.harvestDate).toLocaleDateString("vi-VN", {
                          day: "2-digit",
                          month: "long",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                  </div>
                )}
                {product.batchCode && (
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Hash className="w-5 h-5 text-purple-700" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground font-medium">Mã lô hàng</p>
                      <p className="text-foreground font-semibold font-mono">{product.batchCode}</p>
                    </div>
                  </div>
                )}
                {product.certification && product.certification.length > 0 && (
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Award className="w-5 h-5 text-amber-700" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground font-medium">Chứng nhận chất lượng</p>
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        {product.certification.map((cert) => (
                          <span key={cert} className={`text-xs px-2 py-1 rounded border font-medium ${getCertBadgeStyle(cert)}`}>
                            {cert}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Farm Journey */}
              <div className="mt-6 pt-6 border-t border-border">
                <p className="text-sm font-semibold text-foreground mb-3">Hành trình từ nông trại đến tay bạn</p>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  {[
                    { label: "Thu hoạch", icon: "🌾" },
                    { label: "Kiểm định", icon: "🔬" },
                    { label: "Đóng gói", icon: "📦" },
                    { label: "Vận chuyển", icon: "🚚" },
                    { label: "Giao hàng", icon: "🏠" },
                  ].map((step, idx, arr) => (
                    <div key={step.label} className="flex items-center flex-1">
                      <div className="flex flex-col items-center">
                        <span className="text-lg mb-1">{step.icon}</span>
                        <span className="text-center leading-tight">{step.label}</span>
                      </div>
                      {idx < arr.length - 1 && (
                        <div className="flex-1 h-0.5 bg-green-300 mx-1 mt-[-14px]" />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Bảo Quản & Chất Lượng */}
          <div className="space-y-6">
            {/* Storage Instructions */}
            {(product.storageInstructions || product.shelfLife) && (
              <div className="bg-white rounded-lg shadow-sm border border-border overflow-hidden">
                <div className="bg-gradient-to-r from-blue-600 to-cyan-600 px-6 py-4">
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <Thermometer className="w-5 h-5" />
                    Hướng Dẫn Bảo Quản
                  </h2>
                </div>
                <div className="p-6 space-y-4">
                  {product.shelfLife && (
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-cyan-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Clock className="w-5 h-5 text-cyan-700" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground font-medium">Thời hạn sử dụng</p>
                        <p className="text-foreground font-semibold">{product.shelfLife}</p>
                      </div>
                    </div>
                  )}
                  {product.storageInstructions && (
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Thermometer className="w-5 h-5 text-blue-700" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground font-medium">Cách bảo quản</p>
                        <p className="text-foreground text-sm leading-relaxed">{product.storageInstructions}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Quality Guarantee */}
            <div className="bg-white rounded-lg shadow-sm border border-border overflow-hidden">
              <div className="bg-gradient-to-r from-amber-500 to-orange-500 px-6 py-4">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5" />
                  Cam Kết Chất Lượng
                </h2>
              </div>
              <div className="p-6">
                <ul className="space-y-3">
                  {[
                    { text: "Cam kết 100% tươi mới, đúng nguồn gốc như mô tả", icon: "✅" },
                    { text: "Đổi/trả miễn phí nếu hàng dập, hỏng, sai sản phẩm", icon: "🔄" },
                    { text: "Hoàn tiền 100% nếu không đạt chất lượng", icon: "💰" },
                    { text: "Tiếp nhận khiếu nại trong vòng 24 giờ sau giao hàng", icon: "📞" },
                    { text: "Gửi ảnh minh chứng để xử lý nhanh nhất", icon: "📸" },
                  ].map((item) => (
                    <li key={item.text} className="flex items-start gap-3 text-sm">
                      <span className="text-base flex-shrink-0">{item.icon}</span>
                      <span className="text-foreground">{item.text}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reviews Section */}
      <div className="mt-16">
        <h2 className="text-2xl font-bold text-foreground mb-8 flex items-center gap-2">
          <Star className="w-6 h-6 text-primary" />
          Đánh Giá Sản Phẩm ({productReviews.length})
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Write a Review */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-6 border border-border sticky top-20">
              <h3 className="font-bold text-foreground mb-4">Viết Đánh Giá</h3>
              {!isCustomer && (
                <p className="mb-4 text-sm text-muted-foreground">
                  Chỉ khách hàng đã đăng nhập mới có thể gửi đánh giá.
                </p>
              )}
              <form onSubmit={handleSubmitReview} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold mb-2 text-foreground">
                    Đánh Giá Sao
                  </label>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setReviewRating(star)}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                        className="p-1"
                        disabled={!isCustomer}
                      >
                        <Star
                          className={`w-7 h-7 transition-colors ${
                            star <= (hoverRating || reviewRating)
                              ? "fill-yellow-400 text-yellow-400"
                              : "text-gray-300"
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-1 text-foreground">
                    Nhận Xét
                  </label>
                  <textarea
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    rows={4}
                    disabled={!isCustomer}
                    className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background resize-none"
                    placeholder="Chia sẻ trải nghiệm của bạn về sản phẩm này..."
                  />
                </div>

                <button
                  type="submit"
                  disabled={!isCustomer}
                  className="w-full flex items-center justify-center gap-2 bg-primary text-white py-2.5 rounded-lg hover:bg-primary/90 transition-colors font-semibold"
                >
                  <Send className="w-4 h-4" />
                  Gửi Đánh Giá
                </button>
              </form>
            </div>
          </div>

          {/* Reviews List */}
          <div className="lg:col-span-2">
            {productReviews.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-lg shadow-sm border border-border">
                <Star className="w-16 h-16 text-gray-300 mx-auto mb-3" />
                <p className="text-muted-foreground">
                  Chưa có đánh giá nào. Hãy là người đầu tiên đánh giá sản phẩm
                  này!
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {productReviews.map((review) => (
                  <div
                    key={review.id}
                    className="bg-white rounded-lg shadow-sm p-5 border border-border"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary text-white rounded-full flex items-center justify-center font-bold">
                          {review.author.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-foreground">
                            {review.author}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(review.date).toLocaleDateString("vi-VN")}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-0.5">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`w-4 h-4 ${
                              star <= review.rating
                                ? "fill-yellow-400 text-yellow-400"
                                : "text-gray-300"
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      {review.comment}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
