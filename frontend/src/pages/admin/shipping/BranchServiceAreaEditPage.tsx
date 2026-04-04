import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Loader2,
  Save,
  Store,
  MapPinned,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Banknote,
  Tags,
  Zap,
  Settings2,
  Info,
  AlertTriangle,
  History,
  Power,
} from "lucide-react";
import Card from "../../../components/admin/layouts/Card";
import { http } from "../../../services/http";
import { useAdminToast } from "../../../context/AdminToastContext";

// =============================
// TYPES
// =============================
interface BranchOption {
  id: number;
  name: string;
  code: string;
}

interface ShippingZoneOption {
  id: number;
  name: string;
  code: string;
  baseFee: number;
}

interface BranchServiceAreaFormData {
  id?: number;
  branchId: string;
  shippingZoneId: string;
  deliveryFeeOverride: string;
  minOrderValue: string;
  maxOrderValue: string;
  supportsSameDay: boolean;
  status: "active" | "inactive";
  createdAt?: string;
  updatedAt?: string;
}

type ApiDetail<T> = { success: true; data: T; meta?: any };
type ApiList<T> = { success: true; data: T[]; meta?: any };

// =============================
// HELPERS
// =============================
const toFormData = (data: any): BranchServiceAreaFormData => ({
  id: data.id,
  branchId: data.branchId != null ? String(data.branchId) : "",
  shippingZoneId:
    data.shippingZoneId != null ? String(data.shippingZoneId) : "",
  deliveryFeeOverride:
    data.deliveryFeeOverride !== null && data.deliveryFeeOverride !== undefined
      ? String(data.deliveryFeeOverride)
      : "",
  minOrderValue:
    data.minOrderValue !== null && data.minOrderValue !== undefined
      ? String(data.minOrderValue)
      : "",
  maxOrderValue:
    data.maxOrderValue !== null && data.maxOrderValue !== undefined
      ? String(data.maxOrderValue)
      : "",
  supportsSameDay: !!data.supportsSameDay,
  status: data.status ?? "active",
  createdAt: data.createdAt,
  updatedAt: data.updatedAt,
});

const formatCurrencyPreview = (value: string | number) => {
  if (value === "" || value === null || value === undefined) return "—";
  const n = Number(value);
  if (!Number.isFinite(n)) return "—";
  return n.toLocaleString("vi-VN") + " đ";
};

// =============================
// MAIN COMPONENT
// =============================
const BranchServiceAreaEditPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showSuccessToast, showErrorToast } = useAdminToast();

  const [formData, setFormData] = useState<BranchServiceAreaFormData | null>(
    null,
  );
  const [initialData, setInitialData] =
    useState<BranchServiceAreaFormData | null>(null);

  const [branches, setBranches] = useState<BranchOption[]>([]);
  const [zones, setZones] = useState<ShippingZoneOption[]>([]);

  const [loading, setLoading] = useState(true);
  const [, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const fieldRefs = useRef<
    Record<string, HTMLInputElement | HTMLSelectElement | null>
  >({});

  // --- Fetch Data ---
  const fetchDetail = async () => {
    try {
      setLoading(true);
      const [detailRes, branchesRes, zonesRes] = await Promise.all([
        http<ApiDetail<any>>(
          "GET",
          `/api/v1/admin/branch-service-areas/edit/${id}`,
        ),
        http<ApiList<BranchOption>>(
          "GET",
          "/api/v1/admin/branches?limit=1000&status=active",
        ),
        http<ApiList<ShippingZoneOption>>(
          "GET",
          "/api/v1/admin/shipping-zones?limit=1000&status=active",
        ),
      ]);

      if (detailRes?.success && detailRes.data) {
        const mapped = toFormData(detailRes.data);
        setFormData(mapped);
        setInitialData(mapped);
      } else {
        showErrorToast("Không thể tải dữ liệu quy tắc coverage.");
      }

      setBranches(Array.isArray(branchesRes?.data) ? branchesRes.data : []);
      setZones(Array.isArray(zonesRes?.data) ? zonesRes.data : []);
    } catch (err: any) {
      showErrorToast(err?.message || "Lỗi tải dữ liệu quy tắc coverage.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
  }, [id]);

  // --- Derived Selectors & Logic ---
  const selectedBranch = useMemo(
    () => branches.find((x) => String(x.id) === formData?.branchId) || null,
    [branches, formData?.branchId],
  );
  const initialBranch = useMemo(
    () => branches.find((x) => String(x.id) === initialData?.branchId) || null,
    [branches, initialData?.branchId],
  );

  const selectedZone = useMemo(
    () => zones.find((x) => String(x.id) === formData?.shippingZoneId) || null,
    [zones, formData?.shippingZoneId],
  );
  const initialZone = useMemo(
    () =>
      zones.find((x) => String(x.id) === initialData?.shippingZoneId) || null,
    [zones, initialData?.shippingZoneId],
  );

  const isDirty = useMemo(() => {
    if (!formData || !initialData) return false;
    return JSON.stringify(formData) !== JSON.stringify(initialData);
  }, [formData, initialData]);

  const orderConditionText = useMemo(() => {
    if (!formData) return "";
    const hasMin = !!formData.minOrderValue.trim();
    const hasMax = !!formData.maxOrderValue.trim();

    if (!hasMin && !hasMax) return "Áp dụng cho mọi giá trị đơn hàng.";
    if (hasMin && hasMax)
      return `Chỉ áp dụng cho đơn từ ${formatCurrencyPreview(formData.minOrderValue)} đến ${formatCurrencyPreview(formData.maxOrderValue)}.`;
    if (hasMin)
      return `Chỉ áp dụng cho đơn từ ${formatCurrencyPreview(formData.minOrderValue)} trở lên.`;
    if (hasMax)
      return `Chỉ áp dụng cho đơn tối đa ${formatCurrencyPreview(formData.maxOrderValue)}.`;
    return "";
  }, [formData?.minOrderValue, formData?.maxOrderValue]);

  const changeImpacts = useMemo(() => {
    if (!formData || !initialData) return [];
    const impacts = [];

    if (formData.branchId !== initialData.branchId) {
      impacts.push(
        `Bạn đang chuyển Coverage Rule này sang chi nhánh khác (${initialBranch?.name} -> ${selectedBranch?.name}).`,
      );
    }

    if (formData.shippingZoneId !== initialData.shippingZoneId) {
      impacts.push(
        `Bạn đang đổi Vùng giao hàng (${initialZone?.name} -> ${selectedZone?.name}). Phạm vi giao thực tế sẽ thay đổi.`,
      );
    }

    if (formData.deliveryFeeOverride !== initialData.deliveryFeeOverride) {
      if (!formData.deliveryFeeOverride)
        impacts.push(
          "Coverage sẽ BỎ Override phí và quay về dùng phí gốc của Vùng giao hàng.",
        );
      else if (!initialData.deliveryFeeOverride)
        impacts.push(
          `Coverage sẽ ÁP DỤNG MỚI phí Override riêng (${formatCurrencyPreview(formData.deliveryFeeOverride)}).`,
        );
      else
        impacts.push(
          `Mức phí Override đang thay đổi (từ ${formatCurrencyPreview(initialData.deliveryFeeOverride)} thành ${formatCurrencyPreview(formData.deliveryFeeOverride)}).`,
        );
    }

    if (formData.supportsSameDay !== initialData.supportsSameDay) {
      impacts.push(
        `Chi nhánh này sẽ ${formData.supportsSameDay ? "BẮT ĐẦU" : "NGỪNG"} hỗ trợ giao hỏa tốc (Same-day) cho vùng này.`,
      );
    }

    if (
      formData.minOrderValue !== initialData.minOrderValue ||
      formData.maxOrderValue !== initialData.maxOrderValue
    ) {
      impacts.push(
        "CẢNH BÁO: Dải điều kiện giá trị đơn hàng đang bị thay đổi.",
      );
    }

    if (formData.status !== initialData.status) {
      impacts.push(
        formData.status === "inactive"
          ? "CẢNH BÁO: Bạn đang Tạm dừng quy tắc này. Chi nhánh sẽ KHÔNG CÒN phục vụ vùng này."
          : "Quy tắc này sẽ được Mở lại và có hiệu lực trên hệ thống.",
      );
    }

    return impacts;
  }, [
    formData,
    initialData,
    selectedBranch,
    initialBranch,
    selectedZone,
    initialZone,
  ]);

  // --- Actions ---
  const setFieldRef =
    (name: string) => (el: HTMLInputElement | HTMLSelectElement | null) => {
      fieldRefs.current[name] = el;
    };

  const scrollToFirstError = (nextErrors: Record<string, string>) => {
    const firstKey = Object.keys(nextErrors)[0];
    if (!firstKey) return;
    fieldRefs.current[firstKey]?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
    fieldRefs.current[firstKey]?.focus?.();
  };

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    if (!formData) return;
    const { name, value, type } = e.target;

    if (type === "checkbox") {
      const target = e.target as HTMLInputElement;
      setFormData((prev) =>
        prev ? { ...prev, [name]: target.checked } : prev,
      );
    } else {
      setFormData((prev) => (prev ? { ...prev, [name]: value } : prev));
    }

    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validateOptionalMoney = (value: string) => {
    if (!value.trim()) return null;
    const n = Number(value);
    if (!Number.isFinite(n) || n < 0) return "Giá trị phải là số >= 0.";
    return null;
  };

  const validateForm = () => {
    if (!formData) return false;
    const nextErrors: Record<string, string> = {};

    if (!formData.branchId)
      nextErrors.branchId = "Vui lòng chọn chi nhánh phục vụ.";
    if (!formData.shippingZoneId)
      nextErrors.shippingZoneId = "Vui lòng chọn vùng giao hàng.";

    const deliveryFeeOverrideError = validateOptionalMoney(
      formData.deliveryFeeOverride,
    );
    if (deliveryFeeOverrideError)
      nextErrors.deliveryFeeOverride = "Phí ship override phải là số >= 0.";

    const minError = validateOptionalMoney(formData.minOrderValue);
    if (minError) nextErrors.minOrderValue = minError;

    const maxError = validateOptionalMoney(formData.maxOrderValue);
    if (maxError) nextErrors.maxOrderValue = maxError;

    if (
      !minError &&
      !maxError &&
      formData.minOrderValue.trim() &&
      formData.maxOrderValue.trim()
    ) {
      const min = Number(formData.minOrderValue);
      const max = Number(formData.maxOrderValue);
      if (min > max) {
        nextErrors.maxOrderValue =
          "Đơn tối đa phải lớn hơn hoặc bằng tối thiểu.";
      }
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      scrollToFirstError(nextErrors);
      return false;
    }
    return true;
  };

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    if (!formData) return;
    if (!validateForm()) return;

    try {
      setSaving(true);
      const payload = {
        branchId: Number(formData.branchId),
        shippingZoneId: Number(formData.shippingZoneId),
        deliveryFeeOverride:
          formData.deliveryFeeOverride.trim() === ""
            ? null
            : Number(formData.deliveryFeeOverride),
        minOrderValue:
          formData.minOrderValue.trim() === ""
            ? null
            : Number(formData.minOrderValue),
        maxOrderValue:
          formData.maxOrderValue.trim() === ""
            ? null
            : Number(formData.maxOrderValue),
        supportsSameDay: formData.supportsSameDay,
        status: formData.status,
      };

      const res = await http<any>(
        "PATCH",
        `/api/v1/admin/branch-service-areas/edit/${formData.id}`,
        payload,
      );

      if (res?.success) {
        showSuccessToast({ message: "Cập nhật quy tắc phục vụ thành công!" });
        setInitialData({ ...formData });
        setErrors({});
      } else {
        showErrorToast(res?.message || "Cập nhật cấu hình thất bại.");
      }
    } catch (err: any) {
      showErrorToast(err?.message || "Lỗi kết nối server.");
    } finally {
      setSaving(false);
    }
  };

  if (loading || !formData || !initialData) {
    return (
      <div className="flex flex-col justify-center items-center py-32 max-w-7xl mx-auto">
        <Loader2 className="w-10 h-10 animate-spin text-blue-600 mb-4" />
        <span className="text-gray-800 dark:text-gray-200 font-bold text-lg">
          Đang tải Quy tắc Coverage...
        </span>
      </div>
    );
  }

  const isStatusChanged = formData.status !== initialData.status;

  return (
    <div className="max-w-7xl mx-auto pb-24">
      {/* Tầng A: Header & Intro */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
        <div>
          <button
            onClick={() => navigate("/admin/shipping/service-areas")}
            className="flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-blue-600 transition-colors mb-2"
          >
            <ArrowLeft className="w-4 h-4" /> Quay lại danh sách
          </button>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              Chỉnh sửa Coverage Rule
            </h1>
            <span
              className={`px-2.5 py-1 text-[11px] font-bold uppercase rounded border ${isStatusChanged ? "bg-amber-100 text-amber-700 border-amber-200" : formData.status === "active" ? "bg-green-100 text-green-700 border-green-200" : "bg-gray-100 text-gray-600 border-gray-200"}`}
            >
              {isStatusChanged
                ? "Sẽ đổi Status"
                : formData.status === "active"
                  ? "Đang Hoạt động"
                  : "Đang Tạm dừng"}
            </span>
            {isDirty && (
              <span className="px-2.5 py-1 bg-yellow-100 text-yellow-700 border border-yellow-200 text-[11px] font-bold uppercase rounded flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" /> Có thay đổi
              </span>
            )}
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1.5 flex items-center gap-2 font-medium">
            <Settings2 className="w-4 h-4" /> {initialBranch?.name}{" "}
            <ArrowRight className="w-3 h-3 text-gray-400 mx-1" />{" "}
            {initialZone?.name}
          </p>
        </div>
      </div>

      <form
        onSubmit={handleSave}
        className="grid grid-cols-1 xl:grid-cols-3 gap-6 lg:gap-8"
      >
        {/* CỘT TRÁI: FORM BUILDER */}
        <div className="xl:col-span-2 space-y-6">
          {/* Section 1: Đối tượng áp dụng (Rule Target Builder) */}
          <Card
            className={
              formData.branchId !== initialData.branchId ||
              formData.shippingZoneId !== initialData.shippingZoneId
                ? "border-amber-200 dark:border-amber-800"
                : ""
            }
          >
            <div className="border-b border-gray-100 dark:border-gray-700 pb-4 mb-4 flex justify-between items-center">
              <div>
                <h2 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
                  <MapPinned className="w-5 h-5 text-gray-400" /> 1. Đối tượng
                  áp dụng
                </h2>
              </div>
              {(formData.branchId !== initialData.branchId ||
                formData.shippingZoneId !== initialData.shippingZoneId) && (
                <span className="text-[10px] font-bold bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded">
                  Đã chỉnh sửa
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  Chi nhánh phục vụ <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Store className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                  <select
                    ref={setFieldRef("branchId")}
                    name="branchId"
                    value={formData.branchId}
                    onChange={handleChange}
                    className={`w-full pl-9 pr-4 py-2.5 border rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none text-gray-900 dark:text-white ${errors.branchId ? "border-red-500" : formData.branchId !== initialData.branchId ? "border-amber-400 bg-amber-50 dark:bg-amber-900/10" : "bg-gray-50 dark:bg-gray-800 border-gray-300 dark:border-gray-600"}`}
                  >
                    <option value="">-- Chọn chi nhánh --</option>
                    {branches.map((branch) => (
                      <option key={branch.id} value={branch.id}>
                        {branch.name} ({branch.code})
                      </option>
                    ))}
                  </select>
                </div>
                {errors.branchId && (
                  <p className="text-xs text-red-600 mt-1">{errors.branchId}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  Vùng giao hàng <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <MapPinned className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                  <select
                    ref={setFieldRef("shippingZoneId")}
                    name="shippingZoneId"
                    value={formData.shippingZoneId}
                    onChange={handleChange}
                    className={`w-full pl-9 pr-4 py-2.5 border rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none text-gray-900 dark:text-white ${errors.shippingZoneId ? "border-red-500" : formData.shippingZoneId !== initialData.shippingZoneId ? "border-amber-400 bg-amber-50 dark:bg-amber-900/10" : "bg-gray-50 dark:bg-gray-800 border-gray-300 dark:border-gray-600"}`}
                  >
                    <option value="">-- Chọn vùng --</option>
                    {zones.map((zone) => (
                      <option key={zone.id} value={zone.id}>
                        {zone.name} ({zone.code})
                      </option>
                    ))}
                  </select>
                </div>
                {errors.shippingZoneId && (
                  <p className="text-xs text-red-600 mt-1">
                    {errors.shippingZoneId}
                  </p>
                )}
              </div>
            </div>

            {selectedBranch && selectedZone && (
              <div className="mt-5 p-4 bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/50 rounded-xl flex flex-col md:flex-row items-center gap-4 justify-center text-sm">
                <div className="font-bold text-gray-900 dark:text-white">
                  {selectedBranch.name}
                </div>
                <div className="flex flex-col items-center">
                  <ArrowRight className="w-5 h-5 text-blue-400 md:rotate-0 rotate-90" />
                  <span className="text-[10px] text-gray-500 font-medium hidden md:block">
                    Phục vụ vùng
                  </span>
                </div>
                <div className="font-bold text-gray-900 dark:text-white">
                  {selectedZone.name}{" "}
                  <span className="font-normal text-xs text-gray-500">
                    ({selectedZone.code})
                  </span>
                </div>
              </div>
            )}
          </Card>

          {/* Section 2: Logic phí áp dụng (Fee Override) */}
          <Card
            className={
              formData.deliveryFeeOverride !== initialData.deliveryFeeOverride
                ? "border-amber-200 dark:border-amber-800"
                : ""
            }
          >
            <div className="border-b border-gray-100 dark:border-gray-700 pb-4 mb-4 flex justify-between items-start">
              <div>
                <h2 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
                  <Banknote className="w-5 h-5 text-gray-400" /> 2. Phí giao
                  hàng riêng
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Chi nhánh dùng phí gốc của Vùng hay được cấu hình phí Override
                  riêng.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* Default Column */}
              <div
                className={`p-4 rounded-xl border-2 transition-all ${!formData.deliveryFeeOverride ? "border-blue-500 bg-blue-50/30 dark:bg-blue-900/10" : "border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 opacity-60"}`}
              >
                <div className="flex justify-between items-center mb-3">
                  <div
                    className={`font-bold text-sm ${!formData.deliveryFeeOverride ? "text-blue-700 dark:text-blue-400" : "text-gray-600 dark:text-gray-400"}`}
                  >
                    Mặc định theo Vùng
                  </div>
                  {!formData.deliveryFeeOverride && (
                    <CheckCircle2 className="w-4 h-4 text-blue-600" />
                  )}
                </div>
                <div className="text-xs text-gray-500 mb-2">Mức phí gốc:</div>
                <div className="text-lg font-bold text-gray-900 dark:text-white">
                  {selectedZone
                    ? formatCurrencyPreview(selectedZone.baseFee)
                    : "Chưa xác định"}
                </div>
              </div>

              {/* Override Column */}
              <div
                className={`p-4 rounded-xl border-2 transition-all ${formData.deliveryFeeOverride ? (formData.deliveryFeeOverride !== initialData.deliveryFeeOverride ? "border-amber-500 bg-amber-50/30" : "border-amber-500 bg-amber-50/30 dark:bg-amber-900/10") : "border-gray-200 dark:border-gray-700"}`}
              >
                <div className="flex justify-between items-center mb-3">
                  <div
                    className={`font-bold text-sm ${formData.deliveryFeeOverride ? "text-amber-700 dark:text-amber-400" : "text-gray-600 dark:text-gray-400"}`}
                  >
                    Áp dụng riêng (Override)
                  </div>
                  {formData.deliveryFeeOverride && (
                    <Zap className="w-4 h-4 text-amber-600" />
                  )}
                </div>
                <label className="block text-xs text-gray-500 mb-2">
                  Phí vận chuyển override (VNĐ)
                </label>
                <input
                  ref={setFieldRef("deliveryFeeOverride")}
                  type="number"
                  min="0"
                  step="1000"
                  name="deliveryFeeOverride"
                  value={formData.deliveryFeeOverride}
                  onChange={handleChange}
                  placeholder="Trống = Dùng gốc"
                  className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none ${errors.deliveryFeeOverride ? "border-red-500 focus:ring-red-500" : formData.deliveryFeeOverride !== initialData.deliveryFeeOverride ? "border-amber-400 focus:ring-amber-500 bg-amber-50 dark:bg-amber-900/20" : "border-gray-300 dark:border-gray-600 focus:ring-amber-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"}`}
                />
                {errors.deliveryFeeOverride && (
                  <p className="text-xs text-red-600 mt-1">
                    {errors.deliveryFeeOverride}
                  </p>
                )}
                {formData.deliveryFeeOverride !==
                  initialData.deliveryFeeOverride && (
                  <p className="text-xs font-medium text-amber-600 mt-1.5">
                    Phí Override gốc:{" "}
                    {initialData.deliveryFeeOverride
                      ? formatCurrencyPreview(initialData.deliveryFeeOverride)
                      : "Không có"}
                  </p>
                )}
              </div>
            </div>
          </Card>

          {/* Section 3: Điều kiện đơn hàng */}
          <Card
            className={
              formData.minOrderValue !== initialData.minOrderValue ||
              formData.maxOrderValue !== initialData.maxOrderValue
                ? "border-amber-200 dark:border-amber-800"
                : ""
            }
          >
            <div className="border-b border-gray-100 dark:border-gray-700 pb-4 mb-4">
              <h2 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
                <Tags className="w-5 h-5 text-gray-400" /> 3. Điều kiện giá trị
                đơn
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Giới hạn coverage này chỉ áp dụng cho một khoảng giá trị đơn
                nhất định.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-2">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  Đơn tối thiểu (VNĐ)
                </label>
                <input
                  ref={setFieldRef("minOrderValue")}
                  type="number"
                  min="0"
                  step="1000"
                  name="minOrderValue"
                  value={formData.minOrderValue}
                  onChange={handleChange}
                  placeholder="VD: 0"
                  className={`w-full border rounded-lg p-2.5 text-gray-900 dark:text-white focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none ${errors.minOrderValue ? "border-red-500" : formData.minOrderValue !== initialData.minOrderValue ? "border-amber-400 bg-amber-50 dark:bg-amber-900/10" : "border-gray-300 bg-gray-50 dark:bg-gray-800 dark:border-gray-600"}`}
                />
                {errors.minOrderValue && (
                  <p className="text-xs text-red-600 mt-1.5">
                    {errors.minOrderValue}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  Đơn tối đa (VNĐ)
                </label>
                <input
                  ref={setFieldRef("maxOrderValue")}
                  type="number"
                  min="0"
                  step="1000"
                  name="maxOrderValue"
                  value={formData.maxOrderValue}
                  onChange={handleChange}
                  placeholder="Để trống nếu không giới hạn"
                  className={`w-full border rounded-lg p-2.5 text-gray-900 dark:text-white focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none ${errors.maxOrderValue ? "border-red-500" : formData.maxOrderValue !== initialData.maxOrderValue ? "border-amber-400 bg-amber-50 dark:bg-amber-900/10" : "border-gray-300 bg-gray-50 dark:bg-gray-800 dark:border-gray-600"}`}
                />
                {errors.maxOrderValue && (
                  <p className="text-xs text-red-600 mt-1.5">
                    {errors.maxOrderValue}
                  </p>
                )}
              </div>
            </div>

            <div className="mt-4 p-3 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800 rounded-lg flex items-center justify-between">
              <p className="text-sm font-medium text-indigo-800 dark:text-indigo-300 flex items-center gap-2">
                <Info className="w-4 h-4 shrink-0" /> {orderConditionText}
              </p>
            </div>
          </Card>

          {/* Section 4: Dịch vụ & Trạng thái */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card
              className={
                formData.supportsSameDay !== initialData.supportsSameDay
                  ? "border-amber-200 dark:border-amber-800"
                  : ""
              }
            >
              <div className="border-b border-gray-100 dark:border-gray-700 pb-4 mb-4">
                <h2 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
                  <Zap className="w-5 h-5 text-gray-400" /> Dịch vụ nâng cao
                </h2>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                  Hỗ trợ Same-day (Giao trong ngày)
                </label>
                <label className="relative inline-flex items-center cursor-pointer group">
                  <input
                    type="checkbox"
                    name="supportsSameDay"
                    checked={formData.supportsSameDay}
                    onChange={handleChange}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-purple-600"></div>
                  <span className="ml-3 text-sm font-medium text-gray-900 dark:text-gray-300 group-hover:text-purple-600 transition-colors">
                    {formData.supportsSameDay ? "Có hỗ trợ" : "Không hỗ trợ"}
                  </span>
                </label>
              </div>
            </Card>

            <Card
              className={
                formData.status !== initialData.status
                  ? "border-amber-200 dark:border-amber-800"
                  : ""
              }
            >
              <div className="border-b border-gray-100 dark:border-gray-700 pb-4 mb-4">
                <h2 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
                  <Power className="w-5 h-5 text-gray-400" /> Trạng thái
                </h2>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  Trạng thái Coverage
                </label>
                <select
                  ref={setFieldRef("status")}
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className={`w-full border rounded-lg p-2.5 text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none ${formData.status !== initialData.status ? "bg-amber-50 border-amber-400 text-amber-900" : "bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"}`}
                >
                  <option value="active">Hoạt động (Áp dụng ngay)</option>
                  <option value="inactive">
                    Tạm dừng (Lưu cấu hình nhưng chưa áp dụng)
                  </option>
                </select>
              </div>
            </Card>
          </div>
        </div>

        {/* CỘT PHẢI: LIVE PREVIEW PANEL */}
        <div className="xl:col-span-1">
          <div className="sticky top-24 space-y-6">
            {/* Change Impact Advisory */}
            {isDirty ? (
              <Card
                className={`bg-gradient-to-br shadow-sm overflow-hidden transition-all duration-300 ${changeImpacts.some((i) => i.includes("CẢNH BÁO")) ? "border-red-200 dark:border-red-900/50 from-red-50 to-white dark:from-gray-800 dark:to-gray-800/80" : "border-amber-200 dark:border-amber-900/50 from-amber-50 to-white dark:from-gray-800 dark:to-gray-800/80"}`}
              >
                <div
                  className={`text-white px-4 py-3 -mx-6 -mt-6 mb-5 flex items-center gap-2 font-bold shadow-sm ${changeImpacts.some((i) => i.includes("CẢNH BÁO")) ? "bg-red-500" : "bg-amber-500"}`}
                >
                  <AlertTriangle className="w-5 h-5" /> Đánh giá tác động thay
                  đổi
                </div>
                {changeImpacts.length > 0 ? (
                  <ul className="space-y-3 text-sm">
                    {changeImpacts.map((impact, idx) => (
                      <li
                        key={idx}
                        className="flex items-start gap-2.5 text-gray-700 dark:text-gray-300"
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${impact.includes("CẢNH BÁO") ? "bg-red-500" : "bg-amber-500"}`}
                        ></span>
                        <span
                          className={
                            impact.includes("CẢNH BÁO")
                              ? "font-bold text-red-600 dark:text-red-400"
                              : ""
                          }
                        >
                          {impact}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-600">
                    Thay đổi hiện tại không ảnh hưởng lớn tới luồng vận hành.
                  </p>
                )}
              </Card>
            ) : (
              <Card className="border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 flex flex-col items-center justify-center py-10 text-center transition-all duration-300">
                <History className="w-10 h-10 text-gray-300 mb-3" />
                <span className="text-gray-500 font-medium">
                  Bản nháp hiện trùng với dữ liệu lưu trữ. Chỉnh sửa form để xem
                  đánh giá tác động.
                </span>
              </Card>
            )}

            {/* Live Activation Summary */}
            <Card className="border-blue-100 dark:border-blue-900/50 bg-gradient-to-br from-blue-50 to-white dark:from-gray-800 dark:to-gray-800/80 shadow-sm overflow-hidden">
              <div className="bg-blue-600 text-white px-4 py-3 -mx-6 -mt-6 mb-5 flex items-center justify-between font-bold shadow-sm">
                <span className="flex items-center gap-2">
                  <Info className="w-5 h-5" /> Coverage sau khi Lưu
                </span>
              </div>

              <div className="space-y-4 text-sm">
                <div className="flex justify-between items-start">
                  {formData.supportsSameDay ? (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase border bg-purple-100 text-purple-700 border-purple-200 flex items-center gap-1">
                      <Zap className="w-3 h-3" /> Hỗ trợ Same-day
                    </span>
                  ) : (
                    <span></span>
                  )}
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${formData.status === "active" ? "bg-green-100 text-green-700 border-green-200" : "bg-gray-100 text-gray-600 border-gray-200"}`}
                  >
                    {formData.status === "active"
                      ? "Sẽ được bật"
                      : "Đang tạm tắt"}
                  </span>
                </div>

                <div
                  className={
                    formData.branchId !== initialData.branchId
                      ? "bg-amber-100 -mx-2 px-2 py-1 rounded"
                      : ""
                  }
                >
                  <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                    Cấu hình cho nhánh
                  </div>
                  <div className="font-bold text-gray-900 dark:text-white text-base">
                    {selectedBranch?.name}{" "}
                    <span className="text-xs font-mono font-normal text-gray-500">
                      ({selectedBranch?.code})
                    </span>
                  </div>
                </div>

                <div
                  className={`bg-white dark:bg-gray-800 rounded-lg p-3 border flex flex-col gap-2 text-[13px] ${formData.shippingZoneId !== initialData.shippingZoneId ? "border-amber-400" : "border-gray-100 dark:border-gray-700"}`}
                >
                  <div className="flex justify-between items-center border-b border-gray-100 dark:border-gray-700 pb-2">
                    <span className="text-gray-500 font-medium">
                      Sẽ phục vụ vùng:
                    </span>
                    <span className="font-bold text-gray-900 dark:text-white">
                      {selectedZone?.name}
                    </span>
                  </div>
                  <div
                    className={`flex justify-between items-center ${formData.deliveryFeeOverride !== initialData.deliveryFeeOverride ? "text-amber-600 font-bold" : ""}`}
                  >
                    <span className="text-gray-500 font-medium">
                      Mức phí áp dụng:
                    </span>
                    {formData.deliveryFeeOverride ? (
                      <span
                        className={
                          formData.deliveryFeeOverride !==
                          initialData.deliveryFeeOverride
                            ? ""
                            : "font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-1.5 py-0.5 rounded border border-amber-200"
                        }
                      >
                        {formatCurrencyPreview(formData.deliveryFeeOverride)}
                      </span>
                    ) : (
                      <span className="font-bold text-blue-600 dark:text-blue-400">
                        {selectedZone
                          ? formatCurrencyPreview(selectedZone.baseFee)
                          : "—"}
                      </span>
                    )}
                  </div>
                  <div
                    className={`flex flex-col mt-1 ${formData.minOrderValue !== initialData.minOrderValue || formData.maxOrderValue !== initialData.maxOrderValue ? "text-amber-600 font-bold" : ""}`}
                  >
                    <span className="text-gray-500 font-medium">
                      Dải đơn hàng:
                    </span>
                    <span className="font-bold text-gray-800 dark:text-gray-200 mt-0.5 leading-snug">
                      {orderConditionText}
                    </span>
                  </div>
                </div>
              </div>
            </Card>

            {selectedBranch && selectedZone && (
              <Card className="bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
                <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200 mb-3 flex items-center gap-2">
                  <ArrowRight className="w-4 h-4 text-gray-500" /> Bước tiếp
                  theo
                </h3>
                <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed mb-3">
                  Cấu hình thay đổi, bạn nên kiểm tra lại{" "}
                  <strong>Khung giờ chi nhánh</strong> của cửa hàng này để đảm
                  bảo lịch phục vụ vẫn tương thích.
                </p>
                <button
                  type="button"
                  onClick={() =>
                    navigate(
                      `/admin/shipping/branch-delivery-slots?branchId=${selectedBranch.id}`,
                    )
                  }
                  className="w-full py-2 bg-white border border-gray-300 rounded text-xs font-bold text-gray-700 hover:bg-gray-50 shadow-sm transition"
                >
                  Mở Khung giờ chi nhánh
                </button>
              </Card>
            )}
          </div>
        </div>
      </form>

      {/* Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 md:left-64 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 p-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-20">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-sm font-medium hidden sm:flex items-center gap-4">
            {Object.keys(errors).length > 0 && (
              <span className="text-red-500 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" /> Có lỗi cần kiểm tra lại
              </span>
            )}
            {isDirty && Object.keys(errors).length === 0 && (
              <span className="text-amber-600 flex items-center gap-1">
                <Info className="w-4 h-4" /> Bấm lưu để áp dụng thay đổi
              </span>
            )}
          </div>
          <div className="flex gap-3 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => navigate("/admin/shipping/service-areas")}
              className="flex-1 sm:flex-none px-6 py-2.5 rounded-lg font-medium bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-200 transition-colors"
            >
              Hủy bỏ
            </button>
            <button
              onClick={handleSave}
              disabled={loading || !isDirty}
              className={`flex-1 sm:flex-none px-8 py-2.5 rounded-lg font-medium text-white transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm ${isDirty ? "bg-amber-600 hover:bg-amber-700" : "bg-blue-600 hover:bg-blue-700"}`}
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" /> Đang cập nhật...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />{" "}
                  {isDirty ? "Lưu thay đổi" : "Đã đồng bộ"}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BranchServiceAreaEditPage;
