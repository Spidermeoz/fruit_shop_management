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
  CheckCircle2,
  Copy,
  Globe,
  Loader2,
  MapPinned,
  Power,
  Save,
  Sparkles,
  Tag,
  History,
  AlertCircle,
  Info,
  ArrowRight,
  ShieldAlert,
  AlertTriangle,
} from "lucide-react";
import Card from "../../../components/admin/layouts/Card";
import { http } from "../../../services/http";
import { useAdminToast } from "../../../context/AdminToastContext";

interface LocationItem {
  name: string;
  code: number;
}

interface ShippingZoneDetail {
  id: number;
  code: string;
  name: string;
  province?: string | null;
  district?: string | null;
  ward?: string | null;
  baseFee: number;
  freeShipThreshold?: number | null;
  priority: number;
  status: "active" | "inactive";
  updatedAt?: string;
}

interface FormState {
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

type ApiDetail<T> = { success: boolean; data: T; message?: string };

const toFormData = (row: ShippingZoneDetail): FormState => ({
  code: row.code ?? "",
  name: row.name ?? "",
  province: row.province ?? "",
  district: row.district ?? "",
  ward: row.ward ?? "",
  baseFee: String(row.baseFee ?? 0),
  freeShipThreshold:
    row.freeShipThreshold === null || row.freeShipThreshold === undefined
      ? ""
      : String(row.freeShipThreshold),
  priority: String(row.priority ?? 0),
  status: row.status ?? "active",
});

const formatCurrency = (value?: string | number | null) => {
  if (value === "" || value === null || value === undefined) return "—";
  const n = Number(value);
  if (!Number.isFinite(n)) return "—";
  return `${n.toLocaleString("vi-VN")} đ`;
};

const normalizeCode = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .toUpperCase();

const getScope = (formData: FormState) => {
  if (formData.ward) return "ward";
  if (formData.district) return "district";
  if (formData.province) return "province";
  return "fallback";
};

const scopeLabelMap: Record<string, string> = {
  fallback: "Fallback toàn quốc",
  province: "Rule cấp tỉnh / thành",
  district: "Rule cấp quận / huyện",
  ward: "Rule cấp phường / xã",
};

const ShippingZoneEditPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { showSuccessToast, showErrorToast } = useAdminToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [togglingStatus, setTogglingStatus] = useState(false);
  const [detail, setDetail] = useState<ShippingZoneDetail | null>(null);
  const [formData, setFormData] = useState<FormState | null>(null);
  const [initialData, setInitialData] = useState<FormState | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [cities, setCities] = useState<LocationItem[]>([]);
  const [districts, setDistricts] = useState<LocationItem[]>([]);
  const [wards, setWards] = useState<LocationItem[]>([]);
  const fieldRefs = useRef<
    Record<string, HTMLInputElement | HTMLSelectElement | null>
  >({});

  const setFieldRef =
    (name: string) => (el: HTMLInputElement | HTMLSelectElement | null) => {
      fieldRefs.current[name] = el;
    };

  useEffect(() => {
    const fetchCities = async () => {
      try {
        const res = await fetch("https://provinces.open-api.vn/api/p/");
        const data = await res.json();
        setCities(Array.isArray(data) ? data : []);
      } catch {
        setCities([]);
      }
    };
    void fetchCities();
  }, []);

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        setLoading(true);
        const detailRes = await http<ApiDetail<ShippingZoneDetail>>(
          "GET",
          `/api/v1/admin/shipping-zones/edit/${id}`,
        );
        setDetail(detailRes.data);
        const mapped = toFormData(detailRes.data);
        setFormData(mapped);
        setInitialData(mapped);
      } catch (error: any) {
        showErrorToast(error?.message || "Không thể tải shipping zone.");
      } finally {
        setLoading(false);
      }
    };
    void fetchDetail();
  }, [id, showErrorToast]);

  useEffect(() => {
    const bootstrapLocation = async () => {
      if (!formData?.province) return;
      const city = cities.find((item) => item.name === formData.province);
      if (!city) return;

      const districtRes = await fetch(
        `https://provinces.open-api.vn/api/p/${city.code}?depth=2`,
      );
      const districtData = await districtRes.json();
      const nextDistricts = Array.isArray(districtData?.districts)
        ? districtData.districts
        : [];
      setDistricts(nextDistricts);

      if (!formData.district) return;
      const district = nextDistricts.find(
        (item: LocationItem) => item.name === formData.district,
      );
      if (!district) return;

      const wardRes = await fetch(
        `https://provinces.open-api.vn/api/d/${district.code}?depth=2`,
      );
      const wardData = await wardRes.json();
      setWards(Array.isArray(wardData?.wards) ? wardData.wards : []);
    };

    void bootstrapLocation();
  }, [cities, formData?.province, formData?.district]);

  const scope = useMemo(
    () => (formData ? getScope(formData) : "fallback"),
    [formData],
  );

  const isDirty = useMemo(
    () => JSON.stringify(formData) !== JSON.stringify(initialData),
    [formData, initialData],
  );

  const isStatusChanged = useMemo(
    () => formData?.status !== initialData?.status,
    [formData?.status, initialData?.status],
  );

  const areaLabel = useMemo(() => {
    if (!formData) return "—";
    const parts = [formData.ward, formData.district, formData.province].filter(
      Boolean,
    );
    return parts.length ? parts.join(", ") : "Fallback toàn quốc";
  }, [formData]);

  const impacts = useMemo(() => {
    if (!formData || !initialData) return [] as string[];
    const notes: string[] = [];

    if (getScope(formData) !== getScope(initialData)) {
      notes.push(
        "Scope của zone đã thay đổi; thứ tự match địa chỉ có thể bị ảnh hưởng mạnh.",
      );
    }

    if (formData.status !== initialData.status) {
      notes.push(
        formData.status === "inactive"
          ? "Zone sẽ bị tạm dừng và không còn tham gia resolve địa chỉ."
          : "Zone sẽ được bật lại trong shipping rules.",
      );
    }

    if (formData.priority !== initialData.priority) {
      notes.push(
        "Priority đã thay đổi; zone này có thể được ưu tiên hơn hoặc lùi xuống trong address resolve.",
      );
    }

    if (
      formData.baseFee !== initialData.baseFee ||
      formData.freeShipThreshold !== initialData.freeShipThreshold
    ) {
      notes.push(
        "Thông số giá đã đổi; quote ở mọi branch dùng zone này có thể thay đổi.",
      );
    }

    if (
      formData.province !== initialData.province ||
      formData.district !== initialData.district ||
      formData.ward !== initialData.ward
    ) {
      notes.push(
        "Phạm vi địa lý đã đổi; coverage và vùng địa chỉ được match có thể khác trước.",
      );
    }

    return notes;
  }, [formData, initialData]);

  const loadDistricts = async (cityName: string) => {
    const city = cities.find((item) => item.name === cityName);
    if (!city) {
      setDistricts([]);
      return;
    }

    const res = await fetch(
      `https://provinces.open-api.vn/api/p/${city.code}?depth=2`,
    );
    const data = await res.json();
    setDistricts(Array.isArray(data?.districts) ? data.districts : []);
  };

  const loadWards = async (districtName: string) => {
    const district = districts.find((item) => item.name === districtName);
    if (!district) {
      setWards([]);
      return;
    }

    const res = await fetch(
      `https://provinces.open-api.vn/api/d/${district.code}?depth=2`,
    );
    const data = await res.json();
    setWards(Array.isArray(data?.wards) ? data.wards : []);
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

  const validate = () => {
    if (!formData) return false;
    const nextErrors: Record<string, string> = {};

    if (!formData.name.trim()) nextErrors.name = "Vui lòng nhập tên zone.";
    if (!formData.code.trim()) nextErrors.code = "Vui lòng nhập code.";

    if (
      !Number.isFinite(Number(formData.baseFee)) ||
      Number(formData.baseFee) < 0
    ) {
      nextErrors.baseFee = "Base fee không hợp lệ.";
    }

    if (
      formData.freeShipThreshold &&
      (!Number.isFinite(Number(formData.freeShipThreshold)) ||
        Number(formData.freeShipThreshold) < 0)
    ) {
      nextErrors.freeShipThreshold = "Ngưỡng freeship không hợp lệ.";
    }

    if (
      !Number.isFinite(Number(formData.priority)) ||
      !Number.isInteger(Number(formData.priority)) ||
      Number(formData.priority) < 0
    ) {
      nextErrors.priority = "Priority phải là số nguyên không âm.";
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      scrollToFirstError(nextErrors);
      return false;
    }
    return true;
  };

  const handleChange = async (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    if (!formData) return;
    const { name, value } = e.target;
    const nextValue = name === "code" ? normalizeCode(value) : value;

    setFormData((prev) => (prev ? { ...prev, [name]: nextValue } : prev));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));

    if (name === "province") {
      setFormData((prev) =>
        prev ? { ...prev, province: value, district: "", ward: "" } : prev,
      );
      setDistricts([]);
      setWards([]);
      await loadDistricts(value);
      return;
    }

    if (name === "district") {
      setFormData((prev) =>
        prev ? { ...prev, district: value, ward: "" } : prev,
      );
      setWards([]);
      await loadWards(value);
    }
  };

  const fillSuggestedNameAndCode = () => {
    if (!formData) return;
    const name =
      scope === "fallback"
        ? "Zone mặc định toàn quốc"
        : [formData.ward, formData.district, formData.province]
            .filter(Boolean)
            .join(" - ");

    setFormData({ ...formData, name, code: normalizeCode(name || "ZONE") });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!formData || !validate()) return;

    try {
      setSaving(true);
      await http("PATCH", `/api/v1/admin/shipping-zones/edit/${id}`, {
        code: formData.code,
        name: formData.name,
        province: formData.province || null,
        district: formData.district || null,
        ward: formData.ward || null,
        baseFee: Number(formData.baseFee || 0),
        freeShipThreshold:
          formData.freeShipThreshold === ""
            ? null
            : Number(formData.freeShipThreshold),
        priority: Number(formData.priority || 0),
        status: formData.status,
      });

      showSuccessToast({ message: "Đã cập nhật shipping zone." });
      setInitialData(formData);
      setErrors({});
    } catch (error: any) {
      showErrorToast(error?.message || "Không thể cập nhật shipping zone.");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async () => {
    if (!formData) return;
    const nextStatus = formData.status === "active" ? "inactive" : "active";

    try {
      setTogglingStatus(true);
      await http("PATCH", `/api/v1/admin/shipping-zones/${id}/status`, {
        status: nextStatus,
      });

      setFormData({ ...formData, status: nextStatus });
      setInitialData((prev) => (prev ? { ...prev, status: nextStatus } : prev));

      showSuccessToast({
        message:
          nextStatus === "active"
            ? "Đã bật shipping zone."
            : "Đã tạm dừng shipping zone.",
      });
    } catch (error: any) {
      showErrorToast(
        error?.message || "Không thể đổi trạng thái shipping zone.",
      );
    } finally {
      setTogglingStatus(false);
    }
  };

  if (loading || !formData || !initialData) {
    return (
      <div className="flex flex-col justify-center items-center py-32 max-w-7xl mx-auto">
        <Loader2 className="w-10 h-10 animate-spin text-blue-600 mb-4" />
        <span className="text-gray-800 dark:text-gray-200 font-bold text-lg">
          Đang tải dữ liệu shipping zone...
        </span>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto pb-24">
      {/* Header & Intro */}
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
              Chỉnh sửa shipping zone
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
            Điều chỉnh zone theo hướng vận hành: scope, pricing, priority và
            trạng thái kích hoạt.
          </p>
        </div>

        <div className="hidden lg:flex items-center gap-2 bg-blue-50 dark:bg-blue-900/30 border border-blue-100 dark:border-blue-800 text-blue-700 dark:text-blue-300 px-4 py-2.5 rounded-lg text-sm">
          <History className="w-4 h-4" />
          {detail?.updatedAt
            ? `Cập nhật gần nhất: ${new Date(detail.updatedAt).toLocaleString("vi-VN")}`
            : "Đang chỉnh sửa zone hiện có"}
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="grid grid-cols-1 xl:grid-cols-3 gap-6 lg:gap-8"
      >
        {/* CỘT TRÁI: FORM BUILDER */}
        <div className="xl:col-span-2 space-y-6">
          {/* Section 1: Thông tin định danh */}
          <Card>
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-100 dark:border-gray-700">
              <Tag className="w-5 h-5 text-gray-400" />
              <h2 className="text-lg font-bold text-gray-800 dark:text-white">
                1. Thông tin định danh
              </h2>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Tên và mã zone cần nhất quán để coverage và workflow dễ quản trị.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  Tên zone <span className="text-red-500">*</span>
                </label>
                <input
                  ref={setFieldRef("name")}
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Ví dụ: Zone Hoàng Mai"
                  className={`w-full border rounded-lg p-2.5 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all ${
                    errors.name
                      ? "border-red-500"
                      : "border-gray-300 dark:border-gray-600"
                  }`}
                />
                {errors.name && (
                  <p className="text-xs text-red-600 mt-1.5">{errors.name}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  Mã code <span className="text-red-500">*</span>
                </label>
                <input
                  ref={setFieldRef("code")}
                  name="code"
                  value={formData.code}
                  onChange={handleChange}
                  placeholder="ZONE_HOANG_MAI"
                  className={`w-full border rounded-lg p-2.5 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all font-mono ${
                    errors.code
                      ? "border-red-500"
                      : "border-gray-300 dark:border-gray-600"
                  }`}
                />
                {errors.code && (
                  <p className="text-xs text-red-600 mt-1.5">{errors.code}</p>
                )}
              </div>
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={fillSuggestedNameAndCode}
                className="px-3 py-2 flex items-center gap-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
              >
                <Sparkles className="w-4 h-4" /> Gợi ý lại tên & code
              </button>
              <button
                type="button"
                onClick={() =>
                  navigate(
                    `/admin/shipping/zones/create?templateId=${detail?.id}`,
                  )
                }
                className="px-3 py-2 flex items-center gap-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
              >
                <Copy className="w-4 h-4" /> Nhân bản zone này
              </button>
            </div>
          </Card>

          {/* Section 2: Phạm vi địa lý */}
          <Card>
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-100 dark:border-gray-700">
              <MapPinned className="w-5 h-5 text-gray-400" />
              <h2 className="text-lg font-bold text-gray-800 dark:text-white">
                2. Phạm vi địa lý
              </h2>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Điều chỉnh scope match địa chỉ của zone.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  Tỉnh / thành
                </label>
                <select
                  ref={setFieldRef("province")}
                  name="province"
                  value={formData.province}
                  onChange={handleChange}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg p-2.5 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                >
                  <option value="">Fallback toàn quốc</option>
                  {cities.map((city) => (
                    <option key={city.code} value={city.name}>
                      {city.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  Quận / huyện
                </label>
                <select
                  ref={setFieldRef("district")}
                  name="district"
                  value={formData.district}
                  onChange={handleChange}
                  disabled={!formData.province}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg p-2.5 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="">Không chọn</option>
                  {districts.map((district) => (
                    <option key={district.code} value={district.name}>
                      {district.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  Phường / xã
                </label>
                <select
                  ref={setFieldRef("ward")}
                  name="ward"
                  value={formData.ward}
                  onChange={handleChange}
                  disabled={!formData.district}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg p-2.5 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="">Không chọn</option>
                  {wards.map((ward) => (
                    <option key={ward.code} value={ward.name}>
                      {ward.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </Card>

          {/* Section 3: Giá & hành vi */}
          <Card>
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-100 dark:border-gray-700">
              <Globe className="w-5 h-5 text-gray-400" />
              <h2 className="text-lg font-bold text-gray-800 dark:text-white">
                3. Giá & hành vi áp dụng
              </h2>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Điều chỉnh pricing, freeship, priority và trạng thái.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  Base fee <span className="text-red-500">*</span>
                </label>
                <input
                  ref={setFieldRef("baseFee")}
                  name="baseFee"
                  type="number"
                  min={0}
                  value={formData.baseFee}
                  onChange={handleChange}
                  className={`w-full border rounded-lg p-2.5 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all ${
                    errors.baseFee
                      ? "border-red-500"
                      : "border-gray-300 dark:border-gray-600"
                  }`}
                />
                {errors.baseFee && (
                  <p className="text-xs text-red-600 mt-1.5">
                    {errors.baseFee}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  Freeship threshold
                </label>
                <input
                  ref={setFieldRef("freeShipThreshold")}
                  name="freeShipThreshold"
                  type="number"
                  min={0}
                  value={formData.freeShipThreshold}
                  onChange={handleChange}
                  placeholder="Bỏ trống nếu không dùng"
                  className={`w-full border rounded-lg p-2.5 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all ${
                    errors.freeShipThreshold
                      ? "border-red-500"
                      : "border-gray-300 dark:border-gray-600"
                  }`}
                />
                {errors.freeShipThreshold && (
                  <p className="text-xs text-red-600 mt-1.5">
                    {errors.freeShipThreshold}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  Priority <span className="text-red-500">*</span>
                </label>
                <input
                  ref={setFieldRef("priority")}
                  name="priority"
                  type="number"
                  min={0}
                  value={formData.priority}
                  onChange={handleChange}
                  className={`w-full border rounded-lg p-2.5 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all ${
                    errors.priority
                      ? "border-red-500"
                      : "border-gray-300 dark:border-gray-600"
                  }`}
                />
                {errors.priority && (
                  <p className="text-xs text-red-600 mt-1.5">
                    {errors.priority}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  Trạng thái
                </label>
                <select
                  ref={setFieldRef("status")}
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg p-2.5 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-sm font-medium focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                >
                  <option value="active">Đang chạy</option>
                  <option value="inactive">Tạm dừng</option>
                </select>
              </div>
            </div>
          </Card>

          {/* Section 4: Ảnh hưởng thay đổi */}
          <Card className={impacts.length ? "border-amber-200" : ""}>
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-100 dark:border-gray-700">
              <ShieldAlert
                className={`w-5 h-5 ${
                  impacts.length ? "text-amber-500" : "text-gray-400"
                }`}
              />
              <h2 className="text-lg font-bold text-gray-800 dark:text-white">
                4. Ảnh hưởng thay đổi
              </h2>
            </div>

            {impacts.length === 0 ? (
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Chưa có thay đổi nào so với dữ liệu ban đầu.
              </div>
            ) : (
              <div className="space-y-3">
                {impacts.map((impact, index) => (
                  <div
                    key={index}
                    className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800"
                  >
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                      <span>{impact}</span>
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
                <Info className="w-5 h-5" /> Live Preview
              </div>

              <div className="space-y-4 text-sm">
                <div>
                  <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                    Tên hiển thị & Định danh
                  </div>
                  <div className="font-bold text-gray-900 dark:text-white">
                    {formData.name || "Chưa có tên"}
                  </div>
                  <div className="text-xs font-mono text-gray-500 mt-1">
                    {formData.code || "CHUA_CO_CODE"}
                  </div>
                </div>

                <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                  <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                    Scope
                  </div>
                  <div className="font-bold text-gray-900 dark:text-white">
                    {scopeLabelMap[scope]}
                  </div>
                  <div className="mt-1 text-xs text-gray-500">{areaLabel}</div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                  <div>
                    <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                      Base fee
                    </div>
                    <div className="font-bold text-gray-900 dark:text-white">
                      {formatCurrency(formData.baseFee)}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                      Freeship
                    </div>
                    <div className="font-bold text-gray-900 dark:text-white">
                      {formatCurrency(formData.freeShipThreshold)}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                  <div>
                    <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                      Priority
                    </div>
                    <div className="font-bold text-gray-900 dark:text-white">
                      {formData.priority || "—"}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                      Trạng thái
                    </div>
                    <div className="font-bold text-gray-900 dark:text-white">
                      {formData.status === "active" ? "Đang chạy" : "Tạm dừng"}
                    </div>
                  </div>
                </div>

                {detail?.updatedAt && (
                  <div className="pt-3 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-500">
                    Cập nhật lúc:{" "}
                    {new Date(detail.updatedAt).toLocaleString("vi-VN")}
                  </div>
                )}
              </div>
            </Card>

            <Card className="bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
              <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200 mb-3 flex items-center gap-2">
                <ArrowRight className="w-4 h-4" /> Bước tiếp theo
              </h3>
              <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed mb-4">
                Sau khi chỉnh sửa zone xong, bạn có thể quay lại workspace zone
                hoặc mở coverage để rà chi nhánh nào đang dùng rule này.
              </p>
              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => navigate("/admin/shipping/zones")}
                  className="flex items-center gap-2 justify-center px-3 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                >
                  <CheckCircle2 className="w-4 h-4" /> Về workspace zones
                </button>
                <button
                  type="button"
                  onClick={() => navigate("/admin/shipping/service-areas")}
                  className="flex items-center gap-2 justify-center px-3 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                >
                  <MapPinned className="w-4 h-4" /> Mở workspace coverage
                </button>
              </div>
            </Card>

            {isStatusChanged && (
              <Card className="bg-amber-50 border border-amber-200">
                <h3 className="text-sm font-bold text-amber-800 mb-3 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" /> Trạng thái đã đổi
                </h3>
                <p className="text-xs text-amber-700 leading-relaxed">
                  Bạn đang thay đổi trạng thái của template này. Hãy lưu để cập
                  nhật hệ thống, hoặc dùng nút bật / tắt nhanh ở thanh hành
                  động.
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
              {formData.status === "active" ? "Tạm dừng" : "Bật lại"}
            </button>

            <button
              type="button"
              onClick={() => navigate("/admin/shipping/zones")}
              className="flex-1 sm:flex-none px-6 py-2.5 rounded-lg font-medium bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-200 transition-colors"
            >
              Quay lại
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

export default ShippingZoneEditPage;
