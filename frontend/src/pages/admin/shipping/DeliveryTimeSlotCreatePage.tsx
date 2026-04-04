import React, {
  useMemo,
  useRef,
  useState,
  useEffect,
  type ChangeEvent,
  type FormEvent,
} from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Loader2,
  Save,
  Clock3,
  AlertCircle,
  Tag,
  CalendarClock,
  ShieldAlert,
  ListOrdered,
  Timer,
  Info,
  ArrowRight,
} from "lucide-react";
import Card from "../../../components/admin/layouts/Card";
import { http } from "../../../services/http";
import { useAdminToast } from "../../../context/AdminToastContext";

// =============================
// TYPES
// =============================
interface DeliveryTimeSlotFormData {
  code: string;
  label: string;
  startTime: string;
  endTime: string;
  cutoffMinutes: string;
  maxOrders: string;
  sortOrder: string;
  status: "active" | "inactive";
}

const initialForm: DeliveryTimeSlotFormData = {
  code: "",
  label: "",
  startTime: "",
  endTime: "",
  cutoffMinutes: "0",
  maxOrders: "",
  sortOrder: "0",
  status: "active",
};

// =============================
// HELPERS
// =============================
const normalizeCode = (value: string) =>
  value
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "_")
    .replace(/[^A-Z0-9_]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "");

const formatMaxOrdersPreview = (value: string) => {
  if (!value || value.trim() === "") return "Không giới hạn";
  const n = Number(value);
  if (!Number.isFinite(n)) return "Không giới hạn";
  return `${n.toLocaleString("vi-VN")} đơn`;
};

const timeToMinutes = (value: string) => {
  if (!value) return Number.NaN;
  const [h, m] = value.split(":").map(Number);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return Number.NaN;
  return h * 60 + m;
};

const getDuration = (start?: string, end?: string) => {
  if (!start || !end) return "";
  try {
    const startMin = timeToMinutes(start);
    const endMin = timeToMinutes(end);
    if (isNaN(startMin) || isNaN(endMin)) return "";

    let diffMin = endMin - startMin;
    if (diffMin < 0) diffMin += 24 * 60; // Xuyên đêm

    const h = Math.floor(diffMin / 60);
    const m = diffMin % 60;

    if (h > 0 && m > 0) return `${h} giờ ${m} phút`;
    if (h > 0) return `${h} giờ`;
    return `${m} phút`;
  } catch (e) {
    return "";
  }
};

const getTimeBucket = (startTime?: string) => {
  if (!startTime) return null;
  const hour = parseInt(startTime.split(":")[0], 10);
  if (isNaN(hour)) return null;
  if (hour < 12)
    return {
      label: "Buổi sáng",
      color:
        "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400",
    };
  if (hour < 18)
    return {
      label: "Buổi chiều",
      color:
        "bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400",
    };
  return {
    label: "Buổi tối",
    color:
      "bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-400",
  };
};

// =============================
// MAIN COMPONENT
// =============================
const DeliveryTimeSlotCreatePage: React.FC = () => {
  const navigate = useNavigate();
  const { showSuccessToast, showErrorToast } = useAdminToast();

  const [formData, setFormData] =
    useState<DeliveryTimeSlotFormData>(initialForm);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const fieldRefs = useRef<
    Record<string, HTMLInputElement | HTMLSelectElement | null>
  >({});
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
    let nextValue = value;
    if (name === "code") nextValue = normalizeCode(value);

    setFormData((prev) => ({ ...prev, [name]: nextValue }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleAutoFillLabel = () => {
    if (!formData.startTime || !formData.endTime) return;
    const bucket = getTimeBucket(formData.startTime);
    const bucketStr = bucket ? bucket.label.replace("Buổi ", "") : "Khung giờ";
    const newLabel = `${bucketStr} (${formData.startTime} - ${formData.endTime})`;
    setFormData((prev) => ({ ...prev, label: newLabel }));
    if (errors.label) setErrors((prev) => ({ ...prev, label: "" }));
  };

  const handleAutoFillCode = () => {
    const source =
      formData.label.trim() ||
      (formData.startTime && formData.endTime
        ? `SLOT_${formData.startTime.replace(":", "")}_${formData.endTime.replace(":", "")}`
        : "");
    if (!source) return;
    setFormData((prev) => ({ ...prev, code: normalizeCode(source) }));
    if (errors.code) setErrors((prev) => ({ ...prev, code: "" }));
  };

  // Automatically generate code when label changes (if code is empty)
  useEffect(() => {
    if (formData.label && !formData.code && !errors.code) {
      handleAutoFillCode();
    }
  }, [formData.label]);

  // Derived Preview Data
  const timeBucket = useMemo(
    () => getTimeBucket(formData.startTime),
    [formData.startTime],
  );
  const duration = useMemo(
    () => getDuration(formData.startTime, formData.endTime),
    [formData.startTime, formData.endTime],
  );

  const validateForm = () => {
    const nextErrors: Record<string, string> = {};

    if (!formData.label.trim())
      nextErrors.label = "Vui lòng nhập tên khung giờ.";
    if (!formData.code.trim()) nextErrors.code = "Vui lòng nhập mã khung giờ.";
    if (!formData.startTime)
      nextErrors.startTime = "Vui lòng chọn giờ bắt đầu.";
    if (!formData.endTime) nextErrors.endTime = "Vui lòng chọn giờ kết thúc.";

    if (formData.startTime && formData.endTime) {
      const start = timeToMinutes(formData.startTime);
      const end = timeToMinutes(formData.endTime);

      if (isNaN(start)) nextErrors.startTime = "Giờ bắt đầu không hợp lệ.";
      if (isNaN(end)) nextErrors.endTime = "Giờ kết thúc không hợp lệ.";
      // Cho phép qua đêm nên start >= end có thể bỏ qua tùy bussiness, nhưng thường trong 1 ngày thì:
      if (!isNaN(start) && !isNaN(end) && start >= end) {
        nextErrors.endTime = "Giờ kết thúc phải lớn hơn giờ bắt đầu.";
      }
    }

    if (formData.cutoffMinutes.trim() === "") {
      nextErrors.cutoffMinutes = "Vui lòng nhập cutoff minutes.";
    } else {
      const cutoff = Number(formData.cutoffMinutes);
      if (!Number.isInteger(cutoff) || cutoff < 0)
        nextErrors.cutoffMinutes = "Cutoff minutes phải là số nguyên >= 0.";
    }

    if (formData.sortOrder.trim() === "") {
      nextErrors.sortOrder = "Vui lòng nhập thứ tự hiển thị.";
    } else {
      const sortOrder = Number(formData.sortOrder);
      if (!Number.isInteger(sortOrder))
        nextErrors.sortOrder = "Thứ tự hiển thị phải là số nguyên.";
    }

    if (formData.maxOrders.trim() !== "") {
      const maxOrders = Number(formData.maxOrders);
      if (!Number.isInteger(maxOrders) || maxOrders < 0)
        nextErrors.maxOrders = "Số đơn tối đa phải là số nguyên >= 0.";
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
        code: formData.code.trim(),
        label: formData.label.trim(),
        startTime: formData.startTime,
        endTime: formData.endTime,
        cutoffMinutes: Number(formData.cutoffMinutes),
        maxOrders:
          formData.maxOrders.trim() === "" ? null : Number(formData.maxOrders),
        sortOrder: Number(formData.sortOrder),
        status: formData.status,
      };

      const res = await http<any>(
        "POST",
        "/api/v1/admin/delivery-time-slots/create",
        payload,
      );

      if (res?.success) {
        showSuccessToast({ message: "Tạo khung giờ hệ thống thành công!" });
        navigate("/admin/shipping/delivery-slots");
      } else {
        showErrorToast(res?.message || "Tạo khung giờ hệ thống thất bại.");
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
            onClick={() => navigate("/admin/shipping/delivery-slots")}
            className="flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-blue-600 transition-colors mb-2"
          >
            <ArrowLeft className="w-4 h-4" /> Quay lại danh sách
          </button>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            Tạo khung giờ hệ thống
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1.5">
            Tạo khung giờ chuẩn dùng làm nền cho branch slots, cutoff nhận đơn
            và giới hạn năng lực mặc định.
          </p>
        </div>
        <div className="hidden lg:block bg-blue-50 dark:bg-blue-900/30 border border-blue-100 dark:border-blue-800 text-blue-700 dark:text-blue-300 px-4 py-2.5 rounded-lg text-sm">
          <Info className="w-4 h-4 inline-block mr-1.5 -mt-0.5" />
          Sau khi tạo xong, bạn có thể bật slot này cho các chi nhánh tương ứng.
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="grid grid-cols-1 xl:grid-cols-3 gap-6 lg:gap-8"
      >
        {/* CỘT TRÁI: FORM BUILDER */}
        <div className="xl:col-span-2 space-y-6">
          {/* Section 1: Thời gian hoạt động (Đưa lên trên để UX mượt) */}
          <Card
            className={`border-2 transition-all ${errors.startTime || errors.endTime ? "border-red-200" : "border-gray-200 dark:border-gray-700"}`}
          >
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100 dark:border-gray-700">
              <div className="flex items-center gap-2">
                <CalendarClock className="w-5 h-5 text-gray-400" />
                <h2 className="text-lg font-bold text-gray-800 dark:text-white">
                  1. Thời gian hoạt động
                </h2>
              </div>
              {duration && (
                <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded">
                  Kéo dài: {duration}
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  Giờ bắt đầu <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Clock3 className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <input
                    ref={setFieldRef("startTime")}
                    type="time"
                    name="startTime"
                    value={formData.startTime}
                    onChange={handleChange}
                    className={`w-full pl-9 pr-4 py-2.5 border rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all ${errors.startTime ? "border-red-500" : "border-gray-300 dark:border-gray-600"}`}
                  />
                </div>
                {errors.startTime && (
                  <p className="text-xs text-red-600 mt-1">
                    {errors.startTime}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  Giờ kết thúc <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Timer className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <input
                      ref={setFieldRef("endTime")}
                      type="time"
                      name="endTime"
                      value={formData.endTime}
                      onChange={handleChange}
                      className={`w-full pl-9 pr-4 py-2.5 border rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all ${errors.endTime ? "border-red-500" : "border-gray-300 dark:border-gray-600"}`}
                    />
                    {errors.endTime && (
                      <p className="text-xs text-red-600 mt-1">
                        {errors.endTime}
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={handleAutoFillLabel}
                    disabled={!formData.startTime || !formData.endTime}
                    className="px-3 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 whitespace-nowrap"
                    title="Tự động tạo tên từ khung giờ"
                  >
                    Gợi ý tên
                  </button>
                </div>
              </div>
            </div>
          </Card>

          {/* Section 2: Định danh Template */}
          <Card>
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-100 dark:border-gray-700">
              <Tag className="w-5 h-5 text-gray-400" />
              <h2 className="text-lg font-bold text-gray-800 dark:text-white">
                2. Định danh khung giờ
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  Tên hiển thị (Label) <span className="text-red-500">*</span>
                </label>
                <input
                  ref={setFieldRef("label")}
                  type="text"
                  name="label"
                  value={formData.label}
                  onChange={handleChange}
                  placeholder="VD: Sáng (08:00 - 12:00)"
                  className={`w-full border rounded-lg p-2.5 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all ${errors.label ? "border-red-500" : "border-gray-300 dark:border-gray-600"}`}
                />
                <p className="text-[11px] text-gray-500 mt-1.5">
                  Tên hiển thị trên màn hình admin và luồng chọn giờ của khách.
                </p>
                {errors.label && (
                  <p className="text-xs text-red-600 mt-1">{errors.label}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  Mã khung giờ (Code) <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <input
                      ref={setFieldRef("code")}
                      type="text"
                      name="code"
                      value={formData.code}
                      onChange={handleChange}
                      placeholder="VD: SLOT_08_12"
                      className={`w-full border rounded-lg p-2.5 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all uppercase font-mono text-sm ${errors.code ? "border-red-500" : "border-gray-300 dark:border-gray-600"}`}
                    />
                    <p className="text-[11px] text-gray-500 mt-1.5">
                      Mã ngắn gọn, dễ tra cứu (VD:{" "}
                      <span className="bg-gray-100 px-1 py-0.5 rounded">
                        SLOT_SANG
                      </span>
                      ).
                    </p>
                    {errors.code && (
                      <p className="text-xs text-red-600 mt-1">{errors.code}</p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={handleAutoFillCode}
                    className="px-3 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors h-[42px]"
                    title="Tạo mã từ tên"
                  >
                    Tạo mã
                  </button>
                </div>
              </div>
            </div>
          </Card>

          {/* Section 3 & 4: Logic nhận đơn & Hành vi hệ thống */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Logic nhận đơn */}
            <Card>
              <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-100 dark:border-gray-700">
                <ShieldAlert className="w-5 h-5 text-gray-400" />
                <h2 className="text-lg font-bold text-gray-800 dark:text-white">
                  3. Logic & Sức chứa
                </h2>
              </div>
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                    Thời gian chốt đơn (Cutoff minutes){" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <input
                    ref={setFieldRef("cutoffMinutes")}
                    type="number"
                    min="0"
                    step="1"
                    name="cutoffMinutes"
                    value={formData.cutoffMinutes}
                    onChange={handleChange}
                    className={`w-full border rounded-lg p-2.5 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none ${errors.cutoffMinutes ? "border-red-500" : "border-gray-300 dark:border-gray-600"}`}
                  />
                  <p className="text-[11px] text-gray-500 mt-1.5">
                    Hệ thống sẽ ngừng nhận đơn vào khung giờ này trước{" "}
                    <strong className="text-gray-700 dark:text-gray-300">
                      {formData.cutoffMinutes || "0"} phút
                    </strong>{" "}
                    tính từ giờ bắt đầu.
                  </p>
                  {errors.cutoffMinutes && (
                    <p className="text-xs text-red-600 mt-1">
                      {errors.cutoffMinutes}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                    Giới hạn đơn mặc định (Max orders)
                  </label>
                  <input
                    ref={setFieldRef("maxOrders")}
                    type="number"
                    min="0"
                    step="1"
                    name="maxOrders"
                    value={formData.maxOrders}
                    onChange={handleChange}
                    placeholder="Bỏ trống nếu không giới hạn"
                    className={`w-full border rounded-lg p-2.5 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none ${errors.maxOrders ? "border-red-500" : "border-gray-300 dark:border-gray-600"}`}
                  />
                  <p className="text-[11px] text-gray-500 mt-1.5 flex items-start gap-1">
                    <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                    Làm giá trị sức chứa mặc định, chi nhánh có thể override
                    sau. Preview:{" "}
                    <strong className="text-blue-600 ml-1">
                      {formatMaxOrdersPreview(formData.maxOrders)}
                    </strong>
                  </p>
                  {errors.maxOrders && (
                    <p className="text-xs text-red-600 mt-1">
                      {errors.maxOrders}
                    </p>
                  )}
                </div>
              </div>
            </Card>

            {/* Hành vi hệ thống */}
            <Card>
              <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-100 dark:border-gray-700">
                <ListOrdered className="w-5 h-5 text-gray-400" />
                <h2 className="text-lg font-bold text-gray-800 dark:text-white">
                  4. Hành vi hệ thống
                </h2>
              </div>
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                    Thứ tự hiển thị (Sort order){" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <input
                    ref={setFieldRef("sortOrder")}
                    type="number"
                    step="1"
                    name="sortOrder"
                    value={formData.sortOrder}
                    onChange={handleChange}
                    className={`w-full border rounded-lg p-2.5 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none ${errors.sortOrder ? "border-red-500" : "border-gray-300 dark:border-gray-600"}`}
                  />
                  <p className="text-[11px] text-gray-500 mt-1.5">
                    Giá trị nhỏ hơn sẽ được ưu tiên hiển thị trước. VD: Sáng (1)
                    - Chiều (2).
                  </p>
                  {errors.sortOrder && (
                    <p className="text-xs text-red-600 mt-1">
                      {errors.sortOrder}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                    Trạng thái (Status)
                  </label>
                  <select
                    ref={setFieldRef("status")}
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg p-2.5 bg-white dark:bg-gray-800 text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="active">
                      Hoạt động (Sẵn sàng kích hoạt)
                    </option>
                    <option value="inactive">
                      Tạm dừng (Lưu mẫu, chưa dùng)
                    </option>
                  </select>
                  <p className="text-[11px] text-gray-500 mt-1.5">
                    Slot ở trạng thái Hoạt động mới có thể bật cho chi nhánh.
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* CỘT PHẢI: LIVE PREVIEW PANEL */}
        <div className="xl:col-span-1">
          <div className="sticky top-24 space-y-6">
            {/* Live Template Summary */}
            <Card className="border-blue-100 dark:border-blue-900/50 bg-gradient-to-br from-blue-50 to-white dark:from-gray-800 dark:to-gray-800/80 shadow-sm overflow-hidden">
              <div className="bg-blue-600 text-white px-4 py-3 -mx-6 -mt-6 mb-5 flex items-center justify-between font-bold shadow-sm">
                <span className="flex items-center gap-2">
                  <Info className="w-5 h-5" /> Live Template Summary
                </span>
              </div>

              {!formData.startTime || !formData.endTime ? (
                <div className="flex flex-col items-center justify-center py-10 text-center opacity-60">
                  <Clock3 className="w-10 h-10 text-blue-300 mb-3" />
                  <span className="text-sm font-medium text-gray-600">
                    Bạn đang tạo một slot mới.
                    <br />
                    Hãy chọn thời gian để xem trước.
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
                      {formData.status === "active" ? "Đang bật" : "Tạm dừng"}
                    </span>
                  </div>

                  <div>
                    <div className="text-xl font-bold text-gray-900 dark:text-white leading-tight">
                      {formData.label || "Chưa nhập tên"}
                    </div>
                    <div className="text-[11px] font-mono text-gray-500 bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded w-fit mt-1.5">
                      {formData.code || "CHUA_CO_MA"}
                    </div>
                  </div>

                  <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-100 dark:border-gray-700 flex flex-col gap-2">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500 font-medium">
                        Timeline:
                      </span>
                      <span className="font-bold text-gray-900 dark:text-white">
                        {formData.startTime}{" "}
                        <ArrowRight className="w-3 h-3 inline text-gray-400 mx-0.5" />{" "}
                        {formData.endTime}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500 font-medium">
                        Kéo dài:
                      </span>
                      <span className="font-bold text-blue-600">
                        {duration}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500 font-medium">
                        Chốt đơn:
                      </span>
                      <span
                        className={`font-bold ${formData.cutoffMinutes === "0" ? "text-red-500" : "text-gray-900 dark:text-white"}`}
                      >
                        {formData.cutoffMinutes === "0"
                          ? "Sát giờ (0p)"
                          : `Trước ${formData.cutoffMinutes} phút`}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500 font-medium">
                        Giới hạn gốc:
                      </span>
                      <span
                        className={`font-bold ${!formData.maxOrders ? "text-purple-600" : "text-gray-900 dark:text-white"}`}
                      >
                        {formatMaxOrdersPreview(formData.maxOrders)}
                      </span>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-600 dark:text-gray-400 leading-relaxed italic">
                    Slot này sẽ hiển thị ở{" "}
                    <strong>vị trí số {formData.sortOrder || "0"}</strong> trên
                    hệ thống.
                    {formData.status === "active"
                      ? " Sẵn sàng để chi nhánh sử dụng."
                      : " Cần bật Hoạt động trước khi dùng."}
                  </div>
                </div>
              )}
            </Card>

            <Card className="bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
              <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200 mb-3 flex items-center gap-2">
                <ArrowRight className="w-4 h-4" /> Bước tiếp theo sau khi tạo
              </h3>
              <ul className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed space-y-2">
                <li>
                  1. Chuyển sang mục <strong>Khung giờ chi nhánh</strong> để bật
                  slot này cho các cửa hàng.
                </li>
                <li>
                  2. Chi nhánh có thể ghi đè (override) giới hạn đơn gốc nếu cần
                  thiết.
                </li>
                <li>
                  3. Hệ thống sẽ sinh <strong>Capacity vận hành</strong> hàng
                  ngày dựa trên cấu hình này.
                </li>
              </ul>
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
          </div>
          <div className="flex gap-3 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => navigate("/admin/shipping/delivery-slots")}
              className="flex-1 sm:flex-none px-6 py-2.5 rounded-lg font-medium bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-200 transition-colors"
            >
              Hủy bỏ
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="flex-1 sm:flex-none px-8 py-2.5 rounded-lg font-medium bg-blue-600 hover:bg-blue-700 text-white transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" /> Đang tạo...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" /> Tạo khung giờ hệ thống
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeliveryTimeSlotCreatePage;
