import React, { useEffect, useMemo, useState } from "react";
import Card from "../../../components/admin/layouts/Card";
import {
  Search,
  Plus,
  Edit,
  Trash2,
  Eye,
  Loader2,
  Shield,
  User,
  Calendar,
  GitBranch,
  Users,
} from "lucide-react";
import { useSearchParams, useNavigate, useLocation } from "react-router-dom";
import Pagination from "../../../components/admin/common/Pagination";
import { http } from "../../../services/http";
import { useAuth } from "../../../context/AuthContextAdmin";
import { useAdminToast } from "../../../context/AdminToastContext";

interface BranchSummary {
  id: number;
  name?: string | null;
  code?: string | null;
  status?: string | null;
  is_primary?: boolean;
}

interface UserRow {
  id: number;
  full_name?: string | null;
  email: string;
  avatar?: string | null;
  status: "active" | "inactive" | "banned" | string;
  role?: {
    id: number;
    title: string;
  } | null;
  created_at?: string;
  primary_branch_id?: number | null;
  branch_ids?: number[];
  branches?: BranchSummary[];
}

type UserTypeTab = "internal" | "customer";

const RoleBadge: React.FC<{ user: UserRow }> = ({ user }) => {
  const isInternal = !!user.role;

  return (
    <div
      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
        isInternal
          ? "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
          : "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
      }`}
    >
      {isInternal ? (
        <>
          <Shield className="w-3 h-3 mr-1" />
          {user.role?.title || "Nhân sự nội bộ"}
        </>
      ) : (
        <>
          <User className="w-3 h-3 mr-1" />
          Customer
        </>
      )}
    </div>
  );
};

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const statusConfig = {
    active: {
      color:
        "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
      label: "Hoạt động",
    },
    inactive: {
      color:
        "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
      label: "Tạm dừng",
    },
    banned: {
      color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
      label: "Bị khóa",
    },
  };

  const config = statusConfig[status as keyof typeof statusConfig] || {
    color: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
    label: status,
  };

  return (
    <span
      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${config.color}`}
    >
      {config.label}
    </span>
  );
};

const BranchBadgeList: React.FC<{ user: UserRow }> = ({ user }) => {
  const branches = Array.isArray(user.branches) ? user.branches : [];

  if (!branches.length) {
    return <span className="text-xs text-gray-500 dark:text-gray-400">—</span>;
  }

  const primary =
    branches.find((b) => b.is_primary) ??
    branches.find((b) => b.id === user.primary_branch_id) ??
    branches[0];

  const secondaryCount = Math.max(0, branches.length - 1);

  return (
    <div className="flex flex-col gap-1">
      <div className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200 w-fit">
        <GitBranch className="w-3 h-3" />
        {primary?.name || primary?.code || `Branch #${primary?.id}`}
        <span className="opacity-80">(chính)</span>
      </div>
      {secondaryCount > 0 && (
        <span className="text-xs text-gray-500 dark:text-gray-400">
          +{secondaryCount} chi nhánh phụ
        </span>
      )}
    </div>
  );
};

const UsersPage: React.FC = () => {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
  const [bulkAction, setBulkAction] = useState<string>("");

  const [searchParams, setSearchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState<string>(
    searchParams.get("keyword") || "",
  );
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [totalPages, setTotalPages] = useState<number>(1);

  const statusFilter = searchParams.get("status") || "all";
  const currentPage = Number(searchParams.get("page")) || 1;
  const sortOrder = searchParams.get("sort") || "";

  const navigate = useNavigate();
  const location = useLocation();

  const userType: UserTypeTab = location.pathname.includes("/users/customers")
    ? "customer"
    : "internal";

  const selectedBranchId = searchParams.get("branchId") || "all";

  const { user: currentUser, branches: actorBranches } = useAuth();
  const { showSuccessToast, showErrorToast } = useAdminToast();

  const isSuperAdmin = Number(currentUser?.role_id) === 1;
  const visibleBranchOptions = isSuperAdmin ? actorBranches : actorBranches;

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError("");

      let url = `/api/v1/admin/users?page=${currentPage}&limit=10`;

      if (statusFilter !== "all") url += `&status=${statusFilter}`;
      if (userType) url += `&type=${encodeURIComponent(userType)}`;

      if (userType === "internal" && selectedBranchId !== "all") {
        url += `&branchId=${encodeURIComponent(selectedBranchId)}`;
      }

      if (sortOrder) {
        const [field, dir] = String(sortOrder).split(":");
        if (field) {
          url += `&sortBy=${encodeURIComponent(field)}`;
          if (dir) url += `&order=${encodeURIComponent(dir.toUpperCase())}`;
        }
      }

      if (searchTerm.trim()) {
        url += `&keyword=${encodeURIComponent(searchTerm.trim())}`;
      }

      const json = await http<any>("GET", url);

      if (Array.isArray(json.data)) {
        setUsers(json.data);
        const total = Number(json.meta?.total ?? 0);
        const limit = Number(json.meta?.limit ?? 10);
        setTotalPages(Math.max(1, Math.ceil(total / limit)));
      } else {
        setError("Không thể tải danh sách người dùng.");
      }
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Lỗi kết nối server.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [
    statusFilter,
    currentPage,
    sortOrder,
    searchTerm,
    userType,
    selectedBranchId,
  ]);

  useEffect(() => {
    const delay = setTimeout(() => {
      const params = new URLSearchParams(searchParams);
      if (searchTerm.trim()) params.set("keyword", searchTerm.trim());
      else params.delete("keyword");
      params.delete("page");
      setSearchParams(params);
    }, 500);
    return () => clearTimeout(delay);
  }, [searchTerm]);

  const filteredUsers = useMemo(() => {
    return users.filter(
      (u) =>
        u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (u.full_name || "")?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (u.role?.title || "")
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        (u.branches || []).some((b) =>
          `${b.name || ""} ${b.code || ""}`
            .toLowerCase()
            .includes(searchTerm.toLowerCase()),
        ),
    );
  }, [users, searchTerm]);

  const handleAddUser = () => {
    navigate(
      userType === "customer"
        ? "/admin/users/customers/create"
        : "/admin/users/internal/create",
    );
  };

  const handleEditUser = (id: number) =>
    navigate(
      userType === "customer"
        ? `/admin/users/customers/edit/${id}`
        : `/admin/users/internal/edit/${id}`,
    );

  const handleViewUser = (id: number) =>
    navigate(
      userType === "customer"
        ? `/admin/users/customers/detail/${id}`
        : `/admin/users/internal/detail/${id}`,
    );

  const handleDeleteUser = async (id: number) => {
    if (!window.confirm("Bạn có chắc muốn xóa người dùng này?")) return;

    try {
      setLoading(true);
      await http("DELETE", `/api/v1/admin/users/delete/${id}`);
      setUsers((prev) => prev.filter((u) => u.id !== id));
      showSuccessToast({ message: "Đã xóa người dùng thành công!" });
    } catch (err) {
      console.error("Delete user error:", err);
      showErrorToast(
        err instanceof Error ? err.message : "Không thể xóa người dùng!",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (user: UserRow) => {
    const newStatus =
      user.status.toLowerCase() === "active" ? "inactive" : "active";

    try {
      await http("PATCH", `/api/v1/admin/users/${user.id}/status`, {
        status: newStatus,
      });

      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, status: newStatus } : u)),
      );

      showSuccessToast({ message: "Cập nhật trạng thái thành công!" });
    } catch (err) {
      console.error(err);
      showErrorToast(
        err instanceof Error ? err.message : "Không thể cập nhật trạng thái",
      );
    }
  };

  const setTab = (type: UserTypeTab) => {
    const params = new URLSearchParams(searchParams);
    params.delete("page");
    params.delete("keyword");
    if (type === "customer") {
      params.delete("branchId");
    }

    setSelectedUsers([]);
    setBulkAction("");

    navigate({
      pathname:
        type === "customer"
          ? "/admin/users/customers"
          : "/admin/users/internal",
      search: params.toString() ? `?${params.toString()}` : "",
    });
  };

  const handleFilterChange = (status: "all" | "active" | "inactive") => {
    const params = new URLSearchParams(searchParams);
    if (status === "all") params.delete("status");
    else params.set("status", status);
    params.delete("page");
    setSearchParams(params);
    setSelectedUsers([]);
  };

  const handleBranchFilterChange = (branchId: string) => {
    const params = new URLSearchParams(searchParams);
    if (branchId === "all") params.delete("branchId");
    else params.set("branchId", branchId);
    params.delete("page");
    setSearchParams(params);
    setSelectedUsers([]);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "—";
    const date = new Date(dateString);
    return date.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const selectableUsers = filteredUsers.filter((u) => u.id !== currentUser?.id);
  const safeIds = selectedUsers.filter((id) => id !== currentUser?.id);

  const title =
    userType === "internal" ? "Quản lý nhân sự nội bộ" : "Quản lý khách hàng";

  const description =
    userType === "internal"
      ? "Danh sách staff/admin theo phạm vi chi nhánh được phép quản lý."
      : "Danh sách khách hàng hệ thống.";

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
            {title}
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {description}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto relative">
          <div className="relative w-full sm:w-64">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-8 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder={
                userType === "internal"
                  ? "Tìm kiếm nhân sự..."
                  : "Tìm kiếm khách hàng..."
              }
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                aria-label="Clear search"
              >
                ✕
              </button>
            )}
          </div>

          <button
            onClick={handleAddUser}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            {userType === "internal" ? "Thêm nhân sự" : "Thêm khách hàng"}
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 mb-4">
        <button
          onClick={() => setTab("internal")}
          className={`px-4 py-2 rounded-md text-sm font-medium border ${
            userType === "internal"
              ? "bg-blue-600 text-white border-blue-600"
              : "bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 border-gray-300 hover:bg-gray-100"
          }`}
        >
          <span className="inline-flex items-center gap-2">
            <Shield className="w-4 h-4" />
            Nhân sự nội bộ
          </span>
        </button>

        <button
          onClick={() => setTab("customer")}
          className={`px-4 py-2 rounded-md text-sm font-medium border ${
            userType === "customer"
              ? "bg-blue-600 text-white border-blue-600"
              : "bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 border-gray-300 hover:bg-gray-100"
          }`}
        >
          <span className="inline-flex items-center gap-2">
            <Users className="w-4 h-4" />
            Khách hàng
          </span>
        </button>
      </div>

      <div className="flex flex-wrap gap-3 mb-4">
        <button
          onClick={() => handleFilterChange("all")}
          className={`px-4 py-2 rounded-md text-sm font-medium border ${
            statusFilter === "all"
              ? "bg-blue-600 text-white border-blue-600"
              : "bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 border-gray-300 hover:bg-gray-100"
          }`}
        >
          Tất cả
        </button>

        <button
          onClick={() => handleFilterChange("active")}
          className={`px-4 py-2 rounded-md text-sm font-medium border ${
            statusFilter === "active"
              ? "bg-green-600 text-white border-green-600"
              : "bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 border-gray-300 hover:bg-gray-100"
          }`}
        >
          Hoạt động
        </button>

        <button
          onClick={() => handleFilterChange("inactive")}
          className={`px-4 py-2 rounded-md text-sm font-medium border ${
            statusFilter === "inactive"
              ? "bg-yellow-600 text-white border-yellow-600"
              : "bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 border-gray-300 hover:bg-gray-100"
          }`}
        >
          Tạm dừng
        </button>

        {/* Cập nhật điều kiện hiển thị filter chi nhánh ở đây */}
        {userType === "internal" &&
          visibleBranchOptions &&
          visibleBranchOptions.length > 1 && (
            <select
              value={selectedBranchId}
              onChange={(e) => handleBranchFilterChange(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Tất cả chi nhánh trong scope</option>
              {visibleBranchOptions.map((branch) => (
                <option key={branch.id} value={branch.id}>
                  {branch.name || `Branch #${branch.id}`}
                </option>
              ))}
            </select>
          )}
      </div>

      <div className="flex items-center gap-2 mb-3">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Sắp xếp:
        </label>
        <select
          value={sortOrder}
          onChange={(e) => {
            const params = new URLSearchParams(searchParams);
            if (e.target.value) params.set("sort", e.target.value);
            else params.delete("sort");
            params.delete("page");
            setSearchParams(params);
          }}
          className="border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">-- Mặc định --</option>
          <option value="created_at:desc">Mới nhất</option>
          <option value="created_at:asc">Cũ nhất</option>
          <option value="full_name:asc">Tên A → Z</option>
          <option value="full_name:desc">Tên Z → A</option>
          <option value="email:asc">Email A → Z</option>
          <option value="email:desc">Email Z → A</option>
        </select>
      </div>

      {selectedUsers.length > 0 && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 mb-4 bg-blue-50 dark:bg-gray-800 border border-blue-200 dark:border-gray-700 rounded-md">
          <p className="text-sm text-gray-700 dark:text-gray-300">
            Đã chọn <strong>{selectedUsers.length}</strong>{" "}
            {userType === "internal" ? "nhân sự" : "khách hàng"}
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <select
              value={bulkAction}
              onChange={(e) => setBulkAction(e.target.value)}
              className="border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white"
            >
              <option value="">-- Chọn hành động --</option>
              <option value="activate">Hoạt động</option>
              <option value="deactivate">Tạm dừng</option>
              <option value="delete">Xóa mềm</option>
            </select>

            <button
              onClick={async () => {
                if (!bulkAction) {
                  showErrorToast("Vui lòng chọn hành động!");
                  return;
                }

                if (
                  !window.confirm(
                    `Xác nhận thực hiện '${bulkAction}' cho ${selectedUsers.length} người dùng?`,
                  )
                )
                  return;

                try {
                  const body = {
                    ids: safeIds,
                    action: bulkAction === "delete" ? "delete" : "status",
                    value:
                      bulkAction === "delete"
                        ? undefined
                        : bulkAction === "activate"
                          ? "active"
                          : "inactive",
                  };

                  await http("PATCH", "/api/v1/admin/users/bulk-edit", body);
                  showSuccessToast({ message: "Cập nhật thành công!" });
                  setSelectedUsers([]);
                  fetchUsers();
                } catch (err) {
                  console.error(err);
                  showErrorToast(
                    err instanceof Error ? err.message : "Lỗi kết nối server!",
                  );
                }
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
            >
              Áp dụng
            </button>
          </div>
        </div>
      )}

      <Card>
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex justify-center items-center py-20">
              <Loader2 className="w-6 h-6 text-gray-500 animate-spin" />
              <span className="ml-2 text-gray-600 dark:text-gray-400">
                Đang tải dữ liệu...
              </span>
            </div>
          ) : error ? (
            <p className="text-center text-red-500 py-6">{error}</p>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-12">
              <div className="mx-auto h-12 w-12 text-gray-400">
                <User className="w-full h-full" />
              </div>
              <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
                Không tìm thấy người dùng
              </h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Thử thay đổi bộ lọc hoặc tìm kiếm với từ khóa khác.
              </p>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-4 py-3 text-center">
                    <input
                      type="checkbox"
                      checked={
                        selectedUsers.length > 0 &&
                        selectedUsers.length === selectableUsers.length
                      }
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedUsers(selectableUsers.map((u) => u.id));
                        } else {
                          setSelectedUsers([]);
                        }
                      }}
                    />
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    STT
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Người dùng
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Vai trò
                  </th>
                  {userType === "internal" && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Chi nhánh
                    </th>
                  )}
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Trạng thái
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Ngày tạo
                  </th>
                  <th className="relative px-6 py-3">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredUsers.map((user, index) => (
                  <tr
                    key={user.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    <td className="px-4 py-4 text-center">
                      <input
                        type="checkbox"
                        disabled={user.id === currentUser?.id}
                        checked={selectedUsers.includes(user.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedUsers((prev) => [...prev, user.id]);
                          } else {
                            setSelectedUsers((prev) =>
                              prev.filter((id) => id !== user.id),
                            );
                          }
                        }}
                      />
                    </td>

                    <td className="px-4 py-4 whitespace-nowrap text-center text-sm text-gray-700 dark:text-gray-300">
                      {(currentPage - 1) * 10 + index + 1}
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <img
                          className="h-10 w-10 rounded-full object-cover border-2 border-gray-200"
                          src={
                            user.avatar ||
                            `https://ui-avatars.com/api/?name=${encodeURIComponent(
                              user.full_name || user.email,
                            )}&background=random`
                          }
                          alt={user.full_name || "User Avatar"}
                        />
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {user.full_name || "—"}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            ID: #{user.id}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <RoleBadge user={user} />
                    </td>

                    {userType === "internal" && (
                      <td className="px-6 py-4 whitespace-nowrap">
                        <BranchBadgeList user={user} />
                      </td>
                    )}

                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {user.email}
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <div
                        onClick={() => {
                          if (user.id === currentUser?.id) return;
                          handleToggleStatus(user);
                        }}
                        className={
                          user.id === currentUser?.id
                            ? "opacity-50 cursor-not-allowed"
                            : "cursor-pointer"
                        }
                      >
                        <StatusBadge status={user.status} />
                      </div>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-1" />
                        {formatDate(user.created_at)}
                      </div>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleViewUser(user.id)}
                          className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                          title="Xem chi tiết"
                        >
                          <Eye className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleEditUser(user.id)}
                          className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-900 dark:hover:text-indigo-300 transition-colors"
                          title="Chỉnh sửa"
                        >
                          <Edit className="w-5 h-5" />
                        </button>
                        <button
                          disabled={user.id === currentUser?.id}
                          onClick={() => handleDeleteUser(user.id)}
                          className={`${
                            user.id === currentUser?.id
                              ? "text-gray-400 cursor-not-allowed"
                              : "text-red-600 hover:text-red-900"
                          }`}
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </Card>

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={(page) => {
          const params = new URLSearchParams(searchParams);
          if (page === 1) params.delete("page");
          else params.set("page", String(page));
          setSearchParams(params);
        }}
      />
    </div>
  );
};

export default UsersPage;
