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
} from "lucide-react";
import Card from "../../../components/admin/layouts/Card";
import { http } from "../../../services/http";
import { useAdminToast } from "../../../context/AdminToastContext";

interface BranchOption {
  id: number;
  name: string;
  code: string;
}

interface ShippingZoneOption {
  id: number;
  name: string;
  code: string;
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

const formatCurrencyPreview = (value: string) => {
  if (!value.trim()) return "—";
  const n = Number(value);
  if (!Number.isFinite(n)) return "—";
  return n.toLocaleString("vi-VN") + " đ";
};

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
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const fieldRefs = useRef<
    Record<string, HTMLInputElement | HTMLSelectElement | null>
  >({});

  const selectedBranch = useMemo(
    () => branches.find((x) => String(x.id) === formData?.branchId) || null,
    [branches, formData],
  );
  const selectedZone = useMemo(
    () => zones.find((x) => String(x.id) === formData?.shippingZoneId) || null,
    [zones, formData],
  );

  const isDirty = useMemo(() => {
    if (!formData || !initialData) return false;
    return JSON.stringify(formData) !== JSON.stringify(initialData);
  }, [formData, initialData]);

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
        showErrorToast("Không thể tải dữ liệu cấu hình vùng phục vụ.");
      }

      setBranches(Array.isArray(branchesRes?.data) ? branchesRes.data : []);
      setZones(Array.isArray(zonesRes?.data) ? zonesRes.data : []);
    } catch (err: any) {
      console.error(err);
      showErrorToast(err?.message || "Lỗi tải dữ liệu cấu hình vùng phục vụ.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
  }, [id]);

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

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
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

    if (!formData.branchId) nextErrors.branchId = "Vui lòng chọn chi nhánh.";
    if (!formData.shippingZoneId)
      nextErrors.shippingZoneId = "Vui lòng chọn vùng giao hàng.";

    const deliveryFeeOverrideError = validateOptionalMoney(
      formData.deliveryFeeOverride,
    );
    if (deliveryFeeOverrideError)
      nextErrors.deliveryFeeOverride = "Phí ship override phải là số >= 0.";

    const minError = validateOptionalMoney(formData.minOrderValue);
    if (minError)
      nextErrors.minOrderValue = "Giá trị tối thiểu phải là số >= 0.";

    const maxError = validateOptionalMoney(formData.maxOrderValue);
    if (maxError) nextErrors.maxOrderValue = "Giá trị tối đa phải là số >= 0.";

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
          "Giá trị đơn hàng tối đa phải lớn hơn hoặc bằng tối thiểu.";
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
        showSuccessToast({
          message: "Cập nhật cấu hình vùng phục vụ thành công!",
        });
        setInitialData({ ...formData });
        setErrors({});
      } else {
        showErrorToast(
          res?.message || "Cập nhật cấu hình vùng phục vụ thất bại.",
        );
      }
    } catch (err: any) {
      console.error(err);
      showErrorToast(err?.message || "Lỗi kết nối server.");
    } finally {
      setSaving(false);
    }
  };

  if (loading || !formData) {
    return (
      <div className="flex flex-col justify-center items-center py-32">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600 dark:text-blue-400 mb-4" />
        <span className="text-gray-600 dark:text-gray-400 font-medium">
          Đang tải dữ liệu...
        </span>
      </div>
    );
  }

  // Tiêu đề của Header
  const headerSubtitle =
    selectedBranch && selectedZone
      ? `${selectedBranch.name} → ${selectedZone.name}`
      : "Đang tải mapping...";

  return (
    <div className="max-w-5xl mx-auto pb-24">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-white">
              Chỉnh sửa coverage
            </h1>
            <span
              className={`px-3 py-1 text-xs font-semibold rounded-full border ${
                formData.status === "active"
                  ? "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800"
                  : "bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800"
              }`}
            >
              {formData.status === "active" ? "Đang hoạt động" : "Tạm dừng"}
            </span>
          </div>
          <p className="text-gray-500 dark:text-gray-400 mt-1.5 flex items-center gap-2 font-medium">
            <Settings2 className="w-4 h-4" /> {headerSubtitle}
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate("/admin/shipping/service-areas")}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" /> Quay lại
        </button>
      </div>

      {/* Summary Panel */}
      <Card className="mb-6 bg-gradient-to-br from-blue-50/50 to-white dark:from-gray-800/50 dark:to-gray-800 border-blue-100 dark:border-gray-700">
        <h2 className="text-sm font-bold text-gray-800 dark:text-white mb-4 uppercase tracking-wider flex items-center gap-2">
          <Info className="w-4 h-4 text-blue-500" /> Tóm tắt thông tin hiện tại
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="col-span-2 md:col-span-1">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
              Mapping
            </p>
            <p className="text-sm font-semibold text-gray-900 dark:text-white line-clamp-2">
              {headerSubtitle}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
              Fee Override
            </p>
            <p className="text-sm font-semibold text-amber-600 dark:text-amber-400">
              {formData.deliveryFeeOverride
                ? formatCurrencyPreview(formData.deliveryFeeOverride)
                : "Theo zone gốc"}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
              Điều kiện đơn
            </p>
            <div className="text-sm font-semibold text-gray-900 dark:text-white">
              {formData.minOrderValue || formData.maxOrderValue ? (
                <>
                  {formData.minOrderValue && (
                    <div>
                      Min: {formatCurrencyPreview(formData.minOrderValue)}
                    </div>
                  )}
                  {formData.maxOrderValue && (
                    <div>
                      Max: {formatCurrencyPreview(formData.maxOrderValue)}
                    </div>
                  )}
                </>
              ) : (
                "Không giới hạn"
              )}
            </div>
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
              Same-day
            </p>
            <p className="text-sm font-semibold text-purple-600 dark:text-purple-400">
              {formData.supportsSameDay ? "Có hỗ trợ" : "Không"}
            </p>
          </div>
        </div>
      </Card>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Section 1: Mapping */}
        <Card>
          <div className="border-b border-gray-100 dark:border-gray-700 pb-4 mb-4">
            <h2 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
              <MapPinned className="w-5 h-5 text-gray-400" /> Mapping (Định
              tuyến)
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Liên kết chi nhánh với vùng giao hàng cụ thể.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Chi nhánh <span className="text-red-500">*</span>
              </label>
              <select
                ref={setFieldRef("branchId")}
                name="branchId"
                value={formData.branchId}
                onChange={handleChange}
                className={`w-full border rounded-lg p-2.5 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none ${
                  errors.branchId
                    ? "border-red-500"
                    : "border-gray-300 dark:border-gray-600"
                }`}
              >
                <option value="">Chọn chi nhánh</option>
                {branches.map((branch) => (
                  <option key={branch.id} value={branch.id}>
                    {branch.name} ({branch.code})
                  </option>
                ))}
              </select>
              {errors.branchId && (
                <p className="text-sm text-red-600 mt-1.5 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" /> {errors.branchId}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Vùng giao hàng <span className="text-red-500">*</span>
              </label>
              <select
                ref={setFieldRef("shippingZoneId")}
                name="shippingZoneId"
                value={formData.shippingZoneId}
                onChange={handleChange}
                className={`w-full border rounded-lg p-2.5 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none ${
                  errors.shippingZoneId
                    ? "border-red-500"
                    : "border-gray-300 dark:border-gray-600"
                }`}
              >
                <option value="">Chọn vùng giao hàng</option>
                {zones.map((zone) => (
                  <option key={zone.id} value={zone.id}>
                    {zone.name} ({zone.code})
                  </option>
                ))}
              </select>
              {errors.shippingZoneId && (
                <p className="text-sm text-red-600 mt-1.5 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" /> {errors.shippingZoneId}
                </p>
              )}
            </div>
          </div>

          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-6 border border-gray-100 dark:border-gray-700">
            <p className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-4 uppercase tracking-wider">
              Preview Mapping
            </p>
            <div className="flex flex-col md:flex-row items-center gap-4">
              <div className="flex-1 w-full bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-600 shadow-sm flex items-center gap-3">
                <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-md">
                  <Store className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="font-bold text-gray-900 dark:text-white">
                    {selectedBranch?.name || "Chưa chọn chi nhánh"}
                  </p>
                  <p className="text-xs text-gray-500">
                    Mã: {selectedBranch?.code || "N/A"}
                  </p>
                </div>
              </div>

              <div className="flex justify-center p-2 rounded-full bg-gray-200 dark:bg-gray-700">
                <ArrowRight className="w-5 h-5 text-gray-500 dark:text-gray-400 md:rotate-0 rotate-90" />
              </div>

              <div className="flex-1 w-full bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-600 shadow-sm flex items-center gap-3">
                <div className="bg-green-100 dark:bg-green-900/30 p-2 rounded-md">
                  <MapPinned className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="font-bold text-gray-900 dark:text-white">
                    {selectedZone?.name || "Chưa chọn vùng giao hàng"}
                  </p>
                  <p className="text-xs text-gray-500">
                    Mã: {selectedZone?.code || "N/A"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Section 2: Pricing override */}
        <Card>
          <div className="border-b border-gray-100 dark:border-gray-700 pb-4 mb-4">
            <h2 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
              <Banknote className="w-5 h-5 text-gray-400" /> Pricing override
              (Tùy chỉnh phí)
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Chi nhánh có thể thiết lập mức phí riêng thay vì dùng mức phí gốc
              của vùng.
            </p>
          </div>

          <div className="max-w-md">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Phí ship override (VNĐ)
            </label>
            <input
              ref={setFieldRef("deliveryFeeOverride")}
              type="number"
              min="0"
              step="1000"
              name="deliveryFeeOverride"
              value={formData.deliveryFeeOverride}
              onChange={handleChange}
              placeholder="Để trống nếu dùng theo zone"
              className={`w-full border rounded-lg p-2.5 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none ${
                errors.deliveryFeeOverride
                  ? "border-red-500"
                  : "border-gray-300 dark:border-gray-600"
              }`}
            />
            <p className="text-[13px] text-gray-500 dark:text-gray-400 mt-1.5 flex items-start gap-1">
              <Info className="w-4 h-4 shrink-0 mt-0.5" />
              Để trống nếu branch dùng base fee của shipping zone.
            </p>
            {errors.deliveryFeeOverride && (
              <p className="text-sm text-red-600 mt-1.5 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" /> {errors.deliveryFeeOverride}
              </p>
            )}

            {formData.deliveryFeeOverride && (
              <div className="mt-2 text-sm font-medium text-amber-600 dark:text-amber-500">
                Phí thực tế sẽ áp dụng:{" "}
                {formatCurrencyPreview(formData.deliveryFeeOverride)}
              </div>
            )}
          </div>
        </Card>

        {/* Section 3: Điều kiện áp dụng */}
        <Card>
          <div className="border-b border-gray-100 dark:border-gray-700 pb-4 mb-4">
            <h2 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
              <Tags className="w-5 h-5 text-gray-400" /> Điều kiện áp dụng đơn
              hàng
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Giới hạn giá trị đơn hàng để mapping này có hiệu lực. Để trống để
              không giới hạn.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Giá trị đơn tối thiểu (VNĐ)
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
                className={`w-full border rounded-lg p-2.5 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none ${
                  errors.minOrderValue
                    ? "border-red-500"
                    : "border-gray-300 dark:border-gray-600"
                }`}
              />
              <p className="text-[13px] text-gray-500 dark:text-gray-400 mt-1.5">
                Áp dụng cho đơn có giá trị lớn hơn hoặc bằng mức này.
              </p>
              {errors.minOrderValue && (
                <p className="text-sm text-red-600 mt-1.5 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" /> {errors.minOrderValue}
                </p>
              )}
              {formData.minOrderValue && (
                <p className="text-xs text-gray-500 mt-1 font-medium">
                  Giá trị: {formatCurrencyPreview(formData.minOrderValue)}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Giá trị đơn tối đa (VNĐ)
              </label>
              <input
                ref={setFieldRef("maxOrderValue")}
                type="number"
                min="0"
                step="1000"
                name="maxOrderValue"
                value={formData.maxOrderValue}
                onChange={handleChange}
                placeholder="VD: 10000000"
                className={`w-full border rounded-lg p-2.5 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none ${
                  errors.maxOrderValue
                    ? "border-red-500"
                    : "border-gray-300 dark:border-gray-600"
                }`}
              />
              <p className="text-[13px] text-gray-500 dark:text-gray-400 mt-1.5">
                Nếu nhập cả hai, max phải lớn hơn hoặc bằng min.
              </p>
              {errors.maxOrderValue && (
                <p className="text-sm text-red-600 mt-1.5 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" /> {errors.maxOrderValue}
                </p>
              )}
              {formData.maxOrderValue && (
                <p className="text-xs text-gray-500 mt-1 font-medium">
                  Giá trị: {formatCurrencyPreview(formData.maxOrderValue)}
                </p>
              )}
            </div>
          </div>
        </Card>

        {/* Section 4: Dịch vụ & Trạng thái */}
        <Card>
          <div className="border-b border-gray-100 dark:border-gray-700 pb-4 mb-4">
            <h2 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
              <Zap className="w-5 h-5 text-gray-400" /> Dịch vụ & Trạng thái
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Thiết lập giao hỏa tốc và trạng thái hoạt động của coverage này.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
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
                  {formData.supportsSameDay ? "Đang bật" : "Đang tắt"}
                </span>
              </label>
              <p className="text-[13px] text-gray-500 mt-2">
                Bật nếu branch cho phép giao trong ngày với zone này.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Trạng thái hoạt động
              </label>
              <select
                ref={setFieldRef("status")}
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg p-2.5 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option value="active">Hoạt động</option>
                <option value="inactive">Tạm dừng</option>
              </select>
              <p className="text-[13px] text-gray-500 mt-1.5">
                Chọn "Tạm dừng" sẽ vô hiệu hóa hoàn toàn mapping này.
              </p>
            </div>
          </div>
        </Card>

        {/* Action Bar (Sticky) */}
        <div className="fixed bottom-0 left-0 right-0 md:left-64 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 p-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-20">
          <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              {isDirty ? (
                <span className="text-amber-600 dark:text-amber-500 text-sm font-medium flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4" /> Có thay đổi chưa lưu
                </span>
              ) : (
                <span className="text-gray-500 dark:text-gray-400 text-sm flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" /> Bạn chưa thay đổi dữ liệu
                </span>
              )}
            </div>

            <div className="flex gap-3 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => navigate("/admin/shipping/service-areas")}
                className="flex-1 sm:flex-none px-6 py-2.5 rounded-lg font-medium bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-200 transition-colors"
              >
                Quay lại
              </button>

              <button
                type="submit"
                disabled={saving || !isDirty}
                className="flex-1 sm:flex-none px-6 py-2.5 rounded-lg font-medium bg-blue-600 hover:bg-blue-700 text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-sm"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" /> Đang lưu...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" /> Lưu thay đổi
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default BranchServiceAreaEditPage;
