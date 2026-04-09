import { RouterProvider } from "react-router";
import { router } from "./routes";
import { ShopProvider } from "./context/ShopContext";
import { Toaster } from "sonner";
import { AuthProvider } from "./context/AuthContext";

export default function App() {
  return (
    <AuthProvider>
      <ShopProvider>
        <RouterProvider router={router} />
        <Toaster position="top-right" />
      </ShopProvider>
    </AuthProvider>
  );
}
