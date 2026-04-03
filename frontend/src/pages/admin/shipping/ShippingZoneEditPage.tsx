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
  id?: number;
  code: string;
  name: string;
  province: string;
  district: string;
  ward: string;
  baseFee: string;
  freeShipThreshold: string;
  priority: string;
  status: "active" | "inactive";
  createdAt?: string;
  updatedAt?: string;
}

type ApiDetail<T> = { success: true; data: T; meta?: any };

interface LocationItem {
  name: string;
  code: number;
}

const toFormData = (data: any): ShippingZoneFormData => ({
  id: data.id,
  code: data.code ?? "",
  name: data.name ?? "",
  province: data.province ?? "",
  district: data.district ?? "",
  ward: data.ward ?? "",
  baseFee:
    data.baseFee !== null && data.baseFee !== undefined
      ? String(data.baseFee)
      : "0",
  freeShipThreshold:
    data.freeShipThreshold !== null && data.freeShipThreshold !== undefined
      ? String(data.freeShipThreshold)
      : "",
  priority:
    data.priority !== null && data.priority !== undefined
      ? String(data.priority)
      : "0",
  status: data.status ?? "active",
  createdAt: data.createdAt,
  updatedAt: data.updatedAt,
});

const formatCurrency = (val: string | number) => {
  const num = Number(val);
  if (isNaN(num)) return "0 đ";
  return num.toLocaleString("vi-VN") + " đ";
};

const ShippingZoneEditPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showSuccessToast, showErrorToast } = useAdminToast();

  const [formData, setFormData] = useState<ShippingZoneFormData | null>(null);
  const [initialData, setInitialData] = useState<ShippingZoneFormData | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const fieldRefs = useRef<
    Record<string, HTMLInputElement | HTMLSelectElement | null>
  >({});

  const [cities, setCities] = useState<LocationItem[]>([]);
  const [districts, setDistricts] = useState<LocationItem[]>([]);
  const [wards, setWards] = useState<LocationItem[]>([]);
  const [cityLoaded, setCityLoaded] = useState(false);

  const isDirty = useMemo(() => {
    if (!formData || !initialData) return false;
    return JSON.stringify(formData) !== JSON.stringify(initialData);
  }, [formData, initialData]);

  const areaInfo = useMemo(() => {
    if (!formData)
      return {
        text: "Zone mặc định / fallback",
        detail: "Áp dụng cho mọi địa chỉ không khớp với zone khác",
      };
    if (formData.ward) {
      return {
        text: [formData.ward, formData.district, formData.province]
          .filter(Boolean)
          .join(", "),
        detail: "Match rất cụ thể (đến phường/xã)",
      };
    }
    if (formData.district) {
      return {
        text: [formData.district, formData.province].filter(Boolean).join(", "),
        detail: "Match theo quận/huyện",
      };
    }
    if (formData.province) {
      return {
        text: formData.province,
        detail: "Match theo tỉnh/thành phố",
      };
    }
    return {
      text: "Vùng mặc định / Toàn khu vực",
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
    if (cityLoaded) return cities;
    const res = await fetch("https://provinces.open-api.vn/api/p/");
    const data = await res.json();
    setCities(data);
    setCityLoaded(true);
    return data;
  };

  const loadDistricts = async (cityCode: number) => {
    const res = await fetch(
      `https://provinces.open-api.vn/api/p/${cityCode}?depth=2`,
    );
    const data = await res.json();
    const nextDistricts = data.districts || [];
    setDistricts(nextDistricts);
    return nextDistricts;
  };

  const loadWards = async (districtCode: number) => {
    const res = await fetch(
      `https://provinces.open-api.vn/api/d/${districtCode}?depth=2`,
    );
    const data = await res.json();
    const nextWards = data.wards || [];
    setWards(nextWards);
    return nextWards;
  };

  const fetchDetail = async () => {
    try {
      setLoading(true);
      const res = await http<ApiDetail<any>>(
        "GET",
        `/api/v1/admin/shipping-zones/edit/${id}`,
      );
      if (res?.success && res.data) {
        const mapped = toFormData(res.data);
        setFormData(mapped);
        setInitialData(mapped);
      } else {
        showErrorToast("Không thể tải dữ liệu vùng giao hàng.");
      }
    } catch (err: any) {
      console.error(err);
      showErrorToast(err?.message || "Lỗi tải dữ liệu vùng giao hàng.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
  }, [id]);

  useEffect(() => {
    const syncAddressOptions = async () => {
      if (!formData) return;
      const cityList = await loadCities();
      const city = cityList.find(
        (c: LocationItem) => c.name === formData.province,
      );
      if (!city) {
        setDistricts([]);
        setWards([]);
        return;
      }
      const districtList = await loadDistricts(city.code);
      const district = districtList.find(
        (d: LocationItem) => d.name === formData.district,
      );
      if (!district) {
        setWards([]);
        return;
      }
      await loadWards(district.code);
    };
    void syncAddressOptions();
  }, [formData?.province, formData?.district]);

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    if (!formData) return;
    const { name, value } = e.target;
    const nextValue = name === "code" ? value.toUpperCase() : value;
    setFormData((prev) => (prev ? { ...prev, [name]: nextValue } : prev));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validateForm = () => {
    if (!formData) return false;
    const nextErrors: Record<string, string> = {};

    if (!formData.name.trim())
      nextErrors.name = "Vui lòng nhập tên vùng giao hàng.";
    if (!formData.code.trim())
      nextErrors.code = "Vui lòng nhập mã vùng giao hàng.";
    if (formData.ward.trim() && !formData.district.trim())
      nextErrors.district = "Nếu có phường/xã thì phải nhập quận/huyện.";
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
      if (!Number.isFinite(baseFee) || baseFee < 0)
        nextErrors.baseFee = "Phí giao hàng cơ bản phải là số >= 0.";
    }

    if (formData.freeShipThreshold.trim() !== "") {
      const threshold = Number(formData.freeShipThreshold);
      if (!Number.isFinite(threshold) || threshold < 0)
        nextErrors.freeShipThreshold = "Ngưỡng freeship phải là số >= 0.";
    }

    if (formData.priority.trim() === "") {
      nextErrors.priority = "Vui lòng nhập độ ưu tiên.";
    } else {
      const priority = Number(formData.priority);
      if (!Number.isInteger(priority) || priority < 0)
        nextErrors.priority = "Độ ưu tiên phải là số nguyên >= 0.";
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      scrollToFirstError(nextErrors);
      return false;
    }
    return true;
  };

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    if (!formData) return;
    if (!validateForm()) return;

    try {
      setSaving(true);
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
        "PATCH",
        `/api/v1/admin/shipping-zones/edit/${formData.id}`,
        payload,
      );
      if (res?.success) {
        showSuccessToast({ message: "Cập nhật vùng giao hàng thành công!" });
        setInitialData({ ...formData }); // Cập nhật lại state lưu trữ ban đầu để isDirty = false
        setErrors({});
      } else {
        showErrorToast(res?.message || "Cập nhật vùng giao hàng thất bại.");
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
      <div className="flex flex-col justify-center items-center py-32">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600 dark:text-blue-400 mb-4" />
        <span className="text-gray-600 dark:text-gray-400 font-medium">
          Đang tải dữ liệu vùng giao hàng...
        </span>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-white">
              Chỉnh sửa vùng giao hàng
            </h1>
            <span
              className={`px-3 py-1 text-xs font-semibold rounded-full border ${
                formData.status === "active"
                  ? "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800"
                  : "bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800"
              }`}
            >
              {formData.status === "active" ? "Đang hoạt động" : "Tạm dừng"}
            </span>
          </div>
          <p className="text-gray-500 dark:text-gray-400 mt-1.5 flex items-center gap-2">
            <Tag className="w-4 h-4" /> {formData.name} ({formData.code})
          </p>
        </div>
        <button
          onClick={() => navigate("/admin/shipping/zones")}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" /> Quay lại danh sách
        </button>
      </div>

      {/* Summary Panel */}
      <Card className="mb-6 bg-gradient-to-br from-blue-50/50 to-white dark:from-gray-800/50 dark:to-gray-800 border-blue-100 dark:border-gray-700">
        <h2 className="text-sm font-bold text-gray-800 dark:text-white mb-4 uppercase tracking-wider flex items-center gap-2">
          <Info className="w-4 h-4 text-blue-500" /> Tóm tắt thông tin hiện tại
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
              Khu vực áp dụng
            </p>
            <p
              className="text-sm font-semibold text-gray-900 dark:text-white truncate"
              title={areaInfo.text}
            >
              {areaInfo.text}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
              Phí cơ bản
            </p>
            <p className="text-sm font-semibold text-gray-900 dark:text-white">
              {formatCurrency(formData.baseFee)}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
              Ngưỡng Freeship
            </p>
            <p className="text-sm font-semibold text-green-600 dark:text-green-400">
              {formData.freeShipThreshold
                ? formatCurrency(formData.freeShipThreshold)
                : "Không có"}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
              Độ ưu tiên
            </p>
            <p className="text-sm font-semibold text-gray-900 dark:text-white">
              {formData.priority}
            </p>
          </div>
        </div>
      </Card>

      <form onSubmit={handleSave} className="space-y-6">
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
                  setFormData((prev) =>
                    prev
                      ? {
                          ...prev,
                          province: provinceName,
                          district: "",
                          ward: "",
                        }
                      : prev,
                  );
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
                  if (city) await loadDistricts(city.code);
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
                  setFormData((prev) =>
                    prev ? { ...prev, district: districtName, ward: "" } : prev,
                  );
                  setWards([]);
                  if (errors.district || errors.ward) {
                    setErrors((prev) => ({ ...prev, district: "", ward: "" }));
                  }
                  if (district) await loadWards(district.code);
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
                  setFormData((prev) =>
                    prev ? { ...prev, ward: e.target.value } : prev,
                  );
                  if (errors.ward) setErrors((prev) => ({ ...prev, ward: "" }));
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
                Lưu ý: {areaInfo.detail}. Hệ thống sẽ ưu tiên match địa chỉ chi
                tiết nhất.
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
                Số càng nhỏ thì độ ưu tiên match càng cao (VD: 0 sẽ được xét đầu
                tiên).
              </p>
              {errors.priority && (
                <p className="text-sm text-red-600 mt-1.5">{errors.priority}</p>
              )}
            </div>
          </div>
        </Card>

        {/* Action Bar */}
        <div className="fixed bottom-0 left-0 right-0 md:left-64 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 p-4 shadow-lg z-10">
          <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              {isDirty ? (
                <span className="text-yellow-600 dark:text-yellow-500 text-sm font-medium flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4" /> Đã có thay đổi chưa lưu
                </span>
              ) : (
                <span className="text-gray-500 dark:text-gray-400 text-sm flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" /> Bạn chưa thay đổi dữ liệu
                </span>
              )}
            </div>

            <div className="flex gap-3 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => navigate("/admin/shipping/zones")}
                className="flex-1 sm:flex-none px-6 py-2.5 rounded-lg font-medium bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-200 transition-colors"
              >
                Hủy
              </button>

              <button
                type="submit"
                disabled={saving || !isDirty}
                className="flex-1 sm:flex-none px-6 py-2.5 rounded-lg font-medium bg-blue-600 hover:bg-blue-700 text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-sm"
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
      </form>
    </div>
  );
};

export default ShippingZoneEditPage;
