import React, {
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
  MapPin,
  Tag,
  Truck,
  CreditCard,
  Globe,
  Info,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
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

  const areaInfo = useMemo(() => {
    if (!formData.province && !formData.district && !formData.ward) {
      return {
        text: "Zone mặc định / fallback",
        detail: "Áp dụng cho mọi địa chỉ không khớp với zone khác",
      };
    }
    if (formData.ward) {
      return {
        text: [formData.ward, formData.district, formData.province]
          .filter(Boolean)
          .join(", "),
        detail: "Áp dụng theo phường/xã cụ thể",
      };
    }
    if (formData.district) {
      return {
        text: [formData.district, formData.province].filter(Boolean).join(", "),
        detail: "Áp dụng theo quận/huyện",
      };
    }
    if (formData.province) {
      return {
        text: formData.province,
        detail: "Áp dụng theo tỉnh/thành",
      };
    }
    return {
      text: "Zone mặc định / fallback",
      detail: "Áp dụng cho mọi địa chỉ không khớp với zone khác",
    };
  }, [formData]);

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
    <div className="max-w-5xl mx-auto pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-white">
            Thêm vùng giao hàng
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1.5">
            Tạo vùng mới để hệ thống match địa chỉ giao hàng và tính phí phù
            hợp.
          </p>
        </div>
        <button
          onClick={() => navigate("/admin/shipping/zones")}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" /> Quay lại
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: Thông tin định danh */}
        <Card>
          <div className="border-b border-gray-100 dark:border-gray-700 pb-4 mb-4">
            <h2 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
              <Tag className="w-5 h-5 text-gray-400" /> Thông tin định danh
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Tên gọi và mã phân biệt của vùng giao hàng này.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Tên vùng <span className="text-red-500">*</span>
              </label>
              <input
                ref={setFieldRef("name")}
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="VD: Nội thành Hà Nội"
                className={`w-full border rounded-lg p-2.5 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition-shadow ${
                  errors.name
                    ? "border-red-500"
                    : "border-gray-300 dark:border-gray-600"
                }`}
              />
              {errors.name && (
                <p className="text-sm text-red-600 mt-1.5 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" /> {errors.name}
                </p>
              )}
            </div>

            <div className="md:col-span-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Mã vùng <span className="text-red-500">*</span>
              </label>
              <input
                ref={setFieldRef("code")}
                type="text"
                name="code"
                value={formData.code}
                onChange={handleChange}
                placeholder="VD: HN_INNER"
                className={`w-full border rounded-lg p-2.5 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition-shadow uppercase ${
                  errors.code
                    ? "border-red-500"
                    : "border-gray-300 dark:border-gray-600"
                }`}
              />
              <p className="text-[13px] text-gray-500 mt-1.5">
                Nên ngắn gọn, dễ đọc, viết hoa.
              </p>
              {errors.code && (
                <p className="text-sm text-red-600 mt-1.5 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" /> {errors.code}
                </p>
              )}
            </div>

            <div className="md:col-span-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Trạng thái hoạt động
              </label>
              <select
                ref={setFieldRef("status")}
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg p-2.5 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option value="active">Hoạt động (Áp dụng ngay)</option>
                <option value="inactive">Tạm dừng (Bỏ qua zone này)</option>
              </select>
            </div>
          </div>
        </Card>

        {/* Section 2: Khu vực áp dụng */}
        <Card>
          <div className="border-b border-gray-100 dark:border-gray-700 pb-4 mb-4">
            <h2 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
              <MapPin className="w-5 h-5 text-gray-400" /> Khu vực áp dụng
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Xác định phạm vi địa lý mà mức phí này được áp dụng. Để trống nếu
              muốn áp dụng làm mức phí mặc định.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Tỉnh / Thành phố
              </label>
              <select
                ref={setFieldRef("province")}
                name="province"
                value={formData.province}
                onFocus={() => void loadCities()}
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
                className={`w-full border rounded-lg p-2.5 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none ${
                  errors.province
                    ? "border-red-500"
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
                <p className="text-sm text-red-600 mt-1.5">{errors.province}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Quận / Huyện
              </label>
              <select
                ref={setFieldRef("district")}
                name="district"
                value={formData.district}
                disabled={!formData.province}
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
                className={`w-full border rounded-lg p-2.5 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:bg-gray-100 disabled:opacity-70 ${
                  errors.district
                    ? "border-red-500"
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
                <p className="text-sm text-red-600 mt-1.5">{errors.district}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Phường / Xã
              </label>
              <select
                ref={setFieldRef("ward")}
                name="ward"
                value={formData.ward}
                disabled={!formData.district}
                onChange={(e) => {
                  setFormData((prev) => ({ ...prev, ward: e.target.value }));

                  if (errors.ward) {
                    setErrors((prev) => ({ ...prev, ward: "" }));
                  }
                }}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg p-2.5 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:bg-gray-100 disabled:opacity-70"
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

          <div className="rounded-lg border border-blue-100 dark:border-blue-900/50 bg-blue-50/50 dark:bg-blue-900/10 p-4 flex gap-4">
            <div className="mt-0.5">
              {!formData.province && !formData.district && !formData.ward ? (
                <Globe className="w-5 h-5 text-gray-500" />
              ) : (
                <CheckCircle2 className="w-5 h-5 text-blue-500" />
              )}
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
                Kết quả áp dụng: {areaInfo.text}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Lưu ý: {areaInfo.detail}.
              </p>
            </div>
          </div>
        </Card>

        {/* Section 3: Cấu hình vận chuyển */}
        <Card>
          <div className="border-b border-gray-100 dark:border-gray-700 pb-4 mb-4">
            <h2 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
              <Truck className="w-5 h-5 text-gray-400" /> Cấu hình phí & Ưu tiên
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Thiết lập mức phí, điều kiện miễn phí vận chuyển và độ ưu tiên
              chồng lấn.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Phí giao hàng cơ bản (VNĐ){" "}
                <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <CreditCard className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <input
                  ref={setFieldRef("baseFee")}
                  type="number"
                  min="0"
                  step="1000"
                  name="baseFee"
                  value={formData.baseFee}
                  onChange={handleChange}
                  className={`w-full pl-10 pr-4 py-2.5 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none ${
                    errors.baseFee
                      ? "border-red-500"
                      : "border-gray-300 dark:border-gray-600"
                  }`}
                />
              </div>
              <p className="text-[13px] text-gray-500 mt-1.5">
                Phí giao hàng cơ bản áp dụng cho zone này.
              </p>
              {errors.baseFee && (
                <p className="text-sm text-red-600 mt-1.5">{errors.baseFee}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Ngưỡng Freeship (VNĐ)
              </label>
              <div className="relative">
                <Tag className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <input
                  ref={setFieldRef("freeShipThreshold")}
                  type="number"
                  min="0"
                  step="1000"
                  name="freeShipThreshold"
                  value={formData.freeShipThreshold}
                  onChange={handleChange}
                  placeholder="Bỏ trống nếu không có"
                  className={`w-full pl-10 pr-4 py-2.5 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none ${
                    errors.freeShipThreshold
                      ? "border-red-500"
                      : "border-gray-300 dark:border-gray-600"
                  }`}
                />
              </div>
              <p className="text-[13px] text-gray-500 mt-1.5">
                Để trống nếu zone không có freeship.
              </p>
              {errors.freeShipThreshold && (
                <p className="text-sm text-red-600 mt-1.5">
                  {errors.freeShipThreshold}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Độ ưu tiên <span className="text-red-500">*</span>
              </label>
              <input
                ref={setFieldRef("priority")}
                type="number"
                step="1"
                name="priority"
                value={formData.priority}
                onChange={handleChange}
                className={`w-full border rounded-lg p-2.5 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none ${
                  errors.priority
                    ? "border-red-500"
                    : "border-gray-300 dark:border-gray-600"
                }`}
              />
              <p className="text-[13px] text-gray-500 mt-1.5 flex items-start gap-1">
                <Info className="w-4 h-4 shrink-0 mt-0.5" />
                Số càng nhỏ càng được ưu tiên match trước.
              </p>
              {errors.priority && (
                <p className="text-sm text-red-600 mt-1.5">{errors.priority}</p>
              )}
            </div>
          </div>
        </Card>

        {/* Action Bar */}
        <div className="fixed bottom-0 left-0 right-0 md:left-64 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 p-4 shadow-lg z-10">
          <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-end gap-4">
            <div className="flex gap-3 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => navigate("/admin/shipping/zones")}
                className="flex-1 sm:flex-none px-6 py-2.5 rounded-lg font-medium bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-200 transition-colors"
              >
                Quay lại
              </button>

              <button
                type="submit"
                disabled={loading}
                className="flex-1 sm:flex-none px-6 py-2.5 rounded-lg font-medium bg-blue-600 hover:bg-blue-700 text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-sm"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" /> Đang xử lý...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" /> Tạo vùng giao hàng
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

export default ShippingZoneCreatePage;
