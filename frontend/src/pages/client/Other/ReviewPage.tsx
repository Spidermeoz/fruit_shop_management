import React, { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import Layout from "../../../components/client/layout/Layout";

interface Review {
  id: string;
  productId: string;
  userId: string;
  userName: string;
  userAvatar: string;
  rating: number;
  title: string;
  content: string;
  date: string;
  helpful: number;
  images?: string[];
  verified: boolean;
}

interface Product {
  id: string;
  name: string;
  image: string;
  price: number;
  category: string;
  origin: string;
}

const ReviewPage: React.FC = () => {
  const { id } = useParams();
  const [product, setProduct] = useState<Product | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [userReview, setUserReview] = useState<Review | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [, setHoveredStar] = useState(0);
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [filterRating, setFilterRating] = useState(0);

  // Form data
  const [reviewData, setReviewData] = useState({
    rating: 0,
    title: "",
    content: ""
  });

  // Giả lập dữ liệu sản phẩm
  useEffect(() => {
    const sampleProduct: Product = {
      id: id || "1",
      name: "Táo Envy Mỹ",
      image: "https://i.imgur.com/k2P1k5M.jpg",
      price: 250000,
      category: "Trái cây nhập khẩu",
      origin: "Mỹ"
    };
    setProduct(sampleProduct);

    // Giả lập dữ liệu đánh giá
    const sampleReviews: Review[] = [
      {
        id: "1",
        productId: id || "1",
        userId: "user1",
        userName: "Nguyễn Văn A",
        userAvatar: "https://i.imgur.com/5Y2n5xR.jpg",
        rating: 5,
        title: "Táo rất ngon và tươi",
        content: "Táo Envy Mỹ thực sự rất ngon, giòn và ngọt. Đóng gói cẩn thận, giao hàng nhanh. Sẽ tiếp tục ủng hộ shop.",
        date: "2025-08-10",
        helpful: 12,
        verified: true,
        images: ["https://i.imgur.com/k2P1k5M.jpg"]
      },
      {
        id: "2",
        productId: id || "1",
        userId: "user2",
        userName: "Trần Thị B",
        userAvatar: "https://i.imgur.com/7Yl5m3k.jpg",
        rating: 4,
        title: "Chất lượng tốt",
        content: "Táo tươi, ngọt nhưng giá hơi cao so với các loại táo khác. Tuy nhiên chất lượng xứng đáng với giá tiền.",
        date: "2025-08-08",
        helpful: 8,
        verified: true
      },
      {
        id: "3",
        productId: id || "1",
        userId: "user3",
        userName: "Lê Văn C",
        userAvatar: "https://i.imgur.com/9Zl4p8q.jpg",
        rating: 5,
        title: "Rất hài lòng",
        content: "Đã mua nhiều lần và luôn hài lòng. Táo luôn tươi, không bị dập. Shop đóng gói rất kỹ.",
        date: "2025-08-05",
        helpful: 15,
        verified: true,
        images: ["https://i.imgur.com/k2P1k5M.jpg", "https://i.imgur.com/8Jk3l7n.jpg"]
      },
      {
        id: "4",
        productId: id || "1",
        userId: "user4",
        userName: "Phạm Thị D",
        userAvatar: "https://i.imgur.com/3Kd8p5m.jpg",
        rating: 3,
        title: "Tạm ổn",
        content: "Táo ngon nhưng có vài quả bị mềm. Hy vọng shop sẽ kiểm tra kỹ hơn trước khi giao hàng.",
        date: "2025-08-03",
        helpful: 3,
        verified: false
      }
    ];

    setReviews(sampleReviews);

    // Giả lập đánh giá của người dùng hiện tại
    const currentUserReview = sampleReviews.find(r => r.userId === "current_user");
    if (currentUserReview) {
      setUserReview(currentUserReview);
      setReviewData({
        rating: currentUserReview.rating,
        title: currentUserReview.title,
        content: currentUserReview.content
      });
    }
  }, [id]);

  // Tính toán điểm đánh giá trung bình
  const averageRating = reviews.length > 0 
    ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length 
    : 0;

  // Đếm số lượng đánh giá theo sao
  const ratingCounts = [5, 4, 3, 2, 1].map(rating => ({
    rating,
    count: reviews.filter(r => r.rating === rating).length,
    percentage: reviews.length > 0 
      ? (reviews.filter(r => r.rating === rating).length / reviews.length) * 100 
      : 0
  }));

  // Lọc đánh giá theo số sao
  const filteredReviews = filterRating > 0 
    ? reviews.filter(r => r.rating === filterRating)
    : reviews;

  const handleReviewChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setReviewData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const newImages = Array.from(files).map(file => URL.createObjectURL(file));
      setSelectedImages(prev => [...prev, ...newImages].slice(0, 5)); // Giới hạn 5 ảnh
    }
  };

  const removeImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (reviewData.rating === 0) {
      alert("Vui lòng chọn số sao đánh giá");
      return;
    }

    if (!reviewData.title.trim() || !reviewData.content.trim()) {
      alert("Vui lòng nhập tiêu đề và nội dung đánh giá");
      return;
    }

    setIsSubmitting(true);

    // Giả lập gửi đánh giá
    setTimeout(() => {
      const newReview: Review = {
        id: Date.now().toString(),
        productId: id || "1",
        userId: "current_user",
        userName: "Bạn",
        userAvatar: "https://i.imgur.com/5Y2n5xR.jpg",
        rating: reviewData.rating,
        title: reviewData.title,
        content: reviewData.content,
        date: new Date().toISOString().split('T')[0],
        helpful: 0,
        verified: true,
        images: selectedImages
      };

      if (userReview) {
        // Cập nhật đánh giá cũ
        setReviews(prev => prev.map(r => r.userId === "current_user" ? newReview : r));
      } else {
        // Thêm đánh giá mới
        setReviews(prev => [newReview, ...prev]);
      }

      setUserReview(newReview);
      setIsSubmitting(false);
      setShowReviewForm(false);
      setSelectedImages([]);
      alert("Cảm ơn bạn đã đánh giá sản phẩm!");
    }, 1500);
  };

  const handleHelpful = (reviewId: string) => {
    setReviews(prev => prev.map(review => 
      review.id === reviewId 
        ? { ...review, helpful: review.helpful + 1 }
        : review
    ));
  };

  const renderStars = (rating: number, interactive = false) => {
    return (
      <div className="flex">
        {[1, 2, 3, 4, 5].map((star) => (
          <svg
            key={star}
            xmlns="http://www.w3.org/2000/svg"
            className={`h-5 w-5 ${
              star <= rating ? "text-yellow-400" : "text-gray-300"
            } ${interactive ? "cursor-pointer hover:text-yellow-400" : ""}`}
            fill="currentColor"
            viewBox="0 0 20 20"
            onClick={() => interactive && setReviewData(prev => ({ ...prev, rating: star }))}
            onMouseEnter={() => interactive && setHoveredStar(star)}
            onMouseLeave={() => interactive && setHoveredStar(0)}
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
      </div>
    );
  };

  if (!product) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl text-gray-700 mb-4">Không tìm thấy sản phẩm</h2>
            <Link
              to="/product"
              className="inline-block bg-gradient-to-r from-green-600 to-green-700 text-white px-8 py-3 rounded-lg font-medium hover:shadow-lg transform hover:scale-105 transition-all duration-300"
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
      {/* Header nhỏ */}
      <section className="bg-gradient-to-r from-green-100 to-yellow-100 py-8 text-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-4 left-10 w-16 h-16 bg-yellow-300 rounded-full animate-pulse"></div>
          <div className="absolute bottom-4 right-10 w-12 h-12 bg-green-400 rounded-full animate-pulse"></div>
        </div>
        <div className="relative z-10">
          <h1 className="text-4xl font-bold text-green-800 mb-2">Đánh giá sản phẩm</h1>
          <p className="text-gray-700">Xem và chia sẻ trải nghiệm của bạn</p>
          <div className="flex items-center justify-center text-gray-600 mt-2">
            <Link to="/" className="hover:text-green-600 transition">Trang chủ</Link>
            <span className="mx-2">/</span>
            <Link to="/product" className="hover:text-green-600 transition">Sản phẩm</Link>
            <span className="mx-2">/</span>
            <span className="text-green-700">{product.name}</span>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-6 py-10">
        <div className="grid md:grid-cols-3 gap-8">
          {/* Product Info & Rating Summary */}
          <div className="md:col-span-1">
            <div className="bg-white rounded-2xl shadow-md overflow-hidden mb-6">
              <div className="p-6">
                <div className="flex items-center gap-4 mb-4">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-20 h-20 rounded-lg object-cover"
                  />
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800">{product.name}</h3>
                    <p className="text-sm text-gray-600">{product.category}</p>
                    <p className="text-sm text-gray-600">Xuất xứ: {product.origin}</p>
                    <p className="text-green-700 font-bold mt-1">{product.price.toLocaleString()} đ</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Rating Summary */}
            <div className="bg-white rounded-2xl shadow-md overflow-hidden mb-6">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Đánh giá trung bình</h3>
                
                <div className="flex items-center gap-4 mb-4">
                  <div className="text-4xl font-bold text-green-700">
                    {averageRating.toFixed(1)}
                  </div>
                  <div>
                    {renderStars(Math.round(averageRating))}
                    <p className="text-sm text-gray-600 mt-1">{reviews.length} đánh giá</p>
                  </div>
                </div>

                <div className="space-y-2">
                  {ratingCounts.map(({ rating, count, percentage }) => (
                    <div key={rating} className="flex items-center gap-2">
                      <span className="text-sm text-gray-600 w-8">{rating} sao</span>
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-yellow-400 h-2 rounded-full" 
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                      <span className="text-sm text-gray-600 w-8 text-right">{count}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-4 pt-4 border-t">
                  <button
                    onClick={() => setShowReviewForm(!showReviewForm)}
                    className="w-full bg-gradient-to-r from-green-600 to-green-700 text-white py-2 rounded-lg font-medium hover:shadow-lg transform hover:scale-105 transition-all duration-300"
                  >
                    {userReview ? "Chỉnh sửa đánh giá của bạn" : "Viết đánh giá của bạn"}
                  </button>
                </div>
              </div>
            </div>

            {/* Filter */}
            <div className="bg-white rounded-2xl shadow-md overflow-hidden">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Lọc đánh giá</h3>
                <div className="space-y-2">
                  <button
                    onClick={() => setFilterRating(0)}
                    className={`w-full text-left px-3 py-2 rounded-lg transition ${
                      filterRating === 0 ? "bg-green-50 text-green-700" : "hover:bg-gray-50"
                    }`}
                  >
                    Tất cả ({reviews.length})
                  </button>
                  {[5, 4, 3, 2, 1].map(rating => (
                    <button
                      key={rating}
                      onClick={() => setFilterRating(rating)}
                      className={`w-full text-left px-3 py-2 rounded-lg transition flex items-center justify-between ${
                        filterRating === rating ? "bg-green-50 text-green-700" : "hover:bg-gray-50"
                      }`}
                    >
                      <span>{rating} sao</span>
                      <span className="text-sm text-gray-600">
                        ({reviews.filter(r => r.rating === rating).length})
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Reviews List */}
          <div className="md:col-span-2">
            {/* Review Form */}
            {showReviewForm && (
              <div className="bg-white rounded-2xl shadow-md overflow-hidden mb-6">
                <div className="p-6 border-b">
                  <h3 className="text-xl font-semibold text-gray-800">
                    {userReview ? "Chỉnh sửa đánh giá" : "Viết đánh giá của bạn"}
                  </h3>
                </div>
                
                <form onSubmit={handleSubmitReview} className="p-6">
                  <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-medium mb-2">
                      Đánh giá của bạn <span className="text-red-500">*</span>
                    </label>
                    <div className="flex items-center gap-2">
                      {renderStars(reviewData.rating, true)}
                      <span className="text-sm text-gray-600">
                        {reviewData.rating > 0 ? `${reviewData.rating}/5` : "Chọn số sao"}
                      </span>
                    </div>
                  </div>

                  <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-medium mb-2">
                      Tiêu đề <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="title"
                      value={reviewData.title}
                      onChange={handleReviewChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="Nhập tiêu đề đánh giá"
                    />
                  </div>

                  <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-medium mb-2">
                      Nội dung <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      name="content"
                      value={reviewData.content}
                      onChange={handleReviewChange}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="Chia sẻ trải nghiệm của bạn về sản phẩm này"
                    ></textarea>
                  </div>

                  <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-medium mb-2">
                      Hình ảnh (tối đa 5)
                    </label>
                    <div className="flex items-center gap-2 mb-2">
                      {selectedImages.map((image, index) => (
                        <div key={index} className="relative">
                          <img
                            src={image}
                            alt={`Review ${index + 1}`}
                            className="w-16 h-16 rounded-lg object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => removeImage(index)}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                      {selectedImages.length < 5 && (
                        <label className="w-16 h-16 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center cursor-pointer hover:border-green-500 transition">
                          <input
                            type="file"
                            multiple
                            accept="image/*"
                            onChange={handleImageUpload}
                            className="hidden"
                          />
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                          </svg>
                        </label>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="flex-1 bg-gradient-to-r from-green-600 to-green-700 text-white py-2 rounded-lg font-medium hover:shadow-lg transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? "Đang gửi..." : "Gửi đánh giá"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowReviewForm(false)}
                      className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                    >
                      Hủy
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Reviews List */}
            <div className="space-y-4">
              {filteredReviews.length === 0 ? (
                <div className="bg-white rounded-2xl shadow-md p-8 text-center">
                  <p className="text-gray-600">Chưa có đánh giá nào</p>
                </div>
              ) : (
                filteredReviews.map((review) => (
                  <div key={review.id} className="bg-white rounded-2xl shadow-md overflow-hidden">
                    <div className="p-6">
                      <div className="flex items-start gap-4">
                        <img
                          src={review.userAvatar}
                          alt={review.userName}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold text-gray-800">{review.userName}</h4>
                            {review.verified && (
                              <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full">
                                Đã mua hàng
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-4 mb-2">
                            {renderStars(review.rating)}
                            <span className="text-sm text-gray-600">{review.date}</span>
                          </div>
                          <h5 className="font-medium text-gray-800 mb-2">{review.title}</h5>
                          <p className="text-gray-700 mb-3">{review.content}</p>
                          
                          {review.images && review.images.length > 0 && (
                            <div className="flex gap-2 mb-3">
                              {review.images.map((image, index) => (
                                <img
                                  key={index}
                                  src={image}
                                  alt={`Review ${index + 1}`}
                                  className="w-20 h-20 rounded-lg object-cover cursor-pointer hover:opacity-80 transition"
                                />
                              ))}
                            </div>
                          )}
                          
                          <div className="flex items-center justify-between">
                            <button
                              onClick={() => handleHelpful(review.id)}
                              className="text-sm text-gray-600 hover:text-green-600 transition"
                            >
                              Hữu ích ({review.helpful})
                            </button>
                            <button className="text-sm text-gray-600 hover:text-green-600 transition">
                              Báo cáo
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ReviewPage;