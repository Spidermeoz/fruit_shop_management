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
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Clock3,
  Copy,
  Loader2,
  Power,
  Save,
  Store,
  TimerReset,
  History,
  ShieldAlert,
  AlertTriangle,
  Info,
} from "lucide-react";
import Card from "../../../components/admin/layouts/Card";
import { http } from "../../../services/http";
import { useAdminToast } from "../../../context/AdminToastContext";

type Status = "active" | "inactive";

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
  status?: Status;
}
interface DetailRow {
  id: number;
  branchId: number;
  deliveryTimeSlotId: number;
  maxOrdersOverride?: number | null;
  status: Status;
  createdAt?: string;
  updatedAt?: string;
}
interface FormState {
  branchId: string;
  deliveryTimeSlotId: string;
  maxOrdersOverride: string;
  status: Status;
}
type ApiDetail<T> = { success: boolean; data: T; message?: string };
type ApiList<T> = { success: boolean; data: T[] | { items: T[] } };

const toFormData = (row: DetailRow): FormState => ({
  branchId: String(row.branchId ?? ""),
  deliveryTimeSlotId: String(row.deliveryTimeSlotId ?? ""),
  maxOrdersOverride:
    row.maxOrdersOverride === null || row.maxOrdersOverride === undefined
      ? ""
      : String(row.maxOrdersOverride),
  status: row.status ?? "active",
});

const timeRange = (slot?: DeliveryTimeSlotOption | null) =>
  slot ? `${slot.startTime?.slice(0, 5)} - ${slot.endTime?.slice(0, 5)}` : "—";
const formatMax = (value?: string | number | null) =>
  value === "" || value === null || value === undefined
    ? "Dùng mặc định hệ thống"
    : `${Number(value).toLocaleString("vi-VN")} đơn`;

const BranchDeliveryTimeSlotEditPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { showSuccessToast, showErrorToast } = useAdminToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [togglingStatus, setTogglingStatus] = useState(false);
  const [detail, setDetail] = useState<DetailRow | null>(null);
  const [formData, setFormData] = useState<FormState | null>(null);
  const [initialData, setInitialData] = useState<FormState | null>(null);
  const [branches, setBranches] = useState<BranchOption[]>([]);
  const [slots, setSlots] = useState<DeliveryTimeSlotOption[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const fieldRefs = useRef<
    Record<string, HTMLInputElement | HTMLSelectElement | null>
  >({});

  const setFieldRef =
    (name: string) => (el: HTMLInputElement | HTMLSelectElement | null) => {
      fieldRefs.current[name] = el;
    };

  useEffect(() => {
    const fetchBootstrap = async () => {
      try {
        setLoading(true);
        const [detailRes, branchesRes, slotsRes] = await Promise.all([
          http<ApiDetail<DetailRow>>(
            "GET",
            `/api/v1/admin/branch-delivery-time-slots/edit/${id}`,
          ),
          http<ApiList<BranchOption>>(
            "GET",
            "/api/v1/admin/branches?limit=1000&status=active",
          ),
          http<ApiList<DeliveryTimeSlotOption>>(
            "GET",
            "/api/v1/admin/delivery-time-slots?page=1&limit=1000",
          ),
        ]);
        const branchRows = Array.isArray(branchesRes?.data)
          ? branchesRes.data
          : branchesRes?.data?.items || [];
        const slotRows = Array.isArray(slotsRes?.data)
          ? slotsRes.data
          : slotsRes?.data?.items || [];
        setBranches(branchRows);
        setSlots(slotRows);
        setDetail(detailRes.data);
        const mapped = toFormData(detailRes.data);
        setFormData(mapped);
        setInitialData(mapped);
      } catch (error: any) {
        showErrorToast(
          error?.message || "Không thể tải dữ liệu khung giờ chi nhánh.",
        );
      } finally {
        setLoading(false);
      }
    };
    fetchBootstrap();
  }, [id, showErrorToast]);

  const selectedBranch = useMemo(
    () =>
      branches.find((item) => String(item.id) === formData?.branchId) || null,
    [branches, formData?.branchId],
  );

  const selectedSlot = useMemo(
    () =>
      slots.find((item) => String(item.id) === formData?.deliveryTimeSlotId) ||
      null,
    [slots, formData?.deliveryTimeSlotId],
  );

  const isDirty = useMemo(
    () => JSON.stringify(formData) !== JSON.stringify(initialData),
    [formData, initialData],
  );

  const impacts = useMemo(() => {
    if (!formData || !initialData) return [] as string[];
    const notes: string[] = [];
    if (formData.branchId !== initialData.branchId)
      notes.push(
        "Bạn đang chuyển khung giờ chi nhánh (branch slot) sang chi nhánh khác; hãy kiểm tra lại vùng phủ sóng và bảng phân bổ của cả hai chi nhánh.",
      );
    if (formData.deliveryTimeSlotId !== initialData.deliveryTimeSlotId)
      notes.push(
        "Khung giờ hệ thống được liên kết đã thay đổi; bảng điều phối theo ngày sẽ dùng khung giờ mới.",
      );
    if (
      (formData.maxOrdersOverride || "") !==
      (initialData.maxOrdersOverride || "")
    )
      notes.push(
        "Giới hạn ghi đè (override) đã thay đổi; hệ thống tạo sức chứa tự động sẽ lấy cấu hình mới này.",
      );
    if (formData.status !== initialData.status)
      notes.push(
        formData.status === "inactive"
          ? "CẢNH BÁO: Khung giờ tại chi nhánh này sẽ bị tắt và không còn tự động tạo sức chứa (capacity) để nhận đơn bình thường."
          : "Khung giờ tại chi nhánh này sẽ được bật lại.",
      );
    return notes;
  }, [formData, initialData]);

  const scrollToFirstError = (nextErrors: Record<string, string>) => {
    const firstKey = Object.keys(nextErrors)[0];
    if (!firstKey) return;
    fieldRefs.current[firstKey]?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
    fieldRefs.current[firstKey]?.focus?.();
  };

  const validate = () => {
    if (!formData) return false;
    const nextErrors: Record<string, string> = {};
    if (!formData.branchId) nextErrors.branchId = "Vui lòng chọn chi nhánh.";
    if (!formData.deliveryTimeSlotId)
      nextErrors.deliveryTimeSlotId = "Vui lòng chọn khung giờ hệ thống.";
    if (formData.maxOrdersOverride && Number(formData.maxOrdersOverride) < 0)
      nextErrors.maxOrdersOverride = "Giới hạn đơn hàng không hợp lệ.";

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      scrollToFirstError(nextErrors);
      return false;
    }
    return true;
  };

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    if (!formData) return;
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value } as FormState);
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!formData || !validate()) return;
    try {
      setSaving(true);
      await http(
        "PATCH",
        `/api/v1/admin/branch-delivery-time-slots/edit/${id}`,
        {
          branchId: Number(formData.branchId),
          deliveryTimeSlotId: Number(formData.deliveryTimeSlotId),
          maxOrdersOverride:
            formData.maxOrdersOverride === ""
              ? null
              : Number(formData.maxOrdersOverride),
          status: formData.status,
        },
      );
      showSuccessToast({
        message: "Đã cập nhật khung giờ chi nhánh thành công!",
      });
      setInitialData({ ...formData });
      setErrors({});
    } catch (error: any) {
      showErrorToast(
        error?.message || "Không thể cập nhật khung giờ chi nhánh.",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async () => {
    if (!formData) return;
    const nextStatus: Status =
      formData.status === "active" ? "inactive" : "active";
    try {
      setTogglingStatus(true);
      await http(
        "PATCH",
        `/api/v1/admin/branch-delivery-time-slots/${id}/status`,
        { status: nextStatus },
      );
      setFormData({ ...formData, status: nextStatus });
      setInitialData((prev) => (prev ? { ...prev, status: nextStatus } : prev));
      showSuccessToast({
        message:
          nextStatus === "active"
            ? "Đã bật khung giờ chi nhánh."
            : "Đã tạm dừng khung giờ chi nhánh.",
      });
    } catch (error: any) {
      showErrorToast(error?.message || "Không thể đổi trạng thái.");
    } finally {
      setTogglingStatus(false);
    }
  };

  if (loading || !formData || !initialData) {
    return (
      <div className="flex flex-col justify-center items-center py-32 max-w-7xl mx-auto">
        <Loader2 className="w-10 h-10 animate-spin text-blue-600 mb-4" />
        <span className="text-gray-800 dark:text-gray-200 font-bold text-lg">
          Đang tải dữ liệu khung giờ chi nhánh...
        </span>
      </div>
    );
  }

  const isStatusChanged = formData.status !== initialData.status;

  return (
    <div className="max-w-7xl mx-auto pb-24">
      {/* Header & Intro */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
        <div>
          <button
            type="button"
            onClick={() =>
              navigate("/admin/shipping/branch-delivery-time-slots")
            }
            className="flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-blue-600 transition-colors mb-2"
          >
            <ArrowLeft className="w-4 h-4" /> Quay lại danh sách
          </button>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              Chỉnh sửa khung giờ chi nhánh
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
            Tinh chỉnh liên kết giữa chi nhánh và khung giờ hệ thống, cài đặt
            giới hạn riêng biệt để vận hành chính xác.
          </p>
        </div>

        <div className="hidden lg:flex items-center gap-2 bg-blue-50 dark:bg-blue-900/30 border border-blue-100 dark:border-blue-800 text-blue-700 dark:text-blue-300 px-4 py-2.5 rounded-lg text-sm">
          <History className="w-4 h-4" />
          {detail?.updatedAt
            ? `Cập nhật gần nhất: ${new Date(detail.updatedAt).toLocaleString("vi-VN")}`
            : "Đang chỉnh sửa bản ghi hiện có"}
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="grid grid-cols-1 xl:grid-cols-3 gap-6 lg:gap-8"
      >
        {/* CỘT TRÁI: FORM BUILDER */}
        <div className="xl:col-span-2 space-y-6">
          {/* Section 1: Mapping Branch x System Slot */}
          <Card className="border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-100 dark:border-gray-700">
              <Store className="w-5 h-5 text-gray-400" />
              <h2 className="text-lg font-bold text-gray-800 dark:text-white">
                1. Liên kết Chi nhánh & Khung giờ hệ thống
              </h2>
            </div>

            <p className="text-sm text-gray-600 dark:text-gray-400 mb-5">
              Chọn đúng cặp chi nhánh và khung giờ để hệ thống kích hoạt suất
              giao hàng cho khu vực tương ứng.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  Chi nhánh <span className="text-red-500">*</span>
                </label>
                <select
                  ref={setFieldRef("branchId")}
                  name="branchId"
                  value={formData.branchId}
                  onChange={handleChange}
                  className={`w-full border rounded-lg p-2.5 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all ${
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
                  <p className="text-xs text-red-600 mt-1.5">
                    {errors.branchId}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  Khung giờ hệ thống <span className="text-red-500">*</span>
                </label>
                <select
                  ref={setFieldRef("deliveryTimeSlotId")}
                  name="deliveryTimeSlotId"
                  value={formData.deliveryTimeSlotId}
                  onChange={handleChange}
                  className={`w-full border rounded-lg p-2.5 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all ${
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
                {errors.deliveryTimeSlotId && (
                  <p className="text-xs text-red-600 mt-1.5">
                    {errors.deliveryTimeSlotId}
                  </p>
                )}
              </div>
            </div>

            <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900 dark:bg-blue-900/30 dark:border-blue-800 dark:text-blue-300">
              <div className="flex flex-wrap items-center gap-2 font-medium">
                <Store className="h-4 w-4" />{" "}
                {selectedBranch?.name || "Chưa chọn chi nhánh"}{" "}
                <ArrowRight className="h-4 w-4" />{" "}
                <Clock3 className="h-4 w-4" />{" "}
                {selectedSlot?.label || "Chưa chọn khung giờ"}
              </div>
              <p className="mt-2 text-blue-800/80 dark:text-blue-300/80 font-medium">
                Thời gian hoạt động: {timeRange(selectedSlot)}
              </p>
            </div>
          </Card>

          {/* Section 2: Ghi đè & Trạng thái */}
          <Card className="border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-100 dark:border-gray-700">
              <TimerReset className="w-5 h-5 text-gray-400" />
              <h2 className="text-lg font-bold text-gray-800 dark:text-white">
                2. Thiết lập ghi đè (Override)
              </h2>
            </div>

            <p className="text-sm text-gray-600 dark:text-gray-400 mb-5">
              Nếu chi nhánh có năng lực vận hành khác biệt, bạn có thể thiết lập
              giới hạn riêng tại đây. Bỏ trống để sử dụng thiết lập gốc của hệ
              thống.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  Ghi đè giới hạn đơn tối đa
                </label>
                <input
                  ref={setFieldRef("maxOrdersOverride")}
                  type="number"
                  min="0"
                  step="1"
                  name="maxOrdersOverride"
                  value={formData.maxOrdersOverride}
                  onChange={handleChange}
                  placeholder="Bỏ trống để dùng mặc định hệ thống"
                  className={`w-full border rounded-lg p-2.5 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all ${
                    errors.maxOrdersOverride
                      ? "border-red-500"
                      : "border-gray-300 dark:border-gray-600"
                  }`}
                />
                <div className="text-xs font-medium text-blue-600 mt-1.5 bg-blue-50 p-1.5 rounded w-fit">
                  Áp dụng:{" "}
                  {formatMax(
                    formData.maxOrdersOverride || selectedSlot?.maxOrders,
                  )}
                </div>
                {errors.maxOrdersOverride && (
                  <p className="text-xs text-red-600 mt-1.5">
                    {errors.maxOrdersOverride}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  Trạng thái hoạt động
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg p-2.5 bg-white dark:bg-gray-800 text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="active">Đang bật</option>
                  <option value="inactive">Tạm dừng</option>
                </select>
              </div>
            </div>
          </Card>

          {/* Section 3: Ảnh hưởng thay đổi */}
          <Card
            className={
              impacts.length
                ? "border-amber-200"
                : "border-gray-200 dark:border-gray-700"
            }
          >
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-100 dark:border-gray-700">
              <ShieldAlert
                className={`w-5 h-5 ${
                  impacts.length ? "text-amber-500" : "text-gray-400"
                }`}
              />
              <h2 className="text-lg font-bold text-gray-800 dark:text-white">
                3. Ảnh hưởng khi thay đổi
              </h2>
            </div>

            {impacts.length === 0 ? (
              <div className="text-sm text-gray-500">
                Chưa có thay đổi nào so với dữ liệu ban đầu.
              </div>
            ) : (
              <div className="space-y-3">
                {impacts.map((note, index) => (
                  <div
                    key={index}
                    className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800"
                  >
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                      <span>{note}</span>
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
                <Info className="w-5 h-5" /> Tóm tắt Live Preview
              </div>

              <div className="space-y-4 text-sm">
                <div>
                  <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                    Chi nhánh
                  </div>
                  <div className="font-bold text-gray-900 dark:text-white">
                    {selectedBranch?.name || "—"}
                  </div>
                </div>

                <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                  <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                    Khung giờ áp dụng
                  </div>
                  <div className="font-bold text-gray-900 dark:text-white">
                    {selectedSlot?.label || "—"}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {timeRange(selectedSlot)}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                  <div>
                    <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                      Giới hạn áp dụng
                    </div>
                    <div className="font-bold text-gray-900 dark:text-white">
                      {formatMax(
                        formData.maxOrdersOverride || selectedSlot?.maxOrders,
                      )}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                      Mặc định gốc
                    </div>
                    <div className="font-bold text-gray-500">
                      {formatMax(selectedSlot?.maxOrders)}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                  <div>
                    <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                      Trạng thái
                    </div>
                    <div className="font-bold text-gray-900 dark:text-white">
                      {formData.status === "active" ? "Hoạt động" : "Tạm dừng"}
                    </div>
                  </div>
                  {detail?.createdAt && (
                    <div>
                      <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                        Ngày tạo
                      </div>
                      <div className="text-xs text-gray-500 font-medium">
                        {new Date(detail.createdAt).toLocaleDateString("vi-VN")}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </Card>

            <Card className="bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
              <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200 mb-3 flex items-center gap-2">
                <ArrowRight className="w-4 h-4" /> Hành động tiếp theo
              </h3>
              <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed mb-4">
                Sau khi lưu, bạn có thể kiểm tra trực tiếp sức chứa trên bảng
                điều phối (capacity planner) hoặc tạo một khung giờ chi nhánh
                tương tự.
              </p>

              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() =>
                    navigate(
                      `/admin/shipping/branch-delivery-slot-capacities?branchId=${formData.branchId}`,
                    )
                  }
                  className="flex w-full items-center justify-between rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2.5 text-left text-[13px] font-medium text-gray-700 dark:text-gray-200 hover:border-blue-300 hover:text-blue-600 transition"
                >
                  <span className="flex items-center gap-2">
                    <CalendarDays className="w-4 h-4" /> Mở capacity planner chi
                    nhánh
                  </span>
                  <ArrowRight className="h-3.5 w-3.5 opacity-50" />
                </button>
                <button
                  type="button"
                  onClick={() =>
                    navigate(
                      `/admin/shipping/branch-delivery-time-slots/create?branchId=${formData.branchId}&deliveryTimeSlotId=${formData.deliveryTimeSlotId}`,
                    )
                  }
                  className="flex w-full items-center justify-between rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2.5 text-left text-[13px] font-medium text-gray-700 dark:text-gray-200 hover:border-blue-300 hover:text-blue-600 transition"
                >
                  <span className="flex items-center gap-2">
                    <Copy className="w-4 h-4" /> Tạo bản ghi tương tự
                  </span>
                  <ArrowRight className="h-3.5 w-3.5 opacity-50" />
                </button>
              </div>
            </Card>

            {isStatusChanged && (
              <Card className="bg-amber-50 border border-amber-200">
                <h3 className="text-sm font-bold text-amber-800 mb-3 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" /> Trạng thái đã đổi
                </h3>
                <p className="text-xs text-amber-700 leading-relaxed">
                  Bạn đang thay đổi trạng thái của khung giờ chi nhánh này. Hãy
                  lưu để cập nhật hệ thống, hoặc dùng nút bật / tắt nhanh ở
                  thanh hành động dưới cùng.
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
              {formData?.status === "active" ? "Tạm dừng" : "Bật lại"}
            </button>

            <button
              type="button"
              onClick={() => navigate(-1)}
              className="flex-1 sm:flex-none px-6 py-2.5 rounded-lg font-medium bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-200 transition-colors"
            >
              Hủy
            </button>

            <button
              onClick={handleSubmit}
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

export default BranchDeliveryTimeSlotEditPage;
