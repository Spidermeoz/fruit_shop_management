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
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Info,
  ShieldAlert,
  MapPinned,
  Power,
  CalendarDays,
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

interface BranchDeliveryTimeSlotFormData {
  branchId: string;
  deliveryTimeSlotId: string;
  maxOrdersOverride: string;
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
const initialForm: BranchDeliveryTimeSlotFormData = {
  branchId: "",
  deliveryTimeSlotId: "",
  maxOrdersOverride: "",
  status: "active",
};

const formatMaxOrdersPreview = (value?: number | null | string) => {
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
const BranchDeliveryTimeSlotCreatePage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { showSuccessToast, showErrorToast } = useAdminToast();

  const [formData, setFormData] =
    useState<BranchDeliveryTimeSlotFormData>(initialForm);
  const [branches, setBranches] = useState<BranchOption[]>([]);
  const [slots, setSlots] = useState<DeliveryTimeSlotOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [bootstrapLoading, setBootstrapLoading] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const fieldRefs = useRef<
    Record<string, HTMLInputElement | HTMLSelectElement | null>
  >({});

  // --- Initialize Context from Query Params ---
  useEffect(() => {
    const prefillBranch = searchParams.get("branchId");
    const prefillSlot = searchParams.get("deliveryTimeSlotId");
    if (prefillBranch || prefillSlot) {
      setFormData((prev) => ({
        ...prev,
        branchId: prefillBranch || prev.branchId,
        deliveryTimeSlotId: prefillSlot || prev.deliveryTimeSlotId,
      }));
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

  // --- Derived Selected Options ---
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

  const validateForm = () => {
    const nextErrors: Record<string, string> = {};

    if (!formData.branchId)
      nextErrors.branchId = "Vui lòng chọn chi nhánh áp dụng.";
    if (!formData.deliveryTimeSlotId)
      nextErrors.deliveryTimeSlotId = "Vui lòng chọn khung giờ hệ thống.";

    if (formData.maxOrdersOverride.trim() !== "") {
      const n = Number(formData.maxOrdersOverride);
      if (!Number.isInteger(n) || n < 0) {
        nextErrors.maxOrdersOverride = "Giới hạn phải là số nguyên >= 0.";
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
        deliveryTimeSlotId: Number(formData.deliveryTimeSlotId),
        maxOrdersOverride:
          formData.maxOrdersOverride.trim() === ""
            ? null
            : Number(formData.maxOrdersOverride),
        status: formData.status,
      };

      const res = await http<any>(
        "POST",
        "/api/v1/admin/branch-delivery-time-slots/create",
        payload,
      );

      if (res?.success) {
        showSuccessToast({
          message: "Bật khung giờ cho chi nhánh thành công!",
        });
        navigate("/admin/shipping/branch-delivery-slots");
      } else {
        showErrorToast(res?.message || "Kích hoạt khung giờ thất bại.");
      }
    } catch (err: any) {
      showErrorToast(err?.message || "Lỗi kết nối tới hệ thống.");
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
            onClick={() => navigate("/admin/shipping/branch-delivery-slots")}
            className="flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-blue-600 transition-colors mb-2"
          >
            <ArrowLeft className="w-4 h-4" /> Quay lại cấu hình
          </button>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            Bật khung giờ cho chi nhánh
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1.5">
            Kích hoạt một template khung giờ hệ thống để chi nhánh có thể sử
            dụng nhận đơn.
          </p>
        </div>
        <div className="hidden lg:block bg-blue-50 dark:bg-blue-900/30 border border-blue-100 dark:border-blue-800 text-blue-700 dark:text-blue-300 px-4 py-2.5 rounded-lg text-sm">
          <Info className="w-4 h-4 inline-block mr-1.5 -mt-0.5" />
          Sau khi bật, bạn có thể tạo capacity theo ngày cho branch và slot này.
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="grid grid-cols-1 xl:grid-cols-3 gap-6 lg:gap-8"
      >
        {/* CỘT TRÁI: FORM BUILDER */}
        <div className="xl:col-span-2 space-y-6">
          {/* Section 1: Đối tượng áp dụng */}
          <Card>
            <div className="border-b border-gray-100 dark:border-gray-700 pb-4 mb-4">
              <h2 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
                <MapPinned className="w-5 h-5 text-gray-400" /> 1. Chọn đối
                tượng áp dụng
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Lựa chọn chi nhánh và template khung giờ cần được kích hoạt.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                {searchParams.get("branchId") && selectedBranch && (
                  <p className="text-[10px] text-green-600 mt-1 font-bold">
                    Đã điền tự động từ trang trước
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
                    disabled={bootstrapLoading}
                    className={`w-full pl-9 pr-4 py-2.5 border rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none disabled:opacity-60 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white ${errors.deliveryTimeSlotId ? "border-red-500" : "border-gray-300 dark:border-gray-600"}`}
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
                {searchParams.get("deliveryTimeSlotId") && selectedSlot && (
                  <p className="text-[10px] text-green-600 mt-1 font-bold">
                    Đã điền tự động từ trang trước
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
          <Card>
            <div className="border-b border-gray-100 dark:border-gray-700 pb-4 mb-4">
              <h2 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-gray-400" /> 2. Giới hạn
                sức chứa (Capacity Mode)
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Quyết định xem chi nhánh sẽ dùng giới hạn mặc định của hệ thống
                hay cấu hình số lượng ngoại lệ.
              </p>
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
                className={`p-4 rounded-xl border-2 transition-all ${formData.maxOrdersOverride ? "border-amber-500 bg-amber-50/30 dark:bg-amber-900/10" : "border-gray-200 dark:border-gray-700"}`}
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
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-800 text-sm focus:ring-2 focus:ring-amber-500 outline-none"
                />
                {errors.maxOrdersOverride && (
                  <p className="text-xs text-red-600 mt-1">
                    {errors.maxOrdersOverride}
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
          <Card>
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
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg p-2.5 bg-white dark:bg-gray-800 text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none"
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
            {/* Live Activation Summary */}
            <Card className="border-blue-100 dark:border-blue-900/50 bg-gradient-to-br from-blue-50 to-white dark:from-gray-800 dark:to-gray-800/80 shadow-sm overflow-hidden">
              <div className="bg-blue-600 text-white px-4 py-3 -mx-6 -mt-6 mb-5 flex items-center justify-between font-bold shadow-sm">
                <span className="flex items-center gap-2">
                  <Info className="w-5 h-5" /> Bản tóm tắt Kích hoạt
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
                        : "Đang tạm tắt"}
                    </span>
                  </div>

                  <div>
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

                  <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-100 dark:border-gray-700 flex flex-col gap-2">
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
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500 font-medium">
                        Giới hạn nhận:
                      </span>
                      {formData.maxOrdersOverride ? (
                        <span className="font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-1.5 rounded">
                          {formatMaxOrdersPreview(formData.maxOrdersOverride)}
                        </span>
                      ) : (
                        <span className="font-bold text-blue-600 dark:text-blue-400">
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
                <CalendarDays className="w-4 h-4 text-gray-500" /> Sau khi thiết
                lập xong
              </h3>
              <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed mb-3">
                Bạn có thể tạo ngay lịch Capacity theo ngày để chính thức đưa
                cửa hàng vào nhận đơn cho khung giờ này.
              </p>
              {selectedBranch && selectedSlot && (
                <button
                  type="button"
                  onClick={() =>
                    navigate(
                      `/admin/shipping/branch-delivery-slot-capacities/create?branchId=${selectedBranch.id}&deliveryTimeSlotId=${selectedSlot.id}`,
                    )
                  }
                  className="w-full py-2 bg-white border border-gray-300 rounded text-xs font-bold text-gray-700 hover:bg-gray-50 shadow-sm transition"
                >
                  Đi tới Tạo Capacity Ngày
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
              onClick={handleSubmit}
              disabled={loading || bootstrapLoading}
              className="flex-1 sm:flex-none px-8 py-2.5 rounded-lg font-medium bg-blue-600 hover:bg-blue-700 text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-sm"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" /> Đang tạo...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" /> Kích hoạt khung giờ
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BranchDeliveryTimeSlotCreatePage;
