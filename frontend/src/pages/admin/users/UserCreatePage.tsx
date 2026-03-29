import React, {
  useEffect,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, Loader2, GitBranch } from "lucide-react";
import Card from "../../../components/admin/layouts/Card";
import { http } from "../../../services/http";
import { useAdminToast } from "../../../context/AdminToastContext";
import { useAuth } from "../../../context/AuthContextAdmin";

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
type ApiOk = {
  success: true;
  data?: any;
  url?: string;
  meta?: any;
  errors?: any;
};

const isStaffRole = (roleId: number | "" | null | undefined) =>
  roleId !== "" && roleId !== null && roleId !== undefined;

const UserCreatePage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const createType: "internal" | "customer" = location.pathname.includes(
    "/users/customers/",
  )
    ? "customer"
    : "internal";

  const { branches: actorBranches, user: currentUser } = useAuth();
  const isSuperAdmin = Number(currentUser?.role_id) === 1;

  const [formData, setFormData] = useState<UserFormData>({
    full_name: "",
    email: "",
    password: "",
    role_id: createType === "customer" ? "" : "",
    phone: "",
    avatar: "",
    status: "active",
  });

  const [roles, setRoles] = useState<Role[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranchIds, setSelectedBranchIds] = useState<number[]>([]);
  const [primaryBranchId, setPrimaryBranchId] = useState<number | "">("");

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewImage, setPreviewImage] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [errors, setErrors] = useState<
    Partial<Record<keyof UserFormData, string>> & {
      branches?: string;
      primaryBranchId?: string;
    }
  >({});
  const [imageMethod, setImageMethod] = useState<"upload" | "url">("upload");
  const [imageUrl, setImageUrl] = useState<string>("");

  const { showSuccessToast, showErrorToast } = useAdminToast();

  useEffect(() => {
    (async () => {
      try {
        const res = await http<ApiList<Role>>("GET", "/api/v1/admin/roles");
        if (res.success && Array.isArray(res.data)) setRoles(res.data);
      } catch (err) {
        console.error("fetchRoles error:", err);
      }
    })();

    if (isSuperAdmin) {
      (async () => {
        try {
          const res = await http<ApiList<Branch>>(
            "GET",
            "/api/v1/admin/branches?limit=100&status=active",
          );
          if (res.success && Array.isArray(res.data)) setBranches(res.data);
        } catch (err) {
          console.error("fetchBranches error:", err);
        }
      })();
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
  }, [isSuperAdmin, actorBranches]);

  const isStaffUser = isStaffRole(formData.role_id);
  const selectedBranches = branches.filter((b) =>
    selectedBranchIds.includes(b.id),
  );

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;

    let newValue: string | number = value;
    if (name === "role_id") {
      newValue = value === "" ? "" : Number(value);
    }

    setFormData((prev) => ({
      ...prev,
      [name]: newValue,
    }));

    if (name === "role_id" && !isStaffRole(newValue as number | "")) {
      setSelectedBranchIds([]);
      setPrimaryBranchId("");
      setErrors((prev) => ({
        ...prev,
        role_id: undefined,
        branches: undefined,
        primaryBranchId: undefined,
      }));
    } else if (errors[name as keyof typeof errors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
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
      setPreviewImage("");
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
      setPreviewImage("");
      return;
    }

    setSelectedFile(file);
    setPreviewImage(URL.createObjectURL(file));

    if (errors.avatar) {
      setErrors((prev) => ({ ...prev, avatar: undefined }));
    }
  };

  const validateForm = () => {
    const newErrors: Partial<Record<keyof UserFormData, string>> & {
      branches?: string;
      primaryBranchId?: string;
    } = {};

    if (!formData.full_name.trim()) {
      newErrors.full_name = "Vui lòng nhập họ và tên.";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Vui lòng nhập email.";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Địa chỉ email không hợp lệ.";
    }

    if (!formData.phone.trim()) {
      newErrors.phone = "Vui lòng nhập số điện thoại.";
    } else if (!/^0\d{9}$/.test(formData.phone)) {
      newErrors.phone = "Số điện thoại phải bắt đầu bằng số 0 và có 10 chữ số.";
    }

    if (!formData.password) {
      newErrors.password = "Vui lòng nhập mật khẩu.";
    } else if (formData.password.length < 6) {
      newErrors.password = "Mật khẩu phải có ít nhất 6 ký tự.";
    }

    if (isStaffUser) {
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

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      setLoading(true);
      setErrors({});

      let uploadedAvatarUrl = formData.avatar;

      if (imageMethod === "upload" && selectedFile) {
        const formDataImg = new FormData();
        formDataImg.append("file", selectedFile);
        const up = await http<ApiOk>(
          "POST",
          "/api/v1/admin/upload",
          formDataImg,
        );
        uploadedAvatarUrl = up?.data?.url || up?.url || "";

        if (!uploadedAvatarUrl) {
          setErrors({
            avatar: "Không thể upload ảnh đại diện. Vui lòng thử lại.",
          });
          setLoading(false);
          return;
        }
      } else if (imageMethod === "url" && imageUrl) {
        uploadedAvatarUrl = imageUrl;
      }

      const payload = {
        full_name: formData.full_name,
        email: formData.email,
        password: formData.password,
        role_id:
          createType === "customer"
            ? null
            : formData.role_id === ""
              ? null
              : Number(formData.role_id),
        phone: formData.phone || null,
        avatar: uploadedAvatarUrl || null,
        status: formData.status,
        branchIds: isStaffUser ? selectedBranchIds : [],
        primaryBranchId:
          isStaffUser && primaryBranchId !== ""
            ? Number(primaryBranchId)
            : null,
      };

      const res = await http<ApiOk>(
        "POST",
        "/api/v1/admin/users/create",
        payload,
      );

      if (res.success) {
        showSuccessToast({ message: "Tạo người dùng thành công!" });
        navigate(
          createType === "customer"
            ? "/admin/users/customers"
            : "/admin/users/internal",
        );
      } else {
        if (res.errors) {
          setErrors(res.errors);
        } else {
          showErrorToast((res as any).message || "Tạo người dùng thất bại.");
        }
      }
    } catch (err: any) {
      console.error("Create user error:", err);
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
          {createType === "customer"
            ? "Thêm khách hàng"
            : "Thêm nhân sự nội bộ"}
        </h1>
        <button
          onClick={() =>
            navigate(
              createType === "customer"
                ? "/admin/users/customers"
                : "/admin/users/internal",
            )
          }
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
              name="full_name"
              value={formData.full_name}
              onChange={handleChange}
              placeholder="Nhập họ và tên..."
              className={`w-full border ${
                errors.full_name
                  ? "border-red-500 dark:border-red-500"
                  : "border-gray-300 dark:border-gray-600"
              } rounded-md p-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors`}
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
              value={formData.email}
              onChange={handleChange}
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
              name="password"
              value={formData.password}
              onChange={handleChange}
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
              name="phone"
              value={formData.phone}
              onChange={handleChange}
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

          {createType === "internal" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Vai trò
              </label>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                Chọn vai trò để tạo tài khoản staff/admin nội bộ. Khi đã có vai
                trò, gán chi nhánh sẽ trở thành bắt buộc.
              </p>
              <select
                name="role_id"
                value={formData.role_id}
                onChange={handleChange}
                className={`w-full border ${
                  errors.role_id
                    ? "border-red-500 dark:border-red-500"
                    : "border-gray-300 dark:border-gray-600"
                } rounded-md p-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors`}
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
          )}

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
                      ? "border-red-500 dark:border-red-500"
                      : "border-gray-300 dark:border-gray-600"
                  } rounded-md p-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white`}
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
                Upload ảnh
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
            ) : (
              <div>
                <input
                  type="url"
                  placeholder="Nhập URL ảnh đại diện"
                  value={imageUrl}
                  onChange={(e) => {
                    setImageUrl(e.target.value);
                    setPreviewImage(e.target.value);
                    setFormData((prev) => ({
                      ...prev,
                      avatar: e.target.value,
                    }));
                  }}
                  className={`w-full border ${
                    errors.avatar
                      ? "border-red-500 dark:border-red-500"
                      : "border-gray-300 dark:border-gray-600"
                  } rounded-md p-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors`}
                />
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
                  className="h-24 w-24 object-cover rounded-md border border-gray-300 dark:border-gray-600 shadow-sm"
                />
                <button
                  type="button"
                  onClick={() => {
                    setSelectedFile(null);
                    setImageUrl("");
                    setPreviewImage("");
                    setFormData((prev) => ({ ...prev, avatar: "" }));
                  }}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600 shadow-md transition-colors"
                >
                  ×
                </button>
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
                  checked={formData.status === "active"}
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
                  checked={formData.status === "inactive"}
                  onChange={handleChange}
                  className="text-blue-600 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
                />
                <span className="text-gray-800 dark:text-gray-200">
                  Tạm dừng
                </span>
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={() =>
                navigate(
                  createType === "customer"
                    ? "/admin/users/customers"
                    : "/admin/users/internal",
                )
              }
              className="px-4 py-2 rounded-md text-gray-700 dark:text-gray-200 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 transition-colors font-medium"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 px-5 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:opacity-50 font-medium"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" /> Đang lưu...
                </>
              ) : createType === "customer" ? (
                "Lưu khách hàng"
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

export default UserCreatePage;
