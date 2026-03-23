import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2, Edit } from "lucide-react";
import Card from "../../../components/admin/layouts/Card";
import { http } from "../../../services/http";

interface ProductTag {
  id: number;
  name: string;
  slug?: string | null;
  tagGroup: string;
  description?: string | null;
  createdAt?: string;
  updatedAt?: string;
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
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-gray-500 dark:text-gray-400" />
        <span className="ml-2 text-gray-600 dark:text-gray-400">
          Đang tải chi tiết product tag...
        </span>
      </div>
    );
  }

  if (error) {
    return (
      <p className="py-10 text-center text-red-500 dark:text-red-400">
        {error}
      </p>
    );
  }

  if (!tag) {
    return (
      <p className="py-10 text-center text-gray-500 dark:text-gray-400">
        Không tìm thấy product tag.
      </p>
    );
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
          Chi tiết product tag
        </h1>

        <div className="flex gap-3">
          <button
            onClick={() => navigate(`/admin/product-tags/edit/${id}`)}
            className="flex items-center gap-2 rounded-md bg-blue-100 px-4 py-2 text-sm font-medium text-blue-700 transition-colors hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:hover:bg-blue-900/50"
          >
            <Edit className="h-4 w-4" />
            Chỉnh sửa
          </button>

          <button
            onClick={() => navigate("/admin/product-tags")}
            className="flex items-center gap-2 rounded-md bg-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
          >
            <ArrowLeft className="h-4 w-4" />
            Quay lại
          </button>
        </div>
      </div>

      <Card>
        <div className="grid grid-cols-1 gap-6 p-2 md:grid-cols-2">
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
              <span className="mb-1 block text-sm text-gray-600 dark:text-gray-400">
                Slug:
              </span>
              <p className="font-medium text-gray-800 dark:text-gray-200">
                {tag.slug || "—"}
              </p>
            </div>

            <div>
              <span className="mb-1 block text-sm text-gray-600 dark:text-gray-400">
                Group:
              </span>
              <p className="font-medium text-gray-800 dark:text-gray-200">
                {tag.tagGroup || "—"}
              </p>
            </div>

            <div>
              <span className="mb-1 block text-sm text-gray-600 dark:text-gray-400">
                Mô tả:
              </span>
              <p className="whitespace-pre-line text-gray-800 dark:text-gray-200">
                {tag.description?.trim() ? tag.description : "—"}
              </p>
            </div>

            <div>
              <span className="mb-1 block text-sm text-gray-600 dark:text-gray-400">
                Ngày tạo:
              </span>
              <p className="text-gray-800 dark:text-gray-200">
                {tag.createdAt
                  ? new Date(tag.createdAt).toLocaleString("vi-VN")
                  : "—"}
              </p>
            </div>

            <div>
              <span className="mb-1 block text-sm text-gray-600 dark:text-gray-400">
                Cập nhật lần cuối:
              </span>
              <p className="text-gray-800 dark:text-gray-200">
                {tag.updatedAt
                  ? new Date(tag.updatedAt).toLocaleString("vi-VN")
                  : "—"}
              </p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default ProductTagDetailPage;
