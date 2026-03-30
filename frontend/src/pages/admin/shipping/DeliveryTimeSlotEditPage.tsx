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

const formatTimePreview = (startTime: string, endTime: string) => {
  if (!startTime || !endTime) return "—";
  return `${startTime} - ${endTime}`;
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

  const generatedPreview = useMemo(() => {
    if (!formData) return "—";
    return formatTimePreview(formData.startTime, formData.endTime);
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

    if (!formData.code.trim()) {
      nextErrors.code = "Vui lòng nhập mã khung giờ.";
    }

    if (!formData.label.trim()) {
      nextErrors.label = "Vui lòng nhập tên khung giờ.";
    }

    if (!formData.startTime) {
      nextErrors.startTime = "Vui lòng chọn giờ bắt đầu.";
    }

    if (!formData.endTime) {
      nextErrors.endTime = "Vui lòng chọn giờ kết thúc.";
    }

    if (formData.startTime && formData.endTime) {
      const start = timeToMinutes(formData.startTime);
      const end = timeToMinutes(formData.endTime);

      if (!Number.isFinite(start)) {
        nextErrors.startTime = "Giờ bắt đầu không hợp lệ.";
      }

      if (!Number.isFinite(end)) {
        nextErrors.endTime = "Giờ kết thúc không hợp lệ.";
      }

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
      prev
        ? {
            ...prev,
            label: `${prev.startTime} - ${prev.endTime}`,
          }
        : prev,
    );
  };

  const handleAutoFillCode = () => {
    if (!formData) return;
    const source = formData.label.trim() || generatedPreview;
    if (!source || source === "—") return;

    setFormData((prev) =>
      prev
        ? {
            ...prev,
            code: normalizeCode(source),
          }
        : prev,
    );
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
        navigate("/admin/shipping/delivery-slots");
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
          Chỉnh sửa khung giờ giao hàng
        </h1>
        <button
          onClick={() => navigate("/admin/shipping/delivery-slots")}
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
                Mã khung giờ <span className="text-red-500">*</span>
              </label>
              <input
                ref={setFieldRef("code")}
                type="text"
                name="code"
                value={formData.code}
                onChange={handleChange}
                placeholder="VD: SLOT_08_10"
                className={`w-full border rounded-md p-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white ${
                  errors.code
                    ? "border-red-500 dark:border-red-500"
                    : "border-gray-300 dark:border-gray-600"
                }`}
              />
              {errors.code && (
                <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                  {errors.code}
                </p>
              )}
              <button
                type="button"
                onClick={handleAutoFillCode}
                className="mt-2 text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400"
              >
                Tự tạo code từ tên khung giờ
              </button>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Tên khung giờ <span className="text-red-500">*</span>
              </label>
              <input
                ref={setFieldRef("label")}
                type="text"
                name="label"
                value={formData.label}
                onChange={handleChange}
                placeholder="VD: 08:00 - 10:00"
                className={`w-full border rounded-md p-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white ${
                  errors.label
                    ? "border-red-500 dark:border-red-500"
                    : "border-gray-300 dark:border-gray-600"
                }`}
              />
              {errors.label && (
                <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                  {errors.label}
                </p>
              )}
              <button
                type="button"
                onClick={handleAutoFillLabel}
                className="mt-2 text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400"
              >
                Tự điền tên từ giờ bắt đầu / kết thúc
              </button>
            </div>
          </div>

          <div className="rounded-lg border border-dashed border-gray-300 dark:border-gray-600 p-4 bg-gray-50 dark:bg-gray-800/40">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Xem trước khung giờ:
            </p>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              {generatedPreview}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Giờ bắt đầu <span className="text-red-500">*</span>
              </label>
              <input
                ref={setFieldRef("startTime")}
                type="time"
                name="startTime"
                value={formData.startTime}
                onChange={handleChange}
                className={`w-full border rounded-md p-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white ${
                  errors.startTime
                    ? "border-red-500 dark:border-red-500"
                    : "border-gray-300 dark:border-gray-600"
                }`}
              />
              {errors.startTime && (
                <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                  {errors.startTime}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Giờ kết thúc <span className="text-red-500">*</span>
              </label>
              <input
                ref={setFieldRef("endTime")}
                type="time"
                name="endTime"
                value={formData.endTime}
                onChange={handleChange}
                className={`w-full border rounded-md p-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white ${
                  errors.endTime
                    ? "border-red-500 dark:border-red-500"
                    : "border-gray-300 dark:border-gray-600"
                }`}
              />
              {errors.endTime && (
                <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                  {errors.endTime}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
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
                placeholder="VD: 120"
                className={`w-full border rounded-md p-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white ${
                  errors.cutoffMinutes
                    ? "border-red-500 dark:border-red-500"
                    : "border-gray-300 dark:border-gray-600"
                }`}
              />
              {errors.cutoffMinutes && (
                <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                  {errors.cutoffMinutes}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Số đơn tối đa
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
                className={`w-full border rounded-md p-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white ${
                  errors.maxOrders
                    ? "border-red-500 dark:border-red-500"
                    : "border-gray-300 dark:border-gray-600"
                }`}
              />
              {errors.maxOrders && (
                <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                  {errors.maxOrders}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Sort order <span className="text-red-500">*</span>
              </label>
              <input
                ref={setFieldRef("sortOrder")}
                type="number"
                step="1"
                name="sortOrder"
                value={formData.sortOrder}
                onChange={handleChange}
                placeholder="VD: 1"
                className={`w-full border rounded-md p-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white ${
                  errors.sortOrder
                    ? "border-red-500 dark:border-red-500"
                    : "border-gray-300 dark:border-gray-600"
                }`}
              />
              {errors.sortOrder && (
                <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                  {errors.sortOrder}
                </p>
              )}
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
          </div>

          <div className="rounded-lg bg-blue-50 dark:bg-blue-900/20 p-4 text-sm text-blue-700 dark:text-blue-300">
            Thay đổi ở đây sẽ ảnh hưởng đến cấu hình master của toàn bộ khung
            giờ giao hàng.
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
                onClick={() => navigate("/admin/shipping/delivery-slots")}
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

export default DeliveryTimeSlotEditPage;
