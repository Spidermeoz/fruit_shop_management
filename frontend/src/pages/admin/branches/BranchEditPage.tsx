import React, {
  useEffect,
  useMemo,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Loader2, Save } from "lucide-react";
import Card from "../../../components/admin/layouts/Card";
import { http } from "../../../services/http";
import { useAdminToast } from "../../../context/AdminToastContext";

interface BranchFormData {
  id?: number;
  name: string;
  code: string;
  phone: string;
  email: string;
  addressLine1: string;
  addressLine2: string;
  ward: string;
  district: string;
  province: string;
  latitude: string;
  longitude: string;
  openTime: string;
  closeTime: string;
  supportsPickup: boolean;
  supportsDelivery: boolean;
  status: "active" | "inactive";
  createdAt?: string;
  updatedAt?: string;
}

type ApiDetail<T> = { success: true; data: T; meta?: any };

const toFormData = (data: any): BranchFormData => ({
  id: data.id,
  name: data.name ?? "",
  code: data.code ?? "",
  phone: data.phone ?? "",
  email: data.email ?? "",
  addressLine1: data.addressLine1 ?? "",
  addressLine2: data.addressLine2 ?? "",
  ward: data.ward ?? "",
  district: data.district ?? "",
  province: data.province ?? "",
  latitude:
    data.latitude !== null && data.latitude !== undefined
      ? String(data.latitude)
      : "",
  longitude:
    data.longitude !== null && data.longitude !== undefined
      ? String(data.longitude)
      : "",
  openTime: data.openTime ?? "",
  closeTime: data.closeTime ?? "",
  supportsPickup: !!data.supportsPickup,
  supportsDelivery: !!data.supportsDelivery,
  status: data.status ?? "active",
  createdAt: data.createdAt,
  updatedAt: data.updatedAt,
});

const BranchEditPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showSuccessToast, showErrorToast } = useAdminToast();

  const [formData, setFormData] = useState<BranchFormData | null>(null);
  const [initialData, setInitialData] = useState<BranchFormData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const previewAddress = useMemo(() => {
    if (!formData) return "";
    return [
      formData.addressLine1,
      formData.addressLine2,
      formData.ward,
      formData.district,
      formData.province,
    ]
      .filter(Boolean)
      .join(", ");
  }, [formData]);

  const isDirty = useMemo(() => {
    if (!formData || !initialData) return false;
    return JSON.stringify(formData) !== JSON.stringify(initialData);
  }, [formData, initialData]);

  const fetchDetail = async () => {
    try {
      setLoading(true);
      const res = await http<ApiDetail<any>>(
        "GET",
        `/api/v1/admin/branches/edit/${id}`,
      );

      if (res?.success && res.data) {
        const mapped = toFormData(res.data);
        setFormData(mapped);
        setInitialData(mapped);
      } else {
        showErrorToast("Không thể tải dữ liệu chi nhánh.");
      }
    } catch (err: any) {
      console.error(err);
      showErrorToast(err?.message || "Lỗi tải dữ liệu chi nhánh.");
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

    const { name, value, type } = e.target;

    if (type === "checkbox") {
      const target = e.target as HTMLInputElement;
      setFormData((prev) =>
        prev ? { ...prev, [name]: target.checked } : prev,
      );
    } else {
      const nextValue = name === "code" ? value.toUpperCase() : value;
      setFormData((prev) => (prev ? { ...prev, [name]: nextValue } : prev));
    }

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validateForm = () => {
    if (!formData) return false;

    const nextErrors: Record<string, string> = {};

    if (!formData.name.trim()) nextErrors.name = "Vui lòng nhập tên chi nhánh.";
    if (!formData.code.trim()) nextErrors.code = "Vui lòng nhập mã chi nhánh.";

    if (formData.email.trim()) {
      const ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim());
      if (!ok) nextErrors.email = "Email không hợp lệ.";
    }

    if (formData.phone.trim()) {
      const ok = /^(\+84|0)\d{9,10}$/.test(formData.phone.trim());
      if (!ok) nextErrors.phone = "Số điện thoại không hợp lệ.";
    }

    if (
      formData.latitude.trim() &&
      !Number.isFinite(Number(formData.latitude.trim()))
    ) {
      nextErrors.latitude = "Vĩ độ không hợp lệ.";
    }

    if (
      formData.longitude.trim() &&
      !Number.isFinite(Number(formData.longitude.trim()))
    ) {
      nextErrors.longitude = "Kinh độ không hợp lệ.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    if (!formData) return;
    if (!validateForm()) return;

    try {
      setSaving(true);

      const payload = {
        name: formData.name.trim(),
        code: formData.code.trim().toUpperCase(),
        phone: formData.phone.trim() || null,
        email: formData.email.trim() || null,
        addressLine1: formData.addressLine1.trim() || null,
        addressLine2: formData.addressLine2.trim() || null,
        ward: formData.ward.trim() || null,
        district: formData.district.trim() || null,
        province: formData.province.trim() || null,
        latitude: formData.latitude.trim()
          ? Number(formData.latitude.trim())
          : null,
        longitude: formData.longitude.trim()
          ? Number(formData.longitude.trim())
          : null,
        openTime: formData.openTime || null,
        closeTime: formData.closeTime || null,
        supportsPickup: formData.supportsPickup,
        supportsDelivery: formData.supportsDelivery,
        status: formData.status,
      };

      const res = await http<any>(
        "PATCH",
        `/api/v1/admin/branches/edit/${formData.id}`,
        payload,
      );

      if (res?.success) {
        showSuccessToast({ message: "Cập nhật chi nhánh thành công!" });
        navigate("/admin/branches");
      } else {
        showErrorToast(res?.message || "Cập nhật chi nhánh thất bại.");
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
          Chỉnh sửa chi nhánh
        </h1>
        <button
          onClick={() => navigate("/admin/branches")}
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
                Tên chi nhánh <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className={`w-full border rounded-md p-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white ${
                  errors.name
                    ? "border-red-500 dark:border-red-500"
                    : "border-gray-300 dark:border-gray-600"
                }`}
              />
              {errors.name && (
                <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                  {errors.name}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Mã chi nhánh <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="code"
                value={formData.code}
                onChange={handleChange}
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
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Số điện thoại
              </label>
              <input
                type="text"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className={`w-full border rounded-md p-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white ${
                  errors.phone
                    ? "border-red-500 dark:border-red-500"
                    : "border-gray-300 dark:border-gray-600"
                }`}
              />
              {errors.phone && (
                <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                  {errors.phone}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Email
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={`w-full border rounded-md p-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white ${
                  errors.email
                    ? "border-red-500 dark:border-red-500"
                    : "border-gray-300 dark:border-gray-600"
                }`}
              />
              {errors.email && (
                <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                  {errors.email}
                </p>
              )}
            </div>
          </div>

          <div className="grid gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Địa chỉ dòng 1
              </label>
              <input
                type="text"
                name="addressLine1"
                value={formData.addressLine1}
                onChange={handleChange}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-md p-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Địa chỉ dòng 2
              </label>
              <input
                type="text"
                name="addressLine2"
                value={formData.addressLine2}
                onChange={handleChange}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-md p-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Phường / Xã
              </label>
              <input
                type="text"
                name="ward"
                value={formData.ward}
                onChange={handleChange}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-md p-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Quận / Huyện
              </label>
              <input
                type="text"
                name="district"
                value={formData.district}
                onChange={handleChange}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-md p-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Tỉnh / Thành phố
              </label>
              <input
                type="text"
                name="province"
                value={formData.province}
                onChange={handleChange}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-md p-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              />
            </div>
          </div>

          <div className="rounded-lg border border-dashed border-gray-300 dark:border-gray-600 p-4 bg-gray-50 dark:bg-gray-800/40">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Xem trước địa chỉ:
            </p>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              {previewAddress || "Chưa có địa chỉ"}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Latitude
              </label>
              <input
                type="text"
                name="latitude"
                value={formData.latitude}
                onChange={handleChange}
                className={`w-full border rounded-md p-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white ${
                  errors.latitude
                    ? "border-red-500 dark:border-red-500"
                    : "border-gray-300 dark:border-gray-600"
                }`}
              />
              {errors.latitude && (
                <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                  {errors.latitude}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Longitude
              </label>
              <input
                type="text"
                name="longitude"
                value={formData.longitude}
                onChange={handleChange}
                className={`w-full border rounded-md p-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white ${
                  errors.longitude
                    ? "border-red-500 dark:border-red-500"
                    : "border-gray-300 dark:border-gray-600"
                }`}
              />
              {errors.longitude && (
                <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                  {errors.longitude}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Giờ mở cửa
              </label>
              <input
                type="time"
                name="openTime"
                value={formData.openTime}
                onChange={handleChange}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-md p-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Giờ đóng cửa
              </label>
              <input
                type="time"
                name="closeTime"
                value={formData.closeTime}
                onChange={handleChange}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-md p-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Trạng thái
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-md p-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              >
                <option value="active">Hoạt động</option>
                <option value="inactive">Tạm dừng</option>
              </select>
            </div>

            <label className="flex items-center gap-3 h-10">
              <input
                type="checkbox"
                name="supportsPickup"
                checked={formData.supportsPickup}
                onChange={handleChange}
                className="h-4 w-4"
              />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Hỗ trợ pickup
              </span>
            </label>

            <label className="flex items-center gap-3 h-10">
              <input
                type="checkbox"
                name="supportsDelivery"
                checked={formData.supportsDelivery}
                onChange={handleChange}
                className="h-4 w-4"
              />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Hỗ trợ delivery
              </span>
            </label>
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
                onClick={() => navigate("/admin/branches")}
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

export default BranchEditPage;
