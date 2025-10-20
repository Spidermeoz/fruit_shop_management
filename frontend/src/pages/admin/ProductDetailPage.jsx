import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2 } from "lucide-react";
import Card from "../../components/layouts/Card";

const ProductDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Gọi API chi tiết sản phẩm
  const fetchProductDetail = async () => {
    try {
      setLoading(true);
      setError("");

      const res = await fetch(`/api/v1/admin/products/detail/${id}`);
      const json = await res.json();

      if (json.success && json.data) {
        setProduct(json.data);
      } else {
        setError(json.message || "Không thể tải chi tiết sản phẩm.");
      }
    } catch (err) {
      console.error("fetchProductDetail error:", err);
      setError("Lỗi kết nối server hoặc API không phản hồi.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProductDetail();
  }, [id]);

  // Hiển thị loading
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

  // Hiển thị lỗi
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

  if (!product) return null;

  return (
    <div className="p-4">
      {/* Nút quay lại */}
      <button
        onClick={() => navigate("/admin/products")}
        className="flex items-center gap-2 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 mb-4"
      >
        <ArrowLeft className="w-5 h-5" />
        <span>Quay lại danh sách</span>
      </button>

      {/* Tiêu đề */}
      <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-6">
        Chi tiết sản phẩm
      </h1>

      {/* Nội dung chính */}
      <Card>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Ảnh */}
          <div className="flex justify-center md:justify-start">
            <img
              src={product.thumbnail || "https://via.placeholder.com/300"}
              alt={product.title}
              className="w-64 h-64 object-cover rounded-lg border dark:border-gray-700"
            />
          </div>

          {/* Thông tin chính */}
          <div className="space-y-3 text-gray-800 dark:text-gray-200">
            <h2 className="text-2xl font-semibold">{product.title}</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Mã sản phẩm: #{product.id}
            </p>

            <div className="grid grid-cols-2 gap-2 text-sm mt-2">
              <p>
                <span className="font-medium">Danh mục:</span>{" "}
                {product.product_category_id || "—"}
              </p>
              <p>
                <span className="font-medium">Giá:</span>{" "}
                {Number(product.price).toLocaleString()}₫
              </p>
              <p>
                <span className="font-medium">Vị trí hiển thị:</span>{" "}
                {product.position ?? "—"}
              </p>
              <p>
                <span className="font-medium">Giảm giá:</span>{" "}
                {product.discount_percentage ?? "0"}%
              </p>
              <p>
                <span className="font-medium">Tồn kho:</span> {product.stock}
              </p>
              <p>
                <span className="font-medium">Trạng thái:</span>{" "}
                <span
                  className={`px-2 py-1 rounded-full text-xs font-semibold ${
                    product.status === "active"
                      ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                      : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                  }`}
                >
                  {product.status}
                </span>
              </p>
              <p>
                <span className="font-medium">Đánh giá TB:</span>{" "}
                {product.average_rating}
              </p>
              <p>
                <span className="font-medium">Lượt đánh giá:</span>{" "}
                {product.review_count}
              </p>
            </div>
          </div>
        </div>

        {/* Mô tả */}
        <div className="mt-8">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-2">
            Mô tả sản phẩm
          </h2>
          <div
            className="prose dark:prose-invert max-w-none"
            dangerouslySetInnerHTML={{ __html: product.description }}
          />
        </div>

        {/* Thông tin hệ thống */}
        <div className="mt-6 border-t border-gray-200 dark:border-gray-700 pt-4 grid grid-cols-1 sm:grid-cols-2 text-sm gap-y-2">
          <p>
            <span className="font-medium">Người tạo:</span>{" "}
            {product.created_by_id}
          </p>
          <p>
            <span className="font-medium">Người cập nhật:</span>{" "}
            {product.updated_by_id || "—"}
          </p>
          <p>
            <span className="font-medium">Ngày tạo:</span>{" "}
            {new Date(product.created_at).toLocaleString()}
          </p>
          <p>
            <span className="font-medium">Cập nhật gần nhất:</span>{" "}
            {new Date(product.updated_at).toLocaleString()}
          </p>
        </div>
      </Card>
    </div>
  );
};

export default ProductDetailPage;
