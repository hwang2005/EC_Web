import { useState, useEffect } from "react";
import { useShop } from "../context/ShopContext";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router";
import { Product } from "../types";
import { Plus, Edit, Trash2, Save, X, BarChart3, Package } from "lucide-react";
import { toast } from "sonner";
import { Analytics } from "../components/Analytics";

type Tab = "products" | "analytics";

export function Admin() {
  const { products, addProduct, updateProduct, deleteProduct } = useShop();
  const { role } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>("analytics");
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<Product>>({});

  useEffect(() => {
    if (role !== "seller") {
      navigate("/");
    }
  }, [role, navigate]);

  if (role !== "seller") return null;

  const resetForm = () => {
    setFormData({});
    setIsAdding(false);
    setEditingId(null);
  };


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Input validation
    if (!formData.name || formData.name.length < 2) {
      toast.error("Product name is required (min 2 characters)");
      return;
    }
    if (!formData.description || formData.description.length < 10) {
      toast.error("Description is required (min 10 characters)");
      return;
    }
    if (!formData.price || formData.price <= 0) {
      toast.error("Valid price is required");
      return;
    }
    if (!formData.stock || formData.stock < 0) {
      toast.error("Valid stock quantity is required");
      return;
    }
    if (!formData.category) {
      toast.error("Category is required");
      return;
    }
    if (!formData.image) {
      toast.error("Image URL is required");
      return;
    }

    if (isAdding) {
      const newProduct: Product = {
        id: `prod-${Date.now()}`,
        name: formData.name,
        description: formData.description,
        price: formData.price,
        image: formData.image,
        category: formData.category,
        stock: formData.stock,
        rating: formData.rating || 4.5,
      };
      addProduct(newProduct);
      toast.success("Product added successfully");
    } else if (editingId) {
      const updatedProduct = products.find((p) => p.id === editingId);
      if (updatedProduct) {
        updateProduct({ ...updatedProduct, ...formData } as Product);
        toast.success("Product updated successfully");
      }
    }

    resetForm();
  };

  const handleEdit = (product: Product) => {
    setEditingId(product.id);
    setFormData(product);
    setIsAdding(false);
  };

  const handleDelete = (product: Product) => {
    if (confirm(`Are you sure you want to delete "${product.name}"?`)) {
      deleteProduct(product.id);
      toast.success("Product deleted successfully");
    }
  };

  const handleAddNew = () => {
    setIsAdding(true);
    setEditingId(null);
    setFormData({
      name: "",
      description: "",
      price: 0,
      image: "",
      category: "",
      stock: 0,
      rating: 4.5,
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1>Kênh Người Bán</h1>
          <p className="text-muted-foreground mt-1">
            Quản lý sản phẩm và xem báo cáo phân tích
          </p>
        </div>
        {activeTab === "products" && (
          <button
            onClick={handleAddNew}
            className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Thêm Sản Phẩm
          </button>
        )}
      </div>

      <div className="mb-6 flex gap-2 border-b border-border">
        <button
          onClick={() => setActiveTab("analytics")}
          className={`flex items-center gap-2 px-4 py-2 border-b-2 transition-colors ${
            activeTab === "analytics"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          Phân Tích Dữ Liệu
        </button>
        <button
          onClick={() => setActiveTab("products")}
          className={`flex items-center gap-2 px-4 py-2 border-b-2 transition-colors ${
            activeTab === "products"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Package className="w-4 h-4" />
          Quản Lý Sản Phẩm
        </button>
      </div>

      {activeTab === "analytics" && <Analytics />}

      {activeTab === "products" && (
        <>
          {/* Product Form */}
          {(isAdding || editingId) && (
            <div className="bg-white rounded-lg shadow-sm p-6 mb-8 border border-border">
              <div className="flex justify-between items-center mb-4">
                <h2>
                  {isAdding ? "Thêm Sản Phẩm Mới" : "Chỉnh Sửa Sản Phẩm"}
                </h2>
                <button
                  onClick={resetForm}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block mb-1">
                      Tên Sản Phẩm *
                    </label>
                    <input
                      type="text"
                      value={formData.name || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background"
                      required
                    />
                  </div>

                  <div>
                    <label className="block mb-1">
                      Danh Mục *
                    </label>
                    <input
                      type="text"
                      value={formData.category || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, category: e.target.value })
                      }
                      className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block mb-1">
                    Mô Tả *
                  </label>
                  <textarea
                    value={formData.description || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background"
                    rows={3}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block mb-1">
                      Giá (₫) *
                    </label>
                    <input
                      type="number"
                      step="1000"
                      value={formData.price || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, price: parseFloat(e.target.value) })
                      }
                      className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background"
                      required
                    />
                  </div>

                  <div>
                    <label className="block mb-1">
                      Số Lượng *
                    </label>
                    <input
                      type="number"
                      value={formData.stock || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, stock: parseInt(e.target.value) })
                      }
                      className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background"
                      required
                    />
                  </div>

                  <div>
                    <label className="block mb-1">
                      Đánh Giá (0-5)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="5"
                      value={formData.rating || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, rating: parseFloat(e.target.value) })
                      }
                      className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background"
                    />
                  </div>
                </div>

                <div>
                  <label className="block mb-1">
                    URL Hình Ảnh *
                  </label>
                  <input
                    type="url"
                    value={formData.image || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, image: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background"
                    placeholder="https://example.com/image.jpg"
                    required
                  />
                </div>

                <div className="flex gap-4">
                  <button
                    type="submit"
                    className="flex items-center gap-2 bg-primary text-white px-6 py-2 rounded-lg hover:bg-primary/90 transition-colors"
                  >
                    <Save className="w-5 h-5" />
                    {isAdding ? "Thêm Sản Phẩm" : "Lưu Thay Đổi"}
                  </button>
                  <button
                    type="button"
                    onClick={resetForm}
                    className="border border-border px-6 py-2 rounded-lg hover:bg-muted transition-colors"
                  >
                    Hủy
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Products Table */}
          <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-border">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted border-b border-border">
                  <tr>
                    <th className="text-left px-6 py-3 text-foreground">
                      Sản Phẩm
                    </th>
                    <th className="text-left px-6 py-3 text-foreground">
                      Danh Mục
                    </th>
                    <th className="text-left px-6 py-3 text-foreground">
                      Giá
                    </th>
                    <th className="text-left px-6 py-3 text-foreground">
                      Tồn Kho
                    </th>
                    <th className="text-left px-6 py-3 text-foreground">
                      Đánh Giá
                    </th>
                    <th className="text-right px-6 py-3 text-foreground">
                      Hành Động
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {products.map((product) => (
                    <tr key={product.id} className="hover:bg-muted/50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={product.image}
                            alt={product.name}
                            className="w-12 h-12 object-cover rounded"
                          />
                          <div>
                            <p className="font-semibold text-foreground">{product.name}</p>
                            <p className="text-sm text-muted-foreground line-clamp-1">
                              {product.description}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-block bg-accent text-foreground text-sm px-2 py-1 rounded">
                          {product.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-semibold text-foreground">
                        {product.price.toLocaleString("vi-VN")}₫
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-block px-2 py-1 rounded text-sm ${
                            product.stock > 200
                              ? "bg-green-100 text-green-800"
                              : product.stock > 100
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {product.stock}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="flex items-center gap-1 text-foreground">
                          ⭐ {product.rating}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleEdit(product)}
                            className="p-2 text-primary hover:bg-accent rounded transition-colors"
                          >
                            <Edit className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleDelete(product)}
                            className="p-2 text-destructive hover:bg-destructive/10 rounded transition-colors"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-6 bg-accent border border-border rounded-lg p-4">
            <p className="text-sm text-foreground">
              <strong>Lưu ý:</strong> Thay đổi sản phẩm được lưu trong local storage của trình
              duyệt. Tất cả dữ liệu được xác thực ở phía client. Trong môi trường sản xuất thực tế,
              các thao tác này cần được xác thực và xử lý trên server.
            </p>
          </div>
        </>
      )}
    </div>
  );
}
