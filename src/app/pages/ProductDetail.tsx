import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router";
import { useShop } from "../context/ShopContext";
import { useAuth } from "../context/AuthContext";
import { ArrowLeft, ShoppingCart, Star, Truck, ShieldCheck, Heart, Send } from "lucide-react";
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
          <div className="aspect-square">
            <img
              src={product.image}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        {/* Product Info */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <span className="inline-block bg-accent text-foreground text-sm px-3 py-1 rounded-full">
              {product.category}
            </span>
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
          </div>

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
