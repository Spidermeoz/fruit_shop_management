import React, { useEffect, useState } from "react";
import Card from "../../../components/admin/layouts/Card";
import { Plus, Loader2, Eye, Edit, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { http } from "../../../services/http";
import { useAdminToast } from "../../../context/AdminToastContext";

interface Origin {
  id: number;
  name: string;
  description?: string | null;
  countryCode?: string | null;
  createdAt?: string;
  updatedAt?: string;
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

type ApiOk = { success: true; data?: any; meta?: any };

const ProductOriginPage: React.FC = () => {
  const [origins, setOrigins] = useState<Origin[]>([]);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const navigate = useNavigate();
  const { showSuccessToast, showErrorToast } = useAdminToast();

  const fetchOrigins = async () => {
    try {
      setLoading(true);
      setError("");

      const res = await http<ApiList<Origin>>(
        "GET",
        "/api/v1/admin/origins?limit=1000&sortBy=name&order=ASC",
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
    return value.replace(/<[^>]+>/g, "").trim() || "—";
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

  const handleDeleteOne = async (id: number) => {
    const confirmed = window.confirm("Bạn có chắc muốn xóa xuất xứ này?");
    if (!confirmed) return;

    try {
      setSubmitting(true);
      await http<ApiOk>("DELETE", `/api/v1/admin/origins/${id}`);

      setOrigins((prev) => prev.filter((item) => item.id !== id));
      setSelectedIds((prev) => prev.filter((x) => x !== id));

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
      setSelectedIds([]);

      showSuccessToast({
        message: `Đã xóa ${selectedCount} xuất xứ.`,
      });
    } catch (err: any) {
      console.error(err);
      showErrorToast(err?.message || "Xóa nhiều xuất xứ thất bại.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
          Xuất xứ sản phẩm
        </h1>

        <div className="flex items-center gap-3">
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

          <button
            onClick={() => navigate("/admin/product-origin/create")}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Thêm xuất xứ
          </button>
        </div>
      </div>

      <Card>
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
                {origins.map((origin, index) => (
                  <tr
                    key={origin.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-800"
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
                      {origin.countryCode || "—"}
                    </td>

                    <td className="px-4 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() =>
                            navigate(
                              `/admin/product-origin/detail/${origin.id}`,
                            )
                          }
                          className="p-2 rounded-md bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
                          title="Xem chi tiết"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() =>
                            navigate(`/admin/product-origin/edit/${origin.id}`)
                          }
                          className="p-2 rounded-md bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:hover:bg-blue-900/50"
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
                ))}
              </tbody>
            </table>
          )}
        </div>
      </Card>
    </div>
  );
};

export default ProductOriginPage;
