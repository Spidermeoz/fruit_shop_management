import React, {
  useEffect,
  useMemo,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import Card from "../../../components/admin/layouts/Card";
import RichTextEditor from "../../../components/admin/common/RichTextEditor";
import {
  Plus,
  Loader2,
  Edit,
  Trash2,
  X,
  FilePenLine,
  RotateCcw,
} from "lucide-react";
import { http } from "../../../services/http";
import { useAdminToast } from "../../../context/AdminToastContext";
import { uploadImagesInContent } from "../../../utils/uploadImagesInContent";

interface Origin {
  id: number;
  name: string;
  slug?: string | null;
  description?: string | null;
  countryCode?: string | null;
  country_code?: string | null;
  createdAt?: string;
  updatedAt?: string;
  created_at?: string;
  updated_at?: string;
}

interface OriginFormData {
  name: string;
  country_code: string;
  description: string;
}

type ApiList<T> = {
  success: true;
  data: T[];
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
    totalPages?: number;
  };
};

type ApiDetail<T> = {
  success: true;
  data: T;
  meta?: any;
};

type ApiOk = {
  success: true;
  data?: any;
  meta?: any;
};

const defaultFormData: OriginFormData = {
  name: "",
  country_code: "",
  description: "",
};

const ProductOriginPage: React.FC = () => {
  const [origins, setOrigins] = useState<Origin[]>([]);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<OriginFormData>(defaultFormData);
  const [errors, setErrors] = useState<
    Partial<Record<keyof OriginFormData, string>>
  >({});

  const [isDescriptionModalOpen, setIsDescriptionModalOpen] = useState(false);
  const [descriptionDraft, setDescriptionDraft] = useState("");

  const { showSuccessToast, showErrorToast } = useAdminToast();

  const fetchOrigins = async () => {
    try {
      setLoading(true);
      setError("");

      const res = await http<ApiList<Origin>>(
        "GET",
        "/api/v1/admin/origins?limit=1000&sortBy=position&order=ASC",
      );

      setOrigins(Array.isArray(res.data) ? res.data : []);
      setSelectedIds([]);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Lỗi kết nối server hoặc API không phản hồi.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrigins();
  }, []);

  const stripHtml = (value?: string | null) => {
    if (!value) return "—";
    return (
      value
        .replace(/<[^>]+>/g, " ")
        .replace(/\s+/g, " ")
        .trim() || "—"
    );
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData(defaultFormData);
    setErrors({});
    setDescriptionDraft("");
    setIsDescriptionModalOpen(false);
  };

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
    const nextErrors: Partial<Record<keyof OriginFormData, string>> = {};

    if (!formData.name.trim()) {
      nextErrors.name = "Vui lòng nhập tên xuất xứ.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const openDescriptionModal = () => {
    setDescriptionDraft(formData.description || "");
    setIsDescriptionModalOpen(true);
  };

  const saveDescriptionFromModal = () => {
    setFormData((prev) => ({
      ...prev,
      description: descriptionDraft,
    }));
    setIsDescriptionModalOpen(false);
  };

  const handleEdit = async (id: number) => {
    try {
      setSubmitting(true);

      const res = await http<ApiDetail<Origin>>(
        "GET",
        `/api/v1/admin/origins/edit/${id}`,
      );

      const data = res.data;

      setEditingId(id);
      setFormData({
        name: data.name || "",
        country_code: data.country_code || data.countryCode || "",
        description: data.description || "",
      });

      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err: any) {
      console.error(err);
      showErrorToast(err?.message || "Không tải được dữ liệu xuất xứ.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      setSubmitting(true);
      setErrors({});

      const updatedDescription = await uploadImagesInContent(
        formData.description || "",
      );

      const payload = {
        name: formData.name.trim(),
        description: updatedDescription || null,
        country_code: formData.country_code.trim() || null,
      };

      if (editingId) {
        const res = await http<ApiOk>(
          "PATCH",
          `/api/v1/admin/origins/edit/${editingId}`,
          payload,
        );

        if (res.success) {
          showSuccessToast({ message: "Cập nhật xuất xứ thành công!" });
          await fetchOrigins();
          resetForm();
        }
      } else {
        const res = await http<ApiOk>(
          "POST",
          "/api/v1/admin/origins/create",
          payload,
        );

        if (res.success) {
          showSuccessToast({ message: "Thêm mới xuất xứ thành công!" });
          await fetchOrigins();
          resetForm();
        }
      }
    } catch (err: any) {
      console.error(err);
      showErrorToast(
        err?.message ||
          (editingId
            ? "Cập nhật xuất xứ thất bại."
            : "Thêm mới xuất xứ thất bại."),
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteOne = async (id: number) => {
    const confirmed = window.confirm("Bạn có chắc muốn xóa xuất xứ này?");
    if (!confirmed) return;

    try {
      setSubmitting(true);

      await http<ApiOk>("DELETE", `/api/v1/admin/origins/${id}`);

      setOrigins((prev) => prev.filter((item) => item.id !== id));
      setSelectedIds((prev) => prev.filter((x) => x !== id));

      if (editingId === id) {
        resetForm();
      }

      showSuccessToast({ message: "Xóa xuất xứ thành công." });
    } catch (err: any) {
      console.error(err);
      showErrorToast(err?.message || "Xóa xuất xứ thất bại.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;

    const confirmed = window.confirm(
      `Bạn có chắc muốn xóa ${selectedIds.length} xuất xứ đã chọn?`,
    );
    if (!confirmed) return;

    try {
      setSubmitting(true);

      await http<ApiOk>("POST", "/api/v1/admin/origins/bulk-delete", {
        ids: selectedIds,
      });

      setOrigins((prev) =>
        prev.filter((item) => !selectedIds.includes(item.id)),
      );

      if (editingId && selectedIds.includes(editingId)) {
        resetForm();
      }

      const deletedCount = selectedIds.length;
      setSelectedIds([]);

      showSuccessToast({
        message: `Đã xóa ${deletedCount} xuất xứ.`,
      });
    } catch (err: any) {
      console.error(err);
      showErrorToast(err?.message || "Xóa nhiều xuất xứ thất bại.");
    } finally {
      setSubmitting(false);
    }
  };

  const allSelected =
    origins.length > 0 && selectedIds.length === origins.length;

  const selectedCount = selectedIds.length;

  const handleToggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds([]);
      return;
    }
    setSelectedIds(origins.map((item) => item.id));
  };

  const handleToggleSelectOne = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const descriptionPreview = useMemo(() => {
    const plain = stripHtml(formData.description);
    return plain === "—" ? "Chưa có mô tả." : plain.slice(0, 180);
  }, [formData.description]);

  return (
    <div className="space-y-6">
      <Card>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
              Xuất xứ sản phẩm
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Quản lý thêm, sửa, xóa xuất xứ ngay trên một trang
            </p>
          </div>

          {editingId ? (
            <button
              type="button"
              onClick={resetForm}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors font-medium"
            >
              <RotateCcw className="w-4 h-4" />
              Hủy chế độ sửa
            </button>
          ) : null}
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 p-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Tên xuất xứ <span className="text-red-500">*</span>
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
          </div>

          <div>
            <div className="flex items-center justify-between gap-3 mb-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Mô tả
              </label>

              <button
                type="button"
                onClick={openDescriptionModal}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:hover:bg-blue-900/50 transition-colors"
              >
                <FilePenLine className="w-4 h-4" />
                Mở TinyMCE
              </button>
            </div>

            <div className="border border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-3 bg-gray-50 dark:bg-gray-800/60">
              <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                {descriptionPreview}
                {descriptionPreview !== "Chưa có mô tả." &&
                stripHtml(formData.description).length > 180
                  ? "..."
                  : ""}
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={resetForm}
              className="px-4 py-2 rounded-md border border-gray-400 dark:border-gray-600 text-gray-700 dark:text-gray-200 bg-transparent hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors font-medium"
            >
              Làm mới form
            </button>

            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-2 px-5 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:opacity-50 font-medium"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Đang lưu...
                </>
              ) : editingId ? (
                <>
                  <Edit className="w-4 h-4" />
                  Cập nhật xuất xứ
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  Thêm xuất xứ
                </>
              )}
            </button>
          </div>
        </form>
      </Card>

      <Card>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-800 dark:text-white">
              Danh sách xuất xứ
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Tổng: {origins.length} xuất xứ
            </p>
          </div>

          {selectedCount > 0 && (
            <button
              onClick={handleBulkDelete}
              disabled={submitting}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white font-medium rounded-md hover:bg-red-700 transition-colors disabled:opacity-50"
            >
              <Trash2 className="w-5 h-5" />
              Xóa đã chọn ({selectedCount})
            </button>
          )}
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex justify-center items-center py-20">
              <Loader2 className="w-6 h-6 text-gray-500 animate-spin" />
              <span className="ml-2 text-gray-600 dark:text-gray-400">
                Đang tải xuất xứ...
              </span>
            </div>
          ) : error ? (
            <p className="text-center text-red-500 py-6">{error}</p>
          ) : origins.length === 0 ? (
            <p className="text-center text-gray-500 py-6">
              Không có xuất xứ nào.
            </p>
          ) : (
            <table className="min-w-full border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
              <thead className="bg-gray-100 dark:bg-gray-800">
                <tr>
                  <th className="w-[56px] px-4 py-3 text-center">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      onChange={handleToggleSelectAll}
                    />
                  </th>
                  <th className="w-[80px] px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    STT
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Tên xuất xứ
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Mã quốc gia
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Hành động
                  </th>
                </tr>
              </thead>

              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                {origins.map((origin, index) => {
                  const countryCode =
                    origin.countryCode || origin.country_code || "—";

                  return (
                    <tr
                      key={origin.id}
                      className={`hover:bg-gray-50 dark:hover:bg-gray-800 ${
                        editingId === origin.id
                          ? "bg-blue-50 dark:bg-blue-900/10"
                          : ""
                      }`}
                    >
                      <td className="px-4 py-4 text-center">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(origin.id)}
                          onChange={() => handleToggleSelectOne(origin.id)}
                        />
                      </td>

                      <td className="px-4 py-4 text-sm text-gray-700 dark:text-gray-300">
                        {index + 1}
                      </td>

                      <td className="px-4 py-4">
                        <div className="font-medium text-gray-900 dark:text-white">
                          {origin.name}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
                          {stripHtml(origin.description).slice(0, 120)}
                        </div>
                      </td>

                      <td className="px-4 py-4 text-sm text-gray-700 dark:text-gray-300">
                        {countryCode}
                      </td>

                      <td className="px-4 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleEdit(origin.id)}
                            disabled={submitting}
                            className="p-2 rounded-md bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:hover:bg-blue-900/50 disabled:opacity-50"
                            title="Chỉnh sửa"
                          >
                            <Edit className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => handleDeleteOne(origin.id)}
                            disabled={submitting}
                            className="p-2 rounded-md bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-300 dark:hover:bg-red-900/50 disabled:opacity-50"
                            title="Xóa"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </Card>

      {isDescriptionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-5xl max-h-[90vh] overflow-hidden rounded-xl bg-white dark:bg-gray-900 shadow-2xl border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-bold text-gray-800 dark:text-white">
                Nhập mô tả xuất xứ
              </h3>

              <button
                type="button"
                onClick={() => setIsDescriptionModalOpen(false)}
                className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto max-h-[calc(90vh-140px)]">
              <RichTextEditor
                value={descriptionDraft}
                onChange={setDescriptionDraft}
              />
            </div>

            <div className="flex justify-end gap-3 px-5 py-4 border-t border-gray-200 dark:border-gray-700">
              <button
                type="button"
                onClick={() => setIsDescriptionModalOpen(false)}
                className="px-4 py-2 rounded-md border border-gray-400 dark:border-gray-600 text-gray-700 dark:text-gray-200 bg-transparent hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors font-medium"
              >
                Hủy
              </button>

              <button
                type="button"
                onClick={saveDescriptionFromModal}
                className="px-5 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 transition-colors font-medium"
              >
                Áp dụng mô tả
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductOriginPage;
