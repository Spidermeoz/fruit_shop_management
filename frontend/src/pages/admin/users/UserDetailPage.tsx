// src/pages/admin/users/UserDetailPage.tsx
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2, Edit } from "lucide-react";
import Card from "../../../components/layouts/Card";
import { http } from "../../../services/http";

interface Role {
  id: number;
  title: string;
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
        `/api/v1/admin/users/detail/${id}`
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

  if (!user) return null;

  const getStatusClass = (status: string) => {
    switch (status.toLowerCase()) {
      case "active":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "inactive":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "banned":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
    }
  };

  return (
    <div className="p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
          Chi tiết người dùng
        </h1>

        <div className="flex gap-3">
          <button
            onClick={() => navigate(`/admin/users/edit/${id}`)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-700 bg-blue-100 hover:bg-blue-200 rounded-md"
          >
            <Edit className="w-4 h-4" /> Chỉnh sửa
          </button>
          <button
            onClick={() => navigate("/admin/users")}
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
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
              {/* Avatar */}
              <img
                src={
                  user.avatar ||
                  `https://ui-avatars.com/api/?name=${encodeURIComponent(
                    user.full_name || user.email
                  )}&background=0D8ABC&color=fff`
                }
                alt="Avatar"
                className="w-32 h-32 rounded-full object-cover border border-gray-300 dark:border-gray-700 shadow-sm"
              />

              {/* Info */}
              <div className="space-y-3 text-gray-800 dark:text-gray-200">
                <p>
                  <span className="font-medium">Họ và tên:</span>{" "}
                  {user.full_name || "—"}
                </p>
                <p>
                  <span className="font-medium">Email:</span> {user.email}
                </p>
                <p>
                  <span className="font-medium">Số điện thoại:</span>{" "}
                  {user.phone || "—"}
                </p>
                <p>
                  <span className="font-medium">Vai trò:</span>{" "}
                  {user.role?.title || "—"}
                </p>
                <p>
                  <span className="font-medium">Trạng thái:</span>{" "}
                  <span
                    className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusClass(
                      user.status
                    )}`}
                  >
                    {user.status}
                  </span>
                </p>
              </div>
            </div>
          </div>

          {/* Thông tin hệ thống */}
          <div className="mt-6 border-t border-gray-200 dark:border-gray-700 pt-4 grid grid-cols-1 sm:grid-cols-2 text-sm gap-y-2 text-gray-700 dark:text-gray-300">
            <p>
              <span className="font-medium">Ngày tạo:</span>{" "}
              {user.created_at
                ? new Date(user.created_at).toLocaleString()
                : "—"}
            </p>
            <p>
              <span className="font-medium">Cập nhật gần nhất:</span>{" "}
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
