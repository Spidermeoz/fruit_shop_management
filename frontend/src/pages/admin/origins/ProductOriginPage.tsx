// src/pages/ProductOriginPage.tsx
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
  Loader2,
  Edit,
  Trash2,
  X,
  FilePenLine,
  RotateCcw,
  Search,
  MapPin,
  Globe2,
  FileText,
  CheckCircle2,
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

type ApiList<T> = { success: true; data: T[]; meta?: any };
type ApiDetail<T> = { success: true; data: T; meta?: any };
type ApiOk = { success: true; data?: any; meta?: any };

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
  const [searchTerm, setSearchTerm] = useState("");
  const [filterMode] = useState<
    "all" | "with_desc" | "missing_code"
  >("all");

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
      setError(err?.message || "Lỗi kết nối server hoặc API không phản hồi.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrigins();
  }, []);

  const stripHtml = (value?: string | null) =>
    value
      ? value
          .replace(/<[^>]+>/g, " ")
          .replace(/\s+/g, " ")
          .trim() || "—"
      : "—";

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
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name as keyof OriginFormData])
      setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const validateForm = () => {
    const nextErrors: Partial<Record<keyof OriginFormData, string>> = {};
    if (!formData.name.trim()) nextErrors.name = "Vui lòng nhập tên xuất xứ.";
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const openDescriptionModal = () => {
    setDescriptionDraft(formData.description || "");
    setIsDescriptionModalOpen(true);
  };

  const saveDescriptionFromModal = () => {
    setFormData((prev) => ({ ...prev, description: descriptionDraft }));
    setIsDescriptionModalOpen(false);
  };

  const handleEdit = async (id: number) => {
    try {
      setSubmitting(true);
      const res = await http<ApiDetail<Origin>>(
        "GET",
        `/api/v1/admin/origins/edit/${id}`,
      );
      setEditingId(id);
      setFormData({
        name: res.data.name || "",
        country_code: res.data.country_code || res.data.countryCode || "",
        description: res.data.description || "",
      });
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err: any) {
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
      showErrorToast(
        err?.message ||
          (editingId ? "Cập nhật thất bại." : "Thêm mới thất bại."),
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteOne = async (id: number) => {
    if (!window.confirm("Bạn có chắc muốn xóa xuất xứ này?")) return;
    try {
      setSubmitting(true);
      await http<ApiOk>("DELETE", `/api/v1/admin/origins/${id}`);
      setOrigins((prev) => prev.filter((item) => item.id !== id));
      setSelectedIds((prev) => prev.filter((x) => x !== id));
      if (editingId === id) resetForm();
      showSuccessToast({ message: "Xóa xuất xứ thành công." });
    } catch (err: any) {
      showErrorToast(err?.message || "Xóa xuất xứ thất bại.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    if (
      !window.confirm(
        `Bạn có chắc muốn xóa ${selectedIds.length} xuất xứ đã chọn?`,
      )
    )
      return;
    try {
      setSubmitting(true);
      await http<ApiOk>("POST", "/api/v1/admin/origins/bulk-delete", {
        ids: selectedIds,
      });
      setOrigins((prev) =>
        prev.filter((item) => !selectedIds.includes(item.id)),
      );
      if (editingId && selectedIds.includes(editingId)) resetForm();
      showSuccessToast({ message: `Đã xóa ${selectedIds.length} xuất xứ.` });
      setSelectedIds([]);
    } catch (err: any) {
      showErrorToast(err?.message || "Xóa nhiều xuất xứ thất bại.");
    } finally {
      setSubmitting(false);
    }
  };

  // Insights & Filtering logic
  const insights = useMemo(() => {
    let withDesc = 0,
      missingCode = 0;
    origins.forEach((o) => {
      if (o.description && stripHtml(o.description) !== "—") withDesc++;
      if (!o.countryCode && !o.country_code) missingCode++;
    });
    return { total: origins.length, withDesc, missingCode };
  }, [origins]);

  const filteredOrigins = useMemo(() => {
    let list = origins;
    if (filterMode === "with_desc")
      list = list.filter(
        (o) => o.description && stripHtml(o.description) !== "—",
      );
    else if (filterMode === "missing_code")
      list = list.filter((o) => !o.countryCode && !o.country_code);

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      list = list.filter(
        (o) =>
          o.name.toLowerCase().includes(term) ||
          (o.countryCode || o.country_code || "").toLowerCase().includes(term),
      );
    }
    return list;
  }, [origins, searchTerm, filterMode]);

  const allSelected =
    filteredOrigins.length > 0 && selectedIds.length === filteredOrigins.length;

  return (
    <div className="w-full pb-16 space-y-6">
      {/* 🔹 HEADER TẦNG 1 */}
      <section className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
            Catalog Origins
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">
            Quản lý từ điển xuất xứ áp dụng trên toàn hệ thống sản phẩm.
          </p>
        </div>
      </section>

      {/* 🔹 KPI CARDS */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5 flex flex-col justify-center border-l-4 border-blue-500 bg-gradient-to-r from-white to-blue-50/30 dark:from-gray-800 dark:to-blue-900/10">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 uppercase">
              Tổng cộng
            </span>
            <MapPin className="w-5 h-5 text-blue-400" />
          </div>
          <p className="mt-2 text-2xl font-black text-gray-900 dark:text-white">
            {insights.total}
          </p>
        </Card>
        <Card className="p-5 flex flex-col justify-center border-l-4 border-emerald-500">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 uppercase">
              Có thông tin mô tả
            </span>
            <FileText className="w-5 h-5 text-emerald-400" />
          </div>
          <p className="mt-2 text-2xl font-black text-gray-900 dark:text-white">
            {insights.withDesc}
          </p>
        </Card>
        <Card className="p-5 flex flex-col justify-center border-l-4 border-amber-500">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 uppercase">
              Thiếu Mã Quốc Gia
            </span>
            <Globe2 className="w-5 h-5 text-amber-400" />
          </div>
          <p className="mt-2 text-2xl font-black text-gray-900 dark:text-white">
            {insights.missingCode}
          </p>
        </Card>
        <Card className="p-5 flex flex-col justify-center border-l-4 border-indigo-500">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 uppercase">
              Đang được chọn
            </span>
            <CheckCircle2 className="w-5 h-5 text-indigo-400" />
          </div>
          <p className="mt-2 text-2xl font-black text-indigo-600 dark:text-indigo-400">
            {selectedIds.length}
          </p>
        </Card>
      </section>

      {/* 🔹 QUICK CREATE / EDIT PANEL */}
      <Card
        className={`overflow-hidden transition-all duration-300 border-t-4 ${editingId ? "border-t-amber-400 shadow-md bg-amber-50/10" : "border-t-blue-500"}`}
      >
        <div
          className={`px-6 py-4 flex items-center justify-between border-b ${editingId ? "border-amber-100 bg-amber-50/50 dark:border-amber-900/30 dark:bg-amber-900/10" : "border-gray-100 dark:border-gray-800"}`}
        >
          <div>
            <h2
              className={`text-lg font-bold ${editingId ? "text-amber-800 dark:text-amber-400" : "text-gray-900 dark:text-white"}`}
            >
              {editingId ? "Đang chỉnh sửa dữ liệu" : "Thêm Nhanh Xuất Xứ Mới"}
            </h2>
            <p className="text-sm text-gray-500">
              {editingId
                ? `Bản ghi ID: #${editingId}`
                : "Nhập nhanh tên và mã quốc gia (Tuỳ chọn)"}
            </p>
          </div>
          {editingId && (
            <button
              onClick={resetForm}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-bold text-amber-700 bg-amber-100 rounded-lg hover:bg-amber-200 transition-colors"
            >
              <RotateCcw className="w-4 h-4" /> Hủy sửa
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            <div className="md:col-span-4">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                Tên xuất xứ <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="VD: Nhật Bản, Mỹ..."
                className={`w-full border rounded-lg p-2.5 text-sm font-semibold focus:ring-2 focus:ring-blue-500 outline-none transition-colors ${errors.name ? "border-red-500 bg-red-50" : "border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"}`}
              />
              {errors.name && (
                <p className="text-[11px] font-bold text-red-500 mt-1.5">
                  {errors.name}
                </p>
              )}
            </div>

            <div className="md:col-span-3">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                Mã quốc gia
              </label>
              <input
                type="text"
                name="country_code"
                value={formData.country_code}
                onChange={handleInputChange}
                placeholder="VD: VN, US, JP"
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg p-2.5 text-sm font-semibold uppercase focus:ring-2 focus:ring-blue-500 outline-none transition-colors bg-white dark:bg-gray-800"
              />
            </div>

            <div className="md:col-span-5 flex flex-col justify-end">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                Mô tả chi tiết
              </label>
              <div className="flex gap-3 h-11">
                <button
                  type="button"
                  onClick={openDescriptionModal}
                  className={`flex-1 flex items-center justify-center gap-2 border border-gray-200 dark:border-gray-700 rounded-lg px-4 text-sm font-medium transition-colors ${stripHtml(formData.description) !== "—" ? "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300" : "bg-gray-50 text-gray-600 hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-300"}`}
                >
                  <FilePenLine className="w-4 h-4" />{" "}
                  {stripHtml(formData.description) !== "—"
                    ? "Sửa mô tả"
                    : "Soạn mô tả"}
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className={`w-32 flex items-center justify-center gap-2 rounded-lg text-sm font-bold text-white shadow-sm transition-colors disabled:opacity-50 ${editingId ? "bg-amber-600 hover:bg-amber-700" : "bg-blue-600 hover:bg-blue-700"}`}
                >
                  {submitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : editingId ? (
                    "Cập nhật"
                  ) : (
                    "Tạo mới"
                  )}
                </button>
              </div>
            </div>
          </div>
        </form>
      </Card>

      {/* 🔹 BULK ACTION BAR */}
      {selectedIds.length > 0 && (
        <div className="flex items-center justify-between p-4 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-xl shadow-sm z-10 sticky top-0">
          <div className="flex items-center gap-3">
            <span className="bg-indigo-600 text-white text-sm font-bold px-3 py-1 rounded-full">
              {selectedIds.length}
            </span>
            <p className="text-sm font-medium text-indigo-900 dark:text-indigo-200">
              mục đang được chọn
            </p>
          </div>
          <button
            onClick={handleBulkDelete}
            disabled={submitting}
            className="px-5 py-2 bg-red-600 text-white text-sm font-bold rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
          >
            <Trash2 className="w-4 h-4" /> Xóa hàng loạt
          </button>
        </div>
      )}

      {/* 🔹 DICTIONARY CONTROL BAR */}
      <section className="bg-white dark:bg-gray-800 p-3 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col lg:flex-row gap-4 items-center justify-between">
        <div className="relative w-full lg:w-96">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Tìm theo tên hoặc mã quốc gia..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </section>

      {/* 🔹 DICTIONARY LIST (TABLE) */}
      <Card className="overflow-hidden border border-gray-200 dark:border-gray-700 shadow-sm rounded-xl">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex justify-center items-center py-20">
              <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
            </div>
          ) : error ? (
            <div className="text-center py-16">
              <p className="text-red-600 font-medium">{error}</p>
            </div>
          ) : filteredOrigins.length === 0 ? (
            <div className="text-center py-20 flex flex-col items-center">
              <Globe2 className="w-16 h-16 text-gray-300 dark:text-gray-600 mb-4" />
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                Từ điển trống
              </h3>
              <p className="text-gray-500 mt-1 text-sm">
                Chưa có xuất xứ nào trong hệ thống hoặc không khớp kết quả lọc.
              </p>
            </div>
          ) : (
            <table className="min-w-full text-left">
              <thead className="bg-gray-50/50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-700">
                <tr>
                  <th className="px-4 py-4 w-12 text-center">
                    <input
                      type="checkbox"
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                      checked={allSelected}
                      onChange={() => {
                        if (allSelected) setSelectedIds([]);
                        else setSelectedIds(filteredOrigins.map((o) => o.id));
                      }}
                    />
                  </th>
                  <th className="px-4 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider w-1/3">
                    Định danh xuất xứ
                  </th>
                  <th className="px-4 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider w-1/2">
                    Bản xem trước mô tả
                  </th>
                  <th className="px-4 py-4 text-right pr-6 text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-100 dark:divide-gray-800">
                {filteredOrigins.map((origin) => {
                  const countryCode = origin.countryCode || origin.country_code;
                  const isEditing = editingId === origin.id;

                  return (
                    <tr
                      key={origin.id}
                      className={`hover:bg-blue-50/50 dark:hover:bg-gray-800/50 transition-colors group ${isEditing ? "bg-amber-50/30 dark:bg-amber-900/10" : ""}`}
                    >
                      <td className="px-4 py-4 text-center align-top pt-5">
                        <input
                          type="checkbox"
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                          checked={selectedIds.includes(origin.id)}
                          onChange={() =>
                            setSelectedIds((p) =>
                              p.includes(origin.id)
                                ? p.filter((x) => x !== origin.id)
                                : [...p, origin.id],
                            )
                          }
                        />
                      </td>
                      <td className="px-4 py-4 align-top">
                        <div className="flex flex-col">
                          <span
                            className={`text-base font-bold ${isEditing ? "text-amber-700 dark:text-amber-400" : "text-gray-900 dark:text-white"}`}
                          >
                            {origin.name}
                          </span>
                          <div className="flex items-center gap-2 mt-1.5">
                            <span className="px-2 py-0.5 rounded bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300 text-[10px] font-bold uppercase tracking-wider border border-gray-200 dark:border-gray-700">
                              {countryCode ? countryCode : "NO CODE"}
                            </span>
                            {isEditing && (
                              <span className="text-[10px] font-bold text-amber-500 uppercase">
                                Đang chỉnh sửa
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 align-top">
                        <p
                          className={`text-sm leading-relaxed line-clamp-2 ${stripHtml(origin.description) === "—" ? "text-gray-400 italic" : "text-gray-600 dark:text-gray-300"}`}
                        >
                          {stripHtml(origin.description)}
                        </p>
                      </td>
                      <td className="px-4 py-4 align-top text-right pr-6">
                        <div className="flex items-center justify-end gap-1 opacity-40 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleEdit(origin.id)}
                            disabled={submitting}
                            className="p-2 text-gray-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/30 rounded-md transition-colors"
                            title="Sửa bản ghi"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteOne(origin.id)}
                            disabled={submitting}
                            className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-md transition-colors"
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

      {/* 🔹 DESCRIPTION MODAL */}
      {isDescriptionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-4xl rounded-2xl bg-white dark:bg-gray-900 shadow-2xl border border-gray-200 dark:border-gray-800 flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                Soạn thảo Mô tả Từ điển
              </h3>
              <button
                onClick={() => setIsDescriptionModalOpen(false)}
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto flex-1">
              <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden shadow-sm">
                <RichTextEditor
                  value={descriptionDraft}
                  onChange={setDescriptionDraft}
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 px-6 py-4 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-800 rounded-b-2xl">
              <button
                onClick={() => setIsDescriptionModalOpen(false)}
                className="px-5 py-2.5 rounded-lg font-bold text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 shadow-sm transition-colors"
              >
                Hủy bỏ
              </button>
              <button
                onClick={saveDescriptionFromModal}
                className="px-6 py-2.5 rounded-lg font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-md transition-colors"
              >
                Áp dụng nội dung
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductOriginPage;
