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
  Info,
  ShieldAlert,
  MapPinned,
  Power,
  PackageCheck,
  CalendarCheck,
  Zap,
  AlertTriangle,
  History,
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

// =============================
// HELPERS
// =============================
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

const formatMaxOrdersPreview = (value?: string | number | null) => {
  if (value === null || value === undefined || value === "")
    return "Không giới hạn";
  const n = Number(value);
  if (!Number.isFinite(n)) return "Không giới hạn";
  return `${n.toLocaleString("vi-VN")} đơn`;
};

const getLocalDateString = (date: Date) => {
  const d = new Date(date);
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 10);
};

const getDateContext = (dateStr: string) => {
  if (!dateStr) return null;
  const todayStr = getLocalDateString(new Date());

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = getLocalDateString(tomorrow);

  if (dateStr === todayStr)
    return {
      type: "today",
      label: "Hôm nay",
      note: "Bạn đang chỉnh sửa điều độ cho hôm nay. Thay đổi này có thể tác động ngay tới vận hành hiện tại.",
    };
  if (dateStr === tomorrowStr)
    return {
      type: "tomorrow",
      label: "Ngày mai",
      note: "Bạn đang chuẩn bị năng lực nhận đơn cho ngày mai.",
    };
  if (dateStr < todayStr)
    return {
      type: "past",
      label: "Quá khứ",
      note: "CẢNH BÁO: Đây là ngày trong quá khứ. Thay đổi có thể làm sai lệch báo cáo.",
    };
  return {
    type: "future",
    label: "Tương lai",
    note: "Lập kế hoạch điều độ cho ngày sắp tới.",
  };
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
  const [, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const fieldRefs = useRef<
    Record<string, HTMLInputElement | HTMLSelectElement | null>
  >({});

  // --- Fetch Data ---
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
        showErrorToast("Không thể tải dữ liệu điều độ capacity.");
      }

      setBranches(Array.isArray(branchesRes?.data) ? branchesRes.data : []);
      const slotsData = Array.isArray(slotsRes?.data)
        ? slotsRes.data
        : Array.isArray(slotsRes?.data?.items)
          ? slotsRes.data.items
          : [];
      setSlots(slotsData);
    } catch (err: any) {
      showErrorToast(err?.message || "Lỗi tải dữ liệu capacity.");
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

  const dateContext = useMemo(
    () => (formData ? getDateContext(formData.deliveryDate) : null),
    [formData?.deliveryDate],
  );
  const timeBucket = useMemo(
    () => (selectedSlot ? getTimeBucket(selectedSlot.startTime) : null),
    [selectedSlot],
  );

  const isDirty = useMemo(() => {
    if (!formData || !initialData) return false;
    return JSON.stringify(formData) !== JSON.stringify(initialData);
  }, [formData, initialData]);

  // Metrics hiện tại
  const initialMetrics = useMemo(() => {
    if (!initialData)
      return {
        max: null,
        reserved: 0,
        available: "∞",
        isUnlimited: true,
        percent: 0,
      };
    const reserved = initialData.reservedOrders;
    const max =
      initialData.maxOrders.trim() === ""
        ? null
        : Number(initialData.maxOrders);
    const isUnlimited = max === null;
    const available = isUnlimited ? "∞" : Math.max(0, max - reserved);
    const percent =
      !isUnlimited && max > 0 ? Math.min((reserved / max) * 100, 100) : 0;
    return { max, reserved, available, isUnlimited, percent };
  }, [initialData]);

  // Metrics sau chỉnh sửa (Dự kiến)
  const currentMetrics = useMemo(() => {
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
  }, [formData]);

  const changeImpacts = useMemo(() => {
    if (!formData || !initialData) return [];
    const impacts = [];

    if (formData.branchId !== initialData.branchId) {
      impacts.push(
        `Bạn đang chuyển record capacity sang chi nhánh khác (${initialBranch?.name} -> ${selectedBranch?.name}).`,
      );
    }

    if (formData.deliveryTimeSlotId !== initialData.deliveryTimeSlotId) {
      impacts.push(
        `Bạn đang chuyển record này sang một khung giờ khác (${initialSlot?.label} -> ${selectedSlot?.label}).`,
      );
    }

    if (formData.deliveryDate !== initialData.deliveryDate) {
      impacts.push(
        `Ngày điều độ đang bị thay đổi từ ${initialData.deliveryDate} sang ${formData.deliveryDate}.`,
      );
    }

    if (formData.maxOrders !== initialData.maxOrders) {
      if (!formData.maxOrders) {
        impacts.push(
          "CẢNH BÁO: Bạn đang GỠ BỎ giới hạn. Slot này trong ngày sẽ nhận đơn không giới hạn.",
        );
      } else if (!initialData.maxOrders) {
        impacts.push(
          `Slot này sẽ bắt đầu có giới hạn tối đa là ${formData.maxOrders} đơn.`,
        );
      } else {
        if (Number(formData.maxOrders) < Number(initialData.maxOrders)) {
          impacts.push(
            `Giới hạn đơn đang GIẢM từ ${initialData.maxOrders} xuống ${formData.maxOrders}.`,
          );
        } else {
          impacts.push(
            `Giới hạn đơn đang TĂNG từ ${initialData.maxOrders} lên ${formData.maxOrders}.`,
          );
        }
      }
    }

    if (!currentMetrics.isUnlimited && currentMetrics.max !== null) {
      if (currentMetrics.max < currentMetrics.reserved) {
        impacts.push(
          "NGUY HIỂM: Giới hạn mới THẤP HƠN số đơn đã giữ chỗ. Trạng thái slot sẽ bị Quá Tải ngay lập tức.",
        );
      } else if (currentMetrics.max === currentMetrics.reserved) {
        impacts.push(
          "CẢNH BÁO: Giới hạn mới đúng bằng số đơn đã giữ chỗ. Slot này sẽ ĐẦY (Không còn chỗ trống).",
        );
      } else if (
        currentMetrics.available !== "∞" &&
        (currentMetrics.available as number) <= 2
      ) {
        impacts.push("Lưu ý: Slot sẽ còn rất ít chỗ trống (<= 2 đơn).");
      }
    }

    if (formData.status !== initialData.status) {
      impacts.push(
        formData.status === "inactive"
          ? "CẢNH BÁO: Tạm dừng capacity sẽ khiến hệ thống không còn dùng cấu hình này để tính toán điều độ trong ngày nữa."
          : "Cấu hình này sẽ được kích hoạt lại cho vận hành ngày này.",
      );
    }

    return impacts;
  }, [
    formData,
    initialData,
    initialBranch,
    selectedBranch,
    initialSlot,
    selectedSlot,
    currentMetrics,
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
    const { name, value } = e.target;
    setFormData((prev) => (prev ? { ...prev, [name]: value } : prev));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleDateShortcut = (daysToAdd: number) => {
    const d = new Date();
    d.setDate(d.getDate() + daysToAdd);
    const dateStr = getLocalDateString(d);
    setFormData((prev) => (prev ? { ...prev, deliveryDate: dateStr } : prev));
    if (errors.deliveryDate)
      setErrors((prev) => ({ ...prev, deliveryDate: "" }));
  };

  const validateForm = () => {
    if (!formData) return false;
    const nextErrors: Record<string, string> = {};

    if (!formData.branchId) nextErrors.branchId = "Vui lòng chọn chi nhánh.";
    if (!formData.deliveryDate)
      nextErrors.deliveryDate = "Vui lòng chọn ngày giao.";
    if (!formData.deliveryTimeSlotId)
      nextErrors.deliveryTimeSlotId = "Vui lòng chọn khung giờ.";

    if (formData.maxOrders.trim() !== "") {
      const n = Number(formData.maxOrders);
      if (!Number.isFinite(n) || n < 0)
        nextErrors.maxOrders = "Giới hạn phải là số nguyên >= 0.";
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
        showSuccessToast({
          message: "Điều chỉnh capacity theo ngày thành công!",
        });
        setInitialData({ ...formData });
        setErrors({});
      } else {
        showErrorToast(res?.message || "Cập nhật capacity thất bại.");
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
          Đang tải Dữ liệu Điều độ...
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
            onClick={() =>
              navigate(
                `/admin/shipping/branch-delivery-slot-capacities?deliveryDate=${initialData.deliveryDate}`,
              )
            }
            className="flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-blue-600 transition-colors mb-2"
          >
            <ArrowLeft className="w-4 h-4" /> Quay lại Bảng điều độ
          </button>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              Điều chỉnh sức chứa theo ngày
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
            <CalendarDays className="w-4 h-4" /> {initialData.deliveryDate}{" "}
            <ArrowRight className="w-3 h-3 text-gray-400 mx-1" />{" "}
            {initialBranch?.name}{" "}
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
          {/* Section 1: Chọn ngày điều độ */}
          <Card
            className={
              formData.deliveryDate !== initialData.deliveryDate
                ? "border-amber-200 dark:border-amber-800"
                : ""
            }
          >
            <div className="border-b border-gray-100 dark:border-gray-700 pb-4 mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
                  <CalendarDays className="w-5 h-5 text-gray-400" /> 1. Ngày
                  điều độ
                </h2>
              </div>
              {dateContext && (
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${dateContext.type === "today" ? "bg-blue-100 text-blue-700" : dateContext.type === "tomorrow" ? "bg-indigo-100 text-indigo-700" : dateContext.type === "past" ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-700"}`}
                >
                  {dateContext.label}
                </span>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-6">
              <div className="flex-1">
                <input
                  ref={setFieldRef("deliveryDate")}
                  type="date"
                  name="deliveryDate"
                  value={formData.deliveryDate}
                  onChange={handleChange}
                  className={`w-full border rounded-lg p-2.5 text-gray-900 dark:text-white focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none font-semibold ${errors.deliveryDate ? "border-red-500" : formData.deliveryDate !== initialData.deliveryDate ? "border-amber-400 bg-amber-50 dark:bg-amber-900/10" : "border-gray-300 bg-white dark:bg-gray-800 dark:border-gray-600"}`}
                />
                {errors.deliveryDate && (
                  <p className="text-xs text-red-600 mt-1.5">
                    {errors.deliveryDate}
                  </p>
                )}
                {formData.deliveryDate !== initialData.deliveryDate && (
                  <p className="text-xs font-medium text-amber-600 mt-1">
                    Đang chuyển từ ngày gốc: {initialData.deliveryDate}
                  </p>
                )}
                {dateContext?.note && (
                  <p
                    className={`text-xs font-medium mt-2 flex items-center gap-1 ${dateContext.type === "past" ? "text-red-500" : "text-gray-500"}`}
                  >
                    <Info className="w-3.5 h-3.5" /> {dateContext.note}
                  </p>
                )}
              </div>
              <div className="flex gap-2 sm:flex-col shrink-0">
                <button
                  type="button"
                  onClick={() => handleDateShortcut(0)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium transition whitespace-nowrap"
                >
                  Hôm nay
                </button>
                <button
                  type="button"
                  onClick={() => handleDateShortcut(1)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium transition whitespace-nowrap"
                >
                  Ngày mai
                </button>
              </div>
            </div>
          </Card>

          {/* Section 2: Đối tượng áp dụng */}
          <Card
            className={
              formData.branchId !== initialData.branchId ||
              formData.deliveryTimeSlotId !== initialData.deliveryTimeSlotId
                ? "border-amber-200 dark:border-amber-800"
                : ""
            }
          >
            <div className="border-b border-gray-100 dark:border-gray-700 pb-4 mb-4">
              <h2 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
                <MapPinned className="w-5 h-5 text-gray-400" /> 2. Đối tượng áp
                dụng
              </h2>
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
                    className={`w-full pl-9 pr-4 py-2.5 border rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none text-gray-900 dark:text-white ${errors.branchId ? "border-red-500" : formData.branchId !== initialData.branchId ? "border-amber-400 bg-amber-50 dark:bg-amber-900/10" : "border-gray-300 bg-white dark:bg-gray-800 dark:border-gray-600"}`}
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
                  Khung giờ áp dụng <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Clock3 className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                  <select
                    ref={setFieldRef("deliveryTimeSlotId")}
                    name="deliveryTimeSlotId"
                    value={formData.deliveryTimeSlotId}
                    onChange={handleChange}
                    className={`w-full pl-9 pr-4 py-2.5 border rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none text-gray-900 dark:text-white ${errors.deliveryTimeSlotId ? "border-red-500" : formData.deliveryTimeSlotId !== initialData.deliveryTimeSlotId ? "border-amber-400 bg-amber-50 dark:bg-amber-900/10" : "border-gray-300 bg-white dark:bg-gray-800 dark:border-gray-600"}`}
                  >
                    <option value="">-- Chọn khung giờ --</option>
                    {slots.map((slot) => (
                      <option key={slot.id} value={slot.id}>
                        {slot.label} ({String(slot.startTime).slice(0, 5)} -{" "}
                        {String(slot.endTime).slice(0, 5)})
                      </option>
                    ))}
                  </select>
                </div>
                {errors.deliveryTimeSlotId && (
                  <p className="text-xs text-red-600 mt-1">
                    {errors.deliveryTimeSlotId}
                  </p>
                )}
              </div>
            </div>

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

          {/* Section 3: Sức chứa ngày đó */}
          <Card
            className={
              formData.maxOrders !== initialData.maxOrders
                ? "border-amber-200 dark:border-amber-800"
                : ""
            }
          >
            <div className="border-b border-gray-100 dark:border-gray-700 pb-4 mb-4 flex justify-between items-start">
              <div>
                <h2 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-gray-400" /> 3. Sức chứa
                  thực tế
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Xác định giới hạn đơn chi nhánh được phép nhận cho ngày và
                  slot hiện tại.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 mb-6">
              {/* Đơn đã giữ chỗ (Reserved) - TÂM ĐIỂM */}
              <div className="bg-orange-50 dark:bg-orange-900/10 border border-orange-200 dark:border-orange-800/50 rounded-xl p-5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-orange-100 dark:bg-orange-900/50 p-2.5 rounded-lg">
                    <PackageCheck className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-white text-base">
                      Đơn đã nhận (Reserved)
                    </h3>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Số lượng đơn hàng thực tế đã được khách đặt trong slot
                      này.
                    </p>
                  </div>
                </div>
                <div className="text-3xl font-black text-orange-600 dark:text-orange-400">
                  {initialMetrics.reserved}
                </div>
              </div>

              {/* Input Value */}
              <div
                className={`p-4 rounded-xl border-2 transition-all flex flex-col md:flex-row gap-6 ${!formData.maxOrders ? "border-purple-200 bg-purple-50/30" : formData.maxOrders !== initialData.maxOrders ? "border-amber-400 bg-amber-50/30" : "border-blue-200 bg-blue-50/30"}`}
              >
                <div className="flex-1">
                  <label className="block text-sm font-bold text-gray-900 dark:text-white mb-2">
                    Giới hạn đơn của ngày này
                  </label>
                  <input
                    ref={setFieldRef("maxOrders")}
                    type="number"
                    min="0"
                    step="1"
                    name="maxOrders"
                    value={formData.maxOrders}
                    onChange={handleChange}
                    placeholder="Trống = Không giới hạn"
                    className={`w-full max-w-sm border rounded-lg px-3 py-2.5 text-sm focus:outline-none ${errors.maxOrders ? "border-red-500 focus:ring-red-500" : formData.maxOrders !== initialData.maxOrders ? "border-amber-400 bg-amber-50 text-amber-900 focus:ring-amber-500" : "border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-blue-500"}`}
                  />
                  {errors.maxOrders && (
                    <p className="text-xs text-red-600 mt-1">
                      {errors.maxOrders}
                    </p>
                  )}
                  {formData.maxOrders !== initialData.maxOrders && (
                    <p className="text-xs font-medium text-amber-600 mt-1.5">
                      Giới hạn cũ:{" "}
                      {formatMaxOrdersPreview(initialData.maxOrders)}
                    </p>
                  )}
                </div>

                <div className="flex-1 flex flex-col justify-center">
                  <div className="text-xs text-gray-500 mb-1">
                    Mô phỏng (Preview)
                  </div>
                  {!formData.maxOrders ? (
                    <div className="text-sm font-medium text-purple-700 dark:text-purple-400 flex items-start gap-1.5">
                      <Zap className="w-4 h-4 shrink-0 mt-0.5" /> Slot này sẽ{" "}
                      <strong>không bị giới hạn</strong> số đơn nhận vào.
                    </div>
                  ) : (
                    <div className="text-sm font-medium text-blue-700 dark:text-blue-400 flex flex-col gap-1.5">
                      <div className="flex items-start gap-1.5">
                        <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />{" "}
                        Slot này sẽ nhận tối đa{" "}
                        <strong>
                          {formatMaxOrdersPreview(formData.maxOrders)}
                        </strong>
                        .
                      </div>
                      {currentMetrics.max !== null &&
                        currentMetrics.max < currentMetrics.reserved && (
                          <div className="text-red-600 dark:text-red-400 font-bold bg-red-50 dark:bg-red-900/20 p-1.5 rounded flex items-start gap-1">
                            <AlertTriangle className="w-4 h-4 shrink-0" /> Nguy
                            cơ: Giới hạn mới thấp hơn cả số đơn đang có.
                          </div>
                        )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </Card>

          {/* Section 4: Trạng thái */}
          <Card
            className={
              formData.status !== initialData.status
                ? "border-amber-200 dark:border-amber-800"
                : ""
            }
          >
            <div className="border-b border-gray-100 dark:border-gray-700 pb-4 mb-4">
              <h2 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
                <Power className="w-5 h-5 text-gray-400" /> 4. Trạng thái điều
                độ
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
                <option value="active">
                  Hoạt động (Áp dụng cho điều độ ngày này)
                </option>
                <option value="inactive">
                  Tạm dừng (Khóa, không tham gia điều độ)
                </option>
              </select>
              <p className="text-[11px] text-gray-500 mt-1.5">
                Chỉ khi ở trạng thái Hoạt động, giới hạn thực tế này mới có tác
                dụng. Tạm dừng để khóa hoàn toàn không nhận đơn thêm.
              </p>
            </div>
          </Card>
        </div>

        {/* CỘT PHẢI: LIVE PREVIEW PANEL */}
        <div className="xl:col-span-1">
          <div className="sticky top-24 space-y-6">
            {/* Change Impact Advisory */}
            {isDirty ? (
              <Card
                className={`bg-gradient-to-br shadow-sm overflow-hidden transition-all duration-300 ${changeImpacts.some((i) => i.includes("CẢNH BÁO") || i.includes("NGUY HIỂM")) ? "border-red-200 dark:border-red-900/50 from-red-50 to-white dark:from-gray-800 dark:to-gray-800/80" : "border-amber-200 dark:border-amber-900/50 from-amber-50 to-white dark:from-gray-800 dark:to-gray-800/80"}`}
              >
                <div
                  className={`text-white px-4 py-3 -mx-6 -mt-6 mb-5 flex items-center gap-2 font-bold shadow-sm ${changeImpacts.some((i) => i.includes("CẢNH BÁO") || i.includes("NGUY HIỂM")) ? "bg-red-500" : "bg-amber-500"}`}
                >
                  <AlertTriangle className="w-5 h-5" /> Đánh giá tác động
                </div>
                {changeImpacts.length > 0 ? (
                  <ul className="space-y-3 text-sm">
                    {changeImpacts.map((impact, idx) => (
                      <li
                        key={idx}
                        className="flex items-start gap-2.5 text-gray-700 dark:text-gray-300"
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${impact.includes("CẢNH BÁO") || impact.includes("NGUY HIỂM") ? "bg-red-500" : "bg-amber-500"}`}
                        ></span>
                        <span
                          className={
                            impact.includes("NGUY HIỂM")
                              ? "font-bold text-red-600 dark:text-red-400"
                              : impact.includes("CẢNH BÁO")
                                ? "font-bold text-amber-600 dark:text-amber-400"
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
                    Thay đổi hiện tại không ảnh hưởng quá lớn tới vận hành.
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
                  <CalendarCheck className="w-5 h-5" /> Kế hoạch sau khi Lưu
                </span>
              </div>

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
                      ? "Sẽ được áp dụng"
                      : "Đang tạm tắt"}
                  </span>
                </div>

                <div
                  className={
                    formData.deliveryDate !== initialData.deliveryDate
                      ? "bg-amber-100 -mx-2 px-2 py-1 rounded"
                      : ""
                  }
                >
                  <div className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                    <CalendarDays className="w-4 h-4" /> Cho Ngày
                  </div>
                  <div className="font-black text-gray-900 dark:text-white text-lg">
                    {formData.deliveryDate}
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-100 dark:border-gray-700 flex flex-col gap-2">
                  <div className="flex justify-between items-center pb-2">
                    <span className="text-gray-500 font-medium">
                      Còn trống (Avail):
                    </span>
                    <span
                      className={`text-lg font-black ${currentMetrics.available !== "∞" && (currentMetrics.available as number) <= 0 ? "text-red-500" : "text-green-600 dark:text-green-400"}`}
                    >
                      {currentMetrics.available}
                    </span>
                  </div>

                  {/* Progress Bar Dự Kiến */}
                  {!currentMetrics.isUnlimited &&
                  currentMetrics.max !== null ? (
                    <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2 mb-1 overflow-hidden">
                      <div
                        className={`h-2 rounded-full transition-all duration-300 ${currentMetrics.percent >= 100 ? "bg-red-500" : currentMetrics.percent >= 80 ? "bg-orange-500" : "bg-blue-500"}`}
                        style={{
                          width: `${Math.min(currentMetrics.percent, 100)}%`,
                        }}
                      ></div>
                    </div>
                  ) : (
                    <div className="w-full bg-purple-100 dark:bg-purple-900/30 rounded-full h-2 mb-1 flex items-center justify-center overflow-hidden">
                      <div className="w-full bg-purple-300 dark:bg-purple-700/50 h-full opacity-50"></div>
                    </div>
                  )}

                  <div className="flex justify-between items-center text-xs text-gray-500 mt-1 pt-2 border-t border-gray-100 dark:border-gray-700">
                    <span>
                      Đã đặt:{" "}
                      <strong className="text-gray-900 dark:text-white">
                        {currentMetrics.reserved}
                      </strong>
                    </span>
                    <span
                      className={
                        formData.maxOrders !== initialData.maxOrders
                          ? "text-amber-600 font-bold"
                          : ""
                      }
                    >
                      Tối đa:{" "}
                      <strong className="text-gray-900 dark:text-white">
                        {currentMetrics.isUnlimited ? "∞" : currentMetrics.max}
                      </strong>
                    </span>
                  </div>
                </div>
              </div>
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
            {isDirty && Object.keys(errors).length === 0 && (
              <span className="text-amber-600 flex items-center gap-1">
                <Info className="w-4 h-4" /> Bấm lưu để áp dụng thay đổi
              </span>
            )}
          </div>
          <div className="flex gap-3 w-full sm:w-auto">
            <button
              type="button"
              onClick={() =>
                navigate(
                  `/admin/shipping/branch-delivery-slot-capacities?deliveryDate=${initialData.deliveryDate}`,
                )
              }
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

export default BranchDeliverySlotCapacityEditPage;
