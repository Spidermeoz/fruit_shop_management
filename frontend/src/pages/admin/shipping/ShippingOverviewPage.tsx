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
  Store,
  RefreshCw,
  PlusCircle,
  Settings,
  CalendarCheck,
  CalendarClock,
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

type TimeViewMode = "today" | "tomorrow" | "next7days";

// --- Helpers ---
const toArray = <T,>(input: ApiList<T>["data"] | undefined): T[] => {
  if (Array.isArray(input)) return input;
  if (Array.isArray(input?.items)) return input.items;
  return [];
};

const formatCount = (value: number) => value.toLocaleString("vi-VN");

const isFallbackZone = (zone: ShippingZone) =>
  !zone.province && !zone.district && !zone.ward;

const getTodayString = () => {
  const d = new Date();
  // Adjust to local timezone correctly before slicing
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 10);
};

const getTomorrowString = () => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 10);
};

const getNext7DaysDates = () => {
  return Array.from({ length: 7 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 10);
  });
};

const getCapacityState = (row: BranchDeliverySlotCapacity) => {
  if (row.status !== "active") return "inactive";
  if (row.maxOrders === null || row.maxOrders === undefined) return "unlimited";
  if (row.reservedOrders >= row.maxOrders) return "full";
  if (row.reservedOrders / row.maxOrders >= 0.8) return "warning";
  return "available";
};

// --- Prefill Link Builders ---
const buildCoverageCreateLink = (branchId: number) =>
  `/admin/shipping/service-areas/create?branchId=${branchId}`;
const buildBranchSlotCreateLink = (branchId: number) =>
  `/admin/shipping/branch-delivery-slots/create?branchId=${branchId}`;

// --- Main Component ---
const ShippingDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { showErrorToast } = useAdminToast();

  const [loading, setLoading] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());
  const [timeView, setTimeView] = useState<TimeViewMode>("today");

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
      showErrorToast(
        err?.message || "Không thể tải dữ liệu điều hành giao hàng.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  // --- Date Scoping ---
  const targetDates = useMemo(() => {
    if (timeView === "today") return [getTodayString()];
    if (timeView === "tomorrow") return [getTomorrowString()];
    return getNext7DaysDates();
  }, [timeView]);

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

  // --- Core Derived Metrics ---
  const metrics = useMemo(() => {
    const activeBranches = branches.filter((b) => b.status !== "inactive");
    const activeZones = zones.filter((z) => z.status === "active");
    const activeCoverage = serviceAreas.filter((x) => x.status === "active");
    const activeSlots = slots.filter((x) => x.status === "active");
    const activeBranchSlots = branchSlots.filter((x) => x.status === "active");

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
      activeBranchesCount: activeBranches.length,
    };
  }, [zones, serviceAreas, slots, branchSlots, capacities, branches]);

  // --- Time-Scoped Capacity Metrics ---
  const scopedCapacityMetrics = useMemo(() => {
    const scopedRecords = capacities.filter((x) =>
      targetDates.includes(x.deliveryDate.substring(0, 10)),
    );
    const activeScopedRecords = scopedRecords.filter(
      (x) => x.status === "active",
    );

    let reservedFinite = 0;
    let maxFinite = 0;
    let reservedUnlimited = 0;

    const states = { full: 0, warning: 0, available: 0, unlimited: 0 };

    activeScopedRecords.forEach((cap) => {
      const state = getCapacityState(cap);
      states[state as keyof typeof states]++;

      if (state === "unlimited") {
        reservedUnlimited += cap.reservedOrders;
      } else {
        reservedFinite += cap.reservedOrders;
        maxFinite += cap.maxOrders || 0;
      }
    });

    return {
      totalScoped: scopedRecords.length,
      activeScoped: activeScopedRecords.length,
      states,
      reservedFinite,
      maxFinite,
      reservedUnlimited,
      records: activeScopedRecords,
      fillPercentage:
        maxFinite > 0
          ? Math.min(Math.round((reservedFinite / maxFinite) * 100), 100)
          : 0,
    };
  }, [capacities, targetDates]);

  // --- Top Overloaded Slots (Scoped) ---
  const topOverloadedSlots = useMemo(() => {
    return scopedCapacityMetrics.records
      .filter((x) => x.maxOrders !== null && x.maxOrders !== undefined)
      .map((x) => ({
        ...x,
        ratio: x.reservedOrders / (x.maxOrders || 1),
      }))
      .filter((x) => x.ratio >= 0.8) // Warning or full
      .sort((a, b) => b.ratio - a.ratio)
      .slice(0, 10);
  }, [scopedCapacityMetrics.records]);

  // --- Module Health Data ---
  const moduleHealthData = [
    {
      name: "Vùng giao hàng",
      total: zones.length,
      active: metrics.activeZones,
      warningCount: metrics.fallbackZones,
      warningText: "Vùng mặc định đang bật",
      path: "/admin/shipping/zones",
      cta: "Sửa ngay",
    },
    {
      name: "Coverage",
      total: serviceAreas.length,
      active: metrics.activeCoverage,
      warningCount: metrics.branchesNeedingAttention.filter(
        (b) => !metrics.branchIdsWithCoverage.has(b.id),
      ).length,
      warningText: "Chi nhánh thiếu Coverage",
      path: "/admin/shipping/service-areas",
      cta: "Bổ sung",
    },
    {
      name: "Khung giờ hệ thống",
      total: slots.length,
      active: metrics.activeSlots,
      warningCount: metrics.inactiveSystemSlots,
      warningText: "Khung giờ bị tắt",
      path: "/admin/shipping/delivery-slots",
      cta: "Kiểm tra",
    },
    {
      name: "Khung giờ chi nhánh",
      total: branchSlots.length,
      active: metrics.activeBranchSlots,
      warningCount: metrics.customBranchSlot,
      warningText: "Có thiết lập ghi đè",
      path: "/admin/shipping/branch-delivery-slots",
      cta: "Xem chi tiết",
    },
  ];

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center py-32 w-full">
        <Loader2 className="w-10 h-10 animate-spin text-blue-600 mb-4" />
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
          Đang tải Trung tâm điều hành...
        </h3>
        <span className="text-gray-500 dark:text-gray-400 mt-2">
          Đang đồng bộ dữ liệu giao hàng và chi nhánh
        </span>
      </div>
    );
  }

  // Helper cho text trạng thái của timeView
  const timeViewText =
    timeView === "today"
      ? "hôm nay"
      : timeView === "tomorrow"
        ? "ngày mai"
        : "7 ngày tới";

  return (
    <div className="w-full px-4 md:px-6 xl:px-8 pb-24 space-y-8">
      {/* Tầng A: Header + Command Center */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
              <Activity className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            Trung tâm điều hành giao hàng
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2">
            Theo dõi cấu hình giao hàng, năng lực nhận đơn và các điểm cần xử lý
            ngay.
            <span className="inline-block px-2.5 py-1 rounded-md bg-gray-100 dark:bg-gray-700 text-xs font-medium text-gray-600 dark:text-gray-300">
              Cập nhật lúc {lastRefreshed.toLocaleTimeString("vi-VN")}
            </span>
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={fetchDashboard}
            className="px-4 py-2 rounded-lg bg-transparent border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" /> Làm mới
          </button>
          <button
            onClick={() => navigate("/admin/shipping/service-areas")}
            className="px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            Mở Coverage
          </button>
          <button
            onClick={() =>
              navigate(
                `/admin/shipping/branch-delivery-slot-capacities?deliveryDate=${getTodayString()}`,
              )
            }
            className="px-5 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors shadow-sm"
          >
            Xem giới hạn nhận đơn
          </button>
        </div>
      </div>

      {/* Tầng B: Time Scope Switcher */}
      <div className="flex items-center gap-2 p-1.5 bg-gray-100 dark:bg-gray-800/80 rounded-xl w-fit">
        {[
          { id: "today", label: "Hôm nay" },
          { id: "tomorrow", label: "Ngày mai" },
          { id: "next7days", label: "7 ngày tới" },
        ].map((mode) => (
          <button
            key={mode.id}
            onClick={() => setTimeView(mode.id as TimeViewMode)}
            className={`px-6 py-2 rounded-lg text-sm font-semibold transition-all ${
              timeView === mode.id
                ? "bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm"
                : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            }`}
          >
            {mode.label}
          </button>
        ))}
      </div>

      {/* Tầng C: KPI Strip */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {[
          {
            label: "Vùng giao hàng",
            value: metrics.activeZones,
            icon: MapPinned,
            color: "text-blue-600",
            border: "border-blue-100",
            bg: "bg-blue-50",
          },
          {
            label: "Coverage",
            value: metrics.activeCoverage,
            icon: Truck,
            color: "text-emerald-600",
            border: "border-emerald-100",
            bg: "bg-emerald-50",
          },
          {
            label: "Giờ hệ thống",
            value: metrics.activeSlots,
            icon: Clock3,
            color: "text-indigo-600",
            border: "border-indigo-100",
            bg: "bg-indigo-50",
          },
          {
            label: "Giờ chi nhánh",
            value: metrics.activeBranchSlots,
            icon: Link2,
            color: "text-purple-600",
            border: "border-purple-100",
            bg: "bg-purple-50",
          },
          {
            label: "Bản ghi Capacity",
            value: formatCount(scopedCapacityMetrics.activeScoped),
            icon: CalendarDays,
            color: "text-slate-600",
            border: "border-slate-200",
            bg: "bg-slate-50",
            sub: `Trong ${timeViewText}`,
          },
          {
            label: "Slot còn trống",
            value:
              scopedCapacityMetrics.states.available +
              scopedCapacityMetrics.states.unlimited,
            icon: CheckCircle2,
            color: "text-green-600",
            border: "border-green-100",
            bg: "bg-green-50",
            sub: `Trong ${timeViewText}`,
          },
          {
            label: "Slot sắp/đã đầy",
            value:
              scopedCapacityMetrics.states.full +
              scopedCapacityMetrics.states.warning,
            icon: AlertTriangle,
            color: "text-red-600",
            border: "border-red-100",
            bg: "bg-red-50",
            sub: `Trong ${timeViewText}`,
          },
          {
            label: "Chi nhánh rủi ro",
            value: metrics.branchesNeedingAttention.length,
            icon: Store,
            color: "text-amber-600",
            border: "border-amber-100",
            bg: "bg-amber-50",
          },
        ].map((kpi, idx) => (
          <div
            key={idx}
            className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-200 dark:border-gray-700 flex flex-col justify-center hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => {
              if (kpi.label === "Vùng giao hàng")
                navigate("/admin/shipping/zones");
              if (kpi.label === "Coverage")
                navigate("/admin/shipping/service-areas");
              if (kpi.label.includes("Giờ hệ thống"))
                navigate("/admin/shipping/delivery-slots");
              if (kpi.label.includes("Giờ chi nhánh"))
                navigate("/admin/shipping/branch-delivery-slots");
              if (kpi.label.includes("Capacity"))
                navigate("/admin/shipping/branch-delivery-slot-capacities");
            }}
          >
            <div className="flex items-center gap-2 mb-3">
              <div className={`p-1.5 rounded-md ${kpi.bg} dark:bg-opacity-10`}>
                <kpi.icon
                  className={`w-4 h-4 ${kpi.color} dark:text-opacity-80`}
                />
              </div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 line-clamp-1">
                {kpi.label}
              </span>
            </div>
            <div className="text-2xl font-black text-gray-900 dark:text-white leading-none mb-1">
              {kpi.value}
            </div>
            {kpi.sub && (
              <div className="text-[10px] text-gray-400">{kpi.sub}</div>
            )}
          </div>
        ))}
      </div>

      {/* Tầng C: Workflow Board thay cho điều hướng thụ động */}
      <div>
        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
          Các bước vận hành khuyến nghị
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Nhóm 1 */}
          <Card className="p-5 bg-gradient-to-br from-slate-50 to-white dark:from-gray-800 dark:to-gray-800/80">
            <h3 className="font-bold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2">
              <span className="bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 w-6 h-6 flex items-center justify-center rounded-full text-xs">
                1
              </span>
              Thiết lập nền tảng
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-white dark:bg-gray-700 rounded-xl border border-gray-100 dark:border-gray-600 shadow-sm hover:border-blue-200 transition-colors">
                <div>
                  <div className="text-sm font-semibold text-gray-800 dark:text-white">
                    Tạo vùng giao hàng
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5">
                    {metrics.activeZones} vùng đang hoạt động
                  </div>
                </div>
                <button
                  onClick={() => navigate("/admin/shipping/zones")}
                  className="text-blue-600 text-xs font-bold px-3 py-1.5 bg-blue-50 dark:bg-blue-900/30 rounded-md"
                >
                  Thiết lập
                </button>
              </div>
              <div className="flex items-center justify-between p-3 bg-white dark:bg-gray-700 rounded-xl border border-gray-100 dark:border-gray-600 shadow-sm hover:border-blue-200 transition-colors">
                <div>
                  <div className="text-sm font-semibold text-gray-800 dark:text-white">
                    Khung giờ hệ thống
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5">
                    {metrics.activeSlots} khung giờ chuẩn
                  </div>
                </div>
                <button
                  onClick={() => navigate("/admin/shipping/delivery-slots")}
                  className="text-blue-600 text-xs font-bold px-3 py-1.5 bg-blue-50 dark:bg-blue-900/30 rounded-md"
                >
                  Mở danh sách
                </button>
              </div>
            </div>
          </Card>

          {/* Nhóm 2 */}
          <Card className="p-5 bg-gradient-to-br from-blue-50 to-white dark:from-gray-800 dark:to-gray-800/80 border-blue-100 dark:border-gray-700">
            <h3 className="font-bold text-blue-800 dark:text-blue-300 mb-4 flex items-center gap-2">
              <span className="bg-blue-200 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 w-6 h-6 flex items-center justify-center rounded-full text-xs">
                2
              </span>
              Bật vận hành chi nhánh
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-white dark:bg-gray-700 rounded-xl border border-gray-100 dark:border-gray-600 shadow-sm hover:border-blue-200 transition-colors">
                <div>
                  <div className="text-sm font-semibold text-gray-800 dark:text-white">
                    Gán Coverage
                  </div>
                  <div className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">
                    {
                      metrics.branchesNeedingAttention.filter(
                        (b) => !metrics.branchIdsWithCoverage.has(b.id),
                      ).length
                    }{" "}
                    chi nhánh thiếu
                  </div>
                </div>
                <button
                  onClick={() => navigate("/admin/shipping/service-areas")}
                  className="text-blue-600 text-xs font-bold px-3 py-1.5 bg-blue-50 dark:bg-blue-900/30 rounded-md"
                >
                  Gán ngay
                </button>
              </div>
              <div className="flex items-center justify-between p-3 bg-white dark:bg-gray-700 rounded-xl border border-gray-100 dark:border-gray-600 shadow-sm hover:border-blue-200 transition-colors">
                <div>
                  <div className="text-sm font-semibold text-gray-800 dark:text-white">
                    Gán Khung giờ
                  </div>
                  <div className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">
                    {
                      metrics.branchesNeedingAttention.filter(
                        (b) => !metrics.branchIdsWithSlots.has(b.id),
                      ).length
                    }{" "}
                    chi nhánh thiếu
                  </div>
                </div>
                <button
                  onClick={() =>
                    navigate("/admin/shipping/branch-delivery-slots")
                  }
                  className="text-blue-600 text-xs font-bold px-3 py-1.5 bg-blue-50 dark:bg-blue-900/30 rounded-md"
                >
                  Gán ngay
                </button>
              </div>
            </div>
          </Card>

          {/* Nhóm 3 */}
          <Card className="p-5 bg-gradient-to-br from-indigo-50 to-white dark:from-gray-800 dark:to-gray-800/80 border-indigo-100 dark:border-gray-700">
            <h3 className="font-bold text-indigo-800 dark:text-indigo-300 mb-4 flex items-center gap-2">
              <span className="bg-indigo-200 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 w-6 h-6 flex items-center justify-center rounded-full text-xs">
                3
              </span>
              Điều độ theo ngày
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-white dark:bg-gray-700 rounded-xl border border-gray-100 dark:border-gray-600 shadow-sm hover:border-indigo-200 transition-colors">
                <div>
                  <div className="text-sm font-semibold text-gray-800 dark:text-white">
                    Giới hạn nhận đơn
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5">
                    {timeViewText} có {scopedCapacityMetrics.activeScoped} bản
                    ghi
                  </div>
                </div>
                <button
                  onClick={() =>
                    navigate(
                      `/admin/shipping/branch-delivery-slot-capacities?deliveryDate=${targetDates[0]}`,
                    )
                  }
                  className="text-indigo-600 text-xs font-bold px-3 py-1.5 bg-indigo-50 dark:bg-indigo-900/30 rounded-md"
                >
                  Mở Capacity
                </button>
              </div>
              <div className="flex items-center justify-between p-3 bg-white dark:bg-gray-700 rounded-xl border border-gray-100 dark:border-gray-600 shadow-sm hover:border-indigo-200 transition-colors">
                <div>
                  <div className="text-sm font-semibold text-gray-800 dark:text-white">
                    Xử lý quá tải
                  </div>
                  <div className="text-xs text-red-500 mt-0.5">
                    {scopedCapacityMetrics.states.full +
                      scopedCapacityMetrics.states.warning}{" "}
                    slot căng tải
                  </div>
                </div>
                <button
                  onClick={() => {
                    const el = document.getElementById("overloaded-section");
                    el?.scrollIntoView({ behavior: "smooth" });
                  }}
                  className="text-indigo-600 text-xs font-bold px-3 py-1.5 bg-indigo-50 dark:bg-indigo-900/30 rounded-md"
                >
                  Xem báo cáo
                </button>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Tầng D: Capacity Overview & Actionable Incident Board */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Operations Summary */}
        <Card className="lg:col-span-2 p-6 flex flex-col">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <CalendarCheck className="w-6 h-6 text-blue-500" />
                Tải trọng vận hành {timeViewText}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Tổng hợp sức chứa và lượng đơn (
                {targetDates.length === 1
                  ? targetDates[0]
                  : `${targetDates[0]} tới ${targetDates[6]}`}
                )
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() =>
                  navigate(
                    "/admin/shipping/branch-delivery-slot-capacities/create",
                  )
                }
                className="px-3 py-1.5 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 text-sm font-semibold rounded-lg flex items-center gap-1 hover:bg-blue-100 transition-colors"
              >
                <PlusCircle className="w-4 h-4" /> Tạo Capacity
              </button>
            </div>
          </div>

          {scopedCapacityMetrics.totalScoped === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-dashed border-gray-300 dark:border-gray-600">
              <CalendarClock className="w-12 h-12 text-gray-400 mb-3" />
              <p className="text-gray-600 dark:text-gray-300 font-medium mb-1">
                Chưa có giới hạn nhận đơn nào cho phạm vi này
              </p>
              <p className="text-sm text-gray-500 mb-4">
                Bạn cần tạo capacity để hệ thống bắt đầu kiểm soát lượng đơn
                giao.
              </p>
              <button
                onClick={() =>
                  navigate(
                    "/admin/shipping/branch-delivery-slot-capacities/create",
                  )
                }
                className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
              >
                Tạo capacity ngay
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <div className="p-4 bg-red-50 dark:bg-red-900/10 rounded-xl border border-red-100 dark:border-red-900/30">
                  <p className="text-sm text-red-600 dark:text-red-400 font-bold mb-1">
                    Slot đã đầy
                  </p>
                  <p className="text-3xl font-black text-red-700 dark:text-red-300">
                    {scopedCapacityMetrics.states.full}
                  </p>
                </div>
                <div className="p-4 bg-orange-50 dark:bg-orange-900/10 rounded-xl border border-orange-100 dark:border-orange-900/30">
                  <p className="text-sm text-orange-600 dark:text-orange-400 font-bold mb-1">
                    Slot sắp đầy
                  </p>
                  <p className="text-3xl font-black text-orange-700 dark:text-orange-300">
                    {scopedCapacityMetrics.states.warning}
                  </p>
                </div>
                <div className="p-4 bg-green-50 dark:bg-green-900/10 rounded-xl border border-green-100 dark:border-green-900/30">
                  <p className="text-sm text-green-600 dark:text-green-400 font-bold mb-1">
                    Slot còn nhận
                  </p>
                  <p className="text-3xl font-black text-green-700 dark:text-green-300">
                    {scopedCapacityMetrics.states.available}
                  </p>
                </div>
                <div className="p-4 bg-slate-50 dark:bg-gray-800 rounded-xl border border-slate-200 dark:border-gray-700">
                  <p className="text-sm text-slate-600 dark:text-slate-400 font-bold mb-1">
                    Không giới hạn
                  </p>
                  <p className="text-3xl font-black text-slate-800 dark:text-slate-200">
                    {scopedCapacityMetrics.states.unlimited}
                  </p>
                </div>
              </div>

              <div className="mt-auto bg-gray-50 dark:bg-gray-800/50 p-5 rounded-xl border border-gray-100 dark:border-gray-700">
                <div className="flex justify-between text-sm mb-3">
                  <span className="font-bold text-gray-800 dark:text-gray-200">
                    Sức chứa hữu hạn (Finite Capacity)
                  </span>
                  <span className="font-black text-gray-900 dark:text-white">
                    {scopedCapacityMetrics.fillPercentage}% lấp đầy
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden flex mb-2">
                  <div
                    className={`h-full transition-all duration-500 ${scopedCapacityMetrics.fillPercentage >= 90 ? "bg-red-500" : scopedCapacityMetrics.fillPercentage >= 75 ? "bg-orange-500" : "bg-blue-500"}`}
                    style={{
                      width: `${scopedCapacityMetrics.fillPercentage}%`,
                    }}
                  ></div>
                </div>
                <div className="flex justify-between text-xs text-gray-500">
                  <span>
                    Đã đặt:{" "}
                    <strong>
                      {formatCount(scopedCapacityMetrics.reservedFinite)}
                    </strong>
                  </span>
                  <span>
                    Tối đa:{" "}
                    <strong>
                      {formatCount(scopedCapacityMetrics.maxFinite)}
                    </strong>
                  </span>
                </div>
                {scopedCapacityMetrics.reservedUnlimited > 0 && (
                  <p className="text-xs text-slate-500 mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                    * Đã nhận thêm{" "}
                    <strong>
                      {formatCount(scopedCapacityMetrics.reservedUnlimited)}
                    </strong>{" "}
                    đơn từ các slot không giới hạn.
                  </p>
                )}
              </div>
            </>
          )}
        </Card>

        {/* Actionable Incident Board */}
        <Card className="p-6 bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 flex flex-col">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-gray-700 dark:text-gray-300" />
            Sự cố cần xử lý
          </h2>
          <div className="space-y-4 flex-1">
            {scopedCapacityMetrics.states.full > 0 && (
              <div className="flex flex-col p-4 bg-white dark:bg-gray-800 rounded-xl border border-red-200 dark:border-red-900/50 shadow-sm">
                <div className="flex items-start gap-3 mb-3">
                  <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
                  <div>
                    <h4 className="text-sm font-bold text-gray-900 dark:text-white">
                      Slot đã đầy ({timeViewText})
                    </h4>
                    <p className="text-xs text-gray-500 mt-1">
                      Có {scopedCapacityMetrics.states.full} khung giờ đã đạt
                      giới hạn tối đa.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    const el = document.getElementById("overloaded-section");
                    el?.scrollIntoView({ behavior: "smooth" });
                  }}
                  className="w-full py-2 bg-red-50 text-red-700 text-xs font-bold rounded-lg hover:bg-red-100 transition-colors"
                >
                  Xử lý capacity
                </button>
              </div>
            )}

            {metrics.branchesNeedingAttention.length > 0 && (
              <div className="flex flex-col p-4 bg-white dark:bg-gray-800 rounded-xl border border-amber-200 dark:border-amber-900/50 shadow-sm">
                <div className="flex items-start gap-3 mb-3">
                  <Store className="w-5 h-5 text-amber-600 shrink-0" />
                  <div>
                    <h4 className="text-sm font-bold text-gray-900 dark:text-white">
                      Chi nhánh thiếu cấu hình
                    </h4>
                    <p className="text-xs text-gray-500 mt-1">
                      {metrics.branchesNeedingAttention.length} chi nhánh đang
                      không thể nhận đơn.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    const el = document.getElementById("branches-attention");
                    el?.scrollIntoView({ behavior: "smooth" });
                  }}
                  className="w-full py-2 bg-amber-50 text-amber-700 text-xs font-bold rounded-lg hover:bg-amber-100 transition-colors"
                >
                  Xử lý chi nhánh
                </button>
              </div>
            )}

            {metrics.fallbackZones > 0 && (
              <div className="flex flex-col p-4 bg-white dark:bg-gray-800 rounded-xl border border-orange-200 dark:border-orange-900/50 shadow-sm">
                <div className="flex items-start gap-3 mb-3">
                  <MapPinned className="w-5 h-5 text-orange-600 shrink-0" />
                  <div>
                    <h4 className="text-sm font-bold text-gray-900 dark:text-white">
                      Fallback Zone đang bật
                    </h4>
                    <p className="text-xs text-gray-500 mt-1">
                      {metrics.fallbackZones} rule cấp thấp đang hoạt động, dễ
                      sai phí.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => navigate("/admin/shipping/zones")}
                  className="w-full py-2 bg-orange-50 text-orange-700 text-xs font-bold rounded-lg hover:bg-orange-100 transition-colors"
                >
                  Xem vùng giao hàng
                </button>
              </div>
            )}

            {scopedCapacityMetrics.states.full === 0 &&
              metrics.branchesNeedingAttention.length === 0 &&
              metrics.fallbackZones === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-center py-8">
                  <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-3">
                    <CheckCircle2 className="w-6 h-6 text-green-600 dark:text-green-400" />
                  </div>
                  <p className="text-sm font-bold text-gray-900 dark:text-white">
                    Mọi thứ đều ổn định
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Không có cảnh báo nghiêm trọng trong phạm vi thời gian đang
                    xem.
                  </p>
                </div>
              )}
          </div>
        </Card>
      </div>

      {/* Tầng E: Bảng dữ liệu - Module Health & Overloaded Slots */}
      <div
        className="grid grid-cols-1 xl:grid-cols-2 gap-6"
        id="overloaded-section"
      >
        {/* Module Health Table */}
        <Card className="flex flex-col overflow-hidden">
          <div className="p-5 border-b border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/30">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Settings className="w-5 h-5 text-slate-500" />
              Sức khỏe hệ thống
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-gray-700">
                <tr>
                  <th className="px-5 py-3.5 font-semibold">Phân hệ</th>
                  <th className="px-5 py-3.5 font-semibold">Trạng thái</th>
                  <th className="px-5 py-3.5 font-semibold">Cảnh báo</th>
                  <th className="px-5 py-3.5 font-semibold text-right">
                    Hành động
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700 bg-white dark:bg-gray-800">
                {moduleHealthData.map((mod, i) => (
                  <tr
                    key={i}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                  >
                    <td className="px-5 py-4 font-bold text-gray-900 dark:text-white">
                      {mod.name}
                      <div className="text-xs font-normal text-gray-500 mt-0.5">
                        {formatCount(mod.active)} / {formatCount(mod.total)}{" "}
                        hoạt động
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      {mod.warningCount > 0 ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-orange-50 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 text-xs font-bold border border-orange-200 dark:border-orange-800/50">
                          Cần chú ý
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400 text-xs font-bold border border-green-200 dark:border-green-800/50">
                          Ổn định
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-gray-600 dark:text-gray-300 text-xs">
                      {mod.warningCount > 0 ? (
                        <span className="font-semibold text-gray-800 dark:text-gray-200">
                          {mod.warningCount} {mod.warningText}
                        </span>
                      ) : (
                        <span className="text-gray-400">Không có</span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <button
                        onClick={() => navigate(mod.path)}
                        className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-xs font-bold bg-blue-50 dark:bg-blue-900/30 px-3 py-1.5 rounded-md"
                      >
                        {mod.cta}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Top Overloaded Slots Table */}
        <Card className="flex flex-col overflow-hidden">
          <div className="p-5 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-orange-50/30 dark:bg-orange-900/10">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-orange-600" />
              Bảng xử lý căng tải ({timeViewText})
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-gray-700">
                <tr>
                  <th className="px-5 py-3.5 font-semibold">Chi nhánh</th>
                  <th className="px-5 py-3.5 font-semibold">Khung giờ</th>
                  <th className="px-5 py-3.5 font-semibold">Tải hiện tại</th>
                  <th className="px-5 py-3.5 font-semibold text-right">
                    Hành động
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700 bg-white dark:bg-gray-800">
                {topOverloadedSlots.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-5 py-12 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <CheckCircle2 className="w-8 h-8 text-green-400 mb-2" />
                        <span className="text-gray-600 dark:text-gray-400 font-medium">
                          Không có khung giờ nào đạt cảnh báo quá tải.
                        </span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  topOverloadedSlots.map((cap) => {
                    const branch = branchMap[cap.branchId];
                    const slot = slotMap[cap.deliveryTimeSlotId];
                    const percent = Math.round(cap.ratio * 100);
                    const isFull = percent >= 100;
                    return (
                      <tr
                        key={cap.id}
                        className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                      >
                        <td className="px-5 py-4 font-bold text-gray-900 dark:text-white">
                          {branch?.name || `ID: ${cap.branchId}`}
                          <div className="text-xs font-normal text-gray-500 mt-0.5">
                            {cap.deliveryDate.substring(0, 10)}
                          </div>
                        </td>
                        <td className="px-5 py-4 text-gray-600 dark:text-gray-300 font-medium">
                          {slot?.label || `ID: ${cap.deliveryTimeSlotId}`}
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex-1 w-24 bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 overflow-hidden">
                              <div
                                className={`h-full ${isFull ? "bg-red-500" : "bg-orange-500"}`}
                                style={{ width: `${Math.min(percent, 100)}%` }}
                              ></div>
                            </div>
                            <span
                              className={`text-xs font-bold ${isFull ? "text-red-600 dark:text-red-400" : "text-orange-600 dark:text-orange-400"}`}
                            >
                              {percent}%
                            </span>
                          </div>
                          <div className="text-[10px] text-gray-500 mt-1">
                            ({cap.reservedOrders}/{cap.maxOrders} đơn)
                          </div>
                        </td>
                        <td className="px-5 py-4 text-right">
                          <button
                            onClick={() =>
                              navigate(
                                `/admin/shipping/branch-delivery-slot-capacities?deliveryDate=${cap.deliveryDate.substring(0, 10)}`,
                              )
                            }
                            className={`text-xs font-bold px-3 py-1.5 rounded-md ${isFull ? "bg-red-50 text-red-700 hover:bg-red-100" : "bg-orange-50 text-orange-700 hover:bg-orange-100"}`}
                          >
                            Tăng giới hạn
                          </button>
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

      {/* Tầng F: Branch Action Board */}
      <div id="branches-attention">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">
            Bảng trạng thái chi nhánh
          </h2>
          <div className="text-sm text-gray-500 font-medium bg-white dark:bg-gray-800 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700">
            Tổng:{" "}
            <strong className="text-gray-900 dark:text-white">
              {metrics.activeBranchesCount}
            </strong>{" "}
            chi nhánh hoạt động
          </div>
        </div>

        {metrics.branchesNeedingAttention.length > 0 ? (
          <Card className="flex flex-col overflow-hidden border-amber-200 dark:border-amber-900/50">
            <div className="p-5 bg-amber-50 dark:bg-amber-900/20 border-b border-amber-100 dark:border-amber-900/50">
              <h3 className="font-bold text-amber-900 dark:text-amber-400 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                {metrics.branchesNeedingAttention.length} chi nhánh chưa sẵn
                sàng vận hành
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-gray-700">
                  <tr>
                    <th className="px-5 py-3.5 font-semibold">Tên chi nhánh</th>
                    <th className="px-5 py-3.5 font-semibold">Coverage</th>
                    <th className="px-5 py-3.5 font-semibold">Branch Slots</th>
                    <th className="px-5 py-3.5 font-semibold">Mức sẵn sàng</th>
                    <th className="px-5 py-3.5 font-semibold text-right">
                      Hành động nhanh
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700 bg-white dark:bg-gray-800">
                  {metrics.branchesNeedingAttention.map((b) => {
                    const hasCov = metrics.branchIdsWithCoverage.has(b.id);
                    const hasSlot = metrics.branchIdsWithSlots.has(b.id);
                    return (
                      <tr
                        key={b.id}
                        className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                      >
                        <td className="px-5 py-4">
                          <div className="font-bold text-gray-900 dark:text-white">
                            {b.name}
                          </div>
                          <div className="text-xs text-gray-500 mt-0.5">
                            {b.code}
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          {hasCov ? (
                            <span className="text-green-600 font-medium flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" /> Đã có
                            </span>
                          ) : (
                            <span className="text-red-600 font-medium">
                              Thiếu
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-4">
                          {hasSlot ? (
                            <span className="text-green-600 font-medium flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" /> Đã có
                            </span>
                          ) : (
                            <span className="text-red-600 font-medium">
                              Thiếu
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-4">
                          <span className="inline-flex px-2 py-1 bg-red-50 text-red-700 text-xs font-bold rounded border border-red-100">
                            {!hasCov && !hasSlot
                              ? "Thiếu cả hai"
                              : !hasCov
                                ? "Thiếu Coverage"
                                : "Thiếu Slots"}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex justify-end gap-2">
                            {!hasCov && (
                              <button
                                onClick={() =>
                                  navigate(buildCoverageCreateLink(b.id))
                                }
                                className="text-xs font-bold px-3 py-1.5 bg-blue-50 text-blue-700 rounded hover:bg-blue-100"
                              >
                                Tạo Coverage
                              </button>
                            )}
                            {!hasSlot && (
                              <button
                                onClick={() =>
                                  navigate(buildBranchSlotCreateLink(b.id))
                                }
                                className="text-xs font-bold px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded hover:bg-indigo-100"
                              >
                                Gán Slots
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        ) : (
          <div className="p-8 bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-900/50 rounded-xl flex items-center gap-4">
            <div className="p-3 bg-green-100 dark:bg-green-900/50 rounded-full">
              <CheckCircle2 className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-green-800 dark:text-green-300">
                Tất cả chi nhánh đã sẵn sàng
              </h3>
              <p className="text-sm text-green-700 dark:text-green-400 mt-1">
                Không phát hiện chi nhánh nào thiếu cấu hình Coverage hoặc Khung
                giờ giao hàng.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Tầng G: Module Directory */}
      <div>
        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
          Danh mục tính năng
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-5 gap-4">
          {[
            {
              title: "Vùng giao hàng",
              desc: "Thiết lập phí và điều kiện theo khu vực",
              icon: MapPinned,
              link: "/admin/shipping/zones",
              stat1: `${metrics.activeZones} vùng hoạt động`,
              stat2: `${metrics.fallbackZones} vùng mặc định`,
              cta: "Mở vùng giao hàng",
            },
            {
              title: "Coverage",
              desc: "Phân bổ vùng giao cho chi nhánh",
              icon: Truck,
              link: "/admin/shipping/service-areas",
              stat1: `${metrics.activeCoverage} bản ghi mapping`,
              stat2: `${metrics.sameDayCoverage} hỗ trợ same-day`,
              cta: "Mở coverage",
            },
            {
              title: "Khung giờ hệ thống",
              desc: "Danh mục khung giờ giao tiêu chuẩn",
              icon: Clock3,
              link: "/admin/shipping/delivery-slots",
              stat1: `${metrics.activeSlots} khung đang bật`,
              stat2: `${metrics.inactiveSystemSlots} khung bị tắt`,
              cta: "Mở khung giờ",
            },
            {
              title: "Khung giờ chi nhánh",
              desc: "Kích hoạt khung giờ cho từng cửa hàng",
              icon: Link2,
              link: "/admin/shipping/branch-delivery-slots",
              stat1: `${metrics.activeBranchSlots} bản ghi active`,
              stat2: `${metrics.customBranchSlot} đang override`,
              cta: "Mở cấu hình chi nhánh",
            },
            {
              title: "Giới hạn nhận đơn",
              desc: "Kiểm soát số lượng đơn theo ngày",
              icon: CalendarDays,
              link: "/admin/shipping/branch-delivery-slot-capacities",
              stat1: `${metrics.totalCapacities} tổng bản ghi`,
              stat2: `${scopedCapacityMetrics.activeScoped} bản ghi ${timeViewText}`,
              cta: "Mở quản lý capacity",
            },
          ].map((tool, idx) => (
            <button
              key={idx}
              onClick={() => navigate(tool.link)}
              className="text-left bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-5 hover:border-blue-400 hover:shadow-lg transition-all group flex flex-col h-full"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-xl text-gray-700 dark:text-gray-300 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                  <tool.icon className="w-6 h-6" />
                </div>
                <ArrowRight className="w-5 h-5 text-gray-300 dark:text-gray-600 group-hover:text-blue-500 transform group-hover:translate-x-1 transition-all" />
              </div>
              <h3 className="font-bold text-gray-900 dark:text-white text-base mb-1">
                {tool.title}
              </h3>
              <p className="text-xs text-gray-500 mb-4 line-clamp-1">
                {tool.desc}
              </p>

              <div className="mt-auto flex flex-col gap-1.5 mb-4">
                <span className="text-[11px] font-medium text-gray-600 dark:text-gray-400 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                  {tool.stat1}
                </span>
                <span className="text-[11px] font-medium text-gray-600 dark:text-gray-400 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-500"></span>
                  {tool.stat2}
                </span>
              </div>

              <div className="text-xs font-bold text-blue-600 dark:text-blue-400 mt-2">
                {tool.cta}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ShippingDashboardPage;
