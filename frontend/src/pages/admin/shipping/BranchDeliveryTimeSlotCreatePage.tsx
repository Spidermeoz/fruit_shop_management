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
  CheckCircle2,
  Clock3,
  Copy,
  Loader2,
  Save,
  Store,
  Zap,
  Info,
  AlertCircle,
  ArrowRight,
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
  maxOrders?: number | null;
}

interface ApiList<T> {
  success?: boolean;
  data?: T[] | { items?: T[]; rows?: T[] };
}

type BulkMode = "skip_existing" | "overwrite" | "fail_on_conflict";

type FormDataState = {
  branchId: string;
  deliveryTimeSlotId: string;
  maxOrdersOverride: string;
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

const initialForm: FormDataState = {
  branchId: "",
  deliveryTimeSlotId: "",
  maxOrdersOverride: "",
  status: "active",
};

// =============================
// MAIN COMPONENT
// =============================
const BranchDeliveryTimeSlotCreatePage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { showSuccessToast, showErrorToast } = useAdminToast();

  const [formData, setFormData] = useState<FormDataState>(initialForm);
  const [branches, setBranches] = useState<BranchOption[]>([]);
  const [slots, setSlots] = useState<SlotOption[]>([]);
  const [sourceBranchId, setSourceBranchId] = useState<string>("");
  const [targetBranchIds, setTargetBranchIds] = useState<number[]>([]);
  const [bulkMode, setBulkMode] = useState<BulkMode>("overwrite");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const branchId = searchParams.get("branchId");
    const deliveryTimeSlotId = searchParams.get("deliveryTimeSlotId");
    if (branchId || deliveryTimeSlotId) {
      setFormData((prev) => ({
        ...prev,
        branchId: branchId ?? prev.branchId,
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
            : "Không thể tải bootstrap branch slot create page.";
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
    if (!formData.deliveryTimeSlotId)
      nextErrors.deliveryTimeSlotId = "Hãy chọn system slot.";
    if (formData.maxOrdersOverride.trim()) {
      const value = Number(formData.maxOrdersOverride);
      if (!Number.isInteger(value) || value < 0)
        nextErrors.maxOrdersOverride =
          "Max orders override phải là số nguyên không âm.";
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const buildPayload = () => ({
    deliveryTimeSlotId: Number(formData.deliveryTimeSlotId),
    maxOrdersOverride: formData.maxOrdersOverride.trim()
      ? Number(formData.maxOrdersOverride)
      : null,
    status: formData.status,
  });

  const handleSubmit = async (event?: FormEvent) => {
    if (event) event.preventDefault();
    if (!validate()) return;
    try {
      setSubmitting(true);
      await http("POST", "/api/v1/admin/branch-delivery-time-slots/create", {
        branchId: Number(formData.branchId),
        ...buildPayload(),
      });
      showSuccessToast({ message: "Đã tạo branch slot." });
      navigate("/admin/shipping/branch-delivery-slots");
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : "Không thể tạo branch delivery slot.";
      showErrorToast(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleBulkApply = async () => {
    if (!formData.deliveryTimeSlotId || !targetBranchIds.length) {
      showErrorToast("Hãy chọn slot và ít nhất một branch đích.");
      return;
    }
    try {
      setSubmitting(true);
      await http(
        "POST",
        "/api/v1/admin/branch-delivery-time-slots/bulk-upsert",
        {
          mode: bulkMode,
          items: targetBranchIds.map((branchId) => ({
            branchId,
            ...buildPayload(),
          })),
        },
      );
      showSuccessToast({
        message: `Đã bật slot cho ${targetBranchIds.length} chi nhánh.`,
      });
      setTargetBranchIds([]);
      navigate("/admin/shipping/branch-delivery-slots");
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : "Không thể bulk apply branch slots.";
      showErrorToast(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopyFromBranch = async () => {
    if (!sourceBranchId || !targetBranchIds.length) {
      showErrorToast("Hãy chọn branch nguồn và ít nhất một branch đích.");
      return;
    }
    try {
      setSubmitting(true);
      await http(
        "POST",
        "/api/v1/admin/branch-delivery-time-slots/copy-from-branch",
        {
          sourceBranchId: Number(sourceBranchId),
          targetBranchIds,
          mode: bulkMode,
          statusOverride: "active",
        },
      );
      showSuccessToast({
        message: `Đã copy cấu hình slot sang ${targetBranchIds.length} branch.`,
      });
      navigate("/admin/shipping/branch-delivery-slots");
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : "Không thể copy branch slots từ branch mẫu.";
      showErrorToast(message);
    } finally {
      setSubmitting(false);
    }
  };

  const toggleTargetBranch = (id: number) => {
    setTargetBranchIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  // Helper cho class CSS của Input
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
            Tạo branch delivery slot
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1.5">
            Kích hoạt slot cho một branch hoặc rollout cùng slot sang nhiều
            branch bằng bulk-upsert / copy-from-branch.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 lg:gap-8">
        {/* CỘT TRÁI: FORM & ACTIONS */}
        <div className="xl:col-span-2 space-y-6">
          {/* Section 1: Form chính */}
          <form id="main-form" onSubmit={handleSubmit}>
            <Card>
              <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-100 dark:border-gray-700">
                <Clock3 className="w-5 h-5 text-gray-400" />
                <h2 className="text-lg font-bold text-gray-800 dark:text-white">
                  1. Kích hoạt một slot
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
                    System slot <span className="text-red-500">*</span>
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
                    Max orders override
                  </label>
                  <input
                    name="maxOrdersOverride"
                    value={formData.maxOrdersOverride}
                    onChange={handleChange}
                    placeholder="Để trống nếu theo default"
                    className={getInputClass(errors.maxOrdersOverride)}
                  />
                  {errors.maxOrdersOverride && (
                    <p className="mt-1.5 text-xs text-red-600">
                      {errors.maxOrdersOverride}
                    </p>
                  )}
                </div>

                <div>
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

          {/* Section 2: Bulk Apply */}
          <Card>
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-100 dark:border-gray-700">
              <Zap className="w-5 h-5 text-gray-400" />
              <h2 className="text-lg font-bold text-gray-800 dark:text-white">
                2. Bật cùng slot cho nhiều branch
              </h2>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Rất hợp khi rollout khung giờ mới trên nhiều chi nhánh cùng lúc.
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

              <div className="max-h-64 space-y-1.5 overflow-y-auto rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-3">
                {branches.map((branch) => (
                  <label
                    key={branch.id}
                    className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition"
                  >
                    <input
                      type="checkbox"
                      checked={targetBranchIds.includes(branch.id)}
                      onChange={() => toggleTargetBranch(branch.id)}
                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 bg-white dark:bg-gray-800"
                    />
                    <span>
                      {branch.name} ({branch.code})
                    </span>
                  </label>
                ))}
              </div>

              <button
                type="button"
                disabled={submitting}
                onClick={() => void handleBulkApply()}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-medium bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <CheckCircle2 className="w-5 h-5" />
                Bật slot cho các branch đã chọn
              </button>
            </div>
          </Card>

          {/* Section 3: Copy từ branch mẫu */}
          <Card>
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-100 dark:border-gray-700">
              <Copy className="w-5 h-5 text-gray-400" />
              <h2 className="text-lg font-bold text-gray-800 dark:text-white">
                3. Copy cấu hình từ branch mẫu
              </h2>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Dùng khi bạn muốn clone toàn bộ slot structure từ chi nhánh đã
              chuẩn.
            </p>

            <div className="space-y-4">
              <select
                value={sourceBranchId}
                onChange={(event) => setSourceBranchId(event.target.value)}
                className={getInputClass()}
              >
                <option value="">Chọn branch nguồn</option>
                {branches.map((branch) => (
                  <option key={branch.id} value={branch.id}>
                    {branch.name} ({branch.code})
                  </option>
                ))}
              </select>

              <button
                type="button"
                disabled={submitting}
                onClick={() => void handleCopyFromBranch()}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-medium bg-gray-50 dark:bg-gray-800/50 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ArrowRight className="w-4 h-4" />
                Copy sang các branch đã tick ở trên
              </button>
            </div>
          </Card>
        </div>

        {/* CỘT PHẢI: LIVE PREVIEW PANEL */}
        <div className="xl:col-span-1">
          <div className="sticky top-24 space-y-6">
            <Card className="border-blue-100 dark:border-blue-900/50 bg-gradient-to-br from-blue-50 to-white dark:from-gray-800 dark:to-gray-800/80 shadow-sm overflow-hidden">
              <div className="bg-blue-600 text-white px-4 py-3 -mx-6 -mt-6 mb-5 flex items-center gap-2 font-bold shadow-sm">
                <Store className="w-5 h-5" /> Live Preview
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
                    Slot
                  </div>
                  <div className="font-bold text-gray-900 dark:text-white">
                    {selectedSlot
                      ? `${selectedSlot.label} (${selectedSlot.code})`
                      : "Chưa chọn"}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                  <div>
                    <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                      Khung giờ
                    </div>
                    <div className="font-bold text-gray-900 dark:text-white">
                      {selectedSlot?.startTime && selectedSlot?.endTime
                        ? `${selectedSlot.startTime} - ${selectedSlot.endTime}`
                        : "—"}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                      Override
                    </div>
                    <div className="font-bold text-gray-900 dark:text-white">
                      {formData.maxOrdersOverride.trim()
                        ? `${formData.maxOrdersOverride} đơn`
                        : "Theo default"}
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
                Khi cần kích hoạt nhiều khung giờ mới đồng loạt, chức năng{" "}
                <strong>Bật cùng slot cho nhiều branch</strong> sẽ giúp tiết
                kiệm tối đa thời gian thao tác.
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
              onClick={() => navigate("/admin/shipping/branch-delivery-slots")}
              className="flex-1 sm:flex-none px-6 py-2.5 rounded-lg font-medium bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-200 transition-colors"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              form="main-form" // Trigger submit của Form chính
              disabled={submitting}
              className="flex-1 sm:flex-none px-8 py-2.5 rounded-lg font-medium bg-blue-600 hover:bg-blue-700 text-white transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" /> Đang xử lý...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" /> Tạo một branch slot
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
