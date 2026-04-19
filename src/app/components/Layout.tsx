import { Outlet, Link, useLocation, useNavigate } from "react-router";
import { useState, useRef, useEffect } from "react";
import { ShoppingCart, Package, Home, Grid3x3, Sprout, BarChart3, LogOut, Heart, UserCircle, Phone, TreePine, CalendarDays, Crown, AlertTriangle, ChevronDown, Menu, X } from "lucide-react";
import { useShop } from "../context/ShopContext";
import { useAuth } from "../context/AuthContext";
import { Chatbot } from "./Chatbot";

export function Layout() {
  const { getCartCount, wishlist, products, orders } = useShop();
  const { role, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const cartCount = getCartCount();

  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const userMenuRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  const isActive = (path: string) => location.pathname === path;
  const isCustomer = role === "consumer";
  const isSeller = role === "seller";

  // Close menus on route change
  useEffect(() => {
    setUserMenuOpen(false);
    setMobileMenuOpen(false);
  }, [location.pathname]);

  // Close user dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);


  // Primary nav links for customer
  const customerNavLinks = [
    { to: "/", label: "Trang Chủ", icon: Home },
    { to: "/products", label: "Sản Phẩm", icon: Grid3x3 },
    { to: "/farm-story", label: "Nông Trại", icon: TreePine },
    { to: "/contact", label: "Liên Hệ", icon: Phone },
  ];

  // User dropdown items for customer
  const customerDropdownLinks = [
    { to: "/profile", label: "Tài Khoản", icon: UserCircle },
    { to: "/orders", label: "Đơn Hàng", icon: Package },
    { to: "/wishlist", label: "Yêu Thích", icon: Heart, badge: wishlist.length },
    { to: "/subscription", label: "Gói Định Kỳ", icon: CalendarDays },
    { to: "/loyalty", label: "Tích Điểm", icon: Crown },
    { to: "/issue-center", label: "Hỗ Trợ", icon: AlertTriangle },
  ];

  const sellerPendingCount = (() => {
    if (!isSeller) return 0;
    const sellerEmail = localStorage.getItem("current_user_email") || "";
    const sellerProductIds = new Set(
      products.filter((p) => p.sellerId?.toLowerCase() === sellerEmail.toLowerCase()).map((p) => p.id)
    );
    return orders.filter(
      (o) =>
        (o.status === "pending" || o.status === "processing") &&
        o.items.some((item) => sellerProductIds.has(item.product.id))
    ).length;
  })();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-white/95 backdrop-blur-md shadow-sm sticky top-0 z-50 border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 shrink-0">
              <Sprout className="w-8 h-8 text-primary" />
              <div>
                <span className="text-xl font-bold text-foreground">Nông Sản Việt</span>
                <p className="text-xs text-muted-foreground hidden sm:block">Nông Sản Việt Nam</p>
              </div>
            </Link>

            {/* Desktop: Primary Nav */}
            <nav className="hidden lg:flex items-center gap-1">
              {!isSeller && customerNavLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isActive(link.to)
                      ? "text-primary bg-primary/10 shadow-sm"
                      : "text-foreground/80 hover:text-primary hover:bg-primary/5"
                  }`}
                >
                  <link.icon className="w-4 h-4" />
                  {link.label}
                </Link>
              ))}
              {isSeller && (
                <>
                  <Link
                    to="/"
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      isActive("/")
                        ? "text-primary bg-primary/10 shadow-sm"
                        : "text-foreground/80 hover:text-primary hover:bg-primary/5"
                    }`}
                  >
                    <Home className="w-4 h-4" />
                    Trang Chủ
                  </Link>
                  <Link
                    to="/admin"
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 relative ${
                      isActive("/admin")
                        ? "text-primary bg-primary/10 shadow-sm"
                        : "text-foreground/80 hover:text-primary hover:bg-primary/5"
                    }`}
                  >
                    <BarChart3 className="w-4 h-4" />
                    Quản Lý Kênh Bán
                    {sellerPendingCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-destructive text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold animate-pulse">
                        {sellerPendingCount}
                      </span>
                    )}
                  </Link>
                </>
              )}
            </nav>

            {/* Desktop: Cart + User Dropdown */}
            <div className="hidden lg:flex items-center gap-2">

              {/* Cart */}
              {isCustomer && (
                <Link
                  to="/cart"
                  className="relative flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-all duration-200 hover:shadow-md"
                >
                  <ShoppingCart className="w-5 h-5" />
                  <span>Giỏ Hàng</span>
                  {cartCount > 0 && (
                    <span className="absolute -top-2 -right-2 bg-destructive text-white text-xs rounded-full w-6 h-6 flex items-center justify-center font-bold shadow-sm animate-pulse">
                      {cartCount}
                    </span>
                  )}
                </Link>
              )}

              {/* User Dropdown */}
              {role ? (
                <div className="relative" ref={userMenuRef}>
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      userMenuOpen
                        ? "text-primary bg-primary/10"
                        : "text-foreground/80 hover:text-primary hover:bg-primary/5"
                    }`}
                  >
                    <div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center">
                      <UserCircle className="w-5 h-5 text-primary" />
                    </div>
                    <span className="hidden xl:inline max-w-[80px] truncate">{isSeller ? "Người Bán" : "Tài Khoản"}</span>
                    <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${userMenuOpen ? "rotate-180" : ""}`} />
                  </button>

                  {/* Dropdown Menu */}
                  {userMenuOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-border/50 py-2 z-[60] animate-in fade-in slide-in-from-top-2 duration-200">
                      {/* User info header */}
                      <div className="px-4 py-3 border-b border-border/50">
                        <p className="text-sm font-semibold text-foreground">{isSeller ? "Người Bán" : "Khách Hàng"}</p>
                        <p className="text-xs text-muted-foreground truncate">{localStorage.getItem("current_user_email") || "user@email.com"}</p>
                      </div>

                      {/* Dropdown links */}
                      {isCustomer && customerDropdownLinks.map((link) => (
                        <Link
                          key={link.to}
                          to={link.to}
                          className={`flex items-center gap-3 px-4 py-2.5 text-sm transition-colors relative ${
                            isActive(link.to)
                              ? "text-primary bg-primary/5 font-medium"
                              : "text-foreground/80 hover:text-primary hover:bg-primary/5"
                          }`}
                        >
                          <link.icon className="w-4 h-4" />
                          {link.label}
                          {link.badge && link.badge > 0 ? (
                            <span className="ml-auto bg-destructive text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                              {link.badge}
                            </span>
                          ) : null}
                        </Link>
                      ))}

                      {isSeller && (
                        <Link
                          to="/profile"
                          className={`flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                            isActive("/profile")
                              ? "text-primary bg-primary/5 font-medium"
                              : "text-foreground/80 hover:text-primary hover:bg-primary/5"
                          }`}
                        >
                          <UserCircle className="w-4 h-4" />
                          Tài Khoản
                        </Link>
                      )}

                      {/* Divider + Logout */}
                      <div className="border-t border-border/50 mt-1 pt-1">
                        <button
                          onClick={() => {
                            logout();
                            navigate("/");
                          }}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-destructive hover:bg-destructive/5 transition-colors"
                        >
                          <LogOut className="w-4 h-4" />
                          Đăng Xuất
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  to="/auth"
                  className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-all duration-200 hover:shadow-md"
                >
                  <UserCircle className="w-5 h-5" />
                  Đăng Nhập
                </Link>
              )}
            </div>

            {/* Mobile: Cart + Hamburger */}
            <div className="flex lg:hidden items-center gap-2">
              {isCustomer && (
                <Link
                  to="/cart"
                  className="relative flex items-center gap-1 px-3 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
                >
                  <ShoppingCart className="w-5 h-5" />
                  {cartCount > 0 && (
                    <span className="absolute -top-2 -right-2 bg-destructive text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                      {cartCount}
                    </span>
                  )}
                </Link>
              )}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-lg text-foreground/80 hover:bg-muted transition-colors"
                aria-label="Menu"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div ref={mobileMenuRef} className="lg:hidden border-t border-border bg-white/98 backdrop-blur-md shadow-lg">
            <div className="max-w-7xl mx-auto px-4 py-4 space-y-1">


              {/* Mobile Nav Links */}
              {!isSeller && (
                <>
                  {customerNavLinks.map((link) => (
                    <Link
                      key={link.to}
                      to={link.to}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                        isActive(link.to)
                          ? "text-primary bg-primary/10"
                          : "text-foreground/80 hover:text-primary hover:bg-primary/5"
                      }`}
                    >
                      <link.icon className="w-5 h-5" />
                      {link.label}
                    </Link>
                  ))}

                  {isCustomer && (
                    <>
                      <div className="border-t border-border/50 my-2 pt-2">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 mb-1">Tài Khoản</p>
                      </div>
                      {customerDropdownLinks.map((link) => (
                        <Link
                          key={link.to}
                          to={link.to}
                          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                            isActive(link.to)
                              ? "text-primary bg-primary/10"
                              : "text-foreground/80 hover:text-primary hover:bg-primary/5"
                          }`}
                        >
                          <link.icon className="w-5 h-5" />
                          {link.label}
                          {link.badge && link.badge > 0 ? (
                            <span className="ml-auto bg-destructive text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                              {link.badge}
                            </span>
                          ) : null}
                        </Link>
                      ))}
                    </>
                  )}
                </>
              )}

              {isSeller && (
                <>
                  <Link
                    to="/"
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      isActive("/")
                        ? "text-primary bg-primary/10"
                        : "text-foreground/80 hover:text-primary hover:bg-primary/5"
                    }`}
                  >
                    <Home className="w-5 h-5" />
                    Trang Chủ
                  </Link>
                  <Link
                    to="/admin"
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors relative ${
                      isActive("/admin")
                        ? "text-primary bg-primary/10"
                        : "text-foreground/80 hover:text-primary hover:bg-primary/5"
                    }`}
                  >
                    <BarChart3 className="w-5 h-5" />
                    Quản Lý Kênh Bán
                    {sellerPendingCount > 0 && (
                      <span className="ml-auto bg-destructive text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                        {sellerPendingCount}
                      </span>
                    )}
                  </Link>
                  <Link
                    to="/profile"
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      isActive("/profile")
                        ? "text-primary bg-primary/10"
                        : "text-foreground/80 hover:text-primary hover:bg-primary/5"
                    }`}
                  >
                    <UserCircle className="w-5 h-5" />
                    Tài Khoản
                  </Link>
                </>
              )}

              {/* Login/Logout */}
              {role ? (
                <div className="border-t border-border/50 mt-2 pt-2">
                  <button
                    onClick={() => {
                      logout();
                      navigate("/");
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-destructive hover:bg-destructive/5 transition-colors"
                  >
                    <LogOut className="w-5 h-5" />
                    Đăng Xuất
                  </button>
                </div>
              ) : (
                <div className="border-t border-border/50 mt-2 pt-2">
                  <Link
                    to="/auth"
                    className="flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium"
                  >
                    <UserCircle className="w-5 h-5" />
                    Đăng Nhập
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
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
                <li><Link to="/loyalty" className="hover:text-white">Tích Điểm Thành Viên</Link></li>
                <li><Link to="/subscription" className="hover:text-white">Gói Định Kỳ</Link></li>
                <li><Link to="/issue-center" className="hover:text-white">Hỗ Trợ Chất Lượng</Link></li>
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
