import { Link } from "react-router";
import { Sprout, Truck, CreditCard, ArrowRight, Leaf, Award, ShieldCheck, MapPin, CalendarDays, Package, Clock, Home as HomeIcon, MessageCircle } from "lucide-react";
import { useShop } from "../context/ShopContext";
import { SEASONAL_CALENDAR, FARM_STORIES } from "../data/products";

export function Home() {
  const { products, getPersonalizedPrice, customerTier } = useShop();
  const featuredProducts = products.slice(0, 4);

  // Get current month for seasonal products
  const currentMonth = new Date().getMonth() + 1;
  const inSeasonProducts = SEASONAL_CALENDAR
    .filter((sp) => sp.peakMonths.includes(currentMonth))
    .map((sp) => {
      const product = products.find((p) => p.id === sp.productId);
      return { ...sp, product };
    })
    .filter((sp) => sp.product);

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
            <div className="flex flex-wrap gap-4">
              <Link
                to="/products"
                className="inline-flex items-center gap-2 bg-white text-primary px-8 py-3 rounded-lg font-semibold hover:bg-background transition-colors"
              >
                Mua Sắm Ngay
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                to="/farm-story"
                className="inline-flex items-center gap-2 border-2 border-white/70 text-white px-8 py-3 rounded-lg font-semibold hover:bg-white/10 transition-colors"
              >
                <MapPin className="w-5 h-5" />
                Khám Phá Nông Trại
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ Trust Strip ═══ */}
      <section className="py-6 bg-white border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: <MapPin className="w-6 h-6 text-green-600" />, title: "Nguồn Gốc Rõ Ràng", desc: "Truy xuất từ nông trại", bg: "bg-green-50" },
              { icon: <Truck className="w-6 h-6 text-blue-600" />, title: "Giao Hàng Nhanh", desc: "Giao trong ngày nội thành", bg: "bg-blue-50" },
              { icon: <ShieldCheck className="w-6 h-6 text-amber-600" />, title: "Đổi Trả Dễ Dàng", desc: "Hoàn 100% nếu hàng hỏng", bg: "bg-amber-50" },
              { icon: <CreditCard className="w-6 h-6 text-purple-600" />, title: "Thanh Toán An Toàn", desc: "Mã hóa SSL/TLS", bg: "bg-purple-50" },
            ].map((item) => (
              <div key={item.title} className={`flex items-center gap-3 p-4 rounded-xl ${item.bg}`}>
                <div className="flex-shrink-0">{item.icon}</div>
                <div>
                  <p className="font-semibold text-sm text-foreground">{item.title}</p>
                  <p className="text-xs text-muted-foreground">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ Seasonal Products — "Mùa Nào Thức Nấy" ═══ */}
      {inSeasonProducts.length > 0 && (
        <section className="py-16 bg-gradient-to-br from-green-50 to-emerald-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center">
                <CalendarDays className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-foreground font-bold">Mùa Nào Thức Nấy</h2>
                <p className="text-muted-foreground text-sm">
                  Sản phẩm đang vào mùa — tươi ngon nhất, giá tốt nhất
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-8">
              {inSeasonProducts.map(({ product, description }) => {
                if (!product) return null;
                const personalizedPrice = getPersonalizedPrice(product.price);
                const hasDiscount = customerTier !== "standard";
                return (
                  <Link
                    key={product.id}
                    to={`/products/${product.id}`}
                    className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all border border-green-100 group"
                  >
                    <div className="aspect-[4/3] overflow-hidden bg-muted relative">
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                      <div className="absolute top-3 left-3">
                        <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-600 text-white text-xs font-bold rounded-full shadow">
                          <Leaf className="w-3 h-3" />
                          Đang vào mùa
                        </span>
                      </div>
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors mb-1">
                        {product.name}
                      </h3>
                      <p className="text-xs text-green-700 bg-green-50 px-2 py-1 rounded inline-block mb-2">
                        🌿 {description}
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
      )}

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
                  <div className="aspect-square overflow-hidden bg-muted relative">
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-full h-full object-cover hover:scale-105 transition-transform"
                    />
                    {product.isPerishable && (
                      <div className="absolute bottom-3 left-3">
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-orange-500 text-white text-xs font-semibold rounded-full">
                          🧊 Tươi sống
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold mb-1 text-foreground">{product.name}</h3>
                    <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                      {product.description}
                    </p>
                    {product.origin && (
                      <p className="text-xs text-green-700 mb-2 flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {product.origin.split(",")[0]}
                      </p>
                    )}
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

      {/* ═══ Social Proof — "Khách Hàng Nói Gì" ═══ */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-50 rounded-full text-purple-700 text-sm font-semibold mb-4">
              <MessageCircle className="w-4 h-4" />
              Phản hồi từ cộng đồng
            </div>
            <h2 className="text-foreground font-bold">Khách Hàng Nói Gì</h2>
            <p className="text-muted-foreground mt-2">Hàng nghìn gia đình tin tưởng chọn Nông Sản Việt</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                name: "Chị Nguyễn Thu Hà",
                role: "Nội trợ, Hà Nội",
                avatar: "🧑‍🍳",
                rating: 5,
                comment: "Rau hữu cơ Đà Lạt tươi ngon lắm, giao đúng buổi sáng nên kịp nấu cơm trưa. Gia đình mình đặt mỗi tuần, chưa bao giờ thất vọng!",
                product: "Rau Hữu Cơ Đà Lạt",
              },
              {
                name: "Anh Trần Minh Đức",
                role: "Nhân viên văn phòng, TP.HCM",
                avatar: "👨‍💼",
                rating: 5,
                comment: "Gạo ST25 ở đây chính gốc Sóc Trăng, nấu cơm dẻo thơm nguyên bản. Biết rõ nguồn gốc nên rất yên tâm cho cả nhà ăn.",
                product: "Gạo ST25 Cao Cấp",
              },
              {
                name: "Chị Lê Thị Hồng",
                role: "Chủ quán cafe, Đà Nẵng",
                avatar: "☕",
                rating: 5,
                comment: "Cà phê Robusta Đắk Lắk chất lượng tuyệt vời, hương thơm đậm đà. Khách quán khen hoài, mình đã chuyển sang đặt hàng định kỳ!",
                product: "Cà Phê Robusta Đắk Lắk",
              },
            ].map((testimonial) => (
              <div
                key={testimonial.name}
                className="bg-gradient-to-br from-purple-50 to-white rounded-xl p-6 border border-purple-100 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex gap-0.5 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <span key={i} className="text-yellow-400 text-lg">★</span>
                  ))}
                </div>
                <p className="text-foreground text-sm leading-relaxed mb-4 italic">
                  "{testimonial.comment}"
                </p>
                <div className="flex items-center gap-3 pt-4 border-t border-purple-100">
                  <span className="text-2xl">{testimonial.avatar}</span>
                  <div>
                    <p className="font-semibold text-foreground text-sm">{testimonial.name}</p>
                    <p className="text-xs text-muted-foreground">{testimonial.role}</p>
                  </div>
                </div>
                <p className="text-xs text-purple-600 mt-3 bg-purple-50 px-2 py-1 rounded inline-block">
                  📦 Đã mua: {testimonial.product}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ How It Works — "Quy Trình Đặt Hàng" ═══ */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-foreground font-bold">Từ Nông Trại Đến Bàn Ăn</h2>
            <p className="text-muted-foreground mt-2">Quy trình đặt hàng đơn giản, nông sản tươi ngon mỗi ngày</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {[
              { step: 1, icon: "🛒", title: "Đặt Hàng", desc: "Chọn nông sản tươi ngon từ các vùng miền trên website", color: "bg-blue-50 border-blue-200" },
              { step: 2, icon: "⏰", title: "Chọn Giờ Giao", desc: "Chọn khung giờ nhận hàng phù hợp với lịch trình của bạn", color: "bg-amber-50 border-amber-200" },
              { step: 3, icon: "📦", title: "Đóng Gói Chuyên Nghiệp", desc: "Đóng gói cẩn thận, giữ lạnh cho hàng tươi sống", color: "bg-green-50 border-green-200" },
              { step: 4, icon: "🏠", title: "Giao Tận Nơi", desc: "Giao hàng đúng giờ, cam kết chất lượng 100%", color: "bg-purple-50 border-purple-200" },
            ].map((item, idx, arr) => (
              <div key={item.step} className="relative">
                <div className={`p-6 rounded-xl border ${item.color} text-center`}>
                  <div className="text-4xl mb-4">{item.icon}</div>
                  <div className="inline-flex items-center justify-center w-8 h-8 bg-primary text-white rounded-full text-sm font-bold mb-3">
                    {item.step}
                  </div>
                  <h3 className="font-bold text-foreground mb-2">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                </div>
                {idx < arr.length - 1 && (
                  <div className="hidden md:block absolute top-1/2 -right-4 transform -translate-y-1/2 z-10">
                    <ArrowRight className="w-6 h-6 text-muted-foreground" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ Farm Stories Preview ═══ */}
      <section className="py-16 bg-gradient-to-br from-amber-50 to-orange-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h2 className="text-foreground font-bold">Câu Chuyện Nông Trại</h2>
              <p className="text-muted-foreground mt-1">Gặp gỡ những người nông dân đằng sau sản phẩm</p>
            </div>
            <Link
              to="/farm-story"
              className="text-primary hover:text-primary/80 font-semibold flex items-center gap-1"
            >
              Xem Tất Cả
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {FARM_STORIES.slice(0, 2).map((farm) => (
              <Link
                key={farm.id}
                to="/farm-story"
                className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all border border-amber-100 group flex flex-col md:flex-row"
              >
                <div className="md:w-2/5 aspect-[4/3] md:aspect-auto overflow-hidden">
                  <img
                    src={farm.image}
                    alt={farm.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                </div>
                <div className="p-5 md:w-3/5 flex flex-col justify-center">
                  <h3 className="font-bold text-foreground group-hover:text-primary transition-colors mb-1">
                    {farm.name}
                  </h3>
                  <p className="text-sm text-green-700 flex items-center gap-1 mb-2">
                    <MapPin className="w-3.5 h-3.5" />
                    {farm.location}
                  </p>
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{farm.description}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {farm.certification.map((cert) => (
                      <span key={cert} className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full border border-green-200">
                        {cert}
                      </span>
                    ))}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Security / Quality Guarantee */}
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
