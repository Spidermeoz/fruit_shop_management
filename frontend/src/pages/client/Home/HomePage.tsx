import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Layout from "../../../components/client/layouts/Layout";
import { http } from "../../../services/http";
import Footer from "../../../components/client/layouts/Footer";
import {
  ChevronLeft,
  ChevronRight,
  Leaf,
  ShieldCheck,
  Truck,
  Heart,
  ShoppingBag,
  ArrowRight,
  Star,
  Quote,
  ArrowUp,
} from "lucide-react";

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
  const [isVisible, setIsVisible] = useState(false);
  const [activeTestimonial, setActiveTestimonial] = useState(0);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [showScrollTop, setShowScrollTop] = useState(false);

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
    }, 5000);

    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);
    };
    window.addEventListener("scroll", handleScroll);

    return () => {
      clearInterval(testimonialInterval);
      clearInterval(slideInterval);
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const slides = [
    {
      id: 1,
      image:
        "https://images.unsplash.com/photo-1610832958506-aa56368176cf?auto=format&fit=crop&w=1920&q=80",
      badge: "Mùa Hè Sôi Động",
      title: "Trái Cây Tươi Ngon \nGiải Nhiệt Mùa Hè",
      subtitle:
        "Giảm giá lên đến 30% cho các loại trái cây nhiệt đới, xua tan cái nóng oi ả.",
      buttonText: "Mua sắm ngay",
      buttonLink: "/products",
    },
    {
      id: 2,
      image:
        "https://www.adm.com/globalassets/products--services/human-nutrition/products/flavors/fruits--berries/fruit-berries-basket-shutterstock_274261043.jpg",
      badge: "100% Organic",
      title: "Nông Sản Hữu Cơ \nAn Toàn Sức Khỏe",
      subtitle:
        "Tuyển chọn kỹ lưỡng từ các nông trại đạt chuẩn, giữ trọn hương vị tự nhiên.",
      buttonText: "Khám phá ngay",
      buttonLink: "/products",
    },
    {
      id: 3,
      image:
        "https://insights.workwave.com/wp-content/uploads/2021/08/WorkWave-How-to-Add-a-Delivery-Service-For-Your-Business.jpg",
      badge: "Dịch Vụ Nhanh Chóng",
      title: "Giao Hàng Tốc Độ \nĐến Tận Tay Bạn",
      subtitle:
        "Cam kết giao hàng trong vòng 2 giờ tại nội thành, đảm bảo độ tươi mới.",
      buttonText: "Đặt hàng ngay",
      buttonLink: "/products",
    },
  ];

  const testimonials = [
    {
      id: 1,
      name: "Nguyễn Thị Mai",
      role: "Mẹ bỉm sữa",
      comment:
        "Trái cây ở FreshFruits luôn tươi ngon, đóng gói cẩn thận. Các bé nhà mình rất thích nho và dâu tây ở đây. Sẽ ủng hộ shop dài dài!",
      avatar:
        "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=150&q=80",
    },
    {
      id: 2,
      name: "Trần Văn Hùng",
      role: "Dân văn phòng",
      comment:
        "Giao hàng cực kỳ nhanh chóng. Trưa đặt là đầu giờ chiều có ngay để làm smoothie. Chất lượng sản phẩm rất đáng tiền.",
      avatar:
        "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80",
    },
    {
      id: 3,
      name: "Lê Thị Thu",
      role: "Huấn luyện viên Yoga",
      comment:
        "Là người chú trọng sức khỏe, tôi rất khắt khe trong việc chọn trái cây. FreshFruits thực sự làm tôi an tâm về nguồn gốc và độ sạch.",
      avatar:
        "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&q=80",
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

  const formatPrice = (value: number) => {
    return value.toLocaleString("vi-VN") + " đ";
  };

  return (
    <div
      className={`flex flex-col min-h-screen bg-[#fcfdfc] transition-opacity duration-1000 ${isVisible ? "opacity-100" : "opacity-0"}`}
    >
      <Layout>
        {/* ================== 1. HERO SLIDER ================== */}
        <section className="relative h-[600px] md:h-[700px] lg:h-[800px] w-full overflow-hidden group">
          {slides.map((slide, index) => (
            <div
              key={slide.id}
              className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
                index === currentSlide ? "opacity-100 z-10" : "opacity-0 z-0"
              }`}
            >
              <img
                src={slide.image}
                alt={slide.title}
                className={`w-full h-full object-cover transition-transform duration-[7000ms] ${
                  index === currentSlide ? "scale-105" : "scale-100"
                }`}
              />
              {/* Gradient Overlay mềm mại hơn */}
              <div className="absolute inset-0 bg-gradient-to-r from-slate-900/80 via-slate-900/40 to-transparent"></div>

              <div className="absolute inset-0 flex items-center">
                <div className="container mx-auto px-6 lg:px-12">
                  <div className="max-w-2xl">
                    <span
                      className={`inline-block px-4 py-2 rounded-full bg-green-500/20 backdrop-blur-sm border border-green-400/30 text-green-300 font-bold uppercase tracking-wider text-sm mb-6 transition-all duration-1000 delay-100 transform ${
                        index === currentSlide
                          ? "translate-y-0 opacity-100"
                          : "translate-y-8 opacity-0"
                      }`}
                    >
                      {slide.badge}
                    </span>
                    <h1
                      className={`text-5xl md:text-6xl lg:text-7xl font-black text-white mb-6 leading-[1.1] whitespace-pre-line transition-all duration-1000 delay-200 transform ${
                        index === currentSlide
                          ? "translate-y-0 opacity-100"
                          : "translate-y-8 opacity-0"
                      }`}
                    >
                      {slide.title}
                    </h1>
                    <p
                      className={`text-lg md:text-xl text-slate-200 mb-10 font-medium max-w-xl leading-relaxed transition-all duration-1000 delay-300 transform ${
                        index === currentSlide
                          ? "translate-y-0 opacity-100"
                          : "translate-y-8 opacity-0"
                      }`}
                    >
                      {slide.subtitle}
                    </p>
                    <div
                      className={`transition-all duration-1000 delay-400 transform ${
                        index === currentSlide
                          ? "translate-y-0 opacity-100"
                          : "translate-y-8 opacity-0"
                      }`}
                    >
                      <Link
                        to={slide.buttonLink}
                        className="inline-flex items-center gap-2 bg-green-600 text-white px-8 py-4 rounded-[1.5rem] font-bold text-lg hover:bg-green-500 hover:shadow-[0_15px_30px_rgba(34,197,94,0.3)] transition-all duration-300 active:scale-95"
                      >
                        <ShoppingBag className="w-5 h-5" />
                        {slide.buttonText}
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* Controls */}
          <div className="absolute bottom-10 right-10 z-20 flex items-center gap-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 hidden md:flex">
            <button
              onClick={prevSlide}
              className="w-12 h-12 rounded-full border border-white/30 bg-white/10 backdrop-blur-md flex items-center justify-center text-white hover:bg-white hover:text-slate-900 transition-colors"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button
              onClick={nextSlide}
              className="w-12 h-12 rounded-full border border-white/30 bg-white/10 backdrop-blur-md flex items-center justify-center text-white hover:bg-white hover:text-slate-900 transition-colors"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>

          {/* Dots */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex space-x-3">
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => goToSlide(i)}
                className={`transition-all duration-300 rounded-full h-2 ${
                  i === currentSlide
                    ? "w-8 bg-green-500"
                    : "w-2 bg-white/50 hover:bg-white"
                }`}
                aria-label={`Go to slide ${i + 1}`}
              />
            ))}
          </div>
        </section>

        {/* ================== 2. QUICK ABOUT (Giới thiệu nhanh) ================== */}
        <section className="py-20 relative">
          <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-100/50 rounded-full blur-[100px] pointer-events-none"></div>
          <div className="container mx-auto px-4 lg:px-8">
            <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-12 items-center">
              <div className="space-y-6 relative z-10">
                <span className="text-green-600 font-bold tracking-wider uppercase text-sm flex items-center gap-2">
                  <Leaf className="w-4 h-4" /> Về FreshFruits
                </span>
                <h2 className="text-3xl md:text-5xl font-black text-slate-900 leading-[1.15]">
                  Nguồn cảm hứng cho <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-emerald-500">
                    lối sống khỏe mạnh
                  </span>
                </h2>
                <p className="text-slate-500 font-medium leading-relaxed text-lg">
                  Không chỉ là một cửa hàng trái cây, FreshFruits là người bạn
                  đồng hành mang đến những lựa chọn tươi sạch, an toàn và đầy
                  dinh dưỡng cho gia đình bạn mỗi ngày.
                </p>
                <div className="pt-4 flex flex-wrap gap-4">
                  <div className="flex items-center gap-2 bg-slate-50 px-4 py-2 rounded-xl border border-slate-100 text-slate-700 font-bold text-sm">
                    <span className="text-green-500 text-xl">✓</span> Trái cây
                    loại 1
                  </div>
                  <div className="flex items-center gap-2 bg-slate-50 px-4 py-2 rounded-xl border border-slate-100 text-slate-700 font-bold text-sm">
                    <span className="text-green-500 text-xl">✓</span> Không chất
                    bảo quản
                  </div>
                  <div className="flex items-center gap-2 bg-slate-50 px-4 py-2 rounded-xl border border-slate-100 text-slate-700 font-bold text-sm">
                    <span className="text-green-500 text-xl">✓</span> Nhập mới
                    mỗi ngày
                  </div>
                </div>
                <div className="pt-4">
                  <Link
                    to="/about"
                    className="inline-flex items-center gap-2 text-green-600 font-bold hover:text-green-700 group"
                  >
                    Khám phá câu chuyện của chúng tôi
                    <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </div>
              <div className="relative">
                <div className="grid grid-cols-2 gap-4 relative z-10">
                  <img
                    src="https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=500&q=80"
                    alt="Fruit Box"
                    className="rounded-[2rem] w-full h-[250px] object-cover shadow-lg translate-y-8"
                  />
                  <img
                    src="https://images.unsplash.com/photo-1619566636858-adf3ef46400b?auto=format&fit=crop&w=500&q=80"
                    alt="Smoothie"
                    className="rounded-[2rem] w-full h-[300px] object-cover shadow-xl"
                  />
                </div>
                {/* Decorative shape */}
                <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-green-500 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
                <div className="absolute -top-6 -right-6 w-32 h-32 bg-yellow-400 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
              </div>
            </div>
          </div>
        </section>

        {/* ================== 3. WHY CHOOSE US (Lý do chọn) ================== */}
        <section className="py-20 bg-slate-50">
          <div className="container mx-auto px-4 lg:px-8">
            <div className="max-w-7xl mx-auto">
              <div className="text-center max-w-2xl mx-auto mb-16">
                <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-4">
                  Cam Kết Chất Lượng
                </h2>
                <p className="text-slate-500 font-medium">
                  Chúng tôi đặt tiêu chuẩn khắt khe vào từng sản phẩm để mang
                  đến trải nghiệm tuyệt vời nhất.
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  {
                    icon: <Leaf />,
                    title: "Tươi mới mỗi ngày",
                    desc: "Sản phẩm được thu hoạch và lên kệ trong 24h.",
                  },
                  {
                    icon: <ShieldCheck />,
                    title: "Nguồn gốc rõ ràng",
                    desc: "Chứng nhận VietGAP, GlobalGAP đầy đủ.",
                  },
                  {
                    icon: <Truck />,
                    title: "Giao hàng thần tốc",
                    desc: "Nhận hàng nhanh chóng chỉ trong 2 giờ.",
                  },
                  {
                    icon: <Heart />,
                    title: "1 đổi 1 tận nhà",
                    desc: "Đổi trả dễ dàng nếu sản phẩm không đạt chuẩn.",
                  },
                ].map((item, idx) => (
                  <div
                    key={idx}
                    className="bg-white rounded-[2rem] p-8 shadow-sm hover:shadow-[0_20px_60px_rgba(22,101,52,0.08)] border border-slate-100 transition-all duration-300 hover:-translate-y-2 group"
                  >
                    <div className="w-14 h-14 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-green-600 group-hover:text-white transition-colors duration-300">
                      {item.icon}
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-2">
                      {item.title}
                    </h3>
                    <p className="text-slate-500 font-medium text-sm leading-relaxed">
                      {item.desc}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ================== 4. FEATURED PRODUCTS (Sản phẩm nổi bật) ================== */}
        <section className="py-24 relative overflow-hidden">
          <div className="absolute top-1/2 left-0 w-[800px] h-[800px] bg-green-50/50 rounded-full blur-[100px] -translate-y-1/2 -translate-x-1/2 pointer-events-none"></div>

          <div className="container mx-auto px-4 lg:px-8 relative z-10">
            <div className="max-w-7xl mx-auto">
              <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
                <div className="max-w-2xl">
                  <span className="text-green-600 font-bold tracking-wider uppercase text-sm mb-2 block">
                    Top Bán Chạy
                  </span>
                  <h2 className="text-3xl md:text-4xl font-black text-slate-900">
                    Sản Phẩm Nổi Bật
                  </h2>
                </div>
                <Link
                  to="/products"
                  className="inline-flex items-center gap-2 bg-slate-100 text-slate-700 px-6 py-3 rounded-2xl font-bold hover:bg-slate-200 transition-colors shrink-0"
                >
                  Xem tất cả <ArrowRight className="w-4 h-4" />
                </Link>
              </div>

              {loading ? (
                <div className="flex justify-center py-20">
                  <div className="animate-spin w-12 h-12 border-4 border-slate-200 border-t-green-600 rounded-full"></div>
                </div>
              ) : error ? (
                <div className="text-center py-20 bg-red-50 rounded-3xl border border-red-100 text-red-600 font-bold">
                  {error}
                </div>
              ) : products.length === 0 ? (
                <div className="text-center py-20 text-slate-500 font-medium">
                  Chưa có sản phẩm nào.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
                  {products.map((p) => {
                    const hasDiscount =
                      typeof p.discountPercentage === "number" &&
                      p.discountPercentage > 0;
                    const finalPrice = getFinalPrice(p);
                    const isOutOfStock =
                      typeof p.stock === "number" && p.stock <= 0;

                    return (
                      <div
                        key={p.id}
                        className="group bg-white rounded-[2rem] overflow-hidden border border-slate-100 shadow-sm hover:shadow-[0_20px_50px_rgba(0,0,0,0.08)] transition-all duration-500 hover:-translate-y-1 flex flex-col"
                      >
                        {/* Image Box */}
                        <div className="relative h-60 bg-slate-50 overflow-hidden">
                          <img
                            src={p.thumbnail || "/placeholder.jpg"}
                            alt={p.title}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src =
                                "/placeholder.jpg";
                            }}
                          />

                          {/* Badges */}
                          <div className="absolute top-4 left-4 flex flex-col gap-2 z-10">
                            {hasDiscount && (
                              <span className="bg-red-500 text-white px-3 py-1.5 rounded-xl text-xs font-black shadow-sm">
                                -{p.discountPercentage}%
                              </span>
                            )}
                            {p.category?.title && (
                              <span className="bg-white/90 backdrop-blur-sm text-green-700 border border-green-100 px-3 py-1.5 rounded-xl text-xs font-bold shadow-sm">
                                {p.category.title}
                              </span>
                            )}
                          </div>

                          {isOutOfStock && (
                            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-[2px] flex items-center justify-center z-20">
                              <span className="bg-white text-slate-900 px-4 py-2 rounded-xl font-bold text-sm">
                                Hết hàng
                              </span>
                            </div>
                          )}

                          {/* Quick Action Hover */}
                          {!isOutOfStock && (
                            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 translate-y-12 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 z-10 w-11/12">
                              <Link
                                to={`/products/${p.id}`}
                                className="block w-full bg-slate-900/90 backdrop-blur text-white text-center py-3 rounded-2xl font-bold text-sm hover:bg-green-600 transition-colors"
                              >
                                Xem chi tiết
                              </Link>
                            </div>
                          )}
                        </div>

                        {/* Content Box */}
                        <div className="p-5 flex flex-col flex-grow">
                          <Link
                            to={`/products/${p.id}`}
                            className="text-lg font-bold text-slate-900 hover:text-green-600 transition-colors line-clamp-2 mb-4 h-14"
                          >
                            {p.title}
                          </Link>

                          <div className="mt-auto">
                            <div className="flex items-end gap-2 flex-wrap mb-1">
                              <span className="text-xl font-black text-green-600">
                                {formatPrice(finalPrice)}
                              </span>
                              {hasDiscount && (
                                <span className="text-sm font-medium text-slate-400 line-through mb-0.5">
                                  {formatPrice(p.price)}
                                </span>
                              )}
                            </div>
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                              Đơn vị: 1 KG
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* ================== 5. CATEGORY SHOWCASE (Tĩnh) ================== */}
        <section className="py-10">
          <div className="container mx-auto px-4 lg:px-8">
            <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="relative rounded-[2.5rem] overflow-hidden group h-80">
                <img
                  src="https://images.unsplash.com/photo-1610397962076-02407a169a5b?auto=format&fit=crop&w=800&q=80"
                  alt="Nhập khẩu"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/20 to-transparent"></div>
                <div className="absolute bottom-8 left-8 right-8">
                  <span className="text-yellow-400 font-bold uppercase tracking-wider text-xs mb-2 block">
                    Cao cấp
                  </span>
                  <h3 className="text-3xl font-black text-white mb-4">
                    Trái Cây Nhập Khẩu
                  </h3>
                  <Link
                    to="/products"
                    className="inline-block bg-white text-slate-900 px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-green-500 hover:text-white transition-colors"
                  >
                    Khám phá ngay
                  </Link>
                </div>
              </div>
              <div className="relative rounded-[2.5rem] overflow-hidden group h-80">
                <img
                  src="https://images.unsplash.com/photo-1519996529931-28324d5a630e?auto=format&fit=crop&w=800&q=80"
                  alt="Mix"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/20 to-transparent"></div>
                <div className="absolute bottom-8 left-8 right-8">
                  <span className="text-green-400 font-bold uppercase tracking-wider text-xs mb-2 block">
                    Healthy
                  </span>
                  <h3 className="text-3xl font-black text-white mb-4">
                    Set Detox & Nước Ép
                  </h3>
                  <Link
                    to="/products"
                    className="inline-block bg-white text-slate-900 px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-green-500 hover:text-white transition-colors"
                  >
                    Lựa chọn liền
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ================== 6. TESTIMONIALS ================== */}
        <section className="py-24 bg-green-50/50">
          <div className="container mx-auto px-4 lg:px-8">
            <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
              <div className="lg:w-5/12 space-y-6 text-center lg:text-left">
                <h2 className="text-3xl md:text-4xl font-black text-slate-900">
                  Khách hàng yêu thích{" "}
                  <span className="text-green-600">FreshFruits</span>
                </h2>
                <p className="text-slate-500 font-medium text-lg">
                  Hơn 1000+ đánh giá 5 sao từ những khách hàng đã trải nghiệm và
                  tin tưởng lựa chọn chúng tôi.
                </p>
                <div className="flex items-center justify-center lg:justify-start gap-2 pt-4">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      className="w-6 h-6 fill-yellow-400 text-yellow-400"
                    />
                  ))}
                  <span className="font-bold text-slate-900 ml-2">
                    4.9 / 5.0
                  </span>
                </div>
              </div>

              <div className="lg:w-7/12 w-full relative">
                <div className="bg-white rounded-[3rem] p-8 md:p-12 shadow-[0_30px_60px_rgba(0,0,0,0.05)] border border-slate-50 relative">
                  <Quote className="absolute top-8 right-10 w-16 h-16 text-green-100 rotate-180" />

                  <div className="relative z-10 min-h-[160px] flex flex-col justify-center">
                    <p className="text-xl md:text-2xl text-slate-700 font-medium leading-relaxed italic mb-8">
                      "{testimonials[activeTestimonial].comment}"
                    </p>
                    <div className="flex items-center gap-4 mt-auto">
                      <img
                        src={testimonials[activeTestimonial].avatar}
                        alt={testimonials[activeTestimonial].name}
                        className="w-14 h-14 rounded-full object-cover border-2 border-green-100"
                      />
                      <div>
                        <h4 className="font-bold text-slate-900 text-lg">
                          {testimonials[activeTestimonial].name}
                        </h4>
                        <p className="text-sm font-bold text-green-600">
                          {testimonials[activeTestimonial].role}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Dots Navigation */}
                  <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 flex space-x-2">
                    {testimonials.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setActiveTestimonial(index)}
                        className={`h-2.5 rounded-full transition-all duration-300 ${
                          index === activeTestimonial
                            ? "w-8 bg-green-600"
                            : "w-2.5 bg-slate-300 hover:bg-green-400"
                        }`}
                        aria-label={`Show testimonial ${index + 1}`}
                      ></button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ================== 7. CTA CUỐI TRANG ================== */}
        <section className="py-20">
          <div className="container mx-auto px-4 lg:px-8">
            <div className="max-w-5xl mx-auto bg-slate-900 rounded-[3rem] p-10 md:p-16 text-center shadow-2xl relative overflow-hidden">
              <div className="absolute inset-0 bg-green-500/10 mix-blend-overlay"></div>

              <div className="relative z-10">
                <h2 className="text-3xl md:text-5xl font-black text-white mb-6 leading-tight">
                  Trái cây sạch, sống an lành <br />
                  Bắt đầu ngay hôm nay!
                </h2>
                <p className="text-slate-300 text-lg mb-10 font-medium max-w-2xl mx-auto">
                  Tặng ngay mã giảm giá 50.000đ cho đơn hàng đầu tiên. Đừng bỏ
                  lỡ cơ hội thưởng thức những hương vị tuyệt vời nhất.
                </p>
                <div className="flex flex-wrap justify-center gap-4">
                  <Link
                    to="/products"
                    className="bg-green-500 text-white px-10 py-4 rounded-2xl font-bold text-lg hover:bg-green-400 transition-colors shadow-lg active:scale-95"
                  >
                    Mua sắm ngay
                  </Link>
                  <Link
                    to="/contact"
                    className="bg-white/10 text-white border border-white/20 px-10 py-4 rounded-2xl font-bold text-lg hover:bg-white hover:text-slate-900 transition-colors active:scale-95"
                  >
                    Trở thành đối tác
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </Layout>
      <Footer />

      {/* Scroll to Top */}
      <button
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        className={`fixed bottom-8 right-8 w-12 h-12 bg-slate-900 text-white rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.15)] flex items-center justify-center hover:bg-green-600 transition-all duration-300 z-40 group ${
          showScrollTop
            ? "translate-y-0 opacity-100"
            : "translate-y-16 opacity-0 pointer-events-none"
        }`}
        aria-label="Lên đầu trang"
      >
        <ArrowUp className="w-5 h-5 group-hover:-translate-y-1 transition-transform" />
      </button>
    </div>
  );
};

export default HomePage;
