import React, { createContext, useContext, useEffect, useState } from "react";
import { Product, CartItem, Order } from "../types";
import { PRODUCTS, CustomerTier } from "../data/products";

interface ShopContextType {
  products: Product[];
  cart: CartItem[];
  orders: Order[];
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
}

const ShopContext = createContext<ShopContextType | undefined>(undefined);

export function ShopProvider({ children }: { children: React.ReactNode }) {
  const [products, setProducts] = useState<Product[]>(() => {
    const stored = localStorage.getItem("products");
    return stored ? JSON.parse(stored) : PRODUCTS;
  });

  const [cart, setCart] = useState<CartItem[]>(() => {
    const stored = localStorage.getItem("cart");
    return stored ? JSON.parse(stored) : [];
  });

  const [orders, setOrders] = useState<Order[]>(() => {
    const stored = localStorage.getItem("orders");
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

  return (
    <ShopContext.Provider
      value={{
        products,
        cart,
        orders,
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
