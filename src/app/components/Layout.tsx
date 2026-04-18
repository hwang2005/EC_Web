import { Outlet, Link, useLocation, useNavigate } from "react-router";
import { ShoppingCart, Package, Home, Grid3x3, Sprout, BarChart3, LogOut, Heart, UserCircle, Phone } from "lucide-react";
import { useShop } from "../context/ShopContext";
import { useAuth } from "../context/AuthContext";
import { Chatbot } from "./Chatbot";

export function Layout() {
  const { getCartCount, wishlist } = useShop();
  const { role, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const cartCount = getCartCount();

  const isActive = (path: string) => location.pathname === path;
  const isCustomer = role === "consumer";
  const isSeller = role === "seller";

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-50 border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="flex items-center gap-2">
              <Sprout className="w-8 h-8 text-primary" />
              <div>
                <span className="text-xl font-bold text-foreground">Nông Sản Việt</span>
                <p className="text-xs text-muted-foreground">Nông Sản Việt Nam</p>
              </div>
            </Link>

            <nav className="hidden md:flex items-center gap-6">
              {!isSeller && (
                <>
                  <Link
                    to="/"
                    className={`flex items-center gap-2 px-3 py-2 rounded-md transition-colors ${
                      isActive("/")
                        ? "text-primary bg-accent"
                        : "text-foreground hover:text-primary hover:bg-muted"
                    }`}
                  >
                    <Home className="w-4 h-4" />
                    Trang Chủ
                  </Link>
                  <Link
                    to="/products"
                    className={`flex items-center gap-2 px-3 py-2 rounded-md transition-colors ${
                      isActive("/products")
                        ? "text-primary bg-accent"
                        : "text-foreground hover:text-primary hover:bg-muted"
                    }`}
                  >
                    <Grid3x3 className="w-4 h-4" />
                    Sản Phẩm
                  </Link>
                  {isCustomer && (
                    <>
                      <Link
                        to="/wishlist"
                        className={`flex items-center gap-2 px-3 py-2 rounded-md transition-colors relative ${
                          isActive("/wishlist")
                            ? "text-primary bg-accent"
                            : "text-foreground hover:text-primary hover:bg-muted"
                        }`}
                      >
                        <Heart className="w-4 h-4" />
                        Yêu Thích
                        {wishlist.length > 0 && (
                          <span className="absolute -top-1 -right-1 bg-destructive text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                            {wishlist.length}
                          </span>
                        )}
                      </Link>
                      <Link
                        to="/orders"
                        className={`flex items-center gap-2 px-3 py-2 rounded-md transition-colors ${
                          isActive("/orders")
                            ? "text-primary bg-accent"
                            : "text-foreground hover:text-primary hover:bg-muted"
                        }`}
                      >
                        <Package className="w-4 h-4" />
                        Đơn Hàng
                      </Link>
                    </>
                  )}
                  <Link
                    to="/contact"
                    className={`flex items-center gap-2 px-3 py-2 rounded-md transition-colors ${
                      isActive("/contact")
                        ? "text-primary bg-accent"
                        : "text-foreground hover:text-primary hover:bg-muted"
                    }`}
                  >
                    <Phone className="w-4 h-4" />
                    Liên Hệ
                  </Link>
                </>
              )}
              {isSeller && (
                <>
                  <Link
                    to="/"
                    className={`flex items-center gap-2 px-3 py-2 rounded-md transition-colors ${
                      isActive("/")
                        ? "text-primary bg-accent"
                        : "text-foreground hover:text-primary hover:bg-muted"
                    }`}
                  >
                    <Home className="w-4 h-4" />
                    Trang Chủ
                  </Link>
                  <Link
                    to="/admin"
                    className={`flex items-center gap-2 px-3 py-2 rounded-md transition-colors ${
                      isActive("/admin")
                        ? "text-primary bg-accent"
                        : "text-foreground hover:text-primary hover:bg-muted"
                    }`}
                  >
                    <BarChart3 className="w-4 h-4" />
                    Quản Lý Kênh Bán
                  </Link>
                </>
              )}
            </nav>

            <div className="flex items-center gap-3">
              {isCustomer && (
                <Link
                  to="/cart"
                  className="relative flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
                >
                  <ShoppingCart className="w-5 h-5" />
                  <span className="hidden sm:inline">Giỏ Hàng</span>
                  {cartCount > 0 && (
                    <span className="absolute -top-2 -right-2 bg-destructive text-white text-xs rounded-full w-6 h-6 flex items-center justify-center font-bold">
                      {cartCount}
                    </span>
                  )}
                </Link>
              )}

              {role ? (
                <>
                  <Link
                    to="/profile"
                    className={`flex items-center gap-2 px-3 py-2 rounded-md transition-colors ${
                      isActive("/profile")
                        ? "text-primary bg-accent"
                        : "text-muted-foreground hover:text-primary hover:bg-muted"
                    }`}
                    title="Tài Khoản"
                  >
                    <UserCircle className="w-5 h-5" />
                    <span className="hidden sm:inline text-sm">Tài Khoản</span>
                  </Link>

                  <button
                    onClick={() => {
                      logout();
                      navigate("/");
                    }}
                    className="flex items-center gap-2 px-3 py-2 text-muted-foreground hover:text-primary hover:bg-muted rounded-md transition-colors"
                    title="Đăng Xuất"
                  >
                    <LogOut className="w-5 h-5" />
                    <span className="hidden sm:inline">Đăng Xuất</span>
                  </button>
                </>
              ) : (
                <Link
                  to="/auth"
                  className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
                >
                  <UserCircle className="w-5 h-5" />
                  <span className="hidden sm:inline">Đăng Nhập</span>
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main>
        <Outlet />
      </main>

      {/* Chatbot */}
      <Chatbot />

      {/* Footer */}
      <footer className="bg-foreground text-white mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Sprout className="w-6 h-6" />
                <span className="font-bold">Nông Sản Việt</span>
              </div>
              <p className="text-gray-400 text-sm">
                Nền tảng thương mại điện tử nông sản Việt Nam. Kết nối người nông dân với người tiêu dùng.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Mua Sắm</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><Link to="/products" className="hover:text-white">Tất Cả Sản Phẩm</Link></li>
                {isCustomer && <li><Link to="/cart" className="hover:text-white">Giỏ Hàng</Link></li>}
                {isCustomer && <li><Link to="/wishlist" className="hover:text-white">Sản Phẩm Yêu Thích</Link></li>}
                {isCustomer && <li><Link to="/orders" className="hover:text-white">Lịch Sử Đơn Hàng</Link></li>}
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Tài Khoản</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                {role && <li><Link to="/profile" className="hover:text-white">Tài Khoản Của Tôi</Link></li>}
                {!role && <li><Link to="/auth" className="hover:text-white">Đăng Nhập / Đăng Ký</Link></li>}
                <li><Link to="/contact" className="hover:text-white">Liên Hệ</Link></li>
                <li><a href="#" className="hover:text-white">Trung Tâm Trợ Giúp</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Chính Sách</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-white">Bảo Mật</a></li>
                <li><a href="#" className="hover:text-white">Điều Khoản Dịch Vụ</a></li>
                <li><a href="#" className="hover:text-white">Chính Sách Đổi Trả</a></li>
                <li><a href="#" className="hover:text-white">Thanh Toán An Toàn</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm text-gray-400">
            <p>&copy; 2026 Nông Sản Việt. Tất cả các quyền được bảo lưu. Phiên bản demo.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
