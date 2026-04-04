import React, { useEffect, useMemo, useState, type FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Loader2,
  Save,
  Shield,
  Phone,
  Mail,
  AlertCircle,
  AlertTriangle,
  GitBranch,
  Layers,
  Lock,
} from "lucide-react";

import Card from "../../../components/admin/layouts/Card";
import { useAuth } from "../../../context/AuthContextAdmin";
import { useAdminToast } from "../../../context/AdminToastContext";

import {
  fetchUserEditDetail,
  updateUser,
  fetchRoles,
  fetchBranches,
  uploadUserAvatar,
} from "./shared/userApi";
import {
  buildUserPayload,
  getUserBranchScopeHealth,
  getUserWorkspaceWarnings,
  mapUserFormFromApi,
  type UserFormValues,
  type RoleOption,
  type BranchOption,
  type UserType,
  type UserBranchSummary,
  type UserListItem,
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
// MAIN COMPONENT: UNIFIED USER WORKSPACE
// ==========================================
const UserEditPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const { showSuccessToast, showErrorToast } = useAdminToast();

  // --- Core States ---
  const [initialUser, setInitialUser] = useState<UserListItem | null>(null);
  const [userType, setUserType] = useState<UserType>("customer");

  const [formData, setFormData] = useState<UserFormValues>(initialForm);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // --- Avatar States ---
  const [imageMethod, setImageMethod] = useState<"upload" | "url" | "keep">(
    "keep",
  );
  const [avatarUrl, setAvatarUrl] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewImage, setPreviewImage] = useState("");

  // --- Internal Access States ---
  const [roles, setRoles] = useState<RoleOption[]>([]);
  const [branches, setBranches] = useState<BranchOption[]>([]);
  const [selectedBranchIds, setSelectedBranchIds] = useState<number[]>([]);
  const [primaryBranchId, setPrimaryBranchId] = useState<number | "">("");

  // --- UX States ---
  const [loading, setLoading] = useState(true);
  const [loadingLookups, setLoadingLookups] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isSelf = currentUser?.id === Number(id);

  // --- Fetch Workspace Data ---
  const fetchWorkspaceData = async () => {
    try {
      setLoading(true);

      const user = await fetchUserEditDetail(String(id));

      setInitialUser(user);
      setUserType(user.userType);

      setFormData({
        ...mapUserFormFromApi({
          id: user.id,
          full_name: user.fullName,
          email: user.email,
          avatar: user.avatar,
          phone: user.phone,
          status: user.status,
          role_id: user.roleId,
          role: user.role,
          created_at: user.createdAt ?? undefined,
          updated_at: user.updatedAt ?? undefined,
          primary_branch_id: user.primaryBranchId,
          branch_ids: user.branchIds,
          branches: user.branches,
        }),
      });

      if (user.userType === "internal") {
        setSelectedBranchIds(user.branchIds || []);
        setPrimaryBranchId(user.primaryBranchId ?? "");
      } else {
        setSelectedBranchIds([]);
        setPrimaryBranchId("");
      }

      setPassword("");
      setConfirmPassword("");
      setImageMethod("keep");
      setSelectedFile(null);
      setPreviewImage("");
      setAvatarUrl("");
      setErrors({});
    } catch (err: any) {
      showErrorToast(err?.message || "Lỗi tải thông tin User Workspace.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchWorkspaceData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // --- Fetch Lookups (Internal Only) ---
  useEffect(() => {
    if (userType !== "internal") return;

    let isMounted = true;
    const loadLookups = async () => {
      try {
        setLoadingLookups(true);
        const [rolesData, branchesData] = await Promise.all([
          fetchRoles(),
          fetchBranches(),
        ]);
        if (isMounted) {
          setRoles(rolesData);
          setBranches(branchesData);
        }
      } catch (err: any) {
        if (isMounted)
          showErrorToast("Không thể tải danh sách Vai trò / Chi nhánh.");
      } finally {
        if (isMounted) setLoadingLookups(false);
      }
    };
    loadLookups();
    return () => {
      isMounted = false;
    };
  }, [userType, showErrorToast]);

  // --- Handlers ---
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleToggleBranch = (branchId: number) => {
    setSelectedBranchIds((prev) => {
      const next = prev.includes(branchId)
        ? prev.filter((bId) => bId !== branchId)
        : [...prev, branchId];
      if (!next.includes(primaryBranchId as number)) setPrimaryBranchId("");
      else if (next.length === 1 && primaryBranchId === "")
        setPrimaryBranchId(next[0]);
      return next;
    });
    if (errors.branches) setErrors((prev) => ({ ...prev, branches: "" }));
  };

  // --- Derived State (IsDirty) ---
  const isDirty = useMemo(() => {
    if (!initialUser) return false;
    if (formData.fullName !== (initialUser.fullName || "")) return true;
    if (formData.email !== (initialUser.email || "")) return true;
    if (formData.phone !== (initialUser.phone || "")) return true;
    if (
      formData.status !==
      (initialUser.status === "inactive" || initialUser.status === "active"
        ? initialUser.status
        : "active")
    )
      return true;

    if (password || confirmPassword) return true;
    if (imageMethod !== "keep") return true;

    if (userType === "internal") {
      if (formData.roleId !== (initialUser.roleId || "")) return true;
      if (primaryBranchId !== (initialUser.primaryBranchId ?? "")) return true;
      const initialBranchIds = initialUser.branchIds || [];
      if (selectedBranchIds.length !== initialBranchIds.length) return true;
      const sortedSelected = [...selectedBranchIds].sort();
      const sortedInitial = [...initialBranchIds].sort();
      if (sortedSelected.some((id, idx) => id !== sortedInitial[idx]))
        return true;
    }
    return false;
  }, [
    formData,
    initialUser,
    password,
    confirmPassword,
    imageMethod,
    userType,
    selectedBranchIds,
    primaryBranchId,
  ]);

  // --- Validation ---
  const validateForm = () => {
    const nextErrors: Record<string, string> = {};

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

    if (password || confirmPassword) {
      if (!password) {
        nextErrors.password = "Yêu cầu nhập mật khẩu mới.";
      } else if (password.length < 6) {
        nextErrors.password = "Mật khẩu tối thiểu 6 ký tự.";
      }

      if (!confirmPassword) {
        nextErrors.confirmPassword = "Yêu cầu xác nhận mật khẩu.";
      } else if (password !== confirmPassword) {
        nextErrors.confirmPassword = "Xác nhận mật khẩu không khớp.";
      }
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
    }

    if (userType === "internal") {
      if (!formData.roleId) nextErrors.roleId = "Yêu cầu chọn vai trò.";
      if (selectedBranchIds.length === 0)
        nextErrors.branches = "Yêu cầu chọn ít nhất 1 chi nhánh.";
      if (selectedBranchIds.length > 0 && primaryBranchId === "") {
        nextErrors.primaryBranchId = "Yêu cầu chọn chi nhánh chính.";
      }
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      showErrorToast("Vui lòng kiểm tra lại thông tin nhập.");
      return;
    }

    try {
      setSaving(true);
      let finalAvatarUrl: string | null | undefined = undefined;

      if (imageMethod === "keep") {
        finalAvatarUrl = undefined;
      } else {
        finalAvatarUrl = null;
      }

      if (imageMethod === "upload" && selectedFile) {
        finalAvatarUrl = await uploadUserAvatar(selectedFile);
      } else if (imageMethod === "url" && avatarUrl.trim()) {
        finalAvatarUrl = avatarUrl.trim();
      }

      const payload = buildUserPayload({
        values: {
          ...formData,
          avatar: finalAvatarUrl ?? formData.avatar ?? "",
          status:
            formData.status === "inactive" || formData.status === "active"
              ? formData.status
              : "active",
        },
        userType,
        avatarUrl: finalAvatarUrl,
        branchIds: selectedBranchIds,
        primaryBranchId,
        password: password || undefined,
      });

      const res = await updateUser(String(id), payload);

      if (res?.success) {
        showSuccessToast({ message: "Lưu thay đổi thành công!" });
        await fetchWorkspaceData();
      } else {
        showErrorToast("Lưu thất bại.");
      }
    } catch (err: any) {
      showErrorToast(err?.message || "Lỗi cập nhật tài khoản.");
    } finally {
      setSaving(false);
    }
  };

  // --- Readiness Derivation for Summary Panel ---
  const readiness = useMemo(() => {
    if (!initialUser) return null;

    const profileReady = Boolean(
      formData.fullName.trim() &&
      formData.email.trim() &&
      formData.phone.trim(),
    );
    const accountReady = Boolean(
      (formData.status === "active" || formData.status === "inactive") &&
      (!password || (password.length >= 6 && password === confirmPassword)),
    );

    // Simulate mapping to use helper functions
    const mockUserForWarning = {
      userType,
      phone: formData.phone,
      status: formData.status,
      branchIds: selectedBranchIds,
      primaryBranchId: primaryBranchId !== "" ? Number(primaryBranchId) : null,
      branches: branches
        .filter((b) => selectedBranchIds.includes(b.id))
        .map((b) => ({
          id: b.id,
          name: b.name,
          code: b.code,
        })) as UserBranchSummary[],
    };

    const warnings = getUserWorkspaceWarnings(mockUserForWarning);
    const scopeHealth =
      userType === "internal"
        ? getUserBranchScopeHealth(mockUserForWarning)
        : "customer";

    let accessReady = true;
    if (userType === "internal") {
      accessReady = Boolean(
        formData.roleId &&
        selectedBranchIds.length > 0 &&
        primaryBranchId !== "",
      );
    }

    const overallLevel =
      warnings.length === 0 && accessReady && profileReady
        ? "Ready"
        : warnings.length > 2
          ? "Needs Attention"
          : "Partial";

    return {
      profileReady,
      accountReady,
      accessReady,
      warnings,
      scopeHealth,
      overallLevel,
    };
  }, [
    initialUser,
    formData,
    password,
    confirmPassword,
    userType,
    selectedBranchIds,
    primaryBranchId,
    branches,
  ]);

  if (loading || !initialUser || !readiness) {
    return (
      <div className="flex flex-col justify-center items-center py-32">
        <Loader2 className="w-10 h-10 animate-spin text-blue-600 mb-4" />
        <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200">
          Đang tải User Workspace...
        </h2>
      </div>
    );
  }

  const primaryBranchObj =
    userType === "internal" && primaryBranchId !== ""
      ? branches.find((b) => b.id === primaryBranchId)
      : null;

  return (
    <div className="max-w-[1400px] mx-auto pb-24">
      {/* A. Workspace Header (Sticky) */}
      <div className="sticky top-0 z-20 bg-gray-50/90 dark:bg-gray-900/90 backdrop-blur-md pt-4 pb-4 border-b border-gray-200 dark:border-gray-800 mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => {
              if (
                isDirty &&
                !window.confirm("Có thay đổi chưa lưu, bạn có chắc muốn thoát?")
              )
                return;
              navigate(`/admin/users?type=${userType}`);
            }}
            className="p-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-100 transition"
            title="Quay về danh sách User"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          </button>
          <div className="flex items-center gap-3">
            <img
              src={
                initialUser.avatar ||
                `https://ui-avatars.com/api/?name=${encodeURIComponent(initialUser.fullName || initialUser.email)}&background=f3f4f6&color=4b5563`
              }
              alt="Avatar"
              className="w-12 h-12 rounded-full object-cover border border-gray-200 dark:border-gray-700 bg-white"
            />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white leading-none">
                  {initialUser.fullName || "Chưa đặt tên"}
                </h1>
                {isDirty && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-700 animate-pulse">
                    Có thay đổi chưa lưu
                  </span>
                )}
              </div>
              <div className="text-sm text-gray-500 font-medium mt-1 flex items-center gap-2">
                {initialUser.email}
                <span className="text-gray-300 dark:text-gray-600">•</span>
                <span
                  className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${userType === "customer" ? "bg-blue-100 text-blue-700" : "bg-purple-100 text-purple-700"}`}
                >
                  {userType === "customer" ? "Customer" : "Internal"}
                </span>
                <span
                  className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${formData.status === "active" ? "bg-green-100 text-green-700" : "bg-gray-200 text-gray-600"}`}
                >
                  {formData.status === "active" ? "Hoạt động" : "Tạm dừng"}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleSave}
            disabled={saving || !isDirty}
            className={`px-6 py-2.5 rounded-lg font-bold flex items-center gap-2 transition-all ${
              saving || !isDirty
                ? "bg-gray-200 text-gray-400 cursor-not-allowed dark:bg-gray-800 dark:text-gray-600"
                : "bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg"
            }`}
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {isDirty ? "Lưu thay đổi" : "Đã lưu"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-8">
        {/* Left Column: Form Sections (8 cols) */}
        <div className="col-span-12 lg:col-span-8 space-y-8">
          {/* Section 1: Basic Profile */}
          <section className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="p-6 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-600 text-xs">
                  1
                </span>
                Thông tin cơ bản
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Cập nhật danh tính và thông tin liên hệ chính của user.
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
                  className={`w-full border rounded-xl p-3 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-blue-500 ${errors.phone ? "border-red-500" : "border-gray-200 dark:border-gray-700"}`}
                />
                {errors.phone && (
                  <span className="text-xs text-red-500">{errors.phone}</span>
                )}
              </div>
            </div>
          </section>

          {/* Section 2: Account Setup & Credentials */}
          <section className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="p-6 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 flex justify-between items-center">
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-600 text-xs">
                    2
                  </span>
                  Tài khoản và trạng thái
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  Điều chỉnh trạng thái hoạt động và cập nhật mật khẩu nếu cần.
                </p>
              </div>
            </div>
            <div className="p-6 space-y-6">
              <UserStatusField
                value={formData.status}
                onChange={(val) => setFormData((p) => ({ ...p, status: val }))}
                disabled={isSelf}
                disabledHint="Bạn không thể tự thay đổi trạng thái của chính mình."
              />
              <div className="pt-6 border-t border-gray-100 dark:border-gray-700">
                <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
                  <Lock className="w-4 h-4 text-gray-400" /> Đổi mật khẩu (Bỏ
                  trống nếu giữ nguyên)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Mật khẩu mới
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
                      Xác nhận mật khẩu
                    </label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        setErrors((p) => ({ ...p, confirmPassword: "" }));
                      }}
                      placeholder="Nhập lại mật khẩu mới"
                      className={`w-full border rounded-xl p-3 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-blue-500 ${errors.confirmPassword ? "border-red-500" : "border-gray-200 dark:border-gray-700"}`}
                    />
                    {errors.confirmPassword && (
                      <span className="text-xs text-red-500">
                        {errors.confirmPassword}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Section 3: Avatar */}
          <section className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="p-6 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-600 text-xs">
                  3
                </span>
                Ảnh đại diện
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Tải ảnh mới lên, dùng URL, hoặc giữ nguyên ảnh hiện tại.
              </p>
            </div>
            <div className="p-6 flex flex-col md:flex-row gap-8">
              <div className="shrink-0 flex flex-col items-center gap-3">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Ảnh hiện tại
                </span>
                <img
                  src={
                    initialUser.avatar ||
                    `https://ui-avatars.com/api/?name=${encodeURIComponent(initialUser.fullName || initialUser.email)}&background=f3f4f6&color=4b5563`
                  }
                  alt="Current Avatar"
                  className="w-28 h-28 rounded-2xl object-cover border border-gray-200 dark:border-gray-700 bg-white shadow-sm"
                />
              </div>
              <div className="flex-1">
                <UserAvatarField
                  previewImage={previewImage}
                  imageMethod={imageMethod}
                  imageUrl={avatarUrl}
                  error={errors.avatarUrl}
                  uploadLabel="Tải ảnh mới"
                  urlLabel="Đổi bằng URL"
                  keepLabel="Giữ ảnh cũ"
                  allowKeep={true}
                  onImageMethodChange={(val) => {
                    setImageMethod(val);
                    setErrors((p) => ({ ...p, avatarUrl: "" }));
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
                  }}
                />
              </div>
            </div>
          </section>

          {/* Section 4: Access & Scope (Internal Only) */}
          {userType === "internal" && (
            <section className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-purple-200 dark:border-purple-800 overflow-hidden ring-1 ring-purple-100 dark:ring-purple-900/30 mb-10">
              <div className="p-6 border-b border-purple-100 dark:border-purple-800/50 bg-purple-50/50 dark:bg-purple-900/10">
                <h2 className="text-lg font-bold text-purple-900 dark:text-purple-300 flex items-center gap-2">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-purple-200 text-purple-700 text-xs">
                    4
                  </span>
                  Vai trò và Phạm vi truy cập (Scope)
                </h2>
                <p className="text-sm text-purple-700 dark:text-purple-400 mt-1">
                  Thiết lập capability nội bộ và phạm vi chi nhánh được phép vận
                  hành.
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
                        className={`w-full border rounded-xl p-3 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-purple-500 ${errors.roleId ? "border-red-500" : "border-gray-200 dark:border-gray-700"}`}
                      >
                        <option value="">-- Chọn vai trò (Role) --</option>
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

        {/* Right Column: Overview, Readiness & Metadata (4 cols) */}
        <div className="col-span-12 lg:col-span-4 space-y-6">
          {/* Workspace Health Panel */}
          <Card className="!p-0 border-none shadow-sm overflow-hidden bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
            <div
              className={`p-4 border-b ${readiness.overallLevel === "Ready" ? "bg-green-50/50 border-green-200 dark:bg-green-900/10 dark:border-green-800/50" : "bg-amber-50/50 border-amber-200 dark:bg-amber-900/10 dark:border-amber-800/50"}`}
            >
              <h3 className="text-sm font-bold flex items-center gap-2 uppercase tracking-wider text-gray-900 dark:text-white">
                Workspace Health
              </h3>
            </div>

            <div className="p-5 space-y-5">
              {/* Overall Status Badge */}
              <div className="flex justify-center">
                <span
                  className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider border ${
                    readiness.overallLevel === "Ready"
                      ? "bg-green-100 text-green-700 border-green-200"
                      : readiness.overallLevel === "Partial"
                        ? "bg-amber-100 text-amber-700 border-amber-200"
                        : "bg-red-100 text-red-700 border-red-200"
                  }`}
                >
                  {readiness.overallLevel === "Ready"
                    ? "Sẵn sàng vận hành"
                    : readiness.overallLevel === "Partial"
                      ? "Đã đủ thông tin cơ bản"
                      : "Cần hoàn thiện ngay"}
                </span>
              </div>

              {/* Warnings List */}
              {readiness.warnings.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-gray-100 dark:border-gray-800">
                  <h4 className="text-[11px] font-bold text-amber-600 uppercase">
                    Cần lưu ý:
                  </h4>
                  <ul className="space-y-2">
                    {readiness.warnings.map((w, i) => (
                      <li
                        key={i}
                        className="text-xs text-amber-700 dark:text-amber-400 flex items-start gap-1.5"
                      >
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0" />{" "}
                        <span>{w}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </Card>

          {/* Access Snapshot (Internal Only) */}
          {userType === "internal" && (
            <Card className="!p-0 border-none shadow-sm overflow-hidden bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
              <div className="bg-gray-900 p-4 text-white">
                <h3 className="text-sm font-bold flex items-center gap-2 uppercase tracking-wider">
                  <Layers className="w-4 h-4 text-purple-400" /> Access Scope
                  Summary
                </h3>
              </div>
              <div className="p-5 space-y-4 text-sm text-gray-700 dark:text-gray-300">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-500">Vai trò:</span>
                  <span className="font-bold text-gray-900 dark:text-white">
                    {initialUser.role?.title ||
                      (formData.roleId
                        ? roles.find((r) => r.id === Number(formData.roleId))
                            ?.title
                        : "—")}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-500">
                    Chi nhánh chính:
                  </span>
                  <span className="font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
                    <GitBranch className="w-3.5 h-3.5" />
                    {primaryBranchObj ? primaryBranchObj.name : "Chưa xác định"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-500">
                    Tổng CN được gán:
                  </span>
                  <span className="font-bold text-gray-900 dark:text-white px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded-md">
                    {selectedBranchIds.length}
                  </span>
                </div>
              </div>
            </Card>
          )}

          {/* Customer Notice */}
          {userType === "customer" && (
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-800 flex items-start gap-3">
              <Shield className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
              <p className="text-xs text-blue-800 dark:text-blue-300 leading-relaxed font-medium">
                Tài khoản khách hàng không có Role quản trị nội bộ và không bị
                giới hạn bởi Branch Scope. Các quyền truy cập phụ thuộc vào
                trạng thái tài khoản.
              </p>
            </div>
          )}

          {/* Metadata Panel */}
          <div className="text-[11px] text-gray-400 dark:text-gray-500 space-y-1.5 pt-4 px-2">
            <p>
              <strong>ID Hệ thống:</strong> #{initialUser.id}
            </p>
            <p>
              <strong>Tạo lúc:</strong>{" "}
              {initialUser.createdAt
                ? new Date(initialUser.createdAt).toLocaleString()
                : "—"}
            </p>
            <p>
              <strong>Cập nhật lần cuối:</strong>{" "}
              {initialUser.updatedAt
                ? new Date(initialUser.updatedAt).toLocaleString()
                : "—"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserEditPage;
