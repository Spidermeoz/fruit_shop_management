// src/pages/admin/roles/RoleCreatePage.tsx
import React, { useState, type ChangeEvent, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import Card from "../../../components/layouts/Card";
import RichTextEditor from "../../../components/common/RichTextEditor";
import { http } from "../../../services/http";

interface RoleFormData {
  title: string;
  description: string;
}

type ApiOk<T> = { success: true; data: T; meta?: any };
type ApiErr = { success: false; message?: string };

const RoleCreatePage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState<RoleFormData>({
    title: "",
    description: "",
  });

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Upload ảnh trong HTML (blob/data URL) -> thay src bằng URL sau upload
  const uploadImagesInHtml = async (html?: string | null) => {
    if (!html) return html;
    try {
      const tempDiv = document.createElement("div");
      tempDiv.innerHTML = html;
      const imgs = Array.from(tempDiv.getElementsByTagName("img"));

      for (const img of imgs) {
        const src = img.getAttribute("src") || "";
        if (!src) continue;

        if (src.startsWith("blob:") || src.startsWith("data:")) {
          try {
            const resp = await fetch(src);
            const blob = await resp.blob();
            const file = new File([blob], "image.png", {
              type: blob.type || "image/png",
            });

            const fd = new FormData();
            fd.append("file", file);

            // Dùng http() với FormData (http sẽ không set Content-Type thủ công)
            const upJson = await http<any>("POST", "/api/v1/admin/upload", fd);

            const uploadedUrl =
              (upJson && upJson.success && (upJson.data?.url || upJson.url)) ||
              null;

            if (uploadedUrl) {
              img.setAttribute("src", uploadedUrl);
            }
          } catch (err) {
            console.error("Upload image in description failed:", err);
            // tiếp tục ảnh khác
          }
        }
      }
      return tempDiv.innerHTML;
    } catch (err) {
      console.error("Process images error:", err);
      return html;
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      alert("Vui lòng nhập tên vai trò.");
      return;
    }

    try {
      setLoading(true);

      const processedDescription = await uploadImagesInHtml(
        formData.description
      );

      const payload = {
        title: formData.title,
        description: processedDescription,
      };

      const res = await http<ApiOk<any> | ApiErr>(
        "POST",
        "/api/v1/admin/roles/create",
        payload
      );

      if ("success" in res && res.success) {
        alert("🎉 Thêm vai trò thành công!");
        navigate("/admin/roles");
      } else {
        alert((res as ApiErr).message || "Không thể thêm vai trò!");
      }
    } catch (err: any) {
      console.error("Create role error:", err);
      alert(err?.message || "Lỗi kết nối server!");
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
        {/* Tên vai trò */}
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

        {/* Mô tả (TinyMCE) */}
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

        {/* Nút hành động */}
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
