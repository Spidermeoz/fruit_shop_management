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
  Clock3,
  AlertCircle,
  Info,
  Tag,
  Timer,
  ShieldAlert,
  CalendarClock,
  AlertTriangle,
  History,
  ArrowRight,
  Power,
} from "lucide-react";
import Card from "../../../components/admin/layouts/Card";
import { http } from "../../../services/http";
import { useAdminToast } from "../../../context/AdminToastContext";

// =============================
// TYPES
// =============================
interface DeliveryTimeSlotFormData {
  id?: number;
  code: string;
  label: string;
  startTime: string;
  endTime: string;
  cutoffMinutes: string;
  maxOrders: string;
  sortOrder: string;
  status: "active" | "inactive";
  createdAt?: string;
  updatedAt?: string;
}

type ApiDetail<T> = {
  success?: boolean;
  data: T;
  meta?: any;
  message?: string;
};

// =============================
// HELPERS
// =============================
const toFormData = (data: any): DeliveryTimeSlotFormData => ({
  id: data.id,
  code: data.code ?? "",
  label: data.label ?? "",
  startTime: data.startTime ? String(data.startTime).slice(0, 5) : "",
  endTime: data.endTime ? String(data.endTime).slice(0, 5) : "",
  cutoffMinutes:
    data.cutoffMinutes !== null && data.cutoffMinutes !== undefined
      ? String(data.cutoffMinutes)
      : "0",
  maxOrders:
    data.maxOrders !== null && data.maxOrders !== undefined
      ? String(data.maxOrders)
      : "",
  sortOrder:
    data.sortOrder !== null && data.sortOrder !== undefined
      ? String(data.sortOrder)
      : "0",
  status: data.status ?? "active",
  createdAt: data.createdAt,
  updatedAt: data.updatedAt,
});

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
    if (diffMin < 0) diffMin += 24 * 60;

    const h = Math.floor(diffMin / 60);
    const m = diffMin % 60;

    if (h > 0 && m > 0) return `${h} giờ ${m} phút`;
    if (h > 0) return `${h} giờ`;
    return `${m} phút`;
  } catch {
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
const DeliveryTimeSlotEditPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showSuccessToast, showErrorToast } = useAdminToast();

  const [formData, setFormData] = useState<DeliveryTimeSlotFormData | null>(
    null,
  );
  const [initialData, setInitialData] =
    useState<DeliveryTimeSlotFormData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [togglingStatus, setTogglingStatus] = useState(false);
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

  // --- Fetch Data ---
  const fetchDetail = async () => {
    try {
      setLoading(true);
      const detailRes = await http<ApiDetail<any>>(
        "GET",
        `/api/v1/admin/delivery-time-slots/edit/${id}`,
      );
      if (detailRes?.data) {
        const mapped = toFormData(detailRes.data);
        setFormData(mapped);
        setInitialData(mapped);
      } else {
        showErrorToast("Không thể tải dữ liệu khung giờ giao hàng.");
      }
    } catch (err: any) {
      showErrorToast(err?.message || "Lỗi tải dữ liệu khung giờ giao hàng.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchDetail();
  }, [id]);

  // --- Derived Models & Impact ---
  const isDirty = useMemo(() => {
    if (!formData || !initialData) return false;
    return JSON.stringify(formData) !== JSON.stringify(initialData);
  }, [formData, initialData]);

  const duration = useMemo(
    () => (formData ? getDuration(formData.startTime, formData.endTime) : ""),
    [formData?.startTime, formData?.endTime],
  );

  const initialDuration = useMemo(
    () =>
      initialData
        ? getDuration(initialData.startTime, initialData.endTime)
        : "",
    [initialData?.startTime, initialData?.endTime],
  );

  const timeBucket = useMemo(
    () => (formData ? getTimeBucket(formData.startTime) : null),
    [formData?.startTime],
  );

  const initialTimeBucket = useMemo(
    () => (initialData ? getTimeBucket(initialData.startTime) : null),
    [initialData?.startTime],
  );

  const changeImpacts = useMemo(() => {
    if (!formData || !initialData) return [] as string[];
    const impacts: string[] = [];

    if (
      formData.startTime !== initialData.startTime ||
      formData.endTime !== initialData.endTime
    ) {
      impacts.push(
        `Thời gian slot thay đổi. Chi nhánh đang dùng khung giờ này sẽ được áp dụng giờ mới (${formData.startTime} - ${formData.endTime}).`,
      );
    }

    if (timeBucket?.label !== initialTimeBucket?.label) {
      impacts.push(
        `CẢNH BÁO: Khung giờ đã chuyển buổi (từ ${initialTimeBucket?.label ?? "không xác định"} sang ${timeBucket?.label ?? "không xác định"}).`,
      );
    }

    if (duration && initialDuration && duration !== initialDuration) {
      impacts.push(
        `Thời lượng slot thay đổi từ ${initialDuration} thành ${duration}.`,
      );
    }

    if (formData.cutoffMinutes !== initialData.cutoffMinutes) {
      const isStricter =
        Number(formData.cutoffMinutes) > Number(initialData.cutoffMinutes);
      impacts.push(
        `Thời gian chốt nhận đơn (Cutoff) ${
          isStricter ? "tăng lên" : "giảm đi"
        }, hệ thống sẽ chốt đơn ${isStricter ? "sớm hơn" : "sát giờ hơn"}.`,
      );
    }

    if (formData.maxOrders !== initialData.maxOrders) {
      if (!formData.maxOrders) {
        impacts.push(
          "Giới hạn gốc đã bị gỡ bỏ thành Không giới hạn. Các chi nhánh không ghi đè sẽ nhận đơn thoải mái.",
        );
      } else if (!initialData.maxOrders) {
        impacts.push(
          `Giới hạn gốc đã được áp dụng (${formData.maxOrders} đơn). Các chi nhánh không ghi đè sẽ bị giới hạn.`,
        );
      } else {
        impacts.push(
          `Giới hạn đơn gốc đã thay đổi từ ${initialData.maxOrders} thành ${formData.maxOrders}.`,
        );
      }
    }

    if (formData.sortOrder !== initialData.sortOrder) {
      impacts.push(
        "Thứ tự hiển thị của slot này sẽ bị thay đổi tại các màn hình khách hàng.",
      );
    }

    if (formData.status !== initialData.status) {
      impacts.push(
        formData.status === "inactive"
          ? "CẢNH BÁO: Bạn đang tạm dừng slot này. Các chi nhánh sẽ không thể tiếp tục dùng nó để nhận đơn."
          : "Slot này sẽ sẵn sàng kích hoạt tại các chi nhánh.",
      );
    }

    return impacts;
  }, [
    formData,
    initialData,
    timeBucket,
    initialTimeBucket,
    duration,
    initialDuration,
  ]);

  // --- Actions ---
  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    if (!formData) return;
    const { name, value } = e.target;
    const nextValue = name === "code" ? normalizeCode(value) : value;
    setFormData((prev) => (prev ? { ...prev, [name]: nextValue } : prev));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleAutoFillLabel = () => {
    if (!formData || !formData.startTime || !formData.endTime) return;
    const bucket = getTimeBucket(formData.startTime);
    const bucketStr = bucket ? bucket.label.replace("Buổi ", "") : "Khung giờ";
    const newLabel = `${bucketStr} (${formData.startTime} - ${formData.endTime})`;
    setFormData((prev) => (prev ? { ...prev, label: newLabel } : prev));
    if (errors.label) setErrors((prev) => ({ ...prev, label: "" }));
  };

  const handleAutoFillCode = () => {
    if (!formData) return;
    const source =
      formData.label.trim() ||
      (formData.startTime && formData.endTime
        ? `SLOT_${formData.startTime.replace(":", "")}_${formData.endTime.replace(":", "")}`
        : "");
    if (!source) return;
    setFormData((prev) =>
      prev ? { ...prev, code: normalizeCode(source) } : prev,
    );
    if (errors.code) setErrors((prev) => ({ ...prev, code: "" }));
  };

  const validateForm = () => {
    if (!formData) return false;
    const nextErrors: Record<string, string> = {};

    if (!formData.code.trim()) nextErrors.code = "Vui lòng nhập mã khung giờ.";
    if (!formData.label.trim())
      nextErrors.label = "Vui lòng nhập tên khung giờ.";
    if (!formData.startTime)
      nextErrors.startTime = "Vui lòng chọn giờ bắt đầu.";
    if (!formData.endTime) nextErrors.endTime = "Vui lòng chọn giờ kết thúc.";

    if (formData.startTime && formData.endTime) {
      const start = timeToMinutes(formData.startTime);
      const end = timeToMinutes(formData.endTime);

      if (isNaN(start)) nextErrors.startTime = "Giờ bắt đầu không hợp lệ.";
      if (isNaN(end)) nextErrors.endTime = "Giờ kết thúc không hợp lệ.";
      if (!isNaN(start) && !isNaN(end) && start >= end) {
        nextErrors.endTime = "Giờ kết thúc phải lớn hơn giờ bắt đầu.";
      }
    }

    if (formData.cutoffMinutes.trim() === "") {
      nextErrors.cutoffMinutes = "Vui lòng nhập thời gian chốt nhận đơn.";
    } else {
      const cutoff = Number(formData.cutoffMinutes);
      if (!Number.isInteger(cutoff) || cutoff < 0) {
        nextErrors.cutoffMinutes = "Thời gian chốt phải là số nguyên >= 0.";
      }
    }

    if (formData.sortOrder.trim() === "") {
      nextErrors.sortOrder = "Vui lòng nhập thứ tự hiển thị.";
    } else {
      const sortOrder = Number(formData.sortOrder);
      if (!Number.isInteger(sortOrder)) {
        nextErrors.sortOrder = "Thứ tự hiển thị phải là số nguyên.";
      }
    }

    if (formData.maxOrders.trim() !== "") {
      const maxOrders = Number(formData.maxOrders);
      if (!Number.isInteger(maxOrders) || maxOrders < 0) {
        nextErrors.maxOrders = "Số đơn tối đa phải là số nguyên >= 0.";
      }
    }

    if (
      formData.cutoffMinutes.trim() !== "" &&
      formData.startTime &&
      !isNaN(timeToMinutes(formData.startTime))
    ) {
      const cutoff = Number(formData.cutoffMinutes);
      const start = timeToMinutes(formData.startTime);
      if (Number.isInteger(cutoff) && cutoff > start) {
        nextErrors.cutoffMinutes =
          "Thời gian chốt nhận đơn không hợp lý so với giờ bắt đầu.";
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
        "PATCH",
        `/api/v1/admin/delivery-time-slots/edit/${formData.id}`,
        payload,
      );

      if (res?.success) {
        showSuccessToast({
          message: "Cập nhật khung giờ hệ thống thành công!",
        });
        setInitialData({ ...formData });
        setErrors({});
      } else {
        showErrorToast(res?.message || "Cập nhật khung giờ hệ thống thất bại.");
      }
    } catch (err: any) {
      showErrorToast(err?.message || "Lỗi kết nối server.");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async () => {
    if (!formData?.id) return;
    const nextStatus = formData.status === "active" ? "inactive" : "active";
    try {
      setTogglingStatus(true);
      await http(
        "PATCH",
        `/api/v1/admin/delivery-time-slots/${formData.id}/status`,
        {
          status: nextStatus,
        },
      );
      setFormData((prev) => (prev ? { ...prev, status: nextStatus } : prev));
      setInitialData((prev) => (prev ? { ...prev, status: nextStatus } : prev));
      showSuccessToast({
        message:
          nextStatus === "active"
            ? "Đã bật khung giờ hệ thống."
            : "Đã tạm dừng khung giờ hệ thống.",
      });
    } catch (err: any) {
      showErrorToast(err?.message || "Không thể đổi trạng thái.");
    } finally {
      setTogglingStatus(false);
    }
  };

  if (loading || !formData || !initialData) {
    return (
      <div className="flex flex-col justify-center items-center py-32 max-w-7xl mx-auto">
        <Loader2 className="w-10 h-10 animate-spin text-blue-600 mb-4" />
        <span className="text-gray-800 dark:text-gray-200 font-bold text-lg">
          Đang tải template khung giờ...
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
            onClick={() => navigate("/admin/shipping/delivery-slots")}
            className="flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-blue-600 transition-colors mb-2"
          >
            <ArrowLeft className="w-4 h-4" /> Quay lại danh sách
          </button>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              Chỉnh sửa khung giờ hệ thống
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
            Chỉnh sửa template slot dùng làm nền cho branch slots, cutoff nhận
            đơn và giới hạn năng lực mặc định.
          </p>
        </div>

        <div className="hidden lg:flex items-center gap-2 bg-blue-50 dark:bg-blue-900/30 border border-blue-100 dark:border-blue-800 text-blue-700 dark:text-blue-300 px-4 py-2.5 rounded-lg text-sm">
          <History className="w-4 h-4" />
          {formData.updatedAt
            ? `Cập nhật gần nhất: ${new Date(formData.updatedAt).toLocaleString("vi-VN")}`
            : "Đang chỉnh sửa template hiện có"}
        </div>
      </div>

      <form
        onSubmit={handleSave}
        className="grid grid-cols-1 xl:grid-cols-3 gap-6 lg:gap-8"
      >
        {/* CỘT TRÁI: FORM BUILDER */}
        <div className="xl:col-span-2 space-y-6">
          {/* Section 1: Thời gian hoạt động */}
          <Card
            className={`border-2 transition-all ${
              errors.startTime || errors.endTime
                ? "border-red-200"
                : "border-gray-200 dark:border-gray-700"
            }`}
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
                    className={`w-full pl-9 pr-4 py-2.5 border rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all ${
                      errors.startTime
                        ? "border-red-500"
                        : "border-gray-300 dark:border-gray-600"
                    }`}
                  />
                </div>
                {errors.startTime && (
                  <p className="text-xs text-red-600 mt-1.5">
                    {errors.startTime}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  Giờ kết thúc <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Clock3 className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <input
                    ref={setFieldRef("endTime")}
                    type="time"
                    name="endTime"
                    value={formData.endTime}
                    onChange={handleChange}
                    className={`w-full pl-9 pr-4 py-2.5 border rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all ${
                      errors.endTime
                        ? "border-red-500"
                        : "border-gray-300 dark:border-gray-600"
                    }`}
                  />
                </div>
                {errors.endTime && (
                  <p className="text-xs text-red-600 mt-1.5">
                    {errors.endTime}
                  </p>
                )}
              </div>
            </div>

            {timeBucket && (
              <div className="mt-5 flex flex-wrap items-center gap-3">
                <span
                  className={`px-2.5 py-1 rounded-full text-xs font-bold border ${timeBucket.color}`}
                >
                  {timeBucket.label}
                </span>
                {duration && (
                  <span className="text-sm text-gray-600 dark:text-gray-300">
                    Thời lượng dự kiến: <strong>{duration}</strong>
                  </span>
                )}
              </div>
            )}
          </Card>

          {/* Section 2: Định danh khung giờ */}
          <Card>
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-100 dark:border-gray-700">
              <Tag className="w-5 h-5 text-gray-400" />
              <h2 className="text-lg font-bold text-gray-800 dark:text-white">
                2. Định danh khung giờ
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  Tên hiển thị <span className="text-red-500">*</span>
                </label>
                <input
                  ref={setFieldRef("label")}
                  type="text"
                  name="label"
                  value={formData.label}
                  onChange={handleChange}
                  placeholder="VD: Sáng (08:00 - 10:00)"
                  className={`w-full border rounded-lg p-2.5 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all ${
                    errors.label
                      ? "border-red-500"
                      : "border-gray-300 dark:border-gray-600"
                  }`}
                />
                {errors.label && (
                  <p className="text-xs text-red-600 mt-1.5">{errors.label}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  Mã khung giờ <span className="text-red-500">*</span>
                </label>
                <input
                  ref={setFieldRef("code")}
                  type="text"
                  name="code"
                  value={formData.code}
                  onChange={handleChange}
                  placeholder="VD: SLOT_MORNING_0800_1000"
                  className={`w-full border rounded-lg p-2.5 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all font-mono ${
                    errors.code
                      ? "border-red-500"
                      : "border-gray-300 dark:border-gray-600"
                  }`}
                />
                {errors.code && (
                  <p className="text-xs text-red-600 mt-1.5">{errors.code}</p>
                )}
              </div>
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleAutoFillLabel}
                className="px-3 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
              >
                Tự điền tên từ giờ
              </button>
              <button
                type="button"
                onClick={handleAutoFillCode}
                className="px-3 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
              >
                Tự điền mã từ tên / giờ
              </button>
            </div>
          </Card>

          {/* Section 3: Logic vận hành */}
          <Card>
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-100 dark:border-gray-700">
              <Timer className="w-5 h-5 text-gray-400" />
              <h2 className="text-lg font-bold text-gray-800 dark:text-white">
                3. Logic vận hành
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  Cutoff minutes <span className="text-red-500">*</span>
                </label>
                <input
                  ref={setFieldRef("cutoffMinutes")}
                  type="number"
                  min="0"
                  step="1"
                  name="cutoffMinutes"
                  value={formData.cutoffMinutes}
                  onChange={handleChange}
                  className={`w-full border rounded-lg p-2.5 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all ${
                    errors.cutoffMinutes
                      ? "border-red-500"
                      : "border-gray-300 dark:border-gray-600"
                  }`}
                />
                <p className="text-[11px] text-gray-500 mt-1.5">
                  Số phút chốt đơn trước khi slot bắt đầu. 0 = sát giờ.
                </p>
                {errors.cutoffMinutes && (
                  <p className="text-xs text-red-600 mt-1.5">
                    {errors.cutoffMinutes}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  Giới hạn đơn mặc định
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
                  className={`w-full border rounded-lg p-2.5 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all ${
                    errors.maxOrders
                      ? "border-red-500"
                      : "border-gray-300 dark:border-gray-600"
                  }`}
                />
                <div className="text-xs font-medium text-blue-600 mt-1.5 bg-blue-50 p-1.5 rounded w-fit">
                  Preview: {formatMaxOrdersPreview(formData.maxOrders)}
                </div>
                {errors.maxOrders && (
                  <p className="text-xs text-red-600 mt-1.5">
                    {errors.maxOrders}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  Sort order <span className="text-red-500">*</span>
                </label>
                <input
                  ref={setFieldRef("sortOrder")}
                  type="number"
                  step="1"
                  name="sortOrder"
                  value={formData.sortOrder}
                  onChange={handleChange}
                  className={`w-full border rounded-lg p-2.5 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all ${
                    errors.sortOrder
                      ? "border-red-500"
                      : "border-gray-300 dark:border-gray-600"
                  }`}
                />
                {errors.sortOrder && (
                  <p className="text-xs text-red-600 mt-1.5">
                    {errors.sortOrder}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  Trạng thái
                </label>
                <select
                  ref={setFieldRef("status")}
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg p-2.5 bg-white dark:bg-gray-800 text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="active">Hoạt động</option>
                  <option value="inactive">Tạm dừng</option>
                </select>
              </div>
            </div>
          </Card>

          {/* Section 4: Change impacts */}
          <Card className={changeImpacts.length ? "border-amber-200" : ""}>
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-100 dark:border-gray-700">
              <ShieldAlert
                className={`w-5 h-5 ${
                  changeImpacts.length ? "text-amber-500" : "text-gray-400"
                }`}
              />
              <h2 className="text-lg font-bold text-gray-800 dark:text-white">
                4. Ảnh hưởng thay đổi
              </h2>
            </div>

            {changeImpacts.length === 0 ? (
              <div className="text-sm text-gray-500">
                Chưa có thay đổi nào so với dữ liệu ban đầu.
              </div>
            ) : (
              <div className="space-y-3">
                {changeImpacts.map((impact, index) => (
                  <div
                    key={index}
                    className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800"
                  >
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                      <span>{impact}</span>
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
                <Info className="w-5 h-5" /> Live Preview
              </div>

              <div className="space-y-4 text-sm">
                <div>
                  <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                    Tên hiển thị
                  </div>
                  <div className="font-bold text-gray-900 dark:text-white">
                    {formData.label || "Chưa có tên"}
                  </div>
                  <div className="text-xs font-mono text-gray-500 mt-1">
                    {formData.code || "CHUA_CO_CODE"}
                  </div>
                </div>

                <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                  <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                    Khung giờ
                  </div>
                  <div className="font-bold text-gray-900 dark:text-white">
                    {formData.startTime && formData.endTime
                      ? `${formData.startTime} - ${formData.endTime}`
                      : "Chưa thiết lập"}
                  </div>
                  {timeBucket && (
                    <span
                      className={`inline-flex mt-2 px-2 py-1 rounded text-[11px] font-bold border ${timeBucket.color}`}
                    >
                      {timeBucket.label}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                  <div>
                    <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                      Cutoff
                    </div>
                    <div className="font-bold text-gray-900 dark:text-white">
                      {formData.cutoffMinutes === ""
                        ? "—"
                        : `${formData.cutoffMinutes} phút`}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                      Giới hạn
                    </div>
                    <div className="font-bold text-gray-900 dark:text-white">
                      {formatMaxOrdersPreview(formData.maxOrders)}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                  <div>
                    <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                      Sort order
                    </div>
                    <div className="font-bold text-gray-900 dark:text-white">
                      {formData.sortOrder || "0"}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                      Trạng thái
                    </div>
                    <div className="font-bold text-gray-900 dark:text-white">
                      {formData.status === "active" ? "Hoạt động" : "Tạm dừng"}
                    </div>
                  </div>
                </div>

                {formData.createdAt && (
                  <div className="pt-3 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-500">
                    Tạo lúc:{" "}
                    {new Date(formData.createdAt).toLocaleString("vi-VN")}
                  </div>
                )}
              </div>
            </Card>

            <Card className="bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
              <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200 mb-3 flex items-center gap-2">
                <ArrowRight className="w-4 h-4" /> Bước tiếp theo
              </h3>
              <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                Sau khi lưu template thành công, bạn có thể chuyển sang mục{" "}
                <strong>Khung giờ chi nhánh</strong> để kiểm tra rollout, hoặc
                mở planner capacity để rà sức chứa theo ngày.
              </p>
            </Card>

            {isStatusChanged && (
              <Card className="bg-amber-50 border border-amber-200">
                <h3 className="text-sm font-bold text-amber-800 mb-3 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" /> Trạng thái đã đổi
                </h3>
                <p className="text-xs text-amber-700 leading-relaxed">
                  Bạn đang thay đổi trạng thái của template này. Hãy lưu để cập
                  nhật hệ thống, hoặc dùng nút bật / tắt nhanh ở thanh hành
                  động.
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
              onClick={() => navigate("/admin/shipping/delivery-slots")}
              className="flex-1 sm:flex-none px-6 py-2.5 rounded-lg font-medium bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-200 transition-colors"
            >
              Quay lại
            </button>

            <button
              onClick={handleSave}
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

export default DeliveryTimeSlotEditPage;
