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
  Clock3,
  CalendarDays,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Settings2,
  Info,
  ShieldAlert,
  MapPinned,
  Power,
  PackageCheck,
} from "lucide-react";
import Card from "../../../components/admin/layouts/Card";
import { http } from "../../../services/http";
import { useAdminToast } from "../../../context/AdminToastContext";

interface BranchOption {
  id: number;
  name: string;
  code: string;
}

interface DeliveryTimeSlotOption {
  id: number;
  code: string;
  label: string;
  startTime: string;
  endTime: string;
}

interface BranchDeliverySlotCapacityFormData {
  id?: number;
  branchId: string;
  deliveryDate: string;
  deliveryTimeSlotId: string;
  maxOrders: string;
  reservedOrders: number;
  status: "active" | "inactive";
  createdAt?: string;
  updatedAt?: string;
}

type ApiDetail<T> = { success: true; data: T; meta?: any };
type ApiList<T> = { success: true; data: T[]; meta?: any };

const toFormData = (data: any): BranchDeliverySlotCapacityFormData => ({
  id: data.id,
  branchId: data.branchId != null ? String(data.branchId) : "",
  deliveryDate: data.deliveryDate ?? "",
  deliveryTimeSlotId:
    data.deliveryTimeSlotId != null ? String(data.deliveryTimeSlotId) : "",
  maxOrders:
    data.maxOrders !== null && data.maxOrders !== undefined
      ? String(data.maxOrders)
      : "",
  reservedOrders: data.reservedOrders ? Number(data.reservedOrders) : 0,
  status: data.status ?? "active",
  createdAt: data.createdAt,
  updatedAt: data.updatedAt,
});

const formatMaxOrdersPreview = (value: string) => {
  if (!value || value.trim() === "") return "Không giới hạn";
  const n = Number(value);
  if (!Number.isFinite(n)) return "Không giới hạn";
  return `${n.toLocaleString("vi-VN")} đơn`;
};

const formatTimeRange = (startTime?: string, endTime?: string) => {
  if (!startTime || !endTime) return "—";
  return `${String(startTime).slice(0, 5)} - ${String(endTime).slice(0, 5)}`;
};

const BranchDeliverySlotCapacityEditPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showSuccessToast, showErrorToast } = useAdminToast();

  const [formData, setFormData] =
    useState<BranchDeliverySlotCapacityFormData | null>(null);
  const [initialData, setInitialData] =
    useState<BranchDeliverySlotCapacityFormData | null>(null);
  const [branches, setBranches] = useState<BranchOption[]>([]);
  const [slots, setSlots] = useState<DeliveryTimeSlotOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const fieldRefs = useRef<
    Record<string, HTMLInputElement | HTMLSelectElement | null>
  >({});

  const selectedBranch = useMemo(
    () => branches.find((x) => String(x.id) === formData?.branchId) || null,
    [branches, formData?.branchId],
  );

  const selectedSlot = useMemo(
    () =>
      slots.find((x) => String(x.id) === formData?.deliveryTimeSlotId) || null,
    [slots, formData?.deliveryTimeSlotId],
  );

  const capacityMetrics = useMemo(() => {
    if (!formData)
      return {
        max: null,
        reserved: 0,
        available: "∞",
        isUnlimited: true,
        percent: 0,
      };
    const reserved = formData.reservedOrders;
    const max =
      formData.maxOrders.trim() === "" ? null : Number(formData.maxOrders);
    const isUnlimited = max === null;
    const available = isUnlimited ? "∞" : Math.max(0, max - reserved);
    const percent =
      !isUnlimited && max > 0 ? Math.min((reserved / max) * 100, 100) : 0;
    return { max, reserved, available, isUnlimited, percent };
  }, [formData?.maxOrders, formData?.reservedOrders]);

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

      const [detailRes, branchesRes, slotsRes] = await Promise.all([
        http<ApiDetail<any>>(
          "GET",
          `/api/v1/admin/branch-delivery-slot-capacities/edit/${id}`,
        ),
        http<ApiList<BranchOption>>(
          "GET",
          "/api/v1/admin/branches?limit=1000&status=active",
        ),
        http<any>(
          "GET",
          "/api/v1/admin/delivery-time-slots?page=1&limit=1000&status=active",
        ),
      ]);

      if (detailRes?.success && detailRes.data) {
        const mapped = toFormData(detailRes.data);
        setFormData(mapped);
        setInitialData(mapped);
      } else {
        showErrorToast("Không thể tải dữ liệu capacity.");
      }

      setBranches(Array.isArray(branchesRes?.data) ? branchesRes.data : []);

      const slotsData = Array.isArray(slotsRes?.data)
        ? slotsRes.data
        : Array.isArray(slotsRes?.data?.items)
          ? slotsRes.data.items
          : [];
      setSlots(slotsData);
    } catch (err: any) {
      console.error(err);
      showErrorToast(err?.message || "Lỗi tải dữ liệu capacity.");
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
    const { name, value } = e.target;
    setFormData((prev) => (prev ? { ...prev, [name]: value } : prev));

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validateForm = () => {
    if (!formData) return false;

    const nextErrors: Record<string, string> = {};

    if (!formData.branchId) {
      nextErrors.branchId = "Vui lòng chọn chi nhánh.";
    }

    if (!formData.deliveryDate) {
      nextErrors.deliveryDate = "Vui lòng chọn ngày giao.";
    }

    if (!formData.deliveryTimeSlotId) {
      nextErrors.deliveryTimeSlotId = "Vui lòng chọn khung giờ giao hàng.";
    }

    if (formData.maxOrders.trim() !== "") {
      const n = Number(formData.maxOrders);
      if (!Number.isInteger(n) || n < 0) {
        nextErrors.maxOrders = "Max orders phải là số nguyên >= 0.";
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
        deliveryDate: formData.deliveryDate,
        deliveryTimeSlotId: Number(formData.deliveryTimeSlotId),
        maxOrders:
          formData.maxOrders.trim() === "" ? null : Number(formData.maxOrders),
        status: formData.status,
      };

      const res = await http<any>(
        "PATCH",
        `/api/v1/admin/branch-delivery-slot-capacities/edit/${formData.id}`,
        payload,
      );

      if (res?.success) {
        showSuccessToast({ message: "Cập nhật capacity thành công!" });
        setInitialData({ ...formData });
        setErrors({});
      } else {
        showErrorToast(res?.message || "Cập nhật capacity thất bại.");
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

  const headerSubtitle =
    selectedBranch && selectedSlot && formData.deliveryDate
      ? `${selectedBranch.name} → ${selectedSlot.label} → ${formData.deliveryDate}`
      : "Đang tải cấu hình...";

  const timeRange = selectedSlot
    ? formatTimeRange(selectedSlot.startTime, selectedSlot.endTime)
    : "—";

  return (
    <div className="max-w-5xl mx-auto pb-24">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-white">
              Chỉnh sửa capacity giao hàng
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
          onClick={() =>
            navigate("/admin/shipping/branch-delivery-slot-capacities")
          }
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" /> Quay lại
        </button>
      </div>

      {/* Summary Panel */}
      <Card className="mb-6 bg-gradient-to-br from-blue-50/50 to-white dark:from-gray-800/50 dark:to-gray-800 border-blue-100 dark:border-gray-700">
        <h2 className="text-sm font-bold text-gray-800 dark:text-white mb-4 uppercase tracking-wider flex items-center gap-2">
          <Info className="w-4 h-4 text-blue-500" /> Tóm tắt cấu hình ngày
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
          <div className="col-span-2 md:col-span-1">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
              Chi nhánh
            </p>
            <p className="text-sm font-semibold text-gray-900 dark:text-white line-clamp-2">
              {selectedBranch?.name || "—"}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
              Ngày giao
            </p>
            <p className="text-sm font-semibold text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
              <CalendarDays className="w-4 h-4" />{" "}
              {formData.deliveryDate || "—"}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
              Khung giờ (Slot)
            </p>
            <p className="text-sm font-semibold text-gray-900 dark:text-white">
              {selectedSlot?.label || "—"}
            </p>
            <p className="text-xs text-gray-500 mt-0.5">{timeRange}</p>
          </div>
          <div className="col-span-2">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
              Capacity Usage
            </p>
            <div className="flex items-center gap-4 text-sm font-semibold">
              <span
                className="text-gray-900 dark:text-white"
                title="Giới hạn tối đa"
              >
                Max: {capacityMetrics.isUnlimited ? "∞" : capacityMetrics.max}
              </span>
              <span
                className="text-orange-600 dark:text-orange-400"
                title="Đã đặt"
              >
                Rsv: {capacityMetrics.reserved}
              </span>
              <span
                className="text-green-600 dark:text-green-400"
                title="Còn lại"
              >
                Avail: {capacityMetrics.available}
              </span>
            </div>
          </div>
        </div>
      </Card>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Section 1: Mapping */}
        <Card>
          <div className="border-b border-gray-100 dark:border-gray-700 pb-4 mb-4">
            <h2 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
              <MapPinned className="w-5 h-5 text-gray-400" /> Mapping (Cấu hình)
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Liên kết ngày giao, chi nhánh và khung giờ tương ứng.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
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
                Ngày giao <span className="text-red-500">*</span>
              </label>
              <input
                ref={setFieldRef("deliveryDate")}
                type="date"
                name="deliveryDate"
                value={formData.deliveryDate}
                onChange={handleChange}
                className={`w-full border rounded-lg p-2.5 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none ${
                  errors.deliveryDate
                    ? "border-red-500"
                    : "border-gray-300 dark:border-gray-600"
                }`}
              />
              {errors.deliveryDate && (
                <p className="text-sm text-red-600 mt-1.5 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" /> {errors.deliveryDate}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Khung giờ giao hàng <span className="text-red-500">*</span>
              </label>
              <select
                ref={setFieldRef("deliveryTimeSlotId")}
                name="deliveryTimeSlotId"
                value={formData.deliveryTimeSlotId}
                onChange={handleChange}
                className={`w-full border rounded-lg p-2.5 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none ${
                  errors.deliveryTimeSlotId
                    ? "border-red-500"
                    : "border-gray-300 dark:border-gray-600"
                }`}
              >
                <option value="">Chọn khung giờ</option>
                {slots.map((slot) => (
                  <option key={slot.id} value={slot.id}>
                    {slot.label} ({slot.code})
                  </option>
                ))}
              </select>
              {errors.deliveryTimeSlotId && (
                <p className="text-sm text-red-600 mt-1.5 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />{" "}
                  {errors.deliveryTimeSlotId}
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
                </div>
              </div>

              <div className="flex justify-center p-2 rounded-full bg-gray-200 dark:bg-gray-700 shrink-0">
                <ArrowRight className="w-5 h-5 text-gray-500 dark:text-gray-400 md:rotate-0 rotate-90" />
              </div>

              <div className="flex-1 w-full bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-600 shadow-sm flex items-center gap-3">
                <div className="bg-indigo-100 dark:bg-indigo-900/30 p-2 rounded-md">
                  <CalendarDays className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div>
                  <p className="font-bold text-gray-900 dark:text-white">
                    {formData.deliveryDate || "Chưa chọn ngày"}
                  </p>
                </div>
              </div>

              <div className="flex justify-center p-2 rounded-full bg-gray-200 dark:bg-gray-700 shrink-0">
                <ArrowRight className="w-5 h-5 text-gray-500 dark:text-gray-400 md:rotate-0 rotate-90" />
              </div>

              <div className="flex-1 w-full bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-600 shadow-sm flex items-center gap-3">
                <div className="bg-green-100 dark:bg-green-900/30 p-2 rounded-md">
                  <Clock3 className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="font-bold text-gray-900 dark:text-white">
                    {selectedSlot?.label || "Chưa chọn slot"}
                  </p>
                  <p className="text-xs text-gray-500 font-medium mt-0.5">
                    {timeRange}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Section 2: Capacity config */}
        <Card>
          <div className="border-b border-gray-100 dark:border-gray-700 pb-4 mb-4">
            <h2 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-gray-400" /> Capacity Config
              (Giới hạn đơn)
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Thiết lập số lượng đơn hàng tối đa có thể nhận trong ngày này cho
              slot đã chọn.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
            <div className="max-w-md w-full">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Số đơn tối đa (Max orders)
              </label>
              <input
                ref={setFieldRef("maxOrders")}
                type="number"
                min="0"
                step="1"
                name="maxOrders"
                value={formData.maxOrders}
                onChange={handleChange}
                placeholder="Để trống nếu không giới hạn"
                className={`w-full border rounded-lg p-2.5 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none ${
                  errors.maxOrders
                    ? "border-red-500"
                    : "border-gray-300 dark:border-gray-600"
                }`}
              />
              <p className="text-[13px] text-gray-500 dark:text-gray-400 mt-1.5 flex items-start gap-1">
                <Info className="w-4 h-4 shrink-0 mt-0.5" />
                Để trống nếu không giới hạn số đơn trong ngày cho slot này.
              </p>
              {errors.maxOrders && (
                <p className="text-sm text-red-600 mt-1.5 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" /> {errors.maxOrders}
                </p>
              )}

              <div
                className={`mt-4 inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border ${formData.maxOrders.trim() !== "" ? "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800 dark:text-amber-400" : "bg-gray-50 text-gray-600 border-gray-200 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400"}`}
              >
                {formData.maxOrders.trim() !== "" ? (
                  <>
                    <ShieldAlert className="w-4 h-4" />
                    Giới hạn tối đa {formatMaxOrdersPreview(
                      formData.maxOrders,
                    )}{" "}
                    cho slot/ngày này.
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    Không giới hạn số đơn cho ngày/slot này.
                  </>
                )}
              </div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-800/50 p-5 rounded-xl border border-gray-100 dark:border-gray-700">
              <div className="flex items-center gap-2 mb-4 text-gray-700 dark:text-gray-300 font-semibold">
                <PackageCheck className="w-5 h-5" /> Tình trạng hiện tại
              </div>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 dark:text-gray-400">
                    Đã đặt (Reserved):
                  </span>
                  <span className="font-bold text-orange-600 dark:text-orange-400 text-base">
                    {capacityMetrics.reserved} đơn
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 dark:text-gray-400">
                    Giới hạn (Max):
                  </span>
                  <span className="font-bold text-gray-900 dark:text-white text-base">
                    {capacityMetrics.isUnlimited ? "∞" : capacityMetrics.max}{" "}
                    đơn
                  </span>
                </div>
                <div className="pt-3 mt-3 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center">
                  <span className="text-gray-500 dark:text-gray-400 font-medium">
                    Còn lại (Available):
                  </span>
                  <span className="font-bold text-green-600 dark:text-green-400 text-lg">
                    {capacityMetrics.available}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Section 3: Trạng thái */}
        <Card>
          <div className="border-b border-gray-100 dark:border-gray-700 pb-4 mb-4">
            <h2 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
              <Power className="w-5 h-5 text-gray-400" /> Trạng thái hoạt động
            </h2>
          </div>

          <div className="max-w-md">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Trạng thái
            </label>
            <select
              ref={setFieldRef("status")}
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg p-2.5 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              <option value="active">Hoạt động (Cho phép đặt slot này)</option>
              <option value="inactive">
                Tạm dừng (Khóa slot trong ngày này)
              </option>
            </select>
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
                onClick={() =>
                  navigate("/admin/shipping/branch-delivery-slot-capacities")
                }
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

export default BranchDeliverySlotCapacityEditPage;
