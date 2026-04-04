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
  ListOrdered,
  Timer,
  ShieldAlert,
  CalendarClock,
  AlertTriangle,
  History,
  ArrowRight,
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

type ApiDetail<T> = { success: true; data: T; meta?: any };

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
      if (detailRes?.success && detailRes.data) {
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
    fetchDetail();
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
    if (!formData || !initialData) return [];
    const impacts = [];

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
        `CẢNH BÁO: Khung giờ đã chuyển buổi (từ ${initialTimeBucket?.label} sang ${timeBucket?.label}).`,
      );
    }

    if (formData.cutoffMinutes !== initialData.cutoffMinutes) {
      const isStricter =
        Number(formData.cutoffMinutes) > Number(initialData.cutoffMinutes);
      impacts.push(
        `Thời gian chốt nhận đơn (Cutoff) ${isStricter ? "tăng lên" : "giảm đi"}, hệ thống sẽ chốt đơn ${isStricter ? "sớm hơn" : "sát giờ hơn"}.`,
      );
    }

    if (formData.maxOrders !== initialData.maxOrders) {
      if (!formData.maxOrders)
        impacts.push(
          "Giới hạn gốc đã bị GỠ BỎ thành Không giới hạn. Các chi nhánh không ghi đè sẽ nhận đơn thoải mái.",
        );
      else if (!initialData.maxOrders)
        impacts.push(
          `Giới hạn gốc đã được ÁP DỤNG (${formData.maxOrders} đơn). Các chi nhánh không ghi đè sẽ bị giới hạn.`,
        );
      else
        impacts.push(
          `Giới hạn đơn gốc đã thay đổi từ ${initialData.maxOrders} thành ${formData.maxOrders}.`,
        );
    }

    if (formData.sortOrder !== initialData.sortOrder) {
      impacts.push(
        "Thứ tự hiển thị của slot này sẽ bị thay đổi tại các màn hình khách hàng.",
      );
    }

    if (formData.status !== initialData.status) {
      impacts.push(
        formData.status === "inactive"
          ? "CẢNH BÁO: Bạn đang Tạm Dừng slot này. Các chi nhánh sẽ không thể tiếp tục dùng nó để nhận đơn."
          : "Slot này sẽ sẵn sàng kích hoạt tại các chi nhánh.",
      );
    }

    return impacts;
  }, [formData, initialData, timeBucket, initialTimeBucket]);

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
      if (!Number.isInteger(cutoff) || cutoff < 0)
        nextErrors.cutoffMinutes = "Thời gian chốt phải là số nguyên >= 0.";
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

  if (loading || !formData || !initialData) {
    return (
      <div className="flex flex-col justify-center items-center py-32 max-w-7xl mx-auto">
        <Loader2 className="w-10 h-10 animate-spin text-blue-600 mb-4" />
        <span className="text-gray-800 dark:text-gray-200 font-bold text-lg">
          Đang tải Template Khung giờ...
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
            <Tag className="w-4 h-4" /> {initialData.label} ({initialData.code})
          </p>
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
            className={`border-2 transition-all ${errors.startTime || errors.endTime ? "border-red-200" : formData.startTime !== initialData.startTime || formData.endTime !== initialData.endTime ? "border-amber-200 dark:border-amber-800" : "border-gray-200 dark:border-gray-700"}`}
          >
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100 dark:border-gray-700">
              <div className="flex items-center gap-2">
                <CalendarClock className="w-5 h-5 text-gray-400" />
                <h2 className="text-lg font-bold text-gray-800 dark:text-white">
                  1. Thời gian hoạt động
                </h2>
              </div>
              {(formData.startTime !== initialData.startTime ||
                formData.endTime !== initialData.endTime) && (
                <span className="text-[10px] font-bold bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded ml-auto">
                  Đã chỉnh sửa
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
                    className={`w-full pl-9 pr-4 py-2.5 border rounded-lg text-gray-900 dark:text-white focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all ${errors.startTime ? "border-red-500" : formData.startTime !== initialData.startTime ? "border-amber-400 bg-amber-50 dark:bg-amber-900/10" : "border-gray-300 bg-gray-50 dark:bg-gray-800 dark:border-gray-600"}`}
                  />
                </div>
                {formData.startTime !== initialData.startTime && (
                  <div className="text-xs font-medium text-amber-600 mt-1">
                    Giờ gốc: {initialData.startTime}
                  </div>
                )}
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
                      className={`w-full pl-9 pr-4 py-2.5 border rounded-lg text-gray-900 dark:text-white focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all ${errors.endTime ? "border-red-500" : formData.endTime !== initialData.endTime ? "border-amber-400 bg-amber-50 dark:bg-amber-900/10" : "border-gray-300 bg-gray-50 dark:bg-gray-800 dark:border-gray-600"}`}
                    />
                    {formData.endTime !== initialData.endTime && (
                      <div className="text-xs font-medium text-amber-600 mt-1">
                        Giờ gốc: {initialData.endTime}
                      </div>
                    )}
                    {errors.endTime && (
                      <p className="text-xs text-red-600 mt-1">
                        {errors.endTime}
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={handleAutoFillLabel}
                    className="px-3 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors whitespace-nowrap h-[42px]"
                    title="Tạo tên dựa trên giờ"
                  >
                    Gợi ý tên
                  </button>
                </div>
              </div>
            </div>
          </Card>

          {/* Section 2: Định danh Template */}
          <Card
            className={
              formData.label !== initialData.label ||
              formData.code !== initialData.code
                ? "border-amber-200 dark:border-amber-800"
                : ""
            }
          >
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
                  className={`w-full border rounded-lg p-2.5 text-gray-900 dark:text-white focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all ${errors.label ? "border-red-500" : formData.label !== initialData.label ? "border-amber-400 bg-amber-50 dark:bg-amber-900/10" : "border-gray-300 bg-gray-50 dark:bg-gray-800 dark:border-gray-600"}`}
                />
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
                      className={`w-full border rounded-lg p-2.5 text-gray-900 dark:text-white focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all uppercase font-mono text-sm ${errors.code ? "border-red-500" : formData.code !== initialData.code ? "border-amber-400 bg-amber-50 dark:bg-amber-900/10" : "border-gray-300 bg-gray-50 dark:bg-gray-800 dark:border-gray-600"}`}
                    />
                    {formData.code !== initialData.code && (
                      <p className="text-[11px] text-amber-600 mt-1.5 flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5" /> Đổi mã slot có
                        thể rủi ro nếu có code nào cứng.
                      </p>
                    )}
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
            <Card
              className={
                formData.cutoffMinutes !== initialData.cutoffMinutes ||
                formData.maxOrders !== initialData.maxOrders
                  ? "border-amber-200 dark:border-amber-800"
                  : ""
              }
            >
              <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-100 dark:border-gray-700">
                <ShieldAlert className="w-5 h-5 text-gray-400" />
                <h2 className="text-lg font-bold text-gray-800 dark:text-white">
                  3. Logic & Sức chứa
                </h2>
              </div>
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                    Thời gian chốt đơn (Cutoff phút){" "}
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
                    className={`w-full border rounded-lg p-2.5 text-gray-900 dark:text-white focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none ${errors.cutoffMinutes ? "border-red-500" : formData.cutoffMinutes !== initialData.cutoffMinutes ? "border-amber-400 bg-amber-50 dark:bg-amber-900/10" : "border-gray-300 bg-gray-50 dark:bg-gray-800 dark:border-gray-600"}`}
                  />
                  {formData.cutoffMinutes !== initialData.cutoffMinutes && (
                    <div className="text-xs font-medium text-amber-600 mt-1">
                      Gốc: {initialData.cutoffMinutes} phút
                    </div>
                  )}
                  {errors.cutoffMinutes && (
                    <p className="text-xs text-red-600 mt-1">
                      {errors.cutoffMinutes}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                    Giới hạn đơn mặc định (Capacity)
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
                    className={`w-full border rounded-lg p-2.5 text-gray-900 dark:text-white focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none ${errors.maxOrders ? "border-red-500" : formData.maxOrders !== initialData.maxOrders ? "border-amber-400 bg-amber-50 dark:bg-amber-900/10" : "border-gray-300 bg-gray-50 dark:bg-gray-800 dark:border-gray-600"}`}
                  />
                  {formData.maxOrders !== initialData.maxOrders && (
                    <div className="text-xs font-medium text-amber-600 mt-1">
                      Gốc: {formatMaxOrdersPreview(initialData.maxOrders)}
                    </div>
                  )}
                  {errors.maxOrders && (
                    <p className="text-xs text-red-600 mt-1">
                      {errors.maxOrders}
                    </p>
                  )}
                </div>
              </div>
            </Card>

            {/* Hành vi hệ thống */}
            <Card
              className={
                formData.sortOrder !== initialData.sortOrder ||
                formData.status !== initialData.status
                  ? "border-amber-200 dark:border-amber-800"
                  : ""
              }
            >
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
                    className={`w-full border rounded-lg p-2.5 text-gray-900 dark:text-white focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none ${errors.sortOrder ? "border-red-500" : formData.sortOrder !== initialData.sortOrder ? "border-amber-400 bg-amber-50 dark:bg-amber-900/10" : "border-gray-300 bg-gray-50 dark:bg-gray-800 dark:border-gray-600"}`}
                  />
                  {formData.sortOrder !== initialData.sortOrder && (
                    <div className="text-xs font-medium text-amber-600 mt-1">
                      Gốc: {initialData.sortOrder}
                    </div>
                  )}
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
                    className={`w-full border rounded-lg p-2.5 text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none ${formData.status !== initialData.status ? "border-amber-400 bg-amber-50 text-amber-900" : "border-gray-300 bg-gray-50 dark:bg-gray-800 dark:border-gray-600 text-gray-900 dark:text-white"}`}
                  >
                    <option value="active">
                      Hoạt động (Sẵn sàng kích hoạt)
                    </option>
                    <option value="inactive">
                      Tạm dừng (Không cho phép dùng mới)
                    </option>
                  </select>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* CỘT PHẢI: CHANGE IMPACT & SUMMARY */}
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
                    Thay đổi hiện tại (Tên/Mã) không ảnh hưởng quá lớn tới vận
                    hành.
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

            {/* Live Summary */}
            <Card className="border-blue-100 dark:border-blue-900/50 bg-gradient-to-br from-blue-50 to-white dark:from-gray-800 dark:to-gray-800/80 shadow-sm overflow-hidden">
              <div className="bg-blue-600 text-white px-4 py-3 -mx-6 -mt-6 mb-5 flex items-center justify-between font-bold shadow-sm">
                <span className="flex items-center gap-2">
                  <Info className="w-5 h-5" /> Template Sau chỉnh sửa
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
                    {formData.status === "active" ? "Đang bật" : "Tạm dừng"}
                  </span>
                </div>

                <div
                  className={
                    formData.label !== initialData.label ||
                    formData.code !== initialData.code
                      ? "bg-amber-100 -mx-2 px-2 py-1 rounded"
                      : ""
                  }
                >
                  <div className="text-xl font-bold text-gray-900 dark:text-white leading-tight">
                    {formData.label || "Chưa nhập tên"}
                  </div>
                  <div className="text-[11px] font-mono text-gray-500 bg-white dark:bg-gray-700 px-1.5 py-0.5 rounded w-fit mt-1.5 border border-gray-200 dark:border-gray-600">
                    {formData.code || "CHUA_CO_MA"}
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-100 dark:border-gray-700 flex flex-col gap-2">
                  <div
                    className={`flex justify-between items-center ${formData.startTime !== initialData.startTime || formData.endTime !== initialData.endTime ? "text-amber-600 font-bold" : ""}`}
                  >
                    <span className="text-gray-500 font-medium">Timeline:</span>
                    <span>
                      {formData.startTime}{" "}
                      <ArrowRight className="w-3 h-3 inline text-gray-400 mx-0.5" />{" "}
                      {formData.endTime}
                    </span>
                  </div>
                  <div
                    className={`flex justify-between items-center ${duration !== initialDuration ? "text-amber-600 font-bold" : ""}`}
                  >
                    <span className="text-gray-500 font-medium">Kéo dài:</span>
                    <span
                      className={
                        duration !== initialDuration
                          ? ""
                          : "font-bold text-blue-600"
                      }
                    >
                      {duration}
                    </span>
                  </div>
                  <div
                    className={`flex justify-between items-center ${formData.cutoffMinutes !== initialData.cutoffMinutes ? "text-amber-600 font-bold" : ""}`}
                  >
                    <span className="text-gray-500 font-medium">Chốt đơn:</span>
                    <span
                      className={
                        formData.cutoffMinutes !== initialData.cutoffMinutes
                          ? ""
                          : formData.cutoffMinutes === "0"
                            ? "font-bold text-red-500"
                            : "font-bold text-gray-900 dark:text-white"
                      }
                    >
                      {formData.cutoffMinutes === "0"
                        ? "Sát giờ (0p)"
                        : `Trước ${formData.cutoffMinutes} phút`}
                    </span>
                  </div>
                  <div
                    className={`flex justify-between items-center ${formData.maxOrders !== initialData.maxOrders ? "text-amber-600 font-bold" : ""}`}
                  >
                    <span className="text-gray-500 font-medium">
                      Giới hạn gốc:
                    </span>
                    <span
                      className={
                        formData.maxOrders !== initialData.maxOrders
                          ? ""
                          : !formData.maxOrders
                            ? "font-bold text-purple-600"
                            : "font-bold text-gray-900 dark:text-white"
                      }
                    >
                      {formatMaxOrdersPreview(formData.maxOrders)}
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
              onClick={() => navigate("/admin/shipping/delivery-slots")}
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

export default DeliveryTimeSlotEditPage;
