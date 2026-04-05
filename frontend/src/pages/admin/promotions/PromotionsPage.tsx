import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Percent,
  Truck,
  Plus,
  Search,
  LayoutGrid,
  List,
  Loader2,
  Trash2,
  PauseCircle,
  PlayCircle,
  AlertTriangle,
  TicketPercent,
  ShieldCheck,
  Clock3,
  Sparkles,
  Tags,
  AlertOctagon,
  Timer,
  Ban,
  FilterX,
  Target,
  Zap,
} from "lucide-react";
import Card from "../../../components/admin/layouts/Card";
import { http } from "../../../services/http";
import { useAdminToast } from "../../../context/AdminToastContext";

// ==========================================
// TYPES & INTERFACES
// ==========================================
type PromotionScope = "order" | "shipping";
type DiscountType = "fixed" | "percent" | "free_shipping";
type PromotionStatus = "active" | "inactive";

interface PromotionCode {
  id: number;
  code: string;
  status: PromotionStatus;
  deleted?: boolean;
  usageLimit?: number | null;
  usageCount?: number;
  startAt?: string | null;
  endAt?: string | null;
}

interface PromotionTargets {
  productIds: number[];
  categoryIds: number[];
  variantIds: number[];
  originIds: number[];
  branchIds: number[];
}

interface Promotion {
  id: number;
  name: string;
  description?: string | null;
  promotionScope: PromotionScope;
  discountType: DiscountType;
  discountValue: number;
  maxDiscountAmount?: number | null;
  minOrderValue?: number | null;
  isAutoApply: boolean;
  canCombine: boolean;
  priority: number;
  usageLimit?: number | null;
  usageCount?: number; // Fallback API
  usageLimitPerUser?: number | null;
  startAt?: string | null;
  endAt?: string | null;
  status: PromotionStatus;
  deleted?: boolean;
  deletedAt?: string | null;
  codes?: PromotionCode[];
  targets?: PromotionTargets;
  createdAt?: string;
  updatedAt?: string;
}

type PromotionHealth = "active" | "scheduled" | "expired" | "inactive";
type ApplicationMode = "auto" | "code";
type AlertLevel = "none" | "info" | "warning" | "danger";

interface NormalizedPromotion extends Promotion {
  // Mechanism
  applicationMode: ApplicationMode;
  hasCodes: boolean;
  hasActiveCodes: boolean;
  totalCodes: number;
  activeCodes: number;
  couponTypeLabel: string;

  // Usage metrics
  hasUsageData: boolean;
  usageUsed: number;
  usageRemaining: number | null;
  usagePercent: number;
  isUsageLimited: boolean;
  isUsageExhausted: boolean;
  isUsageNearLimit: boolean;

  // Time intelligence
  startsInDays: number | null;
  endsInDays: number | null;
  isStartingSoon: boolean;
  isEndingSoon: boolean;
  isExpired: boolean;
  isRunningNow: boolean;
  isFutureCampaign: boolean;

  // Status & Alerts
  health: PromotionHealth;
  alertLevel: AlertLevel;

  // Summary
  targetCount: number;
  hasTargetRestriction: boolean;
  restrictionSummary: string;
  headlineValue: string;
}

type ApiList<T> = {
  success: true;
  data: T[];
  meta?: { total?: number; page?: number; limit?: number };
  message?: string;
};

type ApiOk = {
  success: true;
  data?: any;
  message?: string;
  meta?: any;
};

// ==========================================
// HELPERS & FORMATTERS
// ==========================================
const formatMoney = (value?: number | null) => {
  const amount = Number(value ?? 0);
  return `${amount.toLocaleString("vi-VN")} đ`;
};

const formatDateTime = (value?: string | null) => {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatDateRange = (start?: string | null, end?: string | null) => {
  if (!start && !end) return "Không giới hạn";
  const startLabel = start ? formatDateTime(start) : "Ngay";
  const endLabel = end ? formatDateTime(end) : "Không giới hạn";
  return `${startLabel} → ${endLabel}`;
};

const getHealthBadge = (health: PromotionHealth) => {
  const map = {
    active: {
      label: "Đang chạy",
      color: "bg-emerald-100 text-emerald-800 border-emerald-200",
    },
    scheduled: {
      label: "Sắp diễn ra",
      color: "bg-blue-100 text-blue-800 border-blue-200",
    },
    expired: {
      label: "Đã kết thúc",
      color: "bg-gray-100 text-gray-800 border-gray-200",
    },
    inactive: {
      label: "Tạm dừng",
      color: "bg-amber-100 text-amber-800 border-amber-200",
    },
  };
  return map[health] || map.inactive;
};

const getScopeConfig = (scope: PromotionScope) => {
  if (scope === "shipping") {
    return {
      label: "Shipping",
      icon: Truck,
      chip: "bg-cyan-50 text-cyan-700 border-cyan-200",
      color: "cyan",
    };
  }
  return {
    label: "Order",
    icon: TicketPercent,
    chip: "bg-violet-50 text-violet-700 border-violet-200",
    color: "violet",
  };
};

const getDiscountHeadline = (promotion: Promotion) => {
  if (promotion.discountType === "free_shipping") return "Freeship";
  if (promotion.discountType === "percent")
    return `${Number(promotion.discountValue ?? 0)}%`;
  return formatMoney(Number(promotion.discountValue ?? 0));
};

const getTargetCount = (targets?: PromotionTargets) => {
  if (!targets) return 0;
  return (
    (targets.productIds?.length ?? 0) +
    (targets.categoryIds?.length ?? 0) +
    (targets.variantIds?.length ?? 0) +
    (targets.originIds?.length ?? 0) +
    (targets.branchIds?.length ?? 0)
  );
};

const getRestrictionSummary = (targets?: PromotionTargets) => {
  if (!targets) return "Toàn catalog";
  const parts = [];
  if (targets.productIds?.length)
    parts.push(`${targets.productIds.length} sản phẩm`);
  if (targets.categoryIds?.length)
    parts.push(`${targets.categoryIds.length} danh mục`);
  if (targets.variantIds?.length)
    parts.push(`${targets.variantIds.length} biến thể`);
  if (targets.originIds?.length)
    parts.push(`${targets.originIds.length} nguồn gốc`);
  if (targets.branchIds?.length)
    parts.push(`${targets.branchIds.length} chi nhánh`);

  if (parts.length === 0) return "Toàn catalog";
  return `Giới hạn theo: ${parts.join(", ")}`;
};

// ==========================================
// NORMALIZE LOGIC
// ==========================================
const normalizePromotion = (item: Promotion): NormalizedPromotion => {
  const now = new Date();
  const startAt = item.startAt ? new Date(item.startAt) : null;
  const endAt = item.endAt ? new Date(item.endAt) : null;

  // Time Intelligence
  const startsInDays = startAt
    ? Math.ceil((startAt.getTime() - now.getTime()) / (1000 * 3600 * 24))
    : null;
  const endsInDays = endAt
    ? Math.ceil((endAt.getTime() - now.getTime()) / (1000 * 3600 * 24))
    : null;

  const isExpired = endAt ? now > endAt : false;
  const isFutureCampaign = startAt ? now < startAt : false;
  const isRunningNow = !isExpired && !isFutureCampaign;

  const isStartingSoon =
    startsInDays !== null && startsInDays > 0 && startsInDays <= 3;
  const isEndingSoon = endsInDays !== null && endsInDays > 0 && endsInDays <= 3;

  // Health
  let health: PromotionHealth = "inactive";
  if (item.deleted || item.status === "inactive") {
    health = "inactive";
  } else if (isExpired) {
    health = "expired";
  } else if (isFutureCampaign) {
    health = "scheduled";
  } else {
    health = "active";
  }

  // Mechanism
  const applicationMode: ApplicationMode = item.isAutoApply ? "auto" : "code";
  const totalCodes = Array.isArray(item.codes) ? item.codes.length : 0;
  const activeCodes = Array.isArray(item.codes)
    ? item.codes.filter((c) => c.status === "active" && !c.deleted).length
    : 0;

  // Usage Metrics
  const hasUsageData =
    item.usageCount !== undefined && item.usageCount !== null;

  const usageUsed = hasUsageData ? Number(item.usageCount) : 0;
  const usageLimit = item.usageLimit ?? null;
  const isUsageLimited = usageLimit !== null;

  const usageRemaining =
    isUsageLimited && hasUsageData
      ? Math.max(0, usageLimit - usageUsed)
      : isUsageLimited
        ? null
        : null;

  const usagePercent =
    isUsageLimited && hasUsageData && usageLimit > 0
      ? Math.min((usageUsed / usageLimit) * 100, 100)
      : 0;

  const isUsageExhausted =
    isUsageLimited && hasUsageData && usageRemaining === 0;

  const isUsageNearLimit =
    isUsageLimited && hasUsageData && usagePercent >= 90 && usagePercent < 100;

  // Alert Level
  let alertLevel: AlertLevel = "none";
  if ((isExpired && item.status === "active") || isUsageExhausted) {
    alertLevel = "danger";
  } else if (isEndingSoon || isStartingSoon || isUsageNearLimit) {
    alertLevel = "warning";
  } else if (item.status === "inactive" && !isExpired) {
    alertLevel = "info";
  }

  const targetCount = getTargetCount(item.targets);

  return {
    ...item,
    applicationMode,
    hasCodes: totalCodes > 0,
    hasActiveCodes: activeCodes > 0,
    totalCodes,
    activeCodes,
    couponTypeLabel: item.isAutoApply ? "Auto Apply" : "Code-based",
    hasUsageData,
    usageUsed,
    usageRemaining,
    usagePercent,
    isUsageLimited,
    isUsageExhausted,
    isUsageNearLimit,
    startsInDays,
    endsInDays,
    isStartingSoon,
    isEndingSoon,
    isExpired,
    isRunningNow,
    isFutureCampaign,
    health,
    alertLevel,
    targetCount,
    hasTargetRestriction: targetCount > 0,
    restrictionSummary: getRestrictionSummary(item.targets),
    headlineValue: getDiscountHeadline(item),
  };
};

// ==========================================
// MAIN COMPONENT
// ==========================================
const PromotionsPage: React.FC = () => {
  const navigate = useNavigate();
  const { showSuccessToast, showErrorToast } = useAdminToast();

  // --- States ---
  const [rawPromotions, setRawPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  const [search, setSearch] = useState("");
  const [scopeTab, setScopeTab] = useState<"all" | PromotionScope>("all");

  // Operational Filters
  const [healthFilter, setHealthFilter] = useState<"all" | PromotionHealth>(
    "all",
  );
  const [mechanismFilter, setMechanismFilter] = useState<
    "all" | ApplicationMode
  >("all");
  const [urgencyFilter, setUrgencyFilter] = useState<
    "all" | "starting-soon" | "ending-soon" | "exhausted" | "near-limit"
  >("all");
  const [quickFilters, setQuickFilters] = useState<string[]>([]); // active chips

  const [sortBy, setSortBy] = useState<
    | "priority-desc"
    | "name-asc"
    | "value-desc"
    | "latest"
    | "ending-soon"
    | "usage-desc"
    | "alert-desc"
  >("priority-desc");
  const [viewMode, setViewMode] = useState<"cards" | "table">("cards");

  // --- Fetch ---
  const fetchPromotions = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await http<ApiList<Promotion>>(
        "GET",
        "/api/v1/admin/promotions?limit=100&page=1&includeDeleted=false",
      );
      if (res.success && Array.isArray(res.data)) {
        setRawPromotions(res.data);
      } else {
        setError("Không thể tải danh sách khuyến mãi.");
      }
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Lỗi kết nối server hoặc API không phản hồi.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPromotions();
  }, []);

  // --- Derived Data ---
  const promotions = useMemo(
    () => rawPromotions.map(normalizePromotion),
    [rawPromotions],
  );

  const kpiStats = useMemo(() => {
    return {
      total: promotions.length,
      active: promotions.filter((p) => p.health === "active").length,
      autoApply: promotions.filter((p) => p.applicationMode === "auto").length,
      codeBased: promotions.filter((p) => p.applicationMode === "code").length,
      orderPromo: promotions.filter((p) => p.promotionScope === "order").length,
      shippingPromo: promotions.filter((p) => p.promotionScope === "shipping")
        .length,
      endingSoon: promotions.filter((p) => p.isEndingSoon).length,
      needsAttention: promotions.filter(
        (p) => p.alertLevel === "danger" || p.alertLevel === "warning",
      ).length,
    };
  }, [promotions]);

  const filteredAndSortedPromotions = useMemo(() => {
    let result = [...promotions];

    // 1. Tab Scope
    if (scopeTab !== "all") {
      result = result.filter((p) => p.promotionScope === scopeTab);
    }

    // 2. Search
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter((p) => {
        const codeText = Array.isArray(p.codes)
          ? p.codes
              .map((c) => c.code)
              .join(" ")
              .toLowerCase()
          : "";
        return (
          p.name.toLowerCase().includes(q) ||
          (p.description || "").toLowerCase().includes(q) ||
          codeText.includes(q)
        );
      });
    }

    // 3. Dropdown Filters
    if (healthFilter !== "all")
      result = result.filter((p) => p.health === healthFilter);
    if (mechanismFilter !== "all")
      result = result.filter((p) => p.applicationMode === mechanismFilter);
    if (urgencyFilter !== "all") {
      if (urgencyFilter === "starting-soon")
        result = result.filter((p) => p.isStartingSoon);
      if (urgencyFilter === "ending-soon")
        result = result.filter((p) => p.isEndingSoon);
      if (urgencyFilter === "exhausted")
        result = result.filter((p) => p.isUsageExhausted);
      if (urgencyFilter === "near-limit")
        result = result.filter((p) => p.isUsageNearLimit);
    }

    // 4. Quick Chips
    if (quickFilters.includes("Sắp bắt đầu"))
      result = result.filter((p) => p.isStartingSoon);
    if (quickFilters.includes("Sắp hết hạn"))
      result = result.filter((p) => p.isEndingSoon);
    if (quickFilters.includes("Hết lượt"))
      result = result.filter((p) => p.isUsageExhausted);
    if (quickFilters.includes("Code-based"))
      result = result.filter((p) => p.applicationMode === "code");
    if (quickFilters.includes("Auto-apply"))
      result = result.filter((p) => p.applicationMode === "auto");
    if (quickFilters.includes("Có target restriction"))
      result = result.filter((p) => p.hasTargetRestriction);
    if (quickFilters.includes("Toàn phạm vi"))
      result = result.filter((p) => !p.hasTargetRestriction);

    // 5. Sort
    result.sort((a, b) => {
      switch (sortBy) {
        case "name-asc":
          return a.name.localeCompare(b.name);
        case "value-desc":
          return Number(b.discountValue ?? 0) - Number(a.discountValue ?? 0);
        case "latest":
          return (
            (b.createdAt ? new Date(b.createdAt).getTime() : 0) -
            (a.createdAt ? new Date(a.createdAt).getTime() : 0)
          );
        case "ending-soon":
          return (
            (a.endAt ? new Date(a.endAt).getTime() : Number.MAX_SAFE_INTEGER) -
            (b.endAt ? new Date(b.endAt).getTime() : Number.MAX_SAFE_INTEGER)
          );
        case "usage-desc":
          return b.usagePercent - a.usagePercent;
        case "alert-desc": {
          const weight = { danger: 3, warning: 2, info: 1, none: 0 };
          return weight[b.alertLevel] - weight[a.alertLevel];
        }
        case "priority-desc":
        default:
          return Number(b.priority ?? 0) - Number(a.priority ?? 0);
      }
    });

    return result;
  }, [
    promotions,
    search,
    scopeTab,
    healthFilter,
    mechanismFilter,
    urgencyFilter,
    quickFilters,
    sortBy,
  ]);

  const attentionPromotions = useMemo(() => {
    let base = [...promotions];

    if (scopeTab !== "all") {
      base = base.filter((p) => p.promotionScope === scopeTab);
    }

    return base
      .filter((p) => p.alertLevel === "danger" || p.alertLevel === "warning")
      .sort((a, b) => {
        const weight = { danger: 3, warning: 2, info: 1, none: 0 };
        return weight[b.alertLevel] - weight[a.alertLevel];
      })
      .slice(0, 4);
  }, [promotions, scopeTab]);

  // --- Actions ---
  const handleToggleStatus = async (promotion: NormalizedPromotion) => {
    const nextStatus: PromotionStatus =
      promotion.status === "active" ? "inactive" : "active";
    try {
      const res = await http<ApiOk>(
        "PATCH",
        `/api/v1/admin/promotions/${promotion.id}/status`,
        { status: nextStatus },
      );
      if (res.success) {
        showSuccessToast({
          message:
            nextStatus === "active"
              ? "Đã kích hoạt campaign."
              : "Đã tạm dừng campaign.",
        });
        await fetchPromotions();
      }
    } catch (err: any) {
      showErrorToast(err?.message || "Không thể cập nhật trạng thái.");
    }
  };

  const handleDeletePromotion = async (promotion: NormalizedPromotion) => {
    const ok = window.confirm(
      `Bạn có chắc muốn xóa mềm campaign "${promotion.name}"?`,
    );
    if (!ok) return;
    try {
      const res = await http<ApiOk>(
        "DELETE",
        `/api/v1/admin/promotions/${promotion.id}`,
      );
      if (res.success) {
        showSuccessToast({ message: "Đã xóa mềm campaign." });
        setRawPromotions((prev) => prev.filter((x) => x.id !== promotion.id));
      }
    } catch (err: any) {
      showErrorToast(err?.message || "Không thể xóa campaign.");
    }
  };

  const toggleQuickFilter = (label: string) => {
    setQuickFilters((prev) => {
      const isActive = prev.includes(label);

      if (isActive) {
        return prev.filter((f) => f !== label);
      }

      if (label === "Toàn phạm vi") {
        return [...prev.filter((f) => f !== "Có target restriction"), label];
      }

      if (label === "Có target restriction") {
        return [...prev.filter((f) => f !== "Toàn phạm vi"), label];
      }

      return [...prev, label];
    });
  };

  const clearAllFilters = () => {
    setSearch("");
    setHealthFilter("all");
    setMechanismFilter("all");
    setUrgencyFilter("all");
    setQuickFilters([]);
    setScopeTab("all");
    setSortBy("priority-desc");
  };

  const hasActiveFilters =
    !!search ||
    scopeTab !== "all" ||
    healthFilter !== "all" ||
    mechanismFilter !== "all" ||
    urgencyFilter !== "all" ||
    quickFilters.length > 0 ||
    sortBy !== "priority-desc";

  // ==========================================
  // RENDER HELPERS
  // ==========================================
  const renderUsageBar = (p: NormalizedPromotion) => {
    if (!p.isUsageLimited) {
      return (
        <div className="flex flex-col gap-1 w-full">
          <div className="flex justify-between text-[11px] font-medium text-gray-500">
            <span>Đã dùng: —</span>
            <span>Không giới hạn</span>
          </div>
          <div className="w-full bg-gray-100 dark:bg-gray-700 h-1.5 rounded-full overflow-hidden">
            <div className="h-full bg-gray-300 dark:bg-gray-500 w-full opacity-50"></div>
          </div>
        </div>
      );
    }

    if (!p.hasUsageData) {
      return (
        <div className="flex flex-col gap-1 w-full">
          <div className="flex justify-between text-[11px] font-medium text-gray-500">
            <span>Giới hạn: {p.usageLimit}</span>
            <span>Chưa có dữ liệu usage</span>
          </div>
          <div className="w-full bg-gray-100 dark:bg-gray-700 h-1.5 rounded-full overflow-hidden">
            <div className="h-full bg-slate-300 dark:bg-slate-500 w-1/3 opacity-60"></div>
          </div>
        </div>
      );
    }

    let color = "bg-blue-500";
    if (p.usagePercent >= 90) color = "bg-red-500";
    else if (p.usagePercent >= 70) color = "bg-amber-500";

    return (
      <div className="flex flex-col gap-1 w-full">
        <div className="flex justify-between text-[11px] font-bold">
          <span className="text-gray-700 dark:text-gray-300">
            {p.usageUsed} / {p.usageLimit} lượt
          </span>
          <span
            className={p.isUsageExhausted ? "text-red-600" : "text-gray-500"}
          >
            {p.isUsageExhausted ? "Hết lượt" : `Còn ${p.usageRemaining}`}
          </span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 h-1.5 rounded-full overflow-hidden">
          <div
            className={`h-full ${color} transition-all`}
            style={{ width: `${p.usagePercent}%` }}
          ></div>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full pb-10 space-y-6">
      {/* LỚP A: Executive Summary */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Promotions Control Center
            </h1>
            <span className="hidden md:inline-flex px-2 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider bg-blue-50 text-blue-600 border border-blue-200">
              Phase 6
            </span>
          </div>
          <p className="text-sm text-gray-500">
            Giám sát và vận hành toàn bộ campaign order/shipping, auto-apply và
            coupon codes.
          </p>
        </div>
        <button
          onClick={() => navigate("/admin/promotions/create")}
          className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition shadow-sm whitespace-nowrap"
        >
          <Plus className="w-4 h-4" /> Tạo Campaign Mới
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-8 gap-3">
        {[
          {
            label: "Tổng số",
            value: kpiStats.total,
            icon: Tags,
            color: "text-blue-600",
            onClick: () => clearAllFilters(),
          },
          {
            label: "Đang chạy",
            value: kpiStats.active,
            icon: ShieldCheck,
            color: "text-emerald-600",
            onClick: () => {
              clearAllFilters();
              setHealthFilter("active");
            },
          },
          {
            label: "Sắp hết hạn",
            value: kpiStats.endingSoon,
            icon: Timer,
            color: "text-amber-500",
            onClick: () => {
              clearAllFilters();
              setUrgencyFilter("ending-soon");
            },
          },
          {
            label: "Cần chú ý",
            value: kpiStats.needsAttention,
            icon: AlertOctagon,
            color: "text-red-500",
            onClick: () => {
              clearAllFilters();
              setSortBy("alert-desc");
            },
          },
          {
            label: "Auto Apply",
            value: kpiStats.autoApply,
            icon: Sparkles,
            color: "text-purple-600",
            onClick: () => {
              clearAllFilters();
              setMechanismFilter("auto");
            },
          },
          {
            label: "Code-based",
            value: kpiStats.codeBased,
            icon: TicketPercent,
            color: "text-indigo-600",
            onClick: () => {
              clearAllFilters();
              setMechanismFilter("code");
            },
          },
          {
            label: "Order Promo",
            value: kpiStats.orderPromo,
            icon: Percent,
            color: "text-violet-600",
            onClick: () => {
              clearAllFilters();
              setScopeTab("order");
            },
          },
          {
            label: "Shipping",
            value: kpiStats.shippingPromo,
            icon: Truck,
            color: "text-cyan-600",
            onClick: () => {
              clearAllFilters();
              setScopeTab("shipping");
            },
          },
        ].map((kpi, idx) => (
          <div
            key={idx}
            onClick={kpi.onClick}
            className="p-3 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 flex flex-col justify-center cursor-pointer hover:border-blue-300 hover:shadow-sm transition group"
          >
            <div className="flex items-center gap-1.5 mb-1 text-gray-500">
              <kpi.icon
                className={`w-3.5 h-3.5 ${kpi.color} group-hover:scale-110 transition-transform`}
              />
              <span className="text-[10px] font-bold uppercase tracking-wider truncate">
                {kpi.label}
              </span>
            </div>
            <div className="text-xl font-black text-gray-900 dark:text-white">
              {kpi.value}
            </div>
          </div>
        ))}
      </div>

      {/* LỚP B: Operational Filters */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-200 flex flex-col gap-4">
        <div className="flex flex-col lg:flex-row justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Tìm campaign, mã coupon, mô tả..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg bg-gray-50 focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <select
              value={healthFilter}
              onChange={(e) => setHealthFilter(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white min-w-[140px] font-medium text-gray-700"
            >
              <option value="all">Trạng thái: Tất cả</option>
              <option value="active">Đang chạy</option>
              <option value="scheduled">Sắp diễn ra</option>
              <option value="expired">Đã hết hạn</option>
              <option value="inactive">Tạm dừng</option>
            </select>
            <select
              value={mechanismFilter}
              onChange={(e) => setMechanismFilter(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white min-w-[140px] font-medium text-gray-700"
            >
              <option value="all">Cơ chế: Tất cả</option>
              <option value="auto">Auto Apply</option>
              <option value="code">Code-based</option>
            </select>
            <select
              value={urgencyFilter}
              onChange={(e) => setUrgencyFilter(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white min-w-[140px] font-medium text-gray-700"
            >
              <option value="all">Cảnh báo: Không lọc</option>
              <option value="starting-soon">Sắp bắt đầu</option>
              <option value="ending-soon">Sắp hết hạn</option>
              <option value="exhausted">Hết lượt dùng</option>
              <option value="near-limit">Gần hết lượt</option>
            </select>
          </div>

          <div className="flex items-center gap-3 w-full lg:w-auto shrink-0">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white font-medium text-gray-700"
            >
              <option value="priority-desc">Sắp xếp: Mức ưu tiên</option>
              <option value="alert-desc">Sắp xếp: Độ khẩn cấp</option>
              <option value="usage-desc">Sắp xếp: % Lượt dùng</option>
              <option value="latest">Sắp xếp: Mới nhất</option>
              <option value="ending-soon">Sắp xếp: Sắp kết thúc</option>
            </select>
            <div className="flex bg-gray-100 p-1 rounded-lg">
              <button
                onClick={() => setViewMode("cards")}
                className={`p-1.5 rounded-md ${viewMode === "cards" ? "bg-white shadow text-blue-600" : "text-gray-500"}`}
                title="Card View"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode("table")}
                className={`p-1.5 rounded-md ${viewMode === "table" ? "bg-white shadow text-blue-600" : "text-gray-500"}`}
                title="Table View"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Quick Chips */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-gray-100">
          <span className="text-xs font-bold text-gray-400 uppercase mr-1">
            Quick Filters:
          </span>
          {[
            "Sắp bắt đầu",
            "Sắp hết hạn",
            "Hết lượt",
            "Code-based",
            "Auto-apply",
            "Có target restriction",
            "Toàn phạm vi",
          ].map((chip) => {
            const isActive = quickFilters.includes(chip);
            return (
              <button
                key={chip}
                onClick={() => toggleQuickFilter(chip)}
                className={`px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider border transition-colors ${isActive ? "bg-blue-100 text-blue-700 border-blue-300" : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100"}`}
              >
                {chip}
              </button>
            );
          })}
          {hasActiveFilters && (
            <button
              onClick={clearAllFilters}
              className="ml-auto flex items-center gap-1 px-2 py-1 text-xs font-bold text-red-500 hover:text-red-700 transition"
            >
              <FilterX className="w-3.5 h-3.5" /> Xóa bộ lọc
            </button>
          )}
        </div>
      </div>

      {/* LỚP D: Focused Segments (Tabs) & Needs Attention */}
      <div className="flex flex-col gap-4">
        {attentionPromotions.length > 0 && !loading && (
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 flex flex-col gap-3">
            <div className="flex items-center gap-2 text-amber-800 dark:text-amber-400 font-bold text-sm">
              <AlertTriangle className="w-4 h-4" /> Cần chú ý ngay (
              {attentionPromotions.length})
            </div>
            <div className="flex flex-wrap gap-3">
              {attentionPromotions.map((p) => (
                <div
                  key={p.id}
                  onClick={() => navigate(`/admin/promotions/edit/${p.id}`)}
                  className="bg-white dark:bg-gray-800 border border-amber-200 rounded-lg p-2.5 flex items-center gap-3 cursor-pointer hover:shadow-md transition text-sm max-w-sm w-full shadow-sm"
                >
                  <div
                    className={`w-2 h-2 rounded-full ${p.alertLevel === "danger" ? "bg-red-500" : "bg-amber-500"}`}
                  ></div>
                  <div className="flex-1 truncate">
                    <span className="font-bold text-gray-900">{p.name}</span>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {p.isUsageExhausted
                        ? "Đã hết lượt sử dụng"
                        : p.isEndingSoon
                          ? `Kết thúc sau ${p.endsInDays} ngày`
                          : "Cần kiểm tra"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex border-b border-gray-200 dark:border-gray-700">
          {[
            { id: "all", label: "Tất cả Campaigns", count: kpiStats.total },
            {
              id: "order",
              label: "Order Promotions",
              count: kpiStats.orderPromo,
            },
            {
              id: "shipping",
              label: "Shipping Promotions",
              count: kpiStats.shippingPromo,
            },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setScopeTab(tab.id as any)}
              className={`px-5 py-3 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${scopeTab === tab.id ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"}`}
            >
              {tab.label}{" "}
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] ${scopeTab === tab.id ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-600"}`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* LỚP C: Main Workspace */}
      {loading ? (
        <div className="flex flex-col justify-center items-center py-24 bg-white rounded-xl border border-gray-200">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <p className="mt-3 text-gray-500 font-medium">
            Đang tải workspace khuyến mãi...
          </p>
        </div>
      ) : error ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
          <AlertTriangle className="w-10 h-10 text-red-500 mx-auto mb-3" />
          <p className="text-red-600 font-medium mb-4">{error}</p>
          <button
            onClick={fetchPromotions}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-semibold"
          >
            Tải lại
          </button>
        </div>
      ) : filteredAndSortedPromotions.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl border border-dashed border-gray-300 flex flex-col items-center">
          <Percent className="w-12 h-12 text-gray-300 mb-4" />
          <h3 className="text-lg font-bold text-gray-900">
            Không tìm thấy campaign phù hợp
          </h3>
          <p className="text-sm text-gray-500 mt-1 mb-5">
            Thử đổi bộ lọc hoặc tạo campaign mới để bắt đầu.
          </p>
        </div>
      ) : (
        <>
          {viewMode === "cards" ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-5">
              {filteredAndSortedPromotions.map((p) => {
                const healthBadge = getHealthBadge(p.health);
                const scopeConfig = getScopeConfig(p.promotionScope);
                const ScopeIcon = scopeConfig.icon;

                return (
                  <div
                    key={p.id}
                    className={`border rounded-2xl p-0 transition shadow-sm flex flex-col bg-white overflow-hidden relative ${p.alertLevel === "danger" ? "border-red-300" : p.alertLevel === "warning" ? "border-amber-300" : "border-gray-200 hover:border-blue-300"}`}
                  >
                    {/* Header */}
                    <div className="p-4 border-b border-gray-100 flex justify-between items-start gap-3 bg-gray-50/50">
                      <div className="flex gap-3 items-start">
                        <div
                          className={`p-2.5 rounded-xl shadow-sm bg-white ${scopeConfig.color === "violet" ? "text-violet-600" : "text-cyan-600"}`}
                        >
                          <ScopeIcon className="w-5 h-5" />
                        </div>
                        <div>
                          <h3
                            className="font-bold text-sm leading-tight line-clamp-1 text-gray-900 cursor-pointer hover:text-blue-600"
                            onClick={() =>
                              navigate(`/admin/promotions/edit/${p.id}`)
                            }
                            title={p.name}
                          >
                            {p.name}
                          </h3>
                          <div className="flex items-center gap-1.5 mt-1">
                            <span
                              className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border ${healthBadge.color}`}
                            >
                              {healthBadge.label}
                            </span>
                            <span
                              className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border ${p.applicationMode === "auto" ? "bg-purple-100 text-purple-700 border-purple-200" : "bg-indigo-100 text-indigo-700 border-indigo-200"}`}
                            >
                              {p.couponTypeLabel}
                            </span>
                          </div>
                        </div>
                      </div>
                      {p.alertLevel !== "none" && (
                        <div
                          title="Cần chú ý"
                          className={`p-1.5 rounded-md ${p.alertLevel === "danger" ? "bg-red-100 text-red-600" : "bg-amber-100 text-amber-600"}`}
                        >
                          {p.alertLevel === "danger" ? (
                            <Ban className="w-4 h-4" />
                          ) : (
                            <Timer className="w-4 h-4" />
                          )}
                        </div>
                      )}
                    </div>

                    {/* Core Value Strip */}
                    <div className="p-4 flex items-center justify-between border-b border-gray-100">
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-0.5">
                          Giá trị
                        </p>
                        <div className="text-xl font-black text-gray-900">
                          {p.headlineValue}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-0.5">
                          Priority
                        </p>
                        <div className="text-lg font-black text-blue-600">
                          P{p.priority}
                        </div>
                      </div>
                    </div>

                    {/* Ops Summary Block */}
                    <div className="p-4 flex-1 space-y-4">
                      {/* Usage Progress */}
                      {renderUsageBar(p)}

                      <div className="space-y-2 text-xs font-medium text-gray-600 bg-gray-50 p-3 rounded-lg border border-gray-100">
                        <div className="flex items-center gap-2">
                          <Clock3 className="w-4 h-4 text-gray-400 shrink-0" />
                          <span className="flex-1 truncate">
                            {formatDateRange(p.startAt, p.endAt)}
                          </span>
                          {p.isEndingSoon && (
                            <span className="text-amber-600 font-bold bg-amber-100 px-1.5 rounded text-[10px] whitespace-nowrap">
                              Còn {p.endsInDays} ngày
                            </span>
                          )}
                          {p.isStartingSoon && (
                            <span className="text-blue-600 font-bold bg-blue-100 px-1.5 rounded text-[10px] whitespace-nowrap">
                              Bắt đầu sau {p.startsInDays} ngày
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Target className="w-4 h-4 text-gray-400 shrink-0" />
                          <span className="truncate">
                            {p.restrictionSummary}
                          </span>
                        </div>
                        {p.applicationMode === "code" && (
                          <div className="flex items-center gap-2">
                            <TicketPercent className="w-4 h-4 text-gray-400 shrink-0" />
                            <span>
                              {p.activeCodes} / {p.totalCodes} mã đang hoạt động
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="px-4 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between gap-2">
                      <button
                        onClick={() =>
                          navigate(`/admin/promotions/edit/${p.id}`)
                        }
                        className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-white border border-gray-200 text-gray-700 text-sm font-semibold rounded-lg shadow-sm hover:bg-gray-50 hover:text-blue-600 transition"
                      >
                        <Zap className="w-4 h-4" /> Quản lý
                      </button>
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => handleToggleStatus(p)}
                          className="p-2 text-gray-500 hover:text-indigo-600 bg-white border border-gray-200 rounded-lg shadow-sm transition"
                          title={
                            p.status === "active" ? "Tạm dừng" : "Kích hoạt"
                          }
                        >
                          {p.status === "active" ? (
                            <PauseCircle className="w-4 h-4" />
                          ) : (
                            <PlayCircle className="w-4 h-4" />
                          )}
                        </button>
                        <button
                          onClick={() => handleDeletePromotion(p)}
                          className="p-2 text-gray-500 hover:text-red-600 bg-white border border-gray-200 rounded-lg shadow-sm transition"
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
            <Card className="!p-0 overflow-hidden border border-gray-200">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">
                        Campaign
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">
                        Health / Mechanism
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">
                        Giá trị
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">
                        Usage Progress
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">
                        Validity / Targets
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-bold text-gray-500 uppercase">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {filteredAndSortedPromotions.map((p) => {
                      const healthBadge = getHealthBadge(p.health);
                      const scopeConfig = getScopeConfig(p.promotionScope);
                      return (
                        <tr
                          key={p.id}
                          className="hover:bg-gray-50 transition-colors group"
                        >
                          <td className="px-4 py-3">
                            <div className="font-semibold text-gray-900 text-sm flex items-center gap-1.5">
                              {p.name}
                              {p.alertLevel === "danger" && (
                                <span
                                  title="Cần xử lý"
                                  className="flex items-center"
                                >
                                  <Ban className="w-3.5 h-3.5 text-red-500" />
                                </span>
                              )}
                              {p.alertLevel === "warning" && (
                                <span
                                  title="Cảnh báo"
                                  className="flex items-center"
                                >
                                  <Timer className="w-3.5 h-3.5 text-amber-500" />
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-gray-500 mt-0.5 line-clamp-1 max-w-[200px]">
                              {p.description || "—"}
                            </div>
                            <div className="flex items-center gap-1.5 mt-1.5">
                              <span
                                className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${scopeConfig.chip}`}
                              >
                                {scopeConfig.label}
                              </span>
                              <span className="text-[10px] text-gray-400 font-bold">
                                P{p.priority}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3 align-top pt-4">
                            <div className="flex flex-col gap-1.5 items-start">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${healthBadge.color}`}
                              >
                                {healthBadge.label}
                              </span>
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${p.applicationMode === "auto" ? "bg-purple-50 text-purple-700 border-purple-200" : "bg-indigo-50 text-indigo-700 border-indigo-200"}`}
                              >
                                {p.couponTypeLabel}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3 align-top pt-4">
                            <div className="text-sm font-bold text-gray-900">
                              {p.headlineValue}
                            </div>
                            {p.minOrderValue && (
                              <div className="text-[10px] text-gray-500 mt-1 uppercase font-bold">
                                Min: {formatMoney(p.minOrderValue)}
                              </div>
                            )}
                            {p.maxDiscountAmount && (
                              <div className="text-[10px] text-gray-500 mt-0.5 uppercase font-bold">
                                Cap: {formatMoney(p.maxDiscountAmount)}
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3 w-48 align-top pt-4">
                            {renderUsageBar(p)}
                          </td>
                          <td className="px-4 py-3 align-top pt-4">
                            <div className="text-xs text-gray-700 font-medium flex items-center gap-1.5 mb-1">
                              <Clock3 className="w-3.5 h-3.5 text-gray-400" />
                              <span
                                className={
                                  p.isEndingSoon || p.isExpired
                                    ? "text-red-600 font-bold"
                                    : ""
                                }
                              >
                                {formatDateRange(p.startAt, p.endAt)}
                              </span>
                            </div>
                            <div
                              className="text-xs text-gray-500 flex items-center gap-1.5 truncate max-w-[200px]"
                              title={p.restrictionSummary}
                            >
                              <Target className="w-3.5 h-3.5 text-gray-400" />{" "}
                              {p.restrictionSummary}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right align-middle">
                            <div className="flex justify-end gap-1">
                              <button
                                onClick={() =>
                                  navigate(`/admin/promotions/edit/${p.id}`)
                                }
                                className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded"
                                title="Chỉnh sửa"
                              >
                                <Tags className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleToggleStatus(p)}
                                className="p-1.5 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded"
                                title={
                                  p.status === "active"
                                    ? "Tạm dừng"
                                    : "Kích hoạt"
                                }
                              >
                                {p.status === "active" ? (
                                  <PauseCircle className="w-4 h-4" />
                                ) : (
                                  <PlayCircle className="w-4 h-4" />
                                )}
                              </button>
                              <button
                                onClick={() => handleDeletePromotion(p)}
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
        </>
      )}
    </div>
  );
};

export default PromotionsPage;
