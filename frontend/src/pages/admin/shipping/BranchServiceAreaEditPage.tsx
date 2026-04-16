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
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Copy,
  Loader2,
  MapPinned,
  Power,
  Save,
  Store,
  Truck,
  History,
  ShieldAlert,
  AlertTriangle,
  Info,
} from "lucide-react";
import Card from "../../../components/admin/layouts/Card";
import { http } from "../../../services/http";
import { useAdminToast } from "../../../context/AdminToastContext";

type Status = "active" | "inactive";

interface BranchOption {
  id: number;
  name: string;
  code: string;
}

interface ShippingZoneOption {
  id: number;
  name: string;
  code: string;
  baseFee?: number | null;
  province?: string | null;
  district?: string | null;
  ward?: string | null;
}

interface BranchServiceAreaDetail {
  id: number;
  branchId: number;
  shippingZoneId: number;
  deliveryFeeOverride?: number | null;
  minOrderValue?: number | null;
  maxOrderValue?: number | null;
  supportsSameDay: boolean;
  status: Status;
  createdAt?: string;
  updatedAt?: string;
}

interface FormDataState {
  branchId: string;
  shippingZoneId: string;
  deliveryFeeOverride: string;
  minOrderValue: string;
  maxOrderValue: string;
  supportsSameDay: boolean;
  status: Status;
}

type ApiDetail<T> = { success: boolean; data: T; message?: string };
type ApiList<T> = {
  success: boolean;
  data: T[] | { items: T[] };
  meta?: { total?: number };
};

const toFormData = (row: BranchServiceAreaDetail): FormDataState => ({
  branchId: String(row.branchId ?? ""),
  shippingZoneId: String(row.shippingZoneId ?? ""),
  deliveryFeeOverride:
    row.deliveryFeeOverride === null || row.deliveryFeeOverride === undefined
      ? ""
      : String(row.deliveryFeeOverride),
  minOrderValue:
    row.minOrderValue === null || row.minOrderValue === undefined
      ? ""
      : String(row.minOrderValue),
  maxOrderValue:
    row.maxOrderValue === null || row.maxOrderValue === undefined
      ? ""
      : String(row.maxOrderValue),
  supportsSameDay: Boolean(row.supportsSameDay),
  status: row.status ?? "active",
});

const formatCurrency = (value?: string | number | null) => {
  if (value === "" || value === null || value === undefined) return "—";
  const n = Number(value);
  if (!Number.isFinite(n)) return "—";
  return `${n.toLocaleString("vi-VN")} đ`;
};

const zoneAreaLabel = (zone?: ShippingZoneOption | null) => {
  if (!zone) return "—";
  const parts = [zone.ward, zone.district, zone.province].filter(Boolean);
  return parts.length ? parts.join(", ") : "Dự phòng toàn quốc";
};

const BranchServiceAreaEditPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { showSuccessToast, showErrorToast } = useAdminToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [togglingStatus, setTogglingStatus] = useState(false);
  const [detail, setDetail] = useState<BranchServiceAreaDetail | null>(null);
  const [formData, setFormData] = useState<FormDataState | null>(null);
  const [initialData, setInitialData] = useState<FormDataState | null>(null);
  const [branches, setBranches] = useState<BranchOption[]>([]);
  const [zones, setZones] = useState<ShippingZoneOption[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const fieldRefs = useRef<
    Record<string, HTMLInputElement | HTMLSelectElement | null>
  >({});

  useEffect(() => {
    const fetchBootstrap = async () => {
      try {
        setLoading(true);
        const [detailRes, branchesRes, zonesRes] = await Promise.all([
          http<ApiDetail<BranchServiceAreaDetail>>(
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
        const detailRow = detailRes?.data;
        const branchRows = Array.isArray(branchesRes?.data)
          ? branchesRes.data
          : branchesRes?.data?.items || [];
        const zoneRows = Array.isArray(zonesRes?.data)
          ? zonesRes.data
          : zonesRes?.data?.items || [];
        setBranches(branchRows);
        setZones(zoneRows);
        setDetail(detailRow);
        const mapped = toFormData(detailRow);
        setFormData(mapped);
        setInitialData(mapped);
      } catch (error: any) {
        showErrorToast(
          error?.message || "Không thể tải dữ liệu khu vực phục vụ.",
        );
      } finally {
        setLoading(false);
      }
    };
    fetchBootstrap();
  }, [id, showErrorToast]);

  const selectedBranch = useMemo(
    () =>
      branches.find((item) => String(item.id) === formData?.branchId) || null,
    [branches, formData?.branchId],
  );

  const selectedZone = useMemo(
    () =>
      zones.find((item) => String(item.id) === formData?.shippingZoneId) ||
      null,
    [zones, formData?.shippingZoneId],
  );

  const isDirty = useMemo(() => {
    if (!formData || !initialData) return false;
    return JSON.stringify(formData) !== JSON.stringify(initialData);
  }, [formData, initialData]);

  const impactNotes = useMemo(() => {
    if (!formData || !initialData) return [] as string[];
    const notes: string[] = [];
    if (formData.branchId !== initialData.branchId)
      notes.push(
        "Khu vực phục vụ (coverage) sẽ được chuyển sang chi nhánh khác, cần kiểm tra lại danh sách cài đặt của cả hai chi nhánh.",
      );
    if (formData.shippingZoneId !== initialData.shippingZoneId)
      notes.push(
        "Vùng giao áp dụng sẽ thay đổi, ảnh hưởng trực tiếp tới phạm vi phân giải địa chỉ của chi nhánh.",
      );
    if (formData.supportsSameDay !== initialData.supportsSameDay)
      notes.push(
        formData.supportsSameDay
          ? "Bạn đang bật giao hàng trong ngày (same-day) cho khu vực này."
          : "Bạn đang tắt giao hàng trong ngày (same-day) cho khu vực này.",
      );
    if (
      (formData.deliveryFeeOverride || "") !==
      (initialData.deliveryFeeOverride || "")
    )
      notes.push(
        "Phí giao hàng ghi đè đã thay đổi; báo giá thực tế của chi nhánh sẽ khác so với phí cơ bản của vùng.",
      );
    if (formData.status !== initialData.status)
      notes.push(
        formData.status === "inactive"
          ? "CẢNH BÁO: Khu vực phục vụ sẽ không còn được dùng trong luồng vận hành."
          : "Khu vực phục vụ sẽ được kích hoạt lại trong luồng vận hành.",
      );
    return notes;
  }, [formData, initialData]);

  const summaryOrderRule = useMemo(() => {
    if (!formData) return "";
    const hasMin = formData.minOrderValue.trim() !== "";
    const hasMax = formData.maxOrderValue.trim() !== "";
    if (!hasMin && !hasMax) return "Mọi đơn hàng";
    if (hasMin && hasMax)
      return `Từ ${formatCurrency(formData.minOrderValue)} đến ${formatCurrency(formData.maxOrderValue)}`;
    if (hasMin) return `Từ ${formatCurrency(formData.minOrderValue)} trở lên`;
    return `Tối đa ${formatCurrency(formData.maxOrderValue)}`;
  }, [formData]);

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

  const validate = () => {
    if (!formData) return false;
    const nextErrors: Record<string, string> = {};
    if (!formData.branchId) nextErrors.branchId = "Vui lòng chọn chi nhánh.";
    if (!formData.shippingZoneId)
      nextErrors.shippingZoneId = "Vui lòng chọn vùng giao.";
    if (formData.minOrderValue && Number(formData.minOrderValue) < 0)
      nextErrors.minOrderValue = "Giá trị tối thiểu không hợp lệ.";
    if (formData.maxOrderValue && Number(formData.maxOrderValue) < 0)
      nextErrors.maxOrderValue = "Giá trị tối đa không hợp lệ.";
    if (
      formData.minOrderValue &&
      formData.maxOrderValue &&
      Number(formData.minOrderValue) > Number(formData.maxOrderValue)
    ) {
      nextErrors.maxOrderValue =
        "Giá trị tối đa phải lớn hơn hoặc bằng tối thiểu.";
    }
    if (
      formData.deliveryFeeOverride &&
      Number(formData.deliveryFeeOverride) < 0
    ) {
      nextErrors.deliveryFeeOverride = "Phí ghi đè không hợp lệ.";
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      scrollToFirstError(nextErrors);
      return false;
    }
    return true;
  };

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    if (!formData) return;
    const { name, value, type } = e.target;
    const nextValue =
      type === "checkbox" ? (e.target as HTMLInputElement).checked : value;
    setFormData({ ...formData, [name]: nextValue } as FormDataState);
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!formData || !validate()) return;
    try {
      setSaving(true);
      await http("PATCH", `/api/v1/admin/branch-service-areas/edit/${id}`, {
        branchId: Number(formData.branchId),
        shippingZoneId: Number(formData.shippingZoneId),
        deliveryFeeOverride:
          formData.deliveryFeeOverride === ""
            ? null
            : Number(formData.deliveryFeeOverride),
        minOrderValue:
          formData.minOrderValue === "" ? null : Number(formData.minOrderValue),
        maxOrderValue:
          formData.maxOrderValue === "" ? null : Number(formData.maxOrderValue),
        supportsSameDay: formData.supportsSameDay,
        status: formData.status,
      });
      showSuccessToast({ message: "Đã cập nhật quy tắc khu vực phục vụ." });
      setInitialData({ ...formData });
      setErrors({});
    } catch (error: any) {
      showErrorToast(
        error?.message || "Không thể cập nhật quy tắc khu vực phục vụ.",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async () => {
    if (!formData) return;
    try {
      setTogglingStatus(true);
      const nextStatus: Status =
        formData.status === "active" ? "inactive" : "active";
      await http("PATCH", `/api/v1/admin/branch-service-areas/${id}/status`, {
        status: nextStatus,
      });
      setFormData({ ...formData, status: nextStatus });
      setInitialData((prev) => (prev ? { ...prev, status: nextStatus } : prev));
      showSuccessToast({
        message:
          nextStatus === "active"
            ? "Đã bật khu vực phục vụ."
            : "Đã tạm dừng khu vực phục vụ.",
      });
    } catch (error: any) {
      showErrorToast(
        error?.message || "Không thể đổi trạng thái khu vực phục vụ.",
      );
    } finally {
      setTogglingStatus(false);
    }
  };

  if (loading || !formData || !initialData) {
    return (
      <div className="flex flex-col justify-center items-center py-32 max-w-7xl mx-auto">
        <Loader2 className="w-10 h-10 animate-spin text-blue-600 mb-4" />
        <span className="text-gray-800 dark:text-gray-200 font-bold text-lg">
          Đang tải dữ liệu quy tắc...
        </span>
      </div>
    );
  }

  const isStatusChanged = formData.status !== initialData.status;

  return (
    <div className="max-w-7xl mx-auto pb-24">
      {/* Header & Intro */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
        <div>
          <button
            type="button"
            onClick={() => navigate("/admin/shipping/service-areas")}
            className="flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-blue-600 transition-colors mb-2"
          >
            <ArrowLeft className="w-4 h-4" /> Quay lại danh sách
          </button>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              Chỉnh sửa quy tắc khu vực
            </h1>
            <span
              className={`px-2.5 py-1 rounded-full text-xs font-bold border ${
                formData.status === "active"
                  ? "bg-green-100 text-green-700 border-green-200"
                  : "bg-gray-100 text-gray-600 border-gray-200"
              }`}
            >
              {formData.status === "active" ? "Đang hoạt động" : "Tạm dừng"}
            </span>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1.5">
            Chỉnh sửa chi tiết một quy tắc khu vực phục vụ, đồng thời theo dõi
            ngay tác động tới thiết lập của chi nhánh, giao hàng trong ngày và
            báo giá.
          </p>
        </div>

        <div className="hidden lg:flex items-center gap-2 bg-blue-50 dark:bg-blue-900/30 border border-blue-100 dark:border-blue-800 text-blue-700 dark:text-blue-300 px-4 py-2.5 rounded-lg text-sm">
          <History className="w-4 h-4" />
          {detail?.updatedAt
            ? `Cập nhật gần nhất: ${new Date(detail.updatedAt).toLocaleString("vi-VN")}`
            : "Đang chỉnh sửa quy tắc hiện có"}
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="grid grid-cols-1 xl:grid-cols-3 gap-6 lg:gap-8"
      >
        {/* CỘT TRÁI: FORM BUILDER */}
        <div className="xl:col-span-2 space-y-6">
          {/* Section 1: Liên kết branch và zone */}
          <Card className="border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-100 dark:border-gray-700">
              <Store className="w-5 h-5 text-gray-400" />
              <h2 className="text-lg font-bold text-gray-800 dark:text-white">
                1. Liên kết chi nhánh và vùng
              </h2>
            </div>

            <p className="text-sm text-gray-600 dark:text-gray-400 mb-5">
              Chọn đúng chi nhánh và vùng giao để giữ ma trận khu vực phục vụ
              chính xác.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  Chi nhánh <span className="text-red-500">*</span>
                </label>
                <select
                  ref={setFieldRef("branchId")}
                  name="branchId"
                  value={formData.branchId}
                  onChange={handleChange}
                  className={`w-full border rounded-lg p-2.5 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all ${
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
                  <p className="text-xs text-red-600 mt-1.5">
                    {errors.branchId}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  Vùng giao <span className="text-red-500">*</span>
                </label>
                <select
                  ref={setFieldRef("shippingZoneId")}
                  name="shippingZoneId"
                  value={formData.shippingZoneId}
                  onChange={handleChange}
                  className={`w-full border rounded-lg p-2.5 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all ${
                    errors.shippingZoneId
                      ? "border-red-500"
                      : "border-gray-300 dark:border-gray-600"
                  }`}
                >
                  <option value="">Chọn vùng giao</option>
                  {zones.map((zone) => (
                    <option key={zone.id} value={zone.id}>
                      {zone.name} ({zone.code})
                    </option>
                  ))}
                </select>
                {errors.shippingZoneId && (
                  <p className="text-xs text-red-600 mt-1.5">
                    {errors.shippingZoneId}
                  </p>
                )}
              </div>
            </div>

            <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900 dark:bg-blue-900/30 dark:border-blue-800 dark:text-blue-300">
              <div className="flex flex-wrap items-center gap-2 font-medium">
                <MapPinned className="h-4 w-4" />
                {selectedBranch?.name || "Chưa chọn chi nhánh"}
                <ArrowRight className="h-4 w-4" />
                {selectedZone?.name || "Chưa chọn vùng giao"}
              </div>
              <p className="mt-2 text-blue-800/80 dark:text-blue-300/80 font-medium">
                Phạm vi áp dụng: {zoneAreaLabel(selectedZone)}
              </p>
            </div>
          </Card>

          {/* Section 2: Quy tắc giao hàng */}
          <Card className="border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-100 dark:border-gray-700">
              <Truck className="w-5 h-5 text-gray-400" />
              <h2 className="text-lg font-bold text-gray-800 dark:text-white">
                2. Quy tắc giao hàng
              </h2>
            </div>

            <p className="text-sm text-gray-600 dark:text-gray-400 mb-5">
              Thiết lập phạm vi đơn hàng, giao hàng trong ngày và ghi đè phí ở
              mức độ khu vực.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  Phí ghi đè
                </label>
                <input
                  ref={setFieldRef("deliveryFeeOverride")}
                  type="number"
                  min="0"
                  step="1"
                  name="deliveryFeeOverride"
                  value={formData.deliveryFeeOverride}
                  onChange={handleChange}
                  placeholder="Bỏ trống để dùng phí cơ bản"
                  className={`w-full border rounded-lg p-2.5 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all ${
                    errors.deliveryFeeOverride
                      ? "border-red-500"
                      : "border-gray-300 dark:border-gray-600"
                  }`}
                />
                <div className="text-xs font-medium text-blue-600 mt-1.5 bg-blue-50 p-1.5 rounded w-fit">
                  Preview: {formatCurrency(formData.deliveryFeeOverride)}
                </div>
                {errors.deliveryFeeOverride && (
                  <p className="text-xs text-red-600 mt-1.5">
                    {errors.deliveryFeeOverride}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  Đơn tối thiểu
                </label>
                <input
                  ref={setFieldRef("minOrderValue")}
                  type="number"
                  min="0"
                  step="1"
                  name="minOrderValue"
                  value={formData.minOrderValue}
                  onChange={handleChange}
                  placeholder="Không giới hạn"
                  className={`w-full border rounded-lg p-2.5 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all ${
                    errors.minOrderValue
                      ? "border-red-500"
                      : "border-gray-300 dark:border-gray-600"
                  }`}
                />
                {errors.minOrderValue && (
                  <p className="text-xs text-red-600 mt-1.5">
                    {errors.minOrderValue}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  Đơn tối đa
                </label>
                <input
                  ref={setFieldRef("maxOrderValue")}
                  type="number"
                  min="0"
                  step="1"
                  name="maxOrderValue"
                  value={formData.maxOrderValue}
                  onChange={handleChange}
                  placeholder="Không giới hạn"
                  className={`w-full border rounded-lg p-2.5 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all ${
                    errors.maxOrderValue
                      ? "border-red-500"
                      : "border-gray-300 dark:border-gray-600"
                  }`}
                />
                {errors.maxOrderValue && (
                  <p className="text-xs text-red-600 mt-1.5">
                    {errors.maxOrderValue}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <label className="flex items-start gap-3 rounded-lg border border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-800/50 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition">
                <input
                  type="checkbox"
                  name="supportsSameDay"
                  checked={formData.supportsSameDay}
                  onChange={handleChange}
                  className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
                />
                <div>
                  <div className="text-sm font-semibold text-gray-900 dark:text-white">
                    Hỗ trợ giao hàng trong ngày
                  </div>
                  <p className="text-[13px] text-gray-600 dark:text-gray-400 mt-0.5">
                    Bật khi vùng này có thể nhận các suất giao nhanh trong ngày.
                  </p>
                </div>
              </label>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  Trạng thái hoạt động
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg p-2.5 bg-white dark:bg-gray-800 text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="active">Đang bật</option>
                  <option value="inactive">Tạm dừng</option>
                </select>
              </div>
            </div>
          </Card>

          {/* Section 3: Ảnh hưởng thay đổi */}
          <Card
            className={
              impactNotes.length
                ? "border-amber-200"
                : "border-gray-200 dark:border-gray-700"
            }
          >
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-100 dark:border-gray-700">
              <ShieldAlert
                className={`w-5 h-5 ${
                  impactNotes.length ? "text-amber-500" : "text-gray-400"
                }`}
              />
              <h2 className="text-lg font-bold text-gray-800 dark:text-white">
                3. Ảnh hưởng thay đổi
              </h2>
            </div>

            {impactNotes.length === 0 ? (
              <div className="text-sm text-gray-500">
                Chưa có thay đổi nào so với dữ liệu ban đầu.
              </div>
            ) : (
              <div className="space-y-3">
                {impactNotes.map((note, index) => (
                  <div
                    key={index}
                    className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800"
                  >
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                      <span>{note}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* CỘT PHẢI: LIVE PREVIEW PANEL */}
        <div className="xl:col-span-1">
          <div className="sticky top-24 space-y-6">
            <Card className="border-blue-100 dark:border-blue-900/50 bg-gradient-to-br from-blue-50 to-white dark:from-gray-800 dark:to-gray-800/80 shadow-sm overflow-hidden">
              <div className="bg-blue-600 text-white px-4 py-3 -mx-6 -mt-6 mb-5 flex items-center gap-2 font-bold shadow-sm">
                <Info className="w-5 h-5" /> Tóm tắt Live Preview
              </div>

              <div className="space-y-4 text-sm">
                <div>
                  <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                    Chi nhánh áp dụng
                  </div>
                  <div className="font-bold text-gray-900 dark:text-white">
                    {selectedBranch?.name || "—"}
                  </div>
                  <div className="text-xs font-mono text-gray-500 mt-1">
                    {selectedBranch?.code || "—"}
                  </div>
                </div>

                <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                  <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                    Vùng giao hàng
                  </div>
                  <div className="font-bold text-gray-900 dark:text-white">
                    {selectedZone?.name || "—"}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {zoneAreaLabel(selectedZone)}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                  <div>
                    <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                      Điều kiện áp dụng
                    </div>
                    <div className="font-bold text-gray-900 dark:text-white">
                      {summaryOrderRule}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                      Giao trong ngày
                    </div>
                    <div
                      className={`font-bold ${formData.supportsSameDay ? "text-green-600 dark:text-green-400" : "text-gray-900 dark:text-white"}`}
                    >
                      {formData.supportsSameDay ? "Có hỗ trợ" : "Không hỗ trợ"}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                  <div>
                    <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                      Phí cơ bản vùng
                    </div>
                    <div className="font-bold text-gray-900 dark:text-white">
                      {formatCurrency(selectedZone?.baseFee)}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                      Phí ghi đè
                    </div>
                    <div
                      className={`font-bold ${formData.deliveryFeeOverride ? "text-blue-600 dark:text-blue-400" : "text-gray-900 dark:text-white"}`}
                    >
                      {formData.deliveryFeeOverride
                        ? formatCurrency(formData.deliveryFeeOverride)
                        : "Không ghi đè"}
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-gray-200 dark:border-gray-700 grid grid-cols-2 gap-3">
                  <div>
                    <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                      Trạng thái
                    </div>
                    <div className="font-bold text-gray-900 dark:text-white">
                      {formData.status === "active" ? "Hoạt động" : "Tạm dừng"}
                    </div>
                  </div>
                  {detail?.createdAt && (
                    <div>
                      <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                        Ngày tạo
                      </div>
                      <div className="text-xs text-gray-500 font-medium">
                        {new Date(detail.createdAt).toLocaleDateString("vi-VN")}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </Card>

            <Card className="bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
              <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200 mb-3 flex items-center gap-2">
                <ArrowRight className="w-4 h-4" /> Hành động tiếp theo
              </h3>
              <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed mb-4">
                Sau khi lưu, bạn có thể mở nhanh các luồng vận hành liên quan
                hoặc tạo quy tắc tương tự.
              </p>

              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() =>
                    navigate(
                      `/admin/shipping/branch-service-areas/create?branchId=${formData.branchId}&shippingZoneId=${formData.shippingZoneId}`,
                    )
                  }
                  className="flex w-full items-center justify-between rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2.5 text-left text-[13px] font-medium text-gray-700 dark:text-gray-200 hover:border-blue-300 hover:text-blue-600 transition"
                >
                  <span className="flex items-center gap-2">
                    <Copy className="w-4 h-4" /> Tạo quy tắc tương tự
                  </span>
                  <ArrowRight className="h-3.5 w-3.5 opacity-50" />
                </button>
                <button
                  type="button"
                  onClick={() =>
                    navigate(
                      `/admin/shipping/branch-delivery-time-slots?branchId=${formData.branchId}`,
                    )
                  }
                  className="flex w-full items-center justify-between rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2.5 text-left text-[13px] font-medium text-gray-700 dark:text-gray-200 hover:border-blue-300 hover:text-blue-600 transition"
                >
                  Mở không gian làm việc suất giao
                  <ArrowRight className="h-3.5 w-3.5 opacity-50" />
                </button>
                <button
                  type="button"
                  onClick={() =>
                    navigate(
                      `/admin/shipping/branch-delivery-slot-capacities/create?branchId=${formData.branchId}`,
                    )
                  }
                  className="flex w-full items-center justify-between rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2.5 text-left text-[13px] font-medium text-gray-700 dark:text-gray-200 hover:border-blue-300 hover:text-blue-600 transition"
                >
                  Tạo sức chứa (capacity) mới
                  <ArrowRight className="h-3.5 w-3.5 opacity-50" />
                </button>
              </div>
            </Card>

            {isStatusChanged && (
              <Card className="bg-amber-50 border border-amber-200">
                <h3 className="text-sm font-bold text-amber-800 mb-3 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" /> Trạng thái đã đổi
                </h3>
                <p className="text-xs text-amber-700 leading-relaxed">
                  Bạn đang thay đổi trạng thái của quy tắc này. Hãy lưu để cập
                  nhật hệ thống, hoặc dùng nút bật / tắt nhanh ở thanh hành động
                  dưới cùng.
                </p>
              </Card>
            )}
          </div>
        </div>
      </form>

      {/* Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 md:left-64 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 p-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-20">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-sm font-medium text-gray-500 hidden sm:block">
            {Object.keys(errors).length > 0 ? (
              <span className="text-red-500 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" /> Có lỗi cần chỉnh sửa
              </span>
            ) : isDirty ? (
              <span className="text-amber-600 flex items-center gap-1">
                <History className="w-4 h-4" /> Có thay đổi chưa lưu
              </span>
            ) : (
              <span className="text-gray-500">Chưa có thay đổi mới</span>
            )}
          </div>

          <div className="flex gap-3 w-full sm:w-auto">
            <button
              type="button"
              onClick={handleToggleStatus}
              disabled={togglingStatus}
              className="flex-1 sm:flex-none px-6 py-2.5 rounded-lg font-medium bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-200 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {togglingStatus ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Power className="w-4 h-4" />
              )}
              {formData.status === "active" ? "Tạm dừng" : "Bật lại"}
            </button>

            <button
              type="button"
              onClick={() => navigate(-1)}
              className="flex-1 sm:flex-none px-6 py-2.5 rounded-lg font-medium bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-200 transition-colors"
            >
              Hủy
            </button>

            <button
              onClick={handleSubmit}
              disabled={saving || !isDirty}
              className="flex-1 sm:flex-none px-8 py-2.5 rounded-lg font-medium bg-blue-600 hover:bg-blue-700 text-white transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm"
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
    </div>
  );
};

export default BranchServiceAreaEditPage;
