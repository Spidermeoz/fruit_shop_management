import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Layout from "../../../components/client/layouts/Layout";
import { http } from "../../../services/http";
import Footer from "../../../components/client/layouts/Footer";
import { getClientPosts } from "../../../services/api/postsClient";
import type { PostListItem } from "../../../types/posts";
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
  Flame,
} from "lucide-react";
import { slides, testimonials } from "./content";

interface Category {
  id: number;
  title: string;
  slug: string;
}

interface ProductVariantInventory {
  id: number;
  quantity: number;
  reservedQuantity: number;
  availableQuantity: number;
  createdAt?: string | null;
  updatedAt?: string | null;
}

interface ProductVariant {
  id: number;
  title?: string | null;
  stock: number;
  availableStock?: number;
  inventory?: ProductVariantInventory | null;
  price: number;
  status?: string;
}

interface ProductOrigin {
  id: number;
  name: string;
  slug: string;
  countryCode?: string | null;
}

interface Product {
  id: number;
  title: string;
  slug?: string;
  price: number;
  effectivePrice?: number | null;
  discountPercentage?: number | null;
  effective_price?: number;
  discount_percentage?: number;
  thumbnail?: string;
  stock?: number;
  totalStock?: number;
  featured?: boolean;
  priceRange?: { min: number; max: number } | null;
  variants?: ProductVariant[];
  category?: Category | null;
  origin?: ProductOrigin | null;
  averageRating?: number;
  reviewCount?: number;
  shortDescription?: string | null;
}

const HomePage: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [activeTestimonial, setActiveTestimonial] = useState(0);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  const [latestPosts, setLatestPosts] = useState<PostListItem[]>([]);
  const [postsLoading, setPostsLoading] = useState<boolean>(false);

  const [showScrollTop, setShowScrollTop] = useState(false);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError("");
      const url = `/api/v1/client/products?page=1&limit=8&featured=true&sortBy=position&order=ASC`;
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

  const fetchLatestPosts = async () => {
    try {
      setPostsLoading(true);

      const featuredRes = await getClientPosts({
        page: 1,
        limit: 3,
        featured: true,
        sortBy: "publishedAt",
        order: "DESC",
      });

      if (
        featuredRes?.success &&
        Array.isArray(featuredRes.data) &&
        featuredRes.data.length > 0
      ) {
        setLatestPosts(featuredRes.data);
        return;
      }

      const fallbackRes = await getClientPosts({
        page: 1,
        limit: 3,
        sortBy: "publishedAt",
        order: "DESC",
      });

      if (fallbackRes?.success && Array.isArray(fallbackRes.data)) {
        setLatestPosts(fallbackRes.data);
      } else {
        setLatestPosts([]);
      }
    } catch (err) {
      console.error("Lỗi tải bài viết mới:", err);
      setLatestPosts([]);
    } finally {
      setPostsLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchLatestPosts();
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

  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % slides.length);
  const prevSlide = () =>
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  const goToSlide = (index: number) => setCurrentSlide(index);

  const formatPrice = (value: number) => {
    return value.toLocaleString("vi-VN") + " đ";
  };

  const hasRealPriceRange = (product: Product) => {
    return (
      !!product.priceRange &&
      typeof product.priceRange.min === "number" &&
      typeof product.priceRange.max === "number" &&
      product.priceRange.max > product.priceRange.min
    );
  };

  const getDisplayPrice = (product: Product) => {
    if (product.priceRange?.min !== undefined) return product.priceRange.min;
    if (typeof product.effectivePrice === "number")
      return product.effectivePrice;
    if (typeof product.effective_price === "number")
      return product.effective_price;
    return product.price ?? 0;
  };

  const getDisplayComparePrice = (product: Product) => {
    if (hasRealPriceRange(product)) {
      return 0;
    }
    return product.price ?? 0;
  };

  const getDiscountPercent = (product: Product) => {
    if (hasRealPriceRange(product)) {
      return 0;
    }

    if (typeof product.discountPercentage === "number") {
      return Math.max(0, Number(product.discountPercentage));
    }

    if (typeof product.discount_percentage === "number") {
      return Math.max(0, Number(product.discount_percentage));
    }

    const displayPrice = getDisplayPrice(product);
    const comparePrice = getDisplayComparePrice(product);

    if (comparePrice > displayPrice && comparePrice > 0) {
      return Math.round(((comparePrice - displayPrice) / comparePrice) * 100);
    }

    return 0;
  };
  const getDisplayStock = (product: Product) => {
    if (typeof product.totalStock === "number") {
      return Math.max(0, Number(product.totalStock));
    }

    if (Array.isArray(product.variants) && product.variants.length > 0) {
      return product.variants.reduce((sum, variant) => {
        return (
          sum +
          Math.max(
            0,
            Number(
              variant.availableStock ??
                variant.inventory?.availableQuantity ??
                variant.stock ??
                0,
            ),
          )
        );
      }, 0);
    }

    return Math.max(0, Number(product.stock ?? 0));
  };

  const getPriceRangeLabel = (product: Product) => {
    if (!hasRealPriceRange(product) || !product.priceRange) {
      return formatPrice(getDisplayPrice(product));
    }

    const min = Number(product.priceRange.min || 0);
    const max = Number(product.priceRange.max || 0);

    if (min === max) {
      return formatPrice(min);
    }

    return `${formatPrice(min)} - ${formatPrice(max)}`;
  };

  const formatPostDate = (value?: string | null) => {
    if (!value) return "Đang cập nhật";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "Đang cập nhật";
    return date.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const stripHtml = (value?: string | null) =>
    String(value ?? "")
      .replace(/<[^>]+>/g, " ")
      .replace(/&nbsp;/g, " ")
      .replace(/\s+/g, " ")
      .trim();

  const getPostExcerpt = (post: PostListItem) => {
    const excerpt = String(post.excerpt ?? "").trim();
    if (excerpt) return excerpt;
    return stripHtml(post.content).slice(0, 140);
  };

  const firstRowProducts = products.slice(0, 5);
  const secondRowProducts = products.slice(5, 8);

  const renderProductCard = (product: Product, index: number) => {
    const displayPrice = getDisplayPrice(product);
    const comparePrice = getDisplayComparePrice(product);
    const discountPercent = getDiscountPercent(product);
    const hasDiscount = discountPercent > 0;
    const stock = getDisplayStock(product);
    const isPriceRangeProduct = hasRealPriceRange(product);
    const priceLabel = getPriceRangeLabel(product);

    // Highlight sản phẩm đầu tiên
    const isHighlighted = index === 0;

    return (
      <div
        key={product.id}
        // Thêm animation fade & slide up với delay theo index
        className={`group flex flex-col bg-white rounded-[2rem] p-3 shadow-[0_4px_20px_rgba(0,0,0,0.02)] hover:shadow-[0_20px_40px_rgba(22,101,52,0.12)] transition-all duration-500 h-full relative ${
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"
        } ${
          isHighlighted
            ? "border-2 border-green-400 ring-4 ring-green-50 lg:-translate-y-2"
            : "border border-slate-100 hover:-translate-y-2"
        }`}
        style={{ transitionDelay: `${index * 100}ms` }}
      >
        <div className="relative aspect-square rounded-[1.5rem] bg-slate-50 overflow-hidden mb-4">
          <img
            src={
              product.thumbnail ||
              "https://via.placeholder.com/300x300?text=No+Image"
            }
            alt={product.title}
            // Zoom mượt hơn
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 mix-blend-multiply"
            onError={(e) => {
              (e.target as HTMLImageElement).src =
                "https://via.placeholder.com/300x300?text=No+Image";
            }}
          />

          {/* Overlay gradient nhẹ khi hover */}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>

          <div className="absolute top-3 left-3 flex flex-col gap-2 z-10">
            {product.featured && (
              <span className="bg-gradient-to-r from-yellow-400 to-amber-500 text-yellow-950 text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-full shadow-[0_0_15px_rgba(251,191,36,0.6)] animate-pulse">
                Nổi bật
              </span>
            )}
            {!isPriceRangeProduct && hasDiscount && (
              <span className="bg-red-500 text-white text-[10px] font-black px-3 py-1.5 rounded-full shadow-md">
                -{discountPercent}%
              </span>
            )}
          </div>

          {/* Overlay hết hàng mượt và rõ ràng hơn */}
          {stock <= 0 && (
            <div className="absolute inset-0 bg-white/40 backdrop-blur-md flex items-center justify-center z-20">
              <span className="bg-slate-900/90 text-white font-bold text-sm px-6 py-2.5 rounded-full shadow-xl flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                Tạm hết hàng
              </span>
            </div>
          )}
        </div>

        <div className="px-2 pb-2 flex-1 flex flex-col relative z-10">
          <span className="text-[11px] font-bold uppercase tracking-wider text-green-600 mb-1.5 line-clamp-1">
            {product.category?.title || "Sản phẩm tươi"}
          </span>

          <Link
            to={
              product.slug
                ? `/products/${product.slug}`
                : `/products/${product.id}`
            }
            className="text-lg font-bold text-slate-900 mb-2 line-clamp-2 leading-tight group-hover:text-green-700 transition-colors"
          >
            {product.title}
          </Link>

          {typeof product.averageRating === "number" &&
            typeof product.reviewCount === "number" &&
            product.reviewCount > 0 && (
              <div className="flex items-center gap-1.5 mb-2 text-sm">
                <span className="flex items-center gap-1 text-yellow-500 font-bold">
                  <Star className="h-4 w-4 fill-current" />
                  {product.averageRating.toFixed(1)}
                </span>
                <span className="text-slate-400">({product.reviewCount})</span>
              </div>
            )}

          {product.shortDescription && (
            <p className="text-sm text-slate-500 font-medium line-clamp-2 mb-2">
              {product.shortDescription}
            </p>
          )}

          {product.origin?.name && (
            <p className="text-xs font-bold text-slate-400 mb-2">
              Xuất xứ: {product.origin.name}
            </p>
          )}

          <div className="mt-auto flex flex-col gap-1 mb-5">
            <div className="flex items-end gap-2 flex-wrap">
              {/* Giá được tinh chỉnh nhỏ gọn hơn */}
              <span className="text-base md:text-lg font-black text-green-700 leading-none">
                {isPriceRangeProduct ? priceLabel : formatPrice(displayPrice)}
              </span>

              {!isPriceRangeProduct &&
                hasDiscount &&
                comparePrice > displayPrice && (
                  <span className="text-sm font-medium text-slate-400 line-through decoration-slate-300 mb-0.5">
                    {formatPrice(comparePrice)}
                  </span>
                )}
            </div>
          </div>

          <div className="overflow-hidden rounded-xl">
            <Link
              to={
                product.slug
                  ? `/products/${product.slug}`
                  : `/products/${product.id}`
              }
              // Đổi thành translate-y-full (trượt từ dưới lên)
              className="w-full flex items-center justify-center gap-2 bg-slate-900 text-white py-3.5 rounded-xl font-bold hover:bg-green-600 active:scale-[0.98] transition-all duration-500 shadow-sm hover:shadow-lg hover:shadow-green-600/20 opacity-0 translate-y-full group-hover:opacity-100 group-hover:translate-y-0"
            >
              <ShoppingBag className="h-5 w-5" />
              Xem chi tiết
            </Link>
          </div>
        </div>
      </div>
    );
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

        {/* ================== 2. QUICK ABOUT ================== */}
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
                <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-green-500 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
                <div className="absolute -top-6 -right-6 w-32 h-32 bg-yellow-400 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
              </div>
            </div>
          </div>
        </section>

        {/* ================== 3. WHY CHOOSE US ================== */}
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

        {/* ================== 4. FEATURED PRODUCTS (Đã Nâng Cấp) ================== */}
        <section className="py-24 relative overflow-hidden">
          <div className="absolute top-1/2 left-0 w-[800px] h-[800px] bg-green-50/50 rounded-full blur-[100px] -translate-y-1/2 -translate-x-1/2 pointer-events-none z-0"></div>

          <div className="container mx-auto px-4 lg:px-8 relative z-10">
            <div className="max-w-7xl mx-auto">
              <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
                <div className="max-w-2xl">
                  {/* Label tạo hiệu ứng FOMO */}
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-green-600 font-bold tracking-wider uppercase text-sm">
                      Top Bán Chạy Tuần Này
                    </span>
                    <span className="bg-red-100 text-red-600 text-xs font-bold px-2.5 py-1 rounded-full animate-pulse flex items-center gap-1 shadow-sm">
                      <Flame className="w-3 h-3" /> Đang được yêu thích
                    </span>
                  </div>
                  <h2 className="text-3xl md:text-5xl font-black text-slate-900">
                    Sản Phẩm Nổi Bật
                  </h2>
                </div>
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
                <div className="space-y-6">
                  {/* Hàng 1: 5 sản phẩm */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
                    {firstRowProducts.map((product, index) =>
                      renderProductCard(product, index),
                    )}
                  </div>

                  {/* Hàng 2: 3 sản phẩm + Khu vực nút xem tất cả (Glassmorphism CTA) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
                    {secondRowProducts.map((product, index) =>
                      renderProductCard(product, index + 5),
                    )}

                    {/* Nút Xem Tất Cả - Nâng cấp dạng CTA Mini Card */}
                    <div className="hidden lg:flex lg:col-span-2 relative">
                      <Link
                        to="/products"
                        className={`group w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-green-50 via-emerald-50/50 to-teal-50 rounded-[2rem] p-6 border border-green-100/50 shadow-sm hover:shadow-xl hover:shadow-green-900/10 transition-all duration-500 hover:-translate-y-1 relative overflow-hidden ${
                          isVisible
                            ? "opacity-100 translate-y-0"
                            : "opacity-0 translate-y-12"
                        }`}
                        style={{ transitionDelay: "800ms" }}
                      >
                        {/* Background decor */}
                        <div className="absolute top-0 right-0 w-32 h-32 bg-green-200/50 rounded-full blur-3xl group-hover:bg-green-300/50 transition-colors duration-500"></div>
                        <div className="absolute bottom-0 left-0 w-24 h-24 bg-teal-200/50 rounded-full blur-2xl group-hover:bg-teal-300/50 transition-colors duration-500"></div>

                        {/* Content */}
                        <div className="w-16 h-16 bg-white shadow-sm rounded-full flex items-center justify-center mb-4 text-green-600 group-hover:scale-110 group-hover:bg-green-600 group-hover:text-white transition-all duration-500 relative z-10">
                          <ArrowRight className="w-8 h-8 group-hover:translate-x-1 transition-transform" />
                        </div>
                        <h3 className="text-xl font-black text-slate-900 mb-2 relative z-10">
                          Xem tất cả sản phẩm
                        </h3>
                        <p className="text-sm font-medium text-slate-500 text-center mb-5 relative z-10 max-w-[200px]">
                          Khám phá thêm 100+ trái cây tươi ngon đang chờ bạn
                        </p>
                        <span className="inline-flex items-center gap-2 text-green-600 font-bold text-sm bg-white/80 backdrop-blur-sm px-5 py-2.5 rounded-xl relative z-10 shadow-sm group-hover:bg-slate-900 group-hover:text-white transition-colors">
                          Khám phá ngay
                        </span>
                      </Link>
                    </div>
                  </div>

                  {/* Nút xem tất cả cho màn hình nhỏ */}
                  <div className="flex justify-center lg:hidden pt-4">
                    <Link
                      to="/products"
                      className="inline-flex items-center gap-2 bg-slate-900 text-white px-8 py-4 rounded-2xl text-sm font-bold hover:bg-green-600 transition-colors shadow-lg active:scale-95"
                    >
                      Khám phá thêm 100+ sản phẩm{" "}
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* ================== 5. LATEST POSTS ================== */}
        <section className="py-24 bg-white">
          <div className="container mx-auto px-4 lg:px-8">
            <div className="max-w-7xl mx-auto">
              <div className="mb-12 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                <div className="max-w-2xl">
                  <span className="mb-2 block text-sm font-bold uppercase tracking-wider text-green-600">
                    Nội dung mới nhất
                  </span>
                  <h2 className="text-3xl md:text-5xl font-black text-slate-900">
                    Góc bài viết nổi bật
                  </h2>
                  <p className="mt-3 text-slate-500 font-medium">
                    Kiến thức về trái cây, dinh dưỡng và những gợi ý lựa chọn
                    phù hợp cho gia đình bạn.
                  </p>
                </div>

                <Link
                  to="/posts"
                  className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-6 py-4 text-sm font-bold text-white transition-colors hover:bg-green-600"
                >
                  Xem tất cả bài viết
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>

              {postsLoading ? (
                <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                  {Array.from({ length: 3 }).map((_, idx) => (
                    <div
                      key={idx}
                      className="animate-pulse rounded-[2rem] border border-slate-100 bg-white p-4 shadow-sm"
                    >
                      <div className="mb-4 aspect-[16/10] rounded-[1.5rem] bg-slate-100" />
                      <div className="mb-3 h-4 w-24 rounded bg-slate-100" />
                      <div className="mb-3 h-7 w-4/5 rounded bg-slate-100" />
                      <div className="mb-2 h-4 rounded bg-slate-100" />
                      <div className="h-4 w-2/3 rounded bg-slate-100" />
                    </div>
                  ))}
                </div>
              ) : latestPosts.length === 0 ? (
                <div className="rounded-[2rem] border border-slate-100 bg-slate-50 px-6 py-12 text-center">
                  <p className="font-medium text-slate-500">
                    Chưa có bài viết mới để hiển thị.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                  {latestPosts.map((post) => (
                    <article
                      key={post.id}
                      className="group flex flex-col overflow-hidden rounded-[2rem] border border-slate-100 bg-white shadow-[0_4px_20px_rgba(0,0,0,0.02)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_20px_40px_rgba(15,23,42,0.06)]"
                    >
                      <Link
                        to={`/posts/${post.slug}`}
                        className="block aspect-[16/10] overflow-hidden bg-slate-100"
                      >
                        {post.thumbnail ? (
                          <img
                            src={post.thumbnail}
                            alt={post.title}
                            className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-slate-400">
                            Bài viết
                          </div>
                        )}
                      </Link>

                      <div className="flex flex-1 flex-col p-5">
                        <div className="mb-2 text-xs font-bold text-green-600 uppercase tracking-wider">
                          {post.category?.title || "Bài viết"}
                        </div>

                        <Link
                          to={`/posts/${post.slug}`}
                          className="line-clamp-2 text-xl font-black leading-tight text-slate-900 transition-colors group-hover:text-green-700"
                        >
                          {post.title}
                        </Link>

                        <div className="mt-3 text-sm font-bold text-slate-400">
                          {formatPostDate(post.published_at)}
                        </div>

                        <p className="mt-3 line-clamp-3 text-sm font-medium leading-6 text-slate-500">
                          {getPostExcerpt(post) ||
                            "Nội dung đang được cập nhật."}
                        </p>

                        <Link
                          to={`/posts/${post.slug}`}
                          className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-green-700 transition hover:text-green-800"
                        >
                          Đọc bài viết
                          <ArrowRight className="h-4 w-4" />
                        </Link>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* ================== 5. CATEGORY SHOWCASE ================== */}
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
