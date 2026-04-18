import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { useAuth } from "../context/AuthContext";
import { DEMO_ACCOUNTS } from "../context/AuthContext";
import {
  Sprout,
  Mail,
  Lock,
  User,
  Phone,
  Eye,
  EyeOff,
  Store,
  UserCircle,
  AlertCircle,
  ArrowRight,
  Check,
  FlaskConical,
} from "lucide-react";
import { toast } from "sonner";

type AuthMode = "login" | "register";

export function Auth() {
  const { login, register, role } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<AuthMode>("login");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Login form state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // Register form state
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regConfirmPassword, setRegConfirmPassword] = useState("");
  const [regRole, setRegRole] = useState<"consumer" | "seller">("consumer");

  // If already logged in, redirect
  if (role) {
    navigate(role === "seller" ? "/admin" : "/");
    return null;
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!loginEmail.trim()) {
      setError("Vui lòng nhập email.");
      return;
    }
    if (!loginPassword) {
      setError("Vui lòng nhập mật khẩu.");
      return;
    }

    setIsLoading(true);
    // Simulate brief loading for UX
    await new Promise((r) => setTimeout(r, 400));

    const result = login(loginEmail.trim(), loginPassword);
    setIsLoading(false);

    if (!result.success) {
      setError(result.error || "Đăng nhập thất bại.");
      return;
    }

    toast.success("Đăng nhập thành công!");
    // We need to read the role from localStorage since state update is async
    const userRole = localStorage.getItem("user_role");
    navigate(userRole === "seller" ? "/admin" : "/");
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!regName.trim()) {
      setError("Vui lòng nhập họ và tên.");
      return;
    }
    if (!regEmail.trim()) {
      setError("Vui lòng nhập email.");
      return;
    }
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(regEmail.trim())) {
      setError("Email không hợp lệ.");
      return;
    }
    if (!regPassword) {
      setError("Vui lòng nhập mật khẩu.");
      return;
    }
    if (regPassword.length < 6) {
      setError("Mật khẩu phải có ít nhất 6 ký tự.");
      return;
    }
    if (regPassword !== regConfirmPassword) {
      setError("Mật khẩu xác nhận không khớp.");
      return;
    }

    setIsLoading(true);
    await new Promise((r) => setTimeout(r, 400));

    const result = register({
      name: regName.trim(),
      email: regEmail.trim(),
      phone: regPhone.trim(),
      password: regPassword,
      role: regRole,
    });
    setIsLoading(false);

    if (!result.success) {
      setError(result.error || "Đăng ký thất bại.");
      return;
    }

    toast.success("Đăng ký thành công! Chào mừng bạn.");
    navigate(regRole === "seller" ? "/admin" : "/");
  };

  const switchMode = (newMode: AuthMode) => {
    setMode(newMode);
    setError("");
    setShowPassword(false);
    setShowConfirmPassword(false);
  };

  /** One-click fill + submit for demo accounts */
  const fillDemo = async (type: "consumer" | "seller") => {
    const demo = DEMO_ACCOUNTS.find((a) => a.role === type)!;
    switchMode("login");
    setLoginEmail(demo.email);
    setLoginPassword(demo.password);
    setError("");
    setIsLoading(true);
    await new Promise((r) => setTimeout(r, 300));
    const result = login(demo.email, demo.password);
    setIsLoading(false);
    if (!result.success) {
      setError(result.error || "Dăng nhập thất bại.");
      return;
    }
    toast.success(`Đăng nhập thành công với tài khoản demo ${type === "consumer" ? "Người mua" : "Người bán"}!`);
    navigate(type === "seller" ? "/admin" : "/");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      {/* Logo */}
      <div className="text-center mb-8">
        <Link to="/" className="inline-flex flex-col items-center gap-2">
          <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center shadow-lg">
            <Sprout className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Nông Sản Việt</h1>
          <p className="text-sm text-muted-foreground">
            Vietnamese Agriculture E-Commerce
          </p>
        </Link>
      </div>

      {/* Auth Card */}
      <div className="w-full max-w-md">
        {/* ===== DEMO ACCOUNTS BANNER ===== */}
        <div
          style={{
            background: "linear-gradient(135deg, #f0fdf4 0%, #dcfce7 50%, #ecfdf5 100%)",
            border: "1.5px solid #86efac",
            borderRadius: "12px",
            padding: "14px 16px",
            marginBottom: "12px",
            boxShadow: "0 2px 8px rgba(34,197,94,0.10)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
            <FlaskConical style={{ width: 17, height: 17, color: "#16a34a", flexShrink: 0 }} />
            <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "#15803d", letterSpacing: "0.04em", textTransform: "uppercase" }}>
              Tài khoản demo — Dành cho nhà phát triển
            </span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
            {/* Consumer demo */}
            <button
              id="demo-consumer-btn"
              type="button"
              onClick={() => fillDemo("consumer")}
              style={{
                background: "#ffffff",
                border: "1.5px solid #86efac",
                borderRadius: "8px",
                padding: "10px 12px",
                cursor: "pointer",
                textAlign: "left",
                transition: "box-shadow 0.18s, border-color 0.18s",
              }}
              onMouseOver={(e) => {
                (e.currentTarget as HTMLButtonElement).style.borderColor = "#22c55e";
                (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 0 0 3px rgba(34,197,94,0.15)";
              }}
              onMouseOut={(e) => {
                (e.currentTarget as HTMLButtonElement).style.borderColor = "#86efac";
                (e.currentTarget as HTMLButtonElement).style.boxShadow = "none";
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
                <UserCircle style={{ width: 15, height: 15, color: "#16a34a" }} />
                <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#15803d" }}>Người Mua</span>
              </div>
              <div style={{ fontSize: "0.7rem", color: "#374151", lineHeight: 1.5 }}>
                <div><span style={{ color: "#6b7280" }}>Email:</span> consumer@demo.com</div>
                <div><span style={{ color: "#6b7280" }}>Mật khẩu:</span> demo123</div>
              </div>
              <div style={{ marginTop: "6px", display: "flex", alignItems: "center", gap: "4px" }}>
                <ArrowRight style={{ width: 11, height: 11, color: "#16a34a" }} />
                <span style={{ fontSize: "0.68rem", color: "#16a34a", fontWeight: 600 }}>Click để đăng nhập</span>
              </div>
            </button>

            {/* Seller demo */}
            <button
              id="demo-seller-btn"
              type="button"
              onClick={() => fillDemo("seller")}
              style={{
                background: "#ffffff",
                border: "1.5px solid #86efac",
                borderRadius: "8px",
                padding: "10px 12px",
                cursor: "pointer",
                textAlign: "left",
                transition: "box-shadow 0.18s, border-color 0.18s",
              }}
              onMouseOver={(e) => {
                (e.currentTarget as HTMLButtonElement).style.borderColor = "#22c55e";
                (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 0 0 3px rgba(34,197,94,0.15)";
              }}
              onMouseOut={(e) => {
                (e.currentTarget as HTMLButtonElement).style.borderColor = "#86efac";
                (e.currentTarget as HTMLButtonElement).style.boxShadow = "none";
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
                <Store style={{ width: 15, height: 15, color: "#16a34a" }} />
                <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#15803d" }}>Người Bán</span>
              </div>
              <div style={{ fontSize: "0.7rem", color: "#374151", lineHeight: 1.5 }}>
                <div><span style={{ color: "#6b7280" }}>Email:</span> seller@demo.com</div>
                <div><span style={{ color: "#6b7280" }}>Mật khẩu:</span> demo123</div>
              </div>
              <div style={{ marginTop: "6px", display: "flex", alignItems: "center", gap: "4px" }}>
                <ArrowRight style={{ width: 11, height: 11, color: "#16a34a" }} />
                <span style={{ fontSize: "0.68rem", color: "#16a34a", fontWeight: 600 }}>Click để đăng nhập</span>
              </div>
            </button>
          </div>
        </div>
        {/* ================================ */}
        {/* Tab Switcher */}
        <div className="flex bg-white rounded-t-xl border border-b-0 border-border overflow-hidden">
          <button
            onClick={() => switchMode("login")}
            className={`flex-1 py-3.5 text-sm font-semibold transition-colors ${
              mode === "login"
                ? "bg-primary text-white"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
          >
            Đăng Nhập
          </button>
          <button
            onClick={() => switchMode("register")}
            className={`flex-1 py-3.5 text-sm font-semibold transition-colors ${
              mode === "register"
                ? "bg-primary text-white"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
          >
            Đăng Ký
          </button>
        </div>

        {/* Form Container */}
        <div className="bg-white rounded-b-xl border border-border shadow-lg p-6 sm:p-8">
          {/* Error Alert */}
          {error && (
            <div className="flex items-start gap-3 p-3 mb-6 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm animate-in">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {mode === "login" ? (
            /* ========== LOGIN FORM ========== */
            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold mb-1.5 text-foreground">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <input
                    id="login-email"
                    type="email"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="email@example.com"
                    className="w-full pl-11 pr-4 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-background transition-shadow"
                    autoComplete="email"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1.5 text-foreground">
                  Mật khẩu
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <input
                    id="login-password"
                    type={showPassword ? "text" : "password"}
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-11 pr-12 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-background transition-shadow"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 bg-primary text-white py-3 rounded-lg font-semibold hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    Đăng Nhập
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <p className="text-center text-sm text-muted-foreground">
                Chưa có tài khoản?{" "}
                <button
                  type="button"
                  onClick={() => switchMode("register")}
                  className="text-primary font-semibold hover:text-primary/80"
                >
                  Đăng ký ngay
                </button>
              </p>
            </form>
          ) : (
            /* ========== REGISTER FORM ========== */
            <form onSubmit={handleRegister} className="space-y-4">
              {/* Name */}
              <div>
                <label className="block text-sm font-semibold mb-1.5 text-foreground">
                  Họ và Tên <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <input
                    id="register-name"
                    type="text"
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    placeholder="Nguyễn Văn A"
                    className="w-full pl-11 pr-4 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-background transition-shadow"
                    autoComplete="name"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-semibold mb-1.5 text-foreground">
                  Email <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <input
                    id="register-email"
                    type="email"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="email@example.com"
                    className="w-full pl-11 pr-4 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-background transition-shadow"
                    autoComplete="email"
                  />
                </div>
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-semibold mb-1.5 text-foreground">
                  Số Điện Thoại
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <input
                    id="register-phone"
                    type="tel"
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value)}
                    placeholder="0901 234 567"
                    className="w-full pl-11 pr-4 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-background transition-shadow"
                    autoComplete="tel"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-semibold mb-1.5 text-foreground">
                  Mật khẩu <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <input
                    id="register-password"
                    type={showPassword ? "text" : "password"}
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="Ít nhất 6 ký tự"
                    className="w-full pl-11 pr-12 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-background transition-shadow"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-sm font-semibold mb-1.5 text-foreground">
                  Xác nhận mật khẩu <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <input
                    id="register-confirm-password"
                    type={showConfirmPassword ? "text" : "password"}
                    value={regConfirmPassword}
                    onChange={(e) => setRegConfirmPassword(e.target.value)}
                    placeholder="Nhập lại mật khẩu"
                    className="w-full pl-11 pr-12 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-background transition-shadow"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    tabIndex={-1}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
                {regConfirmPassword && regPassword === regConfirmPassword && (
                  <p className="text-green-600 text-xs mt-1 flex items-center gap-1">
                    <Check className="w-3 h-3" /> Mật khẩu khớp
                  </p>
                )}
              </div>

              {/* Role Selection */}
              <div>
                <label className="block text-sm font-semibold mb-2 text-foreground">
                  Vai trò <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setRegRole("consumer")}
                    className={`flex items-center gap-2.5 p-3 rounded-lg border-2 transition-all ${
                      regRole === "consumer"
                        ? "border-primary bg-primary/5 text-primary"
                        : "border-border text-muted-foreground hover:border-primary/40 hover:bg-muted"
                    }`}
                  >
                    <UserCircle className="w-5 h-5" />
                    <span className="text-sm font-semibold">Người Mua</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setRegRole("seller")}
                    className={`flex items-center gap-2.5 p-3 rounded-lg border-2 transition-all ${
                      regRole === "seller"
                        ? "border-primary bg-primary/5 text-primary"
                        : "border-border text-muted-foreground hover:border-primary/40 hover:bg-muted"
                    }`}
                  >
                    <Store className="w-5 h-5" />
                    <span className="text-sm font-semibold">Người Bán</span>
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 bg-primary text-white py-3 rounded-lg font-semibold hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    Đăng Ký
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <p className="text-center text-sm text-muted-foreground">
                Đã có tài khoản?{" "}
                <button
                  type="button"
                  onClick={() => switchMode("login")}
                  className="text-primary font-semibold hover:text-primary/80"
                >
                  Đăng nhập
                </button>
              </p>
            </form>
          )}
        </div>
      </div>

      {/* Guest Browse Link */}
      <Link
        to="/products"
        className="mt-6 text-sm font-semibold text-primary hover:text-primary/80 flex items-center gap-1 transition-colors"
      >
        Tiếp tục với tư cách khách
        <ArrowRight className="w-4 h-4" />
      </Link>
    </div>
  );
}
