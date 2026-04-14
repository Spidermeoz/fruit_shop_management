import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ShieldCheck,
  ShieldAlert,
  Plus,
  Search,
  LayoutGrid,
  List,
  Loader2,
  Trash2,
  Copy,
  Settings2,
  AlertTriangle,
  Info,
  ShieldX,
  ShieldQuestion,
  Users,
  KeyRound,
  LayoutTemplate,
} from "lucide-react";
import Card from "../../../components/admin/layouts/Card";
import { http } from "../../../services/http";

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

interface NormalizedRole extends Role {
  parsedPermissions: Record<string, string[]>;
  stats: PermissionStats;
}

type ApiList<T> = { success: true; data: T[]; meta?: any };
type ApiOk = { success: true; data?: any; message?: string; meta?: any };

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

  // Risk Heuristic
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

const getRiskBadge = (risk: RiskLevel) => {
  const map = {
    low: {
      label: "Rủi ro thấp",
      color:
        "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400",
    },
    medium: {
      label: "Rủi ro trung bình",
      color:
        "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400",
    },
    high: {
      label: "Rủi ro cao",
      color:
        "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-400",
    },
  };
  return map[risk];
};

const getRiskWeight = (risk: RiskLevel) =>
  ({ high: 3, medium: 2, low: 1 })[risk];

// ==========================================
// MAIN COMPONENT
// ==========================================
const RolesPage: React.FC = () => {
  const navigate = useNavigate();

  // --- States ---
  const [rawRoles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  const [search, setSearch] = useState("");
  const [riskFilter, setRiskFilter] = useState<"all" | RiskLevel>("all");
  const [stateFilter, setStateFilter] = useState<
    "all" | "no-description" | "no-permissions" | "sensitive" | "system"
  >("all");
  const [sortBy, setSortBy] = useState<
    "title-asc" | "title-desc" | "permission-desc" | "module-desc" | "risk-desc"
  >("title-asc");
  const [viewMode, setViewMode] = useState<"cards" | "table">("cards");

  // --- Fetch Data ---
  const fetchRoles = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await http<ApiList<Role>>("GET", "/api/v1/admin/roles");
      if (res.success && Array.isArray(res.data)) {
        setRoles(res.data);
      } else {
        setError("Không thể tải hệ thống vai trò.");
      }
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Lỗi kết nối server hoặc API không phản hồi.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  // --- Data Transformation & Filtering ---
  const normalizedRoles: NormalizedRole[] = useMemo(() => {
    return rawRoles.map((role) => {
      const parsed = parsePermissions(role.permissions);
      return {
        ...role,
        parsedPermissions: parsed,
        stats: calculateStats(parsed),
      };
    });
  }, [rawRoles]);

  const kpiStats = useMemo(() => {
    let highRisk = 0;
    let noDesc = 0;
    let noPerms = 0;
    let sensitiveRoles = 0;

    normalizedRoles.forEach((r) => {
      if (r.stats.riskLevel === "high") highRisk++;
      if (!r.description?.trim()) noDesc++;
      if (r.stats.moduleCount === 0) noPerms++;
      if (r.stats.sensitiveCount > 0) sensitiveRoles++;
    });

    return {
      total: normalizedRoles.length,
      highRisk,
      noDesc,
      noPerms,
      sensitiveRoles,
    };
  }, [normalizedRoles]);

  const filteredAndSortedRoles = useMemo(() => {
    let result = [...normalizedRoles];

    // Search
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (r) =>
          r.title.toLowerCase().includes(q) ||
          (r.description && r.description.toLowerCase().includes(q)),
      );
    }

    // Risk Filter
    if (riskFilter !== "all") {
      result = result.filter((r) => r.stats.riskLevel === riskFilter);
    }

    // State Filter
    if (stateFilter !== "all") {
      if (stateFilter === "no-description")
        result = result.filter((r) => !r.description?.trim());
      if (stateFilter === "no-permissions")
        result = result.filter((r) => r.stats.moduleCount === 0);
      if (stateFilter === "sensitive")
        result = result.filter((r) => r.stats.sensitiveCount > 0);
      if (stateFilter === "system") result = result.filter((r) => r.is_system);
    }

    // Sort
    result.sort((a, b) => {
      switch (sortBy) {
        case "title-asc":
          return a.title.localeCompare(b.title);
        case "title-desc":
          return b.title.localeCompare(a.title);
        case "permission-desc":
          return b.stats.actionCount - a.stats.actionCount;
        case "module-desc":
          return b.stats.moduleCount - a.stats.moduleCount;
        case "risk-desc":
          return (
            getRiskWeight(b.stats.riskLevel) - getRiskWeight(a.stats.riskLevel)
          );
        default:
          return 0;
      }
    });

    return result;
  }, [normalizedRoles, search, riskFilter, stateFilter, sortBy]);

  // --- Actions ---
  const handleDeleteRole = async (role: NormalizedRole) => {
    if (role.is_system) {
      alert("Không thể xóa vai trò hệ thống.");
      return;
    }
    if (
      !window.confirm(
        `Bạn có chắc muốn xóa vai trò "${role.title}"?\nHành động này không thể hoàn tác.`,
      )
    )
      return;

    try {
      const res = await http<ApiOk>(
        "DELETE",
        `/api/v1/admin/roles/delete/${role.id}`,
      );
      if (res.success) {
        setRoles((prev) => prev.filter((r) => r.id !== role.id));
      }
    } catch (err: any) {
      alert(err?.message || "Không thể xóa vai trò.");
    }
  };

  // ==========================================
  // RENDER
  // ==========================================
  return (
    <div className="w-full pb-10 space-y-6">
      {/* A. Header Chiến lược */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Vai trò truy cập
            </h1>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Quản lý Access Profiles, đánh giá mức độ rủi ro và phạm vi ủy quyền
            trong hệ thống.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <button
            onClick={() => navigate("/admin/roles/permissions")}
            className="px-4 py-2 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600 text-sm font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition flex items-center justify-center gap-2 whitespace-nowrap"
          >
            <LayoutTemplate className="w-4 h-4" /> Ma trận phân quyền
          </button>
          <button
            onClick={() => navigate("/admin/roles/create")}
            className="flex items-center gap-2 px-5 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition shadow-sm ml-auto md:ml-0 whitespace-nowrap"
          >
            <Plus className="w-4 h-4" /> Thêm vai trò
          </button>
        </div>
      </div>

      {/* B. KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3">
        {[
          {
            label: "Tổng vai trò",
            value: kpiStats.total,
            icon: ShieldCheck,
            color: "text-blue-600",
            bg: "bg-blue-50",
          },
          {
            label: "Rủi ro cao",
            value: kpiStats.highRisk,
            icon: ShieldAlert,
            color: "text-red-600",
            bg: "bg-red-50",
            isWarning: kpiStats.highRisk > 0,
          },
          {
            label: "Thiếu mô tả",
            value: kpiStats.noDesc,
            icon: Info,
            color: "text-amber-600",
            bg: "bg-amber-50",
          },
          {
            label: "Chưa cấu hình quyền",
            value: kpiStats.noPerms,
            icon: ShieldX,
            color: "text-gray-600",
            bg: "bg-gray-100",
            isWarning: kpiStats.noPerms > 0,
          },
          {
            label: "Có quyền nhạy cảm",
            value: kpiStats.sensitiveRoles,
            icon: KeyRound,
            color: "text-purple-600",
            bg: "bg-purple-50",
          },
        ].map((kpi, idx) => (
          <div
            key={idx}
            className="p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 flex flex-col justify-center transition-all"
          >
            <div className="flex items-center gap-2 mb-2">
              <kpi.icon className={`w-4 h-4 ${kpi.color}`} />
              <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 truncate">
                {kpi.label}
              </span>
            </div>
            <div
              className={`text-xl font-black ${kpi.isWarning ? "text-red-600 dark:text-red-400" : "text-gray-900 dark:text-white"}`}
            >
              {kpi.value}
            </div>
          </div>
        ))}
      </div>

      {/* C. Control Bar */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col gap-4">
        {/* Advanced Filters */}
        <div className="flex flex-col lg:flex-row justify-between items-center gap-4">
          <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
            <select
              value={riskFilter}
              onChange={(e) => setRiskFilter(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white min-w-[180px]"
            >
              <option value="all">Mọi mức rủi ro</option>
              <option value="low">Rủi ro thấp</option>
              <option value="medium">Rủi ro trung bình</option>
              <option value="high">Rủi ro cao</option>
            </select>

            <select
              value={stateFilter}
              onChange={(e) => setStateFilter(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white min-w-[180px]"
            >
              <option value="all">Mọi trạng thái cấu hình</option>
              <option value="sensitive">Có quyền nhạy cảm</option>
              <option value="no-permissions">Chưa cấu hình quyền</option>
              <option value="no-description">Chưa có mô tả</option>
              <option value="system">Vai trò hệ thống</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white min-w-[180px]"
            >
              <option value="title-asc">Tên (A-Z)</option>
              <option value="title-desc">Tên (Z-A)</option>
              <option value="risk-desc">Rủi ro giảm dần</option>
              <option value="permission-desc">Nhiều quyền nhất</option>
              <option value="module-desc">Phủ nhiều module nhất</option>
            </select>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4 w-full lg:w-auto">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Tìm tên hoặc mô tả..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex bg-gray-100 dark:bg-gray-900 p-1 rounded-lg shrink-0">
              <button
                onClick={() => setViewMode("cards")}
                className={`p-1.5 rounded-md flex items-center gap-1.5 text-sm font-medium transition ${viewMode === "cards" ? "bg-white dark:bg-gray-700 shadow-sm text-blue-600 dark:text-blue-400" : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"}`}
                title="Card View"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode("table")}
                className={`p-1.5 rounded-md flex items-center gap-1.5 text-sm font-medium transition ${viewMode === "table" ? "bg-white dark:bg-gray-700 shadow-sm text-blue-600 dark:text-blue-400" : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"}`}
                title="Table View"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* D. Main Content Area */}
      {loading ? (
        <div className="flex flex-col justify-center items-center py-24 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <p className="mt-3 text-gray-500 font-medium">
            Đang tải hệ thống vai trò...
          </p>
        </div>
      ) : error ? (
        <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          <AlertTriangle className="w-10 h-10 text-red-500 mx-auto mb-3" />
          <p className="text-red-600 font-medium mb-4">{error}</p>
          <button
            onClick={fetchRoles}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-semibold"
          >
            Tải lại
          </button>
        </div>
      ) : filteredAndSortedRoles.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-xl border border-dashed border-gray-300 dark:border-gray-600 flex flex-col items-center">
          <ShieldQuestion className="w-12 h-12 text-gray-300 dark:text-gray-600 mb-4" />
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">
            Không tìm thấy vai trò phù hợp
          </h3>
          <p className="text-sm text-gray-500 mt-1 mb-5">
            Thử thay đổi bộ lọc, từ khóa tìm kiếm hoặc tạo một Access Profile
            mới.
          </p>
          <button
            onClick={() => navigate("/admin/roles/create")}
            className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition"
          >
            Tạo vai trò đầu tiên
          </button>
        </div>
      ) : (
        <>
          <p className="text-sm text-gray-500 font-medium pl-1">
            Hiển thị {filteredAndSortedRoles.length} vai trò ở trang hiện tại.
          </p>

          {viewMode === "cards" ? (
            /* 1. Card Board View */
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 mt-4">
              {filteredAndSortedRoles.map((role) => {
                const riskBadge = getRiskBadge(role.stats.riskLevel);
                return (
                  <div
                    key={role.id}
                    className="border rounded-2xl p-0 transition shadow-sm group relative flex flex-col overflow-hidden bg-white dark:bg-gray-800 border-gray-200 hover:border-blue-300 dark:border-gray-700"
                  >
                    <div className="p-5 border-b border-gray-100 dark:border-gray-700/50 flex justify-between items-start gap-4 bg-gray-50/50 dark:bg-gray-800/50">
                      <div className="flex gap-3 items-start">
                        <div className="p-2.5 rounded-xl shadow-sm bg-white text-blue-600 dark:bg-gray-900">
                          <ShieldCheck className="w-5 h-5" />
                        </div>
                        <div>
                          <h3
                            className="font-bold text-base leading-tight line-clamp-1 text-gray-900 dark:text-white cursor-pointer hover:text-blue-600 transition-colors"
                            onClick={() =>
                              navigate(`/admin/roles/edit/${role.id}`)
                            }
                            title={role.title}
                          >
                            {role.title}
                          </h3>
                          <p className="text-xs text-gray-500 mt-1 line-clamp-1">
                            {role.description || (
                              <span className="italic">Chưa có mô tả</span>
                            )}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <span
                          className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border ${riskBadge.color}`}
                        >
                          {riskBadge.label}
                        </span>
                        {role.is_system && (
                          <span className="px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-gray-100 text-gray-600 border border-gray-200 dark:bg-gray-700 dark:text-gray-300">
                            System Role
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="p-5 flex-1 space-y-4">
                      <div className="space-y-2.5 text-sm text-gray-600 dark:text-gray-300">
                        <div className="flex items-center gap-2.5">
                          <Users className="w-4 h-4 text-gray-400 shrink-0" />
                          <span>{role.users_count ?? "—"}</span>
                          <span className="text-gray-500">Người dùng</span>
                        </div>
                      </div>

                      <div className="bg-white dark:bg-gray-900 p-3 rounded-lg border border-gray-100 dark:border-gray-700 space-y-2">
                        {role.stats.moduleCount === 0 ? (
                          <div className="flex items-center gap-1.5 text-xs font-medium text-red-600 dark:text-red-400">
                            <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                            <span>Vai trò rỗng (Chưa cấp quyền)</span>
                          </div>
                        ) : (
                          <div className="flex flex-wrap gap-2">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-gray-50 text-gray-700 border border-gray-200 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 uppercase">
                              <span className="text-gray-500 font-medium">
                                Modules:
                              </span>{" "}
                              {role.stats.moduleCount}
                            </span>
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-gray-50 text-gray-700 border border-gray-200 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 uppercase">
                              <span className="text-gray-500 font-medium">
                                Actions:
                              </span>{" "}
                              {role.stats.actionCount}
                            </span>
                            {role.stats.sensitiveCount > 0 && (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200 dark:bg-purple-900/20 dark:border-purple-800 dark:text-purple-400 uppercase flex items-center gap-1">
                                <KeyRound className="w-3 h-3" />{" "}
                                {role.stats.sensitiveCount} Sensitive
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-700/50 flex items-center justify-between gap-2 bg-gray-50 dark:bg-gray-800">
                      <button
                        onClick={() => navigate(`/admin/roles/edit/${role.id}`)}
                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 text-sm font-semibold rounded shadow-sm hover:bg-gray-50 transition-colors"
                      >
                        <Settings2 className="w-4 h-4" /> Quản lý role
                      </button>

                      <div className="flex gap-1">
                        {!role.is_system && (
                          <button
                            onClick={() => handleDeleteRole(role)}
                            className="p-2 text-gray-500 hover:text-red-600 bg-white hover:bg-red-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded shadow-sm transition"
                            title="Xóa"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* 2. Compact Table View */
            <Card className="!p-0 overflow-hidden mt-4 border border-gray-200 dark:border-gray-700">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th className="px-5 py-3.5 text-left text-xs font-bold text-gray-500 uppercase">
                        Vai trò (Role)
                      </th>
                      <th className="px-5 py-3.5 text-left text-xs font-bold text-gray-500 uppercase">
                        Mức Rủi Ro
                      </th>
                      <th className="px-5 py-3.5 text-left text-xs font-bold text-gray-500 uppercase">
                        Phạm vi quyền
                      </th>
                      <th className="px-5 py-3.5 text-center text-xs font-bold text-gray-500 uppercase">
                        Users
                      </th>
                      <th className="px-5 py-3.5 text-right text-xs font-bold text-gray-500 uppercase">
                        Thao tác
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-100 dark:divide-gray-800">
                    {filteredAndSortedRoles.map((role) => {
                      const riskBadge = getRiskBadge(role.stats.riskLevel);
                      return (
                        <tr
                          key={role.id}
                          className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group"
                        >
                          <td className="px-5 py-4">
                            <div className="font-semibold text-gray-900 dark:text-white text-sm flex items-center gap-2">
                              {role.title}
                              {role.is_system && (
                                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                                  System
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-gray-500 mt-0.5 line-clamp-1 max-w-sm">
                              {role.description || "—"}
                            </div>
                          </td>
                          <td className="px-5 py-4">
                            <span
                              className={`inline-flex px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider border ${riskBadge.color}`}
                            >
                              {riskBadge.label}
                            </span>
                          </td>
                          <td className="px-5 py-4">
                            {role.stats.moduleCount === 0 ? (
                              <span className="text-xs text-red-500 font-medium flex items-center gap-1.5">
                                <ShieldX className="w-3.5 h-3.5" /> Chưa cấu
                                hình
                              </span>
                            ) : (
                              <div className="flex flex-col gap-1 text-xs text-gray-600 dark:text-gray-400">
                                <span>
                                  <strong>{role.stats.moduleCount}</strong>{" "}
                                  modules /{" "}
                                  <strong>{role.stats.actionCount}</strong>{" "}
                                  actions
                                </span>
                                {role.stats.sensitiveCount > 0 && (
                                  <span className="text-purple-600 dark:text-purple-400 font-semibold">
                                    {role.stats.sensitiveCount} sensitive
                                    actions
                                  </span>
                                )}
                              </div>
                            )}
                          </td>
                          <td className="px-5 py-4 text-center font-semibold text-gray-700 dark:text-gray-300">
                            {role.users_count ?? "—"}
                          </td>
                          <td className="px-5 py-4 text-right">
                            <div className="flex justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() =>
                                  navigate(`/admin/roles/edit/${role.id}`)
                                }
                                className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-gray-800 rounded transition-colors"
                                title="Quản lý"
                              >
                                <Settings2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() =>
                                  navigate(
                                    `/admin/roles/create?copyFrom=${role.id}`,
                                  )
                                }
                                className="p-1.5 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-gray-800 rounded transition-colors"
                                title="Nhân bản"
                              >
                                <Copy className="w-4 h-4" />
                              </button>
                              {!role.is_system && (
                                <button
                                  onClick={() => handleDeleteRole(role)}
                                  className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-gray-800 rounded transition-colors"
                                  title="Xóa"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  );
};

export default RolesPage;
