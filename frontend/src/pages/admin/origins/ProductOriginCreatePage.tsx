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
  name: string;
  description: string;
  country_code: string;
}

type ApiOk = { success: true; data?: any; meta?: any };

const ProductOriginCreatePage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<
    Partial<Record<keyof OriginFormData, string>>
  >({});
  const { showSuccessToast, showErrorToast } = useAdminToast();

  const [formData, setFormData] = useState<OriginFormData>({
    name: "",
    description: "",
    country_code: "",
  });

  const handleInputChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (errors[name as keyof OriginFormData]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const validateForm = () => {
    const newErrors: Partial<Record<keyof OriginFormData, string>> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Vui lòng nhập tên xuất xứ.";
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

      const updatedDescription = await uploadImagesInContent(
        formData.description,
      );

      const payload = {
        name: formData.name.trim(),
        description: updatedDescription || null,
        country_code: formData.country_code.trim() || null,
      };

      const createRes = await http<ApiOk>(
        "POST",
        "/api/v1/admin/origins/create",
        payload,
      );

      if (createRes.success) {
        showSuccessToast({ message: "Thêm mới xuất xứ thành công!" });
        navigate("/admin/product-origin");
      }
    } catch (err: any) {
      console.error("Create origin error:", err);
      showErrorToast(err?.message || "Thêm mới xuất xứ thất bại.");
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
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            className={`w-full border ${
              errors.name
                ? "border-red-500 dark:border-red-500"
                : "border-gray-300 dark:border-gray-600"
            } rounded-md p-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors`}
          />
          {errors.name && (
            <p className="text-sm text-red-600 dark:text-red-400 mt-1">
              {errors.name}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Mã quốc gia
          </label>
          <input
            type="text"
            name="country_code"
            value={formData.country_code}
            onChange={handleInputChange}
            placeholder="Ví dụ: VN, US, JP..."
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
