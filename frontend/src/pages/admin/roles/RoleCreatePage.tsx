// src/pages/admin/roles/RoleCreatePage.tsx
import React, { useState, type ChangeEvent, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import Card from "../../../components/layouts/Card";
import RichTextEditor from "../../../components/common/RichTextEditor";
import { http } from "../../../services/http";
import { uploadImagesInContent } from "../../../utils/uploadImagesInContent";

interface RoleFormData {
  title: string;
  description: string;
}

type ApiOk<T> = { success: true; data: T; meta?: any };
type ApiErr = { success: false; message?: string; errors?: any };

const RoleCreatePage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<
    Partial<Record<keyof RoleFormData | "general", string>>
  >({});

  const [formData, setFormData] = useState<RoleFormData>({
    title: "",
    description: "",
  });

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name as keyof typeof errors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleDescriptionChange = (content: string) => {
    setFormData((prev) => ({ ...prev, description: content }));
    if (errors.description) {
      setErrors((prev) => ({ ...prev, description: undefined }));
    }
  };

  const validateForm = () => {
    const newErrors: Partial<Record<keyof RoleFormData, string>> = {};
    if (!formData.title.trim()) {
      newErrors.title = "Vui lòng nhập tên vai trò.";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      setErrors({});

      const processedDescription = await uploadImagesInContent(
        formData.description
      );

      const payload = {
        title: formData.title,
        description: processedDescription,
      };

      const res = await http<ApiOk<any> | ApiErr>(
        "POST",
        "/api/v1/admin/roles/create",
        payload
      );

      if (res.success) {
        alert("🎉 Thêm vai trò thành công!");
        navigate("/admin/roles");
      } else {
        if (res.errors) {
          setErrors(res.errors);
        } else {
          setErrors({ general: res.message || "Không thể thêm vai trò!" });
        }
      }
    } catch (err: any) {
      console.error("Create role error:", err);
      const message =
        err?.data?.message || err?.message || "Lỗi kết nối server!";
      setErrors({ general: message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
          Thêm vai trò
        </h1>
        <button
          onClick={() => navigate("/admin/roles")}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-md"
        >
          <ArrowLeft className="w-4 h-4" /> Quay lại
        </button>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Tên vai trò */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Tên vai trò
          </label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder="Nhập tên vai trò..."
            className={`w-full border ${errors.title ? 'border-red-500' : 'border-gray-300'} dark:border-gray-600 rounded-md p-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
          />
          {errors.title && <p className="text-sm text-red-600 mt-1">{errors.title}</p>}
        </div>

        {/* Mô tả (TinyMCE) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Mô tả vai trò
          </label>
          <RichTextEditor
            value={formData.description}
            onChange={handleDescriptionChange}
          />
          {errors.description && <p className="text-sm text-red-600 mt-1">{errors.description}</p>}
        </div>

        {/* General Error */}
        {errors.general && (
          <p className="text-sm text-red-600 text-center">{errors.general}</p>
        )}

        {/* Nút hành động */}
        <div className="flex justify-end gap-3 mt-6">
          <button
            type="button"
            onClick={() => navigate("/admin/roles")}
            className="px-4 py-2 rounded-md border border-gray-400 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            Hủy
          </button>
          <button
            type="submit"
            className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700"
            disabled={loading}
          >
            {loading ? "Đang lưu..." : "Lưu vai trò"}
          </button>
        </div>
      </form>
    </Card>
  );
};

export default RoleCreatePage;
