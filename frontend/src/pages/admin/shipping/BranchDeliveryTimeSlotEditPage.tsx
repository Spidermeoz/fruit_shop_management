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
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Info,
  ShieldAlert,
  MapPinned,
  Power,
  Zap,
  CalendarDays,
  History,
  AlertTriangle,
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

interface DeliveryTimeSlotOption {
  id: number;
  code: string;
  label: string;
  startTime: string;
  endTime: string;
  maxOrders?: number | null;
}

interface BranchDeliveryTimeSlotFormData {
  id?: number;
  branchId: string;
  deliveryTimeSlotId: string;
  maxOrdersOverride: string;
  status: "active" | "inactive";
  createdAt?: string;
  updatedAt?: string;
}

type ApiDetail<T> = { success: true; data: T; meta?: any };
type ApiList<T> = { success: boolean; data: T[] | { items: T[] }; meta?: any };

// =============================
// HELPERS
// =============================
const toFormData = (data: any): BranchDeliveryTimeSlotFormData => ({
  id: data.id,
  branchId: data.branchId != null ? String(data.branchId) : "",
  deliveryTimeSlotId:
    data.deliveryTimeSlotId != null ? String(data.deliveryTimeSlotId) : "",
  maxOrdersOverride:
    data.maxOrdersOverride !== null && data.maxOrdersOverride !== undefined
      ? String(data.maxOrdersOverride)
      : "",
  status: data.status ?? "active",
  createdAt: data.createdAt,
  updatedAt: data.updatedAt,
});

const formatMaxOrdersPreview = (value?: string | number | null) => {
  if (value === null || value === undefined || value === "")
    return "Không giới hạn";
  const n = Number(value);
  if (!Number.isFinite(n)) return "Không giới hạn";
  return `${n.toLocaleString("vi-VN")} đơn`;
};

const getTimeBucket = (startTime?: string) => {
  if (!startTime) return null;
  const hour = parseInt(startTime.split(":")[0], 10);
  if (isNaN(hour)) return null;
  if (hour < 12)
    return {
      label: "Buổi sáng",
      color: "bg-blue-100 text-blue-700 border-blue-200",
    };
  if (hour < 18)
    return {
      label: "Buổi chiều",
      color: "bg-orange-100 text-orange-700 border-orange-200",
    };
  return {
    label: "Buổi tối",
    color: "bg-indigo-100 text-indigo-700 border-indigo-200",
  };
};

// =============================
// MAIN COMPONENT
// =============================
const BranchDeliveryTimeSlotEditPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showSuccessToast, showErrorToast } = useAdminToast();

  const [formData, setFormData] =
    useState<BranchDeliveryTimeSlotFormData | null>(null);
  const [initialData, setInitialData] =
    useState<BranchDeliveryTimeSlotFormData | null>(null);
  const [branches, setBranches] = useState<BranchOption[]>([]);
  const [slots, setSlots] = useState<DeliveryTimeSlotOption[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const fieldRefs = useRef<
    Record<string, HTMLInputElement | HTMLSelectElement | null>
  >({});

  // --- Actions & API ---
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
          `/api/v1/admin/branch-delivery-time-slots/edit/${id}`,
        ),
        http<ApiList<BranchOption>>(
          "GET",
          "/api/v1/admin/branches?limit=1000&status=active",
        ),
        http<ApiList<DeliveryTimeSlotOption>>(
          "GET",
          "/api/v1/admin/delivery-time-slots?page=1&limit=1000&status=active",
        ),
      ]);

      if (detailRes?.success && detailRes.data) {
        const mapped = toFormData(detailRes.data);
        setFormData(mapped);
        setInitialData(mapped);
      } else {
        showErrorToast("Không thể tải cấu hình kích hoạt khung giờ.");
      }

      setBranches(
        Array.isArray(branchesRes?.data)
          ? branchesRes.data
          : branchesRes?.data?.items || [],
      );
      setSlots(
        Array.isArray(slotsRes?.data)
          ? slotsRes.data
          : slotsRes?.data?.items || [],
      );
    } catch (err: any) {
      showErrorToast(err?.message || "Lỗi tải cấu hình kích hoạt.");
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

  const selectedSlot = useMemo(
    () =>
      slots.find((x) => String(x.id) === formData?.deliveryTimeSlotId) || null,
    [slots, formData?.deliveryTimeSlotId],
  );
  const initialSlot = useMemo(
    () =>
      slots.find((x) => String(x.id) === initialData?.deliveryTimeSlotId) ||
      null,
    [slots, initialData?.deliveryTimeSlotId],
  );

  const isDirty = useMemo(() => {
    if (!formData || !initialData) return false;
    return JSON.stringify(formData) !== JSON.stringify(initialData);
  }, [formData, initialData]);

  const timeBucket = useMemo(
    () => (selectedSlot ? getTimeBucket(selectedSlot.startTime) : null),
    [selectedSlot],
  );

  const changeImpacts = useMemo(() => {
    if (!formData || !initialData) return [];
    const impacts = [];

    if (formData.branchId !== initialData.branchId) {
      impacts.push(
        `Thay đổi chi nhánh áp dụng từ ${initialBranch?.name} sang ${selectedBranch?.name}. Chi nhánh cũ sẽ bị mất khung giờ này.`,
      );
    }

    if (formData.deliveryTimeSlotId !== initialData.deliveryTimeSlotId) {
      impacts.push(
        `Đổi khung giờ hệ thống từ ${initialSlot?.label} sang ${selectedSlot?.label}. Điều này thay đổi hoàn toàn timeline nhận đơn.`,
      );
    }

    if (formData.maxOrdersOverride !== initialData.maxOrdersOverride) {
      if (formData.maxOrdersOverride === "") {
        impacts.push(
          "Đã GỠ override. Chi nhánh sẽ quay về dùng giới hạn gốc của hệ thống.",
        );
      } else if (initialData.maxOrdersOverride === "") {
        impacts.push(
          `Chi nhánh sẽ bắt đầu dùng giới hạn RIÊNG (${formData.maxOrdersOverride} đơn) thay vì dùng giới hạn gốc.`,
        );
      } else {
        impacts.push(
          `Thay đổi số đơn giới hạn override từ ${initialData.maxOrdersOverride} sang ${formData.maxOrdersOverride}.`,
        );
      }
    }

    if (formData.status !== initialData.status) {
      impacts.push(
        formData.status === "inactive"
          ? "CẢNH BÁO: Tạm dừng cấu hình này sẽ khiến chi nhánh KHÔNG CÒN nhận đơn trong khung giờ trên."
          : "Cấu hình này sẽ được kích hoạt lại cho chi nhánh nhận đơn.",
      );
    }

    return impacts;
  }, [
    formData,
    initialData,
    selectedBranch,
    initialBranch,
    selectedSlot,
    initialSlot,
  ]);

  // --- Handlers ---
  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    if (!formData) return;
    const { name, value } = e.target;
    setFormData((prev) => (prev ? { ...prev, [name]: value } : prev));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validateForm = () => {
    if (!formData) return false;
    const nextErrors: Record<string, string> = {};

    if (!formData.branchId) nextErrors.branchId = "Vui lòng chọn chi nhánh.";
    if (!formData.deliveryTimeSlotId)
      nextErrors.deliveryTimeSlotId = "Vui lòng chọn khung giờ.";

    if (formData.maxOrdersOverride.trim() !== "") {
      const n = Number(formData.maxOrdersOverride);
      if (!Number.isFinite(n) || n < 0)
        nextErrors.maxOrdersOverride = "Override phải là số nguyên >= 0.";
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
        deliveryTimeSlotId: Number(formData.deliveryTimeSlotId),
        maxOrdersOverride:
          formData.maxOrdersOverride.trim() === ""
            ? null
            : Number(formData.maxOrdersOverride),
        status: formData.status,
      };

      const res = await http<any>(
        "PATCH",
        `/api/v1/admin/branch-delivery-time-slots/edit/${formData.id}`,
        payload,
      );

      if (res?.success) {
        showSuccessToast({
          message: "Cập nhật cấu hình khung giờ chi nhánh thành công!",
        });
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
          Đang tải Cấu hình kích hoạt...
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
            onClick={() => navigate("/admin/shipping/branch-delivery-slots")}
            className="flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-blue-600 transition-colors mb-2"
          >
            <ArrowLeft className="w-4 h-4" /> Quay lại danh sách
          </button>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              Chỉnh sửa khung giờ chi nhánh
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
            <Store className="w-4 h-4" /> {initialBranch?.name}{" "}
            <ArrowRight className="w-3 h-3 text-gray-400 mx-1" />{" "}
            {initialSlot?.label}
          </p>
        </div>
      </div>

      <form
        onSubmit={handleSave}
        className="grid grid-cols-1 xl:grid-cols-3 gap-6 lg:gap-8"
      >
        {/* CỘT TRÁI: FORM BUILDER */}
        <div className="xl:col-span-2 space-y-6">
          {/* Section 1: Đối tượng áp dụng */}
          <Card
            className={
              formData.branchId !== initialData.branchId ||
              formData.deliveryTimeSlotId !== initialData.deliveryTimeSlotId
                ? "border-amber-200 dark:border-amber-800"
                : ""
            }
          >
            <div className="border-b border-gray-100 dark:border-gray-700 pb-4 mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
                  <MapPinned className="w-5 h-5 text-gray-400" /> 1. Định tuyến
                  (Mapping)
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Liên kết chi nhánh với khung giờ giao hàng tương ứng.
                </p>
              </div>
              {(formData.branchId !== initialData.branchId ||
                formData.deliveryTimeSlotId !==
                  initialData.deliveryTimeSlotId) && (
                <span className="text-[10px] font-bold bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded">
                  Đã chỉnh sửa
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  Chi nhánh áp dụng <span className="text-red-500">*</span>
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
                {formData.branchId !== initialData.branchId && (
                  <p className="text-xs font-medium text-amber-600 mt-1.5 flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" /> Cảnh báo: Việc đổi
                    chi nhánh sẽ làm thay đổi cấu trúc vận hành.
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  Khung giờ hệ thống <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Clock3 className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                  <select
                    ref={setFieldRef("deliveryTimeSlotId")}
                    name="deliveryTimeSlotId"
                    value={formData.deliveryTimeSlotId}
                    onChange={handleChange}
                    className={`w-full pl-9 pr-4 py-2.5 border rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none text-gray-900 dark:text-white ${errors.deliveryTimeSlotId ? "border-red-500" : formData.deliveryTimeSlotId !== initialData.deliveryTimeSlotId ? "border-amber-400 bg-amber-50 dark:bg-amber-900/10" : "bg-gray-50 dark:bg-gray-800 border-gray-300 dark:border-gray-600"}`}
                  >
                    <option value="">-- Chọn template khung giờ --</option>
                    {slots.map((slot) => (
                      <option key={slot.id} value={slot.id}>
                        {slot.label} ({slot.code})
                      </option>
                    ))}
                  </select>
                </div>
                {errors.deliveryTimeSlotId && (
                  <p className="text-xs text-red-600 mt-1">
                    {errors.deliveryTimeSlotId}
                  </p>
                )}
                {formData.deliveryTimeSlotId !==
                  initialData.deliveryTimeSlotId && (
                  <p className="text-xs font-medium text-amber-600 mt-1.5 flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" /> Cảnh báo: Template
                    gốc đã thay đổi.
                  </p>
                )}
              </div>
            </div>

            {/* Visual mapping hint */}
            {selectedBranch && selectedSlot && (
              <div className="mt-5 p-4 bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/50 rounded-xl flex flex-col md:flex-row items-center gap-4 justify-center">
                <div className="font-bold text-gray-900 dark:text-white">
                  {selectedBranch.name}
                </div>
                <ArrowRight className="w-5 h-5 text-blue-400 shrink-0 md:rotate-0 rotate-90" />
                <div className="font-bold text-gray-900 dark:text-white">
                  {selectedSlot.label} (
                  {String(selectedSlot.startTime).slice(0, 5)} -{" "}
                  {String(selectedSlot.endTime).slice(0, 5)})
                </div>
              </div>
            )}
          </Card>

          {/* Section 2: Default vs Override */}
          <Card
            className={
              formData.maxOrdersOverride !== initialData.maxOrdersOverride
                ? "border-amber-200 dark:border-amber-800"
                : ""
            }
          >
            <div className="border-b border-gray-100 dark:border-gray-700 pb-4 mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-gray-400" /> 2. Giới hạn
                  sức chứa (Capacity Mode)
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Quyết định xem chi nhánh sẽ dùng giới hạn mặc định hay cấu
                  hình số lượng ngoại lệ.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* Default Column */}
              <div
                className={`p-4 rounded-xl border-2 transition-all ${!formData.maxOrdersOverride ? "border-blue-500 bg-blue-50/30 dark:bg-blue-900/10" : "border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 opacity-60"}`}
              >
                <div className="flex justify-between items-center mb-3">
                  <div
                    className={`font-bold text-sm ${!formData.maxOrdersOverride ? "text-blue-700 dark:text-blue-400" : "text-gray-600 dark:text-gray-400"}`}
                  >
                    Theo System Slot
                  </div>
                  {!formData.maxOrdersOverride && (
                    <CheckCircle2 className="w-4 h-4 text-blue-600" />
                  )}
                </div>
                <div className="text-xs text-gray-500 mb-2">Giới hạn gốc:</div>
                <div className="text-xl font-bold text-gray-900 dark:text-white">
                  {selectedSlot
                    ? formatMaxOrdersPreview(selectedSlot.maxOrders)
                    : "Chưa xác định"}
                </div>
              </div>

              {/* Override Column */}
              <div
                className={`p-4 rounded-xl border-2 transition-all ${formData.maxOrdersOverride ? (formData.maxOrdersOverride !== initialData.maxOrdersOverride ? "border-amber-500 bg-amber-50/30" : "border-amber-500 bg-amber-50/30 dark:bg-amber-900/10") : "border-gray-200 dark:border-gray-700"}`}
              >
                <div className="flex justify-between items-center mb-3">
                  <div
                    className={`font-bold text-sm ${formData.maxOrdersOverride ? "text-amber-700 dark:text-amber-400" : "text-gray-600 dark:text-gray-400"}`}
                  >
                    Áp dụng riêng (Override)
                  </div>
                  {formData.maxOrdersOverride && (
                    <Zap className="w-4 h-4 text-amber-600" />
                  )}
                </div>
                <label className="block text-xs text-gray-500 mb-2">
                  Số đơn tối đa cho chi nhánh này:
                </label>
                <input
                  ref={setFieldRef("maxOrdersOverride")}
                  type="number"
                  min="0"
                  step="1"
                  name="maxOrdersOverride"
                  value={formData.maxOrdersOverride}
                  onChange={handleChange}
                  placeholder="Trống = Dùng gốc"
                  className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none ${errors.maxOrdersOverride ? "border-red-500 focus:ring-red-500" : formData.maxOrdersOverride !== initialData.maxOrdersOverride ? "border-amber-400 focus:ring-amber-500 bg-amber-50 dark:bg-amber-900/20" : "border-gray-300 dark:border-gray-600 focus:ring-amber-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"}`}
                />
                {errors.maxOrdersOverride && (
                  <p className="text-xs text-red-600 mt-1">
                    {errors.maxOrdersOverride}
                  </p>
                )}
                {formData.maxOrdersOverride !==
                  initialData.maxOrdersOverride && (
                  <p className="text-xs font-medium text-amber-600 mt-1">
                    Gốc:{" "}
                    {initialData.maxOrdersOverride
                      ? `${initialData.maxOrdersOverride} đơn`
                      : "Không có (Theo System Slot)"}
                  </p>
                )}
              </div>
            </div>
            <p className="text-xs text-gray-500 italic bg-gray-50 dark:bg-gray-800 p-2.5 rounded-lg">
              * Giới hạn này chỉ là{" "}
              <strong>Cấu hình mặc định cho chi nhánh</strong>. Khi hệ thống
              sinh lịch ngày, bạn vẫn có thể điều chỉnh lại bằng{" "}
              <strong>Capacity theo ngày</strong>.
            </p>
          </Card>

          {/* Section 3: Status */}
          <Card
            className={
              formData.status !== initialData.status
                ? "border-amber-200 dark:border-amber-800"
                : ""
            }
          >
            <div className="border-b border-gray-100 dark:border-gray-700 pb-4 mb-4">
              <h2 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
                <Power className="w-5 h-5 text-gray-400" /> 3. Trạng thái kích
                hoạt
              </h2>
            </div>
            <div className="max-w-md">
              <select
                ref={setFieldRef("status")}
                name="status"
                value={formData.status}
                onChange={handleChange}
                className={`w-full border rounded-lg p-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 ${formData.status !== initialData.status ? "bg-amber-50 border-amber-400 text-amber-900" : "bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"}`}
              >
                <option value="active">Hoạt động (Bắt đầu áp dụng)</option>
                <option value="inactive">
                  Tạm dừng (Lưu cấu hình nhưng chưa dùng)
                </option>
              </select>
              <p className="text-[11px] text-gray-500 mt-1.5">
                Chỉ khi ở trạng thái Hoạt động, hệ thống mới nhận diện chi nhánh
                này được phép nhận đơn trong khung giờ trên.
              </p>
            </div>
          </Card>
        </div>

        {/* CỘT PHẢI: LIVE PREVIEW PANEL */}
        <div className="xl:col-span-1">
          <div className="sticky top-24 space-y-6">
            {/* Change Impact Advisory */}
            {isDirty ? (
              <Card className="border-amber-200 dark:border-amber-900/50 bg-gradient-to-br from-amber-50 to-white dark:from-gray-800 dark:to-gray-800/80 shadow-sm overflow-hidden transition-all duration-300">
                <div className="bg-amber-500 text-white px-4 py-3 -mx-6 -mt-6 mb-5 flex items-center gap-2 font-bold shadow-sm">
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
                    Những thay đổi hiện tại không làm ảnh hưởng lớn tới vận
                    hành.
                  </p>
                )}
              </Card>
            ) : (
              <Card className="border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 flex flex-col items-center justify-center py-10 text-center transition-all duration-300">
                <History className="w-10 h-10 text-gray-300 mb-3" />
                <span className="text-gray-500 font-medium">
                  Bản nháp hiện trùng với dữ liệu lưu trữ. Chỉnh sửa để xem đánh
                  giá tác động.
                </span>
              </Card>
            )}

            {/* Live Activation Summary */}
            <Card className="border-blue-100 dark:border-blue-900/50 bg-gradient-to-br from-blue-50 to-white dark:from-gray-800 dark:to-gray-800/80 shadow-sm overflow-hidden">
              <div className="bg-blue-600 text-white px-4 py-3 -mx-6 -mt-6 mb-5 flex items-center justify-between font-bold shadow-sm">
                <span className="flex items-center gap-2">
                  <Info className="w-5 h-5" /> Cấu hình sau khi lưu
                </span>
              </div>

              {!selectedBranch || !selectedSlot ? (
                <div className="flex flex-col items-center justify-center py-10 text-center opacity-60">
                  <Clock3 className="w-10 h-10 text-blue-300 mb-3" />
                  <span className="text-sm font-medium text-gray-600">
                    Chọn chi nhánh và khung giờ
                    <br />
                    để xem preview.
                  </span>
                </div>
              ) : (
                <div className="space-y-4 text-sm">
                  <div className="flex justify-between items-start">
                    {timeBucket ? (
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${timeBucket.color}`}
                      >
                        {timeBucket.label}
                      </span>
                    ) : (
                      <span></span>
                    )}
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${formData.status === "active" ? "bg-green-100 text-green-700 border-green-200" : "bg-gray-100 text-gray-600 border-gray-200"}`}
                    >
                      {formData.status === "active"
                        ? "Sẽ được bật"
                        : "Tạm dừng"}
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
                      Cấu hình cho
                    </div>
                    <div className="font-bold text-gray-900 dark:text-white text-base">
                      {selectedBranch.name}{" "}
                      <span className="text-xs font-mono font-normal text-gray-500">
                        ({selectedBranch.code})
                      </span>
                    </div>
                  </div>

                  <div
                    className={`bg-white dark:bg-gray-800 rounded-lg p-3 border flex flex-col gap-2 ${formData.deliveryTimeSlotId !== initialData.deliveryTimeSlotId ? "border-amber-400" : "border-gray-100 dark:border-gray-700"}`}
                  >
                    <div className="flex justify-between items-center border-b border-gray-100 dark:border-gray-700 pb-2">
                      <span className="text-gray-500 font-medium">
                        Khung giờ:
                      </span>
                      <span className="font-bold text-gray-900 dark:text-white">
                        {selectedSlot.label}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500 font-medium">
                        Timeline:
                      </span>
                      <span className="font-bold text-gray-900 dark:text-white">
                        {String(selectedSlot.startTime).slice(0, 5)}{" "}
                        <ArrowRight className="w-3 h-3 inline text-gray-400 mx-0.5" />{" "}
                        {String(selectedSlot.endTime).slice(0, 5)}
                      </span>
                    </div>
                    <div
                      className={`flex justify-between items-center ${formData.maxOrdersOverride !== initialData.maxOrdersOverride ? "text-amber-600 font-bold" : ""}`}
                    >
                      <span className="text-gray-500 font-medium">
                        Giới hạn nhận:
                      </span>
                      {formData.maxOrdersOverride ? (
                        <span
                          className={
                            formData.maxOrdersOverride !==
                            initialData.maxOrdersOverride
                              ? ""
                              : "font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-1.5 rounded"
                          }
                        >
                          {formatMaxOrdersPreview(formData.maxOrdersOverride)}
                        </span>
                      ) : (
                        <span
                          className={
                            formData.maxOrdersOverride !==
                            initialData.maxOrdersOverride
                              ? ""
                              : "font-bold text-blue-600 dark:text-blue-400"
                          }
                        >
                          {formatMaxOrdersPreview(selectedSlot.maxOrders)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </Card>

            <Card className="bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
              <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200 mb-3 flex items-center gap-2">
                <CalendarDays className="w-4 h-4 text-gray-500" /> Chú ý sau khi
                lưu
              </h3>
              <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed mb-3">
                Nếu bạn đã thay đổi Giới hạn Override hoặc đổi Khung giờ, hãy
                đảm bảo các Lịch Capacity hàng ngày của chi nhánh này cũng được
                rà soát lại.
              </p>
              {selectedBranch && selectedSlot && (
                <button
                  type="button"
                  onClick={() =>
                    navigate(
                      `/admin/shipping/branch-delivery-slot-capacities?branchId=${selectedBranch.id}&deliveryTimeSlotId=${selectedSlot.id}`,
                    )
                  }
                  className="w-full py-2 bg-white border border-gray-300 rounded text-xs font-bold text-gray-700 hover:bg-gray-50 shadow-sm transition"
                >
                  Kiểm tra Capacity Ngày của nhánh này
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
                <AlertCircle className="w-4 h-4" /> Có lỗi cần chỉnh sửa
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
              onClick={() => navigate("/admin/shipping/branch-delivery-slots")}
              className="flex-1 sm:flex-none px-6 py-2.5 rounded-lg font-medium bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-200 transition-colors"
            >
              Hủy bỏ
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !isDirty}
              className={`flex-1 sm:flex-none px-8 py-2.5 rounded-lg font-medium text-white transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm ${isDirty ? "bg-amber-600 hover:bg-amber-700" : "bg-blue-600 hover:bg-blue-700"}`}
            >
              {saving ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" /> Đang cập nhật...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />{" "}
                  {isDirty ? "Lưu cấu hình" : "Đã đồng bộ"}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BranchDeliveryTimeSlotEditPage;
