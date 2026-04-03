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
  CheckCircle2,
  Settings2,
  Info,
  Tag,
  ListOrdered,
  Timer,
  ShieldAlert,
  CalendarClock,
} from "lucide-react";
import Card from "../../../components/admin/layouts/Card";
import { http } from "../../../services/http";
import { useAdminToast } from "../../../context/AdminToastContext";

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

const getDuration = (start?: string, end?: string) => {
  if (!start || !end) return "";
  try {
    const [sh, sm] = start.split(":").map(Number);
    const [eh, em] = end.split(":").map(Number);
    if (!Number.isFinite(sh) || !Number.isFinite(eh)) return "";

    let diffMin = eh * 60 + em - (sh * 60 + sm);
    if (diffMin < 0) diffMin += 24 * 60;

    const h = Math.floor(diffMin / 60);
    const m = diffMin % 60;

    if (h > 0 && m > 0) return `${h} giờ ${m} phút`;
    if (h > 0) return `${h} giờ`;
    return `${m} phút`;
  } catch (e) {
    return "";
  }
};

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
      console.error(err);
      showErrorToast(err?.message || "Lỗi tải dữ liệu khung giờ giao hàng.");
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

  const timeToMinutes = (value: string) => {
    if (!value) return Number.NaN;
    const [h, m] = value.split(":").map(Number);
    if (!Number.isFinite(h) || !Number.isFinite(m)) return Number.NaN;
    return h * 60 + m;
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

      if (!Number.isFinite(start))
        nextErrors.startTime = "Giờ bắt đầu không hợp lệ.";
      if (!Number.isFinite(end))
        nextErrors.endTime = "Giờ kết thúc không hợp lệ.";
      if (Number.isFinite(start) && Number.isFinite(end) && start >= end) {
        nextErrors.endTime = "Giờ kết thúc phải lớn hơn giờ bắt đầu.";
      }
    }

    if (formData.cutoffMinutes.trim() === "") {
      nextErrors.cutoffMinutes = "Vui lòng nhập cutoff minutes.";
    } else {
      const cutoff = Number(formData.cutoffMinutes);
      if (!Number.isInteger(cutoff) || cutoff < 0) {
        nextErrors.cutoffMinutes = "Cutoff minutes phải là số nguyên >= 0.";
      }
    }

    if (formData.sortOrder.trim() === "") {
      nextErrors.sortOrder = "Vui lòng nhập sort order.";
    } else {
      const sortOrder = Number(formData.sortOrder);
      if (!Number.isInteger(sortOrder)) {
        nextErrors.sortOrder = "Sort order phải là số nguyên.";
      }
    }

    if (formData.maxOrders.trim() !== "") {
      const maxOrders = Number(formData.maxOrders);
      if (!Number.isInteger(maxOrders) || maxOrders < 0) {
        nextErrors.maxOrders = "Số đơn tối đa phải là số nguyên >= 0.";
      }
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      scrollToFirstError(nextErrors);
      return false;
    }
    return true;
  };

  const handleAutoFillLabel = () => {
    if (!formData) return;
    if (!formData.startTime || !formData.endTime) return;
    setFormData((prev) =>
      prev ? { ...prev, label: `${prev.startTime} - ${prev.endTime}` } : prev,
    );
    if (errors.label) setErrors((prev) => ({ ...prev, label: "" }));
  };

  const handleAutoFillCode = () => {
    if (!formData) return;
    const source = formData.label.trim();
    if (!source) return;
    setFormData((prev) =>
      prev ? { ...prev, code: normalizeCode(source) } : prev,
    );
    if (errors.code) setErrors((prev) => ({ ...prev, code: "" }));
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
          message: "Cập nhật khung giờ giao hàng thành công!",
        });
        setInitialData({ ...formData });
        setErrors({});
      } else {
        showErrorToast(
          res?.message || "Cập nhật khung giờ giao hàng thất bại.",
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

  return (
    <div className="max-w-5xl mx-auto pb-24">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-white">
              Chỉnh sửa khung giờ giao hàng
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
            <Settings2 className="w-4 h-4" /> {formData.label} ({formData.code})
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate("/admin/shipping/delivery-slots")}
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
        <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
          <div className="col-span-2 md:col-span-1">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
              Khung giờ
            </p>
            <p
              className="text-sm font-semibold text-gray-900 dark:text-white truncate"
              title={formData.label}
            >
              {formData.label}
            </p>
            <p className="text-xs text-gray-500 mt-0.5">{formData.code}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
              Thời gian
            </p>
            <p className="text-sm font-semibold text-gray-900 dark:text-white">
              {formData.startTime || "—"} - {formData.endTime || "—"}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
              Cutoff
            </p>
            <p className="text-sm font-semibold text-red-600 dark:text-red-400">
              {formData.cutoffMinutes} phút
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
              Capacity
            </p>
            <p className="text-sm font-semibold text-purple-600 dark:text-purple-400">
              {formatMaxOrdersPreview(formData.maxOrders)}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
              Sort Order
            </p>
            <p className="text-sm font-semibold text-gray-900 dark:text-white">
              {formData.sortOrder}
            </p>
          </div>
        </div>
      </Card>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Section 1: Định danh */}
        <Card>
          <div className="border-b border-gray-100 dark:border-gray-700 pb-4 mb-4">
            <h2 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
              <Tag className="w-5 h-5 text-gray-400" /> Định danh khung giờ
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Tên khung giờ <span className="text-red-500">*</span>
              </label>
              <input
                ref={setFieldRef("label")}
                type="text"
                name="label"
                value={formData.label}
                onChange={handleChange}
                placeholder="VD: Sáng (08:00 - 12:00)"
                className={`w-full border rounded-lg p-2.5 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none ${
                  errors.label
                    ? "border-red-500"
                    : "border-gray-300 dark:border-gray-600"
                }`}
              />
              {errors.label && (
                <p className="text-sm text-red-600 mt-1.5 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" /> {errors.label}
                </p>
              )}
            </div>

            <div className="md:col-span-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Mã khung giờ <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-2 items-start">
                <div className="flex-1">
                  <input
                    ref={setFieldRef("code")}
                    type="text"
                    name="code"
                    value={formData.code}
                    onChange={handleChange}
                    placeholder="VD: SLOT_08_12"
                    className={`w-full border rounded-lg p-2.5 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none uppercase ${
                      errors.code
                        ? "border-red-500"
                        : "border-gray-300 dark:border-gray-600"
                    }`}
                  />
                  {errors.code && (
                    <p className="text-sm text-red-600 mt-1.5 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" /> {errors.code}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={handleAutoFillCode}
                  className="px-3 py-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium transition-colors whitespace-nowrap border border-transparent dark:border-gray-600"
                  title="Tạo mã từ tên khung giờ"
                >
                  Tạo tự động
                </button>
              </div>
            </div>

            <div className="md:col-span-1">
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
            </div>
          </div>
        </Card>

        {/* Section 2: Thời gian giao hàng */}
        <Card>
          <div className="border-b border-gray-100 dark:border-gray-700 pb-4 mb-4">
            <h2 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
              <CalendarClock className="w-5 h-5 text-gray-400" /> Thời gian giao
              hàng
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Giờ bắt đầu <span className="text-red-500">*</span>
              </label>
              <input
                ref={setFieldRef("startTime")}
                type="time"
                name="startTime"
                value={formData.startTime}
                onChange={handleChange}
                className={`w-full border rounded-lg p-2.5 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none ${
                  errors.startTime
                    ? "border-red-500"
                    : "border-gray-300 dark:border-gray-600"
                }`}
              />
              {errors.startTime && (
                <p className="text-sm text-red-600 mt-1.5 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" /> {errors.startTime}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Giờ kết thúc <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-2 items-start">
                <div className="flex-1">
                  <input
                    ref={setFieldRef("endTime")}
                    type="time"
                    name="endTime"
                    value={formData.endTime}
                    onChange={handleChange}
                    className={`w-full border rounded-lg p-2.5 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none ${
                      errors.endTime
                        ? "border-red-500"
                        : "border-gray-300 dark:border-gray-600"
                    }`}
                  />
                  {errors.endTime && (
                    <p className="text-sm text-red-600 mt-1.5 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" /> {errors.endTime}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={handleAutoFillLabel}
                  className="px-3 py-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium transition-colors border border-transparent dark:border-gray-600"
                  title="Tạo tên từ giờ bắt đầu/kết thúc"
                >
                  Fill tên
                </button>
              </div>
            </div>
          </div>

          <div className="bg-blue-50/50 dark:bg-blue-900/10 rounded-xl p-4 border border-blue-100 dark:border-blue-800/50 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-full">
                <Clock3 className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Preview Thời gian
                </p>
                <p className="text-lg font-bold text-gray-900 dark:text-white">
                  {formData.startTime || "—"} đến {formData.endTime || "—"}
                </p>
              </div>
            </div>
            {formData.startTime && formData.endTime && (
              <div className="px-3 py-1.5 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-700 dark:text-gray-300 shadow-sm flex items-center gap-1.5">
                <Timer className="w-4 h-4 text-blue-500" />
                Thời lượng: {getDuration(formData.startTime, formData.endTime)}
              </div>
            )}
          </div>
        </Card>

        {/* Section 3: Điều kiện vận hành */}
        <Card>
          <div className="border-b border-gray-100 dark:border-gray-700 pb-4 mb-4">
            <h2 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-gray-400" /> Điều kiện vận
              hành
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Cutoff minutes (Phút) <span className="text-red-500">*</span>
              </label>
              <input
                ref={setFieldRef("cutoffMinutes")}
                type="number"
                min="0"
                step="1"
                name="cutoffMinutes"
                value={formData.cutoffMinutes}
                onChange={handleChange}
                placeholder="VD: 120"
                className={`w-full border rounded-lg p-2.5 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none ${
                  errors.cutoffMinutes
                    ? "border-red-500"
                    : "border-gray-300 dark:border-gray-600"
                }`}
              />
              <p className="text-[13px] text-gray-500 dark:text-gray-400 mt-1.5">
                Thời gian chốt nhận đơn trước khi slot bắt đầu.
              </p>
              {errors.cutoffMinutes && (
                <p className="text-sm text-red-600 mt-1.5 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" /> {errors.cutoffMinutes}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Số đơn tối đa (Capacity)
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
                Để trống nếu không giới hạn số đơn mặc định.
              </p>
              {errors.maxOrders && (
                <p className="text-sm text-red-600 mt-1.5 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" /> {errors.maxOrders}
                </p>
              )}
            </div>
          </div>
        </Card>

        {/* Section 4: Hiển thị hệ thống */}
        <Card>
          <div className="border-b border-gray-100 dark:border-gray-700 pb-4 mb-4">
            <h2 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
              <ListOrdered className="w-5 h-5 text-gray-400" /> Hiển thị hệ
              thống
            </h2>
          </div>

          <div className="max-w-md">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Thứ tự sắp xếp (Sort order){" "}
              <span className="text-red-500">*</span>
            </label>
            <input
              ref={setFieldRef("sortOrder")}
              type="number"
              step="1"
              name="sortOrder"
              value={formData.sortOrder}
              onChange={handleChange}
              placeholder="VD: 1"
              className={`w-full border rounded-lg p-2.5 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none ${
                errors.sortOrder
                  ? "border-red-500"
                  : "border-gray-300 dark:border-gray-600"
              }`}
            />
            <p className="text-[13px] text-gray-500 dark:text-gray-400 mt-1.5">
              Số nhỏ hơn sẽ được ưu tiên hiển thị trước khi khách hàng chọn
              khung giờ.
            </p>
            {errors.sortOrder && (
              <p className="text-sm text-red-600 mt-1.5 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" /> {errors.sortOrder}
              </p>
            )}

            <div className="mt-3 inline-flex px-3 py-1.5 bg-gray-50 dark:bg-gray-800 rounded text-sm text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 shadow-sm">
              Slot này sẽ xuất hiện{" "}
              <strong>
                {formData.sortOrder === "0"
                  ? " đầu tiên"
                  : ` ở vị trí ${formData.sortOrder}`}
              </strong>
              .
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
                onClick={() => navigate("/admin/shipping/delivery-slots")}
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

export default DeliveryTimeSlotEditPage;
