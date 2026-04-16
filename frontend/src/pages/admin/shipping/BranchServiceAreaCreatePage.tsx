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
  ArrowRight,
  CheckCircle2,
  Copy,
  Loader2,
  MapPinned,
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

interface ZoneOption {
  id: number;
  name: string;
  code: string;
  province?: string | null;
  district?: string | null;
  ward?: string | null;
}

interface ApiList<T> {
  success?: boolean;
  data?: T[] | { items?: T[]; rows?: T[] };
}

type BulkMode = "skip_existing" | "overwrite" | "fail_on_conflict";

type FormDataState = {
  branchId: string;
  shippingZoneId: string;
  deliveryFeeOverride: string;
  minOrderValue: string;
  maxOrderValue: string;
  supportsSameDay: boolean;
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
  shippingZoneId: "",
  deliveryFeeOverride: "",
  minOrderValue: "",
  maxOrderValue: "",
  supportsSameDay: true,
  status: "active",
};

// =============================
// MAIN COMPONENT
// =============================
const BranchServiceAreaCreatePage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { showSuccessToast, showErrorToast } = useAdminToast();

  const [formData, setFormData] = useState<FormDataState>(initialForm);
  const [branches, setBranches] = useState<BranchOption[]>([]);
  const [zones, setZones] = useState<ZoneOption[]>([]);
  const [sourceBranchId, setSourceBranchId] = useState<string>("");
  const [targetBranchIds, setTargetBranchIds] = useState<number[]>([]);
  const [bulkMode, setBulkMode] = useState<BulkMode>("overwrite");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const branchId = searchParams.get("branchId");
    const shippingZoneId = searchParams.get("shippingZoneId");
    if (branchId || shippingZoneId) {
      setFormData((prev) => ({
        ...prev,
        branchId: branchId ?? prev.branchId,
        shippingZoneId: shippingZoneId ?? prev.shippingZoneId,
      }));
    }
  }, [searchParams]);

  useEffect(() => {
    const bootstrap = async () => {
      try {
        setLoading(true);
        const [branchesRes, zonesRes] = await Promise.all([
          http<ApiList<BranchOption>>(
            "GET",
            "/api/v1/admin/branches?limit=1000&status=active",
          ),
          http<ApiList<ZoneOption>>(
            "GET",
            "/api/v1/admin/shipping-zones?page=1&limit=1000&status=active",
          ),
        ]);
        setBranches(toArray(branchesRes?.data));
        setZones(toArray(zonesRes?.data));
      } catch (error: unknown) {
        const message =
          error instanceof Error
            ? error.message
            : "Không thể tải dữ liệu khởi tạo coverage.";
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
  const selectedZone = useMemo(
    () =>
      zones.find((item) => String(item.id) === formData.shippingZoneId) ?? null,
    [formData.shippingZoneId, zones],
  );

  const handleChange = (
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value, type } = event.target;
    if (type === "checkbox") {
      const target = event.target as HTMLInputElement;
      setFormData((prev) => ({ ...prev, [name]: target.checked }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validate = () => {
    const nextErrors: Record<string, string> = {};
    if (!formData.branchId) nextErrors.branchId = "Hãy chọn chi nhánh.";
    if (!formData.shippingZoneId) nextErrors.shippingZoneId = "Hãy chọn zone.";
    for (const key of [
      "deliveryFeeOverride",
      "minOrderValue",
      "maxOrderValue",
    ] as const) {
      const value = formData[key];
      if (
        value.trim() &&
        (!Number.isFinite(Number(value)) || Number(value) < 0)
      ) {
        nextErrors[key] = "Giá trị phải là số không âm.";
      }
    }
    if (
      formData.minOrderValue.trim() &&
      formData.maxOrderValue.trim() &&
      Number(formData.minOrderValue) > Number(formData.maxOrderValue)
    ) {
      nextErrors.maxOrderValue = "Max order phải lớn hơn hoặc bằng min order.";
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const buildPayload = () => ({
    shippingZoneId: Number(formData.shippingZoneId),
    deliveryFeeOverride: formData.deliveryFeeOverride.trim()
      ? Number(formData.deliveryFeeOverride)
      : null,
    minOrderValue: formData.minOrderValue.trim()
      ? Number(formData.minOrderValue)
      : null,
    maxOrderValue: formData.maxOrderValue.trim()
      ? Number(formData.maxOrderValue)
      : null,
    supportsSameDay: formData.supportsSameDay,
    status: formData.status,
  });

  const handleSubmit = async (event?: FormEvent) => {
    if (event) event.preventDefault();
    if (!validate()) return;
    try {
      setSubmitting(true);
      await http("POST", "/api/v1/admin/branch-service-areas/create", {
        branchId: Number(formData.branchId),
        ...buildPayload(),
      });
      showSuccessToast({ message: "Đã tạo coverage rule." });
      navigate("/admin/shipping/service-areas");
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Không thể tạo coverage rule.";
      showErrorToast(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleBulkApply = async () => {
    if (!formData.shippingZoneId) {
      showErrorToast("Hãy chọn zone trước khi bulk apply.");
      return;
    }
    if (!targetBranchIds.length) {
      showErrorToast("Hãy chọn ít nhất một chi nhánh đích.");
      return;
    }
    try {
      setSubmitting(true);
      await http("POST", "/api/v1/admin/branch-service-areas/bulk-upsert", {
        mode: bulkMode,
        items: targetBranchIds.map((branchId) => ({
          branchId,
          ...buildPayload(),
        })),
      });
      showSuccessToast({
        message: `Đã áp dụng coverage cho ${targetBranchIds.length} chi nhánh.`,
      });
      setTargetBranchIds([]);
      navigate("/admin/shipping/service-areas");
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : "Không thể bulk apply coverage.";
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
        "/api/v1/admin/branch-service-areas/copy-from-branch",
        {
          sourceBranchId: Number(sourceBranchId),
          targetBranchIds,
          mode: bulkMode,
          statusOverride: "active",
        },
      );
      showSuccessToast({
        message: `Đã copy coverage từ branch nguồn sang ${targetBranchIds.length} branch.`,
      });
      setTargetBranchIds([]);
      navigate("/admin/shipping/service-areas");
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : "Không thể copy coverage từ branch khác.";
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

  // Class helper cho Form Input
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
            Tạo branch service area
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1.5">
            Tạo một coverage rule cho một branch hoặc áp dụng cùng một rule cho
            nhiều branch bằng bulk-upsert.
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
                <MapPinned className="w-5 h-5 text-gray-400" />
                <h2 className="text-lg font-bold text-gray-800 dark:text-white">
                  1. Rule chính
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
                    Zone <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="shippingZoneId"
                    value={formData.shippingZoneId}
                    onChange={handleChange}
                    className={getInputClass(errors.shippingZoneId)}
                  >
                    <option value="">Chọn zone</option>
                    {zones.map((zone) => (
                      <option key={zone.id} value={zone.id}>
                        {zone.name} ({zone.code})
                      </option>
                    ))}
                  </select>
                  {errors.shippingZoneId && (
                    <p className="mt-1.5 text-xs text-red-600">
                      {errors.shippingZoneId}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                    Fee override
                  </label>
                  <input
                    name="deliveryFeeOverride"
                    value={formData.deliveryFeeOverride}
                    onChange={handleChange}
                    placeholder="Để trống nếu dùng phí zone"
                    className={getInputClass(errors.deliveryFeeOverride)}
                  />
                  {errors.deliveryFeeOverride && (
                    <p className="mt-1.5 text-xs text-red-600">
                      {errors.deliveryFeeOverride}
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

                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                    Min order
                  </label>
                  <input
                    name="minOrderValue"
                    value={formData.minOrderValue}
                    onChange={handleChange}
                    placeholder="Tùy chọn"
                    className={getInputClass(errors.minOrderValue)}
                  />
                  {errors.minOrderValue && (
                    <p className="mt-1.5 text-xs text-red-600">
                      {errors.minOrderValue}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                    Max order
                  </label>
                  <input
                    name="maxOrderValue"
                    value={formData.maxOrderValue}
                    onChange={handleChange}
                    placeholder="Tùy chọn"
                    className={getInputClass(errors.maxOrderValue)}
                  />
                  {errors.maxOrderValue && (
                    <p className="mt-1.5 text-xs text-red-600">
                      {errors.maxOrderValue}
                    </p>
                  )}
                </div>
              </div>

              <label className="mt-5 flex items-center gap-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition">
                <input
                  type="checkbox"
                  name="supportsSameDay"
                  checked={formData.supportsSameDay}
                  onChange={handleChange}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 bg-white dark:bg-gray-900"
                />
                Hỗ trợ same-day cho coverage này
              </label>
            </Card>
          </form>

          {/* Section 2: Bulk Apply */}
          <Card>
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-100 dark:border-gray-700">
              <Zap className="w-5 h-5 text-gray-400" />
              <h2 className="text-lg font-bold text-gray-800 dark:text-white">
                2. Bulk apply rule hiện tại
              </h2>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Dùng khi nhiều branch cùng chia sẻ coverage rule giống nhau.
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
                Áp dụng rule cho các branch đã chọn
              </button>
            </div>
          </Card>

          {/* Section 3: Copy từ branch mẫu */}
          <Card>
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-100 dark:border-gray-700">
              <Copy className="w-5 h-5 text-gray-400" />
              <h2 className="text-lg font-bold text-gray-800 dark:text-white">
                3. Copy từ branch mẫu
              </h2>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Dùng khi branch nguồn đã có coverage chuẩn và bạn muốn rollout
              sang nhiều branch khác.
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
                Copy coverage sang các branch đã tick ở trên
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
                    Zone
                  </div>
                  <div className="font-bold text-gray-900 dark:text-white">
                    {selectedZone
                      ? `${selectedZone.name} (${selectedZone.code})`
                      : "Chưa chọn"}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                  <div>
                    <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                      Fee rule
                    </div>
                    <div className="font-bold text-gray-900 dark:text-white">
                      {formData.deliveryFeeOverride.trim()
                        ? `${Number(
                            formData.deliveryFeeOverride,
                          ).toLocaleString("vi-VN")} đ`
                        : "Dùng phí từ zone"}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                      Same-day
                    </div>
                    <div className="font-bold text-gray-900 dark:text-white">
                      {formData.supportsSameDay ? "Bật" : "Tắt"}
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
                Khi cần áp dụng cùng một chính sách phí giao hàng cho hàng loạt
                chi nhánh khác nhau, tính năng <strong>Bulk apply</strong> sẽ
                giúp bạn tiết kiệm được nhiều thời gian thao tác.
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
              onClick={() => navigate("/admin/shipping/service-areas")}
              className="flex-1 sm:flex-none px-6 py-2.5 rounded-lg font-medium bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-200 transition-colors"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              form="main-form" // Trigger submit event of Form 1
              disabled={submitting}
              className="flex-1 sm:flex-none px-8 py-2.5 rounded-lg font-medium bg-blue-600 hover:bg-blue-700 text-white transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" /> Đang xử lý...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" /> Tạo một coverage
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BranchServiceAreaCreatePage;
