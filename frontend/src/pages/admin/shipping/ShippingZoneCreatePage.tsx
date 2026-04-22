import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  Copy,
  Globe,
  Loader2,
  MapPinned,
  Plus,
  Sparkles,
  Tag,
  Save,
  ArrowRight,
  AlertCircle,
} from "lucide-react";
import Card from "../../../components/admin/layouts/Card";
import { http } from "../../../services/http";
import { useAdminToast } from "../../../context/AdminToastContext";

interface ShippingZoneRow {
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
}

interface LocationItem {
  name: string;
  code: number;
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

type ApiList<T> = {
  success?: boolean;
  data?: T[] | { items?: T[]; rows?: T[] };
};

const initialForm: FormState = {
  code: "",
  name: "",
  province: "",
  district: "",
  ward: "",
  baseFee: "0",
  freeShipThreshold: "",
  priority: "999",
  status: "active",
};

const formatCurrency = (value?: string | number | null) => {
  if (value === "" || value === null || value === undefined) return "—";
  const n = Number(value);
  if (!Number.isFinite(n)) return "—";
  return `${n.toLocaleString("vi-VN")} đ`;
};

const removeVietnameseTones = (str: string) => {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // bỏ dấu
    .replace(/[đĐ]/g, "d"); // xử lý riêng đ
};

const normalizeCode = (value: string) =>
  removeVietnameseTones(value)
    .replace(/[^a-zA-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .toUpperCase();

const getScope = (formData: FormState) => {
  if (formData.ward) return "ward";
  if (formData.district) return "district";
  if (formData.province) return "province";
  return "fallback";
};

const suggestPriority = (scope: string) => {
  switch (scope) {
    case "ward":
      return "1";
    case "district":
      return "5";
    case "province":
      return "10";
    default:
      return "999";
  }
};

const toArray = <T,>(input: ApiList<T>["data"] | undefined): T[] => {
  if (Array.isArray(input)) return input;
  if (Array.isArray(input?.items)) return input.items;
  if (Array.isArray((input as { rows?: T[] } | undefined)?.rows)) {
    return ((input as { rows?: T[] }).rows ?? []) as T[];
  }
  return [];
};

const ShippingZoneCreatePage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { showSuccessToast, showErrorToast } = useAdminToast();

  const [formData, setFormData] = useState<FormState>(initialForm);
  const [templateZones, setTemplateZones] = useState<ShippingZoneRow[]>([]);
  const [templateId, setTemplateId] = useState("");
  const [loading, setLoading] = useState(false);
  const [bootstrapLoading, setBootstrapLoading] = useState(true);
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
    const fetchBootstrap = async () => {
      try {
        setBootstrapLoading(true);
        const zonesRes = await http<ApiList<ShippingZoneRow>>(
          "GET",
          "/api/v1/admin/shipping-zones?limit=1000",
        );
        setTemplateZones(toArray(zonesRes?.data));
      } catch (error: any) {
        showErrorToast(error?.message || "Không thể tải zone mẫu.");
      } finally {
        setBootstrapLoading(false);
      }
    };
    void fetchBootstrap();
  }, [showErrorToast]);

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
    const template = searchParams.get("templateId");
    if (template) setTemplateId(template);
  }, [searchParams]);

  useEffect(() => {
    const chosen = templateZones.find((zone) => String(zone.id) === templateId);
    if (!chosen) return;

    setFormData((prev) => ({
      ...prev,
      baseFee: String(chosen.baseFee ?? 0),
      freeShipThreshold:
        chosen.freeShipThreshold === null ||
        chosen.freeShipThreshold === undefined
          ? ""
          : String(chosen.freeShipThreshold),
      priority: String(chosen.priority ?? suggestPriority(getScope(prev))),
      status: chosen.status ?? "active",
    }));
  }, [templateId, templateZones]);

  useEffect(() => {
    const scope = getScope(formData);
    setFormData((prev) => {
      const suggested = suggestPriority(scope);
      if (
        prev.priority &&
        prev.priority !== "999" &&
        prev.priority !== "10" &&
        prev.priority !== "5" &&
        prev.priority !== "1"
      ) {
        return prev;
      }
      return { ...prev, priority: suggested };
    });
  }, [formData.province, formData.district, formData.ward]);

  const selectedTemplate = useMemo(
    () => templateZones.find((zone) => String(zone.id) === templateId) || null,
    [templateId, templateZones],
  );

  const scope = useMemo(() => getScope(formData), [formData]);

  const areaLabel = useMemo(() => {
    const parts = [formData.ward, formData.district, formData.province].filter(
      Boolean,
    );
    return parts.length ? parts.join(", ") : "Fallback toàn quốc";
  }, [formData]);

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

    const firstKey = Object.keys(nextErrors)[0];
    if (firstKey) {
      scrollToFirstError(nextErrors);
    }

    return Object.keys(nextErrors).length === 0;
  };

  const handleChange = async (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    const nextValue = name === "code" ? normalizeCode(value) : value;

    setFormData((prev) => ({ ...prev, [name]: nextValue }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));

    if (name === "province") {
      setFormData((prev) => ({
        ...prev,
        province: value,
        district: "",
        ward: "",
      }));
      setDistricts([]);
      setWards([]);
      await loadDistricts(value);
      return;
    }

    if (name === "district") {
      setFormData((prev) => ({
        ...prev,
        district: value,
        ward: "",
      }));
      setWards([]);
      await loadWards(value);
      return;
    }
  };

  const fillSuggestedNameAndCode = () => {
    const name =
      scope === "fallback"
        ? "Zone mặc định toàn quốc"
        : [formData.ward, formData.district, formData.province]
            .filter(Boolean)
            .join(" - ");

    const code = normalizeCode(name || "ZONE_MOI");
    setFormData((prev) => ({ ...prev, name, code }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      setLoading(true);
      await http("POST", "/api/v1/admin/shipping-zones/create", {
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

      showSuccessToast({ message: "Đã tạo shipping zone." });
      navigate("/admin/shipping/zones");
    } catch (error: any) {
      showErrorToast(error?.message || "Không thể tạo shipping zone.");
    } finally {
      setLoading(false);
    }
  };

  // Helper để đồng bộ class CSS của các ô input
  const getInputClass = (error?: string) =>
    `w-full border rounded-lg p-2.5 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all ${
      error ? "border-red-500" : "border-gray-300 dark:border-gray-600"
    }`;

  return (
    <div className="max-w-7xl mx-auto pb-24">
      {/* Tầng A: Header & Intro */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
        <div>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-blue-600 transition-colors mb-2"
          >
            <ArrowLeft className="w-4 h-4" /> Quay lại danh sách
          </button>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            Tạo shipping zone
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1.5">
            Tạo nhanh theo hướng vận hành: chọn mẫu có sẵn, sinh code/name tự
            động và tối ưu priority theo scope.
          </p>
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="grid grid-cols-1 xl:grid-cols-3 gap-6 lg:gap-8"
      >
        {/* CỘT TRÁI: FORM BUILDER */}
        <div className="xl:col-span-2 space-y-6">
          {/* Section 1: Tạo từ zone có sẵn */}
          <Card>
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100 dark:border-gray-700">
              <div className="flex items-center gap-2">
                <Copy className="w-5 h-5 text-gray-400" />
                <h2 className="text-lg font-bold text-gray-800 dark:text-white">
                  1. Tạo từ zone có sẵn
                </h2>
              </div>
            </div>

            <p className="text-sm text-gray-600 dark:text-gray-400 mb-5">
              Sao chép base fee, freeship, priority và status từ một zone mẫu để
              nhập nhanh hơn.
            </p>

            <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_auto]">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  Zone mẫu
                </label>
                <select
                  value={templateId}
                  onChange={(e) => setTemplateId(e.target.value)}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg p-2.5 bg-white dark:bg-gray-800 text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                  disabled={bootstrapLoading}
                >
                  <option value="">Không dùng zone mẫu</option>
                  {templateZones.map((zone) => (
                    <option key={zone.id} value={zone.id}>
                      {zone.code} — {zone.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-end">
                <button
                  type="button"
                  onClick={() =>
                    selectedTemplate &&
                    navigate(
                      `/admin/shipping/zones/edit/${selectedTemplate.id}`,
                    )
                  }
                  disabled={!selectedTemplate}
                  className="px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-600 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Mở zone mẫu
                </button>
              </div>
            </div>

            {selectedTemplate && (
              <div className="mt-5 rounded-lg border border-blue-200 bg-blue-50/50 p-4 text-sm text-blue-800 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-300">
                <div className="font-semibold mb-2">
                  Đang lấy cấu hình từ: {selectedTemplate.name}
                </div>
                <div className="grid gap-2 md:grid-cols-2 text-sm">
                  <div>
                    <span className="opacity-70">Base fee:</span>{" "}
                    {formatCurrency(selectedTemplate.baseFee)}
                  </div>
                  <div>
                    <span className="opacity-70">Freeship:</span>{" "}
                    {formatCurrency(selectedTemplate.freeShipThreshold)}
                  </div>
                  <div>
                    <span className="opacity-70">Priority:</span>{" "}
                    {selectedTemplate.priority}
                  </div>
                  <div>
                    <span className="opacity-70">Status:</span>{" "}
                    {selectedTemplate.status === "active"
                      ? "Đang chạy"
                      : "Tạm dừng"}
                  </div>
                </div>
              </div>
            )}
          </Card>

          {/* Section 2: Thông tin định danh */}
          <Card>
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-100 dark:border-gray-700">
              <Tag className="w-5 h-5 text-gray-400" />
              <h2 className="text-lg font-bold text-gray-800 dark:text-white">
                2. Thông tin định danh
              </h2>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-5">
              Tên và mã zone cần rõ ràng để dùng tiếp cho coverage.
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
                  className={getInputClass(errors.name)}
                />
                {errors.name && (
                  <p className="mt-1.5 text-xs text-red-600">{errors.name}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  Code <span className="text-red-500">*</span>
                </label>
                <input
                  ref={setFieldRef("code")}
                  name="code"
                  value={formData.code}
                  onChange={handleChange}
                  placeholder="ZONE_HOANG_MAI"
                  className={`${getInputClass(errors.code)} font-mono`}
                />
                {errors.code && (
                  <p className="mt-1.5 text-xs text-red-600">{errors.code}</p>
                )}
              </div>
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={fillSuggestedNameAndCode}
                className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition flex items-center gap-2"
              >
                <Sparkles className="h-4 w-4" />
                Gợi ý tên & code
              </button>
            </div>
          </Card>

          {/* Section 3: Phạm vi địa lý */}
          <Card>
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-100 dark:border-gray-700">
              <MapPinned className="w-5 h-5 text-gray-400" />
              <h2 className="text-lg font-bold text-gray-800 dark:text-white">
                3. Phạm vi địa lý
              </h2>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-5">
              Chọn phạm vi match của zone. Càng cụ thể thì priority thường càng
              nhỏ.
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
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg p-2.5 bg-white dark:bg-gray-800 text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none"
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
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg p-2.5 bg-white dark:bg-gray-800 text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-gray-100 dark:disabled:bg-gray-700 disabled:cursor-not-allowed"
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
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg p-2.5 bg-white dark:bg-gray-800 text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-gray-100 dark:disabled:bg-gray-700 disabled:cursor-not-allowed"
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

          {/* Section 4: Giá & hành vi áp dụng */}
          <Card>
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-100 dark:border-gray-700">
              <Globe className="w-5 h-5 text-gray-400" />
              <h2 className="text-lg font-bold text-gray-800 dark:text-white">
                4. Giá & hành vi áp dụng
              </h2>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-5">
              Base fee, freeship, priority và trạng thái vận hành.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  Base fee
                </label>
                <input
                  ref={setFieldRef("baseFee")}
                  name="baseFee"
                  type="number"
                  min={0}
                  value={formData.baseFee}
                  onChange={handleChange}
                  className={getInputClass(errors.baseFee)}
                />
                {errors.baseFee && (
                  <p className="mt-1.5 text-xs text-red-600">
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
                  className={getInputClass(errors.freeShipThreshold)}
                />
                {errors.freeShipThreshold && (
                  <p className="mt-1.5 text-xs text-red-600">
                    {errors.freeShipThreshold}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  Priority
                </label>
                <input
                  ref={setFieldRef("priority")}
                  name="priority"
                  type="number"
                  min={0}
                  value={formData.priority}
                  onChange={handleChange}
                  className={getInputClass(errors.priority)}
                />
                {errors.priority && (
                  <p className="mt-1.5 text-xs text-red-600">
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
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg p-2.5 bg-white dark:bg-gray-800 text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="active">Đang chạy</option>
                  <option value="inactive">Tạm dừng</option>
                </select>
              </div>
            </div>
          </Card>
        </div>

        {/* CỘT PHẢI: LIVE PREVIEW PANEL */}
        <div className="xl:col-span-1">
          <div className="sticky top-24 space-y-6">
            <Card className="border-blue-100 dark:border-blue-900/50 bg-gradient-to-br from-blue-50 to-white dark:from-gray-800 dark:to-gray-800/80 shadow-sm overflow-hidden">
              <div className="bg-blue-600 text-white px-4 py-3 -mx-6 -mt-6 mb-5 flex items-center gap-2 font-bold shadow-sm">
                <Sparkles className="w-5 h-5" /> Live Preview Rule
              </div>

              <div className="space-y-4 text-sm">
                <div>
                  <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                    Scope
                  </div>
                  <div className="font-bold text-gray-900 dark:text-white">
                    {scope === "fallback"
                      ? "Fallback toàn hệ thống"
                      : scope === "province"
                        ? "Rule cấp tỉnh / thành"
                        : scope === "district"
                          ? "Rule cấp quận / huyện"
                          : "Rule cấp phường / xã"}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">{areaLabel}</div>
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
                      Status
                    </div>
                    <div className="font-bold text-gray-900 dark:text-white">
                      {formData.status === "active" ? "Đang chạy" : "Tạm dừng"}
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
              <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200 mb-3 flex items-center gap-2">
                <ArrowRight className="w-4 h-4" /> Bước tiếp theo
              </h3>
              <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed mb-4">
                Sau khi tạo zone xong, bạn có thể chuyển sang màn hình coverage
                để gán zone này vào các chi nhánh phù hợp.
              </p>

              <button
                type="button"
                onClick={() => navigate("/admin/shipping/service-areas")}
                className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border border-gray-200 dark:border-gray-600 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-700 transition"
              >
                <MapPinned className="w-4 h-4" /> Mở workspace coverage
              </button>
            </Card>
          </div>
        </div>
      </form>

      {/* Action Bar (Fixed Bottom) */}
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
                  <Loader2 className="w-5 h-5 animate-spin" /> Đang tạo zone...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" /> Lưu shipping zone
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Loader hiển thị cho Bootstrap API */}
      {bootstrapLoading && (
        <div className="fixed bottom-24 right-6 inline-flex items-center gap-2 rounded-full bg-gray-900 dark:bg-gray-100 px-4 py-2 text-sm font-medium text-white dark:text-gray-900 shadow-lg z-30">
          <Loader2 className="h-4 w-4 animate-spin" />
          Đang tải zone mẫu...
        </div>
      )}
    </div>
  );
};

export default ShippingZoneCreatePage;
