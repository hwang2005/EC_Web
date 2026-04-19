import { lazy, Suspense, type ComponentType } from "react";
import { createBrowserRouter } from "react-router";
import { Layout } from "./components/Layout";

// Lazy-loaded page components for code-splitting
const Home = lazy(() => import("./pages/Home").then(m => ({ default: m.Home })));
const Products = lazy(() => import("./pages/Products").then(m => ({ default: m.Products })));
const ProductDetail = lazy(() => import("./pages/ProductDetail").then(m => ({ default: m.ProductDetail })));
const Cart = lazy(() => import("./pages/Cart").then(m => ({ default: m.Cart })));
const Checkout = lazy(() => import("./pages/Checkout").then(m => ({ default: m.Checkout })));
const Orders = lazy(() => import("./pages/Orders").then(m => ({ default: m.Orders })));
const Admin = lazy(() => import("./pages/Admin").then(m => ({ default: m.Admin })));
const Auth = lazy(() => import("./pages/Auth").then(m => ({ default: m.Auth })));
const Wishlist = lazy(() => import("./pages/Wishlist").then(m => ({ default: m.Wishlist })));
const Profile = lazy(() => import("./pages/Profile").then(m => ({ default: m.Profile })));
const Contact = lazy(() => import("./pages/Contact").then(m => ({ default: m.Contact })));
const FarmStory = lazy(() => import("./pages/FarmStory").then(m => ({ default: m.FarmStory })));
const Subscription = lazy(() => import("./pages/Subscription").then(m => ({ default: m.Subscription })));
const Loyalty = lazy(() => import("./pages/Loyalty").then(m => ({ default: m.Loyalty })));
const IssueCenter = lazy(() => import("./pages/IssueCenter").then(m => ({ default: m.IssueCenter })));
const NotFound = lazy(() => import("./pages/NotFound").then(m => ({ default: m.NotFound })));

// Loading fallback component
function PageLoader() {
  return (
    <div style={{
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      minHeight: "60vh",
    }}>
      <div style={{
        width: 40,
        height: 40,
        border: "4px solid #e5e7eb",
        borderTop: "4px solid #16a34a",
        borderRadius: "50%",
        animation: "spin 0.8s linear infinite",
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// Helper to wrap a lazy component with Suspense
function withSuspense(LazyComponent: ComponentType) {
  return function SuspenseWrapper() {
    return (
      <Suspense fallback={<PageLoader />}>
        <LazyComponent />
      </Suspense>
    );
  };
}

export const router = createBrowserRouter([
  {
    path: "/auth",
    Component: withSuspense(Auth),
  },
  {
    path: "/",
    Component: Layout,
    children: [
      { index: true, Component: withSuspense(Home) },
      { path: "products", Component: withSuspense(Products) },
      { path: "products/:id", Component: withSuspense(ProductDetail) },
      { path: "cart", Component: withSuspense(Cart) },
      { path: "checkout", Component: withSuspense(Checkout) },
      { path: "orders", Component: withSuspense(Orders) },
      { path: "wishlist", Component: withSuspense(Wishlist) },
      { path: "profile", Component: withSuspense(Profile) },
      { path: "contact", Component: withSuspense(Contact) },
      { path: "farm-story", Component: withSuspense(FarmStory) },
      { path: "subscription", Component: withSuspense(Subscription) },
      { path: "loyalty", Component: withSuspense(Loyalty) },
      { path: "issue-center", Component: withSuspense(IssueCenter) },
      { path: "admin", Component: withSuspense(Admin) },
      { path: "*", Component: withSuspense(NotFound) },
    ],
  },
]);
