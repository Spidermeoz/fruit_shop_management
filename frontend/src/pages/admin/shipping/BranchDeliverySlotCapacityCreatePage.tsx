import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import { useNavigate } from "react-router-dom";
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
  branchId: string;
  deliveryDate: string;
  deliveryTimeSlotId: string;
  maxOrders: string;
  status: "active" | "inactive";
}

const initialForm: BranchDeliverySlotCapacityFormData = {
  branchId: "",
  deliveryDate: "",
  deliveryTimeSlotId: "",
  maxOrders: "",
  status: "active",
};

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

const BranchDeliverySlotCapacityCreatePage: React.FC = () => {
  const navigate = useNavigate();
  const { showSuccessToast, showErrorToast } = useAdminToast();

  const [formData, setFormData] =
    useState<BranchDeliverySlotCapacityFormData>(initialForm);
  const [branches, setBranches] = useState<BranchOption[]>([]);
  const [slots, setSlots] = useState<DeliveryTimeSlotOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [bootstrapLoading, setBootstrapLoading] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const fieldRefs = useRef<
    Record<string, HTMLInputElement | HTMLSelectElement | null>
  >({});

  const selectedBranch = useMemo(
    () => branches.find((x) => String(x.id) === formData.branchId) || null,
    [branches, formData.branchId],
  );

  const selectedSlot = useMemo(
    () =>
      slots.find((x) => String(x.id) === formData.deliveryTimeSlotId) || null,
    [slots, formData.deliveryTimeSlotId],
  );

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

  const fetchBootstrap = async () => {
    try {
      setBootstrapLoading(true);

      const [branchesRes, slotsRes] = await Promise.all([
        http<any>("GET", "/api/v1/admin/branches?limit=1000&status=active"),
        http<any>(
          "GET",
          "/api/v1/admin/delivery-time-slots?page=1&limit=1000&status=active",
        ),
      ]);

      const branchesData = Array.isArray(branchesRes?.data)
        ? branchesRes.data
        : Array.isArray(branchesRes?.data?.items)
          ? branchesRes.data.items
          : [];

      const slotsData = Array.isArray(slotsRes?.data)
        ? slotsRes.data
        : Array.isArray(slotsRes?.data?.items)
          ? slotsRes.data.items
          : [];

      setBranches(branchesData);
      setSlots(slotsData);
    } catch (err: any) {
      console.error(err);
      showErrorToast(err?.message || "Không thể tải dữ liệu chi nhánh / slot.");
    } finally {
      setBootstrapLoading(false);
    }
  };

  useEffect(() => {
    fetchBootstrap();
  }, []);

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validateForm = () => {
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
        showSuccessToast({ message: "Tạo capacity thành công!" });
        navigate("/admin/shipping/branch-delivery-slot-capacities");
      } else {
        showErrorToast(res?.message || "Tạo capacity thất bại.");
      }
    } catch (err: any) {
      console.error(err);
      showErrorToast(err?.message || "Lỗi kết nối server.");
    } finally {
      setLoading(false);
    }
  };

  const timeRange = selectedSlot
    ? formatTimeRange(selectedSlot.startTime, selectedSlot.endTime)
    : "—";

  return (
    <div className="max-w-5xl mx-auto pb-24">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-white">
            Thêm capacity giao hàng
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1.5 font-medium">
            Tạo capacity theo ngày để giới hạn số đơn giao cho từng chi nhánh và
            khung giờ.
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

      <form onSubmit={handleSubmit} className="space-y-6">
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
                disabled={bootstrapLoading}
                className={`w-full border rounded-lg p-2.5 bg-white dark:bg-gray-800 text-gray-900 dark:text-white disabled:opacity-60 focus:ring-2 focus:ring-blue-500 focus:outline-none ${
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
              <p className="text-[13px] text-gray-500 dark:text-gray-400 mt-1.5 flex items-start gap-1">
                <Info className="w-4 h-4 shrink-0 mt-0.5" /> Ngày áp dụng
                capacity riêng cho branch và slot này.
              </p>
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
                disabled={bootstrapLoading}
                className={`w-full border rounded-lg p-2.5 bg-white dark:bg-gray-800 text-gray-900 dark:text-white disabled:opacity-60 focus:ring-2 focus:ring-blue-500 focus:outline-none ${
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
              <p className="text-[13px] text-gray-500 dark:text-gray-400 mt-1.5 flex items-start gap-1">
                <Info className="w-4 h-4 shrink-0 mt-0.5" /> Chọn khung giờ áp
                dụng cho ngày giao.
              </p>
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
                  <p
                    className={`font-bold ${selectedBranch ? "text-gray-900 dark:text-white" : "text-gray-400 dark:text-gray-500"}`}
                  >
                    {selectedBranch?.name || "Chưa chọn chi nhánh"}
                  </p>
                  {selectedBranch && (
                    <p className="text-xs text-gray-500 mt-0.5">
                      Mã: {selectedBranch.code}
                    </p>
                  )}
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
                  <p
                    className={`font-bold ${formData.deliveryDate ? "text-gray-900 dark:text-white" : "text-gray-400 dark:text-gray-500"}`}
                  >
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
                  <p
                    className={`font-bold ${selectedSlot ? "text-gray-900 dark:text-white" : "text-gray-400 dark:text-gray-500"}`}
                  >
                    {selectedSlot?.label || "Chưa chọn khung giờ"}
                  </p>
                  {selectedSlot && (
                    <p className="text-xs text-gray-500 font-medium mt-0.5">
                      {timeRange}
                    </p>
                  )}
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

          <div className="max-w-md">
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
              Để trống nếu không giới hạn số đơn.
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
                  Ngày/slot này chỉ nhận tối đa{" "}
                  {formatMaxOrdersPreview(formData.maxOrders)}.
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Ngày/slot này sẽ không bị giới hạn số đơn.
                </>
              )}
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
            <p className="text-[13px] text-gray-500 dark:text-gray-400 mt-1.5">
              Có thể tạm dừng record này mà không cần xóa.
            </p>
          </div>
        </Card>

        {/* Action Bar (Sticky) */}
        <div className="fixed bottom-0 left-0 right-0 md:left-64 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 p-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-20">
          <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-end gap-4">
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
                disabled={loading || bootstrapLoading}
                className="flex-1 sm:flex-none px-6 py-2.5 rounded-lg font-medium bg-blue-600 hover:bg-blue-700 text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-sm"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" /> Đang tạo...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" /> Tạo capacity
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

export default BranchDeliverySlotCapacityCreatePage;
