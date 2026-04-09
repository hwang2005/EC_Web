import { Product } from "../types";

export const PRODUCTS: Product[] = [
  {
    id: "1",
    name: "Gạo ST25 Cao Cấp",
    description: "Premium ST25 rice from Sóc Trăng, world's best rice award winner. Fragrant, soft texture with natural sweetness.",
    price: 45000,
    image: "https://image2url.com/r2/default/images/1775754104769-198594d5-39f6-4ab1-a249-7789a5451289.png",
    category: "Gạo (Rice)",
    stock: 450,
    rating: 4.9
  },
  {
    id: "2",
    name: "Cà Phê Robusta Đắk Lắk",
    description: "Premium Robusta coffee beans from Đắk Lắk highlands. Bold, rich flavor with chocolate notes.",
    price: 180000,
    image: "https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=500&q=80",
    category: "Cà Phê (Coffee)",
    stock: 320,
    rating: 4.8
  },
  {
    id: "3",
    name: "Thanh Long Ruột Đỏ",
    description: "Fresh red dragon fruit from Bình Thuận. Sweet, juicy, and packed with vitamins and antioxidants.",
    price: 35000,
    image: "https://images.unsplash.com/photo-1527325678964-54921661f888?w=500&q=80",
    category: "Trái Cây (Fruits)",
    stock: 280,
    rating: 4.7
  },
  {
    id: "4",
    name: "Hồ Tiêu Phú Quốc",
    description: "Authentic Phú Quốc black pepper, geographical indication protected. Aromatic and flavorful.",
    price: 250000,
    image: "https://image2url.com/r2/default/images/1775754429359-10240ed4-a7f5-44ee-b8d2-a658526edcda.png",
    category: "Gia Vị (Spices)",
    stock: 180,
    rating: 4.9
  },
  {
    id: "5",
    name: "Chôm Chôm Bến Tre",
    description: "Fresh rambutan from Bến Tre orchards. Sweet, succulent flesh with a unique tropical flavor.",
    price: 40000,
    image: "https://images.unsplash.com/photo-1566281796817-93bc94d7dbd2?w=500&q=80",
    category: "Trái Cây (Fruits)",
    stock: 220,
    rating: 4.6
  },
  {
    id: "6",
    name: "Rau Hữu Cơ Đà Lạt",
    description: "Organic vegetable mix from Đà Lạt highlands. Fresh lettuce, mustard greens, and herbs.",
    price: 55000,
    image: "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=500&q=80",
    category: "Rau Củ (Vegetables)",
    stock: 350,
    rating: 4.8
  },
  {
    id: "7",
    name: "Xoài Cát Hòa Lộc",
    description: "Premium Hòa Lộc mango from Tiền Giang. Sweet, fiber-free flesh with buttery texture.",
    price: 70000,
    image: "https://images.unsplash.com/photo-1553279768-865429fa0078?w=500&q=80",
    category: "Trái Cây (Fruits)",
    stock: 190,
    rating: 4.9
  },
  {
    id: "8",
    name: "Nước Mắm Phú Quốc",
    description: "Traditional Phú Quốc fish sauce, naturally fermented. Rich umami flavor, perfect for Vietnamese cuisine.",
    price: 85000,
    image: "https://images.unsplash.com/photo-1634141510639-d691d86f47be?w=500&q=80",
    category: "Gia Vị (Spices)",
    stock: 260,
    rating: 4.8
  },
  {
    id: "9",
    name: "Lúa Mạch Hữu Cơ",
    description: "Organic barley from Lâm Đồng highlands. Perfect for healthy drinks and cooking.",
    price: 95000,
    image: "https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=500&q=80",
    category: "Ngũ Cốc (Grains)",
    stock: 140,
    rating: 4.7
  },
  {
    id: "10",
    name: "Măng Khô Tây Nguyên",
    description: "Dried bamboo shoots from Central Highlands. Traditional ingredient for authentic Vietnamese dishes.",
    price: 120000,
    image: "https://images.unsplash.com/photo-1587049352846-4a222e784422?w=500&q=80",
    category: "Đặc Sản (Specialty)",
    stock: 110,
    rating: 4.6
  },
  {
    id: "11",
    name: "Trà Xanh Thái Nguyên",
    description: "Premium green tea from Thái Nguyên province. Fragrant, naturally sweet with health benefits.",
    price: 200000,
    image: "https://images.unsplash.com/photo-1564890369478-c89ca6d9cde9?w=500&q=80",
    category: "Trà (Tea)",
    stock: 175,
    rating: 4.9
  },
  {
    id: "12",
    name: "Bưởi Da Xanh",
    description: "Green skin pomelo from Bến Tre. Sweet, juicy segments with minimal bitterness.",
    price: 55000,
    image: "https://images.unsplash.com/photo-1577234286642-fc512a5f8f11?w=500&q=80",
    category: "Trái Cây (Fruits)",
    stock: 200,
    rating: 4.7
  }
];

export const DELIVERY_OPTIONS = [
  {
    id: "standard",
    name: "Giao Hàng Tiêu Chuẩn",
    price: 25000,
    estimatedDays: "3-5 ngày làm việc"
  },
  {
    id: "express",
    name: "Giao Hàng Nhanh",
    price: 50000,
    estimatedDays: "1-2 ngày làm việc"
  },
  {
    id: "sameday",
    name: "Giao Trong Ngày",
    price: 80000,
    estimatedDays: "Trong ngày (khu vực nội thành)"
  },
  {
    id: "free",
    name: "Miễn Phí Vận Chuyển",
    price: 0,
    estimatedDays: "5-7 ngày làm việc (đơn từ 500.000₫)"
  }
];

export const PAYMENT_METHODS = [
  { id: "card", name: "Thẻ Tín Dụng/Ghi Nợ", icon: "credit-card" },
  { id: "momo", name: "MoMo", icon: "wallet" },
  { id: "banking", name: "Chuyển Khoản Ngân Hàng", icon: "building-2" },
  { id: "cod", name: "Thanh Toán Khi Nhận Hàng", icon: "hand-coins" }
];

export type CustomerTier = "standard" | "silver" | "gold" | "platinum";

export const CUSTOMER_TIERS = {
  standard: { name: "Khách Hàng Thường", discount: 0, color: "gray" },
  silver: { name: "Khách Hàng Bạc", discount: 5, color: "slate" },
  gold: { name: "Khách Hàng Vàng", discount: 10, color: "yellow" },
  platinum: { name: "Khách Hàng Kim Cương", discount: 15, color: "purple" },
};
