import React, {
  useEffect,
  useMemo,
  useState,
  type ChangeEvent,
} from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Loader2,
  Save,
  Store,
  Truck,
  Activity,
  MapPin,
  Phone,
  Mail,
  Clock,
  CheckCircle2,
  AlertCircle,
  Map,
  CalendarDays,
  Package,
  Layers,
  Info,
  Clock3,
  AlertTriangle,
} from "lucide-react";
import Card from "../../../components/admin/layouts/Card";
import { http } from "../../../services/http";
import { useAdminToast } from "../../../context/AdminToastContext";

// =============================
// TYPES & INTERFACES
// =============================
type BranchMode = "pickup-only" | "delivery-only" | "hybrid" | "unconfigured";

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

interface LocationItem {
  name: string;
  code: number;
}

// Map API data to Form Data
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

// Infer Mode from booleans
const getInitialMode = (pickup: boolean, delivery: boolean): BranchMode => {
  if (pickup && delivery) return "hybrid";
  if (pickup) return "pickup-only";
  if (delivery) return "delivery-only";
  return "unconfigured";
};

// =============================
// MAIN COMPONENT
// =============================
const BranchEditPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showSuccessToast, showErrorToast } = useAdminToast();

  // --- States ---
  const [formData, setFormData] = useState<BranchFormData | null>(null);
  const [initialData, setInitialData] = useState<BranchFormData | null>(null);
  const [branchMode, setBranchMode] = useState<BranchMode>("hybrid");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Location Selector States
  const [cities, setCities] = useState<LocationItem[]>([]);
  const [districts, setDistricts] = useState<LocationItem[]>([]);
  const [wards, setWards] = useState<LocationItem[]>([]);
  const [cityLoaded, setCityLoaded] = useState(false);

  // --- Derived State (IsDirty) ---
  const isDirty = useMemo(() => {
    if (!formData || !initialData) return false;
    // Bỏ qua createdAt/updatedAt khi so sánh
    const current = { ...formData, updatedAt: null };
    const initial = { ...initialData, updatedAt: null };
    return JSON.stringify(current) !== JSON.stringify(initial);
  }, [formData, initialData]);

  // --- Readiness Logic (Realtime) ---
  const readiness = useMemo(() => {
    if (!formData) return null;
    const hasNameCode =
      formData.name.trim().length > 0 && formData.code.trim().length > 0;
    const hasPhone = formData.phone.trim().length >= 10;
    const hasEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim());
    const hasContact = hasPhone || hasEmail;

    const hasAddressBase =
      formData.addressLine1.trim().length > 0 &&
      formData.province.trim().length > 0 &&
      formData.district.trim().length > 0;

    const hasGeo =
      formData.latitude.trim().length > 0 &&
      formData.longitude.trim().length > 0;

    // Time validation: open < close
    let hasValidTime = false;
    if (formData.openTime && formData.closeTime) {
      const [hOpen, mOpen] = formData.openTime.split(":").map(Number);
      const [hClose, mClose] = formData.closeTime.split(":").map(Number);
      hasValidTime = hOpen * 60 + mOpen < hClose * 60 + mClose;
    }

    const deliveryReady =
      branchMode === "pickup-only" || hasAddressBase;

    return {
      identity: hasNameCode,
      contact: hasContact,
      address: hasAddressBase,
      geo: hasGeo,
      time: hasValidTime,
      deliveryReady,
    };
  }, [formData, branchMode]);

  const softWarnings = useMemo(() => {
    if (!formData || !readiness) return [];
    const warnings: string[] = [];

    if (branchMode === "unconfigured")
      warnings.push("Chưa cấu hình mô hình phục vụ.");
    if (!readiness.contact)
      warnings.push("Chưa có thông tin liên hệ vận hành.");
    if (!readiness.geo)
      warnings.push("Thiếu tọa độ, có thể ảnh hưởng luồng bản đồ.");
    if (branchMode !== "pickup-only" && !readiness.address) {
      warnings.push("Chi nhánh có Giao hàng cần địa chỉ nền tảng để tính phí.");
    }
    if (formData.status === "inactive" && branchMode !== "pickup-only") {
      warnings.push("Chi nhánh đang tạm dừng nhưng vẫn bật luồng Giao hàng.");
    }
    return warnings;
  }, [formData, readiness, branchMode]);

  const fullAddressPreview = useMemo(() => {
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

  // --- Fetch Data ---
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
        setBranchMode(
          getInitialMode(mapped.supportsPickup, mapped.supportsDelivery),
        );
      } else {
        showErrorToast("Không thể tải dữ liệu Workspace.");
      }
    } catch (err: any) {
      showErrorToast(err?.message || "Lỗi tải dữ liệu Workspace.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // --- Location Handlers ---
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
    if (formData) syncAddressOptions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData?.province, formData?.district]);

  // --- Form Handlers ---
  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    if (!formData) return;
    const { name, value } = e.target;
    const nextValue = name === "code" ? value.toUpperCase().trim() : value;
    setFormData((prev) => (prev ? { ...prev, [name]: nextValue } : prev));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleModeChange = (mode: BranchMode) => {
    setBranchMode(mode);
    setFormData((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        supportsPickup: mode === "pickup-only" || mode === "hybrid",
        supportsDelivery: mode === "delivery-only" || mode === "hybrid",
      };
    });
  };

  const validate = () => {
    if (!formData) return false;
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) newErrors.name = "Yêu cầu nhập tên.";
    if (!formData.code.trim()) newErrors.code = "Yêu cầu nhập mã.";

    if (
      formData.email.trim() &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())
    ) {
      newErrors.email = "Email không hợp lệ.";
    }
    if (
      formData.phone.trim() &&
      !/^(\+84|0)\d{9,10}$/.test(formData.phone.trim())
    ) {
      newErrors.phone = "Số điện thoại không hợp lệ.";
    }

    if (formData.supportsDelivery) {
      if (!formData.addressLine1.trim())
        newErrors.addressLine1 = "Chi nhánh giao hàng yêu cầu địa chỉ dòng 1.";
      if (!formData.province.trim()) newErrors.province = "Yêu cầu Tỉnh/Thành.";
      if (!formData.district.trim()) newErrors.district = "Yêu cầu Quận/Huyện.";
    }

    if (
      formData.latitude.trim() &&
      !Number.isFinite(Number(formData.latitude.trim()))
    )
      newErrors.latitude = "Vĩ độ không hợp lệ.";
    if (
      formData.longitude.trim() &&
      !Number.isFinite(Number(formData.longitude.trim()))
    )
      newErrors.longitude = "Kinh độ không hợp lệ.";

    if (formData.openTime && formData.closeTime) {
      const [hOpen, mOpen] = formData.openTime.split(":").map(Number);
      const [hClose, mClose] = formData.closeTime.split(":").map(Number);
      if (hOpen * 60 + mOpen >= hClose * 60 + mClose) {
        newErrors.closeTime = "Giờ đóng cửa phải sau giờ mở cửa.";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!formData || !validate()) {
      showErrorToast("Vui lòng kiểm tra lại thông tin nhập.");
      return;
    }

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
        showSuccessToast({ message: "Lưu thay đổi thành công!" });
        // Update initial data so isDirty becomes false. DO NOT navigate away.
        const updatedData = {
          ...formData,
          updatedAt: new Date().toISOString(),
        };
        setFormData(updatedData);
        setInitialData(updatedData);
      } else {
        showErrorToast(res?.message || "Lưu thất bại.");
      }
    } catch (err: any) {
      showErrorToast(err?.message || "Lỗi hệ thống.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center py-32">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <span className="mt-4 text-gray-500 font-medium">
          Đang tải Workspace...
        </span>
      </div>
    );
  }

  if (!formData || !readiness) {
    return (
      <div className="flex flex-col items-center py-20 text-center">
        <AlertTriangle className="w-12 h-12 text-red-500 mb-4" />
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
          Không tìm thấy chi nhánh
        </h2>
        <button
          onClick={() => navigate("/admin/branches")}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg"
        >
          Về Branch Network
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-[1400px] mx-auto pb-24">
      {/* A. Workspace Header */}
      <div className="sticky top-0 z-20 bg-gray-50/90 dark:bg-gray-900/90 backdrop-blur-md pt-4 pb-4 border-b border-gray-200 dark:border-gray-800 mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => {
              if (
                isDirty &&
                !window.confirm("Có thay đổi chưa lưu, bạn có chắc muốn thoát?")
              )
                return;
              navigate("/admin/branches");
            }}
            className="p-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-100 transition"
            title="Quay về mạng lưới chi nhánh"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white leading-none">
                {formData.name}
              </h1>
              <span
                className={`px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wide ${formData.status === "active" ? "bg-green-100 text-green-700" : "bg-gray-200 text-gray-600"}`}
              >
                {formData.status === "active" ? "Hoạt động" : "Tạm dừng"}
              </span>
              {isDirty && (
                <span className="px-2 py-0.5 rounded text-xs font-bold bg-amber-100 text-amber-700 animate-pulse">
                  Có thay đổi chưa lưu
                </span>
              )}
            </div>
            <div className="text-sm text-gray-500 font-mono mt-1.5 flex items-center gap-2">
              Code: {formData.code}
              <span className="text-gray-300 dark:text-gray-600">•</span>
              <span className="capitalize">{branchMode.replace("-", " ")}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleSave}
            disabled={saving || !isDirty}
            className={`px-5 py-2.5 rounded-lg font-semibold flex items-center gap-2 transition-all ${
              saving || !isDirty
                ? "bg-gray-200 text-gray-400 cursor-not-allowed dark:bg-gray-800 dark:text-gray-600"
                : "bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg"
            }`}
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {isDirty ? "Lưu thay đổi" : "Đã lưu"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-8">
        {/* Left Column: Form Sections (8 cols) */}
        <div className="col-span-12 lg:col-span-8 space-y-8">
          {/* Section 1: Identity */}
          <section className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="p-6 border-b border-gray-100 dark:border-gray-700">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                1. Nhận diện chi nhánh
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Cập nhật tên hiển thị, mã nội bộ và trạng thái vận hành.
              </p>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Tên chi nhánh *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className={`w-full border rounded-xl p-3 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-blue-500 ${errors.name ? "border-red-500" : "border-gray-200 dark:border-gray-700"}`}
                />
                {errors.name && (
                  <span className="text-xs text-red-500">{errors.name}</span>
                )}
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Mã chi nhánh *
                </label>
                <input
                  type="text"
                  name="code"
                  value={formData.code}
                  onChange={handleChange}
                  className={`w-full border rounded-xl p-3 bg-gray-50 dark:bg-gray-900 font-mono focus:ring-2 focus:ring-blue-500 ${errors.code ? "border-red-500" : "border-gray-200 dark:border-gray-700"}`}
                />
                <p className="text-[10px] text-gray-400">
                  Dùng để định danh nội bộ, hệ thống tự động viết hoa.
                </p>
                {errors.code && (
                  <span className="text-xs text-red-500">{errors.code}</span>
                )}
              </div>
              <div className="md:col-span-2 space-y-1.5">
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Trạng thái vận hành
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="w-full border border-gray-200 dark:border-gray-700 rounded-xl p-3 bg-gray-50 dark:bg-gray-900"
                >
                  <option value="active">Hoạt động (Sẵn sàng phục vụ)</option>
                  <option value="inactive">
                    Tạm dừng (Ngưng phục vụ tạm thời)
                  </option>
                </select>
              </div>
            </div>
          </section>

          {/* Section 2: Contact */}
          <section className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                  2. Liên hệ vận hành
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  Thông tin liên hệ phục vụ điều phối nội bộ và CSKH.
                </p>
              </div>
              {readiness.contact ? (
                <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded">
                  Đã có liên hệ
                </span>
              ) : (
                <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded">
                  Thiếu liên hệ
                </span>
              )}
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                  <Phone className="w-4 h-4 text-gray-400" /> Số điện thoại
                </label>
                <input
                  type="text"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className={`w-full border rounded-xl p-3 bg-gray-50 dark:bg-gray-900 ${errors.phone ? "border-red-500" : "border-gray-200 dark:border-gray-700"}`}
                />
                {errors.phone && (
                  <span className="text-xs text-red-500">{errors.phone}</span>
                )}
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                  <Mail className="w-4 h-4 text-gray-400" /> Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={`w-full border rounded-xl p-3 bg-gray-50 dark:bg-gray-900 ${errors.email ? "border-red-500" : "border-gray-200 dark:border-gray-700"}`}
                />
                {errors.email && (
                  <span className="text-xs text-red-500">{errors.email}</span>
                )}
              </div>
            </div>
          </section>

          {/* Section 3: Address & Geo */}
          <section className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="p-6 border-b border-gray-100 dark:border-gray-700">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                3. Địa chỉ và Định vị
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Xác định vị trí hành chính và tọa độ để kết nối các luồng giao
                hàng.
              </p>
            </div>
            <div className="p-6 space-y-6">
              {/* Location Snapshot Preview */}
              <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl p-5 flex gap-4">
                <div className="p-3 bg-white dark:bg-gray-800 rounded-xl shadow-sm self-start">
                  <MapPin className="w-5 h-5 text-gray-500" />
                </div>
                <div className="flex-1">
                  <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                    Location Snapshot:
                  </h4>
                  <p className="text-sm text-gray-900 dark:text-white leading-relaxed font-medium mb-3">
                    {fullAddressPreview || "Chưa thiết lập địa chỉ"}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <span
                      className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded font-semibold ${readiness.address ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}
                    >
                      {readiness.address ? (
                        <CheckCircle2 className="w-3 h-3" />
                      ) : (
                        <AlertCircle className="w-3 h-3" />
                      )}
                      {readiness.address
                        ? "Đủ địa chỉ nền tảng"
                        : "Thiếu địa chỉ nền tảng"}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded font-semibold ${readiness.geo ? "bg-blue-100 text-blue-700" : "bg-amber-100 text-amber-700"}`}
                    >
                      {readiness.geo ? (
                        <CheckCircle2 className="w-3 h-3" />
                      ) : (
                        <Info className="w-3 h-3" />
                      )}
                      {readiness.geo ? "Đã có tọa độ" : "Chưa có tọa độ"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Địa chỉ dòng 1 {branchMode !== "pickup-only" && "*"}
                  </label>
                  <input
                    type="text"
                    name="addressLine1"
                    value={formData.addressLine1}
                    onChange={handleChange}
                    className={`w-full border rounded-xl p-3 bg-white dark:bg-gray-900 ${errors.addressLine1 ? "border-red-500" : "border-gray-200 dark:border-gray-700"}`}
                  />
                  {errors.addressLine1 && (
                    <span className="text-xs text-red-500">
                      {errors.addressLine1}
                    </span>
                  )}
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Địa chỉ dòng 2
                  </label>
                  <input
                    type="text"
                    name="addressLine2"
                    value={formData.addressLine2}
                    onChange={handleChange}
                    className="w-full border border-gray-200 dark:border-gray-700 rounded-xl p-3 bg-white dark:bg-gray-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Tỉnh / Thành phố {branchMode !== "pickup-only" && "*"}
                  </label>
                  <select
                    name="province"
                    value={formData.province}
                    onFocus={loadCities}
                    onChange={async (e) => {
                      const val = e.target.value;
                      const city = cities.find((c) => c.name === val);
                      setFormData((p) =>
                        p ? { ...p, province: val, district: "", ward: "" } : p,
                      );
                      setDistricts([]);
                      setWards([]);
                      if (city) await loadDistricts(city.code);
                    }}
                    className={`w-full border rounded-xl p-3 bg-white dark:bg-gray-900 ${errors.province ? "border-red-500" : "border-gray-200 dark:border-gray-700"}`}
                  >
                    <option value="">Chọn tỉnh/thành</option>
                    {cities.map((c) => (
                      <option key={c.code} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                  {errors.province && (
                    <span className="text-xs text-red-500">
                      {errors.province}
                    </span>
                  )}
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Quận / Huyện {branchMode !== "pickup-only" && "*"}
                  </label>
                  <select
                    name="district"
                    value={formData.district}
                    disabled={!formData.province}
                    onChange={async (e) => {
                      const val = e.target.value;
                      const dist = districts.find((d) => d.name === val);
                      setFormData((p) =>
                        p ? { ...p, district: val, ward: "" } : p,
                      );
                      setWards([]);
                      if (dist) await loadWards(dist.code);
                    }}
                    className={`w-full border rounded-xl p-3 bg-white dark:bg-gray-900 ${errors.district ? "border-red-500" : "border-gray-200 dark:border-gray-700"}`}
                  >
                    <option value="">Chọn quận/huyện</option>
                    {districts.map((d) => (
                      <option key={d.code} value={d.name}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                  {errors.district && (
                    <span className="text-xs text-red-500">
                      {errors.district}
                    </span>
                  )}
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Phường / Xã
                  </label>
                  <select
                    name="ward"
                    value={formData.ward}
                    disabled={!formData.district}
                    onChange={(e) =>
                      setFormData((p) =>
                        p ? { ...p, ward: e.target.value } : p,
                      )
                    }
                    className="w-full border border-gray-200 dark:border-gray-700 rounded-xl p-3 bg-white dark:bg-gray-900"
                  >
                    <option value="">Chọn phường/xã</option>
                    {wards.map((w) => (
                      <option key={w.code} value={w.name}>
                        {w.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Vĩ độ (Lat)
                  </label>
                  <input
                    type="text"
                    name="latitude"
                    value={formData.latitude}
                    onChange={handleChange}
                    className={`w-full border rounded-xl p-3 bg-white dark:bg-gray-900 font-mono text-sm ${errors.latitude ? "border-red-500" : "border-gray-200 dark:border-gray-700"}`}
                  />
                  {errors.latitude && (
                    <span className="text-xs text-red-500">
                      {errors.latitude}
                    </span>
                  )}
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Kinh độ (Lng)
                  </label>
                  <input
                    type="text"
                    name="longitude"
                    value={formData.longitude}
                    onChange={handleChange}
                    className={`w-full border rounded-xl p-3 bg-white dark:bg-gray-900 font-mono text-sm ${errors.longitude ? "border-red-500" : "border-gray-200 dark:border-gray-700"}`}
                  />
                  {errors.longitude && (
                    <span className="text-xs text-red-500">
                      {errors.longitude}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* Section 4: Operations */}
          <section className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden mb-10">
            <div className="p-6 border-b border-gray-100 dark:border-gray-700">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                4. Vận hành chi nhánh
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Thiết lập mô hình phục vụ và khung giờ hoạt động cơ bản.
              </p>
            </div>
            <div className="p-6 space-y-6">
              <div className="space-y-3">
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Mô hình vận hành
                </label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    { id: "pickup-only", title: "Pickup only", icon: Store },
                    {
                      id: "delivery-only",
                      title: "Delivery only",
                      icon: Truck,
                    },
                    {
                      id: "hybrid",
                      title: "Pickup + Delivery",
                      icon: Activity,
                    },
                  ].map((mode) => (
                    <button
                      key={mode.id}
                      type="button"
                      onClick={() => handleModeChange(mode.id as BranchMode)}
                      className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all text-left ${
                        branchMode === mode.id
                          ? "border-blue-600 bg-blue-50 dark:bg-blue-900/20"
                          : "border-gray-100 dark:border-gray-700 hover:border-gray-300 bg-white dark:bg-gray-900"
                      }`}
                    >
                      <div
                        className={`p-2 rounded-lg ${branchMode === mode.id ? "bg-blue-600 text-white" : "bg-gray-100 dark:bg-gray-800 text-gray-500"}`}
                      >
                        <mode.icon className="w-5 h-5" />
                      </div>
                      <span
                        className={`font-bold text-sm ${branchMode === mode.id ? "text-blue-700 dark:text-blue-400" : "text-gray-700 dark:text-gray-300"}`}
                      >
                        {mode.title}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6 pt-4 border-t border-gray-100 dark:border-gray-700">
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Giờ mở cửa
                  </label>
                  <input
                    type="time"
                    name="openTime"
                    value={formData.openTime}
                    onChange={handleChange}
                    className="w-full border border-gray-200 dark:border-gray-700 rounded-xl p-3 bg-gray-50 dark:bg-gray-900 text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Giờ đóng cửa
                  </label>
                  <input
                    type="time"
                    name="closeTime"
                    value={formData.closeTime}
                    onChange={handleChange}
                    className={`w-full border rounded-xl p-3 bg-gray-50 dark:bg-gray-900 text-sm ${errors.closeTime ? "border-red-500" : "border-gray-200 dark:border-gray-700"}`}
                  />
                  {errors.closeTime && (
                    <span className="text-xs text-red-500">
                      {errors.closeTime}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Right Column: Overview, Readiness & Related Operations (4 cols) */}
        <div className="col-span-12 lg:col-span-4 space-y-6">
          {/* Top Overview Panel */}
          <Card className="!p-0 border-none shadow-sm overflow-hidden bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
            <div className="bg-gray-50 dark:bg-gray-900/50 p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                Thông tin tóm tắt
              </h3>
            </div>
            <div className="p-5 space-y-4 text-sm text-gray-600 dark:text-gray-300">
              <div className="flex items-center gap-3">
                <Clock3 className="w-4 h-4 text-gray-400 shrink-0" />
                <span>
                  Giờ HĐ: {formData.openTime || "--:--"} -{" "}
                  {formData.closeTime || "--:--"}
                </span>
              </div>
              <div className="flex items-start gap-3">
                <Phone className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
                <span>
                  {formData.phone || (
                    <span className="italic text-gray-400">Chưa có SĐT</span>
                  )}
                </span>
              </div>
              <div className="flex items-start gap-3">
                <Mail className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
                <span className="break-all">
                  {formData.email || (
                    <span className="italic text-gray-400">Chưa có Email</span>
                  )}
                </span>
              </div>
              <div className="pt-4 border-t border-gray-100 dark:border-gray-700 text-[11px] text-gray-400 space-y-1">
                <p>
                  Tạo ngày:{" "}
                  {formData.createdAt
                    ? new Date(formData.createdAt).toLocaleDateString()
                    : "—"}
                </p>
                <p>
                  Cập nhật:{" "}
                  {formData.updatedAt
                    ? new Date(formData.updatedAt).toLocaleString()
                    : "—"}
                </p>
              </div>
            </div>
          </Card>

          {/* Operational Readiness Panel */}
          <Card className="!p-0 border-none shadow-sm overflow-hidden bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
            <div className="bg-gray-900 p-4 text-white">
              <h3 className="text-sm font-bold flex items-center gap-2 uppercase tracking-wider">
                <Activity className="w-4 h-4 text-blue-400" /> Operational
                Readiness
              </h3>
            </div>
            <div className="p-5 space-y-4">
              <div className="space-y-3">
                {[
                  { label: "Nhận diện cơ bản", status: readiness.identity },
                  {
                    label: "Liên hệ vận hành",
                    status: readiness.contact,
                    soft: true,
                  },
                  { label: "Nền tảng địa chỉ", status: readiness.address },
                  { label: "Định vị Geo", status: readiness.geo, soft: true },
                  { label: "Khung giờ mở cửa", status: readiness.time },
                ].map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between text-sm"
                  >
                    <span className="text-gray-600 dark:text-gray-400">
                      {item.label}
                    </span>
                    {item.status ? (
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                    ) : (
                      <AlertCircle
                        className={`w-4 h-4 ${item.soft ? "text-gray-300" : "text-red-400"}`}
                      />
                    )}
                  </div>
                ))}
              </div>

              {softWarnings.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                  <h4 className="text-[11px] font-bold text-amber-600 uppercase mb-2">
                    Cảnh báo:
                  </h4>
                  <ul className="space-y-2">
                    {softWarnings.map((w, i) => (
                      <li
                        key={i}
                        className="text-[11px] text-amber-700 dark:text-amber-400 flex items-start gap-1.5"
                      >
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0" />{" "}
                        <span>{w}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </Card>

          {/* Related Operations Panel */}
          <Card className="!p-0 border-none shadow-sm overflow-hidden bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
            <div className="bg-gray-50 dark:bg-gray-900/50 p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-500" /> Vận hành liên
                quan
              </h3>
            </div>
            <div className="p-3 space-y-2">
              {[
                {
                  title: "Coverage",
                  desc: "Quản lý khu vực phục vụ",
                  icon: Map,
                  route: `/admin/shipping/service-areas?branchId=${formData.id}`,
                  requiresDelivery: true,
                },
                {
                  title: "Delivery Slots",
                  desc: "Thiết lập khung giờ giao",
                  icon: Clock,
                  route: `/admin/shipping/branch-delivery-slots?branchId=${formData.id}`,
                  requiresDelivery: true,
                },
                {
                  title: "Daily Capacity",
                  desc: "Năng lực xử lý theo ngày",
                  icon: CalendarDays,
                  route: `/admin/shipping/branch-delivery-slot-capacities?branchId=${formData.id}`,
                  requiresDelivery: true,
                },
                {
                  title: "Inventory",
                  desc: "Quản lý tồn kho tại chi nhánh",
                  icon: Package,
                  route: `/admin/inventory?branchId=${formData.id}`,
                  requiresDelivery: false,
                },
              ].map((card, idx) => {
                const isDisabled =
                  card.requiresDelivery && branchMode === "pickup-only";
                return (
                  <button
                    key={idx}
                    onClick={() => navigate(card.route)}
                    disabled={isDisabled}
                    className={`w-full flex items-center gap-3 p-3 text-left rounded-xl border transition-colors ${
                      isDisabled
                        ? "bg-gray-50 border-transparent opacity-60 cursor-not-allowed dark:bg-gray-800/30"
                        : "bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 hover:border-blue-300 hover:shadow-sm group"
                    }`}
                  >
                    <div
                      className={`p-2 rounded-lg ${isDisabled ? "bg-gray-200 text-gray-400 dark:bg-gray-700" : "bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400 group-hover:bg-indigo-100"}`}
                    >
                      <card.icon className="w-4 h-4" />
                    </div>
                    <div>
                      <h4
                        className={`text-sm font-bold ${isDisabled ? "text-gray-500" : "text-gray-900 dark:text-white"}`}
                      >
                        {card.title}
                      </h4>
                      <p className="text-[10px] text-gray-500 mt-0.5">
                        {isDisabled ? "Cần bật luồng Delivery" : card.desc}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default BranchEditPage;
