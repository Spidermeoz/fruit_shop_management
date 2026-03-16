import React, {
  useEffect,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Card from "../../../components/layouts/Card";
import { http } from "../../../services/http";

interface SettingGeneral {
  website_name: string | null;
  logo: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  copyright: string | null;
}

const SettingsGeneralPage: React.FC = () => {
  const navigate = useNavigate();

  const [settings, setSettings] = useState<SettingGeneral | null>(null);
  const [initialSettings, setInitialSettings] = useState<SettingGeneral | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewLogo, setPreviewLogo] = useState<string>("");

  // Errors
  const [formErrors, setFormErrors] = useState<
    Partial<Record<keyof SettingGeneral, string>>
  >({});

  // ==========================
  // FETCH SETTINGS
  // ==========================
  const fetchSettings = async () => {
    try {
      const json = await http<any>("GET", "/api/v1/admin/settings/general");
      if (json.success) {
        setSettings(json.data);
        setInitialSettings(json.data);
        setPreviewLogo(json.data.logo || "");
        setSelectedFile(null);
      }
    } catch (e) {
      console.error("Fetch settings failed", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  // ==========================
  // HANDLE CHANGE
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
    setSelectedFile(file);
    setPreviewLogo(URL.createObjectURL(file));
  };

  const isDirty = React.useMemo(() => {
    if (!settings || !initialSettings) return false;

    const hasFieldChanges =
      settings.website_name !== initialSettings.website_name ||
      settings.phone !== initialSettings.phone ||
      settings.email !== initialSettings.email ||
      settings.address !== initialSettings.address ||
      settings.copyright !== initialSettings.copyright;

    const hasImageChanges = selectedFile !== null;

    return hasFieldChanges || hasImageChanges;
  }, [settings, initialSettings, selectedFile]);

  // ==========================
  // VALIDATE
  // ==========================
  const validateForm = () => {
    if (!settings) return false;

    const errors: Partial<Record<keyof SettingGeneral, string>> = {};

    if (!settings.website_name || settings.website_name.trim() === "") {
      errors.website_name = "Vui lòng nhập tên website.";
    }
    if (!settings.email || settings.email.trim() === "") {
      errors.email = "Email không được để trống.";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // ==========================
  // SAVE SETTINGS
  // ==========================
  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    if (!settings) return;
    if (!validateForm()) return;

    try {
      setSaving(true);

      const formData = new FormData();

      formData.append("website_name", settings.website_name || "");
      formData.append("phone", settings.phone || "");
      formData.append("email", settings.email || "");
      formData.append("address", settings.address || "");
      formData.append("copyright", settings.copyright || "");

      if (selectedFile) {
        formData.append("logo", selectedFile);
      }

      const json = await http<any>(
        "PATCH",
        "/api/v1/admin/settings/general",
        formData,
      );

      if (json.success) {
        alert("✔ Cập nhật thành công!");
        fetchSettings();
      } else {
        alert(json.message || "Có lỗi xảy ra.");
      }
    } catch (e) {
      console.error(e);
      alert("Không thể kết nối server.");
    } finally {
      setSaving(false);
    }
  };

  // ==========================
  // UI
  // ==========================
  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        {/* Thêm dark:text-gray-400 */}
        <Loader2 className="w-6 h-6 animate-spin text-gray-500 dark:text-gray-400" />
        <span className="ml-2 text-gray-600 dark:text-gray-400">
          Đang tải cấu hình...
        </span>
      </div>
    );
  }

  if (!settings)
    return (
      <p className="text-center py-10 dark:text-gray-400">Không có dữ liệu.</p>
    );

  return (
    <div>
      {/* Title */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
          Cài đặt chung
        </h1>

        <button
          onClick={() => navigate("/admin/dashboard")}
          // Thêm dark mode cho nút quay lại
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-white rounded-md transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Quay lại
        </button>
      </div>

      {/* CARD */}
      <Card>
        <form onSubmit={handleSave} className="space-y-5 p-2">
          {/* Website name */}
          <div>
            <label className="block font-medium mb-1 text-gray-800 dark:text-gray-200">
              Tên website
            </label>
            <input
              type="text"
              name="website_name"
              value={settings.website_name || ""}
              onChange={handleChange}
              // Thêm dark mode cho ô input
              className={`w-full border p-2 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
                formErrors.website_name
                  ? "border-red-500 dark:border-red-500"
                  : "border-gray-300 dark:border-gray-600"
              }`}
            />
            {formErrors.website_name && (
              <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                {formErrors.website_name}
              </p>
            )}
          </div>

          {/* Logo */}
          <div>
            <label className="block font-medium mb-1 text-gray-800 dark:text-gray-200">
              Logo
            </label>

            {/* Style lại nút chọn file cho gọn gàng và hỗ trợ dark mode */}
            <input
              type="file"
              accept="image/*"
              onChange={handleImageSelect}
              className="block w-full text-sm text-gray-500 dark:text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-gray-700 dark:file:text-gray-200 dark:hover:file:bg-gray-600 cursor-pointer"
            />

            {previewLogo && (
              <img
                src={previewLogo}
                alt="Logo preview"
                className="mt-3 h-16 w-16 object-cover rounded border border-gray-300 dark:border-gray-600"
              />
            )}
          </div>

          {/* Phone */}
          <div>
            <label className="block font-medium mb-1 text-gray-800 dark:text-gray-200">
              Số điện thoại
            </label>
            <input
              type="text"
              name="phone"
              value={settings.phone || ""}
              onChange={handleChange}
              className="w-full border border-gray-300 dark:border-gray-600 p-2 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block font-medium mb-1 text-gray-800 dark:text-gray-200">
              Email
            </label>
            <input
              type="email"
              name="email"
              value={settings.email || ""}
              onChange={handleChange}
              className={`w-full border p-2 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
                formErrors.email
                  ? "border-red-500 dark:border-red-500"
                  : "border-gray-300 dark:border-gray-600"
              }`}
            />
            {formErrors.email && (
              <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                {formErrors.email}
              </p>
            )}
          </div>

          {/* Address */}
          <div>
            <label className="block font-medium mb-1 text-gray-800 dark:text-gray-200">
              Địa chỉ
            </label>
            <textarea
              name="address"
              value={settings.address || ""}
              onChange={handleChange}
              className="w-full border border-gray-300 dark:border-gray-600 p-2 rounded h-20 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
            />
          </div>

          {/* Copyright */}
          <div>
            <label className="block font-medium mb-1 text-gray-800 dark:text-gray-200">
              Bản quyền
            </label>
            <input
              type="text"
              name="copyright"
              value={settings.copyright || ""}
              onChange={handleChange}
              className="w-full border border-gray-300 dark:border-gray-600 p-2 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
            />
          </div>

          {/* Save button */}
          <div className="flex justify-end pt-2">
            <button
              type="submit"
              // Disable khi đang lưu HOẶC khi không có thay đổi
              disabled={saving || !isDirty}
              className="flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-400 dark:disabled:bg-gray-600"
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
        </form>
      </Card>
    </div>
  );
};

export default SettingsGeneralPage;
