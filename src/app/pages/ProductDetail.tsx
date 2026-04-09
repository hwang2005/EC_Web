import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router";
import { useShop } from "../context/ShopContext";
import { ArrowLeft, ShoppingCart, Star, Truck, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

export function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { products, addToCart } = useShop();
  const [quantity, setQuantity] = useState(1);

  const product = products.find((p) => p.id === id);

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <h2 className="text-2xl font-bold mb-4">Product not found</h2>
        <Link to="/products" className="text-blue-600 hover:underline">
          Back to Products
        </Link>
      </div>
    );
  }

  const handleAddToCart = () => {
    if (quantity > product.stock) {
      toast.error("Not enough stock available");
      return;
    }
    addToCart(product, quantity);
    toast.success(`Added ${quantity} ${product.name} to cart`);
  };

  const handleBuyNow = () => {
    if (quantity > product.stock) {
      toast.error("Not enough stock available");
      return;
    }
    addToCart(product, quantity);
    navigate("/checkout");
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link
        to="/products"
        className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Products
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Product Image */}
        <div className="bg-white rounded-lg overflow-hidden shadow-sm">
          <div className="aspect-square">
            <img
              src={product.image}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        {/* Product Info */}
        <div>
          <div className="mb-4">
            <span className="inline-block bg-blue-100 text-blue-800 text-sm px-3 py-1 rounded-full">
              {product.category}
            </span>
          </div>

          <h1 className="text-3xl font-bold mb-4">{product.name}</h1>

          <div className="flex items-center gap-4 mb-6">
            <div className="flex items-center gap-1">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`w-5 h-5 ${
                    i < Math.floor(product.rating)
                      ? "fill-yellow-400 text-yellow-400"
                      : "text-gray-300"
                  }`}
                />
              ))}
            </div>
            <span className="font-semibold">{product.rating}</span>
            <span className="text-gray-500">•</span>
            <span className="text-gray-600">{product.stock} in stock</span>
          </div>

          <div className="text-4xl font-bold text-blue-600 mb-6">
            ${product.price.toFixed(2)}
          </div>

          <p className="text-gray-700 mb-8 leading-relaxed">
            {product.description}
          </p>

          {/* Quantity Selector */}
          <div className="mb-6">
            <label className="block text-sm font-semibold mb-2">Quantity</label>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="w-10 h-10 border border-gray-300 rounded-lg hover:bg-gray-50 font-semibold"
              >
                -
              </button>
              <input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-20 text-center border border-gray-300 rounded-lg py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="1"
                max={product.stock}
              />
              <button
                onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                className="w-10 h-10 border border-gray-300 rounded-lg hover:bg-gray-50 font-semibold"
              >
                +
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 mb-8">
            <button
              onClick={handleAddToCart}
              disabled={product.stock === 0}
              className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              <ShoppingCart className="w-5 h-5" />
              Add to Cart
            </button>
            <button
              onClick={handleBuyNow}
              disabled={product.stock === 0}
              className="flex-1 bg-gray-900 text-white px-6 py-3 rounded-lg hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              Buy Now
            </button>
          </div>

          {/* Features */}
          <div className="border-t pt-6 space-y-4">
            <div className="flex items-center gap-3 text-gray-700">
              <Truck className="w-5 h-5 text-green-600" />
              <span>Free shipping on orders over $50</span>
            </div>
            <div className="flex items-center gap-3 text-gray-700">
              <ShieldCheck className="w-5 h-5 text-blue-600" />
              <span>Secure payment and data protection</span>
            </div>
            <div className="flex items-center gap-3 text-gray-700">
              <Star className="w-5 h-5 text-yellow-600" />
              <span>30-day return policy</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
