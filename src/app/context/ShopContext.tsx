import React, { createContext, useContext, useEffect, useState } from "react";
import { Product, CartItem, Order, Review } from "../types";
import { PRODUCTS, CustomerTier } from "../data/products";

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
}

const ShopContext = createContext<ShopContextType | undefined>(undefined);

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
