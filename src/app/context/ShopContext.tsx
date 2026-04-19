import React, { createContext, useContext, useEffect, useState } from "react";
import { Product, CartItem, Order, Review, StoreProfile, Voucher } from "../types";
import { PRODUCTS, CustomerTier, DEFAULT_VOUCHERS } from "../data/products";

interface ShopContextType {
  products: Product[];
  cart: CartItem[];
  orders: Order[];
  wishlist: Product[];
  reviews: Review[];
  customerTier: CustomerTier;
  addToCart: (product: Product, quantity?: number) => void;
  removeFromCart: (productId: string) => void;
  updateCartQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  placeOrder: (order: Order) => void;
  cancelOrder: (orderId: string) => boolean;
  updateOrderStatus: (orderId: string, status: Order["status"]) => void;
  addProduct: (product: Product) => void;
  updateProduct: (product: Product) => void;
  deleteProduct: (productId: string) => void;
  getCartTotal: () => number;
  getCartCount: () => number;
  setCustomerTier: (tier: CustomerTier) => void;
  getPersonalizedPrice: (price: number) => number;
  addToWishlist: (product: Product) => void;
  removeFromWishlist: (productId: string) => void;
  isInWishlist: (productId: string) => boolean;
  addReview: (review: Review) => void;
  getProductReviews: (productId: string) => Review[];
  // Seller-scoped helpers
  getSellerProducts: (sellerEmail: string) => Product[];
  getSellerOrders: (sellerEmail: string) => Order[];
  getSellerReviews: (sellerEmail: string) => Review[];
  // Store profile
  storeProfile: StoreProfile;
  updateStoreProfile: (profile: StoreProfile) => void;
  // Vouchers
  vouchers: Voucher[];
  validateVoucher: (code: string, subtotal: number, cartCategories: string[]) => { valid: boolean; voucher?: Voucher; error?: string };
  applyVoucher: (voucherId: string) => void;
  addVoucher: (voucher: Voucher) => void;
  updateVoucher: (voucher: Voucher) => void;
  deleteVoucher: (voucherId: string) => void;
}

const ShopContext = createContext<ShopContextType | undefined>(undefined);

const DEFAULT_STORE_PROFILE: StoreProfile = {
  shopName: "Nông Sản Việt",
  shopDescription: "Chuyên cung cấp nông sản sạch, chất lượng cao từ khắp các vùng miền Việt Nam.",
  shopAddress: "123 Nguyễn Huệ, Quận 1, TP. Hồ Chí Minh",
  shopPhone: "0912 345 678",
  shopEmail: "seller@demo.com",
};

export function ShopProvider({ children }: { children: React.ReactNode }) {
  const [products, setProducts] = useState<Product[]>(() => {
    const stored = localStorage.getItem("products");
    if (stored) {
      const storedProducts: Product[] = JSON.parse(stored);
      // Always use latest data from source for built-in products,
      // but keep any admin-added products (IDs not in PRODUCTS)
      const sourceIds = new Set(PRODUCTS.map((p) => p.id));
      const adminProducts = storedProducts.filter((p) => !sourceIds.has(p.id));
      return [...PRODUCTS, ...adminProducts];
    }
    return PRODUCTS;
  });

  const [cart, setCart] = useState<CartItem[]>(() => {
    const stored = localStorage.getItem("cart");
    return stored ? JSON.parse(stored) : [];
  });

  const [orders, setOrders] = useState<Order[]>(() => {
    const stored = localStorage.getItem("orders");
    return stored ? JSON.parse(stored) : [];
  });

  const [wishlist, setWishlist] = useState<Product[]>(() => {
    const stored = localStorage.getItem("wishlist");
    return stored ? JSON.parse(stored) : [];
  });

  const [reviews, setReviews] = useState<Review[]>(() => {
    const stored = localStorage.getItem("reviews");
    return stored ? JSON.parse(stored) : [];
  });

  const [customerTier, setCustomerTier] = useState<CustomerTier>(() => {
    const stored = localStorage.getItem("customerTier");
    return (stored as CustomerTier) || "standard";
  });

  // ── Auto-compute tier from total delivered-order spending ──
  const computeAutoTier = (ordersList: Order[]): CustomerTier => {
    const totalSpent = ordersList
      .filter((o) => o.status === "delivered")
      .reduce((sum, o) => sum + o.total, 0);
    if (totalSpent >= 15_000_000) return "platinum";
    if (totalSpent >= 5_000_000) return "gold";
    if (totalSpent >= 1_000_000) return "silver";
    return "standard";
  };

  const autoTier = computeAutoTier(orders);

  const [storeProfile, setStoreProfile] = useState<StoreProfile>(() => {
    const stored = localStorage.getItem("storeProfile");
    return stored ? JSON.parse(stored) : DEFAULT_STORE_PROFILE;
  });

  const [vouchers, setVouchers] = useState<Voucher[]>(() => {
    const stored = localStorage.getItem("vouchers");
    if (stored) {
      const parsed: Voucher[] = JSON.parse(stored);
      // Merge: keep stored ones, add any DEFAULT_VOUCHERS not yet present
      const storedIds = new Set(parsed.map((v) => v.id));
      const newDefaults = DEFAULT_VOUCHERS.filter((v) => !storedIds.has(v.id));
      return [...parsed, ...newDefaults];
    }
    return DEFAULT_VOUCHERS;
  });

  // Persist to localStorage
  useEffect(() => {
    localStorage.setItem("products", JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    localStorage.setItem("orders", JSON.stringify(orders));
  }, [orders]);

  useEffect(() => {
    localStorage.setItem("wishlist", JSON.stringify(wishlist));
  }, [wishlist]);

  useEffect(() => {
    localStorage.setItem("reviews", JSON.stringify(reviews));
  }, [reviews]);

  useEffect(() => {
    localStorage.setItem("customerTier", customerTier);
  }, [customerTier]);

  // Sync manual tier with auto-computed tier whenever orders change
  useEffect(() => {
    if (autoTier !== customerTier) {
      setCustomerTier(autoTier);
    }
  }, [autoTier]);

  useEffect(() => {
    localStorage.setItem("storeProfile", JSON.stringify(storeProfile));
  }, [storeProfile]);

  useEffect(() => {
    localStorage.setItem("vouchers", JSON.stringify(vouchers));
  }, [vouchers]);

  const getPersonalizedPrice = (price: number) => {
    const discounts = {
      standard: 0,
      silver: 0.05,
      gold: 0.10,
      platinum: 0.15,
    };
    return price * (1 - discounts[customerTier]);
  };

  const addToCart = (product: Product, quantity: number = 1) => {
    setCart((prev) => {
      const existingItem = prev.find((item) => item.product.id === product.id);
      if (existingItem) {
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prev, { product, quantity }];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const updateCartQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart((prev) =>
      prev.map((item) =>
        item.product.id === productId ? { ...item, quantity } : item
      )
    );
  };

  const clearCart = () => {
    setCart([]);
  };

  const placeOrder = (order: Order) => {
    setOrders((prev) => [order, ...prev]);
    clearCart();
  };

  const CANCEL_WINDOW_MS = 5 * 60 * 1000; // 5 minutes

  const cancelOrder = (orderId: string): boolean => {
    const order = orders.find((o) => o.id === orderId);
    if (!order) return false;

    const elapsed = Date.now() - new Date(order.orderDate).getTime();
    if (elapsed > CANCEL_WINDOW_MS) return false;

    // Only allow cancellation if order hasn't progressed past processing
    if (order.status !== "pending" && order.status !== "processing") return false;

    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId ? { ...o, status: "cancelled" as const } : o
      )
    );
    return true;
  };

  const updateOrderStatus = (orderId: string, status: Order["status"]) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status } : o))
    );
  };

  const addProduct = (product: Product) => {
    setProducts((prev) => [...prev, product]);
  };

  const updateProduct = (product: Product) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === product.id ? product : p))
    );
  };

  const deleteProduct = (productId: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== productId));
  };

  const getCartTotal = () => {
    return cart.reduce((total, item) => total + item.product.price * item.quantity, 0);
  };

  const getCartCount = () => {
    return cart.reduce((count, item) => count + item.quantity, 0);
  };

  // Wishlist methods
  const addToWishlist = (product: Product) => {
    setWishlist((prev) => {
      if (prev.some((p) => p.id === product.id)) return prev;
      return [...prev, product];
    });
  };

  const removeFromWishlist = (productId: string) => {
    setWishlist((prev) => prev.filter((p) => p.id !== productId));
  };

  const isInWishlist = (productId: string) => {
    return wishlist.some((p) => p.id === productId);
  };

  // Review methods
  const addReview = (review: Review) => {
    setReviews((prev) => [review, ...prev]);
  };

  const getProductReviews = (productId: string) => {
    return reviews.filter((r) => r.productId === productId);
  };

  // Seller-scoped helpers
  const getSellerProducts = (sellerEmail: string) => {
    return products.filter(
      (p) => p.sellerId?.toLowerCase() === sellerEmail.toLowerCase()
    );
  };

  const getSellerOrders = (sellerEmail: string) => {
    // An order belongs to a seller if any item in the order is from that seller's products
    const sellerProductIds = new Set(
      getSellerProducts(sellerEmail).map((p) => p.id)
    );
    return orders.filter((order) =>
      order.items.some((item) => sellerProductIds.has(item.product.id))
    );
  };

  const getSellerReviews = (sellerEmail: string) => {
    const sellerProductIds = new Set(
      getSellerProducts(sellerEmail).map((p) => p.id)
    );
    return reviews.filter((r) => sellerProductIds.has(r.productId));
  };

  const updateStoreProfile = (profile: StoreProfile) => {
    setStoreProfile(profile);
  };

  // ── Voucher management ──────────────────────────────────────────────────────
  /**
   * Validate a voucher code against the current user tier, cart subtotal,
   * and the list of product categories in the cart.
   */
  const validateVoucher = (
    code: string,
    subtotal: number,
    cartCategories: string[]
  ): { valid: boolean; voucher?: Voucher; error?: string } => {
    const voucher = vouchers.find(
      (v) => v.code.toUpperCase() === code.toUpperCase()
    );
    if (!voucher) return { valid: false, error: "Mã voucher không tồn tại." };
    if (!voucher.isActive) return { valid: false, error: "Voucher này đã bị vô hiệu hóa." };

    // Expiry check
    if (new Date(voucher.expiryDate) < new Date()) {
      return { valid: false, error: "Voucher đã hết hạn." };
    }

    // Usage limit check
    if (voucher.usageLimit !== undefined && voucher.usedCount >= voucher.usageLimit) {
      return { valid: false, error: "Voucher đã đạt giới hạn sử dụng." };
    }

    // Minimum order value check
    if (subtotal < voucher.minOrderValue) {
      return {
        valid: false,
        error: `Đơn hàng tối thiểu ${voucher.minOrderValue.toLocaleString("vi-VN")}₫ để áp dụng voucher này.`,
      };
    }

    // Rank check
    if (
      !voucher.applicableRanks.includes("all") &&
      !voucher.applicableRanks.includes(autoTier)
    ) {
      return {
        valid: false,
        error: `Voucher này chỉ dành cho hạng thành viên: ${voucher.applicableRanks.join(", ")}.`,
      };
    }

    // Category check: at least one cart item must match the required category
    if (!voucher.applicableCategories.includes("all")) {
      const hasMatchingCategory = cartCategories.some((cat) =>
        voucher.applicableCategories.includes(cat)
      );
      if (!hasMatchingCategory) {
        return {
          valid: false,
          error: `Voucher này chỉ áp dụng cho danh mục: ${voucher.applicableCategories.join(", ")}.`,
        };
      }
    }

    return { valid: true, voucher };
  };

  /**
   * Increment usedCount for a voucher after a successful order.
   */
  const applyVoucher = (voucherId: string) => {
    setVouchers((prev) =>
      prev.map((v) =>
        v.id === voucherId ? { ...v, usedCount: v.usedCount + 1 } : v
      )
    );
  };

  const addVoucher = (voucher: Voucher) => {
    setVouchers((prev) => [...prev, voucher]);
  };

  const updateVoucher = (voucher: Voucher) => {
    setVouchers((prev) => prev.map((v) => (v.id === voucher.id ? voucher : v)));
  };

  const deleteVoucher = (voucherId: string) => {
    setVouchers((prev) => prev.filter((v) => v.id !== voucherId));
  };
  // ────────────────────────────────────────────────────────────────────────────

  return (
    <ShopContext.Provider
      value={{
        products,
        cart,
        orders,
        wishlist,
        reviews,
        customerTier,
        addToCart,
        removeFromCart,
        updateCartQuantity,
        clearCart,
        placeOrder,
        cancelOrder,
        updateOrderStatus,
        addProduct,
        updateProduct,
        deleteProduct,
        getCartTotal,
        getCartCount,
        setCustomerTier,
        getPersonalizedPrice,
        addToWishlist,
        removeFromWishlist,
        isInWishlist,
        addReview,
        getProductReviews,
        getSellerProducts,
        getSellerOrders,
        getSellerReviews,
        storeProfile,
        updateStoreProfile,
        vouchers,
        validateVoucher,
        applyVoucher,
        addVoucher,
        updateVoucher,
        deleteVoucher,
      }}
    >
      {children}
    </ShopContext.Provider>
  );
}

export function useShop() {
  const context = useContext(ShopContext);
  if (!context) {
    throw new Error("useShop must be used within ShopProvider");
  }
  return context;
}
