import React, { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Loader2,
  Edit,
  GitBranch,
  CheckCircle2,
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";

import Card from "../../../../components/admin/layouts/Card";
import { useAdminToast } from "../../../../context/AdminToastContext";
import { fetchUserDetail } from "../shared/userApi";
import {
  formatUserDateTime,
  getPrimaryBranch,
  type UserListItem,
} from "../shared/userMappers";

const InternalUserDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showErrorToast } = useAdminToast();

  const [user, setUser] = useState<UserListItem | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    if (!id) return;

    (async () => {
      try {
        setLoading(true);
        setError("");

        const data = await fetchUserDetail(id);

        if (data.userType !== "internal") {
          navigate(`/admin/users/customers/detail/${id}`, { replace: true });
          return;
        }

        setUser(data);
      } catch (err: any) {
        console.error("fetch internal user detail error:", err);
        const message =
          err?.data?.message ||
          err?.message ||
          "Không thể tải thông tin nhân sự.";
        setError(message);
        showErrorToast(message);
      } finally {
        setLoading(false);
      }
    })();
  }, [id, navigate, showErrorToast]);

  const primaryBranch = useMemo(() => {
    if (!user) return null;
    return getPrimaryBranch({
      primaryBranchId: user.primaryBranchId,
      branches: user.branches,
    });
  }, [user]);

  const getStatusClass = (status: string) => {
    switch (status.toLowerCase()) {
      case "active":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
      case "inactive":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400";
      case "banned":
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[70vh]">
        <Loader2 className="w-6 h-6 text-gray-500 dark:text-gray-400 animate-spin" />
        <span className="ml-2 text-gray-600 dark:text-gray-400">
          Đang tải...
        </span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col justify-center items-center h-[70vh] text-center">
        <p className="text-red-500 dark:text-red-400 font-medium">{error}</p>
        <button
          onClick={() => navigate("/admin/users/internal")}
          className="mt-4 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
        >
          Quay lại
        </button>
      </div>
    );
  }

  if (!user) return null;

  const branches = Array.isArray(user.branches) ? user.branches : [];

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
          Chi tiết nhân sự nội bộ
        </h1>

        <div className="flex gap-3">
          <button
            onClick={() => navigate(`/admin/users/internal/edit/${user.id}`)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-900/30 hover:bg-blue-200 dark:hover:bg-blue-900/50 rounded-md transition-colors"
          >
            <Edit className="w-4 h-4" /> Chỉnh sửa
          </button>

          <button
            onClick={() => navigate("/admin/users/internal")}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-md transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Quay lại
          </button>
        </div>
      </div>

      <Card>
        <div className="space-y-8 p-2">
          <div>
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
              Thông tin cơ bản
            </h2>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
              <img
                src={
                  user.avatar ||
                  `https://ui-avatars.com/api/?name=${encodeURIComponent(
                    user.fullName || user.email,
                  )}&background=0D8ABC&color=fff`
                }
                alt="Avatar"
                className="w-32 h-32 rounded-full object-cover border border-gray-300 dark:border-gray-700 shadow-sm"
              />

              <div className="space-y-3 text-gray-800 dark:text-gray-200">
                <p>
                  <span className="font-medium text-gray-600 dark:text-gray-400">
                    Họ và tên:
                  </span>{" "}
                  {user.fullName || "—"}
                </p>

                <p>
                  <span className="font-medium text-gray-600 dark:text-gray-400">
                    Email:
                  </span>{" "}
                  {user.email}
                </p>

                <p>
                  <span className="font-medium text-gray-600 dark:text-gray-400">
                    Số điện thoại:
                  </span>{" "}
                  {user.phone || "—"}
                </p>

                <p>
                  <span className="font-medium text-gray-600 dark:text-gray-400">
                    Vai trò:
                  </span>{" "}
                  {user.role?.title || "—"}
                </p>

                <p className="flex items-center gap-2">
                  <span className="font-medium text-gray-600 dark:text-gray-400">
                    Trạng thái:
                  </span>
                  <span
                    className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusClass(
                      user.status,
                    )}`}
                  >
                    {user.status}
                  </span>
                </p>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
              Phân quyền chi nhánh
            </h2>

            {branches.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Người dùng nội bộ này chưa được gán chi nhánh nào.
              </p>
            ) : (
              <div className="space-y-3">
                {primaryBranch && (
                  <div className="rounded-lg border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20 p-4">
                    <div className="flex items-center gap-2 text-green-800 dark:text-green-300 font-semibold">
                      <CheckCircle2 className="w-4 h-4" />
                      Chi nhánh chính
                    </div>

                    <p className="mt-2 text-gray-800 dark:text-gray-100">
                      {primaryBranch.name || `Branch #${primaryBranch.id}`}
                    </p>

                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {primaryBranch.code || "—"}
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {branches.map((branch) => (
                    <div
                      key={branch.id}
                      className={`rounded-lg border p-4 ${
                        branch.is_primary
                          ? "border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/20"
                          : "border-gray-200 dark:border-gray-700"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <GitBranch className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                          <div>
                            <p className="font-medium text-gray-800 dark:text-white">
                              {branch.name || `Branch #${branch.id}`}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {branch.code || "—"}
                            </p>
                          </div>
                        </div>

                        {branch.is_primary && (
                          <span className="px-2 py-1 rounded-full text-[11px] font-semibold bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                            Chính
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Tổng số chi nhánh được gán: <strong>{branches.length}</strong>
                </p>
              </div>
            )}
          </div>

          <div className="mt-6 border-t border-gray-200 dark:border-gray-700 pt-6 grid grid-cols-1 sm:grid-cols-2 text-sm gap-y-3 text-gray-700 dark:text-gray-300">
            <p>
              <span className="font-medium text-gray-600 dark:text-gray-400">
                Ngày tạo:
              </span>{" "}
              {formatUserDateTime(user.createdAt)}
            </p>

            <p>
              <span className="font-medium text-gray-600 dark:text-gray-400">
                Cập nhật gần nhất:
              </span>{" "}
              {formatUserDateTime(user.updatedAt)}
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default InternalUserDetailPage;
