import React, { useEffect, useState } from "react";
import Card from "../../../components/layouts/Card";
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
} from "lucide-react";
import { useSearchParams, useNavigate } from "react-router-dom";
import Pagination from "../../../components/common/Pagination";
import { http } from "../../../services/http";

interface User {
  id: number;
  full_name?: string | null;
  email: string;
  avatar?: string | null;
  status: "active" | "inactive" | string;
  role?: {
    id: number;
    title: string;
  } | null;
  created_at?: string;
}

// Component Badge cho vai trò
const RoleBadge: React.FC<{ user: User }> = ({ user }) => {
  const isAdmin = !!user.role;

  return (
    <div
      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
        isAdmin
          ? "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
          : "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
      }`}
    >
      {isAdmin ? (
        <>
          <Shield className="w-3 h-3 mr-1" />
          {user.role?.title || "Admin"}
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

// Component Badge cho trạng thái
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

const UsersPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
  const [bulkAction, setBulkAction] = useState<string>("");

  const [searchParams, setSearchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState<string>(
    searchParams.get("keyword") || ""
  );
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [totalPages, setTotalPages] = useState<number>(1);

  const statusFilter = searchParams.get("status") || "all";
  const currentPage = Number(searchParams.get("page")) || 1;
  const navigate = useNavigate();

  const [sortOrder, setSortOrder] = useState<string>(
    searchParams.get("sort") || ""
  );

  // 🔹 Gọi API danh sách users
  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError("");

      let url = `/api/v1/admin/users?page=${currentPage}&limit=10`;
      if (statusFilter !== "all") url += `&status=${statusFilter}`;

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, currentPage, sortOrder, searchTerm]);

  // 🔹 Tự động cập nhật URL khi tìm kiếm
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

  // 🔹 Lọc client theo keyword (phụ – vẫn ưu tiên filter từ API)
  const filteredUsers = users.filter(
    (u) =>
      u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.full_name || "")?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.role?.title || "")?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddUser = () => navigate("/admin/users/create");
  const handleEditUser = (id: number) => navigate(`/admin/users/edit/${id}`);
  const handleViewUser = (id: number) => navigate(`/admin/users/detail/${id}`);

  const handleDeleteUser = async (id: number) => {
    if (!window.confirm("Bạn có chắc muốn xóa người dùng này?")) return;

    try {
      setLoading(true);
      await http("DELETE", `/api/v1/admin/users/delete/${id}`);
      setUsers((prev) => prev.filter((u) => u.id !== id));
      alert("Đã xóa người dùng thành công!");
    } catch (err) {
      console.error("Delete user error:", err);
      alert(err instanceof Error ? err.message : "Không thể xóa người dùng!");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (user: User) => {
    const newStatus =
      user.status.toLowerCase() === "active" ? "inactive" : "active";

    try {
      await http("PATCH", `/api/v1/admin/users/${user.id}/status`, {
        status: newStatus,
      });

      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, status: newStatus } : u))
      );
    } catch (err) {
      console.error(err);
      alert(
        err instanceof Error ? err.message : "Không thể cập nhật trạng thái"
      );
    }
  };

  const handleFilterChange = (status: "all" | "active" | "inactive") => {
    // reset trang & ghi status vào URL để useEffect -> fetchUsers()
    const params = new URLSearchParams(searchParams);
    if (status === "all") params.delete("status");
    else params.set("status", status);

    params.delete("page"); // về trang 1 khi đổi filter
    setSearchParams(params);

    // Xoá lựa chọn bulk đang có (nếu muốn)
    setSelectedUsers([]);
  };

  // Format ngày tạo
  const formatDate = (dateString?: string) => {
    if (!dateString) return "—";
    const date = new Date(dateString);
    return date.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
          Quản lý người dùng
        </h1>

        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto relative">
          {/* Search */}
          <div className="relative w-full sm:w-64">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-8 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Tìm kiếm người dùng..."
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

          {/* Add User */}
          <button
            onClick={handleAddUser}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Thêm người dùng
          </button>
        </div>
      </div>

      {/* Bộ lọc trạng thái */}
      <div className="flex gap-3 mb-4">
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
      </div>

      {/* Thanh sắp xếp */}
      <div className="flex items-center gap-2 mb-3">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Sắp xếp:
        </label>
        <select
          value={sortOrder}
          onChange={(e) => {
            setSortOrder(e.target.value);
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

      {/* Thanh bulk actions khi có user được chọn */}
      {selectedUsers.length > 0 && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 mb-4 bg-blue-50 dark:bg-gray-800 border border-blue-200 dark:border-gray-700 rounded-md">
          <p className="text-sm text-gray-700 dark:text-gray-300">
            Đã chọn <strong>{selectedUsers.length}</strong> người dùng
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
                  alert("Vui lòng chọn hành động!");
                  return;
                }

                if (
                  !window.confirm(
                    `Xác nhận thực hiện '${bulkAction}' cho ${selectedUsers.length} người dùng?`
                  )
                )
                  return;

                try {
                  const body = {
                    ids: selectedUsers,
                    action: bulkAction === "delete" ? "delete" : "status",
                    value:
                      bulkAction === "delete"
                        ? undefined
                        : bulkAction === "activate"
                        ? "active"
                        : "inactive",
                  };

                  await http("PATCH", "/api/v1/admin/users/bulk-edit", body);
                  alert("Cập nhật thành công!");
                  setSelectedUsers([]);
                  fetchUsers();
                } catch (err) {
                  console.error(err);
                  alert(
                    err instanceof Error ? err.message : "Lỗi kết nối server!"
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

      {/* Users Table */}
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
                        selectedUsers.length === filteredUsers.length
                      }
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedUsers(filteredUsers.map((u) => u.id));
                        } else {
                          setSelectedUsers([]);
                        }
                      }}
                    />
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    STT
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Người dùng
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Vai trò
                  </th>
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
                    {/* checkbox */}
                    <td className="px-4 py-4 text-center">
                      <input
                        type="checkbox"
                        checked={selectedUsers.includes(user.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedUsers((prev) => [...prev, user.id]);
                          } else {
                            setSelectedUsers((prev) =>
                              prev.filter((id) => id !== user.id)
                            );
                          }
                        }}
                      />
                    </td>

                    {/* STT */}
                    <td className="px-4 py-4 whitespace-nowrap text-center text-sm text-gray-700 dark:text-gray-300">
                      {(currentPage - 1) * 10 + index + 1}
                    </td>

                    {/* User (avatar + name + id) */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <img
                          className="h-10 w-10 rounded-full object-cover border-2 border-gray-200"
                          src={
                            user.avatar ||
                            `https://ui-avatars.com/api/?name=${encodeURIComponent(
                              user.full_name || user.email
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

                    {/* Role */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <RoleBadge user={user} />
                    </td>

                    {/* Email */}
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {user.email}
                    </td>

                    {/* Status */}
                    <td className="px-6 py-4 whitespace-nowrap cursor-pointer">
                      <div
                        onClick={() => handleToggleStatus(user)}
                        title="Click để đổi trạng thái"
                      >
                        <StatusBadge status={user.status} />
                      </div>
                    </td>

                    {/* Created Date */}
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-1" />
                        {formatDate(user.created_at)}
                      </div>
                    </td>

                    {/* Actions */}
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
                          onClick={() => handleDeleteUser(user.id)}
                          className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300 transition-colors"
                          title="Xóa"
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

      {/* Pagination */}
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
