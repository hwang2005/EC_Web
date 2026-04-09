export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: string;
  stock: number;
  rating: number;
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
}
