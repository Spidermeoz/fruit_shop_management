import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  CalendarClock,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Layers,
  Link2,
  Loader2,
  MapPinned,
  Plus,
  RefreshCw,
  Settings,
  ShieldAlert,
  Store,
} from "lucide-react";
import Card from "../../../components/admin/layouts/Card";
import { http } from "../../../services/http";
import { useAdminToast } from "../../../context/AdminToastContext";

type Status = "active" | "inactive";
type TimeViewMode = "today" | "tomorrow" | "next7days";

interface ShippingZone {
  id: number;
  code: string;
  name: string;
  province?: string | null;
  district?: string | null;
  ward?: string | null;
  status: Status;
}

interface BranchServiceArea {
  id: number;
  branchId: number;
  shippingZoneId: number;
  supportsSameDay?: boolean;
  deliveryFeeOverride?: number | null;
  status: Status;
}

interface DeliveryTimeSlot {
  id: number;
  code: string;
  label: string;
  startTime?: string;
  endTime?: string;
  status: Status;
}

interface BranchDeliveryTimeSlot {
  id: number;
  branchId: number;
  deliveryTimeSlotId: number;
  maxOrdersOverride?: number | null;
  status: Status;
}

interface BranchDeliverySlotCapacity {
  id: number;
  branchId: number;
  deliveryDate: string;
  deliveryTimeSlotId: number;
  maxOrders?: number | null;
  reservedOrders: number;
  status: Status;
}

interface BranchOption {
  id: number;
  name: string;
  code: string;
  status?: string;
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

interface ChecklistResponse {
  deliveryDate?: string | null;
  branches: ChecklistBranch[];
}

type ApiList<T> = {
  success?: boolean;
  data?:
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
  meta?: {
    total?: number;
    limit?: number;
    offset?: number;
    page?: number;
  };
};

const toArray = <T,>(input: ApiList<T>["data"] | undefined): T[] => {
  if (Array.isArray(input)) return input;
  if (Array.isArray(input?.items)) return input.items;
  return [];
};

const getLocalDateString = (offsetDays = 0) => {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 10);
};

const getNext7Days = () =>
  Array.from({ length: 7 }, (_, index) => getLocalDateString(index));

const formatCount = (value: number) => value.toLocaleString("vi-VN");

const isFallbackZone = (zone: ShippingZone) =>
  !zone.province && !zone.district && !zone.ward;

const getCapacityState = (row: BranchDeliverySlotCapacity) => {
  if (row.status !== "active") return "inactive" as const;
  if (row.maxOrders === null || row.maxOrders === undefined)
    return "unlimited" as const;
  if (row.reservedOrders >= row.maxOrders) return "full" as const;
  if (row.maxOrders > 0 && row.reservedOrders / row.maxOrders >= 0.8)
    return "warning" as const;
  return "available" as const;
};

const buildCoverageCreateLink = (branchId: number) =>
  `/admin/shipping/service-areas/create?branchId=${branchId}`;
const buildBranchSlotCreateLink = (branchId: number) =>
  `/admin/shipping/branch-delivery-slots/create?branchId=${branchId}`;
const buildCapacityCreateLink = (branchId: number, date: string) =>
  `/admin/shipping/branch-delivery-slot-capacities/create?branchId=${branchId}&deliveryDate=${date}`;

const ShippingOverviewPage: React.FC = () => {
  const navigate = useNavigate();
  const { showErrorToast, showSuccessToast } = useAdminToast();

  const [loading, setLoading] = useState(true);
  const [timeView, setTimeView] = useState<TimeViewMode>("today");
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());

  const [zones, setZones] = useState<ShippingZone[]>([]);
  const [serviceAreas, setServiceAreas] = useState<BranchServiceArea[]>([]);
  const [slots, setSlots] = useState<DeliveryTimeSlot[]>([]);
  const [branchSlots, setBranchSlots] = useState<BranchDeliveryTimeSlot[]>([]);
  const [capacities, setCapacities] = useState<BranchDeliverySlotCapacity[]>(
    [],
  );
  const [branches, setBranches] = useState<BranchOption[]>([]);
  const [todayChecklist, setTodayChecklist] =
    useState<ChecklistResponse | null>(null);
  const [tomorrowChecklist, setTomorrowChecklist] =
    useState<ChecklistResponse | null>(null);

  const fetchDashboard = useCallback(async () => {
    try {
      setLoading(true);
      const today = getLocalDateString(0);
      const tomorrow = getLocalDateString(1);
      const [
        zonesRes,
        serviceAreasRes,
        slotsRes,
        branchSlotsRes,
        capacitiesRes,
        branchesRes,
        todayChecklistRes,
        tomorrowChecklistRes,
      ] = await Promise.all([
        http<ApiList<ShippingZone>>(
          "GET",
          "/api/v1/admin/shipping-zones?limit=1000&offset=0",
        ),
        http<ApiList<BranchServiceArea>>(
          "GET",
          "/api/v1/admin/branch-service-areas?limit=1000&offset=0",
        ),
        http<ApiList<DeliveryTimeSlot>>(
          "GET",
          "/api/v1/admin/delivery-time-slots?page=1&limit=1000",
        ),
        http<ApiList<BranchDeliveryTimeSlot>>(
          "GET",
          "/api/v1/admin/branch-delivery-time-slots?page=1&limit=1000",
        ),
        http<ApiList<BranchDeliverySlotCapacity>>(
          "GET",
          "/api/v1/admin/branch-delivery-slot-capacities?limit=1000&page=1&offset=0",
        ),
        http<ApiList<BranchOption>>("GET", "/api/v1/admin/branches?limit=1000"),
        http<{ success?: boolean; data?: ChecklistResponse }>(
          "GET",
          `/api/v1/admin/branch-service-areas/setup-checklist?deliveryDate=${today}`,
        ),
        http<{ success?: boolean; data?: ChecklistResponse }>(
          "GET",
          `/api/v1/admin/branch-service-areas/setup-checklist?deliveryDate=${tomorrow}`,
        ),
      ]);

      setZones(toArray(zonesRes?.data));
      setServiceAreas(toArray(serviceAreasRes?.data));
      setSlots(toArray(slotsRes?.data));
      setBranchSlots(toArray(branchSlotsRes?.data));
      setCapacities(toArray(capacitiesRes?.data));
      setBranches(toArray(branchesRes?.data));
      setTodayChecklist(todayChecklistRes?.data ?? null);
      setTomorrowChecklist(tomorrowChecklistRes?.data ?? null);
      setLastRefreshed(new Date());
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : "Không thể tải dữ liệu shipping dashboard.";
      showErrorToast(message);
    } finally {
      setLoading(false);
    }
  }, [showErrorToast]);

  useEffect(() => {
    void fetchDashboard();
  }, [fetchDashboard]);

  const targetDates = useMemo(() => {
    if (timeView === "today") return [getLocalDateString(0)];
    if (timeView === "tomorrow") return [getLocalDateString(1)];
    return getNext7Days();
  }, [timeView]);

  const branchMap = useMemo(() => {
    return branches.reduce<Record<number, BranchOption>>(
      (accumulator, branch) => {
        accumulator[branch.id] = branch;
        return accumulator;
      },
      {},
    );
  }, [branches]);

  const slotMap = useMemo(() => {
    return slots.reduce<Record<number, DeliveryTimeSlot>>(
      (accumulator, slot) => {
        accumulator[slot.id] = slot;
        return accumulator;
      },
      {},
    );
  }, [slots]);

  const metrics = useMemo(() => {
    const activeZones = zones.filter((zone) => zone.status === "active");
    const activeServiceAreas = serviceAreas.filter(
      (row) => row.status === "active",
    );
    const activeSlots = slots.filter((row) => row.status === "active");
    const activeBranchSlots = branchSlots.filter(
      (row) => row.status === "active",
    );
    const activeBranches = branches.filter(
      (branch) => branch.status !== "inactive",
    );
    const branchesWithCoverage = new Set(
      activeServiceAreas.map((row) => row.branchId),
    );
    const branchesWithSlots = new Set(
      activeBranchSlots.map((row) => row.branchId),
    );

    return {
      activeBranches: activeBranches.length,
      activeZones: activeZones.length,
      activeServiceAreas: activeServiceAreas.length,
      activeSlots: activeSlots.length,
      activeBranchSlots: activeBranchSlots.length,
      fallbackZones: activeZones.filter(isFallbackZone).length,
      branchesMissingCoverage: activeBranches.filter(
        (branch) => !branchesWithCoverage.has(branch.id),
      ),
      branchesMissingSlots: activeBranches.filter(
        (branch) => !branchesWithSlots.has(branch.id),
      ),
      branchesNeedingAttention: activeBranches.filter(
        (branch) =>
          !branchesWithCoverage.has(branch.id) ||
          !branchesWithSlots.has(branch.id),
      ),
    };
  }, [branches, branchSlots, serviceAreas, slots, zones]);

  const scopedCapacities = useMemo(
    () => capacities.filter((row) => targetDates.includes(row.deliveryDate)),
    [capacities, targetDates],
  );

  const capacityMetrics = useMemo(() => {
    let full = 0;
    let warning = 0;
    let available = 0;
    let unlimited = 0;
    let inactive = 0;
    let reservedFinite = 0;
    let maxFinite = 0;
    let reservedUnlimited = 0;

    const overloadedRows = scopedCapacities
      .map((row) => {
        const state = getCapacityState(row);
        if (state === "full") full += 1;
        if (state === "warning") warning += 1;
        if (state === "available") available += 1;
        if (state === "unlimited") unlimited += 1;
        if (state === "inactive") inactive += 1;

        if (row.maxOrders === null || row.maxOrders === undefined) {
          reservedUnlimited += Number(row.reservedOrders ?? 0);
        } else {
          reservedFinite += Number(row.reservedOrders ?? 0);
          maxFinite += Number(row.maxOrders ?? 0);
        }

        return { ...row, state };
      })
      .filter((row) => row.state === "full" || row.state === "warning")
      .sort((a, b) => {
        const aRatio = a.maxOrders ? a.reservedOrders / a.maxOrders : 0;
        const bRatio = b.maxOrders ? b.reservedOrders / b.maxOrders : 0;
        return bRatio - aRatio;
      });

    const fillPercentage =
      maxFinite > 0
        ? Math.min(100, Math.round((reservedFinite / maxFinite) * 100))
        : 0;

    return {
      totalScoped: scopedCapacities.length,
      overloadedRows,
      states: { full, warning, available, unlimited, inactive },
      reservedFinite,
      maxFinite,
      reservedUnlimited,
      fillPercentage,
    };
  }, [scopedCapacities]);

  const branchActionRows = useMemo(() => {
    const source =
      timeView === "tomorrow"
        ? (tomorrowChecklist?.branches ?? [])
        : (todayChecklist?.branches ?? []);
    return source
      .filter((row) => !row.isReady)
      .sort(
        (a, b) =>
          Number(a.isReady) - Number(b.isReady) ||
          a.branchName.localeCompare(b.branchName),
      );
  }, [timeView, todayChecklist, tomorrowChecklist]);

  const timeViewLabel = useMemo(() => {
    if (timeView === "today") return "hôm nay";
    if (timeView === "tomorrow") return "ngày mai";
    return "7 ngày tới";
  }, [timeView]);

  const quickPreparation = useMemo(() => {
    const tomorrowRows = tomorrowChecklist?.branches ?? [];
    return {
      missingCapacities: tomorrowRows.filter((row) => row.needsCapacities),
      missingCoverage: tomorrowRows.filter((row) => row.needsCoverage),
      missingSlots: tomorrowRows.filter((row) => row.needsBranchSlots),
    };
  }, [tomorrowChecklist]);

  const handleGenerateTomorrowDefaults = async () => {
    try {
      await http(
        "POST",
        "/api/v1/admin/branch-delivery-slot-capacities/generate-from-defaults",
        {
          deliveryDate: getLocalDateString(1),
          mode: "skip_existing",
        },
      );
      showSuccessToast({
        message: "Đã tạo capacity ngày mai từ cấu hình mặc định.",
      });
      await fetchDashboard();
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : "Không thể generate capacity mặc định.";
      showErrorToast(message);
    }
  };

  const heroCards = [
    {
      label: "Chi nhánh đang mở",
      value: metrics.activeBranches,
      icon: Store,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      label: "Coverage đang chạy",
      value: metrics.activeServiceAreas,
      icon: Link2,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
    },
    {
      label: "Branch slot đang bật",
      value: metrics.activeBranchSlots,
      icon: Clock3,
      color: "text-indigo-600",
      bg: "bg-indigo-50",
    },
    {
      label: `Cảnh báo capacity (${timeViewLabel})`,
      value: capacityMetrics.states.full + capacityMetrics.states.warning,
      icon: AlertTriangle,
      color: "text-red-600",
      bg: "bg-red-50",
      isWarning: true,
    },
  ];

  return (
    <div className="w-full pb-10 space-y-6">
      {/* Tầng A: Header / Command Bar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Trung tâm điều hành Shipping
            </h1>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Màn hình này gom các việc vận hành quan trọng nhất: hoàn tất setup
            chi nhánh, xử lý cảnh báo capacity và chuẩn bị cấu hình cho ngày
            mai.
          </p>
          <div className="mt-3 flex flex-wrap gap-2 text-xs text-gray-500 dark:text-gray-400">
            <span className="font-semibold flex items-center gap-1.5">
              <RefreshCw className="w-3.5 h-3.5" />
              Cập nhật lúc{" "}
              {lastRefreshed.toLocaleTimeString("vi-VN", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
            <span className="px-1 text-gray-300 dark:text-gray-600">|</span>
            <span>{formatCount(metrics.activeZones)} zone hoạt động</span>
            <span className="px-1 text-gray-300 dark:text-gray-600">|</span>
            <span>
              {formatCount(metrics.activeSlots)} slot hệ thống hoạt động
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <button
            onClick={() => void fetchDashboard()}
            className="p-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition"
            title="Làm mới dữ liệu"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? "animate-spin" : ""}`} />
          </button>
          <button
            onClick={() =>
              navigate("/admin/shipping/branch-delivery-slots/create")
            }
            className="px-4 py-2 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600 text-sm font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition"
          >
            <Settings className="w-4 h-4 inline-block mr-1.5" /> Bật branch slot
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
      <div className="grid grid-cols-2 md:grid-cols-2 xl:grid-cols-4 gap-3">
        {heroCards.map((kpi, idx) => (
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
              className={`text-xl font-black ${kpi.isWarning && kpi.value > 0 ? "text-red-600 dark:text-red-400" : "text-gray-900 dark:text-white"}`}
            >
              {formatCount(kpi.value)}
            </div>
          </div>
        ))}
      </div>

      {/* Tầng D: Wizard & Tools (Tương tự Advanced Filters / View Toolbar) */}
      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col gap-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b border-gray-100 dark:border-gray-700 pb-4">
            <div>
              <div className="flex items-center gap-2 text-lg font-bold text-gray-900 dark:text-white">
                <CheckCircle2 className="h-5 w-5 text-green-600" /> Branch setup
                wizard
              </div>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Xem nhanh chi nhánh nào còn thiếu coverage, branch slot hoặc
                capacity.
              </p>
            </div>

            {/* Quick Filters Styling */}
            <div className="flex flex-wrap items-center gap-2">
              {(
                [
                  ["today", "Hôm nay"],
                  ["tomorrow", "Ngày mai"],
                  ["next7days", "7 ngày tới"],
                ] as Array<[TimeViewMode, string]>
              ).map(([value, label]) => (
                <button
                  key={value}
                  onClick={() => setTimeView(value)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                    timeView === value
                      ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                      : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:border-gray-300"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-2 space-y-3">
            {branchActionRows.length === 0 ? (
              <div className="text-center py-10 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-dashed border-gray-300 dark:border-gray-600 flex flex-col items-center">
                <CheckCircle2 className="w-10 h-10 text-green-500 mb-3" />
                <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                  Hoàn hảo!
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  Tất cả chi nhánh đã đủ coverage, slot và capacity trong phạm
                  vi đang xem.
                </p>
              </div>
            ) : (
              branchActionRows.map((row) => (
                <div
                  key={row.branchId}
                  className="rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800 shadow-sm p-4"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-gray-900 dark:text-white text-sm">
                          {row.branchName}
                        </h3>
                        <span className="text-xs text-gray-500 font-mono">
                          {row.branchCode}
                        </span>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-2 text-[10px] font-bold uppercase tracking-wider">
                        <span
                          className={`px-2 py-1 rounded-md border ${row.needsCoverage ? "bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800" : "bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800"}`}
                        >
                          Coverage: {row.coverageCount}
                        </span>
                        <span
                          className={`px-2 py-1 rounded-md border ${row.needsBranchSlots ? "bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800" : "bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800"}`}
                        >
                          Slot: {row.slotCount}
                        </span>
                        <span
                          className={`px-2 py-1 rounded-md border ${row.needsCapacities ? "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800" : "bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800"}`}
                        >
                          Capacity: {row.capacityCount}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {row.needsCoverage && (
                        <button
                          onClick={() =>
                            navigate(buildCoverageCreateLink(row.branchId))
                          }
                          className="rounded text-xs font-bold px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 transition"
                        >
                          Gán coverage
                        </button>
                      )}
                      {row.needsBranchSlots && (
                        <button
                          onClick={() =>
                            navigate(buildBranchSlotCreateLink(row.branchId))
                          }
                          className="rounded text-xs font-bold px-3 py-1.5 bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 transition"
                        >
                          Bật branch slot
                        </button>
                      )}
                      {row.needsCapacities && (
                        <button
                          onClick={() =>
                            navigate(
                              buildCapacityCreateLink(
                                row.branchId,
                                timeView === "today"
                                  ? getLocalDateString(0)
                                  : getLocalDateString(1),
                              ),
                            )
                          }
                          className="rounded text-xs font-bold px-3 py-1.5 bg-amber-50 text-amber-700 hover:bg-amber-100 transition"
                        >
                          Tạo capacity
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col gap-4">
          <div className="flex items-center gap-2 text-lg font-bold text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-700 pb-4">
            <CalendarDays className="h-5 w-5 text-blue-600" /> Chuẩn bị cho ngày
            mai
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Gom các việc thường phải làm cuối ngày thành một cụm thao tác nhanh.
          </p>

          <div className="mt-2 space-y-4">
            <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white text-sm">
                    Generate capacity mặc định
                  </p>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Tạo capacity cho ngày mai từ cấu hình branch slot hiện tại,
                    bỏ qua record đã tồn tại.
                  </p>
                </div>
                <CalendarClock className="h-5 w-5 text-blue-600 shrink-0" />
              </div>
              <button
                onClick={() => void handleGenerateTomorrowDefaults()}
                className="mt-4 inline-flex items-center gap-2 rounded px-4 py-2 text-xs font-bold bg-blue-600 text-white hover:bg-blue-700 transition"
              >
                Chạy generate <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-3 xl:grid-cols-1">
              <div className="rounded-lg border border-amber-100 bg-amber-50 p-4 dark:border-amber-900/30 dark:bg-amber-900/20 flex flex-col justify-center">
                <p className="text-[11px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                  Thiếu capacity
                </p>
                <p className="mt-1 text-xl font-black text-amber-900 dark:text-amber-200">
                  {formatCount(quickPreparation.missingCapacities.length)}
                </p>
              </div>
              <div className="rounded-lg border border-red-100 bg-red-50 p-4 dark:border-red-900/30 dark:bg-red-900/20 flex flex-col justify-center">
                <p className="text-[11px] font-bold uppercase tracking-wider text-red-700 dark:text-red-400">
                  Thiếu coverage
                </p>
                <p className="mt-1 text-xl font-black text-red-900 dark:text-red-200">
                  {formatCount(quickPreparation.missingCoverage.length)}
                </p>
              </div>
              <div className="rounded-lg border border-indigo-100 bg-indigo-50 p-4 dark:border-indigo-900/30 dark:bg-indigo-900/20 flex flex-col justify-center">
                <p className="text-[11px] font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-400">
                  Thiếu slot
                </p>
                <p className="mt-1 text-xl font-black text-indigo-900 dark:text-indigo-200">
                  {formatCount(quickPreparation.missingSlots.length)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col gap-4">
          <div className="flex items-center gap-2 text-lg font-bold text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-700 pb-4">
            <ShieldAlert className="h-5 w-5 text-red-600" /> Sự cố cần xử lý
          </div>
          <div className="mt-2 space-y-3">
            <button
              onClick={() =>
                navigate("/admin/shipping/branch-delivery-slot-capacities")
              }
              className="flex w-full items-start justify-between rounded-lg border border-red-100 bg-red-50 p-4 text-left hover:bg-red-100/70 transition dark:border-red-900/30 dark:bg-red-900/20 shadow-sm"
            >
              <div>
                <p className="font-bold text-sm text-red-800 dark:text-red-400">
                  Slot đầy hoặc sắp đầy ({timeViewLabel})
                </p>
                <p className="mt-1 text-xs text-red-600 dark:text-red-300">
                  {formatCount(capacityMetrics.states.full)} slot đầy,{" "}
                  {formatCount(capacityMetrics.states.warning)} slot sắp đầy.
                </p>
              </div>
              <AlertTriangle className="h-5 w-5 text-red-500 shrink-0" />
            </button>

            <button
              onClick={() => navigate("/admin/shipping/service-areas")}
              className="flex w-full items-start justify-between rounded-lg border border-amber-100 bg-amber-50 p-4 text-left hover:bg-amber-100/70 transition dark:border-amber-900/30 dark:bg-amber-900/20 shadow-sm"
            >
              <div>
                <p className="font-bold text-sm text-amber-800 dark:text-amber-400">
                  Chi nhánh chưa có coverage
                </p>
                <p className="mt-1 text-xs text-amber-600 dark:text-amber-300">
                  {formatCount(metrics.branchesMissingCoverage.length)} chi
                  nhánh vẫn chưa map zone phục vụ.
                </p>
              </div>
              <Link2 className="h-5 w-5 text-amber-500 shrink-0" />
            </button>

            <button
              onClick={() => navigate("/admin/shipping/branch-delivery-slots")}
              className="flex w-full items-start justify-between rounded-lg border border-indigo-100 bg-indigo-50 p-4 text-left hover:bg-indigo-100/70 transition dark:border-indigo-900/30 dark:bg-indigo-900/20 shadow-sm"
            >
              <div>
                <p className="font-bold text-sm text-indigo-800 dark:text-indigo-400">
                  Chi nhánh chưa bật slot
                </p>
                <p className="mt-1 text-xs text-indigo-600 dark:text-indigo-300">
                  {formatCount(metrics.branchesMissingSlots.length)} chi nhánh
                  chưa có khung giờ hoạt động.
                </p>
              </div>
              <Clock3 className="h-5 w-5 text-indigo-500 shrink-0" />
            </button>

            <button
              onClick={() => navigate("/admin/shipping/zones")}
              className="flex w-full items-start justify-between rounded-lg border border-orange-100 bg-orange-50 p-4 text-left hover:bg-orange-100/70 transition dark:border-orange-900/30 dark:bg-orange-900/20 shadow-sm"
            >
              <div>
                <p className="font-bold text-sm text-orange-800 dark:text-orange-400">
                  Fallback zone đang bật
                </p>
                <p className="mt-1 text-xs text-orange-600 dark:text-orange-300">
                  {formatCount(metrics.fallbackZones)} zone cấp fallback đang
                  hoạt động, rà lại để tránh tính phí sai lệch.
                </p>
              </div>
              <MapPinned className="h-5 w-5 text-orange-500 shrink-0" />
            </button>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col gap-4">
          <div className="flex items-center gap-2 text-lg font-bold text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-700 pb-4">
            <Layers className="h-5 w-5 text-blue-600" /> Capacity health
          </div>
          {capacityMetrics.totalScoped === 0 ? (
            <div className="mt-2 py-10 rounded-xl border border-dashed border-gray-300 bg-gray-50 flex flex-col items-center dark:border-gray-600 dark:bg-gray-800/50">
              <CalendarClock className="h-10 w-10 text-gray-300 dark:text-gray-600 mb-3" />
              <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                Chưa có capacity
              </h3>
              <p className="mt-1 text-xs text-gray-500 mb-4 px-6 text-center">
                Tạo capacity để hệ thống bắt đầu kiểm soát giới hạn đơn theo
                khung giờ trong phạm vi đang xem.
              </p>
              <button
                onClick={() =>
                  navigate(
                    "/admin/shipping/branch-delivery-slot-capacities/create",
                  )
                }
                className="px-4 py-2 bg-blue-600 text-white font-medium text-sm rounded-lg hover:bg-blue-700 transition"
              >
                Tạo capacity ngay
              </button>
            </div>
          ) : (
            <>
              <div className="mt-2 grid grid-cols-2 gap-3 xl:grid-cols-4">
                {[
                  {
                    label: "Đã đầy",
                    value: capacityMetrics.states.full,
                    tone: "bg-red-50 text-red-700 border border-red-100 dark:border-red-900/30 dark:bg-red-900/20 dark:text-red-400",
                  },
                  {
                    label: "Sắp đầy",
                    value: capacityMetrics.states.warning,
                    tone: "bg-amber-50 text-amber-700 border border-amber-100 dark:border-amber-900/30 dark:bg-amber-900/20 dark:text-amber-400",
                  },
                  {
                    label: "Còn nhận",
                    value: capacityMetrics.states.available,
                    tone: "bg-green-50 text-green-700 border border-green-100 dark:border-green-900/30 dark:bg-green-900/20 dark:text-green-400",
                  },
                  {
                    label: "Không GH",
                    value: capacityMetrics.states.unlimited,
                    tone: "bg-gray-50 text-gray-700 border border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700",
                  },
                ].map((item) => (
                  <div
                    key={item.label}
                    className={`rounded-lg p-3 flex flex-col justify-center shadow-sm ${item.tone}`}
                  >
                    <p className="text-[10px] font-bold uppercase tracking-wider truncate mb-1">
                      {item.label}
                    </p>
                    <p className="text-xl font-black">
                      {formatCount(item.value)}
                    </p>
                  </div>
                ))}
              </div>

              <div className="mt-4 rounded-lg bg-gray-50 p-4 border border-gray-100 dark:border-gray-700 dark:bg-gray-800/50">
                <div className="flex items-center justify-between text-xs font-bold text-gray-700 dark:text-gray-300">
                  <span>Tỷ lệ lấp đầy sức chứa hữu hạn</span>
                  <span>{capacityMetrics.fillPercentage}%</span>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                  <div
                    className={`h-full transition-all ${capacityMetrics.fillPercentage >= 90 ? "bg-red-500" : capacityMetrics.fillPercentage >= 75 ? "bg-amber-500" : "bg-blue-500"}`}
                    style={{ width: `${capacityMetrics.fillPercentage}%` }}
                  />
                </div>
                <div className="mt-2 flex items-center justify-between text-[11px] font-medium text-gray-500 dark:text-gray-400">
                  <span>
                    Đã đặt: {formatCount(capacityMetrics.reservedFinite)}
                  </span>
                  <span>Tối đa: {formatCount(capacityMetrics.maxFinite)}</span>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col gap-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between border-b border-gray-100 dark:border-gray-700 pb-4">
          <div>
            <div className="flex items-center gap-2 text-lg font-bold text-gray-900 dark:text-white">
              <AlertCircle className="h-5 w-5 text-red-600" /> Top slot cần can
              thiệp ngay
            </div>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Các slot được sắp theo tỷ lệ lấp đầy giảm dần trong phạm vi{" "}
              {timeViewLabel}.
            </p>
          </div>
          <button
            onClick={() =>
              navigate("/admin/shipping/branch-delivery-slot-capacities")
            }
            className="px-4 py-2 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600 text-sm font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition inline-flex items-center gap-2 shadow-sm"
          >
            Mở planner / list capacity <ArrowRight className="h-4 w-4" />
          </button>
        </div>

        {loading ? (
          <div className="flex flex-col justify-center items-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-3" />
            <p className="text-gray-500 font-medium">Đang đồng bộ dữ liệu...</p>
          </div>
        ) : capacityMetrics.overloadedRows.length === 0 ? (
          <div className="text-center py-10 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-dashed border-gray-300 dark:border-gray-600 flex flex-col items-center">
            <CheckCircle2 className="w-10 h-10 text-green-500 mb-3" />
            <p className="text-sm text-gray-500">
              Không có slot nào đầy hoặc sắp đầy trong phạm vi đang xem.
            </p>
          </div>
        ) : (
          <Card className="!p-0 overflow-hidden border border-gray-200 dark:border-gray-700 shadow-none mt-2">
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
                      Ngày
                    </th>
                    <th className="px-5 py-3.5 text-left text-xs font-bold text-gray-500 uppercase">
                      Tải hiện tại
                    </th>
                    <th className="px-5 py-3.5 text-right text-xs font-bold text-gray-500 uppercase">
                      Hành động
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-100 dark:divide-gray-800">
                  {capacityMetrics.overloadedRows.slice(0, 10).map((row) => {
                    const branch = branchMap[row.branchId];
                    const slot = slotMap[row.deliveryTimeSlotId];
                    const ratio = row.maxOrders
                      ? Math.round((row.reservedOrders / row.maxOrders) * 100)
                      : 0;
                    const tone =
                      row.state === "full"
                        ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border border-red-200 dark:border-red-800"
                        : "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 border border-amber-200 dark:border-amber-800";
                    return (
                      <tr
                        key={row.id}
                        className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group"
                      >
                        <td className="px-5 py-4">
                          <div className="font-semibold text-gray-900 dark:text-white text-sm">
                            {branch?.name ?? `Branch #${row.branchId}`}
                          </div>
                          <div className="text-xs text-gray-500 font-mono mt-0.5">
                            {branch?.code ?? ""}
                          </div>
                        </td>
                        <td className="px-5 py-4 text-sm font-medium text-gray-700 dark:text-gray-300">
                          {slot?.label ?? `Slot #${row.deliveryTimeSlotId}`}
                        </td>
                        <td className="px-5 py-4 text-sm text-gray-700 dark:text-gray-300">
                          {row.deliveryDate}
                        </td>
                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${tone}`}
                          >
                            {row.maxOrders == null
                              ? `${formatCount(row.reservedOrders)} đơn`
                              : `${formatCount(row.reservedOrders)}/${formatCount(row.maxOrders)} đơn • ${ratio}%`}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-right">
                          <button
                            onClick={() =>
                              navigate(
                                `/admin/shipping/branch-delivery-slot-capacities/edit/${row.id}`,
                              )
                            }
                            className="px-3 py-1.5 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 text-xs font-semibold rounded shadow-sm hover:bg-gray-50 transition-colors"
                          >
                            Mở record
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

export default ShippingOverviewPage;
