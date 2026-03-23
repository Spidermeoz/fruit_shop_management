import React, { useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2 } from "lucide-react";
import Card from "../../../components/admin/layouts/Card";
import { http } from "../../../services/http";
import { useAdminToast } from "../../../context/AdminToastContext";

interface ProductTagFormData {
  name: string;
  tagGroup: string;
  description: string;
}

type ApiOk = { success: true; data?: any; url?: string; meta?: any };

const TAG_GROUP_OPTIONS = [
  { value: "general", label: "General" },
  { value: "taste", label: "Taste" },
  { value: "benefit", label: "Benefit" },
  { value: "season", label: "Season" },
  { value: "usage", label: "Usage" },
];

const ProductTagCreatePage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<
    Partial<Record<keyof ProductTagFormData, string>>
  >({});

  const { showSuccessToast, showErrorToast } = useAdminToast();

  const [formData, setFormData] = useState<ProductTagFormData>({
    name: "",
    tagGroup: "general",
    description: "",
  });

  const handleInputChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (errors[name as keyof ProductTagFormData]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const validateForm = () => {
    const newErrors: Partial<Record<keyof ProductTagFormData, string>> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Vui lòng nhập tên product tag.";
    }

    if (!formData.tagGroup.trim()) {
      newErrors.tagGroup = "Vui lòng chọn group.";
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

      const payload = {
        name: formData.name.trim(),
        tagGroup: formData.tagGroup,
        description: formData.description.trim() || null,
      };

      const createRes = await http<ApiOk & { errors?: any }>(
        "POST",
        "/api/v1/admin/product-tags/create",
        payload,
      );

      if (createRes.success) {
        showSuccessToast({ message: "Thêm mới product tag thành công!" });
        navigate("/admin/product-tags");
      } else {
        if ((createRes as any).errors) {
          setErrors((createRes as any).errors);
        } else {
          showErrorToast(
            (createRes as any).message || "Thêm mới product tag thất bại.",
          );
        }
      }
    } catch (err: any) {
      console.error("Create product tag error:", err);
      showErrorToast(err?.message || "Lỗi kết nối server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
          Thêm product tag
        </h1>

        <button
          onClick={() => navigate("/admin/product-tags")}
          className="flex items-center gap-2 rounded-md bg-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
        >
          <ArrowLeft className="h-4 w-4" />
          Quay lại
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5 p-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Tên tag
          </label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            className={`w-full rounded-md border p-2 text-gray-900 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white ${
              errors.name
                ? "border-red-500 dark:border-red-500"
                : "border-gray-300 dark:border-gray-600"
            }`}
            placeholder="Nhập tên product tag"
          />
          {errors.name && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">
              {errors.name}
            </p>
          )}
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Group
          </label>
          <select
            name="tagGroup"
            value={formData.tagGroup}
            onChange={handleInputChange}
            className={`w-full rounded-md border p-2 text-gray-900 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white ${
              errors.tagGroup
                ? "border-red-500 dark:border-red-500"
                : "border-gray-300 dark:border-gray-600"
            }`}
          >
            {TAG_GROUP_OPTIONS.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
          {errors.tagGroup && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">
              {errors.tagGroup}
            </p>
          )}
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Mô tả
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            rows={4}
            className="w-full rounded-md border border-gray-300 p-2 text-gray-900 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            placeholder="Nhập mô tả cho product tag"
          />
        </div>

        <div className="mt-6 flex justify-end gap-3 border-t border-gray-200 pt-4 dark:border-gray-700">
          <button
            type="button"
            onClick={() => navigate("/admin/product-tags")}
            className="rounded-md border border-gray-400 bg-transparent px-4 py-2 font-medium text-gray-700 transition-colors hover:bg-gray-100 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
          >
            Hủy
          </button>

          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 rounded-md bg-blue-600 px-5 py-2 font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Đang lưu...
              </>
            ) : (
              "Lưu product tag"
            )}
          </button>
        </div>
      </form>
    </Card>
  );
};

export default ProductTagCreatePage;
