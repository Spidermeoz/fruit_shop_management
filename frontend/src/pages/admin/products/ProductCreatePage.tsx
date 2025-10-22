// src/pages/ProductCreatePage.tsx
import React, { useEffect, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
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

interface ProductFormData {
  product_category_id: number | string;
  title: string;
  description: string;
  price: number | string;
  discount_percentage: number;
  stock: number;
  thumbnail: string;
  status: string;
  featured: number | string;
  position: number | string;
  slug: string;
  average_rating: number;
  review_count: number;
  created_by_id: number;
}

const ProductCreatePage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const [categories, setCategories] = useState<ProductCategory[]>([]);

  // ✅ file ảnh gốc (để upload sau)
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // ✅ preview ảnh local
  const [previewImage, setPreviewImage] = useState<string>("");

  const [formData, setFormData] = useState<ProductFormData>({
    product_category_id: 1,
    title: "",
    description: "",
    price: "",
    discount_percentage: 0,
    stock: 0,
    thumbnail: "",
    status: "active",
    featured: 0,
    position: 0,
    slug: "",
    average_rating: 0,
    review_count: 0,
    created_by_id: 1,
  });

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

  const handleInputChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // ✅ Khi chọn ảnh → chỉ hiển thị preview local, chưa upload
  const handleImageSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    setPreviewImage(URL.createObjectURL(file)); // hiển thị ảnh tạm
  };

  // ✅ Khi nhấn Lưu → mới upload ảnh thật và ảnh trong nội dung
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    try {
      setLoading(true);

      let uploadedThumbnailUrl = formData.thumbnail;

      // 🔹 Nếu người dùng có chọn file thumbnail thì upload lên server
      if (selectedFile) {
        const formDataImg = new FormData();
        formDataImg.append("file", selectedFile);
        const uploadRes = await fetch("/api/v1/admin/upload", {
          method: "POST",
          body: formDataImg,
        });
        const uploadJson = await uploadRes.json();
        if (uploadJson.success && uploadJson.url) {
          uploadedThumbnailUrl = uploadJson.url;
        } else {
          alert("Không thể upload ảnh minh họa!");
          return;
        }
      }

      // 🔹 Upload ảnh trong nội dung TinyMCE trước khi gửi
      const updatedDescription = await uploadImagesInContent(
        formData.description
      );

      // 🔹 Gửi dữ liệu sản phẩm lên server
      const res = await fetch("/api/v1/admin/products/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          thumbnail: uploadedThumbnailUrl,
          description: updatedDescription,
        }),
      });

      const json = await res.json();
      if (json.success) {
        alert("🎉 Thêm sản phẩm thành công!");
        navigate("/admin/products");
      } else {
        alert(json.message || "Không thể thêm sản phẩm!");
      }
    } catch (err) {
      console.error("Create product error:", err);
      alert("Lỗi kết nối server!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
          Thêm sản phẩm
        </h1>
        <button
          onClick={() => navigate("/admin/products")}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-md"
        >
          <ArrowLeft className="w-4 h-4" /> Quay lại
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* --- Tên sản phẩm --- */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Tên sản phẩm
          </label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleInputChange}
            className="w-full border border-gray-300 dark:border-gray-600 rounded-md p-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            required
          />
        </div>

        {/* --- Danh mục --- */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Danh mục
          </label>
          <select
            name="product_category_id"
            value={formData.product_category_id}
            onChange={handleInputChange}
            className="w-full border border-gray-300 dark:border-gray-600 rounded-md p-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            required
          >
            <option value="" disabled>-- Chọn danh mục --</option>
            {renderCategoryOptions(buildCategoryTree(categories))}
          </select>
        </div>

        {/* --- Mô tả sản phẩm --- */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Mô tả sản phẩm
          </label>
          <RichTextEditor
            value={formData.description}
            onChange={(content) =>
              setFormData((prev) => ({ ...prev, description: content }))
            }
          />
        </div>

        {/* --- Giá & Giảm giá --- */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Giá (VNĐ)
            </label>
            <input
              type="number"
              name="price"
              value={formData.price}
              onChange={handleInputChange}
              className="w-full border border-gray-300 dark:border-gray-600 rounded-md p-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Giảm giá (%)
            </label>
            <input
              type="number"
              name="discount_percentage"
              value={formData.discount_percentage}
              onChange={handleInputChange}
              min="0"
              max="100"
              step="0.1"
              className="w-full border border-gray-300 dark:border-gray-600 rounded-md p-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
        </div>

        {/* --- Số lượng tồn --- */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Số lượng tồn
          </label>
          <input
            type="number"
            name="stock"
            value={formData.stock}
            onChange={handleInputChange}
            className="w-full border border-gray-300 dark:border-gray-600 rounded-md p-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            required
          />
        </div>

        {/* --- Ảnh minh họa --- */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Ảnh minh họa
          </label>
          <input type="file" accept="image/*" onChange={handleImageSelect} />
          {previewImage && (
            <div className="mt-3">
              <img
                src={previewImage}
                alt="preview"
                className="h-24 w-24 object-cover rounded-md border border-gray-300 dark:border-gray-600"
              />
            </div>
          )}
        </div>

        {/* --- Vị trí hiển thị --- */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Vị trí hiển thị
          </label>
          <input
            type="number"
            name="position"
            value={formData.position || ""}
            onChange={handleInputChange}
            placeholder="Nếu bỏ trống, hệ thống sẽ tự thêm ở cuối"
            className="w-full border border-gray-300 dark:border-gray-600 rounded-md p-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>

        {/* --- Trạng thái sản phẩm --- */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Trạng thái
          </label>
          <div className="flex gap-6">
            <label className="flex items-center space-x-2">
              <input
                type="radio"
                name="status"
                value="active"
                checked={formData.status === "active"}
                onChange={handleInputChange}
                className="text-blue-600 focus:ring-blue-500"
              />
              <span className="text-gray-800 dark:text-gray-200">
                Hoạt động
              </span>
            </label>
            <label className="flex items-center space-x-2">
              <input
                type="radio"
                name="status"
                value="inactive"
                checked={formData.status === "inactive"}
                onChange={handleInputChange}
                className="text-red-600 focus:ring-red-500"
              />
              <span className="text-gray-800 dark:text-gray-200">
                Dừng hoạt động
              </span>
            </label>
          </div>
        </div>

        {/* --- Nút hành động --- */}
        <div className="flex justify-end gap-3 mt-6">
          <button
            type="button"
            onClick={() => navigate("/admin/products")}
            className="px-4 py-2 rounded-md border border-gray-400 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            Hủy
          </button>
          <button
            type="submit"
            className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700"
            disabled={loading}
          >
            {loading ? "Đang lưu..." : "Lưu sản phẩm"}
          </button>
        </div>
      </form>
    </Card>
  );
};

export default ProductCreatePage;
