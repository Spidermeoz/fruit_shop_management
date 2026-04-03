import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  MapPinned,
  Truck,
  Clock3,
  Link2,
  CalendarDays,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  Loader2,
  ShieldAlert,
  TrendingUp,
  Activity,
  AlertCircle,
  Info,
  ExternalLink,
  Store,
} from "lucide-react";
import Card from "../../../components/admin/layouts/Card";
import { http } from "../../../services/http";
import { useAdminToast } from "../../../context/AdminToastContext";

// --- Interfaces ---
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
  status: "active" | "inactive";
}

interface BranchServiceArea {
  id: number;
  branchId: number;
  shippingZoneId: number;
  deliveryFeeOverride?: number | null;
  minOrderValue?: number | null;
  maxOrderValue?: number | null;
  supportsSameDay?: boolean;
  status: "active" | "inactive";
}

interface DeliveryTimeSlot {
  id: number;
  code: string;
  label: string;
  startTime: string;
  endTime: string;
  cutoffMinutes: number;
  maxOrders?: number | null;
  sortOrder: number;
  status: "active" | "inactive";
}

interface BranchDeliveryTimeSlot {
  id: number;
  branchId: number;
  deliveryTimeSlotId: number;
  maxOrdersOverride?: number | null;
  status: "active" | "inactive";
}

interface BranchDeliverySlotCapacity {
  id: number;
  branchId: number;
  deliveryDate: string;
  deliveryTimeSlotId: number;
  maxOrders?: number | null;
  reservedOrders: number;
  status: "active" | "inactive";
}

interface BranchOption {
  id: number;
  name: string;
  code: string;
  status?: string;
}

type ApiList<T> = {
  success: boolean;
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
  meta?: {
    total?: number;
    limit?: number;
    offset?: number;
    page?: number;
  };
};

// --- Helpers ---
const toArray = <T,>(input: ApiList<T>["data"] | undefined): T[] => {
  if (Array.isArray(input)) return input;
  if (Array.isArray(input?.items)) return input.items;
  return [];
};

const formatCount = (value: number) => value.toLocaleString("vi-VN");

const isFallbackZone = (zone: ShippingZone) =>
  !zone.province && !zone.district && !zone.ward;

const getTodayString = () => new Date().toISOString().slice(0, 10);

const isToday = (value: string) => {
  if (!value) return false;
  return value.startsWith(getTodayString());
};

const getCapacityState = (row: BranchDeliverySlotCapacity) => {
  if (row.status !== "active") return "inactive";
  if (row.maxOrders === null || row.maxOrders === undefined) return "unlimited";
  if (row.reservedOrders >= row.maxOrders) return "full";
  if (row.reservedOrders / row.maxOrders >= 0.8) return "warning";
  return "available";
};

// --- Main Component ---
const ShippingDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { showErrorToast } = useAdminToast();

  const [loading, setLoading] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());

  const [zones, setZones] = useState<ShippingZone[]>([]);
  const [serviceAreas, setServiceAreas] = useState<BranchServiceArea[]>([]);
  const [slots, setSlots] = useState<DeliveryTimeSlot[]>([]);
  const [branchSlots, setBranchSlots] = useState<BranchDeliveryTimeSlot[]>([]);
  const [capacities, setCapacities] = useState<BranchDeliverySlotCapacity[]>(
    [],
  );
  const [branches, setBranches] = useState<BranchOption[]>([]);

  const fetchDashboard = async () => {
    try {
      setLoading(true);

      const [
        zonesRes,
        serviceAreasRes,
        slotsRes,
        branchSlotsRes,
        capacitiesRes,
        branchesRes,
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
      ]);

      setZones(toArray(zonesRes?.data));
      setServiceAreas(toArray(serviceAreasRes?.data));
      setSlots(toArray(slotsRes?.data));
      setBranchSlots(toArray(branchSlotsRes?.data));
      setCapacities(toArray(capacitiesRes?.data));
      setBranches(toArray(branchesRes?.data));
      setLastRefreshed(new Date());
    } catch (err: any) {
      console.error(err);
      showErrorToast(err?.message || "Không thể tải shipping dashboard.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  // --- Data Lookups ---
  const { branchMap, slotMap } = useMemo(() => {
    return {
      branchMap: branches.reduce(
        (acc, b) => ({ ...acc, [b.id]: b }),
        {} as Record<number, BranchOption>,
      ),
      slotMap: slots.reduce(
        (acc, s) => ({ ...acc, [s.id]: s }),
        {} as Record<number, DeliveryTimeSlot>,
      ),
    };
  }, [branches, slots]);

  // --- Derived Metrics ---
  const metrics = useMemo(() => {
    const activeBranches = branches.filter((b) => b.status !== "inactive");
    const activeZones = zones.filter((z) => z.status === "active");
    const activeCoverage = serviceAreas.filter((x) => x.status === "active");
    const activeSlots = slots.filter((x) => x.status === "active");
    const activeBranchSlots = branchSlots.filter((x) => x.status === "active");

    const todayCapacities = capacities.filter((x) => isToday(x.deliveryDate));
    const todayActiveCapacities = todayCapacities.filter(
      (x) => x.status === "active",
    );

    let todayReservedFinite = 0;
    let todayMaxFinite = 0;
    let todayReservedUnlimited = 0;

    const capacityStates = {
      full: 0,
      warning: 0,
      available: 0,
      unlimited: 0,
    };

    todayActiveCapacities.forEach((cap) => {
      const state = getCapacityState(cap);
      capacityStates[state as keyof typeof capacityStates]++;

      if (state === "unlimited") {
        todayReservedUnlimited += cap.reservedOrders;
      } else {
        todayReservedFinite += cap.reservedOrders;
        todayMaxFinite += cap.maxOrders || 0;
      }
    });

    const branchIdsWithCoverage = new Set(
      activeCoverage.map((x) => x.branchId),
    );
    const branchIdsWithSlots = new Set(
      activeBranchSlots.map((x) => x.branchId),
    );

    const branchesNeedingAttention = activeBranches.filter(
      (b) => !branchIdsWithCoverage.has(b.id) || !branchIdsWithSlots.has(b.id),
    );

    return {
      activeZones: activeZones.length,
      activeCoverage: activeCoverage.length,
      activeSlots: activeSlots.length,
      activeBranchSlots: activeBranchSlots.length,
      totalCapacities: capacities.length,

      fallbackZones: activeZones.filter(isFallbackZone).length,
      sameDayCoverage: activeCoverage.filter((x) => x.supportsSameDay).length,
      customBranchSlot: activeBranchSlots.filter(
        (x) =>
          x.maxOrdersOverride !== null && x.maxOrdersOverride !== undefined,
      ).length,
      inactiveSystemSlots: slots.filter((x) => x.status === "inactive").length,

      branchesNeedingAttention,
      branchIdsWithCoverage,
      branchIdsWithSlots,

      todayActiveCapacities: todayActiveCapacities.length,
      capacityStates,
      todayReservedFinite,
      todayMaxFinite,
      todayReservedUnlimited,
    };
  }, [zones, serviceAreas, slots, branchSlots, capacities, branches]);

  // --- Top Overloaded Capacities ---
  const topOverloadedSlots = useMemo(() => {
    return capacities
      .filter(
        (x) =>
          isToday(x.deliveryDate) &&
          x.status === "active" &&
          x.maxOrders !== null &&
          x.maxOrders !== undefined,
      )
      .map((x) => ({
        ...x,
        ratio: x.reservedOrders / (x.maxOrders || 1),
      }))
      .filter((x) => x.ratio >= 0.8) // Only warning or full
      .sort((a, b) => b.ratio - a.ratio)
      .slice(0, 5);
  }, [capacities]);

  // --- Module Health Data ---
  const moduleHealth = [
    {
      name: "Zones",
      total: zones.length,
      active: metrics.activeZones,
      warningCount: metrics.fallbackZones,
      warningText: "Fallback zones đang bật",
      path: "/admin/shipping/zones",
    },
    {
      name: "Coverage",
      total: serviceAreas.length,
      active: metrics.activeCoverage,
      warningCount: metrics.branchesNeedingAttention.filter(
        (b) => !metrics.branchIdsWithCoverage.has(b.id),
      ).length,
      warningText: "Chi nhánh chưa có coverage",
      path: "/admin/shipping/service-areas",
    },
    {
      name: "Khung giờ (Slots)",
      total: slots.length,
      active: metrics.activeSlots,
      warningCount: metrics.inactiveSystemSlots,
      warningText: "Slots hệ thống bị tắt",
      path: "/admin/shipping/delivery-slots",
    },
    {
      name: "Branch Slots",
      total: branchSlots.length,
      active: metrics.activeBranchSlots,
      warningCount: metrics.customBranchSlot,
      warningText: "Overrides đang áp dụng",
      path: "/admin/shipping/branch-delivery-slots",
    },
    {
      name: "Capacity hôm nay",
      total: capacities.filter((x) => isToday(x.deliveryDate)).length,
      active: metrics.todayActiveCapacities,
      warningCount:
        metrics.capacityStates.full + metrics.capacityStates.warning,
      warningText: "Slots quá tải / sắp đầy",
      path: `/admin/shipping/branch-delivery-slot-capacities?deliveryDate=${getTodayString()}`,
    },
  ];

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center py-32">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600 dark:text-blue-400 mb-4" />
        <span className="text-gray-600 dark:text-gray-400 font-medium">
          Đang tải Operations Dashboard...
        </span>
      </div>
    );
  }

  const capacityFillPercentage =
    metrics.todayMaxFinite > 0
      ? Math.min(
          Math.round(
            (metrics.todayReservedFinite / metrics.todayMaxFinite) * 100,
          ),
          100,
        )
      : 0;

  return (
    <div className="w-full px-4 md:px-6 xl:px-8 pb-24 space-y-6">
      {/* Tầng A: Command Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Activity className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            Shipping Operations
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Điều hành toàn trình cấu hình giao hàng và tình trạng chịu tải theo
            thời gian thực.
            <span className="ml-2 inline-block px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-xs">
              Cập nhật: {lastRefreshed.toLocaleTimeString("vi-VN")}
            </span>
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => navigate("/admin/shipping/service-areas")}
            className="px-4 py-2 rounded-lg bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
          >
            Quản lý Coverage
          </button>
          <button
            onClick={() =>
              navigate(
                `/admin/shipping/branch-delivery-slot-capacities?deliveryDate=${getTodayString()}`,
              )
            }
            className="px-4 py-2 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800 text-sm font-medium hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
          >
            Capacity Hôm nay
          </button>
          <button
            onClick={fetchDashboard}
            className="px-4 py-2 rounded-lg bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-sm font-medium hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors flex items-center gap-2"
          >
            <Clock3 className="w-4 h-4" /> Làm mới
          </button>
        </div>
      </div>

      {/* Tầng B: KPI Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-8 gap-3">
        {[
          {
            label: "Tổng Zones",
            value: metrics.activeZones,
            icon: MapPinned,
            color: "text-blue-600",
          },
          {
            label: "Coverage (Map)",
            value: metrics.activeCoverage,
            icon: Truck,
            color: "text-emerald-600",
          },
          {
            label: "Giờ giao (Slots)",
            value: metrics.activeSlots,
            icon: Clock3,
            color: "text-indigo-600",
          },
          {
            label: "Branch Slots",
            value: metrics.activeBranchSlots,
            icon: Link2,
            color: "text-purple-600",
          },
          {
            label: "Dữ liệu Capacity",
            value: formatCount(metrics.totalCapacities),
            icon: CalendarDays,
            color: "text-gray-600",
          },
          {
            label: "Slot hôm nay trống",
            value:
              metrics.capacityStates.available +
              metrics.capacityStates.unlimited,
            icon: CheckCircle2,
            color: "text-green-600",
          },
          {
            label: "Slot hôm nay FULL",
            value: metrics.capacityStates.full,
            icon: AlertTriangle,
            color: "text-red-600",
          },
          {
            label: "Branch thiếu config",
            value: metrics.branchesNeedingAttention.length,
            icon: Store,
            color: "text-amber-600",
          },
        ].map((kpi, idx) => (
          <div
            key={idx}
            className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 flex flex-col justify-center"
          >
            <div className="flex items-center gap-2 mb-2 text-gray-500 dark:text-gray-400">
              <kpi.icon className={`w-4 h-4 ${kpi.color}`} />
              <span className="text-[11px] font-bold uppercase tracking-wider">
                {kpi.label}
              </span>
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white leading-none">
              {kpi.value}
            </div>
          </div>
        ))}
      </div>

      {/* Tầng C: Capacity Overview & Actionable Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Capacity Today Visualizer */}
        <Card className="lg:col-span-2 p-6 flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                Tải trọng vận hành hôm nay
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Sức chứa và lượng đơn đã nhận trong ngày ({getTodayString()})
              </p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                {formatCount(
                  metrics.todayReservedFinite + metrics.todayReservedUnlimited,
                )}
              </p>
              <p className="text-xs text-gray-500 uppercase font-medium">
                Tổng Reserved
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-100 dark:border-red-900/50">
              <p className="text-xs text-red-600 dark:text-red-400 font-medium">
                Slots Full
              </p>
              <p className="text-xl font-bold text-red-700 dark:text-red-300">
                {metrics.capacityStates.full}
              </p>
            </div>
            <div className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-100 dark:border-orange-900/50">
              <p className="text-xs text-orange-600 dark:text-orange-400 font-medium">
                Slots Warning
              </p>
              <p className="text-xl font-bold text-orange-700 dark:text-orange-300">
                {metrics.capacityStates.warning}
              </p>
            </div>
            <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-100 dark:border-green-900/50">
              <p className="text-xs text-green-600 dark:text-green-400 font-medium">
                Slots Trống
              </p>
              <p className="text-xl font-bold text-green-700 dark:text-green-300">
                {metrics.capacityStates.available}
              </p>
            </div>
            <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
              <p className="text-xs text-gray-600 dark:text-gray-400 font-medium">
                Không giới hạn
              </p>
              <p className="text-xl font-bold text-gray-800 dark:text-gray-200">
                {metrics.capacityStates.unlimited}
              </p>
            </div>
          </div>

          <div className="mt-auto">
            <div className="flex justify-between text-sm mb-2">
              <span className="font-medium text-gray-700 dark:text-gray-300">
                Sức chứa hữu hạn (Finite Capacity)
              </span>
              <span className="font-bold text-gray-900 dark:text-white">
                {capacityFillPercentage}% lấp đầy
              </span>
            </div>
            <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-4 overflow-hidden flex">
              <div
                className={`h-full ${capacityFillPercentage >= 90 ? "bg-red-500" : capacityFillPercentage >= 75 ? "bg-orange-500" : "bg-blue-500"}`}
                style={{ width: `${capacityFillPercentage}%` }}
              ></div>
            </div>
            <p className="text-xs text-gray-500 mt-2 text-right">
              {formatCount(metrics.todayReservedFinite)} /{" "}
              {formatCount(metrics.todayMaxFinite)} reserved
            </p>
          </div>
        </Card>

        {/* Incident Panel */}
        <Card className="p-6">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
            Cảnh báo hệ thống
          </h2>
          <div className="space-y-3">
            {metrics.capacityStates.full > 0 && (
              <div className="flex items-start gap-3 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-100 dark:border-red-900/30">
                <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-bold text-red-900 dark:text-red-300">
                    Nguy cấp: Slot đầy
                  </h4>
                  <p className="text-xs text-red-700 dark:text-red-400 mt-0.5">
                    Có {metrics.capacityStates.full} slot đã đạt giới hạn hôm
                    nay.
                  </p>
                </div>
              </div>
            )}

            {metrics.branchesNeedingAttention.length > 0 && (
              <div className="flex items-start gap-3 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-100 dark:border-amber-900/30">
                <Store className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-bold text-amber-900 dark:text-amber-300">
                    Thiếu cấu hình chi nhánh
                  </h4>
                  <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">
                    {metrics.branchesNeedingAttention.length} chi nhánh đang
                    thiếu coverage hoặc time slots.
                  </p>
                </div>
              </div>
            )}

            {metrics.fallbackZones > 0 && (
              <div className="flex items-start gap-3 p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-100 dark:border-orange-900/30">
                <ShieldAlert className="w-5 h-5 text-orange-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-bold text-orange-900 dark:text-orange-300">
                    Fallback Zones
                  </h4>
                  <p className="text-xs text-orange-700 dark:text-orange-400 mt-0.5">
                    {metrics.fallbackZones} rule cấp thấp nhất đang bật. Dễ sai
                    lệch phí.
                  </p>
                </div>
              </div>
            )}

            <div className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-900/30">
              <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-bold text-blue-900 dark:text-blue-300">
                  Thông tin vận hành
                </h4>
                <p className="text-xs text-blue-700 dark:text-blue-400 mt-0.5">
                  {metrics.sameDayCoverage} rules same-day |{" "}
                  {metrics.customBranchSlot} branch slots override.
                </p>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Tầng D & E: Bảng dữ liệu song song */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Module Health Table */}
        <Card className="flex flex-col">
          <div className="p-5 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
              Sức khỏe phân hệ (Module Health)
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800/50 text-gray-500 dark:text-gray-400">
                <tr>
                  <th className="px-5 py-3 font-medium">Phân hệ</th>
                  <th className="px-5 py-3 font-medium">Tổng / Active</th>
                  <th className="px-5 py-3 font-medium">Cảnh báo</th>
                  <th className="px-5 py-3 font-medium text-right">Tác vụ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {moduleHealth.map((mod, i) => (
                  <tr
                    key={i}
                    className="hover:bg-gray-50 dark:hover:bg-gray-800/50"
                  >
                    <td className="px-5 py-3 font-semibold text-gray-900 dark:text-white">
                      {mod.name}
                    </td>
                    <td className="px-5 py-3 text-gray-600 dark:text-gray-300">
                      {formatCount(mod.active)}{" "}
                      <span className="text-gray-400 text-xs">
                        / {formatCount(mod.total)}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      {mod.warningCount > 0 ? (
                        <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400 text-xs font-medium border border-red-200 dark:border-red-800/50">
                          {mod.warningCount} {mod.warningText}
                        </span>
                      ) : (
                        <span className="text-green-600 dark:text-green-400 text-xs font-medium flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Ổn định
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <button
                        onClick={() => navigate(mod.path)}
                        className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 inline-flex items-center"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Top Overloaded Slots Table */}
        <Card className="flex flex-col">
          <div className="p-5 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-orange-500" />
              Slots căng tải nhất hôm nay
            </h2>
            <button
              onClick={() =>
                navigate(
                  `/admin/shipping/branch-delivery-slot-capacities?deliveryDate=${getTodayString()}`,
                )
              }
              className="text-sm text-blue-600 hover:underline dark:text-blue-400"
            >
              Xem tất cả
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800/50 text-gray-500 dark:text-gray-400">
                <tr>
                  <th className="px-5 py-3 font-medium">Chi nhánh</th>
                  <th className="px-5 py-3 font-medium">Khung giờ</th>
                  <th className="px-5 py-3 font-medium text-right">
                    Tỷ lệ (Res/Max)
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {topOverloadedSlots.length === 0 ? (
                  <tr>
                    <td
                      colSpan={3}
                      className="px-5 py-8 text-center text-gray-500 dark:text-gray-400"
                    >
                      Không có khung giờ nào đạt cảnh báo quá tải hôm nay.
                    </td>
                  </tr>
                ) : (
                  topOverloadedSlots.map((cap) => {
                    const branch = branchMap[cap.branchId];
                    const slot = slotMap[cap.deliveryTimeSlotId];
                    const percent = Math.round(cap.ratio * 100);
                    return (
                      <tr
                        key={cap.id}
                        className="hover:bg-gray-50 dark:hover:bg-gray-800/50"
                      >
                        <td className="px-5 py-3 font-medium text-gray-900 dark:text-white">
                          {branch?.name || `ID: ${cap.branchId}`}
                        </td>
                        <td className="px-5 py-3 text-gray-600 dark:text-gray-300">
                          {slot?.label || `ID: ${cap.deliveryTimeSlotId}`}
                        </td>
                        <td className="px-5 py-3">
                          <div className="flex items-center justify-end gap-2">
                            <span
                              className={`font-bold ${percent >= 100 ? "text-red-600 dark:text-red-400" : "text-orange-600 dark:text-orange-400"}`}
                            >
                              {percent}%
                            </span>
                            <span className="text-xs text-gray-500">
                              ({cap.reservedOrders}/{cap.maxOrders})
                            </span>
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
      </div>

      {/* Action Board: Branch Needing Attention (If any) */}
      {metrics.branchesNeedingAttention.length > 0 && (
        <Card className="flex flex-col">
          <div className="p-5 border-b border-gray-200 dark:border-gray-700 bg-amber-50/50 dark:bg-amber-900/10">
            <h2 className="text-lg font-bold text-amber-900 dark:text-amber-400 flex items-center gap-2">
              <Store className="w-5 h-5" />
              Danh sách chi nhánh thiếu cấu hình vận hành
            </h2>
            <p className="text-sm text-amber-700 dark:text-amber-500 mt-1">
              Các chi nhánh này đang active nhưng chưa thể nhận đơn giao hàng
              chuẩn xác.
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800/50 text-gray-500 dark:text-gray-400">
                <tr>
                  <th className="px-5 py-3 font-medium">Tên chi nhánh</th>
                  <th className="px-5 py-3 font-medium">Mã</th>
                  <th className="px-5 py-3 font-medium">Trạng thái Coverage</th>
                  <th className="px-5 py-3 font-medium">
                    Trạng thái Branch Slots
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {metrics.branchesNeedingAttention.map((b) => {
                  const hasCov = metrics.branchIdsWithCoverage.has(b.id);
                  const hasSlot = metrics.branchIdsWithSlots.has(b.id);
                  return (
                    <tr
                      key={b.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-800/50"
                    >
                      <td className="px-5 py-3 font-semibold text-gray-900 dark:text-white">
                        {b.name}
                      </td>
                      <td className="px-5 py-3 text-gray-500">{b.code}</td>
                      <td className="px-5 py-3">
                        {hasCov ? (
                          <span className="text-green-600 text-xs font-medium">
                            Đã có
                          </span>
                        ) : (
                          <span className="text-red-600 text-xs font-medium bg-red-50 dark:bg-red-900/30 px-2 py-1 rounded">
                            Thiếu Mapping
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3">
                        {hasSlot ? (
                          <span className="text-green-600 text-xs font-medium">
                            Đã có
                          </span>
                        ) : (
                          <span className="text-red-600 text-xs font-medium bg-red-50 dark:bg-red-900/30 px-2 py-1 rounded">
                            Thiếu Slots
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Tầng F: Tool Cards (Truy cập nhanh) */}
      <div>
        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
          Điều hướng Module & Công cụ
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-5 gap-4">
          {[
            {
              title: "Zones Area",
              icon: MapPinned,
              link: "/admin/shipping/zones",
              stat1: `${metrics.activeZones} active`,
              stat2: `${metrics.fallbackZones} fallback`,
            },
            {
              title: "Coverage Rules",
              icon: Truck,
              link: "/admin/shipping/service-areas",
              stat1: `${metrics.activeCoverage} mappings`,
              stat2: `${metrics.sameDayCoverage} same-day`,
            },
            {
              title: "System Slots",
              icon: Clock3,
              link: "/admin/shipping/delivery-slots",
              stat1: `${metrics.activeSlots} active`,
              stat2: `${metrics.inactiveSystemSlots} inactive`,
            },
            {
              title: "Branch Slots",
              icon: Link2,
              link: "/admin/shipping/branch-delivery-slots",
              stat1: `${metrics.activeBranchSlots} active`,
              stat2: `${metrics.customBranchSlot} overrides`,
            },
            {
              title: "Capacity Data",
              icon: CalendarDays,
              link: "/admin/shipping/branch-delivery-slot-capacities",
              stat1: `${metrics.todayActiveCapacities} today records`,
              stat2: `${metrics.capacityStates.full} full today`,
            },
          ].map((tool, idx) => (
            <button
              key={idx}
              onClick={() => navigate(tool.link)}
              className="text-left bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 hover:border-blue-500 hover:shadow-md transition-all group"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="p-2.5 bg-gray-50 dark:bg-gray-700/50 rounded-lg text-gray-700 dark:text-gray-300 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                  <tool.icon className="w-5 h-5" />
                </div>
                <ArrowRight className="w-4 h-4 text-gray-300 dark:text-gray-600 group-hover:text-blue-500" />
              </div>
              <h3 className="font-bold text-gray-900 dark:text-white mb-2">
                {tool.title}
              </h3>
              <div className="flex flex-col gap-1">
                <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                  {tool.stat1}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-500"></span>
                  {tool.stat2}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ShippingDashboardPage;
