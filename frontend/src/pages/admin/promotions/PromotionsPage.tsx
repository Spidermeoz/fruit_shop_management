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
  Info,
  TicketPercent,
  CalendarClock,
  ShieldCheck,
  Clock3,
  Sparkles,
  Tags,
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

interface NormalizedPromotion extends Promotion {
  health: PromotionHealth;
  hasCodes: boolean;
  totalCodes: number;
  activeCodes: number;
  targetCount: number;
  hasTargetRestriction: boolean;
  headlineValue: string;
}

type ApiList<T> = {
  success: true;
  data: T[];
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
  };
  message?: string;
};

type ApiOk = {
  success: true;
  data?: any;
  message?: string;
  meta?: any;
};

// ==========================================
// HELPERS
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

const getHealthStatus = (promotion: Promotion): PromotionHealth => {
  if (promotion.deleted) return "inactive";
  if (promotion.status !== "active") return "inactive";

  const now = new Date();
  const startAt = promotion.startAt ? new Date(promotion.startAt) : null;
  const endAt = promotion.endAt ? new Date(promotion.endAt) : null;

  if (startAt && now < startAt) return "scheduled";
  if (endAt && now > endAt) return "expired";
  return "active";
};

const getHealthBadge = (health: PromotionHealth) => {
  const map = {
    active: {
      label: "Đang hoạt động",
      color:
        "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400",
    },
    scheduled: {
      label: "Sắp diễn ra",
      color:
        "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400",
    },
    expired: {
      label: "Đã hết hạn",
      color:
        "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400",
    },
    inactive: {
      label: "Tạm dừng",
      color:
        "bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-700 dark:text-gray-300",
    },
  };
  return map[health];
};

const getScopeConfig = (scope: PromotionScope) => {
  if (scope === "shipping") {
    return {
      label: "Shipping",
      icon: Truck,
      chip: "bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-900/20 dark:text-cyan-400",
    };
  }

  return {
    label: "Order",
    icon: TicketPercent,
    chip: "bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-900/20 dark:text-violet-400",
  };
};

const getDiscountHeadline = (promotion: Promotion) => {
  if (promotion.discountType === "free_shipping") return "Miễn phí vận chuyển";
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

const normalizePromotion = (item: Promotion): NormalizedPromotion => {
  const health = getHealthStatus(item);
  const totalCodes = Array.isArray(item.codes) ? item.codes.length : 0;
  const activeCodes = Array.isArray(item.codes)
    ? item.codes.filter((c) => c.status === "active" && !c.deleted).length
    : 0;
  const targetCount = getTargetCount(item.targets);

  return {
    ...item,
    health,
    hasCodes: totalCodes > 0,
    totalCodes,
    activeCodes,
    targetCount,
    hasTargetRestriction: targetCount > 0,
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
  const [statusFilter, setStatusFilter] = useState<
    "all" | PromotionHealth | "auto" | "manual"
  >("all");
  const [scopeFilter, setScopeFilter] = useState<"all" | PromotionScope>("all");
  const [sortBy, setSortBy] = useState<
    "priority-desc" | "name-asc" | "value-desc" | "latest" | "ending-soon"
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
    const total = promotions.length;
    const active = promotions.filter((p) => p.health === "active").length;
    const scheduled = promotions.filter((p) => p.health === "scheduled").length;
    const shipping = promotions.filter(
      (p) => p.promotionScope === "shipping",
    ).length;
    const autoApply = promotions.filter((p) => p.isAutoApply).length;

    return {
      total,
      active,
      scheduled,
      shipping,
      autoApply,
    };
  }, [promotions]);

  const filteredAndSortedPromotions = useMemo(() => {
    let result = [...promotions];

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

    if (statusFilter !== "all") {
      if (statusFilter === "auto") {
        result = result.filter((p) => p.isAutoApply);
      } else if (statusFilter === "manual") {
        result = result.filter((p) => !p.isAutoApply);
      } else {
        result = result.filter((p) => p.health === statusFilter);
      }
    }

    if (scopeFilter !== "all") {
      result = result.filter((p) => p.promotionScope === scopeFilter);
    }

    result.sort((a, b) => {
      switch (sortBy) {
        case "name-asc":
          return a.name.localeCompare(b.name);
        case "value-desc":
          return Number(b.discountValue ?? 0) - Number(a.discountValue ?? 0);
        case "latest": {
          const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return bTime - aTime;
        }
        case "ending-soon": {
          const aTime = a.endAt
            ? new Date(a.endAt).getTime()
            : Number.MAX_SAFE_INTEGER;
          const bTime = b.endAt
            ? new Date(b.endAt).getTime()
            : Number.MAX_SAFE_INTEGER;
          return aTime - bTime;
        }
        case "priority-desc":
        default:
          return Number(b.priority ?? 0) - Number(a.priority ?? 0);
      }
    });

    return result;
  }, [promotions, search, statusFilter, scopeFilter, sortBy]);

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
              ? "Đã kích hoạt khuyến mãi."
              : "Đã tạm dừng khuyến mãi.",
        });
        await fetchPromotions();
      }
    } catch (err: any) {
      console.error(err);
      showErrorToast(err?.message || "Không thể cập nhật trạng thái.");
    }
  };

  const handleDeletePromotion = async (promotion: NormalizedPromotion) => {
    const ok = window.confirm(
      `Bạn có chắc muốn xóa mềm khuyến mãi "${promotion.name}"?\nHành động này sẽ ẩn khuyến mãi khỏi danh sách hoạt động.`,
    );
    if (!ok) return;

    try {
      const res = await http<ApiOk>(
        "DELETE",
        `/api/v1/admin/promotions/${promotion.id}`,
      );

      if (res.success) {
        showSuccessToast({ message: "Đã xóa mềm khuyến mãi." });
        setRawPromotions((prev) => prev.filter((x) => x.id !== promotion.id));
      }
    } catch (err: any) {
      console.error(err);
      showErrorToast(err?.message || "Không thể xóa khuyến mãi.");
    }
  };

  // ==========================================
  // RENDER
  // ==========================================
  return (
    <div className="w-full pb-10 space-y-6">
      {/* A. Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Promotions Workspace
            </h1>
            <span className="hidden md:inline-flex px-2 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider bg-blue-50 text-blue-600 border border-blue-200 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-400">
              Phase 6
            </span>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Quản lý toàn bộ khuyến mãi đơn hàng, freeship, mã coupon và phạm vi
            áp dụng theo sản phẩm, biến thể, nguồn gốc hoặc chi nhánh.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <button
            onClick={() => navigate("/admin/promotions/create")}
            className="flex items-center gap-2 px-5 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition shadow-sm ml-auto md:ml-0 whitespace-nowrap"
          >
            <Plus className="w-4 h-4" /> Tạo khuyến mãi
          </button>
        </div>
      </div>

      {/* B. KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3">
        {[
          {
            label: "Tổng khuyến mãi",
            value: kpiStats.total,
            icon: Tags,
            color: "text-blue-600",
            warning: false,
          },
          {
            label: "Đang hoạt động",
            value: kpiStats.active,
            icon: ShieldCheck,
            color: "text-emerald-600",
            warning: false,
          },
          {
            label: "Sắp diễn ra",
            value: kpiStats.scheduled,
            icon: CalendarClock,
            color: "text-indigo-600",
            warning: false,
          },
          {
            label: "Khuyến mãi ship",
            value: kpiStats.shipping,
            icon: Truck,
            color: "text-cyan-600",
            warning: false,
          },
          {
            label: "Auto apply",
            value: kpiStats.autoApply,
            icon: Sparkles,
            color: "text-purple-600",
            warning: false,
          },
        ].map((kpi, idx) => (
          <div
            key={idx}
            className="p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 flex flex-col justify-center"
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

      {/* C. Control Bar */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col gap-4">
        <div className="flex flex-col lg:flex-row justify-between items-center gap-4">
          <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white min-w-[180px]"
            >
              <option value="all">Mọi trạng thái</option>
              <option value="active">Đang hoạt động</option>
              <option value="scheduled">Sắp diễn ra</option>
              <option value="expired">Đã hết hạn</option>
              <option value="inactive">Tạm dừng</option>
              <option value="auto">Auto apply</option>
              <option value="manual">Nhập mã thủ công</option>
            </select>

            <select
              value={scopeFilter}
              onChange={(e) => setScopeFilter(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white min-w-[180px]"
            >
              <option value="all">Mọi phạm vi</option>
              <option value="order">Order promotions</option>
              <option value="shipping">Shipping promotions</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white min-w-[180px]"
            >
              <option value="priority-desc">Ưu tiên giảm dần</option>
              <option value="name-asc">Tên (A-Z)</option>
              <option value="value-desc">Giá trị giảm cao nhất</option>
              <option value="latest">Mới tạo gần đây</option>
              <option value="ending-soon">Sắp hết hạn</option>
            </select>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4 w-full lg:w-auto">
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Tìm tên, mô tả hoặc mã coupon..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex bg-gray-100 dark:bg-gray-900 p-1 rounded-lg shrink-0">
              <button
                onClick={() => setViewMode("cards")}
                className={`p-1.5 rounded-md flex items-center gap-1.5 text-sm font-medium transition ${
                  viewMode === "cards"
                    ? "bg-white dark:bg-gray-700 shadow-sm text-blue-600 dark:text-blue-400"
                    : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                }`}
                title="Card View"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode("table")}
                className={`p-1.5 rounded-md flex items-center gap-1.5 text-sm font-medium transition ${
                  viewMode === "table"
                    ? "bg-white dark:bg-gray-700 shadow-sm text-blue-600 dark:text-blue-400"
                    : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                }`}
                title="Table View"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* D. Main Content */}
      {loading ? (
        <div className="flex flex-col justify-center items-center py-24 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <p className="mt-3 text-gray-500 font-medium">
            Đang tải workspace khuyến mãi...
          </p>
        </div>
      ) : error ? (
        <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
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
        <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-xl border border-dashed border-gray-300 dark:border-gray-600 flex flex-col items-center">
          <Percent className="w-12 h-12 text-gray-300 dark:text-gray-600 mb-4" />
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">
            Không tìm thấy khuyến mãi phù hợp
          </h3>
          <p className="text-sm text-gray-500 mt-1 mb-5">
            Thử đổi bộ lọc hoặc tạo một campaign mới cho phase 6.
          </p>
          <button
            onClick={() => navigate("/admin/promotions/create")}
            className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition"
          >
            Tạo khuyến mãi đầu tiên
          </button>
        </div>
      ) : (
        <>
          <p className="text-sm text-gray-500 font-medium pl-1">
            Hiển thị {filteredAndSortedPromotions.length} khuyến mãi ở trang
            hiện tại.
          </p>

          {viewMode === "cards" ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 mt-4">
              {filteredAndSortedPromotions.map((promotion) => {
                const healthBadge = getHealthBadge(promotion.health);
                const scopeConfig = getScopeConfig(promotion.promotionScope);
                const ScopeIcon = scopeConfig.icon;

                return (
                  <div
                    key={promotion.id}
                    className="border rounded-2xl p-0 transition shadow-sm group relative flex flex-col overflow-hidden bg-white dark:bg-gray-800 border-gray-200 hover:border-blue-300 dark:border-gray-700"
                  >
                    <div className="p-5 border-b border-gray-100 dark:border-gray-700/50 flex justify-between items-start gap-4 bg-gray-50/50 dark:bg-gray-800/50">
                      <div className="flex gap-3 items-start">
                        <div className="p-2.5 rounded-xl shadow-sm bg-white text-blue-600 dark:bg-gray-900">
                          <ScopeIcon className="w-5 h-5" />
                        </div>
                        <div>
                          <h3
                            className="font-bold text-base leading-tight line-clamp-1 text-gray-900 dark:text-white cursor-pointer hover:text-blue-600 transition-colors"
                            onClick={() =>
                              navigate(`/admin/promotions/edit/${promotion.id}`)
                            }
                            title={promotion.name}
                          >
                            {promotion.name}
                          </h3>
                          <p className="text-xs text-gray-500 mt-1 line-clamp-1">
                            {promotion.description || (
                              <span className="italic">Chưa có mô tả</span>
                            )}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <span
                          className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border ${healthBadge.color}`}
                        >
                          {healthBadge.label}
                        </span>
                        <span
                          className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border ${scopeConfig.chip}`}
                        >
                          {scopeConfig.label}
                        </span>
                      </div>
                    </div>

                    <div className="p-5 flex-1 space-y-4">
                      <div className="flex items-end justify-between gap-3">
                        <div>
                          <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">
                            Giá trị khuyến mãi
                          </p>
                          <div className="text-2xl font-black text-gray-900 dark:text-white">
                            {promotion.headlineValue}
                          </div>
                        </div>

                        <div className="text-right">
                          <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">
                            Ưu tiên
                          </p>
                          <div className="text-lg font-black text-blue-600 dark:text-blue-400">
                            {promotion.priority}
                          </div>
                        </div>
                      </div>

                      <div className="bg-white dark:bg-gray-900 p-3 rounded-lg border border-gray-100 dark:border-gray-700 space-y-2">
                        <div className="flex flex-wrap gap-2">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-gray-50 text-gray-700 border border-gray-200 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 uppercase">
                            Min order:{" "}
                            {promotion.minOrderValue
                              ? formatMoney(promotion.minOrderValue)
                              : "Không giới hạn"}
                          </span>

                          {promotion.maxDiscountAmount ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-gray-50 text-gray-700 border border-gray-200 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 uppercase">
                              Cap: {formatMoney(promotion.maxDiscountAmount)}
                            </span>
                          ) : null}

                          {promotion.isAutoApply && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200 dark:bg-purple-900/20 dark:border-purple-800 dark:text-purple-400 uppercase">
                              Auto apply
                            </span>
                          )}

                          {promotion.canCombine && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-900/20 dark:border-amber-800 dark:text-amber-400 uppercase">
                              Combinable
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="space-y-2.5 text-sm text-gray-600 dark:text-gray-300">
                        <div className="flex items-center gap-2.5">
                          <Clock3 className="w-4 h-4 text-gray-400 shrink-0" />
                          <span className="line-clamp-1">
                            {formatDateRange(
                              promotion.startAt,
                              promotion.endAt,
                            )}
                          </span>
                        </div>

                        <div className="flex items-center gap-2.5">
                          <TicketPercent className="w-4 h-4 text-gray-400 shrink-0" />
                          <span>
                            {promotion.hasCodes
                              ? `${promotion.activeCodes}/${promotion.totalCodes} mã đang bật`
                              : "Không dùng coupon code"}
                          </span>
                        </div>

                        <div className="flex items-center gap-2.5">
                          <Info className="w-4 h-4 text-gray-400 shrink-0" />
                          <span>
                            {promotion.hasTargetRestriction
                              ? `Giới hạn theo ${promotion.targetCount} target`
                              : "Áp dụng toàn phạm vi"}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-700/50 flex items-center justify-between gap-2 bg-gray-50 dark:bg-gray-800">
                      <button
                        onClick={() =>
                          navigate(`/admin/promotions/edit/${promotion.id}`)
                        }
                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 text-sm font-semibold rounded shadow-sm hover:bg-gray-50 transition-colors"
                      >
                        <Tags className="w-4 h-4" /> Quản lý campaign
                      </button>

                      <div className="flex gap-1">
                        <button
                          onClick={() => handleToggleStatus(promotion)}
                          className="p-2 text-gray-500 hover:text-indigo-600 bg-white hover:bg-indigo-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded shadow-sm transition"
                          title={
                            promotion.status === "active"
                              ? "Tạm dừng"
                              : "Kích hoạt"
                          }
                        >
                          {promotion.status === "active" ? (
                            <PauseCircle className="w-4 h-4" />
                          ) : (
                            <PlayCircle className="w-4 h-4" />
                          )}
                        </button>

                        <button
                          onClick={() => handleDeletePromotion(promotion)}
                          className="p-2 text-gray-500 hover:text-red-600 bg-white hover:bg-red-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded shadow-sm transition"
                          title="Xóa mềm"
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
            <Card className="!p-0 overflow-hidden mt-4 border border-gray-200 dark:border-gray-700">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th className="px-5 py-3.5 text-left text-xs font-bold text-gray-500 uppercase">
                        Campaign
                      </th>
                      <th className="px-5 py-3.5 text-left text-xs font-bold text-gray-500 uppercase">
                        Trạng thái
                      </th>
                      <th className="px-5 py-3.5 text-left text-xs font-bold text-gray-500 uppercase">
                        Giá trị
                      </th>
                      <th className="px-5 py-3.5 text-left text-xs font-bold text-gray-500 uppercase">
                        Phạm vi
                      </th>
                      <th className="px-5 py-3.5 text-left text-xs font-bold text-gray-500 uppercase">
                        Coupon / Target
                      </th>
                      <th className="px-5 py-3.5 text-right text-xs font-bold text-gray-500 uppercase">
                        Thao tác
                      </th>
                    </tr>
                  </thead>

                  <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-100 dark:divide-gray-800">
                    {filteredAndSortedPromotions.map((promotion) => {
                      const healthBadge = getHealthBadge(promotion.health);
                      const scopeConfig = getScopeConfig(
                        promotion.promotionScope,
                      );

                      return (
                        <tr
                          key={promotion.id}
                          className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group"
                        >
                          <td className="px-5 py-4">
                            <div className="font-semibold text-gray-900 dark:text-white text-sm flex items-center gap-2">
                              {promotion.name}
                              {promotion.isAutoApply && (
                                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400">
                                  Auto
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-gray-500 mt-0.5 line-clamp-1 max-w-sm">
                              {promotion.description || "—"}
                            </div>
                          </td>

                          <td className="px-5 py-4">
                            <span
                              className={`inline-flex px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider border ${healthBadge.color}`}
                            >
                              {healthBadge.label}
                            </span>
                          </td>

                          <td className="px-5 py-4">
                            <div className="text-sm font-bold text-gray-900 dark:text-white">
                              {promotion.headlineValue}
                            </div>
                            <div className="text-xs text-gray-500 mt-0.5">
                              Priority: {promotion.priority}
                            </div>
                          </td>

                          <td className="px-5 py-4">
                            <div className="text-sm text-gray-700 dark:text-gray-300">
                              {scopeConfig.label}
                            </div>
                            <div className="text-xs text-gray-500 mt-0.5">
                              {formatDateRange(
                                promotion.startAt,
                                promotion.endAt,
                              )}
                            </div>
                          </td>

                          <td className="px-5 py-4">
                            <div className="flex flex-col gap-1 text-xs text-gray-600 dark:text-gray-400">
                              <span>
                                {promotion.hasCodes
                                  ? `${promotion.activeCodes}/${promotion.totalCodes} mã`
                                  : "Không mã coupon"}
                              </span>
                              <span>
                                {promotion.hasTargetRestriction
                                  ? `${promotion.targetCount} target giới hạn`
                                  : "Toàn phạm vi"}
                              </span>
                            </div>
                          </td>

                          <td className="px-5 py-4 text-right">
                            <div className="flex justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() =>
                                  navigate(
                                    `/admin/promotions/edit/${promotion.id}`,
                                  )
                                }
                                className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-gray-800 rounded transition-colors"
                                title="Chỉnh sửa"
                              >
                                <Tags className="w-4 h-4" />
                              </button>

                              <button
                                onClick={() => handleToggleStatus(promotion)}
                                className="p-1.5 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-gray-800 rounded transition-colors"
                                title={
                                  promotion.status === "active"
                                    ? "Tạm dừng"
                                    : "Kích hoạt"
                                }
                              >
                                {promotion.status === "active" ? (
                                  <PauseCircle className="w-4 h-4" />
                                ) : (
                                  <PlayCircle className="w-4 h-4" />
                                )}
                              </button>

                              <button
                                onClick={() => handleDeletePromotion(promotion)}
                                className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-gray-800 rounded transition-colors"
                                title="Xóa mềm"
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
