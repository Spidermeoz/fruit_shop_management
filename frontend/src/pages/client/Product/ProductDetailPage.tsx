import React, { useEffect, useState, useMemo } from "react"; // ✅ Thêm useMemo
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

interface Review {
  id: number;
  rating: number;
  content: string;
  created_at: string;
  user?: {
    id: number;
    full_name?: string;
    name?: string;
    avatar?: string;
  };
  replies?: {
    id: number;
    content: string;
    created_at: string;
    user?: {
      id: number;
      full_name?: string;
      name?: string;
      avatar?: string;
    };
  }[];
}

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

  // ✅ Thêm state cho bộ lọc đánh giá
  const [ratingFilter, setRatingFilter] = useState<number | "all">("all");

  // Fetch sản phẩm thật
  useEffect(() => {
    const fetchProductDetail = async () => {
      try {
        setIsLoading(true);
        const res = await http("GET", `/api/v1/client/products/${id}`);
        if (res?.success && res.data) {
          setProduct(res.data);
          // Sau khi có sản phẩm -> load sản phẩm liên quan cùng danh mục
          if (res.data.category?.id) {
            const related = await http(
              "GET",
              `/api/v1/client/products?categoryId=${res.data.category.id}&limit=4`
            );
            if (related?.success && Array.isArray(related.data)) {
              const filtered = related.data.filter(
                (p: { id: any }) => p.id !== res.data.id
              );
              setRelatedProducts(filtered);
            }
          }
          // Fetch reviews
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
        `/api/v1/client/reviews/product/${productId}`
      );
      if (res?.success && Array.isArray(res.data)) {
        setReviews(res.data);
      } else {
        setReviews([]);
      }
    } catch (err) {
      console.error("Lỗi tải đánh giá:", err);
      setReviews([]);
    }
  };

  // ✅ Tính toán số lượng đánh giá cho mỗi mức sao
  const ratingCounts = useMemo(() => {
    const counts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviews.forEach((review) => {
      if (review.rating >= 1 && review.rating <= 5) {
        counts[review.rating as keyof typeof counts]++;
      }
    });
    return counts;
  }, [reviews]);

  const { addToCart } = useCart();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleAddToCart = async () => {
    if (!product) return;

    if (!isAuthenticated) {
      navigate("/login");
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

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center py-32">
          <div className="animate-spin h-12 w-12 border-4 border-green-600 border-t-transparent rounded-full"></div>
        </div>
      </Layout>
    );
  }

  if (error || !product) {
    return (
      <Layout>
        <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-green-50 to-yellow-50">
          <div className="text-center">
            <h2 className="text-3xl text-gray-700 mb-4">
              {error || "Không tìm thấy sản phẩm"}
            </h2>
            <Link
              to="/product"
              className="inline-block bg-gradient-to-r from-green-600 to-green-700 text-white px-6 py-3 rounded-lg font-medium hover:shadow-lg transform hover:scale-105 transition-all duration-300"
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
      <section className="bg-gradient-to-r from-green-100 to-yellow-100 py-8 text-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-4 left-10 w-16 h-16 bg-yellow-300 rounded-full animate-pulse"></div>
          <div className="absolute bottom-4 right-10 w-12 h-12 bg-green-400 rounded-full animate-pulse"></div>
        </div>
        <div className="relative z-10">
          <h1 className="text-4xl font-bold text-green-800 mb-2">
            Chi tiết sản phẩm
          </h1>
          <div className="flex items-center justify-center text-gray-600">
            <Link to="/" className="hover:text-green-600 transition">
              Trang chủ
            </Link>
            <span className="mx-2">/</span>
            <Link to="/products" className="hover:text-green-600 transition">
              Sản phẩm
            </Link>
            <span className="mx-2">/</span>
            <span className="text-green-700">{product.title}</span>
          </div>
        </div>
      </section>

      {/* Nội dung sản phẩm */}
      <div className="container mx-auto px-6 py-12">
        <div className="grid md:grid-cols-2 gap-12 items-center">
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
              <div className="absolute top-4 right-4 bg-green-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                {product.category.title}
              </div>
            )}
          </div>

          {/* Thông tin */}
          <div>
            <h2 className="text-4xl font-bold text-green-800 mb-4">
              {product.title}
            </h2>

            <div className="flex items-center mb-6">
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
                  <span className="ml-2 bg-red-500 text-white px-2 py-1 rounded text-sm">
                    -{product.discountPercentage}%
                  </span>
                </>
              ) : (
                <span className="text-3xl font-bold text-green-700">
                  {product.price.toLocaleString()} đ
                </span>
              )}
            </div>

            <div className="flex items-center gap-4 mb-8">
              <div className="flex items-center border border-gray-300 rounded-lg">
                <button
                  onClick={decreaseQuantity}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100"
                >
                  -
                </button>
                <span className="px-4 py-2 border-l border-r border-gray-300">
                  {quantity}
                </span>
                <button
                  onClick={increaseQuantity}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100"
                >
                  +
                </button>
              </div>

              <button
                onClick={handleAddToCart}
                className="bg-gradient-to-r from-green-600 to-green-700 text-white px-8 py-3 rounded-lg font-medium hover:shadow-lg transform hover:scale-105 transition-all duration-300"
              >
                Thêm vào giỏ hàng
              </button>
            </div>

            <div className="text-gray-600 space-y-2">
              <p>
                Tình trạng:{" "}
                <span
                  className={
                    product.stock > 0
                      ? "text-green-600 font-medium"
                      : "text-red-500 font-medium"
                  }
                >
                  {product.stock > 0
                    ? `Còn hàng (${product.stock.toLocaleString()} sản phẩm)`
                    : "Hết hàng"}
                </span>
              </p>
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
                {/* ✅ BỘ LỌC ĐÁNH GIÁ */}
                <div className="flex flex-wrap gap-2 mb-6">
                  <button
                    onClick={() => setRatingFilter("all")}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
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
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-colors flex items-center gap-1 ${
                        ratingFilter === star
                          ? "bg-green-600 text-white"
                          : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                      }`}
                    >
                      {star} ★ ({ratingCounts[star as keyof typeof ratingCounts]})
                    </button>
                  ))}
                </div>

                {/* DANH SÁCH ĐÁNH GIÁ ĐÃ LỌC */}
                {reviews
                  .filter(
                    (review) =>
                      ratingFilter === "all" || review.rating === ratingFilter
                  )
                  .map((review) => (
                    <div key={review.id} className="border-b pb-4">
                      <div className="flex items-center gap-3 mb-2">
                        <img
                          src={
                            review.user?.avatar ||
                            `https://ui-avatars.com/api/?name=${encodeURIComponent(
                              review.user?.full_name ||
                                review.user?.name ||
                                "User"
                            )}`
                          }
                          className="w-10 h-10 rounded-full"
                          alt="Avatar"
                        />
                        <div>
                          <p className="font-semibold text-gray-800">
                            {review.user?.full_name ||
                              review.user?.name ||
                              "Người dùng"}
                          </p>
                          <p className="text-gray-500 text-sm">
                            {new Date(review.created_at).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <div className="text-yellow-500">
                        {Array.from({ length: review.rating }).map((_, i) => (
                          <span key={i}>★</span>
                        ))}
                        {Array.from({ length: 5 - review.rating }).map((_, i) => (
                          <span key={i} className="text-gray-300">
                            ★
                          </span>
                        ))}
                      </div>
                      <p className="mt-2 text-gray-800">{review.content}</p>
                      {review.replies && review.replies.length > 0 && (
                        <div className="ml-10 mt-3 border-l-4 border-green-500 pl-4">
                          <p className="text-green-700 font-medium">
                            Phản hồi từ shop:
                          </p>
                          <p className="text-gray-700">{review.replies[0].content}</p>
                          <p className="text-gray-500 text-xs">
                            {new Date(
                              review.replies[0].created_at
                            ).toLocaleString()}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}

                {/* ✅ Thông báo khi không có đánh giá nào sau khi lọc */}
                {reviews.filter(
                  (review) =>
                    ratingFilter === "all" || review.rating === ratingFilter
                ).length === 0 && (
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
            <h3 className="text-3xl font-semibold text-green-800 mb-8 text-center">
              Sản phẩm tương tự
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {relatedProducts.map((rp) => (
                <div
                  key={rp.id}
                  className="group bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden"
                >
                  <img
                    src={
                      rp.thumbnail ||
                      "https://via.placeholder.com/300x300?text=No+Image"
                    }
                    alt={rp.title}
                    className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="p-4">
                    <h4 className="text-lg font-semibold text-green-800 mb-2">
                      {rp.title}
                    </h4>
                    <p className="text-green-700 font-bold mb-3">
                      {rp.price.toLocaleString()} đ
                    </p>
                    <Link
                      to={`/products/${rp.id}`}
                      className="block w-full text-center bg-green-600 text-white py-2 rounded-lg font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:bg-green-700"
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