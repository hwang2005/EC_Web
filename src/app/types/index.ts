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

export interface PaymentMethod {
  id: string;
  name: string;
  icon: string;
}

export interface ShippingAddress {
  fullName: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
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
