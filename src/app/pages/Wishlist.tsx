import { Link } from "react-router";
import { useShop } from "../context/ShopContext";
import { useAuth } from "../context/AuthContext";
import { Heart, ShoppingCart, Trash2, ArrowRight, ShoppingBag } from "lucide-react";
import { toast } from "sonner";

export function Wishlist() {
  const { role } = useAuth();
  const { wishlist, removeFromWishlist, addToCart, getPersonalizedPrice, customerTier } = useShop();

  if (role !== "consumer") {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center">
          <Heart className="w-24 h-24 text-gray-300 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2 text-foreground">Đăng nhập để dùng danh sách yêu thích</h2>
          <p className="text-muted-foreground mb-8">
            Khách có thể xem sản phẩm, nhưng chỉ khách hàng đã đăng nhập mới lưu được sản phẩm yêu thích.
          </p>
          <div className="flex justify-center gap-4">
            <Link
              to="/products"
              className="inline-flex items-center gap-2 border border-border px-6 py-3 rounded-lg hover:bg-muted transition-colors"
            >
              Xem sản phẩm
            </Link>
            <Link
              to="/auth"
              className="inline-flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-lg hover:bg-primary/90 transition-colors"
            >
              Đăng nhập khách hàng
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const handleMoveToCart = (product: any) => {
    addToCart(product);
    removeFromWishlist(product.id);
    toast.success(`${product.name} đã được chuyển vào giỏ hàng`);
  };

  const handleRemove = (product: any) => {
    removeFromWishlist(product.id);
    toast.success(`${product.name} đã được xóa khỏi danh sách yêu thích`);
  };

  const handleMoveAllToCart = () => {
    let count = 0;
    wishlist.forEach((product) => {
      if (product.stock > 0) {
        addToCart(product);
        count++;
      }
    });
    // Clear all from wishlist
    wishlist.forEach((product) => removeFromWishlist(product.id));
    if (count > 0) {
      toast.success(`Đã thêm ${count} sản phẩm vào giỏ hàng!`);
    } else {
      toast.error("Tất cả sản phẩm đều hết hàng.");
    }
  };

  if (wishlist.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center">
          <Heart className="w-24 h-24 text-gray-300 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2 text-foreground">Chưa có sản phẩm yêu thích</h2>
          <p className="text-muted-foreground mb-8">
            Hãy thêm sản phẩm vào danh sách yêu thích để dễ dàng theo dõi!
          </p>
          <Link
            to="/products"
            className="inline-flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-lg hover:bg-primary/90 transition-colors"
          >
            Khám Phá Sản Phẩm
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <Heart className="w-8 h-8 text-primary" />
          <div>
            <h1 className="text-foreground">Sản Phẩm Yêu Thích</h1>
            <p className="text-muted-foreground">{wishlist.length} sản phẩm</p>
          </div>
        </div>
        <button
          onClick={handleMoveAllToCart}
          className="inline-flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-lg hover:bg-primary/90 transition-colors font-semibold shadow-sm"
        >
          <ShoppingBag className="w-5 h-5" />
          Thêm Tất Cả Vào Giỏ
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {wishlist.map((product) => {
          const personalizedPrice = getPersonalizedPrice(product.price);
          const hasDiscount = customerTier !== "standard";

          return (
            <div
              key={product.id}
              className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow border border-border group"
            >
              <Link to={`/products/${product.id}`}>
                <div className="aspect-square overflow-hidden bg-muted">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                </div>
              </Link>
              <div className="p-4">
                <Link to={`/products/${product.id}`}>
                  <h3 className="font-semibold group-hover:text-primary transition-colors text-foreground">
                    {product.name}
                  </h3>
                </Link>
                <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                  {product.description}
                </p>
                <div className="flex justify-between items-center mb-4">
                  <div>
                    {hasDiscount && (
                      <span className="text-xs text-muted-foreground line-through block">
                        {product.price.toLocaleString("vi-VN")}₫
                      </span>
                    )}
                    <span className="font-bold text-primary">
                      {personalizedPrice.toLocaleString("vi-VN")}₫
                    </span>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    ⭐ {product.rating}
                  </span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleMoveToCart(product)}
                    className="flex-1 flex items-center justify-center gap-2 bg-primary text-white px-3 py-2 rounded-lg hover:bg-primary/90 transition-colors text-sm"
                  >
                    <ShoppingCart className="w-4 h-4" />
                    Thêm Vào Giỏ
                  </button>
                  <button
                    onClick={() => handleRemove(product)}
                    className="p-2 text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                    title="Xóa khỏi yêu thích"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
