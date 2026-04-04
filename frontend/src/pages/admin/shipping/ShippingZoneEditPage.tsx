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
  Tag,
  CreditCard,
  Globe,
  Info,
  AlertCircle,
  LayoutList,
  AlertTriangle,
  BadgePercent,
  ListTree,
  ArrowRightLeft,
  History,
} from "lucide-react";
import Card from "../../../components/admin/layouts/Card";
import { http } from "../../../services/http";
import { useAdminToast } from "../../../context/AdminToastContext";

// =============================
// TYPES
// =============================
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

type ScopeKey = "fallback" | "province" | "district" | "ward";

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

const getAreaTextPreview = (
  province: string,
  district: string,
  ward: string,
  scopeKey: ScopeKey,
) => {
  if (scopeKey === "fallback") return "Toàn quốc (Mặc định)";
  return [ward, district, province].filter(Boolean).join(", ");
};

// =============================
// MAIN COMPONENT
// =============================
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

  // Location States
  const [cities, setCities] = useState<LocationItem[]>([]);
  const [districts, setDistricts] = useState<LocationItem[]>([]);
  const [wards, setWards] = useState<LocationItem[]>([]);
  const [cityLoaded, setCityLoaded] = useState(false);

  const [loadingLocations, setLoadingLocations] = useState({
    cities: false,
    districts: false,
    wards: false,
  });

  // --- Derived Edit States ---
  const isDirty = useMemo(() => {
    if (!formData || !initialData) return false;
    return JSON.stringify(formData) !== JSON.stringify(initialData);
  }, [formData, initialData]);

  const scopeKey = useMemo(
    () =>
      formData
        ? getScopeKey(formData.province, formData.district, formData.ward)
        : "fallback",
    [formData],
  );
  const initialScopeKey = useMemo(
    () =>
      initialData
        ? getScopeKey(
            initialData.province,
            initialData.district,
            initialData.ward,
          )
        : "fallback",
    [initialData],
  );

  const areaTextPreview = useMemo(
    () =>
      formData
        ? getAreaTextPreview(
            formData.province,
            formData.district,
            formData.ward,
            scopeKey,
          )
        : "",
    [formData, scopeKey],
  );
  const initialAreaTextPreview = useMemo(
    () =>
      initialData
        ? getAreaTextPreview(
            initialData.province,
            initialData.district,
            initialData.ward,
            initialScopeKey,
          )
        : "",
    [initialData, initialScopeKey],
  );

  const changeImpacts = useMemo(() => {
    if (!formData || !initialData) return [];
    const impacts = [];

    if (formData.status !== initialData.status) {
      impacts.push(
        formData.status === "inactive"
          ? "Zone này sẽ bị tạm dừng và không còn match các địa chỉ giao hàng."
          : "Zone này sẽ được kích hoạt lại trong luồng tính toán địa chỉ.",
      );
    }

    if (scopeKey !== initialScopeKey) {
      impacts.push(
        `Phạm vi phủ của rule đã thay đổi từ cấp ${initialScopeKey.toUpperCase()} sang ${scopeKey.toUpperCase()}.`,
      );
    }

    if (scopeKey === "fallback" && initialScopeKey !== "fallback") {
      impacts.push(
        "CẢNH BÁO: Bạn đang chuyển rule này thành vùng mặc định (Fallback). Tầm phủ sẽ được mở rộng ra toàn bộ các địa chỉ không khớp với rule khác.",
      );
    }

    if (Number(formData.priority) !== Number(initialData.priority)) {
      const isUp = Number(formData.priority) < Number(initialData.priority);
      impacts.push(
        `Độ ưu tiên match địa chỉ đã ${isUp ? "tăng lên" : "giảm đi"} (Từ ${initialData.priority} thành ${formData.priority}).`,
      );
    }

    if (Number(formData.baseFee) !== Number(initialData.baseFee)) {
      impacts.push(
        `Phí nền thay đổi từ ${formatCurrencyPreview(initialData.baseFee)} thành ${formatCurrencyPreview(formData.baseFee)}.`,
      );
    }

    return impacts;
  }, [formData, initialData, scopeKey, initialScopeKey]);

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

  const loadCities = async () => {
    if (cityLoaded) return cities;
    setLoadingLocations((p) => ({ ...p, cities: true }));
    try {
      const res = await fetch("https://provinces.open-api.vn/api/p/");
      const data = await res.json();
      setCities(data);
      setCityLoaded(true);
      return data;
    } finally {
      setLoadingLocations((p) => ({ ...p, cities: false }));
    }
  };

  const loadDistricts = async (cityName: string) => {
    const city = cities.find((c) => c.name === cityName);
    if (!city) return [];
    setLoadingLocations((p) => ({ ...p, districts: true }));
    try {
      const res = await fetch(
        `https://provinces.open-api.vn/api/p/${city.code}?depth=2`,
      );
      const data = await res.json();
      const nextDistricts = data.districts || [];
      setDistricts(nextDistricts);
      return nextDistricts;
    } finally {
      setLoadingLocations((p) => ({ ...p, districts: false }));
    }
  };

  const loadWards = async (districtName: string) => {
    const district = districts.find((d) => d.name === districtName);
    if (!district) return [];
    setLoadingLocations((p) => ({ ...p, wards: true }));
    try {
      const res = await fetch(
        `https://provinces.open-api.vn/api/d/${district.code}?depth=2`,
      );
      const data = await res.json();
      const nextWards = data.wards || [];
      setWards(nextWards);
      return nextWards;
    } finally {
      setLoadingLocations((p) => ({ ...p, wards: false }));
    }
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
      if (!formData || cityLoaded) return; // Prevent continuous syncing if already loaded
      const cityList = await loadCities();
      const city = cityList.find(
        (c: LocationItem) => c.name === formData.province,
      );
      if (!city) return;

      const resDist = await fetch(
        `https://provinces.open-api.vn/api/p/${city.code}?depth=2`,
      );
      const distData = await resDist.json();
      const districtList = distData.districts || [];
      setDistricts(districtList);

      const district = districtList.find(
        (d: LocationItem) => d.name === formData.district,
      );
      if (!district) return;

      const resWard = await fetch(
        `https://provinces.open-api.vn/api/d/${district.code}?depth=2`,
      );
      const wardData = await resWard.json();
      setWards(wardData.wards || []);
    };

    // Only run this sync once when initialData is fully loaded
    if (initialData && !cityLoaded) {
      void syncAddressOptions();
    }
  }, [initialData]);

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    if (!formData) return;
    const { name, value } = e.target;
    const nextValue =
      name === "code" ? value.toUpperCase().replace(/\s+/g, "_") : value;
    setFormData((prev) => (prev ? { ...prev, [name]: nextValue } : prev));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validateForm = () => {
    if (!formData) return false;
    const nextErrors: Record<string, string> = {};

    if (!formData.name.trim()) nextErrors.name = "Vui lòng nhập tên quy tắc.";
    if (!formData.code.trim()) nextErrors.code = "Vui lòng nhập mã rule.";

    if (formData.ward.trim() && !formData.district.trim()) {
      nextErrors.district = "Nếu có phường/xã thì phải nhập quận/huyện.";
    }
    if (
      (formData.district.trim() || formData.ward.trim()) &&
      !formData.province.trim()
    ) {
      nextErrors.province =
        "Nếu có cấp quận/huyện, bạn phải nhập tỉnh/thành phố.";
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

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    if (!formData) return;
    if (!validateForm()) return;

    try {
      setSaving(true);
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
        "PATCH",
        `/api/v1/admin/shipping-zones/edit/${formData.id}`,
        payload,
      );

      if (res?.success) {
        showSuccessToast({
          message: "Cập nhật rule vùng giao hàng thành công!",
        });
        setInitialData({ ...formData });
        setErrors({});
      } else {
        showErrorToast(res?.message || "Cập nhật rule vùng thất bại.");
      }
    } catch (err: any) {
      showErrorToast(err?.message || "Lỗi kết nối server.");
    } finally {
      setSaving(false);
    }
  };

  if (loading || !formData || !initialData) {
    return (
      <div className="flex flex-col justify-center items-center py-32 max-w-7xl mx-auto">
        <Loader2 className="w-10 h-10 animate-spin text-blue-600 mb-4" />
        <span className="text-gray-800 dark:text-gray-200 font-bold text-lg">
          Đang tải cấu trúc Rule...
        </span>
        <span className="text-gray-500 mt-1">
          Hệ thống đang đồng bộ dữ liệu địa lý hiện hành
        </span>
      </div>
    );
  }

  const isStatusChanged = formData.status !== initialData.status;

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
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              Chỉnh sửa Rule Vùng giao hàng
            </h1>
            <span
              className={`px-2.5 py-1 text-[11px] font-bold uppercase rounded border ${isStatusChanged ? "bg-amber-100 text-amber-700 border-amber-200" : formData.status === "active" ? "bg-green-100 text-green-700 border-green-200" : "bg-gray-100 text-gray-600 border-gray-200"}`}
            >
              {isStatusChanged
                ? "Sẽ đổi Status"
                : formData.status === "active"
                  ? "Đang Hoạt động"
                  : "Đang Tạm dừng"}
            </span>
            {isDirty && (
              <span className="px-2.5 py-1 bg-yellow-100 text-yellow-700 border border-yellow-200 text-[11px] font-bold uppercase rounded flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" /> Có thay đổi chưa lưu
              </span>
            )}
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1.5 flex items-center gap-2">
            <Tag className="w-4 h-4" /> {initialData.name} ({initialData.code})
          </p>
        </div>
      </div>

      <form
        onSubmit={handleSave}
        className="grid grid-cols-1 xl:grid-cols-3 gap-6 lg:gap-8"
      >
        {/* CỘT TRÁI: FORM BUILDER */}
        <div className="xl:col-span-2 space-y-6">
          {/* Section 1: Định danh Rule */}
          <Card
            className={
              formData.name !== initialData.name ||
              formData.code !== initialData.code
                ? "border-amber-200 dark:border-amber-800"
                : ""
            }
          >
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-100 dark:border-gray-700">
              <Tag className="w-5 h-5 text-gray-400" />
              <h2 className="text-lg font-bold text-gray-800 dark:text-white">
                1. Định danh quy tắc
              </h2>
              {(formData.name !== initialData.name ||
                formData.code !== initialData.code) && (
                <span className="text-[10px] font-bold bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded ml-auto">
                  Đã chỉnh sửa
                </span>
              )}
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
                  className={`w-full border rounded-lg p-2.5 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all ${errors.name ? "border-red-500" : formData.name !== initialData.name ? "border-amber-400 bg-amber-50" : "border-gray-300 dark:border-gray-600"}`}
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
                  className={`w-full border rounded-lg p-2.5 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all uppercase font-mono text-sm ${errors.code ? "border-red-500" : formData.code !== initialData.code ? "border-amber-400 bg-amber-50" : "border-gray-300 dark:border-gray-600"}`}
                />
                {formData.code !== initialData.code && (
                  <p className="text-[11px] text-amber-600 mt-1.5 flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" /> Cảnh báo: Việc đổi
                    mã Rule có thể ảnh hưởng tra cứu hệ thống cũ.
                  </p>
                )}
                {errors.code && (
                  <p className="text-xs text-red-600 mt-1.5">{errors.code}</p>
                )}
              </div>
            </div>
          </Card>

          {/* Section 2: Phạm vi Match (Scope Editor) */}
          <Card
            className={`border-2 transition-all ${errors.province || errors.district || errors.ward ? "border-red-200" : scopeKey !== initialScopeKey ? "border-amber-200 dark:border-amber-800" : "border-gray-200 dark:border-gray-700"}`}
          >
            <div className="flex items-center gap-2 mb-2 pb-3 border-b border-gray-100 dark:border-gray-700">
              <ListTree className="w-5 h-5 text-gray-400" />
              <h2 className="text-lg font-bold text-gray-800 dark:text-white">
                2. Cấp độ Match địa chỉ
              </h2>
              {scopeKey !== initialScopeKey && (
                <span className="text-[10px] font-bold bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded ml-auto flex items-center gap-1">
                  <ArrowRightLeft className="w-3 h-3" /> Mức match thay đổi
                </span>
              )}
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
                  const wasActive = initialScopeKey === step.id;
                  return (
                    <div
                      key={step.id}
                      className="flex flex-col items-center bg-gray-50 dark:bg-gray-800/50 px-2 relative"
                    >
                      {wasActive && !isActive && (
                        <span className="absolute -top-5 text-[9px] font-bold text-gray-400">
                          Current
                        </span>
                      )}
                      <div
                        className={`w-4 h-4 rounded-full border-2 transition-all ${isActive ? "border-blue-600 bg-blue-600 scale-125 shadow-md" : isPassed ? "border-blue-600 bg-white" : wasActive ? "border-gray-400 bg-gray-200" : "border-gray-300 bg-white"}`}
                      ></div>
                      <span
                        className={`text-[11px] font-bold mt-2 ${isActive ? "text-blue-700 dark:text-blue-400" : wasActive ? "text-gray-500 line-through" : "text-gray-500"}`}
                      >
                        {step.label}
                      </span>
                    </div>
                  );
                })}
              </div>
              <div className="mt-4 text-sm text-center text-gray-600 dark:text-gray-300 font-medium">
                {scopeKey === "fallback" &&
                  "Rule này sẽ đóng vai trò vùng mặc định. Áp dụng cho mọi địa chỉ không khớp với các quy tắc cụ thể khác."}
                {scopeKey === "province" &&
                  "Rule cấp Tỉnh. Sẽ áp dụng cho mọi địa chỉ thuộc tỉnh này, ngoại trừ các quận/huyện đã có rule riêng."}
                {scopeKey === "district" &&
                  "Rule cấp Quận. Sẽ áp dụng cho toàn bộ quận này, ngoại trừ các phường/xã đã có rule riêng."}
                {scopeKey === "ward" &&
                  "Rule cấp Phường. Mức độ match chính xác và hẹp nhất."}
              </div>
            </div>

            {scopeKey === "fallback" && (
              <div className="mb-5 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg flex gap-3">
                <Globe className="w-5 h-5 text-amber-600 shrink-0" />
                <div>
                  <p className="text-sm font-bold text-amber-800 dark:text-amber-400">
                    Bạn đang chỉnh sửa vùng mặc định (Fallback Zone)
                  </p>
                  <p className="text-xs text-amber-700 dark:text-amber-500 mt-1">
                    Mọi thay đổi giá tại đây có thể ảnh hưởng tới tất cả các địa
                    chỉ chưa có coverage cụ thể.
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
                      setFormData((prev) =>
                        prev
                          ? { ...prev, province: val, district: "", ward: "" }
                          : prev,
                      );
                      setDistricts([]);
                      setWards([]);
                      if (val) loadDistricts(val);
                      if (errors.province)
                        setErrors((prev) => ({ ...prev, province: "" }));
                    }}
                    className={`w-full border rounded-lg p-2.5 bg-white dark:bg-gray-800 text-sm focus:ring-2 focus:ring-blue-500 outline-none ${formData.province !== initialData.province ? "border-amber-400 bg-amber-50" : "border-gray-300 dark:border-gray-600"}`}
                  >
                    <option value="">-- Bỏ trống để thành Fallback --</option>
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
                      setFormData((prev) =>
                        prev ? { ...prev, district: val, ward: "" } : prev,
                      );
                      setWards([]);
                      if (val) loadWards(val);
                      if (errors.district)
                        setErrors((prev) => ({ ...prev, district: "" }));
                    }}
                    className={`w-full border rounded-lg p-2.5 bg-white dark:bg-gray-800 text-sm focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-gray-100 disabled:text-gray-400 ${formData.district !== initialData.district ? "border-amber-400 bg-amber-50" : "border-gray-300 dark:border-gray-600"}`}
                  >
                    <option value="">
                      {formData.province
                        ? "-- Chọn Quận/Huyện --"
                        : "Cần Tỉnh/Thành trước"}
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
                      setFormData((prev) =>
                        prev ? { ...prev, ward: e.target.value } : prev,
                      );
                      if (errors.ward)
                        setErrors((prev) => ({ ...prev, ward: "" }));
                    }}
                    className={`w-full border rounded-lg p-2.5 bg-white dark:bg-gray-800 text-sm focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-gray-100 disabled:text-gray-400 ${formData.ward !== initialData.ward ? "border-amber-400 bg-amber-50" : "border-gray-300 dark:border-gray-600"}`}
                  >
                    <option value="">
                      {formData.district
                        ? "-- Chọn Phường/Xã --"
                        : "Cần Quận/Huyện trước"}
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
            <Card
              className={
                formData.baseFee !== initialData.baseFee ||
                formData.freeShipThreshold !== initialData.freeShipThreshold
                  ? "border-amber-200 dark:border-amber-800"
                  : ""
              }
            >
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
                    className={`w-full border rounded-lg p-2.5 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none ${errors.baseFee ? "border-red-500" : formData.baseFee !== initialData.baseFee ? "border-amber-400 bg-amber-50" : "border-gray-300 dark:border-gray-600"}`}
                  />
                  <div className="flex justify-between mt-1.5">
                    <span className="text-xs font-medium text-gray-500">
                      Mức phí gốc: {formatCurrencyPreview(initialData.baseFee)}
                    </span>
                    {formData.baseFee !== initialData.baseFee && (
                      <span className="text-xs font-bold text-amber-600 border border-amber-200 bg-amber-50 px-1.5 rounded">
                        Preview đổi: {formatCurrencyPreview(formData.baseFee)}
                      </span>
                    )}
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
                    className={`w-full border rounded-lg p-2.5 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none ${errors.freeShipThreshold ? "border-red-500" : formData.freeShipThreshold !== initialData.freeShipThreshold ? "border-amber-400 bg-amber-50" : "border-gray-300 dark:border-gray-600"}`}
                  />
                  <div className="flex justify-between mt-1.5">
                    <span className="text-xs font-medium text-gray-500">
                      Freeship gốc:{" "}
                      {initialData.freeShipThreshold
                        ? formatCurrencyPreview(initialData.freeShipThreshold)
                        : "Không"}
                    </span>
                    {formData.freeShipThreshold !==
                      initialData.freeShipThreshold && (
                      <span className="text-xs font-bold text-amber-600 border border-amber-200 bg-amber-50 px-1.5 rounded flex items-center gap-1">
                        <BadgePercent className="w-3 h-3" /> Đổi thành:{" "}
                        {formData.freeShipThreshold
                          ? formatCurrencyPreview(formData.freeShipThreshold)
                          : "Không"}
                      </span>
                    )}
                  </div>
                  {errors.freeShipThreshold && (
                    <p className="text-xs text-red-600 mt-1">
                      {errors.freeShipThreshold}
                    </p>
                  )}
                </div>
              </div>
            </Card>

            {/* Hành vi áp dụng */}
            <Card
              className={
                formData.priority !== initialData.priority ||
                formData.status !== initialData.status
                  ? "border-amber-200 dark:border-amber-800"
                  : ""
              }
            >
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
                    className={`w-full border rounded-lg p-2.5 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none ${errors.priority ? "border-red-500" : formData.priority !== initialData.priority ? "border-amber-400 bg-amber-50" : "border-gray-300 dark:border-gray-600"}`}
                  />

                  {/* Priority Warning Engine */}
                  <div className="mt-2 text-[11px] leading-tight space-y-1">
                    <div className="flex justify-between">
                      <span className="text-gray-500 font-medium">
                        Gốc: {initialData.priority}
                      </span>
                      {formData.priority !== initialData.priority && (
                        <span className="font-bold text-amber-600">
                          Đổi thành: {formData.priority}
                        </span>
                      )}
                    </div>
                    {Number(formData.priority) > 50 && scopeKey === "ward" && (
                      <span className="text-amber-600 flex gap-1 mt-1">
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0" /> Rule
                        match hẹp nhưng ưu tiên thấp. Có thể bị ghi đè bởi rule
                        rộng hơn.
                      </span>
                    )}
                    {Number(formData.priority) < 5 &&
                      scopeKey === "fallback" && (
                        <span className="text-amber-600 flex gap-1 mt-1">
                          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />{" "}
                          Fallback ưu tiên rất cao. Có thể cản trở các rule cụ
                          thể hoạt động.
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
                    className={`w-full border rounded-lg p-2.5 text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none ${formData.status !== initialData.status ? "border-amber-400 bg-amber-50 text-amber-900" : "border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"}`}
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

        {/* CỘT PHẢI: CHANGE IMPACT & SUMMARY */}
        <div className="xl:col-span-1">
          <div className="sticky top-24 space-y-6">
            {/* Change Impact Advisory */}
            {isDirty ? (
              <Card className="border-amber-200 dark:border-amber-900/50 bg-gradient-to-br from-amber-50 to-white dark:from-gray-800 dark:to-gray-800/80 shadow-sm overflow-hidden transition-all duration-300">
                <div className="bg-amber-500 text-white px-4 py-3 -mx-6 -mt-6 mb-5 flex items-center gap-2 font-bold shadow-sm">
                  <AlertTriangle className="w-5 h-5" /> Đánh giá tác động thay
                  đổi
                </div>
                {changeImpacts.length > 0 ? (
                  <ul className="space-y-3 text-sm">
                    {changeImpacts.map((impact, idx) => (
                      <li
                        key={idx}
                        className="flex items-start gap-2.5 text-gray-700 dark:text-gray-300"
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${impact.includes("CẢNH BÁO") ? "bg-red-500" : "bg-amber-500"}`}
                        ></span>
                        <span
                          className={
                            impact.includes("CẢNH BÁO")
                              ? "font-bold text-red-600 dark:text-red-400"
                              : ""
                          }
                        >
                          {impact}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-600">
                    Những thay đổi hiện tại không ảnh hưởng quá lớn tới luồng
                    Match.
                  </p>
                )}
              </Card>
            ) : (
              <Card className="border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 flex flex-col items-center justify-center py-10 text-center transition-all duration-300">
                <History className="w-10 h-10 text-gray-300 mb-3" />
                <span className="text-gray-500 font-medium">
                  Bản nháp hiện trùng với dữ liệu lưu trữ. Chỉnh sửa form để xem
                  đánh giá tác động.
                </span>
              </Card>
            )}

            {/* Live Summary */}
            <Card className="border-blue-100 dark:border-blue-900/50 bg-gradient-to-br from-blue-50 to-white dark:from-gray-800 dark:to-gray-800/80 shadow-sm overflow-hidden">
              <div className="bg-blue-600 text-white px-4 py-3 -mx-6 -mt-6 mb-5 flex items-center justify-between font-bold shadow-sm">
                <span className="flex items-center gap-2">
                  <Info className="w-5 h-5" /> Bản nháp sau khi lưu
                </span>
              </div>

              <div className="space-y-4 text-sm">
                <div
                  className={
                    scopeKey !== initialScopeKey
                      ? "bg-amber-100 -mx-2 px-2 py-1 rounded"
                      : ""
                  }
                >
                  <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                    Mức độ Match
                  </div>
                  <div
                    className={`inline-flex px-2 py-1 rounded text-[11px] font-bold border ${scopeKey === "fallback" ? "bg-gray-100 text-gray-700 border-gray-200" : "bg-blue-100 text-blue-700 border-blue-200"}`}
                  >
                    Cấp {scopeKey.charAt(0).toUpperCase() + scopeKey.slice(1)}
                  </div>
                </div>

                <div
                  className={
                    areaTextPreview !== initialAreaTextPreview
                      ? "bg-amber-100 -mx-2 px-2 py-1 rounded"
                      : ""
                  }
                >
                  <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                    Khu vực áp dụng
                  </div>
                  <div className="font-bold text-gray-900 dark:text-white">
                    {areaTextPreview}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                  <div
                    className={
                      formData.baseFee !== initialData.baseFee
                        ? "bg-amber-100 -mx-2 px-2 py-1 rounded"
                        : ""
                    }
                  >
                    <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                      Base Fee
                    </div>
                    <div className="font-bold text-gray-900 dark:text-white">
                      {formatCurrencyPreview(formData.baseFee)}
                    </div>
                  </div>
                  <div
                    className={
                      formData.freeShipThreshold !==
                      initialData.freeShipThreshold
                        ? "bg-amber-100 -mx-2 px-2 py-1 rounded"
                        : ""
                    }
                  >
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
              </div>
            </Card>
          </div>
        </div>
      </form>

      {/* Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 md:left-64 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 p-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-20">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-sm font-medium hidden sm:flex items-center gap-4">
            {Object.keys(errors).length > 0 && (
              <span className="text-red-500 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" /> Có lỗi cần chỉnh sửa
              </span>
            )}
            {isDirty && Object.keys(errors).length === 0 && (
              <span className="text-amber-600 flex items-center gap-1">
                <Info className="w-4 h-4" /> Bấm lưu để áp dụng thay đổi
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
              onClick={handleSave}
              disabled={saving || !isDirty}
              className={`flex-1 sm:flex-none px-8 py-2.5 rounded-lg font-medium text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-sm ${isDirty ? "bg-amber-600 hover:bg-amber-700" : "bg-blue-600 hover:bg-blue-700"}`}
            >
              {saving ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" /> Đang cập nhật...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />{" "}
                  {isDirty ? "Lưu thay đổi" : "Đã đồng bộ"}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShippingZoneEditPage;
