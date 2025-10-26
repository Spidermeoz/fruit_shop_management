// src/pages/admin/roles/RolesPage.tsx
import React, { useEffect, useState } from "react";
import { Plus, Edit, Trash2, Eye, Loader2, ShieldCheck } from "lucide-react";
import Card from "../../../components/layouts/Card";
import { useNavigate } from "react-router-dom";
import { http } from "../../../services/http";

interface Role {
  id: number;
  title: string;
  permissions?: object | null;
}

type ApiList<T> = { success: true; data: T[]; meta?: any };
type ApiOk = { success: true; data?: any; message?: string; meta?: any };

const RolesPage: React.FC = () => {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  const navigate = useNavigate();

  const fetchRoles = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await http<ApiList<Role>>("GET", "/api/v1/admin/roles");
      if (res.success && Array.isArray(res.data)) {
        setRoles(res.data);
      } else {
        setError("Không thể tải danh sách vai trò.");
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

  const handleAddRole = () => navigate("/admin/roles/create");
  const handleEditRole = (id: number) => navigate(`/admin/roles/edit/${id}`);
  const handleViewRole = (id: number) => navigate(`/admin/roles/detail/${id}`);
  const handlePermissions = () => navigate("/admin/roles/permissions");

  const handleDeleteRole = async (id: number) => {
    if (!window.confirm("Bạn có chắc muốn xóa vai trò này không?")) return;
    try {
      setLoading(true);
      const res = await http<ApiOk>(
        "DELETE",
        `/api/v1/admin/roles/delete/${id}`
      );
      if (res.success) {
        setRoles((prev) => prev.filter((r) => r.id !== id));
        alert("Đã xóa vai trò thành công!");
      }
    } catch (err: any) {
      console.error(err);
      alert(err?.message || "Không thể xóa vai trò.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-3">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
          Roles
        </h1>

        <div className="flex flex-wrap gap-3">
          {/* Phân quyền */}
          <button
            onClick={handlePermissions}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200 font-medium rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            <ShieldCheck className="w-5 h-5" />
            Permissions
          </button>

          {/* Thêm vai trò */}
          <button
            onClick={handleAddRole}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Add Role
          </button>
        </div>
      </div>

      <Card>
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="w-6 h-6 text-gray-500 animate-spin" />
            <span className="ml-2 text-gray-600 dark:text-gray-400">
              Đang tải vai trò...
            </span>
          </div>
        ) : error ? (
          <p className="text-center text-red-500 py-6">{error}</p>
        ) : roles.length === 0 ? (
          <p className="text-center text-gray-500 py-6">
            Không có vai trò nào.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    STT
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Title
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                {roles.map((role, index) => (
                  <tr
                    key={role.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                      {index + 1}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                      {role.title}
                    </td>
                    <td className="px-6 py-4 text-right text-sm font-medium">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleViewRole(role.id)}
                          className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                          title="View"
                        >
                          <Eye className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleEditRole(role.id)}
                          className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-900 dark:hover:text-indigo-300"
                          title="Edit"
                        >
                          <Edit className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDeleteRole(role.id)}
                          className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300"
                          title="Delete"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
};

export default RolesPage;
