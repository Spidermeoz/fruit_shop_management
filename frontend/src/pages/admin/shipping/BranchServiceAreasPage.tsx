import React, { useEffect, useMemo, useState } from "react";
import Card from "../../../components/admin/layouts/Card";
import Pagination from "../../../components/admin/common/Pagination";
import {
  Search,
  Plus,
  Edit,
  Trash2,
  Loader2,
  Truck,
  Store,
  MapPinned,
  Power,
  Zap,
  Banknote,
  Layers,
  CheckCircle2,
  AlertCircle,
  LayoutGrid,
  List,
  ShieldAlert,
  ExternalLink,
  Clock3,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { http } from "../../../services/http";
import { useAdminToast } from "../../../context/AdminToastContext";

// =============================
// TYPES
// =============================
type BranchServiceAreaStatus = "active" | "inactive";

interface BranchServiceArea {
  id: number;
  branchId: number;
  shippingZoneId: number;
  deliveryFeeOverride?: number | null;
  minOrderValue?: number | null;
  maxOrderValue?: number | null;
  supportsSameDay?: boolean;
  status: BranchServiceAreaStatus;
  createdAt?: string;
  updatedAt?: string;
}

interface BranchOption {
  id: number;
  name: string;
  code: string;
}

interface ShippingZoneOption {
  id: number;
  name: string;
  code: string;
}

type ApiList<T> = {
  success: true;
  data: T[];
  meta?: { total?: number; limit?: number; offset?: number; page?: number };
};

type QuickFilterType =
  | "all"
  | "active"
  | "inactive"
  | "same_day"
  | "no_same_day"
  | "override_fee"
  | "has_condition";

// =============================
// HELPERS
// =============================
const statusMap: Record<
  BranchServiceAreaStatus,
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

const formatCurrency = (value?: number | null) => {
  if (value === null || value === undefined) return "—";
  return Number(value).toLocaleString("vi-VN") + " đ";
};

const formatOrderConditionText = (min?: number | null, max?: number | null) => {
  if (!min && !max) return "Áp dụng cho mọi giá trị đơn hàng";
  if (min && max)
    return `Áp dụng cho đơn từ ${formatCurrency(min)} đến ${formatCurrency(max)}`;
  if (min) return `Áp dụng cho đơn từ ${formatCurrency(min)} trở lên`;
  if (max) return `Áp dụng cho đơn tối đa ${formatCurrency(max)}`;
  return "";
};

const formatFeeRuleText = (fee?: number | null) => {
  if (fee !== null && fee !== undefined) {
    return `Phí giao hàng override: ${formatCurrency(fee)}`;
  }
  return "Phí giao hàng dùng theo zone gốc";
};

// =============================
// MAIN COMPONENT
// =============================
const BranchServiceAreasPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { showSuccessToast, showErrorToast } = useAdminToast();

  // --- States ---
  const [rows, setRows] = useState<BranchServiceArea[]>([]);
  const [summaryRows, setSummaryRows] = useState<BranchServiceArea[]>([]);
  const [branches, setBranches] = useState<BranchOption[]>([]);
  const [zones, setZones] = useState<ShippingZoneOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [bootstrapLoading, setBootstrapLoading] = useState(true);
  const [error, setError] = useState("");

  const [searchInput, setSearchInput] = useState(searchParams.get("q") || "");
  const [quickFilter, setQuickFilter] = useState<QuickFilterType>("all");
  const [viewMode, setViewMode] = useState<"branch" | "table">("branch");

  // URL Filters
  const statusFilter = searchParams.get("status") || "all";
  const branchFilter = searchParams.get("branchId") || "all";
  const zoneFilter = searchParams.get("shippingZoneId") || "all";
  const currentPage = Number(searchParams.get("page") || 1);
  const [totalPages, setTotalPages] = useState(1);

  // --- Lookups ---
  const branchMap = useMemo(
    () => new Map(branches.map((x) => [x.id, x])),
    [branches],
  );
  const zoneMap = useMemo(() => new Map(zones.map((x) => [x.id, x])), [zones]);

  // --- Data Fetching ---
  const fetchBootstrap = async () => {
    try {
      setBootstrapLoading(true);
      const [branchesRes, zonesRes] = await Promise.all([
        http<ApiList<BranchOption>>(
          "GET",
          "/api/v1/admin/branches?limit=1000&status=active",
        ),
        http<ApiList<ShippingZoneOption>>(
          "GET",
          "/api/v1/admin/shipping-zones?limit=1000&status=active",
        ),
      ]);
      setBranches(Array.isArray(branchesRes?.data) ? branchesRes.data : []);
      setZones(Array.isArray(zonesRes?.data) ? zonesRes.data : []);
    } catch (err: any) {
      showErrorToast(err?.message || "Không thể tải dữ liệu danh mục.");
    } finally {
      setBootstrapLoading(false);
    }
  };

  const fetchSummaryRows = async () => {
    try {
      const limit = 1000;
      let offset = 0;
      let allItems: BranchServiceArea[] = [];
      let keepFetching = true;

      while (keepFetching) {
        const url = `/api/v1/admin/branch-service-areas?limit=${limit}&offset=${offset}`;
        const res = await http<ApiList<BranchServiceArea>>("GET", url);

        if (!res?.success || !Array.isArray(res.data)) break;

        allItems = [...allItems, ...res.data];

        const total = Number(res.meta?.total ?? allItems.length);
        offset += limit;
        keepFetching = allItems.length < total && res.data.length > 0;
      }

      setSummaryRows(allItems);
    } catch (err: any) {
      console.error("Không thể tải dữ liệu tổng quan service areas", err);
    }
  };

  const fetchRows = async () => {
    try {
      setLoading(true);
      setError("");

      const limit = 20; // limit cao hơn cho chế độ xem group
      const offset = (currentPage - 1) * limit;

      let url = `/api/v1/admin/branch-service-areas?limit=${limit}&offset=${offset}`;

      if (statusFilter !== "all")
        url += `&status=${encodeURIComponent(statusFilter)}`;
      if (branchFilter !== "all")
        url += `&branchId=${encodeURIComponent(branchFilter)}`;
      if (zoneFilter !== "all")
        url += `&shippingZoneId=${encodeURIComponent(zoneFilter)}`;

      const q = searchParams.get("q");
      if (q?.trim()) url += `&q=${encodeURIComponent(q.trim())}`;

      const res = await http<ApiList<BranchServiceArea>>("GET", url);

      if (res?.success && Array.isArray(res.data)) {
        setRows(res.data);
        const total = Number(res.meta?.total ?? 0);
        setTotalPages(Math.max(1, Math.ceil(total / limit)));
      } else {
        setError("Không thể tải danh sách quy tắc coverage.");
      }
    } catch (err: any) {
      setError(err?.message || "Lỗi tải danh sách quy tắc coverage.");
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
  }, [currentPage, statusFilter, branchFilter, zoneFilter, searchParams]);

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
    return rows.map((row) => ({
      ...row,
      branch: branchMap.get(row.branchId),
      zone: zoneMap.get(row.shippingZoneId),
      hasOverride:
        row.deliveryFeeOverride !== null &&
        row.deliveryFeeOverride !== undefined,
      hasCondition: row.minOrderValue != null || row.maxOrderValue != null,
    }));
  }, [rows, branchMap, zoneMap]);

  const summaryEnrichedRows = useMemo(() => {
    return summaryRows.map((row) => ({
      ...row,
      branch: branchMap.get(row.branchId),
      zone: zoneMap.get(row.shippingZoneId),
      hasOverride:
        row.deliveryFeeOverride !== null &&
        row.deliveryFeeOverride !== undefined,
      hasCondition: row.minOrderValue != null || row.maxOrderValue != null,
    }));
  }, [summaryRows, branchMap, zoneMap]);

  const displayedRows = useMemo(() => {
    if (quickFilter === "all") return enrichedRows;
    return enrichedRows.filter((row) => {
      if (quickFilter === "active") return row.status === "active";
      if (quickFilter === "inactive") return row.status === "inactive";
      if (quickFilter === "same_day") return row.supportsSameDay;
      if (quickFilter === "no_same_day") return !row.supportsSameDay;
      if (quickFilter === "override_fee") return row.hasOverride;
      if (quickFilter === "has_condition") return row.hasCondition;
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
      sameDay = 0,
      override = 0,
      conditional = 0;
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

      if (r.supportsSameDay) sameDay++;
      if (r.hasOverride) override++;
      if (r.hasCondition) conditional++;
    });

    const branchesWithoutCoverage = branches.filter(
      (b) => !activeBranchIds.has(b.id),
    );

    return {
      total,
      active,
      inactive,
      sameDay,
      override,
      conditional,
      configuredCount: configuredBranchIds.size,
      branchesWithoutCoverage,
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

  const handleDelete = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    if (!window.confirm(`Bạn có chắc muốn xóa cấu hình này không?`)) return;
    try {
      await http("DELETE", `/api/v1/admin/branch-service-areas/delete/${id}`);
      showSuccessToast({ message: "Đã xóa cấu hình thành công!" });
      await Promise.all([fetchRows(), fetchSummaryRows()]);
    } catch (err: any) {
      showErrorToast(err?.message || "Không thể xóa cấu hình.");
    }
  };

  const handleToggleStatus = async (
    e: React.MouseEvent,
    row: BranchServiceArea,
  ) => {
    e.stopPropagation();
    const nextStatus = row.status === "active" ? "inactive" : "active";
    try {
      await http(
        "PATCH",
        `/api/v1/admin/branch-service-areas/${row.id}/status`,
        { status: nextStatus },
      );
      showSuccessToast({ message: "Cập nhật trạng thái thành công!" });
      await Promise.all([fetchRows(), fetchSummaryRows()]);
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
              Cấu hình Coverage giao hàng
            </h1>
            {metrics.sameDay > 0 && (
              <span className="px-2.5 py-1 bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300 text-xs font-bold rounded-md">
                {metrics.sameDay} rule same-day
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Thiết lập chi nhánh nào phục vụ zone nào, cùng điều kiện áp dụng,
            phí override và hỗ trợ giao trong ngày.
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
            onClick={() => navigate("/admin/shipping/zones")}
            className="px-4 py-2 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600 text-sm font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition"
          >
            Mở Vùng giao hàng
          </button>
          <button
            onClick={() => navigate("/admin/shipping/service-areas/create")}
            className="flex items-center gap-2 px-5 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition shadow-sm ml-auto md:ml-0"
          >
            <Plus className="w-4 h-4" /> Thêm coverage
          </button>
        </div>
      </div>

      {/* Tầng B: KPI Strip */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        {[
          {
            label: "Tổng quy tắc",
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
            label: "Hỗ trợ Same-day",
            value: metrics.sameDay,
            icon: Zap,
            color: "text-purple-600",
            bg: "bg-purple-50",
          },
          {
            label: "Có phí Override",
            value: metrics.override,
            icon: Banknote,
            color: "text-amber-600",
            bg: "bg-amber-50",
          },
          {
            label: "Chi nhánh đã phủ",
            value: metrics.configuredCount,
            icon: Store,
            color: "text-indigo-600",
            bg: "bg-indigo-50",
          },
          {
            label: "Thiếu coverage",
            value: metrics.branchesWithoutCoverage.length,
            icon: AlertCircle,
            color: "text-red-600",
            bg: "bg-red-50",
            isWarning: true,
          },
        ].map((kpi, idx) => (
          <div
            key={idx}
            onClick={() => {
              if (kpi.label === "Hỗ trợ Same-day") setQuickFilter("same_day");
              if (kpi.label === "Có phí Override")
                setQuickFilter("override_fee");
              if (kpi.label === "Đang hoạt động") setQuickFilter("active");
              if (kpi.isWarning && metrics.branchesWithoutCoverage.length > 0) {
                document
                  .getElementById("attention-section")
                  ?.scrollIntoView({ behavior: "smooth" });
              }
            }}
            className={`p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 flex flex-col justify-center ${kpi.label !== "Tổng quy tắc" && kpi.label !== "Chi nhánh đã phủ" ? "cursor-pointer hover:border-blue-400 hover:shadow-sm transition-all" : ""}`}
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

      {/* Tầng C: Chi nhánh thiếu coverage */}
      {!bootstrapLoading && metrics.branchesWithoutCoverage.length > 0 && (
        <div id="attention-section">
          <Card className="border-red-200 dark:border-red-900/50 flex flex-col overflow-hidden">
            <div className="p-4 bg-red-50/50 dark:bg-red-900/20 border-b border-red-100 dark:border-red-900/50 flex justify-between items-center">
              <h3 className="font-bold text-red-800 dark:text-red-400 flex items-center gap-2">
                <ShieldAlert className="w-5 h-5" />
                Chi nhánh thiếu Coverage trên toàn hệ thống (
                {metrics.branchesWithoutCoverage.length})
              </h3>
              <span className="text-xs text-red-600 font-medium bg-red-100 px-2 py-1 rounded border border-red-200">
                Tổng quan hệ thống
              </span>
            </div>
            <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {metrics.branchesWithoutCoverage.slice(0, 6).map((branch) => (
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
                      <MapPinned className="w-4 h-4 text-red-500" />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() =>
                        navigate(
                          `/admin/shipping/service-areas/create?branchId=${branch.id}`,
                        )
                      }
                      className="flex-1 py-1.5 bg-red-50 border border-red-100 hover:bg-red-100 text-red-700 text-xs font-bold rounded transition"
                    >
                      Thêm coverage
                    </button>
                    <button
                      onClick={() =>
                        navigate(
                          `/admin/shipping/branch-delivery-slots?branchId=${branch.id}`,
                        )
                      }
                      className="px-3 py-1.5 bg-gray-50 border border-gray-200 hover:bg-gray-100 text-gray-700 text-xs font-bold rounded transition"
                      title="Mở khung giờ chi nhánh"
                    >
                      <Clock3 className="w-3.5 h-3.5" />
                    </button>
                  </div>
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
            Bộ lọc nhanh:
          </span>
          {[
            { id: "all", label: "Tất cả" },
            { id: "active", label: "Đang hoạt động" },
            { id: "inactive", label: "Tạm dừng" },
            { id: "same_day", label: "Same-day" },
            { id: "no_same_day", label: "Không Same-day" },
            { id: "override_fee", label: "Có Override Phí" },
            { id: "has_condition", label: "Có điều kiện đơn" },
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
              value={zoneFilter}
              onChange={(e) =>
                handleFilterChange("shippingZoneId", e.target.value)
              }
              disabled={bootstrapLoading}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white min-w-[180px]"
            >
              <option value="all">Mọi vùng giao hàng</option>
              {zones.map((z) => (
                <option key={z.id} value={z.id}>
                  {z.name}
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
                placeholder="Tìm theo tên nhánh, vùng..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex bg-gray-100 dark:bg-gray-900 p-1 rounded-lg shrink-0">
              <button
                onClick={() => setViewMode("branch")}
                className={`p-1.5 rounded-md flex items-center gap-1.5 text-sm font-medium transition ${viewMode === "branch" ? "bg-white dark:bg-gray-700 shadow-sm text-blue-600 dark:text-blue-400" : "text-gray-500 hover:text-gray-700"}`}
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
      </div>

      {/* Main Content Area */}
      {loading || bootstrapLoading ? (
        <div className="flex flex-col justify-center items-center py-24 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <p className="mt-3 text-gray-500 font-medium">
            Đang tải quy tắc coverage...
          </p>
        </div>
      ) : error ? (
        <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          <AlertTriangle className="w-10 h-10 text-red-500 mx-auto mb-3" />
          <p className="text-red-600 font-medium">{error}</p>
        </div>
      ) : displayedRows.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-xl border border-dashed border-gray-300 dark:border-gray-600 flex flex-col items-center">
          <Truck className="w-12 h-12 text-gray-300 dark:text-gray-600 mb-4" />
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">
            Không có quy tắc coverage phù hợp
          </h3>
          <p className="text-sm text-gray-500 mt-1 mb-5">
            Thử bỏ bớt bộ lọc hoặc tạo quy tắc mới cho chi nhánh.
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => navigate("/admin/shipping/service-areas/create")}
              className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition"
            >
              Thêm coverage
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
            Hiển thị {displayedRows.length} quy tắc ở trang hiện tại.
            {viewMode === "branch" && " (Nhóm theo chi nhánh)"}
          </p>

          {viewMode === "branch" ? (
            <div className="space-y-6 mt-4">
              {Array.from(groupedByBranch.entries()).map(
                ([branchId, branchRows]) => {
                  const branch = branchMap.get(branchId);
                  const activeCount = branchRows.filter(
                    (r) => r.status === "active",
                  ).length;
                  const overrides = branchRows.filter(
                    (r) => r.hasOverride,
                  ).length;
                  const sameDays = branchRows.filter(
                    (r) => r.supportsSameDay,
                  ).length;

                  return (
                    <Card
                      key={branchId}
                      className="overflow-hidden p-0 border border-gray-200 dark:border-gray-700 shadow-sm"
                    >
                      {/* Header Nhóm Chi nhánh */}
                      <div className="p-4 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700 flex flex-col md:flex-row justify-between md:items-center gap-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg shadow-sm bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-700">
                            <Store className="w-5 h-5 text-gray-600 dark:text-gray-400" />
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
                                className={`text-[10px] font-bold px-2 py-0.5 rounded ${activeCount > 0 ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}
                              >
                                {activeCount} zone hoạt động
                              </span>
                              {sameDays > 0 && (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-100 text-purple-700">
                                  {sameDays} same-day
                                </span>
                              )}
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
                              navigate(
                                `/admin/shipping/branch-delivery-slots?branchId=${branchId}`,
                              )
                            }
                            className="px-3 py-1.5 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-sm font-medium text-gray-700 dark:text-gray-300 rounded shadow-sm hover:bg-gray-50 transition"
                          >
                            Khung giờ hoạt động
                          </button>
                          <button
                            onClick={() =>
                              navigate(
                                `/admin/shipping/service-areas/create?branchId=${branchId}`,
                              )
                            }
                            className="px-3 py-1.5 bg-blue-50 text-blue-600 text-sm font-bold rounded hover:bg-blue-100 transition"
                          >
                            Gán thêm vùng
                          </button>
                        </div>
                      </div>

                      {/* Danh sách Coverage Rules */}
                      <div className="p-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 bg-white dark:bg-gray-900">
                        {branchRows.map((row) => (
                          <div
                            key={row.id}
                            className={`border rounded-xl p-4 transition shadow-sm group relative flex flex-col h-full ${row.status === "inactive" ? "border-gray-200 bg-gray-50 opacity-80" : "border-gray-200 hover:border-blue-400"}`}
                          >
                            {/* Lớp 1: Identity */}
                            <div className="flex justify-between items-start mb-3">
                              <div className="flex items-start gap-2">
                                <div className="mt-0.5">
                                  <MapPinned className="w-4 h-4 text-gray-400" />
                                </div>
                                <div>
                                  <div
                                    className={`font-bold text-sm leading-tight mb-1 ${row.status === "inactive" ? "text-gray-600" : "text-gray-900 dark:text-white"}`}
                                  >
                                    {row.zone?.name}
                                  </div>
                                  <div className="text-[11px] text-gray-500 font-mono bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded w-fit">
                                    {row.zone?.code}
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Lớp 2: Business Rule Explanation */}
                            <div className="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg border border-gray-100 dark:border-gray-700 mt-2 mb-4 flex-1">
                              <ul className="space-y-2.5 text-sm">
                                <li className="flex items-start gap-2">
                                  <span className="shrink-0 w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5"></span>
                                  <span
                                    className={
                                      row.hasOverride
                                        ? "font-bold text-amber-700 dark:text-amber-400"
                                        : "text-gray-700 dark:text-gray-300 font-medium"
                                    }
                                  >
                                    {formatFeeRuleText(row.deliveryFeeOverride)}
                                  </span>
                                </li>
                                <li className="flex items-start gap-2">
                                  <span className="shrink-0 w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5"></span>
                                  <span className="text-gray-700 dark:text-gray-300 font-medium">
                                    {formatOrderConditionText(
                                      row.minOrderValue,
                                      row.maxOrderValue,
                                    )}
                                  </span>
                                </li>
                                <li className="flex items-center gap-2">
                                  <span className="shrink-0 w-1.5 h-1.5 rounded-full bg-blue-400"></span>
                                  <span
                                    className={`font-bold ${row.supportsSameDay ? "text-purple-600 dark:text-purple-400 flex items-center gap-1" : "text-gray-500"}`}
                                  >
                                    {row.supportsSameDay && (
                                      <Zap className="w-3.5 h-3.5" />
                                    )}
                                    {row.supportsSameDay
                                      ? "Hỗ trợ giao trong ngày"
                                      : "Không giao same-day"}
                                  </span>
                                </li>
                              </ul>
                            </div>

                            {/* Lớp 3: Actions */}
                            <div className="flex justify-between items-center pt-3 border-t border-gray-100 dark:border-gray-800 mt-auto">
                              <span
                                className={`px-2 py-1 rounded text-[10px] font-bold ${statusMap[row.status].className}`}
                              >
                                {statusMap[row.status].label}
                              </span>
                              <div className="flex gap-1.5">
                                <button
                                  onClick={() =>
                                    navigate(
                                      `/admin/shipping/zones/edit/${row.shippingZoneId}`,
                                    )
                                  }
                                  className="p-1.5 text-gray-400 hover:text-indigo-600 bg-gray-50 hover:bg-indigo-50 rounded border border-gray-100"
                                  title="Mở cấu hình vùng gốc"
                                >
                                  <ExternalLink className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={(e) => handleToggleStatus(e, row)}
                                  className={`p-1.5 rounded border ${row.status === "active" ? "text-yellow-600 bg-yellow-50 hover:bg-yellow-100 border-yellow-100" : "text-green-600 bg-green-50 hover:bg-green-100 border-green-100"}`}
                                  title={
                                    row.status === "active" ? "Tạm dừng" : "Bật"
                                  }
                                >
                                  <Power className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    navigate(
                                      `/admin/shipping/service-areas/edit/${row.id}`,
                                    );
                                  }}
                                  className="p-1.5 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded border border-blue-100"
                                  title="Sửa quy tắc"
                                >
                                  <Edit className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={(e) => handleDelete(e, row.id)}
                                  className="p-1.5 text-red-600 bg-red-50 hover:bg-red-100 rounded border border-red-100"
                                  title="Xóa"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
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
                        Vùng phục vụ
                      </th>
                      <th className="px-5 py-3.5 text-left text-xs font-bold text-gray-500 uppercase">
                        Hỗ trợ Same-day
                      </th>
                      <th className="px-5 py-3.5 text-left text-xs font-bold text-gray-500 uppercase">
                        Quy tắc phí
                      </th>
                      <th className="px-5 py-3.5 text-left text-xs font-bold text-gray-500 uppercase">
                        Điều kiện đơn
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
                        className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group"
                      >
                        <td className="px-5 py-3.5">
                          <div className="font-bold text-gray-900 dark:text-white text-sm">
                            {row.branch?.name}
                          </div>
                          <div className="text-xs text-gray-500 font-mono mt-0.5">
                            {row.branch?.code}
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="font-bold text-gray-900 dark:text-white text-sm">
                            {row.zone?.name}
                          </div>
                          <div className="text-xs text-gray-500 font-mono mt-0.5">
                            {row.zone?.code}
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          {row.supportsSameDay ? (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-bold bg-purple-100 text-purple-700">
                              <Zap className="w-3 h-3" /> Có hỗ trợ
                            </span>
                          ) : (
                            <span className="text-gray-400 text-sm font-medium">
                              Không
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-3.5">
                          {row.hasOverride ? (
                            <div className="flex flex-col items-start gap-1">
                              <span className="text-sm font-bold text-amber-700 dark:text-amber-400">
                                {formatCurrency(row.deliveryFeeOverride)}
                              </span>
                              <span className="px-1.5 py-0.5 bg-amber-100 text-amber-800 rounded text-[9px] uppercase font-bold border border-amber-200">
                                Override
                              </span>
                            </div>
                          ) : (
                            <span className="text-sm text-gray-600 font-medium">
                              Theo zone gốc
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="text-xs text-gray-700 dark:text-gray-300 font-medium max-w-[200px] leading-snug">
                            {formatOrderConditionText(
                              row.minOrderValue,
                              row.maxOrderValue,
                            )}
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
                              onClick={(e) => handleToggleStatus(e, row)}
                              className="p-1.5 text-gray-500 hover:text-yellow-600 hover:bg-yellow-50 rounded border border-transparent hover:border-yellow-200"
                              title="Đổi trạng thái"
                            >
                              <Power className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() =>
                                navigate(
                                  `/admin/shipping/service-areas/edit/${row.id}`,
                                )
                              }
                              className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded border border-transparent hover:border-blue-200"
                              title="Sửa quy tắc"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={(e) => handleDelete(e, row.id)}
                              className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded border border-transparent hover:border-red-200"
                              title="Xóa quy tắc"
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

export default BranchServiceAreasPage;
