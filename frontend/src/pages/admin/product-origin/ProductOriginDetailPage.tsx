import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2, Edit } from "lucide-react";
import Card from "../../../components/admin/layouts/Card";
import { http } from "../../../services/http";

interface Origin {
  id: number;
  title: string;
  description?: string | null;
  thumbnail?: string | null;
  slug?: string | null;
  status: string;
  position: number;
  created_at: string;
  updated_at?: string;
}

type ApiDetail<T> = {
  success: true;
  data: T;
  meta?: any;
};

const ProductOriginDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [origin, setOrigin] = useState<Origin | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchOriginDetail = async () => {
    try {
      setLoading(true);
      setError("");

      const res = await http<ApiDetail<Origin>>(
        "GET",
        `/api/v1/admin/origins/detail/${id}`,
      );

      if (res?.data) {
        setOrigin(res.data);
      } else {
        setError("Không thể tải thông tin xuất xứ.");
      }
    } catch (err: any) {
      console.error("Fetch origin detail error:", err);
      setError(err?.message || "Lỗi kết nối server.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOriginDetail();
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-gray-500 dark:text-gray-400" />
        <span className="ml-2 text-gray-600 dark:text-gray-400">
          Đang tải chi tiết xuất xứ...
        </span>
      </div>
    );
  }

  if (error) {
    return (
      <p className="text-center text-red-500 dark:text-red-400 py-10">
        {error}
      </p>
    );
  }

  if (!origin) {
    return (
      <p className="text-center text-gray-500 dark:text-gray-400 py-10">
        Không tìm thấy xuất xứ.
      </p>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
          Chi tiết xuất xứ
        </h1>
        <div className="flex gap-3">
          <button
            onClick={() => navigate(`/admin/product-origin/edit/${id}`)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-900/30 hover:bg-blue-200 dark:hover:bg-blue-900/50 rounded-md transition-colors"
          >
            <Edit className="w-4 h-4" /> Chỉnh sửa
          </button>
          <button
            onClick={() => navigate("/admin/product-origin")}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-md transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Quay lại
          </button>
        </div>
      </div>

      <Card>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-2">
          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
              Ảnh minh họa
            </label>
            {origin.thumbnail ? (
              <img
                src={origin.thumbnail}
                alt={origin.title}
                className="rounded-lg border border-gray-300 dark:border-gray-700 w-full max-w-sm object-cover shadow-sm"
              />
            ) : (
              <div className="w-full max-w-sm h-40 bg-gray-100 dark:bg-gray-800 border dark:border-gray-700 flex items-center justify-center rounded-md text-gray-500 dark:text-gray-400">
                Không có ảnh
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
                {origin.title}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                #{origin.id}
              </p>
            </div>

            <div>
              <span className="block text-sm text-gray-600 dark:text-gray-400 mb-1">
                Slug:
              </span>
              <p className="text-gray-800 dark:text-gray-200 font-medium">
                {origin.slug || "—"}
              </p>
            </div>

            <div>
              <span className="block text-sm text-gray-600 dark:text-gray-400 mb-1">
                Vị trí hiển thị:
              </span>
              <p className="text-gray-800 dark:text-gray-200 font-medium">
                {origin.position}
              </p>
            </div>

            <div>
              <span className="block text-sm text-gray-600 dark:text-gray-400 mb-1">
                Trạng thái:
              </span>
              <span
                className={`inline-block px-3 py-1 text-xs font-semibold rounded-full ${
                  origin.status === "active"
                    ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                    : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                }`}
              >
                {origin.status === "active" ? "Hoạt động" : "Dừng hoạt động"}
              </span>
            </div>

            <div>
              <span className="block text-sm text-gray-600 dark:text-gray-400 mb-1">
                Ngày tạo:
              </span>
              <p className="text-gray-800 dark:text-gray-200">
                {new Date(origin.created_at).toLocaleString("vi-VN")}
              </p>
            </div>

            {origin.updated_at && (
              <div>
                <span className="block text-sm text-gray-600 dark:text-gray-400 mb-1">
                  Cập nhật lần cuối:
                </span>
                <p className="text-gray-800 dark:text-gray-200">
                  {new Date(origin.updated_at).toLocaleString("vi-VN")}
                </p>
              </div>
            )}
          </div>
        </div>

        {origin.description && (
          <div className="mt-8 border-t dark:border-gray-700 pt-6 px-2">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">
              Mô tả
            </h3>
            <div
              className="prose max-w-none dark:prose-invert text-gray-700 dark:text-gray-300"
              dangerouslySetInnerHTML={{ __html: origin.description }}
            />
          </div>
        )}
      </Card>
    </div>
  );
};

export default ProductOriginDetailPage;
