import React, { createContext, useContext, useEffect, useState } from "react";
import {
  Product,
  CartItem,
  Order,
  Review,
  StoreProfile,
  Voucher,
  SubscriptionOrder,
  SubscriptionDelivery,
} from "../types";
import {
  PRODUCTS,
  CustomerTier,
  DEFAULT_VOUCHERS,
  DELIVERY_OPTIONS,
  DELIVERY_SLOTS,
} from "../data/products";

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
  getSellerProducts: (sellerEmail: string) => Product[];
  getSellerOrders: (sellerEmail: string) => Order[];
  getSellerReviews: (sellerEmail: string) => Review[];
  storeProfile: StoreProfile;
  updateStoreProfile: (profile: StoreProfile) => void;
  vouchers: Voucher[];
  validateVoucher: (
    code: string,
    subtotal: number,
    cartCategories: string[],
  ) => { valid: boolean; voucher?: Voucher; error?: string };
  applyVoucher: (voucherId: string) => void;
  addVoucher: (voucher: Voucher) => void;
  updateVoucher: (voucher: Voucher) => void;
  deleteVoucher: (voucherId: string) => void;
  subscriptions: SubscriptionOrder[];
  createSubscription: (sub: SubscriptionOrder) => void;
  updateSubscription: (sub: SubscriptionOrder) => void;
  pauseSubscription: (subId: string) => void;
  resumeSubscription: (subId: string) => void;
  cancelSubscription: (subId: string) => void;
  getActiveSubscription: () => SubscriptionOrder | undefined;
}

const ShopContext = createContext<ShopContextType | undefined>(undefined);

const DEFAULT_STORE_PROFILE: StoreProfile = {
  shopName: "NÃ´ng Sáº£n Viá»‡t",
  shopDescription:
    "ChuyÃªn cung cáº¥p nÃ´ng sáº£n sáº¡ch, cháº¥t lÆ°á»£ng cao tá»« kháº¯p cÃ¡c vÃ¹ng miá»n Viá»‡t Nam.",
  shopAddress: "123 Nguyá»…n Huá»‡, Quáº­n 1, TP. Há»“ ChÃ­ Minh",
  shopPhone: "0912 345 678",
  shopEmail: "seller@demo.com",
};

const DAY_MAP: Record<string, number> = {
  sunday: 0,
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
};

const DEFAULT_SUBSCRIPTION_DELIVERY = DELIVERY_OPTIONS[0];

function formatCycleKey(dateInput: string | Date): string {
  const date = new Date(dateInput);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getFirstPreferredDayAfter(reference: Date, preferredDay: string, minDaysAhead: number): Date {
  const targetDay = DAY_MAP[preferredDay] ?? DAY_MAP.wednesday;
  const base = new Date(reference);
  base.setHours(9, 0, 0, 0);
  base.setDate(base.getDate() + minDaysAhead);

  const diff = (targetDay - base.getDay() + 7) % 7;
  base.setDate(base.getDate() + diff);
  return base;
}

function getInitialSubscriptionDate(
  frequency: SubscriptionOrder["frequency"],
  preferredDay: string,
): Date {
  const now = new Date();
  if (frequency === "monthly") {
    return getFirstPreferredDayAfter(now, preferredDay, 1);
  }
  return getFirstPreferredDayAfter(now, preferredDay, 1);
}

function getNextSubscriptionDateFrom(
  fromDate: string | Date,
  frequency: SubscriptionOrder["frequency"],
  preferredDay: string,
): Date {
  const current = new Date(fromDate);
  current.setHours(9, 0, 0, 0);

  if (frequency === "weekly") {
    return getFirstPreferredDayAfter(current, preferredDay, 7);
  }

  if (frequency === "biweekly") {
    return getFirstPreferredDayAfter(current, preferredDay, 14);
  }

  const nextMonthAnchor = new Date(current);
  nextMonthAnchor.setMonth(nextMonthAnchor.getMonth() + 1);
  return getFirstPreferredDayAfter(nextMonthAnchor, preferredDay, 0);
}

function parseEstimatedDeliveryDays(estimatedDays: string): number {
  const match = estimatedDays.match(/\d+/);
  return match ? Number(match[0]) : 3;
}

function getSubscriptionOrders(orders: Order[], subscriptionId: string): Order[] {
  return orders.filter((order) => order.subscriptionId === subscriptionId);
}

function buildSubscriptionDeliveryHistory(
  subscription: SubscriptionOrder,
  orders: Order[],
): SubscriptionDelivery[] {
  const relatedOrders = getSubscriptionOrders(orders, subscription.id);
  const orderCycleKeys = new Set(
    relatedOrders
      .map((order) => order.subscriptionCycleKey)
      .filter((value): value is string => Boolean(value)),
  );

  const orderHistory = relatedOrders.map((order) => {
    const deliveryDate = order.subscriptionCycleKey
      ? `${order.subscriptionCycleKey}T09:00:00.000`
      : order.estimatedDelivery;

    let status: SubscriptionDelivery["status"] = "scheduled";
    if (order.status === "delivered") {
      status = "delivered";
    } else if (order.status === "cancelled") {
      status = "skipped";
    }

    return {
      id: order.id,
      deliveryDate,
      status,
      total: order.total,
      items: order.items.map((item) => ({
        productId: item.product.id,
        productName: item.product.name,
        quantity: item.quantity,
        price: item.product.price,
      })),
    };
  });

  const skippedHistory = subscription.deliveryHistory.filter(
    (delivery) =>
      delivery.status === "skipped" &&
      !orderCycleKeys.has(formatCycleKey(delivery.deliveryDate)),
  );

  return [...orderHistory, ...skippedHistory].sort(
    (a, b) =>
      new Date(b.deliveryDate).getTime() - new Date(a.deliveryDate).getTime(),
  );
}

function appendSkippedDelivery(
  subscription: SubscriptionOrder,
  cycleDate: Date,
): SubscriptionOrder {
  const cycleKey = formatCycleKey(cycleDate);
  const existingSkipped = subscription.deliveryHistory.some(
    (delivery) =>
      delivery.status === "skipped" &&
      formatCycleKey(delivery.deliveryDate) === cycleKey,
  );

  if (existingSkipped) {
    return subscription;
  }

  return {
    ...subscription,
    deliveryHistory: [
      ...subscription.deliveryHistory,
      {
        id: `skip-${cycleKey}`,
        deliveryDate: cycleDate.toISOString(),
        status: "skipped",
        total: 0,
        items: [],
      },
    ],
  };
}

function buildSubscriptionOrderForCycle(
  subscription: SubscriptionOrder,
  cycleDate: Date,
  products: Product[],
): Order | null {
  const availableItems: CartItem[] = [];
  const unavailableNames: string[] = [];

  subscription.selectedProducts.forEach((productId) => {
    const product = products.find((item) => item.id === productId);
    if (product && product.stock > 0) {
      availableItems.push({ product, quantity: 1 });
    } else {
      unavailableNames.push(product?.name || `SP ${productId}`);
    }
  });

  if (availableItems.length === 0) {
    return null;
  }

  const subtotal = availableItems.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0,
  );
  const tax = subtotal * 0.1;
  const total = subtotal + tax + DEFAULT_SUBSCRIPTION_DELIVERY.price;

  const deliveryNote = [
    subscription.deliveryNote?.trim(),
    subscription.substitutionPref.includes("Gá»i")
      ? unavailableNames.length > 0
        ? `Thiáº¿u hÃ ng: ${unavailableNames.join(", ")}; vui lÃ²ng liÃªn há»‡ khÃ¡ch trÆ°á»›c khi thay tháº¿`
        : undefined
      : undefined,
  ]
    .filter(Boolean)
    .join(" | ");

  const estimatedDelivery = new Date(cycleDate);
  estimatedDelivery.setDate(
    estimatedDelivery.getDate() +
      parseEstimatedDeliveryDays(DEFAULT_SUBSCRIPTION_DELIVERY.estimatedDays),
  );

  const slot = DELIVERY_SLOTS.find((item) => item.id === subscription.preferredSlot);
  const cycleKey = formatCycleKey(cycleDate);

  return {
    id: `SUB-ORD-${Date.now()}-${cycleKey}`,
    items: availableItems,
    total,
    status: "processing",
    deliveryOption: DEFAULT_SUBSCRIPTION_DELIVERY,
    shippingAddress: subscription.shippingAddress,
    paymentMethod: subscription.paymentMethod,
    orderDate: new Date().toISOString(),
    estimatedDelivery: estimatedDelivery.toISOString(),
    buyerEmail: subscription.buyerEmail,
    deliverySlot: slot ? `${slot.label} (${slot.timeRange})` : subscription.preferredSlot,
    deliveryNote: deliveryNote || undefined,
    substitutionPref: subscription.substitutionPref,
    isSubscriptionOrder: true,
    subscriptionId: subscription.id,
    subscriptionPlanId: subscription.planId,
    subscriptionPlanName: subscription.planName,
    subscriptionCycleKey: cycleKey,
  };
}

export function ShopProvider({ children }: { children: React.ReactNode }) {
  const [products, setProducts] = useState<Product[]>(() => {
    const stored = localStorage.getItem("products");
    if (stored) {
      const storedProducts: Product[] = JSON.parse(stored);
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
      const storedIds = new Set(parsed.map((v) => v.id));
      const newDefaults = DEFAULT_VOUCHERS.filter((v) => !storedIds.has(v.id));
      return [...parsed, ...newDefaults];
    }
    return DEFAULT_VOUCHERS;
  });

  const [subscriptions, setSubscriptions] = useState<SubscriptionOrder[]>(() => {
    const stored = localStorage.getItem("subscriptions");
    return stored ? JSON.parse(stored) : [];
  });

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

  useEffect(() => {
    if (autoTier !== customerTier) {
      setCustomerTier(autoTier);
    }
  }, [autoTier, customerTier]);

  useEffect(() => {
    localStorage.setItem("storeProfile", JSON.stringify(storeProfile));
  }, [storeProfile]);

  useEffect(() => {
    localStorage.setItem("subscriptions", JSON.stringify(subscriptions));
  }, [subscriptions]);

  useEffect(() => {
    localStorage.setItem("vouchers", JSON.stringify(vouchers));
  }, [vouchers]);

  useEffect(() => {
    const now = new Date();
    let nextOrders = orders;

    const nextSubscriptions = subscriptions.map((subscription) => {
      let workingSubscription = { ...subscription };

      if (workingSubscription.status === "active") {
        let nextDate = new Date(workingSubscription.nextDeliveryDate);
        nextDate.setHours(9, 0, 0, 0);

        while (nextDate.getTime() <= now.getTime()) {
          const cycleKey = formatCycleKey(nextDate);
          const alreadyHasOrder = nextOrders.some(
            (order) =>
              order.subscriptionId === workingSubscription.id &&
              order.subscriptionCycleKey === cycleKey,
          );
          const alreadySkipped = workingSubscription.deliveryHistory.some(
            (delivery) =>
              delivery.status === "skipped" &&
              formatCycleKey(delivery.deliveryDate) === cycleKey,
          );

          if (!alreadyHasOrder && !alreadySkipped) {
            const nextOrder = buildSubscriptionOrderForCycle(
              workingSubscription,
              nextDate,
              products,
            );

            if (nextOrder) {
              nextOrders = [nextOrder, ...nextOrders];
            } else {
              workingSubscription = appendSkippedDelivery(
                workingSubscription,
                nextDate,
              );
            }
          }

          nextDate = getNextSubscriptionDateFrom(
            nextDate,
            workingSubscription.frequency,
            workingSubscription.preferredDay,
          );
        }

        workingSubscription.nextDeliveryDate = nextDate.toISOString();
      }

      const syncedHistory = buildSubscriptionDeliveryHistory(
        workingSubscription,
        nextOrders,
      );
      const lastDelivered = syncedHistory.find(
        (delivery) => delivery.status === "delivered",
      );

      return {
        ...workingSubscription,
        deliveryHistory: syncedHistory,
        lastDeliveryDate: lastDelivered?.deliveryDate,
      };
    });

    if (JSON.stringify(nextOrders) !== JSON.stringify(orders)) {
      setOrders(nextOrders);
    }

    if (JSON.stringify(nextSubscriptions) !== JSON.stringify(subscriptions)) {
      setSubscriptions(nextSubscriptions);
    }
  }, [orders, products, subscriptions]);

  const getPersonalizedPrice = (price: number) => {
    const discounts = {
      standard: 0,
      silver: 0.05,
      gold: 0.1,
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
            : item,
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
        item.product.id === productId ? { ...item, quantity } : item,
      ),
    );
  };

  const clearCart = () => {
    setCart([]);
  };

  const placeOrder = (order: Order) => {
    setOrders((prev) => [order, ...prev]);
    clearCart();
  };

  const CANCEL_WINDOW_MS = 5 * 60 * 1000;

  const cancelOrder = (orderId: string): boolean => {
    const order = orders.find((o) => o.id === orderId);
    if (!order) return false;

    const elapsed = Date.now() - new Date(order.orderDate).getTime();
    if (elapsed > CANCEL_WINDOW_MS) return false;

    if (order.status !== "pending" && order.status !== "processing") return false;

    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId ? { ...o, status: "cancelled" as const } : o,
      ),
    );
    return true;
  };

  const updateOrderStatus = (orderId: string, status: Order["status"]) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status } : o)),
    );
  };

  const addProduct = (product: Product) => {
    setProducts((prev) => [...prev, product]);
  };

  const updateProduct = (product: Product) => {
    setProducts((prev) => prev.map((p) => (p.id === product.id ? product : p)));
  };

  const deleteProduct = (productId: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== productId));
  };

  const getCartTotal = () => {
    return cart.reduce(
      (total, item) => total + item.product.price * item.quantity,
      0,
    );
  };

  const getCartCount = () => {
    return cart.reduce((count, item) => count + item.quantity, 0);
  };

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

  const addReview = (review: Review) => {
    setReviews((prev) => [review, ...prev]);
  };

  const getProductReviews = (productId: string) => {
    return reviews.filter((r) => r.productId === productId);
  };

  const getSellerProducts = (sellerEmail: string) => {
    return products.filter(
      (p) => p.sellerId?.toLowerCase() === sellerEmail.toLowerCase(),
    );
  };

  const getSellerOrders = (sellerEmail: string) => {
    const sellerProductIds = new Set(getSellerProducts(sellerEmail).map((p) => p.id));
    return orders.filter((order) =>
      order.items.some((item) => sellerProductIds.has(item.product.id)),
    );
  };

  const getSellerReviews = (sellerEmail: string) => {
    const sellerProductIds = new Set(getSellerProducts(sellerEmail).map((p) => p.id));
    return reviews.filter((r) => sellerProductIds.has(r.productId));
  };

  const updateStoreProfile = (profile: StoreProfile) => {
    setStoreProfile(profile);
  };

  const validateVoucher = (
    code: string,
    subtotal: number,
    cartCategories: string[],
  ): { valid: boolean; voucher?: Voucher; error?: string } => {
    const voucher = vouchers.find(
      (v) => v.code.toUpperCase() === code.toUpperCase(),
    );
    if (!voucher) return { valid: false, error: "MÃ£ voucher khÃ´ng tá»“n táº¡i." };
    if (!voucher.isActive) {
      return { valid: false, error: "Voucher nÃ y Ä‘Ã£ bá»‹ vÃ´ hiá»‡u hÃ³a." };
    }

    if (new Date(voucher.expiryDate) < new Date()) {
      return { valid: false, error: "Voucher Ä‘Ã£ háº¿t háº¡n." };
    }

    if (
      voucher.usageLimit !== undefined &&
      voucher.usedCount >= voucher.usageLimit
    ) {
      return {
        valid: false,
        error: "Voucher Ä‘Ã£ Ä‘áº¡t giá»›i háº¡n sá»­ dá»¥ng.",
      };
    }

    if (subtotal < voucher.minOrderValue) {
      return {
        valid: false,
        error: `ÄÆ¡n hÃ ng tá»‘i thiá»ƒu ${voucher.minOrderValue.toLocaleString("vi-VN")}â‚« Ä‘á»ƒ Ã¡p dá»¥ng voucher nÃ y.`,
      };
    }

    if (
      !voucher.applicableRanks.includes("all") &&
      !voucher.applicableRanks.includes(autoTier)
    ) {
      return {
        valid: false,
        error: `Voucher nÃ y chá»‰ dÃ nh cho háº¡ng thÃ nh viÃªn: ${voucher.applicableRanks.join(", ")}.`,
      };
    }

    if (!voucher.applicableCategories.includes("all")) {
      const hasMatchingCategory = cartCategories.some((cat) =>
        voucher.applicableCategories.includes(cat),
      );
      if (!hasMatchingCategory) {
        return {
          valid: false,
          error: `Voucher nÃ y chá»‰ Ã¡p dá»¥ng cho danh má»¥c: ${voucher.applicableCategories.join(", ")}.`,
        };
      }
    }

    return { valid: true, voucher };
  };

  const applyVoucher = (voucherId: string) => {
    setVouchers((prev) =>
      prev.map((v) =>
        v.id === voucherId ? { ...v, usedCount: v.usedCount + 1 } : v,
      ),
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

  const createSubscription = (sub: SubscriptionOrder) => {
    setSubscriptions((prev) => [
      {
        ...sub,
        deliveryHistory: buildSubscriptionDeliveryHistory(sub, orders),
      },
      ...prev.filter((item) => item.buyerEmail !== sub.buyerEmail || item.status === "cancelled"),
    ]);
  };

  const updateSubscription = (sub: SubscriptionOrder) => {
    setSubscriptions((prev) => prev.map((s) => (s.id === sub.id ? sub : s)));
  };

  const pauseSubscription = (subId: string) => {
    setSubscriptions((prev) =>
      prev.map((s) =>
        s.id === subId
          ? { ...s, status: "paused" as const, pausedDate: new Date().toISOString() }
          : s,
      ),
    );
  };

  const resumeSubscription = (subId: string) => {
    setSubscriptions((prev) =>
      prev.map((s) => {
        if (s.id !== subId) return s;
        return {
          ...s,
          status: "active" as const,
          pausedDate: undefined,
          nextDeliveryDate: getInitialSubscriptionDate(
            s.frequency,
            s.preferredDay,
          ).toISOString(),
        };
      }),
    );
  };

  const cancelSubscription = (subId: string) => {
    setSubscriptions((prev) =>
      prev.map((s) =>
        s.id === subId
          ? {
              ...s,
              status: "cancelled" as const,
              cancelledDate: new Date().toISOString(),
            }
          : s,
      ),
    );
  };

  const getActiveSubscription = (): SubscriptionOrder | undefined => {
    const email = localStorage.getItem("current_user_email") || "";
    return subscriptions.find(
      (s) => s.buyerEmail === email && s.status !== "cancelled",
    );
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
        subscriptions,
        createSubscription,
        updateSubscription,
        pauseSubscription,
        resumeSubscription,
        cancelSubscription,
        getActiveSubscription,
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
