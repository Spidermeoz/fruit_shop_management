import React, { useEffect, useMemo, useState } from "react";
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
  Infinity as InfinityIcon,
  CheckCircle2,
  AlertCircle,
  CalendarClock,
  Timer,
  LayoutGrid,
  List,
  Store,
  RefreshCw,
  Zap,
} from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { http } from "../../../services/http";
import { useAdminToast } from "../../../context/AdminToastContext";

// =============================
// TYPES
// =============================
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

type QuickFilterType =
  | "all"
  | "active"
  | "inactive"
  | "unlimited"
  | "limited"
  | "morning"
  | "afternoon"
  | "evening"
  | "strict_cutoff";

// =============================
// HELPERS
// =============================
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
      "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 border border-gray-200 dark:border-gray-700",
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

const getTimeBucket = (startTime?: string) => {
  if (!startTime) return null;
  const hour = parseInt(startTime.split(":")[0], 10);
  if (isNaN(hour)) return null;
  if (hour < 12)
    return {
      label: "Buổi sáng",
      key: "morning",
      color: "text-blue-600 bg-blue-50 border-blue-200",
    };
  if (hour < 18)
    return {
      label: "Buổi chiều",
      key: "afternoon",
      color: "text-orange-600 bg-orange-50 border-orange-200",
    };
  return {
    label: "Buổi tối",
    key: "evening",
    color: "text-indigo-600 bg-indigo-50 border-indigo-200",
  };
};

const getCutoffLabel = (cutoffMinutes: number) => {
  if (cutoffMinutes === 0) return "Sát giờ (0 phút)";
  if (cutoffMinutes < 60) return `${cutoffMinutes} phút`;
  const h = Math.floor(cutoffMinutes / 60);
  const m = cutoffMinutes % 60;
  return m > 0 ? `${h}h ${m}p` : `${h} giờ`;
};

// =============================
// MAIN COMPONENT
// =============================
const DeliveryTimeSlotsPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { showSuccessToast, showErrorToast } = useAdminToast();

  const [rows, setRows] = useState<DeliveryTimeSlotItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [searchInput, setSearchInput] = useState(searchParams.get("q") || "");
  const [quickFilter, setQuickFilter] = useState<QuickFilterType>("all");
  const [viewMode, setViewMode] = useState<"card" | "table">("card");

  const statusFilter = searchParams.get("status") || "all";
  const currentPage = Number(searchParams.get("page") || 1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchRows = async () => {
    try {
      setLoading(true);
      setError("");

      const limit = 24; // Cao hơn cho card view
      let url = `/api/v1/admin/delivery-time-slots?page=${currentPage}&limit=${limit}`;

      if (statusFilter !== "all")
        url += `&status=${encodeURIComponent(statusFilter)}`;

      const q = searchParams.get("q");
      if (q?.trim()) url += `&keyword=${encodeURIComponent(q.trim())}`;

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
        setError("Không thể tải danh sách khung giờ hệ thống.");
      }
    } catch (err: any) {
      setError(err?.message || "Lỗi tải danh sách khung giờ hệ thống.");
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

  // --- Derived Models ---
  const enrichedRows = useMemo(() => {
    return rows.map((row) => ({
      ...row,
      timeBucket: getTimeBucket(row.startTime),
      isUnlimited: row.maxOrders === null || row.maxOrders === undefined,
      isStrictCutoff: row.cutoffMinutes <= 60 && row.cutoffMinutes > 0, // Dưới 1 tiếng coi là gấp, trừ 0 là sát giờ
    }));
  }, [rows]);

  const displayedRows = useMemo(() => {
    if (quickFilter === "all") return enrichedRows;
    return enrichedRows.filter((row) => {
      if (quickFilter === "active") return row.status === "active";
      if (quickFilter === "inactive") return row.status === "inactive";
      if (quickFilter === "unlimited") return row.isUnlimited;
      if (quickFilter === "limited") return !row.isUnlimited;
      if (quickFilter === "morning") return row.timeBucket?.key === "morning";
      if (quickFilter === "afternoon")
        return row.timeBucket?.key === "afternoon";
      if (quickFilter === "evening") return row.timeBucket?.key === "evening";
      if (quickFilter === "strict_cutoff") return row.isStrictCutoff;
      return true;
    });
  }, [enrichedRows, quickFilter]);

  const metrics = useMemo(() => {
    let active = 0,
      inactive = 0,
      unlimited = 0,
      limited = 0,
      strictCutoff = 0;
    enrichedRows.forEach((r) => {
      if (r.status === "active") active++;
      else inactive++;
      if (r.isUnlimited) unlimited++;
      else limited++;
      if (r.isStrictCutoff || r.cutoffMinutes === 0) strictCutoff++;
    });
    return {
      total: enrichedRows.length,
      active,
      inactive,
      unlimited,
      limited,
      strictCutoff,
    };
  }, [enrichedRows]);

  // --- Actions ---
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
    if (
      !window.confirm(
        `Bạn có chắc muốn xóa khung giờ hệ thống "${row.label}" không?`,
      )
    )
      return;
    try {
      await http(
        "DELETE",
        `/api/v1/admin/delivery-time-slots/delete/${row.id}`,
      );
      showSuccessToast({ message: "Đã xóa khung giờ thành công!" });
      fetchRows();
    } catch (err: any) {
      showErrorToast(err?.message || "Không thể xóa khung giờ.");
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
        { status: nextStatus },
      );
      showSuccessToast({ message: "Cập nhật trạng thái thành công!" });
      fetchRows();
    } catch (err: any) {
      showErrorToast(err?.message || "Không thể cập nhật trạng thái.");
    }
  };

  return (
    <div className="w-full pb-10 space-y-6">
      {/* Tầng A: Header / Command Bar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Khung giờ hệ thống
            </h1>
            {metrics.active > 0 && (
              <span className="px-2.5 py-1 bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300 text-xs font-bold rounded-md">
                {metrics.active} template đang bật
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Quản lý bộ khung giờ chuẩn dùng làm mẫu nền cho lịch nhận đơn tại
            các chi nhánh.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <button
            onClick={fetchRows}
            className="p-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition"
            title="Làm mới"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
          <button
            onClick={() => {
              const d = new Date();
              d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
              navigate(
                `/admin/shipping/branch-delivery-slot-capacities?deliveryDate=${d.toISOString().slice(0, 10)}`,
              );
            }}
            className="px-4 py-2 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600 text-sm font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition"
          >
            Capacity Hôm nay
          </button>
          <button
            onClick={() => navigate("/admin/shipping/branch-delivery-slots")}
            className="px-4 py-2 bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 text-sm font-medium rounded-lg hover:bg-indigo-100 transition"
          >
            Khung giờ chi nhánh
          </button>
          <button
            onClick={() => navigate("/admin/shipping/delivery-slots/create")}
            className="flex items-center gap-2 px-5 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition shadow-sm ml-auto md:ml-0"
          >
            <Plus className="w-4 h-4" /> Thêm khung giờ
          </button>
        </div>
      </div>

      {/* Tầng B: KPI Strip */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        {[
          {
            label: "Tổng khung giờ",
            value: metrics.total,
            icon: CalendarClock,
            color: "text-blue-600",
            bg: "bg-blue-50",
          },
          {
            label: "Đang hoạt động",
            value: metrics.active,
            icon: CheckCircle2,
            color: "text-green-600",
            bg: "bg-green-50",
          },
          {
            label: "Tạm dừng",
            value: metrics.inactive,
            icon: PowerOff,
            color: "text-gray-600",
            bg: "bg-gray-100",
          },
          {
            label: "Không giới hạn",
            value: metrics.unlimited,
            icon: InfinityIcon,
            color: "text-purple-600",
            bg: "bg-purple-50",
          },
          {
            label: "Có giới hạn gốc",
            value: metrics.limited,
            icon: AlertCircle,
            color: "text-amber-600",
            bg: "bg-amber-50",
          },
          {
            label: "Cutoff gấp / Sát giờ",
            value: metrics.strictCutoff,
            icon: Zap,
            color: "text-red-600",
            bg: "bg-red-50",
          },
        ].map((kpi, idx) => (
          <div
            key={idx}
            onClick={() => {
              if (kpi.label === "Đang hoạt động") setQuickFilter("active");
              if (kpi.label === "Tạm dừng") setQuickFilter("inactive");
              if (kpi.label === "Không giới hạn") setQuickFilter("unlimited");
              if (kpi.label === "Có giới hạn gốc") setQuickFilter("limited");
              if (kpi.label === "Cutoff gấp / Sát giờ")
                setQuickFilter("strict_cutoff");
            }}
            className={`p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 flex flex-col justify-center ${kpi.label !== "Tổng khung giờ" ? "cursor-pointer hover:border-blue-400 hover:shadow-sm transition-all" : ""}`}
          >
            <div className="flex items-center gap-2 mb-2">
              <kpi.icon className={`w-4 h-4 ${kpi.color}`} />
              <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 truncate">
                {kpi.label}
              </span>
            </div>
            <div className="text-xl font-black text-gray-900 dark:text-white">
              {kpi.value}
            </div>
          </div>
        ))}
      </div>

      {/* Tầng C: Toolbar Phân tầng */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col gap-4">
        {/* Quick Filters */}
        <div className="flex flex-wrap items-center gap-2 border-b border-gray-100 dark:border-gray-700 pb-4">
          <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 mr-2 flex items-center gap-1.5">
            Bộ lọc nhanh:
          </span>
          {[
            { id: "all", label: "Tất cả" },
            { id: "active", label: "Đang hoạt động" },
            { id: "inactive", label: "Tạm dừng" },
            { id: "unlimited", label: "Không giới hạn" },
            { id: "limited", label: "Có giới hạn" },
            { id: "morning", label: "Buổi sáng" },
            { id: "afternoon", label: "Buổi chiều" },
            { id: "evening", label: "Buổi tối" },
            { id: "strict_cutoff", label: "Cutoff gấp" },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setQuickFilter(f.id as QuickFilterType)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                quickFilter === f.id
                  ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                  : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:border-gray-300"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Advanced Filters */}
        <div className="flex flex-col lg:flex-row justify-between items-center gap-4">
          <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
            <select
              value={statusFilter}
              onChange={(e) => handleFilterChange(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white min-w-[180px]"
            >
              <option value="all">Mọi trạng thái API</option>
              <option value="active">Hoạt động</option>
              <option value="inactive">Tạm dừng</option>
            </select>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4 w-full lg:w-auto">
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Tìm mã hoặc tên khung giờ..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex bg-gray-100 dark:bg-gray-900 p-1 rounded-lg shrink-0">
              <button
                onClick={() => setViewMode("card")}
                className={`p-1.5 rounded-md flex items-center gap-1.5 text-sm font-medium transition ${viewMode === "card" ? "bg-white dark:bg-gray-700 shadow-sm text-blue-600 dark:text-blue-400" : "text-gray-500 hover:text-gray-700"}`}
              >
                <LayoutGrid className="w-4 h-4" /> Dạng thẻ (Templates)
              </button>
              <button
                onClick={() => setViewMode("table")}
                className={`p-1.5 rounded-md flex items-center gap-1.5 text-sm font-medium transition ${viewMode === "table" ? "bg-white dark:bg-gray-700 shadow-sm text-blue-600 dark:text-blue-400" : "text-gray-500 hover:text-gray-700"}`}
              >
                <List className="w-4 h-4" /> Dạng bảng
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="flex flex-col justify-center items-center py-24 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <p className="mt-3 text-gray-500 font-medium">
            Đang tải template khung giờ...
          </p>
        </div>
      ) : error ? (
        <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-3" />
          <p className="text-red-600 font-medium">{error}</p>
        </div>
      ) : displayedRows.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-xl border border-dashed border-gray-300 dark:border-gray-600 flex flex-col items-center">
          <Clock3 className="w-12 h-12 text-gray-300 dark:text-gray-600 mb-4" />
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">
            Không có template phù hợp
          </h3>
          <p className="text-sm text-gray-500 mt-1 mb-5">
            Chưa có khung giờ hệ thống nào khớp với bộ lọc hiện tại.
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => navigate("/admin/shipping/delivery-slots/create")}
              className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition"
            >
              Thêm template
            </button>
            {quickFilter !== "all" && (
              <button
                onClick={() => setQuickFilter("all")}
                className="px-4 py-2 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition"
              >
                Xóa bộ lọc nhanh
              </button>
            )}
          </div>
        </div>
      ) : (
        <>
          <p className="text-sm text-gray-500 font-medium pl-1">
            Hiển thị {displayedRows.length} template khung giờ ở trang hiện tại.
          </p>

          {viewMode === "card" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 mt-4">
              {displayedRows.map((row) => {
                const isInactive = row.status === "inactive";

                return (
                  <div
                    key={row.id}
                    className={`bg-white dark:bg-gray-800 rounded-xl border transition-all flex flex-col h-full shadow-sm hover:shadow-md ${isInactive ? "opacity-80 border-gray-200" : "border-gray-200 dark:border-gray-700 hover:border-blue-300"}`}
                  >
                    {/* Lớp 1 & 2: Identity & Time Specification */}
                    <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex-1">
                      <div className="flex justify-between items-start mb-3">
                        {row.timeBucket ? (
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold border ${row.timeBucket.color}`}
                          >
                            {row.timeBucket.label}
                          </span>
                        ) : (
                          <span className="w-1 h-1"></span>
                        )}
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${row.sortOrder === 0 ? "bg-red-100 text-red-700 border border-red-200" : "bg-gray-100 text-gray-600 border border-gray-200"}`}
                        >
                          Hiển thị{" "}
                          {row.sortOrder === 0 ? "đầu" : `#${row.sortOrder}`}
                        </span>
                      </div>

                      <h3
                        className={`font-bold text-lg mb-1 leading-tight ${isInactive ? "text-gray-600" : "text-gray-900 dark:text-white"}`}
                      >
                        {row.label}
                      </h3>
                      <div className="text-[11px] font-mono text-gray-500 bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded w-fit mb-4">
                        {row.code}
                      </div>

                      <div className="text-sm text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg border border-gray-100 dark:border-gray-700 space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="font-semibold text-gray-900 dark:text-white flex items-center gap-1.5">
                            <Clock3 className="w-4 h-4 text-blue-500" />{" "}
                            {String(row.startTime).slice(0, 5)} -{" "}
                            {String(row.endTime).slice(0, 5)}
                          </span>
                          <span className="text-xs font-medium bg-white dark:bg-gray-700 border border-gray-100 dark:border-gray-600 px-2 py-0.5 rounded">
                            {getDuration(row.startTime, row.endTime)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-gray-500">
                            Chốt đơn (Cutoff)
                          </span>
                          <span
                            className={`font-bold ${row.cutoffMinutes === 0 ? "text-red-500" : "text-gray-900 dark:text-gray-200"}`}
                          >
                            {getCutoffLabel(row.cutoffMinutes)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Lớp 3: Capacity Template */}
                    <div className="p-4 bg-gray-50/50 dark:bg-gray-800/30">
                      <div className="flex justify-between items-center text-sm mb-1.5">
                        <span className="text-gray-600 font-medium">
                          Giới hạn mặc định:
                        </span>
                        {row.isUnlimited ? (
                          <span className="font-bold text-purple-600 dark:text-purple-400">
                            Không giới hạn
                          </span>
                        ) : (
                          <span className="font-bold text-gray-900 dark:text-white">
                            {formatMaxOrders(row.maxOrders)}
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-gray-500 italic">
                        Chi nhánh sẽ lấy giới hạn này làm chuẩn nếu không tùy
                        chỉnh (override) thêm.
                      </p>
                    </div>

                    {/* Lớp 4: Actions */}
                    <div className="p-3 border-t border-gray-100 dark:border-gray-700 flex justify-between items-center bg-white dark:bg-gray-800 rounded-b-xl">
                      <button
                        onClick={(e) => handleToggleStatus(e, row)}
                        className={`px-2.5 py-1 text-[11px] font-bold rounded flex items-center gap-1 transition ${isInactive ? "bg-gray-100 text-gray-500 hover:bg-gray-200" : "bg-green-100 text-green-700 hover:bg-green-200"}`}
                      >
                        {isInactive ? "Tạm dừng" : "Đang bật"}
                      </button>
                      <div className="flex gap-1.5">
                        <button
                          onClick={() =>
                            navigate(
                              `/admin/shipping/branch-delivery-slots/create?deliveryTimeSlotId=${row.id}`,
                            )
                          }
                          className="p-1.5 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded"
                          title="Bật cho chi nhánh"
                        >
                          <Store className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(
                              `/admin/shipping/delivery-slots/edit/${row.id}`,
                            );
                          }}
                          className="p-1.5 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded"
                          title="Sửa template"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => handleDelete(e, row)}
                          className="p-1.5 text-red-600 bg-red-50 hover:bg-red-100 rounded"
                          title="Xóa"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <Card className="!p-0 overflow-hidden mt-4">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th className="px-5 py-3.5 text-left text-xs font-bold text-gray-500 uppercase">
                        Template Khung giờ
                      </th>
                      <th className="px-5 py-3.5 text-left text-xs font-bold text-gray-500 uppercase">
                        Khung thời gian
                      </th>
                      <th className="px-5 py-3.5 text-left text-xs font-bold text-gray-500 uppercase">
                        Cutoff
                      </th>
                      <th className="px-5 py-3.5 text-left text-xs font-bold text-gray-500 uppercase">
                        Giới hạn mặc định
                      </th>
                      <th className="px-5 py-3.5 text-left text-xs font-bold text-gray-500 uppercase">
                        Sắp xếp
                      </th>
                      <th className="px-5 py-3.5 text-center text-xs font-bold text-gray-500 uppercase">
                        Trạng thái
                      </th>
                      <th className="px-5 py-3.5 text-right text-xs font-bold text-gray-500 uppercase">
                        Hành động
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-100 dark:divide-gray-800">
                    {displayedRows.map((row) => (
                      <tr
                        key={row.id}
                        className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group cursor-pointer"
                        onClick={() =>
                          navigate(
                            `/admin/shipping/delivery-slots/edit/${row.id}`,
                          )
                        }
                      >
                        <td className="px-5 py-3.5">
                          <div className="font-bold text-gray-900 dark:text-white text-sm flex items-center gap-2">
                            {row.label}
                            {row.timeBucket && (
                              <span
                                className={`px-1.5 py-0.5 rounded text-[9px] uppercase border ${row.timeBucket.color}`}
                              >
                                {row.timeBucket.label}
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-gray-500 font-mono mt-1">
                            {row.code}
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="font-semibold text-gray-900 dark:text-white text-sm">
                            {String(row.startTime).slice(0, 5)} -{" "}
                            {String(row.endTime).slice(0, 5)}
                          </div>
                          <div className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                            <Timer className="w-3 h-3" />{" "}
                            {getDuration(row.startTime, row.endTime)}
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          <span
                            className={`text-sm font-medium ${row.cutoffMinutes === 0 ? "text-red-500 font-bold" : "text-gray-900 dark:text-gray-200"}`}
                          >
                            {getCutoffLabel(row.cutoffMinutes)}
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          {row.isUnlimited ? (
                            <span className="inline-flex px-2 py-0.5 bg-purple-100 text-purple-700 text-xs font-bold rounded">
                              Không giới hạn
                            </span>
                          ) : (
                            <span className="font-bold text-gray-900 dark:text-white">
                              {formatMaxOrders(row.maxOrders)}
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="w-7 h-7 flex items-center justify-center rounded bg-gray-100 dark:bg-gray-800 text-sm font-bold border border-gray-200">
                            {row.sortOrder}
                          </div>
                        </td>
                        <td className="px-5 py-3.5 text-center">
                          <span
                            className={`inline-flex px-2 py-1 rounded text-[10px] font-bold ${statusMap[row.status].className}`}
                          >
                            {statusMap[row.status].label}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <div className="flex justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(
                                  `/admin/shipping/branch-delivery-slots?deliveryTimeSlotId=${row.id}`,
                                );
                              }}
                              className="p-1.5 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded border border-transparent hover:border-indigo-200"
                              title="Chi nhánh dùng slot này"
                            >
                              <Store className="w-4 h-4" />
                            </button>
                            <button
                              onClick={(e) => handleToggleStatus(e, row)}
                              className="p-1.5 text-gray-500 hover:text-yellow-600 hover:bg-yellow-50 rounded border border-transparent hover:border-yellow-200"
                              title="Đổi trạng thái"
                            >
                              <Power className="w-4 h-4" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(
                                  `/admin/shipping/delivery-slots/edit/${row.id}`,
                                );
                              }}
                              className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded border border-transparent hover:border-blue-200"
                              title="Sửa"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={(e) => handleDelete(e, row)}
                              className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded border border-transparent hover:border-red-200"
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
              </div>
            </Card>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-end mt-6">
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
        </>
      )}
    </div>
  );
};

export default DeliveryTimeSlotsPage;
