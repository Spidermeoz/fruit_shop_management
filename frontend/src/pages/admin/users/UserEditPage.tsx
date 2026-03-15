// src/pages/admin/users/UserEditPage.tsx
import React, {
  useEffect,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Loader2, Save, ArrowLeft } from "lucide-react";
import Card from "../../../components/layouts/Card";
import { http } from "../../../services/http";

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

type ApiDetail<T> = { success: true; data: T; meta?: any };
type ApiList<T> = { success: true; data: T[]; meta?: any };
type ApiOk = {
  success: true;
  data?: any;
  url?: string;
  meta?: any;
  errors?: any;
};

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
  const [errors, setErrors] = useState<
    Partial<Record<keyof User, string>> & {
      password?: string;
      confirmPassword?: string;
    }
  >({});
  const [imageMethod, setImageMethod] = useState<"upload" | "url" | "keep">(
    "keep",
  );
  const [imageUrl, setImageUrl] = useState<string>("");

  // 🔹 Lấy dữ liệu user
  const fetchUser = async () => {
    try {
      setLoading(true);
      const res = await http<ApiDetail<User>>(
        "GET",
        `/api/v1/admin/users/edit/${id}`,
      );
      if (res.success && res.data) {
        const data = res.data as User;
        setUser(data);
        setPreviewImage(data.avatar || "");
      }
    } catch (err: any) {
      console.error(err);
      setErrors({ email: err?.message || "Không thể kết nối server." });
    } finally {
      setLoading(false);
    }
  };

  // 🔹 Lấy danh sách roles
  const fetchRoles = async () => {
    try {
      const res = await http<ApiList<Role>>("GET", "/api/v1/admin/roles");
      if (res.success && Array.isArray(res.data)) {
        setRoles(res.data);
      }
    } catch (err) {
      console.error("fetchRoles error:", err);
    }
  };

  useEffect(() => {
    fetchUser();
    fetchRoles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // 🔹 Xử lý input
  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setUser((prev) => (prev ? { ...prev, [name]: value } : prev));
    if (errors[name as keyof typeof errors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  // 🔹 Chọn ảnh mới → preview
  const handleImageSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];

    // Sai định dạng
    if (!allowedTypes.includes(file.type)) {
      setErrors((prev) => ({
        ...prev,
        avatar: "File tải lên phải là ảnh (jpg, png, webp, gif).",
      }));

      e.target.value = "";
      setSelectedFile(null);
      setPreviewImage(user?.avatar || "");
      return;
    }

    // Quá dung lượng
    const maxSize = 5 * 1024 * 1024;

    if (file.size > maxSize) {
      setErrors((prev) => ({
        ...prev,
        avatar: "Ảnh không được lớn hơn 5MB.",
      }));

      e.target.value = "";
      setSelectedFile(null);
      setPreviewImage(user?.avatar || "");
      return;
    }

    // File hợp lệ
    setSelectedFile(file);
    setPreviewImage(URL.createObjectURL(file));

    if (errors.avatar) {
      setErrors((prev) => ({ ...prev, avatar: undefined }));
    }
  };

  // 🔹 Validate form
  const validateForm = () => {
    const newErrors: typeof errors = {};

    if (!user?.full_name?.trim()) {
      newErrors.full_name = "Vui lòng nhập họ và tên.";
    }

    if (!user?.email?.trim()) {
      newErrors.email = "Vui lòng nhập email.";
    } else if (!/\S+@\S+\.\S+/.test(user.email)) {
      newErrors.email = "Địa chỉ email không hợp lệ.";
    }

    if (!user?.role_id) {
      newErrors.role_id = "Vui lòng chọn vai trò.";
    }

    if (newPassword || confirmPassword) {
      if (newPassword.length < 6) {
        newErrors.password = "Mật khẩu phải có ít nhất 6 ký tự.";
      }
      if (newPassword !== confirmPassword) {
        newErrors.confirmPassword = "Mật khẩu xác nhận không khớp.";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 🔹 Lưu thay đổi
  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!validateForm()) return;

    try {
      setSaving(true);

      let avatarUrl = user.avatar;

      // 🖼 Upload avatar mới nếu có chọn (dùng http + FormData)
      if (imageMethod === "upload" && selectedFile) {
        const formDataImg = new FormData();
        formDataImg.append("file", selectedFile);

        const up = await http<ApiOk>(
          "POST",
          "/api/v1/admin/upload",
          formDataImg,
        );
        const url = up?.data?.url || up?.url;
        if (!url) {
          setErrors({ avatar: "Không thể upload ảnh đại diện." });
          setSaving(false);
          return;
        }
        avatarUrl = url;
      }
      // 🖼 Sử dụng URL trực tiếp nếu chọn phương thức URL
      else if (imageMethod === "url" && imageUrl) {
        avatarUrl = imageUrl;
      }
      // 🖼 Giữ nguyên URL hiện tại nếu chọn phương thức keep
      else if (imageMethod === "keep") {
        avatarUrl = user.avatar;
      }

      const body: any = {
        ...user,
        avatar: avatarUrl,
      };
      if (newPassword.trim()) {
        body.password = newPassword.trim();
      }

      const resp = await http<ApiOk>(
        "PATCH",
        `/api/v1/admin/users/edit/${id}`,
        body,
      );

      if (resp.success) {
        alert("✅ Cập nhật người dùng thành công!");
        navigate("/admin/users");
      } else if (resp.errors) {
        setErrors(resp.errors);
      } else {
        alert((resp as any).message || "Cập nhật thất bại.");
      }
    } catch (err: any) {
      console.error(err);
      alert(err?.message || "Không thể kết nối server.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-gray-500 dark:text-gray-400" />
        <span className="ml-2 text-gray-600 dark:text-gray-400">
          Đang tải dữ liệu người dùng...
        </span>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
          Chỉnh sửa người dùng
        </h1>
        <button
          onClick={() => navigate("/admin/users")}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-md transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Quay lại
        </button>
      </div>

      <Card>
        <form onSubmit={handleSave} className="space-y-4 p-2">
          {/* Họ và tên */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Họ và tên <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="full_name"
              value={user.full_name || ""}
              onChange={handleChange}
              className={`w-full border ${
                errors.full_name ? "border-red-500" : "border-gray-300"
              } dark:border-gray-600 rounded-md p-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors`}
            />
            {errors.full_name && (
              <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                {errors.full_name}
              </p>
            )}
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              name="email"
              value={user.email || ""}
              onChange={handleChange}
              className={`w-full border ${
                errors.email ? "border-red-500" : "border-gray-300"
              } dark:border-gray-600 rounded-md p-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors`}
            />
            {errors.email && (
              <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                {errors.email}
              </p>
            )}
          </div>

          {/* Mật khẩu mới */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Mật khẩu mới (tuỳ chọn)
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Nhập mật khẩu mới..."
              className={`w-full border ${
                errors.password ? "border-red-500" : "border-gray-300"
              } dark:border-gray-600 rounded-md p-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors`}
            />
            {errors.password && (
              <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                {errors.password}
              </p>
            )}
          </div>

          {/* Xác nhận mật khẩu */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Xác nhận mật khẩu mới
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Nhập lại mật khẩu mới..."
              className={`w-full border ${
                errors.confirmPassword ? "border-red-500" : "border-gray-300"
              } dark:border-gray-600 rounded-md p-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors`}
            />
            {errors.confirmPassword && (
              <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                {errors.confirmPassword}
              </p>
            )}
          </div>

          {/* Số điện thoại */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Số điện thoại
            </label>
            <input
              type="text"
              name="phone"
              value={user.phone || ""}
              onChange={handleChange}
              className="w-full border border-gray-300 dark:border-gray-600 rounded-md p-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
            />
          </div>

          {/* Vai trò */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Vai trò <span className="text-red-500">*</span>
            </label>
            <select
              name="role_id"
              value={user.role_id || ""}
              onChange={handleChange}
              className={`w-full border ${
                errors.role_id ? "border-red-500" : "border-gray-300"
              } dark:border-gray-600 rounded-md p-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors`}
            >
              <option value="">-- Chọn vai trò --</option>
              {roles.map((role) => (
                <option key={role.id} value={role.id}>
                  {role.title}
                </option>
              ))}
            </select>
            {errors.role_id && (
              <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                {errors.role_id}
              </p>
            )}
          </div>

          {/* Ảnh đại diện */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Ảnh đại diện
            </label>

            {/* Tab chọn phương thức - Đã sửa khoảng cách bằng gap-3 */}
            <div className="flex flex-wrap gap-3 mb-4">
              <button
                type="button"
                className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
                  imageMethod === "upload"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                }`}
                onClick={() => setImageMethod("upload")}
              >
                Upload ảnh mới
              </button>
              <button
                type="button"
                className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
                  imageMethod === "url"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                }`}
                onClick={() => setImageMethod("url")}
              >
                Nhập URL
              </button>
              <button
                type="button"
                className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
                  imageMethod === "keep"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                }`}
                onClick={() => {
                  setImageMethod("keep");
                  setPreviewImage(user.avatar || "");
                }}
              >
                Giữ ảnh hiện tại
              </button>
            </div>

            {/* Nội dung theo phương thức */}
            {imageMethod === "upload" ? (
              <div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageSelect}
                  className="block w-full text-sm text-gray-500 dark:text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-gray-700 dark:file:text-gray-200 dark:hover:file:bg-gray-600 cursor-pointer"
                />
              </div>
            ) : imageMethod === "url" ? (
              <div>
                <input
                  type="url"
                  placeholder="Nhập URL ảnh đại diện"
                  value={imageUrl}
                  onChange={(e) => {
                    setImageUrl(e.target.value);
                    setPreviewImage(e.target.value);
                    setUser((prev) =>
                      prev ? { ...prev, avatar: e.target.value } : prev,
                    );
                  }}
                  className={`w-full border ${
                    errors.avatar ? "border-red-500" : "border-gray-300"
                  } dark:border-gray-600 rounded-md p-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors`}
                />
              </div>
            ) : (
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Sẽ giữ nguyên ảnh hiện tại
              </div>
            )}

            {errors.avatar && (
              <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                {errors.avatar}
              </p>
            )}

            {previewImage && (
              <div className="mt-4 relative w-fit">
                <img
                  src={previewImage}
                  alt="preview"
                  className="h-24 w-24 object-cover rounded-md border border-gray-300 dark:border-gray-600"
                />
                {imageMethod !== "keep" && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedFile(null);
                      setImageUrl("");
                      setImageMethod("keep");
                      setPreviewImage(user.avatar || "");
                    }}
                    className="absolute -top-2 -right-2 bg-gray-500 dark:bg-gray-600 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-gray-600 dark:hover:bg-gray-500 transition-colors"
                  >
                    ×
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Trạng thái */}
          <div className="pt-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Trạng thái
            </label>
            <div className="flex gap-6">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  name="status"
                  value="active"
                  checked={user.status === "active"}
                  onChange={handleChange}
                  className="text-blue-600 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
                />
                <span className="text-gray-800 dark:text-gray-200">
                  Hoạt động
                </span>
              </label>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  name="status"
                  value="inactive"
                  checked={user.status === "inactive"}
                  onChange={handleChange}
                  className="text-blue-600 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
                />
                <span className="text-gray-800 dark:text-gray-200">
                  Tạm dừng
                </span>
              </label>
            </div>
          </div>

          {/* Nút lưu */}
          <div className="flex justify-end pt-4">
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
