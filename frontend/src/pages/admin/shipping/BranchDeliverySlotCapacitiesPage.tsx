import React, { useEffect, useMemo, useState } from "react";
import Card from "../../../components/admin/layouts/Card";
import Pagination from "../../../components/admin/common/Pagination";
import {
  Search,
  Plus,
  Edit,
  Trash2,
  Loader2,
  CalendarDays,
  Clock3,
  Power,
  PackageSearch,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  FilterX,
  XCircle,
  Copy,
  LayoutGrid,
  List,
  Store,
  Infinity,
} from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { http } from "../../../services/http";
import { useAdminToast } from "../../../context/AdminToastContext";

// =============================
// TYPES
// =============================
type BranchDeliverySlotCapacityStatus = "active" | "inactive";

interface BranchDeliverySlotCapacity {
  id: number;
  branchId: number;
  deliveryDate: string;
  deliveryTimeSlotId: number;
  maxOrders?: number | null;
  reservedOrders: number;
  status: BranchDeliverySlotCapacityStatus;
  createdAt?: string;
  updatedAt?: string;
}

interface BranchOption {
  id: number;
  name: string;
  code: string;
}

interface DeliveryTimeSlotOption {
  id: number;
  code: string;
  label: string;
  startTime: string;
  endTime: string;
}

type ApiList<T> = {
  success: true;
  data: T[];
  meta?: { total?: number; limit?: number; offset?: number; page?: number };
};

// =============================
// HELPERS & LOGIC
// =============================
const formatTimeRange = (startTime?: string, endTime?: string) => {
  if (!startTime || !endTime) return "—";
  return `${String(startTime).slice(0, 5)} - ${String(endTime).slice(0, 5)}`;
};

const getLocalDateString = (date: Date) => {
  const d = new Date(date);
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 10);
};

const getTodayString = () => getLocalDateString(new Date());

const getNextDayString = (dateStr: string, daysToAdd: number = 1) => {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  d.setDate(d.getDate() + daysToAdd);
  return getLocalDateString(d);
};

const formatDateVN = (dateStr: string) => {
  if (!dateStr) return "";
  const [y, m, d] = dateStr.split("-");
  return `${d}/${m}/${y}`;
};

interface CapacityInsight {
  key: "inactive" | "unlimited" | "full" | "warning" | "available";
  label: string;
  colorClass: string;
  bgClass: string;
  percent: number;
  remaining: number | "∞";
  isCritical: boolean;
}

const analyzeCapacity = (row: BranchDeliverySlotCapacity): CapacityInsight => {
  if (row.status === "inactive") {
    return {
      key: "inactive",
      label: "Tạm dừng",
      colorClass:
        "text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700",
      bgClass: "bg-gray-100 dark:bg-gray-800",
      percent: 0,
      remaining: 0,
      isCritical: false,
    };
  }

  const isUnlimited = row.maxOrders === null || row.maxOrders === undefined;
  const max = row.maxOrders || 0;
  const reserved = Number(row.reservedOrders) || 0;

  if (isUnlimited) {
    return {
      key: "unlimited",
      label: "Không giới hạn",
      colorClass:
        "text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-800",
      bgClass: "bg-purple-50 dark:bg-purple-900/20",
      percent: 0,
      remaining: "∞",
      isCritical: false,
    };
  }

  const remaining = Math.max(0, max - reserved);
  const percent = max > 0 ? Math.min((reserved / max) * 100, 100) : 0;

  if (reserved >= max) {
    return {
      key: "full",
      label: "Slot đã đầy",
      colorClass:
        "text-red-700 dark:text-red-400 border-red-200 dark:border-red-800",
      bgClass: "bg-red-50 dark:bg-red-900/20",
      percent,
      remaining,
      isCritical: true,
    };
  }

  if (percent >= 80) {
    return {
      key: "warning",
      label: "Sắp đầy",
      colorClass:
        "text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-800",
      bgClass: "bg-orange-50 dark:bg-orange-900/20",
      percent,
      remaining,
      isCritical: true,
    };
  }

  return {
    key: "available",
    label: "Còn chỗ",
    colorClass:
      "text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800",
    bgClass: "bg-emerald-50 dark:bg-emerald-900/20",
    percent,
    remaining,
    isCritical: false,
  };
};

// =============================
// MAIN PAGE
// =============================
const BranchDeliverySlotCapacitiesPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { showSuccessToast, showErrorToast } = useAdminToast();

  // --- States ---
  const [rows, setRows] = useState<BranchDeliverySlotCapacity[]>([]);
  const [branches, setBranches] = useState<BranchOption[]>([]);
  const [slots, setSlots] = useState<DeliveryTimeSlotOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [bootstrapLoading, setBootstrapLoading] = useState(true);
  const [error, setError] = useState("");

  const [searchInput, setSearchInput] = useState(searchParams.get("q") || "");
  const [severityFilter, setSeverityFilter] = useState<string>("all");

  // URL Filters
  const statusFilter = searchParams.get("status") || "all";
  const branchFilter = searchParams.get("branchId") || "all";
  const slotFilter = searchParams.get("deliveryTimeSlotId") || "all";
  const deliveryDateFilter = searchParams.get("deliveryDate") || "";
  const currentPage = Number(searchParams.get("page") || 1);
  const [totalPages, setTotalPages] = useState(1);

  // View Mode: Auto switch to board if looking at a specific date
  const [viewMode, setViewMode] = useState<"board" | "table">(
    deliveryDateFilter ? "board" : "table",
  );

  // --- Lookups ---
  const branchMap = useMemo(
    () => new Map(branches.map((x) => [x.id, x])),
    [branches],
  );
  const slotMap = useMemo(() => new Map(slots.map((x) => [x.id, x])), [slots]);

  // --- Data Fetching ---
  const fetchBootstrap = async () => {
    try {
      setBootstrapLoading(true);
      const [branchesRes, slotsRes] = await Promise.all([
        http<any>("GET", "/api/v1/admin/branches?limit=1000&status=active"),
        http<any>(
          "GET",
          "/api/v1/admin/delivery-time-slots?page=1&limit=1000&status=active",
        ),
      ]);
      const branchesData = Array.isArray(branchesRes?.data)
        ? branchesRes.data
        : Array.isArray(branchesRes?.data?.items)
          ? branchesRes.data.items
          : [];
      const slotsData = Array.isArray(slotsRes?.data)
        ? slotsRes.data
        : Array.isArray(slotsRes?.data?.items)
          ? slotsRes.data.items
          : [];
      setBranches(branchesData);
      setSlots(slotsData);
    } catch (err: any) {
      showErrorToast(err?.message || "Không thể tải dữ liệu danh mục.");
    } finally {
      setBootstrapLoading(false);
    }
  };

  const fetchRows = async () => {
    try {
      setLoading(true);
      setError("");

      const limit = 20; // Increased limit for board view better UX
      const offset = (currentPage - 1) * limit;

      let url = `/api/v1/admin/branch-delivery-slot-capacities?limit=${limit}&page=${currentPage}&offset=${offset}`;

      if (statusFilter !== "all")
        url += `&status=${encodeURIComponent(statusFilter)}`;
      if (branchFilter !== "all")
        url += `&branchId=${encodeURIComponent(branchFilter)}`;
      if (slotFilter !== "all")
        url += `&deliveryTimeSlotId=${encodeURIComponent(slotFilter)}`;
      if (deliveryDateFilter.trim())
        url += `&deliveryDate=${encodeURIComponent(deliveryDateFilter.trim())}`;

      const q = searchParams.get("q");
      if (q?.trim()) url += `&q=${encodeURIComponent(q.trim())}`;

      const res = await http<ApiList<BranchDeliverySlotCapacity>>("GET", url);

      if (res?.success && Array.isArray(res.data)) {
        setRows(res.data);
        const total = Number(res.meta?.total ?? 0);
        setTotalPages(Math.max(1, Math.ceil(total / limit)));
      } else {
        setError("Không thể tải danh sách capacity.");
      }
    } catch (err: any) {
      setError(err?.message || "Lỗi tải danh sách capacity.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBootstrap();
  }, []);

  useEffect(() => {
    fetchRows();
  }, [
    currentPage,
    statusFilter,
    branchFilter,
    slotFilter,
    deliveryDateFilter,
    searchParams,
  ]);

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

  useEffect(() => {
    // Auto switch view mode based on date filter presence
    if (deliveryDateFilter && viewMode === "table") setViewMode("board");
  }, [deliveryDateFilter]);

  // --- Derived Data & Metrics ---
  const analyzedRows = useMemo(() => {
    return rows.map((row) => ({
      ...row,
      insight: analyzeCapacity(row),
    }));
  }, [rows]);

  // Apply frontend severity filter
  const displayedRows = useMemo(() => {
    if (severityFilter === "all") return analyzedRows;
    return analyzedRows.filter((r) => r.insight.key === severityFilter);
  }, [analyzedRows, severityFilter]);

  const metrics = useMemo(() => {
    const total = analyzedRows.length;
    let active = 0,
      full = 0,
      warning = 0,
      available = 0,
      unlimited = 0,
      reserved = 0,
      maxFinite = 0;

    analyzedRows.forEach((r) => {
      if (r.status === "active") active++;
      if (r.insight.key === "full") full++;
      if (r.insight.key === "warning") warning++;
      if (r.insight.key === "available") available++;
      if (r.insight.key === "unlimited") unlimited++;

      reserved += Number(r.reservedOrders) || 0;
      if (r.maxOrders) maxFinite += r.maxOrders;
    });

    return {
      total,
      active,
      full,
      warning,
      available,
      unlimited,
      reserved,
      maxFinite,
    };
  }, [analyzedRows]);

  const criticalRows = useMemo(
    () => displayedRows.filter((r) => r.insight.isCritical),
    [displayedRows],
  );

  const groupedByBranch = useMemo(() => {
    const groups = new Map<number, typeof displayedRows>();
    displayedRows.forEach((row) => {
      if (!groups.has(row.branchId)) groups.set(row.branchId, []);
      groups.get(row.branchId)!.push(row);
    });
    return groups;
  }, [displayedRows]);

  // --- Action Handlers ---
  const handleFilterChange = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams);
    if (!value || value === "all") params.delete(key);
    else params.set(key, value);
    params.delete("page");
    setSearchParams(params);
  };

  const setDateFilter = (dateStr: string) =>
    handleFilterChange("deliveryDate", dateStr);

  const stepDate = (direction: 1 | -1) => {
    if (!deliveryDateFilter) return;
    setDateFilter(getNextDayString(deliveryDateFilter, direction));
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Bạn có chắc muốn xóa bản ghi capacity này?")) return;
    try {
      await http(
        "DELETE",
        `/api/v1/admin/branch-delivery-slot-capacities/delete/${id}`,
      );
      showSuccessToast({ message: "Đã xóa thành công!" });
      fetchRows();
    } catch (err: any) {
      showErrorToast(err?.message || "Không thể xóa.");
    }
  };

  const handleToggleStatus = async (row: BranchDeliverySlotCapacity) => {
    const nextStatus = row.status === "active" ? "inactive" : "active";
    try {
      await http(
        "PATCH",
        `/api/v1/admin/branch-delivery-slot-capacities/${row.id}/status`,
        { status: nextStatus },
      );
      showSuccessToast({ message: "Đã cập nhật trạng thái!" });
      fetchRows();
    } catch (err: any) {
      showErrorToast(err?.message || "Không thể cập nhật trạng thái.");
    }
  };

  const buildCreateLink = (opts: {
    branchId?: number;
    slotId?: number;
    date?: string;
  }) => {
    let url = "/admin/shipping/branch-delivery-slot-capacities/create?";
    if (opts.branchId) url += `branchId=${opts.branchId}&`;
    if (opts.slotId) url += `deliveryTimeSlotId=${opts.slotId}&`;
    if (opts.date) url += `deliveryDate=${opts.date}`;
    return url;
  };

  // --- UI Components ---
  const renderProgressBar = (percent: number, insightKey: string) => {
    if (insightKey === "unlimited") {
      return (
        <div className="w-full bg-purple-100 dark:bg-purple-900/30 rounded-full h-1.5 overflow-hidden flex items-center justify-center">
          <div className="w-full bg-purple-300 dark:bg-purple-700/50 h-full opacity-50"></div>
        </div>
      );
    }
    return (
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-300 ${
            percent >= 100
              ? "bg-red-500"
              : percent >= 80
                ? "bg-orange-500"
                : "bg-emerald-500"
          }`}
          style={{ width: `${Math.min(percent, 100)}%` }}
        ></div>
      </div>
    );
  };

  return (
    <div className="w-full pb-10 space-y-6">
      {/* Tầng A: Header / Command Bar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Bảng điều độ giới hạn nhận đơn
            </h1>
            {deliveryDateFilter && (
              <span className="px-2.5 py-1 bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300 text-xs font-bold rounded-md">
                Điều độ ngày: {formatDateVN(deliveryDateFilter)}
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Theo dõi, điều chỉnh và xử lý sức chứa đơn hàng theo ngày, chi nhánh
            và khung giờ.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <button
            onClick={() => setDateFilter(getTodayString())}
            className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition"
          >
            Hôm nay
          </button>
          <button
            onClick={() => setDateFilter(getNextDayString(getTodayString(), 1))}
            className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition"
          >
            Ngày mai
          </button>
          <button
            onClick={() => fetchRows()}
            className="p-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition"
          >
            <Clock3 className="w-5 h-5" />
          </button>
          <button
            onClick={() =>
              navigate("/admin/shipping/branch-delivery-slot-capacities/create")
            }
            className="flex items-center gap-2 px-5 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition shadow-sm ml-auto md:ml-2"
          >
            <Plus className="w-4 h-4" /> Tạo capacity
          </button>
        </div>
      </div>

      {/* Tầng B: Date Scope Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-gray-50 dark:bg-gray-800/50 p-3 rounded-xl border border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto hide-scrollbar">
          <button
            onClick={() => setDateFilter(getTodayString())}
            className={`whitespace-nowrap px-4 py-1.5 rounded-full text-sm font-medium transition ${deliveryDateFilter === getTodayString() ? "bg-blue-600 text-white shadow-sm" : "bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-600"}`}
          >
            Hôm nay
          </button>
          <button
            onClick={() => setDateFilter(getNextDayString(getTodayString(), 1))}
            className={`whitespace-nowrap px-4 py-1.5 rounded-full text-sm font-medium transition ${deliveryDateFilter === getNextDayString(getTodayString(), 1) ? "bg-blue-600 text-white shadow-sm" : "bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-600"}`}
          >
            Ngày mai
          </button>
          <div className="w-px h-5 bg-gray-300 dark:bg-gray-600 mx-1"></div>
          {deliveryDateFilter && (
            <>
              <button
                onClick={() => stepDate(-1)}
                className="p-1.5 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-md hover:bg-gray-50"
              >
                <ChevronLeft className="w-4 h-4 text-gray-600 dark:text-gray-300" />
              </button>
              <input
                type="date"
                value={deliveryDateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="px-3 py-1.5 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-md text-sm font-semibold text-gray-800 dark:text-white outline-none"
              />
              <button
                onClick={() => stepDate(1)}
                className="p-1.5 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-md hover:bg-gray-50"
              >
                <ChevronRight className="w-4 h-4 text-gray-600 dark:text-gray-300" />
              </button>
            </>
          )}
          {!deliveryDateFilter && (
            <input
              type="date"
              value=""
              onChange={(e) => setDateFilter(e.target.value)}
              className="px-3 py-1.5 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-md text-sm font-medium text-gray-500 outline-none"
              title="Chọn ngày cụ thể"
            />
          )}
        </div>
        {deliveryDateFilter && (
          <button
            onClick={() => setDateFilter("")}
            className="flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-red-500 transition whitespace-nowrap"
          >
            <FilterX className="w-3.5 h-3.5" /> Xem tất cả ngày
          </button>
        )}
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        {[
          {
            key: "all",
            label: "Tổng record",
            value: metrics.total,
            icon: PackageSearch,
            color: "text-blue-600",
            bg: "bg-blue-50",
          },
          {
            key: "active",
            label: "Đang hoạt động",
            value: metrics.active,
            icon: CheckCircle2,
            color: "text-green-600",
            bg: "bg-green-50",
          },
          {
            key: "full",
            label: "Slot đã đầy",
            value: metrics.full,
            icon: AlertTriangle,
            color: "text-red-600",
            bg: "bg-red-50",
          },
          {
            key: "warning",
            label: "Sắp đầy",
            value: metrics.warning,
            icon: TrendingUp,
            color: "text-orange-600",
            bg: "bg-orange-50",
          },
          {
            key: "unlimited",
            label: "Không giới hạn",
            value: metrics.unlimited,
            icon: Infinity,
            color: "text-purple-600",
            bg: "bg-purple-50",
          },
          {
            key: "reserved",
            label: "Tổng đã giữ",
            value: metrics.reserved.toLocaleString("vi-VN"),
            icon: CalendarDays,
            color: "text-slate-600",
            bg: "bg-slate-100",
          },
        ].map((kpi) => (
          <div
            key={kpi.key}
            onClick={() =>
              kpi.key !== "reserved" &&
              kpi.key !== "active" &&
              kpi.key !== "all"
                ? setSeverityFilter(kpi.key)
                : undefined
            }
            className={`p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 flex flex-col justify-center ${kpi.key !== "reserved" && kpi.key !== "active" && kpi.key !== "all" ? "cursor-pointer hover:border-blue-400 hover:shadow-sm" : ""}`}
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

      {/* Day Overview (Show only if 1 day selected) */}
      {deliveryDateFilter && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-800 border border-blue-100 dark:border-gray-700 p-5 rounded-xl shadow-sm">
          <div className="flex flex-col md:flex-row justify-between md:items-end gap-4">
            <div className="flex-1 w-full max-w-2xl">
              <h3 className="text-sm font-bold text-blue-900 dark:text-blue-300 mb-3">
                Tổng quan sức chứa ngày {formatDateVN(deliveryDateFilter)}
              </h3>
              <div className="flex justify-between text-sm mb-1.5">
                <span className="font-semibold text-gray-700 dark:text-gray-300">
                  Tỉ lệ lấp đầy (hữu hạn)
                </span>
                <span className="font-black text-gray-900 dark:text-white">
                  {metrics.maxFinite > 0
                    ? Math.min(
                        Math.round(
                          (metrics.reserved / metrics.maxFinite) * 100,
                        ),
                        100,
                      )
                    : 0}
                  %
                </span>
              </div>
              <div className="w-full bg-blue-200 dark:bg-gray-700 rounded-full h-2.5 overflow-hidden">
                <div
                  className="bg-blue-600 h-full rounded-full transition-all"
                  style={{
                    width: `${metrics.maxFinite > 0 ? Math.min((metrics.reserved / metrics.maxFinite) * 100, 100) : 0}%`,
                  }}
                ></div>
              </div>
              <div className="flex justify-between text-xs text-gray-500 mt-2">
                <span>
                  Đã đặt:{" "}
                  <strong>{metrics.reserved.toLocaleString("vi-VN")}</strong>
                </span>
                <span>
                  Tối đa:{" "}
                  <strong>{metrics.maxFinite.toLocaleString("vi-VN")}</strong>
                </span>
              </div>
            </div>
            <div className="flex gap-2 shrink-0">
              <button
                onClick={() =>
                  navigate(buildCreateLink({ date: deliveryDateFilter }))
                }
                className="px-3 py-1.5 bg-white text-blue-700 border border-blue-200 text-xs font-bold rounded shadow-sm hover:bg-blue-50"
              >
                Tạo slot cho ngày này
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Overloaded Warning Section */}
      {!loading && criticalRows.length > 0 && severityFilter === "all" && (
        <Card className="border-orange-200 dark:border-orange-900/50 flex flex-col overflow-hidden">
          <div className="p-4 bg-orange-50/50 dark:bg-orange-900/20 border-b border-orange-100 dark:border-orange-900/50 flex justify-between items-center">
            <h3 className="font-bold text-orange-800 dark:text-orange-400 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" /> Cần xử lý ngay (
              {criticalRows.length} slot)
            </h3>
            <button
              onClick={() => setSeverityFilter("full")}
              className="text-sm font-semibold text-orange-600 hover:text-orange-700"
            >
              Lọc chi tiết
            </button>
          </div>
          <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {criticalRows.slice(0, 6).map((row) => (
              <div
                key={row.id}
                className={`p-3 rounded-lg border flex flex-col gap-2 ${row.insight.bgClass} ${row.insight.colorClass}`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-bold text-sm truncate">
                      {branchMap.get(row.branchId)?.name || "Chi nhánh"}
                    </div>
                    <div className="text-xs mt-0.5 opacity-80">
                      {slotMap.get(row.deliveryTimeSlotId)?.label} (
                      {row.deliveryDate})
                    </div>
                  </div>
                  <span className="px-2 py-0.5 bg-white/60 dark:bg-black/20 rounded text-[10px] font-bold uppercase">
                    {row.insight.label}
                  </span>
                </div>
                <div>
                  {renderProgressBar(row.insight.percent, row.insight.key)}
                  <div className="flex justify-between text-[10px] mt-1 font-semibold opacity-90">
                    <span>
                      {row.reservedOrders}/{row.maxOrders} đơn
                    </span>
                    <span>Còn: {row.insight.remaining}</span>
                  </div>
                </div>
                <div className="flex gap-2 mt-1">
                  <button
                    onClick={() =>
                      navigate(
                        `/admin/shipping/branch-delivery-slot-capacities/edit/${row.id}`,
                      )
                    }
                    className="flex-1 py-1.5 bg-white/60 dark:bg-black/20 hover:bg-white dark:hover:bg-black/40 rounded text-xs font-bold transition"
                  >
                    Nới rộng
                  </button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Main Filter Bar */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col gap-4">
        {/* Primary Row: Quick Severity Filters & Search */}
        <div className="flex flex-col lg:flex-row justify-between gap-4 border-b border-gray-100 dark:border-gray-700 pb-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 mr-2 flex items-center gap-1.5">
              <FilterX className="w-4 h-4" /> Mức tải:
            </span>
            {[
              {
                id: "all",
                label: "Tất cả",
                activeClass:
                  "bg-blue-600 text-white border-blue-600 dark:bg-blue-500 dark:border-blue-500 shadow-sm",
              },
              {
                id: "full",
                label: "Đã đầy",
                activeClass:
                  "bg-red-600 text-white border-red-600 dark:bg-red-500 dark:border-red-500 shadow-sm",
              },
              {
                id: "warning",
                label: "Sắp đầy",
                activeClass:
                  "bg-orange-600 text-white border-orange-600 dark:bg-orange-500 dark:border-orange-500 shadow-sm",
              },
              {
                id: "available",
                label: "Còn chỗ",
                activeClass:
                  "bg-emerald-600 text-white border-emerald-600 dark:bg-emerald-500 dark:border-emerald-500 shadow-sm",
              },
              {
                id: "unlimited",
                label: "Không giới hạn",
                activeClass:
                  "bg-purple-600 text-white border-purple-600 dark:bg-purple-500 dark:border-purple-500 shadow-sm",
              },
              {
                id: "inactive",
                label: "Tạm dừng",
                activeClass:
                  "bg-gray-700 text-white border-gray-700 dark:bg-gray-500 dark:border-gray-500",
              },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setSeverityFilter(f.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-colors ${
                  severityFilter === f.id
                    ? f.activeClass
                    : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:border-gray-300"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div className="relative w-full lg:w-72">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm theo chi nhánh, mã..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full pl-9 pr-8 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {searchInput && (
              <button
                onClick={() => setSearchInput("")}
                className="absolute right-2 top-2.5 text-gray-400 hover:text-gray-600"
              >
                <XCircle className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Secondary Row: Advanced Filters & View Toggle */}
        <div className="flex flex-col lg:flex-row justify-between items-center gap-4">
          <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
            <select
              value={branchFilter}
              onChange={(e) => handleFilterChange("branchId", e.target.value)}
              disabled={bootstrapLoading}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white min-w-[200px]"
            >
              <option value="all">Mọi chi nhánh</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
            <select
              value={slotFilter}
              onChange={(e) =>
                handleFilterChange("deliveryTimeSlotId", e.target.value)
              }
              disabled={bootstrapLoading}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white min-w-[180px]"
            >
              <option value="all">Mọi khung giờ</option>
              {slots.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
            <select
              value={statusFilter}
              onChange={(e) => handleFilterChange("status", e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white"
            >
              <option value="all">Mọi trạng thái</option>
              <option value="active">Hoạt động</option>
              <option value="inactive">Tạm dừng</option>
            </select>
          </div>

          <div className="flex bg-gray-100 dark:bg-gray-900 p-1 rounded-lg shrink-0">
            <button
              onClick={() => setViewMode("board")}
              className={`p-1.5 rounded-md flex items-center gap-1.5 text-sm font-medium transition ${viewMode === "board" ? "bg-white dark:bg-gray-700 shadow-sm text-blue-600 dark:text-blue-400" : "text-gray-500 hover:text-gray-700"}`}
            >
              <LayoutGrid className="w-4 h-4" /> Theo chi nhánh
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

      {/* Main Content Area */}
      {loading || bootstrapLoading ? (
        <div className="flex flex-col justify-center items-center py-24 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <p className="mt-3 text-gray-500 font-medium">
            Đang tải bảng điều độ...
          </p>
        </div>
      ) : error ? (
        <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          <AlertTriangle className="w-10 h-10 text-red-500 mx-auto mb-3" />
          <p className="text-red-600 font-medium">{error}</p>
        </div>
      ) : displayedRows.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-xl border border-dashed border-gray-300 dark:border-gray-600 flex flex-col items-center">
          <CalendarDays className="w-12 h-12 text-gray-300 dark:text-gray-600 mb-4" />
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">
            Không có dữ liệu phù hợp
          </h3>
          <p className="text-sm text-gray-500 mt-1 mb-5">
            Thử đổi ngày, bỏ bớt bộ lọc hoặc tạo mới capacity.
          </p>
          <div className="flex gap-3">
            <button
              onClick={() =>
                navigate(
                  "/admin/shipping/branch-delivery-slot-capacities/create",
                )
              }
              className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition"
            >
              Tạo capacity
            </button>
            {severityFilter !== "all" && (
              <button
                onClick={() => setSeverityFilter("all")}
                className="px-4 py-2 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition"
              >
                Bỏ lọc mức tải
              </button>
            )}
          </div>
        </div>
      ) : (
        <>
          <p className="text-sm text-gray-500 font-medium pl-1">
            Hiển thị {displayedRows.length} kết quả ở trang hiện tại
          </p>

          {viewMode === "board" ? (
            <div className="space-y-6">
              {Array.from(groupedByBranch.entries()).map(
                ([branchId, branchRows]) => {
                  const branch = branchMap.get(branchId);
                  const bFull = branchRows.filter(
                    (r) => r.insight.key === "full",
                  ).length;
                  const bWarn = branchRows.filter(
                    (r) => r.insight.key === "warning",
                  ).length;
                  const headerColor =
                    bFull > 0
                      ? "bg-red-50 border-red-200 dark:bg-red-900/10 dark:border-red-900/30"
                      : bWarn > 0
                        ? "bg-orange-50 border-orange-200 dark:bg-orange-900/10 dark:border-orange-900/30"
                        : "bg-gray-50 border-gray-200 dark:bg-gray-800 dark:border-gray-700";

                  return (
                    <Card
                      key={branchId}
                      className="overflow-hidden p-0 border border-gray-200 dark:border-gray-700"
                    >
                      <div
                        className={`p-4 border-b flex flex-col md:flex-row justify-between md:items-center gap-3 ${headerColor}`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-white dark:bg-gray-900 rounded-lg shadow-sm">
                            <Store className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                          </div>
                          <div>
                            <h3 className="font-bold text-gray-900 dark:text-white text-base leading-tight">
                              {branch?.name || `ID: ${branchId}`}
                            </h3>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                              {branchRows.length} slots hiển thị
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2 text-xs font-bold">
                          {bFull > 0 && (
                            <span className="px-2 py-1 bg-red-100 text-red-700 rounded-md border border-red-200">
                              {bFull} đã đầy
                            </span>
                          )}
                          {bWarn > 0 && (
                            <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded-md border border-orange-200">
                              {bWarn} sắp đầy
                            </span>
                          )}
                          <button
                            onClick={() =>
                              navigate(
                                buildCreateLink({
                                  branchId,
                                  date: deliveryDateFilter,
                                }),
                              )
                            }
                            className="px-3 py-1 bg-white border border-gray-200 text-blue-600 rounded-md shadow-sm hover:bg-gray-50 ml-2"
                          >
                            Thêm slot
                          </button>
                        </div>
                      </div>
                      <div className="p-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 bg-white dark:bg-gray-900">
                        {branchRows.map((row) => (
                          <div
                            key={row.id}
                            className="border border-gray-100 dark:border-gray-700 rounded-xl p-4 hover:border-blue-300 dark:hover:border-blue-700 transition shadow-sm group"
                          >
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <div className="font-bold text-sm text-gray-900 dark:text-white">
                                  {slotMap.get(row.deliveryTimeSlotId)?.label}
                                </div>
                                <div className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                                  <Clock3 className="w-3 h-3" />{" "}
                                  {formatTimeRange(
                                    slotMap.get(row.deliveryTimeSlotId)
                                      ?.startTime,
                                    slotMap.get(row.deliveryTimeSlotId)
                                      ?.endTime,
                                  )}
                                </div>
                              </div>
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold border ${row.insight.colorClass} ${row.insight.bgClass}`}
                              >
                                {row.insight.label}
                              </span>
                            </div>

                            <div className="my-3">
                              <div className="flex justify-between items-end mb-1">
                                <span className="text-xs text-gray-500 font-medium">
                                  Reserved:{" "}
                                  <strong className="text-gray-900 dark:text-white text-sm">
                                    {row.reservedOrders}
                                  </strong>
                                </span>
                                <span className="text-[10px] text-gray-500">
                                  Max:{" "}
                                  {row.maxOrders == null ? "∞" : row.maxOrders}
                                </span>
                              </div>
                              {renderProgressBar(
                                row.insight.percent,
                                row.insight.key,
                              )}
                              <div className="text-[10px] font-semibold text-gray-500 mt-1 text-right">
                                Còn lại: {row.insight.remaining}
                              </div>
                            </div>

                            <div className="flex justify-between items-center pt-3 border-t border-gray-100 dark:border-gray-800">
                              <span className="text-[10px] text-gray-400 font-medium">
                                {formatDateVN(row.deliveryDate)}
                              </span>
                              <div className="flex gap-1">
                                <button
                                  onClick={() =>
                                    navigate(
                                      buildCreateLink({
                                        branchId,
                                        slotId: row.deliveryTimeSlotId,
                                        date: getNextDayString(
                                          row.deliveryDate,
                                          1,
                                        ),
                                      }),
                                    )
                                  }
                                  className="p-1.5 text-gray-400 hover:text-indigo-600 bg-gray-50 hover:bg-indigo-50 rounded"
                                  title="Nhân bản sang ngày kế tiếp"
                                >
                                  <Copy className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleToggleStatus(row)}
                                  className={`p-1.5 rounded ${row.status === "active" ? "text-yellow-600 bg-yellow-50 hover:bg-yellow-100" : "text-green-600 bg-green-50 hover:bg-green-100"}`}
                                  title={
                                    row.status === "active" ? "Tạm dừng" : "Bật"
                                  }
                                >
                                  <Power className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() =>
                                    navigate(
                                      `/admin/shipping/branch-delivery-slot-capacities/edit/${row.id}`,
                                    )
                                  }
                                  className="p-1.5 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded"
                                  title="Sửa"
                                >
                                  <Edit className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </Card>
                  );
                },
              )}
            </div>
          ) : (
            <Card className="!p-0 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th className="px-5 py-3.5 text-left text-xs font-bold text-gray-500 uppercase">
                        Ngày giao
                      </th>
                      <th className="px-5 py-3.5 text-left text-xs font-bold text-gray-500 uppercase">
                        Chi nhánh
                      </th>
                      <th className="px-5 py-3.5 text-left text-xs font-bold text-gray-500 uppercase">
                        Khung giờ
                      </th>
                      <th className="px-5 py-3.5 text-left text-xs font-bold text-gray-500 uppercase w-48">
                        Mức tải
                      </th>
                      <th className="px-5 py-3.5 text-left text-xs font-bold text-gray-500 uppercase">
                        Trạng thái
                      </th>
                      <th className="px-5 py-3.5 text-right text-xs font-bold text-gray-500 uppercase">
                        Hành động
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-100 dark:divide-gray-800">
                    {displayedRows.map((row) => {
                      const branch = branchMap.get(row.branchId);
                      const slot = slotMap.get(row.deliveryTimeSlotId);
                      return (
                        <tr
                          key={row.id}
                          className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group"
                        >
                          <td className="px-5 py-3">
                            <div className="font-semibold text-gray-900 dark:text-white">
                              {row.deliveryDate}
                            </div>
                            {row.deliveryDate === getTodayString() && (
                              <div className="text-[10px] font-bold text-blue-600">
                                Hôm nay
                              </div>
                            )}
                          </td>
                          <td className="px-5 py-3">
                            <div className="font-semibold text-gray-900 dark:text-white text-sm">
                              {branch?.name}
                            </div>
                            <div className="text-xs text-gray-500 font-mono mt-0.5">
                              {branch?.code}
                            </div>
                          </td>
                          <td className="px-5 py-3">
                            <div className="font-semibold text-gray-900 dark:text-white text-sm">
                              {slot?.label}
                            </div>
                            <div className="text-xs text-gray-500 mt-0.5">
                              {formatTimeRange(slot?.startTime, slot?.endTime)}
                            </div>
                          </td>
                          <td className="px-5 py-3">
                            <div className="flex justify-between items-end mb-1">
                              <span className="text-xs font-bold">
                                {row.reservedOrders} /{" "}
                                {row.maxOrders == null ? "∞" : row.maxOrders}
                              </span>
                              <span
                                className={`px-1.5 py-0.5 rounded text-[9px] font-bold border ${row.insight.colorClass} ${row.insight.bgClass}`}
                              >
                                {row.insight.label}
                              </span>
                            </div>
                            {renderProgressBar(
                              row.insight.percent,
                              row.insight.key,
                            )}
                          </td>
                          <td className="px-5 py-3">
                            <span
                              className={`inline-flex px-2 py-1 rounded text-xs font-bold ${row.status === "active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}
                            >
                              {row.status === "active"
                                ? "Hoạt động"
                                : "Tạm dừng"}
                            </span>
                          </td>
                          <td className="px-5 py-3 text-right">
                            <div className="flex justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() =>
                                  navigate(
                                    buildCreateLink({
                                      branchId: row.branchId,
                                      slotId: row.deliveryTimeSlotId,
                                      date: getNextDayString(
                                        row.deliveryDate,
                                        1,
                                      ),
                                    }),
                                  )
                                }
                                className="p-1.5 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded"
                                title="Nhân bản ngày mai"
                              >
                                <Copy className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleToggleStatus(row)}
                                className="p-1.5 text-gray-500 hover:text-yellow-600 hover:bg-yellow-50 rounded"
                                title="Đổi trạng thái"
                              >
                                <Power className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() =>
                                  navigate(
                                    `/admin/shipping/branch-delivery-slot-capacities/edit/${row.id}`,
                                  )
                                }
                                className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded"
                                title="Sửa"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(row.id)}
                                className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded"
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
              </div>
            </Card>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-end mt-4">
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

export default BranchDeliverySlotCapacitiesPage;
