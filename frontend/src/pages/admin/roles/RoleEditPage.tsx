import React, {
  useEffect,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Loader2, Save, ArrowLeft } from "lucide-react";
import Card from "../../../components/layouts/Card";
import RichTextEditor from "../../../components/common/RichTextEditor"; // ✅ dùng TinyMCE

interface Role {
  id: number;
  title: string;
  description?: string | null;
  created_at?: string;
  updated_at?: string;
}

const RoleEditPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [role, setRole] = useState<Role | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // 🔹 Lấy thông tin vai trò
  const fetchRole = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/v1/admin/roles/edit/${id}`);
      const json = await res.json();
      if (json.success && json.data) {
        setRole(json.data);
      } else {
        setError(json.message || "Không tìm thấy vai trò.");
      }
    } catch (err) {
      console.error(err);
      setError("Không thể kết nối server.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRole();
  }, [id]);

  // 🔹 Xử lý input
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setRole((prev) => (prev ? { ...prev, [name]: value } : prev));
  };

  // 🔹 Xử lý mô tả TinyMCE
  const handleDescriptionChange = (content: string) => {
    setRole((prev) => (prev ? { ...prev, description: content } : prev));
  };

  // helper: upload images inside HTML (blob/data URLs) -> replace src with uploaded URL
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
            const up = await fetch("/api/v1/admin/upload", {
              method: "POST",
              body: fd,
            });
            const upJson = await up.json();
            if (upJson && upJson.success && upJson.url) {
              img.setAttribute("src", upJson.url);
            }
          } catch (err) {
            console.error("Upload image in description failed:", err);
          }
        }
      }
      return tempDiv.innerHTML;
    } catch (err) {
      console.error("Process images error:", err);
      return html;
    }
  };

  // 🔹 Lưu thay đổi
  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    if (!role) return;

    if (!role.title.trim()) {
      alert("Vui lòng nhập tên vai trò.");
      return;
    }

    try {
      setSaving(true);

      // process images in description (upload blob/data images to cloud)
      const processedDescription = await uploadImagesInHtml(role.description);

      const res = await fetch(`/api/v1/admin/roles/edit/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: role.title,
          description: processedDescription,
        }),
      });

      const json = await res.json();
      if (json.success) {
        alert("✅ Cập nhật vai trò thành công!");
        navigate(`/admin/roles/edit/${id}`);
      } else {
        alert(json.message || "Cập nhật thất bại.");
      }
    } catch (err) {
      console.error(err);
      alert("Không thể kết nối server.");
    } finally {
      setSaving(false);
    }
  };

  // 🔹 Loading state
  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-gray-500" />
        <span className="ml-2 text-gray-600 dark:text-gray-400">
          Đang tải dữ liệu vai trò...
        </span>
      </div>
    );
  }

  if (error) return <p className="text-center text-red-500 py-10">{error}</p>;
  if (!role) return null;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
          Chỉnh sửa vai trò
        </h1>
        <button
          onClick={() => navigate("/admin/roles")}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-md"
        >
          <ArrowLeft className="w-4 h-4" /> Quay lại
        </button>
      </div>

      {/* Form */}
      <Card>
        <form onSubmit={handleSave} className="space-y-5">
          {/* --- Tên vai trò --- */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Tên vai trò
            </label>
            <input
              type="text"
              name="title"
              value={role.title || ""}
              onChange={handleChange}
              required
              className="w-full border border-gray-300 dark:border-gray-600 rounded-md p-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          {/* --- Mô tả (TinyMCE) --- */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Mô tả vai trò
            </label>
            <RichTextEditor
              value={role.description || ""}
              onChange={handleDescriptionChange}
            />
          </div>

          {/* --- Nút hành động --- */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-colors disabled:opacity-50"
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

export default RoleEditPage;
