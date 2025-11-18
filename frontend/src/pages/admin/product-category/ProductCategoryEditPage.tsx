// src/pages/admin/product-category/ProductCategoryEditPage.tsx
import React, {
  useEffect,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Loader2, Save, ArrowLeft } from "lucide-react";
import Card from "../../../components/layouts/Card";
import RichTextEditor from "../../../components/common/RichTextEditor";
import { http } from "../../../services/http";
import { uploadImagesInContent } from "../../../utils/uploadImagesInContent";

interface Category {
  id: number;
  title: string;
  parent_id: number | null; // frontend snake_case
  parentId?: number | null; // map với backend
  description: string | null;
  thumbnail: string | null;
  status: string;
  position: number | null;
  parent_name?: string | null;
}

type ApiDetail<T> = { success: true; data: T; meta?: any };
type ApiList<T> = { success: true; data: T[]; meta?: any };
type ApiOk = { success: true; data: any; meta?: any };

const ProductCategoryEditPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [fetchError, setFetchError] = useState("");
  const [formErrors, setFormErrors] = useState<
    Partial<Record<keyof Category, string>>
  >({});
  const [categories, setCategories] = useState<Category[]>([]);
  const [category, setCategory] = useState<Category | null>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>("");
  const [imageMethod, setImageMethod] = useState<"upload" | "url" | "keep">(
    "keep"
  );
  const [imageUrl, setImageUrl] = useState<string>("");

  // ✅ Lấy dữ liệu danh mục cần chỉnh sửa
  const fetchCategory = async () => {
    try {
      setLoading(true);
      const res = await http<ApiDetail<Category>>(
        "GET",
        `/api/v1/admin/product-category/edit/${id}`
      );
      if (res.success && res.data) {
        setCategory(res.data);
        if (res.data.thumbnail) setPreviewImage(res.data.thumbnail);
      }
    } catch (err: any) {
      console.error("fetchCategory error:", err);
      setFetchError(err?.message || "Không tìm thấy danh mục.");
    } finally {
      setLoading(false);
    }
  };

  // ✅ Lấy danh sách tất cả danh mục để chọn parent
  const fetchCategories = async () => {
    try {
      const res = await http<ApiList<Category>>(
        "GET",
        `/api/v1/admin/product-category`
      );
      if (res.success && Array.isArray(res.data)) {
        setCategories(res.data);
      }
    } catch (err) {
      console.error("fetchCategories error:", err);
    }
  };

  useEffect(() => {
    fetchCategory();
    fetchCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // ✅ Khi chọn file ảnh → chỉ hiển thị preview, chưa upload
  const handleImageSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    setPreviewImage(URL.createObjectURL(file));
    if (formErrors.thumbnail) {
      setFormErrors((prev) => ({ ...prev, thumbnail: undefined }));
    }
  };

  // ✅ Xử lý input
  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setCategory((prev) => (prev ? { ...prev, [name]: value } : prev));
    if (formErrors[name as keyof typeof formErrors]) {
      setFormErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  // ✅ Xử lý RichTextEditor
  const handleDescriptionChange = (content: string) => {
    setCategory((prev) => (prev ? { ...prev, description: content } : prev));
  };

  const validateForm = () => {
    if (!category) return false;
    const newErrors: Partial<Record<keyof Category, string>> = {};
    if (!category.title.trim()) {
      newErrors.title = "Vui lòng nhập tên danh mục.";
    }
    setFormErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ✅ Gửi API cập nhật
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!category) return;

    if (!validateForm()) {
      return;
    }

    try {
      setSaving(true);
      setFormErrors({});
      let thumbnailUrl = category.thumbnail;

      // 🔹 Nếu chọn phương thức upload và có file ảnh → upload thumbnail
      if (imageMethod === "upload" && selectedFile) {
        const formDataImg = new FormData();
        formDataImg.append("file", selectedFile);
        const up = await http<ApiOk>(
          "POST",
          "/api/v1/admin/upload",
          formDataImg
        );
        const url = up?.data?.url || (up as any)?.url;
        if (!url) {
          setFormErrors({
            thumbnail: "Không thể tải ảnh lên. Vui lòng thử lại.",
          });
          setSaving(false);
          return;
        }
        thumbnailUrl = url;
      }
      // 🔹 Nếu chọn phương thức URL, sử dụng trực tiếp URL đã nhập
      else if (imageMethod === "url" && imageUrl) {
        thumbnailUrl = imageUrl;
      }
      // 🔹 Nếu chọn phương thức keep, giữ nguyên URL hiện tại
      else if (imageMethod === "keep") {
        thumbnailUrl = category.thumbnail;
      }

      // 🔹 Upload ảnh trong description (nếu có)
      const updatedDescription = await uploadImagesInContent(
        category.description || ""
      );

      // 🔹 Payload
      const payload = {
        title: category.title,
        parentId: category.parent_id, // BE nhận camelCase
        description: updatedDescription,
        thumbnail: thumbnailUrl,
        status: category.status,
      };

      const res = await http<ApiOk & { errors?: any }>(
        "PATCH",
        `/api/v1/admin/product-category/edit/${id}`,
        payload
      );

      if (res.success) {
        alert("✅ Cập nhật danh mục thành công!");
        await Promise.all([fetchCategory(), fetchCategories()]);
      } else {
        if (res.errors) {
          setFormErrors(res.errors);
        } else {
          alert((res as any).message || "Cập nhật danh mục thất bại.");
        }
      }
    } catch (err: any) {
      console.error("saveCategory error:", err);
      alert(err?.data?.message || err?.message || "Lỗi kết nối server.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-gray-500" />
        <span className="ml-2 text-gray-600 dark:text-gray-400">
          Đang tải danh mục...
        </span>
      </div>
    );
  }

  if (fetchError) {
    return <p className="text-center text-red-500 py-10">{fetchError}</p>;
  }

  if (!category) return null;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
          Chỉnh sửa danh mục
        </h1>
        <button
          onClick={() => navigate("/admin/product-category")}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-md"
        >
          <ArrowLeft className="w-4 h-4" /> Quay lại
        </button>
      </div>

      <Card>
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Tên danh mục */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Tên danh mục
            </label>
            <input
              type="text"
              name="title"
              value={category.title}
              onChange={handleChange}
              className={`w-full border ${
                formErrors.title ? "border-red-500" : "border-gray-300"
              } dark:border-gray-600 rounded-md p-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
            />
            {formErrors.title && (
              <p className="text-sm text-red-600 mt-1">{formErrors.title}</p>
            )}
          </div>

          {/* Danh mục cha */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Danh mục cha
            </label>
            <select
              name="parent_id"
              value={
                category.parent_id === null ? "" : String(category.parent_id)
              }
              onChange={(e) => {
                const value = e.target.value;
                setCategory((prev) =>
                  prev
                    ? {
                        ...prev,
                        parent_id: value === "" ? null : Number(value),
                      }
                    : prev
                );
                if (formErrors.parent_id) {
                  setFormErrors((prev) => ({ ...prev, parent_id: undefined }));
                }
              }}
              className={`w-full border ${
                formErrors.parent_id ? "border-red-500" : "border-gray-300"
              } dark:border-gray-600 rounded-md p-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
            >
              <option value="">-- Danh mục gốc --</option>
              {categories
                .filter((c) => c.id !== Number(id))
                .map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title}
                  </option>
                ))}
            </select>
            {formErrors.parent_id && (
              <p className="text-sm text-red-600 mt-1">
                {formErrors.parent_id}
              </p>
            )}
          </div>

          {/* Mô tả */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Mô tả
            </label>
            <RichTextEditor
              value={category.description || ""}
              onChange={handleDescriptionChange}
            />
          </div>

          {/* Ảnh minh họa */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Ảnh minh họa
            </label>

            {/* Tab chọn phương thức */}
            <div className="flex mb-3">
              <button
                type="button"
                className={`px-4 py-2 mr-2 rounded ${
                  imageMethod === "upload"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-200 text-gray-700"
                }`}
                onClick={() => setImageMethod("upload")}
              >
                Upload ảnh mới
              </button>
              <button
                type="button"
                className={`px-4 py-2 rounded ${
                  imageMethod === "url"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-200 text-gray-700"
                }`}
                onClick={() => setImageMethod("url")}
              >
                Nhập URL
              </button>
              <button
                type="button"
                className={`px-4 py-2 rounded ${
                  imageMethod === "keep"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-200 text-gray-700"
                }`}
                onClick={() => {
                  setImageMethod("keep");
                  setPreviewImage(category.thumbnail);
                }}
              >
                Giữ ảnh hiện tại
              </button>
            </div>

            {/* Nội dung theo phương thức */}
            {imageMethod === "upload" ? (
              <div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageSelect}
                />
              </div>
            ) : imageMethod === "url" ? (
              <div>
                <input
                  type="url"
                  placeholder="Nhập URL ảnh"
                  value={imageUrl}
                  onChange={(e) => {
                    setImageUrl(e.target.value);
                    setPreviewImage(e.target.value);
                    setCategory((prev) =>
                      prev ? { ...prev, thumbnail: e.target.value } : prev
                    );
                  }}
                  className={`w-full border ${
                    formErrors.thumbnail ? "border-red-500" : "border-gray-300"
                  } dark:border-gray-600 rounded-md p-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
                />
              </div>
            ) : (
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Sẽ giữ nguyên ảnh hiện tại
              </div>
            )}

            {formErrors.thumbnail && (
              <p className="text-sm text-red-600 mt-1">
                {formErrors.thumbnail}
              </p>
            )}

            {previewImage && (
              <div className="mt-3 relative w-fit">
                <img
                  src={previewImage}
                  alt="preview"
                  className="h-24 w-24 object-cover rounded-md border border-gray-300 dark:border-gray-600"
                />
                {imageMethod !== "keep" && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedFile(null);
                      setImageUrl("");
                      setImageMethod("keep");
                      setPreviewImage(category.thumbnail);
                    }}
                    className="absolute -top-2 -right-2 bg-gray-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-gray-600"
                  >
                    ×
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Trạng thái */}
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
                  checked={category.status === "active"}
                  onChange={handleChange}
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
                  checked={category.status === "inactive"}
                  onChange={handleChange}
                  className="text-red-600 focus:ring-red-500"
                />
                <span className="text-gray-800 dark:text-gray-200">
                  Dừng hoạt động
                </span>
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

export default ProductCategoryEditPage;
