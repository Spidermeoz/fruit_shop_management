import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2, Edit } from "lucide-react";
import Card from "../../../components/layouts/Card";
import { http } from "../../../services/http";

// ===== PRODUCT TYPE =====
interface Product {
  category: any;
  id: number;
  title: string;
  description: string;
  product_category_id: number | string;
  thumbnail?: string;
  price: number;
  discount_percentage?: number;
  stock: number;
  status: "active" | "inactive" | string;
  featured?: boolean;
  position?: number;
  average_rating?: number;
  review_count?: number;
  created_at?: string;
  updated_at?: string;
}

// ===== REVIEW TYPE =====
interface Review {
  id: number;
  rating: number;
  content: string;
  createdAt?: string;
  created_at?: string;
  user?: {
    id: number;
    name: string;
    avatar?: string;
  };
  replies?: {
    id: number;
    content: string;
    createdAt?: string;
    created_at?: string;
    user?: {
      id: number;
      name: string;
      avatar?: string;
    };
  }[];
}

const ProductDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [product, setProduct] = useState<Product | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loadingProduct, setLoadingProduct] = useState<boolean>(true);
  const [loadingReviews, setLoadingReviews] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

  // ===== FETCH PRODUCT =====
  const fetchProductDetail = async () => {
    try {
      setLoadingProduct(true);
      const json = await http<any>(
        "GET",
        `/api/v1/admin/products/detail/${id}`
      );

      if (json.success && json.data) {
        setProduct(json.data as Product);
      } else {
        setError(json.message || "Không thể tải chi tiết sản phẩm.");
      }
    } catch (err) {
      console.error("fetchProductDetail error:", err);
      setError(err instanceof Error ? err.message : "Lỗi kết nối server.");
    } finally {
      setLoadingProduct(false);
    }
  };

  // ===== FETCH REVIEW =====
  const fetchReviews = async () => {
    try {
      setLoadingReviews(true);
      const json = await http<any>(
        "GET",
        `/api/v1/admin/reviews/product/${id}`
      );

      if (json.success && Array.isArray(json.data)) {
        setReviews(json.data);
      } else {
        setReviews([]);
      }
    } catch (err) {
      console.error("fetchReviews error:", err);
      setReviews([]);
    } finally {
      setLoadingReviews(false);
    }
  };

  useEffect(() => {
    fetchProductDetail();
    fetchReviews();
  }, [id]);

  // ===== LOADING =====
  if (loadingProduct) {
    return (
      <div className="flex justify-center items-center h-[70vh]">
        <Loader2 className="w-6 h-6 text-gray-500 animate-spin" />
        <span className="ml-2 text-gray-600 dark:text-gray-400">
          Đang tải...
        </span>
      </div>
    );
  }

  // ===== ERROR =====
  if (error || !product) {
    return (
      <div className="flex flex-col justify-center items-center h-[70vh] text-center">
        <p className="text-red-500 font-medium">
          {error || "Sản phẩm không tồn tại."}
        </p>
        <button
          onClick={() => navigate(-1)}
          className="mt-4 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600"
        >
          Quay lại
        </button>
      </div>
    );
  }

  return (
    <div className="p-4">
      {/* HEADER */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
          Chi tiết sản phẩm
        </h1>
        <div className="flex gap-3">
          <button
            onClick={() => navigate(`/admin/products/edit/${id}`)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-700 bg-blue-100 hover:bg-blue-200 rounded-md"
          >
            <Edit className="w-4 h-4" /> Chỉnh sửa
          </button>
          <button
            onClick={() => navigate("/admin/products")}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-md"
          >
            <ArrowLeft className="w-4 h-4" /> Quay lại
          </button>
        </div>
      </div>

      <Card>
        {/* GRID PRODUCT INFO */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* IMAGE */}
          <div className="flex justify-center md:justify-start">
            <img
              src={product.thumbnail || "https://via.placeholder.com/300"}
              alt={product.title}
              className="w-64 h-64 object-cover rounded-lg border dark:border-gray-700"
            />
          </div>

          {/* INFO */}
          <div className="space-y-3 text-gray-800 dark:text-gray-200">
            <h2 className="text-2xl font-semibold">{product.title}</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Mã sản phẩm: #{product.id}
            </p>

            <div className="grid grid-cols-2 gap-2 text-sm mt-2">
              <p>
                <span className="font-medium">Danh mục:</span>{" "}
                {product.category?.title || "—"}
              </p>
              <p>
                <span className="font-medium">Giá:</span>{" "}
                {product.price.toLocaleString()}₫
              </p>
              <p>
                <span className="font-medium">Vị trí:</span>{" "}
                {product.position ?? "—"}
              </p>
              <p>
                <span className="font-medium">Giảm giá:</span>{" "}
                {product.discount_percentage ?? 0}%
              </p>
              <p>
                <span className="font-medium">Tồn kho:</span> {product.stock}
              </p>
              <p>
                <span className="font-medium">Nổi bật:</span>{" "}
                {product.featured ? "Có" : "Không"}
              </p>
              <p>
                <span className="font-medium">Trạng thái:</span>{" "}
                {product.status}
              </p>
              <p>
                <span className="font-medium">Đánh giá TB:</span>{" "}
                {product.average_rating ?? "—"}
              </p>
              <p>
                <span className="font-medium">Lượt đánh giá:</span>{" "}
                {product.review_count ?? "—"}
              </p>
            </div>
          </div>
        </div>

        {/* DESCRIPTION */}
        <div className="mt-8">
          <h2 className="text-lg font-semibold mb-2">Mô tả sản phẩm</h2>
          <div
            className="prose dark:prose-invert max-w-none"
            dangerouslySetInnerHTML={{ __html: product.description }}
          />
        </div>

        {/* SYSTEM INFO */}
        <div className="mt-6 border-t pt-4 grid grid-cols-1 sm:grid-cols-2 text-sm gap-2">
          <p>
            <span className="font-medium">Ngày tạo:</span>{" "}
            {product.created_at
              ? new Date(product.created_at).toLocaleString()
              : "—"}
          </p>
          <p>
            <span className="font-medium">Cập nhật:</span>{" "}
            {product.updated_at
              ? new Date(product.updated_at).toLocaleString()
              : "—"}
          </p>
        </div>

        {/* ====== REVIEWS SECTION ====== */}
        <div className="mt-10">
          <h2 className="text-xl font-semibold mb-4">Đánh giá sản phẩm</h2>

          {loadingReviews ? (
            <p className="text-gray-500">Đang tải đánh giá...</p>
          ) : reviews.length === 0 ? (
            <p className="text-gray-500">Chưa có đánh giá nào.</p>
          ) : (
            <div className="space-y-6">
              {reviews.map((rv) => {
                const replied = rv.replies && rv.replies.length > 0;

                return (
                  <div key={rv.id} className="border-b pb-4">
                    {/* USER INFO */}
                    <div className="flex items-center gap-3 mb-2">
                      <img
                        src={
                          rv.user?.avatar ||
                          "https://ui-avatars.com/api/?name=U"
                        }
                        className="w-10 h-10 rounded-full"
                      />
                      <div>
                        <p className="font-semibold text-gray-800 dark:text-gray-100">
                          {rv.user?.name || "Người dùng"}
                        </p>
                        <p className="text-gray-500 text-sm">
                          {new Date(
                            rv.created_at || rv.createdAt!
                          ).toLocaleString()}
                        </p>
                      </div>
                    </div>

                    {/* RATING */}
                    <div className="flex text-yellow-500 mb-2">
                      {Array.from({ length: rv.rating || 0 }).map((_, i) => (
                        <span key={i}>★</span>
                      ))}
                      {Array.from({ length: 5 - (rv.rating || 0) }).map(
                        (_, i) => (
                          <span key={i} className="text-gray-300">
                            ★
                          </span>
                        )
                      )}
                    </div>

                    {/* CONTENT */}
                    <p className="text-gray-800 dark:text-gray-200">
                      {rv.content}
                    </p>

                    {/* EXISTING ADMIN REPLY */}
                    {replied && (
                      <div className="mt-3 ml-10 border-l-4 border-blue-600 pl-4">
                        <p className="text-blue-700 font-semibold">
                          Phản hồi của shop:
                        </p>
                        <p>{rv.replies![0].content}</p>
                        <p className="text-gray-500 text-xs">
                          {new Date(
                            rv.replies![0].created_at ||
                              rv.replies![0].createdAt!
                          ).toLocaleString()}
                        </p>
                      </div>
                    )}

                    {/* ===========================
                        FORM REPLY (CHỈ HIỆN NẾU CHƯA REPLY)
                    ============================ */}
                    {!replied && (
                      <AdminReplyForm
                        reviewId={rv.id}
                        onSuccess={fetchReviews}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

interface AdminReplyFormProps {
  reviewId: number;
  onSuccess: () => void;
}

const AdminReplyForm: React.FC<AdminReplyFormProps> = ({
  reviewId,
  onSuccess,
}) => {
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);

  const handleReply = async () => {
    if (!content.trim()) return alert("Vui lòng nhập nội dung phản hồi.");

    try {
      setLoading(true);
      const res = await http(
        "POST",
        `/api/v1/admin/reviews/${reviewId}/reply`,
        {
          content,
        }
      );

      if (res.success) {
        alert("Đã gửi phản hồi thành công!");
        setContent("");
        onSuccess(); // reload reviews
      } else {
        alert(res.message || "Không thể gửi phản hồi.");
      }
    } catch (err) {
      console.error(err);
      alert("Lỗi khi gửi phản hồi.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-3 ml-10 border-l-4 border-gray-300 pl-4">
      <p className="font-medium text-gray-700 mb-2">Phản hồi đánh giá:</p>
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={3}
        className="w-full p-2 border rounded-md bg-gray-50 dark:bg-gray-800 dark:text-white"
        placeholder="Nhập nội dung phản hồi..."
      />

      <button
        onClick={handleReply}
        disabled={loading}
        className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? "Đang gửi..." : "Gửi phản hồi"}
      </button>
    </div>
  );
};

export default ProductDetailPage;
