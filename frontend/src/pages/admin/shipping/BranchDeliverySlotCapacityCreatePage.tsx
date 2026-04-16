import React, {
  useEffect,
  useMemo,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Loader2,
  Save,
  Store,
  Zap,
  Info,
  AlertCircle,
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

interface SlotOption {
  id: number;
  code: string;
  label: string;
  startTime?: string;
  endTime?: string;
}

interface ApiList<T> {
  success?: boolean;
  data?: T[] | { items?: T[]; rows?: T[] };
}

type BulkMode = "skip_existing" | "overwrite" | "fail_on_conflict";

type FormDataState = {
  branchId: string;
  deliveryDate: string;
  deliveryTimeSlotId: string;
  maxOrders: string;
  status: "active" | "inactive";
};

// =============================
// HELPERS
// =============================
const toArray = <T,>(input: ApiList<T>["data"] | undefined): T[] => {
  if (Array.isArray(input)) return input;
  if (Array.isArray(input?.items)) return input.items;
  if (Array.isArray((input as { rows?: T[] } | undefined)?.rows))
    return ((input as { rows?: T[] }).rows ?? []) as T[];
  return [];
};

const getLocalDateString = (offsetDays = 0) => {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 10);
};

const initialForm: FormDataState = {
  branchId: "",
  deliveryDate: getLocalDateString(1),
  deliveryTimeSlotId: "",
  maxOrders: "",
  status: "active",
};

// =============================
// MAIN COMPONENT
// =============================
const BranchDeliverySlotCapacityCreatePage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { showSuccessToast, showErrorToast } = useAdminToast();

  const [formData, setFormData] = useState<FormDataState>(initialForm);
  const [branches, setBranches] = useState<BranchOption[]>([]);
  const [slots, setSlots] = useState<SlotOption[]>([]);
  const [targetBranchIds, setTargetBranchIds] = useState<number[]>([]);
  const [targetSlotIds, setTargetSlotIds] = useState<number[]>([]);
  const [bulkMode, setBulkMode] = useState<BulkMode>("overwrite");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const branchId = searchParams.get("branchId");
    const deliveryDate = searchParams.get("deliveryDate");
    const deliveryTimeSlotId = searchParams.get("deliveryTimeSlotId");
    if (branchId || deliveryDate || deliveryTimeSlotId) {
      setFormData((prev) => ({
        ...prev,
        branchId: branchId ?? prev.branchId,
        deliveryDate: deliveryDate ?? prev.deliveryDate,
        deliveryTimeSlotId: deliveryTimeSlotId ?? prev.deliveryTimeSlotId,
      }));
    }
  }, [searchParams]);

  useEffect(() => {
    const bootstrap = async () => {
      try {
        setLoading(true);
        const [branchesRes, slotsRes] = await Promise.all([
          http<ApiList<BranchOption>>(
            "GET",
            "/api/v1/admin/branches?limit=1000&status=active",
          ),
          http<ApiList<SlotOption>>(
            "GET",
            "/api/v1/admin/delivery-time-slots?page=1&limit=1000&status=active",
          ),
        ]);
        setBranches(toArray(branchesRes?.data));
        setSlots(toArray(slotsRes?.data));
      } catch (error: unknown) {
        const message =
          error instanceof Error
            ? error.message
            : "Không thể tải dữ liệu khởi tạo capacity create page.";
        showErrorToast(message);
      } finally {
        setLoading(false);
      }
    };
    void bootstrap();
  }, [showErrorToast]);

  const selectedBranch = useMemo(
    () =>
      branches.find((item) => String(item.id) === formData.branchId) ?? null,
    [branches, formData.branchId],
  );
  const selectedSlot = useMemo(
    () =>
      slots.find((item) => String(item.id) === formData.deliveryTimeSlotId) ??
      null,
    [formData.deliveryTimeSlotId, slots],
  );

  const handleChange = (
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validate = () => {
    const nextErrors: Record<string, string> = {};
    if (!formData.branchId) nextErrors.branchId = "Hãy chọn chi nhánh.";
    if (!formData.deliveryDate) nextErrors.deliveryDate = "Hãy chọn ngày giao.";
    if (!formData.deliveryTimeSlotId)
      nextErrors.deliveryTimeSlotId = "Hãy chọn slot.";
    if (formData.maxOrders.trim()) {
      const value = Number(formData.maxOrders);
      if (!Number.isInteger(value) || value < 0)
        nextErrors.maxOrders = "Max orders phải là số nguyên không âm.";
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const buildPayload = (branchId?: number, slotId?: number) => ({
    branchId: branchId ?? Number(formData.branchId),
    deliveryDate: formData.deliveryDate,
    deliveryTimeSlotId: slotId ?? Number(formData.deliveryTimeSlotId),
    maxOrders: formData.maxOrders.trim() ? Number(formData.maxOrders) : null,
    status: formData.status,
  });

  const handleSubmit = async (event?: FormEvent) => {
    if (event) event.preventDefault();
    if (!validate()) return;
    try {
      setSubmitting(true);
      await http(
        "POST",
        "/api/v1/admin/branch-delivery-slot-capacities/create",
        buildPayload(),
      );
      showSuccessToast({ message: "Đã tạo capacity record." });
      navigate("/admin/shipping/branch-delivery-slot-capacities");
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Không thể tạo capacity.";
      showErrorToast(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleBulkUpsert = async () => {
    if (
      !targetBranchIds.length ||
      !targetSlotIds.length ||
      !formData.deliveryDate
    ) {
      showErrorToast("Hãy chọn ngày, ít nhất một branch và ít nhất một slot.");
      return;
    }
    try {
      setSubmitting(true);
      await http(
        "POST",
        "/api/v1/admin/branch-delivery-slot-capacities/bulk-upsert",
        {
          mode: bulkMode,
          items: targetBranchIds.flatMap((branchId) =>
            targetSlotIds.map((slotId) => buildPayload(branchId, slotId)),
          ),
        },
      );
      showSuccessToast({
        message: `Đã bulk upsert ${targetBranchIds.length * targetSlotIds.length} ô capacity.`,
      });
      navigate("/admin/shipping/branch-delivery-slot-capacities");
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : "Không thể bulk upsert capacities.";
      showErrorToast(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleGenerateDefaults = async () => {
    if (!formData.deliveryDate || !targetBranchIds.length) {
      showErrorToast(
        "Hãy chọn ngày và ít nhất một branch để generate defaults.",
      );
      return;
    }
    try {
      setSubmitting(true);
      await http(
        "POST",
        "/api/v1/admin/branch-delivery-slot-capacities/generate-from-defaults",
        {
          deliveryDate: formData.deliveryDate,
          branchIds: targetBranchIds,
          mode: bulkMode,
          status: formData.status,
        },
      );
      showSuccessToast({
        message: `Đã generate capacities mặc định cho ${targetBranchIds.length} branch.`,
      });
      navigate("/admin/shipping/branch-delivery-slot-capacities");
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : "Không thể generate capacities mặc định.";
      showErrorToast(message);
    } finally {
      setSubmitting(false);
    }
  };

  const toggleBranch = (id: number) => {
    setTargetBranchIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };
  const toggleSlot = (id: number) => {
    setTargetSlotIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  // Helper để đồng bộ class CSS của Input
  const getInputClass = (error?: string) =>
    `w-full border rounded-lg p-2.5 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all ${
      error ? "border-red-500" : "border-gray-300 dark:border-gray-600"
    }`;

  if (loading) {
    return (
      <div className="flex min-h-[320px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto pb-24">
      {/* Tầng A: Header & Intro */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
        <div>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-blue-600 transition-colors mb-2"
          >
            <ArrowLeft className="w-4 h-4" /> Quay lại danh sách
          </button>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            Tạo branch delivery slot capacity
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1.5">
            Tạo một record lẻ hoặc lên capacity cho cả lưới branch × slot của
            một ngày bằng bulk-upsert.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 lg:gap-8">
        {/* CỘT TRÁI: FORM & ACTIONS */}
        <div className="xl:col-span-2 space-y-6">
          {/* Section 1: Tạo một capacity (Form chính) */}
          <form id="main-form" onSubmit={handleSubmit}>
            <Card>
              <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-100 dark:border-gray-700">
                <CalendarDays className="w-5 h-5 text-gray-400" />
                <h2 className="text-lg font-bold text-gray-800 dark:text-white">
                  1. Tạo một capacity
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                    Chi nhánh <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="branchId"
                    value={formData.branchId}
                    onChange={handleChange}
                    className={getInputClass(errors.branchId)}
                  >
                    <option value="">Chọn chi nhánh</option>
                    {branches.map((branch) => (
                      <option key={branch.id} value={branch.id}>
                        {branch.name} ({branch.code})
                      </option>
                    ))}
                  </select>
                  {errors.branchId && (
                    <p className="mt-1.5 text-xs text-red-600">
                      {errors.branchId}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                    Ngày giao <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    name="deliveryDate"
                    value={formData.deliveryDate}
                    onChange={handleChange}
                    className={getInputClass(errors.deliveryDate)}
                  />
                  {errors.deliveryDate && (
                    <p className="mt-1.5 text-xs text-red-600">
                      {errors.deliveryDate}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                    Slot <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="deliveryTimeSlotId"
                    value={formData.deliveryTimeSlotId}
                    onChange={handleChange}
                    className={getInputClass(errors.deliveryTimeSlotId)}
                  >
                    <option value="">Chọn slot</option>
                    {slots.map((slot) => (
                      <option key={slot.id} value={slot.id}>
                        {slot.label} ({slot.code})
                      </option>
                    ))}
                  </select>
                  {errors.deliveryTimeSlotId && (
                    <p className="mt-1.5 text-xs text-red-600">
                      {errors.deliveryTimeSlotId}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                    Max orders
                  </label>
                  <input
                    name="maxOrders"
                    value={formData.maxOrders}
                    onChange={handleChange}
                    placeholder="Để trống nếu không giới hạn"
                    className={getInputClass(errors.maxOrders)}
                  />
                  {errors.maxOrders && (
                    <p className="mt-1.5 text-xs text-red-600">
                      {errors.maxOrders}
                    </p>
                  )}
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                    Trạng thái
                  </label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    className={getInputClass()}
                  >
                    <option value="active">Đang chạy</option>
                    <option value="inactive">Tạm dừng</option>
                  </select>
                </div>
              </div>
            </Card>
          </form>

          {/* Section 2: Bulk planner input */}
          <Card>
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-100 dark:border-gray-700">
              <Zap className="w-5 h-5 text-gray-400" />
              <h2 className="text-lg font-bold text-gray-800 dark:text-white">
                2. Bulk planner input
              </h2>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Chọn nhiều branch và nhiều slot để tạo capacity hàng loạt cho cùng
              một ngày.
            </p>

            <div className="space-y-4">
              <select
                value={bulkMode}
                onChange={(event) =>
                  setBulkMode(event.target.value as BulkMode)
                }
                className={getInputClass()}
              >
                <option value="overwrite">Overwrite</option>
                <option value="skip_existing">Skip existing</option>
                <option value="fail_on_conflict">Fail on conflict</option>
              </select>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Branches List */}
                <div className="max-h-64 space-y-1.5 overflow-y-auto rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-3">
                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">
                    Chi nhánh
                  </p>
                  {branches.map((branch) => (
                    <label
                      key={branch.id}
                      className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition"
                    >
                      <input
                        type="checkbox"
                        checked={targetBranchIds.includes(branch.id)}
                        onChange={() => toggleBranch(branch.id)}
                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 bg-white dark:bg-gray-800"
                      />
                      <span>
                        {branch.name} ({branch.code})
                      </span>
                    </label>
                  ))}
                </div>

                {/* Slots List */}
                <div className="max-h-64 space-y-1.5 overflow-y-auto rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-3">
                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">
                    Slot
                  </p>
                  {slots.map((slot) => (
                    <label
                      key={slot.id}
                      className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition"
                    >
                      <input
                        type="checkbox"
                        checked={targetSlotIds.includes(slot.id)}
                        onChange={() => toggleSlot(slot.id)}
                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 bg-white dark:bg-gray-800"
                      />
                      <span>
                        {slot.label} ({slot.code})
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <button
                type="button"
                disabled={submitting}
                onClick={() => void handleBulkUpsert()}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-medium bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <CheckCircle2 className="w-5 h-5" />
                Bulk upsert theo grid đã chọn
              </button>
            </div>
          </Card>

          {/* Section 3: Generate từ default */}
          <Card>
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-100 dark:border-gray-700">
              <Store className="w-5 h-5 text-gray-400" />
              <h2 className="text-lg font-bold text-gray-800 dark:text-white">
                3. Generate từ default
              </h2>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Dùng cấu hình branch slot hiện có để sinh nhanh capacity cho các
              branch đã tick.
            </p>

            <button
              type="button"
              disabled={submitting}
              onClick={() => void handleGenerateDefaults()}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-medium bg-gray-50 dark:bg-gray-800/50 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Zap className="w-4 h-4" />
              Generate capacities cho các branch đã chọn
            </button>
          </Card>
        </div>

        {/* CỘT PHẢI: LIVE PREVIEW PANEL */}
        <div className="xl:col-span-1">
          <div className="sticky top-24 space-y-6">
            <Card className="border-blue-100 dark:border-blue-900/50 bg-gradient-to-br from-blue-50 to-white dark:from-gray-800 dark:to-gray-800/80 shadow-sm overflow-hidden">
              <div className="bg-blue-600 text-white px-4 py-3 -mx-6 -mt-6 mb-5 flex items-center gap-2 font-bold shadow-sm">
                <Clock3 className="w-5 h-5" /> Live Preview
              </div>

              <div className="space-y-4 text-sm">
                <div>
                  <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                    Branch
                  </div>
                  <div className="font-bold text-gray-900 dark:text-white">
                    {selectedBranch
                      ? `${selectedBranch.name} (${selectedBranch.code})`
                      : "Chưa chọn"}
                  </div>
                </div>

                <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                  <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                    Ngày
                  </div>
                  <div className="font-bold text-gray-900 dark:text-white">
                    {formData.deliveryDate || "—"}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                  <div>
                    <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                      Slot
                    </div>
                    <div className="font-bold text-gray-900 dark:text-white">
                      {selectedSlot
                        ? `${selectedSlot.label} (${selectedSlot.code})`
                        : "Chưa chọn"}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                      Max orders
                    </div>
                    <div className="font-bold text-gray-900 dark:text-white">
                      {formData.maxOrders.trim()
                        ? `${formData.maxOrders} đơn`
                        : "Không giới hạn"}
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
              <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200 mb-3 flex items-center gap-2">
                <Info className="w-4 h-4" /> Mẹo sử dụng
              </h3>
              <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                Khi cần thiết lập năng lực vận hành cho nhiều ngày lễ hoặc sự
                kiện, hãy sử dụng tính năng <strong>Bulk planner input</strong>{" "}
                kết hợp với chọn nhiều chi nhánh để thao tác nhanh nhất.
              </p>
            </Card>
          </div>
        </div>
      </div>

      {/* Action Bar (Fixed Bottom) */}
      <div className="fixed bottom-0 left-0 right-0 md:left-64 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 p-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-20">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-sm font-medium text-gray-500 hidden sm:block">
            {Object.keys(errors).length > 0 && (
              <span className="text-red-500 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" /> Có lỗi cần chỉnh sửa
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
              type="submit"
              form="main-form" // Trigger submit của Form 1
              disabled={submitting}
              className="flex-1 sm:flex-none px-8 py-2.5 rounded-lg font-medium bg-blue-600 hover:bg-blue-700 text-white transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" /> Đang xử lý...
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
    </div>
  );
};

export default BranchDeliverySlotCapacityCreatePage;
