import React, {
  useMemo,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2 } from "lucide-react";
import Card from "../../../components/admin/layouts/Card";
import { http } from "../../../services/http";
import { useAdminToast } from "../../../context/AdminToastContext";

interface BranchFormData {
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
}

interface LocationItem {
  name: string;
  code: number;
}

const initialForm: BranchFormData = {
  name: "",
  code: "",
  phone: "",
  email: "",
  addressLine1: "",
  addressLine2: "",
  ward: "",
  district: "",
  province: "",
  latitude: "",
  longitude: "",
  openTime: "08:00",
  closeTime: "21:00",
  supportsPickup: true,
  supportsDelivery: true,
  status: "active",
};

const BranchCreatePage: React.FC = () => {
  const navigate = useNavigate();
  const { showSuccessToast, showErrorToast } = useAdminToast();

  const [formData, setFormData] = useState<BranchFormData>(initialForm);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [cities, setCities] = useState<LocationItem[]>([]);
  const [districts, setDistricts] = useState<LocationItem[]>([]);
  const [wards, setWards] = useState<LocationItem[]>([]);
  const [cityLoaded, setCityLoaded] = useState(false);

  const previewAddress = useMemo(
    () =>
      [
        formData.addressLine1,
        formData.addressLine2,
        formData.ward,
        formData.district,
        formData.province,
      ]
        .filter(Boolean)
        .join(", "),
    [formData],
  );

  const loadCities = async () => {
    if (cityLoaded) return;

    const res = await fetch("https://provinces.open-api.vn/api/p/");
    const data = await res.json();
    setCities(data);
    setCityLoaded(true);
  };

  const loadDistricts = async (cityCode: number) => {
    const res = await fetch(
      `https://provinces.open-api.vn/api/p/${cityCode}?depth=2`,
    );
    const data = await res.json();
    setDistricts(data.districts || []);
  };

  const loadWards = async (districtCode: number) => {
    const res = await fetch(
      `https://provinces.open-api.vn/api/d/${districtCode}?depth=2`,
    );
    const data = await res.json();
    setWards(data.wards || []);
  };

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value, type } = e.target;

    if (type === "checkbox") {
      const target = e.target as HTMLInputElement;
      setFormData((prev) => ({ ...prev, [name]: target.checked }));
    } else {
      const nextValue = name === "code" ? value.toUpperCase() : value;
      setFormData((prev) => ({ ...prev, [name]: nextValue }));
    }

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validateForm = () => {
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

    if (formData.supportsDelivery) {
      if (!formData.addressLine1.trim()) {
        nextErrors.addressLine1 = "Chi nhánh giao hàng phải có địa chỉ dòng 1.";
      }

      if (!formData.province.trim()) {
        nextErrors.province = "Chi nhánh giao hàng phải có tỉnh/thành phố.";
      }

      if (!formData.district.trim()) {
        nextErrors.district = "Chi nhánh giao hàng phải có quận/huyện.";
      }
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

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      setLoading(true);

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
        "POST",
        "/api/v1/admin/branches/create",
        payload,
      );

      if (res?.success) {
        showSuccessToast({ message: "Tạo chi nhánh thành công!" });
        navigate("/admin/branches");
      } else {
        showErrorToast(res?.message || "Tạo chi nhánh thất bại.");
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
          Thêm chi nhánh
        </h1>
        <button
          onClick={() => navigate("/admin/branches")}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-md transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Quay lại
        </button>
      </div>

      <Card>
        <form onSubmit={handleSubmit} className="space-y-6 p-2">
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
                placeholder="Nhập tên chi nhánh..."
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
                placeholder="VD: Q1, TD, MAIN..."
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
                placeholder="Nhập số điện thoại..."
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
                placeholder="Nhập email..."
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

          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Địa chỉ dòng 1
              </label>
              <input
                type="text"
                name="addressLine1"
                value={formData.addressLine1}
                onChange={handleChange}
                placeholder="Số nhà, tên đường..."
                className={`w-full border rounded-md p-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white ${
                  errors.addressLine1
                    ? "border-red-500 dark:border-red-500"
                    : "border-gray-300 dark:border-gray-600"
                }`}
              />
              {errors.addressLine1 && (
                <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                  {errors.addressLine1}
                </p>
              )}
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
                placeholder="Tòa nhà, tầng, ghi chú..."
                className="w-full border border-gray-300 dark:border-gray-600 rounded-md p-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Tỉnh / Thành phố{" "}
                {formData.supportsDelivery && (
                  <span className="text-red-500">*</span>
                )}
              </label>
              <select
                name="province"
                value={formData.province}
                onFocus={loadCities}
                onChange={async (e) => {
                  const provinceName = e.target.value;
                  const city = cities.find((c) => c.name === provinceName);

                  setFormData((prev) => ({
                    ...prev,
                    province: provinceName,
                    district: "",
                    ward: "",
                  }));

                  setDistricts([]);
                  setWards([]);

                  if (errors.province || errors.district || errors.ward) {
                    setErrors((prev) => ({
                      ...prev,
                      province: "",
                      district: "",
                      ward: "",
                    }));
                  }

                  if (city) {
                    await loadDistricts(city.code);
                  }
                }}
                className={`w-full border rounded-md p-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white ${
                  errors.province
                    ? "border-red-500 dark:border-red-500"
                    : "border-gray-300 dark:border-gray-600"
                }`}
              >
                <option value="">Chọn tỉnh / thành phố</option>
                {cities.map((city) => (
                  <option key={city.code} value={city.name}>
                    {city.name}
                  </option>
                ))}
              </select>
              {errors.province && (
                <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                  {errors.province}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Quận / Huyện{" "}
                {formData.supportsDelivery && (
                  <span className="text-red-500">*</span>
                )}
              </label>
              <select
                name="district"
                value={formData.district}
                onChange={async (e) => {
                  const districtName = e.target.value;
                  const district = districts.find(
                    (d) => d.name === districtName,
                  );

                  setFormData((prev) => ({
                    ...prev,
                    district: districtName,
                    ward: "",
                  }));

                  setWards([]);

                  if (errors.district || errors.ward) {
                    setErrors((prev) => ({
                      ...prev,
                      district: "",
                      ward: "",
                    }));
                  }

                  if (district) {
                    await loadWards(district.code);
                  }
                }}
                className={`w-full border rounded-md p-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white ${
                  errors.district
                    ? "border-red-500 dark:border-red-500"
                    : "border-gray-300 dark:border-gray-600"
                }`}
              >
                <option value="">Chọn quận / huyện</option>
                {districts.map((district) => (
                  <option key={district.code} value={district.name}>
                    {district.name}
                  </option>
                ))}
              </select>
              {errors.district && (
                <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                  {errors.district}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Phường / Xã
              </label>
              <select
                name="ward"
                value={formData.ward}
                onChange={(e) => {
                  setFormData((prev) => ({ ...prev, ward: e.target.value }));

                  if (errors.ward) {
                    setErrors((prev) => ({ ...prev, ward: "" }));
                  }
                }}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-md p-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              >
                <option value="">Chọn phường / xã</option>
                {wards.map((ward) => (
                  <option key={ward.code} value={ward.name}>
                    {ward.name}
                  </option>
                ))}
              </select>
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
                placeholder="VD: 10.776889"
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
                placeholder="VD: 106.700806"
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

          <div className="rounded-lg bg-amber-50 dark:bg-amber-900/20 p-4 text-sm text-amber-700 dark:text-amber-300">
            Latitude / Longitude hiện có thể nhập thủ công. Nếu chưa có tọa độ,
            bạn vẫn có thể lưu chi nhánh; hệ thống hiện ưu tiên tính phí ship
            theo vùng phục vụ và địa chỉ hành chính.
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

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => navigate("/admin/branches")}
              className="px-4 py-2 rounded-md bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-white transition-colors"
            >
              Hủy
            </button>

            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white transition-colors disabled:opacity-60 disabled:cursor-not-allowed inline-flex items-center gap-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Tạo chi nhánh
            </button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default BranchCreatePage;
