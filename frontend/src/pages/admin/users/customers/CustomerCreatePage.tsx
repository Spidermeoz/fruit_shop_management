import React, { useState, type FormEvent } from "react";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

import Card from "../../../../components/admin/layouts/Card";
import { useAdminToast } from "../../../../context/AdminToastContext";

import UserAvatarField from "../shared/UserAvatarField";
import UserStatusField from "../shared/UserStatusField";
import { createUser, uploadUserAvatar } from "../shared/userApi";
import {
  buildUserPayload,
  type UserFormErrors,
  type UserFormValues,
} from "../shared/userMappers";

const CustomerCreatePage: React.FC = () => {
  const navigate = useNavigate();
  const { showSuccessToast, showErrorToast } = useAdminToast();

  const [form, setForm] = useState<UserFormValues>({
    fullName: "",
    email: "",
    phone: "",
    avatar: "",
    status: "active",
    roleId: "",
  });

  const [password, setPassword] = useState("");

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewImage, setPreviewImage] = useState("");
  const [imageMethod, setImageMethod] = useState<"upload" | "url" | "keep">(
    "upload",
  );
  const [imageUrl, setImageUrl] = useState("");

  const [errors, setErrors] = useState<UserFormErrors>({});
  const [loading, setLoading] = useState(false);

  const handleFieldChange = <
    K extends keyof Pick<
      UserFormValues,
      "fullName" | "email" | "phone" | "status"
    >,
  >(
    key: K,
    value: UserFormValues[K],
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const validateImageFile = (file: File) => {
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowedTypes.includes(file.type)) {
      return "File tải lên phải là ảnh (jpg, png, webp, gif).";
    }

    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      return "Ảnh không được lớn hơn 5MB.";
    }

    return null;
  };

  const handleFileSelect = (file: File) => {
    const imageError = validateImageFile(file);
    if (imageError) {
      setErrors((prev) => ({ ...prev, avatar: imageError }));
      setSelectedFile(null);
      setPreviewImage("");
      return;
    }

    setSelectedFile(file);
    setPreviewImage(URL.createObjectURL(file));
    setErrors((prev) => ({ ...prev, avatar: undefined }));
  };

  const handleImageMethodChange = (method: "upload" | "url" | "keep") => {
    setImageMethod(method);

    if (method === "upload") {
      setImageUrl("");
      setForm((prev) => ({ ...prev, avatar: "" }));
      if (!selectedFile) setPreviewImage("");
    }

    if (method === "url") {
      setSelectedFile(null);
      setPreviewImage(imageUrl || "");
    }

    if (method === "keep") {
      setSelectedFile(null);
      setImageUrl("");
      setPreviewImage("");
      setForm((prev) => ({ ...prev, avatar: "" }));
    }

    setErrors((prev) => ({ ...prev, avatar: undefined }));
  };

  const validateForm = () => {
    const nextErrors: UserFormErrors = {};

    if (!form.fullName.trim()) {
      nextErrors.fullName = "Vui lòng nhập họ và tên.";
    }

    if (!form.email.trim()) {
      nextErrors.email = "Vui lòng nhập email.";
    } else if (!/\S+@\S+\.\S+/.test(form.email)) {
      nextErrors.email = "Địa chỉ email không hợp lệ.";
    }

    if (!form.phone.trim()) {
      nextErrors.phone = "Vui lòng nhập số điện thoại.";
    } else if (!/^0\d{9}$/.test(form.phone)) {
      nextErrors.phone =
        "Số điện thoại phải bắt đầu bằng số 0 và có 10 chữ số.";
    }

    if (!password) {
      nextErrors.password = "Vui lòng nhập mật khẩu.";
    } else if (password.length < 6) {
      nextErrors.password = "Mật khẩu phải có ít nhất 6 ký tự.";
    }

    if (imageMethod === "url" && imageUrl.trim()) {
      try {
        new URL(imageUrl.trim());
      } catch {
        nextErrors.avatar = "URL ảnh đại diện không hợp lệ.";
      }
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const resolveAvatarUrl = async () => {
    if (imageMethod === "upload" && selectedFile) {
      return uploadUserAvatar(selectedFile);
    }

    if (imageMethod === "url" && imageUrl.trim()) {
      return imageUrl.trim();
    }

    return "";
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setLoading(true);
      setErrors({});

      const avatarUrl = await resolveAvatarUrl();

      const payload = buildUserPayload({
        values: form,
        userType: "customer",
        avatarUrl,
        password: password.trim(),
      });

      const res = await createUser(payload);

      if (res.success) {
        showSuccessToast({ message: "Tạo khách hàng thành công!" });
        navigate("/admin/users/customers");
      } else if (res.errors) {
        setErrors(res.errors as UserFormErrors);
      } else {
        showErrorToast((res as any).message || "Tạo khách hàng thất bại.");
      }
    } catch (err: any) {
      console.error("create customer error:", err);
      if (err?.data?.errors) {
        setErrors(err.data.errors);
      } else {
        showErrorToast(
          err?.data?.message || err?.message || "Lỗi kết nối server!",
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
          Thêm khách hàng
        </h1>

        <button
          onClick={() => navigate("/admin/users/customers")}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-md transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Quay lại
        </button>
      </div>

      <Card>
        <form onSubmit={handleSubmit} className="space-y-4 p-2">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Họ và tên <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.fullName}
              onChange={(e) => handleFieldChange("fullName", e.target.value)}
              placeholder="Nhập họ và tên..."
              className={`w-full border ${
                errors.fullName
                  ? "border-red-500 dark:border-red-500"
                  : "border-gray-300 dark:border-gray-600"
              } rounded-md p-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors`}
            />
            {errors.fullName && (
              <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                {errors.fullName}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => handleFieldChange("email", e.target.value)}
              placeholder="Nhập địa chỉ email..."
              className={`w-full border ${
                errors.email
                  ? "border-red-500 dark:border-red-500"
                  : "border-gray-300 dark:border-gray-600"
              } rounded-md p-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors`}
            />
            {errors.email && (
              <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                {errors.email}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Mật khẩu <span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setErrors((prev) => ({ ...prev, password: undefined }));
              }}
              placeholder="Nhập mật khẩu..."
              className={`w-full border ${
                errors.password
                  ? "border-red-500 dark:border-red-500"
                  : "border-gray-300 dark:border-gray-600"
              } rounded-md p-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors`}
            />
            {errors.password && (
              <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                {errors.password}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Số điện thoại <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.phone}
              onChange={(e) => handleFieldChange("phone", e.target.value)}
              placeholder="Nhập số điện thoại..."
              className={`w-full border ${
                errors.phone
                  ? "border-red-500 dark:border-red-500"
                  : "border-gray-300 dark:border-gray-600"
              } rounded-md p-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors`}
            />
            {errors.phone && (
              <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                {errors.phone}
              </p>
            )}
          </div>

          <div className="rounded-lg border border-dashed border-gray-300 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-800/40">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Tài khoản khách hàng không cần chọn vai trò và không gán chi
              nhánh.
            </p>
          </div>

          <UserAvatarField
            previewImage={previewImage}
            imageMethod={imageMethod}
            imageUrl={imageUrl}
            error={errors.avatar}
            uploadLabel="Upload ảnh"
            urlLabel="Nhập URL"
            keepLabel="Bỏ ảnh"
            allowKeep
            onImageMethodChange={handleImageMethodChange}
            onImageUrlChange={(value) => {
              setImageUrl(value);
              setPreviewImage(value);
              setForm((prev) => ({ ...prev, avatar: value }));
              setErrors((prev) => ({ ...prev, avatar: undefined }));
            }}
            onFileSelect={handleFileSelect}
            onClear={() => {
              setSelectedFile(null);
              setImageUrl("");
              setPreviewImage("");
              setForm((prev) => ({ ...prev, avatar: "" }));
              setImageMethod("upload");
            }}
          />

          <UserStatusField
            value={form.status}
            onChange={(value) => handleFieldChange("status", value)}
          />

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={() => navigate("/admin/users/customers")}
              className="px-4 py-2 rounded-md text-gray-700 dark:text-gray-200 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 transition-colors font-medium"
            >
              Hủy
            </button>

            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-5 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:opacity-50 font-medium"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" /> Đang lưu...
                </>
              ) : (
                "Lưu khách hàng"
              )}
            </button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default CustomerCreatePage;
