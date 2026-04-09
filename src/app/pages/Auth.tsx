import { useNavigate } from "react-router";
import { useAuth } from "../context/AuthContext";
import { Store, UserCircle, Sprout } from "lucide-react";

export function Auth() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = (role: "consumer" | "seller") => {
    login(role);
    if (role === "seller") {
      navigate("/admin");
    } else {
      navigate("/");
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="text-center mb-12">
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 bg-primary rounded-full flex flex-col items-center justify-center">
            <Sprout className="w-8 h-8 text-white" />
          </div>
        </div>
        <h1 className="text-3xl font-bold text-foreground mb-2">
          Nông Sản Việt
        </h1>
        <p className="text-muted-foreground">
          Chọn vai trò của bạn để tiếp tục
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6 max-w-2xl w-full">
        <button
          onClick={() => handleLogin("consumer")}
          className="bg-white border-2 border-border rounded-xl p-8 hover:border-primary hover:shadow-lg transition-all group text-left flex flex-col items-center text-center focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
        >
          <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex flex-col items-center justify-center mb-6 group-hover:scale-110 transition-transform">
            <UserCircle className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-foreground mb-2">
            Người Tiêu Dùng
          </h2>
          <p className="text-muted-foreground text-sm">
            Khám phá, mua sắm các sản phẩm nông sản tươi sạch trực tiếp từ bà con nông dân.
          </p>
        </button>

        <button
          onClick={() => handleLogin("seller")}
          className="bg-white border-2 border-border rounded-xl p-8 hover:border-primary hover:shadow-lg transition-all group text-left flex flex-col items-center text-center focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
        >
          <div className="w-16 h-16 bg-green-50 text-green-600 rounded-full flex flex-col items-center justify-center mb-6 group-hover:scale-110 transition-transform">
            <Store className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-foreground mb-2">
            Người Bán Hàng
          </h2>
          <p className="text-muted-foreground text-sm">
            Quản lý sản phẩm, theo dõi đơn hàng và xem thống kê doanh thu bán hàng.
          </p>
        </button>
      </div>
    </div>
  );
}
