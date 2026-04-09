import { Link } from "react-router";
import { Sprout, Truck, CreditCard, Headphones, ArrowRight, Leaf, Award } from "lucide-react";
import { useShop } from "../context/ShopContext";

export function Home() {
  const { products, getPersonalizedPrice, customerTier } = useShop();
  const featuredProducts = products.slice(0, 4);

  return (
    <div>
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-primary to-accent text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="max-w-3xl">
            <div className="flex items-center gap-3 mb-4">
              <Sprout className="w-12 h-12" />
              <h1 className="font-bold">
                Nông Sản Việt
              </h1>
            </div>
            <p className="text-xl mb-8 opacity-90">
              Kết nối người nông dân với người tiêu dùng. Sản phẩm tươi ngon, chất lượng cao từ các vùng nông nghiệp nổi tiếng của Việt Nam.
            </p>
            <Link
              to="/products"
              className="inline-flex items-center gap-2 bg-white text-primary px-8 py-3 rounded-lg font-semibold hover:bg-background transition-colors"
            >
              Mua Sắm Ngay
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-accent rounded-full mb-4">
                <Leaf className="w-8 h-8 text-primary" />
              </div>
              <h3 className="font-semibold mb-2 text-foreground">Sản Phẩm Hữu Cơ</h3>
              <p className="text-sm text-muted-foreground">
                Nông sản hữu cơ được chứng nhận, an toàn cho sức khỏe
              </p>
            </div>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-accent rounded-full mb-4">
                <Truck className="w-8 h-8 text-primary" />
              </div>
              <h3 className="font-semibold mb-2 text-foreground">Giao Hàng Nhanh</h3>
              <p className="text-sm text-muted-foreground">
                Nhiều phương thức vận chuyển, giao trong ngày tại nội thành
              </p>
            </div>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-accent rounded-full mb-4">
                <CreditCard className="w-8 h-8 text-primary" />
              </div>
              <h3 className="font-semibold mb-2 text-foreground">Thanh Toán Linh Hoạt</h3>
              <p className="text-sm text-muted-foreground">
                Thẻ, MoMo, chuyển khoản, và thanh toán khi nhận hàng
              </p>
            </div>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-accent rounded-full mb-4">
                <Award className="w-8 h-8 text-primary" />
              </div>
              <h3 className="font-semibold mb-2 text-foreground">Giá Ưu Đãi</h3>
              <p className="text-sm text-muted-foreground">
                Chương trình khách hàng thân thiết với giảm giá lên đến 15%
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-16 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h2 className="text-foreground">Sản Phẩm Nổi Bật</h2>
              <p className="text-muted-foreground mt-1">
                Những sản phẩm được yêu thích nhất
              </p>
            </div>
            <Link
              to="/products"
              className="text-primary hover:text-primary/80 font-semibold flex items-center gap-1"
            >
              Xem Tất Cả
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredProducts.map((product) => {
              const personalizedPrice = getPersonalizedPrice(product.price);
              const hasDiscount = customerTier !== "standard";

              return (
                <Link
                  key={product.id}
                  to={`/products/${product.id}`}
                  className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow border border-border"
                >
                  <div className="aspect-square overflow-hidden bg-muted">
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-full h-full object-cover hover:scale-105 transition-transform"
                    />
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold mb-1 text-foreground">{product.name}</h3>
                    <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                      {product.description}
                    </p>
                    <div className="flex justify-between items-center">
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
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Security Notice */}
      <section className="py-16 bg-accent">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow-sm p-8 border-l-4 border-primary">
            <div className="flex items-start gap-4">
              <Sprout className="w-12 h-12 text-primary flex-shrink-0" />
              <div>
                <h3 className="font-bold mb-2 text-foreground">Cam Kết Chất Lượng & An Toàn</h3>
                <p className="text-muted-foreground mb-4">
                  Chúng tôi đảm bảo các tiêu chuẩn cao nhất cho sản phẩm và dịch vụ:
                </p>
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-foreground">
                  <li className="flex items-center gap-2">
                    <span className="text-primary">✓</span>
                    Sản phẩm tươi mới, nguồn gốc rõ ràng
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-primary">✓</span>
                    Chứng nhận an toàn thực phẩm VietGAP
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-primary">✓</span>
                    Thanh toán bảo mật SSL/TLS
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-primary">✓</span>
                    Giao hàng nhanh chóng, đúng hẹn
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-primary">✓</span>
                    Hỗ trợ khách hàng 24/7
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-primary">✓</span>
                    Đổi trả trong 7 ngày nếu không hài lòng
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
