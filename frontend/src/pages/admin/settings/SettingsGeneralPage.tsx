import React, {
  useEffect,
  useState,
  useMemo,
  type ChangeEvent,
  type FormEvent,
} from "react";
import {
  ArrowLeft,
  Save,
  Loader2,
  Building2,
  Phone,
  Share2,
  CheckCircle2,
  AlertCircle,
  XCircle,
  MonitorSmartphone,
  Upload,
  Trash2,
  Mail,
  MapPin,
  Facebook,
  MessageSquare,
  Info,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import Card from "../../../components/admin/layouts/Card";
import { http } from "../../../services/http";
import { useAdminToast } from "../../../context/AdminToastContext";

// ==========================================
// TYPES & INTERFACES
// ==========================================
interface SettingGeneral {
  website_name: string | null;
  logo: string | null;
  phone: string | null;
  email: string | null;
  facebook: string | null;
  zalo: string | null;
  address: string | null;
  copyright: string | null;
}

// ==========================================
// HELPERS
// ==========================================
const trimVal = (v: string | null | undefined) => (v ? v.trim() : "");
const isValidEmail = (email: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
const isLikelyUrl = (url: string) => /^https?:\/\//.test(url);

const SettingsGeneralPage: React.FC = () => {
  const navigate = useNavigate();
  const { showSuccessToast, showErrorToast } = useAdminToast();

  // --- States ---
  const [settings, setSettings] = useState<SettingGeneral | null>(null);
  const [initialSettings, setInitialSettings] = useState<SettingGeneral | null>(
    null,
  );

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewLogo, setPreviewLogo] = useState<string>("");

  const [formErrors, setFormErrors] = useState<
    Partial<Record<keyof SettingGeneral, string>>
  >({});

  // ==========================
  // FETCH DATA
  // ==========================
  const fetchSettings = async () => {
    try {
      setLoading(true);
      setFetchError(null);
      const json = await http<any>("GET", "/api/v1/admin/settings/general");
      if (json.success) {
        setSettings(json.data);
        setInitialSettings(json.data);
        setPreviewLogo(json.data.logo || "");
        setSelectedFile(null);
      } else {
        setFetchError(json.message || "Không thể tải cấu hình chung.");
      }
    } catch (e) {
      console.error("Fetch settings failed", e);
      setFetchError("Mất kết nối đến server. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
    // Cleanup Object URL on unmount to avoid memory leaks
    return () => {
      if (previewLogo && previewLogo.startsWith("blob:")) {
        URL.revokeObjectURL(previewLogo);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ==========================
  // DERIVED STATES (useMemo)
  // ==========================
  const isDirty = useMemo(() => {
    if (!settings || !initialSettings) return false;

    return (
      trimVal(settings.website_name) !==
        trimVal(initialSettings.website_name) ||
      trimVal(settings.phone) !== trimVal(initialSettings.phone) ||
      trimVal(settings.email) !== trimVal(initialSettings.email) ||
      trimVal(settings.facebook) !== trimVal(initialSettings.facebook) ||
      trimVal(settings.zalo) !== trimVal(initialSettings.zalo) ||
      trimVal(settings.address) !== trimVal(initialSettings.address) ||
      trimVal(settings.copyright) !== trimVal(initialSettings.copyright) ||
      selectedFile !== null
    );
  }, [settings, initialSettings, selectedFile]);

  const completionItems = useMemo(() => {
    return [
      {
        id: "website_name",
        label: "Có tên website",
        done: !!trimVal(settings?.website_name),
      },
      {
        id: "logo",
        label: "Có logo",
        done: !!settings?.logo || selectedFile !== null,
      },
      { id: "email", label: "Có email", done: !!trimVal(settings?.email) },
      {
        id: "phone",
        label: "Có số điện thoại",
        done: !!trimVal(settings?.phone),
      },
      {
        id: "address",
        label: "Có địa chỉ",
        done: !!trimVal(settings?.address),
      },
      {
        id: "social",
        label: "Có kênh xã hội",
        done: !!trimVal(settings?.facebook) || !!trimVal(settings?.zalo),
      },
      {
        id: "copyright",
        label: "Có bản quyền",
        done: !!trimVal(settings?.copyright),
      },
    ];
  }, [settings, selectedFile]);

  const completedCount = useMemo(
    () => completionItems.filter((i) => i.done).length,
    [completionItems],
  );
  const isFullyCompleted = completedCount === completionItems.length;

  // ==========================
  // HANDLERS
  // ==========================
  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setSettings((prev) => (prev ? { ...prev, [name]: value } : prev));
    if (formErrors[name as keyof SettingGeneral]) {
      setFormErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleImageSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (previewLogo && previewLogo.startsWith("blob:")) {
      URL.revokeObjectURL(previewLogo);
    }

    setSelectedFile(file);
    setPreviewLogo(URL.createObjectURL(file));
  };

  const handleRemoveImage = () => {
    if (previewLogo && previewLogo.startsWith("blob:")) {
      URL.revokeObjectURL(previewLogo);
    }
    setSelectedFile(null);
    setPreviewLogo(initialSettings?.logo || "");
    // Reset file input
    const fileInput = document.getElementById(
      "logo-upload",
    ) as HTMLInputElement;
    if (fileInput) fileInput.value = "";
  };

  const validateForm = () => {
    if (!settings) return false;
    const errors: Partial<Record<keyof SettingGeneral, string>> = {};

    if (!trimVal(settings.website_name)) {
      errors.website_name = "Vui lòng nhập tên website.";
    }
    if (!trimVal(settings.email)) {
      errors.email = "Email không được để trống.";
    } else if (!isValidEmail(trimVal(settings.email))) {
      errors.email = "Email không hợp lệ.";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async (e?: FormEvent) => {
    if (e) e.preventDefault();
    if (!settings || !isDirty) return;
    if (!validateForm()) {
      showErrorToast("Vui lòng kiểm tra lại thông tin nhập.");
      return;
    }

    try {
      setSaving(true);
      const formData = new FormData();
      formData.append("website_name", trimVal(settings.website_name));
      formData.append("phone", trimVal(settings.phone));
      formData.append("email", trimVal(settings.email));
      formData.append("facebook", trimVal(settings.facebook));
      formData.append("zalo", trimVal(settings.zalo));
      formData.append("address", trimVal(settings.address));
      formData.append("copyright", trimVal(settings.copyright));

      if (selectedFile) {
        formData.append("logo", selectedFile);
      }

      const json = await http<any>(
        "PATCH",
        "/api/v1/admin/settings/general",
        formData,
      );

      if (json.success) {
        showSuccessToast({ message: "Cập nhật cài đặt chung thành công!" });
        // Fetch lại để đồng bộ state hoàn chỉnh
        fetchSettings();
      } else {
        showErrorToast(json.message || "Có lỗi xảy ra khi lưu.");
      }
    } catch (e) {
      console.error(e);
      showErrorToast("Không thể kết nối server.");
    } finally {
      setSaving(false);
    }
  };

  // ==========================
  // RENDER: STATES
  // ==========================
  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center py-24 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <p className="mt-3 text-gray-500 font-medium">
          Đang đồng bộ cấu hình hệ thống...
        </p>
      </div>
    );
  }

  if (fetchError || !settings) {
    return (
      <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
        <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-3" />
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
          Lỗi tải cấu hình
        </h3>
        <p className="text-red-600 font-medium mb-6">{fetchError}</p>
        <div className="flex justify-center gap-3">
          <button
            onClick={() => navigate("/admin/dashboard")}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 font-semibold rounded-lg transition"
          >
            Quay lại
          </button>
          <button
            onClick={fetchSettings}
            className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition"
          >
            Tải lại
          </button>
        </div>
      </div>
    );
  }

  // ==========================
  // RENDER: WORKSPACE
  // ==========================
  return (
    <div className="w-full pb-10 space-y-6">
      {/* Tầng A: Header Workspace */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm sticky top-4 z-30">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <button
              onClick={() => navigate("/admin/dashboard")}
              className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md text-gray-500 dark:text-gray-400 transition"
              title="Quay lại"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
              Cài đặt chung
            </h1>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 ml-10">
            Quản lý nhận diện thương hiệu, thông tin liên hệ và dữ liệu hiển thị
            công khai của hệ thống.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-4 ml-10 md:ml-0">
          <div className="text-sm font-medium flex items-center">
            {saving ? (
              <span className="text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
                <Loader2 className="w-4 h-4 animate-spin" /> Đang lưu...
              </span>
            ) : isDirty ? (
              <span className="text-amber-600 dark:text-amber-500 bg-amber-50 dark:bg-amber-900/20 px-2.5 py-1 rounded-md border border-amber-200 dark:border-amber-800/50 flex items-center">
                <span className="inline-block w-2 h-2 rounded-full bg-amber-500 mr-1.5 animate-pulse"></span>
                Có thay đổi chưa lưu
              </span>
            ) : (
              <span className="text-gray-500 dark:text-gray-400 flex items-center">
                <CheckCircle2 className="w-4 h-4 inline mr-1" />
                Đã đồng bộ
              </span>
            )}
          </div>

          <button
            onClick={handleSave}
            disabled={saving || !isDirty}
            className="flex items-center gap-2 px-5 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="w-4 h-4" /> Lưu thay đổi
          </button>
        </div>
      </div>

      {/* Tầng B: KPI Overview Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: "Thương hiệu",
            value:
              trimVal(settings.website_name) && previewLogo
                ? "Đã đầy đủ"
                : "Còn thiếu",
            icon: Building2,
            color: "text-blue-600",
            bg: "bg-blue-50",
            isComplete: !!(trimVal(settings.website_name) && previewLogo),
          },
          {
            label: "Liên hệ",
            value:
              trimVal(settings.phone) || trimVal(settings.email)
                ? "Đã cấu hình"
                : "Chưa cấu hình",
            icon: Phone,
            color: "text-emerald-600",
            bg: "bg-emerald-50",
            isComplete: !!(trimVal(settings.phone) || trimVal(settings.email)),
          },
          {
            label: "Kênh xã hội",
            value: `${(trimVal(settings.facebook) ? 1 : 0) + (trimVal(settings.zalo) ? 1 : 0)} kênh đã nối`,
            icon: Share2,
            color: "text-purple-600",
            bg: "bg-purple-50",
            isComplete: !!(
              trimVal(settings.facebook) || trimVal(settings.zalo)
            ),
          },
        ].map((kpi, idx) => (
          <div
            key={idx}
            className="p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 flex flex-col justify-center shadow-sm"
          >
            <div className="flex items-center gap-2 mb-2">
              <div className={`p-1.5 rounded-lg ${kpi.bg} dark:bg-gray-800`}>
                <kpi.icon className={`w-4 h-4 ${kpi.color}`} />
              </div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 truncate">
                {kpi.label}
              </span>
            </div>
            <div
              className={`text-lg font-black truncate ${!kpi.isComplete ? "text-amber-600 dark:text-amber-400" : "text-gray-900 dark:text-white"}`}
            >
              {kpi.value}
            </div>
          </div>
        ))}

        {/* Completion Card */}
        <div
          className={`p-4 rounded-xl border flex flex-col justify-center shadow-sm transition-colors ${
            isFullyCompleted
              ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
              : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
          }`}
        >
          <div className="flex items-center gap-2 mb-2">
            <div
              className={`p-1.5 rounded-lg ${
                isFullyCompleted
                  ? "bg-green-100 text-green-600 dark:bg-green-900/40"
                  : "bg-gray-100 text-gray-500 dark:bg-gray-800"
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 truncate">
              Độ hoàn thiện
            </span>
          </div>
          <div
            className={`text-lg font-black ${
              isFullyCompleted
                ? "text-green-700 dark:text-green-400"
                : "text-gray-900 dark:text-white"
            }`}
          >
            {completedCount}/{completionItems.length} hạng mục
          </div>
        </div>
      </div>

      {/* Tầng C: Main Workspace Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* === LEFT COLUMN: FORM SECTIONS === */}
        <div className="lg:col-span-2 space-y-6">
          {/* 1. Brand Identity */}
          <Card className="!p-0 overflow-hidden border border-gray-200 dark:border-gray-700 shadow-sm">
            <div className="p-4 border-b border-gray-100 dark:border-gray-700/50 bg-gray-50/50 dark:bg-gray-800/50 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-gray-500" />
              <h2 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wide">
                Nhận diện thương hiệu
              </h2>
            </div>
            <div className="p-5 space-y-5">
              <div>
                <label className="block text-sm font-bold text-gray-900 dark:text-white mb-1.5">
                  Tên website <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="website_name"
                  value={settings.website_name || ""}
                  onChange={handleChange}
                  placeholder="Ví dụ: Cửa hàng Hoa Tươi ABC..."
                  className={`w-full px-3 py-2 text-sm rounded-lg border bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
                    formErrors.website_name
                      ? "border-red-500 dark:border-red-500"
                      : "border-gray-300 dark:border-gray-600"
                  }`}
                />
                <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1.5 font-medium">
                  Tên hiển thị cho website và các khu vực công khai của hệ
                  thống.
                </p>
                {formErrors.website_name && (
                  <p className="text-xs text-red-600 dark:text-red-400 mt-1.5 flex items-center gap-1 font-medium">
                    <XCircle className="w-3.5 h-3.5" />{" "}
                    {formErrors.website_name}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-900 dark:text-white mb-2">
                  Logo hệ thống
                </label>
                <div className="flex flex-col sm:flex-row items-start gap-6">
                  <div className="w-28 h-28 shrink-0 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center bg-gray-50 dark:bg-gray-800 overflow-hidden relative group">
                    {previewLogo ? (
                      <img
                        src={previewLogo}
                        alt="Preview Logo"
                        className="w-full h-full object-contain p-2"
                      />
                    ) : (
                      <MonitorSmartphone className="w-8 h-8 text-gray-300 dark:text-gray-600" />
                    )}
                  </div>
                  <div className="flex-1 space-y-3">
                    <div className="flex flex-wrap gap-2">
                      <label className="cursor-pointer flex items-center gap-1.5 px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-200 transition">
                        <Upload className="w-4 h-4" />
                        <span>Chọn ảnh mới</span>
                        <input
                          id="logo-upload"
                          type="file"
                          accept="image/png, image/jpeg, image/svg+xml"
                          onChange={handleImageSelect}
                          className="hidden"
                        />
                      </label>
                      {selectedFile && (
                        <button
                          type="button"
                          onClick={handleRemoveImage}
                          className="flex items-center gap-1.5 px-3 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 rounded-lg text-sm font-medium transition"
                        >
                          <Trash2 className="w-4 h-4" /> Bỏ ảnh đã chọn
                        </button>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed max-w-sm">
                      Định dạng hỗ trợ: JPG, PNG, SVG. Kích thước tối đa: 2MB.
                      Khuyên dùng ảnh vuông hoặc tỷ lệ 3:2, nền trong suốt để
                      hiển thị tốt nhất.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* 2. Contact Information */}
          <Card className="!p-0 overflow-hidden border border-gray-200 dark:border-gray-700 shadow-sm">
            <div className="p-4 border-b border-gray-100 dark:border-gray-700/50 bg-gray-50/50 dark:bg-gray-800/50 flex items-center gap-2">
              <Phone className="w-4 h-4 text-gray-500" />
              <h2 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wide">
                Thông tin liên hệ chính
              </h2>
            </div>
            <div className="p-5 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-bold text-gray-900 dark:text-white mb-1.5">
                    Email liên hệ <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                    <input
                      type="email"
                      name="email"
                      value={settings.email || ""}
                      onChange={handleChange}
                      placeholder="contact@company.com"
                      className={`w-full pl-9 pr-3 py-2 text-sm rounded-lg border bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
                        formErrors.email
                          ? "border-red-500 dark:border-red-500"
                          : "border-gray-300 dark:border-gray-600"
                      }`}
                    />
                  </div>
                  {formErrors.email && (
                    <p className="text-xs text-red-600 dark:text-red-400 mt-1.5 flex items-center gap-1 font-medium">
                      <XCircle className="w-3.5 h-3.5" /> {formErrors.email}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-900 dark:text-white mb-1.5">
                    Số điện thoại / Hotline
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      name="phone"
                      value={settings.phone || ""}
                      onChange={handleChange}
                      placeholder="09xx xxx xxx"
                      className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-900 dark:text-white mb-1.5">
                  Địa chỉ văn phòng / Cửa hàng
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                  <textarea
                    name="address"
                    value={settings.address || ""}
                    onChange={handleChange}
                    placeholder="Nhập địa chỉ đầy đủ để hiển thị ở trang liên hệ..."
                    className="w-full pl-9 pr-3 py-2 text-sm min-h-[80px] rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                  />
                </div>
              </div>
            </div>
          </Card>

          {/* 3. Social Channels */}
          <Card className="!p-0 overflow-hidden border border-gray-200 dark:border-gray-700 shadow-sm">
            <div className="p-4 border-b border-gray-100 dark:border-gray-700/50 bg-gray-50/50 dark:bg-gray-800/50 flex items-center gap-2">
              <Share2 className="w-4 h-4 text-gray-500" />
              <h2 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wide">
                Kênh xã hội & Hỗ trợ
              </h2>
            </div>
            <div className="p-5 space-y-4">
              <p className="text-[11px] text-gray-500 dark:text-gray-400 font-medium mb-1">
                Dùng cho phần chân trang (footer), trang liên hệ hoặc các nút
                liên kết hỗ trợ khách hàng nhanh.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-bold text-gray-900 dark:text-white mb-1.5">
                    Facebook
                  </label>
                  <div className="relative">
                    <Facebook className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      name="facebook"
                      value={settings.facebook || ""}
                      onChange={handleChange}
                      placeholder="https://facebook.com/..."
                      className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-900 dark:text-white mb-1.5">
                    Zalo / Zalo OA
                  </label>
                  <div className="relative">
                    <MessageSquare className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      name="zalo"
                      value={settings.zalo || ""}
                      onChange={handleChange}
                      placeholder="https://zalo.me/..."
                      className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                    />
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* 4. Legal / Footer */}
          <Card className="!p-0 overflow-hidden border border-gray-200 dark:border-gray-700 shadow-sm">
            <div className="p-4 border-b border-gray-100 dark:border-gray-700/50 bg-gray-50/50 dark:bg-gray-800/50 flex items-center gap-2">
              <Info className="w-4 h-4 text-gray-500" />
              <h2 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wide">
                Thông tin bản quyền
              </h2>
            </div>
            <div className="p-5">
              <div>
                <label className="block text-sm font-bold text-gray-900 dark:text-white mb-1.5">
                  Nội dung bản quyền (Copyright text)
                </label>
                <input
                  type="text"
                  name="copyright"
                  value={settings.copyright || ""}
                  onChange={handleChange}
                  placeholder="© 2026 Tên Công Ty. All rights reserved."
                  className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                />
              </div>
            </div>
          </Card>
        </div>

        {/* === RIGHT COLUMN: PREVIEW & STATUS === */}
        <div className="space-y-6">
          {/* Live Preview */}
          <Card className="border border-gray-200 dark:border-gray-700 shadow-sm !p-0 overflow-hidden">
            <div className="p-4 border-b border-gray-100 dark:border-gray-700/50 bg-gray-50/50 dark:bg-gray-800/50">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wide">
                Xem trước hiển thị
              </h3>
            </div>
            <div className="p-5 bg-gray-100 dark:bg-gray-900">
              {/* Mock Footer Layout */}
              <div className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm text-sm">
                <div className="flex items-center gap-3 mb-4 border-b border-gray-100 dark:border-gray-700 pb-4">
                  {previewLogo ? (
                    <img
                      src={previewLogo}
                      alt="Logo"
                      className="w-8 h-8 object-contain"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded bg-gray-200 dark:bg-gray-700"></div>
                  )}
                  <span className="font-bold text-gray-900 dark:text-white text-base truncate">
                    {trimVal(settings.website_name) || (
                      <span className="text-gray-400 italic font-normal text-sm">
                        Chưa có tên website
                      </span>
                    )}
                  </span>
                </div>
                <div className="space-y-3 text-gray-600 dark:text-gray-300">
                  <div className="flex items-start gap-2 text-[13px]">
                    <Phone className="w-4 h-4 shrink-0 mt-0.5 opacity-60" />
                    <span className="truncate">
                      {trimVal(settings.phone) || (
                        <span className="text-gray-400 italic">
                          Chưa có Số điện thoại
                        </span>
                      )}
                    </span>
                  </div>
                  <div className="flex items-start gap-2 text-[13px]">
                    <Mail className="w-4 h-4 shrink-0 mt-0.5 opacity-60" />
                    <span className="truncate">
                      {trimVal(settings.email) || (
                        <span className="text-gray-400 italic">
                          Chưa cấu hình Email
                        </span>
                      )}
                    </span>
                  </div>
                  <div className="flex items-start gap-2 text-[13px]">
                    <MapPin className="w-4 h-4 shrink-0 mt-0.5 opacity-60" />
                    <span className="line-clamp-2">
                      {trimVal(settings.address) || (
                        <span className="text-gray-400 italic">
                          Chưa nhập địa chỉ
                        </span>
                      )}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-3 mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                  {isLikelyUrl(trimVal(settings.facebook)) && (
                    <span
                      title="Facebook"
                      className="inline-flex w-8 h-8 items-center justify-center rounded-full bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
                    >
                      <Facebook className="w-4 h-4" />
                    </span>
                  )}
                  {isLikelyUrl(trimVal(settings.zalo)) && (
                    <span
                      title="Zalo"
                      className="inline-flex w-8 h-8 items-center justify-center rounded-full bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
                    >
                      <MessageSquare className="w-4 h-4" />
                    </span>
                  )}
                  {!isLikelyUrl(trimVal(settings.facebook)) &&
                    !isLikelyUrl(trimVal(settings.zalo)) && (
                      <span className="text-xs text-gray-400 italic">
                        Không có Liên kết xã hội hợp lệ
                      </span>
                    )}
                </div>
                <div className="mt-4 text-center text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-wide">
                  {trimVal(settings.copyright) ||
                    "© Tên Công Ty. All rights reserved."}
                </div>
              </div>
            </div>
          </Card>

          {/* Completion Status */}
          <Card className="border border-gray-200 dark:border-gray-700 shadow-sm !p-0 overflow-hidden">
            <div className="p-4 border-b border-gray-100 dark:border-gray-700/50 bg-gray-50/50 dark:bg-gray-800/50 flex justify-between items-center">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wide">
                Mức độ hoàn thiện
              </h3>
              <span
                className={`text-xs font-bold px-2 py-0.5 rounded-md ${isFullyCompleted ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"}`}
              >
                {completedCount}/{completionItems.length}
              </span>
            </div>
            <div className="p-4 space-y-3">
              {completionItems.map((item) => (
                <div key={item.id} className="flex items-center gap-2.5">
                  {item.done ? (
                    <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                  ) : (
                    <div className="w-4 h-4 rounded-full border-2 border-gray-300 dark:border-gray-600 shrink-0"></div>
                  )}
                  <span
                    className={`text-[13px] ${item.done ? "text-gray-900 dark:text-gray-100 font-medium" : "text-gray-500 dark:text-gray-400"}`}
                  >
                    {item.label}
                  </span>
                </div>
              ))}
            </div>
          </Card>

          {/* Help / Notes Panel */}
          <Card className="border border-blue-200 dark:border-blue-900/30 bg-blue-50/50 dark:bg-blue-900/10 shadow-sm">
            <div className="flex items-center gap-2 mb-3 text-blue-700 dark:text-blue-400">
              <AlertCircle className="w-4 h-4" />
              <h3 className="font-bold text-[13px] uppercase tracking-wide">
                Lưu ý cấu hình
              </h3>
            </div>
            <ul className="text-xs text-gray-600 dark:text-gray-300 space-y-2 list-disc pl-4 leading-relaxed">
              <li>
                Thông tin tại đây được dùng để làm dữ liệu hiển thị gốc ở{" "}
                <strong>Chân trang (Footer)</strong>,{" "}
                <strong>Trang Liên hệ</strong> và tài liệu hệ thống.
              </li>
              <li>
                Nên dùng <strong>Email</strong> và <strong>Hotline</strong> chăm
                sóc khách hàng chính thức để tạo độ uy tín.
              </li>
              <li>
                Kiểm tra kỹ logo ở chế độ Xem trước (Preview) để tránh hiển thị
                sai tỷ lệ khi ra ngoài hệ thống.
              </li>
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default SettingsGeneralPage;
