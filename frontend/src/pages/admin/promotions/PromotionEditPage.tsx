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
  ListChecks,
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
type ReviewLevel = "ready" | "warning" | "danger";

interface ReviewNote {
  level: "info" | "warning" | "danger";
  text: string;
}

interface PromotionTargetOption {
  id: number;
  label: string;
  subLabel?: string;
}

interface PromotionCodeDraft {
  localId: string;
  code: string;
  status: PromotionStatus;
  usageLimit: number | "";
  startAt: string;
  endAt: string;
}

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

  codesDraftText: string;
  couponCodes: PromotionCodeDraft[];

  selectedProducts: PromotionTargetOption[];
  selectedCategories: PromotionTargetOption[];
  selectedVariants: PromotionTargetOption[];
  selectedOrigins: PromotionTargetOption[];
  selectedBranches: PromotionTargetOption[];
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

const makeLocalId = () =>
  `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const normalizeCouponCode = (value: string) =>
  String(value || "")
    .trim()
    .toUpperCase();

const dedupeById = (items: PromotionTargetOption[]) => {
  const map = new Map<number, PromotionTargetOption>();
  for (const item of items) {
    map.set(item.id, item);
  }
  return Array.from(map.values());
};

const filterTargetOptions = (
  items: PromotionTargetOption[],
  keyword: string,
): PromotionTargetOption[] => {
  const q = keyword.trim().toLowerCase();
  if (!q) return items;
  return items.filter((item) => {
    const label = item.label.toLowerCase();
    const sub = String(item.subLabel || "").toLowerCase();
    return label.includes(q) || sub.includes(q);
  });
};

const formatDateTimeCompact = (value?: string | null) => {
  if (!value) return "Chưa đặt";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "Không hợp lệ";
  return d.toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const buildTargetSummary = (form: PromotionFormData) => {
  const parts: string[] = [];

  if (form.selectedProducts.length) {
    parts.push(`${form.selectedProducts.length} sản phẩm`);
  }
  if (form.selectedCategories.length) {
    parts.push(`${form.selectedCategories.length} danh mục`);
  }
  if (form.selectedVariants.length) {
    parts.push(`${form.selectedVariants.length} biến thể`);
  }
  if (form.selectedOrigins.length) {
    parts.push(`${form.selectedOrigins.length} nguồn gốc`);
  }
  if (form.selectedBranches.length) {
    parts.push(`${form.selectedBranches.length} chi nhánh`);
  }

  if (!parts.length) return "Áp dụng toàn phạm vi";
  return `Áp dụng cho ${parts.join(" + ")}`;
};

const makeFormFromPromotion = (
  promotion: Promotion,
  refs: {
    products: PromotionTargetOption[];
    categories: PromotionTargetOption[];
    variants: PromotionTargetOption[];
    origins: PromotionTargetOption[];
    branches: PromotionTargetOption[];
  },
): PromotionFormData => ({
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

  codesDraftText: "",
  couponCodes: Array.isArray(promotion.codes)
    ? promotion.codes
        .filter((c) => !c.deleted)
        .map((c) => ({
          localId: String(c.id ?? c.code),
          code: c.code,
          status: c.status,
          usageLimit:
            c.usageLimit !== null && c.usageLimit !== undefined
              ? Number(c.usageLimit)
              : "",
          startAt: formatDateTimeLocalValue(c.startAt),
          endAt: formatDateTimeLocalValue(c.endAt),
        }))
    : [],

  selectedProducts: refs.products.filter((x) =>
    promotion.targets?.productIds?.includes(x.id),
  ),
  selectedCategories: refs.categories.filter((x) =>
    promotion.targets?.categoryIds?.includes(x.id),
  ),
  selectedVariants: refs.variants.filter((x) =>
    promotion.targets?.variantIds?.includes(x.id),
  ),
  selectedOrigins: refs.origins.filter((x) =>
    promotion.targets?.originIds?.includes(x.id),
  ),
  selectedBranches: refs.branches.filter((x) =>
    promotion.targets?.branchIds?.includes(x.id),
  ),
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
  const [initialFormData, setInitialFormData] =
    useState<PromotionFormData | null>(null);
  const [formData, setFormData] = useState<PromotionFormData | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [fetchError, setFetchError] = useState("");
  const [formErrors, setFormErrors] = useState<
    Partial<Record<keyof PromotionFormData | "general", string>>
  >({});

  const [branchOptions, setBranchOptions] = useState<PromotionTargetOption[]>(
    [],
  );
  const [categoryOptions, setCategoryOptions] = useState<
    PromotionTargetOption[]
  >([]);
  const [originOptions, setOriginOptions] = useState<PromotionTargetOption[]>(
    [],
  );
  const [productOptions, setProductOptions] = useState<PromotionTargetOption[]>(
    [],
  );
  const [variantOptions, setVariantOptions] = useState<PromotionTargetOption[]>(
    [],
  );
  const [referencesLoading, setReferencesLoading] = useState(false);

  const [branchSearch, setBranchSearch] = useState("");
  const [categorySearch, setCategorySearch] = useState("");
  const [originSearch, setOriginSearch] = useState("");
  const [productSearch, setProductSearch] = useState("");
  const [variantSearch, setVariantSearch] = useState("");

  const [productSelectorOpen, setProductSelectorOpen] = useState(false);
  const [variantSelectorOpen, setVariantSelectorOpen] = useState(false);

  // --- Fetch Data ---
  const bootstrapEditPage = async () => {
    try {
      setLoading(true);
      setFetchError("");
      setReferencesLoading(true);

      const [branchRes, categoryRes, originRes, productRes, detailRes] =
        await Promise.all([
          http<any>("GET", "/api/v1/admin/branches?limit=1000"),
          http<any>("GET", "/api/v1/admin/product-category?limit=1000"),
          http<any>(
            "GET",
            "/api/v1/admin/origins?limit=1000&sortBy=position&order=ASC",
          ),
          http<any>("GET", "/api/v1/admin/products?page=1&limit=200"),
          http<ApiDetail<Promotion>>("GET", `/api/v1/admin/promotions/${id}`),
        ]);

      const mappedBranches = Array.isArray(branchRes?.data)
        ? branchRes.data.map((row: any) => ({
            id: Number(row.id),
            label: row.name,
            subLabel: [
              row.code,
              row.status === "active" ? "Hoạt động" : "Tạm dừng",
            ]
              .filter(Boolean)
              .join(" • "),
          }))
        : [];

      const mappedCategories = Array.isArray(categoryRes?.data)
        ? categoryRes.data.map((row: any) => ({
            id: Number(row.id),
            label: row.title,
            subLabel: row.parent_id ? "Danh mục con" : "Danh mục gốc",
          }))
        : [];

      const mappedOrigins = Array.isArray(originRes?.data)
        ? originRes.data.map((row: any) => ({
            id: Number(row.id),
            label: row.name,
            subLabel: row.country_code || row.countryCode || "",
          }))
        : [];

      const rawProducts = Array.isArray(productRes?.data)
        ? productRes.data
        : [];

      const mappedProducts = rawProducts.map((row: any) => ({
        id: Number(row.id),
        label: row.title,
        subLabel:
          row.category?.title ||
          row.category_name ||
          row.slug ||
          `Product #${row.id}`,
      }));

      const mappedVariants = rawProducts.flatMap((row: any) =>
        Array.isArray(row.variants)
          ? row.variants.map((variant: any) => ({
              id: Number(variant.id),
              label: variant.title || variant.sku || `Variant #${variant.id}`,
              subLabel: row.title,
            }))
          : [],
      );

      setBranchOptions(mappedBranches);
      setCategoryOptions(mappedCategories);
      setOriginOptions(mappedOrigins);
      setProductOptions(mappedProducts);
      setVariantOptions(mappedVariants);

      if (detailRes?.success && detailRes.data) {
        setPromotion(detailRes.data);

        const initialForm = makeFormFromPromotion(detailRes.data, {
          products: mappedProducts,
          categories: mappedCategories,
          variants: mappedVariants,
          origins: mappedOrigins,
          branches: mappedBranches,
        });

        setFormData(initialForm);
        setInitialFormData(initialForm);
      } else {
        setFetchError("Không tìm thấy dữ liệu campaign.");
      }
    } catch (err: any) {
      setFetchError(err?.message || "Lỗi kết nối server.");
    } finally {
      setReferencesLoading(false);
      setLoading(false);
    }
  };

  useEffect(() => {
    bootstrapEditPage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // --- Derived Data ---
  const health = useMemo(() => getHealthStatus(promotion), [promotion]);
  const healthBadge = useMemo(() => getHealthBadge(health), [health]);

  const normalizedCodes = useMemo(() => {
    if (!formData) return [];
    return formData.couponCodes
      .map((item) => ({
        code: normalizeCouponCode(item.code),
        status: item.status,
        usageLimit:
          item.usageLimit === "" || item.usageLimit === undefined
            ? null
            : Number(item.usageLimit),
        startAt: item.startAt ? new Date(item.startAt).toISOString() : null,
        endAt: item.endAt ? new Date(item.endAt).toISOString() : null,
      }))
      .filter((item) => item.code);
  }, [formData?.couponCodes]);

  const targetIds = useMemo(() => {
    if (!formData)
      return {
        productIds: [],
        categoryIds: [],
        variantIds: [],
        originIds: [],
        branchIds: [],
      };
    return {
      productIds: formData.selectedProducts.map((x) => x.id),
      categoryIds: formData.selectedCategories.map((x) => x.id),
      variantIds: formData.selectedVariants.map((x) => x.id),
      originIds: formData.selectedOrigins.map((x) => x.id),
      branchIds: formData.selectedBranches.map((x) => x.id),
    };
  }, [formData]);

  const targetCount = useMemo(() => {
    if (!formData) return 0;
    return (
      formData.selectedProducts.length +
      formData.selectedCategories.length +
      formData.selectedVariants.length +
      formData.selectedOrigins.length +
      formData.selectedBranches.length
    );
  }, [formData]);

  const applicationModeLabel = useMemo(() => {
    if (!formData) return "—";
    if (formData.isAutoApply && normalizedCodes.length > 0) {
      return "Auto apply + coupon codes";
    }
    if (formData.isAutoApply) return "Auto apply";
    return normalizedCodes.length > 0 ? "Code-based" : "Chưa rõ cơ chế";
  }, [formData, normalizedCodes.length]);

  const targetSummary = useMemo(() => {
    if (!formData) return "—";
    return buildTargetSummary(formData);
  }, [formData]);

  const reviewNotes = useMemo<ReviewNote[]>(() => {
    if (!formData) return [];

    const notes: ReviewNote[] = [];

    const hasAnyTarget =
      formData.selectedProducts.length > 0 ||
      formData.selectedCategories.length > 0 ||
      formData.selectedVariants.length > 0 ||
      formData.selectedOrigins.length > 0 ||
      formData.selectedBranches.length > 0;

    const discountValue = Number(formData.discountValue || 0);
    const maxDiscountAmount = parseNumberOrNull(formData.maxDiscountAmount);
    const minOrderValue = parseNumberOrNull(formData.minOrderValue);
    const usageLimit = parseNumberOrNull(formData.usageLimit);

    if (!formData.name.trim()) {
      notes.push({
        level: "danger",
        text: "Campaign chưa có tên rõ ràng.",
      });
    }

    if (
      formData.discountType === "free_shipping" &&
      formData.promotionScope !== "shipping"
    ) {
      notes.push({
        level: "danger",
        text: "Free shipping chỉ phù hợp với shipping promotion.",
      });
    }

    if (!formData.isAutoApply && normalizedCodes.length === 0) {
      notes.push({
        level: "danger",
        text: "Campaign nhập mã nhưng hiện chưa có coupon code hợp lệ.",
      });
    }

    if (
      formData.startAt &&
      formData.endAt &&
      new Date(formData.startAt) > new Date(formData.endAt)
    ) {
      notes.push({
        level: "danger",
        text: "Khoảng thời gian chạy không hợp lệ: thời điểm bắt đầu đang sau thời điểm kết thúc.",
      });
    }

    if (
      formData.discountType === "percent" &&
      discountValue > 0 &&
      maxDiscountAmount === null
    ) {
      notes.push({
        level: "warning",
        text: "Khuyến mãi phần trăm chưa có mức giảm tối đa, cần kiểm tra rủi ro với đơn hàng lớn.",
      });
    }

    if (formData.discountType === "free_shipping" && minOrderValue === null) {
      notes.push({
        level: "warning",
        text: "Freeship chưa có giá trị đơn tối thiểu, có thể áp dụng quá rộng.",
      });
    }

    if (!hasAnyTarget) {
      notes.push({
        level: "warning",
        text: "Campaign hiện chưa giới hạn target, có thể áp toàn catalog/toàn hệ thống.",
      });
    }

    if (
      formData.selectedProducts.length > 0 &&
      formData.selectedVariants.length > 0 &&
      formData.selectedCategories.length > 0
    ) {
      notes.push({
        level: "warning",
        text: "Bạn đang target đồng thời product + variant + category. Nên rà lại để tránh chồng chéo phạm vi.",
      });
    }

    if (
      formData.promotionScope === "shipping" &&
      formData.selectedBranches.length === 0
    ) {
      notes.push({
        level: "warning",
        text: "Shipping promotion chưa giới hạn chi nhánh, nên kiểm tra lại phạm vi triển khai.",
      });
    }

    if (formData.isAutoApply && normalizedCodes.length > 0) {
      notes.push({
        level: "info",
        text: "Campaign đang bật auto apply nhưng vẫn có coupon codes. Hãy chắc rằng người vận hành hiểu rõ cơ chế dùng.",
      });
    }

    if (!formData.startAt && formData.status === "active") {
      notes.push({
        level: "info",
        text: "Campaign đang để active nhưng chưa có thời gian bắt đầu cụ thể.",
      });
    }

    if (usageLimit !== null && usageLimit === 0) {
      notes.push({
        level: "warning",
        text: "Giới hạn sử dụng đang bằng 0, campaign có thể không vận hành đúng kỳ vọng.",
      });
    }

    if (notes.length === 0) {
      notes.push({
        level: "info",
        text: "Cấu hình hiện tại trông hợp lý để tiếp tục lưu và publish.",
      });
    }

    return notes;
  }, [formData, normalizedCodes]);

  const reviewLevel = useMemo<ReviewLevel>(() => {
    if (reviewNotes.some((note) => note.level === "danger")) return "danger";
    if (reviewNotes.some((note) => note.level === "warning")) return "warning";
    return "ready";
  }, [reviewNotes]);

  const reviewLevelUi = useMemo(() => {
    if (reviewLevel === "danger") {
      return {
        label: "Cần sửa trước khi publish",
        chip: "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400",
        box: "bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800/40",
      };
    }

    if (reviewLevel === "warning") {
      return {
        label: "Nên rà soát trước khi publish",
        chip: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400",
        box: "bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800/40",
      };
    }

    return {
      label: "Sẵn sàng để publish",
      chip: "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400",
      box: "bg-emerald-50 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-800/40",
    };
  }, [reviewLevel]);

  const filteredBranchOptions = useMemo(
    () => filterTargetOptions(branchOptions, branchSearch),
    [branchOptions, branchSearch],
  );

  const filteredCategoryOptions = useMemo(
    () => filterTargetOptions(categoryOptions, categorySearch),
    [categoryOptions, categorySearch],
  );

  const filteredOriginOptions = useMemo(
    () => filterTargetOptions(originOptions, originSearch),
    [originOptions, originSearch],
  );

  const filteredProductOptions = useMemo(
    () => filterTargetOptions(productOptions, productSearch),
    [productOptions, productSearch],
  );

  const filteredVariantOptions = useMemo(
    () => filterTargetOptions(variantOptions, variantSearch),
    [variantOptions, variantSearch],
  );

  const isDirty = useMemo(() => {
    if (!initialFormData || !formData) return false;
    return JSON.stringify(initialFormData) !== JSON.stringify(formData);
  }, [initialFormData, formData]);

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

  const addCodesFromDraftText = () => {
    if (!formData) return;
    const raw = formData.codesDraftText;
    if (!raw.trim()) return;

    const nextCodes = raw
      .split(/[,\n]/g)
      .map((x) => normalizeCouponCode(x))
      .filter(Boolean)
      .map(
        (code): PromotionCodeDraft => ({
          localId: makeLocalId(),
          code,
          status: "active",
          usageLimit: "",
          startAt: "",
          endAt: "",
        }),
      );

    setFormData((prev) => {
      if (!prev) return prev;
      const merged = [...prev.couponCodes, ...nextCodes];
      const dedupedMap = new Map<string, PromotionCodeDraft>();

      for (const item of merged) {
        const normalized = normalizeCouponCode(item.code);
        if (!normalized) continue;
        if (!dedupedMap.has(normalized)) {
          dedupedMap.set(normalized, { ...item, code: normalized });
        }
      }

      return {
        ...prev,
        couponCodes: Array.from(dedupedMap.values()),
        codesDraftText: "",
      };
    });
  };

  const updateCouponCode = (
    localId: string,
    patch: Partial<PromotionCodeDraft>,
  ) => {
    setFormData((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        couponCodes: prev.couponCodes.map((item) =>
          item.localId === localId ? { ...item, ...patch } : item,
        ),
      };
    });
  };

  const removeCouponCode = (localId: string) => {
    setFormData((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        couponCodes: prev.couponCodes.filter(
          (item) => item.localId !== localId,
        ),
      };
    });
  };

  const toggleTargetSelection = (
    field:
      | "selectedProducts"
      | "selectedCategories"
      | "selectedVariants"
      | "selectedOrigins"
      | "selectedBranches",
    option: PromotionTargetOption,
  ) => {
    setFormData((prev) => {
      if (!prev) return prev;
      const exists = prev[field].some((item) => item.id === option.id);
      const next = exists
        ? prev[field].filter((item) => item.id !== option.id)
        : dedupeById([...prev[field], option]);

      return {
        ...prev,
        [field]: next,
      };
    });
  };

  const removeTargetById = (
    field:
      | "selectedProducts"
      | "selectedCategories"
      | "selectedVariants"
      | "selectedOrigins"
      | "selectedBranches",
    id: number,
  ) => {
    setFormData((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        [field]: prev[field].filter((item) => item.id !== id),
      };
    });
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

    if (!formData.isAutoApply && normalizedCodes.length === 0) {
      nextErrors.general =
        "Nếu không bật auto apply, bạn nên có ít nhất một coupon code hợp lệ.";
    }

    const codeSet = new Set<string>();
    for (const code of normalizedCodes) {
      if (codeSet.has(code.code)) {
        nextErrors.general = `Coupon code bị trùng: ${code.code}`;
        break;
      }
      codeSet.add(code.code);
    }

    for (const code of formData.couponCodes) {
      if (
        code.startAt &&
        code.endAt &&
        new Date(code.startAt) > new Date(code.endAt)
      ) {
        nextErrors.general = `Khoảng thời gian của mã ${code.code || "(chưa nhập)"} không hợp lệ.`;
        break;
      }
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
        codes: normalizedCodes.map((item) => ({
          code: item.code,
          status: item.status,
          usageLimit: item.usageLimit,
          startAt: item.startAt,
          endAt: item.endAt,
        })),
        productIds: targetIds.productIds,
        categoryIds: targetIds.categoryIds,
        variantIds: targetIds.variantIds,
        originIds: targetIds.originIds,
        branchIds: targetIds.branchIds,
      };

      const res = await http<ApiOk>(
        "PUT",
        `/api/v1/admin/promotions/${id}`,
        payload,
      );

      if (res?.success) {
        showSuccessToast({ message: "Lưu campaign thành công!" });
        await bootstrapEditPage();
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
        await bootstrapEditPage();
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
            onClick={bootstrapEditPage}
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
            {normalizedCodes.length}
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
          <Card className="!p-0 overflow-hidden border-gray-200 dark:border-gray-700">
            <div className="p-5 border-b border-gray-100 dark:border-gray-700/50 bg-gray-50/50 dark:bg-gray-800/50 flex items-center gap-2">
              <ListChecks className="w-5 h-5 text-gray-500" />
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                Coupon codes & targets
              </h2>
            </div>

            <div className="p-5 space-y-8">
              {/* Coupon codes manager */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-gray-900 dark:text-white mb-1.5">
                    Coupon codes
                  </label>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <textarea
                      value={formData.codesDraftText}
                      onChange={(e) =>
                        setFormData((prev) =>
                          prev
                            ? {
                                ...prev,
                                codesDraftText: e.target.value,
                              }
                            : prev,
                        )
                      }
                      placeholder="Bulk paste mã, mỗi dòng một mã hoặc ngăn cách bằng dấu phẩy"
                      rows={4}
                      className="flex-1 px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                    />
                    <div className="sm:w-44 flex flex-col gap-2">
                      <button
                        type="button"
                        onClick={addCodesFromDraftText}
                        className="px-4 py-2.5 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition"
                      >
                        Thêm mã
                      </button>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {formData.isAutoApply
                          ? "Auto apply đang bật, có thể để trống."
                          : "Campaign nhập mã nên có ít nhất một code."}
                      </p>
                    </div>
                  </div>
                </div>

                {formData.couponCodes.length > 0 && (
                  <div className="space-y-3">
                    {formData.couponCodes.map((item) => (
                      <div
                        key={item.localId}
                        className="grid grid-cols-1 md:grid-cols-12 gap-4 p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900"
                      >
                        <div className="md:col-span-3">
                          <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                            Code
                          </label>
                          <input
                            type="text"
                            value={item.code}
                            onChange={(e) =>
                              updateCouponCode(item.localId, {
                                code: normalizeCouponCode(e.target.value),
                              })
                            }
                            className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                          />
                        </div>

                        <div className="md:col-span-2">
                          <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                            Status
                          </label>
                          <select
                            value={item.status}
                            onChange={(e) =>
                              updateCouponCode(item.localId, {
                                status: e.target.value as PromotionStatus,
                              })
                            }
                            className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                          >
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                          </select>
                        </div>

                        <div className="md:col-span-2">
                          <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                            Usage limit
                          </label>
                          <input
                            type="number"
                            min={0}
                            value={item.usageLimit}
                            onChange={(e) =>
                              updateCouponCode(item.localId, {
                                usageLimit:
                                  e.target.value === ""
                                    ? ""
                                    : Number(e.target.value),
                              })
                            }
                            className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                          />
                        </div>

                        <div className="md:col-span-2">
                          <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                            Start
                          </label>
                          <input
                            type="datetime-local"
                            value={item.startAt}
                            onChange={(e) =>
                              updateCouponCode(item.localId, {
                                startAt: e.target.value,
                              })
                            }
                            className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                          />
                        </div>

                        <div className="md:col-span-2 w-full">
                          <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                            End
                          </label>
                          <div className="flex gap-2">
                            <input
                              type="datetime-local"
                              value={item.endAt}
                              onChange={(e) =>
                                updateCouponCode(item.localId, {
                                  endAt: e.target.value,
                                })
                              }
                              className="w-full flex-1 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                            />
                            <button
                              type="button"
                              onClick={() => removeCouponCode(item.localId)}
                              className="px-3 py-2 rounded-lg text-red-600 hover:text-red-300"
                            >
                              X
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Dictionary targets */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Categories */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <label className="block text-sm font-bold text-gray-900 dark:text-white">
                      Categories
                    </label>
                    <span className="text-xs font-semibold text-gray-500">
                      {formData.selectedCategories.length} đã chọn
                    </span>
                  </div>
                  <input
                    type="text"
                    value={categorySearch}
                    onChange={(e) => setCategorySearch(e.target.value)}
                    placeholder="Tìm category..."
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900"
                  />
                  <div className="max-h-48 overflow-auto rounded-xl border border-gray-200 dark:border-gray-700 p-2 space-y-1">
                    {filteredCategoryOptions.map((item) => {
                      const checked = formData.selectedCategories.some(
                        (x) => x.id === item.id,
                      );
                      return (
                        <label
                          key={item.id}
                          className="flex items-start gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() =>
                              toggleTargetSelection("selectedCategories", item)
                            }
                            className="mt-1"
                          />
                          <div>
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {item.label}
                            </div>
                            {item.subLabel && (
                              <div className="text-xs text-gray-500">
                                {item.subLabel}
                              </div>
                            )}
                          </div>
                        </label>
                      );
                    })}
                  </div>
                  {formData.selectedCategories.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {formData.selectedCategories.map((item) => (
                        <span
                          key={item.id}
                          className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-xs font-semibold"
                        >
                          {item.label}
                          <button
                            type="button"
                            onClick={() =>
                              removeTargetById("selectedCategories", item.id)
                            }
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Origins */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <label className="block text-sm font-bold text-gray-900 dark:text-white">
                      Origins
                    </label>
                    <span className="text-xs font-semibold text-gray-500">
                      {formData.selectedOrigins.length} đã chọn
                    </span>
                  </div>
                  <input
                    type="text"
                    value={originSearch}
                    onChange={(e) => setOriginSearch(e.target.value)}
                    placeholder="Tìm origin..."
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900"
                  />
                  <div className="max-h-48 overflow-auto rounded-xl border border-gray-200 dark:border-gray-700 p-2 space-y-1">
                    {filteredOriginOptions.map((item) => {
                      const checked = formData.selectedOrigins.some(
                        (x) => x.id === item.id,
                      );
                      return (
                        <label
                          key={item.id}
                          className="flex items-start gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() =>
                              toggleTargetSelection("selectedOrigins", item)
                            }
                            className="mt-1"
                          />
                          <div>
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {item.label}
                            </div>
                            {item.subLabel && (
                              <div className="text-xs text-gray-500">
                                {item.subLabel}
                              </div>
                            )}
                          </div>
                        </label>
                      );
                    })}
                  </div>
                  {formData.selectedOrigins.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {formData.selectedOrigins.map((item) => (
                        <span
                          key={item.id}
                          className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold"
                        >
                          {item.label}
                          <button
                            type="button"
                            onClick={() =>
                              removeTargetById("selectedOrigins", item.id)
                            }
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Branches full row */}
                <div className="lg:col-span-2 space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <label className="block text-sm font-bold text-gray-900 dark:text-white">
                      Branches
                    </label>
                    <span className="text-xs font-semibold text-gray-500">
                      {formData.selectedBranches.length} đã chọn
                    </span>
                  </div>
                  <input
                    type="text"
                    value={branchSearch}
                    onChange={(e) => setBranchSearch(e.target.value)}
                    placeholder="Tìm branch..."
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900"
                  />
                  <div className="max-h-52 overflow-auto rounded-xl border border-gray-200 dark:border-gray-700 p-2 grid grid-cols-1 md:grid-cols-2 gap-2">
                    {filteredBranchOptions.map((item) => {
                      const checked = formData.selectedBranches.some(
                        (x) => x.id === item.id,
                      );
                      return (
                        <label
                          key={item.id}
                          className="flex items-start gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() =>
                              toggleTargetSelection("selectedBranches", item)
                            }
                            className="mt-1"
                          />
                          <div>
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {item.label}
                            </div>
                            {item.subLabel && (
                              <div className="text-xs text-gray-500">
                                {item.subLabel}
                              </div>
                            )}
                          </div>
                        </label>
                      );
                    })}
                  </div>
                  {formData.selectedBranches.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {formData.selectedBranches.map((item) => (
                        <span
                          key={item.id}
                          className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-purple-50 text-purple-700 border border-purple-200 text-xs font-semibold"
                        >
                          {item.label}
                          <button
                            type="button"
                            onClick={() =>
                              removeTargetById("selectedBranches", item.id)
                            }
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Product / Variant selectors */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="block text-sm font-bold text-gray-900 dark:text-white">
                      Products
                    </label>
                    <button
                      type="button"
                      onClick={() => setProductSelectorOpen((prev) => !prev)}
                      className="text-sm font-semibold text-blue-600"
                    >
                      {productSelectorOpen
                        ? "Đóng danh sách"
                        : "Mở danh sách chọn"}
                    </button>
                  </div>

                  {productSelectorOpen && (
                    <>
                      <input
                        type="text"
                        value={productSearch}
                        onChange={(e) => setProductSearch(e.target.value)}
                        placeholder="Tìm sản phẩm..."
                        className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900"
                      />
                      <div className="max-h-64 overflow-auto rounded-xl border border-gray-200 dark:border-gray-700 p-2 space-y-1">
                        {filteredProductOptions.map((item) => {
                          const checked = formData.selectedProducts.some(
                            (x) => x.id === item.id,
                          );
                          return (
                            <label
                              key={item.id}
                              className="flex items-start gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
                            >
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() =>
                                  toggleTargetSelection(
                                    "selectedProducts",
                                    item,
                                  )
                                }
                                className="mt-1"
                              />
                              <div>
                                <div className="text-sm font-medium text-gray-900 dark:text-white">
                                  {item.label}
                                </div>
                                {item.subLabel && (
                                  <div className="text-xs text-gray-500">
                                    {item.subLabel}
                                  </div>
                                )}
                              </div>
                            </label>
                          );
                        })}
                      </div>
                    </>
                  )}

                  {formData.selectedProducts.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {formData.selectedProducts.map((item) => (
                        <span
                          key={item.id}
                          className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-gray-100 text-gray-700 border border-gray-200 text-xs font-semibold"
                        >
                          {item.label}
                          <button
                            type="button"
                            onClick={() =>
                              removeTargetById("selectedProducts", item.id)
                            }
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="block text-sm font-bold text-gray-900 dark:text-white">
                      Variants
                    </label>
                    <button
                      type="button"
                      onClick={() => setVariantSelectorOpen((prev) => !prev)}
                      className="text-sm font-semibold text-blue-600"
                    >
                      {variantSelectorOpen
                        ? "Đóng danh sách"
                        : "Mở danh sách chọn"}
                    </button>
                  </div>

                  {variantSelectorOpen && (
                    <>
                      <input
                        type="text"
                        value={variantSearch}
                        onChange={(e) => setVariantSearch(e.target.value)}
                        placeholder="Tìm variant..."
                        className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900"
                      />
                      <div className="max-h-64 overflow-auto rounded-xl border border-gray-200 dark:border-gray-700 p-2 space-y-1">
                        {filteredVariantOptions.map((item) => {
                          const checked = formData.selectedVariants.some(
                            (x) => x.id === item.id,
                          );
                          return (
                            <label
                              key={item.id}
                              className="flex items-start gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
                            >
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() =>
                                  toggleTargetSelection(
                                    "selectedVariants",
                                    item,
                                  )
                                }
                                className="mt-1"
                              />
                              <div>
                                <div className="text-sm font-medium text-gray-900 dark:text-white">
                                  {item.label}
                                </div>
                                {item.subLabel && (
                                  <div className="text-xs text-gray-500">
                                    {item.subLabel}
                                  </div>
                                )}
                              </div>
                            </label>
                          );
                        })}
                      </div>
                    </>
                  )}

                  {formData.selectedVariants.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {formData.selectedVariants.map((item) => (
                        <span
                          key={item.id}
                          className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-xs font-semibold"
                        >
                          {item.label}
                          <button
                            type="button"
                            onClick={() =>
                              removeTargetById("selectedVariants", item.id)
                            }
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {referencesLoading && (
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Đang tải dữ liệu tham chiếu để chọn target...
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* RIGHT */}
        <div className="space-y-6">
          {/* Status Panel */}
          <Card className="border-gray-200 dark:border-gray-700 !p-0 overflow-hidden">
            <div className="p-4 border-b border-gray-100 dark:border-gray-700/50 bg-gray-50/50 dark:bg-gray-800/50 flex items-center justify-between gap-3">
              <div>
                <h3 className="font-bold text-gray-900 dark:text-white">
                  Publish readiness
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  Độ sẵn sàng trước khi lưu/publish campaign
                </p>
              </div>

              <span
                className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border ${reviewLevelUi.chip}`}
              >
                {reviewLevelUi.label}
              </span>
            </div>

            <div className="p-4 space-y-4 text-sm font-medium">
              <div className="flex justify-between items-center">
                <span className="text-gray-500 dark:text-gray-400">
                  Health hiện tại
                </span>
                <span
                  className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider border ${healthBadge.color}`}
                >
                  {healthBadge.label}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-gray-500 dark:text-gray-400">
                  Auto apply
                </span>
                <span
                  className={
                    formData.isAutoApply
                      ? "text-purple-600 dark:text-purple-400 font-semibold"
                      : "text-gray-900 dark:text-white font-semibold"
                  }
                >
                  {formData.isAutoApply ? "Bật" : "Tắt"}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-gray-500 dark:text-gray-400">
                  Có thay đổi chưa lưu
                </span>
                <span
                  className={
                    isDirty
                      ? "text-amber-600 dark:text-amber-400 font-semibold"
                      : "text-emerald-600 dark:text-emerald-400 font-semibold"
                  }
                >
                  {isDirty ? "Có" : "Không"}
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
                Pre-publish review
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Tóm tắt nghiệp vụ trước khi lưu hoặc publish
              </p>
            </div>

            <div className="p-4 space-y-5 text-sm">
              {/* 1. Campaign snapshot */}
              <div className="space-y-3">
                <div className="text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  1. Snapshot
                </div>

                <div className="flex justify-between items-start gap-4">
                  <span className="text-gray-500 dark:text-gray-400 shrink-0">
                    Tên
                  </span>
                  <span className="text-gray-900 dark:text-white text-right line-clamp-2 font-semibold">
                    {formData.name || (
                      <span className="text-gray-400 italic">Chưa nhập</span>
                    )}
                  </span>
                </div>

                <div className="flex justify-between items-center gap-4">
                  <span className="text-gray-500 dark:text-gray-400">
                    Loại promotion
                  </span>
                  <span className="text-blue-600 dark:text-blue-400 text-right font-semibold">
                    {getScopeLabel(formData.promotionScope)}
                  </span>
                </div>

                <div className="flex justify-between items-center gap-4">
                  <span className="text-gray-500 dark:text-gray-400">
                    Discount type
                  </span>
                  <span className="text-gray-900 dark:text-white text-right font-semibold">
                    {getDiscountTypeLabel(formData.discountType)}
                  </span>
                </div>

                <div className="flex justify-between items-center gap-4">
                  <span className="text-gray-500 dark:text-gray-400">
                    Mức giảm thực tế
                  </span>
                  <span className="text-gray-900 dark:text-white font-bold text-right">
                    {getHeadlinePreview(formData)}
                  </span>
                </div>

                <div className="flex justify-between items-center gap-4">
                  <span className="text-gray-500 dark:text-gray-400">
                    Cơ chế áp dụng
                  </span>
                  <span className="text-gray-900 dark:text-white text-right font-semibold">
                    {applicationModeLabel}
                  </span>
                </div>
              </div>

              {/* 2. Applies to */}
              <div className="pt-4 border-t border-gray-100 dark:border-gray-700/50 space-y-3">
                <div className="text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  2. Applies to
                </div>

                <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/70 dark:bg-gray-900/40 p-3 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500 dark:text-gray-400">
                      Target count
                    </span>
                    <span className="font-bold text-gray-900 dark:text-white">
                      {targetCount}
                    </span>
                  </div>

                  <div className="text-xs leading-relaxed text-gray-700 dark:text-gray-300">
                    {targetSummary}
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="flex justify-between gap-2">
                      <span className="text-gray-500">Products</span>
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {formData.selectedProducts.length}
                      </span>
                    </div>
                    <div className="flex justify-between gap-2">
                      <span className="text-gray-500">Categories</span>
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {formData.selectedCategories.length}
                      </span>
                    </div>
                    <div className="flex justify-between gap-2">
                      <span className="text-gray-500">Variants</span>
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {formData.selectedVariants.length}
                      </span>
                    </div>
                    <div className="flex justify-between gap-2">
                      <span className="text-gray-500">Origins</span>
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {formData.selectedOrigins.length}
                      </span>
                    </div>
                    <div className="flex justify-between gap-2 col-span-2">
                      <span className="text-gray-500">Branches</span>
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {formData.selectedBranches.length}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 3. Runtime */}
              <div className="pt-4 border-t border-gray-100 dark:border-gray-700/50 space-y-3">
                <div className="text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  3. Runtime
                </div>

                <div className="space-y-2.5">
                  <div className="flex justify-between items-center gap-4">
                    <span className="text-gray-500 dark:text-gray-400">
                      Trạng thái
                    </span>
                    <span className="text-gray-900 dark:text-white font-semibold">
                      {formData.status === "active" ? "Active" : "Inactive"}
                    </span>
                  </div>

                  <div className="flex justify-between items-center gap-4">
                    <span className="text-gray-500 dark:text-gray-400">
                      Bắt đầu
                    </span>
                    <span className="text-gray-900 dark:text-white text-right font-semibold">
                      {formatDateTimeCompact(formData.startAt)}
                    </span>
                  </div>

                  <div className="flex justify-between items-center gap-4">
                    <span className="text-gray-500 dark:text-gray-400">
                      Kết thúc
                    </span>
                    <span className="text-gray-900 dark:text-white text-right font-semibold">
                      {formatDateTimeCompact(formData.endAt)}
                    </span>
                  </div>

                  <div className="flex justify-between items-center gap-4">
                    <span className="text-gray-500 dark:text-gray-400">
                      Coupon codes
                    </span>
                    <span className="text-gray-900 dark:text-white font-semibold">
                      {normalizedCodes.length}
                    </span>
                  </div>

                  <div className="flex justify-between items-center gap-4">
                    <span className="text-gray-500 dark:text-gray-400">
                      Tổng lượt dùng
                    </span>
                    <span className="text-gray-900 dark:text-white font-semibold">
                      {formData.usageLimit !== ""
                        ? formData.usageLimit
                        : "Không giới hạn"}
                    </span>
                  </div>

                  <div className="flex justify-between items-center gap-4">
                    <span className="text-gray-500 dark:text-gray-400">
                      Lượt / người
                    </span>
                    <span className="text-gray-900 dark:text-white font-semibold">
                      {formData.usageLimitPerUser !== ""
                        ? formData.usageLimitPerUser
                        : "Không giới hạn"}
                    </span>
                  </div>
                </div>
              </div>

              {/* 4. Risk notes */}
              <div className="pt-4 border-t border-gray-100 dark:border-gray-700/50 space-y-3">
                <div className="text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  4. Risk notes
                </div>

                <div
                  className={`rounded-xl border p-3 space-y-2 ${reviewLevelUi.box}`}
                >
                  {reviewNotes.map((note, idx) => (
                    <div
                      key={`${note.level}-${idx}`}
                      className="flex items-start gap-2 text-xs leading-relaxed"
                    >
                      <span
                        className={`mt-0.5 inline-block w-2 h-2 rounded-full shrink-0 ${
                          note.level === "danger"
                            ? "bg-red-500"
                            : note.level === "warning"
                              ? "bg-amber-500"
                              : "bg-blue-500"
                        }`}
                      />
                      <span
                        className={
                          note.level === "danger"
                            ? "text-red-700 dark:text-red-400"
                            : note.level === "warning"
                              ? "text-amber-800 dark:text-amber-400"
                              : "text-slate-700 dark:text-slate-300"
                        }
                      >
                        {note.text}
                      </span>
                    </div>
                  ))}
                </div>
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
                Khi sửa target, hãy xem lại từng nhóm chip đã chọn để tránh thay
                đổi phạm vi campaign ngoài ý muốn.
              </li>
              <li>
                Với auto apply campaign, coupon codes có thể để tối giản hoặc để
                trống nếu không dùng ở checkout thủ công.
              </li>
              <li>
                Nếu campaign áp vào product hoặc variant, nên kiểm tra kỹ vì đây
                là mức target chi tiết và dễ gây sai sót hơn category.
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
