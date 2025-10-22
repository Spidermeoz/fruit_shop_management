// src/pages/admin/ProductEditPage.tsx
import React, { useEffect, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Loader2, Save, ArrowLeft } from "lucide-react";
import Card from "../../../components/layouts/Card";
import RichTextEditor from "../../../components/common/RichTextEditor";
import { uploadImagesInContent } from "../../../utils/uploadImagesInContent";
import {
  buildCategoryTree,
  renderCategoryOptions,
} from "../../../utils/categoryTree";

interface ProductCategory {
  id: number;
  title: string;
  parent_id?: number | null;
  children?: ProductCategory[];
  position: number;
  status: string;
}

interface Product {
  id: number;
  title: string;
  description: string;
  product_category_id: number | string;
  price: number;
  discount_percentage: number;
  stock: number;
  thumbnail: string;
  status: "active" | "inactive";
  featured: number;
  position: number;
}

interface Category {
  id: number;
  title: string;
}

const ProductEditPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [product, setProduct] = useState<Product | null>(null);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // ✅ file ảnh mới (chưa upload)
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewImage, setPreviewImage] = useState<string>("");

  // 🔹 Lấy dữ liệu sản phẩm
  const fetchProduct = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/v1/admin/products/edit/${id}`);
      const json = await res.json();
      if (json.success && json.data) {
        setProduct(json.data as Product);
        setPreviewImage(json.data.thumbnail);
      } else {
        setError(json.message || "Không tìm thấy sản phẩm.");
      }
    } catch (err) {
      console.error(err);
      setError("Không thể kết nối server.");
    } finally {
      setLoading(false);
    }
  };

  // ✅ Lấy danh sách danh mục từ backend
    useEffect(() => {
      const fetchCategories = async () => {
        try {
          const res = await fetch("/api/v1/admin/product-category");
          const json = await res.json();
          if (json.success && Array.isArray(json.data)) {
            setCategories(json.data);
          }
        } catch (err) {
          console.error("fetchCategories error:", err);
        }
      };
      fetchCategories();
    }, []);

  useEffect(() => {
    fetchProduct();
  }, [id]);

  // 🔹 Xử lý input
  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, type, value } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setProduct((prev) =>
      prev
        ? {
            ...prev,
            [name]:
              type === "number"
                ? Number(value)
                : type === "checkbox"
                ? checked
                  ? 1
                  : 0
                : value,
          }
        : prev
    );
  };

  // 🔹 Mô tả
  const handleDescriptionChange = (content: string) => {
    setProduct((prev) => (prev ? { ...prev, description: content } : prev));
  };

  // 🔹 Chọn ảnh mới → chỉ preview
  const handleImageSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    setPreviewImage(URL.createObjectURL(file));
  };

  // ✅ Lưu sản phẩm (upload thumbnail và ảnh trong mô tả)
  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    if (!product) return;
    if (!product.title.trim()) {
      alert("Vui lòng nhập tên sản phẩm.");
      return;
    }

    try {
      setSaving(true);
      let thumbnailUrl = product.thumbnail;

      // 🔸 Upload ảnh thumbnail nếu có chọn mới
      if (selectedFile) {
        const formDataImg = new FormData();
        formDataImg.append("file", selectedFile);
        const resUpload = await fetch("/api/v1/admin/upload", {
          method: "POST",
          body: formDataImg,
        });
        const dataUpload = await resUpload.json();

        if (dataUpload.success) {
          thumbnailUrl = dataUpload.url;
        } else {
          alert("❌ Lỗi tải ảnh thumbnail lên Cloudinary");
          return;
        }
      }

      // 🔸 Upload ảnh trong nội dung TinyMCE (lazy upload)
      const updatedDescription = await uploadImagesInContent(
        product.description
      );

      // 🔸 Gửi PATCH cập nhật
      const res = await fetch(`/api/v1/admin/products/edit/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...product,
          thumbnail: thumbnailUrl,
          description: updatedDescription,
        }),
      });

      const json = await res.json();
      if (json.success) {
        alert("✅ Cập nhật sản phẩm thành công!");
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

  if (error) return <p className="text-center text-red-500 py-10">{error}</p>;
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
              <option value="" disabled>-- Chọn danh mục --</option>
              {renderCategoryOptions(buildCategoryTree(categories))}
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
          <RichTextEditor
            value={product.description}
            onChange={handleDescriptionChange}
          />

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

          {/* Tồn kho & vị trí */}
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

          {/* Ảnh sản phẩm */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Ảnh sản phẩm
            </label>
            <input type="file" accept="image/*" onChange={handleImageSelect} />
            {previewImage && (
              <div className="mt-3 relative w-fit">
                <img
                  src={previewImage}
                  alt="preview"
                  className="h-24 w-24 object-cover rounded-md border border-gray-300 dark:border-gray-600"
                />
                <button
                  type="button"
                  onClick={() => {
                    setSelectedFile(null);
                    setPreviewImage("");
                  }}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600"
                >
                  ×
                </button>
              </div>
            )}
          </div>

          {/* Nổi bật & Trạng thái */}
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                name="featured"
                checked={product.featured === 1}
                onChange={handleChange}
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Sản phẩm nổi bật
              </span>
            </label>

            <div className="flex items-center gap-4">
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
