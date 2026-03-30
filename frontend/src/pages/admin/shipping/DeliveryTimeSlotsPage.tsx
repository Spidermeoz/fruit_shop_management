import React, { useEffect, useState } from "react";
import Card from "../../../components/admin/layouts/Card";
import Pagination from "../../../components/admin/common/Pagination";
import {
  Search,
  Plus,
  Edit,
  Trash2,
  Eye,
  Loader2,
  Clock3,
  Power,
  ArrowRight,
} from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { http } from "../../../services/http";
import { useAdminToast } from "../../../context/AdminToastContext";

type DeliveryTimeSlotStatus = "active" | "inactive";

interface DeliveryTimeSlotItem {
  id: number;
  code: string;
  label: string;
  startTime: string;
  endTime: string;
  cutoffMinutes: number;
  maxOrders?: number | null;
  sortOrder: number;
  status: DeliveryTimeSlotStatus;
  createdAt?: string;
  updatedAt?: string;
}

type ApiList<T> = {
  success: true;
  data:
    | T[]
    | {
        items?: T[];
        pagination?: {
          page?: number;
          limit?: number;
          totalItems?: number;
          totalPages?: number;
        };
      };
  meta?: { total?: number; limit?: number; offset?: number; page?: number };
};

const statusMap: Record<
  DeliveryTimeSlotStatus,
  { label: string; className: string }
> = {
  active: {
    label: "Hoạt động",
    className:
      "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  },
  inactive: {
    label: "Tạm dừng",
    className:
      "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  },
};

const formatMaxOrders = (value?: number | null) => {
  if (value === null || value === undefined) return "Không giới hạn";
  return `${Number(value).toLocaleString("vi-VN")} đơn`;
};

const formatTimeRange = (startTime?: string, endTime?: string) => {
  if (!startTime || !endTime) return "—";
  return `${String(startTime).slice(0, 5)} - ${String(endTime).slice(0, 5)}`;
};

const DeliveryTimeSlotsPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [rows, setRows] = useState<DeliveryTimeSlotItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [searchInput, setSearchInput] = useState(searchParams.get("q") || "");
  const statusFilter = searchParams.get("status") || "all";
  const currentPage = Number(searchParams.get("page") || 1);
  const [totalPages, setTotalPages] = useState(1);

  const { showSuccessToast, showErrorToast } = useAdminToast();

  const fetchRows = async () => {
    try {
      setLoading(true);
      setError("");

      const limit = 10;
      let url = `/api/v1/admin/delivery-time-slots?page=${currentPage}&limit=${limit}`;

      if (statusFilter !== "all") {
        url += `&status=${encodeURIComponent(statusFilter)}`;
      }

      const q = searchParams.get("q");
      if (q?.trim()) {
        url += `&keyword=${encodeURIComponent(q.trim())}`;
      }

      const res = await http<ApiList<DeliveryTimeSlotItem>>("GET", url);

      if (res?.success) {
        if (Array.isArray(res.data)) {
          setRows(res.data);
          const total = Number(res.meta?.total ?? 0);
          setTotalPages(Math.max(1, Math.ceil(total / limit)));
        } else {
          const items = Array.isArray(res.data?.items) ? res.data.items : [];
          const total =
            Number(res.data?.pagination?.totalPages ?? 0) > 0
              ? Number(res.data.pagination?.totalPages)
              : 1;

          setRows(items);
          setTotalPages(total);
        }
      } else {
        setError("Không thể tải danh sách khung giờ giao hàng.");
      }
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Lỗi tải danh sách khung giờ giao hàng.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRows();
  }, [currentPage, statusFilter, searchParams]);

  useEffect(() => {
    const t = setTimeout(() => {
      const params = new URLSearchParams(searchParams);
      if (searchInput.trim()) params.set("q", searchInput.trim());
      else params.delete("q");
      params.delete("page");
      setSearchParams(params);
    }, 400);

    return () => clearTimeout(t);
  }, [searchInput]);

  const handleFilterChange = (key: "status", value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value === "all") params.delete(key);
    else params.set(key, value);
    params.delete("page");
    setSearchParams(params);
  };

  const handleDelete = async (row: DeliveryTimeSlotItem) => {
    const ok = window.confirm(
      `Bạn có chắc muốn xóa mềm khung giờ "${row.label}" không?`,
    );
    if (!ok) return;

    try {
      await http(
        "DELETE",
        `/api/v1/admin/delivery-time-slots/delete/${row.id}`,
      );
      showSuccessToast({ message: "Đã xóa khung giờ giao hàng thành công!" });
      fetchRows();
    } catch (err: any) {
      console.error(err);
      showErrorToast(err?.message || "Không thể xóa khung giờ giao hàng.");
    }
  };

  const handleToggleStatus = async (row: DeliveryTimeSlotItem) => {
    const nextStatus = row.status === "active" ? "inactive" : "active";

    try {
      await http(
        "PATCH",
        `/api/v1/admin/delivery-time-slots/${row.id}/status`,
        {
          status: nextStatus,
        },
      );

      showSuccessToast({ message: "Cập nhật trạng thái thành công!" });
      fetchRows();
    } catch (err: any) {
      console.error(err);
      showErrorToast(err?.message || "Không thể cập nhật trạng thái.");
    }
  };

  return (
    <div>
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 mb-6">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
          Quản lý khung giờ giao hàng
        </h1>

        <div className="flex flex-col sm:flex-row gap-4 w-full xl:w-auto">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm kiếm mã hoặc tên khung giờ..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <button
            onClick={() => navigate("/admin/shipping/delivery-slots/create")}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Thêm khung giờ
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-4 gap-3 mb-4">
        <select
          value={statusFilter}
          onChange={(e) => handleFilterChange("status", e.target.value)}
          className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        >
          <option value="all">Tất cả trạng thái</option>
          <option value="active">Hoạt động</option>
          <option value="inactive">Tạm dừng</option>
        </select>
      </div>

      <Card>
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex justify-center items-center py-16">
              <Loader2 className="w-6 h-6 animate-spin text-gray-500 dark:text-gray-400" />
              <span className="ml-2 text-gray-600 dark:text-gray-400">
                Đang tải dữ liệu...
              </span>
            </div>
          ) : error ? (
            <p className="text-center text-red-500 py-8">{error}</p>
          ) : rows.length === 0 ? (
            <div className="text-center py-12">
              <Clock3 className="w-12 h-12 mx-auto text-gray-400 mb-3" />
              <p className="text-gray-600 dark:text-gray-400">
                Chưa có khung giờ giao hàng nào.
              </p>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    STT
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Khung giờ
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Thời gian
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Cutoff / Capacity
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Sắp xếp
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Trạng thái
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Hành động
                  </th>
                </tr>
              </thead>

              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                {rows.map((row, index) => (
                  <tr
                    key={row.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    <td className="px-4 py-4 text-sm text-gray-700 dark:text-gray-300">
                      {(currentPage - 1) * 10 + index + 1}
                    </td>

                    <td className="px-4 py-4">
                      <div className="flex items-start gap-2">
                        <Clock3 className="w-4 h-4 text-gray-400 mt-0.5" />
                        <div>
                          <div className="font-semibold text-gray-900 dark:text-white">
                            {row.label}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            Code: {row.code}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-4 text-sm text-gray-700 dark:text-gray-300">
                      <div className="flex items-center gap-2">
                        <span>{String(row.startTime).slice(0, 5)}</span>
                        <ArrowRight className="w-4 h-4 text-gray-400" />
                        <span>{String(row.endTime).slice(0, 5)}</span>
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {formatTimeRange(row.startTime, row.endTime)}
                      </div>
                    </td>

                    <td className="px-4 py-4 text-sm text-gray-700 dark:text-gray-300">
                      <div>Cutoff: {row.cutoffMinutes} phút</div>
                      <div className="mt-1">
                        Max: {formatMaxOrders(row.maxOrders)}
                      </div>
                    </td>

                    <td className="px-4 py-4 text-sm text-gray-700 dark:text-gray-300">
                      <div className="inline-flex items-center gap-2">
                        <Power className="w-4 h-4 text-gray-400" />
                        <span>{row.sortOrder}</span>
                      </div>
                    </td>

                    <td className="px-4 py-4">
                      <button
                        onClick={() => handleToggleStatus(row)}
                        className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                          statusMap[row.status]?.className
                        }`}
                        title="Bấm để đổi trạng thái"
                      >
                        {statusMap[row.status]?.label || row.status}
                      </button>
                    </td>

                    <td className="px-4 py-4 text-right">
                      <div className="flex justify-end gap-3">
                        <button
                          onClick={() =>
                            navigate(
                              `/admin/shipping/delivery-slots/detail/${row.id}`,
                            )
                          }
                          className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                          title="Xem chi tiết"
                        >
                          <Eye className="w-5 h-5" />
                        </button>

                        <button
                          onClick={() =>
                            navigate(
                              `/admin/shipping/delivery-slots/edit/${row.id}`,
                            )
                          }
                          className="text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300"
                          title="Chỉnh sửa"
                        >
                          <Edit className="w-5 h-5" />
                        </button>

                        <button
                          onClick={() => handleDelete(row)}
                          className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                          title="Xóa mềm"
                        >
                          <Trash2 className="w-5 h-5" />
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

      {!loading && !error && totalPages > 1 && (
        <div className="mt-6">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={(page) => {
              const params = new URLSearchParams(searchParams);
              params.set("page", String(page));
              setSearchParams(params);
            }}
          />
        </div>
      )}
    </div>
  );
};

export default DeliveryTimeSlotsPage;
