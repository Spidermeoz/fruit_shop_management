import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2, Edit } from "lucide-react";
import Card from "../../../components/admin/layouts/Card";
import { http } from "../../../services/http";

interface ProductTag {
  id: number;
  name: string;
  slug?: string | null;
  group: string;
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

const ProductTagDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [tag, setTag] = useState<ProductTag | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchTagDetail = async () => {
    try {
      setLoading(true);
      setError("");

      const res = await http<ApiDetail<ProductTag>>(
        "GET",
        `/api/v1/admin/product-tags/detail/${id}`,
      );

      if (res?.data) {
        setTag(res.data);
      } else {
        setError("Không thể tải thông tin product tag.");
      }
    } catch (err: any) {
      console.error("Fetch tag detail error:", err);
      setError(err?.message || "Lỗi kết nối server.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTagDetail();
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-gray-500 dark:text-gray-400" />
        <span className="ml-2 text-gray-600 dark:text-gray-400">
          Đang tải chi tiết product tag...
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

  if (!tag) {
    return (
      <p className="text-center text-gray-500 dark:text-gray-400 py-10">
        Không tìm thấy product tag.
      </p>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
          Chi tiết product tag
        </h1>
        <div className="flex gap-3">
          <button
            onClick={() => navigate(`/admin/product-tags/edit/${id}`)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-900/30 hover:bg-blue-200 dark:hover:bg-blue-900/50 rounded-md transition-colors"
          >
            <Edit className="w-4 h-4" /> Chỉnh sửa
          </button>
          <button
            onClick={() => navigate("/admin/product-tags")}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-md transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Quay lại
          </button>
        </div>
      </div>

      <Card>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-2">
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
                {tag.name}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                #{tag.id}
              </p>
            </div>

            <div>
              <span className="block text-sm text-gray-600 dark:text-gray-400 mb-1">
                Slug:
              </span>
              <p className="text-gray-800 dark:text-gray-200 font-medium">
                {tag.slug || "—"}
              </p>
            </div>

            <div>
              <span className="block text-sm text-gray-600 dark:text-gray-400 mb-1">
                Group:
              </span>
              <p className="text-gray-800 dark:text-gray-200 font-medium">
                {tag.group || "—"}
              </p>
            </div>

            <div>
              <span className="block text-sm text-gray-600 dark:text-gray-400 mb-1">
                Vị trí hiển thị:
              </span>
              <p className="text-gray-800 dark:text-gray-200 font-medium">
                {tag.position}
              </p>
            </div>

            <div>
              <span className="block text-sm text-gray-600 dark:text-gray-400 mb-1">
                Trạng thái:
              </span>
              <span
                className={`inline-block px-3 py-1 text-xs font-semibold rounded-full ${
                  tag.status === "active"
                    ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                    : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                }`}
              >
                {tag.status === "active" ? "Hoạt động" : "Dừng hoạt động"}
              </span>
            </div>

            <div>
              <span className="block text-sm text-gray-600 dark:text-gray-400 mb-1">
                Ngày tạo:
              </span>
              <p className="text-gray-800 dark:text-gray-200">
                {new Date(tag.created_at).toLocaleString("vi-VN")}
              </p>
            </div>

            {tag.updated_at && (
              <div>
                <span className="block text-sm text-gray-600 dark:text-gray-400 mb-1">
                  Cập nhật lần cuối:
                </span>
                <p className="text-gray-800 dark:text-gray-200">
                  {new Date(tag.updated_at).toLocaleString("vi-VN")}
                </p>
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
};

export default ProductTagDetailPage;
