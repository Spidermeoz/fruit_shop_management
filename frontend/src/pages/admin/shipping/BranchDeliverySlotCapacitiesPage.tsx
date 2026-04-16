import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  AlertTriangle,
  CalendarClock,
  CalendarDays,
  CheckCircle2,
  Copy,
  Edit,
  Grid,
  List,
  Loader2,
  Plus,
  RefreshCw,
  Search,
  ShieldAlert,
  Store,
  Zap,
} from "lucide-react";
import Card from "../../../components/admin/layouts/Card";
import { http } from "../../../services/http";
import { useAdminToast } from "../../../context/AdminToastContext";

type CapacityStatus = "active" | "inactive";
type ViewMode = "planner" | "table";
type BulkMode = "skip_existing" | "overwrite" | "fail_on_conflict";

interface BranchOption {
  id: number;
  name: string;
  code: string;
}

interface SlotOption {
  id: number;
  code: string;
  label: string;
  startTime?: string;
  endTime?: string;
}

interface CapacityRow {
  id: number;
  branchId: number;
  deliveryDate: string;
  deliveryTimeSlotId: number;
  maxOrders?: number | null;
  reservedOrders: number;
  status: CapacityStatus;
}

interface PlannerCell {
  branchId: number;
  deliveryTimeSlotId: number;
  capacityId?: number | null;
  maxOrders?: number | null;
  reservedOrders?: number;
  status?: CapacityStatus;
}

interface PlannerResponse {
  deliveryDate: string;
  branches: BranchOption[];
  slots: SlotOption[];
  cells: PlannerCell[];
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

const getLocalDateString = (offsetDays = 0) => {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 10);
};

const getCellState = (
  cell: Pick<PlannerCell, "status" | "maxOrders" | "reservedOrders">,
) => {
  if (cell.status === "inactive") return "inactive" as const;
  if (cell.maxOrders === null || cell.maxOrders === undefined)
    return "unlimited" as const;
  const reserved = cell.reservedOrders ?? 0;
  if (reserved >= cell.maxOrders) return "full" as const;
  if (cell.maxOrders > 0 && reserved / cell.maxOrders >= 0.8)
    return "warning" as const;
  return "available" as const;
};

const formatCapacity = (value?: number | null) => {
  if (value === null || value === undefined) return "∞";
  return Number(value).toLocaleString("vi-VN");
};

const BranchDeliverySlotCapacitiesPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { showSuccessToast, showErrorToast } = useAdminToast();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [branches, setBranches] = useState<BranchOption[]>([]);
  const [slots, setSlots] = useState<SlotOption[]>([]);
  const [rows, setRows] = useState<CapacityRow[]>([]);
  const [planner, setPlanner] = useState<PlannerResponse | null>(null);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [copyFromDate, setCopyFromDate] = useState<string>(
    getLocalDateString(0),
  );
  const [bulkMode, setBulkMode] = useState<BulkMode>("overwrite");

  const keyword = searchParams.get("q") ?? "";
  const deliveryDate =
    searchParams.get("deliveryDate") ?? getLocalDateString(1);
  const view = (searchParams.get("view") as ViewMode) || "planner";
  const branchId = searchParams.get("branchId") ?? "";
  const status = searchParams.get("status") ?? "";

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const query = new URLSearchParams({
        page: "1",
        limit: "1000",
        deliveryDate,
      });
      if (keyword.trim()) query.set("q", keyword.trim());
      if (branchId) query.set("branchId", branchId);
      if (status) query.set("status", status);

      const plannerQuery = new URLSearchParams({ deliveryDate });
      if (branchId) plannerQuery.set("branchIds", branchId);

      const [branchesRes, slotsRes, rowsRes, plannerRes] = await Promise.all([
        http<ApiList<BranchOption>>(
          "GET",
          "/api/v1/admin/branches?limit=1000&status=active",
        ),
        http<ApiList<SlotOption>>(
          "GET",
          "/api/v1/admin/delivery-time-slots?page=1&limit=1000&status=active",
        ),
        http<ApiList<CapacityRow>>(
          "GET",
          `/api/v1/admin/branch-delivery-slot-capacities?${query.toString()}`,
        ),
        http<{ success?: boolean; data?: PlannerResponse }>(
          "GET",
          `/api/v1/admin/branch-delivery-slot-capacities/planner?${plannerQuery.toString()}`,
        ),
      ]);

      setBranches(toArray(branchesRes?.data));
      setSlots(toArray(slotsRes?.data));
      setRows(toArray(rowsRes?.data));
      setPlanner(plannerRes?.data ?? null);
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : "Không thể tải planner capacities.";
      showErrorToast(message);
    } finally {
      setLoading(false);
    }
  }, [branchId, deliveryDate, keyword, showErrorToast, status]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const updateParam = (key: string, value?: string) => {
    const next = new URLSearchParams(searchParams);
    if (!value) next.delete(key);
    else next.set(key, value);
    setSearchParams(next, { replace: true });
  };

  const branchMap = useMemo(
    () => new Map(branches.map((item) => [item.id, item])),
    [branches],
  );
  const slotMap = useMemo(
    () => new Map(slots.map((item) => [item.id, item])),
    [slots],
  );

  const summary = useMemo(() => {
    const activeRows = rows.filter((row) => row.status === "active");
    const critical = activeRows.filter(
      (row) => getCellState(row) === "full",
    ).length;
    const warning = activeRows.filter(
      (row) => getCellState(row) === "warning",
    ).length;
    const inactive = rows.filter((row) => row.status === "inactive").length;
    return {
      total: rows.length,
      critical,
      warning,
      inactive,
    };
  }, [rows]);

  const selectedRows = useMemo(
    () => rows.filter((row) => selectedIds.includes(row.id)),
    [rows, selectedIds],
  );

  const toggleSelect = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  const toggleSelectAll = () => {
    const ids = rows.map((row) => row.id);
    if (ids.every((id) => selectedIds.includes(id))) {
      setSelectedIds((prev) => prev.filter((id) => !ids.includes(id)));
    } else {
      setSelectedIds(ids);
    }
  };

  const runBulkStatus = async (nextStatus: CapacityStatus) => {
    if (!selectedIds.length) {
      showErrorToast("Hãy chọn ít nhất một capacity để đổi trạng thái.");
      return;
    }
    try {
      setSubmitting(true);
      await http(
        "PATCH",
        "/api/v1/admin/branch-delivery-slot-capacities/bulk/status",
        {
          ids: selectedIds,
          status: nextStatus,
        },
      );
      showSuccessToast({
        message: `Đã cập nhật ${selectedIds.length} capacity.`,
      });
      setSelectedIds([]);
      await fetchData();
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : "Không thể đổi trạng thái capacities.";
      showErrorToast(message);
    } finally {
      setSubmitting(false);
    }
  };

  const runCopyFromDate = async () => {
    try {
      setSubmitting(true);
      await http(
        "POST",
        "/api/v1/admin/branch-delivery-slot-capacities/copy-from-date",
        {
          sourceDate: copyFromDate,
          targetDate: deliveryDate,
          branchIds: branchId ? [Number(branchId)] : undefined,
          mode: bulkMode,
          statusOverride: "active",
        },
      );
      showSuccessToast({
        message: `Đã copy capacities từ ${copyFromDate} sang ${deliveryDate}.`,
      });
      await fetchData();
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : "Không thể copy capacities từ ngày khác.";
      showErrorToast(message);
    } finally {
      setSubmitting(false);
    }
  };

  const runGenerateDefaults = async () => {
    try {
      setSubmitting(true);
      await http(
        "POST",
        "/api/v1/admin/branch-delivery-slot-capacities/generate-from-defaults",
        {
          deliveryDate,
          branchIds: branchId ? [Number(branchId)] : undefined,
          mode: bulkMode,
          status: "active",
        },
      );
      showSuccessToast({
        message: `Đã generate capacities mặc định cho ngày ${deliveryDate}.`,
      });
      await fetchData();
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : "Không thể generate capacities mặc định.";
      showErrorToast(message);
    } finally {
      setSubmitting(false);
    }
  };

  const plannerCellMap = useMemo(() => {
    return new Map(
      (planner?.cells ?? []).map((cell) => [
        `${cell.branchId}-${cell.deliveryTimeSlotId}`,
        cell,
      ]),
    );
  }, [planner]);

  return (
    <div className="w-full pb-10 space-y-6">
      {/* Tầng A: Header / Command Bar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Capacity Planner Workspace
            </h1>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 max-w-3xl">
            Chuẩn bị capacity theo ngày bằng planner grid, copy from date,
            generate from defaults và bulk status.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <button
            onClick={() => void fetchData()}
            className="p-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition"
            title="Làm mới dữ liệu"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? "animate-spin" : ""}`} />
          </button>
          <button
            onClick={() =>
              navigate(
                `/admin/shipping/branch-delivery-slot-capacities/create?deliveryDate=${deliveryDate}${branchId ? `&branchId=${branchId}` : ""}`,
              )
            }
            className="flex items-center gap-2 px-5 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition shadow-sm ml-auto md:ml-0"
          >
            <Plus className="w-4 h-4" /> Tạo capacity
          </button>
        </div>
      </div>

      {/* Tầng B: KPI Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          {
            label: "Tổng capacity",
            value: summary.total,
            icon: CalendarClock,
            color: "text-blue-600",
            bg: "bg-blue-50",
          },
          {
            label: "Đã đầy",
            value: summary.critical,
            icon: AlertTriangle,
            color: "text-red-600",
            bg: "bg-red-50",
            isWarning: summary.critical > 0,
          },
          {
            label: "Sắp đầy",
            value: summary.warning,
            icon: ShieldAlert,
            color: "text-amber-600",
            bg: "bg-amber-50",
          },
          {
            label: "Đang tạm dừng",
            value: summary.inactive,
            icon: Store,
            color: "text-gray-600",
            bg: "bg-gray-50 dark:bg-gray-800 dark:text-gray-400",
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
              className={`text-xl font-black ${kpi.isWarning ? "text-red-600 dark:text-red-400" : "text-gray-900 dark:text-white"}`}
            >
              {kpi.value.toLocaleString("vi-VN")}
            </div>
          </div>
        ))}
      </div>

      {/* Tầng C: Filters & Quick Actions */}
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(360px,0.8fr)]">
        {/* Basic Filters & Search */}
        <div className="bg-white dark:bg-gray-800 p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col gap-4">
          <div className="flex items-center gap-2 text-lg font-bold text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-700 pb-3">
            <Search className="h-5 w-5 text-blue-600" /> Bộ lọc hiển thị
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Ngày giao
              </label>
              <input
                type="date"
                value={deliveryDate}
                onChange={(event) =>
                  updateParam("deliveryDate", event.target.value)
                }
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-white outline-none focus:border-blue-500 transition"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Chi nhánh
              </label>
              <select
                value={branchId}
                onChange={(event) =>
                  updateParam("branchId", event.target.value)
                }
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-white outline-none focus:border-blue-500 transition"
              >
                <option value="">Tất cả chi nhánh</option>
                {branches.map((branch) => (
                  <option key={branch.id} value={branch.id}>
                    {branch.name} ({branch.code})
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Trạng thái
              </label>
              <select
                value={status}
                onChange={(event) => updateParam("status", event.target.value)}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-white outline-none focus:border-blue-500 transition"
              >
                <option value="">Tất cả trạng thái</option>
                <option value="active">Đang chạy</option>
                <option value="inactive">Tạm dừng</option>
              </select>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-between items-end mt-2">
            <div className="relative w-full">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Tìm theo tên chi nhánh, slot code..."
                value={keyword}
                onChange={(event) => updateParam("q", event.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex bg-gray-100 dark:bg-gray-900 p-1 rounded-lg shrink-0 w-full sm:w-auto">
              <button
                onClick={() => updateParam("view", "planner")}
                className={`flex-1 sm:flex-none p-1.5 px-4 rounded-md flex justify-center items-center gap-1.5 text-sm font-medium transition ${view === "planner" ? "bg-white dark:bg-gray-700 shadow-sm text-blue-600 dark:text-blue-400" : "text-gray-500 hover:text-gray-700"}`}
              >
                <Grid className="w-4 h-4" /> Planner
              </button>
              <button
                onClick={() => updateParam("view", "table")}
                className={`flex-1 sm:flex-none p-1.5 px-4 rounded-md flex justify-center items-center gap-1.5 text-sm font-medium transition ${view === "table" ? "bg-white dark:bg-gray-700 shadow-sm text-blue-600 dark:text-blue-400" : "text-gray-500 hover:text-gray-700"}`}
              >
                <List className="w-4 h-4" /> Table
              </button>
            </div>
          </div>
        </div>

        {/* Quick Actions Panel */}
        <div className="bg-gray-50 dark:bg-gray-800/50 p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col gap-4">
          <div className="flex items-center justify-between gap-3 border-b border-gray-200 dark:border-gray-700 pb-3">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Quick actions cho ngày {deliveryDate}
              </p>
              <p className="text-sm font-bold text-gray-900 dark:text-white">
                Thao tác hàng loạt
              </p>
            </div>
            {submitting && (
              <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
            )}
          </div>

          <div className="space-y-4">
            <div className="grid gap-3 grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase text-gray-500 dark:text-gray-400">
                  Từ ngày
                </label>
                <input
                  type="date"
                  value={copyFromDate}
                  onChange={(event) => setCopyFromDate(event.target.value)}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-1.5 text-xs text-gray-900 dark:text-white outline-none focus:border-blue-500 transition"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase text-gray-500 dark:text-gray-400">
                  Mode
                </label>
                <select
                  value={bulkMode}
                  onChange={(event) =>
                    setBulkMode(event.target.value as BulkMode)
                  }
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-1.5 text-xs text-gray-900 dark:text-white outline-none focus:border-blue-500 transition"
                >
                  <option value="overwrite">Overwrite</option>
                  <option value="skip_existing">Skip existing</option>
                  <option value="fail_on_conflict">Fail on conflict</option>
                </select>
              </div>
            </div>

            <div className="grid gap-2 grid-cols-2">
              <button
                type="button"
                disabled={submitting}
                onClick={() => void runCopyFromDate()}
                className="w-full flex items-center justify-center gap-1.5 px-3 py-2 bg-blue-50 text-blue-700 border border-blue-200 text-xs font-semibold rounded-lg hover:bg-blue-100 transition disabled:opacity-50 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800"
              >
                <Copy className="h-3.5 w-3.5" /> Copy từ ngày
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={() => void runGenerateDefaults()}
                className="w-full flex items-center justify-center gap-1.5 px-3 py-2 bg-green-50 text-green-700 border border-green-200 text-xs font-semibold rounded-lg hover:bg-green-100 transition disabled:opacity-50 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800"
              >
                <Zap className="h-3.5 w-3.5" /> Gen default
              </button>
            </div>

            <div className="pt-3 border-t border-gray-200 dark:border-gray-700 grid gap-2 grid-cols-2">
              <button
                type="button"
                disabled={!selectedIds.length || submitting}
                onClick={() => void runBulkStatus("active")}
                className="w-full flex items-center justify-center gap-1.5 px-3 py-2 bg-white text-gray-700 border border-gray-200 text-xs font-semibold rounded-lg hover:bg-gray-50 transition disabled:opacity-50 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600 shadow-sm"
              >
                <CheckCircle2 className="h-3.5 w-3.5 text-green-500" /> Bật (
                {selectedIds.length})
              </button>
              <button
                type="button"
                disabled={!selectedIds.length || submitting}
                onClick={() => void runBulkStatus("inactive")}
                className="w-full flex items-center justify-center gap-1.5 px-3 py-2 bg-white text-gray-700 border border-gray-200 text-xs font-semibold rounded-lg hover:bg-gray-50 transition disabled:opacity-50 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600 shadow-sm"
              >
                <ShieldAlert className="h-3.5 w-3.5 text-gray-400" /> Tắt (
                {selectedIds.length})
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Area: Planner or Table */}
      {loading ? (
        <Card className="flex min-h-[280px] items-center justify-center rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:bg-gray-800 dark:border-gray-700">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </Card>
      ) : view === "planner" ? (
        <Card className="!p-0 overflow-hidden mt-4 border border-gray-200 dark:border-gray-700 shadow-none">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                Planner Grid
              </h2>
              <p className="mt-0.5 text-xs font-medium text-gray-500 dark:text-gray-400">
                Bấm vào ô để mở edit record hoặc tạo capacity còn thiếu.
              </p>
            </div>
            <div className="flex flex-wrap gap-2 text-[10px] font-bold uppercase tracking-wider">
              <span className="rounded border px-2 py-1 border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-900/30 dark:text-green-400">
                Còn chỗ
              </span>
              <span className="rounded border px-2 py-1 border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
                Sắp đầy
              </span>
              <span className="rounded border px-2 py-1 border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-900/30 dark:text-red-400">
                Đã đầy
              </span>
              <span className="rounded border px-2 py-1 border-gray-200 bg-gray-100 text-gray-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400">
                Tạm dừng
              </span>
            </div>
          </div>

          <div className="overflow-x-auto bg-white dark:bg-gray-900">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="min-w-[220px] px-5 py-3.5 text-left text-xs font-bold text-gray-500 uppercase border-r border-gray-200 dark:border-gray-700 sticky left-0 z-10 bg-gray-50 dark:bg-gray-800">
                    Chi nhánh
                  </th>
                  {(planner?.slots ?? slots).map((slot) => (
                    <th
                      key={slot.id}
                      className="min-w-[160px] px-4 py-3.5 text-left font-bold text-gray-600 dark:text-gray-300 border-r border-gray-200 dark:border-gray-700 last:border-r-0"
                    >
                      <div className="text-sm">{slot.label}</div>
                      <div className="text-[10px] uppercase font-mono text-gray-400 mt-0.5 tracking-wider">
                        {slot.code}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {(planner?.branches ?? branches).map((branch) => (
                  <tr
                    key={branch.id}
                    className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30"
                  >
                    <td className="px-5 py-4 align-top border-r border-gray-200 dark:border-gray-700 sticky left-0 z-10 bg-white dark:bg-gray-900">
                      <div className="font-semibold text-gray-900 dark:text-white text-sm">
                        {branch.name}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 font-mono mt-0.5">
                        {branch.code}
                      </div>
                    </td>
                    {(planner?.slots ?? slots).map((slot) => {
                      const cell = plannerCellMap.get(
                        `${branch.id}-${slot.id}`,
                      );
                      const state = getCellState(
                        cell ?? {
                          status: undefined,
                          maxOrders: undefined,
                          reservedOrders: 0,
                        },
                      );

                      const isUnset = !cell?.capacityId;

                      const toneClasses =
                        state === "full"
                          ? "border-red-200 bg-red-50 hover:bg-red-100 dark:border-red-900/40 dark:bg-red-900/20"
                          : state === "warning"
                            ? "border-amber-200 bg-amber-50 hover:bg-amber-100 dark:border-amber-900/40 dark:bg-amber-900/20"
                            : state === "inactive"
                              ? "border-gray-200 bg-gray-100 hover:bg-gray-200 dark:border-gray-700 dark:bg-gray-800/50"
                              : state === "unlimited"
                                ? "border-indigo-200 bg-indigo-50 hover:bg-indigo-100 dark:border-indigo-900/40 dark:bg-indigo-900/20"
                                : "border-green-200 bg-green-50 hover:bg-green-100 dark:border-green-900/40 dark:bg-green-900/20";

                      const textTitleColor =
                        state === "full"
                          ? "text-red-900 dark:text-red-300"
                          : state === "warning"
                            ? "text-amber-900 dark:text-amber-300"
                            : state === "inactive"
                              ? "text-gray-700 dark:text-gray-300"
                              : state === "unlimited"
                                ? "text-indigo-900 dark:text-indigo-300"
                                : "text-green-900 dark:text-green-300";

                      return (
                        <td
                          key={slot.id}
                          className="px-2 py-2 align-top border-r border-gray-100 dark:border-gray-800 last:border-r-0"
                        >
                          {isUnset ? (
                            <button
                              onClick={() =>
                                navigate(
                                  `/admin/shipping/branch-delivery-slot-capacities/create?branchId=${branch.id}&deliveryTimeSlotId=${slot.id}&deliveryDate=${deliveryDate}`,
                                )
                              }
                              className="w-full h-full min-h-[90px] flex flex-col items-center justify-center rounded-lg border border-dashed border-gray-300 bg-gray-50/50 hover:border-blue-400 hover:bg-blue-50 dark:border-gray-700 dark:bg-gray-800/20 dark:hover:bg-blue-900/20 transition group"
                            >
                              <Plus className="w-5 h-5 text-gray-400 group-hover:text-blue-500 mb-1" />
                              <span className="text-[11px] font-semibold text-gray-500 group-hover:text-blue-600 dark:text-gray-400 dark:group-hover:text-blue-400">
                                Tạo capacity
                              </span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() =>
                                navigate(
                                  `/admin/shipping/branch-delivery-slot-capacities/edit/${cell.capacityId}`,
                                )
                              }
                              className={`w-full h-full rounded-lg border p-3 text-left transition shadow-sm flex flex-col gap-1.5 ${toneClasses}`}
                            >
                              <div className="flex items-center justify-between gap-2 w-full">
                                <span className="text-[10px] font-mono text-gray-500 dark:text-gray-400 font-semibold">
                                  #{cell.capacityId}
                                </span>
                                <span
                                  className={`text-[10px] font-bold uppercase tracking-wider ${textTitleColor}`}
                                >
                                  {state === "full"
                                    ? "Đầy"
                                    : state === "warning"
                                      ? "Căng"
                                      : state === "inactive"
                                        ? "Tạm dừng"
                                        : state === "unlimited"
                                          ? "Không GH"
                                          : "Ổn"}
                                </span>
                              </div>
                              <div
                                className={`text-xl font-black ${textTitleColor}`}
                              >
                                {formatCapacity(cell.maxOrders)}
                              </div>
                              <p
                                className={`text-xs font-medium ${state === "inactive" ? "text-gray-500" : textTitleColor} opacity-80`}
                              >
                                Đã đặt:{" "}
                                {(cell.reservedOrders ?? 0).toLocaleString(
                                  "vi-VN",
                                )}
                              </p>
                            </button>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
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
                        Boolean(rows.length) &&
                        rows.every((row) => selectedIds.includes(row.id))
                      }
                      onChange={toggleSelectAll}
                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </th>
                  <th className="px-5 py-3.5 text-left text-xs font-bold text-gray-500 uppercase">
                    Chi nhánh
                  </th>
                  <th className="px-5 py-3.5 text-left text-xs font-bold text-gray-500 uppercase">
                    Slot
                  </th>
                  <th className="px-5 py-3.5 text-left text-xs font-bold text-gray-500 uppercase">
                    Ngày
                  </th>
                  <th className="px-5 py-3.5 text-left text-xs font-bold text-gray-500 uppercase">
                    Max / Reserved
                  </th>
                  <th className="px-5 py-3.5 text-left text-xs font-bold text-gray-500 uppercase">
                    Tình trạng
                  </th>
                  <th className="px-5 py-3.5 text-right text-xs font-bold text-gray-500 uppercase">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-100 dark:divide-gray-800">
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-20 text-center">
                      <div className="flex flex-col items-center justify-center text-gray-500">
                        <CalendarDays className="w-10 h-10 text-gray-300 dark:text-gray-600 mb-3" />
                        <span className="font-medium">
                          Không có capacity nào.
                        </span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  rows.map((row) => {
                    const state = getCellState(row);
                    const branch = branchMap.get(row.branchId);
                    const slot = slotMap.get(row.deliveryTimeSlotId);
                    return (
                      <tr
                        key={row.id}
                        className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group"
                      >
                        <td className="px-5 py-4">
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(row.id)}
                            onChange={() => toggleSelect(row.id)}
                            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                        </td>
                        <td className="px-5 py-4">
                          <div className="font-semibold text-gray-900 dark:text-white text-sm">
                            {branch?.name ?? `Branch #${row.branchId}`}
                          </div>
                          <div className="text-xs text-gray-500 font-mono mt-0.5">
                            {branch?.code ?? "—"}
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <div className="font-semibold text-gray-900 dark:text-white text-sm">
                            {slot?.label ?? `Slot #${row.deliveryTimeSlotId}`}
                          </div>
                          <div className="text-xs text-gray-500 font-mono mt-0.5">
                            {slot?.code ?? "—"}
                          </div>
                        </td>
                        <td className="px-5 py-4 text-sm font-medium text-gray-700 dark:text-gray-300">
                          {row.deliveryDate}
                        </td>
                        <td className="px-5 py-4">
                          <div className="text-sm font-bold text-gray-900 dark:text-white">
                            {formatCapacity(row.maxOrders)}
                          </div>
                          <div className="text-xs text-gray-500 font-medium mt-0.5">
                            Reserved: {row.reservedOrders}
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${
                              state === "full"
                                ? "bg-red-100 text-red-800 border border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800"
                                : state === "warning"
                                  ? "bg-amber-100 text-amber-800 border border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800"
                                  : state === "inactive"
                                    ? "bg-gray-100 text-gray-600 border border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700"
                                    : state === "unlimited"
                                      ? "bg-indigo-100 text-indigo-800 border border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-400 dark:border-indigo-800"
                                      : "bg-green-100 text-green-800 border border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800"
                            }`}
                          >
                            {state === "full"
                              ? "Đầy"
                              : state === "warning"
                                ? "Sắp đầy"
                                : state === "inactive"
                                  ? "Tạm dừng"
                                  : state === "unlimited"
                                    ? "Không giới hạn"
                                    : "Còn chỗ"}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-right">
                          <div className="flex justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() =>
                                navigate(
                                  `/admin/shipping/branch-delivery-slot-capacities/edit/${row.id}`,
                                )
                              }
                              className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded"
                              title="Chỉnh sửa"
                            >
                              <Edit className="w-4 h-4" />
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
          {!!selectedRows.length && (
            <div className="px-5 py-3 bg-gray-50 border-t border-gray-200 dark:bg-gray-800 dark:border-gray-700 text-sm font-medium text-blue-600 dark:text-blue-400 flex items-center justify-between">
              <span>Đã chọn {selectedRows.length} capacity.</span>
              <span className="text-xs text-gray-500">
                Dùng chức năng ở khối Quick Actions để thao tác hàng loạt.
              </span>
            </div>
          )}
        </Card>
      )}

      {/* Tầng E: Next Steps */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col gap-4 mt-6">
        <div className="flex items-center justify-between gap-4 border-b border-gray-100 dark:border-gray-700 pb-3">
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
              Công việc nên làm tiếp
            </h2>
            <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
              3 bước nhanh để chuẩn bị ngày giao tiếp theo.
            </p>
          </div>
          <CalendarDays className="h-6 w-6 text-gray-300 dark:text-gray-600" />
        </div>
        <div className="mt-2 grid gap-4 md:grid-cols-3">
          <button
            type="button"
            onClick={() =>
              setSearchParams(
                new URLSearchParams({
                  deliveryDate: getLocalDateString(1),
                  view: "planner",
                }),
                { replace: true },
              )
            }
            className="rounded-xl border border-gray-200 bg-gray-50 p-5 text-left transition hover:border-blue-300 hover:bg-blue-50 dark:border-gray-700 dark:bg-gray-800/50 dark:hover:border-blue-700 dark:hover:bg-blue-900/20 group"
          >
            <p className="text-sm font-bold text-gray-900 dark:text-white group-hover:text-blue-700 dark:group-hover:text-blue-400">
              1. Mở planner ngày mai
            </p>
            <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
              Chuyển sang ngày mai để rà nhanh các slot chưa có capacity hoặc đã
              đầy.
            </p>
          </button>
          <button
            type="button"
            onClick={() => void runGenerateDefaults()}
            className="rounded-xl border border-gray-200 bg-gray-50 p-5 text-left transition hover:border-green-300 hover:bg-green-50 dark:border-gray-700 dark:bg-gray-800/50 dark:hover:border-green-700 dark:hover:bg-green-900/20 group"
          >
            <p className="text-sm font-bold text-gray-900 dark:text-white group-hover:text-green-700 dark:group-hover:text-green-400">
              2. Generate từ default
            </p>
            <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
              Dùng override ở branch slot để sinh nhanh capacity nền cho ngày
              đang chọn.
            </p>
          </button>
          <button
            type="button"
            onClick={() => void runCopyFromDate()}
            className="rounded-xl border border-gray-200 bg-gray-50 p-5 text-left transition hover:border-indigo-300 hover:bg-indigo-50 dark:border-gray-700 dark:bg-gray-800/50 dark:hover:border-indigo-700 dark:hover:bg-indigo-900/20 group"
          >
            <p className="text-sm font-bold text-gray-900 dark:text-white group-hover:text-indigo-700 dark:group-hover:text-indigo-400">
              3. Copy từ lịch gần nhất
            </p>
            <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
              Rất hữu ích khi hôm nay và ngày mai có cùng nhịp vận hành.
            </p>
          </button>
        </div>
      </div>
    </div>
  );
};

export default BranchDeliverySlotCapacitiesPage;
