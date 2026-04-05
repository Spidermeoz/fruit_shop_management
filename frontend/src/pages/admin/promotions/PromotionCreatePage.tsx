import React, {
  useMemo,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Loader2,
  CheckCircle2,
  Settings2,
  Info,
  Percent,
  TicketPercent,
  CalendarClock,
  ShieldCheck,
  AlertCircle,
  Lightbulb,
  Tags,
  ListChecks,
} from "lucide-react";
import Card from "../../../components/admin/layouts/Card";
import RichTextEditor from "../../../components/admin/common/RichTextEditor";
import { http } from "../../../services/http";
import { uploadImagesInContent } from "../../../utils/uploadImagesInContent";
import { useAdminToast } from "../../../context/AdminToastContext";

// ==========================================
// TYPES & CONSTANTS
// ==========================================
type PromotionScope = "order" | "shipping";
type DiscountType = "fixed" | "percent" | "free_shipping";
type PromotionStatus = "active" | "inactive";

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

type NextStep = "workspace" | "board";

type ApiOk<T> = { success: true; data: T; meta?: any; message?: string };
type ApiErr = { success: false; message?: string; errors?: any };

const INITIAL_FORM: PromotionFormData = {
  name: "",
  description: "",
  promotionScope: "order",
  discountType: "percent",
  discountValue: "",
  maxDiscountAmount: "",
  minOrderValue: "",
  isAutoApply: false,
  canCombine: false,
  priority: 0,
  usageLimit: "",
  usageLimitPerUser: "",
  startAt: "",
  endAt: "",
  status: "active",
  codesText: "",
  productIdsText: "",
  categoryIdsText: "",
  variantIdsText: "",
  originIdsText: "",
  branchIdsText: "",
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

const getNextStepButtonLabel = (step: NextStep) => {
  switch (step) {
    case "workspace":
      return "Tạo và mở workspace";
    case "board":
    default:
      return "Tạo campaign";
  }
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

// ==========================================
// MAIN COMPONENT
// ==========================================
const PromotionCreatePage: React.FC = () => {
  const navigate = useNavigate();
  const { showSuccessToast, showErrorToast } = useAdminToast();

  // --- States ---
  const [formData, setFormData] = useState<PromotionFormData>(INITIAL_FORM);
  const [loading, setLoading] = useState(false);
  const [nextStep, setNextStep] = useState<NextStep>("workspace");
  const [errors, setErrors] = useState<
    Partial<Record<keyof PromotionFormData | "general", string>>
  >({});

  // --- Derived Data ---
  const parsedCodes = useMemo(
    () => parseCodes(formData.codesText),
    [formData.codesText],
  );

  const parsedTargets = useMemo(
    () => ({
      productIds: parseIdList(formData.productIdsText),
      categoryIds: parseIdList(formData.categoryIdsText),
      variantIds: parseIdList(formData.variantIdsText),
      originIds: parseIdList(formData.originIdsText),
      branchIds: parseIdList(formData.branchIdsText),
    }),
    [
      formData.productIdsText,
      formData.categoryIdsText,
      formData.variantIdsText,
      formData.originIdsText,
      formData.branchIdsText,
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

  // --- Handlers ---
  const handleInputChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value, type } = e.target;
    const checked =
      e.target instanceof HTMLInputElement ? e.target.checked : false;

    setFormData((prev) => ({
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
    }));

    if (errors[name as keyof typeof errors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
    if (errors.general) {
      setErrors((prev) => ({ ...prev, general: undefined }));
    }
  };

  const handleDescriptionChange = (content: string) => {
    setFormData((prev) => ({ ...prev, description: content }));
    if (errors.description) {
      setErrors((prev) => ({ ...prev, description: undefined }));
    }
  };

  const validateForm = () => {
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

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setLoading(true);
      setErrors({});

      const processedDescription = await uploadImagesInContent(
        formData.description,
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

      const res = await http<ApiOk<any> | ApiErr>(
        "POST",
        "/api/v1/admin/promotions",
        payload,
      );

      if (res.success) {
        showSuccessToast({ message: "Tạo campaign khuyến mãi thành công!" });

        const newPromotionId =
          (res as ApiOk<any>).data?.id ||
          (res as ApiOk<any>).data?.promotion?.id;

        if (nextStep === "workspace" && newPromotionId) {
          navigate(`/admin/promotions/edit/${newPromotionId}`);
        } else {
          navigate("/admin/promotions");
        }
      } else {
        if (res.errors) {
          setErrors(res.errors);
        } else {
          setErrors({
            general: res.message || "Không thể tạo campaign khuyến mãi.",
          });
        }
      }
    } catch (err: any) {
      console.error("Create promotion error:", err);
      const message =
        err?.data?.message || err?.message || "Lỗi kết nối server!";
      setErrors({ general: message });
      showErrorToast(message);
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // RENDER
  // ==========================================
  return (
    <div className="w-full pb-10 space-y-6">
      {/* A. Header */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4 sticky top-4 z-10">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <button
              onClick={() => navigate("/admin/promotions")}
              className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md text-gray-500 dark:text-gray-400 transition"
              title="Quay lại danh sách"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
              Khởi tạo campaign khuyến mãi
            </h1>
            <span className="hidden md:inline-flex px-2 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider bg-blue-50 text-blue-600 border border-blue-200 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-400 ml-2">
              Promotion Setup
            </span>
          </div>
          <p className="text-gray-500 dark:text-gray-400 ml-10 text-sm max-w-2xl">
            Thiết lập campaign giảm giá, freeship hoặc coupon code theo đúng
            phạm vi áp dụng và chiến lược vận hành của phase 6.
          </p>
        </div>

        <div className="ml-10 md:ml-0 flex items-center gap-3">
          <button
            onClick={() => navigate("/admin/promotions")}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 text-sm font-semibold rounded-lg transition-colors flex items-center gap-2"
          >
            <Tags className="w-4 h-4" /> Promotions board
          </button>
        </div>
      </div>

      {/* B. Setup Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4 border-gray-200 dark:border-gray-700 flex items-start gap-3 bg-gray-50/50 dark:bg-gray-800/30">
          <div className="p-2 bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 rounded-lg shrink-0">
            <Info className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-sm text-gray-900 dark:text-white mb-0.5">
              1. Định danh campaign
            </h4>
            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
              Đặt tên rõ nghĩa, mô tả đúng mục tiêu và hành vi kỳ vọng.
            </p>
          </div>
        </Card>

        <Card className="p-4 border-gray-200 dark:border-gray-700 flex items-start gap-3 bg-gray-50/50 dark:bg-gray-800/30">
          <div className="p-2 bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400 rounded-lg shrink-0">
            <Percent className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-sm text-gray-900 dark:text-white mb-0.5">
              2. Cơ chế giảm giá
            </h4>
            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
              Chọn phạm vi order hoặc shipping, mức giảm và điều kiện kích hoạt.
            </p>
          </div>
        </Card>

        <Card className="p-4 border-gray-200 dark:border-gray-700 flex items-start gap-3 bg-gray-50/50 dark:bg-gray-800/30">
          <div className="p-2 bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400 rounded-lg shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-sm text-gray-900 dark:text-white mb-0.5">
              3. Ràng buộc áp dụng
            </h4>
            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
              Giới hạn theo mã coupon, sản phẩm, category, origin, variant hoặc
              chi nhánh.
            </p>
          </div>
        </Card>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* LEFT COLUMN */}
          <div className="lg:col-span-2 space-y-6">
            {/* Section 1 */}
            <Card className="!p-0 overflow-hidden border-gray-200 dark:border-gray-700">
              <div className="p-5 border-b border-gray-100 dark:border-gray-700/50 bg-gray-50/50 dark:bg-gray-800/50 flex items-center gap-2">
                <Settings2 className="w-5 h-5 text-gray-500" />
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                  Thông tin cơ bản
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
                    placeholder="Vd: FREESHIP cuối tuần, Giảm 10% trái cây nhập khẩu..."
                    className={`w-full px-4 py-2.5 rounded-lg border bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
                      errors.name
                        ? "border-red-500"
                        : "border-gray-300 dark:border-gray-600"
                    }`}
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5 font-medium">
                    Tên này sẽ hiển thị trong dashboard promotions và snapshot
                    đơn hàng.
                  </p>
                  {errors.name && (
                    <p className="text-sm text-red-600 dark:text-red-400 mt-1.5">
                      {errors.name}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-900 dark:text-white mb-1.5">
                    Mô tả campaign
                  </label>
                  <div
                    className={`rounded-lg border overflow-hidden ${
                      errors.description
                        ? "border-red-500"
                        : "border-gray-300 dark:border-gray-600"
                    }`}
                  >
                    <RichTextEditor
                      value={formData.description}
                      onChange={handleDescriptionChange}
                    />
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5 font-medium">
                    Mô tả mục tiêu sử dụng, điều kiện nổi bật hoặc cách vận hành
                    của campaign.
                  </p>
                </div>
              </div>
            </Card>

            {/* Section 2 */}
            <Card className="!p-0 overflow-hidden border-gray-200 dark:border-gray-700">
              <div className="p-5 border-b border-gray-100 dark:border-gray-700/50 bg-gray-50/50 dark:bg-gray-800/50 flex items-center gap-2">
                <TicketPercent className="w-5 h-5 text-gray-500" />
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                  Cơ chế giảm giá
                </h2>
              </div>

              <div className="p-5 space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-900 dark:text-white mb-1.5">
                      Phạm vi khuyến mãi
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
                      Kiểu giảm giá
                    </label>
                    <select
                      name="discountType"
                      value={formData.discountType}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-2.5 rounded-lg border ${
                        errors.discountType
                          ? "border-red-500"
                          : "border-gray-300 dark:border-gray-600"
                      } bg-white dark:bg-gray-900 text-gray-900 dark:text-white`}
                    >
                      <option value="percent">Percent</option>
                      <option value="fixed">Fixed amount</option>
                      <option value="free_shipping">Free shipping</option>
                    </select>
                    {errors.discountType && (
                      <p className="text-sm text-red-600 dark:text-red-400 mt-1.5">
                        {errors.discountType}
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
                        errors.discountValue
                          ? "border-red-500"
                          : "border-gray-300 dark:border-gray-600"
                      } bg-white dark:bg-gray-900 text-gray-900 dark:text-white disabled:opacity-50`}
                    />
                    {errors.discountValue && (
                      <p className="text-sm text-red-600 dark:text-red-400 mt-1.5">
                        {errors.discountValue}
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
                        errors.maxDiscountAmount
                          ? "border-red-500"
                          : "border-gray-300 dark:border-gray-600"
                      } bg-white dark:bg-gray-900 text-gray-900 dark:text-white`}
                    />
                    {errors.maxDiscountAmount && (
                      <p className="text-sm text-red-600 dark:text-red-400 mt-1.5">
                        {errors.maxDiscountAmount}
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
                        errors.minOrderValue
                          ? "border-red-500"
                          : "border-gray-300 dark:border-gray-600"
                      } bg-white dark:bg-gray-900 text-gray-900 dark:text-white`}
                    />
                    {errors.minOrderValue && (
                      <p className="text-sm text-red-600 dark:text-red-400 mt-1.5">
                        {errors.minOrderValue}
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
                        errors.priority
                          ? "border-red-500"
                          : "border-gray-300 dark:border-gray-600"
                      } bg-white dark:bg-gray-900 text-gray-900 dark:text-white`}
                    />
                    {errors.priority && (
                      <p className="text-sm text-red-600 dark:text-red-400 mt-1.5">
                        {errors.priority}
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
                        errors.usageLimit
                          ? "border-red-500"
                          : "border-gray-300 dark:border-gray-600"
                      } bg-white dark:bg-gray-900 text-gray-900 dark:text-white`}
                    />
                    {errors.usageLimit && (
                      <p className="text-sm text-red-600 dark:text-red-400 mt-1.5">
                        {errors.usageLimit}
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
                        errors.usageLimitPerUser
                          ? "border-red-500"
                          : "border-gray-300 dark:border-gray-600"
                      } bg-white dark:bg-gray-900 text-gray-900 dark:text-white`}
                    />
                    {errors.usageLimitPerUser && (
                      <p className="text-sm text-red-600 dark:text-red-400 mt-1.5">
                        {errors.usageLimitPerUser}
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

            {/* Section 3 */}
            <Card className="!p-0 overflow-hidden border-gray-200 dark:border-gray-700">
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

            {/* Section 4 */}
            <Card className="!p-0 overflow-hidden border-gray-200 dark:border-gray-700">
              <div className="p-5 border-b border-gray-100 dark:border-gray-700/50 bg-gray-50/50 dark:bg-gray-800/50 flex items-center gap-2">
                <ListChecks className="w-5 h-5 text-gray-500" />
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                  Coupon codes & phạm vi áp dụng
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
                      setFormData((prev) => ({
                        ...prev,
                        codesText: e.target.value,
                      }))
                    }
                    placeholder="Nhập mỗi mã trên một dòng hoặc phân tách bằng dấu phẩy&#10;VD: FREESHIP50, FRUIT10"
                    rows={4}
                    className={`w-full px-4 py-3 rounded-lg border ${
                      errors.codesText
                        ? "border-red-500"
                        : "border-gray-300 dark:border-gray-600"
                    } bg-white dark:bg-gray-900 text-gray-900 dark:text-white`}
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5 font-medium">
                    Nếu bật auto apply thì có thể để trống phần này.
                  </p>
                  {errors.codesText && (
                    <p className="text-sm text-red-600 dark:text-red-400 mt-1.5">
                      {errors.codesText}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    {
                      name: "productIdsText",
                      label: "Product IDs",
                      placeholder: "1, 2, 3",
                    },
                    {
                      name: "categoryIdsText",
                      label: "Category IDs",
                      placeholder: "10, 12",
                    },
                    {
                      name: "variantIdsText",
                      label: "Variant IDs",
                      placeholder: "101, 102",
                    },
                    {
                      name: "originIdsText",
                      label: "Origin IDs",
                      placeholder: "5, 8",
                    },
                    {
                      name: "branchIdsText",
                      label: "Branch IDs",
                      placeholder: "1, 3",
                    },
                  ].map((field) => (
                    <div
                      key={field.name}
                      className={
                        field.name === "branchIdsText" ? "sm:col-span-2" : ""
                      }
                    >
                      <label className="block text-sm font-bold text-gray-900 dark:text-white mb-1.5">
                        {field.label}
                      </label>
                      <input
                        type="text"
                        value={(formData as any)[field.name]}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            [field.name]: e.target.value,
                          }))
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

          {/* RIGHT COLUMN */}
          <div className="space-y-6">
            {/* Summary */}
            <Card className="border-gray-200 dark:border-gray-700 !p-0 overflow-hidden">
              <div className="p-4 border-b border-gray-100 dark:border-gray-700/50 bg-gray-50/50 dark:bg-gray-800/50">
                <h3 className="font-bold text-gray-900 dark:text-white">
                  Tóm tắt campaign
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
                  <span className="text-gray-500 dark:text-gray-400">
                    Scope
                  </span>
                  <span className="text-blue-600 dark:text-blue-400">
                    {getScopeLabel(formData.promotionScope)}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-gray-500 dark:text-gray-400">
                    Discount
                  </span>
                  <span className="text-gray-900 dark:text-white text-right">
                    {getDiscountTypeLabel(formData.discountType)}
                  </span>
                </div>

                <div className="flex justify-between items-center pt-3 border-t border-gray-100 dark:border-gray-700/50">
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
                    Target count
                  </span>
                  <span className="text-gray-900 dark:text-white">
                    {targetCount}
                  </span>
                </div>
              </div>
            </Card>

            {/* Next Step */}
            <Card className="border-gray-200 dark:border-gray-700 !p-0 overflow-hidden ring-1 ring-blue-500/20">
              <div className="p-4 border-b border-gray-100 dark:border-gray-700/50 bg-blue-50/50 dark:bg-blue-900/10">
                <h3 className="font-bold text-blue-900 dark:text-blue-400">
                  Bước tiếp theo sau khi tạo
                </h3>
              </div>

              <div className="p-4 space-y-3">
                <label className="flex items-start gap-3 cursor-pointer group">
                  <input
                    type="radio"
                    name="nextStep"
                    checked={nextStep === "workspace"}
                    onChange={() => setNextStep("workspace")}
                    className="mt-0.5 w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  />
                  <div>
                    <span className="block text-sm font-bold text-gray-900 dark:text-white group-hover:text-blue-600 transition-colors">
                      Mở workspace campaign
                    </span>
                    <span className="block text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      Đi tới trang chỉnh sửa để tiếp tục tinh chỉnh.
                    </span>
                  </div>
                </label>

                <label className="flex items-start gap-3 cursor-pointer group">
                  <input
                    type="radio"
                    name="nextStep"
                    checked={nextStep === "board"}
                    onChange={() => setNextStep("board")}
                    className="mt-0.5 w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  />
                  <div>
                    <span className="block text-sm font-bold text-gray-900 dark:text-white group-hover:text-blue-600 transition-colors">
                      Quay lại promotions board
                    </span>
                    <span className="block text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      Lưu lại campaign và quản lý sau.
                    </span>
                  </div>
                </label>
              </div>
            </Card>

            {/* Guidance */}
            <Card className="border-gray-200 dark:border-gray-700 bg-amber-50/30 dark:bg-amber-900/10">
              <div className="flex items-center gap-2 mb-3 text-amber-700 dark:text-amber-500">
                <Lightbulb className="w-5 h-5" />
                <h3 className="font-bold text-sm">Gợi ý thiết lập</h3>
              </div>
              <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-2 list-disc pl-4">
                <li>
                  Chỉ dùng <strong>free shipping</strong> khi scope là shipping.
                </li>
                <li>
                  Với campaign nhập mã thủ công, nên nhập ít nhất một{" "}
                  <strong>coupon code</strong>.
                </li>
                <li>
                  Nếu giới hạn theo product/category/variant/origin/branch, hãy
                  kiểm tra lại target IDs trước khi publish.
                </li>
              </ul>
            </Card>

            {/* General Error */}
            {errors.general && (
              <div className="p-3 bg-red-50 text-red-600 rounded-lg border border-red-200 text-sm flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" /> {errors.general}
              </div>
            )}

            {/* Submit */}
            <div className="pt-2">
              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:opacity-50 font-bold shadow-sm"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" /> Đang thiết
                    lập...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-5 h-5" />{" "}
                    {getNextStepButtonLabel(nextStep)}
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => navigate("/admin/promotions")}
                className="w-full mt-3 px-6 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-semibold"
              >
                Hủy thao tác
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default PromotionCreatePage;
