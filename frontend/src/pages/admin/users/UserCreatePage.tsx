import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  Loader2,
  User,
  Shield,
  Save,
  CheckCircle2,
  AlertCircle,
  Phone,
  Mail,
  Lock,
  GitBranch,
  Layers,
} from "lucide-react";

import Card from "../../../components/admin/layouts/Card";
import { useAdminToast } from "../../../context/AdminToastContext";
import {
  createUser,
  fetchAssignableRoles,
  fetchBranches,
  uploadUserAvatar,
} from "./shared/userApi";
import {
  buildUserPayload,
  type BranchOption,
  type RoleOption,
  type UserFormErrors,
  type UserFormValues,
  type UserType,
} from "./shared/userMappers";

import UserAvatarField from "./shared/UserAvatarField";
import UserStatusField from "./shared/UserStatusField";
import UserBranchAssignment from "./shared/UserBranchAssignment";

// ==========================================
// INTERFACES & INITIAL STATE
// ==========================================

const initialForm: UserFormValues = {
  fullName: "",
  email: "",
  phone: "",
  avatar: "",
  status: "active",
  roleId: "",
};

// ==========================================
// MAIN COMPONENT: UNIFIED USER CREATE
// ==========================================
const UserCreatePage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { showSuccessToast, showErrorToast } = useAdminToast();

  // --- Core States ---
  const [userType, setUserType] = useState<UserType>(
    (searchParams.get("type") as UserType) === "internal"
      ? "internal"
      : "customer",
  );
  const [formData, setFormData] = useState<UserFormValues>(initialForm);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // --- Avatar States ---
  const [imageMethod, setImageMethod] = useState<"upload" | "url" | "keep">(
    "upload",
  );
  const [avatarUrl, setAvatarUrl] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewImage, setPreviewImage] = useState("");

  // --- Internal Access States ---
  const [roles, setRoles] = useState<RoleOption[]>([]);
  const [branches, setBranches] = useState<BranchOption[]>([]);
  const [selectedBranchIds, setSelectedBranchIds] = useState<number[]>([]);
  const [primaryBranchId, setPrimaryBranchId] = useState<number | "">("");
  const [rolesLoading, setRolesLoading] = useState(false);

  // --- UX States ---
  const [loadingLookups, setLoadingLookups] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<UserFormErrors>({});

  // --- Sync URL Param ---
  useEffect(() => {
    const params = new URLSearchParams(searchParams);
    if (params.get("type") !== userType) {
      params.set("type", userType);
      setSearchParams(params);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userType]);

  // --- Fetch Lookups (Internal Only) ---
  useEffect(() => {
    if (userType !== "internal") return;

    let isMounted = true;
    const loadLookups = async () => {
      try {
        setLoadingLookups(true);
        setRolesLoading(true);

        const [rolesData, branchesData] = await Promise.all([
          fetchAssignableRoles(),
          fetchBranches(),
        ]);

        if (isMounted) {
          setRoles(rolesData);
          setBranches(branchesData);

          setFormData((prev) => {
            const currentRoleStillValid =
              prev.roleId !== "" &&
              rolesData.some((role) => role.id === Number(prev.roleId));

            return currentRoleStillValid
              ? prev
              : {
                  ...prev,
                  roleId: "",
                };
          });
        }
      } catch (err: any) {
        if (isMounted) {
          showErrorToast(
            "Không thể tải danh sách Vai trò được phép gán / Chi nhánh.",
          );
        }
      } finally {
        if (isMounted) {
          setLoadingLookups(false);
          setRolesLoading(false);
        }
      }
    };

    loadLookups();

    return () => {
      isMounted = false;
    };
  }, [userType, showErrorToast]);

  // --- Handlers ---
  const handleTypeSelect = (type: UserType) => {
    if (type === userType) return;

    setUserType(type);
    setErrors({});

    if (type === "customer") {
      setFormData((prev) => ({ ...prev, roleId: "" }));
      setSelectedBranchIds([]);
      setPrimaryBranchId("");
    } else {
      setFormData((prev) => ({ ...prev, roleId: "" }));
      setSelectedBranchIds([]);
      setPrimaryBranchId("");
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    const field = name as keyof UserFormValues;

    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: "",
      }));
    }
  };

  const handleToggleBranch = (branchId: number) => {
    setSelectedBranchIds((prev) => {
      const next = prev.includes(branchId)
        ? prev.filter((id) => id !== branchId)
        : [...prev, branchId];

      if (next.length === 0) {
        setPrimaryBranchId("");
      } else if (
        primaryBranchId === "" ||
        !next.includes(Number(primaryBranchId))
      ) {
        setPrimaryBranchId(next[0]);
      }

      return next;
    });

    setErrors((prev) => ({
      ...prev,
      branches: "",
      primaryBranchId: "",
    }));
  };

  // --- Validation ---
  const validateForm = () => {
    const nextErrors: UserFormErrors = {};

    if (!formData.fullName.trim())
      nextErrors.fullName = "Yêu cầu nhập họ và tên.";
    if (!formData.email.trim()) {
      nextErrors.email = "Yêu cầu nhập email.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      nextErrors.email = "Email không hợp lệ.";
    }
    if (!formData.phone.trim()) {
      nextErrors.phone = "Yêu cầu nhập số điện thoại.";
    } else if (!/^(\+84|0)\d{9,10}$/.test(formData.phone.trim())) {
      nextErrors.phone = "Số điện thoại không hợp lệ.";
    }

    if (!password) {
      nextErrors.password = "Yêu cầu nhập mật khẩu.";
    } else if (password.length < 6) {
      nextErrors.password = "Mật khẩu tối thiểu 6 ký tự.";
    }

    if (!confirmPassword) {
      nextErrors.confirmPassword = "Yêu cầu xác nhận mật khẩu.";
    } else if (password !== confirmPassword) {
      nextErrors.confirmPassword = "Xác nhận mật khẩu không khớp.";
    }

    if (imageMethod === "url") {
      if (!avatarUrl.trim()) {
        nextErrors.avatarUrl = "Yêu cầu nhập URL ảnh.";
      } else {
        try {
          new URL(avatarUrl.trim());
        } catch {
          nextErrors.avatarUrl = "URL ảnh không hợp lệ.";
        }
      }
    } else if (imageMethod === "upload" && !selectedFile && !previewImage) {
      // It's acceptable to not have an avatar, but if they chose 'upload' and didn't select one, we don't strictly block unless we want to. Let's just pass.
    }

    if (userType === "internal") {
      if (!formData.roleId) nextErrors.roleId = "Yêu cầu chọn vai trò.";
      if (selectedBranchIds.length === 0) {
        nextErrors.branches = "Yêu cầu chọn ít nhất 1 chi nhánh.";
      }
      if (
        selectedBranchIds.length > 0 &&
        (primaryBranchId === "" ||
          !selectedBranchIds.includes(Number(primaryBranchId)))
      ) {
        nextErrors.primaryBranchId = "Chi nhánh chính không hợp lệ.";
      }
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (e?: React.SyntheticEvent) => {
    e?.preventDefault();
    if (!validateForm()) {
      showErrorToast("Vui lòng kiểm tra lại thông tin nhập.");
      return;
    }

    if (userType === "internal" && formData.roleId) {
      const selectedRole = roles.find(
        (role) => role.id === Number(formData.roleId),
      );
      if (!selectedRole) {
        showErrorToast(
          "Vai trò đã chọn không còn hợp lệ trong phạm vi quyền hiện tại.",
        );
        return;
      }
    }

    try {
      setSaving(true);
      let finalAvatarUrl: string | null = null;

      // Handle Avatar Upload
      if (imageMethod === "upload" && selectedFile) {
        finalAvatarUrl = await uploadUserAvatar(selectedFile);
      } else if (imageMethod === "url" && avatarUrl.trim()) {
        finalAvatarUrl = avatarUrl.trim();
      }

      // Build Payload
      const payload = buildUserPayload({
        values: {
          ...formData,
          avatar: finalAvatarUrl ?? "",
        },
        userType,
        avatarUrl: finalAvatarUrl,
        branchIds: selectedBranchIds,
        primaryBranchId,
        password,
      });

      const res = await createUser(payload);

      showSuccessToast({ message: "Khởi tạo tài khoản thành công!" });

      // Navigate to Workspace if ID exists, else fallback to List
      if (res?.data?.id) {
        navigate(`/admin/users/edit/${res.data.id}?type=${userType}`);
      } else {
        navigate(`/admin/users?type=${userType}`);
      }
    } catch (err: any) {
      showErrorToast(err?.message || "Lỗi tạo tài khoản.");
    } finally {
      setSaving(false);
    }
  };

  // --- Readiness Derivation for Summary Panel ---
  const readiness = useMemo(() => {
    const profileReady = Boolean(
      formData.fullName.trim() &&
      formData.email.trim() &&
      formData.phone.trim(),
    );
    const accountReady = Boolean(
      password.length >= 6 && password === confirmPassword,
    );
    const avatarReady = Boolean(
      previewImage || (imageMethod === "url" && avatarUrl.trim()),
    );

    let accessReady = true;
    if (userType === "internal") {
      accessReady = Boolean(
        formData.roleId &&
        selectedBranchIds.length > 0 &&
        primaryBranchId !== "",
      );
    }

    const allMandatory = profileReady && accountReady && accessReady;

    return {
      profileReady,
      accountReady,
      avatarReady,
      accessReady,
      allMandatory,
    };
  }, [
    formData,
    password,
    confirmPassword,
    previewImage,
    imageMethod,
    avatarUrl,
    userType,
    selectedBranchIds,
    primaryBranchId,
  ]);

  return (
    <form onSubmit={handleSubmit} className="max-w-[1200px] mx-auto pb-20">
      {/* A. Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <button
            type="button"
            onClick={() => navigate(`/admin/users?type=${userType}`)}
            className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-blue-600 transition-colors mb-2"
          >
            <ArrowLeft className="w-4 h-4" /> Về User Administration
          </button>
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
            User Setup
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1 max-w-2xl">
            Khởi tạo tài khoản người dùng mới và cấu hình capability phù hợp
            theo từng loại user.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-8">
        {/* B. Main Form Area (8 columns) */}
        <div className="col-span-12 lg:col-span-8 space-y-8">
          {/* Section 1: User Type Selection */}
          <section>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-600 text-xs">
                1
              </span>
              Chọn loại người dùng
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => handleTypeSelect("customer")}
                className={`flex flex-col items-start p-5 rounded-2xl border-2 transition-all text-left gap-3 ${
                  userType === "customer"
                    ? "border-blue-600 bg-blue-50 dark:bg-blue-900/20 ring-4 ring-blue-50 dark:ring-blue-900/10"
                    : "border-gray-200 dark:border-gray-700 hover:border-gray-300 bg-white dark:bg-gray-800"
                }`}
              >
                <div
                  className={`p-3 rounded-xl ${userType === "customer" ? "bg-blue-600 text-white" : "bg-gray-100 dark:bg-gray-700 text-gray-500"}`}
                >
                  <User className="w-6 h-6" />
                </div>
                <div>
                  <h3
                    className={`font-bold text-base ${userType === "customer" ? "text-blue-700 dark:text-blue-400" : "text-gray-900 dark:text-white"}`}
                  >
                    Khách hàng (Customer)
                  </h3>
                  <p className="text-[12px] text-gray-500 mt-1.5 leading-relaxed">
                    Tài khoản khách hàng tiêu chuẩn. Không có Role quản trị và
                    không bị giới hạn bởi Branch Scope.
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleTypeSelect("internal")}
                className={`flex flex-col items-start p-5 rounded-2xl border-2 transition-all text-left gap-3 ${
                  userType === "internal"
                    ? "border-purple-600 bg-purple-50 dark:bg-purple-900/20 ring-4 ring-purple-50 dark:ring-purple-900/10"
                    : "border-gray-200 dark:border-gray-700 hover:border-gray-300 bg-white dark:bg-gray-800"
                }`}
              >
                <div
                  className={`p-3 rounded-xl ${userType === "internal" ? "bg-purple-600 text-white" : "bg-gray-100 dark:bg-gray-700 text-gray-500"}`}
                >
                  <Shield className="w-6 h-6" />
                </div>
                <div>
                  <h3
                    className={`font-bold text-base ${userType === "internal" ? "text-purple-700 dark:text-purple-400" : "text-gray-900 dark:text-white"}`}
                  >
                    Nhân sự nội bộ (Internal)
                  </h3>
                  <p className="text-[12px] text-gray-500 mt-1.5 leading-relaxed">
                    Tài khoản nhân viên/admin. Yêu cầu thiết lập Vai trò (Role)
                    và Gán chi nhánh (Branch Scope).
                  </p>
                </div>
              </button>
            </div>
          </section>

          {/* Section 2: Basic Profile */}
          <section className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="p-6 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-600 text-xs">
                  2
                </span>
                Thông tin cơ bản
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Thiết lập danh tính và thông tin liên hệ cốt lõi.
              </p>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2 space-y-1.5">
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Họ và tên *
                </label>
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  placeholder="Nguyễn Văn A"
                  className={`w-full border rounded-xl p-3 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-blue-500 ${errors.fullName ? "border-red-500" : "border-gray-200 dark:border-gray-700"}`}
                />
                {errors.fullName && (
                  <span className="text-xs text-red-500">
                    {errors.fullName}
                  </span>
                )}
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                  <Mail className="w-4 h-4 text-gray-400" /> Email đăng nhập *
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="email@example.com"
                  className={`w-full border rounded-xl p-3 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-blue-500 ${errors.email ? "border-red-500" : "border-gray-200 dark:border-gray-700"}`}
                />
                {errors.email && (
                  <span className="text-xs text-red-500">{errors.email}</span>
                )}
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                  <Phone className="w-4 h-4 text-gray-400" /> Số điện thoại *
                </label>
                <input
                  type="text"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="0901234567"
                  className={`w-full border rounded-xl p-3 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-blue-500 ${errors.phone ? "border-red-500" : "border-gray-200 dark:border-gray-700"}`}
                />
                {errors.phone && (
                  <span className="text-xs text-red-500">{errors.phone}</span>
                )}
              </div>
            </div>
          </section>

          {/* Section 3: Account Setup */}
          <section className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="p-6 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-600 text-xs">
                  3
                </span>
                Thiết lập tài khoản
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Thông tin bảo mật và trạng thái ban đầu của tài khoản.
              </p>
            </div>
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                    <Lock className="w-4 h-4 text-gray-400" /> Mật khẩu *
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setErrors((p) => ({
                        ...p,
                        password: "",
                        confirmPassword: "",
                      }));
                    }}
                    placeholder="Tối thiểu 6 ký tự"
                    className={`w-full border rounded-xl p-3 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-blue-500 ${errors.password ? "border-red-500" : "border-gray-200 dark:border-gray-700"}`}
                  />
                  {errors.password && (
                    <span className="text-xs text-red-500">
                      {errors.password}
                    </span>
                  )}
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Xác nhận mật khẩu *
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      setErrors((p) => ({ ...p, confirmPassword: "" }));
                    }}
                    placeholder="Nhập lại mật khẩu"
                    className={`w-full border rounded-xl p-3 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-blue-500 ${errors.confirmPassword ? "border-red-500" : "border-gray-200 dark:border-gray-700"}`}
                  />
                  {errors.confirmPassword && (
                    <span className="text-xs text-red-500">
                      {errors.confirmPassword}
                    </span>
                  )}
                </div>
              </div>
              <div className="pt-4 border-t border-gray-100 dark:border-gray-700">
                <UserStatusField
                  value={formData.status}
                  onChange={(val) =>
                    setFormData((p) => ({ ...p, status: val }))
                  }
                />
              </div>
            </div>
          </section>

          {/* Section 4: Avatar */}
          <section className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="p-6 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-600 text-xs">
                  4
                </span>
                Ảnh đại diện (Tùy chọn)
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Tải ảnh mới lên hoặc cung cấp URL hợp lệ.
              </p>
            </div>
            <div className="p-6">
              <UserAvatarField
                previewImage={previewImage}
                imageMethod={imageMethod}
                imageUrl={avatarUrl}
                error={errors.avatarUrl}
                uploadLabel="Tải ảnh lên"
                urlLabel="Dùng URL ảnh"
                keepLabel="Không dùng ảnh"
                allowKeep={true}
                onImageMethodChange={(val) => {
                  setImageMethod(val);
                  setErrors((p) => ({ ...p, avatarUrl: "" }));

                  if (val === "keep") {
                    setSelectedFile(null);
                    setPreviewImage("");
                    setAvatarUrl("");
                  }

                  if (val === "url") {
                    setSelectedFile(null);
                    setPreviewImage(avatarUrl.trim() || "");
                  }

                  if (val === "upload") {
                    setAvatarUrl("");
                    setPreviewImage("");
                    setSelectedFile(null);
                  }
                }}
                onImageUrlChange={(val) => {
                  setAvatarUrl(val);
                  setPreviewImage(val);
                  setErrors((p) => ({ ...p, avatarUrl: "" }));
                }}
                onFileSelect={(file) => {
                  const allowedTypes = [
                    "image/jpeg",
                    "image/png",
                    "image/webp",
                    "image/gif",
                  ];
                  const maxSize = 5 * 1024 * 1024;

                  if (!allowedTypes.includes(file.type)) {
                    setErrors((p) => ({
                      ...p,
                      avatarUrl: "Chỉ hỗ trợ JPG, PNG, WEBP hoặc GIF.",
                    }));
                    return;
                  }

                  if (file.size > maxSize) {
                    setErrors((p) => ({
                      ...p,
                      avatarUrl: "Ảnh đại diện không được vượt quá 5MB.",
                    }));
                    return;
                  }

                  setErrors((p) => ({ ...p, avatarUrl: "" }));
                  setSelectedFile(file);
                  setPreviewImage(URL.createObjectURL(file));
                }}
                onClear={() => {
                  setSelectedFile(null);
                  setPreviewImage("");
                  setAvatarUrl("");
                  setImageMethod("keep");
                  setErrors((p) => ({ ...p, avatarUrl: "" }));
                }}
              />
            </div>
          </section>

          {/* Section 5: Access & Scope (Internal Only) */}
          {userType === "internal" && (
            <section className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-purple-200 dark:border-purple-800 overflow-hidden ring-1 ring-purple-100 dark:ring-purple-900/30">
              <div className="p-6 border-b border-purple-100 dark:border-purple-800/50 bg-purple-50/50 dark:bg-purple-900/10">
                <h2 className="text-lg font-bold text-purple-900 dark:text-purple-300 flex items-center gap-2">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-purple-200 text-purple-700 text-xs">
                    5
                  </span>
                  Vai trò và Phạm vi truy cập (Scope)
                </h2>
                <p className="text-sm text-purple-700 dark:text-purple-400 mt-1">
                  Thiết lập quyền quản trị và phân bổ chi nhánh làm việc cho
                  nhân sự.
                </p>
              </div>
              <div className="p-6 space-y-8">
                {loadingLookups ? (
                  <div className="flex flex-col items-center justify-center py-10">
                    <Loader2 className="w-6 h-6 animate-spin text-purple-500 mb-2" />
                    <span className="text-sm text-gray-500">
                      Đang tải Roles và Branches...
                    </span>
                  </div>
                ) : (
                  <>
                    <div className="space-y-1.5 max-w-md">
                      <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                        Vai trò nội bộ (Role) *
                      </label>
                      <select
                        name="roleId"
                        value={formData.roleId}
                        onChange={handleInputChange}
                        disabled={rolesLoading || roles.length === 0}
                        className={`w-full border rounded-xl p-3 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-purple-500 disabled:opacity-60 disabled:cursor-not-allowed ${errors.roleId ? "border-red-500" : "border-gray-200 dark:border-gray-700"}`}
                      >
                        <option value="">
                          {rolesLoading
                            ? "-- Đang tải vai trò --"
                            : roles.length === 0
                              ? "-- Không có vai trò nào được phép gán --"
                              : "-- Chọn vai trò (Role) --"}
                        </option>
                        {roles.map((r) => (
                          <option key={r.id} value={r.id}>
                            {r.title}
                          </option>
                        ))}
                      </select>
                      {errors.roleId && (
                        <span className="text-xs text-red-500">
                          {errors.roleId}
                        </span>
                      )}
                      {!errors.roleId &&
                        roles.length === 0 &&
                        !rolesLoading && (
                          <span className="text-xs text-amber-600">
                            Tài khoản hiện tại không có role nội bộ nào được
                            phép gán.
                          </span>
                        )}
                    </div>

                    <div className="border-t border-purple-100 dark:border-purple-800/50 pt-6">
                      <UserBranchAssignment
                        title="Gán Chi nhánh (Branch Scope)"
                        branches={branches}
                        selectedBranchIds={selectedBranchIds}
                        primaryBranchId={primaryBranchId}
                        errors={{
                          branches: errors.branches,
                          primaryBranchId: errors.primaryBranchId,
                        }}
                        onToggleBranch={handleToggleBranch}
                        onPrimaryBranchChange={setPrimaryBranchId}
                      />
                      <p className="text-[11px] text-gray-500 mt-3 flex items-start gap-1.5 bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                        Branch scope quyết định phạm vi vận hành và hiển thị dữ
                        liệu mặc định của nhân sự trong các luồng quản lý đơn
                        hàng, tồn kho liên quan đến chi nhánh.
                      </p>
                    </div>
                  </>
                )}
              </div>
            </section>
          )}
        </div>

        {/* C. Setup Summary Panel (4 columns - Sticky) */}
        <div className="col-span-12 lg:col-span-4">
          <div className="sticky top-6 space-y-6">
            <Card className="!p-0 border-none shadow-lg overflow-hidden border border-gray-200 dark:border-gray-700">
              <div className="bg-gray-900 p-5 text-white flex justify-between items-center">
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <Layers className="w-5 h-5 text-blue-400" /> Tóm tắt thiết lập
                </h3>
              </div>

              <div className="p-6 space-y-6">
                {/* User Type Insight */}
                <div className="flex items-center gap-3 bg-gray-50 dark:bg-gray-900 p-3 rounded-xl border border-gray-100 dark:border-gray-800">
                  <div className="p-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700">
                    {userType === "customer" ? (
                      <User className="w-5 h-5 text-blue-600" />
                    ) : (
                      <Shield className="w-5 h-5 text-purple-600" />
                    )}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase mb-0.5">
                      Mô hình User
                    </p>
                    <p
                      className={`text-sm font-bold capitalize ${userType === "customer" ? "text-blue-700 dark:text-blue-400" : "text-purple-700 dark:text-purple-400"}`}
                    >
                      {userType === "customer"
                        ? "Khách hàng"
                        : "Nhân sự nội bộ"}
                    </p>
                  </div>
                </div>

                {/* Readiness Checklist */}
                <div className="space-y-4">
                  {[
                    {
                      label: "Thông tin cơ bản",
                      status: readiness.profileReady,
                    },
                    {
                      label: "Bảo mật tài khoản",
                      status: readiness.accountReady,
                    },
                    {
                      label: "Ảnh đại diện",
                      status: readiness.avatarReady,
                      soft: true,
                    },
                  ].map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between"
                    >
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        {item.label}
                      </span>
                      {item.status ? (
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                      ) : (
                        <AlertCircle
                          className={`w-4 h-4 ${item.soft ? "text-gray-300" : "text-amber-500"}`}
                        />
                      )}
                    </div>
                  ))}

                  {userType === "internal" && (
                    <>
                      <div className="h-px bg-gray-100 dark:bg-gray-800 my-2" />
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-400 flex items-center gap-1.5">
                          <GitBranch className="w-4 h-4" /> Access Scope
                        </span>
                        {readiness.accessReady ? (
                          <CheckCircle2 className="w-4 h-4 text-green-500" />
                        ) : (
                          <AlertCircle className="w-4 h-4 text-amber-500" />
                        )}
                      </div>
                    </>
                  )}
                </div>

                {/* Next Steps Guidance */}
                <div
                  className={`${userType === "customer" ? "bg-blue-50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-800" : "bg-purple-50 dark:bg-purple-900/20 border-purple-100 dark:border-purple-800"} p-4 rounded-xl border`}
                >
                  <h5
                    className={`text-xs font-bold mb-1 uppercase ${userType === "customer" ? "text-blue-700 dark:text-blue-400" : "text-purple-700 dark:text-purple-400"}`}
                  >
                    Hành động tiếp theo:
                  </h5>
                  <p
                    className={`text-[11px] leading-relaxed ${userType === "customer" ? "text-blue-800 dark:text-blue-300" : "text-purple-800 dark:text-purple-300"}`}
                  >
                    Sau khi tạo, có thể tiếp tục truy cập{" "}
                    <strong>User Workspace</strong> để{" "}
                    {userType === "customer"
                      ? "kiểm tra hồ sơ và địa chỉ giao hàng"
                      : "kiểm tra lại Access Scope và trạng thái bảo mật"}
                    .
                  </p>
                </div>

                {/* Footer Submit Action */}
                <div className="pt-4 border-t border-gray-100 dark:border-gray-800">
                  <button
                    type="submit"
                    disabled={saving || !readiness.allMandatory}
                    className={`w-full py-3.5 rounded-xl font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 
                      ${
                        saving || !readiness.allMandatory
                          ? "bg-gray-200 text-gray-400 cursor-not-allowed shadow-none dark:bg-gray-700 dark:text-gray-500"
                          : "bg-blue-600 text-white hover:bg-blue-700 active:scale-[0.98]"
                      }`}
                  >
                    {saving ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    Hoàn tất tạo User
                  </button>
                  {!readiness.allMandatory && (
                    <p className="text-center text-[10px] text-red-500 mt-2">
                      Vui lòng hoàn thiện các mục bắt buộc (*)
                    </p>
                  )}
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </form>
  );
};

export default UserCreatePage;
