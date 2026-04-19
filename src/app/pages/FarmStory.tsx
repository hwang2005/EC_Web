import { Link } from "react-router";
import { MapPin, Award, ArrowRight, Leaf, Sprout, ChevronRight } from "lucide-react";
import { FARM_STORIES } from "../data/products";
import { useShop } from "../context/ShopContext";

export function FarmStory() {
  const { products, getPersonalizedPrice, customerTier } = useShop();

  return (
    <div>
      {/* Hero Banner */}
      <section className="bg-gradient-to-r from-green-700 to-emerald-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="max-w-3xl">
            <div className="flex items-center gap-3 mb-4">
              <Sprout className="w-10 h-10" />
              <h1 className="text-3xl md:text-4xl font-bold">Câu Chuyện Nông Trại</h1>
            </div>
            <p className="text-lg text-green-100 mb-6">
              Mỗi sản phẩm trên Nông Sản Việt đều mang theo một câu chuyện — câu chuyện của đất, của nước, 
              của nắng gió và tâm huyết người nông dân. Khám phá hành trình từ nông trại đến bàn ăn gia đình bạn.
            </p>
            <div className="flex items-center gap-3 text-sm text-green-200">
              <span className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-full">
                <MapPin className="w-4 h-4" />
                {FARM_STORIES.length} nông trại đối tác
              </span>
              <span className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-full">
                <Award className="w-4 h-4" />
                100% đạt chứng nhận
              </span>
              <span className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-full">
                <Leaf className="w-4 h-4" />
                Canh tác bền vững
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Farm Journey Timeline */}
      <section className="py-12 bg-green-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-center font-bold text-foreground mb-8">Hành Trình Từ Nông Trại Đến Bàn Ăn</h2>
          <div className="flex flex-wrap justify-center gap-4 md:gap-2">
            {[
              { emoji: "🌱", label: "Gieo trồng", desc: "Chọn giống tốt nhất" },
              { emoji: "☀️", label: "Chăm sóc", desc: "Canh tác hữu cơ" },
              { emoji: "🔬", label: "Kiểm định", desc: "Đạt chuẩn VietGAP" },
              { emoji: "🌾", label: "Thu hoạch", desc: "Đúng thời điểm" },
              { emoji: "📦", label: "Đóng gói", desc: "Bảo quản tươi ngon" },
              { emoji: "🚚", label: "Vận chuyển", desc: "Giao nhanh, giữ lạnh" },
              { emoji: "🏠", label: "Giao hàng", desc: "Tận tay khách hàng" },
            ].map((step, idx, arr) => (
              <div key={step.label} className="flex items-center">
                <div className="text-center min-w-[90px]">
                  <div className="w-14 h-14 bg-white rounded-full shadow-sm flex items-center justify-center text-2xl mx-auto mb-2 border-2 border-green-200">
                    {step.emoji}
                  </div>
                  <p className="text-sm font-semibold text-foreground">{step.label}</p>
                  <p className="text-xs text-muted-foreground">{step.desc}</p>
                </div>
                {idx < arr.length - 1 && (
                  <ChevronRight className="w-5 h-5 text-green-400 mx-1 hidden md:block" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Farm Stories */}
      <section className="py-16 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-16">
            {FARM_STORIES.map((farm, idx) => {
              const farmProducts = farm.products
                .map((pid) => products.find((p) => p.id === pid))
                .filter(Boolean);

              return (
                <div
                  key={farm.id}
                  className={`flex flex-col ${idx % 2 === 1 ? "lg:flex-row-reverse" : "lg:flex-row"} gap-8 items-stretch`}
                >
                  {/* Image */}
                  <div className="lg:w-2/5">
                    <div className="h-full rounded-2xl overflow-hidden shadow-md">
                      <img
                        src={farm.image}
                        alt={farm.name}
                        className="w-full h-full object-cover min-h-[300px]"
                      />
                    </div>
                  </div>

                  {/* Content */}
                  <div className="lg:w-3/5 flex flex-col justify-center">
                    <div className="mb-4">
                      <h2 className="text-2xl font-bold text-foreground mb-2">{farm.name}</h2>
                      <p className="text-green-700 flex items-center gap-1.5 text-sm font-medium">
                        <MapPin className="w-4 h-4" />
                        {farm.location}
                      </p>
                    </div>

                    {/* Certifications */}
                    <div className="flex flex-wrap gap-2 mb-4">
                      {farm.certification.map((cert) => (
                        <span
                          key={cert}
                          className="inline-flex items-center gap-1 text-sm px-3 py-1.5 bg-green-100 text-green-800 rounded-full border border-green-200 font-medium"
                        >
                          <Award className="w-3.5 h-3.5" />
                          {cert}
                        </span>
                      ))}
                    </div>

                    <p className="text-muted-foreground leading-relaxed mb-6">{farm.story}</p>

                    {/* Products from this farm */}
                    {farmProducts.length > 0 && (
                      <div>
                        <h3 className="text-sm font-semibold text-foreground mb-3 uppercase tracking-wide">
                          Sản phẩm từ nông trại này
                        </h3>
                        <div className="flex flex-wrap gap-3">
                          {farmProducts.map((product) => {
                            if (!product) return null;
                            const personalizedPrice = getPersonalizedPrice(product.price);
                            return (
                              <Link
                                key={product.id}
                                to={`/products/${product.id}`}
                                className="flex items-center gap-3 bg-white border border-border rounded-xl px-4 py-3 hover:shadow-md transition-shadow group max-w-[280px]"
                              >
                                <img
                                  src={product.image}
                                  alt={product.name}
                                  className="w-14 h-14 rounded-lg object-cover flex-shrink-0"
                                />
                                <div className="min-w-0">
                                  <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                                    {product.name}
                                  </p>
                                  <p className="text-sm font-bold text-primary">
                                    {personalizedPrice.toLocaleString("vi-VN")}₫
                                  </p>
                                </div>
                              </Link>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA / Commitment */}
      <section className="py-16 bg-gradient-to-r from-green-600 to-emerald-600 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Leaf className="w-12 h-12 mx-auto mb-4 opacity-80" />
          <h2 className="text-2xl md:text-3xl font-bold mb-4">Cam Kết Của Chúng Tôi</h2>
          <p className="text-lg text-green-100 mb-8 max-w-2xl mx-auto">
            Mỗi sản phẩm bạn mua không chỉ là thực phẩm — đó là sự hỗ trợ trực tiếp cho người nông dân Việt Nam, 
            cho canh tác bền vững, và cho sức khỏe gia đình bạn.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            {[
              { num: "100%", label: "Nông sản đạt chứng nhận chất lượng" },
              { num: "24h", label: "Từ thu hoạch đến giao hàng (hàng tươi)" },
              { num: "200+", label: "Hộ nông dân đối tác trực tiếp" },
            ].map((stat) => (
              <div key={stat.label} className="bg-white/10 rounded-xl p-5 backdrop-blur-sm">
                <p className="text-3xl font-bold mb-1">{stat.num}</p>
                <p className="text-sm text-green-200">{stat.label}</p>
              </div>
            ))}
          </div>
          <Link
            to="/products"
            className="inline-flex items-center gap-2 bg-white text-green-700 px-8 py-3 rounded-lg font-semibold hover:bg-green-50 transition-colors"
          >
            Mua Nông Sản Trực Tiếp
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>
    </div>
  );
}
