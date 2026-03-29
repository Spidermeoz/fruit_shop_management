import React, { useEffect, useMemo, useState } from "react";
import {
  Search,
  Plus,
  Edit,
  Trash2,
  Eye,
  Loader2,
  User,
  Calendar,
} from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";

import Card from "../../../../components/admin/layouts/Card";
import Pagination from "../../../../components/admin/common/Pagination";
import { useAuth } from "../../../../context/AuthContextAdmin";
import { useAdminToast } from "../../../../context/AdminToastContext";

import {
  bulkEditUsers,
  deleteUser,
  fetchUsers,
  updateUserStatus,
} from "../shared/userApi";
import { formatUserDate, type UserListItem } from "../shared/userMappers";

const RoleBadge: React.FC = () => {
  return (
    <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
      <User className="w-3 h-3 mr-1" />
      Customer
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

const CustomersPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const { user: currentUser } = useAuth();
  const { showSuccessToast, showErrorToast } = useAdminToast();

  const [rows, setRows] = useState<UserListItem[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
  const [bulkAction, setBulkAction] = useState<string>("");
  const [searchInput, setSearchInput] = useState<string>(
    searchParams.get("keyword") || "",
  );
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [totalPages, setTotalPages] = useState<number>(1);

  const currentPage = Number(searchParams.get("page")) || 1;
  const statusFilter = searchParams.get("status") || "all";
  const sortOrder = searchParams.get("sort") || "";

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError("");

      const result = await fetchUsers({
        page: currentPage,
        limit: 10,
        keyword: searchParams.get("keyword") || "",
        status: statusFilter,
        sort: sortOrder,
        userType: "customer",
      });

      setRows(result.rows);
      setTotalPages(Math.max(1, Math.ceil(result.total / result.limit)));
    } catch (err: any) {
      console.error("fetch customers error:", err);
      setError(err?.message || "Không thể tải danh sách khách hàng.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, [currentPage, statusFilter, sortOrder, searchParams]);

  useEffect(() => {
    const delay = setTimeout(() => {
      const params = new URLSearchParams(searchParams);

      if (searchInput.trim()) {
        params.set("keyword", searchInput.trim());
      } else {
        params.delete("keyword");
      }

      params.delete("page");
      setSearchParams(params);
    }, 500);

    return () => clearTimeout(delay);
  }, [searchInput]);

  const selectableUsers = useMemo(
    () => rows.filter((u) => u.id !== currentUser?.id),
    [rows, currentUser?.id],
  );

  const safeSelectedIds = useMemo(
    () => selectedUsers.filter((id) => id !== currentUser?.id),
    [selectedUsers, currentUser?.id],
  );

  const handleFilterChange = (status: "all" | "active" | "inactive") => {
    const params = new URLSearchParams(searchParams);

    if (status === "all") params.delete("status");
    else params.set("status", status);

    params.delete("page");
    setSearchParams(params);
    setSelectedUsers([]);
  };

  const handleSortChange = (value: string) => {
    const params = new URLSearchParams(searchParams);

    if (value) params.set("sort", value);
    else params.delete("sort");

    params.delete("page");
    setSearchParams(params);
  };

  const handleAddUser = () => {
    navigate("/admin/users/customers/create");
  };

  const handleViewUser = (id: number) => {
    navigate(`/admin/users/customers/detail/${id}`);
  };

  const handleEditUser = (id: number) => {
    navigate(`/admin/users/customers/edit/${id}`);
  };

  const handleDeleteUser = async (id: number) => {
    if (!window.confirm("Bạn có chắc muốn xóa khách hàng này?")) return;

    try {
      setLoading(true);
      await deleteUser(id);
      setRows((prev) => prev.filter((u) => u.id !== id));
      showSuccessToast({ message: "Đã xóa khách hàng thành công!" });
    } catch (err: any) {
      console.error("delete customer error:", err);
      showErrorToast(err?.message || "Không thể xóa khách hàng.");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (user: UserListItem) => {
    if (user.id === currentUser?.id) return;

    const newStatus =
      user.status.toLowerCase() === "active" ? "inactive" : "active";

    try {
      await updateUserStatus(user.id, newStatus);
      setRows((prev) =>
        prev.map((item) =>
          item.id === user.id ? { ...item, status: newStatus } : item,
        ),
      );
      showSuccessToast({ message: "Cập nhật trạng thái thành công!" });
    } catch (err: any) {
      console.error("update customer status error:", err);
      showErrorToast(err?.message || "Không thể cập nhật trạng thái.");
    }
  };

  const handleApplyBulkAction = async () => {
    if (!bulkAction) {
      showErrorToast("Vui lòng chọn hành động!");
      return;
    }

    if (!safeSelectedIds.length) {
      showErrorToast("Không có khách hàng hợp lệ để thao tác.");
      return;
    }

    if (
      !window.confirm(
        `Xác nhận thực hiện '${bulkAction}' cho ${safeSelectedIds.length} khách hàng?`,
      )
    ) {
      return;
    }

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

      showSuccessToast({ message: "Cập nhật thành công!" });
      setSelectedUsers([]);
      setBulkAction("");
      await loadUsers();
    } catch (err: any) {
      console.error("bulk edit customers error:", err);
      showErrorToast(
        err?.message || "Không thể cập nhật danh sách khách hàng.",
      );
    }
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
            Quản lý khách hàng
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Danh sách khách hàng hệ thống.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto relative">
          <div className="relative w-full sm:w-64">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>

            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Tìm kiếm khách hàng..."
              className="block w-full pl-10 pr-8 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />

            {searchInput && (
              <button
                onClick={() => setSearchInput("")}
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
            Thêm khách hàng
          </button>
        </div>
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
      </div>

      <div className="flex items-center gap-2 mb-3">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Sắp xếp:
        </label>

        <select
          value={sortOrder}
          onChange={(e) => handleSortChange(e.target.value)}
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
            Đã chọn <strong>{selectedUsers.length}</strong> khách hàng
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
              onClick={handleApplyBulkAction}
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
          ) : rows.length === 0 ? (
            <div className="text-center py-12">
              <div className="mx-auto h-12 w-12 text-gray-400">
                <User className="w-full h-full" />
              </div>
              <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
                Không tìm thấy khách hàng
              </h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm.
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
                        selectableUsers.length > 0 &&
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
                {rows.map((user, index) => (
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
                              user.fullName || user.email,
                            )}&background=random`
                          }
                          alt={user.fullName || "User Avatar"}
                        />
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {user.fullName || "—"}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            ID: #{user.id}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <RoleBadge />
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {user.email}
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <div
                        onClick={() => handleToggleStatus(user)}
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
                        {formatUserDate(user.createdAt)}
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

export default CustomersPage;
