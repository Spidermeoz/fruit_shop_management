import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2 } from "lucide-react";
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

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
          Thêm capacity giao hàng
        </h1>
        <button
          onClick={() =>
            navigate("/admin/shipping/branch-delivery-slot-capacities")
          }
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-md transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Quay lại
        </button>
      </div>

      <Card>
        <form onSubmit={handleSubmit} className="space-y-6 p-2">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Chi nhánh <span className="text-red-500">*</span>
              </label>
              <select
                ref={setFieldRef("branchId")}
                name="branchId"
                value={formData.branchId}
                onChange={handleChange}
                disabled={bootstrapLoading}
                className={`w-full border rounded-md p-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white disabled:opacity-60 ${
                  errors.branchId
                    ? "border-red-500 dark:border-red-500"
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
                <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                  {errors.branchId}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Ngày giao <span className="text-red-500">*</span>
              </label>
              <input
                ref={setFieldRef("deliveryDate")}
                type="date"
                name="deliveryDate"
                value={formData.deliveryDate}
                onChange={handleChange}
                className={`w-full border rounded-md p-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white ${
                  errors.deliveryDate
                    ? "border-red-500 dark:border-red-500"
                    : "border-gray-300 dark:border-gray-600"
                }`}
              />
              {errors.deliveryDate && (
                <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                  {errors.deliveryDate}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Khung giờ giao hàng <span className="text-red-500">*</span>
              </label>
              <select
                ref={setFieldRef("deliveryTimeSlotId")}
                name="deliveryTimeSlotId"
                value={formData.deliveryTimeSlotId}
                onChange={handleChange}
                disabled={bootstrapLoading}
                className={`w-full border rounded-md p-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white disabled:opacity-60 ${
                  errors.deliveryTimeSlotId
                    ? "border-red-500 dark:border-red-500"
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
                <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                  {errors.deliveryTimeSlotId}
                </p>
              )}
            </div>
          </div>

          <div className="rounded-lg border border-dashed border-gray-300 dark:border-gray-600 p-4 bg-gray-50 dark:bg-gray-800/40">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Xem trước cấu hình:
            </p>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              {selectedBranch?.name || "Chưa chọn chi nhánh"} →{" "}
              {selectedSlot?.label || "Chưa chọn khung giờ"} →{" "}
              {formData.deliveryDate || "Chưa chọn ngày"}
            </p>
            {selectedSlot && (
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                {String(selectedSlot.startTime).slice(0, 5)} -{" "}
                {String(selectedSlot.endTime).slice(0, 5)}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Max orders
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
            Reserved orders sẽ được hệ thống cập nhật tự động trong quá trình
            đặt hàng. Ở màn tạo mới này chỉ cần cấu hình max orders và trạng
            thái.
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() =>
                navigate("/admin/shipping/branch-delivery-slot-capacities")
              }
              className="px-4 py-2 rounded-md bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-white transition-colors"
            >
              Hủy
            </button>

            <button
              type="submit"
              disabled={loading || bootstrapLoading}
              className="px-5 py-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white transition-colors disabled:opacity-60 disabled:cursor-not-allowed inline-flex items-center gap-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Tạo capacity
            </button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default BranchDeliverySlotCapacityCreatePage;
