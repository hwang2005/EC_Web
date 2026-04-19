export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: string;
  stock: number;
  rating: number;
  sellerId: string;
  // D2C Agricultural fields
  origin?: string;           // Vùng trồng / nông trại
  certification?: string[];  // Chứng nhận: VietGAP, GlobalGAP, Hữu cơ...
  harvestDate?: string;      // Ngày thu hoạch
  batchCode?: string;        // Mã lô hàng
  shelfLife?: string;        // Thời hạn sử dụng ước tính
  storageInstructions?: string; // Hướng dẫn bảo quản
  unit?: string;             // Đơn vị tính: kg, bó, túi, thùng
  isPerishable?: boolean;    // Hàng dễ hư hỏng
  season?: string;           // Mùa vụ
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface DeliveryOption {
  id: string;
  name: string;
  price: number;
  estimatedDays: string;
}

export interface DeliverySlot {
  id: string;
  label: string;
  timeRange: string;
  icon: string;
}

export interface PaymentMethod {
  id: string;
  name: string;
  icon: string;
}

export interface ShippingAddress {
  fullName: string;
  address: string;
  ward: string;
  province: string;
  phone: string;
}

export interface Order {
  id: string;
  items: CartItem[];
  total: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  deliveryOption: DeliveryOption;
  shippingAddress: ShippingAddress;
  paymentMethod: string;
  orderDate: string;
  estimatedDelivery: string;
  buyerEmail: string;
  isSubscriptionOrder?: boolean;
  subscriptionId?: string;
  subscriptionPlanId?: string;
  subscriptionPlanName?: string;
  subscriptionCycleKey?: string;
  deliverySlot?: string;     // Khung giờ giao hàng
  deliveryNote?: string;     // Ghi chú giao hàng
  substitutionPref?: string; // Tùy chọn thay thế sản phẩm
}

export interface Review {
  id: string;
  productId: string;
  author: string;
  rating: number;
  comment: string;
  date: string;
}

export interface UserProfile {
  name: string;
  email: string;
  phone: string;
}

export interface RegisteredUser {
  name: string;
  email: string;
  phone: string;
  password: string;
  role: "consumer" | "seller";
}

export interface StoreProfile {
  shopName: string;
  shopDescription: string;
  shopAddress: string;
  shopPhone: string;
  shopEmail: string;
}

export interface FarmStory {
  id: string;
  name: string;
  location: string;
  image: string;
  description: string;
  certification: string[];
  products: string[];
  story: string;
}

export interface SeasonalProduct {
  productId: string;
  season: string;
  months: number[];
  peakMonths: number[];
  description: string;
}

export interface Voucher {
  id: string;
  code: string;                         // e.g. "GOLD10"
  description: string;                  // Human-readable description
  discountType: "percent" | "fixed";    // Percentage off or fixed amount off
  discountValue: number;                // e.g. 10 (%) or 50000 (₫)
  minOrderValue: number;                // Minimum subtotal required
  maxDiscountAmount?: number;           // Cap for percent vouchers
  applicableRanks: string[];            // e.g. ["silver", "gold", "platinum"] or ["all"]
  applicableCategories: string[];       // e.g. ["Trái Cây (Fruits)"] or ["all"]
  expiryDate: string;                   // ISO date string
  isActive: boolean;
  usageLimit?: number;                  // Max number of times the voucher can be used
  usedCount: number;                    // How many times it has been used
}

export interface SubscriptionOrder {
  id: string;
  planId: string;                       // e.g. "weekly-veg"
  planName: string;
  planIcon: string;
  frequency: 'weekly' | 'biweekly' | 'monthly';
  price: number;                        // Price per delivery
  status: 'active' | 'paused' | 'cancelled';
  // Delivery scheduling
  preferredDay: string;                 // e.g. "monday", "wednesday"
  preferredSlot: string;                // e.g. "morning" (8:00-12:00)
  // Address
  shippingAddress: ShippingAddress;
  // Payment
  paymentMethod: string;
  // Product customization
  selectedProducts: string[];           // Product IDs included in the subscription
  excludedProducts: string[];           // Product IDs excluded by the user
  // Dates
  startDate: string;                    // ISO date
  nextDeliveryDate: string;             // ISO date
  lastDeliveryDate?: string;            // ISO date of last delivery
  pausedDate?: string;                  // ISO date when paused
  cancelledDate?: string;               // ISO date when cancelled
  // Delivery history
  deliveryHistory: SubscriptionDelivery[];
  // Notes
  deliveryNote?: string;
  substitutionPref: string;
  buyerEmail: string;
}

export interface SubscriptionDelivery {
  id: string;
  deliveryDate: string;                 // ISO date
  status: 'delivered' | 'scheduled' | 'skipped';
  total: number;
  items: { productId: string; productName: string; quantity: number; price: number }[];
}
