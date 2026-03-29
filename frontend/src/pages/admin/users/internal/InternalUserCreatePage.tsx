import React, { useEffect, useMemo, useState, type FormEvent } from "react";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

import Card from "../../../../components/admin/layouts/Card";
import { useAdminToast } from "../../../../context/AdminToastContext";
import { useAuth } from "../../../../context/AuthContextAdmin";

import UserAvatarField from "../shared/UserAvatarField";
import UserBranchAssignment from "../shared/UserBranchAssignment";
import UserStatusField from "../shared/UserStatusField";
import {
  createUser,
  fetchBranches,
  fetchRoles,
  uploadUserAvatar,
} from "../shared/userApi";
import {
  buildUserPayload,
  isStaffRole,
  type BranchOption,
  type RoleOption,
  type UserFormErrors,
  type UserFormValues,
} from "../shared/userMappers";

const InternalUserCreatePage: React.FC = () => {
  const navigate = useNavigate();
  const { showSuccessToast, showErrorToast } = useAdminToast();
  const { user: currentUser, branches: actorBranches } = useAuth();

  const isSuperAdmin = Number(currentUser?.role_id) === 1;

  const [form, setForm] = useState<UserFormValues>({
    fullName: "",
    email: "",
    phone: "",
    avatar: "",
    status: "active",
    roleId: "",
  });

  const [password, setPassword] = useState("");
  const [roles, setRoles] = useState<RoleOption[]>([]);
  const [branches, setBranches] = useState<BranchOption[]>([]);
  const [selectedBranchIds, setSelectedBranchIds] = useState<number[]>([]);
  const [primaryBranchId, setPrimaryBranchId] = useState<number | "">("");

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewImage, setPreviewImage] = useState("");
  const [imageMethod, setImageMethod] = useState<"upload" | "url" | "keep">(
    "upload",
  );
  const [imageUrl, setImageUrl] = useState("");

  const [errors, setErrors] = useState<UserFormErrors>({});
  const [loading, setLoading] = useState(false);

  const isStaffUser = isStaffRole(form.roleId);

  useEffect(() => {
    (async () => {
      try {
        const roleData = await fetchRoles();
        setRoles(roleData);
      } catch (err) {
        console.error("fetch roles error:", err);
      }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        if (isSuperAdmin) {
          const branchData = await fetchBranches();
          setBranches(branchData);
        } else {
          setBranches(
            (actorBranches || []).map((b) => ({
              id: b.id,
              name: b.name || "",
              code: b.code || "",
              status: b.status || "active",
            })),
          );
        }
      } catch (err) {
        console.error("fetch branches error:", err);
      }
    })();
  }, [isSuperAdmin, actorBranches]);

  const selectedBranches = useMemo(
    () => branches.filter((b) => selectedBranchIds.includes(b.id)),
    [branches, selectedBranchIds],
  );

  const handleFieldChange = <
    K extends keyof Pick<
      UserFormValues,
      "fullName" | "email" | "phone" | "status" | "roleId"
    >,
  >(
    key: K,
    value: UserFormValues[K],
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));

    if (key === "roleId" && !isStaffRole(value as number | "")) {
      setSelectedBranchIds([]);
      setPrimaryBranchId("");
      setErrors((prev) => ({
        ...prev,
        roleId: undefined,
        branches: undefined,
        primaryBranchId: undefined,
      }));
    } else {
      setErrors((prev) => ({
        ...prev,
        [key]: undefined,
      }));
    }
  };

  const handleToggleBranch = (branchId: number) => {
    setSelectedBranchIds((prev) => {
      const exists = prev.includes(branchId);
      const next = exists
        ? prev.filter((id) => id !== branchId)
        : [...prev, branchId];

      if (!next.length) {
        setPrimaryBranchId("");
      } else if (!next.includes(Number(primaryBranchId))) {
        setPrimaryBranchId(next[0]);
      }

      return next;
    });

    setErrors((prev) => ({
      ...prev,
      branches: undefined,
      primaryBranchId: undefined,
    }));
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

    if (form.roleId === "") {
      nextErrors.roleId = "Vui lòng chọn vai trò.";
    }

    if (isStaffUser) {
      if (!selectedBranchIds.length) {
        nextErrors.branches = "Vui lòng chọn ít nhất 1 chi nhánh.";
      }

      if (
        selectedBranchIds.length > 0 &&
        (!primaryBranchId ||
          !selectedBranchIds.includes(Number(primaryBranchId)))
      ) {
        nextErrors.primaryBranchId = "Vui lòng chọn chi nhánh chính hợp lệ.";
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
        userType: "internal",
        avatarUrl,
        branchIds: selectedBranchIds,
        primaryBranchId,
        password: password.trim(),
      });

      const res = await createUser(payload);

      if (res.success) {
        showSuccessToast({ message: "Tạo nhân sự nội bộ thành công!" });
        navigate("/admin/users/internal");
      } else if (res.errors) {
        setErrors(res.errors as UserFormErrors);
      } else {
        showErrorToast((res as any).message || "Tạo nhân sự thất bại.");
      }
    } catch (err: any) {
      console.error("create internal user error:", err);
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
          Thêm nhân sự nội bộ
        </h1>

        <button
          onClick={() => navigate("/admin/users/internal")}
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

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Vai trò <span className="text-red-500">*</span>
            </label>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
              Chọn vai trò để tạo tài khoản staff/admin nội bộ.
            </p>
            <select
              value={form.roleId}
              onChange={(e) =>
                handleFieldChange(
                  "roleId",
                  e.target.value === "" ? "" : Number(e.target.value),
                )
              }
              className={`w-full border ${
                errors.roleId
                  ? "border-red-500 dark:border-red-500"
                  : "border-gray-300 dark:border-gray-600"
              } rounded-md p-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors`}
            >
              <option value="">-- Chọn vai trò --</option>
              {roles.map((role) => (
                <option key={role.id} value={role.id}>
                  {role.title}
                </option>
              ))}
            </select>
            {errors.roleId && (
              <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                {errors.roleId}
              </p>
            )}
          </div>

          <UserBranchAssignment
            branches={branches}
            selectedBranchIds={selectedBranchIds}
            primaryBranchId={primaryBranchId}
            errors={{
              branches: errors.branches,
              primaryBranchId: errors.primaryBranchId,
            }}
            title="Gán chi nhánh"
            required
            emptyMessage="Bạn chưa có chi nhánh nào trong phạm vi quản lý để gán cho nhân sự này."
            onToggleBranch={handleToggleBranch}
            onPrimaryBranchChange={setPrimaryBranchId}
          />

          {isStaffUser && selectedBranches.length > 0 ? null : null}

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
              onClick={() => navigate("/admin/users/internal")}
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
                "Lưu nhân sự"
              )}
            </button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default InternalUserCreatePage;
