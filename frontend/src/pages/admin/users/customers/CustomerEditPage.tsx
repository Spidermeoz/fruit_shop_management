import React, { useEffect, useMemo, useState, type FormEvent } from "react";
import { ArrowLeft, Loader2, Save } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";

import Card from "../../../../components/admin/layouts/Card";
import { useAdminToast } from "../../../../context/AdminToastContext";
import { useAuth } from "../../../../context/AuthContextAdmin";

import UserAvatarField from "../shared/UserAvatarField";
import UserStatusField from "../shared/UserStatusField";
import {
  fetchUserEditDetail,
  updateUser,
  uploadUserAvatar,
} from "../shared/userApi";
import {
  buildUserPayload,
  mapUserFormFromApi,
  type UserFormErrors,
  type UserFormValues,
  type UserListItem,
} from "../shared/userMappers";

const CustomerEditPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showSuccessToast, showErrorToast } = useAdminToast();
  const { user: currentUser } = useAuth();

  const [initialUser, setInitialUser] = useState<UserListItem | null>(null);
  const [form, setForm] = useState<UserFormValues>({
    fullName: "",
    email: "",
    phone: "",
    avatar: "",
    status: "active",
    roleId: "",
  });

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewImage, setPreviewImage] = useState("");
  const [imageMethod, setImageMethod] = useState<"upload" | "url" | "keep">(
    "keep",
  );
  const [imageUrl, setImageUrl] = useState("");

  const [errors, setErrors] = useState<UserFormErrors>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const isSelf = currentUser?.id === Number(id);

  useEffect(() => {
    if (!id) return;

    (async () => {
      try {
        setLoading(true);

        const userData = await fetchUserEditDetail(id);

        if (userData.userType !== "customer") {
          navigate(`/admin/users/internal/edit/${id}`, { replace: true });
          return;
        }

        setInitialUser(userData);
        setForm(
          mapUserFormFromApi({
            id: userData.id,
            full_name: userData.fullName,
            email: userData.email,
            phone: userData.phone,
            avatar: userData.avatar,
            status: userData.status,
            role_id: userData.roleId,
            role: userData.role,
            created_at: userData.createdAt || undefined,
            updated_at: userData.updatedAt || undefined,
            primary_branch_id: userData.primaryBranchId,
            branch_ids: userData.branchIds,
            branches: userData.branches,
          }),
        );
        setPreviewImage(userData.avatar || "");
        setImageUrl(userData.avatar || "");
      } catch (err: any) {
        console.error("fetch customer edit detail error:", err);
        showErrorToast(
          err?.data?.message ||
            err?.message ||
            "Không thể tải dữ liệu khách hàng.",
        );
      } finally {
        setLoading(false);
      }
    })();
  }, [id, navigate, showErrorToast]);

  useEffect(() => {
    return () => {
      if (previewImage?.startsWith("blob:")) {
        URL.revokeObjectURL(previewImage);
      }
    };
  }, [previewImage]);

  const isDirty = useMemo(() => {
    if (!initialUser) return false;

    const hasFieldChanges =
      form.fullName !== (initialUser.fullName || "") ||
      form.email !== initialUser.email ||
      form.phone !== (initialUser.phone || "") ||
      form.status !==
        (initialUser.status === "active" || initialUser.status === "inactive"
          ? initialUser.status
          : "active");

    const hasImageChanges =
      (imageMethod === "upload" && selectedFile !== null) ||
      (imageMethod === "url" &&
        imageUrl.trim() !== "" &&
        imageUrl.trim() !== (initialUser.avatar || ""));

    const hasPasswordChanges =
      newPassword.trim().length > 0 || confirmPassword.trim().length > 0;

    return hasFieldChanges || hasImageChanges || hasPasswordChanges;
  }, [
    form,
    initialUser,
    imageMethod,
    imageUrl,
    selectedFile,
    newPassword,
    confirmPassword,
  ]);

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
      setPreviewImage(initialUser?.avatar || "");
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
      if (!selectedFile) setPreviewImage(initialUser?.avatar || "");
    }

    if (method === "url") {
      setSelectedFile(null);
      setPreviewImage(imageUrl || initialUser?.avatar || "");
    }

    if (method === "keep") {
      setSelectedFile(null);
      setImageUrl(initialUser?.avatar || "");
      setPreviewImage(initialUser?.avatar || "");
      setForm((prev) => ({ ...prev, avatar: initialUser?.avatar || "" }));
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
      nextErrors.phone = "Số điện thoại phải bắt đầu bằng 0 và có 10 chữ số.";
    }

    if (newPassword || confirmPassword) {
      if (newPassword.length < 6) {
        nextErrors.password = "Mật khẩu phải có ít nhất 6 ký tự.";
      }
      if (newPassword !== confirmPassword) {
        nextErrors.confirmPassword = "Mật khẩu xác nhận không khớp.";
      }
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

    return initialUser?.avatar || "";
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!id || !initialUser) return;

    if (isSelf && form.status === "inactive") {
      showErrorToast("Bạn không thể vô hiệu hóa tài khoản đang đăng nhập.");
      return;
    }

    if (!validateForm()) return;

    try {
      setSaving(true);

      const avatarUrl = await resolveAvatarUrl();

      const payload = buildUserPayload({
        values: form,
        userType: "customer",
        avatarUrl,
      });

      if (newPassword.trim()) {
        (payload as any).password = newPassword.trim();
      }

      const resp = await updateUser(id, payload);

      if (resp.success) {
        showSuccessToast({ message: "Cập nhật khách hàng thành công!" });
        navigate("/admin/users/customers");
      } else if (resp.errors) {
        setErrors(resp.errors as UserFormErrors);
      } else {
        showErrorToast((resp as any).message || "Cập nhật thất bại.");
      }
    } catch (err: any) {
      console.error("update customer error:", err);
      if (err?.data?.errors) {
        setErrors(err.data.errors);
      } else {
        showErrorToast(
          err?.data?.message || err?.message || "Không thể kết nối server.",
        );
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-gray-500 dark:text-gray-400" />
        <span className="ml-2 text-gray-600 dark:text-gray-400">
          Đang tải dữ liệu khách hàng...
        </span>
      </div>
    );
  }

  if (!initialUser) return null;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
          Chỉnh sửa khách hàng
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
              Mật khẩu mới (tuỳ chọn)
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => {
                setNewPassword(e.target.value);
                setErrors((prev) => ({ ...prev, password: undefined }));
              }}
              placeholder="Nhập mật khẩu mới..."
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
              Xác nhận mật khẩu mới
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                setErrors((prev) => ({ ...prev, confirmPassword: undefined }));
              }}
              placeholder="Nhập lại mật khẩu mới..."
              className={`w-full border ${
                errors.confirmPassword
                  ? "border-red-500 dark:border-red-500"
                  : "border-gray-300 dark:border-gray-600"
              } rounded-md p-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors`}
            />
            {errors.confirmPassword && (
              <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                {errors.confirmPassword}
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
              Tài khoản khách hàng không có vai trò nội bộ và không gán chi
              nhánh.
            </p>
          </div>

          <UserAvatarField
            previewImage={previewImage}
            imageMethod={imageMethod}
            imageUrl={imageUrl}
            error={errors.avatar}
            uploadLabel="Upload ảnh mới"
            urlLabel="Nhập URL"
            keepLabel="Giữ ảnh hiện tại"
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
              setImageUrl(initialUser.avatar || "");
              setPreviewImage(initialUser.avatar || "");
              setForm((prev) => ({
                ...prev,
                avatar: initialUser.avatar || "",
              }));
              setImageMethod("keep");
            }}
          />

          <UserStatusField
            value={form.status}
            onChange={(value) => handleFieldChange("status", value)}
            disabled={isSelf}
            disabledHint={
              isSelf
                ? "Bạn không thể thay đổi trạng thái tài khoản đang đăng nhập."
                : undefined
            }
          />

          <div className="flex justify-end pt-4">
            <button
              type="submit"
              disabled={saving || !isDirty}
              className="flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-400 dark:disabled:bg-gray-600"
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

export default CustomerEditPage;
