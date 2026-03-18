import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Layout from "../../../components/client/layout/Layout";
import { http } from "../../../services/http";
import Footer from "../../../components/client/layout/Footer";

interface Product {
  id: number;
  title: string;
  slug?: string;
  price: number;
  discountPercentage?: number;
  effectivePrice?: number;
  thumbnail?: string;
  stock?: number;
  category?: {
    id: number;
    title: string;
    slug?: string;
  } | null;
}

const HomePage: React.FC = () => {
  const [, setIsVisible] = useState(false);
  const [activeTestimonial, setActiveTestimonial] = useState(0);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError("");

      const url = `/api/v1/client/products?page=1&limit=8&sortBy=position&order=ASC`;
      const json = await http<any>("GET", url);

      if (json?.success && Array.isArray(json.data)) {
        setProducts(json.data);
      } else {
        setError("Không thể tải danh sách sản phẩm.");
      }
    } catch (err) {
      console.error("Lỗi tải sản phẩm:", err);
      setError("Không thể kết nối đến server.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    setIsVisible(true);

    const testimonialInterval = setInterval(() => {
      setActiveTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 5000);

    const slideInterval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 4000);

    return () => {
      clearInterval(testimonialInterval);
      clearInterval(slideInterval);
    };
  }, []);

  const slides = [
    {
      id: 1,
      image:
        "https://watermark.lovepik.com/photo/20211210/large/lovepik-the-clerk-in-the-fruit-shop-showed-the-orange-in-picture_501795067.jpg",
      title: "Trái Cây Tươi Ngon Mùa Hè",
      subtitle: "Giảm giá đến 30% cho các loại trái cây mùa hè",
      buttonText: "Khám phá ngay",
      buttonLink: "/products",
    },
    {
      id: 2,
      image:
        "https://res.cloudinary.com/dgqzcdtbx/image/upload/v1752422389/samples/food/dessert.jpg",
      title: "Nông Sản Hữu Cơ",
      subtitle: "100% hữu cơ, an toàn cho sức khỏe",
      buttonText: "Xem sản phẩm",
      buttonLink: "/products",
    },
    {
      id: 3,
      image:
        "https://jetstarcargo.vn/wp-content/uploads/2020/07/van-chuyen-trai-cay-sai-gon-gi-ha-noi-trong-ngay.jpeg",
      title: "Giao Hàng Nhanh Chóng",
      subtitle: "Đặt hàng hôm nay, nhận hàng trong ngày",
      buttonText: "Đặt hàng ngay",
      buttonLink: "/products",
    },
  ];

  const testimonials = [
    {
      id: 1,
      name: "Nguyễn Thị Mai",
      comment:
        "Trái cây rất tươi ngon, đóng gói cẩn thận. Tôi đã đặt hàng nhiều lần và rất hài lòng!",
      avatar: "https://i.imgur.com/5Y2n5xR.jpg",
    },
    {
      id: 2,
      name: "Trần Văn Hùng",
      comment:
        "Giao hàng nhanh chóng, chất lượng sản phẩm tuyệt vời. Sẽ tiếp tục ủng hộ shop.",
      avatar: "https://i.imgur.com/7Yl5m3k.jpg",
    },
    {
      id: 3,
      name: "Lê Thị Thu",
      comment:
        "Giá cả hợp lý, trái cây luôn tươi mới. Dịch vụ chăm sóc khách hàng rất tốt.",
      avatar: "https://i.imgur.com/9Zl4p8q.jpg",
    },
  ];

  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % slides.length);
  const prevSlide = () =>
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  const goToSlide = (index: number) => setCurrentSlide(index);

  const getFinalPrice = (product: Product) => {
    if (
      typeof product.effectivePrice === "number" &&
      !Number.isNaN(product.effectivePrice)
    ) {
      return product.effectivePrice;
    }

    if (
      typeof product.price === "number" &&
      typeof product.discountPercentage === "number" &&
      product.discountPercentage > 0
    ) {
      return Math.round(product.price * (1 - product.discountPercentage / 100));
    }

    return product.price;
  };

  const getDiscountAmount = (product: Product) => {
    const finalPrice = getFinalPrice(product);
    return Math.max(0, product.price - finalPrice);
  };

  const formatPrice = (value: number) => {
    return value.toLocaleString("vi-VN") + " ₫";
  };

  return (
    <Layout>
      {/* ================== HERO SLIDER ================== */}
      <section className="relative h-[600px] overflow-hidden">
        <div className="relative h-full">
          {slides.map((slide, index) => (
            <div
              key={slide.id}
              className={`absolute inset-0 transition-opacity duration-1000 ${
                index === currentSlide ? "opacity-100" : "opacity-0"
              }`}
            >
              <img
                src={slide.image}
                alt={slide.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-black/50 to-transparent"></div>
              <div className="absolute inset-0 flex items-center">
                <div className="container mx-auto px-6">
                  <div className="max-w-2xl">
                    <h1
                      className={`text-4xl md:text-5xl font-bold text-white mb-4 transition-all duration-1000 ${
                        index === currentSlide
                          ? "translate-y-0 opacity-100"
                          : "translate-y-4 opacity-0"
                      }`}
                    >
                      {slide.title}
                    </h1>
                    <p
                      className={`text-xl text-white mb-6 transition-all duration-1000 ${
                        index === currentSlide
                          ? "translate-y-0 opacity-100"
                          : "translate-y-4 opacity-0"
                      }`}
                    >
                      {slide.subtitle}
                    </p>
                    <Link
                      to={slide.buttonLink}
                      className="inline-block bg-gradient-to-r from-orange-500 to-red-500 text-white px-8 py-3 rounded-full font-medium text-lg hover:shadow-xl hover:scale-105 transition-all duration-300"
                    >
                      {slide.buttonText}
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={prevSlide}
          className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/30 text-white p-2 rounded-full transition"
        >
          ❮
        </button>
        <button
          onClick={nextSlide}
          className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/30 text-white p-2 rounded-full transition"
        >
          ❯
        </button>

        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex space-x-2">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => goToSlide(i)}
              className={`w-3 h-3 rounded-full ${
                i === currentSlide ? "bg-white" : "bg-white/50"
              }`}
            />
          ))}
        </div>
      </section>

      {/* ================== FEATURED PRODUCTS ================== */}
      <section className="container mx-auto px-6 py-16">
        <h2 className="text-4xl font-semibold text-green-800 mb-12 text-center">
          Sản Phẩm Nổi Bật
        </h2>

        {loading ? (
          <p className="text-center text-gray-500">Đang tải sản phẩm...</p>
        ) : error ? (
          <p className="text-center text-red-500">{error}</p>
        ) : products.length === 0 ? (
          <p className="text-center text-gray-500">Chưa có sản phẩm nào.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {products.map((p) => {
              const hasDiscount =
                typeof p.discountPercentage === "number" &&
                p.discountPercentage > 0;

              const finalPrice = getFinalPrice(p);
              const discountAmount = getDiscountAmount(p);

              return (
                <div
                  key={p.id}
                  className="group rounded-2xl overflow-hidden border border-orange-100 bg-white shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-2"
                >
                  <div className="relative overflow-hidden h-64 bg-orange-50">
                    <img
                      src={p.thumbnail || "https://via.placeholder.com/300"}
                      alt={p.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />

                    {hasDiscount && (
                      <>
                        <div className="absolute top-3 left-3 z-10">
                          <div className="bg-gradient-to-r from-red-500 to-orange-500 text-white px-3 py-1.5 rounded-full shadow-lg">
                            <span className="text-sm font-bold">
                              GIẢM {p.discountPercentage}%
                            </span>
                          </div>
                        </div>

                        <div className="absolute top-3 right-3 z-10">
                          <div className="bg-white/95 backdrop-blur-sm text-red-600 px-3 py-1.5 rounded-xl shadow-md border border-red-100">
                            <p className="text-[11px] leading-none font-medium text-gray-500 mb-1">
                              Tiết kiệm
                            </p>
                            <p className="text-sm font-bold">
                              {formatPrice(discountAmount)}
                            </p>
                          </div>
                        </div>
                      </>
                    )}

                    {typeof p.stock === "number" && p.stock <= 0 && (
                      <div className="absolute inset-0 bg-black/55 flex items-center justify-center">
                        <span className="text-white font-semibold text-lg px-4 py-2 rounded-full bg-black/30">
                          Hết hàng
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="p-5 flex flex-col min-h-[280px]">
                    {p.category?.title && (
                      <span className="inline-block mb-2 text-xs font-semibold uppercase tracking-wide text-orange-500 bg-orange-50 px-2.5 py-1 rounded-full w-fit">
                        {p.category.title}
                      </span>
                    )}

                    <h3 className="text-lg font-semibold text-gray-800 mb-3 line-clamp-2 min-h-[56px]">
                      {p.title}
                    </h3>

                    <div className="mb-4 h-[84px] flex flex-col justify-end">
                      <div className="flex items-end gap-2 flex-wrap min-h-[40px]">
                        <span
                          className={`text-2xl font-extrabold tracking-tight ${
                            hasDiscount ? "text-red-600" : "text-orange-500"
                          }`}
                        >
                          {formatPrice(hasDiscount ? finalPrice : p.price)}
                        </span>

                        <span
                          className={`text-sm line-through ${
                            hasDiscount ? "text-gray-400 visible" : "invisible"
                          }`}
                        >
                          {formatPrice(p.price)}
                        </span>
                      </div>

                      <div className="mt-2 flex items-center gap-2 flex-wrap min-h-[28px]">
                        <span
                          className={`inline-flex items-center rounded-full text-xs font-bold px-2.5 py-1 border ${
                            hasDiscount
                              ? "bg-red-50 text-red-600 border-red-100 visible"
                              : "invisible"
                          }`}
                        >
                          -{p.discountPercentage ?? 0}%
                        </span>

                        <span
                          className={`text-sm font-medium ${
                            hasDiscount ? "text-green-600 visible" : "invisible"
                          }`}
                        >
                          Bạn tiết kiệm {formatPrice(discountAmount)}
                        </span>
                      </div>
                    </div>

                    <Link
                      to={`/products/${p.id}`}
                      className="mt-auto w-full block text-center rounded-xl bg-gradient-to-r from-orange-500 to-red-500 text-white py-3 font-semibold shadow-sm hover:shadow-md hover:from-orange-600 hover:to-red-600 transition-all duration-300"
                    >
                      Xem chi tiết
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ================== ABOUT SECTION ================== */}
      <section className="bg-gradient-to-r from-green-50 to-yellow-50 py-16">
        <div className="container mx-auto px-6 flex flex-col md:flex-row items-center">
          <div className="md:w-1/2 mb-8 md:mb-0">
            <img
              src="https://res.cloudinary.com/dgqzcdtbx/image/upload/v1752422391/samples/imagecon-group.jpg"
              alt="Vườn trái cây"
              className="rounded-lg shadow-lg"
            />
          </div>
          <div className="md:w-1/2 md:pl-12">
            <h2 className="text-4xl font-semibold text-green-800 mb-6">
              Về Chúng Tôi
            </h2>
            <p className="text-gray-700 mb-4">
              FreshFruits cam kết mang đến những sản phẩm trái cây tươi ngon
              nhất, được tuyển chọn kỹ lưỡng từ các nông trại uy tín trong và
              ngoài nước.
            </p>
            <p className="text-gray-700 mb-6">
              Với quy trình đóng gói chuyên nghiệp và hệ thống giao hàng nhanh
              chóng, chúng tôi đảm bảo mỗi sản phẩm đến tay bạn vẫn giữ được độ
              tươi ngon như vừa thu hoạch.
            </p>
            <Link
              to="/about"
              className="inline-block bg-green-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-700 transition"
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            >
              Tìm hiểu thêm
            </Link>
          </div>
        </div>
      </section>

      {/* ================== TESTIMONIALS ================== */}
      <section className="container mx-auto px-6 py-16">
        <h2 className="text-4xl font-semibold text-green-800 mb-12 text-center">
          Khách Hàng Nói Gì Về Chúng Tôi
        </h2>
        <div className="relative max-w-3xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="flex items-center mb-6">
              <img
                src={testimonials[activeTestimonial].avatar}
                alt={testimonials[activeTestimonial].name}
                className="w-16 h-16 rounded-full mr-4"
              />
              <div>
                <h3 className="text-xl font-semibold text-green-700">
                  {testimonials[activeTestimonial].name}
                </h3>
                <div className="flex text-yellow-400">
                  {[...Array(5)].map((_, i) => (
                    <svg
                      key={i}
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
              </div>
            </div>
            <p className="text-gray-700 italic text-lg">
              "{testimonials[activeTestimonial].comment}"
            </p>
          </div>

          <div className="flex justify-center mt-6 space-x-2">
            {testimonials.map((_, index) => (
              <button
                key={index}
                onClick={() => setActiveTestimonial(index)}
                className={`w-3 h-3 rounded-full ${
                  index === activeTestimonial ? "bg-green-600" : "bg-gray-300"
                }`}
              ></button>
            ))}
          </div>
        </div>
      </section>

      <Footer />

      <button
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        className="fixed bottom-8 right-8 bg-green-600 text-white p-3 rounded-full shadow-lg hover:bg-green-700 transition z-40"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 10l7-7m0 0l7 7m-7-7v18"
          />
        </svg>
      </button>
    </Layout>
  );
};

export default HomePage;
