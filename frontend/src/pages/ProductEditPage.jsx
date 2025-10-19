import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Loader2, Save, ArrowLeft } from "lucide-react";
import Card from "../components/layouts/Card";

const ProductEditPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [product, setProduct] = useState(null);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // ✅ Lấy dữ liệu sản phẩm theo ID
  const fetchProduct = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/v1/admin/products/edit/${id}`);
      const json = await res.json();
      if (json.success && json.data) setProduct(json.data);
      else setError(json.message || "Không tìm thấy sản phẩm.");
    } catch (err) {
      console.error(err);
      setError("Không thể kết nối server.");
    } finally {
      setLoading(false);
    }
  };

  // ✅ Lấy danh mục sản phẩm
  const fetchCategories = async () => {
    try {
      const res = await fetch("/api/v1/admin/categories");
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) setCategories(json.data);
      else setCategories([]);
    } catch (err) {
      console.error(err);
    }
  };

  // ✅ Fetch khi load trang
  useEffect(() => {
    fetchProduct();
    fetchCategories();
  }, [id]);

  // ✅ Cập nhật state khi nhập liệu
  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setProduct((prev) => ({
      ...prev,
      [name]:
        type === "number"
          ? Number(value)
          : type === "checkbox"
          ? e.target.checked ? 1 : 0
          : value,
    }));
  };

  // ✅ Gửi API cập nhật sản phẩm
  const handleSave = async (e) => {
    e.preventDefault();
    if (!product.title) {
      alert("Vui lòng nhập tên sản phẩm.");
      return;
    }

    try {
      setSaving(true);
      const res = await fetch(`/api/v1/admin/products/edit/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(product),
      });
      const json = await res.json();
      if (json.success) {
        alert("Cập nhật sản phẩm thành công!");
        navigate(`/admin/products/edit/${id}`);
      } else {
        alert(json.message || "Cập nhật thất bại.");
      }
    } catch (err) {
      console.error(err);
      alert("Không thể kết nối server.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-gray-500" />
        <span className="ml-2 text-gray-600 dark:text-gray-400">
          Đang tải dữ liệu sản phẩm...
        </span>
      </div>
    );
  }

  if (error) {
    return <p className="text-center text-red-500 py-10">{error}</p>;
  }

  if (!product) return null;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
          Chỉnh sửa sản phẩm
        </h1>
        <button
          onClick={() => navigate("/admin/products")}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-md"
        >
          <ArrowLeft className="w-4 h-4" /> Quay lại
        </button>
      </div>

      <Card>
        <form onSubmit={handleSave} className="space-y-4">
          {/* Danh mục */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Danh mục sản phẩm
            </label>
            <select
              name="product_category_id"
              value={product.product_category_id || ""}
              onChange={handleChange}
              className="w-full border border-gray-300 dark:border-gray-600 rounded-md p-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="">-- Chọn danh mục --</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </select>
          </div>

          {/* Tên sản phẩm */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Tên sản phẩm
            </label>
            <input
              type="text"
              name="title"
              value={product.title || ""}
              onChange={handleChange}
              required
              className="w-full border border-gray-300 dark:border-gray-600 rounded-md p-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          {/* Mô tả */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Mô tả
            </label>
            <textarea
              name="description"
              rows="4"
              value={product.description || ""}
              onChange={handleChange}
              className="w-full border border-gray-300 dark:border-gray-600 rounded-md p-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          {/* Giá & Giảm giá */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Giá (₫)
              </label>
              <input
                type="number"
                name="price"
                value={product.price || ""}
                onChange={handleChange}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-md p-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Giảm giá (%)
              </label>
              <input
                type="number"
                name="discount_percentage"
                value={product.discount_percentage || ""}
                onChange={handleChange}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-md p-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          </div>

          {/* Số lượng & Vị trí */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Tồn kho
              </label>
              <input
                type="number"
                name="stock"
                value={product.stock || 0}
                onChange={handleChange}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-md p-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Vị trí hiển thị
              </label>
              <input
                type="number"
                name="position"
                value={product.position || ""}
                onChange={handleChange}
                placeholder="Nếu bỏ trống sẽ tự xếp cuối"
                className="w-full border border-gray-300 dark:border-gray-600 rounded-md p-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          </div>

          {/* Ảnh & Featured */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Ảnh sản phẩm (URL)
              </label>
              <input
                type="text"
                name="thumbnail"
                value={product.thumbnail || ""}
                onChange={handleChange}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-md p-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            <div className="flex items-center gap-2 mt-6">
              <input
                type="checkbox"
                name="featured"
                checked={product.featured === 1}
                onChange={handleChange}
              />
              <label className="text-sm text-gray-700 dark:text-gray-300">
                Sản phẩm nổi bật
              </label>
            </div>
          </div>

          {/* Trạng thái */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Trạng thái
            </label>
            <div className="flex items-center gap-4 mt-1">
              <label className="flex items-center gap-1">
                <input
                  type="radio"
                  name="status"
                  value="active"
                  checked={product.status === "active"}
                  onChange={handleChange}
                />
                <span>Hoạt động</span>
              </label>
              <label className="flex items-center gap-1">
                <input
                  type="radio"
                  name="status"
                  value="inactive"
                  checked={product.status === "inactive"}
                  onChange={handleChange}
                />
                <span>Dừng hoạt động</span>
              </label>
            </div>
          </div>

          {/* Nút lưu */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-colors disabled:opacity-50"
            >
              {saving ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" /> Đang lưu...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" /> Lưu thay đổi
                </>
              )}
            </button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default ProductEditPage;
