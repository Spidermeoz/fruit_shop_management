// src/pages/admin/product-category/ProductCategoryCreatePage.tsx
import React, { useEffect, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import Card from "../../../components/layouts/Card";
import RichTextEditor from "../../../components/common/RichTextEditor";
import { uploadImagesInContent } from "../../../utils/uploadImagesInContent";
import { http } from "../../../services/http";

interface CategoryFormData {
  parent_id: number | null;
  title: string;
  description: string;
  slug: string;
  status: string;
  thumbnail: string;
  created_by_id: number; // sẽ KHÔNG gửi lên BE, BE lấy từ token
}

interface ParentCategory {
  id: number;
  title: string;
}

type ApiList<T> = { success: true; data: T[]; meta?: any };
type ApiOk = { success: true; data?: any; url?: string; meta?: any };

const ProductCategoryCreatePage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<
    Partial<Record<keyof CategoryFormData, string>>
  >({});

  // ✅ Preview thumbnail & file
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewImage, setPreviewImage] = useState<string>("");

  const [formData, setFormData] = useState<CategoryFormData>({
    parent_id: null,
    title: "",
    description: "",
    slug: "",
    status: "active",
    thumbnail: "",
    created_by_id: 1,
  });

  const [parentCategories, setParentCategories] = useState<ParentCategory[]>(
    []
  );

  // ✅ Gọi API lấy danh sách danh mục cha (dùng http)
  const fetchParentCategories = async () => {
    try {
      const res = await http<ApiList<ParentCategory>>(
        "GET",
        "/api/v1/admin/product-category?limit=100"
      );
      if (res.success && Array.isArray(res.data)) {
        setParentCategories(res.data);
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
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (errors[name as keyof typeof errors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  // ✅ Khi chọn ảnh → chỉ hiển thị preview local
  const handleImageSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    setPreviewImage(URL.createObjectURL(file));
    if (errors.thumbnail) {
      setErrors((prev) => ({ ...prev, thumbnail: undefined }));
    }
  };

  const validateForm = () => {
    const newErrors: Partial<Record<keyof CategoryFormData, string>> = {};
    if (!formData.title.trim()) {
      newErrors.title = "Vui lòng nhập tên danh mục.";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ✅ Submit form
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      setErrors({}); // Clear old errors

      let uploadedThumbnailUrl = formData.thumbnail;

      // 🔹 Nếu chọn ảnh → upload thumbnail
      if (selectedFile) {
        const formDataImg = new FormData();
        formDataImg.append("file", selectedFile);
        const uploadRes = await http<ApiOk>(
          "POST",
          "/api/v1/admin/upload",
          formDataImg
        );
        uploadedThumbnailUrl =
          uploadRes?.data?.url || uploadRes?.url || "";
        if (!uploadedThumbnailUrl) {
          setErrors({
            thumbnail: "Không thể upload ảnh minh họa. Vui lòng thử lại.",
          });
          setLoading(false);
          return;
        }
      }

      // 🔹 Upload ảnh trong nội dung TinyMCE
      const updatedDescription = await uploadImagesInContent(
        formData.description
      );

      // 🔹 Gửi dữ liệu danh mục mới lên server
      const payload = {
        parentId: formData.parent_id,
        title: formData.title,
        description: updatedDescription,
        slug: formData.slug || null,
        status: formData.status,
        thumbnail: uploadedThumbnailUrl,
      };

      const createRes = await http<ApiOk & { errors?: any }>(
        "POST",
        "/api/v1/admin/product-category/create",
        payload
      );

      if (createRes.success) {
        alert("🎉 Thêm danh mục mới thành công!");
        navigate("/admin/product-category");
      } else {
        if (createRes.errors) {
          setErrors(createRes.errors);
        } else {
          alert((createRes as any).message || "Thêm mới danh mục thất bại.");
        }
      }
    } catch (err: any) {
      console.error("Create category error:", err);
      const errorMessage =
        err?.data?.message || err?.message || "Lỗi kết nối server!";
      alert(errorMessage);
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
            onChange={(e) => {
              setFormData((prev) => ({
                ...prev,
                parent_id: e.target.value ? Number(e.target.value) : null,
              }));
              if (errors.parent_id) {
                setErrors((prev) => ({ ...prev, parent_id: undefined }));
              }
            }}
            className={`w-full border ${errors.parent_id ? 'border-red-500' : 'border-gray-300'} dark:border-gray-600 rounded-md p-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
          >
            <option value="">-- Không có (danh mục gốc) --</option>
            {parentCategories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.title}
              </option>
            ))}
          </select>
          {errors.parent_id && <p className="text-sm text-red-600 mt-1">{errors.parent_id}</p>}
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
            className={`w-full border ${errors.title ? 'border-red-500' : 'border-gray-300'} dark:border-gray-600 rounded-md p-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
          />
          {errors.title && <p className="text-sm text-red-600 mt-1">{errors.title}</p>}
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
          {errors.thumbnail && <p className="text-sm text-red-600 mt-1">{errors.thumbnail}</p>}
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
