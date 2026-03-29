import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Loader2, Save } from "lucide-react";
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

    if (!formData.branchId) {
      nextErrors.branchId = "Vui lòng chọn chi nhánh.";
    }

    if (!formData.shippingZoneId) {
      nextErrors.shippingZoneId = "Vui lòng chọn vùng giao hàng.";
    }

    const deliveryFeeOverrideError = validateOptionalMoney(
      formData.deliveryFeeOverride,
    );
    if (deliveryFeeOverrideError) {
      nextErrors.deliveryFeeOverride = "Phí ship override phải là số >= 0.";
    }

    const minError = validateOptionalMoney(formData.minOrderValue);
    if (minError) {
      nextErrors.minOrderValue = "Giá trị tối thiểu phải là số >= 0.";
    }

    const maxError = validateOptionalMoney(formData.maxOrderValue);
    if (maxError) {
      nextErrors.maxOrderValue = "Giá trị tối đa phải là số >= 0.";
    }

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
        navigate("/admin/shipping/service-areas");
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
      <div className="flex justify-center items-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-gray-500 dark:text-gray-400" />
        <span className="ml-2 text-gray-600 dark:text-gray-400">
          Đang tải dữ liệu...
        </span>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6 gap-4">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
          Chỉnh sửa cấu hình vùng phục vụ
        </h1>
        <button
          onClick={() => navigate("/admin/shipping/service-areas")}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-md transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Quay lại
        </button>
      </div>

      <Card>
        <form onSubmit={handleSave} className="space-y-6 p-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Chi nhánh <span className="text-red-500">*</span>
              </label>
              <select
                ref={setFieldRef("branchId")}
                name="branchId"
                value={formData.branchId}
                onChange={handleChange}
                className={`w-full border rounded-md p-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white ${
                  errors.branchId
                    ? "border-red-500 dark:border-red-500"
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
                <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                  {errors.branchId}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Vùng giao hàng <span className="text-red-500">*</span>
              </label>
              <select
                ref={setFieldRef("shippingZoneId")}
                name="shippingZoneId"
                value={formData.shippingZoneId}
                onChange={handleChange}
                className={`w-full border rounded-md p-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white ${
                  errors.shippingZoneId
                    ? "border-red-500 dark:border-red-500"
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
                <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                  {errors.shippingZoneId}
                </p>
              )}
            </div>
          </div>

          <div className="rounded-lg border border-dashed border-gray-300 dark:border-gray-600 p-4 bg-gray-50 dark:bg-gray-800/40">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Xem trước mapping:
            </p>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              {selectedBranch?.name || "Chưa chọn chi nhánh"} →{" "}
              {selectedZone?.name || "Chưa chọn vùng giao hàng"}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Phí ship override
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
                className={`w-full border rounded-md p-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white ${
                  errors.deliveryFeeOverride
                    ? "border-red-500 dark:border-red-500"
                    : "border-gray-300 dark:border-gray-600"
                }`}
              />
              {errors.deliveryFeeOverride && (
                <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                  {errors.deliveryFeeOverride}
                </p>
              )}
              <p className="text-xs text-gray-500 mt-1">
                Preview: {formatCurrencyPreview(formData.deliveryFeeOverride)}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Giá trị đơn tối thiểu
              </label>
              <input
                ref={setFieldRef("minOrderValue")}
                type="number"
                min="0"
                step="1000"
                name="minOrderValue"
                value={formData.minOrderValue}
                onChange={handleChange}
                placeholder="Để trống nếu không giới hạn"
                className={`w-full border rounded-md p-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white ${
                  errors.minOrderValue
                    ? "border-red-500 dark:border-red-500"
                    : "border-gray-300 dark:border-gray-600"
                }`}
              />
              {errors.minOrderValue && (
                <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                  {errors.minOrderValue}
                </p>
              )}
              <p className="text-xs text-gray-500 mt-1">
                Preview: {formatCurrencyPreview(formData.minOrderValue)}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Giá trị đơn tối đa
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
                className={`w-full border rounded-md p-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white ${
                  errors.maxOrderValue
                    ? "border-red-500 dark:border-red-500"
                    : "border-gray-300 dark:border-gray-600"
                }`}
              />
              {errors.maxOrderValue && (
                <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                  {errors.maxOrderValue}
                </p>
              )}
              <p className="text-xs text-gray-500 mt-1">
                Preview: {formatCurrencyPreview(formData.maxOrderValue)}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Trạng thái
              </label>
              <select
                ref={setFieldRef("status")}
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-md p-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              >
                <option value="active">Hoạt động</option>
                <option value="inactive">Tạm dừng</option>
              </select>
            </div>

            <label className="flex items-center gap-3 h-10">
              <input
                type="checkbox"
                name="supportsSameDay"
                checked={formData.supportsSameDay}
                onChange={handleChange}
                className="h-4 w-4"
              />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Hỗ trợ same-day
              </span>
            </label>
          </div>

          <div className="rounded-lg bg-blue-50 dark:bg-blue-900/20 p-4 text-sm text-blue-700 dark:text-blue-300">
            Nếu để trống phí override, hệ thống sẽ dùng phí mặc định theo
            Shipping Zone.
          </div>

          <div className="border-t border-gray-200 dark:border-gray-700 pt-4 flex justify-between items-center">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {formData.updatedAt && (
                <span>
                  Cập nhật gần nhất:{" "}
                  {new Date(formData.updatedAt).toLocaleString()}
                </span>
              )}
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => navigate("/admin/shipping/service-areas")}
                className="px-4 py-2 rounded-md bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-white transition-colors"
              >
                Hủy
              </button>

              <button
                type="submit"
                disabled={saving || !isDirty}
                className="px-5 py-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white transition-colors disabled:opacity-60 disabled:cursor-not-allowed inline-flex items-center gap-2"
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                Lưu thay đổi
              </button>
            </div>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default BranchServiceAreaEditPage;
