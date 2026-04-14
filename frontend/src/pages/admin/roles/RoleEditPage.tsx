import React, {
  useEffect,
  useState,
  useMemo,
  type ChangeEvent,
  type FormEvent,
} from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Loader2,
  Save,
  ArrowLeft,
  ShieldAlert,
  ShieldCheck,
  KeyRound,
  Users,
  LayoutTemplate,
  Copy,
  AlertTriangle,
  Info,
  CheckCircle2,
  XCircle,
  Building2,
  Clock,
  Settings2,
} from "lucide-react";
import Card from "../../../components/admin/layouts/Card";
import { http } from "../../../services/http";
import { useAdminToast } from "../../../context/AdminToastContext";

// ==========================================
// TYPES & INTERFACES
// ==========================================
interface Role {
  id: number;
  title: string;
  description?: string | null;
  permissions?: Record<string, string[]> | string | null;
  created_at?: string;
  updated_at?: string;
  is_system?: boolean;
  users_count?: number;
  branches_count?: number;
}

type RiskLevel = "low" | "medium" | "high";

interface PermissionStats {
  moduleCount: number;
  actionCount: number;
  sensitiveCount: number;
  riskLevel: RiskLevel;
}

type ApiDetail<T> = { success: true; data: T; meta?: any };
type ApiOk = {
  success: true;
  data?: any;
  url?: string;
  message?: string;
  meta?: any;
  errors?: any;
};

// ==========================================
// HEURISTICS & HELPERS
// ==========================================
const SENSITIVE_KEYWORDS = [
  "delete",
  "remove",
  "force",
  "manage",
  "permission",
  "role",
  "user",
  "admin",
  "system",
  "setting",
  "config",
];

const parsePermissions = (perms: any): Record<string, string[]> => {
  if (!perms) return {};
  if (typeof perms === "string") {
    try {
      return JSON.parse(perms);
    } catch {
      return {};
    }
  }
  if (typeof perms === "object" && !Array.isArray(perms)) {
    return perms as Record<string, string[]>;
  }
  return {};
};

const calculateStats = (
  permissions: Record<string, string[]>,
): PermissionStats => {
  const modules = Object.keys(permissions);
  let actionCount = 0;
  let sensitiveCount = 0;

  modules.forEach((mod) => {
    const acts = permissions[mod];
    const isModSensitive = SENSITIVE_KEYWORDS.some((w) =>
      mod.toLowerCase().includes(w),
    );

    if (Array.isArray(acts)) {
      actionCount += acts.length;
      acts.forEach((act) => {
        if (
          isModSensitive ||
          SENSITIVE_KEYWORDS.some((w) => act.toLowerCase().includes(w))
        ) {
          sensitiveCount++;
        }
      });
    }
  });

  let riskLevel: RiskLevel = "low";
  if (
    sensitiveCount >= 5 ||
    modules.some((m) => m.toLowerCase().includes("admin"))
  ) {
    riskLevel = "high";
  } else if (sensitiveCount > 0 || actionCount >= 10) {
    riskLevel = "medium";
  }

  return {
    moduleCount: modules.length,
    actionCount,
    sensitiveCount,
    riskLevel,
  };
};

const getRiskConfig = (risk: RiskLevel) => {
  const map = {
    low: {
      label: "Rủi ro thấp",
      color: "text-emerald-700 dark:text-emerald-400",
      bg: "bg-emerald-50 dark:bg-emerald-900/20",
      border: "border-emerald-200 dark:border-emerald-800",
    },
    medium: {
      label: "Rủi ro trung bình",
      color: "text-amber-700 dark:text-amber-400",
      bg: "bg-amber-50 dark:bg-amber-900/20",
      border: "border-amber-200 dark:border-amber-800",
    },
    high: {
      label: "Rủi ro cao",
      color: "text-red-700 dark:text-red-400",
      bg: "bg-red-50 dark:bg-red-900/20",
      border: "border-red-200 dark:border-red-800",
    },
  };
  return map[risk];
};

const isSystemLikeRole = (role: Role | null) => {
  if (!role) return false;
  if (role.is_system) return true;
  const t = role.title.toLowerCase();
  return (
    t.includes("admin") || t.includes("hệ thống") || t.includes("quản trị")
  );
};

const formatDate = (dateString?: string) => {
  if (!dateString) return "—";
  try {
    return new Date(dateString).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "—";
  }
};

// ==========================================
// MAIN COMPONENT
// ==========================================
const RoleEditPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showSuccessToast, showErrorToast } = useAdminToast();

  // --- States ---
  const [role, setRole] = useState<Role | null>(null);
  const [initialRole, setInitialRole] = useState<Role | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [fetchError, setFetchError] = useState("");
  const [formErrors, setFormErrors] = useState<
    Partial<Record<keyof Role, string>>
  >({});

  // --- Data Fetching ---
  const fetchRole = async () => {
    try {
      setLoading(true);
      setFetchError("");
      const res = await http<ApiDetail<Role>>(
        "GET",
        `/api/v1/admin/roles/edit/${id}`,
      );
      if (res?.success && res.data) {
        setRole(res.data);
        setInitialRole(res.data);
      } else {
        setFetchError("Không tìm thấy dữ liệu vai trò.");
      }
    } catch (err: any) {
      console.error(err);
      setFetchError(err?.message || "Lỗi kết nối server.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRole();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // --- Derived State (useMemo) ---
  const isDirty = useMemo(() => {
    if (!role || !initialRole) return false;
    return (
      role.title !== initialRole.title ||
      (role.description || "") !== (initialRole.description || "")
    );
  }, [role, initialRole]);

  const parsedPermissions = useMemo(
    () => parsePermissions(role?.permissions),
    [role?.permissions],
  );

  const stats = useMemo(
    () => calculateStats(parsedPermissions),
    [parsedPermissions],
  );

  const riskConfig = useMemo(() => getRiskConfig(stats.riskLevel), [stats]);
  const isProtected = useMemo(() => isSystemLikeRole(role), [role]);

  // --- Form Handlers ---
  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setRole((prev) => (prev ? { ...prev, [name]: value } : prev));
    if (formErrors[name as keyof typeof formErrors]) {
      setFormErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const validateForm = () => {
    if (!role) return false;
    const newErrors: Partial<Record<keyof Role, string>> = {};
    if (!role.title.trim()) {
      newErrors.title = "Vui lòng nhập tên hiển thị cho vai trò.";
    }
    setFormErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async (e?: FormEvent) => {
    if (e) e.preventDefault();
    if (!role || !isDirty) return;

    if (!validateForm()) return;

    try {
      setSaving(true);
      setFormErrors({});

      const res = await http<ApiOk>("PATCH", `/api/v1/admin/roles/edit/${id}`, {
        title: role.title,
        description: role.description,
      });

      if (res?.success) {
        showSuccessToast({ message: "Lưu thông tin vai trò thành công!" });
        setInitialRole({
          ...role,
        });
      } else {
        if (res.errors) {
          setFormErrors(res.errors);
        } else {
          showErrorToast(res?.message || "Không thể lưu thay đổi.");
        }
      }
    } catch (err: any) {
      console.error(err);
      if (err?.data?.errors) {
        setFormErrors(err.data.errors);
      } else {
        showErrorToast(
          err?.data?.message || err?.message || "Lỗi kết nối server.",
        );
      }
    } finally {
      setSaving(false);
    }
  };

  // ==========================================
  // RENDER: Loading & Error
  // ==========================================
  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center py-32 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-4" />
        <p className="text-gray-500 dark:text-gray-400 font-medium">
          Đang khởi tạo không gian quản lý role...
        </p>
      </div>
    );
  }

  if (fetchError || !role) {
    return (
      <div className="flex flex-col items-center justify-center py-24 bg-white dark:bg-gray-800 rounded-2xl border border-red-200 dark:border-red-900/30">
        <AlertTriangle className="w-12 h-12 text-red-500 mb-4" />
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
          Không thể tải dữ liệu vai trò
        </h3>
        <p className="text-red-600 dark:text-red-400 mb-6 font-medium">
          {fetchError}
        </p>
        <div className="flex gap-3">
          <button
            onClick={() => navigate("/admin/roles")}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 font-semibold rounded-lg transition"
          >
            Quay lại danh sách
          </button>
          <button
            onClick={fetchRole}
            className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition"
          >
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  // ==========================================
  // RENDER: Workspace
  // ==========================================
  return (
    <div className="w-full pb-10 space-y-6">
      {/* A. Header Workspace */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <button
                onClick={() => navigate("/admin/roles")}
                className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md text-gray-500 dark:text-gray-400 transition"
                title="Quay lại danh sách"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight flex items-center gap-3">
                {initialRole?.title || "Vai trò"}
                {isProtected && (
                  <span className="px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider bg-gray-100 text-gray-600 border border-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600">
                    Role Hệ Thống
                  </span>
                )}
              </h1>
            </div>
            <p className="text-gray-500 dark:text-gray-400 ml-10 max-w-2xl text-sm">
              Không gian quản lý thông tin, độ nhạy cảm và kiểm soát phạm vi
              truy cập của vai trò này trong hệ thống.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 ml-10 xl:ml-0">
            {/* Trạng thái lưu */}
            <div className="mr-2 text-sm font-medium flex items-center gap-1.5">
              {isDirty ? (
                <span className="text-amber-600 dark:text-amber-500 bg-amber-50 dark:bg-amber-900/20 px-2.5 py-1 rounded-md border border-amber-200 dark:border-amber-800/50">
                  <span className="inline-block w-2 h-2 rounded-full bg-amber-500 mr-1.5 animate-pulse"></span>
                  Có thay đổi chưa lưu
                </span>
              ) : (
                <span className="text-gray-500 dark:text-gray-400">
                  <CheckCircle2 className="w-4 h-4 inline mr-1" />
                  Đã lưu thay đổi
                </span>
              )}
            </div>

            <button
              onClick={() => navigate("/admin/roles/permissions")}
              className="px-3 py-1.5 text-sm bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-semibold rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition flex items-center gap-2"
            >
              <LayoutTemplate className="w-4 h-4" /> Ma trận quyền
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !isDirty}
              className="flex items-center gap-2 px-4 py-1.5 text-sm bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {saving ? "Đang lưu..." : "Lưu thay đổi"}
            </button>
          </div>
        </div>
      </div>

      {/* B. Top Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className={`p-4 border ${riskConfig.border}`}>
          <div className="flex items-center gap-2 mb-2">
            <ShieldAlert className={`w-4 h-4 ${riskConfig.color}`} />
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Mức rủi ro
            </span>
          </div>
          <div className={`text-xl font-black ${riskConfig.color}`}>
            {riskConfig.label}
          </div>
        </Card>

        <Card className="p-4 border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 mb-2">
            <ShieldCheck className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Phạm vi quyền
            </span>
          </div>
          <div className="text-xl font-black text-gray-900 dark:text-white">
            {stats.moduleCount}{" "}
            <span className="text-sm font-medium text-gray-500">modules</span> /{" "}
            {stats.actionCount}{" "}
            <span className="text-sm font-medium text-gray-500">actions</span>
          </div>
        </Card>

        <Card className="p-4 border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 mb-2">
            <KeyRound className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Quyền nhạy cảm
            </span>
          </div>
          <div className="text-xl font-black text-gray-900 dark:text-white">
            {stats.sensitiveCount}{" "}
            <span className="text-sm font-medium text-gray-500">actions</span>
          </div>
        </Card>

        <Card className="p-4 border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Tác động sử dụng
            </span>
          </div>
          <div className="text-xl font-black text-gray-900 dark:text-white">
            {role.users_count ?? "—"}{" "}
            <span className="text-sm font-medium text-gray-500">
              người dùng
            </span>
          </div>
        </Card>
      </div>

      {/* C. Main Layout 2 Cột */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* === CỘT TRÁI (2/3) === */}
        <div className="lg:col-span-2 space-y-6">
          {/* 1. Identity Section */}
          <Card className="border-gray-200 dark:border-gray-700 overflow-hidden !p-0">
            <div className="p-5 border-b border-gray-100 dark:border-gray-700/50 bg-gray-50/50 dark:bg-gray-800/50 flex items-center gap-2">
              <Settings2 className="w-5 h-5 text-gray-500" />
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                Thông tin vai trò
              </h2>
            </div>
            <div className="p-5 space-y-6">
              <div>
                <label className="block text-sm font-bold text-gray-900 dark:text-white mb-1.5">
                  Tên hiển thị <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="title"
                  value={role.title || ""}
                  onChange={handleChange}
                  placeholder="Vd: Quản lý chi nhánh, Thu ngân..."
                  className={`w-full px-4 py-2.5 rounded-lg border bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
                    formErrors.title
                      ? "border-red-500 dark:border-red-500"
                      : "border-gray-300 dark:border-gray-600"
                  }`}
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5 font-medium">
                  Tên dùng để nhận diện nhanh nhóm người dùng và cấu hình trong
                  ma trận quyền.
                </p>
                {formErrors.title && (
                  <p className="text-sm text-red-600 dark:text-red-400 mt-1.5 flex items-center gap-1">
                    <XCircle className="w-4 h-4" /> {formErrors.title}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-900 dark:text-white mb-1.5">
                  Mô tả vai trò
                </label>
                <textarea
                  name="description"
                  value={role.description || ""}
                  onChange={handleChange}
                  rows={4}
                  placeholder="Nhập mô tả vai trò..."
                  className={`w-full px-4 py-2.5 rounded-lg border bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors resize-y ${
                    formErrors.description
                      ? "border-red-500 dark:border-red-500"
                      : "border-gray-300 dark:border-gray-600"
                  }`}
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5 font-medium">
                  Nên ghi rõ mục đích, quyền hạn chính hoặc đối tượng nhân sự
                  nào sẽ được gán role này.
                </p>
                {formErrors.description && (
                  <p className="text-sm text-red-600 dark:text-red-400 mt-1.5 flex items-center gap-1">
                    <XCircle className="w-4 h-4" /> {formErrors.description}
                  </p>
                )}
              </div>
            </div>
          </Card>

          {/* 2. Permission Summary Section */}
          <Card className="border-gray-200 dark:border-gray-700 overflow-hidden !p-0">
            <div className="p-5 border-b border-gray-100 dark:border-gray-700/50 bg-gray-50/50 dark:bg-gray-800/50 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-gray-500" />
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                  Tóm tắt phân quyền
                </h2>
              </div>
              {stats.moduleCount > 0 && (
                <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded-md">
                  Active
                </span>
              )}
            </div>
            <div className="p-5">
              {stats.moduleCount === 0 ? (
                <div className="text-center py-10 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-dashed border-gray-300 dark:border-gray-600">
                  <ShieldAlert className="w-10 h-10 text-gray-400 mx-auto mb-3" />
                  <h3 className="text-gray-900 dark:text-white font-bold mb-1">
                    Chưa cấu hình quyền truy cập
                  </h3>
                  <p className="text-sm text-gray-500 mb-4 max-w-sm mx-auto">
                    Role này hiện đang trống. Hãy thiết lập các quyền hạn cụ thể
                    để role có thể được sử dụng trong hệ thống.
                  </p>
                  <button
                    onClick={() => navigate("/admin/roles/permissions")}
                    className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition shadow-sm"
                  >
                    Mở ma trận phân quyền
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                    Role này được cấp quyền can thiệp vào{" "}
                    <strong className="text-gray-900 dark:text-white">
                      {stats.moduleCount}
                    </strong>{" "}
                    phân hệ (modules). Dưới đây là bức tranh tổng quan:
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                    {Object.entries(parsedPermissions).map(
                      ([moduleName, actions]) => {
                        const hasSensitive = actions.some((act) =>
                          SENSITIVE_KEYWORDS.some((w) =>
                            act.toLowerCase().includes(w),
                          ),
                        );
                        return (
                          <div
                            key={moduleName}
                            className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 flex flex-col gap-2"
                          >
                            <div className="flex justify-between items-start">
                              <h4 className="font-bold text-sm text-gray-900 dark:text-white">
                                {moduleName}
                              </h4>
                              {hasSensitive && (
                                <span title="Chứa hành động nhạy cảm">
                                  <KeyRound className="w-3.5 h-3.5 text-purple-500 shrink-0" />
                                </span>
                              )}
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                              {actions.slice(0, 4).map((act) => (
                                <span
                                  key={act}
                                  className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded text-[10px] font-mono"
                                >
                                  {act}
                                </span>
                              ))}
                              {actions.length > 4 && (
                                <span className="px-1.5 py-0.5 bg-gray-50 dark:bg-gray-800/50 text-gray-500 rounded text-[10px] italic">
                                  +{actions.length - 4} nữa
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      },
                    )}
                  </div>
                  <div className="pt-4 mt-2 border-t border-gray-100 dark:border-gray-700 flex justify-end">
                    <button
                      onClick={() => navigate("/admin/roles/permissions")}
                      className="text-sm font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 flex items-center gap-1.5"
                    >
                      Quản lý chi tiết trong ma trận{" "}
                      <ArrowLeft className="w-4 h-4 rotate-180" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* === CỘT PHẢI (1/3) === */}
        <div className="space-y-6">
          {/* Warning Panels */}
          {isProtected && (
            <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 rounded-xl flex gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-500 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-amber-800 dark:text-amber-400 text-sm">
                  Role được bảo vệ
                </h4>
                <p className="text-xs text-amber-700 dark:text-amber-500 mt-1">
                  Đây là role hệ thống hoặc có quyền admin rễ. Hạn chế sửa đổi
                  mô tả hoặc thu hồi quyền để tránh lỗi vận hành.
                </p>
              </div>
            </div>
          )}

          {stats.riskLevel === "high" && !isProtected && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 rounded-xl flex gap-3">
              <ShieldAlert className="w-5 h-5 text-red-600 dark:text-red-500 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-red-800 dark:text-red-400 text-sm">
                  Cảnh báo bảo mật
                </h4>
                <p className="text-xs text-red-700 dark:text-red-500 mt-1">
                  Role này đang nắm giữ quyền hạn nhạy cảm (
                  {stats.sensitiveCount} actions). Chỉ nên gán cho nhóm người
                  dùng thực sự tin cậy.
                </p>
              </div>
            </div>
          )}

          {/* 3. Role Health Panel */}
          <Card className="border-gray-200 dark:border-gray-700 !p-0 overflow-hidden">
            <div className="p-4 border-b border-gray-100 dark:border-gray-700/50 bg-gray-50/50 dark:bg-gray-800/50">
              <h3 className="font-bold text-gray-900 dark:text-white">
                Tình trạng role
              </h3>
            </div>
            <div className="p-4 space-y-4 text-sm font-medium">
              <div className="flex justify-between items-center">
                <span className="text-gray-500 dark:text-gray-400">
                  Trạng thái cấu hình
                </span>
                {stats.moduleCount > 0 ? (
                  <span className="flex items-center gap-1.5 text-green-600 dark:text-green-400">
                    <CheckCircle2 className="w-4 h-4" /> Đã cấp quyền
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 text-red-500">
                    <XCircle className="w-4 h-4" /> Trống (Rỗng)
                  </span>
                )}
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500 dark:text-gray-400">Mô tả</span>
                {role.description && role.description.trim() !== "" ? (
                  <span className="text-green-600 dark:text-green-400">
                    Có mô tả
                  </span>
                ) : (
                  <span className="text-amber-500">Chưa có</span>
                )}
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500 dark:text-gray-400">
                  Quyền nhạy cảm
                </span>
                <span
                  className={
                    stats.sensitiveCount > 0
                      ? "text-purple-600 dark:text-purple-400 font-bold"
                      : "text-gray-900 dark:text-white"
                  }
                >
                  {stats.sensitiveCount}
                </span>
              </div>
              <div className="flex justify-between items-center pt-3 border-t border-gray-100 dark:border-gray-700">
                <span className="text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                  <Clock className="w-4 h-4" /> Cập nhật lần cuối
                </span>
                <span className="text-gray-900 dark:text-white">
                  {formatDate(role.updated_at)}
                </span>
              </div>
            </div>
          </Card>

          {/* 4. Access Impact Panel */}
          <Card className="border-gray-200 dark:border-gray-700 !p-0 overflow-hidden">
            <div className="p-4 border-b border-gray-100 dark:border-gray-700/50 bg-gray-50/50 dark:bg-gray-800/50">
              <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                Tác động hệ thống
              </h3>
            </div>
            <div className="p-4 space-y-4 text-sm font-medium">
              <div className="flex justify-between items-center">
                <span className="text-gray-500 dark:text-gray-400 flex items-center gap-2">
                  <Users className="w-4 h-4" /> Users
                </span>
                <span className="text-gray-900 dark:text-white">
                  {role.users_count ?? "—"}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500 dark:text-gray-400 flex items-center gap-2">
                  <Building2 className="w-4 h-4" /> Chi nhánh
                </span>
                <span className="text-gray-900 dark:text-white">
                  {role.branches_count ?? "—"}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500 dark:text-gray-400 flex items-center gap-2">
                  <Info className="w-4 h-4" /> Loại Role
                </span>
                <span className="text-gray-900 dark:text-white">
                  {role.is_system ? "Cốt lõi" : "Tùy chỉnh"}
                </span>
              </div>
            </div>
          </Card>

          {/* 5. Quick Actions Panel */}
          <Card className="border-gray-200 dark:border-gray-700 !p-0 overflow-hidden">
            <div className="p-4 border-b border-gray-100 dark:border-gray-700/50 bg-gray-50/50 dark:bg-gray-800/50">
              <h3 className="font-bold text-gray-900 dark:text-white">
                Thao tác nhanh
              </h3>
            </div>
            <div className="p-2">
              <button
                onClick={() => navigate("/admin/roles/permissions")}
                className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition text-left"
              >
                <div className="p-1.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-md">
                  <LayoutTemplate className="w-4 h-4" />
                </div>
                Mở ma trận phân quyền
              </button>

              <button
                onClick={() =>
                  navigate(`/admin/roles/create?copyFrom=${role.id}`)
                }
                className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition text-left"
              >
                <div className="p-1.5 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-md">
                  <Copy className="w-4 h-4" />
                </div>
                Nhân bản role này
              </button>

              <button
                onClick={() => navigate("/admin/roles")}
                className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition text-left"
              >
                <div className="p-1.5 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-md">
                  <ArrowLeft className="w-4 h-4" />
                </div>
                Quay lại roles board
              </button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default RoleEditPage;
