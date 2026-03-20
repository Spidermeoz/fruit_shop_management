// src/pages/ProductDetailPage.tsx
import React, { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Loader2,
  Edit,
  MessageCircle,
  ChevronDown,
} from "lucide-react";
import Card from "../../../components/admin/layouts/Card";
import { http } from "../../../services/http";
import { useAdminToast } from "../../../context/AdminToastContext";

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

// ===== REVIEW REPLY TYPE =====
interface ReviewReply {
  id: number;
  content: string;
  createdAt?: string;
  created_at?: string;
  user?: {
    id: number;
    name: string;
    avatar?: string;
  };
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
  replies?: ReviewReply[];
}

// ===== ADMIN REPLY FORM COMPONENT =====
interface AdminReplyFormProps {
  reviewId: number;
  onSuccess: () => void;
  onCancel: () => void;
}

const AdminReplyForm: React.FC<AdminReplyFormProps> = ({
  reviewId,
  onSuccess,
  onCancel,
}) => {
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const { showErrorToast } = useAdminToast();

  const handleReply = async () => {
    if (!content.trim()) {
      showErrorToast("Vui lòng nhập nội dung phản hồi.");
      return;
    }

    try {
      setLoading(true);
      const res = await http(
        "POST",
        `/api/v1/admin/reviews/${reviewId}/reply`,
        {
          content: content.trim(),
        },
      );

      if (res.success) {
        setContent("");
        onSuccess();
      } else {
        showErrorToast(res.message || "Không thể gửi phản hồi.");
      }
    } catch (err) {
      showErrorToast("Lỗi khi gửi phản hồi.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-4 ml-12 rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 to-indigo-50 p-4 shadow-sm dark:border-blue-900/40 dark:from-blue-950/30 dark:to-indigo-950/20">
      <div className="mb-3 flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-white shadow-sm">
          <MessageCircle className="h-4 w-4" />
        </div>
        <div>
          <p className="text-sm font-semibold text-blue-800 dark:text-blue-300">
            Phản hồi bình luận
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Bạn chỉ có thể phản hồi một lần cho bình luận này.
          </p>
        </div>
      </div>

      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={4}
        className="w-full rounded-xl border border-gray-200 bg-white p-3 text-sm text-gray-800 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 dark:border-gray-700 dark:bg-gray-900 dark:text-white dark:focus:border-blue-500 dark:focus:ring-blue-900/30"
        placeholder="Nhập nội dung phản hồi..."
      />

      <div className="mt-3 flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-100 disabled:opacity-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
        >
          Hủy
        </button>
        <button
          type="button"
          onClick={handleReply}
          disabled={loading}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "Đang gửi..." : "Gửi phản hồi"}
        </button>
      </div>
    </div>
  );
};

// ===== HELPER =====
const formatDateTime = (date?: string) => {
  if (!date) return "—";
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return "—";
  return parsed.toLocaleString();
};

// ===== PRODUCT DETAIL PAGE COMPONENT =====
const ProductDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [product, setProduct] = useState<Product | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loadingProduct, setLoadingProduct] = useState<boolean>(true);
  const [loadingReviews, setLoadingReviews] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

  // Số comment hiển thị ban đầu = 2, mỗi lần xem thêm = +3
  const [visibleReviewCount, setVisibleReviewCount] = useState<number>(2);

  // reviewId nào đang mở ô reply
  const [activeReplyReviewId, setActiveReplyReviewId] = useState<number | null>(
    null,
  );

  // map số lượng replies đang hiển thị theo từng comment
  const [visibleRepliesMap, setVisibleRepliesMap] = useState<
    Record<number, number>
  >({});

  // ===== FETCH PRODUCT =====
  const fetchProductDetail = async () => {
    try {
      setLoadingProduct(true);
      const json = await http<any>(
        "GET",
        `/api/v1/admin/products/detail/${id}`,
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
        `/api/v1/admin/reviews/product/${id}`,
      );

      if (json.success && Array.isArray(json.data)) {
        setReviews(json.data);

        // Reset hiển thị comment về mặc định 2 comment mới nhất sau khi reload
        setVisibleReviewCount(2);

        // Reset reply form đang mở
        setActiveReplyReviewId(null);

        // Khởi tạo mỗi comment có replies thì chỉ hiển thị 2 reply đầu
        const initialRepliesMap: Record<number, number> = {};
        json.data.forEach((review: Review) => {
          if (Array.isArray(review.replies) && review.replies.length > 0) {
            initialRepliesMap[review.id] = 2;
          }
        });
        setVisibleRepliesMap(initialRepliesMap);
      } else {
        setReviews([]);
        setVisibleRepliesMap({});
      }
    } catch (err) {
      console.error("fetchReviews error:", err);
      setReviews([]);
      setVisibleRepliesMap({});
    } finally {
      setLoadingReviews(false);
    }
  };

  useEffect(() => {
    fetchProductDetail();
    fetchReviews();
  }, [id]);

  const sortedReviews = useMemo(() => {
    return [...reviews].sort((a, b) => {
      const timeA = new Date(a.created_at || a.createdAt || 0).getTime();
      const timeB = new Date(b.created_at || b.createdAt || 0).getTime();
      return timeB - timeA;
    });
  }, [reviews]);

  const visibleReviews = sortedReviews.slice(0, visibleReviewCount);
  const hasMoreReviews = visibleReviewCount < sortedReviews.length;

  const handleShowMoreReviews = () => {
    setVisibleReviewCount((prev) => prev + 3);
  };

  const handleShowMoreReplies = (reviewId: number) => {
    setVisibleRepliesMap((prev) => ({
      ...prev,
      [reviewId]: (prev[reviewId] || 2) + 3,
    }));
  };

  // ===== LOADING =====
  if (loadingProduct) {
    return (
      <div className="flex h-[70vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-gray-500 dark:text-gray-400" />
        <span className="ml-2 text-gray-600 dark:text-gray-400">
          Đang tải...
        </span>
      </div>
    );
  }

  // ===== ERROR =====
  if (error || !product) {
    return (
      <div className="flex h-[70vh] flex-col items-center justify-center text-center">
        <p className="font-medium text-red-500 dark:text-red-400">
          {error || "Sản phẩm không tồn tại."}
        </p>
        <button
          onClick={() => navigate(-1)}
          className="mt-4 rounded-md bg-gray-200 px-4 py-2 text-gray-800 transition-colors hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
        >
          Quay lại
        </button>
      </div>
    );
  }

  return (
    <div className="p-4">
      {/* HEADER */}
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
          Chi tiết sản phẩm
        </h1>
        <div className="flex gap-3">
          <button
            onClick={() => navigate(`/admin/products/edit/${id}`)}
            className="flex items-center gap-2 rounded-md bg-blue-100 px-4 py-2 text-sm font-medium text-blue-700 transition-colors hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:hover:bg-blue-900/50"
          >
            <Edit className="h-4 w-4" /> Chỉnh sửa
          </button>
          <button
            onClick={() => navigate("/admin/products")}
            className="flex items-center gap-2 rounded-md bg-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
          >
            <ArrowLeft className="h-4 w-4" /> Quay lại
          </button>
        </div>
      </div>

      <Card>
        {/* GRID PRODUCT INFO */}
        <div className="grid grid-cols-1 gap-6 p-2 md:grid-cols-2">
          {/* IMAGE */}
          <div className="flex justify-center md:justify-start">
            <img
              src={product.thumbnail || "https://via.placeholder.com/300"}
              alt={product.title}
              className="h-64 w-64 rounded-lg border border-gray-200 object-cover shadow-sm dark:border-gray-700"
            />
          </div>

          {/* INFO */}
          <div className="space-y-3 text-gray-800 dark:text-gray-200">
            <h2 className="text-2xl font-semibold dark:text-white">
              {product.title}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Mã sản phẩm: #{product.id}
            </p>

            <div className="mt-4 grid grid-cols-2 gap-x-2 gap-y-3 text-sm">
              <p>
                <span className="font-medium text-gray-600 dark:text-gray-400">
                  Danh mục:
                </span>{" "}
                {product.category?.title || "—"}
              </p>
              <p>
                <span className="font-medium text-gray-600 dark:text-gray-400">
                  Giá:
                </span>{" "}
                <span className="font-semibold text-green-600 dark:text-green-400">
                  {product.price.toLocaleString()}₫
                </span>
              </p>
              <p>
                <span className="font-medium text-gray-600 dark:text-gray-400">
                  Vị trí:
                </span>{" "}
                {product.position ?? "—"}
              </p>
              <p>
                <span className="font-medium text-gray-600 dark:text-gray-400">
                  Giảm giá:
                </span>{" "}
                {product.discount_percentage ?? 0}%
              </p>
              <p>
                <span className="font-medium text-gray-600 dark:text-gray-400">
                  Tồn kho:
                </span>{" "}
                {product.stock}
              </p>
              <p>
                <span className="font-medium text-gray-600 dark:text-gray-400">
                  Nổi bật:
                </span>{" "}
                {product.featured ? "Có" : "Không"}
              </p>
              <p className="flex items-center gap-2">
                <span className="font-medium text-gray-600 dark:text-gray-400">
                  Trạng thái:
                </span>{" "}
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                    product.status === "active"
                      ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                      : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                  }`}
                >
                  {product.status === "active" ? "Hoạt động" : "Dừng"}
                </span>
              </p>
              <p>
                <span className="font-medium text-gray-600 dark:text-gray-400">
                  Đánh giá TB:
                </span>{" "}
                {product.average_rating ?? "—"}
              </p>
              <p>
                <span className="font-medium text-gray-600 dark:text-gray-400">
                  Lượt đánh giá:
                </span>{" "}
                {product.review_count ?? "—"}
              </p>
            </div>
          </div>
        </div>

        {/* DESCRIPTION */}
        <div className="mt-8 border-t border-gray-200 px-2 pt-6 dark:border-gray-700">
          <h2 className="mb-4 text-lg font-semibold dark:text-white">
            Mô tả sản phẩm
          </h2>
          <div
            className="prose max-w-none text-gray-700 dark:prose-invert dark:text-gray-300"
            dangerouslySetInnerHTML={{ __html: product.description }}
          />
        </div>

        {/* SYSTEM INFO */}
        <div className="mt-8 grid grid-cols-1 gap-3 border-t border-gray-200 px-2 pt-6 text-sm text-gray-700 dark:border-gray-700 dark:text-gray-400 sm:grid-cols-2">
          <p>
            <span className="font-medium text-gray-600 dark:text-gray-300">
              Ngày tạo:
            </span>{" "}
            {product.created_at
              ? new Date(product.created_at).toLocaleString()
              : "—"}
          </p>
          <p>
            <span className="font-medium text-gray-600 dark:text-gray-300">
              Cập nhật:
            </span>{" "}
            {product.updated_at
              ? new Date(product.updated_at).toLocaleString()
              : "—"}
          </p>
        </div>

        {/* ====== REVIEWS SECTION ====== */}
        <div className="mt-10 px-2">
          <h2 className="mb-6 border-b pb-2 text-xl font-semibold dark:border-gray-700 dark:text-white">
            Đánh giá sản phẩm
          </h2>

          {loadingReviews ? (
            <p className="text-gray-500 dark:text-gray-400">
              Đang tải đánh giá...
            </p>
          ) : reviews.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400">
              Chưa có đánh giá nào.
            </p>
          ) : (
            <div className="space-y-6">
              {visibleReviews.map((rv) => {
                const allReplies = Array.isArray(rv.replies)
                  ? [...rv.replies].sort((a, b) => {
                      const timeA = new Date(
                        a.created_at || a.createdAt || 0,
                      ).getTime();
                      const timeB = new Date(
                        b.created_at || b.createdAt || 0,
                      ).getTime();
                      return timeB - timeA;
                    })
                  : [];

                const replied = allReplies.length > 0;
                const visibleReplyCount = visibleRepliesMap[rv.id] || 2;
                const visibleReplies = allReplies.slice(0, visibleReplyCount);
                const hasMoreReplies = visibleReplyCount < allReplies.length;
                const isReplyFormOpen = activeReplyReviewId === rv.id;

                return (
                  <div
                    key={rv.id}
                    className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:shadow-md dark:border-gray-700 dark:bg-gray-900/60"
                  >
                    {/* USER INFO */}
                    <div className="mb-3 flex items-start gap-3">
                      <img
                        src={
                          rv.user?.avatar ||
                          "https://ui-avatars.com/api/?name=U"
                        }
                        alt={rv.user?.name || "Người dùng"}
                        className="h-11 w-11 rounded-full border object-cover dark:border-gray-600"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                          <p className="font-semibold text-gray-800 dark:text-gray-100">
                            {rv.user?.name || "Người dùng"}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {formatDateTime(rv.created_at || rv.createdAt)}
                          </p>
                        </div>

                        {/* RATING */}
                        <div className="mt-1 flex text-sm text-yellow-500">
                          {Array.from({ length: rv.rating || 0 }).map(
                            (_, i) => (
                              <span key={i}>★</span>
                            ),
                          )}
                          {Array.from({ length: 5 - (rv.rating || 0) }).map(
                            (_, i) => (
                              <span
                                key={i}
                                className="text-gray-300 dark:text-gray-600"
                              >
                                ★
                              </span>
                            ),
                          )}
                        </div>
                      </div>
                    </div>

                    {/* CONTENT */}
                    <div className="pl-14">
                      <p className="text-sm leading-7 text-gray-800 dark:text-gray-300">
                        {rv.content}
                      </p>

                      {/* ACTIONS */}
                      <div className="mt-3 flex items-center gap-4">
                        {!replied && (
                          <button
                            type="button"
                            onClick={() =>
                              setActiveReplyReviewId((prev) =>
                                prev === rv.id ? null : rv.id,
                              )
                            }
                            className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 transition hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                          >
                            <MessageCircle className="h-4 w-4" />
                            {isReplyFormOpen ? "Ẩn phản hồi" : "Phản hồi"}
                          </button>
                        )}
                      </div>

                      {/* REPLY FORM: chỉ hiện khi chưa replied và bấm nút phản hồi */}
                      {!replied && isReplyFormOpen && (
                        <AdminReplyForm
                          reviewId={rv.id}
                          onSuccess={() => fetchReviews()}
                          onCancel={() => setActiveReplyReviewId(null)}
                        />
                      )}

                      {/* EXISTING REPLIES */}
                      {replied && (
                        <div className="mt-4 space-y-3">
                          {visibleReplies.map((reply) => (
                            <div
                              key={reply.id}
                              className="ml-4 rounded-2xl border border-blue-100 bg-gradient-to-r from-blue-50 to-indigo-50 p-4 shadow-sm dark:border-blue-900/30 dark:from-blue-950/20 dark:to-indigo-950/10"
                            >
                              <div className="flex items-start gap-3">
                                <img
                                  src={
                                    reply.user?.avatar ||
                                    "https://ui-avatars.com/api/?name=Shop"
                                  }
                                  alt={reply.user?.name || "Shop"}
                                  className="h-9 w-9 rounded-full border object-cover dark:border-gray-600"
                                />
                                <div className="min-w-0 flex-1">
                                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                                    <p className="text-sm font-semibold text-blue-700 dark:text-blue-300">
                                      {reply.user?.name || "Phản hồi của shop"}
                                    </p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                      {formatDateTime(
                                        reply.created_at || reply.createdAt,
                                      )}
                                    </p>
                                  </div>
                                  <p className="mt-1 text-sm leading-6 text-gray-700 dark:text-gray-300">
                                    {reply.content}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))}

                          {hasMoreReplies && (
                            <button
                              type="button"
                              onClick={() => handleShowMoreReplies(rv.id)}
                              className="ml-4 inline-flex items-center gap-1 text-sm font-medium text-blue-600 transition hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                            >
                              <ChevronDown className="h-4 w-4" />
                              Xem thêm phản hồi
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* SHOW MORE REVIEWS */}
              {hasMoreReviews && (
                <div className="flex justify-center pt-2">
                  <button
                    type="button"
                    onClick={handleShowMoreReviews}
                    className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition hover:border-blue-200 hover:text-blue-600 hover:shadow dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:hover:border-blue-800 dark:hover:text-blue-400"
                  >
                    <ChevronDown className="h-4 w-4" />
                    Xem thêm
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default ProductDetailPage;
