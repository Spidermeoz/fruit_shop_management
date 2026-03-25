import React, {
  useEffect,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Loader2, Save, ArrowLeft } from "lucide-react";
import Card from "../../../components/admin/layouts/Card";
import RichTextEditor from "../../../components/admin/common/RichTextEditor";
import { http } from "../../../services/http";
import { uploadImagesInContent } from "../../../utils/uploadImagesInContent";
import { useAdminToast } from "../../../context/AdminToastContext";

interface Origin {
  id: number;
  name: string;
  description: string | null;
  country_code?: string | null;
}

type ApiDetail<T> = { success: true; data: T; meta?: any };
type ApiOk = { success: true; data?: any; meta?: any };

const ProductOriginEditPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [fetchError, setFetchError] = useState("");
  const [formErrors, setFormErrors] = useState<
    Partial<Record<keyof Origin, string>>
  >({});
  const { showSuccessToast, showErrorToast } = useAdminToast();

  const [origin, setOrigin] = useState<Origin | null>(null);
  const [initialOrigin, setInitialOrigin] = useState<Origin | null>(null);

  const fetchOrigin = async () => {
    try {
      setLoading(true);
      const res = await http<ApiDetail<Origin>>(
        "GET",
        `/api/v1/admin/origins/edit/${id}`,
      );

      if (res.success && res.data) {
        setOrigin(res.data);
        setInitialOrigin(res.data);
      }
    } catch (err: any) {
      console.error("fetchOrigin error:", err);
      setFetchError(err?.message || "Không tìm thấy xuất xứ.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrigin();
  }, [id]);

  const isDirty = React.useMemo(() => {
    if (!origin || !initialOrigin) return false;

    return (
      origin.name !== initialOrigin.name ||
      (origin.description || "") !== (initialOrigin.description || "") ||
      String(origin.country_code || "") !==
        String(initialOrigin.country_code || "")
    );
  }, [origin, initialOrigin]);

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setOrigin((prev) => (prev ? { ...prev, [name]: value } : prev));

    if (formErrors[name as keyof Origin]) {
      setFormErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleDescriptionChange = (content: string) => {
    setOrigin((prev) => (prev ? { ...prev, description: content } : prev));
  };

  const validateForm = () => {
    if (!origin) return false;

    const newErrors: Partial<Record<keyof Origin, string>> = {};

    if (!origin.name.trim()) {
      newErrors.name = "Vui lòng nhập tên xuất xứ.";
    }

    setFormErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!origin) return;
    if (!validateForm()) return;

    try {
      setSaving(true);
      setFormErrors({});

      const updatedDescription = await uploadImagesInContent(
        origin.description || "",
      );

      const payload = {
        name: origin.name.trim(),
        description: updatedDescription || null,
        country_code:
          typeof origin.country_code === "string" &&
          origin.country_code.trim() !== ""
            ? origin.country_code.trim()
            : null,
      };

      const res = await http<ApiOk>(
        "PATCH",
        `/api/v1/admin/origins/edit/${id}`,
        payload,
      );

      if (res.success) {
        showSuccessToast({ message: "Cập nhật xuất xứ thành công!" });
        await fetchOrigin();
      }
    } catch (err: any) {
      console.error("saveOrigin error:", err);
      showErrorToast(err?.message || "Lỗi kết nối server.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-gray-500 dark:text-gray-400" />
        <span className="ml-2 text-gray-600 dark:text-gray-400">
          Đang tải xuất xứ...
        </span>
      </div>
    );
  }

  if (fetchError) {
    return (
      <p className="text-center text-red-500 dark:text-red-400 py-10">
        {fetchError}
      </p>
    );
  }

  if (!origin) return null;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
          Chỉnh sửa xuất xứ
        </h1>
        <button
          onClick={() => navigate("/admin/product-origin")}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-md transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Quay lại
        </button>
      </div>

      <Card>
        <form onSubmit={handleSubmit} className="space-y-5 p-2">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Tên xuất xứ
            </label>
            <input
              type="text"
              name="name"
              value={origin.name}
              onChange={handleChange}
              className={`w-full border ${
                formErrors.name
                  ? "border-red-500 dark:border-red-500"
                  : "border-gray-300 dark:border-gray-600"
              } rounded-md p-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors`}
            />
            {formErrors.name && (
              <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                {formErrors.name}
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
              value={origin.country_code || ""}
              onChange={handleChange}
              placeholder="Ví dụ: VN, US, JP..."
              className="w-full border border-gray-300 dark:border-gray-600 rounded-md p-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Mô tả
            </label>
            <RichTextEditor
              value={origin.description || ""}
              onChange={handleDescriptionChange}
            />
          </div>

          <div className="flex justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="submit"
              disabled={saving || !isDirty}
              className="flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-400 dark:disabled:bg-gray-600 font-medium"
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

export default ProductOriginEditPage;
