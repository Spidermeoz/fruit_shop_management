import React, { useEffect, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import Card from "../../../components/layouts/Card";
import RichTextEditor from "../../../components/common/RichTextEditor";
import { uploadImagesInContent } from "../../../utils/uploadImagesInContent";

interface CategoryFormData {
  parent_id: number | null;
  title: string;
  description: string;
  slug: string;
  position: number | string | undefined;
  status: string;
  thumbnail: string;
  created_by_id: number;
}

interface ParentCategory {
  id: number;
  title: string;
}

const ProductCategoryCreatePage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  // ✅ Preview thumbnail & file
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewImage, setPreviewImage] = useState<string>("");

  const [formData, setFormData] = useState<CategoryFormData>({
    parent_id: null,
    title: "",
    description: "",
    slug: "",
    position: undefined,
    status: "active",
    thumbnail: "",
    created_by_id: 1,
  });

  const [parentCategories, setParentCategories] = useState<ParentCategory[]>(
    []
  );

  // ✅ Gọi API lấy danh sách danh mục cha
  const fetchParentCategories = async () => {
    try {
      const res = await fetch("/api/v1/admin/product-category?limit=100");
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setParentCategories(json.data);
      }
    } catch (err) {
      console.error("Fetch parent categories error:", err);
    }
  };

  useEffect(() => {
    fetchParentCategories();
  }, []);

  // ✅ Xử lý input
  const handleInputChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]:
        type === "number"
          ? value === "" // nếu bỏ trống → undefined để backend auto
            ? undefined
            : Number(value)
          : value,
    }));
  };

  // ✅ Khi chọn ảnh → chỉ hiển thị preview local
  const handleImageSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    setPreviewImage(URL.createObjectURL(file));
  };

  // ✅ Submit form
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);

      let uploadedThumbnailUrl = formData.thumbnail;

      // 🔹 Nếu chọn ảnh → upload thumbnail lên Cloudinary
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

      // 🔹 Upload ảnh trong nội dung TinyMCE
      const updatedDescription = await uploadImagesInContent(
        formData.description
      );

      // 🔹 Gửi dữ liệu danh mục mới lên server
      const res = await fetch("/api/v1/admin/product-category/create", {
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
        alert("🎉 Thêm danh mục mới thành công!");
        navigate("/admin/product-category");
      } else {
        alert(json.message || "Không thể thêm danh mục!");
      }
    } catch (err) {
      console.error("Create category error:", err);
      alert("Lỗi kết nối server!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
          Thêm danh mục sản phẩm
        </h1>
        <button
          onClick={() => navigate("/admin/product-category")}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-md"
        >
          <ArrowLeft className="w-4 h-4" /> Quay lại
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* --- Danh mục cha --- */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Danh mục cha
          </label>
          <select
            name="parent_id"
            value={formData.parent_id ?? ""}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                parent_id: e.target.value ? Number(e.target.value) : null,
              }))
            }
            className="w-full border border-gray-300 dark:border-gray-600 rounded-md p-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="">-- Không có (danh mục gốc) --</option>
            {parentCategories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.title}
              </option>
            ))}
          </select>
        </div>

        {/* --- Tên danh mục --- */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Tên danh mục
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

        {/* --- Mô tả --- */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Mô tả danh mục
          </label>
          <RichTextEditor
            value={formData.description}
            onChange={(content) =>
              setFormData((prev) => ({ ...prev, description: content }))
            }
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

        {/* --- Trạng thái --- */}
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
            onClick={() => navigate("/admin/product-category")}
            className="px-4 py-2 rounded-md border border-gray-400 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            Hủy
          </button>
          <button
            type="submit"
            className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700"
            disabled={loading}
          >
            {loading ? "Đang lưu..." : "Lưu danh mục"}
          </button>
        </div>
      </form>
    </Card>
  );
};

export default ProductCategoryCreatePage;
