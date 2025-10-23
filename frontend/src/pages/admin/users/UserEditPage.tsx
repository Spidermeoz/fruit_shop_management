import React, { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Loader2, Save, ArrowLeft } from "lucide-react";
import Card from "../../../components/layouts/Card";

interface Role {
  id: number;
  title: string;
}

interface User {
  id: number;
  full_name: string;
  email: string;
  role_id: number | "";
  phone: string;
  avatar?: string;
  status: "active" | "inactive";
}

const UserEditPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [user, setUser] = useState<User | null>(null);
  const [roles, setRoles] = useState<Role[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewImage, setPreviewImage] = useState<string>("");
  const [newPassword, setNewPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  // 🔹 Lấy dữ liệu user
  const fetchUser = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/v1/admin/users/edit/${id}`);
      const json = await res.json();

      if (json.success && json.data) {
        const data = json.data as User;
        setUser(data);
        setPreviewImage(data.avatar || "");
      } else {
        setError(json.message || "Không tìm thấy người dùng.");
      }
    } catch (err) {
      console.error(err);
      setError("Không thể kết nối server.");
    } finally {
      setLoading(false);
    }
  };

  // 🔹 Lấy danh sách roles
  const fetchRoles = async () => {
    try {
      const res = await fetch("/api/v1/admin/roles");
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setRoles(json.data);
      }
    } catch (err) {
      console.error("fetchRoles error:", err);
    }
  };

  useEffect(() => {
    fetchUser();
    fetchRoles();
  }, [id]);

  // 🔹 Xử lý input
  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setUser((prev) =>
      prev ? { ...prev, [name]: value } : prev
    );
  };

  // 🔹 Chọn ảnh mới → preview
  const handleImageSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    setPreviewImage(URL.createObjectURL(file));
  };

  // 🔹 Lưu thay đổi
  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (newPassword || confirmPassword) {
      if (newPassword !== confirmPassword) {
        alert("Mật khẩu xác nhận không khớp!");
        return;
      }
      if (newPassword.length < 6) {
        alert("Mật khẩu phải có ít nhất 6 ký tự!");
        return;
      }
    }

    try {
      setSaving(true);

      let avatarUrl = user.avatar;

      // 🖼 Upload avatar mới nếu có chọn
      if (selectedFile) {
        const formDataImg = new FormData();
        formDataImg.append("file", selectedFile);

        const resUpload = await fetch("/api/v1/admin/upload", {
          method: "POST",
          body: formDataImg,
        });

        const uploadJson = await resUpload.json();
        if (uploadJson.success && uploadJson.url) {
          avatarUrl = uploadJson.url;
        } else {
          alert("Không thể upload ảnh đại diện!");
          return;
        }
      }

      // 📨 Gửi PATCH update
      const body: any = {
        ...user,
        avatar: avatarUrl,
      };

      if (newPassword.trim()) {
        body.password = newPassword.trim(); // ✅ chỉ gửi nếu có nhập
      }

      const res = await fetch(`/api/v1/admin/users/edit/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const json = await res.json();
      if (json.success) {
        alert("✅ Cập nhật người dùng thành công!");
        navigate("/admin/users");
      } else {
        alert(json.message || "Không thể cập nhật người dùng.");
      }
    } catch (err) {
      console.error(err);
      alert("Không thể kết nối server.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-gray-500" />
        <span className="ml-2 text-gray-600 dark:text-gray-400">
          Đang tải dữ liệu người dùng...
        </span>
      </div>
    );
  }

  if (error) return <p className="text-center text-red-500 py-10">{error}</p>;
  if (!user) return null;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
          Chỉnh sửa người dùng
        </h1>
        <button
          onClick={() => navigate("/admin/users")}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-md"
        >
          <ArrowLeft className="w-4 h-4" /> Quay lại
        </button>
      </div>

      <Card>
        <form onSubmit={handleSave} className="space-y-4">
          {/* Họ và tên */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Họ và tên
            </label>
            <input
              type="text"
              name="full_name"
              value={user.full_name || ""}
              onChange={handleChange}
              className="w-full border border-gray-300 dark:border-gray-600 rounded-md p-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Email
            </label>
            <input
              type="email"
              name="email"
              value={user.email || ""}
              onChange={handleChange}
              required
              className="w-full border border-gray-300 dark:border-gray-600 rounded-md p-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          {/* Mật khẩu mới */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Mật khẩu mới (tuỳ chọn)
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Nhập mật khẩu mới..."
              className="w-full border border-gray-300 dark:border-gray-600 rounded-md p-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          {/* Xác nhận mật khẩu */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Xác nhận mật khẩu mới
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Nhập lại mật khẩu mới..."
              className="w-full border border-gray-300 dark:border-gray-600 rounded-md p-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          {/* Số điện thoại */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Số điện thoại
            </label>
            <input
              type="text"
              name="phone"
              value={user.phone || ""}
              onChange={handleChange}
              className="w-full border border-gray-300 dark:border-gray-600 rounded-md p-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          {/* Vai trò */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Vai trò
            </label>
            <select
              name="role_id"
              value={user.role_id || ""}
              onChange={handleChange}
              className="w-full border border-gray-300 dark:border-gray-600 rounded-md p-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="">-- Chọn vai trò --</option>
              {roles.map((role) => (
                <option key={role.id} value={role.id}>
                  {role.title}
                </option>
              ))}
            </select>
          </div>

          {/* Ảnh đại diện */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Ảnh đại diện
            </label>
            <input type="file" accept="image/*" onChange={handleImageSelect} />
            {previewImage && (
              <div className="mt-3 relative w-fit">
                <img
                  src={previewImage}
                  alt="preview"
                  className="h-24 w-24 object-cover rounded-md border border-gray-300 dark:border-gray-600"
                />
                <button
                  type="button"
                  onClick={() => {
                    setSelectedFile(null);
                    setPreviewImage(user.avatar || "");
                  }}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600"
                >
                  ×
                </button>
              </div>
            )}
          </div>

          {/* Trạng thái */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Trạng thái
            </label>
            <div className="flex gap-6">
              <label className="flex items-center space-x-2">
                <input
                  type="radio"
                  name="status"
                  value="active"
                  checked={user.status === "active"}
                  onChange={handleChange}
                />
                <span className="text-gray-800 dark:text-gray-200">
                  Hoạt động
                </span>
              </label>
              <label className="flex items-center space-x-2">
                <input
                  type="radio"
                  name="status"
                  value="inactive"
                  checked={user.status === "inactive"}
                  onChange={handleChange}
                />
                <span className="text-gray-800 dark:text-gray-200">
                  Tạm dừng
                </span>
              </label>
            </div>
          </div>

          {/* Nút lưu */}
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

export default UserEditPage;
