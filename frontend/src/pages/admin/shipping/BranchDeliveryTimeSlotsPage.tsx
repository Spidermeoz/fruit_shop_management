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
  Store,
  Power,
  PowerOff,
  Settings2,
  CheckCircle2,
  AlertCircle,
  LayoutGrid,
  List,
  CalendarDays,
  AlertTriangle,
  RefreshCw,
  ShieldAlert,
  Layers,
} from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { http } from "../../../services/http";
import { useAdminToast } from "../../../context/AdminToastContext";

// =============================
// TYPES
// =============================
type BranchDeliveryTimeSlotStatus = "active" | "inactive";

interface BranchDeliveryTimeSlot {
  id: number;
  branchId: number;
  deliveryTimeSlotId: number;
  maxOrdersOverride?: number | null;
  status: BranchDeliveryTimeSlotStatus;
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
  | "override"
  | "no_override"
  | "morning"
  | "afternoon"
  | "evening";

// =============================
// HELPERS & LOGIC
// =============================
const statusMap: Record<
  BranchDeliveryTimeSlotStatus,
  { label: string; className: string; textClass: string }
> = {
  active: {
    label: "Đang hoạt động",
    className:
      "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border border-green-200 dark:border-green-800",
    textClass: "text-green-600 dark:text-green-400",
  },
  inactive: {
    label: "Tạm dừng",
    className:
      "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 border border-gray-200 dark:border-gray-700",
    textClass: "text-gray-500 dark:text-gray-400",
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

const getTimeInsight = (startTime?: string) => {
  if (!startTime) return null;
  const hour = parseInt(startTime.split(":")[0], 10);
  if (isNaN(hour)) return null;
  if (hour < 12)
    return {
      label: "Buổi sáng",
      key: "morning",
      color:
        "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800",
    };
  if (hour < 18)
    return {
      label: "Buổi chiều",
      key: "afternoon",
      color:
        "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800",
    };
  return {
    label: "Buổi tối",
    key: "evening",
    color:
      "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-400 dark:border-indigo-800",
  };
};

const getLocalDateString = () => {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 10);
};

// =============================
// MAIN PAGE
// =============================
const BranchDeliveryTimeSlotsPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { showSuccessToast, showErrorToast } = useAdminToast();

  // --- States ---
  const [rows, setRows] = useState<BranchDeliveryTimeSlot[]>([]);
  const [summaryRows, setSummaryRows] = useState<BranchDeliveryTimeSlot[]>([]);
  const [branches, setBranches] = useState<BranchOption[]>([]);
  const [slots, setSlots] = useState<DeliveryTimeSlotOption[]>([]);

  const [loading, setLoading] = useState(false);
  const [bootstrapLoading, setBootstrapLoading] = useState(true);
  const [error, setError] = useState("");

  const [searchInput, setSearchInput] = useState(searchParams.get("q") || "");
  const [quickFilter, setQuickFilter] = useState<QuickFilterType>("all");
  const [viewMode, setViewMode] = useState<"board" | "table">("board");

  // URL Filters
  const statusFilter = searchParams.get("status") || "all";
  const branchFilter = searchParams.get("branchId") || "all";
  const slotFilter = searchParams.get("deliveryTimeSlotId") || "all";
  const currentPage = Number(searchParams.get("page") || 1);
  const [totalPages, setTotalPages] = useState(1);

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

  const fetchSummaryRows = async () => {
    try {
      let page = 1;
      const limit = 1000;
      let allItems: BranchDeliveryTimeSlot[] = [];
      let keepFetching = true;

      while (keepFetching) {
        const url = `/api/v1/admin/branch-delivery-time-slots?page=${page}&limit=${limit}`;
        const res = await http<ApiList<BranchDeliveryTimeSlot>>("GET", url);

        if (!res?.success) break;

        if (Array.isArray(res.data)) {
          allItems = [...allItems, ...res.data];
          const total = Number(res.meta?.total ?? allItems.length);
          keepFetching = allItems.length < total;
        } else {
          const items = Array.isArray(res.data?.items) ? res.data.items : [];
          const totalPages = Number(res.data?.pagination?.totalPages ?? page);
          allItems = [...allItems, ...items];
          keepFetching = page < totalPages;
        }

        page += 1;
      }

      setSummaryRows(allItems);
    } catch (err: any) {
      console.error(
        "Không thể tải dữ liệu tổng quan branch delivery slots",
        err,
      );
    }
  };

  const fetchRows = async () => {
    try {
      setLoading(true);
      setError("");

      const limit = 20; // Tăng limit lên 20 cho board mode dễ nhìn
      let url = `/api/v1/admin/branch-delivery-time-slots?page=${currentPage}&limit=${limit}`;

      if (statusFilter !== "all")
        url += `&status=${encodeURIComponent(statusFilter)}`;
      if (branchFilter !== "all")
        url += `&branchId=${encodeURIComponent(branchFilter)}`;
      if (slotFilter !== "all")
        url += `&deliveryTimeSlotId=${encodeURIComponent(slotFilter)}`;

      const q = searchParams.get("q");
      if (q?.trim()) url += `&keyword=${encodeURIComponent(q.trim())}`;

      const res = await http<ApiList<BranchDeliveryTimeSlot>>("GET", url);

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
        setError("Không thể tải danh sách cấu hình khung giờ chi nhánh.");
      }
    } catch (err: any) {
      setError(err?.message || "Lỗi tải danh sách cấu hình khung giờ.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBootstrap();
    fetchSummaryRows();
  }, []);

  useEffect(() => {
    fetchRows();
  }, [currentPage, statusFilter, branchFilter, slotFilter, searchParams]);

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

  // --- Derived Models & Logic ---
  const enrichedRows = useMemo(() => {
    return rows.map((row) => {
      const slot = slotMap.get(row.deliveryTimeSlotId);
      return {
        ...row,
        branch: branchMap.get(row.branchId),
        slot: slot,
        timeInsight: getTimeInsight(slot?.startTime),
        isOverride:
          row.maxOrdersOverride !== null && row.maxOrdersOverride !== undefined,
      };
    });
  }, [rows, branchMap, slotMap]);

  const summaryEnrichedRows = useMemo(() => {
    return summaryRows.map((row) => {
      const slot = slotMap.get(row.deliveryTimeSlotId);
      return {
        ...row,
        branch: branchMap.get(row.branchId),
        slot,
        timeInsight: getTimeInsight(slot?.startTime),
        isOverride:
          row.maxOrdersOverride !== null && row.maxOrdersOverride !== undefined,
      };
    });
  }, [summaryRows, branchMap, slotMap]);

  const displayedRows = useMemo(() => {
    if (quickFilter === "all") return enrichedRows;
    return enrichedRows.filter((row) => {
      if (quickFilter === "active") return row.status === "active";
      if (quickFilter === "inactive") return row.status === "inactive";
      if (quickFilter === "override") return row.isOverride;
      if (quickFilter === "no_override") return !row.isOverride;
      if (quickFilter === "morning") return row.timeInsight?.key === "morning";
      if (quickFilter === "afternoon")
        return row.timeInsight?.key === "afternoon";
      if (quickFilter === "evening") return row.timeInsight?.key === "evening";
      return true;
    });
  }, [enrichedRows, quickFilter]);

  const groupedByBranch = useMemo(() => {
    const groups = new Map<number, typeof displayedRows>();
    displayedRows.forEach((row) => {
      if (!groups.has(row.branchId)) groups.set(row.branchId, []);
      groups.get(row.branchId)!.push(row);
    });
    return groups;
  }, [displayedRows]);

  // --- Metrics ---
  const metrics = useMemo(() => {
    const total = summaryEnrichedRows.length;
    let active = 0,
      inactive = 0,
      override = 0;
    const configuredBranchIds = new Set<number>();
    const activeBranchIds = new Set<number>();

    summaryEnrichedRows.forEach((r) => {
      configuredBranchIds.add(r.branchId);

      if (r.status === "active") {
        active++;
        activeBranchIds.add(r.branchId);
      } else {
        inactive++;
      }

      if (r.isOverride) override++;
    });

    const branchesMissingSlots = branches.filter(
      (b) => !activeBranchIds.has(b.id),
    );

    return {
      total,
      active,
      inactive,
      override,
      configuredCount: configuredBranchIds.size,
      branchesMissingSlots,
    };
  }, [summaryEnrichedRows, branches]);

  // --- Actions ---
  const handleFilterChange = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value === "all") params.delete(key);
    else params.set(key, value);
    params.delete("page");
    setSearchParams(params);
  };

  const handleDelete = async (
    e: React.MouseEvent,
    row: BranchDeliveryTimeSlot,
  ) => {
    e.stopPropagation();
    const branchName =
      branchMap.get(row.branchId)?.name || `Chi nhánh #${row.branchId}`;
    const slotName =
      slotMap.get(row.deliveryTimeSlotId)?.label ||
      `Slot #${row.deliveryTimeSlotId}`;

    if (
      !window.confirm(
        `Bạn có chắc muốn xóa cấu hình khung giờ "${slotName}" khỏi "${branchName}"?`,
      )
    )
      return;

    try {
      await http(
        "DELETE",
        `/api/v1/admin/branch-delivery-time-slots/delete/${row.id}`,
      );
      showSuccessToast({ message: "Đã xóa cấu hình thành công!" });
      await Promise.all([fetchRows(), fetchSummaryRows()]);
    } catch (err: any) {
      showErrorToast(err?.message || "Không thể xóa cấu hình.");
    }
  };

  const handleEdit = (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    navigate(`/admin/shipping/branch-delivery-slots/edit/${id}`);
  };

  const handleToggleStatus = async (
    e: React.MouseEvent,
    row: BranchDeliveryTimeSlot,
  ) => {
    e.stopPropagation();
    const nextStatus = row.status === "active" ? "inactive" : "active";
    try {
      await http(
        "PATCH",
        `/api/v1/admin/branch-delivery-time-slots/${row.id}/status`,
        { status: nextStatus },
      );
      showSuccessToast({ message: "Cập nhật trạng thái thành công!" });
      await Promise.all([fetchRows(), fetchSummaryRows()]);
    } catch (err: any) {
      showErrorToast(err?.message || "Không thể cập nhật trạng thái.");
    }
  };

  // --- Navigation Prefill Helpers ---
  const buildCapacityUrl = (opts: {
    branchId?: number;
    slotId?: number;
    date?: string;
  }) => {
    let url = "/admin/shipping/branch-delivery-slot-capacities?";
    if (opts.branchId) url += `branchId=${opts.branchId}&`;
    if (opts.slotId) url += `deliveryTimeSlotId=${opts.slotId}&`;
    if (opts.date) url += `deliveryDate=${opts.date}`;
    return url;
  };

  const buildCreateCapacityUrl = (branchId: number, slotId: number) => {
    return `/admin/shipping/branch-delivery-slot-capacities/create?branchId=${branchId}&deliveryTimeSlotId=${slotId}&deliveryDate=${getLocalDateString()}`;
  };

  return (
    <div className="w-full pb-10 space-y-6">
      {/* Tầng A: Header / Command Bar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Khung giờ chi nhánh
            </h1>
            {metrics.override > 0 && (
              <span className="px-2.5 py-1 bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300 text-xs font-bold rounded-md">
                {metrics.override} slot ghi đè
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Bật hoặc tắt các khung giờ hệ thống cho từng chi nhánh và tùy chỉnh
            giới hạn nhận đơn mặc định.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <button
            onClick={() => {
              fetchRows();
              fetchSummaryRows();
            }}
            className="p-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition"
            title="Làm mới"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
          <button
            onClick={() => navigate("/admin/shipping/delivery-slots")}
            className="px-4 py-2 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600 text-sm font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition"
          >
            Mở Slot hệ thống
          </button>
          <button
            onClick={() =>
              navigate(
                `/admin/shipping/branch-delivery-slot-capacities?deliveryDate=${getLocalDateString()}`,
              )
            }
            className="px-4 py-2 bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 text-sm font-medium rounded-lg hover:bg-indigo-100 transition"
          >
            Xem Capacity hôm nay
          </button>
          <button
            onClick={() =>
              navigate("/admin/shipping/branch-delivery-slots/create")
            }
            className="flex items-center gap-2 px-5 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition shadow-sm ml-auto md:ml-0"
          >
            <Plus className="w-4 h-4" /> Bật slot cho chi nhánh
          </button>
        </div>
      </div>

      {/* Tầng B: KPI Strip */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        {[
          {
            label: "Tổng cấu hình",
            value: metrics.total,
            icon: Layers,
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
            label: "Có Override",
            value: metrics.override,
            icon: Settings2,
            color: "text-amber-600",
            bg: "bg-amber-50",
          },
          {
            label: "Chi nhánh đã có slot",
            value: metrics.configuredCount,
            icon: Store,
            color: "text-indigo-600",
            bg: "bg-indigo-50",
          },
          {
            label: "Đang tạm dừng",
            value: metrics.inactive,
            icon: PowerOff,
            color: "text-gray-600",
            bg: "bg-gray-100",
          },
          {
            label: "Cần bổ sung slot",
            value: metrics.branchesMissingSlots.length,
            icon: AlertCircle,
            color: "text-red-600",
            bg: "bg-red-50",
            isWarning: true,
          },
        ].map((kpi, idx) => (
          <div
            key={idx}
            onClick={() => {
              if (kpi.label === "Có Override") setQuickFilter("override");
              if (kpi.label === "Đang hoạt động") setQuickFilter("active");
              if (kpi.label === "Đang tạm dừng") setQuickFilter("inactive");
              if (kpi.isWarning && metrics.branchesMissingSlots.length > 0) {
                document
                  .getElementById("attention-section")
                  ?.scrollIntoView({ behavior: "smooth" });
              }
            }}
            className={`p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 flex flex-col justify-center ${kpi.label !== "Tổng cấu hình" && kpi.label !== "Chi nhánh đã có slot" ? "cursor-pointer hover:border-blue-400 hover:shadow-sm transition-all" : ""}`}
          >
            <div className="flex items-center gap-2 mb-2">
              <kpi.icon className={`w-4 h-4 ${kpi.color}`} />
              <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 truncate">
                {kpi.label}
              </span>
            </div>
            <div
              className={`text-xl font-black ${kpi.isWarning && kpi.value > 0 ? "text-red-600 dark:text-red-400" : "text-gray-900 dark:text-white"}`}
            >
              {kpi.value}
            </div>
          </div>
        ))}
      </div>

      {/* Tầng C: Chi nhánh cần bổ sung khung giờ */}
      {!bootstrapLoading && metrics.branchesMissingSlots.length > 0 && (
        <div id="attention-section">
          <Card className="border-red-200 dark:border-red-900/50 flex flex-col overflow-hidden">
            <div className="p-4 bg-red-50/50 dark:bg-red-900/20 border-b border-red-100 dark:border-red-900/50 flex justify-between items-center">
              <h3 className="font-bold text-red-800 dark:text-red-400 flex items-center gap-2">
                <ShieldAlert className="w-5 h-5" />
                Chi nhánh thiếu khung giờ giao hàng trên toàn hệ thống (
                {metrics.branchesMissingSlots.length})
              </h3>
              <span className="text-xs text-red-600 font-medium bg-red-100 px-2 py-1 rounded">
                Tổng quan hệ thống
              </span>
            </div>
            <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {metrics.branchesMissingSlots.slice(0, 6).map((branch) => (
                <div
                  key={branch.id}
                  className="p-3 bg-white dark:bg-gray-800 rounded-lg border border-red-100 dark:border-red-900/30 shadow-sm flex flex-col gap-3"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-bold text-gray-900 dark:text-white text-sm">
                        {branch.name}
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5 font-mono">
                        {branch.code}
                      </div>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center">
                      <Store className="w-4 h-4 text-red-500" />
                    </div>
                  </div>
                  <button
                    onClick={() =>
                      navigate(
                        `/admin/shipping/branch-delivery-slots/create?branchId=${branch.id}`,
                      )
                    }
                    className="w-full py-1.5 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold rounded transition"
                  >
                    Bật slot cho chi nhánh này
                  </button>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* Tầng D: Toolbar Phân tầng */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col gap-4">
        {/* Quick Filters */}
        <div className="flex flex-wrap items-center gap-2 border-b border-gray-100 dark:border-gray-700 pb-4">
          <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 mr-2 flex items-center gap-1.5">
            Nghiệp vụ:
          </span>
          {[
            { id: "all", label: "Tất cả" },
            { id: "active", label: "Đang hoạt động" },
            { id: "inactive", label: "Tạm dừng" },
            { id: "override", label: "Có Override" },
            { id: "no_override", label: "Theo mặc định" },
            { id: "morning", label: "Sáng" },
            { id: "afternoon", label: "Chiều" },
            { id: "evening", label: "Tối" },
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
              value={branchFilter}
              onChange={(e) => handleFilterChange("branchId", e.target.value)}
              disabled={bootstrapLoading}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white min-w-[180px]"
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

          <div className="flex flex-col sm:flex-row items-center gap-4 w-full lg:w-auto">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Tìm theo tên, mã slot..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex bg-gray-100 dark:bg-gray-900 p-1 rounded-lg shrink-0">
              <button
                onClick={() => setViewMode("board")}
                className={`p-1.5 rounded-md flex items-center gap-1.5 text-sm font-medium transition ${viewMode === "board" ? "bg-white dark:bg-gray-700 shadow-sm text-blue-600 dark:text-blue-400" : "text-gray-500 hover:text-gray-700"}`}
              >
                <LayoutGrid className="w-4 h-4" /> Nhóm theo chi nhánh
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
      {loading || bootstrapLoading ? (
        <div className="flex flex-col justify-center items-center py-24 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <p className="mt-3 text-gray-500 font-medium">
            Đang tải cấu hình khung giờ theo chi nhánh...
          </p>
        </div>
      ) : error ? (
        <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          <AlertTriangle className="w-10 h-10 text-red-500 mx-auto mb-3" />
          <p className="text-red-600 font-medium">{error}</p>
        </div>
      ) : displayedRows.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-xl border border-dashed border-gray-300 dark:border-gray-600 flex flex-col items-center">
          <Clock3 className="w-12 h-12 text-gray-300 dark:text-gray-600 mb-4" />
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">
            Không có cấu hình phù hợp
          </h3>
          <p className="text-sm text-gray-500 mt-1 mb-5">
            Chưa có khung giờ nào được bật phù hợp với bộ lọc hiện tại.
          </p>
          <div className="flex gap-3">
            <button
              onClick={() =>
                navigate("/admin/shipping/branch-delivery-slots/create")
              }
              className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition"
            >
              Bật slot cho chi nhánh
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
            Hiển thị {displayedRows.length} cấu hình ở trang hiện tại.
            {viewMode === "board" && " (Nhóm theo chi nhánh)"}
          </p>

          {viewMode === "board" ? (
            <div className="space-y-6 mt-4">
              {Array.from(groupedByBranch.entries()).map(
                ([branchId, branchRows]) => {
                  const branch = branchMap.get(branchId);
                  const activeSlots = branchRows.filter(
                    (r) => r.status === "active",
                  ).length;
                  const overrides = branchRows.filter(
                    (r) => r.isOverride,
                  ).length;
                  const isHealthy = activeSlots > 0;

                  return (
                    <Card
                      key={branchId}
                      className="overflow-hidden p-0 border border-gray-200 dark:border-gray-700"
                    >
                      <div className="p-4 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700 flex flex-col md:flex-row justify-between md:items-center gap-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={`p-2 rounded-lg shadow-sm ${isHealthy ? "bg-white dark:bg-gray-900 text-blue-600" : "bg-red-50 text-red-600"}`}
                          >
                            <Store className="w-5 h-5" />
                          </div>
                          <div>
                            <h3 className="font-bold text-gray-900 dark:text-white text-base leading-tight">
                              {branch?.name || `Chi nhánh #${branchId}`}
                            </h3>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                                {branch?.code}
                              </span>
                              <span className="text-gray-300 dark:text-gray-600">
                                •
                              </span>
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded ${isHealthy ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}
                              >
                                {activeSlots} slot hoạt động
                              </span>
                              {overrides > 0 && (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-700">
                                  {overrides} override
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() =>
                              navigate(buildCapacityUrl({ branchId }))
                            }
                            className="px-3 py-1.5 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-sm font-medium text-gray-700 dark:text-gray-300 rounded shadow-sm hover:bg-gray-50 transition"
                          >
                            Xem Capacity
                          </button>
                          <button
                            onClick={() =>
                              navigate(
                                `/admin/shipping/branch-delivery-slots/create?branchId=${branchId}`,
                              )
                            }
                            className="px-3 py-1.5 bg-blue-50 text-blue-600 text-sm font-bold rounded hover:bg-blue-100 transition"
                          >
                            Bật thêm slot
                          </button>
                        </div>
                      </div>

                      <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 bg-white dark:bg-gray-900">
                        {branchRows.map((row) => (
                          <div
                            key={row.id}
                            className={`border rounded-xl p-4 transition shadow-sm group relative ${row.status === "inactive" ? "border-gray-200 bg-gray-50 opacity-80" : row.isOverride ? "border-amber-200 bg-amber-50/30" : "border-gray-100 hover:border-blue-300"}`}
                          >
                            <div className="flex justify-between items-start mb-3">
                              <div>
                                <div
                                  className={`font-bold text-sm ${row.status === "inactive" ? "text-gray-600" : "text-gray-900 dark:text-white"}`}
                                >
                                  {row.slot?.label}
                                </div>
                                <div className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                                  <Clock3 className="w-3 h-3" />{" "}
                                  {formatTimeRange(
                                    row.slot?.startTime,
                                    row.slot?.endTime,
                                  )}
                                </div>
                              </div>
                              <div className="flex flex-col items-end gap-1">
                                {row.timeInsight && (
                                  <span
                                    className={`px-2 py-0.5 rounded text-[10px] font-bold border ${row.timeInsight.color}`}
                                  >
                                    {row.timeInsight.label}
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="bg-white dark:bg-gray-800 p-2.5 rounded-lg border border-gray-100 dark:border-gray-700 mb-3">
                              <div className="text-xs text-gray-500 mb-1">
                                Giới hạn nhận đơn:
                              </div>
                              {row.isOverride ? (
                                <div className="font-bold text-amber-700 dark:text-amber-400 text-sm flex items-center gap-1.5">
                                  {formatMaxOrders(row.maxOrdersOverride)}
                                  <span className="px-1.5 py-0.5 bg-amber-100 text-amber-800 rounded text-[9px] uppercase">
                                    Ghi đè
                                  </span>
                                </div>
                              ) : (
                                <div className="font-semibold text-gray-800 dark:text-gray-200 text-sm">
                                  Theo mặc định hệ thống
                                </div>
                              )}
                            </div>

                            <div className="flex justify-between items-center pt-2">
                              <span
                                className={`text-[11px] font-bold ${statusMap[row.status].textClass}`}
                              >
                                {statusMap[row.status].label}
                              </span>
                              <div className="flex gap-1">
                                <button
                                  onClick={() =>
                                    navigate(
                                      buildCreateCapacityUrl(
                                        row.branchId,
                                        row.deliveryTimeSlotId,
                                      ),
                                    )
                                  }
                                  className="p-1.5 text-gray-400 hover:text-indigo-600 bg-gray-50 hover:bg-indigo-50 rounded"
                                  title="Tạo capacity hôm nay"
                                >
                                  <CalendarDays className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={(e) => handleToggleStatus(e, row)}
                                  className={`p-1.5 rounded ${row.status === "active" ? "text-yellow-600 bg-yellow-50 hover:bg-yellow-100" : "text-green-600 bg-green-50 hover:bg-green-100"}`}
                                  title={
                                    row.status === "active"
                                      ? "Tạm dừng slot"
                                      : "Bật lại"
                                  }
                                >
                                  <Power className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={(e) => handleEdit(e, row.id)}
                                  className="p-1.5 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded"
                                  title="Sửa cấu hình"
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
            <Card className="!p-0 overflow-hidden mt-4">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th className="px-5 py-3.5 text-left text-xs font-bold text-gray-500 uppercase">
                        Chi nhánh
                      </th>
                      <th className="px-5 py-3.5 text-left text-xs font-bold text-gray-500 uppercase">
                        Khung giờ
                      </th>
                      <th className="px-5 py-3.5 text-left text-xs font-bold text-gray-500 uppercase">
                        Buổi
                      </th>
                      <th className="px-5 py-3.5 text-left text-xs font-bold text-gray-500 uppercase">
                        Giới hạn nhận đơn
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
                    {displayedRows.map((row) => (
                      <tr
                        key={row.id}
                        className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group"
                      >
                        <td className="px-5 py-3">
                          <div className="font-semibold text-gray-900 dark:text-white text-sm">
                            {row.branch?.name}
                          </div>
                          <div className="text-xs text-gray-500 font-mono mt-0.5">
                            {row.branch?.code}
                          </div>
                        </td>
                        <td className="px-5 py-3">
                          <div className="font-semibold text-gray-900 dark:text-white text-sm">
                            {row.slot?.label}
                          </div>
                          <div className="text-xs text-gray-500 mt-0.5">
                            {formatTimeRange(
                              row.slot?.startTime,
                              row.slot?.endTime,
                            )}
                          </div>
                        </td>
                        <td className="px-5 py-3">
                          {row.timeInsight && (
                            <span
                              className={`px-2 py-1 rounded text-[10px] font-bold border ${row.timeInsight.color}`}
                            >
                              {row.timeInsight.label}
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-3">
                          {row.isOverride ? (
                            <div className="flex flex-col items-start gap-1">
                              <span className="text-sm font-bold text-amber-700 dark:text-amber-400">
                                {formatMaxOrders(row.maxOrdersOverride)}
                              </span>
                              <span className="px-1.5 py-0.5 bg-amber-100 text-amber-800 rounded text-[9px] uppercase font-bold">
                                Ghi đè
                              </span>
                            </div>
                          ) : (
                            <span className="text-sm text-gray-600 font-medium">
                              Mặc định hệ thống
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-3">
                          <span
                            className={`inline-flex px-2 py-1 rounded text-xs font-bold ${statusMap[row.status].className}`}
                          >
                            {statusMap[row.status].label}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-right">
                          <div className="flex justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() =>
                                navigate(
                                  buildCreateCapacityUrl(
                                    row.branchId,
                                    row.deliveryTimeSlotId,
                                  ),
                                )
                              }
                              className="p-1.5 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded"
                              title="Tạo capacity hôm nay"
                            >
                              <CalendarDays className="w-4 h-4" />
                            </button>
                            <button
                              onClick={(e) => handleToggleStatus(e, row)}
                              className="p-1.5 text-gray-500 hover:text-yellow-600 hover:bg-yellow-50 rounded"
                              title="Đổi trạng thái"
                            >
                              <Power className="w-4 h-4" />
                            </button>
                            <button
                              onClick={(e) => handleEdit(e, row.id)}
                              className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded"
                              title="Sửa"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={(e) => handleDelete(e, row)}
                              className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded"
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

export default BranchDeliveryTimeSlotsPage;
