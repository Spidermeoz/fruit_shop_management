import React, {
  useEffect,
  useMemo,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Loader2,
  Save,
  ArrowLeft,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  Clock3,
  Settings2,
  TicketPercent,
  Truck,
  Sparkles,
  CalendarClock,
  Tags,
  PauseCircle,
  PlayCircle,
  Copy,
  Percent,
} from "lucide-react";
import Card from "../../../components/admin/layouts/Card";
import RichTextEditor from "../../../components/admin/common/RichTextEditor";
import { http } from "../../../services/http";
import { uploadImagesInContent } from "../../../utils/uploadImagesInContent";
import { useAdminToast } from "../../../context/AdminToastContext";

// ==========================================
// TYPES
// ==========================================
type PromotionScope = "order" | "shipping";
type DiscountType = "fixed" | "percent" | "free_shipping";
type PromotionStatus = "active" | "inactive";
type PromotionHealth = "active" | "scheduled" | "expired" | "inactive";

interface PromotionCode {
  id?: number;
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

interface PromotionFormData {
  name: string;
  description: string;
  promotionScope: PromotionScope;
  discountType: DiscountType;
  discountValue: number | "";
  maxDiscountAmount: number | "";
  minOrderValue: number | "";
  isAutoApply: boolean;
  canCombine: boolean;
  priority: number | "";
  usageLimit: number | "";
  usageLimitPerUser: number | "";
  startAt: string;
  endAt: string;
  status: PromotionStatus;
  codesText: string;
  productIdsText: string;
  categoryIdsText: string;
  variantIdsText: string;
  originIdsText: string;
  branchIdsText: string;
}

type ApiDetail<T> = { success: true; data: T; meta?: any };
type ApiOk = {
  success: true;
  data?: any;
  url?: string;
  message?: string;
  meta?: any;
  errors?: any;
};

// ==========================================
// HELPERS
// ==========================================
const parseNumberOrNull = (value: number | "" | string) => {
  if (value === "" || value === null || value === undefined) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const parseIdList = (raw: string): number[] => {
  if (!raw.trim()) return [];
  return Array.from(
    new Set(
      raw
        .split(/[,\n]/g)
        .map((x) => Number(String(x).trim()))
        .filter((x) => Number.isFinite(x) && x > 0),
    ),
  );
};

const parseCodes = (raw: string) => {
  if (!raw.trim()) return [];
  return Array.from(
    new Set(
      raw
        .split(/[,\n]/g)
        .map((x) => String(x).trim().toUpperCase())
        .filter(Boolean),
    ),
  ).map((code) => ({
    code,
    status: "active" as PromotionStatus,
  }));
};

const formatDateTimeLocalValue = (value?: string | null) => {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  const year = d.getFullYear();
  const month = `${d.getMonth() + 1}`.padStart(2, "0");
  const day = `${d.getDate()}`.padStart(2, "0");
  const hours = `${d.getHours()}`.padStart(2, "0");
  const minutes = `${d.getMinutes()}`.padStart(2, "0");
  return `${year}-${month}-${day}T${hours}:${minutes}`;
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

const formatMoney = (value?: number | null) => {
  return `${Number(value ?? 0).toLocaleString("vi-VN")} đ`;
};

const getHealthStatus = (promotion: Promotion | null): PromotionHealth => {
  if (!promotion || promotion.deleted) return "inactive";
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

const getScopeLabel = (scope: PromotionScope) =>
  scope === "shipping" ? "Shipping promotion" : "Order promotion";

const getDiscountTypeLabel = (type: DiscountType) => {
  if (type === "free_shipping") return "Miễn phí vận chuyển";
  if (type === "percent") return "Giảm theo phần trăm";
  return "Giảm số tiền cố định";
};

const getHeadlinePreview = (form: PromotionFormData) => {
  if (form.discountType === "free_shipping") return "Miễn phí vận chuyển";
  if (form.discountType === "percent") {
    return form.discountValue !== "" ? `${form.discountValue}%` : "0%";
  }
  return form.discountValue !== ""
    ? `${Number(form.discountValue).toLocaleString("vi-VN")} đ`
    : "0 đ";
};

const getScopeIcon = (scope: PromotionScope) =>
  scope === "shipping" ? Truck : TicketPercent;

const makeFormFromPromotion = (promotion: Promotion): PromotionFormData => ({
  name: promotion.name || "",
  description: promotion.description || "",
  promotionScope: promotion.promotionScope || "order",
  discountType: promotion.discountType || "percent",
  discountValue:
    promotion.discountType === "free_shipping"
      ? ""
      : Number(promotion.discountValue ?? 0),
  maxDiscountAmount:
    promotion.maxDiscountAmount !== null &&
    promotion.maxDiscountAmount !== undefined
      ? Number(promotion.maxDiscountAmount)
      : "",
  minOrderValue:
    promotion.minOrderValue !== null && promotion.minOrderValue !== undefined
      ? Number(promotion.minOrderValue)
      : "",
  isAutoApply: !!promotion.isAutoApply,
  canCombine: !!promotion.canCombine,
  priority: Number(promotion.priority ?? 0),
  usageLimit:
    promotion.usageLimit !== null && promotion.usageLimit !== undefined
      ? Number(promotion.usageLimit)
      : "",
  usageLimitPerUser:
    promotion.usageLimitPerUser !== null &&
    promotion.usageLimitPerUser !== undefined
      ? Number(promotion.usageLimitPerUser)
      : "",
  startAt: formatDateTimeLocalValue(promotion.startAt),
  endAt: formatDateTimeLocalValue(promotion.endAt),
  status: promotion.status || "active",
  codesText: Array.isArray(promotion.codes)
    ? promotion.codes
        .filter((c) => !c.deleted)
        .map((c) => c.code)
        .join("\n")
    : "",
  productIdsText: promotion.targets?.productIds?.join(", ") || "",
  categoryIdsText: promotion.targets?.categoryIds?.join(", ") || "",
  variantIdsText: promotion.targets?.variantIds?.join(", ") || "",
  originIdsText: promotion.targets?.originIds?.join(", ") || "",
  branchIdsText: promotion.targets?.branchIds?.join(", ") || "",
});

// ==========================================
// MAIN COMPONENT
// ==========================================
const PromotionEditPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showSuccessToast, showErrorToast } = useAdminToast();

  // --- States ---
  const [promotion, setPromotion] = useState<Promotion | null>(null);
  const [, setInitialPromotion] = useState<Promotion | null>(
    null,
  );
  const [formData, setFormData] = useState<PromotionFormData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [fetchError, setFetchError] = useState("");
  const [formErrors, setFormErrors] = useState<
    Partial<Record<keyof PromotionFormData | "general", string>>
  >({});

  // --- Fetch Data ---
  const fetchPromotion = async () => {
    try {
      setLoading(true);
      setFetchError("");

      const res = await http<ApiDetail<Promotion>>(
        "GET",
        `/api/v1/admin/promotions/${id}`,
      );

      if (res?.success && res.data) {
        setPromotion(res.data);
        setInitialPromotion(res.data);
        setFormData(makeFormFromPromotion(res.data));
      } else {
        setFetchError("Không tìm thấy dữ liệu campaign.");
      }
    } catch (err: any) {
      console.error(err);
      setFetchError(err?.message || "Lỗi kết nối server.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPromotion();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // --- Derived Data ---
  const health = useMemo(() => getHealthStatus(promotion), [promotion]);

  const healthBadge = useMemo(() => getHealthBadge(health), [health]);

  const parsedCodes = useMemo(
    () => parseCodes(formData?.codesText || ""),
    [formData?.codesText],
  );

  const parsedTargets = useMemo(
    () => ({
      productIds: parseIdList(formData?.productIdsText || ""),
      categoryIds: parseIdList(formData?.categoryIdsText || ""),
      variantIds: parseIdList(formData?.variantIdsText || ""),
      originIds: parseIdList(formData?.originIdsText || ""),
      branchIds: parseIdList(formData?.branchIdsText || ""),
    }),
    [
      formData?.productIdsText,
      formData?.categoryIdsText,
      formData?.variantIdsText,
      formData?.originIdsText,
      formData?.branchIdsText,
    ],
  );

  const targetCount = useMemo(
    () =>
      parsedTargets.productIds.length +
      parsedTargets.categoryIds.length +
      parsedTargets.variantIds.length +
      parsedTargets.originIds.length +
      parsedTargets.branchIds.length,
    [parsedTargets],
  );

  const isDirty = useMemo(() => {
    if (!promotion || !formData) return false;
    const snapshot = JSON.stringify(makeFormFromPromotion(promotion));
    const current = JSON.stringify(formData);
    return snapshot !== current;
  }, [promotion, formData]);

  // --- Handlers ---
  const handleInputChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    if (!formData) return;

    const { name, value, type } = e.target;
    const checked =
      e.target instanceof HTMLInputElement ? e.target.checked : false;

    setFormData((prev) =>
      prev
        ? {
            ...prev,
            [name]:
              type === "checkbox"
                ? checked
                : [
                      "discountValue",
                      "maxDiscountAmount",
                      "minOrderValue",
                      "priority",
                      "usageLimit",
                      "usageLimitPerUser",
                    ].includes(name)
                  ? value === ""
                    ? ""
                    : Number(value)
                  : value,
          }
        : prev,
    );

    if (formErrors[name as keyof typeof formErrors]) {
      setFormErrors((prev) => ({ ...prev, [name]: undefined }));
    }
    if (formErrors.general) {
      setFormErrors((prev) => ({ ...prev, general: undefined }));
    }
  };

  const handleDescriptionChange = (content: string) => {
    setFormData((prev) =>
      prev
        ? {
            ...prev,
            description: content,
          }
        : prev,
    );

    if (formErrors.description) {
      setFormErrors((prev) => ({ ...prev, description: undefined }));
    }
  };

  const validateForm = () => {
    if (!formData) return false;

    const nextErrors: Partial<
      Record<keyof PromotionFormData | "general", string>
    > = {};

    if (!formData.name.trim()) {
      nextErrors.name = "Vui lòng nhập tên campaign.";
    }

    if (
      formData.discountType !== "free_shipping" &&
      (formData.discountValue === "" || Number(formData.discountValue) < 0)
    ) {
      nextErrors.discountValue = "Giá trị giảm giá không hợp lệ.";
    }

    if (
      formData.discountType === "percent" &&
      Number(formData.discountValue || 0) > 100
    ) {
      nextErrors.discountValue =
        "Khuyến mãi phần trăm không được vượt quá 100%.";
    }

    if (
      formData.discountType === "free_shipping" &&
      formData.promotionScope !== "shipping"
    ) {
      nextErrors.discountType =
        "Kiểu free shipping chỉ phù hợp với shipping promotion.";
    }

    if (
      formData.maxDiscountAmount !== "" &&
      Number(formData.maxDiscountAmount) < 0
    ) {
      nextErrors.maxDiscountAmount = "Mức giảm tối đa không hợp lệ.";
    }

    if (formData.minOrderValue !== "" && Number(formData.minOrderValue) < 0) {
      nextErrors.minOrderValue = "Giá trị đơn tối thiểu không hợp lệ.";
    }

    if (formData.priority !== "" && Number(formData.priority) < 0) {
      nextErrors.priority = "Độ ưu tiên không hợp lệ.";
    }

    if (formData.usageLimit !== "" && Number(formData.usageLimit) < 0) {
      nextErrors.usageLimit = "Giới hạn sử dụng không hợp lệ.";
    }

    if (
      formData.usageLimitPerUser !== "" &&
      Number(formData.usageLimitPerUser) < 0
    ) {
      nextErrors.usageLimitPerUser = "Giới hạn mỗi người không hợp lệ.";
    }

    if (
      formData.startAt &&
      formData.endAt &&
      new Date(formData.startAt) > new Date(formData.endAt)
    ) {
      nextErrors.general =
        "Thời gian bắt đầu không được sau thời gian kết thúc.";
    }

    if (!formData.isAutoApply && parsedCodes.length === 0) {
      nextErrors.codesText =
        "Nếu không bật auto apply, bạn nên nhập ít nhất một coupon code.";
    }

    setFormErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSave = async (e?: FormEvent) => {
    if (e) e.preventDefault();
    if (!formData || !isDirty) return;
    if (!validateForm()) return;

    try {
      setSaving(true);
      setFormErrors({});

      const processedDescription = await uploadImagesInContent(
        formData.description || "",
      );

      const payload = {
        name: formData.name.trim(),
        description: processedDescription || null,
        promotionScope: formData.promotionScope,
        discountType: formData.discountType,
        discountValue:
          formData.discountType === "free_shipping"
            ? 0
            : Number(formData.discountValue || 0),
        maxDiscountAmount: parseNumberOrNull(formData.maxDiscountAmount),
        minOrderValue: parseNumberOrNull(formData.minOrderValue),
        isAutoApply: !!formData.isAutoApply,
        canCombine: !!formData.canCombine,
        priority: Number(formData.priority || 0),
        usageLimit: parseNumberOrNull(formData.usageLimit),
        usageLimitPerUser: parseNumberOrNull(formData.usageLimitPerUser),
        startAt: formData.startAt
          ? new Date(formData.startAt).toISOString()
          : null,
        endAt: formData.endAt ? new Date(formData.endAt).toISOString() : null,
        status: formData.status,
        codes: parsedCodes,
        productIds: parsedTargets.productIds,
        categoryIds: parsedTargets.categoryIds,
        variantIds: parsedTargets.variantIds,
        originIds: parsedTargets.originIds,
        branchIds: parsedTargets.branchIds,
      };

      const res = await http<ApiOk>(
        "PUT",
        `/api/v1/admin/promotions/${id}`,
        payload,
      );

      if (res?.success) {
        showSuccessToast({ message: "Lưu campaign thành công!" });
        await fetchPromotion();
      } else {
        if (res.errors) {
          setFormErrors(res.errors);
        } else {
          showErrorToast(res?.message || "Không thể lưu thay đổi.");
        }
      }
    } catch (err: any) {
      console.error(err);
      if (err?.data?.errors) {
        setFormErrors(err.data.errors);
      } else {
        showErrorToast(
          err?.data?.message || err?.message || "Lỗi kết nối server.",
        );
      }
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async () => {
    if (!promotion) return;

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
        await fetchPromotion();
      }
    } catch (err: any) {
      console.error(err);
      showErrorToast(err?.message || "Không thể cập nhật trạng thái.");
    }
  };

  // ==========================================
  // RENDER STATES
  // ==========================================
  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center py-32 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-4" />
        <p className="text-gray-500 dark:text-gray-400 font-medium">
          Đang khởi tạo workspace campaign...
        </p>
      </div>
    );
  }

  if (fetchError || !promotion || !formData) {
    return (
      <div className="flex flex-col items-center justify-center py-24 bg-white dark:bg-gray-800 rounded-2xl border border-red-200 dark:border-red-900/30">
        <AlertTriangle className="w-12 h-12 text-red-500 mb-4" />
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
          Không thể tải dữ liệu campaign
        </h3>
        <p className="text-red-600 dark:text-red-400 mb-6 font-medium">
          {fetchError}
        </p>
        <div className="flex gap-3">
          <button
            onClick={() => navigate("/admin/promotions")}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 font-semibold rounded-lg transition"
          >
            Quay lại danh sách
          </button>
          <button
            onClick={fetchPromotion}
            className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition"
          >
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  const ScopeIcon = getScopeIcon(formData.promotionScope);

  // ==========================================
  // RENDER
  // ==========================================
  return (
    <div className="w-full pb-10 space-y-6">
      {/* A. Header Workspace */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm sticky top-4 z-10">
        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <button
                onClick={() => navigate("/admin/promotions")}
                className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md text-gray-500 dark:text-gray-400 transition"
                title="Quay lại danh sách"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>

              <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight flex items-center gap-3">
                {promotion.name || "Campaign"}
                <span
                  className={`px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider border ${healthBadge.color}`}
                >
                  {healthBadge.label}
                </span>
              </h1>
            </div>

            <p className="text-gray-500 dark:text-gray-400 ml-10 max-w-2xl text-sm">
              Không gian quản lý campaign khuyến mãi, cấu hình logic giảm giá,
              coupon codes, phạm vi áp dụng và trạng thái hoạt động trong hệ
              thống.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 ml-10 xl:ml-0">
            <div className="mr-2 text-sm font-medium flex items-center gap-1.5">
              {isDirty ? (
                <span className="text-amber-600 dark:text-amber-500 bg-amber-50 dark:bg-amber-900/20 px-2.5 py-1 rounded-md border border-amber-200 dark:border-amber-800/50">
                  <span className="inline-block w-2 h-2 rounded-full bg-amber-500 mr-1.5 animate-pulse"></span>
                  Có thay đổi chưa lưu
                </span>
              ) : (
                <span className="text-gray-500 dark:text-gray-400">
                  <CheckCircle2 className="w-4 h-4 inline mr-1" />
                  Đã lưu thay đổi
                </span>
              )}
            </div>

            <button
              onClick={() =>
                navigate("/admin/promotions/create", {
                  state: { copyFrom: promotion.id },
                })
              }
              className="px-4 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-semibold rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition flex items-center gap-2"
            >
              <Copy className="w-4 h-4" /> Nhân bản
            </button>

            <button
              onClick={handleToggleStatus}
              className="px-4 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-semibold rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition flex items-center gap-2"
            >
              {promotion.status === "active" ? (
                <>
                  <PauseCircle className="w-4 h-4" /> Tạm dừng
                </>
              ) : (
                <>
                  <PlayCircle className="w-4 h-4" /> Kích hoạt
                </>
              )}
            </button>

            <button
              onClick={handleSave}
              disabled={saving || !isDirty}
              className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {saving ? "Đang lưu..." : "Lưu thay đổi"}
            </button>
          </div>
        </div>
      </div>

      {/* B. Top Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 mb-2">
            <ScopeIcon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Scope
            </span>
          </div>
          <div className="text-xl font-black text-gray-900 dark:text-white">
            {getScopeLabel(formData.promotionScope)}
          </div>
        </Card>

        <Card className="p-4 border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 mb-2">
            <Percent className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Discount
            </span>
          </div>
          <div className="text-xl font-black text-gray-900 dark:text-white">
            {getHeadlinePreview(formData)}
          </div>
        </Card>

        <Card className="p-4 border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 mb-2">
            <Tags className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Coupon codes
            </span>
          </div>
          <div className="text-xl font-black text-gray-900 dark:text-white">
            {parsedCodes.length}
          </div>
        </Card>

        <Card className="p-4 border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 mb-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Targets
            </span>
          </div>
          <div className="text-xl font-black text-gray-900 dark:text-white">
            {targetCount}
          </div>
        </Card>
      </div>

      {/* C. Main Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT */}
        <div className="lg:col-span-2 space-y-6">
          {/* 1. Basic Info */}
          <Card className="border-gray-200 dark:border-gray-700 overflow-hidden !p-0">
            <div className="p-5 border-b border-gray-100 dark:border-gray-700/50 bg-gray-50/50 dark:bg-gray-800/50 flex items-center gap-2">
              <Settings2 className="w-5 h-5 text-gray-500" />
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                Thông tin campaign
              </h2>
            </div>

            <div className="p-5 space-y-6">
              <div>
                <label className="block text-sm font-bold text-gray-900 dark:text-white mb-1.5">
                  Tên campaign <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Vd: FREESHIP cuối tuần, giảm 10% đơn hàng..."
                  className={`w-full px-4 py-2.5 rounded-lg border bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
                    formErrors.name
                      ? "border-red-500 dark:border-red-500"
                      : "border-gray-300 dark:border-gray-600"
                  }`}
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5 font-medium">
                  Tên dùng để nhận diện campaign trong workspace, danh sách và
                  snapshot đơn hàng.
                </p>
                {formErrors.name && (
                  <p className="text-sm text-red-600 dark:text-red-400 mt-1.5 flex items-center gap-1">
                    <XCircle className="w-4 h-4" /> {formErrors.name}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-900 dark:text-white mb-1.5">
                  Mô tả campaign
                </label>
                <div
                  className={`rounded-lg border overflow-hidden ${
                    formErrors.description
                      ? "border-red-500"
                      : "border-gray-300 dark:border-gray-600"
                  }`}
                >
                  <RichTextEditor
                    value={formData.description || ""}
                    onChange={handleDescriptionChange}
                  />
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5 font-medium">
                  Mô tả logic khuyến mãi, lưu ý vận hành hoặc trường hợp sử
                  dụng.
                </p>
              </div>
            </div>
          </Card>

          {/* 2. Discount Logic */}
          <Card className="border-gray-200 dark:border-gray-700 overflow-hidden !p-0">
            <div className="p-5 border-b border-gray-100 dark:border-gray-700/50 bg-gray-50/50 dark:bg-gray-800/50 flex items-center gap-2">
              <TicketPercent className="w-5 h-5 text-gray-500" />
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                Logic giảm giá
              </h2>
            </div>

            <div className="p-5 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-900 dark:text-white mb-1.5">
                    Scope
                  </label>
                  <select
                    name="promotionScope"
                    value={formData.promotionScope}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                  >
                    <option value="order">Order promotion</option>
                    <option value="shipping">Shipping promotion</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-900 dark:text-white mb-1.5">
                    Discount type
                  </label>
                  <select
                    name="discountType"
                    value={formData.discountType}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-2.5 rounded-lg border ${
                      formErrors.discountType
                        ? "border-red-500"
                        : "border-gray-300 dark:border-gray-600"
                    } bg-white dark:bg-gray-900 text-gray-900 dark:text-white`}
                  >
                    <option value="percent">Percent</option>
                    <option value="fixed">Fixed amount</option>
                    <option value="free_shipping">Free shipping</option>
                  </select>
                  {formErrors.discountType && (
                    <p className="text-sm text-red-600 dark:text-red-400 mt-1.5 flex items-center gap-1">
                      <XCircle className="w-4 h-4" /> {formErrors.discountType}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-900 dark:text-white mb-1.5">
                    Giá trị giảm
                  </label>
                  <input
                    type="number"
                    min={0}
                    name="discountValue"
                    value={formData.discountValue}
                    onChange={handleInputChange}
                    disabled={formData.discountType === "free_shipping"}
                    className={`w-full px-4 py-2.5 rounded-lg border ${
                      formErrors.discountValue
                        ? "border-red-500"
                        : "border-gray-300 dark:border-gray-600"
                    } bg-white dark:bg-gray-900 text-gray-900 dark:text-white disabled:opacity-50`}
                  />
                  {formErrors.discountValue && (
                    <p className="text-sm text-red-600 dark:text-red-400 mt-1.5 flex items-center gap-1">
                      <XCircle className="w-4 h-4" /> {formErrors.discountValue}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-900 dark:text-white mb-1.5">
                    Mức giảm tối đa
                  </label>
                  <input
                    type="number"
                    min={0}
                    name="maxDiscountAmount"
                    value={formData.maxDiscountAmount}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-2.5 rounded-lg border ${
                      formErrors.maxDiscountAmount
                        ? "border-red-500"
                        : "border-gray-300 dark:border-gray-600"
                    } bg-white dark:bg-gray-900 text-gray-900 dark:text-white`}
                  />
                  {formErrors.maxDiscountAmount && (
                    <p className="text-sm text-red-600 dark:text-red-400 mt-1.5 flex items-center gap-1">
                      <XCircle className="w-4 h-4" />{" "}
                      {formErrors.maxDiscountAmount}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-900 dark:text-white mb-1.5">
                    Giá trị đơn tối thiểu
                  </label>
                  <input
                    type="number"
                    min={0}
                    name="minOrderValue"
                    value={formData.minOrderValue}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-2.5 rounded-lg border ${
                      formErrors.minOrderValue
                        ? "border-red-500"
                        : "border-gray-300 dark:border-gray-600"
                    } bg-white dark:bg-gray-900 text-gray-900 dark:text-white`}
                  />
                  {formErrors.minOrderValue && (
                    <p className="text-sm text-red-600 dark:text-red-400 mt-1.5 flex items-center gap-1">
                      <XCircle className="w-4 h-4" /> {formErrors.minOrderValue}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-900 dark:text-white mb-1.5">
                    Priority
                  </label>
                  <input
                    type="number"
                    min={0}
                    name="priority"
                    value={formData.priority}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-2.5 rounded-lg border ${
                      formErrors.priority
                        ? "border-red-500"
                        : "border-gray-300 dark:border-gray-600"
                    } bg-white dark:bg-gray-900 text-gray-900 dark:text-white`}
                  />
                  {formErrors.priority && (
                    <p className="text-sm text-red-600 dark:text-red-400 mt-1.5 flex items-center gap-1">
                      <XCircle className="w-4 h-4" /> {formErrors.priority}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-900 dark:text-white mb-1.5">
                    Tổng lượt dùng
                  </label>
                  <input
                    type="number"
                    min={0}
                    name="usageLimit"
                    value={formData.usageLimit}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-2.5 rounded-lg border ${
                      formErrors.usageLimit
                        ? "border-red-500"
                        : "border-gray-300 dark:border-gray-600"
                    } bg-white dark:bg-gray-900 text-gray-900 dark:text-white`}
                  />
                  {formErrors.usageLimit && (
                    <p className="text-sm text-red-600 dark:text-red-400 mt-1.5 flex items-center gap-1">
                      <XCircle className="w-4 h-4" /> {formErrors.usageLimit}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-900 dark:text-white mb-1.5">
                    Lượt / người
                  </label>
                  <input
                    type="number"
                    min={0}
                    name="usageLimitPerUser"
                    value={formData.usageLimitPerUser}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-2.5 rounded-lg border ${
                      formErrors.usageLimitPerUser
                        ? "border-red-500"
                        : "border-gray-300 dark:border-gray-600"
                    } bg-white dark:bg-gray-900 text-gray-900 dark:text-white`}
                  />
                  {formErrors.usageLimitPerUser && (
                    <p className="text-sm text-red-600 dark:text-red-400 mt-1.5 flex items-center gap-1">
                      <XCircle className="w-4 h-4" />{" "}
                      {formErrors.usageLimitPerUser}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-900 dark:text-white mb-1.5">
                    Trạng thái
                  </label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <label className="flex items-start gap-3 cursor-pointer rounded-xl border border-gray-200 dark:border-gray-700 p-4 hover:border-gray-300 dark:hover:border-gray-600 transition">
                  <input
                    type="checkbox"
                    name="isAutoApply"
                    checked={formData.isAutoApply}
                    onChange={handleInputChange}
                    className="mt-0.5 w-4 h-4 text-blue-600 border-gray-300 rounded"
                  />
                  <div>
                    <span className="block text-sm font-bold text-gray-900 dark:text-white">
                      Auto apply
                    </span>
                    <span className="block text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      Tự áp khi đơn đủ điều kiện mà không cần nhập mã.
                    </span>
                  </div>
                </label>

                <label className="flex items-start gap-3 cursor-pointer rounded-xl border border-gray-200 dark:border-gray-700 p-4 hover:border-gray-300 dark:hover:border-gray-600 transition">
                  <input
                    type="checkbox"
                    name="canCombine"
                    checked={formData.canCombine}
                    onChange={handleInputChange}
                    className="mt-0.5 w-4 h-4 text-blue-600 border-gray-300 rounded"
                  />
                  <div>
                    <span className="block text-sm font-bold text-gray-900 dark:text-white">
                      Cho phép kết hợp
                    </span>
                    <span className="block text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      Cho phép stack cùng promotion khác nếu business rule hỗ
                      trợ.
                    </span>
                  </div>
                </label>
              </div>
            </div>
          </Card>

          {/* 3. Time Window */}
          <Card className="border-gray-200 dark:border-gray-700 overflow-hidden !p-0">
            <div className="p-5 border-b border-gray-100 dark:border-gray-700/50 bg-gray-50/50 dark:bg-gray-800/50 flex items-center gap-2">
              <CalendarClock className="w-5 h-5 text-gray-500" />
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                Thời gian hiệu lực
              </h2>
            </div>

            <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-900 dark:text-white mb-1.5">
                  Bắt đầu
                </label>
                <input
                  type="datetime-local"
                  name="startAt"
                  value={formData.startAt}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-900 dark:text-white mb-1.5">
                  Kết thúc
                </label>
                <input
                  type="datetime-local"
                  name="endAt"
                  value={formData.endAt}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                />
              </div>
            </div>
          </Card>

          {/* 4. Codes & Targets */}
          <Card className="border-gray-200 dark:border-gray-700 overflow-hidden !p-0">
            <div className="p-5 border-b border-gray-100 dark:border-gray-700/50 bg-gray-50/50 dark:bg-gray-800/50 flex items-center gap-2">
              <Tags className="w-5 h-5 text-gray-500" />
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                Coupon codes & targets
              </h2>
            </div>

            <div className="p-5 space-y-6">
              <div>
                <label className="block text-sm font-bold text-gray-900 dark:text-white mb-1.5">
                  Coupon codes
                </label>
                <textarea
                  name="codesText"
                  value={formData.codesText}
                  onChange={(e) =>
                    setFormData((prev) =>
                      prev
                        ? {
                            ...prev,
                            codesText: e.target.value,
                          }
                        : prev,
                    )
                  }
                  rows={4}
                  placeholder="Nhập mỗi mã trên một dòng hoặc phân tách bằng dấu phẩy"
                  className={`w-full px-4 py-3 rounded-lg border ${
                    formErrors.codesText
                      ? "border-red-500"
                      : "border-gray-300 dark:border-gray-600"
                  } bg-white dark:bg-gray-900 text-gray-900 dark:text-white`}
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5 font-medium">
                  Khi lưu, danh sách mã hiện tại sẽ được thay bằng danh sách bạn
                  nhập ở đây.
                </p>
                {formErrors.codesText && (
                  <p className="text-sm text-red-600 dark:text-red-400 mt-1.5 flex items-center gap-1">
                    <XCircle className="w-4 h-4" /> {formErrors.codesText}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  {
                    key: "productIdsText",
                    label: "Product IDs",
                    placeholder: "1, 2, 3",
                  },
                  {
                    key: "categoryIdsText",
                    label: "Category IDs",
                    placeholder: "10, 12",
                  },
                  {
                    key: "variantIdsText",
                    label: "Variant IDs",
                    placeholder: "101, 102",
                  },
                  {
                    key: "originIdsText",
                    label: "Origin IDs",
                    placeholder: "5, 8",
                  },
                  {
                    key: "branchIdsText",
                    label: "Branch IDs",
                    placeholder: "1, 3",
                    full: true,
                  },
                ].map((field) => (
                  <div
                    key={field.key}
                    className={field.full ? "sm:col-span-2" : ""}
                  >
                    <label className="block text-sm font-bold text-gray-900 dark:text-white mb-1.5">
                      {field.label}
                    </label>
                    <input
                      type="text"
                      value={(formData as any)[field.key]}
                      onChange={(e) =>
                        setFormData((prev) =>
                          prev
                            ? {
                                ...prev,
                                [field.key]: e.target.value,
                              }
                            : prev,
                        )
                      }
                      placeholder={field.placeholder}
                      className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                    />
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>

        {/* RIGHT */}
        <div className="space-y-6">
          {/* Status Panel */}
          <Card className="border-gray-200 dark:border-gray-700 !p-0 overflow-hidden">
            <div className="p-4 border-b border-gray-100 dark:border-gray-700/50 bg-gray-50/50 dark:bg-gray-800/50">
              <h3 className="font-bold text-gray-900 dark:text-white">
                Tình trạng campaign
              </h3>
            </div>

            <div className="p-4 space-y-4 text-sm font-medium">
              <div className="flex justify-between items-center">
                <span className="text-gray-500 dark:text-gray-400">Health</span>
                <span
                  className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider border ${healthBadge.color}`}
                >
                  {healthBadge.label}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-gray-500 dark:text-gray-400">
                  Discount type
                </span>
                <span className="text-gray-900 dark:text-white text-right">
                  {getDiscountTypeLabel(formData.discountType)}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-gray-500 dark:text-gray-400">
                  Auto apply
                </span>
                <span
                  className={
                    formData.isAutoApply
                      ? "text-purple-600 dark:text-purple-400"
                      : "text-gray-900 dark:text-white"
                  }
                >
                  {formData.isAutoApply ? "Bật" : "Tắt"}
                </span>
              </div>

              <div className="flex justify-between items-center pt-3 border-t border-gray-100 dark:border-gray-700">
                <span className="text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                  <Clock3 className="w-4 h-4" /> Cập nhật lần cuối
                </span>
                <span className="text-gray-900 dark:text-white">
                  {formatDateTime(promotion.updatedAt)}
                </span>
              </div>
            </div>
          </Card>

          {/* Summary Panel */}
          <Card className="border-gray-200 dark:border-gray-700 !p-0 overflow-hidden">
            <div className="p-4 border-b border-gray-100 dark:border-gray-700/50 bg-gray-50/50 dark:bg-gray-800/50">
              <h3 className="font-bold text-gray-900 dark:text-white">
                Tóm tắt cấu hình
              </h3>
            </div>

            <div className="p-4 space-y-4 text-sm font-medium">
              <div className="flex justify-between items-start gap-4">
                <span className="text-gray-500 dark:text-gray-400 shrink-0">
                  Tên
                </span>
                <span className="text-gray-900 dark:text-white text-right line-clamp-2">
                  {formData.name || (
                    <span className="text-gray-400 italic">Chưa nhập</span>
                  )}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-gray-500 dark:text-gray-400">Scope</span>
                <span className="text-blue-600 dark:text-blue-400">
                  {getScopeLabel(formData.promotionScope)}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-gray-500 dark:text-gray-400">
                  Headline
                </span>
                <span className="text-gray-900 dark:text-white font-bold">
                  {getHeadlinePreview(formData)}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-gray-500 dark:text-gray-400">
                  Coupon codes
                </span>
                <span className="text-gray-900 dark:text-white">
                  {parsedCodes.length}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-gray-500 dark:text-gray-400">
                  Targets
                </span>
                <span className="text-gray-900 dark:text-white">
                  {targetCount}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-gray-500 dark:text-gray-400">
                  Min order
                </span>
                <span className="text-gray-900 dark:text-white">
                  {formData.minOrderValue !== ""
                    ? formatMoney(Number(formData.minOrderValue))
                    : "Không giới hạn"}
                </span>
              </div>
            </div>
          </Card>

          {/* Guidance Panel */}
          <Card className="border-gray-200 dark:border-gray-700 bg-amber-50/30 dark:bg-amber-900/10">
            <div className="flex items-center gap-2 mb-3 text-amber-700 dark:text-amber-500">
              <Sparkles className="w-5 h-5" />
              <h3 className="font-bold text-sm">Gợi ý vận hành</h3>
            </div>

            <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-2 list-disc pl-4">
              <li>
                Khi sửa danh sách coupon codes, backend hiện sẽ đồng bộ lại toàn
                bộ danh sách mã.
              </li>
              <li>
                Nếu campaign là <strong>auto apply</strong>, nên để phần coupon
                codes ở mức tối giản hoặc trống.
              </li>
              <li>
                Với shipping promotion, hãy ưu tiên dùng{" "}
                <strong>free shipping</strong> hoặc fixed shipping discount.
              </li>
            </ul>
          </Card>

          {/* General Error */}
          {formErrors.general && (
            <div className="p-3 bg-red-50 text-red-600 rounded-lg border border-red-200 text-sm flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />{" "}
              {formErrors.general}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PromotionEditPage;
