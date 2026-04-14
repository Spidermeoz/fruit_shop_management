import React, { useEffect, useState, useMemo } from "react";
import {
  Loader2,
  Save,
  ArrowLeft,
  Search,
  Filter,
  Users,
  KeyRound,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  ShieldAlert,
  Columns,
  ListFilter,
  CheckSquare,
  Square,
} from "lucide-react";
import Card from "../../../components/admin/layouts/Card";
import { useNavigate } from "react-router-dom";
import { http } from "../../../services/http";
import { useAdminToast } from "../../../context/AdminToastContext";

// ==========================================
// TYPES & INTERFACES
// ==========================================
interface Role {
  id: number;
  code?: string | null;
  scope?: "system" | "branch" | "client" | null;
  level?: number | null;
  isAssignable?: boolean | null;
  isProtected?: boolean | null;
  is_assignable?: boolean | null;
  is_protected?: boolean | null;

  title: string;
  permissions: Record<string, string[]>;
}

interface Action {
  action_key: string;
  action_label: string;
}

interface PermissionGroup {
  group: string;
  key: string;
  actions: Action[];
}

type ApiOk<T> = { success: true; data: T; roles?: any; [k: string]: any };
type ApiErr = { success: false; message?: string };

// ==========================================
// CONSTANTS & HELPERS
// ==========================================
const SENSITIVE_KEYWORDS = [
  "delete",
  "remove",
  "manage",
  "permission",
  "role",
  "user",
  "admin",
  "system",
  "assign",
  "force",
];

const normalizeKey = (key: string) => key.replace(/s$/, "").toLowerCase();

const mapLegacyAction = (action: string) => {
  if (action === "view") return "read";
  if (action === "read") return "view";
  if (action === "edit") return "update";
  if (action === "update") return "edit";
  return action;
};

const isSensitive = (
  actionKey: string,
  actionLabel: string,
  groupKey: string,
) => {
  const combined = `${actionKey} ${actionLabel} ${groupKey}`.toLowerCase();
  return SENSITIVE_KEYWORDS.some((kw) => combined.includes(kw));
};

const hasPermission = (role: Role, moduleKey: string, actionKey: string) => {
  const normalizedKey = normalizeKey(moduleKey);
  const perms = role.permissions?.[normalizedKey] || [];
  return (
    perms.includes(actionKey) || perms.includes(mapLegacyAction(actionKey))
  );
};

const normalizeRoleScope = (value: unknown): "system" | "branch" | "client" => {
  if (value === "system" || value === "branch" || value === "client") {
    return value;
  }
  return "branch";
};

const normalizeRoleCode = (value: unknown) =>
  String(value ?? "")
    .trim()
    .toLowerCase();

const normalizeRoleLevel = (value: unknown) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

const normalizeBool = (value: unknown) =>
  value === true || value === 1 || value === "1";

const getScopeLabel = (scope: "system" | "branch" | "client") => {
  switch (scope) {
    case "system":
      return "SYS";
    case "branch":
      return "BR";
    case "client":
      return "CL";
  }
};

const getScopeBadgeClass = (scope: "system" | "branch" | "client") => {
  switch (scope) {
    case "system":
      return "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700";
    case "branch":
      return "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800";
    case "client":
      return "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800";
  }
};

// ==========================================
// MAIN COMPONENT
// ==========================================
const PermissionsPage: React.FC = () => {
  const navigate = useNavigate();
  const { showSuccessToast, showErrorToast } = useAdminToast();

  // --- Data States ---
  const [permissionGroups, setPermissionGroups] = useState<PermissionGroup[]>(
    [],
  );
  const [initialRoles, setInitialRoles] = useState<Role[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // --- Filter & Workspace States ---
  const [searchQuery, setSearchQuery] = useState("");
  const [groupFilter, setGroupFilter] = useState("all");
  const [compareMode, setCompareMode] = useState(false);
  const [selectedRoleIds, setSelectedRoleIds] = useState<number[]>([]);
  const [sensitiveOnly, setSensitiveOnly] = useState(false);
  const [changedOnly, setChangedOnly] = useState(false);
  const [collapsedGroups, setCollapsedGroups] = useState<
    Record<string, boolean>
  >({});

  // --- Fetch Data ---
  const fetchPermissions = async () => {
    try {
      setLoading(true);
      const res = await http<ApiOk<any> | ApiErr>(
        "GET",
        "/api/v1/admin/roles/permissions",
      );

      if ("success" in res && res.success) {
        const groups: PermissionGroup[] = res.data || [];
        const parsedRoles: Role[] = (res.roles || []).map((r: any) => {
          const raw =
            typeof r.permissions === "string"
              ? (() => {
                  try {
                    return JSON.parse(r.permissions || "{}");
                  } catch {
                    return {};
                  }
                })()
              : r.permissions || {};

          const normalized: Record<string, string[]> = {};
          for (const k of Object.keys(raw)) {
            normalized[normalizeKey(k)] = raw[k];
          }

          return {
            id: Number(r.id),
            code: normalizeRoleCode(r.code),
            scope: normalizeRoleScope(r.scope),
            level: normalizeRoleLevel(r.level),
            isAssignable: normalizeBool(r.isAssignable ?? r.is_assignable),
            isProtected: normalizeBool(r.isProtected ?? r.is_protected),
            is_assignable: normalizeBool(r.isAssignable ?? r.is_assignable),
            is_protected: normalizeBool(r.isProtected ?? r.is_protected),
            title: r.title,
            permissions: normalized,
          };
        });

        setPermissionGroups(groups);
        setInitialRoles(JSON.parse(JSON.stringify(parsedRoles))); // Snapshot copy
        setRoles(parsedRoles);
      } else {
        showErrorToast(
          (res as ApiErr).message || "Không thể tải dữ liệu phân quyền!",
        );
      }
    } catch (err: any) {
      console.error("fetchPermissions error:", err);
      showErrorToast(err?.message || "Lỗi kết nối server!");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPermissions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- Dirty Check Helpers ---
  const checkCellDirty = (
    roleId: number,
    groupKey: string,
    actionKey: string,
  ) => {
    const initRole = initialRoles.find((r) => r.id === roleId);
    const currRole = roles.find((r) => r.id === roleId);
    if (!initRole || !currRole) return false;
    return (
      hasPermission(initRole, groupKey, actionKey) !==
      hasPermission(currRole, groupKey, actionKey)
    );
  };

  const dirtySummary = useMemo(() => {
    let totalChanged = 0;
    const changedRoles = new Set<number>();
    const changedGroups = new Set<string>();

    roles.forEach((currRole) => {
      const initRole = initialRoles.find((r) => r.id === currRole.id);
      if (!initRole) return;

      permissionGroups.forEach((group) => {
        group.actions.forEach((action) => {
          if (
            hasPermission(initRole, group.key, action.action_key) !==
            hasPermission(currRole, group.key, action.action_key)
          ) {
            totalChanged++;
            changedRoles.add(currRole.id);
            changedGroups.add(group.key);
          }
        });
      });
    });

    return { totalChanged, changedRoles, changedGroups };
  }, [roles, initialRoles, permissionGroups]);

  // --- View Models (Memoized) ---
  const visibleRoles = useMemo(() => {
    let filtered = roles;
    if (compareMode) {
      filtered = roles.filter((r) => selectedRoleIds.includes(r.id));
    }
    return filtered;
  }, [roles, compareMode, selectedRoleIds]);

  const getRoleMeta = (role: Role) => ({
    code: normalizeRoleCode(role.code),
    scope: normalizeRoleScope(role.scope),
    level: normalizeRoleLevel(role.level),
    isAssignable: normalizeBool(role.isAssignable ?? role.is_assignable),
    isProtected: normalizeBool(role.isProtected ?? role.is_protected),
  });

  const visibleGroups = useMemo(() => {
    const q = searchQuery.toLowerCase();

    return permissionGroups
      .map((group) => {
        // 1. Lọc theo Group Dropdown
        if (groupFilter !== "all" && group.key !== groupFilter) return null;

        // 2. Lọc Action bên trong Group
        const filteredActions = group.actions.filter((action) => {
          // Search
          const matchesSearch =
            q === "" ||
            group.group.toLowerCase().includes(q) ||
            action.action_label.toLowerCase().includes(q) ||
            action.action_key.toLowerCase().includes(q);

          // Sensitive Only
          const matchesSensitive =
            !sensitiveOnly ||
            isSensitive(action.action_key, action.action_label, group.key);

          // Changed Only
          const matchesChanged =
            !changedOnly ||
            visibleRoles.some((r) =>
              checkCellDirty(r.id, group.key, action.action_key),
            );

          return matchesSearch && matchesSensitive && matchesChanged;
        });

        if (
          filteredActions.length > 0 ||
          (q !== "" &&
            group.group.toLowerCase().includes(q) &&
            !sensitiveOnly &&
            !changedOnly)
        ) {
          return {
            ...group,
            actions:
              filteredActions.length > 0 ? filteredActions : group.actions,
          };
        }
        return null;
      })
      .filter(Boolean) as PermissionGroup[];
  }, [
    permissionGroups,
    searchQuery,
    groupFilter,
    sensitiveOnly,
    changedOnly,
    visibleRoles,
    initialRoles,
    roles,
  ]);

  const kpiStats = useMemo(() => {
    let sensitiveCount = 0;
    permissionGroups.forEach((g) => {
      g.actions.forEach((a) => {
        if (isSensitive(a.action_key, a.action_label, g.key)) sensitiveCount++;
      });
    });

    const protectedRoles = initialRoles.filter((r) =>
      normalizeBool(r.isProtected ?? r.is_protected),
    ).length;

    const nonAssignableRoles = initialRoles.filter(
      (r) => !normalizeBool(r.isAssignable ?? r.is_assignable),
    ).length;

    return {
      totalRoles: initialRoles.length,
      totalGroups: permissionGroups.length,
      totalSensitive: sensitiveCount,
      protectedRoles,
      nonAssignableRoles,
    };
  }, [initialRoles, permissionGroups]);

  // --- Handlers ---
  const handleToggle = (
    roleId: number,
    moduleKey: string,
    actionKey: string,
  ) => {
    setRoles((prev) =>
      prev.map((role) => {
        if (role.id !== roleId) return role;
        const normalizedKey = normalizeKey(moduleKey);
        const current = role.permissions?.[normalizedKey] || [];
        const mapped = mapLegacyAction(actionKey);

        let next: string[];
        if (current.includes(actionKey) || current.includes(mapped)) {
          next = current.filter((a) => a !== actionKey && a !== mapped);
        } else {
          next = [...current, actionKey];
        }

        return {
          ...role,
          permissions: { ...role.permissions, [normalizedKey]: next },
        };
      }),
    );
  };

  const handleBulkGroupToggle = (
    roleId: number,
    group: PermissionGroup,
    targetState: boolean,
  ) => {
    setRoles((prev) =>
      prev.map((role) => {
        if (role.id !== roleId) return role;
        const normalizedKey = normalizeKey(group.key);
        const current = [...(role.permissions?.[normalizedKey] || [])];

        group.actions.forEach((action) => {
          const mapped = mapLegacyAction(action.action_key);
          const hasIt =
            current.includes(action.action_key) || current.includes(mapped);

          if (targetState && !hasIt) {
            current.push(action.action_key);
          } else if (!targetState && hasIt) {
            const idx1 = current.indexOf(action.action_key);
            if (idx1 > -1) current.splice(idx1, 1);
            const idx2 = current.indexOf(mapped);
            if (idx2 > -1) current.splice(idx2, 1);
          }
        });

        return {
          ...role,
          permissions: { ...role.permissions, [normalizedKey]: current },
        };
      }),
    );
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const res = await http<ApiOk<any> | ApiErr>(
        "PATCH",
        "/api/v1/admin/roles/permissions",
        { roles },
      );
      if ("success" in res && res.success) {
        showSuccessToast({ message: "Cập nhật phân quyền thành công!" });
        setInitialRoles(JSON.parse(JSON.stringify(roles))); // Reset dirty state
      } else {
        showErrorToast((res as ApiErr).message || "Không thể lưu thay đổi!");
      }
    } catch (err: any) {
      console.error(err);
      showErrorToast(err?.message || "Lỗi kết nối server!");
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    if (
      window.confirm(
        "Bạn có chắc chắn muốn khôi phục tất cả thay đổi chưa lưu?",
      )
    ) {
      setRoles(JSON.parse(JSON.stringify(initialRoles)));
    }
  };

  const toggleGroupCollapse = (groupKey: string) => {
    setCollapsedGroups((prev) => ({ ...prev, [groupKey]: !prev[groupKey] }));
  };

  const setAllCollapse = (collapsed: boolean) => {
    const newState: Record<string, boolean> = {};
    permissionGroups.forEach((g) => {
      newState[g.key] = collapsed;
    });
    setCollapsedGroups(newState);
  };

  const toggleCompareRole = (roleId: number) => {
    setSelectedRoleIds((prev) => {
      if (prev.includes(roleId)) return prev.filter((id) => id !== roleId);
      if (prev.length >= 3) {
        showErrorToast("Chỉ có thể so sánh tối đa 3 role cùng lúc.");
        return prev;
      }
      return [...prev, roleId];
    });
  };

  // ==========================================
  // RENDER: Loading State
  // ==========================================
  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center py-32 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-4" />
        <p className="text-gray-500 dark:text-gray-400 font-medium">
          Khởi tạo ma trận phân quyền...
        </p>
      </div>
    );
  }

  // ==========================================
  // RENDER: Workspace
  // ==========================================
  return (
    <div className="w-full pb-20 space-y-4">
      {/* A. Header Workspace */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
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
              Ma trận phân quyền
            </h1>
          </div>
          <p className="text-gray-500 dark:text-gray-400 ml-10 text-sm max-w-2xl">
            Workspace rà soát, so sánh và điều chỉnh tập trung quyền truy cập hệ
            thống.
          </p>
        </div>
      </div>

      {/* B. Overview Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 border-gray-200 dark:border-gray-700 flex items-center gap-4">
          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase text-gray-500 dark:text-gray-400">
              Tổng Role
            </p>
            <p className="text-xl font-black text-gray-900 dark:text-white">
              {kpiStats.totalRoles}
            </p>
          </div>
        </Card>
        <Card className="p-4 border-gray-200 dark:border-gray-700 flex items-center gap-4">
          <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-lg">
            <ListFilter className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase text-gray-500 dark:text-gray-400">
              Nhóm Quyền
            </p>
            <p className="text-xl font-black text-gray-900 dark:text-white">
              {kpiStats.totalGroups}
            </p>
          </div>
        </Card>
        <Card className="p-4 border-gray-200 dark:border-gray-700 flex items-center gap-4">
          <div className="p-3 bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 rounded-lg">
            <KeyRound className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase text-gray-500 dark:text-gray-400">
              Quyền nhạy cảm
            </p>
            <p className="text-xl font-black text-gray-900 dark:text-white">
              {kpiStats.totalSensitive}
            </p>
            <p className="text-[10px] text-gray-500 mt-0.5">
              {kpiStats.protectedRoles} protected /{" "}
              {kpiStats.nonAssignableRoles} locked
            </p>
          </div>
        </Card>
        <Card
          className={`p-4 transition-colors ${dirtySummary.totalChanged > 0 ? "border-amber-300 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-800" : "border-gray-200 dark:border-gray-700"}`}
        >
          <div className="flex items-center gap-4">
            <div
              className={`p-3 rounded-lg ${dirtySummary.totalChanged > 0 ? "bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400" : "bg-gray-100 text-gray-500 dark:bg-gray-800"}`}
            >
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase text-gray-500 dark:text-gray-400">
                Chưa lưu
              </p>
              <p
                className={`text-xl font-black ${dirtySummary.totalChanged > 0 ? "text-amber-700 dark:text-amber-400" : "text-gray-900 dark:text-white"}`}
              >
                {dirtySummary.totalChanged}{" "}
                <span className="text-xs font-medium">cells</span>
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* C. Control Bar */}
      <Card className="p-4 border-gray-200 dark:border-gray-700 !rounded-2xl shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row justify-between gap-4">
          {/* Lọc cơ bản */}
          <div className="flex flex-col sm:flex-row gap-3 flex-1">
            <div className="relative w-full sm:max-w-xs">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Tìm nhóm, tính năng..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div className="relative w-full sm:max-w-[200px]">
              <Filter className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <select
                value={groupFilter}
                onChange={(e) => setGroupFilter(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none appearance-none"
              >
                <option value="all">Tất cả module</option>
                {permissionGroups.map((g) => (
                  <option key={g.key} value={g.key}>
                    {g.group}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Toggles View */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setCompareMode(!compareMode)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-full border transition flex items-center gap-1.5 ${compareMode ? "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800" : "bg-white text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700"}`}
            >
              <Columns className="w-3.5 h-3.5" /> So sánh
            </button>
            <button
              onClick={() => setSensitiveOnly(!sensitiveOnly)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-full border transition flex items-center gap-1.5 ${sensitiveOnly ? "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800" : "bg-white text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700"}`}
            >
              <KeyRound className="w-3.5 h-3.5" /> Nhạy cảm
            </button>
            <button
              onClick={() => setChangedOnly(!changedOnly)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-full border transition flex items-center gap-1.5 ${changedOnly ? "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800" : "bg-white text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700"}`}
            >
              <AlertTriangle className="w-3.5 h-3.5" /> Chưa lưu
            </button>
            <div className="h-4 w-px bg-gray-300 dark:bg-gray-700 mx-1"></div>
            <button
              onClick={() => setAllCollapse(false)}
              className="px-2 py-1.5 text-xs font-semibold text-gray-500 hover:text-blue-600 transition"
            >
              Mở tất cả
            </button>
            <button
              onClick={() => setAllCollapse(true)}
              className="px-2 py-1.5 text-xs font-semibold text-gray-500 hover:text-blue-600 transition"
            >
              Thu gọn
            </button>
          </div>
        </div>

        {/* Compare Mode Selector */}
        {compareMode && (
          <div className="pt-4 border-t border-gray-100 dark:border-gray-700">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
              Chọn Role để so sánh (Tối đa 3)
            </p>
            <div className="flex flex-wrap gap-2">
              {roles.map((r) => {
                const meta = getRoleMeta(r);

                return (
                  <button
                    key={r.id}
                    onClick={() => toggleCompareRole(r.id)}
                    className={`px-3 py-1.5 rounded-md text-xs font-semibold transition border ${selectedRoleIds.includes(r.id) ? "bg-blue-600 text-white border-blue-600" : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700"}`}
                  >
                    <span className="inline-flex items-center gap-1.5">
                      {r.title}
                      {meta.isProtected && (
                        <ShieldAlert className="w-3.5 h-3.5" />
                      )}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {roles.some((r) => getRoleMeta(r).isProtected) && (
          <div className="pt-3 border-t border-gray-100 dark:border-gray-700 text-xs text-amber-700 dark:text-amber-400 flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 shrink-0" />
            Protected roles đang được khóa chỉnh sửa trực tiếp trong ma trận để
            tránh thay đổi ngoài ý muốn.
          </div>
        )}
      </Card>

      {/* D. Matrix Workspace */}
      <Card className="!p-0 border-gray-200 dark:border-gray-700 shadow-sm relative overflow-hidden">
        {compareMode && selectedRoleIds.length === 0 ? (
          <div className="py-20 text-center flex flex-col items-center bg-gray-50 dark:bg-gray-800/50">
            <Columns className="w-12 h-12 text-gray-300 dark:text-gray-600 mb-3" />
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              Chế độ so sánh đang bật
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              Vui lòng chọn 1-3 role ở bộ lọc phía trên để hiển thị ma trận.
            </p>
          </div>
        ) : visibleGroups.length === 0 ? (
          <div className="py-20 text-center">
            <p className="text-gray-500 font-medium">
              Không tìm thấy nhóm quyền phù hợp với bộ lọc hiện tại.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto custom-scrollbar max-h-[70vh]">
            <table className="min-w-full border-collapse text-sm">
              {/* === STICKY HEADER === */}
              <thead className="sticky top-0 z-20 bg-white dark:bg-gray-900 shadow-sm">
                <tr>
                  <th className="sticky left-0 z-30 bg-gray-100 dark:bg-gray-800 border-b border-r border-gray-200 dark:border-gray-700 px-5 py-4 text-left min-w-[280px]">
                    <span className="font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wider text-xs">
                      Tính năng / Nhóm quyền
                    </span>
                  </th>
                  {visibleRoles.map((role) => {
                    const meta = getRoleMeta(role);

                    return (
                      <th
                        key={role.id}
                        className="border-b border-gray-200 dark:border-gray-700 px-4 py-3 min-w-[200px] bg-gray-50 dark:bg-gray-800/50"
                      >
                        <div className="flex flex-col items-center text-center gap-1">
                          <span className="font-bold text-gray-900 dark:text-white flex items-center justify-center gap-1.5">
                            {role.title}
                            {meta.isProtected && (
                              <span
                                title="Role được bảo vệ"
                                className="inline-flex items-center"
                              >
                                <ShieldAlert className="w-3.5 h-3.5 text-amber-500" />
                              </span>
                            )}
                          </span>

                          <div className="flex flex-wrap items-center justify-center gap-1">
                            <span
                              className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase border ${getScopeBadgeClass(meta.scope)}`}
                            >
                              {getScopeLabel(meta.scope)}
                            </span>

                            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase border bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600">
                              L{meta.level}
                            </span>

                            {!meta.isAssignable && (
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase border bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600">
                                Locked
                              </span>
                            )}
                          </div>

                          {meta.code && (
                            <div className="text-[10px] text-gray-400 font-mono line-clamp-1">
                              {meta.code}
                            </div>
                          )}

                          {dirtySummary.changedRoles.has(role.id) && (
                            <span className="text-[10px] font-semibold text-amber-600 bg-amber-100 px-1.5 py-0.5 rounded dark:bg-amber-900/30 dark:text-amber-400">
                              Đã thay đổi
                            </span>
                          )}
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>

              {/* === TABLE BODY === */}
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {visibleGroups.map((group) => {
                  const isCollapsed = collapsedGroups[group.key] || false;
                  const groupDirty = dirtySummary.changedGroups.has(group.key);

                  return (
                    <React.Fragment key={group.key}>
                      {/* GROUP HEADER ROW */}
                      <tr className="bg-gray-100/80 dark:bg-gray-800/80 group">
                        <td className="sticky left-0 z-10 bg-gray-100 dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 px-4 py-3">
                          <button
                            onClick={() => toggleGroupCollapse(group.key)}
                            className="flex items-center gap-2 font-bold text-gray-800 dark:text-gray-200 w-full text-left"
                          >
                            {isCollapsed ? (
                              <ChevronRight className="w-4 h-4 text-gray-500" />
                            ) : (
                              <ChevronDown className="w-4 h-4 text-gray-500" />
                            )}
                            {group.group}
                            {groupDirty && (
                              <span
                                className="w-2 h-2 rounded-full bg-amber-500"
                                title="Có thay đổi"
                              ></span>
                            )}
                          </button>
                        </td>
                        {/* Bulk Action Per Role */}
                        {visibleRoles.map((role) => (
                          <td
                            key={role.id}
                            className="text-center py-2 px-2 border-l border-gray-100 dark:border-gray-700/50"
                          >
                            {!isCollapsed && (
                              <div className="flex justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                  onClick={() =>
                                    handleBulkGroupToggle(role.id, group, true)
                                  }
                                  disabled={getRoleMeta(role).isProtected}
                                  className="p-1 text-green-600 hover:bg-green-100 rounded dark:text-green-500 dark:hover:bg-green-900/30 disabled:opacity-40 disabled:cursor-not-allowed"
                                  title="Bật tất cả"
                                >
                                  <CheckSquare className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() =>
                                    handleBulkGroupToggle(role.id, group, false)
                                  }
                                  disabled={getRoleMeta(role).isProtected}
                                  className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-100 rounded dark:hover:bg-red-900/30 disabled:opacity-40 disabled:cursor-not-allowed"
                                  title="Tắt tất cả"
                                >
                                  <Square className="w-4 h-4" />
                                </button>
                              </div>
                            )}
                          </td>
                        ))}
                      </tr>

                      {/* ACTION ROWS */}
                      {!isCollapsed &&
                        group.actions.map((action) => {
                          const sensitive = isSensitive(
                            action.action_key,
                            action.action_label,
                            group.key,
                          );

                          return (
                            <tr
                              key={action.action_key}
                              className="hover:bg-blue-50/50 dark:hover:bg-gray-800/40 transition-colors"
                            >
                              <td className="sticky left-0 z-10 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 px-5 py-2.5">
                                <div className="flex items-center justify-between pl-4">
                                  <div>
                                    <div
                                      className={`font-medium ${sensitive ? "text-purple-700 dark:text-purple-400" : "text-gray-700 dark:text-gray-300"}`}
                                    >
                                      {action.action_label}
                                    </div>
                                    <div className="text-[10px] text-gray-400 font-mono mt-0.5">
                                      {action.action_key}
                                    </div>
                                  </div>
                                  {sensitive && (
                                    <span
                                      title="Quyền nhạy cảm"
                                      className="inline-flex items-center"
                                    >
                                      <KeyRound className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                                    </span>
                                  )}
                                </div>
                              </td>
                              {/* Checkbox Cells */}
                              {visibleRoles.map((role) => {
                                const isDirtyCell = checkCellDirty(
                                  role.id,
                                  group.key,
                                  action.action_key,
                                );
                                const checked = hasPermission(
                                  role,
                                  group.key,
                                  action.action_key,
                                );

                                return (
                                  <td
                                    key={role.id}
                                    className={`text-center py-2.5 border-l border-gray-100 dark:border-gray-800 transition-colors ${isDirtyCell ? "bg-amber-50/50 dark:bg-amber-900/10" : ""}`}
                                  >
                                    <label className="inline-flex items-center justify-center w-full h-full cursor-pointer">
                                      <input
                                        type="checkbox"
                                        checked={checked}
                                        disabled={getRoleMeta(role).isProtected}
                                        onChange={() =>
                                          handleToggle(
                                            role.id,
                                            group.key,
                                            action.action_key,
                                          )
                                        }
                                        className={`w-4 h-4 rounded border-gray-300 cursor-pointer focus:ring-2 focus:ring-offset-1 disabled:opacity-40 disabled:cursor-not-allowed ${sensitive ? "text-purple-600 focus:ring-purple-500" : "text-blue-600 focus:ring-blue-500"} dark:bg-gray-700 dark:border-gray-600 dark:ring-offset-gray-900`}
                                      />
                                    </label>
                                  </td>
                                );
                              })}
                            </tr>
                          );
                        })}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Floating Dirty Summary Bar */}
      {dirtySummary.totalChanged > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-4 bg-white dark:bg-gray-800 px-6 py-4 rounded-full shadow-2xl border border-amber-200 dark:border-amber-800/50 animate-in slide-in-from-bottom-5">
          <div className="flex items-center gap-2">
            <span className="flex h-3 w-3 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
            </span>
            <span className="text-sm font-bold text-gray-800 dark:text-gray-200">
              {dirtySummary.totalChanged} thay đổi chưa lưu
            </span>
            <span className="text-xs text-gray-500 hidden sm:inline ml-1">
              (ảnh hưởng {dirtySummary.changedRoles.size} role)
            </span>
          </div>
          <div className="w-px h-6 bg-gray-200 dark:bg-gray-700 mx-1"></div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleReset}
              disabled={saving}
              className="px-4 py-1.5 text-sm font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition disabled:opacity-50"
            >
              Reset
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-5 py-1.5 text-sm font-bold bg-blue-600 text-white hover:bg-blue-700 rounded-full shadow-md transition disabled:opacity-50 flex items-center gap-2"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              Lưu ngay
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PermissionsPage;
