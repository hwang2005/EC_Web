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
