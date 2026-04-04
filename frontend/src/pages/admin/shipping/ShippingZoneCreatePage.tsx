import React, {
  useMemo,
  useRef,
  useState,
  useEffect,
  type ChangeEvent,
  type FormEvent,
} from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Loader2,
  Save,
  Tag,
  CreditCard,
  Globe,
  Info,
  AlertCircle,
  LayoutList,
  AlertTriangle,
  BadgePercent,
  ListTree,
  ArrowRight,
} from "lucide-react";
import Card from "../../../components/admin/layouts/Card";
import { http } from "../../../services/http";
import { useAdminToast } from "../../../context/AdminToastContext";

// =============================
// TYPES
// =============================
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

type ScopeKey = "fallback" | "province" | "district" | "ward";

const initialForm: ShippingZoneFormData = {
  code: "",
  name: "",
  province: "",
  district: "",
  ward: "",
  baseFee: "0",
  freeShipThreshold: "",
  priority: "10", // Default priority
  status: "active",
};

// =============================
// HELPERS
// =============================
const formatCurrencyPreview = (val: string) => {
  if (!val || isNaN(Number(val))) return "0 đ";
  return Number(val).toLocaleString("vi-VN") + " đ";
};

const getScopeKey = (
  province: string,
  district: string,
  ward: string,
): ScopeKey => {
  if (ward) return "ward";
  if (district) return "district";
  if (province) return "province";
  return "fallback";
};

// =============================
// MAIN COMPONENT
// =============================
const ShippingZoneCreatePage: React.FC = () => {
  const navigate = useNavigate();
  const { showSuccessToast, showErrorToast } = useAdminToast();

  const [formData, setFormData] = useState<ShippingZoneFormData>(initialForm);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const fieldRefs = useRef<
    Record<string, HTMLInputElement | HTMLSelectElement | null>
  >({});

  // Location States
  const [cities, setCities] = useState<LocationItem[]>([]);
  const [districts, setDistricts] = useState<LocationItem[]>([]);
  const [wards, setWards] = useState<LocationItem[]>([]);

  const [loadingLocations, setLoadingLocations] = useState({
    cities: false,
    districts: false,
    wards: false,
  });

  // --- Initial Load ---
  useEffect(() => {
    const fetchCities = async () => {
      setLoadingLocations((p) => ({ ...p, cities: true }));
      try {
        const res = await fetch("https://provinces.open-api.vn/api/p/");
        const data = await res.json();
        setCities(data);
      } catch (err) {
        console.error("Lỗi tải danh sách tỉnh/thành", err);
      } finally {
        setLoadingLocations((p) => ({ ...p, cities: false }));
      }
    };
    fetchCities();
  }, []);

  // --- Derived Rule Logic ---
  const scopeKey = useMemo(
    () => getScopeKey(formData.province, formData.district, formData.ward),
    [formData],
  );

  const areaTextPreview = useMemo(() => {
    if (scopeKey === "fallback") return "Toàn quốc (Mặc định)";
    return [formData.ward, formData.district, formData.province]
      .filter(Boolean)
      .join(", ");
  }, [formData, scopeKey]);

  const ruleSummaryText = useMemo(() => {
    const nameStr = formData.name ? `Zone **${formData.name}**` : "Rule này";
    let scopeStr = "";
    switch (scopeKey) {
      case "ward":
        scopeStr =
          "đóng vai trò **rule phường/xã**, áp dụng rất cụ thể cho khu vực";
        break;
      case "district":
        scopeStr = "đóng vai trò **rule quận/huyện**, áp dụng rộng cho toàn bộ";
        break;
      case "province":
        scopeStr = "đóng vai trò **rule tỉnh/thành**, áp dụng chung cho";
        break;
      case "fallback":
        scopeStr =
          "đóng vai trò **vùng mặc định (fallback)**, áp dụng khi không có rule nào khác khớp với địa chỉ giao hàng";
        break;
    }

    const feeStr = `Phí cơ bản là **${formatCurrencyPreview(formData.baseFee)}**`;
    const freeshipStr = formData.freeShipThreshold
      ? `và miễn phí giao hàng cho đơn từ **${formatCurrencyPreview(formData.freeShipThreshold)}**`
      : `và **không có freeship**`;
    const priorityStr = `Rule đang ${formData.status === "active" ? "được **bật**" : "**tạm dừng**"} với độ ưu tiên **${formData.priority || 0}**.`;

    return `${nameStr} ${scopeStr} ${scopeKey !== "fallback" ? `**${areaTextPreview}**` : ""}. ${feeStr} ${freeshipStr}. ${priorityStr}`;
  }, [formData, scopeKey, areaTextPreview]);

  // --- Actions ---
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

  const loadDistricts = async (cityName: string) => {
    const city = cities.find((c) => c.name === cityName);
    if (!city) return;
    setLoadingLocations((p) => ({ ...p, districts: true }));
    try {
      const res = await fetch(
        `https://provinces.open-api.vn/api/p/${city.code}?depth=2`,
      );
      const data = await res.json();
      setDistricts(data.districts || []);
    } finally {
      setLoadingLocations((p) => ({ ...p, districts: false }));
    }
  };

  const loadWards = async (districtName: string) => {
    const district = districts.find((d) => d.name === districtName);
    if (!district) return;
    setLoadingLocations((p) => ({ ...p, wards: true }));
    try {
      const res = await fetch(
        `https://provinces.open-api.vn/api/d/${district.code}?depth=2`,
      );
      const data = await res.json();
      setWards(data.wards || []);
    } finally {
      setLoadingLocations((p) => ({ ...p, wards: false }));
    }
  };

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    let nextValue =
      name === "code" ? value.toUpperCase().replace(/\s+/g, "_") : value; // Auto format code
    setFormData((prev) => ({ ...prev, [name]: nextValue }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validateForm = () => {
    const nextErrors: Record<string, string> = {};

    if (!formData.name.trim())
      nextErrors.name = "Vui lòng nhập tên quy tắc (VD: Nội thành HN).";
    if (!formData.code.trim())
      nextErrors.code = "Vui lòng nhập mã rule (VD: HN_INNER).";

    if (formData.ward.trim() && !formData.district.trim()) {
      nextErrors.district = "Bạn cần chọn Quận/Huyện trước khi chọn Phường/Xã.";
    }
    if (
      (formData.district.trim() || formData.ward.trim()) &&
      !formData.province.trim()
    ) {
      nextErrors.province =
        "Bạn cần chọn Tỉnh/Thành phố trước khi cấu hình cấp nhỏ hơn.";
    }

    if (formData.baseFee.trim() === "") {
      nextErrors.baseFee = "Vui lòng thiết lập phí giao hàng cơ bản.";
    } else {
      const baseFee = Number(formData.baseFee);
      if (!Number.isFinite(baseFee) || baseFee < 0)
        nextErrors.baseFee = "Phí cơ bản phải là số >= 0.";
    }

    if (formData.freeShipThreshold.trim() !== "") {
      const threshold = Number(formData.freeShipThreshold);
      if (!Number.isFinite(threshold) || threshold < 0)
        nextErrors.freeShipThreshold = "Ngưỡng freeship phải là số >= 0.";
    }

    if (formData.priority.trim() === "") {
      nextErrors.priority = "Vui lòng thiết lập độ ưu tiên.";
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

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setLoading(true);
      const payload = {
        code: formData.code.trim(),
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
        showSuccessToast({ message: "Tạo rule vùng giao hàng thành công!" });
        navigate("/admin/shipping/zones");
      } else {
        showErrorToast(res?.message || "Tạo quy tắc thất bại.");
      }
    } catch (err: any) {
      showErrorToast(err?.message || "Lỗi kết nối tới hệ thống.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto pb-24">
      {/* Tầng A: Header & Intro */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
        <div>
          <button
            onClick={() => navigate("/admin/shipping/zones")}
            className="flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-blue-600 transition-colors mb-2"
          >
            <ArrowLeft className="w-4 h-4" /> Quay lại danh sách
          </button>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            Thiết lập Rule Vùng giao hàng
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1.5">
            Tạo một rule dùng để xác định địa chỉ nào được áp dụng mức phí và
            logic freeship tương ứng.
          </p>
        </div>
        <div className="hidden lg:block bg-blue-50 dark:bg-blue-900/30 border border-blue-100 dark:border-blue-800 text-blue-700 dark:text-blue-300 px-4 py-2.5 rounded-lg text-sm">
          <Info className="w-4 h-4 inline-block mr-1.5 -mt-0.5" />
          Sau khi tạo zone, bạn cần gắn zone này vào các chi nhánh (Coverage).
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="grid grid-cols-1 xl:grid-cols-3 gap-6 lg:gap-8"
      >
        {/* CỘT TRÁI: FORM BUILDER */}
        <div className="xl:col-span-2 space-y-6">
          {/* Section 1: Định danh Rule */}
          <Card>
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-100 dark:border-gray-700">
              <Tag className="w-5 h-5 text-gray-400" />
              <h2 className="text-lg font-bold text-gray-800 dark:text-white">
                1. Định danh quy tắc
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  Tên quy tắc (Zone Name){" "}
                  <span className="text-red-500">*</span>
                </label>
                <input
                  ref={setFieldRef("name")}
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="VD: Nội thành Hà Nội"
                  className={`w-full border rounded-lg p-2.5 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all ${errors.name ? "border-red-500" : "border-gray-300 dark:border-gray-600"}`}
                />
                {errors.name && (
                  <p className="text-xs text-red-600 mt-1.5">{errors.name}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  Mã vùng (Zone Code) <span className="text-red-500">*</span>
                </label>
                <input
                  ref={setFieldRef("code")}
                  type="text"
                  name="code"
                  value={formData.code}
                  onChange={handleChange}
                  placeholder="VD: HN_INNER"
                  className={`w-full border rounded-lg p-2.5 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all uppercase font-mono text-sm ${errors.code ? "border-red-500" : "border-gray-300 dark:border-gray-600"}`}
                />
                <p className="text-[11px] text-gray-500 mt-1.5">
                  Tự động in hoa & gạch dưới. VD:{" "}
                  <span className="font-mono bg-gray-100 px-1 py-0.5 rounded text-gray-700">
                    HCM_QUAN_1
                  </span>
                </p>
                {errors.code && (
                  <p className="text-xs text-red-600 mt-1.5">{errors.code}</p>
                )}
              </div>
            </div>
          </Card>

          {/* Section 2: Phạm vi Match (Scope Builder) */}
          <Card
            className={`border-2 transition-all ${errors.province || errors.district || errors.ward ? "border-red-200" : "border-gray-200 dark:border-gray-700"}`}
          >
            <div className="flex items-center gap-2 mb-2 pb-3 border-b border-gray-100 dark:border-gray-700">
              <ListTree className="w-5 h-5 text-gray-400" />
              <h2 className="text-lg font-bold text-gray-800 dark:text-white">
                2. Cấp độ Match địa chỉ
              </h2>
            </div>

            {/* Visual Scope Ladder */}
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 mb-6">
              <div className="flex items-center justify-between relative">
                <div className="absolute left-0 top-1/2 w-full h-0.5 bg-gray-200 dark:bg-gray-700 -z-10 -translate-y-1/2"></div>
                {[
                  { id: "fallback", label: "Mặc định" },
                  { id: "province", label: "Tỉnh/Thành" },
                  { id: "district", label: "Quận/Huyện" },
                  { id: "ward", label: "Phường/Xã" },
                ].map((step, idx) => {
                  const isActive = scopeKey === step.id;
                  const isPassed =
                    ["fallback", "province", "district", "ward"].indexOf(
                      scopeKey,
                    ) > idx;
                  return (
                    <div
                      key={step.id}
                      className="flex flex-col items-center bg-gray-50 dark:bg-gray-800/50 px-2"
                    >
                      <div
                        className={`w-4 h-4 rounded-full border-2 transition-all ${isActive ? "border-blue-600 bg-blue-600 scale-125 shadow-md" : isPassed ? "border-blue-600 bg-white" : "border-gray-300 bg-white"}`}
                      ></div>
                      <span
                        className={`text-[11px] font-bold mt-2 ${isActive ? "text-blue-700 dark:text-blue-400" : "text-gray-500"}`}
                      >
                        {step.label}
                      </span>
                    </div>
                  );
                })}
              </div>
              <div className="mt-4 text-sm text-center text-gray-600 dark:text-gray-300 font-medium">
                {scopeKey === "fallback" &&
                  "Rule này đang là vùng mặc định. Áp dụng cho mọi địa chỉ không khớp với các quy tắc cụ thể khác."}
                {scopeKey === "province" &&
                  "Rule cấp Tỉnh. Áp dụng cho mọi địa chỉ thuộc tỉnh này, ngoại trừ các quận/huyện đã có rule riêng."}
                {scopeKey === "district" &&
                  "Rule cấp Quận. Áp dụng cho toàn bộ quận này, ngoại trừ các phường/xã đã có rule riêng."}
                {scopeKey === "ward" &&
                  "Rule cấp Phường. Mức độ match chính xác và hẹp nhất."}
              </div>
            </div>

            {scopeKey === "fallback" && (
              <div className="mb-5 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg flex gap-3">
                <Globe className="w-5 h-5 text-amber-600 shrink-0" />
                <div>
                  <p className="text-sm font-bold text-amber-800 dark:text-amber-400">
                    Bạn đang tạo vùng mặc định (Fallback Zone)
                  </p>
                  <p className="text-xs text-amber-700 dark:text-amber-500 mt-1">
                    Để trống các ô bên dưới nếu bạn muốn giữ nguyên tính chất
                    fallback. Hãy cẩn thận cấu hình độ ưu tiên cho vùng này.
                  </p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  1. Tỉnh / Thành phố
                </label>
                <div className="relative">
                  <select
                    ref={setFieldRef("province")}
                    name="province"
                    value={formData.province}
                    onChange={(e) => {
                      const val = e.target.value;
                      setFormData((prev) => ({
                        ...prev,
                        province: val,
                        district: "",
                        ward: "",
                      }));
                      setDistricts([]);
                      setWards([]);
                      if (val) loadDistricts(val);
                      if (errors.province)
                        setErrors((prev) => ({ ...prev, province: "" }));
                    }}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg p-2.5 bg-white dark:bg-gray-800 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="">-- Bỏ trống nếu là Fallback --</option>
                    {cities.map((c) => (
                      <option key={c.code} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                  {loadingLocations.cities && (
                    <Loader2 className="absolute right-8 top-3 w-4 h-4 animate-spin text-gray-400" />
                  )}
                </div>
                {errors.province && (
                  <p className="text-xs text-red-600 mt-1">{errors.province}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  2. Quận / Huyện
                </label>
                <div className="relative">
                  <select
                    ref={setFieldRef("district")}
                    name="district"
                    value={formData.district}
                    disabled={!formData.province}
                    onChange={(e) => {
                      const val = e.target.value;
                      setFormData((prev) => ({
                        ...prev,
                        district: val,
                        ward: "",
                      }));
                      setWards([]);
                      if (val) loadWards(val);
                      if (errors.district)
                        setErrors((prev) => ({ ...prev, district: "" }));
                    }}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg p-2.5 bg-white dark:bg-gray-800 text-sm focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-gray-100 disabled:text-gray-400"
                  >
                    <option value="">
                      {formData.province
                        ? "-- Chọn Quận/Huyện --"
                        : "Cần chọn Tỉnh/Thành trước"}
                    </option>
                    {districts.map((d) => (
                      <option key={d.code} value={d.name}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                  {loadingLocations.districts && (
                    <Loader2 className="absolute right-8 top-3 w-4 h-4 animate-spin text-gray-400" />
                  )}
                </div>
                {errors.district && (
                  <p className="text-xs text-red-600 mt-1">{errors.district}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  3. Phường / Xã
                </label>
                <div className="relative">
                  <select
                    ref={setFieldRef("ward")}
                    name="ward"
                    value={formData.ward}
                    disabled={!formData.district}
                    onChange={(e) => {
                      setFormData((prev) => ({
                        ...prev,
                        ward: e.target.value,
                      }));
                      if (errors.ward)
                        setErrors((prev) => ({ ...prev, ward: "" }));
                    }}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg p-2.5 bg-white dark:bg-gray-800 text-sm focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-gray-100 disabled:text-gray-400"
                  >
                    <option value="">
                      {formData.district
                        ? "-- Chọn Phường/Xã --"
                        : "Cần chọn Quận/Huyện trước"}
                    </option>
                    {wards.map((w) => (
                      <option key={w.code} value={w.name}>
                        {w.name}
                      </option>
                    ))}
                  </select>
                  {loadingLocations.wards && (
                    <Loader2 className="absolute right-8 top-3 w-4 h-4 animate-spin text-gray-400" />
                  )}
                </div>
              </div>
            </div>
          </Card>

          {/* Section 3 & 4: Logic Giá & Hành vi (2 columns on desktop) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Logic giá */}
            <Card>
              <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-100 dark:border-gray-700">
                <CreditCard className="w-5 h-5 text-gray-400" />
                <h2 className="text-lg font-bold text-gray-800 dark:text-white">
                  3. Logic giá (Base Pricing)
                </h2>
              </div>
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                    Phí nền cơ bản (VNĐ) <span className="text-red-500">*</span>
                  </label>
                  <input
                    ref={setFieldRef("baseFee")}
                    type="number"
                    min="0"
                    step="1000"
                    name="baseFee"
                    value={formData.baseFee}
                    onChange={handleChange}
                    className={`w-full border rounded-lg p-2.5 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none ${errors.baseFee ? "border-red-500" : "border-gray-300 dark:border-gray-600"}`}
                  />
                  <div className="text-xs font-medium text-blue-600 mt-1.5 bg-blue-50 p-1.5 rounded w-fit">
                    Preview: {formatCurrencyPreview(formData.baseFee)}
                  </div>
                  {errors.baseFee && (
                    <p className="text-xs text-red-600 mt-1">
                      {errors.baseFee}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                    Ngưỡng Freeship (VNĐ)
                  </label>
                  <input
                    ref={setFieldRef("freeShipThreshold")}
                    type="number"
                    min="0"
                    step="1000"
                    name="freeShipThreshold"
                    value={formData.freeShipThreshold}
                    onChange={handleChange}
                    placeholder="Bỏ trống nếu không áp dụng"
                    className={`w-full border rounded-lg p-2.5 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none ${errors.freeShipThreshold ? "border-red-500" : "border-gray-300 dark:border-gray-600"}`}
                  />
                  {formData.freeShipThreshold && (
                    <div className="text-xs font-medium text-green-600 mt-1.5 bg-green-50 p-1.5 rounded w-fit flex items-center gap-1">
                      <BadgePercent className="w-3.5 h-3.5" /> Sẽ miễn phí ship
                      từ {formatCurrencyPreview(formData.freeShipThreshold)}
                    </div>
                  )}
                  {errors.freeShipThreshold && (
                    <p className="text-xs text-red-600 mt-1">
                      {errors.freeShipThreshold}
                    </p>
                  )}
                </div>
              </div>
            </Card>

            {/* Hành vi áp dụng */}
            <Card>
              <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-100 dark:border-gray-700">
                <LayoutList className="w-5 h-5 text-gray-400" />
                <h2 className="text-lg font-bold text-gray-800 dark:text-white">
                  4. Hành vi áp dụng
                </h2>
              </div>
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                    Độ ưu tiên (Priority){" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <input
                    ref={setFieldRef("priority")}
                    type="number"
                    min="0"
                    step="1"
                    name="priority"
                    value={formData.priority}
                    onChange={handleChange}
                    className={`w-full border rounded-lg p-2.5 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none ${errors.priority ? "border-red-500" : "border-gray-300 dark:border-gray-600"}`}
                  />

                  {/* Priority Warning Engine */}
                  <div className="mt-2 text-[11px] leading-tight">
                    {Number(formData.priority) > 50 && scopeKey === "ward" && (
                      <span className="text-amber-600 flex gap-1">
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0" /> Rule
                        match hẹp nhưng ưu tiên thấp. Có thể bị ghi đè bởi rule
                        cấp Tỉnh/Quận.
                      </span>
                    )}
                    {Number(formData.priority) < 5 &&
                      scopeKey === "fallback" && (
                        <span className="text-amber-600 flex gap-1">
                          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />{" "}
                          Vùng fallback nhưng ưu tiên rất cao. Có thể cản trở
                          các rule cụ thể hoạt động.
                        </span>
                      )}
                    {!Number.isNaN(Number(formData.priority)) &&
                      !(
                        Number(formData.priority) > 50 && scopeKey === "ward"
                      ) &&
                      !(
                        Number(formData.priority) < 5 && scopeKey === "fallback"
                      ) && (
                        <span className="text-gray-500">
                          Số càng nhỏ, rule càng được xét trước. (0 là cao nhất)
                        </span>
                      )}
                  </div>
                  {errors.priority && (
                    <p className="text-xs text-red-600 mt-1">
                      {errors.priority}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                    Trạng thái kích hoạt
                  </label>
                  <select
                    ref={setFieldRef("status")}
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg p-2.5 bg-white dark:bg-gray-800 text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="active">
                      Hoạt động (Sẵn sàng cho Coverage)
                    </option>
                    <option value="inactive">
                      Tạm dừng (Lưu cấu hình, chưa dùng)
                    </option>
                  </select>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* CỘT PHẢI: LIVE PREVIEW PANEL */}
        <div className="xl:col-span-1">
          <div className="sticky top-24 space-y-6">
            <Card className="border-blue-100 dark:border-blue-900/50 bg-gradient-to-br from-blue-50 to-white dark:from-gray-800 dark:to-gray-800/80 shadow-sm overflow-hidden">
              <div className="bg-blue-600 text-white px-4 py-3 -mx-6 -mt-6 mb-5 flex items-center gap-2 font-bold shadow-sm">
                <Info className="w-5 h-5" /> Live Rule Summary
              </div>

              <div className="space-y-4 text-sm">
                <div>
                  <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                    Mức độ Match
                  </div>
                  <div
                    className={`inline-flex px-2 py-1 rounded text-xs font-bold border ${scopeKey === "fallback" ? "bg-gray-100 text-gray-700 border-gray-200" : "bg-blue-100 text-blue-700 border-blue-200"}`}
                  >
                    Cấp {scopeKey.charAt(0).toUpperCase() + scopeKey.slice(1)}
                  </div>
                </div>

                <div>
                  <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                    Khu vực áp dụng
                  </div>
                  <div className="font-bold text-gray-900 dark:text-white">
                    {areaTextPreview}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                  <div>
                    <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                      Base Fee
                    </div>
                    <div className="font-bold text-gray-900 dark:text-white">
                      {formatCurrencyPreview(formData.baseFee)}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                      Freeship
                    </div>
                    <div className="font-bold text-green-600 dark:text-green-400">
                      {formData.freeShipThreshold
                        ? `Từ ${formatCurrencyPreview(formData.freeShipThreshold)}`
                        : "Không"}
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                  <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                    Cách rule này hoạt động
                  </div>
                  <div
                    className="text-gray-700 dark:text-gray-300 text-[13px] leading-relaxed"
                    dangerouslySetInnerHTML={{
                      __html: ruleSummaryText.replace(
                        /\*\*(.*?)\*\*/g,
                        '<strong class="text-gray-900 dark:text-white">$1</strong>',
                      ),
                    }}
                  />
                </div>
              </div>
            </Card>

            <Card className="bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
              <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200 mb-3 flex items-center gap-2">
                <ArrowRight className="w-4 h-4" /> Bước tiếp theo
              </h3>
              <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                Sau khi tạo vùng giao hàng thành công, bạn có thể chuyển sang
                mục <strong>Coverage</strong> để gán vùng này cho các chi nhánh
                cụ thể được phép phục vụ.
              </p>
            </Card>
          </div>
        </div>
      </form>

      {/* Action Bar */}
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
              onClick={() => navigate("/admin/shipping/zones")}
              className="flex-1 sm:flex-none px-6 py-2.5 rounded-lg font-medium bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-200 transition-colors"
            >
              Hủy bỏ
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="flex-1 sm:flex-none px-8 py-2.5 rounded-lg font-medium bg-blue-600 hover:bg-blue-700 text-white transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" /> Đang tạo rule...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" /> Lưu vùng giao hàng
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShippingZoneCreatePage;
