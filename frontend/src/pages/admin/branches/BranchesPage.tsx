import React, { useEffect, useState, useMemo, useCallback } from "react";
import Card from "../../../components/admin/layouts/Card";
import Pagination from "../../../components/admin/common/Pagination";
import {
  Search,
  Plus,
  Trash2,
  Loader2,
  MapPinned,
  Phone,
  Mail,
  Clock3,
  RefreshCw,
  Building2,
  AlertCircle,
  CheckCircle2,
  Truck,
  LayoutGrid,
  List,
  FolderOpen,
  Layers,
  Store,
  PowerOff,
  ShieldAlert,
  Power,
  AlertTriangle,
} from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { http } from "../../../services/http";
import { useAdminToast } from "../../../context/AdminToastContext";

// =============================
// TYPES
// =============================
type BranchStatus = "active" | "inactive";

interface Branch {
  id: number;
  name: string;
  code: string;
  phone?: string | null;
  email?: string | null;
  addressLine1?: string | null;
  addressLine2?: string | null;
  ward?: string | null;
  district?: string | null;
  province?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  openTime?: string | null;
  closeTime?: string | null;
  supportsPickup?: boolean;
  supportsDelivery?: boolean;
  status: BranchStatus;
  deleted?: boolean;
  deletedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

type ApiList<T> = {
  success: true;
  data: T[];
  meta?: { total?: number; limit?: number; offset?: number };
};

type QuickFilterType =
  | "all"
  | "active"
  | "inactive"
  | "pickup-only"
  | "delivery-enabled"
  | "hybrid"
  | "needs-setup";

// =============================
// HELPERS & LOGIC
// =============================
const statusMap: Record<
  BranchStatus,
  { label: string; className: string; textClass: string }
> = {
  active: {
    label: "Hoạt động",
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

const getBranchMode = (branch: Branch) => {
  if (branch.supportsPickup && branch.supportsDelivery) return "hybrid";
  if (branch.supportsPickup) return "pickup-only";
  if (branch.supportsDelivery) return "delivery-only";
  return "unconfigured";
};

const getBranchHealth = (branch: Branch) => {
  const hasFullAddress = Boolean(
    branch.addressLine1 && branch.district && branch.province,
  );
  const hasCoordinates = Boolean(branch.latitude && branch.longitude);
  const mode = getBranchMode(branch);

  const needsShippingSetup =
    branch.supportsDelivery && (!hasFullAddress || !hasCoordinates);

  const healthSignals: string[] = [];
  if (!hasFullAddress) healthSignals.push("Thiếu địa chỉ");
  if (!hasCoordinates) healthSignals.push("Thiếu tọa độ");
  if (needsShippingSetup) healthSignals.push("Cần hoàn tất setup giao hàng");
  if (mode === "unconfigured")
    healthSignals.push("Chưa chọn hình thức phục vụ");

  let completenessScore = "Ready";
  if (healthSignals.length > 0) completenessScore = "Needs setup";
  else if (!branch.phone || !branch.email) completenessScore = "Partial";

  return {
    hasFullAddress,
    hasCoordinates,
    mode,
    needsShippingSetup,
    healthSignals,
    completenessScore,
  };
};

const formatFullAddress = (branch: Branch) => {
  return [
    branch.addressLine1,
    branch.addressLine2,
    branch.ward,
    branch.district,
    branch.province,
  ]
    .filter(Boolean)
    .join(", ");
};

// =============================
// MAIN PAGE
// =============================
const BranchesPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { showSuccessToast, showErrorToast } = useAdminToast();

  // --- States ---
  const [rows, setRows] = useState<Branch[]>([]);
  const [summaryRows, setSummaryRows] = useState<Branch[]>([]);

  const [loading, setLoading] = useState(false);
  const [bootstrapLoading, setBootstrapLoading] = useState(true);
  const [error, setError] = useState("");

  const [searchInput, setSearchInput] = useState(searchParams.get("q") || "");
  const [quickFilter, setQuickFilter] = useState<QuickFilterType>("all");
  const [viewMode, setViewMode] = useState<"board" | "table">("board");

  // URL Filters
  const statusFilter = searchParams.get("status") || "all";
  const currentPage = Number(searchParams.get("page") || 1);
  const [totalPages, setTotalPages] = useState(1);
  const [, setTotalCount] = useState(0);

  // --- Data Fetching ---
  // Tải toàn bộ chi nhánh để phục vụ Tầng Summary KPI & Tầng C Attention
  const fetchSummaryRows = async () => {
    try {
      setBootstrapLoading(true);
      const url = `/api/v1/admin/branches?limit=1000`;
      const res = await http<ApiList<Branch>>("GET", url);

      if (res?.success && Array.isArray(res.data)) {
        setSummaryRows(res.data);
      }
    } catch (err: any) {
      console.error("Không thể tải dữ liệu tổng quan chi nhánh", err);
    } finally {
      setBootstrapLoading(false);
    }
  };

  const fetchRows = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const limit = 12; // Số lượng hợp lý cho board view
      const offset = (currentPage - 1) * limit;
      let url = `/api/v1/admin/branches?limit=${limit}&offset=${offset}`;

      if (statusFilter !== "all") {
        url += `&status=${encodeURIComponent(statusFilter)}`;
      }

      const q = searchParams.get("q");
      if (q?.trim()) {
        url += `&q=${encodeURIComponent(q.trim())}`;
      }

      const res = await http<ApiList<Branch>>("GET", url);

      if (res?.success && Array.isArray(res.data)) {
        setRows(res.data);
        const total = Number(res.meta?.total ?? 0);
        setTotalCount(total);
        setTotalPages(Math.max(1, Math.ceil(total / limit)));
      } else {
        setError("Không thể tải danh sách chi nhánh.");
      }
    } catch (err: any) {
      setError(err?.message || "Lỗi tải mạng lưới chi nhánh.");
    } finally {
      setLoading(false);
    }
  }, [currentPage, statusFilter, searchParams]);

  useEffect(() => {
    fetchSummaryRows();
  }, []);

  useEffect(() => {
    fetchRows();
  }, [fetchRows]);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => {
      const params = new URLSearchParams(searchParams);
      if (searchInput.trim()) params.set("q", searchInput.trim());
      else params.delete("q");
      params.delete("page");
      setSearchParams(params);
    }, 400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput]);

  // --- Derived Models & Logic ---
  const enrichedRows = useMemo(() => {
    return rows.map((row) => ({
      ...row,
      ui: getBranchHealth(row),
    }));
  }, [rows]);

  const summaryEnrichedRows = useMemo(() => {
    return summaryRows.map((row) => ({
      ...row,
      ui: getBranchHealth(row),
    }));
  }, [summaryRows]);

  const displayedRows = useMemo(() => {
    if (quickFilter === "all") return enrichedRows;
    return enrichedRows.filter((row) => {
      if (quickFilter === "active") return row.status === "active";
      if (quickFilter === "inactive") return row.status === "inactive";
      if (quickFilter === "pickup-only") return row.ui.mode === "pickup-only";
      if (quickFilter === "delivery-enabled") return row.supportsDelivery;
      if (quickFilter === "hybrid") return row.ui.mode === "hybrid";
      if (quickFilter === "needs-setup") return row.ui.healthSignals.length > 0;
      return true;
    });
  }, [enrichedRows, quickFilter]);

  // --- Metrics ---
  const metrics = useMemo(() => {
    const total = summaryEnrichedRows.length;
    let active = 0,
      inactive = 0,
      pickupOnly = 0,
      deliveryEnabled = 0,
      needsSetup = 0;

    const branchesNeedingAttention: (Branch & {
      ui: ReturnType<typeof getBranchHealth>;
    })[] = [];

    summaryEnrichedRows.forEach((r) => {
      if (r.status === "active") active++;
      else inactive++;

      if (r.ui.mode === "pickup-only") pickupOnly++;
      if (r.supportsDelivery) deliveryEnabled++;

      if (r.ui.healthSignals.length > 0) {
        needsSetup++;
        branchesNeedingAttention.push(r);
      }
    });

    return {
      total,
      active,
      inactive,
      pickupOnly,
      deliveryEnabled,
      needsSetup,
      branchesNeedingAttention,
    };
  }, [summaryEnrichedRows]);

  // --- Actions ---
  const handleFilterChange = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value === "all") params.delete(key);
    else params.set(key, value);
    params.delete("page");
    setSearchParams(params);
  };

  const handleDelete = async (e: React.MouseEvent, row: Branch) => {
    e.stopPropagation();
    if (
      !window.confirm(`Bạn có chắc muốn xóa mềm chi nhánh "${row.name}" không?`)
    )
      return;

    try {
      await http("DELETE", `/api/v1/admin/branches/delete/${row.id}`);
      showSuccessToast({ message: "Đã xóa chi nhánh thành công!" });
      await Promise.all([fetchRows(), fetchSummaryRows()]);
    } catch (err: any) {
      showErrorToast(err?.message || "Không thể xóa chi nhánh.");
    }
  };

  const handleEdit = (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    navigate(`/admin/branches/edit/${id}`);
  };

  const handleToggleStatus = async (e: React.MouseEvent, row: Branch) => {
    e.stopPropagation();
    const nextStatus = row.status === "active" ? "inactive" : "active";
    try {
      await http("PATCH", `/api/v1/admin/branches/${row.id}/status`, {
        status: nextStatus,
      });
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
              Branch Network Board
            </h1>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Theo dõi toàn bộ mạng lưới chi nhánh, độ sẵn sàng vận hành và các
            cấu hình cần hoàn thiện.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <button
            onClick={() => {
              fetchRows();
              fetchSummaryRows();
            }}
            className="p-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition"
            title="Làm mới dữ liệu"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
          <button
            onClick={() => navigate("/admin/inventory")}
            className="px-4 py-2 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600 text-sm font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition"
          >
            Tổng quan Tồn kho
          </button>
          <button
            onClick={() => navigate("/admin/branches/create")}
            className="flex items-center gap-2 px-5 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition shadow-sm ml-auto md:ml-0"
          >
            <Plus className="w-4 h-4" /> Thiết lập chi nhánh
          </button>
        </div>
      </div>

      {/* Tầng B: KPI Strip */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        {[
          {
            label: "Tổng chi nhánh",
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
            label: "Chỉ Pickup",
            value: metrics.pickupOnly,
            icon: Store,
            color: "text-indigo-600",
            bg: "bg-indigo-50",
          },
          {
            label: "Hỗ trợ Giao",
            value: metrics.deliveryEnabled,
            icon: Truck,
            color: "text-purple-600",
            bg: "bg-purple-50",
          },
          {
            label: "Đang tạm dừng",
            value: metrics.inactive,
            icon: PowerOff,
            color: "text-gray-600",
            bg: "bg-gray-100",
          },
          {
            label: "Cần Setup",
            value: metrics.needsSetup,
            icon: AlertCircle,
            color: "text-red-600",
            bg: "bg-red-50",
            isWarning: true,
          },
        ].map((kpi, idx) => (
          <div
            key={idx}
            onClick={() => {
              if (kpi.label === "Đang hoạt động") setQuickFilter("active");
              if (kpi.label === "Chỉ Pickup") setQuickFilter("pickup-only");
              if (kpi.label === "Hỗ trợ Giao")
                setQuickFilter("delivery-enabled");
              if (kpi.label === "Đang tạm dừng") setQuickFilter("inactive");
              if (kpi.label === "Cần Setup") setQuickFilter("needs-setup");
              if (kpi.isWarning && metrics.needsSetup > 0) {
                document
                  .getElementById("attention-section")
                  ?.scrollIntoView({ behavior: "smooth" });
              }
            }}
            className={`p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 flex flex-col justify-center ${kpi.label !== "Tổng chi nhánh" ? "cursor-pointer hover:border-blue-400 hover:shadow-sm transition-all" : ""}`}
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

      {/* Tầng C: Chi nhánh cần bổ sung Setup (Attention Section) */}
      {!bootstrapLoading && metrics.branchesNeedingAttention.length > 0 && (
        <div id="attention-section">
          <Card className="border-red-200 dark:border-red-900/50 flex flex-col overflow-hidden !p-0">
            <div className="p-4 bg-red-50/50 dark:bg-red-900/20 border-b border-red-100 dark:border-red-900/50 flex justify-between items-center">
              <h3 className="font-bold text-red-800 dark:text-red-400 flex items-center gap-2">
                <ShieldAlert className="w-5 h-5" />
                Chi nhánh thiếu dữ liệu nền tảng vận hành (
                {metrics.branchesNeedingAttention.length})
              </h3>
              <span className="text-xs text-red-600 font-medium bg-red-100 px-2 py-1 rounded">
                Tổng quan hệ thống
              </span>
            </div>
            <div className="p-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
              {metrics.branchesNeedingAttention.slice(0, 8).map((branch) => (
                <div
                  key={branch.id}
                  className="p-3 bg-white dark:bg-gray-800 rounded-lg border border-red-100 dark:border-red-900/30 shadow-sm flex flex-col gap-3"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-bold text-gray-900 dark:text-white text-sm line-clamp-1">
                        {branch.name}
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5 font-mono">
                        {branch.code}
                      </div>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center shrink-0">
                      <Building2 className="w-4 h-4 text-red-500" />
                    </div>
                  </div>
                  <div className="flex flex-col gap-1 mt-1">
                    {branch.ui.healthSignals.slice(0, 2).map((sig, i) => (
                      <span
                        key={i}
                        className="text-[11px] text-red-600 dark:text-red-400 flex items-center gap-1"
                      >
                        • {sig}
                      </span>
                    ))}
                    {branch.ui.healthSignals.length > 2 && (
                      <span className="text-[10px] text-gray-500 italic">
                        +{branch.ui.healthSignals.length - 2} cảnh báo khác
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() =>
                      navigate(`/admin/branches/edit/${branch.id}`)
                    }
                    className="w-full py-1.5 mt-auto bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold rounded transition"
                  >
                    Cập nhật ngay
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
            { id: "pickup-only", label: "Chỉ Pickup" },
            { id: "delivery-enabled", label: "Hỗ trợ Giao hàng" },
            { id: "hybrid", label: "Hybrid" },
            { id: "needs-setup", label: "Cần Setup" },
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
              onChange={(e) => handleFilterChange("status", e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white min-w-[180px]"
            >
              <option value="all">Mọi trạng thái (Backend)</option>
              <option value="active">Hoạt động</option>
              <option value="inactive">Tạm dừng</option>
            </select>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4 w-full lg:w-auto">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Tìm tên, mã, email..."
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
                <LayoutGrid className="w-4 h-4" /> Board
              </button>
              <button
                onClick={() => setViewMode("table")}
                className={`p-1.5 rounded-md flex items-center gap-1.5 text-sm font-medium transition ${viewMode === "table" ? "bg-white dark:bg-gray-700 shadow-sm text-blue-600 dark:text-blue-400" : "text-gray-500 hover:text-gray-700"}`}
              >
                <List className="w-4 h-4" /> Table
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
            Đang đồng bộ mạng lưới...
          </p>
        </div>
      ) : error ? (
        <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          <AlertTriangle className="w-10 h-10 text-red-500 mx-auto mb-3" />
          <p className="text-red-600 font-medium">{error}</p>
        </div>
      ) : displayedRows.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-xl border border-dashed border-gray-300 dark:border-gray-600 flex flex-col items-center">
          <Building2 className="w-12 h-12 text-gray-300 dark:text-gray-600 mb-4" />
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">
            Không tìm thấy chi nhánh phù hợp
          </h3>
          <p className="text-sm text-gray-500 mt-1 mb-5">
            Hãy thử đổi từ khóa tìm kiếm hoặc xóa các bộ lọc hiện tại để xem kết
            quả.
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => navigate("/admin/branches/create")}
              className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition"
            >
              Thiết lập chi nhánh mới
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
            Hiển thị {displayedRows.length} chi nhánh ở trang hiện tại.
          </p>

          {viewMode === "board" ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 mt-4">
              {displayedRows.map((row) => (
                <div
                  key={row.id}
                  className={`border rounded-2xl p-0 transition shadow-sm group relative flex flex-col overflow-hidden bg-white dark:bg-gray-800
                    ${row.status === "inactive" ? "border-gray-200 opacity-80" : "border-gray-200 hover:border-blue-300 dark:border-gray-700"}
                  `}
                >
                  <div className="p-5 border-b border-gray-100 dark:border-gray-700/50 flex justify-between items-start gap-4 bg-gray-50/50 dark:bg-gray-800/50">
                    <div className="flex gap-3 items-start">
                      <div
                        className={`p-2.5 rounded-xl shadow-sm ${row.status === "active" ? "bg-white text-blue-600 dark:bg-gray-900" : "bg-gray-100 text-gray-500"}`}
                      >
                        <Building2 className="w-5 h-5" />
                      </div>
                      <div>
                        <h3
                          className={`font-bold text-base leading-tight line-clamp-1 ${row.status === "inactive" ? "text-gray-600" : "text-gray-900 dark:text-white"}`}
                          title={row.name}
                        >
                          {row.name}
                        </h3>
                        <p className="text-xs font-mono text-gray-500 mt-1">
                          {row.code}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <span
                        className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${statusMap[row.status].className}`}
                      >
                        {statusMap[row.status].label}
                      </span>
                    </div>
                  </div>

                  <div className="p-5 flex-1 space-y-4">
                    <div className="space-y-2.5 text-sm text-gray-600 dark:text-gray-300">
                      <div className="flex items-start gap-2.5">
                        <MapPinned className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                        <span className="line-clamp-2">
                          {formatFullAddress(row) || (
                            <span className="italic text-gray-400">
                              Chưa thiết lập địa chỉ
                            </span>
                          )}
                        </span>
                      </div>
                      <div className="flex items-center gap-2.5">
                        <Phone className="w-4 h-4 text-gray-400 shrink-0" />
                        <span>{row.phone || "—"}</span>
                        <span className="text-gray-300 dark:text-gray-600 px-1">
                          |
                        </span>
                        <Mail className="w-4 h-4 text-gray-400 shrink-0" />
                        <span className="truncate">{row.email || "—"}</span>
                      </div>
                      <div className="flex items-center gap-2.5">
                        <Clock3 className="w-4 h-4 text-gray-400 shrink-0" />
                        <span>
                          {row.openTime || "--:--"} - {row.closeTime || "--:--"}
                        </span>
                      </div>
                    </div>

                    <div className="bg-white dark:bg-gray-900 p-3 rounded-lg border border-gray-100 dark:border-gray-700 space-y-2">
                      <div className="flex gap-2 flex-wrap">
                        {row.ui.mode === "pickup-only" && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200 uppercase">
                            Chỉ Pickup
                          </span>
                        )}
                        {row.ui.mode === "delivery-only" && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200 uppercase">
                            Chỉ Giao hàng
                          </span>
                        )}
                        {row.ui.mode === "hybrid" && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 uppercase">
                            Hybrid
                          </span>
                        )}
                      </div>

                      {row.ui.healthSignals.length > 0 ? (
                        row.ui.healthSignals.map((signal, idx) => (
                          <div
                            key={idx}
                            className="flex items-start gap-1.5 text-xs font-medium text-red-600 dark:text-red-400"
                          >
                            <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                            <span>{signal}</span>
                          </div>
                        ))
                      ) : (
                        <div className="flex items-center gap-1.5 text-xs font-medium text-green-600 dark:text-green-500">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Thông tin nền tảng đầy đủ</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-700/50 flex items-center justify-between gap-2 bg-gray-50 dark:bg-gray-800">
                    <button
                      onClick={(e) => handleEdit(e, row.id)}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 text-sm font-semibold rounded shadow-sm hover:bg-gray-50 transition-colors"
                    >
                      <FolderOpen className="w-4 h-4" /> Mở Workspace
                    </button>

                    <div className="flex gap-1">
                      {row.supportsDelivery && (
                        <button
                          onClick={() =>
                            navigate(
                              `/admin/shipping/service-areas?branchId=${row.id}`,
                            )
                          }
                          className="p-2 text-gray-500 hover:text-indigo-600 bg-white hover:bg-indigo-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded shadow-sm transition"
                          title="Quản lý Giao hàng"
                        >
                          <Truck className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={(e) => handleToggleStatus(e, row)}
                        className={`p-2 rounded border shadow-sm transition ${row.status === "active" ? "text-yellow-600 bg-white border-gray-200 hover:bg-yellow-50" : "text-green-600 bg-white border-gray-200 hover:bg-green-50"} dark:bg-gray-700 dark:border-gray-600`}
                        title={row.status === "active" ? "Tạm dừng" : "Bật lại"}
                      >
                        <Power className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => handleDelete(e, row)}
                        className="p-2 text-gray-500 hover:text-red-600 bg-white hover:bg-red-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded shadow-sm transition"
                        title="Xóa mềm"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <Card className="!p-0 overflow-hidden mt-4 border border-gray-200 dark:border-gray-700">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th className="px-5 py-3.5 text-left text-xs font-bold text-gray-500 uppercase">
                        Chi nhánh
                      </th>
                      <th className="px-5 py-3.5 text-left text-xs font-bold text-gray-500 uppercase">
                        Liên hệ
                      </th>
                      <th className="px-5 py-3.5 text-left text-xs font-bold text-gray-500 uppercase">
                        Vận hành
                      </th>
                      <th className="px-5 py-3.5 text-left text-xs font-bold text-gray-500 uppercase">
                        Readiness
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
                        <td className="px-5 py-4">
                          <div className="font-semibold text-gray-900 dark:text-white text-sm">
                            {row.name}
                          </div>
                          <div className="text-xs text-gray-500 font-mono mt-0.5">
                            Code: {row.code}
                          </div>
                        </td>
                        <td className="px-5 py-4 text-sm text-gray-600 dark:text-gray-300">
                          <div>{row.phone || "—"}</div>
                          <div className="text-xs mt-1 truncate max-w-[150px]">
                            {row.email || "—"}
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          {row.ui.mode === "pickup-only" && (
                            <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">
                              Pickup Only
                            </span>
                          )}
                          {row.ui.mode === "delivery-only" && (
                            <span className="text-xs font-semibold text-purple-600 dark:text-purple-400">
                              Delivery Only
                            </span>
                          )}
                          {row.ui.mode === "hybrid" && (
                            <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                              Hybrid
                            </span>
                          )}
                          {row.ui.mode === "unconfigured" && (
                            <span className="text-xs text-gray-400">
                              Chưa cấu hình
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex flex-col gap-1.5">
                            <span
                              className={`flex items-center gap-1.5 text-xs ${row.ui.hasFullAddress ? "text-green-600" : "text-red-500"}`}
                            >
                              {row.ui.hasFullAddress ? (
                                <CheckCircle2 className="w-3 h-3" />
                              ) : (
                                <AlertCircle className="w-3 h-3" />
                              )}{" "}
                              Địa chỉ
                            </span>
                            <span
                              className={`flex items-center gap-1.5 text-xs ${row.ui.hasCoordinates ? "text-green-600" : "text-red-500"}`}
                            >
                              {row.ui.hasCoordinates ? (
                                <CheckCircle2 className="w-3 h-3" />
                              ) : (
                                <AlertCircle className="w-3 h-3" />
                              )}{" "}
                              Tọa độ
                            </span>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${statusMap[row.status].className}`}
                          >
                            {statusMap[row.status].label}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-right">
                          <div className="flex justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={(e) => handleEdit(e, row.id)}
                              className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded"
                              title="Mở Workspace"
                            >
                              <FolderOpen className="w-4 h-4" />
                            </button>
                            <button
                              onClick={(e) => handleToggleStatus(e, row)}
                              className="p-1.5 text-gray-500 hover:text-yellow-600 hover:bg-yellow-50 rounded"
                              title="Đổi trạng thái"
                            >
                              <Power className="w-4 h-4" />
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

export default BranchesPage;
