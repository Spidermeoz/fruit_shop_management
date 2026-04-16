import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  ArrowRightLeft,
  CheckCircle2,
  Edit,
  ExternalLink,
  Grid,
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
  Store,
  Zap,
} from "lucide-react";
import Card from "../../../components/admin/layouts/Card";
import { http } from "../../../services/http";
import { useAdminToast } from "../../../context/AdminToastContext";

type BranchServiceAreaStatus = "active" | "inactive";
type ViewMode = "board" | "table" | "matrix";
type QuickFilterType =
  | "all"
  | "active"
  | "inactive"
  | "same_day"
  | "no_same_day"
  | "override_fee"
  | "has_condition";
type BulkMode = "skip_existing" | "overwrite" | "fail_on_conflict";

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

interface ChecklistBranch {
  branchId: number;
  branchName: string;
  branchCode: string;
  coverageCount: number;
  slotCount: number;
  capacityCount: number;
  needsCoverage: boolean;
  needsBranchSlots: boolean;
  needsCapacities: boolean;
  isReady: boolean;
}

type ApiList<T> = {
  success?: boolean;
  data?: T[];
  meta?: { total?: number; limit?: number; offset?: number; page?: number };
};

const formatCurrency = (value?: number | null) => {
  if (value === null || value === undefined) return "—";
  return `${Number(value).toLocaleString("vi-VN")} đ`;
};

const formatOrderConditionText = (min?: number | null, max?: number | null) => {
  if (min == null && max == null) return "Mọi giá trị đơn hàng";
  if (min != null && max != null)
    return `Từ ${formatCurrency(min)} đến ${formatCurrency(max)}`;
  if (min != null) return `Từ ${formatCurrency(min)} trở lên`;
  return `Tối đa ${formatCurrency(max)}`;
};

const formatFeeRuleText = (fee?: number | null) => {
  if (fee !== null && fee !== undefined)
    return `Override ${formatCurrency(fee)}`;
  return "Dùng phí từ zone";
};

const quickFilters: Array<{ key: QuickFilterType; label: string }> = [
  { key: "all", label: "Tất cả" },
  { key: "active", label: "Đang chạy" },
  { key: "inactive", label: "Tạm dừng" },
  { key: "same_day", label: "Same-day" },
  { key: "override_fee", label: "Có override phí" },
  { key: "has_condition", label: "Có điều kiện đơn" },
];

const getTomorrowString = () => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 10);
};

const BranchServiceAreasPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { showSuccessToast, showErrorToast } = useAdminToast();

  const [rows, setRows] = useState<BranchServiceArea[]>([]);
  const [summaryRows, setSummaryRows] = useState<BranchServiceArea[]>([]);
  const [branches, setBranches] = useState<BranchOption[]>([]);
  const [zones, setZones] = useState<ShippingZoneOption[]>([]);
  const [checklistRows, setChecklistRows] = useState<ChecklistBranch[]>([]);

  const [loading, setLoading] = useState(false);
  const [bootstrapLoading, setBootstrapLoading] = useState(true);
  const [searchInput, setSearchInput] = useState(searchParams.get("q") || "");
  const [quickFilter, setQuickFilter] = useState<QuickFilterType>("all");
  const [viewMode, setViewMode] = useState<ViewMode>("board");
  const [currentPage, setCurrentPage] = useState(
    Number(searchParams.get("page") || 1),
  );
  const [totalPages, setTotalPages] = useState(1);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [bulkStatus, setBulkStatus] =
    useState<BranchServiceAreaStatus>("active");
  const [copySourceBranchId, setCopySourceBranchId] = useState<number | "">("");
  const [copyTargetBranchIds, setCopyTargetBranchIds] = useState<number[]>([]);
  const [copyMode, setCopyMode] = useState<BulkMode>("skip_existing");
  const [copyStatusOverride, setCopyStatusOverride] = useState<
    "keep" | BranchServiceAreaStatus
  >("keep");

  const statusFilter = searchParams.get("status") || "all";
  const branchFilter = searchParams.get("branchId") || "all";
  const zoneFilter = searchParams.get("shippingZoneId") || "all";

  const branchMap = useMemo(
    () => new Map(branches.map((item) => [item.id, item])),
    [branches],
  );
  const zoneMap = useMemo(
    () => new Map(zones.map((item) => [item.id, item])),
    [zones],
  );

  const fetchBootstrap = useCallback(async () => {
    try {
      setBootstrapLoading(true);
      const [branchesRes, zonesRes, checklistRes] = await Promise.all([
        http<ApiList<BranchOption>>(
          "GET",
          "/api/v1/admin/branches?limit=1000&status=active",
        ),
        http<ApiList<ShippingZoneOption>>(
          "GET",
          "/api/v1/admin/shipping-zones?limit=1000&status=active",
        ),
        http<{ success?: boolean; data?: { branches?: ChecklistBranch[] } }>(
          "GET",
          `/api/v1/admin/branch-service-areas/setup-checklist?deliveryDate=${getTomorrowString()}`,
        ),
      ]);
      setBranches(Array.isArray(branchesRes?.data) ? branchesRes.data : []);
      setZones(Array.isArray(zonesRes?.data) ? zonesRes.data : []);
      setChecklistRows(
        Array.isArray(checklistRes?.data?.branches)
          ? checklistRes.data.branches
          : [],
      );
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : "Không thể tải dữ liệu danh mục.";
      showErrorToast(message);
    } finally {
      setBootstrapLoading(false);
    }
  }, [showErrorToast]);

  const fetchSummaryRows = useCallback(async () => {
    try {
      const limit = 1000;
      let offset = 0;
      const allItems: BranchServiceArea[] = [];
      let keepFetching = true;

      while (keepFetching) {
        const res = await http<ApiList<BranchServiceArea>>(
          "GET",
          `/api/v1/admin/branch-service-areas?limit=${limit}&offset=${offset}`,
        );
        const items = Array.isArray(res?.data) ? res.data : [];
        allItems.push(...items);
        const total = Number(res?.meta?.total ?? allItems.length);
        offset += limit;
        keepFetching = allItems.length < total && items.length > 0;
      }

      setSummaryRows(allItems);
    } catch (error) {
      console.error(error);
    }
  }, []);

  const fetchRows = useCallback(async () => {
    try {
      setLoading(true);
      const limit = 20;
      const offset = (currentPage - 1) * limit;
      let url = `/api/v1/admin/branch-service-areas?limit=${limit}&offset=${offset}`;
      if (statusFilter !== "all")
        url += `&status=${encodeURIComponent(statusFilter)}`;
      if (branchFilter !== "all")
        url += `&branchId=${encodeURIComponent(branchFilter)}`;
      if (zoneFilter !== "all")
        url += `&shippingZoneId=${encodeURIComponent(zoneFilter)}`;
      if (searchInput.trim())
        url += `&q=${encodeURIComponent(searchInput.trim())}`;

      const res = await http<ApiList<BranchServiceArea>>("GET", url);
      const items = Array.isArray(res?.data) ? res.data : [];
      setRows(items);
      const total = Number(res?.meta?.total ?? items.length);
      setTotalPages(Math.max(1, Math.ceil(total / limit)));
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : "Không thể tải danh sách coverage.";
      showErrorToast(message);
    } finally {
      setLoading(false);
    }
  }, [
    branchFilter,
    currentPage,
    searchInput,
    showErrorToast,
    statusFilter,
    zoneFilter,
  ]);

  useEffect(() => {
    void fetchBootstrap();
    void fetchSummaryRows();
  }, [fetchBootstrap, fetchSummaryRows]);

  useEffect(() => {
    void fetchRows();
  }, [fetchRows]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const params = new URLSearchParams(searchParams);
      if (searchInput.trim()) params.set("q", searchInput.trim());
      else params.delete("q");
      params.set("page", String(currentPage));
      setSearchParams(params);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [currentPage, searchInput, searchParams, setSearchParams]);

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
  }, [branchMap, rows, zoneMap]);

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
  }, [branchMap, summaryRows, zoneMap]);

  const displayedRows = useMemo(() => {
    return enrichedRows.filter((row) => {
      if (quickFilter === "all") return true;
      if (quickFilter === "active") return row.status === "active";
      if (quickFilter === "inactive") return row.status === "inactive";
      if (quickFilter === "same_day") return Boolean(row.supportsSameDay);
      if (quickFilter === "no_same_day") return !row.supportsSameDay;
      if (quickFilter === "override_fee") return row.hasOverride;
      if (quickFilter === "has_condition") return row.hasCondition;
      return true;
    });
  }, [enrichedRows, quickFilter]);

  const groupedByBranch = useMemo(() => {
    const groups = new Map<number, typeof displayedRows>();
    displayedRows.forEach((row) => {
      const bucket = groups.get(row.branchId) ?? [];
      bucket.push(row);
      groups.set(row.branchId, bucket);
    });
    return groups;
  }, [displayedRows]);

  const metrics = useMemo(() => {
    const configuredBranchIds = new Set<number>();
    const activeBranchIds = new Set<number>();
    let active = 0;
    let sameDay = 0;
    let override = 0;
    let conditional = 0;

    summaryEnrichedRows.forEach((row) => {
      configuredBranchIds.add(row.branchId);
      if (row.status === "active") {
        active += 1;
        activeBranchIds.add(row.branchId);
      }
      if (row.supportsSameDay) sameDay += 1;
      if (row.hasOverride) override += 1;
      if (row.hasCondition) conditional += 1;
    });

    return {
      total: summaryEnrichedRows.length,
      active,
      sameDay,
      override,
      conditional,
      configuredBranches: configuredBranchIds.size,
      branchesWithoutCoverage: branches.filter(
        (branch) => !activeBranchIds.has(branch.id),
      ),
    };
  }, [branches, summaryEnrichedRows]);

  const matrixRows = useMemo(() => {
    const activeBranches =
      branchFilter === "all"
        ? branches
        : branches.filter((row) => String(row.id) === branchFilter);
    const activeZones =
      zoneFilter === "all"
        ? zones
        : zones.filter((row) => String(row.id) === zoneFilter);
    return {
      branches: activeBranches.slice(0, 12),
      zones: activeZones.slice(0, 10),
    };
  }, [branchFilter, branches, zoneFilter, zones]);

  const matrixLookup = useMemo(() => {
    return summaryRows.reduce<Record<string, BranchServiceArea>>(
      (accumulator, row) => {
        accumulator[`${row.branchId}-${row.shippingZoneId}`] = row;
        return accumulator;
      },
      {},
    );
  }, [summaryRows]);

  const handleFilterChange = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value === "all") params.delete(key);
    else params.set(key, value);
    params.set("page", "1");
    setCurrentPage(1);
    setSearchParams(params);
  };

  const handleToggleRowStatus = async (row: BranchServiceArea) => {
    try {
      const nextStatus: BranchServiceAreaStatus =
        row.status === "active" ? "inactive" : "active";
      await http(
        "PATCH",
        `/api/v1/admin/branch-service-areas/${row.id}/status`,
        { status: nextStatus },
      );
      showSuccessToast({ message: "Đã cập nhật trạng thái coverage." });
      await Promise.all([fetchRows(), fetchSummaryRows(), fetchBootstrap()]);
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : "Không thể cập nhật trạng thái.";
      showErrorToast(message);
    }
  };

  const handleBulkStatus = async () => {
    if (selectedIds.length === 0) {
      showErrorToast("Hãy chọn ít nhất một coverage để thao tác hàng loạt.");
      return;
    }
    try {
      await http("PATCH", "/api/v1/admin/branch-service-areas/bulk/status", {
        ids: selectedIds,
        status: bulkStatus,
      });
      showSuccessToast({ message: "Đã cập nhật trạng thái hàng loạt." });
      setSelectedIds([]);
      await Promise.all([fetchRows(), fetchSummaryRows(), fetchBootstrap()]);
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : "Không thể cập nhật trạng thái hàng loạt.";
      showErrorToast(message);
    }
  };

  const handleCopyFromBranch = async () => {
    if (!copySourceBranchId || copyTargetBranchIds.length === 0) {
      showErrorToast(
        "Vui lòng chọn chi nhánh nguồn và ít nhất một chi nhánh đích.",
      );
      return;
    }
    try {
      await http(
        "POST",
        "/api/v1/admin/branch-service-areas/copy-from-branch",
        {
          sourceBranchId: copySourceBranchId,
          targetBranchIds: copyTargetBranchIds,
          mode: copyMode,
          statusOverride:
            copyStatusOverride === "keep" ? undefined : copyStatusOverride,
        },
      );
      showSuccessToast({
        message: "Đã sao chép coverage sang các chi nhánh đích.",
      });
      setCopyTargetBranchIds([]);
      await Promise.all([fetchRows(), fetchSummaryRows(), fetchBootstrap()]);
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Không thể sao chép coverage.";
      showErrorToast(message);
    }
  };

  const toggleSelected = (id: number) => {
    setSelectedIds((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id],
    );
  };

  const selectAllCurrentPage = () => {
    const ids = displayedRows.map((row) => row.id);
    const allSelected = ids.every((id) => selectedIds.includes(id));
    setSelectedIds((current) => {
      if (allSelected) return current.filter((id) => !ids.includes(id));
      return Array.from(new Set([...current, ...ids]));
    });
  };

  return (
    <div className="w-full pb-10 space-y-6">
      {/* Tầng A: Header / Command Bar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Branch service areas
            </h1>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 max-w-3xl">
            Màn hình này chuyển coverage từ kiểu list đơn lẻ sang workspace theo
            tác vụ: rà coverage thiếu, sao chép từ chi nhánh mẫu và thao tác
            trạng thái hàng loạt.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <button
            onClick={() => {
              void fetchRows();
              void fetchSummaryRows();
              void fetchBootstrap();
            }}
            className="p-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition"
            title="Làm mới dữ liệu"
          >
            <RefreshCw
              className={`w-5 h-5 ${loading || bootstrapLoading ? "animate-spin" : ""}`}
            />
          </button>
          <button
            onClick={() => navigate("/admin/shipping/zones")}
            className="px-4 py-2 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600 text-sm font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition"
          >
            <MapPinned className="w-4 h-4 inline-block mr-1.5" /> Mở zone
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
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3">
        {[
          {
            label: "Tổng coverage",
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
            label: "Same-day",
            value: metrics.sameDay,
            icon: Zap,
            color: "text-indigo-600",
            bg: "bg-indigo-50",
          },
          {
            label: "Có override phí",
            value: metrics.override,
            icon: Store,
            color: "text-amber-600",
            bg: "bg-amber-50",
          },
          {
            label: "Thiếu coverage",
            value: metrics.branchesWithoutCoverage.length,
            icon: ShieldAlert,
            color: "text-red-600",
            bg: "bg-red-50",
            isWarning: metrics.branchesWithoutCoverage.length > 0,
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

      {/* Tầng C: Attention & Operations */}
      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col gap-4">
          <div className="flex items-center gap-2 text-lg font-bold text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-700 pb-4">
            <ShieldAlert className="h-5 w-5 text-red-600" /> Chi nhánh còn thiếu
            coverage
          </div>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Dựa trên checklist ngày mai để bạn xử lý nhanh các chi nhánh chưa
            sẵn sàng mở giao hàng.
          </p>
          <div className="mt-2 space-y-3">
            {checklistRows.filter((row) => row.needsCoverage).length === 0 ? (
              <div className="text-center py-8 bg-green-50 dark:bg-green-900/20 rounded-xl border border-dashed border-green-300 dark:border-green-800 flex flex-col items-center">
                <CheckCircle2 className="w-8 h-8 text-green-500 mb-2" />
                <p className="text-sm font-semibold text-green-800 dark:text-green-400">
                  Tất cả chi nhánh trong checklist đều đã có coverage.
                </p>
              </div>
            ) : (
              checklistRows
                .filter((row) => row.needsCoverage)
                .map((row) => (
                  <div
                    key={row.branchId}
                    className="rounded-lg border border-red-100 bg-red-50 p-4 dark:border-red-900/30 dark:bg-red-900/20 shadow-sm"
                  >
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-gray-900 dark:text-white text-sm">
                            {row.branchName}
                          </p>
                          <span className="text-xs text-gray-500 font-mono bg-white dark:bg-gray-800 px-1.5 py-0.5 rounded">
                            {row.branchCode}
                          </span>
                        </div>
                        <p className="mt-1.5 text-xs text-gray-600 dark:text-gray-300 font-medium">
                          Hiện có {row.coverageCount} coverage, {row.slotCount}{" "}
                          slot và {row.capacityCount} capacity.
                        </p>
                      </div>
                      <button
                        onClick={() =>
                          navigate(
                            `/admin/shipping/service-areas/create?branchId=${row.branchId}`,
                          )
                        }
                        className="rounded text-xs font-bold px-3 py-2 bg-blue-600 text-white hover:bg-blue-700 transition shadow-sm"
                      >
                        Gán coverage ngay
                      </button>
                    </div>
                  </div>
                ))
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col gap-4">
          <div className="flex items-center gap-2 text-lg font-bold text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-700 pb-4">
            <ArrowRightLeft className="h-5 w-5 text-blue-600" /> Copy từ chi
            nhánh mẫu
          </div>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Dùng khi rollout coverage giống nhau cho nhiều branch, thay vì tạo
            từng record một.
          </p>

          <div className="mt-2 space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Chi nhánh nguồn
              </label>
              <select
                value={copySourceBranchId}
                onChange={(e) =>
                  setCopySourceBranchId(
                    e.target.value ? Number(e.target.value) : "",
                  )
                }
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-white outline-none focus:border-blue-500 transition"
              >
                <option value="">Chọn chi nhánh nguồn</option>
                {branches.map((branch) => (
                  <option key={branch.id} value={branch.id}>
                    {branch.name} ({branch.code})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Chi nhánh đích
              </label>
              <div className="max-h-40 space-y-1.5 overflow-auto rounded-lg border border-gray-300 dark:border-gray-600 p-2 bg-gray-50 dark:bg-gray-900/50">
                {branches
                  .filter((branch) => branch.id !== copySourceBranchId)
                  .map((branch) => {
                    const checked = copyTargetBranchIds.includes(branch.id);
                    return (
                      <label
                        key={branch.id}
                        className="flex items-center gap-3 rounded-md px-2 py-1.5 hover:bg-gray-200 dark:hover:bg-gray-800 transition cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => {
                            setCopyTargetBranchIds((current) =>
                              checked
                                ? current.filter((id) => id !== branch.id)
                                : [...current, branch.id],
                            );
                          }}
                          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                          {branch.name}{" "}
                          <span className="text-xs text-gray-400 font-mono ml-1">
                            ({branch.code})
                          </span>
                        </span>
                      </label>
                    );
                  })}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Conflict mode
                </label>
                <select
                  value={copyMode}
                  onChange={(e) => setCopyMode(e.target.value as BulkMode)}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-white outline-none focus:border-blue-500 transition"
                >
                  <option value="skip_existing">Skip existing</option>
                  <option value="overwrite">Overwrite</option>
                  <option value="fail_on_conflict">Fail on conflict</option>
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Trạng thái sau copy
                </label>
                <select
                  value={copyStatusOverride}
                  onChange={(e) =>
                    setCopyStatusOverride(
                      e.target.value as "keep" | BranchServiceAreaStatus,
                    )
                  }
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-white outline-none focus:border-blue-500 transition"
                >
                  <option value="keep">Giữ nguyên theo nguồn</option>
                  <option value="active">Ép active</option>
                  <option value="inactive">Ép inactive</option>
                </select>
              </div>
            </div>

            <button
              onClick={() => void handleCopyFromBranch()}
              className="w-full inline-flex justify-center items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition shadow-sm mt-2"
            >
              Copy coverage sang branch đích
            </button>
          </div>
        </div>
      </div>

      {/* Tầng D: Toolbar Phân tầng */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col gap-4">
        {/* Quick Filters */}
        <div className="flex flex-wrap items-center gap-2 border-b border-gray-100 dark:border-gray-700 pb-4">
          <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 mr-2 flex items-center gap-1.5">
            Nghiệp vụ:
          </span>
          {quickFilters.map((filter) => (
            <button
              key={filter.key}
              onClick={() => setQuickFilter(filter.key)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                quickFilter === filter.key
                  ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                  : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:border-gray-300"
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>

        {/* Advanced Filters */}
        <div className="flex flex-col lg:flex-row justify-between items-center gap-4 border-b border-gray-100 dark:border-gray-700 pb-4">
          <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
            <select
              value={statusFilter}
              onChange={(e) => handleFilterChange("status", e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white min-w-[140px] focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Mọi trạng thái</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>

            <select
              value={branchFilter}
              onChange={(e) => handleFilterChange("branchId", e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white min-w-[160px] focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Tất cả chi nhánh</option>
              {branches.map((branch) => (
                <option key={branch.id} value={branch.id}>
                  {branch.name}
                </option>
              ))}
            </select>

            <select
              value={zoneFilter}
              onChange={(e) =>
                handleFilterChange("shippingZoneId", e.target.value)
              }
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white min-w-[160px] focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Tất cả zone</option>
              {zones.map((zone) => (
                <option key={zone.id} value={zone.id}>
                  {zone.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4 w-full lg:w-auto">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Tìm theo branch / zone / mã..."
                value={searchInput}
                onChange={(e) => {
                  setSearchInput(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex bg-gray-100 dark:bg-gray-900 p-1 rounded-lg shrink-0">
              <button
                onClick={() => setViewMode("board")}
                className={`p-1.5 rounded-md flex items-center gap-1.5 text-sm font-medium transition ${viewMode === "board" ? "bg-white dark:bg-gray-700 shadow-sm text-blue-600 dark:text-blue-400" : "text-gray-500 hover:text-gray-700"}`}
                title="Board theo branch"
              >
                <LayoutGrid className="w-4 h-4" /> Board
              </button>
              <button
                onClick={() => setViewMode("table")}
                className={`p-1.5 rounded-md flex items-center gap-1.5 text-sm font-medium transition ${viewMode === "table" ? "bg-white dark:bg-gray-700 shadow-sm text-blue-600 dark:text-blue-400" : "text-gray-500 hover:text-gray-700"}`}
                title="Bảng chi tiết"
              >
                <List className="w-4 h-4" /> Table
              </button>
              <button
                onClick={() => setViewMode("matrix")}
                className={`p-1.5 rounded-md flex items-center gap-1.5 text-sm font-medium transition ${viewMode === "matrix" ? "bg-white dark:bg-gray-700 shadow-sm text-blue-600 dark:text-blue-400" : "text-gray-500 hover:text-gray-700"}`}
                title="Matrix branch × zone"
              >
                <Grid className="w-4 h-4" /> Matrix
              </button>
            </div>
          </div>
        </div>

        {/* Bulk Action Toolbar */}
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            Thao tác hàng loạt:
          </span>
          <button
            onClick={selectAllCurrentPage}
            className="px-3 py-1.5 bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 text-xs font-semibold rounded-lg hover:bg-gray-200 transition"
          >
            {displayedRows.every((row) => selectedIds.includes(row.id)) &&
            displayedRows.length > 0
              ? "Bỏ chọn trang"
              : "Chọn trang"}
          </button>

          <div className="flex items-center gap-2">
            <select
              value={bulkStatus}
              onChange={(e) =>
                setBulkStatus(e.target.value as BranchServiceAreaStatus)
              }
              className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-xs font-semibold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
            <button
              onClick={() => void handleBulkStatus()}
              className="inline-flex items-center gap-1.5 rounded-lg bg-gray-800 dark:bg-gray-200 px-3 py-1.5 text-xs font-semibold text-white dark:text-gray-900 hover:bg-gray-900 dark:hover:bg-white transition shadow-sm"
            >
              <Power className="h-3.5 w-3.5" /> Áp dụng ({selectedIds.length})
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {loading || bootstrapLoading ? (
        <div className="flex flex-col justify-center items-center py-24 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-3" />
          <p className="text-gray-500 font-medium">Đang tải coverage...</p>
        </div>
      ) : viewMode === "matrix" ? (
        <Card className="!p-0 overflow-hidden mt-4 border border-gray-200 dark:border-gray-700 shadow-none">
          <div className="overflow-x-auto bg-white dark:bg-gray-900">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="min-w-[220px] px-5 py-3.5 text-left text-xs font-bold text-gray-500 uppercase border-r border-gray-200 dark:border-gray-700 sticky left-0 z-10 bg-gray-50 dark:bg-gray-800">
                    Chi nhánh
                  </th>
                  {matrixRows.zones.map((zone) => (
                    <th
                      key={zone.id}
                      className="min-w-[180px] px-4 py-3.5 text-left font-bold text-gray-600 dark:text-gray-300 border-r border-gray-200 dark:border-gray-700 last:border-r-0"
                    >
                      <div className="text-sm">{zone.name}</div>
                      <div className="text-[10px] uppercase font-mono text-gray-400 mt-0.5 tracking-wider">
                        {zone.code}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {matrixRows.branches.map((branch) => (
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
                    {matrixRows.zones.map((zone) => {
                      const row = matrixLookup[`${branch.id}-${zone.id}`];
                      const isActive = row?.status === "active";
                      return (
                        <td
                          key={`${branch.id}-${zone.id}`}
                          className="px-2 py-2 align-top border-r border-gray-100 dark:border-gray-800 last:border-r-0"
                        >
                          {row ? (
                            <button
                              onClick={() =>
                                navigate(
                                  `/admin/shipping/service-areas/edit/${row.id}`,
                                )
                              }
                              className={`w-full h-full rounded-lg border p-3 text-left transition shadow-sm flex flex-col gap-2 ${
                                isActive
                                  ? "border-green-200 bg-green-50 hover:bg-green-100 dark:border-green-900/40 dark:bg-green-900/20"
                                  : "border-gray-200 bg-gray-50 hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800/50"
                              }`}
                            >
                              <div className="flex items-center justify-between gap-2">
                                <span
                                  className={`text-[10px] font-bold uppercase tracking-wider ${isActive ? "text-green-700 dark:text-green-400" : "text-gray-500 dark:text-gray-400"}`}
                                >
                                  {row.supportsSameDay
                                    ? "Same-day"
                                    : "Standard"}
                                </span>
                                <Edit
                                  className={`h-3.5 w-3.5 ${isActive ? "text-green-600 dark:text-green-500" : "text-gray-400"}`}
                                />
                              </div>
                              <div
                                className={`text-xs font-semibold ${isActive ? "text-green-900 dark:text-green-300" : "text-gray-700 dark:text-gray-300"}`}
                              >
                                {formatFeeRuleText(row.deliveryFeeOverride)}
                              </div>
                              <div
                                className={`text-[11px] font-medium ${isActive ? "text-green-700 dark:text-green-400" : "text-gray-500 dark:text-gray-400"}`}
                              >
                                {formatOrderConditionText(
                                  row.minOrderValue,
                                  row.maxOrderValue,
                                )}
                              </div>
                            </button>
                          ) : (
                            <button
                              onClick={() =>
                                navigate(
                                  `/admin/shipping/service-areas/create?branchId=${branch.id}&shippingZoneId=${zone.id}`,
                                )
                              }
                              className="w-full h-full min-h-[90px] flex flex-col items-center justify-center rounded-lg border border-dashed border-gray-300 bg-gray-50/50 hover:border-blue-400 hover:bg-blue-50 dark:border-gray-700 dark:bg-gray-800/20 dark:hover:bg-blue-900/20 transition group"
                            >
                              <Plus className="w-5 h-5 text-gray-400 group-hover:text-blue-500 mb-1" />
                              <span className="text-[11px] font-semibold text-gray-500 group-hover:text-blue-600 dark:text-gray-400 dark:group-hover:text-blue-400">
                                Tạo mới
                              </span>
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
          <div className="p-3 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 flex items-center justify-center gap-1.5">
              <Grid className="w-3.5 h-3.5" />
              Matrix đang giới hạn để dễ quan sát: tối đa 12 branch × 10 zone
              theo bộ lọc hiện tại.
            </p>
          </div>
        </Card>
      ) : viewMode === "board" ? (
        <div className="mt-4 space-y-6">
          {branches
            .filter((branch) => groupedByBranch.has(branch.id))
            .map((branch) => {
              const branchRows = groupedByBranch.get(branch.id) ?? [];
              return (
                <Card
                  key={branch.id}
                  className="p-0 overflow-hidden border border-gray-200 dark:border-gray-700 shadow-sm"
                >
                  <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                          {branch.name}
                        </h3>
                        <span className="rounded bg-white border border-gray-200 px-1.5 py-0.5 text-xs font-mono font-semibold text-gray-600 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300">
                          {branch.code}
                        </span>
                      </div>
                      <p className="mt-1 text-xs font-medium text-gray-500 dark:text-gray-400">
                        {branchRows.length} coverage đang hiển thị theo bộ lọc.
                      </p>
                    </div>
                    <button
                      onClick={() =>
                        navigate(
                          `/admin/shipping/service-areas/create?branchId=${branch.id}`,
                        )
                      }
                      className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-white shadow-sm dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700 transition"
                    >
                      Thêm coverage cho branch này
                    </button>
                  </div>

                  <div className="p-5 grid gap-4 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
                    {branchRows.map((row) => (
                      <div
                        key={row.id}
                        className={`border rounded-xl transition shadow-sm group flex flex-col overflow-hidden bg-white dark:bg-gray-800 hover:border-blue-300 ${row.status === "inactive" ? "border-gray-200 opacity-80" : "border-gray-200 dark:border-gray-700"}`}
                      >
                        <div
                          className="p-4 flex-1 flex flex-col gap-4 cursor-pointer"
                          onClick={() =>
                            navigate(
                              `/admin/shipping/service-areas/edit/${row.id}`,
                            )
                          }
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-start gap-3">
                              <input
                                type="checkbox"
                                checked={selectedIds.includes(row.id)}
                                onChange={(e) => {
                                  e.stopPropagation();
                                  toggleSelected(row.id);
                                }}
                                className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                              />
                              <div>
                                <p className="font-bold text-sm text-gray-900 dark:text-white line-clamp-1">
                                  {row.zone?.name ??
                                    `Zone #${row.shippingZoneId}`}
                                </p>
                                <div className="mt-0.5 text-xs font-mono text-gray-500 dark:text-gray-400">
                                  {row.zone?.code ?? ""}
                                </div>
                              </div>
                            </div>
                            <span
                              className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider shrink-0 ${row.status === "active" ? "bg-green-100 text-green-800 border border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800" : "bg-gray-100 text-gray-600 border border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700"}`}
                            >
                              {row.status === "active"
                                ? "Đang chạy"
                                : "Tạm dừng"}
                            </span>
                          </div>

                          <div className="bg-gray-50 dark:bg-gray-900/50 p-3 rounded-lg border border-gray-100 dark:border-gray-800 space-y-2 text-xs font-medium text-gray-600 dark:text-gray-300 flex-1">
                            <div className="flex justify-between items-start gap-2">
                              <span className="text-gray-500">Phí giao:</span>
                              <span className="text-right font-semibold text-gray-900 dark:text-white">
                                {formatFeeRuleText(row.deliveryFeeOverride)}
                              </span>
                            </div>
                            <div className="flex justify-between items-start gap-2">
                              <span className="text-gray-500">Đơn hàng:</span>
                              <span className="text-right">
                                {formatOrderConditionText(
                                  row.minOrderValue,
                                  row.maxOrderValue,
                                )}
                              </span>
                            </div>
                            <div className="flex justify-between items-start gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                              <span className="text-gray-500">Same-day:</span>
                              <span
                                className={
                                  row.supportsSameDay
                                    ? "text-indigo-600 font-bold dark:text-indigo-400"
                                    : ""
                                }
                              >
                                {row.supportsSameDay
                                  ? "Có hỗ trợ"
                                  : "Không bật"}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-700/50 flex items-center justify-between gap-2 bg-gray-50 dark:bg-gray-800/80">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              void handleToggleRowStatus(row);
                            }}
                            className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 bg-white dark:bg-gray-700 border text-xs font-semibold rounded shadow-sm hover:bg-gray-50 transition-colors ${row.status === "active" ? "text-amber-600 border-gray-200 dark:border-gray-600" : "text-green-600 border-gray-200 dark:border-gray-600"}`}
                          >
                            <Power className="w-3.5 h-3.5" />
                            {row.status === "active" ? "Tạm dừng" : "Kích hoạt"}
                          </button>
                          <button
                            onClick={() =>
                              navigate(
                                `/admin/shipping/service-areas/edit/${row.id}`,
                              )
                            }
                            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/30 border border-blue-100 dark:border-blue-800 text-blue-700 dark:text-blue-400 text-xs font-semibold rounded shadow-sm hover:bg-blue-100 transition-colors"
                          >
                            Mở record <ExternalLink className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              );
            })}
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
                      onChange={selectAllCurrentPage}
                      checked={
                        displayedRows.length > 0 &&
                        displayedRows.every((row) =>
                          selectedIds.includes(row.id),
                        )
                      }
                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </th>
                  <th className="px-5 py-3.5 text-left text-xs font-bold text-gray-500 uppercase">
                    Chi nhánh
                  </th>
                  <th className="px-5 py-3.5 text-left text-xs font-bold text-gray-500 uppercase">
                    Zone
                  </th>
                  <th className="px-5 py-3.5 text-left text-xs font-bold text-gray-500 uppercase">
                    Rule / Điều kiện
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
                {displayedRows.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-20 text-center">
                      <div className="flex flex-col items-center justify-center text-gray-500">
                        <Layers className="w-10 h-10 text-gray-300 dark:text-gray-600 mb-3" />
                        <span className="font-medium">
                          Không có coverage nào phù hợp với bộ lọc.
                        </span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  displayedRows.map((row) => (
                    <tr
                      key={row.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group"
                    >
                      <td className="px-5 py-4">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(row.id)}
                          onChange={() => toggleSelected(row.id)}
                          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      </td>
                      <td className="px-5 py-4">
                        <div className="font-semibold text-gray-900 dark:text-white text-sm">
                          {row.branch?.name ?? `Branch #${row.branchId}`}
                        </div>
                        <div className="text-xs text-gray-500 font-mono mt-0.5">
                          {row.branch?.code ?? ""}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="font-semibold text-gray-900 dark:text-white text-sm">
                          {row.zone?.name ?? `Zone #${row.shippingZoneId}`}
                        </div>
                        <div className="text-xs text-gray-500 font-mono mt-0.5">
                          {row.zone?.code ?? ""}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                          {formatFeeRuleText(row.deliveryFeeOverride)}
                        </div>
                        <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                          {formatOrderConditionText(
                            row.minOrderValue,
                            row.maxOrderValue,
                          )}
                        </div>
                        {row.supportsSameDay && (
                          <span className="mt-1.5 inline-block text-[10px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 border border-indigo-100 rounded px-1.5 py-0.5 dark:bg-indigo-900/30 dark:text-indigo-400 dark:border-indigo-800">
                            Same-day
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${row.status === "active" ? "bg-green-100 text-green-800 border border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800" : "bg-gray-100 text-gray-600 border border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700"}`}
                        >
                          {row.status === "active" ? "Đang chạy" : "Tạm dừng"}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() =>
                              navigate(
                                `/admin/shipping/service-areas/edit/${row.id}`,
                              )
                            }
                            className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded"
                            title="Chỉnh sửa"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => void handleToggleRowStatus(row)}
                            className="p-1.5 text-gray-500 hover:text-amber-600 hover:bg-amber-50 rounded"
                            title={
                              row.status === "active" ? "Tạm dừng" : "Kích hoạt"
                            }
                          >
                            <Power className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Pagination */}
      {viewMode !== "matrix" && totalPages > 1 && (
        <div className="flex items-center justify-between gap-3 text-sm font-medium text-gray-500 dark:text-gray-400 mt-4 px-2">
          <div>
            Trang {currentPage} / {totalPages}
          </div>
          <div className="flex items-center gap-2">
            <button
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
              className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 disabled:opacity-50 hover:bg-gray-50 transition dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700"
            >
              Trước
            </button>
            <button
              disabled={currentPage >= totalPages}
              onClick={() =>
                setCurrentPage((page) => Math.min(totalPages, page + 1))
              }
              className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 disabled:opacity-50 hover:bg-gray-50 transition dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700"
            >
              Sau
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default BranchServiceAreasPage;
