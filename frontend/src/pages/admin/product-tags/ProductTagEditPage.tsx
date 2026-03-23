import React, {
  useEffect,
  useMemo,
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
  tagGroup: string;
  description?: string | null;
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
    Partial<Record<"name" | "tagGroup" | "description", string>>
  >({});

  const { showSuccessToast, showErrorToast } = useAdminToast();

  const [tag, setTag] = useState<ProductTag | null>(null);
  const [initialTag, setInitialTag] = useState<ProductTag | null>(null);

  const fetchTag = async () => {
    try {
      setLoading(true);
      setFetchError("");

      const res = await http<ApiDetail<ProductTag>>(
        "GET",
        `/api/v1/admin/product-tags/edit/${id}`,
      );

      if (res.success && res.data) {
        const normalized: ProductTag = {
          id: res.data.id,
          name: res.data.name ?? "",
          slug: res.data.slug ?? null,
          tagGroup: res.data.tagGroup ?? "general",
          description: res.data.description ?? "",
        };

        setTag(normalized);
        setInitialTag(normalized);
      } else {
        setFetchError("Không tìm thấy product tag.");
      }
    } catch (err: any) {
      console.error("fetchTag error:", err);
      setFetchError(err?.message || "Không tìm thấy product tag.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTag();
  }, [id]);

  const isDirty = useMemo(() => {
    if (!tag || !initialTag) return false;

    return (
      tag.name !== initialTag.name ||
      tag.tagGroup !== initialTag.tagGroup ||
      (tag.description ?? "") !== (initialTag.description ?? "")
    );
  }, [tag, initialTag]);

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;

    setTag((prev) => (prev ? { ...prev, [name]: value } : prev));

    if (formErrors[name as "name" | "tagGroup" | "description"]) {
      setFormErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const validateForm = () => {
    if (!tag) return false;

    const newErrors: Partial<
      Record<"name" | "tagGroup" | "description", string>
    > = {};

    if (!tag.name.trim()) {
      newErrors.name = "Vui lòng nhập tên product tag.";
    }

    if (!tag.tagGroup.trim()) {
      newErrors.tagGroup = "Vui lòng chọn group.";
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
        name: tag.name.trim(),
        tagGroup: tag.tagGroup,
        description: tag.description?.trim() || null,
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
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-gray-500 dark:text-gray-400" />
        <span className="ml-2 text-gray-600 dark:text-gray-400">
          Đang tải product tag...
        </span>
      </div>
    );
  }

  if (fetchError) {
    return (
      <p className="py-10 text-center text-red-500 dark:text-red-400">
        {fetchError}
      </p>
    );
  }

  if (!tag) return null;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
          Chỉnh sửa product tag
        </h1>

        <button
          onClick={() => navigate("/admin/product-tags")}
          className="flex items-center gap-2 rounded-md bg-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
        >
          <ArrowLeft className="h-4 w-4" />
          Quay lại
        </button>
      </div>

      <Card>
        <form onSubmit={handleSubmit} className="space-y-5 p-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Tên tag
            </label>
            <input
              type="text"
              name="name"
              value={tag.name}
              onChange={handleChange}
              className={`w-full rounded-md border p-2 text-gray-900 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white ${
                formErrors.name
                  ? "border-red-500 dark:border-red-500"
                  : "border-gray-300 dark:border-gray-600"
              }`}
              placeholder="Nhập tên product tag"
            />
            {formErrors.name && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                {formErrors.name}
              </p>
            )}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Group
            </label>
            <select
              name="tagGroup"
              value={tag.tagGroup}
              onChange={handleChange}
              className={`w-full rounded-md border p-2 text-gray-900 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white ${
                formErrors.tagGroup
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
            {formErrors.tagGroup && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                {formErrors.tagGroup}
              </p>
            )}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Mô tả
            </label>
            <textarea
              name="description"
              value={tag.description ?? ""}
              onChange={handleChange}
              rows={4}
              className="w-full rounded-md border border-gray-300 p-2 text-gray-900 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
              placeholder="Nhập mô tả cho product tag"
            />
            {formErrors.description && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                {formErrors.description}
              </p>
            )}
          </div>

          <div className="flex justify-end border-t border-gray-200 pt-4 dark:border-gray-700">
            <button
              type="submit"
              disabled={saving || !isDirty}
              className="flex items-center gap-2 rounded-md bg-blue-600 px-5 py-2 font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-400 disabled:opacity-50 dark:disabled:bg-gray-600"
            >
              {saving ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Đang lưu...
                </>
              ) : (
                <>
                  <Save className="h-5 w-5" />
                  Lưu thay đổi
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
