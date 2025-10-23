import React, { useState, type ChangeEvent, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import Card from "../../../components/layouts/Card";
import RichTextEditor from "../../../components/common/RichTextEditor"; // ✅ TinyMCE editor

interface RoleFormData {
  title: string;
  description: string;
}

const RoleCreatePage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState<RoleFormData>({
    title: "",
    description: "",
  });

  // 🔹 Xử lý input cơ bản
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // 🔹 Khi nhấn Lưu
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      alert("Vui lòng nhập tên vai trò.");
      return;
    }

    try {
      setLoading(true);
      const res = await fetch("/api/v1/admin/roles/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const json = await res.json();
      if (json.success) {
        alert("🎉 Thêm vai trò thành công!");
        navigate("/admin/roles");
      } else {
        alert(json.message || "Không thể thêm vai trò!");
      }
    } catch (err) {
      console.error("Create role error:", err);
      alert("Lỗi kết nối server!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
          Thêm vai trò
        </h1>
        <button
          onClick={() => navigate("/admin/roles")}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-md"
        >
          <ArrowLeft className="w-4 h-4" /> Quay lại
        </button>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* --- Tên vai trò --- */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Tên vai trò
          </label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder="Nhập tên vai trò..."
            className="w-full border border-gray-300 dark:border-gray-600 rounded-md p-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            required
          />
        </div>

        {/* --- Mô tả (dùng TinyMCE) --- */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Mô tả vai trò
          </label>
          <RichTextEditor
            value={formData.description}
            onChange={(content) =>
              setFormData((prev) => ({ ...prev, description: content }))
            }
          />
        </div>

        {/* --- Nút hành động --- */}
        <div className="flex justify-end gap-3 mt-6">
          <button
            type="button"
            onClick={() => navigate("/admin/roles")}
            className="px-4 py-2 rounded-md border border-gray-400 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            Hủy
          </button>
          <button
            type="submit"
            className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700"
            disabled={loading}
          >
            {loading ? "Đang lưu..." : "Lưu vai trò"}
          </button>
        </div>
      </form>
    </Card>
  );
};

export default RoleCreatePage;
