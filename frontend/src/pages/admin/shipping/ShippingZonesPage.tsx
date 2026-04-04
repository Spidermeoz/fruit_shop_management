import React, { useEffect, useMemo, useState } from "react";
import Card from "../../../components/admin/layouts/Card";
import Pagination from "../../../components/admin/common/Pagination";
import {
  Search,
  Plus,
  Edit,
  Trash2,
  Loader2,
  MapPinned,
  Power,
  Globe,
  CheckCircle2,
  AlertCircle,
  Tag,
  LayoutGrid,
  List,
  RefreshCw,
  BadgePercent,
  Truck,
  Layers,
  ArrowRight,
} from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { http } from "../../../services/http";
import { useAdminToast } from "../../../context/AdminToastContext";

// =============================
// TYPES
// =============================
type ShippingZoneStatus = "active" | "inactive";

interface ShippingZone {
  id: number;
  code: string;
  name: string;
  province?: string | null;
  district?: string | null;
  ward?: string | null;
  baseFee: number;
  freeShipThreshold?: number | null;
  priority: number;
  status: ShippingZoneStatus;
}

type ApiList<T> = {
  success: true;
  data: T[];
  meta?: { total?: number; limit?: number; offset?: number; page?: number };
};

type QuickFilterType =
  | "all"
  | "active"
  | "fallback"
  | "province"
  | "district"
  | "ward"
  | "freeship"
  | "high_priority";

// =============================
// HELPERS
// =============================
const formatCurrency = (value?: number | null) => {
  const amount = Number(value ?? 0);
  return amount.toLocaleString("vi-VN") + " đ";
};

const getZoneScopeKey = (
  zone: ShippingZone,
): "fallback" | "province" | "district" | "ward" => {
  if (zone.ward) return "ward";
  if (zone.district) return "district";
  if (zone.province) return "province";
  return "fallback";
};

const getMatchLevelInfo = (zone: ShippingZone) => {
  const scope = getZoneScopeKey(zone);
  switch (scope) {
    case "ward":
      return {
        label: "Phường/Xã",
        color:
          "text-blue-600 bg-blue-50 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400",
      };
    case "district":
      return {
        label: "Quận/Huyện",
        color:
          "text-indigo-600 bg-indigo-50 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-400",
      };
    case "province":
      return {
        label: "Tỉnh/Thành",
        color:
          "text-teal-600 bg-teal-50 border-teal-200 dark:bg-teal-900/30 dark:text-teal-400",
      };
    case "fallback":
      return {
        label: "Fallback",
        color:
          "text-gray-600 bg-gray-100 border-gray-300 dark:bg-gray-800 dark:text-gray-400",
      };
  }
};

const getZoneRuleDescription = (zone: ShippingZone) => {
  const scope = getZoneScopeKey(zone);
  switch (scope) {
    case "ward":
      return "Áp dụng riêng cho khu vực cấp phường/xã này.";
    case "district":
      return "Áp dụng cho mọi địa chỉ thuộc quận/huyện này nếu không có rule phường/xã cụ thể hơn.";
    case "province":
      return "Áp dụng cho mọi địa chỉ thuộc tỉnh/thành này nếu không có rule cụ thể hơn.";
    case "fallback":
      return "Áp dụng cho mọi địa chỉ không khớp với zone cụ thể hơn. Dùng làm rule mặc định cuối cùng.";
  }
};

const hasFreeShip = (zone: ShippingZone) =>
  zone.freeShipThreshold !== null && zone.freeShipThreshold !== undefined;

// =============================
// MAIN COMPONENT
// =============================
const ShippingZonesPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { showSuccessToast, showErrorToast } = useAdminToast();

  // --- States ---
  const [zones, setZones] = useState<ShippingZone[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [searchInput, setSearchInput] = useState(searchParams.get("q") || "");
  const [quickFilter, setQuickFilter] = useState<QuickFilterType>("all");
  const [viewMode, setViewMode] = useState<"rule" | "table">("rule");

  // URL Filters
  const statusFilter = searchParams.get("status") || "all";
  const currentPage = Number(searchParams.get("page") || 1);
  const [totalPages, setTotalPages] = useState(1);

  // --- Data Fetching ---
  const fetchZones = async () => {
    try {
      setLoading(true);
      setError("");

      const limit = 24; // Limit cao hơn cho chế độ rule cards
      const offset = (currentPage - 1) * limit;

      let url = `/api/v1/admin/shipping-zones?limit=${limit}&offset=${offset}`;

      if (statusFilter !== "all")
        url += `&status=${encodeURIComponent(statusFilter)}`;

      const q = searchParams.get("q");
      if (q?.trim()) url += `&q=${encodeURIComponent(q.trim())}`;

      const res = await http<ApiList<ShippingZone>>("GET", url);

      if (res?.success && Array.isArray(res.data)) {
        setZones(res.data);
        const total = Number(res.meta?.total ?? 0);
        setTotalPages(Math.max(1, Math.ceil(total / limit)));
      } else {
        setError("Không thể tải danh sách quy tắc vùng.");
      }
    } catch (err: any) {
      setError(err?.message || "Lỗi tải danh sách quy tắc vùng.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchZones();
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

  // --- Derived Models & Logic ---
  const enrichedZones = useMemo(() => {
    return zones.map((zone) => ({
      ...zone,
      scopeKey: getZoneScopeKey(zone),
      hasFreeShip: hasFreeShip(zone),
      isHighPriority: zone.priority === 0 || zone.priority === 1,
    }));
  }, [zones]);

  const displayedZones = useMemo(() => {
    if (quickFilter === "all") return enrichedZones;
    return enrichedZones.filter((zone) => {
      if (quickFilter === "active") return zone.status === "active";
      if (quickFilter === "fallback") return zone.scopeKey === "fallback";
      if (quickFilter === "province") return zone.scopeKey === "province";
      if (quickFilter === "district") return zone.scopeKey === "district";
      if (quickFilter === "ward") return zone.scopeKey === "ward";
      if (quickFilter === "freeship") return zone.hasFreeShip;
      if (quickFilter === "high_priority") return zone.isHighPriority;
      return true;
    });
  }, [enrichedZones, quickFilter]);

  // --- Metrics ---
  const metrics = useMemo(() => {
    const total = enrichedZones.length;
    let active = 0,
      fallback = 0,
      specific = 0,
      freeship = 0,
      highPriority = 0;

    enrichedZones.forEach((z) => {
      if (z.status === "active") active++;
      if (z.scopeKey === "fallback") fallback++;
      if (z.scopeKey === "ward") specific++;
      if (z.hasFreeShip) freeship++;
      if (z.isHighPriority) highPriority++;
    });

    return { total, active, fallback, specific, freeship, highPriority };
  }, [enrichedZones]);

  const fallbackZones = useMemo(
    () => enrichedZones.filter((z) => z.scopeKey === "fallback"),
    [enrichedZones],
  );

  // --- Actions ---
  const handleFilterChange = (status: "all" | "active" | "inactive") => {
    const params = new URLSearchParams(searchParams);
    if (status === "all") params.delete("status");
    else params.set("status", status);
    params.delete("page");
    setSearchParams(params);
  };

  const handleDelete = async (e: React.MouseEvent, zone: ShippingZone) => {
    e.stopPropagation();
    if (!window.confirm(`Bạn có chắc muốn xóa vùng "${zone.name}" không?`))
      return;
    try {
      await http("DELETE", `/api/v1/admin/shipping-zones/delete/${zone.id}`);
      showSuccessToast({ message: "Đã xóa vùng giao hàng thành công!" });
      fetchZones();
    } catch (err: any) {
      showErrorToast(err?.message || "Không thể xóa vùng giao hàng.");
    }
  };

  const handleToggleStatus = async (
    e: React.MouseEvent,
    zone: ShippingZone,
  ) => {
    e.stopPropagation();
    const nextStatus = zone.status === "active" ? "inactive" : "active";
    try {
      await http("PATCH", `/api/v1/admin/shipping-zones/${zone.id}/status`, {
        status: nextStatus,
      });
      showSuccessToast({ message: "Cập nhật trạng thái thành công!" });
      fetchZones();
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
              Quy tắc vùng giao hàng
            </h1>
            {metrics.fallback > 0 && (
              <span className="px-2.5 py-1 bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 text-xs font-bold rounded-md">
                {metrics.fallback} fallback
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Quản lý các vùng giao hàng dùng để xác định phạm vi áp dụng, rule
            tính phí và thứ tự ưu tiên match địa chỉ.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <button
            onClick={fetchZones}
            className="p-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition"
            title="Làm mới"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
          <button
            onClick={() => setQuickFilter("fallback")}
            className="px-4 py-2 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600 text-sm font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition"
          >
            Xem Fallback
          </button>
          <button
            onClick={() => navigate("/admin/shipping/service-areas")}
            className="px-4 py-2 bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 text-sm font-medium rounded-lg hover:bg-indigo-100 transition"
          >
            Mở Coverage
          </button>
          <button
            onClick={() => navigate("/admin/shipping/zones/create")}
            className="flex items-center gap-2 px-5 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition shadow-sm ml-auto md:ml-0"
          >
            <Plus className="w-4 h-4" /> Thêm quy tắc vùng
          </button>
        </div>
      </div>

      {/* Tầng B: KPI Strip */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        {[
          {
            label: "Tổng số rule vùng",
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
            label: "Vùng Fallback",
            value: metrics.fallback,
            icon: Globe,
            color: "text-gray-600",
            bg: "bg-gray-100",
          },
          {
            label: "Match rất cụ thể",
            value: metrics.specific,
            icon: MapPinned,
            color: "text-indigo-600",
            bg: "bg-indigo-50",
          },
          {
            label: "Có ngưỡng Freeship",
            value: metrics.freeship,
            icon: BadgePercent,
            color: "text-purple-600",
            bg: "bg-purple-50",
          },
          {
            label: "Priority rất cao",
            value: metrics.highPriority,
            icon: Tag,
            color: "text-amber-600",
            bg: "bg-amber-50",
          },
        ].map((kpi, idx) => (
          <div
            key={idx}
            onClick={() => {
              if (kpi.label === "Vùng Fallback") setQuickFilter("fallback");
              if (kpi.label === "Đang hoạt động") setQuickFilter("active");
              if (kpi.label === "Match rất cụ thể") setQuickFilter("ward");
              if (kpi.label === "Có ngưỡng Freeship")
                setQuickFilter("freeship");
              if (kpi.label === "Priority rất cao")
                setQuickFilter("high_priority");
            }}
            className={`p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 flex flex-col justify-center ${kpi.label !== "Tổng số rule vùng" ? "cursor-pointer hover:border-blue-400 hover:shadow-sm transition-all" : ""}`}
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

      {/* Fallback Zones Attention Section */}
      {!loading && fallbackZones.length > 0 && quickFilter !== "fallback" && (
        <Card className="border-gray-200 dark:border-gray-700 flex flex-col overflow-hidden bg-gray-50 dark:bg-gray-800/50">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
            <h3 className="font-bold text-gray-800 dark:text-gray-300 flex items-center gap-2">
              <Globe className="w-5 h-5 text-gray-500" />
              Vùng mặc định (Fallback Zones)
            </h3>
            <button
              onClick={() => setQuickFilter("fallback")}
              className="text-sm font-semibold text-blue-600 hover:text-blue-700"
            >
              Xem tất cả
            </button>
          </div>
          <div className="p-4 flex flex-wrap gap-3">
            {fallbackZones.slice(0, 3).map((zone) => (
              <div
                key={zone.id}
                className="p-3 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm flex items-center gap-4 min-w-[300px]"
              >
                <div>
                  <div className="font-bold text-gray-900 dark:text-white">
                    {zone.name}
                  </div>
                  <div className="text-xs text-gray-500 flex items-center gap-2 mt-1">
                    <span className="bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded font-mono">
                      {zone.code}
                    </span>
                    <span>• Priority: {zone.priority}</span>
                  </div>
                </div>
                <div className="ml-auto">
                  <button
                    onClick={() =>
                      navigate(
                        `/admin/shipping/service-areas?shippingZoneId=${zone.id}`,
                      )
                    }
                    className="text-xs font-bold text-blue-600 hover:underline"
                  >
                    Coverage
                  </button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Tầng D: Toolbar Phân tầng */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col gap-4">
        {/* Quick Filters */}
        <div className="flex flex-wrap items-center gap-2 border-b border-gray-100 dark:border-gray-700 pb-4">
          <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 mr-2 flex items-center gap-1.5">
            Loại rule:
          </span>
          {[
            { id: "all", label: "Tất cả" },
            { id: "active", label: "Đang hoạt động" },
            { id: "fallback", label: "Fallback" },
            { id: "province", label: "Tỉnh/Thành" },
            { id: "district", label: "Quận/Huyện" },
            { id: "ward", label: "Phường/Xã" },
            { id: "freeship", label: "Có Freeship" },
            { id: "high_priority", label: "Priority Cao" },
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
              onChange={(e) => handleFilterChange(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white"
            >
              <option value="all">Mọi trạng thái</option>
              <option value="active">Hoạt động</option>
              <option value="inactive">Tạm dừng</option>
            </select>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4 w-full lg:w-auto">
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Tìm theo tên vùng, mã vùng, tỉnh, quận..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex bg-gray-100 dark:bg-gray-900 p-1 rounded-lg shrink-0">
              <button
                onClick={() => setViewMode("rule")}
                className={`p-1.5 rounded-md flex items-center gap-1.5 text-sm font-medium transition ${viewMode === "rule" ? "bg-white dark:bg-gray-700 shadow-sm text-blue-600 dark:text-blue-400" : "text-gray-500 hover:text-gray-700"}`}
              >
                <LayoutGrid className="w-4 h-4" /> Dạng rule
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
            Đang tải quy tắc vùng giao hàng...
          </p>
        </div>
      ) : error ? (
        <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-3" />
          <p className="text-red-600 font-medium">{error}</p>
        </div>
      ) : displayedZones.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-xl border border-dashed border-gray-300 dark:border-gray-600 flex flex-col items-center">
          <MapPinned className="w-12 h-12 text-gray-300 dark:text-gray-600 mb-4" />
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">
            Không có vùng phù hợp
          </h3>
          <p className="text-sm text-gray-500 mt-1 mb-5">
            Chưa có vùng nào khớp với bộ lọc hiện tại.
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => navigate("/admin/shipping/zones/create")}
              className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition"
            >
              Thêm rule vùng
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
            Đang hiển thị {displayedZones.length} rule vùng ở trang hiện tại.
          </p>

          {viewMode === "rule" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 mt-4">
              {displayedZones.map((zone) => {
                const matchInfo = getMatchLevelInfo(zone);
                const isInactive = zone.status === "inactive";

                return (
                  <div
                    key={zone.id}
                    className={`bg-white dark:bg-gray-800 rounded-xl border transition-all flex flex-col h-full shadow-sm hover:shadow-md ${isInactive ? "opacity-80 border-gray-200" : "border-gray-200 dark:border-gray-700 hover:border-blue-300"}`}
                  >
                    {/* Layer 1: Identity & Scope */}
                    <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex-1">
                      <div className="flex justify-between items-start mb-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold border ${matchInfo.color}`}
                        >
                          {matchInfo.label}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${zone.isHighPriority ? "bg-red-100 text-red-700 border border-red-200" : "bg-gray-100 text-gray-600 border border-gray-200"}`}
                        >
                          Ưu tiên {zone.priority}
                        </span>
                      </div>

                      <h3
                        className={`font-bold text-lg mb-1 leading-tight ${isInactive ? "text-gray-600" : "text-gray-900 dark:text-white"}`}
                      >
                        {zone.name}
                      </h3>
                      <div className="text-[11px] font-mono text-gray-500 bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded w-fit mb-3">
                        {zone.code}
                      </div>

                      {zone.scopeKey !== "fallback" ? (
                        <div className="text-xs text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-800/50 p-2 rounded-lg border border-gray-100 dark:border-gray-700 space-y-1">
                          {zone.province && (
                            <div>
                              <span className="text-gray-400">Tỉnh:</span>{" "}
                              <span className="font-medium">
                                {zone.province}
                              </span>
                            </div>
                          )}
                          {zone.district && (
                            <div>
                              <span className="text-gray-400">Quận:</span>{" "}
                              <span className="font-medium">
                                {zone.district}
                              </span>
                            </div>
                          )}
                          {zone.ward && (
                            <div>
                              <span className="text-gray-400">Phường:</span>{" "}
                              <span className="font-medium">{zone.ward}</span>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-xs font-semibold text-gray-500 bg-gray-50 dark:bg-gray-800/50 p-2 rounded-lg border border-gray-100 dark:border-gray-700 text-center">
                          Áp dụng toàn quốc
                        </div>
                      )}
                    </div>

                    {/* Layer 2: Pricing Logic & Explanation */}
                    <div className="p-4 bg-gray-50/50 dark:bg-gray-800/30">
                      <div className="space-y-3">
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-gray-500 font-medium flex items-center gap-1.5">
                            <Truck className="w-4 h-4" /> Phí gốc:
                          </span>
                          <span className="font-bold text-gray-900 dark:text-white">
                            {formatCurrency(zone.baseFee)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-gray-500 font-medium flex items-center gap-1.5">
                            <BadgePercent className="w-4 h-4" /> Freeship:
                          </span>
                          <span
                            className={
                              zone.hasFreeShip
                                ? "font-bold text-green-600 dark:text-green-400"
                                : "text-gray-400 font-medium"
                            }
                          >
                            {zone.hasFreeShip
                              ? `Từ ${formatCurrency(zone.freeShipThreshold)}`
                              : "Không"}
                          </span>
                        </div>
                      </div>

                      <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700 text-[11px] text-gray-500 italic leading-relaxed">
                        {getZoneRuleDescription(zone)}
                      </div>
                    </div>

                    {/* Layer 3: Actions */}
                    <div className="p-3 border-t border-gray-100 dark:border-gray-700 flex justify-between items-center bg-white dark:bg-gray-800 rounded-b-xl">
                      <button
                        onClick={(e) => handleToggleStatus(e, zone)}
                        className={`px-2.5 py-1 text-[11px] font-bold rounded flex items-center gap-1 transition ${isInactive ? "bg-gray-100 text-gray-500 hover:bg-gray-200" : "bg-green-100 text-green-700 hover:bg-green-200"}`}
                      >
                        {isInactive ? "Tạm dừng" : "Đang bật"}
                      </button>
                      <div className="flex gap-1.5">
                        <button
                          onClick={() =>
                            navigate(
                              `/admin/shipping/service-areas?shippingZoneId=${zone.id}`,
                            )
                          }
                          className="p-1.5 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded"
                          title="Xem Coverage của zone này"
                        >
                          <ArrowRight className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/admin/shipping/zones/edit/${zone.id}`);
                          }}
                          className="p-1.5 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded"
                          title="Sửa"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => handleDelete(e, zone)}
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
                        Quy tắc Vùng
                      </th>
                      <th className="px-5 py-3.5 text-left text-xs font-bold text-gray-500 uppercase">
                        Phạm vi Match
                      </th>
                      <th className="px-5 py-3.5 text-left text-xs font-bold text-gray-500 uppercase">
                        Phí cơ bản
                      </th>
                      <th className="px-5 py-3.5 text-left text-xs font-bold text-gray-500 uppercase">
                        Freeship
                      </th>
                      <th className="px-5 py-3.5 text-left text-xs font-bold text-gray-500 uppercase">
                        Ưu tiên
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
                    {displayedZones.map((zone) => {
                      const matchInfo = getMatchLevelInfo(zone);
                      return (
                        <tr
                          key={zone.id}
                          className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group cursor-pointer"
                          onClick={() =>
                            navigate(`/admin/shipping/zones/edit/${zone.id}`)
                          }
                        >
                          <td className="px-5 py-3.5">
                            <div className="font-bold text-gray-900 dark:text-white text-sm">
                              {zone.name}
                            </div>
                            <div className="text-xs text-gray-500 font-mono mt-0.5">
                              {zone.code}
                            </div>
                          </td>
                          <td className="px-5 py-3.5">
                            <span
                              className={`inline-flex px-2 py-0.5 rounded text-[11px] font-bold border ${matchInfo.color}`}
                            >
                              {matchInfo.label}
                            </span>
                            <div className="text-xs text-gray-500 mt-1 max-w-[200px] truncate">
                              {zone.scopeKey === "fallback"
                                ? "Toàn quốc"
                                : [zone.ward, zone.district, zone.province]
                                    .filter(Boolean)
                                    .join(", ")}
                            </div>
                          </td>
                          <td className="px-5 py-3.5">
                            <span className="font-bold text-gray-900 dark:text-white text-sm">
                              {formatCurrency(zone.baseFee)}
                            </span>
                          </td>
                          <td className="px-5 py-3.5">
                            {zone.hasFreeShip ? (
                              <span className="text-sm font-bold text-green-600 dark:text-green-400">
                                Từ {formatCurrency(zone.freeShipThreshold)}
                              </span>
                            ) : (
                              <span className="text-gray-400 font-medium">
                                Không
                              </span>
                            )}
                          </td>
                          <td className="px-5 py-3.5">
                            <span
                              className={`px-2 py-0.5 rounded text-xs font-bold ${zone.isHighPriority ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-700"}`}
                            >
                              P{zone.priority}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 text-center">
                            <span
                              className={`inline-flex px-2 py-1 rounded text-[10px] font-bold ${zone.status === "active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}
                            >
                              {zone.status === "active"
                                ? "Hoạt động"
                                : "Tạm dừng"}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 text-right">
                            <div className="flex justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(
                                    `/admin/shipping/service-areas?shippingZoneId=${zone.id}`,
                                  );
                                }}
                                className="p-1.5 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded"
                                title="Xem Coverage"
                              >
                                <ArrowRight className="w-4 h-4" />
                              </button>
                              <button
                                onClick={(e) => handleToggleStatus(e, zone)}
                                className="p-1.5 text-gray-500 hover:text-yellow-600 hover:bg-yellow-50 rounded"
                                title="Đổi trạng thái"
                              >
                                <Power className="w-4 h-4" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(
                                    `/admin/shipping/zones/edit/${zone.id}`,
                                  );
                                }}
                                className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded"
                                title="Sửa"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={(e) => handleDelete(e, zone)}
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

export default ShippingZonesPage;
