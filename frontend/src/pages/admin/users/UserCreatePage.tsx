// src/pages/admin/users/UserCreatePage.tsx
import React, {
  useEffect,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import Card from "../../../components/layouts/Card";
import { http } from "../../../services/http";

interface Role {
  id: number;
  title: string;
}

interface UserFormData {
  full_name: string;
  email: string;
  password: string;
  role_id: number | "";
  phone: string;
  avatar: string;
  status: "active" | "inactive";
}

type ApiList<T> = { success: true; data: T[]; meta?: any };
type ApiOk = { success: true; data?: any; url?: string; meta?: any; errors?: any };

const UserCreatePage: React.FC = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState<UserFormData>({
    full_name: "",
    email: "",
    password: "",
    role_id: "",
    phone: "",
    avatar: "",
    status: "active",
  });

  const [roles, setRoles] = useState<Role[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewImage, setPreviewImage] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [errors, setErrors] = useState<Partial<Record<keyof UserFormData, string>>>({});

  // 🔹 Lấy danh sách roles (dùng http)
  useEffect(() => {
    (async () => {
      try {
        const res = await http<ApiList<Role>>("GET", "/api/v1/admin/roles");
        if (res.success && Array.isArray(res.data)) setRoles(res.data);
      } catch (err) {
        console.error("fetchRoles error:", err);
      }
    })();
  }, []);

  // 🔹 Xử lý input
  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name as keyof typeof errors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  // 🔹 Chọn file avatar → preview
  const handleImageSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    setPreviewImage(URL.createObjectURL(file));
    if (errors.avatar) {
      setErrors((prev) => ({ ...prev, avatar: undefined }));
    }
  };

  const validateForm = () => {
    const newErrors: Partial<Record<keyof UserFormData, string>> = {};
    if (!formData.full_name.trim()) {
      newErrors.full_name = "Vui lòng nhập họ và tên.";
    }
    if (!formData.email.trim()) {
      newErrors.email = "Vui lòng nhập email.";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Địa chỉ email không hợp lệ.";
    }
    if (!formData.password) {
      newErrors.password = "Vui lòng nhập mật khẩu.";
    } else if (formData.password.length < 6) {
      newErrors.password = "Mật khẩu phải có ít nhất 6 ký tự.";
    }
    if (!formData.role_id) {
      newErrors.role_id = "Vui lòng chọn vai trò.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 🔹 Submit form
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      setErrors({});

      let uploadedAvatarUrl = formData.avatar;

      // 🖼 Upload avatar (dùng http + FormData)
      if (selectedFile) {
        const formDataImg = new FormData();
        formDataImg.append("file", selectedFile);
        const up = await http<ApiOk>(
          "POST",
          "/api/v1/admin/upload",
          formDataImg
        );
        uploadedAvatarUrl = up?.data?.url || up?.url || "";
        if (!uploadedAvatarUrl) {
          setErrors({ avatar: "Không thể upload ảnh đại diện. Vui lòng thử lại." });
          setLoading(false);
          return;
        }
      }

      // 📨 Gửi dữ liệu lên server (giữ snake_case)
      const payload = {
        full_name: formData.full_name,
        email: formData.email,
        password: formData.password,
        role_id: formData.role_id === "" ? null : Number(formData.role_id),
        phone: formData.phone || null,
        avatar: uploadedAvatarUrl || null,
        status: formData.status,
      };

      const res = await http<ApiOk>(
        "POST",
        "/api/v1/admin/users/create",
        payload
      );
      if (res.success) {
        alert("🎉 Tạo người dùng thành công!");
        navigate("/admin/users");
      } else {
        if (res.errors) {
          setErrors(res.errors);
        } else {
          alert((res as any).message || "Tạo người dùng thất bại.");
        }
      }
    } catch (err: any) {
      console.error("Create user error:", err);
      if (err?.data?.errors) {
        setErrors(err.data.errors);
      } else {
        alert(err?.data?.message || err?.message || "Lỗi kết nối server!");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
          Thêm người dùng
        </h1>
        <button
          onClick={() => navigate("/admin/users")}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-md"
        >
          <ArrowLeft className="w-4 h-4" /> Quay lại
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Họ và tên */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Họ và tên <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="full_name"
            value={formData.full_name}
            onChange={handleChange}
            placeholder="Nhập họ và tên..."
            className={`w-full border ${errors.full_name ? 'border-red-500' : 'border-gray-300'} dark:border-gray-600 rounded-md p-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
          />
          {errors.full_name && <p className="text-sm text-red-600 mt-1">{errors.full_name}</p>}
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Email <span className="text-red-500">*</span>
          </label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="Nhập địa chỉ email..."
            className={`w-full border ${errors.email ? 'border-red-500' : 'border-gray-300'} dark:border-gray-600 rounded-md p-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
          />
          {errors.email && <p className="text-sm text-red-600 mt-1">{errors.email}</p>}
        </div>

        {/* Mật khẩu */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Mật khẩu <span className="text-red-500">*</span>
          </label>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="Nhập mật khẩu..."
            className={`w-full border ${errors.password ? 'border-red-500' : 'border-gray-300'} dark:border-gray-600 rounded-md p-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
          />
          {errors.password && <p className="text-sm text-red-600 mt-1">{errors.password}</p>}
        </div>

        {/* Số điện thoại */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Số điện thoại
          </label>
          <input
            type="text"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            placeholder="Nhập số điện thoại..."
            className={`w-full border ${errors.phone ? 'border-red-500' : 'border-gray-300'} dark:border-gray-600 rounded-md p-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
          />
          {errors.phone && <p className="text-sm text-red-600 mt-1">{errors.phone}</p>}
        </div>

        {/* Vai trò */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Vai trò <span className="text-red-500">*</span>
          </label>
          <select
            name="role_id"
            value={formData.role_id}
            onChange={handleChange}
            className={`w-full border ${errors.role_id ? 'border-red-500' : 'border-gray-300'} dark:border-gray-600 rounded-md p-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
          >
            <option value="">-- Chọn vai trò --</option>
            {roles.map((role) => (
              <option key={role.id} value={role.id}>
                {role.title}
              </option>
            ))}
          </select>
          {errors.role_id && <p className="text-sm text-red-600 mt-1">{errors.role_id}</p>}
        </div>

        {/* Ảnh đại diện */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Ảnh đại diện
          </label>
          <input type="file" accept="image/*" onChange={handleImageSelect} />
          {errors.avatar && <p className="text-sm text-red-600 mt-1">{errors.avatar}</p>}
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
                  setPreviewImage("");
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
                checked={formData.status === "active"}
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
                checked={formData.status === "inactive"}
                onChange={handleChange}
              />
              <span className="text-gray-800 dark:text-gray-200">Tạm dừng</span>
            </label>
          </div>
        </div>

        {/* Nút hành động */}
        <div className="flex justify-end gap-3 mt-6">
          <button
            type="button"
            onClick={() => navigate("/admin/users")}
            className="px-4 py-2 rounded-md border border-gray-400 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            Hủy
          </button>
          <button
            type="submit"
            className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700"
            disabled={loading}
          >
            {loading ? "Đang lưu..." : "Lưu người dùng"}
          </button>
        </div>
      </form>
    </Card>
  );
};

export default UserCreatePage;
