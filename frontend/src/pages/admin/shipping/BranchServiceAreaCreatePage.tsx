import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  Loader2,
  Save,
  Store,
  MapPinned,
  ArrowRight,
  AlertCircle,
  Banknote,
  Tags,
  Zap,
  Info,
  Power,
  CheckCircle2,
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
  branchId: string;
  shippingZoneId: string;
  deliveryFeeOverride: string;
  minOrderValue: string;
  maxOrderValue: string;
  supportsSameDay: boolean;
  status: "active" | "inactive";
}

type ApiList<T> = { success: true; data: T[]; meta?: any };

const initialForm: BranchServiceAreaFormData = {
  branchId: "",
  shippingZoneId: "",
  deliveryFeeOverride: "",
  minOrderValue: "",
  maxOrderValue: "",
  supportsSameDay: true,
  status: "active",
};

// =============================
// HELPERS
// =============================
const formatCurrencyPreview = (value: string | number) => {
  if (value === "" || value === null || value === undefined) return "—";
  const n = Number(value);
  if (!Number.isFinite(n)) return "—";
  return n.toLocaleString("vi-VN") + " đ";
};

// =============================
// MAIN COMPONENT
// =============================
const BranchServiceAreaCreatePage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { showSuccessToast, showErrorToast } = useAdminToast();

  const [formData, setFormData] =
    useState<BranchServiceAreaFormData>(initialForm);
  const [branches, setBranches] = useState<BranchOption[]>([]);
  const [zones, setZones] = useState<ShippingZoneOption[]>([]);

  const [loading, setLoading] = useState(false);
  const [bootstrapLoading, setBootstrapLoading] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isPrefilled, setIsPrefilled] = useState(false);

  const fieldRefs = useRef<
    Record<string, HTMLInputElement | HTMLSelectElement | null>
  >({});

  // --- Read Context from Query Params ---
  useEffect(() => {
    const prefillBranch = searchParams.get("branchId");
    const prefillZone = searchParams.get("shippingZoneId");

    if (prefillBranch || prefillZone) {
      setFormData((prev) => ({
        ...prev,
        branchId: prefillBranch || prev.branchId,
        shippingZoneId: prefillZone || prev.shippingZoneId,
      }));
      setIsPrefilled(true);
    }
  }, [searchParams]);

  // --- Fetch Initial Data ---
  const fetchBootstrap = async () => {
    try {
      setBootstrapLoading(true);

      const [branchesRes, zonesRes] = await Promise.all([
        http<ApiList<BranchOption>>(
          "GET",
          "/api/v1/admin/branches?limit=1000&status=active",
        ),
        http<ApiList<ShippingZoneOption>>(
          "GET",
          "/api/v1/admin/shipping-zones?limit=1000&status=active",
        ),
      ]);

      setBranches(Array.isArray(branchesRes?.data) ? branchesRes.data : []);
      setZones(Array.isArray(zonesRes?.data) ? zonesRes.data : []);
    } catch (err: any) {
      showErrorToast(err?.message || "Không thể tải dữ liệu chi nhánh / vùng.");
    } finally {
      setBootstrapLoading(false);
    }
  };

  useEffect(() => {
    fetchBootstrap();
  }, []);

  // --- Derived Selectors ---
  const selectedBranch = useMemo(
    () => branches.find((x) => String(x.id) === formData.branchId) || null,
    [branches, formData.branchId],
  );
  const selectedZone = useMemo(
    () => zones.find((x) => String(x.id) === formData.shippingZoneId) || null,
    [zones, formData.shippingZoneId],
  );

  const orderConditionText = useMemo(() => {
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
  }, [formData.minOrderValue, formData.maxOrderValue]);

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
    const { name, value, type } = e.target;
    if (type === "checkbox") {
      const target = e.target as HTMLInputElement;
      setFormData((prev) => ({ ...prev, [name]: target.checked }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
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
    const nextErrors: Record<string, string> = {};

    if (!formData.branchId)
      nextErrors.branchId = "Vui lòng chọn chi nhánh phục vụ.";
    if (!formData.shippingZoneId)
      nextErrors.shippingZoneId = "Vui lòng chọn vùng giao hàng.";

    const deliveryFeeOverrideError = validateOptionalMoney(
      formData.deliveryFeeOverride,
    );
    if (deliveryFeeOverrideError)
      nextErrors.deliveryFeeOverride = deliveryFeeOverrideError;

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
      if (min > max)
        nextErrors.maxOrderValue = "Đơn tối đa phải >= Đơn tối thiểu.";
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      scrollToFirstError(nextErrors);
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setLoading(true);
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
        "POST",
        "/api/v1/admin/branch-service-areas/create",
        payload,
      );

      if (res?.success) {
        showSuccessToast({ message: "Tạo coverage rule thành công!" });
        navigate("/admin/shipping/service-areas");
      } else {
        showErrorToast(res?.message || "Tạo coverage thất bại.");
      }
    } catch (err: any) {
      showErrorToast(err?.message || "Lỗi kết nối server.");
    } finally {
      setLoading(false);
    }
  };

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
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            Tạo Coverage cho chi nhánh
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1.5">
            Xác định chi nhánh nào được phép phục vụ vùng giao hàng nào, cùng
            các quy tắc phí, điều kiện đơn và same-day.
          </p>
        </div>
        <div className="hidden lg:block bg-blue-50 dark:bg-blue-900/30 border border-blue-100 dark:border-blue-800 text-blue-700 dark:text-blue-300 px-4 py-2.5 rounded-lg text-sm max-w-sm">
          <Info className="w-4 h-4 inline-block mr-1.5 -mt-0.5" />
          Sau khi tạo coverage, bước kế tiếp thường là cấu hình Branch Slot để
          chi nhánh bắt đầu nhận đơn.
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="grid grid-cols-1 xl:grid-cols-3 gap-6 lg:gap-8"
      >
        {/* CỘT TRÁI: FORM BUILDER */}
        <div className="xl:col-span-2 space-y-6">
          {/* Section 1: Đối tượng áp dụng (Rule Target Builder) */}
          <Card>
            <div className="border-b border-gray-100 dark:border-gray-700 pb-4 mb-4 flex justify-between items-start">
              <div>
                <h2 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
                  <MapPinned className="w-5 h-5 text-gray-400" /> 1. Chọn đối
                  tượng áp dụng
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Liên kết chi nhánh với vùng giao hàng hệ thống.
                </p>
              </div>
              {isPrefilled && (
                <span className="text-[10px] font-bold bg-green-100 text-green-700 px-1.5 py-0.5 rounded">
                  Đã điền tự động
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
                    disabled={bootstrapLoading}
                    className={`w-full pl-9 pr-4 py-2.5 border rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none disabled:opacity-60 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white ${errors.branchId ? "border-red-500" : "border-gray-300 dark:border-gray-600"}`}
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
                    disabled={bootstrapLoading}
                    className={`w-full pl-9 pr-4 py-2.5 border rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none disabled:opacity-60 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white ${errors.shippingZoneId ? "border-red-500" : "border-gray-300 dark:border-gray-600"}`}
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
          <Card>
            <div className="border-b border-gray-100 dark:border-gray-700 pb-4 mb-4 flex justify-between items-start">
              <div>
                <h2 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
                  <Banknote className="w-5 h-5 text-gray-400" /> 2. Phí giao
                  hàng riêng
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Xác định chi nhánh dùng phí chung của vùng hay sẽ tùy chỉnh
                  lại.
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
                className={`p-4 rounded-xl border-2 transition-all ${formData.deliveryFeeOverride ? "border-amber-500 bg-amber-50/30 dark:bg-amber-900/10" : "border-gray-200 dark:border-gray-700"}`}
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
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-800 text-sm focus:ring-2 focus:ring-amber-500 outline-none"
                />
                {errors.deliveryFeeOverride && (
                  <p className="text-xs text-red-600 mt-1">
                    {errors.deliveryFeeOverride}
                  </p>
                )}
              </div>
            </div>
          </Card>

          {/* Section 3: Điều kiện đơn hàng */}
          <Card>
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
                  className={`w-full border rounded-lg p-2.5 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none ${errors.minOrderValue ? "border-red-500" : "border-gray-300 dark:border-gray-600"}`}
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
                  className={`w-full border rounded-lg p-2.5 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none ${errors.maxOrderValue ? "border-red-500" : "border-gray-300 dark:border-gray-600"}`}
                />
                {errors.maxOrderValue && (
                  <p className="text-xs text-red-600 mt-1.5">
                    {errors.maxOrderValue}
                  </p>
                )}
              </div>
            </div>

            <div className="mt-4 p-3 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800 rounded-lg">
              <p className="text-sm font-medium text-indigo-800 dark:text-indigo-300 flex items-center gap-2">
                <Info className="w-4 h-4 shrink-0" /> {orderConditionText}
              </p>
            </div>
          </Card>

          {/* Section 4: Dịch vụ & Trạng thái */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <div className="border-b border-gray-100 dark:border-gray-700 pb-4 mb-4">
                <h2 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
                  <Zap className="w-5 h-5 text-gray-400" /> Dịch vụ nâng cao
                </h2>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                  Hỗ trợ giao trong ngày (Same-day)
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
                <p className="text-[11px] text-gray-500 mt-2">
                  Bật nếu chi nhánh này có năng lực xử lý đơn giao hỏa tốc cho
                  vùng đã chọn.
                </p>
              </div>
            </Card>

            <Card>
              <div className="border-b border-gray-100 dark:border-gray-700 pb-4 mb-4">
                <h2 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
                  <Power className="w-5 h-5 text-gray-400" /> Trạng thái hoạt
                  động
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
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg p-2.5 bg-white dark:bg-gray-800 text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="active">Hoạt động (Áp dụng ngay)</option>
                  <option value="inactive">
                    Tạm dừng (Lưu cấu hình nhưng chưa áp dụng)
                  </option>
                </select>
                <p className="text-[11px] text-gray-500 mt-2">
                  Chỉ rule ở trạng thái hoạt động mới được sử dụng để lọc danh
                  sách cửa hàng phục vụ khách hàng.
                </p>
              </div>
            </Card>
          </div>
        </div>

        {/* CỘT PHẢI: LIVE PREVIEW PANEL */}
        <div className="xl:col-span-1">
          <div className="sticky top-24 space-y-6">
            {/* Live Activation Summary */}
            <Card className="border-blue-100 dark:border-blue-900/50 bg-gradient-to-br from-blue-50 to-white dark:from-gray-800 dark:to-gray-800/80 shadow-sm overflow-hidden">
              <div className="bg-blue-600 text-white px-4 py-3 -mx-6 -mt-6 mb-5 flex items-center justify-between font-bold shadow-sm">
                <span className="flex items-center gap-2">
                  <Info className="w-5 h-5" /> Bản tóm tắt Coverage
                </span>
              </div>

              {!selectedBranch || !selectedZone ? (
                <div className="flex flex-col items-center justify-center py-10 text-center opacity-60">
                  <MapPinned className="w-10 h-10 text-blue-300 mb-3" />
                  <span className="text-sm font-medium text-gray-600">
                    Chọn Chi nhánh và Vùng giao
                    <br />
                    để xem trước.
                  </span>
                </div>
              ) : (
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

                  <div>
                    <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                      Cấu hình cho nhánh
                    </div>
                    <div className="font-bold text-gray-900 dark:text-white text-base">
                      {selectedBranch.name}{" "}
                      <span className="text-xs font-mono font-normal text-gray-500">
                        ({selectedBranch.code})
                      </span>
                    </div>
                  </div>

                  <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-100 dark:border-gray-700 flex flex-col gap-2 text-[13px]">
                    <div className="flex justify-between items-center border-b border-gray-100 dark:border-gray-700 pb-2">
                      <span className="text-gray-500 font-medium">
                        Sẽ phục vụ vùng:
                      </span>
                      <span className="font-bold text-gray-900 dark:text-white">
                        {selectedZone.name}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500 font-medium">
                        Mức phí áp dụng:
                      </span>
                      {formData.deliveryFeeOverride ? (
                        <span className="font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-1.5 py-0.5 rounded border border-amber-200">
                          {formatCurrencyPreview(formData.deliveryFeeOverride)}
                        </span>
                      ) : (
                        <span className="font-bold text-blue-600 dark:text-blue-400">
                          {formatCurrencyPreview(selectedZone.baseFee)}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-col mt-1">
                      <span className="text-gray-500 font-medium">
                        Dải đơn hàng:
                      </span>
                      <span className="font-bold text-gray-800 dark:text-gray-200 mt-0.5 leading-snug">
                        {orderConditionText}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </Card>

            {/* Next Steps */}
            <Card className="bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
              <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200 mb-3 flex items-center gap-2">
                <ArrowRight className="w-4 h-4 text-gray-500" /> Bước tiếp theo
              </h3>
              <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed mb-3">
                Sau khi gắn Coverage thành công, bạn nên sang mục{" "}
                <strong>Khung giờ chi nhánh</strong> để bật các slot mà cửa hàng
                này sẽ giao.
              </p>
              {selectedBranch && (
                <button
                  type="button"
                  onClick={() =>
                    navigate(
                      `/admin/shipping/branch-delivery-slots/create?branchId=${selectedBranch.id}`,
                    )
                  }
                  className="w-full py-2 bg-white border border-gray-300 rounded text-xs font-bold text-gray-700 hover:bg-gray-50 shadow-sm transition"
                >
                  Mở Khung giờ chi nhánh
                </button>
              )}
            </Card>
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
              onClick={handleSubmit}
              disabled={loading || bootstrapLoading}
              className="flex-1 sm:flex-none px-8 py-2.5 rounded-lg font-medium bg-blue-600 hover:bg-blue-700 text-white transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" /> Đang lưu...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" /> Kích hoạt Coverage
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BranchServiceAreaCreatePage;
