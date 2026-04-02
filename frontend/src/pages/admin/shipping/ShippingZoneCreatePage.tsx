import React, {
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

interface ShippingZoneFormData {
  code: string;
  name: string;
  province: string;
  district: string;
  ward: string;
  baseFee: string;
  freeShipThreshold: string;
  priority: string;
  status: "active" | "inactive";
}

interface LocationItem {
  name: string;
  code: number;
}

const initialForm: ShippingZoneFormData = {
  code: "",
  name: "",
  province: "",
  district: "",
  ward: "",
  baseFee: "0",
  freeShipThreshold: "",
  priority: "0",
  status: "active",
};

const ShippingZoneCreatePage: React.FC = () => {
  const navigate = useNavigate();
  const { showSuccessToast, showErrorToast } = useAdminToast();

  const [formData, setFormData] = useState<ShippingZoneFormData>(initialForm);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const fieldRefs = useRef<
    Record<string, HTMLInputElement | HTMLSelectElement | null>
  >({});

  const [cities, setCities] = useState<LocationItem[]>([]);
  const [districts, setDistricts] = useState<LocationItem[]>([]);
  const [wards, setWards] = useState<LocationItem[]>([]);
  const [cityLoaded, setCityLoaded] = useState(false);

  const previewArea = useMemo(
    () =>
      [formData.ward, formData.district, formData.province]
        .filter(Boolean)
        .join(", "),
    [formData],
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
    const { name, value } = e.target;
    const nextValue = name === "code" ? value.toUpperCase() : value;

    setFormData((prev) => ({ ...prev, [name]: nextValue }));

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validateForm = () => {
    const nextErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      nextErrors.name = "Vui lòng nhập tên vùng giao hàng.";
    }

    if (!formData.code.trim()) {
      nextErrors.code = "Vui lòng nhập mã vùng giao hàng.";
    }

    if (formData.ward.trim() && !formData.district.trim()) {
      nextErrors.district = "Nếu có phường/xã thì phải nhập quận/huyện.";
    }

    if (
      (formData.district.trim() || formData.ward.trim()) &&
      !formData.province.trim()
    ) {
      nextErrors.province =
        "Nếu có quận/huyện hoặc phường/xã thì phải nhập tỉnh/thành phố.";
    }

    if (formData.baseFee.trim() === "") {
      nextErrors.baseFee = "Vui lòng nhập phí giao hàng cơ bản.";
    } else {
      const baseFee = Number(formData.baseFee);
      if (!Number.isFinite(baseFee) || baseFee < 0) {
        nextErrors.baseFee = "Phí giao hàng cơ bản phải là số >= 0.";
      }
    }

    if (formData.freeShipThreshold.trim() !== "") {
      const threshold = Number(formData.freeShipThreshold);
      if (!Number.isFinite(threshold) || threshold < 0) {
        nextErrors.freeShipThreshold = "Ngưỡng freeship phải là số >= 0.";
      }
    }

    if (formData.priority.trim() === "") {
      nextErrors.priority = "Vui lòng nhập độ ưu tiên.";
    } else {
      const priority = Number(formData.priority);
      if (!Number.isInteger(priority) || priority < 0) {
        nextErrors.priority = "Độ ưu tiên phải là số nguyên >= 0.";
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
        code: formData.code.trim().toUpperCase(),
        name: formData.name.trim(),
        province: formData.province.trim() || null,
        district: formData.district.trim() || null,
        ward: formData.ward.trim() || null,
        baseFee: Number(formData.baseFee),
        freeShipThreshold:
          formData.freeShipThreshold.trim() === ""
            ? null
            : Number(formData.freeShipThreshold),
        priority: Number(formData.priority),
        status: formData.status,
      };

      const res = await http<any>(
        "POST",
        "/api/v1/admin/shipping-zones/create",
        payload,
      );

      if (res?.success) {
        showSuccessToast({ message: "Tạo vùng giao hàng thành công!" });
        navigate("/admin/shipping/zones");
      } else {
        showErrorToast(res?.message || "Tạo vùng giao hàng thất bại.");
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
          Thêm vùng giao hàng
        </h1>
        <button
          onClick={() => navigate("/admin/shipping/zones")}
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
                Tên vùng <span className="text-red-500">*</span>
              </label>
              <input
                ref={setFieldRef("name")}
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Nhập tên vùng giao hàng..."
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
                Mã vùng <span className="text-red-500">*</span>
              </label>
              <input
                ref={setFieldRef("code")}
                type="text"
                name="code"
                value={formData.code}
                onChange={handleChange}
                placeholder="VD: HCM_Q1, DN_HAI_CHAU..."
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

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Tỉnh / Thành phố
              </label>
              <select
                ref={setFieldRef("province")}
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
                Quận / Huyện
              </label>
              <select
                ref={setFieldRef("district")}
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
                ref={setFieldRef("ward")}
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
              Xem trước khu vực áp dụng:
            </p>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              {previewArea || "Vùng mặc định / toàn khu vực theo rule"}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Phí giao hàng cơ bản <span className="text-red-500">*</span>
              </label>
              <input
                ref={setFieldRef("baseFee")}
                type="number"
                min="0"
                step="1000"
                name="baseFee"
                value={formData.baseFee}
                onChange={handleChange}
                className={`w-full border rounded-md p-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white ${
                  errors.baseFee
                    ? "border-red-500 dark:border-red-500"
                    : "border-gray-300 dark:border-gray-600"
                }`}
              />
              {errors.baseFee && (
                <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                  {errors.baseFee}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Ngưỡng freeship
              </label>
              <input
                ref={setFieldRef("freeShipThreshold")}
                type="number"
                min="0"
                step="1000"
                name="freeShipThreshold"
                value={formData.freeShipThreshold}
                onChange={handleChange}
                placeholder="Để trống nếu không có"
                className={`w-full border rounded-md p-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white ${
                  errors.freeShipThreshold
                    ? "border-red-500 dark:border-red-500"
                    : "border-gray-300 dark:border-gray-600"
                }`}
              />
              {errors.freeShipThreshold && (
                <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                  {errors.freeShipThreshold}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Độ ưu tiên <span className="text-red-500">*</span>
              </label>
              <input
                ref={setFieldRef("priority")}
                type="number"
                step="1"
                name="priority"
                value={formData.priority}
                onChange={handleChange}
                className={`w-full border rounded-md p-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white ${
                  errors.priority
                    ? "border-red-500 dark:border-red-500"
                    : "border-gray-300 dark:border-gray-600"
                }`}
              />
              {errors.priority && (
                <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                  {errors.priority}
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
            Số ưu tiên càng nhỏ thì càng được match trước khi tính phí ship.
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => navigate("/admin/shipping/zones")}
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
              Tạo vùng giao hàng
            </button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default ShippingZoneCreatePage;
