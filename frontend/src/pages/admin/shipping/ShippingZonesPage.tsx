import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  AlertTriangle,
  ArrowUpDown,
  CheckCircle2,
  Copy,
  Edit,
  Layers,
  LayoutGrid,
  List,
  Loader2,
  MapPinned,
  Plus,
  Power,
  RefreshCw,
  Search,
  ShieldAlert,
  Trash2,
} from "lucide-react";
import Card from "../../../components/admin/layouts/Card";
import { http } from "../../../services/http";
import { useAdminToast } from "../../../context/AdminToastContext";

type ZoneStatus = "active" | "inactive";
type ViewMode = "table" | "board";
type QuickFilter =
  | "all"
  | "active"
  | "inactive"
  | "fallback"
  | "ward"
  | "district"
  | "province";

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
  status: ZoneStatus;
  createdAt?: string;
  updatedAt?: string;
}

interface ApiList<T> {
  success?: boolean;
  data?: T[] | { items?: T[]; rows?: T[] };
  meta?: { total?: number; page?: number; limit?: number };
}

const toArray = <T,>(input: ApiList<T>["data"] | undefined): T[] => {
  if (Array.isArray(input)) return input;
  if (Array.isArray(input?.items)) return input.items;
  if (Array.isArray((input as { rows?: T[] } | undefined)?.rows)) {
    return ((input as { rows?: T[] }).rows ?? []) as T[];
  }
  return [];
};

const formatCurrency = (value?: number | null) => {
  if (value === null || value === undefined) return "—";
  return `${Number(value).toLocaleString("vi-VN")} đ`;
};

const getScope = (
  zone: ShippingZone,
): "fallback" | "province" | "district" | "ward" => {
  if (!zone.province && !zone.district && !zone.ward) return "fallback";
  if (zone.ward) return "ward";
  if (zone.district) return "district";
  return "province";
};

const getScopeLabel = (scope: ReturnType<typeof getScope>) => {
  switch (scope) {
    case "ward":
      return "Phường / xã";
    case "district":
      return "Quận / huyện";
    case "province":
      return "Tỉnh / thành";
    default:
      return "Fallback";
  }
};

const getScopePrioritySuggestion = (scope: ReturnType<typeof getScope>) => {
  switch (scope) {
    case "ward":
      return 1;
    case "district":
      return 5;
    case "province":
      return 10;
    default:
      return 999;
  }
};

const quickFilters: Array<{ key: QuickFilter; label: string }> = [
  { key: "all", label: "Tất cả" },
  { key: "active", label: "Đang chạy" },
  { key: "inactive", label: "Tạm dừng" },
  { key: "fallback", label: "Fallback" },
  { key: "province", label: "Tỉnh / thành" },
  { key: "district", label: "Quận / huyện" },
  { key: "ward", label: "Phường / xã" },
];

const ShippingZonesPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { showSuccessToast, showErrorToast } = useAdminToast();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [zones, setZones] = useState<ShippingZone[]>([]);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [bulkPriorityValue, setBulkPriorityValue] = useState<string>("");

  const keyword = searchParams.get("q") ?? "";
  const view = (searchParams.get("view") as ViewMode) || "table";
  const quickFilter = (searchParams.get("quick") as QuickFilter) || "all";

  const fetchZones = useCallback(async () => {
    try {
      setLoading(true);
      const query = new URLSearchParams({ page: "1", limit: "1000" });
      if (keyword.trim()) query.set("q", keyword.trim());

      const response = await http<ApiList<ShippingZone>>(
        "GET",
        `/api/v1/admin/shipping-zones?${query.toString()}`,
      );

      setZones(toArray(response?.data));
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : "Không thể tải danh sách vùng giao hàng.";
      showErrorToast(message);
    } finally {
      setLoading(false);
    }
  }, [keyword, showErrorToast]);

  useEffect(() => {
    void fetchZones();
  }, [fetchZones]);

  const filteredZones = useMemo(() => {
    return zones.filter((zone) => {
      const scope = getScope(zone);
      if (quickFilter === "active") return zone.status === "active";
      if (quickFilter === "inactive") return zone.status === "inactive";
      if (["fallback", "ward", "district", "province"].includes(quickFilter)) {
        return scope === quickFilter;
      }
      return true;
    });
  }, [quickFilter, zones]);

  const selectedZones = useMemo(
    () => filteredZones.filter((zone) => selectedIds.includes(zone.id)),
    [filteredZones, selectedIds],
  );

  const summary = useMemo(() => {
    const fallbackCount = filteredZones.filter(
      (zone) => getScope(zone) === "fallback",
    ).length;
    const inactiveCount = filteredZones.filter(
      (zone) => zone.status === "inactive",
    ).length;
    const wardCount = filteredZones.filter(
      (zone) => getScope(zone) === "ward",
    ).length;
    return {
      total: filteredZones.length,
      fallbackCount,
      inactiveCount,
      wardCount,
    };
  }, [filteredZones]);

  const grouped = useMemo(() => {
    return {
      fallback: filteredZones.filter((zone) => getScope(zone) === "fallback"),
      province: filteredZones.filter((zone) => getScope(zone) === "province"),
      district: filteredZones.filter((zone) => getScope(zone) === "district"),
      ward: filteredZones.filter((zone) => getScope(zone) === "ward"),
    };
  }, [filteredZones]);

  const updateParam = (key: string, value?: string) => {
    const next = new URLSearchParams(searchParams);
    if (!value) next.delete(key);
    else next.set(key, value);
    setSearchParams(next, { replace: true });
  };

  const toggleSelectAll = () => {
    const ids = filteredZones.map((zone) => zone.id);
    if (ids.every((id) => selectedIds.includes(id))) {
      setSelectedIds((prev) => prev.filter((id) => !ids.includes(id)));
    } else {
      setSelectedIds(Array.from(new Set([...selectedIds, ...ids])));
    }
  };

  const toggleSelect = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  const runBulkStatus = async (status: ZoneStatus) => {
    if (!selectedIds.length) {
      showErrorToast("Hãy chọn ít nhất một zone để đổi trạng thái.");
      return;
    }
    try {
      setSubmitting(true);
      await http("PATCH", "/api/v1/admin/shipping-zones/bulk/status", {
        ids: selectedIds,
        status,
      });
      showSuccessToast({
        message: `Đã cập nhật ${selectedIds.length} zone sang trạng thái ${
          status === "active" ? "đang chạy" : "tạm dừng"
        }.`,
      });
      setSelectedIds([]);
      await fetchZones();
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : "Không thể cập nhật trạng thái hàng loạt.";
      showErrorToast(message);
    } finally {
      setSubmitting(false);
    }
  };

  const runBulkPriority = async () => {
    const priority = Number(bulkPriorityValue);
    if (!selectedIds.length) {
      showErrorToast("Hãy chọn ít nhất một zone để cập nhật priority.");
      return;
    }
    if (!Number.isInteger(priority) || priority < 0) {
      showErrorToast("Priority hàng loạt phải là số nguyên không âm.");
      return;
    }
    try {
      setSubmitting(true);
      await http("PATCH", "/api/v1/admin/shipping-zones/bulk/priority", {
        items: selectedIds.map((id) => ({ id, priority })),
      });
      showSuccessToast({
        message: `Đã cập nhật priority = ${priority} cho ${selectedIds.length} zone.`,
      });
      setBulkPriorityValue("");
      await fetchZones();
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : "Không thể cập nhật priority hàng loạt.";
      showErrorToast(message);
    } finally {
      setSubmitting(false);
    }
  };

  const runBulkDelete = async () => {
    if (!selectedIds.length) {
      showErrorToast("Hãy chọn ít nhất một zone để xóa mềm.");
      return;
    }
    const confirmed = window.confirm(
      `Bạn có chắc muốn xóa mềm ${selectedIds.length} zone đã chọn không?`,
    );
    if (!confirmed) return;

    try {
      setSubmitting(true);
      await http("DELETE", "/api/v1/admin/shipping-zones/bulk/delete", {
        ids: selectedIds,
      });
      showSuccessToast({ message: `Đã xóa mềm ${selectedIds.length} zone.` });
      setSelectedIds([]);
      await fetchZones();
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : "Không thể xóa hàng loạt zone.";
      showErrorToast(message);
    } finally {
      setSubmitting(false);
    }
  };

  const runQuickStatus = async (zone: ShippingZone, status: ZoneStatus) => {
    try {
      await http("PATCH", `/api/v1/admin/shipping-zones/${zone.id}/status`, {
        status,
      });
      showSuccessToast({
        message: `Đã ${status === "active" ? "bật" : "tắt"} zone ${zone.code}.`,
      });
      await fetchZones();
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : "Không thể cập nhật trạng thái zone.";
      showErrorToast(message);
    }
  };

  const renderBoardGroup = (title: string, items: ShippingZone[]) => (
    <div className="space-y-4">
      <div className="flex items-center justify-between pb-2 border-b border-gray-100 dark:border-gray-700">
        <div>
          <h3 className="text-sm font-bold text-gray-900 dark:text-white">
            {title}
          </h3>
          <p className="text-xs text-gray-500">{items.length} zone</p>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-6 text-sm text-gray-500 text-center dark:border-gray-600 dark:bg-gray-800/50">
          Không có zone nào trong nhóm này.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {items.map((zone) => {
            const scope = getScope(zone);
            const locationLabel =
              [zone.ward, zone.district, zone.province]
                .filter(Boolean)
                .join(", ") || "Fallback toàn hệ thống";

            return (
              <div
                key={zone.id}
                className={`border rounded-2xl p-0 transition shadow-sm group flex flex-col overflow-hidden bg-white dark:bg-gray-800
                  ${zone.status === "inactive" ? "border-gray-200 opacity-80" : "border-gray-200 hover:border-blue-300 dark:border-gray-700"}
                `}
              >
                <div className="p-4 border-b border-gray-100 dark:border-gray-700/50 flex justify-between items-start gap-4 bg-gray-50/50 dark:bg-gray-800/50">
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(zone.id)}
                      onChange={() => toggleSelect(zone.id)}
                      className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <div>
                      <h3
                        className={`font-bold text-base leading-tight line-clamp-1 ${zone.status === "inactive" ? "text-gray-600" : "text-gray-900 dark:text-white"}`}
                        title={zone.name}
                      >
                        {zone.name}
                      </h3>
                      <div className="flex flex-wrap items-center gap-2 mt-1">
                        <span className="text-xs font-mono text-gray-500 bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded">
                          {zone.code}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                            zone.status === "active"
                              ? "bg-green-100 text-green-800 border border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800"
                              : "bg-gray-100 text-gray-600 border border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700"
                          }`}
                        >
                          {zone.status === "active" ? "Đang chạy" : "Tạm dừng"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-4 flex-1 space-y-4">
                  <p className="text-sm text-gray-600 dark:text-gray-300 flex items-start gap-2.5">
                    <MapPinned className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                    <span className="line-clamp-2">{locationLabel}</span>
                  </p>

                  <div className="bg-white dark:bg-gray-900 p-3 rounded-lg border border-gray-100 dark:border-gray-700 grid grid-cols-3 gap-2">
                    <div className="flex flex-col">
                      <span className="text-[10px] text-gray-500 uppercase font-semibold">
                        Phạm vi
                      </span>
                      <span
                        className="text-sm font-bold text-gray-900 dark:text-white truncate"
                        title={getScopeLabel(scope)}
                      >
                        {getScopeLabel(scope)}
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] text-gray-500 uppercase font-semibold">
                        Base fee
                      </span>
                      <span className="text-sm font-bold text-gray-900 dark:text-white">
                        {formatCurrency(zone.baseFee)}
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] text-gray-500 uppercase font-semibold">
                        Priority
                      </span>
                      <span className="text-sm font-bold text-gray-900 dark:text-white">
                        {zone.priority}
                      </span>
                    </div>
                  </div>

                  {zone.priority !== getScopePrioritySuggestion(scope) && (
                    <div className="flex items-start gap-1.5 text-xs font-medium text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 p-2 rounded border border-amber-100 dark:border-amber-900/30">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                      <span>
                        Gợi ý: zone cấp <strong>{getScopeLabel(scope)}</strong>{" "}
                        thường hợp lý với priority{" "}
                        <strong>{getScopePrioritySuggestion(scope)}</strong>.
                      </span>
                    </div>
                  )}
                </div>

                <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-700/50 flex flex-wrap items-center gap-2 bg-gray-50 dark:bg-gray-800">
                  <button
                    onClick={() =>
                      navigate(`/admin/shipping/zones/edit/${zone.id}`)
                    }
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 text-xs font-semibold rounded shadow-sm hover:bg-gray-50 transition-colors"
                  >
                    <Edit className="w-3.5 h-3.5" /> Chỉnh sửa
                  </button>
                  <button
                    onClick={() =>
                      navigate(
                        `/admin/shipping/service-areas/create?shippingZoneId=${zone.id}`,
                      )
                    }
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 text-xs font-semibold rounded shadow-sm hover:bg-gray-50 transition-colors"
                  >
                    <MapPinned className="w-3.5 h-3.5" /> Gán
                  </button>
                  <button
                    onClick={() =>
                      navigate(
                        `/admin/shipping/zones/create?templateId=${zone.id}`,
                      )
                    }
                    className="p-1.5 text-gray-500 hover:text-blue-600 bg-white hover:bg-blue-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded shadow-sm transition"
                    title="Nhân bản"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() =>
                      runQuickStatus(
                        zone,
                        zone.status === "active" ? "inactive" : "active",
                      )
                    }
                    className={`p-1.5 rounded border shadow-sm transition ${zone.status === "active" ? "text-amber-600 bg-white border-gray-200 hover:bg-amber-50" : "text-green-600 bg-white border-gray-200 hover:bg-green-50"} dark:bg-gray-700 dark:border-gray-600`}
                    title={zone.status === "active" ? "Tạm dừng" : "Bật lại"}
                  >
                    <Power className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  return (
    <div className="w-full pb-10 space-y-6">
      {/* Tầng A: Header / Command Bar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Shipping zones
            </h1>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Quản lý zone theo hướng vận hành thực tế: bulk status, bulk
            priority, bulk delete, duplicate từ zone mẫu và nối nhanh sang
            coverage.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <button
            onClick={() => void fetchZones()}
            className="p-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition"
            title="Làm mới dữ liệu"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? "animate-spin" : ""}`} />
          </button>
          <button
            onClick={() => navigate("/admin/shipping/service-areas")}
            className="px-4 py-2 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600 text-sm font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition"
          >
            <Layers className="w-4 h-4 inline-block mr-1.5" /> Mở coverage
          </button>
          <button
            onClick={() => navigate("/admin/shipping/zones/create")}
            className="flex items-center gap-2 px-5 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition shadow-sm ml-auto md:ml-0"
          >
            <Plus className="w-4 h-4" /> Tạo zone mới
          </button>
        </div>
      </div>

      {/* Tầng B: KPI Strip */}
      <div className="grid grid-cols-2 md:grid-cols-2 xl:grid-cols-4 gap-3">
        {[
          {
            label: "Tổng zone",
            value: summary.total,
            icon: Layers,
            color: "text-blue-600",
            bg: "bg-blue-50",
          },
          {
            label: "Đang chạy",
            value: filteredZones.filter((z) => z.status === "active").length,
            icon: CheckCircle2,
            color: "text-green-600",
            bg: "bg-green-50",
          },
          {
            label: "Fallback zone",
            value: summary.fallbackCount,
            icon: ShieldAlert,
            color: "text-amber-600",
            bg: "bg-amber-50",
            isWarning: summary.fallbackCount > 0,
          },
          {
            label: "Match hẹp (ward)",
            value: summary.wardCount,
            icon: AlertTriangle,
            color: "text-indigo-600",
            bg: "bg-indigo-50",
          },
        ].map((kpi, idx) => (
          <div
            key={idx}
            className="p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 flex flex-col justify-center cursor-default hover:border-blue-400 hover:shadow-sm transition-all"
          >
            <div className="flex items-center gap-2 mb-2">
              <kpi.icon className={`w-4 h-4 ${kpi.color}`} />
              <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 truncate">
                {kpi.label}
              </span>
            </div>
            <div
              className={`text-xl font-black ${kpi.isWarning ? "text-amber-600 dark:text-amber-400" : "text-gray-900 dark:text-white"}`}
            >
              {kpi.value}
            </div>
          </div>
        ))}
      </div>

      {/* Tầng D: Toolbar Phân tầng */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col gap-4">
        {/* Quick Filters */}
        <div className="flex flex-wrap items-center gap-2 border-b border-gray-100 dark:border-gray-700 pb-4">
          <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 mr-2 flex items-center gap-1.5">
            Phân loại:
          </span>
          {quickFilters.map((item) => (
            <button
              key={item.key}
              onClick={() =>
                updateParam("quick", item.key === "all" ? undefined : item.key)
              }
              className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                quickFilter === item.key
                  ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                  : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:border-gray-300"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Advanced Filters & Views */}
        <div className="flex flex-col lg:flex-row justify-between items-center gap-4">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm theo code, tên zone, địa danh..."
              value={keyword}
              onChange={(e) => updateParam("q", e.target.value || undefined)}
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex bg-gray-100 dark:bg-gray-900 p-1 rounded-lg shrink-0 w-full sm:w-auto justify-center">
            <button
              onClick={() => updateParam("view", "board")}
              className={`p-1.5 px-3 rounded-md flex items-center gap-1.5 text-sm font-medium transition ${view === "board" ? "bg-white dark:bg-gray-700 shadow-sm text-blue-600 dark:text-blue-400" : "text-gray-500 hover:text-gray-700"}`}
            >
              <LayoutGrid className="w-4 h-4" /> Board
            </button>
            <button
              onClick={() => updateParam("view", "table")}
              className={`p-1.5 px-3 rounded-md flex items-center gap-1.5 text-sm font-medium transition ${view === "table" ? "bg-white dark:bg-gray-700 shadow-sm text-blue-600 dark:text-blue-400" : "text-gray-500 hover:text-gray-700"}`}
            >
              <List className="w-4 h-4" /> Table
            </button>
          </div>
        </div>
      </div>

      {/* Bulk Workspace (Thay thế Attention Section) */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col gap-4">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
              Bulk workspace
            </h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Chọn nhiều zone để đổi trạng thái, dời priority hoặc xóa mềm.
            </p>
            <p className="mt-2 text-sm font-medium text-gray-700 dark:text-gray-300">
              Đang chọn:{" "}
              <span className="font-bold text-blue-600 dark:text-blue-400">
                {selectedIds.length}
              </span>{" "}
              zone
            </p>
          </div>

          <div className="flex flex-col gap-3 xl:items-end">
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={toggleSelectAll}
                className="px-3 py-1.5 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 text-sm font-semibold rounded-lg hover:bg-gray-50 transition"
              >
                {filteredZones.length > 0 &&
                filteredZones.every((zone) => selectedIds.includes(zone.id))
                  ? "Bỏ chọn tất cả"
                  : "Chọn tất cả"}
              </button>

              <button
                type="button"
                onClick={() => void runBulkStatus("active")}
                disabled={submitting}
                className="px-3 py-1.5 bg-green-50 text-green-700 border border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800 text-sm font-semibold rounded-lg hover:bg-green-100 transition disabled:opacity-60"
              >
                Bật hàng loạt
              </button>

              <button
                type="button"
                onClick={() => void runBulkStatus("inactive")}
                disabled={submitting}
                className="px-3 py-1.5 bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800 text-sm font-semibold rounded-lg hover:bg-amber-100 transition disabled:opacity-60"
              >
                Tạm dừng hàng loạt
              </button>

              <button
                type="button"
                onClick={() => void runBulkDelete()}
                disabled={submitting}
                className="px-3 py-1.5 bg-red-50 text-red-700 border border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800 text-sm font-semibold rounded-lg hover:bg-red-100 transition disabled:opacity-60"
              >
                Xóa mềm hàng loạt
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <ArrowUpDown className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <input
                  value={bulkPriorityValue}
                  onChange={(event) => setBulkPriorityValue(event.target.value)}
                  type="number"
                  min={0}
                  placeholder="Priority mới"
                  className="w-36 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 py-2 pl-9 pr-3 text-sm text-gray-900 dark:text-white outline-none transition focus:border-gray-400 focus:ring-1 focus:ring-gray-400"
                />
              </div>
              <button
                type="button"
                onClick={() => void runBulkPriority()}
                disabled={submitting}
                className="px-3 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 text-sm font-semibold rounded-lg hover:bg-gray-50 transition disabled:opacity-60"
              >
                Cập nhật priority
              </button>
            </div>
          </div>
        </div>

        {selectedZones.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {selectedZones.slice(0, 12).map((zone) => (
              <span
                key={zone.id}
                className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-gray-50 dark:bg-gray-700 dark:border-gray-600 px-3 py-1 text-xs font-bold text-gray-700 dark:text-gray-300 font-mono"
              >
                {zone.code}
                <button
                  type="button"
                  onClick={() => toggleSelect(zone.id)}
                  className="text-gray-400 hover:text-red-500 transition"
                >
                  ×
                </button>
              </span>
            ))}
            {selectedZones.length > 12 && (
              <span className="inline-flex items-center rounded-full border border-gray-200 bg-gray-100 dark:bg-gray-800 dark:border-gray-700 px-3 py-1 text-xs font-bold text-gray-500">
                +{selectedZones.length - 12} zone khác
              </span>
            )}
          </div>
        )}
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="flex flex-col justify-center items-center py-24 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-3" />
          <p className="text-gray-500 font-medium">
            Đang đồng bộ mạng lưới zone...
          </p>
        </div>
      ) : view === "board" ? (
        <div className="space-y-8">
          {renderBoardGroup("Fallback", grouped.fallback)}
          {renderBoardGroup("Tỉnh / thành", grouped.province)}
          {renderBoardGroup("Quận / huyện", grouped.district)}
          {renderBoardGroup("Phường / xã", grouped.ward)}
        </div>
      ) : (
        <Card className="!p-0 overflow-hidden mt-4 border border-gray-200 dark:border-gray-700 shadow-none">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-5 py-3.5 text-left text-xs font-bold text-gray-500 uppercase">
                    <input
                      type="checkbox"
                      checked={
                        filteredZones.length > 0 &&
                        filteredZones.every((zone) =>
                          selectedIds.includes(zone.id),
                        )
                      }
                      onChange={toggleSelectAll}
                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </th>
                  <th className="px-5 py-3.5 text-left text-xs font-bold text-gray-500 uppercase">
                    Zone
                  </th>
                  <th className="px-5 py-3.5 text-left text-xs font-bold text-gray-500 uppercase">
                    Phạm vi
                  </th>
                  <th className="px-5 py-3.5 text-left text-xs font-bold text-gray-500 uppercase">
                    Base fee
                  </th>
                  <th className="px-5 py-3.5 text-left text-xs font-bold text-gray-500 uppercase">
                    Freeship
                  </th>
                  <th className="px-5 py-3.5 text-left text-xs font-bold text-gray-500 uppercase">
                    Priority
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
                {filteredZones.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-20 text-center">
                      <div className="flex flex-col items-center justify-center text-gray-500">
                        <MapPinned className="w-10 h-10 text-gray-300 dark:text-gray-600 mb-3" />
                        <span className="font-medium">
                          Không có zone nào phù hợp với bộ lọc hiện tại.
                        </span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredZones.map((zone) => {
                    const scope = getScope(zone);
                    const locationLabel =
                      [zone.ward, zone.district, zone.province]
                        .filter(Boolean)
                        .join(", ") || "Fallback toàn hệ thống";

                    return (
                      <tr
                        key={zone.id}
                        className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group"
                      >
                        <td className="px-5 py-4">
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(zone.id)}
                            onChange={() => toggleSelect(zone.id)}
                            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                        </td>
                        <td className="px-5 py-4">
                          <div className="font-semibold text-gray-900 dark:text-white text-sm">
                            {zone.name}
                          </div>
                          <div className="text-xs text-gray-500 font-mono mt-0.5">
                            {zone.code}
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <span className="inline-flex px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 border border-gray-200 dark:border-gray-700">
                            {getScopeLabel(scope)}
                          </span>
                          <div
                            className="text-xs text-gray-500 mt-1 line-clamp-1 max-w-[150px]"
                            title={locationLabel}
                          >
                            {locationLabel}
                          </div>
                        </td>
                        <td className="px-5 py-4 text-sm font-medium text-gray-700 dark:text-gray-300">
                          {formatCurrency(zone.baseFee)}
                        </td>
                        <td className="px-5 py-4 text-sm text-gray-600 dark:text-gray-400">
                          {formatCurrency(zone.freeShipThreshold)}
                        </td>
                        <td className="px-5 py-4 text-sm font-bold text-gray-900 dark:text-white">
                          {zone.priority}
                        </td>
                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${
                              zone.status === "active"
                                ? "bg-green-100 text-green-800 border border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800"
                                : "bg-gray-100 text-gray-600 border border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700"
                            }`}
                          >
                            {zone.status === "active"
                              ? "Đang chạy"
                              : "Tạm dừng"}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-right">
                          <div className="flex justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() =>
                                navigate(
                                  `/admin/shipping/zones/create?templateId=${zone.id}`,
                                )
                              }
                              className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded"
                              title="Nhân bản"
                            >
                              <Copy className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() =>
                                navigate(
                                  `/admin/shipping/zones/edit/${zone.id}`,
                                )
                              }
                              className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded"
                              title="Chỉnh sửa"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() =>
                                runQuickStatus(
                                  zone,
                                  zone.status === "active"
                                    ? "inactive"
                                    : "active",
                                )
                              }
                              className="p-1.5 text-gray-500 hover:text-amber-600 hover:bg-amber-50 rounded"
                              title="Đổi trạng thái"
                            >
                              <Power className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                setSelectedIds([zone.id]);
                                void runBulkDelete();
                              }}
                              className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded"
                              title="Xóa mềm"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
};

export default ShippingZonesPage;
