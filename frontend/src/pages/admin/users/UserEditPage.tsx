import React, {
  useEffect,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Loader2, Save, ArrowLeft, GitBranch } from "lucide-react";
import Card from "../../../components/admin/layouts/Card";
import { http } from "../../../services/http";
import { useAuth } from "../../../context/AuthContextAdmin";
import { useAdminToast } from "../../../context/AdminToastContext";

interface Role {
  id: number;
  title: string;
}

interface Branch {
  id: number;
  name: string;
  code: string;
  status?: string;
}

interface UserBranch {
  id: number;
  name?: string | null;
  code?: string | null;
  status?: string | null;
  is_primary?: boolean;
}

interface User {
  id: number;
  full_name: string;
  email: string;
  role_id: number | "";
  phone: string;
  avatar?: string | null;
  status: "active" | "inactive";
  primary_branch_id?: number | null;
  branch_ids?: number[];
  branches?: UserBranch[];
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

const isStaffRole = (roleId: number | "" | null | undefined) =>
  roleId !== "" && roleId !== null && roleId !== undefined;

const UserEditPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [user, setUser] = useState<User | null>(null);
  const [initialUser, setInitialUser] = useState<User | null>(null);
  const [roles, setRoles] = useState<Role[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranchIds, setSelectedBranchIds] = useState<number[]>([]);
  const [initialSelectedBranchIds, setInitialSelectedBranchIds] = useState<
    number[]
  >([]);
  const [primaryBranchId, setPrimaryBranchId] = useState<number | "">("");
  const [initialPrimaryBranchId, setInitialPrimaryBranchId] = useState<
    number | ""
  >("");

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
      branches?: string;
      primaryBranchId?: string;
    }
  >({});
  const [imageMethod, setImageMethod] = useState<"upload" | "url" | "keep">(
    "keep",
  );
  const [imageUrl, setImageUrl] = useState<string>("");

  const { user: currentUser } = useAuth();
  const { showSuccessToast, showErrorToast } = useAdminToast();

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
        setInitialUser(data);
        setPreviewImage(data.avatar || "");

        const ids = Array.isArray(data.branch_ids)
          ? data.branch_ids.map(Number)
          : Array.isArray(data.branches)
            ? data.branches.map((b) => Number(b.id))
            : [];

        const primary =
          data.primary_branch_id ??
          data.branches?.find((b) => b.is_primary)?.id ??
          "";

        setSelectedBranchIds(ids);
        setInitialSelectedBranchIds(ids);
        setPrimaryBranchId(primary === null ? "" : Number(primary));
        setInitialPrimaryBranchId(primary === null ? "" : Number(primary));
      }
    } catch (err: any) {
      console.error(err);
      setErrors({ email: err?.message || "Không thể kết nối server." });
    } finally {
      setLoading(false);
    }
  };

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

  const fetchBranches = async () => {
    try {
      const res = await http<ApiList<Branch>>(
        "GET",
        "/api/v1/admin/branches?limit=100&status=active",
      );
      if (res.success && Array.isArray(res.data)) {
        setBranches(res.data);
      }
    } catch (err) {
      console.error("fetchBranches error:", err);
    }
  };

  const isDirty = React.useMemo(() => {
    if (!user || !initialUser) return false;

    const normalizeIds = (arr: number[]) =>
      [...arr].map(Number).sort((a, b) => a - b);

    const hasFieldChanges =
      user.full_name !== initialUser.full_name ||
      user.email !== initialUser.email ||
      Number(user.role_id) !== Number(initialUser.role_id) ||
      (user.phone || "") !== (initialUser.phone || "") ||
      user.status !== initialUser.status;

    const hasImageChanges =
      (imageMethod === "upload" && selectedFile !== null) ||
      (imageMethod === "url" &&
        imageUrl !== "" &&
        imageUrl !== (initialUser.avatar || ""));

    const hasPasswordChanges =
      newPassword.length > 0 || confirmPassword.length > 0;

    const hasBranchChanges =
      JSON.stringify(normalizeIds(selectedBranchIds)) !==
        JSON.stringify(normalizeIds(initialSelectedBranchIds)) ||
      Number(primaryBranchId || 0) !== Number(initialPrimaryBranchId || 0);

    return (
      hasFieldChanges ||
      hasImageChanges ||
      hasPasswordChanges ||
      hasBranchChanges
    );
  }, [
    user,
    initialUser,
    imageMethod,
    selectedFile,
    imageUrl,
    newPassword,
    confirmPassword,
    selectedBranchIds,
    initialSelectedBranchIds,
    primaryBranchId,
    initialPrimaryBranchId,
  ]);

  useEffect(() => {
    fetchUser();
    fetchRoles();
    fetchBranches();
  }, [id]);

  useEffect(() => {
    return () => {
      if (previewImage?.startsWith("blob:")) {
        URL.revokeObjectURL(previewImage);
      }
    };
  }, [previewImage]);

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;

    let newValue: any = value;
    if (name === "role_id") {
      newValue = value === "" ? "" : Number(value);
    }

    setUser((prev) => {
      if (!prev) return prev;

      const nextUser = { ...prev, [name]: newValue };

      if (name === "role_id" && !isStaffRole(newValue)) {
        setSelectedBranchIds([]);
        setPrimaryBranchId("");
        setErrors((prevErrors) => ({
          ...prevErrors,
          branches: undefined,
          primaryBranchId: undefined,
        }));
      }

      return nextUser;
    });

    if (errors[name as keyof typeof errors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }

    if (name === "role_id") {
      setErrors((prev) => ({
        ...prev,
        role_id: undefined,
        branches: undefined,
        primaryBranchId: undefined,
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

    if (errors.branches || errors.primaryBranchId) {
      setErrors((prev) => ({
        ...prev,
        branches: undefined,
        primaryBranchId: undefined,
      }));
    }
  };

  const handleImageSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];

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

    setSelectedFile(file);
    setPreviewImage(URL.createObjectURL(file));

    if (errors.avatar) {
      setErrors((prev) => ({ ...prev, avatar: undefined }));
    }
  };

  const validateForm = () => {
    const newErrors: typeof errors = {};
    const isStaff = !!user && isStaffRole(user.role_id);

    if (!user?.full_name?.trim()) {
      newErrors.full_name = "Vui lòng nhập họ và tên.";
    }

    if (!user?.email?.trim()) {
      newErrors.email = "Vui lòng nhập email.";
    } else if (!/\S+@\S+\.\S+/.test(user.email)) {
      newErrors.email = "Địa chỉ email không hợp lệ.";
    }

    if (!user?.phone?.trim()) {
      newErrors.phone = "Vui lòng nhập số điện thoại.";
    } else if (!/^0\d{9}$/.test(user.phone)) {
      newErrors.phone = "Số điện thoại phải bắt đầu bằng 0 và có 10 chữ số.";
    }

    if (newPassword || confirmPassword) {
      if (newPassword.length < 6) {
        newErrors.password = "Mật khẩu phải có ít nhất 6 ký tự.";
      }
      if (newPassword !== confirmPassword) {
        newErrors.confirmPassword = "Mật khẩu xác nhận không khớp.";
      }
    }

    if (isStaff) {
      if (selectedBranchIds.length === 0) {
        newErrors.branches = "Vui lòng chọn ít nhất 1 chi nhánh.";
      }

      if (
        selectedBranchIds.length > 0 &&
        (!primaryBranchId ||
          !selectedBranchIds.includes(Number(primaryBranchId)))
      ) {
        newErrors.primaryBranchId = "Vui lòng chọn chi nhánh chính hợp lệ.";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const isSelf = currentUser?.id === user.id;
    if (isSelf && user.status === "inactive") {
      showErrorToast("Bạn không thể vô hiệu hóa tài khoản đang đăng nhập.");
      return;
    }

    if (!validateForm()) return;

    try {
      setSaving(true);

      let avatarUrl = user.avatar;

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
      } else if (imageMethod === "url" && imageUrl) {
        avatarUrl = imageUrl;
      } else if (imageMethod === "keep") {
        avatarUrl = user.avatar;
      }

      const isStaff = isStaffRole(user.role_id);

      const body: any = {
        ...user,
        role_id: user.role_id === "" ? null : Number(user.role_id),
        avatar: avatarUrl,
        branchIds: isStaff ? selectedBranchIds : [],
        primaryBranchId:
          isStaff && primaryBranchId !== "" ? Number(primaryBranchId) : null,
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
        showSuccessToast({ message: "Cập nhật người dùng thành công!" });
        navigate("/admin/users");
      } else if (resp.errors) {
        setErrors(resp.errors);
      } else {
        showErrorToast((resp as any).message || "Cập nhật thất bại.");
      }
    } catch (err: any) {
      console.error(err);
      showErrorToast(err?.message || "Không thể kết nối server.");
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

  const isSelf = currentUser?.id === user.id;
  const isStaffUser = isStaffRole(user.role_id);

  const selectedBranches = branches.filter((b) =>
    selectedBranchIds.includes(b.id),
  );

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

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Số điện thoại <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="phone"
              value={user.phone || ""}
              onChange={handleChange}
              className={`w-full border ${
                errors.phone ? "border-red-500" : "border-gray-300"
              } dark:border-gray-600 rounded-md p-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors`}
            />
            {errors.phone && (
              <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                {errors.phone}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Vai trò
            </label>
            <select
              name="role_id"
              value={user.role_id || ""}
              onChange={handleChange}
              className={`w-full border ${
                errors.role_id ? "border-red-500" : "border-gray-300"
              } dark:border-gray-600 rounded-md p-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors`}
            >
              <option value="">-- Chọn vai trò (Không bắt buộc) --</option>
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

          {isStaffUser ? (
            <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4">
              <div className="flex items-center gap-2 mb-3">
                <GitBranch className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                <h3 className="text-sm font-semibold text-gray-800 dark:text-white">
                  Gán chi nhánh <span className="text-red-500">*</span>
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {branches.map((branch) => {
                  const checked = selectedBranchIds.includes(branch.id);
                  return (
                    <label
                      key={branch.id}
                      className={`flex items-center justify-between rounded-md border p-3 cursor-pointer transition-colors ${
                        checked
                          ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                          : "border-gray-300 dark:border-gray-600"
                      }`}
                    >
                      <div>
                        <p className="font-medium text-gray-800 dark:text-white">
                          {branch.name}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {branch.code}
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => handleToggleBranch(branch.id)}
                      />
                    </label>
                  );
                })}
              </div>

              {errors.branches && (
                <p className="text-sm text-red-600 dark:text-red-400 mt-2">
                  {errors.branches}
                </p>
              )}

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Chi nhánh chính <span className="text-red-500">*</span>
                </label>
                <select
                  value={primaryBranchId}
                  onChange={(e) =>
                    setPrimaryBranchId(
                      e.target.value ? Number(e.target.value) : "",
                    )
                  }
                  className={`w-full border ${
                    errors.primaryBranchId
                      ? "border-red-500"
                      : "border-gray-300"
                  } dark:border-gray-600 rounded-md p-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white`}
                >
                  <option value="">-- Chọn chi nhánh chính --</option>
                  {selectedBranches.map((branch) => (
                    <option key={branch.id} value={branch.id}>
                      {branch.name} ({branch.code})
                    </option>
                  ))}
                </select>
                {errors.primaryBranchId && (
                  <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                    {errors.primaryBranchId}
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-gray-300 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-800/40">
              <div className="flex items-center gap-2 mb-2">
                <GitBranch className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                <h3 className="text-sm font-semibold text-gray-800 dark:text-white">
                  Gán chi nhánh
                </h3>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                User hiện là customer nên không cần gán chi nhánh. Khi chọn vai
                trò staff/admin, phần gán chi nhánh sẽ xuất hiện và trở thành
                bắt buộc.
              </p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Ảnh đại diện
            </label>

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
                  disabled={isSelf}
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
                  disabled={isSelf}
                  className="text-blue-600 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
                />
                <span className="text-gray-800 dark:text-gray-200">
                  Tạm dừng
                </span>
              </label>
              {isSelf && (
                <p className="text-xs text-gray-500 mt-1">
                  Bạn không thể thay đổi trạng thái tài khoản đang đăng nhập.
                </p>
              )}
            </div>
          </div>

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

export default UserEditPage;
