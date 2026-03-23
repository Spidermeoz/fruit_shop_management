import React, {
  useEffect,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Loader2, Save, ArrowLeft } from "lucide-react";
import Card from "../../../components/admin/layouts/Card";
import { http } from "../../../services/http";
import { useAdminToast } from "../../../context/AdminToastContext";

interface ProductTag {
  id: number;
  name: string;
  slug?: string | null;
  group: string;
  status: string;
  position: number | null;
}

type ApiDetail<T> = { success: true; data: T; meta?: any };
type ApiOk = { success: true; data?: any; meta?: any };

const TAG_GROUP_OPTIONS = [
  { value: "general", label: "General" },
  { value: "taste", label: "Taste" },
  { value: "benefit", label: "Benefit" },
  { value: "season", label: "Season" },
  { value: "usage", label: "Usage" },
];

const ProductTagEditPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [fetchError, setFetchError] = useState("");
  const [formErrors, setFormErrors] = useState<
    Partial<Record<keyof ProductTag, string>>
  >({});
  const { showSuccessToast, showErrorToast } = useAdminToast();

  const [tag, setTag] = useState<ProductTag | null>(null);
  const [initialTag, setInitialTag] = useState<ProductTag | null>(null);

  const fetchTag = async () => {
    try {
      setLoading(true);
      const res = await http<ApiDetail<ProductTag>>(
        "GET",
        `/api/v1/admin/product-tags/edit/${id}`,
      );
      if (res.success && res.data) {
        setTag(res.data);
        setInitialTag(res.data);
      }
    } catch (err: any) {
      console.error("fetchTag error:", err);
      setFetchError(err?.message || "Không tìm thấy product tag.");
    } finally {
      setLoading(false);
    }
  };

  const isDirty = React.useMemo(() => {
    if (!tag || !initialTag) return false;

    return (
      tag.name !== initialTag.name ||
      String(tag.slug || "") !== String(initialTag.slug || "") ||
      tag.group !== initialTag.group ||
      tag.status !== initialTag.status ||
      String(tag.position ?? "") !== String(initialTag.position ?? "")
    );
  }, [tag, initialTag]);

  useEffect(() => {
    fetchTag();
  }, [id]);

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setTag((prev) => (prev ? { ...prev, [name]: value } : prev));
    if (formErrors[name as keyof typeof formErrors]) {
      setFormErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const validateForm = () => {
    if (!tag) return false;
    const newErrors: Partial<Record<keyof ProductTag, string>> = {};

    if (!tag.name.trim()) {
      newErrors.name = "Vui lòng nhập tên product tag.";
    }

    if (!tag.group.trim()) {
      newErrors.group = "Vui lòng chọn group.";
    }

    setFormErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!tag) return;

    if (!validateForm()) return;

    try {
      setSaving(true);
      setFormErrors({});

      const payload = {
        name: tag.name,
        slug: tag.slug || null,
        group: tag.group,
        status: tag.status,
        position:
          tag.position === null ||
          tag.position === undefined ||
          (tag.position as any) === ""
            ? null
            : Number(tag.position),
      };

      const res = await http<ApiOk & { errors?: any }>(
        "PATCH",
        `/api/v1/admin/product-tags/edit/${id}`,
        payload,
      );

      if (res.success) {
        showSuccessToast({ message: "Cập nhật product tag thành công!" });
        await fetchTag();
      } else {
        if ((res as any).errors) {
          setFormErrors((res as any).errors);
        } else {
          showErrorToast(
            (res as any).message || "Cập nhật product tag thất bại.",
          );
        }
      }
    } catch (err: any) {
      console.error("saveTag error:", err);
      showErrorToast(
        err?.data?.message || err?.message || "Lỗi kết nối server.",
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-gray-500 dark:text-gray-400" />
        <span className="ml-2 text-gray-600 dark:text-gray-400">
          Đang tải product tag...
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

  if (!tag) return null;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
          Chỉnh sửa product tag
        </h1>
        <button
          onClick={() => navigate("/admin/product-tags")}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-md transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Quay lại
        </button>
      </div>

      <Card>
        <form onSubmit={handleSubmit} className="space-y-5 p-2">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Tên tag
            </label>
            <input
              type="text"
              name="name"
              value={tag.name}
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
              Slug
            </label>
            <input
              type="text"
              name="slug"
              value={tag.slug || ""}
              onChange={handleChange}
              className="w-full border border-gray-300 dark:border-gray-600 rounded-md p-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Group
            </label>
            <select
              name="group"
              value={tag.group}
              onChange={handleChange}
              className={`w-full border ${
                formErrors.group
                  ? "border-red-500 dark:border-red-500"
                  : "border-gray-300 dark:border-gray-600"
              } rounded-md p-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors`}
            >
              {TAG_GROUP_OPTIONS.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
            {formErrors.group && (
              <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                {formErrors.group}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Vị trí hiển thị
            </label>
            <input
              type="number"
              name="position"
              value={tag.position ?? ""}
              onChange={handleChange}
              placeholder="Nếu bỏ trống sẽ tự xếp cuối"
              className="w-full border border-gray-300 dark:border-gray-600 rounded-md p-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Trạng thái
            </label>
            <div className="flex gap-6">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  name="status"
                  value="active"
                  checked={tag.status === "active"}
                  onChange={handleChange}
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
                  checked={tag.status === "inactive"}
                  onChange={handleChange}
                  className="text-red-600 focus:ring-red-500 dark:bg-gray-700 dark:border-gray-600"
                />
                <span className="text-gray-800 dark:text-gray-200">
                  Dừng hoạt động
                </span>
              </label>
            </div>
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

export default ProductTagEditPage;
