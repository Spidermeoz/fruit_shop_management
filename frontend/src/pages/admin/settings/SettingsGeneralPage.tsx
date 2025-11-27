import React, { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
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
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewLogo, setPreviewLogo] = useState<string>("");

  // Errors
  const [formErrors, setFormErrors] = useState<
    Partial<Record<keyof SettingGeneral, string>>
  >({});

  // ==========================
  // 🔥 FETCH SETTINGS
  // ==========================
  const fetchSettings = async () => {
    try {
      const json = await http<any>("GET", "/api/v1/admin/settings/general");
      if (json.success) {
        setSettings(json.data);
        setPreviewLogo(json.data.logo || "");
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
  // 🧩 HANDLE CHANGE
  // ==========================
  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
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

  // ==========================
  // 🧪 VALIDATE
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
  // 💾 SAVE SETTINGS
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
        formData
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
        <Loader2 className="w-6 h-6 animate-spin text-gray-500" />
        <span className="ml-2 text-gray-600">Đang tải cấu hình...</span>
      </div>
    );
  }

  if (!settings) return <p className="text-center py-10">Không có dữ liệu.</p>;

  return (
    <div>
      {/* Title */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
          Cài đặt chung
        </h1>

        <button
          onClick={() => navigate("/admin/dashboard")}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-gray-200 hover:bg-gray-300 rounded-md"
        >
          <ArrowLeft className="w-4 h-4" /> Quay lại
        </button>
      </div>

      {/* CARD */}
      <Card>
        <form onSubmit={handleSave} className="space-y-5">
          {/* Website name */}
          <div>
            <label className="block font-medium mb-1">Tên website</label>
            <input
              type="text"
              name="website_name"
              value={settings.website_name || ""}
              onChange={handleChange}
              className={`w-full border p-2 rounded ${
                formErrors.website_name ? "border-red-500" : "border-gray-300"
              }`}
            />
            {formErrors.website_name && (
              <p className="text-sm text-red-600">{formErrors.website_name}</p>
            )}
          </div>

          {/* Logo */}
          <div>
            <label className="block font-medium mb-1">Logo</label>

            <input type="file" accept="image/*" onChange={handleImageSelect} />

            {previewLogo && (
              <img
                src={previewLogo}
                alt="Logo preview"
                className="mt-3 h-16 w-16 object-cover rounded border"
              />
            )}
          </div>

          {/* Phone */}
          <div>
            <label className="block font-medium mb-1">Số điện thoại</label>
            <input
              type="text"
              name="phone"
              value={settings.phone || ""}
              onChange={handleChange}
              className="w-full border p-2 rounded"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block font-medium mb-1">Email</label>
            <input
              type="email"
              name="email"
              value={settings.email || ""}
              onChange={handleChange}
              className={`w-full border p-2 rounded ${
                formErrors.email ? "border-red-500" : "border-gray-300"
              }`}
            />
            {formErrors.email && (
              <p className="text-sm text-red-600">{formErrors.email}</p>
            )}
          </div>

          {/* Address */}
          <div>
            <label className="block font-medium mb-1">Địa chỉ</label>
            <textarea
              name="address"
              value={settings.address || ""}
              onChange={handleChange}
              className="w-full border p-2 rounded h-20"
            />
          </div>

          {/* Copyright */}
          <div>
            <label className="block font-medium mb-1">Bản quyền</label>
            <input
              type="text"
              name="copyright"
              value={settings.copyright || ""}
              onChange={handleChange}
              className="w-full border p-2 rounded"
            />
          </div>

          {/* Save button */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md disabled:opacity-50"
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
