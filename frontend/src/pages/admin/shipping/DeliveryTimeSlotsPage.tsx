import React, { useEffect, useState } from "react";
import Card from "../../../components/admin/layouts/Card";
import Pagination from "../../../components/admin/common/Pagination";
import {
  Search,
  Plus,
  Edit,
  Trash2,
  Loader2,
  Clock3,
  Power,
  PowerOff,
  ArrowRight,
  Infinity as InfinityIcon,
  CheckCircle2,
  AlertCircle,
  CalendarClock,
  Timer,
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
      "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border border-green-200 dark:border-green-800",
  },
  inactive: {
    label: "Tạm dừng",
    className:
      "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-800",
  },
};

const formatMaxOrders = (value?: number | null) => {
  if (value === null || value === undefined) return "Không giới hạn";
  return `${Number(value).toLocaleString("vi-VN")} đơn`;
};

const getDuration = (start?: string, end?: string) => {
  if (!start || !end) return "";
  try {
    const [sh, sm] = start.split(":").map(Number);
    const [eh, em] = end.split(":").map(Number);
    let diffMin = eh * 60 + em - (sh * 60 + sm);
    if (diffMin < 0) diffMin += 24 * 60; // Xuyên đêm

    const h = Math.floor(diffMin / 60);
    const m = diffMin % 60;

    if (h > 0 && m > 0) return `${h} giờ ${m} phút`;
    if (h > 0) return `${h} giờ`;
    return `${m} phút`;
  } catch (e) {
    return "";
  }
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

  const handleFilterChange = (status: string) => {
    const params = new URLSearchParams(searchParams);
    if (status === "all") params.delete("status");
    else params.set("status", status);
    params.delete("page");
    setSearchParams(params);
  };

  const handleDelete = async (
    e: React.MouseEvent,
    row: DeliveryTimeSlotItem,
  ) => {
    e.stopPropagation();
    const ok = window.confirm(
      `Bạn có chắc muốn xóa khung giờ "${row.label}" không?`,
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

  const handleToggleStatus = async (
    e: React.MouseEvent,
    row: DeliveryTimeSlotItem,
  ) => {
    e.stopPropagation();
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

  const handleEdit = (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    navigate(`/admin/shipping/delivery-slots/edit/${id}`);
  };

  // Metrics
  const totalLoaded = rows.length;
  const activeCount = rows.filter((r) => r.status === "active").length;
  const inactiveCount = rows.filter((r) => r.status === "inactive").length;
  const unlimitedCount = rows.filter(
    (r) => r.maxOrders === null || r.maxOrders === undefined,
  ).length;

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-2">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
            Quản lý khung giờ giao hàng
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Định nghĩa các khung giờ chuẩn, cutoff nhận đơn, capacity mặc định
            và thứ tự hiển thị trong hệ thống.
          </p>
        </div>

        <button
          onClick={() => navigate("/admin/shipping/delivery-slots/create")}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm whitespace-nowrap w-full sm:w-auto"
        >
          <Plus className="w-5 h-5" />
          Thêm khung giờ
        </button>
      </div>

      {/* Overview Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 mt-6">
        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400">
            <CalendarClock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider font-medium">
              Tổng số slot
            </p>
            <p className="text-xl font-bold text-gray-900 dark:text-white">
              {totalLoaded}
            </p>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-green-50 dark:bg-green-900/30 rounded-lg text-green-600 dark:text-green-400">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider font-medium">
              Hoạt động
            </p>
            <p className="text-xl font-bold text-gray-900 dark:text-white">
              {activeCount}
            </p>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-yellow-50 dark:bg-yellow-900/30 rounded-lg text-yellow-600 dark:text-yellow-400">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider font-medium">
              Tạm dừng
            </p>
            <p className="text-xl font-bold text-gray-900 dark:text-white">
              {inactiveCount}
            </p>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-purple-50 dark:bg-purple-900/30 rounded-lg text-purple-600 dark:text-purple-400">
            <InfinityIcon className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider font-medium">
              Không giới hạn
            </p>
            <p className="text-xl font-bold text-gray-900 dark:text-white">
              {unlimitedCount}
            </p>
          </div>
        </div>
      </div>

      {/* Toolbar: Search & Segmented Filter */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
        {/* Segmented Control */}
        <div className="inline-flex bg-gray-100 dark:bg-gray-800 p-1 rounded-lg w-full md:w-auto">
          {(["all", "active", "inactive"] as const).map((status) => (
            <button
              key={status}
              onClick={() => handleFilterChange(status)}
              className={`flex-1 md:flex-none px-4 py-2 rounded-md text-sm font-medium transition-all ${
                statusFilter === status
                  ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/50"
              }`}
            >
              {status === "all"
                ? "Tất cả"
                : status === "active"
                  ? "Hoạt động"
                  : "Tạm dừng"}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Tìm mã hoặc tên khung giờ..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow"
          />
        </div>
      </div>

      <Card className="!p-0 overflow-hidden">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex justify-center items-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600 dark:text-blue-400" />
              <span className="ml-3 text-gray-600 dark:text-gray-400 font-medium">
                Đang tải dữ liệu...
              </span>
            </div>
          ) : error ? (
            <div className="text-center py-12 text-red-500 bg-red-50 dark:bg-red-900/10">
              <AlertCircle className="w-10 h-10 mx-auto mb-2 opacity-80" />
              <p>{error}</p>
            </div>
          ) : rows.length === 0 ? (
            <div className="text-center py-20 px-4">
              <div className="bg-gray-100 dark:bg-gray-800 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock3 className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                Chưa có khung giờ giao hàng nào
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md mx-auto">
                Hãy tạo slot đầu tiên để cấu hình lịch giao hàng và hiển thị
                thời gian nhận hàng cho khách trên hệ thống.
              </p>
              <button
                onClick={() =>
                  navigate("/admin/shipping/delivery-slots/create")
                }
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-5 h-5" />
                Tạo khung giờ đầu tiên
              </button>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50/80 dark:bg-gray-800/80">
                <tr>
                  <th className="px-5 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Khung giờ
                  </th>
                  <th className="px-5 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Timeline
                  </th>
                  <th className="px-5 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Cutoff / Capacity
                  </th>
                  <th className="px-5 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Sắp xếp
                  </th>
                  <th className="px-5 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Nhãn
                  </th>
                  <th className="px-5 py-4 text-center text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Trạng thái
                  </th>
                  <th className="px-5 py-4 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Hành động
                  </th>
                </tr>
              </thead>

              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-100 dark:divide-gray-800">
                {rows.map((row) => {
                  const isUnlimited =
                    row.maxOrders === null || row.maxOrders === undefined;
                  const isImmediate = row.cutoffMinutes === 0;
                  const isFirst = row.sortOrder === 0;

                  return (
                    <tr
                      key={row.id}
                      onClick={() =>
                        navigate(
                          `/admin/shipping/delivery-slots/edit/${row.id}`,
                        )
                      }
                      className="hover:bg-blue-50/50 dark:hover:bg-gray-800/60 transition-colors cursor-pointer group"
                    >
                      {/* Khung giờ */}
                      <td className="px-5 py-4">
                        <div className="font-semibold text-gray-900 dark:text-white">
                          {row.label}
                        </div>
                        <div className="text-xs text-gray-500 mt-1 font-mono">
                          {row.code}
                        </div>
                      </td>

                      {/* Timeline */}
                      <td className="px-5 py-4 text-sm">
                        <div className="flex items-center gap-2 font-semibold text-gray-800 dark:text-gray-200">
                          <Clock3 className="w-4 h-4 text-blue-500" />
                          <span>{String(row.startTime).slice(0, 5)}</span>
                          <ArrowRight className="w-3.5 h-3.5 text-gray-400" />
                          <span>{String(row.endTime).slice(0, 5)}</span>
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1.5 flex items-center gap-1.5">
                          <Timer className="w-3.5 h-3.5" />
                          {getDuration(row.startTime, row.endTime)}
                        </div>
                      </td>

                      {/* Cutoff / Capacity */}
                      <td className="px-5 py-4 text-sm">
                        <div className="text-gray-700 dark:text-gray-300">
                          Cutoff:{" "}
                          <span className="font-medium">
                            {row.cutoffMinutes} phút
                          </span>
                        </div>
                        <div className="mt-1 flex items-center gap-1">
                          <span className="text-gray-500">Max:</span>
                          <span
                            className={`font-medium ${isUnlimited ? "text-purple-600 dark:text-purple-400" : ""}`}
                          >
                            {formatMaxOrders(row.maxOrders)}
                          </span>
                        </div>
                      </td>

                      {/* Sắp xếp */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <div className="flex items-center justify-center w-8 h-8 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white font-bold text-sm border border-gray-200 dark:border-gray-700">
                            {row.sortOrder}
                          </div>
                        </div>
                        <div className="text-[11px] text-gray-400 mt-1 whitespace-nowrap">
                          {isFirst
                            ? "Ưu tiên cao nhất"
                            : "Số nhỏ hiển thị trước"}
                        </div>
                      </td>

                      {/* Nhãn */}
                      <td className="px-5 py-4">
                        <div className="flex flex-col gap-1.5 items-start">
                          {isImmediate && (
                            <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border border-red-200 dark:border-red-800/50">
                              Nhận đơn sát giờ
                            </span>
                          )}
                          {isUnlimited && (
                            <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
                              Unlimited
                            </span>
                          )}
                          {isFirst && (
                            <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                              Hiển thị đầu
                            </span>
                          )}
                          {row.status === "inactive" && (
                            <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                              Đang tắt
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Trạng thái */}
                      <td className="px-5 py-4 text-center">
                        <span
                          className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${
                            statusMap[row.status]?.className
                          }`}
                        >
                          {statusMap[row.status]?.label || row.status}
                        </span>
                      </td>

                      {/* Hành động */}
                      <td className="px-5 py-4 text-right">
                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                          <button
                            onClick={(e) => handleToggleStatus(e, row)}
                            className={`p-2 rounded-md transition-colors ${
                              row.status === "active"
                                ? "text-yellow-600 hover:bg-yellow-50 dark:hover:bg-yellow-900/30"
                                : "text-green-600 hover:bg-green-50 dark:hover:bg-green-900/30"
                            }`}
                            title={
                              row.status === "active"
                                ? "Tạm dừng"
                                : "Bật hoạt động"
                            }
                          >
                            {row.status === "active" ? (
                              <PowerOff className="w-5 h-5" />
                            ) : (
                              <Power className="w-5 h-5" />
                            )}
                          </button>

                          <button
                            onClick={(e) => handleEdit(e, row.id)}
                            className="p-2 text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/30 rounded-md transition-colors"
                            title="Chỉnh sửa"
                          >
                            <Edit className="w-5 h-5" />
                          </button>

                          <button
                            onClick={(e) => handleDelete(e, row)}
                            className="p-2 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/30 rounded-md transition-colors"
                            title="Xóa khung giờ"
                          >
                            <Trash2 className="w-5 h-5" />
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

      {!loading && !error && totalPages > 1 && (
        <div className="mt-6 flex justify-end">
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
