import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Loader2,
  Edit,
  GitBranch,
  CheckCircle2,
} from "lucide-react";
import Card from "../../../components/admin/layouts/Card";
import { http } from "../../../services/http";

interface Role {
  id: number;
  title: string;
}

interface BranchSummary {
  id: number;
  name?: string | null;
  code?: string | null;
  status?: string | null;
  is_primary?: boolean;
}

interface User {
  id: number;
  full_name?: string | null;
  email: string;
  phone?: string | null;
  avatar?: string | null;
  status: "active" | "inactive" | "banned" | string;
  role?: Role | null;
  created_at?: string;
  updated_at?: string;
  primary_branch_id?: number | null;
  branch_ids?: number[];
  branches?: BranchSummary[];
}

type ApiDetail<T> = { success: true; data: T; meta?: any };

const UserDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

  const fetchUserDetail = async () => {
    try {
      setLoading(true);
      setError("");

      const res = await http<ApiDetail<User>>(
        "GET",
        `/api/v1/admin/users/detail/${id}`,
      );
      if (res?.success && res.data) {
        setUser(res.data);
      } else {
        setError("Không thể tải thông tin người dùng.");
      }
    } catch (err: any) {
      console.error("fetchUserDetail error:", err);
      setError(err?.message || "Lỗi kết nối server hoặc API không phản hồi.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserDetail();
  }, [id]);

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
          onClick={() => navigate(-1)}
          className="mt-4 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
        >
          Quay lại
        </button>
      </div>
    );
  }

  if (!user) return null;

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

  const branches = Array.isArray(user.branches) ? user.branches : [];
  const primaryBranch =
    branches.find((b) => b.is_primary) ??
    branches.find((b) => b.id === user.primary_branch_id) ??
    null;

  const isInternalUser = !!user.role;

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
          Chi tiết người dùng
        </h1>

        <div className="flex gap-3">
          <button
            onClick={() => navigate(`/admin/users/edit/${id}`)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-900/30 hover:bg-blue-200 dark:hover:bg-blue-900/50 rounded-md transition-colors"
          >
            <Edit className="w-4 h-4" /> Chỉnh sửa
          </button>
          <button
            onClick={() => navigate("/admin/users")}
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
                    user.full_name || user.email,
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
                  {user.full_name || "—"}
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
                  {user.role?.title || "Customer"}
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
              {isInternalUser ? "Phân quyền chi nhánh" : "Phạm vi tài khoản"}
            </h2>

            {!isInternalUser ? (
              <div className="rounded-lg border border-dashed border-gray-300 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-800/40">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Đây là tài khoản khách hàng nên không gắn chi nhánh cố định.
                  Chi nhánh sẽ phát sinh theo từng đơn hàng, không phải theo tài
                  khoản.
                </p>
              </div>
            ) : branches.length === 0 ? (
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
              {user.created_at
                ? new Date(user.created_at).toLocaleString()
                : "—"}
            </p>
            <p>
              <span className="font-medium text-gray-600 dark:text-gray-400">
                Cập nhật gần nhất:
              </span>{" "}
              {user.updated_at
                ? new Date(user.updated_at).toLocaleString()
                : "—"}
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default UserDetailPage;
