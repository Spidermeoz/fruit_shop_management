import React, { useEffect, useMemo, useState } from "react";
import {
  Search,
  Plus,
  Trash2,
  Loader2,
  User,
  Calendar,
  Shield,
  GitBranch,
  FolderOpen,
  FilterX,
  PhoneOff,
  ImageMinus,
  AlertTriangle,
  CheckCircle2,
  Users,
  PowerOff,
  Layers,
  RefreshCw,
} from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";

import Card from "../../../components/admin/layouts/Card";
import Pagination from "../../../components/admin/common/Pagination";
import { useAuth } from "../../../context/AuthContextAdmin";
import { useAdminToast } from "../../../context/AdminToastContext";

import {
  bulkEditUsers,
  deleteUser,
  fetchUsers,
  updateUserStatus,
} from "./shared/userApi";
import {
  formatUserDate,
  getUserBranchScopeHealth,
  getUserBranchScopeSummary,
  getPrimaryBranch,
  type UserListItem,
  type UserType,
} from "./shared/userMappers";

// ==========================================
// INTERNAL COMPONENTS & HELPERS
// ==========================================

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const statusConfig = {
    active: {
      color:
        "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800",
      label: "Hoạt động",
    },
    inactive: {
      color:
        "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-700",
      label: "Tạm dừng",
    },
    banned: {
      color:
        "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800",
      label: "Bị khóa",
    },
  };

  const config = statusConfig[status as keyof typeof statusConfig] || {
    color:
      "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 border-gray-200",
    label: status,
  };

  return (
    <span
      className={`px-2.5 py-1 inline-flex text-[10px] font-bold uppercase tracking-wider rounded-md border ${config.color}`}
    >
      {config.label}
    </span>
  );
};

const RoleBadge: React.FC<{ user: UserListItem }> = ({ user }) => {
  if (user.userType === "customer") {
    return (
      <div className="inline-flex items-center px-2 py-1 rounded text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800/50">
        <User className="w-3 h-3 mr-1" /> Khách hàng
      </div>
    );
  }
  return (
    <div className="inline-flex items-center px-2 py-1 rounded text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-100 dark:bg-purple-900/20 dark:text-purple-300 dark:border-purple-800/50">
      <Shield className="w-3 h-3 mr-1" /> {user.role?.title || "Nhân sự nội bộ"}
    </div>
  );
};

const BranchScopeCell: React.FC<{ user: UserListItem }> = ({ user }) => {
  const health = getUserBranchScopeHealth(user);
  const summary = getUserBranchScopeSummary(user);
  const primary = getPrimaryBranch(user);

  const colors: Record<string, string> = {
    "no-branches":
      "bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400",
    "missing-primary":
      "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400",
    "orphan-primary":
      "bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400",
    single:
      "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-900/20 dark:text-indigo-400",
    multi:
      "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-900/20 dark:text-indigo-400",
  };

  return (
    <div className="flex flex-col gap-1.5">
      <span
        className={`inline-flex w-fit items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide border ${colors[health] || "bg-gray-100"}`}
      >
        {summary.label}
      </span>
      {health !== "no-branches" && (
        <span className="text-xs text-gray-600 dark:text-gray-400 font-medium flex items-center gap-1">
          <GitBranch className="w-3 h-3" />
          <span className="truncate max-w-[140px]">
            {primary?.name || primary?.code || "Chưa có Primary"}
          </span>
          {user.branchIds.length > 1 && (
            <span className="font-bold text-indigo-600 dark:text-indigo-400">
              (+{user.branchIds.length - 1})
            </span>
          )}
        </span>
      )}
    </div>
  );
};

// ==========================================
// MAIN PAGE COMPONENT
// ==========================================

const UsersPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const { user: currentUser, branches: actorBranches } = useAuth();
  const { showSuccessToast, showErrorToast } = useAdminToast();

  // --- States ---
  const [rows, setRows] = useState<UserListItem[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
  const [bulkAction, setBulkAction] = useState<string>("");
  const [searchInput, setSearchInput] = useState<string>(
    searchParams.get("keyword") || "",
  );

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalCount, setTotalCount] = useState<number>(0);

  // --- Query Params Parsing ---
  const userType = (searchParams.get("type") as UserType) || "customer";
  const currentPage = Number(searchParams.get("page")) || 1;
  const statusFilter = searchParams.get("status") || "all";
  const sortOrder = searchParams.get("sort") || "";
  const selectedBranchId = searchParams.get("branchId") || "all";
  const smartFilter = searchParams.get("smartFilter") || "all"; // Frontend filter

  const visibleBranchOptions = actorBranches || [];

  // --- API Fetch ---
  const loadUsers = async () => {
    try {
      setLoading(true);
      setError("");

      const result = await fetchUsers({
        page: currentPage,
        limit: 15,
        keyword: searchParams.get("keyword") || "",
        status: statusFilter,
        sort: sortOrder,
        userType: userType,
        branchId: userType === "internal" ? selectedBranchId : undefined,
      });

      setRows(result.rows);
      setTotalCount(result.total);
      setTotalPages(Math.max(1, Math.ceil(result.total / result.limit)));
    } catch (err: any) {
      console.error("Fetch users error:", err);
      setError(err?.message || "Không thể tải danh sách người dùng.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    currentPage,
    statusFilter,
    sortOrder,
    selectedBranchId,
    userType,
    searchParams,
  ]);

  useEffect(() => {
    if (!searchParams.get("type")) {
      const params = new URLSearchParams(searchParams);
      params.set("type", "customer");
      setSearchParams(params, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  // Debounced Search
  useEffect(() => {
    const delay = setTimeout(() => {
      const params = new URLSearchParams(searchParams);
      if (searchInput.trim()) params.set("keyword", searchInput.trim());
      else params.delete("keyword");
      params.delete("page");
      setSearchParams(params);
    }, 400);
    return () => clearTimeout(delay);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput]);

  // --- Data Derivation & Filtering ---
  // Apply frontend smart filtering over the current page rows
  const displayedRows = useMemo(() => {
    if (smartFilter === "all") return rows;

    return rows.filter((r) => {
      if (userType === "customer") {
        if (smartFilter === "missing-phone") return !r.phone;
        if (smartFilter === "missing-avatar") return !r.avatar;
      } else {
        const health = getUserBranchScopeHealth(r);
        if (smartFilter === "no-branches") return health === "no-branches";
        if (smartFilter === "missing-primary")
          return health === "missing-primary" || health === "orphan-primary";
        if (smartFilter === "multi-branch") return health === "multi";
      }
      return true;
    });
  }, [rows, smartFilter, userType]);

  const selectableUsers = useMemo(
    () => displayedRows.filter((u) => u.id !== currentUser?.id),
    [displayedRows, currentUser?.id],
  );
  const safeSelectedIds = useMemo(
    () => selectedUsers.filter((id) => id !== currentUser?.id),
    [selectedUsers, currentUser?.id],
  );

  // --- Handlers ---
  const handleTypeChange = (type: UserType) => {
    const params = new URLSearchParams(); // Reset most filters on tab change
    params.set("type", type);
    setSearchParams(params);
    setSelectedUsers([]);
    setSearchInput("");
  };

  const handleFilterChange = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value === "all" || !value) params.delete(key);
    else params.set(key, value);
    params.delete("page");
    setSearchParams(params);
    setSelectedUsers([]);
  };

  const clearAllFilters = () => {
    const params = new URLSearchParams();
    params.set("type", userType);
    setSearchParams(params);
    setSearchInput("");
    setSelectedUsers([]);
  };

  const handleDeleteUser = async (id: number) => {
    if (
      !window.confirm(
        "Bạn có chắc muốn xóa tài khoản này? Thao tác này có thể ảnh hưởng đến dữ liệu liên kết.",
      )
    )
      return;
    try {
      await deleteUser(id);
      showSuccessToast({ message: "Đã xóa tài khoản thành công!" });
      loadUsers();
    } catch (err: any) {
      showErrorToast(err?.message || "Không thể xóa tài khoản.");
    }
  };

  const handleToggleStatus = async (user: UserListItem) => {
    if (user.id === currentUser?.id) return;
    const newStatus =
      user.status.toLowerCase() === "active" ? "inactive" : "active";
    try {
      await updateUserStatus(user.id, newStatus);
      showSuccessToast({
        message: `Đã ${newStatus === "active" ? "kích hoạt" : "tạm dừng"} tài khoản!`,
      });
      setRows((prev) =>
        prev.map((item) =>
          item.id === user.id ? { ...item, status: newStatus } : item,
        ),
      );
    } catch (err: any) {
      showErrorToast(err?.message || "Không thể cập nhật trạng thái.");
    }
  };

  const handleApplyBulkAction = async () => {
    if (!bulkAction || !safeSelectedIds.length) return;
    if (
      !window.confirm(
        `Thực hiện '${bulkAction}' cho ${safeSelectedIds.length} tài khoản?`,
      )
    )
      return;

    try {
      const body = {
        ids: safeSelectedIds,
        action: bulkAction === "delete" ? "delete" : "status",
        value:
          bulkAction === "delete"
            ? undefined
            : bulkAction === "activate"
              ? "active"
              : "inactive",
      } as const;

      await bulkEditUsers(body as any);
      showSuccessToast({ message: "Cập nhật hàng loạt thành công!" });
      setSelectedUsers([]);
      setBulkAction("");
      loadUsers();
    } catch (err: any) {
      showErrorToast(err?.message || "Lỗi thao tác hàng loạt.");
    }
  };

  // --- Sub-components (Cards) ---
  const SummaryCards = () => {
    const kpis =
      userType === "customer"
        ? [
            {
              id: "all",
              label: "Tổng số",
              value: totalCount,
              icon: Users,
              color: "text-blue-600",
              bg: "bg-blue-50",
            },
            {
              id: "missing-phone",
              label: "Thiếu SĐT",
              value: rows.filter((r) => !r.phone).length,
              icon: PhoneOff,
              color: "text-amber-600",
              bg: "bg-amber-50",
              isWarning: rows.filter((r) => !r.phone).length > 0,
            },
            {
              id: "missing-avatar",
              label: "Thiếu Avatar",
              value: rows.filter((r) => !r.avatar).length,
              icon: ImageMinus,
              color: "text-gray-600",
              bg: "bg-gray-100",
            },
          ]
        : [
            {
              id: "all",
              label: "Tổng nhân sự",
              value: totalCount,
              icon: Shield,
              color: "text-purple-600",
              bg: "bg-purple-50",
            },
            {
              id: "no-branches",
              label: "Thiếu Branch",
              value: rows.filter(
                (r) => getUserBranchScopeHealth(r) === "no-branches",
              ).length,
              icon: AlertTriangle,
              color: "text-red-600",
              bg: "bg-red-50",
              isWarning:
                rows.filter(
                  (r) => getUserBranchScopeHealth(r) === "no-branches",
                ).length > 0,
            },
            {
              id: "missing-primary",
              label: "Thiếu Primary",
              value: rows.filter(
                (r) =>
                  getUserBranchScopeHealth(r) === "missing-primary" ||
                  getUserBranchScopeHealth(r) === "orphan-primary",
              ).length,
              icon: GitBranch,
              color: "text-amber-600",
              bg: "bg-amber-50",
              isWarning:
                rows.filter(
                  (r) =>
                    getUserBranchScopeHealth(r) === "missing-primary" ||
                    getUserBranchScopeHealth(r) === "orphan-primary",
                ).length > 0,
            },
            {
              id: "multi-branch",
              label: "Multi-branch",
              value: rows.filter((r) => getUserBranchScopeHealth(r) === "multi")
                .length,
              icon: Layers,
              color: "text-indigo-600",
              bg: "bg-indigo-50",
            },
          ];

    return (
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3 mb-6">
        {kpis.map((kpi) => (
          <div
            key={kpi.id}
            onClick={() => handleFilterChange("smartFilter", kpi.id)}
            className={`p-4 bg-white dark:bg-gray-800 rounded-xl border flex flex-col justify-center transition-all ${
              smartFilter === kpi.id
                ? "border-blue-500 shadow-md ring-1 ring-blue-200 dark:ring-blue-900"
                : "cursor-pointer hover:border-blue-400 hover:shadow-sm border-gray-200 dark:border-gray-700"
            }`}
          >
            <div className="flex items-center gap-2 mb-2">
              <div className={`p-1.5 rounded-lg ${kpi.bg} dark:bg-gray-700`}>
                <kpi.icon
                  className={`w-4 h-4 ${kpi.color} dark:text-gray-300`}
                />
              </div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 truncate">
                {kpi.label}
              </span>
            </div>
            <div
              className={`text-2xl font-black pl-1 ${kpi.isWarning && kpi.value > 0 ? "text-red-600 dark:text-red-400" : "text-gray-900 dark:text-white"}`}
            >
              {kpi.value}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const hasActiveFilters =
    statusFilter !== "all" ||
    sortOrder !== "" ||
    selectedBranchId !== "all" ||
    smartFilter !== "all" ||
    searchInput !== "";

  return (
    <div className="w-full pb-10 space-y-6">
      {/* Tầng A: Header / Command Bar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            User Administration
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 max-w-2xl">
            Quản lý khách hàng và nhân sự nội bộ trong một hệ thống phân quyền
            và hồ sơ thống nhất.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <button
            onClick={loadUsers}
            className="p-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition"
            title="Làm mới"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
          <button
            onClick={() => navigate(`/admin/users/create?type=${userType}`)}
            className="flex items-center gap-2 px-5 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition shadow-sm ml-auto md:ml-0"
          >
            <Plus className="w-4 h-4" /> Tạo{" "}
            {userType === "customer" ? "khách hàng" : "nhân sự"}
          </button>
        </div>
      </div>

      {/* Tầng 2: Segmented Tabs */}
      <div className="flex p-1 bg-gray-100 dark:bg-gray-800/80 rounded-xl w-fit border border-gray-200 dark:border-gray-700">
        <button
          onClick={() => handleTypeChange("customer")}
          className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${userType === "customer" ? "bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm" : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"}`}
        >
          Khách hàng
        </button>
        <button
          onClick={() => handleTypeChange("internal")}
          className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${userType === "internal" ? "bg-white dark:bg-gray-700 text-purple-600 dark:text-purple-400 shadow-sm" : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"}`}
        >
          Nhân sự nội bộ
        </button>
      </div>

      {/* Tầng 3: Summary Cards */}
      <SummaryCards />

      {/* Tầng 4: Control Bar */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex flex-col lg:flex-row gap-4 items-center justify-between">
        <div className="relative w-full lg:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder={
              userType === "customer"
                ? "Tìm tên, email, SĐT..."
                : "Tìm nhân sự, email, vai trò..."
            }
            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => handleFilterChange("status", e.target.value)}
            className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 min-w-[150px]"
          >
            <option value="all">Mọi trạng thái</option>
            <option value="active">Hoạt động</option>
            <option value="inactive">Tạm dừng</option>
            <option value="banned">Bị khóa</option>
          </select>

          {userType === "internal" && visibleBranchOptions.length > 1 && (
            <select
              value={selectedBranchId}
              onChange={(e) => handleFilterChange("branchId", e.target.value)}
              className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 min-w-[180px]"
            >
              <option value="all">Tất cả chi nhánh (Scope)</option>
              {visibleBranchOptions.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name || `Branch #${b.id}`}
                </option>
              ))}
            </select>
          )}

          <select
            value={sortOrder}
            onChange={(e) => handleFilterChange("sort", e.target.value)}
            className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 min-w-[180px]"
          >
            <option value="">Mới nhất (Mặc định)</option>
            <option value="created_at:asc">Cũ nhất</option>
            <option value="full_name:asc">Tên A → Z</option>
          </select>

          {hasActiveFilters && (
            <button
              onClick={clearAllFilters}
              className="p-2 text-gray-500 hover:text-red-600 bg-gray-100 hover:bg-red-50 dark:bg-gray-700 dark:hover:bg-red-900/30 rounded-lg transition"
              title="Xóa bộ lọc"
            >
              <FilterX className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Tầng 5: Bulk Action Bar */}
      {selectedUsers.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-blue-50 dark:bg-gray-800/80 border border-blue-200 dark:border-blue-900/50 rounded-xl shadow-sm">
          <div className="flex items-center gap-2 text-sm text-blue-800 dark:text-blue-300 font-medium">
            <CheckCircle2 className="w-5 h-5" />
            Đã chọn <strong>{selectedUsers.length}</strong>{" "}
            {userType === "customer" ? "khách hàng" : "nhân sự"}
          </div>
          <div className="flex items-center gap-3">
            <select
              value={bulkAction}
              onChange={(e) => setBulkAction(e.target.value)}
              className="border border-blue-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="">-- Chọn hành động --</option>
              <option value="activate">Kích hoạt tài khoản</option>
              <option value="deactivate">Tạm dừng tài khoản</option>
              <option value="delete">Xóa tài khoản</option>
            </select>
            <button
              onClick={handleApplyBulkAction}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition"
            >
              Áp dụng
            </button>
          </div>
        </div>
      )}

      {/* Tầng 6: Unified Table */}
      <Card className="!p-0 overflow-hidden border border-gray-200 dark:border-gray-700">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 text-sm">
            <thead className="bg-gray-50 dark:bg-gray-800/80 text-gray-500 dark:text-gray-400 uppercase text-xs font-bold tracking-wider">
              <tr>
                <th className="px-5 py-3.5 w-10 text-center">
                  <input
                    type="checkbox"
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    checked={
                      selectableUsers.length > 0 &&
                      selectedUsers.length === selectableUsers.length
                    }
                    onChange={(e) =>
                      setSelectedUsers(
                        e.target.checked
                          ? selectableUsers.map((u) => u.id)
                          : [],
                      )
                    }
                  />
                </th>
                <th className="px-5 py-3.5 text-left">Người dùng</th>
                <th className="px-5 py-3.5 text-left">Thông tin liên hệ</th>
                {userType === "internal" && (
                  <th className="px-5 py-3.5 text-left">Vai trò & Scope</th>
                )}
                <th className="px-5 py-3.5 text-left">Trạng thái</th>
                <th className="px-5 py-3.5 text-left">Ngày tạo</th>
                <th className="px-5 py-3.5 text-right">Thao tác</th>
              </tr>
            </thead>

            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-100 dark:divide-gray-800">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-5 py-24 text-center">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-3" />
                    <p className="text-gray-500 font-medium">
                      Đang tải danh sách{" "}
                      {userType === "customer" ? "khách hàng" : "nhân sự"}...
                    </p>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={7} className="px-5 py-24 text-center">
                    <AlertTriangle className="w-10 h-10 text-red-500 mx-auto mb-3" />
                    <p className="text-red-600 font-medium">{error}</p>
                  </td>
                </tr>
              ) : displayedRows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-24 text-center">
                    <div className="w-16 h-16 bg-gray-50 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                      {userType === "customer" ? (
                        <Users className="w-8 h-8 text-gray-400" />
                      ) : (
                        <Shield className="w-8 h-8 text-gray-400" />
                      )}
                    </div>
                    <p className="text-lg font-bold text-gray-900 dark:text-white mb-1">
                      Không tìm thấy dữ liệu
                    </p>
                    <p className="text-gray-500">
                      Thử thay đổi từ khóa hoặc xóa các bộ lọc hiện tại.
                    </p>
                  </td>
                </tr>
              ) : (
                displayedRows.map((user) => (
                  <tr
                    key={user.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group"
                  >
                    <td className="px-5 py-3.5 text-center">
                      <input
                        type="checkbox"
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 disabled:opacity-50"
                        disabled={user.id === currentUser?.id}
                        checked={selectedUsers.includes(user.id)}
                        onChange={(e) =>
                          setSelectedUsers((prev) =>
                            e.target.checked
                              ? [...prev, user.id]
                              : prev.filter((id) => id !== user.id),
                          )
                        }
                      />
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <img
                          src={
                            user.avatar ||
                            `https://ui-avatars.com/api/?name=${encodeURIComponent(user.fullName || user.email)}&background=f3f4f6&color=4b5563`
                          }
                          alt="Avatar"
                          className="w-10 h-10 rounded-full object-cover border border-gray-200 dark:border-gray-700"
                        />
                        <div>
                          <div className="font-bold text-gray-900 dark:text-white leading-tight">
                            {user.fullName || "Chưa đặt tên"}
                          </div>
                          <div className="text-[11px] text-gray-500 font-mono mt-1">
                            ID: #{user.id}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="text-gray-900 dark:text-gray-300 font-medium">
                        {user.email}
                      </div>
                      {user.phone ? (
                        <div className="text-xs text-gray-500 mt-1">
                          {user.phone}
                        </div>
                      ) : (
                        <div className="text-[10px] font-bold text-amber-700 bg-amber-100 border border-amber-200 dark:bg-amber-900/30 dark:border-amber-800 px-1.5 py-0.5 rounded w-fit mt-1 uppercase">
                          Thiếu SĐT
                        </div>
                      )}
                    </td>

                    {userType === "internal" && (
                      <td className="px-5 py-3.5">
                        <div className="space-y-2.5">
                          <RoleBadge user={user} />
                          <BranchScopeCell user={user} />
                        </div>
                      </td>
                    )}

                    <td className="px-5 py-3.5">
                      <StatusBadge status={user.status} />
                    </td>

                    <td className="px-5 py-3.5">
                      <div className="text-gray-600 dark:text-gray-400 flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-gray-400" />
                        {formatUserDate(user.createdAt)}
                      </div>
                    </td>

                    <td className="px-5 py-3.5 text-right">
                      <div className="flex justify-end gap-2 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() =>
                            navigate(
                              `/admin/users/edit/${user.id}?type=${userType}`,
                            )
                          }
                          className="flex items-center gap-1.5 px-3 py-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded border border-transparent hover:border-blue-200 transition-colors text-xs font-semibold dark:hover:bg-gray-800"
                        >
                          <FolderOpen className="w-3.5 h-3.5" /> Workspace
                        </button>

                        <button
                          onClick={() => handleToggleStatus(user)}
                          disabled={user.id === currentUser?.id}
                          className="p-1.5 text-gray-500 hover:text-amber-600 hover:bg-amber-50 rounded border border-transparent hover:border-amber-200 transition-colors disabled:opacity-30 disabled:hover:bg-transparent dark:hover:bg-gray-800"
                          title="Đổi trạng thái"
                        >
                          <PowerOff className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => handleDeleteUser(user.id)}
                          disabled={user.id === currentUser?.id}
                          className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded border border-transparent hover:border-red-200 transition-colors disabled:opacity-30 disabled:hover:bg-transparent dark:hover:bg-gray-800"
                          title="Xóa mềm"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Tầng Phân trang */}
      {!loading && !error && totalPages > 1 && (
        <div className="flex justify-between items-center bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <span className="text-sm text-gray-500 dark:text-gray-400 hidden sm:block">
            Hiển thị{" "}
            <span className="font-bold text-gray-900 dark:text-white">
              {displayedRows.length}
            </span>{" "}
            / {totalCount} kết quả
          </span>
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={(page) => {
              const params = new URLSearchParams(searchParams);
              params.set("page", String(page));
              setSearchParams(params);
            }}
          />
        </div>
      )}
    </div>
  );
};

export default UsersPage;
