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
  Clock3,
  CalendarDays,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Info,
  ShieldAlert,
  MapPinned,
  Power,
  CalendarCheck,
  Zap,
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

interface BranchDeliverySlotCapacityFormData {
  branchId: string;
  deliveryDate: string;
  deliveryTimeSlotId: string;
  maxOrders: string;
  status: "active" | "inactive";
}

type ApiList<T> = {
  success: boolean;
  data: T[] | { items: T[] };
  meta?: any;
};

// =============================
// HELPERS
// =============================
const initialForm: BranchDeliverySlotCapacityFormData = {
  branchId: "",
  deliveryDate: "",
  deliveryTimeSlotId: "",
  maxOrders: "",
  status: "active",
};

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
      note: "Capacity hôm nay thường dùng cho điều độ vận hành ngay.",
    };
  if (dateStr === tomorrowStr)
    return {
      type: "tomorrow",
      label: "Ngày mai",
      note: "Phù hợp để chuẩn bị năng lực nhận đơn trước một ngày.",
    };
  if (dateStr < todayStr)
    return {
      type: "past",
      label: "Quá khứ",
      note: "Ngày ở quá khứ, hãy cẩn thận khi điều độ lại lịch sử.",
    };
  return {
    type: "future",
    label: "Tương lai",
    note: "Lập kế hoạch capacity cho các ngày tới.",
  };
};

// =============================
// MAIN COMPONENT
// =============================
const BranchDeliverySlotCapacityCreatePage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { showSuccessToast, showErrorToast } = useAdminToast();

  const [formData, setFormData] =
    useState<BranchDeliverySlotCapacityFormData>(initialForm);
  const [branches, setBranches] = useState<BranchOption[]>([]);
  const [slots, setSlots] = useState<DeliveryTimeSlotOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [bootstrapLoading, setBootstrapLoading] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isPrefilled, setIsPrefilled] = useState(false);

  const fieldRefs = useRef<
    Record<string, HTMLInputElement | HTMLSelectElement | null>
  >({});

  // --- Initialize Context from Query Params ---
  useEffect(() => {
    const prefillBranch = searchParams.get("branchId");
    const prefillSlot = searchParams.get("deliveryTimeSlotId");
    const prefillDate = searchParams.get("deliveryDate");

    if (prefillBranch || prefillSlot || prefillDate) {
      setFormData((prev) => ({
        ...prev,
        branchId: prefillBranch || prev.branchId,
        deliveryTimeSlotId: prefillSlot || prev.deliveryTimeSlotId,
        deliveryDate: prefillDate || prev.deliveryDate,
      }));
      setIsPrefilled(true);
    }
  }, [searchParams]);

  // --- Fetch Data ---
  const fetchBootstrap = async () => {
    try {
      setBootstrapLoading(true);
      const [branchesRes, slotsRes] = await Promise.all([
        http<ApiList<BranchOption>>(
          "GET",
          "/api/v1/admin/branches?limit=1000&status=active",
        ),
        http<ApiList<DeliveryTimeSlotOption>>(
          "GET",
          "/api/v1/admin/delivery-time-slots?page=1&limit=1000&status=active",
        ),
      ]);

      const branchesData = Array.isArray(branchesRes?.data)
        ? branchesRes.data
        : branchesRes?.data?.items || [];
      const slotsData = Array.isArray(slotsRes?.data)
        ? slotsRes.data
        : slotsRes?.data?.items || [];

      setBranches(branchesData);
      setSlots(slotsData);
    } catch (err: any) {
      showErrorToast(err?.message || "Không thể tải dữ liệu chi nhánh / slot.");
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

  const selectedSlot = useMemo(
    () =>
      slots.find((x) => String(x.id) === formData.deliveryTimeSlotId) || null,
    [slots, formData.deliveryTimeSlotId],
  );

  const timeBucket = useMemo(
    () => (selectedSlot ? getTimeBucket(selectedSlot.startTime) : null),
    [selectedSlot],
  );
  const dateContext = useMemo(
    () => getDateContext(formData.deliveryDate),
    [formData.deliveryDate],
  );

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
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleDateShortcut = (daysToAdd: number) => {
    const d = new Date();
    d.setDate(d.getDate() + daysToAdd);
    const dateStr = getLocalDateString(d);
    setFormData((prev) => ({ ...prev, deliveryDate: dateStr }));
    if (errors.deliveryDate)
      setErrors((prev) => ({ ...prev, deliveryDate: "" }));
  };

  const validateForm = () => {
    const nextErrors: Record<string, string> = {};

    if (!formData.deliveryDate)
      nextErrors.deliveryDate = "Vui lòng chọn ngày giao.";
    if (!formData.branchId) nextErrors.branchId = "Vui lòng chọn chi nhánh.";
    if (!formData.deliveryTimeSlotId)
      nextErrors.deliveryTimeSlotId = "Vui lòng chọn khung giờ.";

    if (formData.maxOrders.trim() !== "") {
      const n = Number(formData.maxOrders);
      if (!Number.isFinite(n) || n < 0) {
        nextErrors.maxOrders = "Giới hạn đơn phải là số nguyên >= 0.";
      }
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
        deliveryDate: formData.deliveryDate,
        deliveryTimeSlotId: Number(formData.deliveryTimeSlotId),
        maxOrders:
          formData.maxOrders.trim() === "" ? null : Number(formData.maxOrders),
        status: formData.status,
      };

      const res = await http<any>(
        "POST",
        "/api/v1/admin/branch-delivery-slot-capacities/create",
        payload,
      );

      if (res?.success) {
        showSuccessToast({ message: "Tạo capacity ngày thành công!" });
        navigate(
          `/admin/shipping/branch-delivery-slot-capacities?deliveryDate=${formData.deliveryDate}`,
        );
      } else {
        showErrorToast(res?.message || "Tạo capacity thất bại.");
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
            onClick={() =>
              navigate("/admin/shipping/branch-delivery-slot-capacities")
            }
            className="flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-blue-600 transition-colors mb-2"
          >
            <ArrowLeft className="w-4 h-4" /> Quay lại Bảng điều độ
          </button>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            Thiết lập Capacity theo ngày
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1.5">
            Bước điều độ cuối cùng: Xác định số đơn tối đa mà chi nhánh có thể
            nhận trong một ngày và khung giờ cụ thể.
          </p>
        </div>
        <div className="hidden lg:block bg-blue-50 dark:bg-blue-900/30 border border-blue-100 dark:border-blue-800 text-blue-700 dark:text-blue-300 px-4 py-2.5 rounded-lg text-sm max-w-sm">
          <Info className="w-4 h-4 inline-block mr-1.5 -mt-0.5" />
          System slot và Branch slot là cấu hình nền. Capacity theo ngày mới là
          lớp điều độ vận hành thực tế.
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="grid grid-cols-1 xl:grid-cols-3 gap-6 lg:gap-8"
      >
        {/* CỘT TRÁI: FORM BUILDER */}
        <div className="xl:col-span-2 space-y-6">
          {/* Section 1: Chọn ngày điều độ */}
          <Card className={errors.deliveryDate ? "border-red-200" : ""}>
            <div className="border-b border-gray-100 dark:border-gray-700 pb-4 mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
                  <CalendarDays className="w-5 h-5 text-gray-400" /> 1. Chọn
                  ngày điều độ
                </h2>
              </div>
              {dateContext && (
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${dateContext.type === "today" ? "bg-blue-100 text-blue-700" : dateContext.type === "tomorrow" ? "bg-indigo-100 text-indigo-700" : "bg-gray-100 text-gray-700"}`}
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
                  className={`w-full border rounded-lg p-2.5 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none font-semibold ${errors.deliveryDate ? "border-red-500" : "border-gray-300 dark:border-gray-600"}`}
                />
                {errors.deliveryDate && (
                  <p className="text-xs text-red-600 mt-1.5">
                    {errors.deliveryDate}
                  </p>
                )}
                {dateContext?.note && (
                  <p className="text-xs font-medium text-gray-500 mt-2 flex items-center gap-1">
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
          <Card>
            <div className="border-b border-gray-100 dark:border-gray-700 pb-4 mb-4">
              <h2 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
                <MapPinned className="w-5 h-5 text-gray-400" /> 2. Đối tượng áp
                dụng
              </h2>
              {isPrefilled && (
                <p className="text-[11px] font-bold text-green-600 mt-1">
                  Thông tin chi nhánh/khung giờ đã được điền sẵn.
                </p>
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
                  Khung giờ áp dụng <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Clock3 className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                  <select
                    ref={setFieldRef("deliveryTimeSlotId")}
                    name="deliveryTimeSlotId"
                    value={formData.deliveryTimeSlotId}
                    onChange={handleChange}
                    disabled={bootstrapLoading}
                    className={`w-full pl-9 pr-4 py-2.5 border rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none disabled:opacity-60 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white ${errors.deliveryTimeSlotId ? "border-red-500" : "border-gray-300 dark:border-gray-600"}`}
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
          <Card>
            <div className="border-b border-gray-100 dark:border-gray-700 pb-4 mb-4 flex justify-between items-start">
              <div>
                <h2 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-gray-400" /> 3. Sức chứa
                  thực tế
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Xác định giới hạn đơn chi nhánh được phép nhận cho đúng ngày
                  và slot này.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="md:col-span-2">
                {/* Explanation Block */}
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 flex flex-col gap-2 mb-4 text-sm text-gray-600 dark:text-gray-300">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full"></div>{" "}
                    System Slot: Giới hạn mẫu toàn hệ thống.
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full"></div>{" "}
                    Branch Slot: Ghi đè giới hạn riêng cho chi nhánh.
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>{" "}
                    <strong className="text-gray-900 dark:text-white">
                      Daily Capacity:
                    </strong>{" "}
                    Đây là lớp điều độ cuối cùng có quyền ưu tiên cao nhất trong
                    ngày.
                  </div>
                </div>
              </div>

              {/* Input Value */}
              <div
                className={`p-4 rounded-xl border-2 transition-all md:col-span-2 flex flex-col md:flex-row gap-6 ${!formData.maxOrders ? "border-purple-200 bg-purple-50/30" : "border-blue-200 bg-blue-50/30"}`}
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
                    className="w-full max-w-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2.5 bg-white dark:bg-gray-800 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                  {errors.maxOrders && (
                    <p className="text-xs text-red-600 mt-1">
                      {errors.maxOrders}
                    </p>
                  )}
                </div>

                <div className="flex-1 flex flex-col justify-center">
                  <div className="text-xs text-gray-500 mb-1">
                    Diễn giải thực tế:
                  </div>
                  {!formData.maxOrders ? (
                    <div className="text-sm font-medium text-purple-700 dark:text-purple-400 flex items-start gap-1.5">
                      <Zap className="w-4 h-4 shrink-0 mt-0.5" /> Ngày này, slot
                      này sẽ <strong>không giới hạn</strong> số đơn nhận vào.
                    </div>
                  ) : (
                    <div className="text-sm font-medium text-blue-700 dark:text-blue-400 flex items-start gap-1.5">
                      <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" /> Ngày
                      này, slot này sẽ nhận tối đa{" "}
                      <strong>
                        {formatMaxOrdersPreview(formData.maxOrders)}
                      </strong>
                      .
                    </div>
                  )}
                </div>
              </div>
            </div>
          </Card>

          {/* Section 4: Trạng thái */}
          <Card>
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
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg p-2.5 bg-white dark:bg-gray-800 text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="active">
                  Hoạt động (Áp dụng cho điều độ ngày này)
                </option>
                <option value="inactive">Tạm dừng (Bỏ qua cấu hình này)</option>
              </select>
              <p className="text-[11px] text-gray-500 mt-1.5">
                Chỉ khi ở trạng thái Hoạt động, giới hạn thực tế này mới có tác
                dụng. Tạm dừng để khóa nhận đơn trong ngày.
              </p>
            </div>
          </Card>
        </div>

        {/* CỘT PHẢI: LIVE PREVIEW PANEL */}
        <div className="xl:col-span-1">
          <div className="sticky top-24 space-y-6">
            {/* Live Activation Summary */}
            <Card className="border-blue-100 dark:border-blue-900/50 bg-gradient-to-br from-blue-50 to-white dark:from-gray-800 dark:to-gray-800/80 shadow-sm overflow-hidden">
              <div className="bg-blue-600 text-white px-4 py-3 -mx-6 -mt-6 mb-5 flex items-center justify-between font-bold shadow-sm">
                <span className="flex items-center gap-2">
                  <CalendarCheck className="w-5 h-5" /> Kế hoạch Capacity
                </span>
              </div>

              {!selectedBranch || !selectedSlot || !formData.deliveryDate ? (
                <div className="flex flex-col items-center justify-center py-10 text-center opacity-60">
                  <CalendarDays className="w-10 h-10 text-blue-300 mb-3" />
                  <span className="text-sm font-medium text-gray-600">
                    Chọn Ngày, Chi nhánh và Khung giờ
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
                        ? "Sẽ được áp dụng"
                        : "Đang tạm tắt"}
                    </span>
                  </div>

                  <div>
                    <div className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                      <CalendarDays className="w-4 h-4" /> Cho Ngày
                    </div>
                    <div className="font-black text-gray-900 dark:text-white text-lg">
                      {formData.deliveryDate}
                    </div>
                  </div>

                  <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-100 dark:border-gray-700 flex flex-col gap-2">
                    <div className="flex justify-between items-center border-b border-gray-100 dark:border-gray-700 pb-2">
                      <span className="text-gray-500 font-medium">
                        Chi nhánh:
                      </span>
                      <span className="font-bold text-gray-900 dark:text-white">
                        {selectedBranch.name}
                      </span>
                    </div>
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
                    <div className="flex justify-between items-center mt-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded">
                      <span className="text-blue-800 dark:text-blue-300 font-bold">
                        Max Orders:
                      </span>
                      {!formData.maxOrders ? (
                        <span className="font-black text-purple-600 dark:text-purple-400 uppercase text-xs">
                          Không giới hạn
                        </span>
                      ) : (
                        <span className="font-black text-blue-700 dark:text-blue-400 text-base">
                          {formatMaxOrdersPreview(formData.maxOrders)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </Card>

            <Card className="bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
              <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200 mb-3 flex items-center gap-2">
                <ArrowRight className="w-4 h-4 text-gray-500" /> Bước tiếp theo
              </h3>
              <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed mb-3">
                Sau khi tạo xong, bạn có thể quay về Bảng điều độ (Capacity
                Board) để theo dõi tổng thể sức chứa, tình trạng đầy/trống của
                các chi nhánh.
              </p>
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
              onClick={() =>
                navigate("/admin/shipping/branch-delivery-slot-capacities")
              }
              className="flex-1 sm:flex-none px-6 py-2.5 rounded-lg font-medium bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-200 transition-colors"
            >
              Hủy bỏ
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading || bootstrapLoading}
              className="flex-1 sm:flex-none px-8 py-2.5 rounded-lg font-medium bg-blue-600 hover:bg-blue-700 text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-sm"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" /> Đang lưu...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" /> Lưu Capacity Ngày
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BranchDeliverySlotCapacityCreatePage;
