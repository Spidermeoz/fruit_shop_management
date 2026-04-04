import React, {
  useMemo,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Loader2,
  Store,
  Truck,
  Layers,
  Phone,
  Mail,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Activity,
  ChevronRight,
  Info,
} from "lucide-react";
import Card from "../../../components/admin/layouts/Card";
import { http } from "../../../services/http";
import { useAdminToast } from "../../../context/AdminToastContext";

// =============================
// TYPES & INTERFACES
// =============================
type BranchMode = "pickup-only" | "delivery-only" | "hybrid";

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
  status: "active",
};

// =============================
// MAIN COMPONENT
// =============================
const BranchCreatePage: React.FC = () => {
  const navigate = useNavigate();
  const { showSuccessToast, showErrorToast } = useAdminToast();

  // --- States ---
  const [formData, setFormData] = useState<BranchFormData>(initialForm);
  const [branchMode, setBranchMode] = useState<BranchMode>("hybrid");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Location Selector States
  const [cities, setCities] = useState<LocationItem[]>([]);
  const [districts, setDistricts] = useState<LocationItem[]>([]);
  const [wards, setWards] = useState<LocationItem[]>([]);
  const [cityLoaded, setCityLoaded] = useState(false);

  // --- Readiness Logic (Realtime) ---
  const readiness = useMemo(() => {
    const hasName = formData.name.trim().length > 0;
    const hasCode = formData.code.trim().length > 0;
    const hasPhone = formData.phone.trim().length >= 10;
    const hasEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim());

    const hasAddressBase =
      formData.addressLine1.trim().length > 0 &&
      formData.province.trim().length > 0 &&
      formData.district.trim().length > 0;

    const hasGeo =
      formData.latitude.trim().length > 0 &&
      formData.longitude.trim().length > 0;

    // Time validation: open < close
    const [hOpen, mOpen] = formData.openTime.split(":").map(Number);
    const [hClose, mClose] = formData.closeTime.split(":").map(Number);
    const hasValidTime = hOpen * 60 + mOpen < hClose * 60 + mClose;

    const deliveryReady = branchMode === "pickup-only" || hasAddressBase;

    return {
      identity: hasName && hasCode,
      contact: hasPhone || hasEmail,
      hasPhone,
      hasEmail,
      address: hasAddressBase,
      geo: hasGeo,
      time: hasValidTime,
      deliveryReady,
      allMandatory: hasName && hasCode && deliveryReady,
    };
  }, [formData, branchMode]);

  const softWarnings = useMemo(() => {
    const warnings: string[] = [];
    if (!readiness.contact)
      warnings.push("Chưa có thông tin liên hệ vận hành.");
    if (!readiness.geo) warnings.push("Thiếu tọa độ định vị chi nhánh.");
    if (branchMode !== "pickup-only" && !readiness.address) {
      warnings.push(
        "Chi nhánh có Delivery cần địa chỉ nền tảng để tính phí ship.",
      );
    }
    return warnings;
  }, [readiness, branchMode]);

  const fullAddressPreview = useMemo(() => {
    return [
      formData.addressLine1,
      formData.ward,
      formData.district,
      formData.province,
    ]
      .filter(Boolean)
      .join(", ");
  }, [formData]);

  // --- Handlers ---
  const loadCities = async () => {
    if (cityLoaded) return;
    try {
      const res = await fetch("https://provinces.open-api.vn/api/p/");
      const data = await res.json();
      setCities(data);
      setCityLoaded(true);
    } catch (e) {
      console.error("Load cities failed");
    }
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
    const nextValue = name === "code" ? value.toUpperCase().trim() : value;
    setFormData((prev) => ({ ...prev, [name]: nextValue }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = "Tên chi nhánh là bắt buộc.";
    if (!formData.code.trim()) newErrors.code = "Mã chi nhánh là bắt buộc.";

    if (branchMode !== "pickup-only") {
      if (!formData.addressLine1.trim())
        newErrors.addressLine1 = "Yêu cầu địa chỉ dòng 1.";
      if (!formData.province.trim()) newErrors.province = "Yêu cầu Tỉnh/Thành.";
      if (!formData.district.trim()) newErrors.district = "Yêu cầu Quận/Huyện.";
    }

    if (!readiness.time)
      newErrors.closeTime = "Giờ đóng cửa phải sau giờ mở cửa.";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      setLoading(true);
      const payload = {
        ...formData,
        name: formData.name.trim(),
        code: formData.code.trim(),
        latitude: formData.latitude ? Number(formData.latitude) : null,
        longitude: formData.longitude ? Number(formData.longitude) : null,
        supportsPickup: branchMode === "pickup-only" || branchMode === "hybrid",
        supportsDelivery:
          branchMode === "delivery-only" || branchMode === "hybrid",
      };

      const res = await http<any>(
        "POST",
        "/api/v1/admin/branches/create",
        payload,
      );

      if (res?.success) {
        showSuccessToast({ message: "Khởi tạo chi nhánh thành công!" });
        const newId = res.data?.id;
        // Chuyển hướng sang Workspace nếu có ID, ngược lại về List
        if (newId) navigate(`/admin/branches/edit/${newId}`);
        else navigate("/admin/branches");
      } else {
        showErrorToast(res?.message || "Không thể tạo chi nhánh.");
      }
    } catch (err: any) {
      showErrorToast(err?.message || "Lỗi hệ thống.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-[1200px] mx-auto pb-20">
      {/* A. Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <button
            onClick={() => navigate("/admin/branches")}
            className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-blue-600 transition-colors mb-2"
          >
            <ArrowLeft className="w-4 h-4" /> Quay về Branch Network
          </button>
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
            Branch Setup
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1 max-w-2xl">
            Khởi tạo chi nhánh mới với đầy đủ nhận diện và mô hình vận hành để
            sẵn sàng kết nối shipping và inventory.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-8">
        {/* B. Main Setup Form (8 columns) */}
        <div className="col-span-12 lg:col-span-8 space-y-8">
          {/* Section 1: Identity */}
          <section className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="p-6 border-b border-gray-100 dark:border-gray-700">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-600 text-xs">
                  1
                </span>
                Nhận diện chi nhánh
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Thiết lập tên gọi, mã nội bộ và trạng thái ban đầu của chi
                nhánh.
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
                  placeholder="VD: FreshFruits Quận 1"
                  className={`w-full border rounded-xl p-3 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-blue-500 transition-all ${errors.name ? "border-red-500" : "border-gray-200 dark:border-gray-700"}`}
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
                  placeholder="VD: HCM_Q1"
                  className={`w-full border rounded-xl p-3 bg-gray-50 dark:bg-gray-900 font-mono focus:ring-2 focus:ring-blue-500 transition-all ${errors.code ? "border-red-500" : "border-gray-200 dark:border-gray-700"}`}
                />
                <p className="text-[10px] text-gray-400 italic">
                  Dùng để định danh nội bộ, tự động viết hoa.
                </p>
                {errors.code && (
                  <span className="text-xs text-red-500">{errors.code}</span>
                )}
              </div>
              <div className="md:col-span-2 space-y-1.5">
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Trạng thái khởi tạo
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="w-full border border-gray-200 dark:border-gray-700 rounded-xl p-3 bg-gray-50 dark:bg-gray-900"
                >
                  <option value="active">
                    Sẵn sàng hoạt động ngay (Active)
                  </option>
                  <option value="inactive">
                    Tạm dừng để cấu hình thêm (Inactive)
                  </option>
                </select>
              </div>
            </div>
          </section>

          {/* Section 2: Contact */}
          <section className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="p-6 border-b border-gray-100 dark:border-gray-700">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-600 text-xs">
                  2
                </span>
                Liên hệ vận hành
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Thông tin liên lạc giúp đồng bộ CSKH và điều phối nội bộ.
              </p>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 mb-1">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Số điện thoại
                  </label>
                </div>
                <input
                  type="text"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="VD: 0901234567"
                  className="w-full border border-gray-200 dark:border-gray-700 rounded-xl p-3 bg-gray-50 dark:bg-gray-900"
                />
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 mb-1">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Email chi nhánh
                  </label>
                </div>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="VD: q1@freshfruits.com"
                  className="w-full border border-gray-200 dark:border-gray-700 rounded-xl p-3 bg-gray-50 dark:bg-gray-900"
                />
              </div>
            </div>
          </section>

          {/* Section 3: Location & Time */}
          <section className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="p-6 border-b border-gray-100 dark:border-gray-700">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-600 text-xs">
                  3
                </span>
                Vị trí và thời gian vận hành
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Xác định địa chỉ hoạt động và thời gian mở cửa.
              </p>
            </div>
            <div className="p-6 space-y-6">
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
                    placeholder="Số nhà, tên đường..."
                    className={`w-full border rounded-xl p-3 bg-gray-50 dark:bg-gray-900 ${errors.addressLine1 ? "border-red-500" : "border-gray-200 dark:border-gray-700"}`}
                  />
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
                    placeholder="Tòa nhà, tầng..."
                    className="w-full border border-gray-200 dark:border-gray-700 rounded-xl p-3 bg-gray-50 dark:bg-gray-900"
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
                      setFormData((p) => ({
                        ...p,
                        province: val,
                        district: "",
                        ward: "",
                      }));
                      setDistricts([]);
                      setWards([]);
                      if (city) await loadDistricts(city.code);
                    }}
                    className={`w-full border rounded-xl p-3 bg-gray-50 dark:bg-gray-900 ${errors.province ? "border-red-500" : "border-gray-200 dark:border-gray-700"}`}
                  >
                    <option value="">Chọn tỉnh/thành</option>
                    {cities.map((c) => (
                      <option key={c.code} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
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
                      setFormData((p) => ({ ...p, district: val, ward: "" }));
                      setWards([]);
                      if (dist) await loadWards(dist.code);
                    }}
                    className={`w-full border rounded-xl p-3 bg-gray-50 dark:bg-gray-900 ${errors.district ? "border-red-500" : "border-gray-200 dark:border-gray-700"}`}
                  >
                    <option value="">Chọn quận/huyện</option>
                    {districts.map((d) => (
                      <option key={d.code} value={d.name}>
                        {d.name}
                      </option>
                    ))}
                  </select>
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
                      setFormData((p) => ({ ...p, ward: e.target.value }))
                    }
                    className="w-full border border-gray-200 dark:border-gray-700 rounded-xl p-3 bg-gray-50 dark:bg-gray-900"
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

              {/* Address Preview Card */}
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-2xl p-5 flex gap-4">
                <div className="p-3 bg-white dark:bg-gray-800 rounded-xl shadow-sm self-start">
                  <MapPin className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-blue-700 dark:text-blue-400 uppercase tracking-wider mb-1">
                    Địa chỉ vận hành:
                  </h4>
                  <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed font-medium">
                    {fullAddressPreview ||
                      "Vui lòng nhập địa chỉ để xem trước..."}
                  </p>
                  {readiness.address ? (
                    <span className="inline-flex items-center gap-1 text-[10px] text-green-600 font-bold mt-2">
                      <CheckCircle2 className="w-3 h-3" /> Đã đủ thông tin nền
                      tảng
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[10px] text-amber-600 font-bold mt-2">
                      <Info className="w-3 h-3" /> Cần thêm thông tin để sẵn
                      sàng Delivery
                    </span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-500 uppercase">
                    Vĩ độ (Lat)
                  </label>
                  <input
                    type="text"
                    name="latitude"
                    value={formData.latitude}
                    onChange={handleChange}
                    placeholder="10.77..."
                    className="w-full border border-gray-200 dark:border-gray-700 rounded-xl p-3 bg-gray-50 dark:bg-gray-900 text-sm font-mono"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-500 uppercase">
                    Kinh độ (Lng)
                  </label>
                  <input
                    type="text"
                    name="longitude"
                    value={formData.longitude}
                    onChange={handleChange}
                    placeholder="106.69..."
                    className="w-full border border-gray-200 dark:border-gray-700 rounded-xl p-3 bg-gray-50 dark:bg-gray-900 text-sm font-mono"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-500 uppercase">
                    Mở cửa
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
                  <label className="text-xs font-bold text-gray-500 uppercase">
                    Đóng cửa
                  </label>
                  <input
                    type="time"
                    name="closeTime"
                    value={formData.closeTime}
                    onChange={handleChange}
                    className={`w-full border rounded-xl p-3 bg-gray-50 dark:bg-gray-900 text-sm ${errors.closeTime ? "border-red-500" : "border-gray-200 dark:border-gray-700"}`}
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Section 4: Operation Mode */}
          <section className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="p-6 border-b border-gray-100 dark:border-gray-700">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-600 text-xs">
                  4
                </span>
                Mô hình vận hành
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Xác định hình thức phục vụ của chi nhánh này.
              </p>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                {
                  id: "pickup-only",
                  title: "Pickup only",
                  desc: "Chỉ phục vụ nhận hàng tại điểm.",
                  icon: Store,
                  color: "blue",
                },
                {
                  id: "delivery-only",
                  title: "Delivery only",
                  desc: "Điểm xử lý đơn giao hàng tận nơi.",
                  icon: Truck,
                  color: "purple",
                },
                {
                  id: "hybrid",
                  title: "Pickup + Delivery",
                  desc: "Vận hành đầy đủ cả hai mô hình.",
                  icon: Activity,
                  color: "indigo",
                },
              ].map((mode) => (
                <button
                  key={mode.id}
                  type="button"
                  onClick={() => setBranchMode(mode.id as BranchMode)}
                  className={`flex flex-col items-center text-center p-5 rounded-2xl border-2 transition-all gap-3 ${
                    branchMode === mode.id
                      ? "border-blue-600 bg-blue-50 dark:bg-blue-900/20 ring-4 ring-blue-50 dark:ring-blue-900/10"
                      : "border-gray-100 dark:border-gray-700 hover:border-gray-300 bg-white dark:bg-gray-800"
                  }`}
                >
                  <div
                    className={`p-3 rounded-full ${branchMode === mode.id ? "bg-blue-600 text-white" : "bg-gray-100 dark:bg-gray-700 text-gray-500"}`}
                  >
                    <mode.icon className="w-6 h-6" />
                  </div>
                  <div>
                    <h3
                      className={`font-bold text-sm ${branchMode === mode.id ? "text-blue-700 dark:text-blue-400" : "text-gray-700 dark:text-gray-300"}`}
                    >
                      {mode.title}
                    </h3>
                    <p className="text-[11px] text-gray-500 mt-1 leading-relaxed">
                      {mode.desc}
                    </p>
                  </div>
                </button>
              ))}
            </div>
            <div className="px-6 pb-6 italic text-[11px] text-gray-400">
              * Bạn có thể thay đổi mô hình vận hành sau này trong Branch
              Workspace nếu quy trình thay đổi.
            </div>
          </section>
        </div>

        {/* C. Setup Summary (4 columns - Sticky) */}
        <div className="col-span-12 lg:col-span-4">
          <div className="sticky top-6 space-y-6">
            <Card className="!p-0 border-none shadow-lg overflow-hidden">
              <div className="bg-gray-900 p-5 text-white">
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <Layers className="w-5 h-5 text-blue-400" />
                  Tóm tắt thiết lập
                </h3>
              </div>

              <div className="p-6 space-y-6">
                {/* Readiness Checklist */}
                <div className="space-y-4">
                  {[
                    { label: "Nhận diện & Code", status: readiness.identity },
                    {
                      label: "Thông tin liên hệ",
                      status: readiness.contact,
                      soft: true,
                    },
                    {
                      label: "Địa chỉ nền tảng",
                      status: readiness.address,
                      deliveryLink: true,
                    },
                    {
                      label: "Tọa độ địa lý",
                      status: readiness.geo,
                      soft: true,
                    },
                    { label: "Thời gian mở cửa", status: readiness.time },
                  ].map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between"
                    >
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {item.label}
                      </span>
                      {item.status ? (
                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                      ) : (
                        <AlertCircle
                          className={`w-5 h-5 ${item.soft ? "text-gray-300" : "text-red-400"}`}
                        />
                      )}
                    </div>
                  ))}
                </div>

                <div className="h-px bg-gray-100 dark:bg-gray-700" />

                {/* Branch Mode Insight */}
                <div>
                  <h4 className="text-xs font-bold text-gray-400 uppercase mb-3">
                    Mô hình lựa chọn
                  </h4>
                  <div className="flex items-center gap-3 bg-gray-50 dark:bg-gray-900 p-3 rounded-xl border border-gray-100 dark:border-gray-800">
                    <div className="p-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                      {branchMode === "pickup-only" ? (
                        <Store className="w-4 h-4 text-blue-600" />
                      ) : (
                        <Truck className="w-4 h-4 text-purple-600" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-800 dark:text-white capitalize">
                        {branchMode.replace("-", " ")}
                      </p>
                      <p className="text-[10px] text-gray-500 uppercase font-semibold">
                        {readiness.deliveryReady
                          ? "Sẵn sàng vận hành"
                          : "Cần bổ sung địa chỉ"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Soft Warnings */}
                {softWarnings.length > 0 && (
                  <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-xl border border-amber-100 dark:border-amber-800">
                    <h5 className="text-xs font-bold text-amber-700 dark:text-amber-400 flex items-center gap-1.5 mb-2">
                      <Info className="w-3.5 h-3.5" /> Lưu ý thiết lập:
                    </h5>
                    <ul className="space-y-1.5">
                      {softWarnings.map((w, i) => (
                        <li
                          key={i}
                          className="text-[11px] text-amber-800 dark:text-amber-300 leading-tight"
                        >
                          • {w}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Next Steps Guidance */}
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-800">
                  <h5 className="text-xs font-bold text-blue-700 dark:text-blue-400 mb-2 uppercase">
                    Bước tiếp theo đề xuất:
                  </h5>
                  <div className="space-y-3">
                    <div className="flex items-start gap-2 text-[11px] text-blue-800 dark:text-blue-300">
                      <ChevronRight className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                      <span>
                        Mở <strong>Branch Workspace</strong> để quản lý chi
                        nhánh vừa tạo.
                      </span>
                    </div>
                    {branchMode !== "pickup-only" && (
                      <div className="flex items-start gap-2 text-[11px] text-blue-800 dark:text-blue-300">
                        <ChevronRight className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                        <span>
                          Tiếp tục cấu hình <strong>Service Areas</strong> và{" "}
                          <strong>Delivery Slots</strong>.
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer Submit Action */}
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={loading || !readiness.allMandatory}
                    className={`w-full py-4 rounded-xl font-bold text-sm shadow-lg transition-all flex items-center justify-center gap-2 
                      ${
                        loading || !readiness.allMandatory
                          ? "bg-gray-200 text-gray-400 cursor-not-allowed shadow-none"
                          : "bg-blue-600 text-white hover:bg-blue-700 active:scale-[0.98]"
                      }`}
                  >
                    {loading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      "Hoàn tất thiết lập chi nhánh"
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate("/admin/branches")}
                    className="w-full py-3 mt-3 text-sm text-gray-500 font-medium hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                  >
                    Hủy bỏ
                  </button>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BranchCreatePage;
