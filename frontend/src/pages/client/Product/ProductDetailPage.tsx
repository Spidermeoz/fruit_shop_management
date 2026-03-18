import React, { useEffect, useState, useMemo } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import Layout from "../../../components/client/layout/Layout";
import { http } from "../../../services/http";
import Footer from "../../../components/client/layout/Footer";
import { useCart } from "../../../context/CartContext";
import { useAuth } from "../../../context/AuthContext";

// ==========================
// TYPES
// ==========================
interface Product {
  id: number;
  title: string;
  slug: string;
  price: number;
  discountPercentage: number;
  thumbnail: string;
  stock: number;
  featured: boolean;
  description: string;
  category?: {
    id: number;
    title: string;
  } | null;
  effectivePrice?: number;
}

interface ReviewUser {
  id: number;
  full_name?: string;
  name?: string;
  avatar?: string;
}

interface ReviewReply {
  id: number;
  content: string;
  created_at?: string;
  createdAt?: string;
  user?: ReviewUser;
}

interface Review {
  id: number;
  rating: number;
  content: string;
  created_at?: string;
  createdAt?: string;
  user?: ReviewUser;
  replies?: ReviewReply[];
}

// ==========================
// HELPERS
// ==========================
const getDisplayName = (user?: ReviewUser) =>
  user?.full_name || user?.name || "Người dùng";

const getAvatar = (user?: ReviewUser) =>
  user?.avatar ||
  `https://ui-avatars.com/api/?name=${encodeURIComponent(getDisplayName(user))}`;

const getTimeValue = (date?: string) => {
  if (!date) return 0;
  const time = new Date(date).getTime();
  return Number.isNaN(time) ? 0 : time;
};

const formatDateTime = (date?: string) => {
  if (!date) return "—";
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return "—";
  return parsed.toLocaleString();
};

// ==========================
// PAGE START
// ==========================
const ProductDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState("description");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const [ratingFilter, setRatingFilter] = useState<number | "all">("all");

  // Hiển thị comments: mặc định 2, mỗi lần thêm 3
  const [visibleReviewCount, setVisibleReviewCount] = useState(2);

  // Hiển thị replies theo từng review: mặc định 2, mỗi lần thêm 3
  const [visibleReplyCounts, setVisibleReplyCounts] = useState<
    Record<number, number>
  >({});

  // Fetch sản phẩm thật
  useEffect(() => {
    const fetchProductDetail = async () => {
      try {
        setIsLoading(true);
        const res = await http("GET", `/api/v1/client/products/${id}`);
        if (res?.success && res.data) {
          setProduct(res.data);

          if (res.data.category?.id) {
            const related = await http(
              "GET",
              `/api/v1/client/products?categoryId=${res.data.category.id}&limit=4`,
            );
            if (related?.success && Array.isArray(related.data)) {
              const filtered = related.data.filter(
                (p: { id: number }) => p.id !== res.data.id,
              );
              setRelatedProducts(filtered);
            }
          }

          fetchReviews(res.data.id);
        } else {
          setError("Không tìm thấy sản phẩm.");
        }
      } catch (err) {
        console.error("Lỗi tải sản phẩm:", err);
        setError("Không thể kết nối tới server.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchProductDetail();
  }, [id]);

  // Fetch reviews
  const fetchReviews = async (productId: number) => {
    try {
      const res = await http(
        "GET",
        `/api/v1/client/reviews/product/${productId}`,
      );

      if (res?.success && Array.isArray(res.data)) {
        const sortedReviews: Review[] = [...res.data]
          .map((review: Review) => ({
            ...review,
            replies: Array.isArray(review.replies)
              ? [...review.replies].sort(
                  (a, b) =>
                    getTimeValue(b.created_at || b.createdAt) -
                    getTimeValue(a.created_at || a.createdAt),
                )
              : [],
          }))
          .sort(
            (a, b) =>
              getTimeValue(b.created_at || b.createdAt) -
              getTimeValue(a.created_at || a.createdAt),
          );

        setReviews(sortedReviews);
        setVisibleReviewCount(2);

        const initialReplyCounts: Record<number, number> = {};
        sortedReviews.forEach((review) => {
          initialReplyCounts[review.id] = 2;
        });
        setVisibleReplyCounts(initialReplyCounts);
      } else {
        setReviews([]);
      }
    } catch (err) {
      console.error("Lỗi tải đánh giá:", err);
      setReviews([]);
    }
  };

  // Đếm số lượng đánh giá theo sao
  const ratingCounts = useMemo(() => {
    const counts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviews.forEach((review) => {
      if (review.rating >= 1 && review.rating <= 5) {
        counts[review.rating as keyof typeof counts]++;
      }
    });
    return counts;
  }, [reviews]);

  const { addToCart, items } = useCart();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const quantityInCart = useMemo(() => {
    const item = items.find((i) => i.productId === product?.id);
    return item?.quantity || 0;
  }, [items, product]);

  const remainingStock = useMemo(() => {
    if (!product) return 0;
    return Math.max(0, product.stock - quantityInCart);
  }, [product, quantityInCart]);

  const handleAddToCart = async () => {
    if (!product) return;

    if (!isAuthenticated) {
      navigate("/login");
      return;
    }

    if (quantity > remainingStock) {
      alert(`Chỉ còn ${remainingStock} sản phẩm có thể thêm`);
      return;
    }

    try {
      await addToCart(product.id, quantity);
      alert(`Đã thêm ${quantity} × ${product.title} vào giỏ hàng`);
      navigate("/cart");
    } catch (err) {
      console.error(err);
      alert("Có lỗi xảy ra khi thêm vào giỏ hàng, vui lòng thử lại!");
    }
  };

  const increaseQuantity = () => setQuantity((q) => q + 1);
  const decreaseQuantity = () => setQuantity((q) => (q > 1 ? q - 1 : 1));

  const filteredReviews = useMemo(() => {
    return reviews.filter(
      (review) => ratingFilter === "all" || review.rating === ratingFilter,
    );
  }, [reviews, ratingFilter]);

  const visibleReviews = useMemo(() => {
    return filteredReviews.slice(0, visibleReviewCount);
  }, [filteredReviews, visibleReviewCount]);

  const handleShowMoreReviews = () => {
    setVisibleReviewCount((prev) => prev + 3);
  };

  const handleShowMoreReplies = (reviewId: number) => {
    setVisibleReplyCounts((prev) => ({
      ...prev,
      [reviewId]: (prev[reviewId] || 2) + 3,
    }));
  };

  // Reset lại số lượng comment hiển thị khi đổi filter
  useEffect(() => {
    setVisibleReviewCount(2);
  }, [ratingFilter]);

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center py-32">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-green-600 border-t-transparent"></div>
        </div>
      </Layout>
    );
  }

  if (error || !product) {
    return (
      <Layout>
        <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-green-50 to-yellow-50">
          <div className="text-center">
            <h2 className="mb-4 text-3xl text-gray-700">
              {error || "Không tìm thấy sản phẩm"}
            </h2>
            <Link
              to="/product"
              className="inline-block rounded-lg bg-gradient-to-r from-green-600 to-green-700 px-6 py-3 font-medium text-white transition-all duration-300 hover:scale-105 hover:shadow-lg"
            >
              Quay lại cửa hàng
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      {/* Header */}
      <section className="relative overflow-hidden bg-gradient-to-r from-green-100 to-yellow-100 py-8 text-center">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-4 left-10 h-16 w-16 animate-pulse rounded-full bg-yellow-300"></div>
          <div className="absolute bottom-4 right-10 h-12 w-12 animate-pulse rounded-full bg-green-400"></div>
        </div>
        <div className="relative z-10">
          <h1 className="mb-2 text-4xl font-bold text-green-800">
            Chi tiết sản phẩm
          </h1>
          <div className="flex items-center justify-center text-gray-600">
            <Link to="/" className="transition hover:text-green-600">
              Trang chủ
            </Link>
            <span className="mx-2">/</span>
            <Link to="/products" className="transition hover:text-green-600">
              Sản phẩm
            </Link>
            <span className="mx-2">/</span>
            <span className="text-green-700">{product.title}</span>
          </div>
        </div>
      </section>

      {/* Nội dung sản phẩm */}
      <div className="container mx-auto px-6 py-12">
        <div className="grid items-center gap-12 md:grid-cols-2">
          {/* Hình ảnh */}
          <div className="relative">
            <img
              src={
                product.thumbnail ||
                "https://via.placeholder.com/400x400?text=No+Image"
              }
              alt={product.title}
              className="w-full rounded-lg shadow-md"
            />
            {product.category && (
              <div className="absolute top-4 right-4 rounded-full bg-green-600 px-3 py-1 text-sm font-medium text-white">
                {product.category.title}
              </div>
            )}
          </div>

          {/* Thông tin */}
          <div>
            <h2 className="mb-4 text-4xl font-bold text-green-800">
              {product.title}
            </h2>

            <div className="mb-6 flex items-center">
              {product.discountPercentage > 0 ? (
                <>
                  <span className="text-3xl font-bold text-green-700">
                    {(
                      product.price *
                      (1 - product.discountPercentage / 100)
                    ).toLocaleString()}{" "}
                    đ
                  </span>
                  <span className="ml-3 text-gray-500 line-through">
                    {product.price.toLocaleString()} đ
                  </span>
                  <span className="ml-2 rounded bg-red-500 px-2 py-1 text-sm text-white">
                    -{product.discountPercentage}%
                  </span>
                </>
              ) : (
                <span className="text-3xl font-bold text-green-700">
                  {product.price.toLocaleString()} đ
                </span>
              )}
            </div>

            <div className="mb-8 flex items-center gap-4">
              <div className="flex items-center overflow-hidden rounded-lg border border-gray-300 bg-white shadow-sm">
                <button
                  onClick={decreaseQuantity}
                  disabled={quantity <= 1}
                  className={`h-10 w-10 flex items-center justify-center text-xl text-green-700 transition hover:bg-green-100 active:bg-green-200 ${
                    quantity <= 1
                      ? "cursor-not-allowed opacity-50 hover:bg-transparent"
                      : ""
                  }`}
                >
                  -
                </button>

                <input
                  type="number"
                  min="1"
                  max={remainingStock || 1}
                  value={quantity}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (!/^\d*$/.test(val)) return;
                    setQuantity(val === "" ? ("" as any) : Number(val));
                  }}
                  onBlur={(e) => {
                    let qty = Number(e.target.value);
                    if (!qty || qty <= 0) qty = 1;

                    if (qty > remainingStock) {
                      alert(`Chỉ còn ${remainingStock} sản phẩm có thể thêm`);
                      qty = remainingStock;
                    }
                    setQuantity(qty);
                  }}
                  className="w-14 h-10 border-l border-r border-gray-300 text-center font-medium text-gray-700 transition-colors [appearance:textfield] focus:bg-green-50 focus:outline-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                />

                <button
                  onClick={increaseQuantity}
                  disabled={quantity >= remainingStock}
                  className={`h-10 w-10 flex items-center justify-center text-xl text-green-700 transition hover:bg-green-100 active:bg-green-200 ${
                    quantity >= remainingStock
                      ? "cursor-not-allowed opacity-50 hover:bg-transparent"
                      : ""
                  }`}
                >
                  +
                </button>
              </div>

              <button
                onClick={handleAddToCart}
                disabled={remainingStock <= 0}
                className={`rounded-lg px-8 py-3 font-medium transition-all duration-300 ${
                  remainingStock <= 0
                    ? "cursor-not-allowed bg-gray-400 text-white"
                    : "bg-gradient-to-r from-green-600 to-green-700 text-white hover:scale-105 hover:shadow-lg"
                }`}
              >
                Thêm vào giỏ hàng
              </button>
            </div>

            <div className="space-y-2 text-gray-600">
              <p>
                Tình trạng:{" "}
                <span
                  className={
                    product.stock > 0
                      ? "font-medium text-green-600"
                      : "font-medium text-red-500"
                  }
                >
                  {product.stock > 0
                    ? `Còn hàng (${product.stock.toLocaleString()} sản phẩm)`
                    : "Hết hàng"}
                </span>
              </p>

              {quantityInCart > 0 && (
                <p className="text-blue-600">
                  Trong giỏ hàng của bạn:{" "}
                  <span className="font-semibold">{quantityInCart}</span> sản
                  phẩm
                </p>
              )}

              {remainingStock > 0 && (
                <p className="text-sm text-gray-500">
                  Bạn có thể thêm tối đa{" "}
                  <span className="font-semibold text-green-700">
                    {remainingStock}
                  </span>{" "}
                  sản phẩm nữa
                </p>
              )}

              <p>
                Mã sản phẩm: <span className="font-medium">{product.id}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mt-16 border-t pt-8">
          <nav className="flex space-x-8 border-b">
            <button
              onClick={() => setActiveTab("description")}
              className={`py-3 border-b-2 ${
                activeTab === "description"
                  ? "border-green-600 text-green-700 font-medium"
                  : "border-transparent text-gray-500 hover:text-green-600"
              }`}
            >
              Mô tả chi tiết
            </button>
            <button
              onClick={() => setActiveTab("reviews")}
              className={`py-3 border-b-2 ${
                activeTab === "reviews"
                  ? "border-green-600 text-green-700 font-medium"
                  : "border-transparent text-gray-500 hover:text-green-600"
              }`}
            >
              Đánh giá ({reviews.length})
            </button>
          </nav>

          <div className="mt-6">
            {activeTab === "description" && (
              <div
                className="prose max-w-none text-gray-700"
                dangerouslySetInnerHTML={{
                  __html:
                    product.description ||
                    "Thông tin chi tiết về sản phẩm đang được cập nhật.",
                }}
              />
            )}

            {activeTab === "reviews" && (
              <div className="space-y-6">
                {/* Bộ lọc đánh giá */}
                <div className="mb-6 flex flex-wrap gap-2">
                  <button
                    onClick={() => setRatingFilter("all")}
                    className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                      ratingFilter === "all"
                        ? "bg-green-600 text-white"
                        : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                    }`}
                  >
                    Tất cả ({reviews.length})
                  </button>

                  {[5, 4, 3, 2, 1].map((star) => (
                    <button
                      key={star}
                      onClick={() => setRatingFilter(star)}
                      className={`flex items-center gap-1 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                        ratingFilter === star
                          ? "bg-green-600 text-white"
                          : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                      }`}
                    >
                      {star} ★ (
                      {ratingCounts[star as keyof typeof ratingCounts]})
                    </button>
                  ))}
                </div>

                {/* DANH SÁCH ĐÁNH GIÁ */}
                {visibleReviews.map((review) => {
                  const replies = review.replies || [];
                  const currentVisibleReplyCount =
                    visibleReplyCounts[review.id] || 2;
                  const visibleReplies = replies.slice(
                    0,
                    currentVisibleReplyCount,
                  );
                  const hasMoreReplies =
                    replies.length > currentVisibleReplyCount;

                  return (
                    <div
                      key={review.id}
                      className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm"
                    >
                      <div className="mb-3 flex items-center gap-3">
                        <img
                          src={getAvatar(review.user)}
                          className="h-10 w-10 rounded-full object-cover"
                          alt={getDisplayName(review.user)}
                        />
                        <div>
                          <p className="font-semibold text-gray-800">
                            {getDisplayName(review.user)}
                          </p>
                          <p className="text-sm text-gray-500">
                            {formatDateTime(
                              review.created_at || review.createdAt,
                            )}
                          </p>
                        </div>
                      </div>

                      <div className="text-yellow-500">
                        {Array.from({ length: review.rating }).map((_, i) => (
                          <span key={i}>★</span>
                        ))}
                        {Array.from({ length: 5 - review.rating }).map(
                          (_, i) => (
                            <span key={i} className="text-gray-300">
                              ★
                            </span>
                          ),
                        )}
                      </div>

                      <div className="mt-3 rounded-xl bg-gray-50 px-4 py-3">
                        <p className="text-gray-800">{review.content}</p>
                      </div>

                      {replies.length > 0 && (
                        <div className="mt-4 space-y-3 pl-6 md:pl-10">
                          {visibleReplies.map((reply) => (
                            <div
                              key={reply.id}
                              className="rounded-xl border-l-4 border-green-500 bg-green-50 px-4 py-3"
                            >
                              <div className="mb-2 flex items-center gap-3">
                                <img
                                  src={getAvatar(reply.user)}
                                  className="h-9 w-9 rounded-full object-cover"
                                  alt={getDisplayName(reply.user)}
                                />
                                <div>
                                  <p className="font-semibold text-green-800">
                                    {getDisplayName(reply.user)}
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    {formatDateTime(
                                      reply.created_at || reply.createdAt,
                                    )}
                                  </p>
                                </div>
                              </div>

                              <p className="text-sm leading-relaxed text-gray-700">
                                {reply.content}
                              </p>
                            </div>
                          ))}

                          {hasMoreReplies && (
                            <button
                              onClick={() => handleShowMoreReplies(review.id)}
                              className="text-sm font-medium text-green-700 hover:underline"
                            >
                              Xem thêm phản hồi
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Nút xem thêm comment */}
                {filteredReviews.length > visibleReviewCount && (
                  <div className="pt-2 text-center">
                    <button
                      onClick={handleShowMoreReviews}
                      className="rounded-full border border-green-200 bg-white px-5 py-2.5 text-sm font-medium text-green-700 transition hover:bg-green-50"
                    >
                      Xem thêm
                    </button>
                  </div>
                )}

                {/* Không có đánh giá */}
                {filteredReviews.length === 0 && (
                  <p className="text-gray-600">
                    Không có đánh giá nào cho mức sao đã chọn.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Gợi ý sản phẩm tương tự */}
      {relatedProducts.length > 0 && (
        <section className="bg-gradient-to-br from-green-50 to-yellow-50 py-16">
          <div className="container mx-auto px-6">
            <h3 className="mb-8 text-center text-3xl font-semibold text-green-800">
              Sản phẩm tương tự
            </h3>
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
              {relatedProducts.map((rp) => (
                <div
                  key={rp.id}
                  className="group overflow-hidden rounded-xl bg-white shadow-md transition-all duration-300 hover:shadow-xl"
                >
                  <img
                    src={
                      rp.thumbnail ||
                      "https://via.placeholder.com/300x300?text=No+Image"
                    }
                    alt={rp.title}
                    className="h-48 w-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="p-4">
                    <h4 className="mb-2 text-lg font-semibold text-green-800">
                      {rp.title}
                    </h4>
                    <p className="mb-3 font-bold text-green-700">
                      {rp.price.toLocaleString()} đ
                    </p>
                    <Link
                      to={`/products/${rp.id}`}
                      className="block w-full rounded-lg bg-green-600 py-2 text-center font-medium text-white opacity-0 transition-opacity duration-300 hover:bg-green-700 group-hover:opacity-100"
                    >
                      Xem chi tiết
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      <Footer />
    </Layout>
  );
};

export default ProductDetailPage;
