// src/pages/admin/roles/RoleEditPage.tsx
import React, {
  useEffect,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Loader2, Save, ArrowLeft } from "lucide-react";
import Card from "../../../components/layouts/Card";
import RichTextEditor from "../../../components/common/RichTextEditor";
import { http } from "../../../services/http";
import { uploadImagesInContent } from "../../../utils/uploadImagesInContent";

interface Role {
  id: number;
  title: string;
  description?: string | null;
  created_at?: string;
  updated_at?: string;
}

type ApiDetail<T> = { success: true; data: T; meta?: any };
type ApiOk = {
  success: true;
  data?: any;
  url?: string;
  message?: string;
  meta?: any;
  errors?: any; // For validation errors
};

const RoleEditPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [role, setRole] = useState<Role | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [fetchError, setFetchError] = useState("");
  const [formErrors, setFormErrors] = useState<
    Partial<Record<keyof Role, string>>
  >({});

  // 🔹 Lấy thông tin vai trò
  const fetchRole = async () => {
    try {
      setLoading(true);
      setFetchError("");
      const res = await http<ApiDetail<Role>>(
        "GET",
        `/api/v1/admin/roles/edit/${id}`,
      );
      if (res?.success && res.data) {
        setRole(res.data);
      } else {
        setFetchError("Không tìm thấy vai trò.");
      }
    } catch (err: any) {
      console.error(err);
      setFetchError(err?.message || "Không thể kết nối server.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRole();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // 🔹 Xử lý input
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setRole((prev) => (prev ? { ...prev, [name]: value } : prev));
    if (formErrors[name as keyof typeof formErrors]) {
      setFormErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  // 🔹 Xử lý mô tả TinyMCE
  const handleDescriptionChange = (content: string) => {
    setRole((prev) => (prev ? { ...prev, description: content } : prev));
    if (formErrors.description) {
      setFormErrors((prev) => ({ ...prev, description: undefined }));
    }
  };

  const validateForm = () => {
    if (!role) return false;
    const newErrors: Partial<Record<keyof Role, string>> = {};
    if (!role.title.trim()) {
      newErrors.title = "Vui lòng nhập tên vai trò.";
    }
    setFormErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 🔹 Lưu thay đổi
  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    if (!role) return;

    if (!validateForm()) {
      return;
    }

    try {
      setSaving(true);
      setFormErrors({});

      const processedDescription = await uploadImagesInContent(
        role.description || "",
      );

      const res = await http<ApiOk>("PATCH", `/api/v1/admin/roles/edit/${id}`, {
        title: role.title,
        description: processedDescription,
      });

      if (res?.success) {
        alert("✅ Cập nhật vai trò thành công!");
        fetchRole(); // Re-fetch data
      } else {
        if (res.errors) {
          setFormErrors(res.errors);
        } else {
          alert(res?.message || "Cập nhật thất bại.");
        }
      }
    } catch (err: any) {
      console.error(err);
      const message =
        err?.data?.message || err?.message || "Không thể kết nối server.";
      if (err?.data?.errors) {
        setFormErrors(err.data.errors);
      } else {
        alert(message);
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-gray-500 dark:text-gray-400" />
        <span className="ml-2 text-gray-600 dark:text-gray-400">
          Đang tải dữ liệu vai trò...
        </span>
      </div>
    );
  }

  if (fetchError)
    return (
      <p className="text-center text-red-500 dark:text-red-400 py-10">
        {fetchError}
      </p>
    );
  if (!role) return null;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
          Chỉnh sửa vai trò
        </h1>
        <button
          onClick={() => navigate("/admin/roles")}
          // Thêm dark mode cho nút quay lại
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-md transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Quay lại
        </button>
      </div>

      {/* Form */}
      <Card>
        <form onSubmit={handleSave} className="space-y-5 p-2">
          {/* --- Tên vai trò --- */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Tên vai trò
            </label>
            <input
              type="text"
              name="title"
              value={role.title || ""}
              onChange={handleChange}
              // Thêm dark mode và hiệu ứng focus cho ô input
              className={`w-full border rounded-md p-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
                formErrors.title
                  ? "border-red-500 dark:border-red-500"
                  : "border-gray-300 dark:border-gray-600"
              }`}
            />
            {formErrors.title && (
              <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                {formErrors.title}
              </p>
            )}
          </div>

          {/* --- Mô tả (TinyMCE) --- */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Mô tả vai trò
            </label>
            <RichTextEditor
              value={role.description || ""}
              onChange={handleDescriptionChange}
            />
            {formErrors.description && (
              <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                {formErrors.description}
              </p>
            )}
          </div>

          {/* --- Nút hành động --- */}
          <div className="flex justify-end pt-2">
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

export default RoleEditPage;
