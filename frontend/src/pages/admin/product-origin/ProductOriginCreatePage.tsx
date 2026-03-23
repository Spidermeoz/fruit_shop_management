import React, { useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2 } from "lucide-react";
import Card from "../../../components/admin/layouts/Card";
import RichTextEditor from "../../../components/admin/common/RichTextEditor";
import { uploadImagesInContent } from "../../../utils/uploadImagesInContent";
import { http } from "../../../services/http";
import { useAdminToast } from "../../../context/AdminToastContext";

interface OriginFormData {
  title: string;
  description: string;
  slug: string;
  status: string;
  thumbnail: string;
  position: number | string;
  created_by_id: number;
}

type ApiOk = { success: true; data?: any; url?: string; meta?: any };

const ProductOriginCreatePage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<
    Partial<Record<keyof OriginFormData, string>>
  >({});

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewImage, setPreviewImage] = useState<string>("");
  const [imageMethod, setImageMethod] = useState<"upload" | "url">("upload");
  const [imageUrl, setImageUrl] = useState<string>("");

  const { showSuccessToast, showErrorToast } = useAdminToast();

  const [formData, setFormData] = useState<OriginFormData>({
    title: "",
    description: "",
    slug: "",
    status: "active",
    thumbnail: "",
    position: "",
    created_by_id: 1,
  });

  const handleInputChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement>,
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

  const handleImageSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];

    if (!allowedTypes.includes(file.type)) {
      setErrors((prev) => ({
        ...prev,
        thumbnail: "File tải lên phải là ảnh (jpg, png, webp, gif).",
      }));
      e.target.value = "";
      setSelectedFile(null);
      setPreviewImage("");
      return;
    }

    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      setErrors((prev) => ({
        ...prev,
        thumbnail: "Ảnh không được lớn hơn 5MB.",
      }));
      e.target.value = "";
      setSelectedFile(null);
      setPreviewImage("");
      return;
    }

    setSelectedFile(file);
    setPreviewImage(URL.createObjectURL(file));

    if (errors.thumbnail) {
      setErrors((prev) => ({ ...prev, thumbnail: undefined }));
    }
  };

  const validateForm = () => {
    const newErrors: Partial<Record<keyof OriginFormData, string>> = {};

    if (!formData.title.trim()) {
      newErrors.title = "Vui lòng nhập tên xuất xứ.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      setLoading(true);
      setErrors({});

      let uploadedThumbnailUrl = formData.thumbnail;

      if (imageMethod === "upload" && selectedFile) {
        const formDataImg = new FormData();
        formDataImg.append("file", selectedFile);

        const uploadRes = await http<ApiOk>(
          "POST",
          "/api/v1/admin/upload",
          formDataImg,
        );

        uploadedThumbnailUrl = uploadRes?.data?.url || uploadRes?.url || "";

        if (!uploadedThumbnailUrl) {
          setErrors({
            thumbnail: "Không thể upload ảnh minh họa. Vui lòng thử lại.",
          });
          setLoading(false);
          return;
        }
      } else if (imageMethod === "url" && imageUrl) {
        uploadedThumbnailUrl = imageUrl;
      }

      const updatedDescription = await uploadImagesInContent(
        formData.description,
      );

      const payload = {
        title: formData.title,
        description: updatedDescription,
        slug: formData.slug || null,
        status: formData.status,
        thumbnail: uploadedThumbnailUrl || null,
        position: formData.position === "" ? null : Number(formData.position),
      };

      const createRes = await http<ApiOk & { errors?: any }>(
        "POST",
        "/api/v1/admin/origins/create",
        payload,
      );

      if (createRes.success) {
        showSuccessToast({ message: "Thêm mới xuất xứ thành công!" });
        navigate("/admin/product-origin");
      } else {
        if ((createRes as any).errors) {
          setErrors((createRes as any).errors);
        } else {
          showErrorToast(
            (createRes as any).message || "Thêm mới xuất xứ thất bại.",
          );
        }
      }
    } catch (err: any) {
      console.error("Create origin error:", err);
      if (err?.message) {
        showErrorToast(err.message);
      } else {
        showErrorToast(
          "Không thể upload ảnh. Vui lòng kiểm tra định dạng file.",
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
          Thêm xuất xứ sản phẩm
        </h1>
        <button
          onClick={() => navigate("/admin/product-origin")}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-md transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Quay lại
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5 p-2">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Tên xuất xứ
          </label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleInputChange}
            className={`w-full border ${
              errors.title
                ? "border-red-500 dark:border-red-500"
                : "border-gray-300 dark:border-gray-600"
            } rounded-md p-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors`}
          />
          {errors.title && (
            <p className="text-sm text-red-600 dark:text-red-400 mt-1">
              {errors.title}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Slug
          </label>
          <input
            type="text"
            name="slug"
            value={formData.slug}
            onChange={handleInputChange}
            className="w-full border border-gray-300 dark:border-gray-600 rounded-md p-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Mô tả xuất xứ
          </label>
          <RichTextEditor
            value={formData.description}
            onChange={(content) =>
              setFormData((prev) => ({ ...prev, description: content }))
            }
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Ảnh minh họa
          </label>

          <div className="flex flex-wrap gap-3 mb-4">
            <button
              type="button"
              className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
                imageMethod === "upload"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
              }`}
              onClick={() => setImageMethod("upload")}
            >
              Upload ảnh
            </button>
            <button
              type="button"
              className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
                imageMethod === "url"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
              }`}
              onClick={() => setImageMethod("url")}
            >
              Nhập URL
            </button>
          </div>

          {imageMethod === "upload" ? (
            <div>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
                className="block w-full text-sm text-gray-500 dark:text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-gray-700 dark:file:text-gray-200 dark:hover:file:bg-gray-600 cursor-pointer"
              />
            </div>
          ) : (
            <div>
              <input
                type="url"
                placeholder="Nhập URL ảnh"
                value={imageUrl}
                onChange={(e) => {
                  setImageUrl(e.target.value);
                  setPreviewImage(e.target.value);
                  setFormData((prev) => ({
                    ...prev,
                    thumbnail: e.target.value,
                  }));
                }}
                className={`w-full border ${
                  errors.thumbnail
                    ? "border-red-500 dark:border-red-500"
                    : "border-gray-300 dark:border-gray-600"
                } rounded-md p-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors`}
              />
            </div>
          )}

          {errors.thumbnail && (
            <p className="text-sm text-red-600 dark:text-red-400 mt-1">
              {errors.thumbnail}
            </p>
          )}

          {previewImage && (
            <div className="mt-4 relative w-fit">
              <img
                src={previewImage}
                alt="preview"
                className="h-24 w-24 object-cover rounded-md border border-gray-300 dark:border-gray-600 shadow-sm"
              />
              <button
                type="button"
                onClick={() => {
                  setSelectedFile(null);
                  setImageUrl("");
                  setPreviewImage("");
                  setFormData((prev) => ({ ...prev, thumbnail: "" }));
                }}
                className="absolute -top-2 -right-2 bg-red-500 dark:bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600 dark:hover:bg-red-500 transition-colors shadow-md"
              >
                ×
              </button>
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Vị trí hiển thị
          </label>
          <input
            type="number"
            name="position"
            value={formData.position}
            onChange={handleInputChange}
            placeholder="Nếu bỏ trống sẽ tự xếp cuối"
            className="w-full border border-gray-300 dark:border-gray-600 rounded-md p-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
          />
        </div>

        <div className="pt-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Trạng thái
          </label>
          <div className="flex gap-6">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="radio"
                name="status"
                value="active"
                checked={formData.status === "active"}
                onChange={handleInputChange}
                className="text-blue-600 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
              />
              <span className="text-gray-800 dark:text-gray-200">
                Hoạt động
              </span>
            </label>
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="radio"
                name="status"
                value="inactive"
                checked={formData.status === "inactive"}
                onChange={handleInputChange}
                className="text-red-600 focus:ring-red-500 dark:bg-gray-700 dark:border-gray-600"
              />
              <span className="text-gray-800 dark:text-gray-200">
                Dừng hoạt động
              </span>
            </label>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
          <button
            type="button"
            onClick={() => navigate("/admin/product-origin")}
            className="px-4 py-2 rounded-md border border-gray-400 dark:border-gray-600 text-gray-700 dark:text-gray-200 bg-transparent hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors font-medium"
          >
            Hủy
          </button>
          <button
            type="submit"
            className="flex items-center gap-2 px-5 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:opacity-50 font-medium"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" /> Đang lưu...
              </>
            ) : (
              "Lưu xuất xứ"
            )}
          </button>
        </div>
      </form>
    </Card>
  );
};

export default ProductOriginCreatePage;
