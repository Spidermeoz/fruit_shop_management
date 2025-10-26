// src/pages/admin/roles/RoleDetailPage.tsx
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2, Edit, Shield } from "lucide-react";
import Card from "../../../components/layouts/Card";
import { http } from "../../../services/http";

interface Role {
  id: number;
  title: string;
  description?: string | null;
  permissions?: any; // object | string
  created_at?: string;
  updated_at?: string;
}

type ApiDetail<T> = { success: true; data: T; meta?: any };
type ApiErr = { success: false; message?: string };

const RoleDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [role, setRole] = useState<Role | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

  const fetchRoleDetail = async () => {
    try {
      setLoading(true);
      setError("");

      const res = await http<ApiDetail<Role> | ApiErr>(
        "GET",
        `/api/v1/admin/roles/detail/${id}`
      );

      if ("success" in res && res.success && res.data) {
        const data: Role = { ...res.data };
        if (data.permissions && typeof data.permissions === "string") {
          try {
            data.permissions = JSON.parse(data.permissions);
          } catch {
            // giữ nguyên nếu parse lỗi
          }
        }
        setRole(data);
      } else {
        setError((res as ApiErr).message || "Không thể tải thông tin vai trò.");
      }
    } catch (err: any) {
      console.error("fetchRoleDetail error:", err);
      setError(err?.message || "Lỗi kết nối server hoặc API không phản hồi.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoleDetail();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[70vh]">
        <Loader2 className="w-6 h-6 text-gray-500 animate-spin" />
        <span className="ml-2 text-gray-600 dark:text-gray-400">
          Đang tải...
        </span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col justify-center items-center h-[70vh] text-center">
        <p className="text-red-500 font-medium">{error}</p>
        <button
          onClick={() => navigate(-1)}
          className="mt-4 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600"
        >
          Quay lại
        </button>
      </div>
    );
  }

  if (!role) return null;

  const permissionsObj =
    role.permissions && typeof role.permissions === "object"
      ? (role.permissions as Record<string, string[]>)
      : {};

  return (
    <div className="p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
          Chi tiết vai trò
        </h1>

        <div className="flex gap-3">
          <button
            onClick={() => navigate(`/admin/roles/edit/${id}`)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-700 bg-blue-100 hover:bg-blue-200 rounded-md"
          >
            <Edit className="w-4 h-4" /> Chỉnh sửa
          </button>
          <button
            onClick={() => navigate("/admin/roles")}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-md"
          >
            <ArrowLeft className="w-4 h-4" /> Quay lại
          </button>
        </div>
      </div>

      {/* Nội dung chính */}
      <Card>
        <div className="space-y-8">
          {/* Thông tin cơ bản */}
          <div>
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
              Thông tin cơ bản
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-gray-800 dark:text-gray-200">
              <p>
                <span className="font-medium">ID:</span> {role.id}
              </p>
              <p>
                <span className="font-medium">Tên vai trò:</span> {role.title}
              </p>
            </div>

            <div className="mt-4">
              <h3 className="text-lg font-medium text-gray-800 dark:text-white mb-2">
                Mô tả
              </h3>
              {role.description ? (
                <div
                  className="prose dark:prose-invert max-w-none"
                  dangerouslySetInnerHTML={{ __html: role.description }}
                />
              ) : (
                <p className="text-gray-500 dark:text-gray-400 italic">
                  Không có mô tả.
                </p>
              )}
            </div>
          </div>

          {/* Quyền */}
          <div>
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white flex items-center gap-2">
              <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              Quyền (Permissions)
            </h2>

            {permissionsObj && Object.keys(permissionsObj).length > 0 ? (
              <div className="mt-4 space-y-4">
                {Object.entries(permissionsObj).map(([module, actions]) => (
                  <div
                    key={module}
                    className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-800"
                  >
                    <p className="font-medium text-gray-900 dark:text-white mb-2 capitalize">
                      {module}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {Array.isArray(actions) && actions.length > 0 ? (
                        actions.map((action) => (
                          <span
                            key={action}
                            className="px-3 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200"
                          >
                            {action}
                          </span>
                        ))
                      ) : (
                        <span className="text-gray-500 dark:text-gray-400 italic text-sm">
                          Không có hành động nào
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-3 text-gray-500 dark:text-gray-400 italic">
                Không có quyền cụ thể.
              </p>
            )}
          </div>

          {/* Thông tin hệ thống */}
          <div className="mt-6 border-t border-gray-200 dark:border-gray-700 pt-4 grid grid-cols-1 sm:grid-cols-2 text-sm gap-y-2 text-gray-700 dark:text-gray-300">
            <p>
              <span className="font-medium">Ngày tạo:</span>{" "}
              {role.created_at
                ? new Date(role.created_at).toLocaleString()
                : "—"}
            </p>
            <p>
              <span className="font-medium">Cập nhật gần nhất:</span>{" "}
              {role.updated_at
                ? new Date(role.updated_at).toLocaleString()
                : "—"}
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default RoleDetailPage;
