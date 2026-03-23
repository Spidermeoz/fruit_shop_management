import React, { useEffect, useState, useMemo, useRef } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import Layout from "../../../components/client/layouts/Layout";
import { http } from "../../../services/http";
import Footer from "../../../components/client/layouts/Footer";
import { useCart } from "../../../context/CartContext";
import { useAuth } from "../../../context/AuthContext";
import { useToast } from "../../../context/ToastContext";
import {
  Star,
  Home,
  ChevronRight,
  ShoppingCart,
  Minus,
  Plus,
  ShieldCheck,
  Leaf,
  Truck,
  MessageCircle,
  AlertCircle,
  CornerDownRight,
} from "lucide-react";

// ==========================
// TYPES
// ==========================
interface ProductOptionValue {
  id: number;
  value: string;
  position?: number;
}

interface ProductOption {
  id: number;
  name: string;
  position?: number;
  values: ProductOptionValue[];
}

interface ProductVariantOptionValue {
  id: number;
  value: string;
  optionId?: number;
  optionName?: string;
}

interface ProductVariant {
  id: number;
  title?: string | null;
  sku?: string | null;
  price: number;
  compareAtPrice?: number | null;
  stock: number;
  status: string;
  optionValueIds?: number[];
  optionValues?: ProductVariantOptionValue[];
}

interface Product {
  id: number;
  title: string;
  slug: string;
  price: number;
  discountPercentage?: number;
  thumbnail: string;
  stock: number;
  totalStock?: number;
  featured: boolean;
  description: string;
  defaultVariantId?: number | null;
  variants?: ProductVariant[];
  options?: ProductOption[];
  priceRange?: { min: number; max: number } | null;
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
  `https://ui-avatars.com/api/?name=${encodeURIComponent(getDisplayName(user))}&background=random`;

const getTimeValue = (date?: string) => {
  if (!date) return 0;
  const time = new Date(date).getTime();
  return Number.isNaN(time) ? 0 : time;
};

const formatDateTime = (date?: string) => {
  if (!date) return "—";
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return "—";
  return parsed.toLocaleString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

const getFinalPrice = (product: Product) => {
  const discount = Number(product.discountPercentage ?? 0);
  const price = Number(product.price ?? 0);

  if (discount > 0) {
    return price * (1 - discount / 100);
  }

  return price;
};

const getProductDisplayStock = (product: Product) => {
  if (typeof product.totalStock === "number") {
    return Math.max(0, Number(product.totalStock));
  }

  if (Array.isArray(product.variants) && product.variants.length > 0) {
    return product.variants.reduce((sum, variant) => {
      return sum + Number(variant.stock ?? 0);
    }, 0);
  }

  return Math.max(0, Number(product.stock ?? 0));
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

  const [visibleReviewCount, setVisibleReviewCount] = useState(2);

  const [visibleReplyCounts, setVisibleReplyCounts] = useState<
    Record<number, number>
  >({});

  const productImageRef = useRef<HTMLImageElement | null>(null);
  const [isAddingToCart, setIsAddingToCart] = useState(false);

  const [selectedOptionValues, setSelectedOptionValues] = useState<
    Record<number, number>
  >({});
  const [selectedVariantId, setSelectedVariantId] = useState<number | null>(
    null,
  );

  const { showSuccessToast, showErrorToast } = useToast();

  useEffect(() => {
    const fetchProductDetail = async () => {
      try {
        setIsLoading(true);
        const res = await http("GET", `/api/v1/client/products/${id}`);
        if (res?.success && res.data) {
          setProduct(res.data);

          const variants: ProductVariant[] = Array.isArray(res.data.variants)
            ? res.data.variants
            : [];

          const defaultVariant =
            variants.find((v) => v.id === res.data.defaultVariantId) ??
            variants.find((v) => v.status === "active") ??
            variants[0];

          if (defaultVariant) {
            setSelectedVariantId(defaultVariant.id);

            const initialSelected: Record<number, number> = {};
            (defaultVariant.optionValues || []).forEach((ov) => {
              if (ov.optionId) initialSelected[ov.optionId] = ov.id;
            });
            setSelectedOptionValues(initialSelected);
          }

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

  const activeVariant = useMemo(() => {
    if (!product?.variants?.length) return null;

    if (selectedVariantId) {
      return product.variants.find((v) => v.id === selectedVariantId) ?? null;
    }

    return (
      product.variants.find((v) => v.id === product.defaultVariantId) ??
      product.variants.find((v) => v.status === "active") ??
      product.variants[0] ??
      null
    );
  }, [product, selectedVariantId]);

  const quantityInCart = useMemo(() => {
    if (!activeVariant) return 0;
    const item = items.find((i) => i.productVariantId === activeVariant.id);
    return item?.quantity || 0;
  }, [items, activeVariant]);

  const selectedStock = useMemo(() => {
    if (!product) return 0;

    if (activeVariant) {
      return Math.max(0, Number(activeVariant.stock ?? 0));
    }

    if (typeof product.totalStock === "number") {
      return Math.max(0, Number(product.totalStock));
    }

    return Math.max(0, Number(product.stock ?? 0));
  }, [product, activeVariant]);

  const remainingStock = useMemo(() => {
    return Math.max(0, selectedStock - quantityInCart);
  }, [selectedStock, quantityInCart]);

  useEffect(() => {
    if (!product?.variants?.length || !product.options?.length) return;

    const matchedVariant = product.variants.find((variant) => {
      const ids = variant.optionValueIds || [];
      return product.options!.every((option) => {
        const selectedValueId = selectedOptionValues[option.id];
        return selectedValueId ? ids.includes(selectedValueId) : true;
      });
    });

    if (matchedVariant) {
      setSelectedVariantId(matchedVariant.id);
    }
  }, [selectedOptionValues, product]);

  const handleSelectOptionValue = (optionId: number, valueId: number) => {
    setSelectedOptionValues((prev) => ({
      ...prev,
      [optionId]: valueId,
    }));
    setQuantity(1);
  };

  const displayPrice = Number(activeVariant?.price ?? product?.price ?? 0);
  const displayCompareAtPrice = activeVariant?.compareAtPrice ?? null;
  const hasVariantComparePrice =
    typeof displayCompareAtPrice === "number" &&
    displayCompareAtPrice > displayPrice;

  const animateFlyToCart = () => {
    return new Promise<void>((resolve) => {
      const sourceEl = productImageRef.current;
      const cartEl = document.getElementById("header-cart-button");

      if (!sourceEl || !cartEl) {
        resolve();
        return;
      }

      const sourceRect = sourceEl.getBoundingClientRect();
      const cartRect = cartEl.getBoundingClientRect();

      const flyingImg = document.createElement("img");
      flyingImg.src =
        product?.thumbnail ||
        "https://via.placeholder.com/600x600?text=No+Image";
      flyingImg.alt = product?.title || "Product";
      flyingImg.style.position = "fixed";
      flyingImg.style.left = `${sourceRect.left + sourceRect.width / 2 - 35}px`;
      flyingImg.style.top = `${sourceRect.top + sourceRect.height / 2 - 35}px`;
      flyingImg.style.width = "70px";
      flyingImg.style.height = "70px";
      flyingImg.style.borderRadius = "16px";
      flyingImg.style.objectFit = "cover";
      flyingImg.style.zIndex = "9999";
      flyingImg.style.pointerEvents = "none";
      flyingImg.style.boxShadow = "0 10px 30px rgba(0,0,0,0.18)";
      flyingImg.style.transition =
        "transform 0.8s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.8s ease, width 0.8s ease, height 0.8s ease";

      document.body.appendChild(flyingImg);

      const deltaX =
        cartRect.left +
        cartRect.width / 2 -
        (sourceRect.left + sourceRect.width / 2);
      const deltaY =
        cartRect.top +
        cartRect.height / 2 -
        (sourceRect.top + sourceRect.height / 2);

      requestAnimationFrame(() => {
        flyingImg.style.transform = `translate(${deltaX}px, ${deltaY}px) scale(0.2)`;
        flyingImg.style.opacity = "0.3";
        flyingImg.style.width = "36px";
        flyingImg.style.height = "36px";
      });

      setTimeout(() => {
        flyingImg.remove();
        cartEl.classList.add("animate-cart-bump");
        setTimeout(() => {
          cartEl.classList.remove("animate-cart-bump");
        }, 350);
        resolve();
      }, 850);
    });
  };

  // ==========================
  // XỬ LÝ CHUNG GIỎ HÀNG
  // ==========================
  const processCartAction = async (isBuyNow: boolean) => {
    if (!product || !activeVariant || isAddingToCart) return;

    if (!isAuthenticated) {
      navigate("/login");
      return;
    }

    if (quantity <= 0) {
      showErrorToast("Số lượng không hợp lệ");
      return;
    }

    if (quantity > remainingStock) {
      showErrorToast(`Chỉ còn ${remainingStock} sản phẩm có thể thêm`);
      return;
    }

    try {
      setIsAddingToCart(true);

      if (isBuyNow) {
        await addToCart(activeVariant.id, quantity);
        navigate("/cart");
        return;
      }

      const animationPromise = animateFlyToCart();

      await new Promise((resolve) => setTimeout(resolve, 650));
      await addToCart(activeVariant.id, quantity);

      await animationPromise;

      showSuccessToast({
        title: "Thêm vào giỏ hàng thành công",
        message: (
          <p>
            Bạn đã thêm{" "}
            <span className="font-bold text-slate-900">{quantity}</span> ×{" "}
            <span className="font-bold text-green-700">
              {product.title}
              {activeVariant.title ? ` - ${activeVariant.title}` : ""}
            </span>{" "}
            vào giỏ hàng.
          </p>
        ),
      });
    } catch (err) {
      console.error(err);
      showErrorToast("Có lỗi xảy ra khi thêm vào giỏ hàng, vui lòng thử lại!");
    } finally {
      setIsAddingToCart(false);
    }
  };

  const handleAddToCart = () => processCartAction(false);
  const handleBuyNow = () => processCartAction(true);

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

  useEffect(() => {
    setVisibleReviewCount(2);
  }, [ratingFilter]);

  if (isLoading) {
    return (
      <Layout>
        <div className="min-h-[70vh] flex flex-col items-center justify-center bg-[#fcfdfc]">
          <div className="h-16 w-16 animate-spin rounded-full border-4 border-slate-200 border-t-green-600 mb-4"></div>
          <p className="text-slate-500 font-medium">
            Đang tải thông tin trái cây tươi...
          </p>
        </div>
      </Layout>
    );
  }

  if (error || !product) {
    return (
      <Layout>
        <div className="min-h-[70vh] flex flex-col items-center justify-center bg-[#fcfdfc] px-4">
          <div className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-slate-100 text-center max-w-md w-full">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="mb-2 text-2xl font-bold text-slate-900">
              Opps! Không tìm thấy
            </h2>
            <p className="mb-8 text-slate-500 font-medium">
              {error || "Sản phẩm này không tồn tại hoặc đã bị xóa."}
            </p>
            <Link
              to="/products"
              className="inline-block w-full rounded-2xl bg-slate-900 px-6 py-4 font-bold text-white transition-all duration-300 hover:bg-green-700 active:scale-95 shadow-lg"
            >
              Quay lại cửa hàng
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  const isOutOfStock = remainingStock <= 0;

  return (
    <div className="flex flex-col min-h-screen bg-[#fcfdfc]">
      <Layout>
        {/* Banner & Breadcrumb */}
        <section className="relative overflow-hidden bg-gradient-to-b from-green-100/50 to-transparent py-8 text-center">
          <div className="container mx-auto relative z-10 px-4">
            <div className="flex items-center justify-center gap-2 text-slate-500 text-sm font-bold tracking-wide">
              <Link
                to="/"
                className="hover:text-green-600 transition-colors flex items-center gap-1"
              >
                <Home className="w-4 h-4" /> Trang chủ
              </Link>
              <ChevronRight className="w-4 h-4 opacity-50" />
              <Link
                to="/products"
                className="hover:text-green-600 transition-colors"
              >
                Sản phẩm
              </Link>
              <ChevronRight className="w-4 h-4 opacity-50" />
              <span className="text-green-700 truncate max-w-[150px] sm:max-w-xs">
                {product.title}
              </span>
            </div>
          </div>
        </section>

        {/* Khối Thông Tin Sản Phẩm */}
        <div className="container mx-auto px-4 lg:px-8 py-8 md:py-12">
          <div className="max-w-7xl mx-auto grid lg:grid-cols-12 gap-10 lg:gap-16 items-start">
            {/* Hình Ảnh */}
            <div className="lg:col-span-5 relative">
              <div className="bg-white rounded-[2.5rem] p-4 shadow-[0_20px_60px_rgba(0,0,0,0.04)] border border-slate-50 sticky top-24">
                <div className="relative aspect-square rounded-[2rem] overflow-hidden bg-slate-50 flex items-center justify-center group">
                  <img
                    ref={productImageRef}
                    src={
                      product.thumbnail ||
                      "https://via.placeholder.com/600x600?text=No+Image"
                    }
                    alt={product.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        "https://via.placeholder.com/600x600?text=No+Image";
                    }}
                  />

                  {/* Badges */}
                  <div className="absolute top-4 left-4 flex flex-col gap-2 z-10">
                    {product.featured && (
                      <span className="bg-yellow-400 text-yellow-900 px-4 py-1.5 rounded-xl text-xs font-black shadow-sm uppercase tracking-wider">
                        Bán Chạy
                      </span>
                    )}
                    {Number(product.discountPercentage ?? 0) > 0 && (
                      <span className="bg-red-500 text-white px-4 py-1.5 rounded-xl text-xs font-black shadow-sm">
                        -{Number(product.discountPercentage ?? 0)}%
                      </span>
                    )}
                  </div>

                  {product.category && (
                    <div className="absolute top-4 right-4 z-10">
                      <span className="bg-white/90 backdrop-blur-sm text-green-700 border border-green-100 px-4 py-1.5 rounded-xl text-xs font-bold shadow-sm">
                        {product.category.title}
                      </span>
                    </div>
                  )}

                  {isOutOfStock && (
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-20">
                      <span className="bg-white text-slate-900 px-6 py-3 rounded-2xl font-black text-lg shadow-xl">
                        TẠM HẾT HÀNG
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Chi Tiết */}
            <div className="lg:col-span-7 flex flex-col">
              <span className="text-green-600 font-bold tracking-widest uppercase text-xs mb-3 flex items-center gap-1.5">
                <Leaf className="w-4 h-4" /> Trái cây tươi tuyển chọn
              </span>

              <h1 className="text-3xl md:text-5xl font-black text-slate-900 leading-tight mb-6">
                {product.title}
              </h1>

              {/* Price Block */}
              <div className="flex items-end gap-4 mb-8 flex-wrap">
                {hasVariantComparePrice ? (
                  <>
                    <span className="text-4xl md:text-5xl font-black text-green-600 tracking-tight">
                      {displayPrice.toLocaleString("vi-VN")} đ
                    </span>
                    <div className="flex flex-col mb-1.5">
                      <span className="text-lg font-bold text-slate-400 line-through decoration-2">
                        {displayCompareAtPrice!.toLocaleString("vi-VN")} đ
                      </span>
                    </div>
                  </>
                ) : (
                  <span className="text-4xl md:text-5xl font-black text-green-600 tracking-tight">
                    {displayPrice.toLocaleString("vi-VN")} đ
                  </span>
                )}

                <span className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-2 ml-2">
                  {activeVariant?.title || "Quy cách mặc định"}
                </span>
              </div>

              {/* Mini Features */}
              <div className="flex flex-wrap gap-4 mb-8">
                <div className="flex items-center gap-2 bg-slate-50 border border-slate-100 px-4 py-2.5 rounded-xl text-slate-700 font-bold text-sm">
                  <ShieldCheck className="w-4 h-4 text-green-500" /> Chuẩn
                  VietGAP
                </div>
                <div className="flex items-center gap-2 bg-slate-50 border border-slate-100 px-4 py-2.5 rounded-xl text-slate-700 font-bold text-sm">
                  <Truck className="w-4 h-4 text-blue-500" /> Giao nhanh 2h
                </div>
              </div>

              {/* Variant / Option Selector */}
              {product.options && product.options.length > 0 && (
                <div className="space-y-5 mb-8">
                  {product.options.map((option) => (
                    <div key={option.id}>
                      <div className="text-sm font-bold text-slate-700 mb-3">
                        {option.name}
                      </div>
                      <div className="flex flex-wrap gap-3">
                        {option.values.map((value) => {
                          const selected =
                            selectedOptionValues[option.id] === value.id;

                          return (
                            <button
                              key={value.id}
                              type="button"
                              onClick={() =>
                                handleSelectOptionValue(option.id, value.id)
                              }
                              className={`px-4 py-2.5 rounded-xl border-2 font-bold text-sm transition-all ${
                                selected
                                  ? "border-green-600 bg-green-50 text-green-700"
                                  : "border-slate-200 bg-white text-slate-700 hover:border-green-300"
                              }`}
                            >
                              {value.value}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Action Area */}
              <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100 mb-8">
                {/* Stock Info */}
                <div className="flex justify-between items-center mb-6 text-sm font-bold">
                  <span
                    className={`${
                      selectedStock > 0
                        ? "text-green-600 bg-green-50 px-3 py-1 rounded-lg"
                        : "text-red-500 bg-red-50 px-3 py-1 rounded-lg"
                    }`}
                  >
                    {selectedStock > 0
                      ? `Còn hàng: ${selectedStock.toLocaleString()}`
                      : "Đã bán hết"}
                  </span>
                  <span className="text-slate-400">Mã SP: #{product.id}</span>
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                  {/* Stepper */}
                  <div className="flex items-center bg-slate-50 border border-slate-200 rounded-2xl p-1 shrink-0 h-[60px]">
                    <button
                      onClick={decreaseQuantity}
                      disabled={quantity <= 1 || isOutOfStock}
                      className={`w-12 h-full flex items-center justify-center rounded-xl shadow-sm transition-all
                          ${
                            quantity <= 1 || isOutOfStock
                              ? " opacity-50 bg-slate-100 text-slate-300 cursor-not-allowed"
                              : "bg-white text-slate-500 hover:text-green-600"
                          }`}
                    >
                      <Minus className="w-5 h-5 stroke-[3]" />
                    </button>
                    {/* focus -> xoá nhập số
                        blur -> xoá mà không nhập set về 1
                      */}
                    <input
                      type="number"
                      min="1"
                      max={remainingStock || 1}
                      value={quantity}
                      disabled={isOutOfStock}
                      onChange={(e) => {
                        const val = e.target.value;

                        // chỉ cho nhập số
                        if (!/^\d*$/.test(val)) return;

                        // nếu xoá hết → set rỗng thật
                        if (val === "") {
                          setQuantity(0);
                          return;
                        }
                        setQuantity(Number(val));
                      }}
                      onBlur={(e) => {
                        const val = e.target.value;

                        // chỉ xử lý khi blur
                        let qty = val === "" ? 1 : Number(val);

                        if (qty <= 0) qty = 1;

                        if (qty > remainingStock) {
                          showErrorToast(
                            `Chỉ còn ${remainingStock} sản phẩm có thể thêm`,
                          );
                          qty = remainingStock;
                        }

                        setQuantity(qty);
                      }}
                      onFocus={(e) => {
                        // optional: select toàn bộ để nhập nhanh
                        e.target.select();
                      }}
                      className="w-16 h-full text-center font-black text-xl text-slate-900 bg-transparent focus:outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
                    />

                    <button
                      onClick={increaseQuantity}
                      disabled={quantity >= remainingStock || isOutOfStock}
                      className={`w-12 h-full flex items-center justify-center rounded-xl shadow-sm transition-all
                          ${
                            quantity >= remainingStock || isOutOfStock
                              ? "opacity-50 bg-slate-100 text-slate-300 cursor-not-allowed"
                              : "bg-white text-slate-500 hover:text-green-600"
                          }`}
                    >
                      <Plus className="w-5 h-5 stroke-[3]" />
                    </button>
                  </div>

                  {/* 2 Buttons Container: Thêm Giỏ Hàng & Mua Ngay */}
                  <div className="flex-1 flex flex-col sm:flex-row gap-3">
                    {/* Thêm vào giỏ hàng (chỉ update cart) */}
                    <button
                      onClick={handleAddToCart}
                      disabled={isOutOfStock || isAddingToCart}
                      className={`flex-1 flex items-center justify-center gap-2 rounded-2xl h-[60px] font-bold text-sm lg:text-base transition-all duration-300 border-2 ${
                        isOutOfStock || isAddingToCart
                          ? "border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed"
                          : "border-green-600 text-green-600 bg-white hover:bg-green-50 active:scale-95"
                      }`}
                    >
                      <ShoppingCart className="w-5 h-5" />
                      Thêm vào giỏ
                    </button>

                    {/* Mua ngay (update cart + navigate /cart) */}
                    <button
                      onClick={handleBuyNow}
                      disabled={isOutOfStock}
                      className={`flex-1 flex items-center justify-center gap-2 rounded-2xl h-[60px] font-bold text-sm lg:text-base transition-all duration-300 ${
                        isOutOfStock
                          ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                          : "bg-slate-900 text-white hover:bg-green-700 hover:shadow-[0_15px_30px_rgba(34,197,94,0.3)] active:scale-95"
                      }`}
                    >
                      Mua ngay
                    </button>
                  </div>
                </div>

                {/* Warning Texts */}
                {(quantityInCart > 0 || remainingStock > 0) &&
                  !isOutOfStock && (
                    <div className="mt-4 flex flex-col gap-1">
                      {quantityInCart > 0 && (
                        <p className="text-sm font-medium text-blue-600 flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-blue-500"></span>{" "}
                          Đã có <b>{quantityInCart}</b> sản phẩm trong giỏ
                        </p>
                      )}
                      {remainingStock > 0 && remainingStock < 10 && (
                        <p className="text-sm font-medium text-orange-500 flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-orange-500"></span>{" "}
                          Chỉ được thêm tối đa <b>{remainingStock}</b> sản phẩm
                          nữa
                        </p>
                      )}
                    </div>
                  )}
              </div>
            </div>
          </div>
        </div>

        {/* ================== TABS SECTION ================== */}
        <div className="container mx-auto px-4 lg:px-8 py-10">
          <div className="max-w-7xl mx-auto">
            {/* Nav Tabs */}
            <div className="flex gap-2 p-1.5 bg-slate-100 rounded-2xl w-fit mb-8 overflow-x-auto custom-scrollbar">
              <button
                onClick={() => setActiveTab("description")}
                className={`min-w-[150px] py-3 px-6 rounded-xl font-bold transition-all duration-300 whitespace-nowrap ${
                  activeTab === "description"
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                Chi tiết sản phẩm
              </button>
              <button
                onClick={() => setActiveTab("reviews")}
                className={`min-w-[150px] py-3 px-6 rounded-xl font-bold transition-all duration-300 whitespace-nowrap flex items-center justify-center gap-2 ${
                  activeTab === "reviews"
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                Đánh giá{" "}
                <span
                  className={`px-2 py-0.5 rounded-lg text-xs ${activeTab === "reviews" ? "bg-slate-900 text-white" : "bg-slate-200"}`}
                >
                  {reviews.length}
                </span>
              </button>
            </div>

            {/* Tab Contents */}
            <div className="bg-white rounded-[2.5rem] p-8 md:p-12 shadow-[0_20px_60px_rgba(0,0,0,0.03)] border border-slate-50 min-h-[300px]">
              {/* DESC TAB */}
              {activeTab === "description" && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div
                    className="prose prose-lg prose-green max-w-none text-slate-600 leading-relaxed font-medium"
                    dangerouslySetInnerHTML={{
                      __html:
                        product.description ||
                        "<p>Thông tin chi tiết về sản phẩm đang được cập nhật. Vui lòng quay lại sau.</p>",
                    }}
                  />
                </div>
              )}

              {/* REVIEWS TAB */}
              {activeTab === "reviews" && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 grid lg:grid-cols-12 gap-10">
                  {/* Cột trái: Overview & Filters */}
                  <div className="lg:col-span-4 space-y-8">
                    <div className="bg-slate-50 rounded-[2rem] p-8 border border-slate-100 text-center">
                      <h3 className="font-bold text-slate-900 text-lg mb-2">
                        Đánh giá trung bình
                      </h3>
                      <div className="text-6xl font-black text-slate-900 mb-4">
                        {reviews.length > 0
                          ? (
                              reviews.reduce((acc, r) => acc + r.rating, 0) /
                              reviews.length
                            ).toFixed(1)
                          : "0.0"}
                      </div>
                      <div className="flex justify-center gap-1 text-yellow-400 mb-2">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star key={s} className="w-6 h-6 fill-current" />
                        ))}
                      </div>
                      <p className="text-sm font-bold text-slate-500">
                        Dựa trên {reviews.length} nhận xét
                      </p>
                    </div>

                    <div>
                      <h4 className="font-bold text-slate-800 uppercase tracking-wider text-sm mb-4">
                        Lọc đánh giá
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => setRatingFilter("all")}
                          className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-colors ${
                            ratingFilter === "all"
                              ? "bg-slate-900 text-white"
                              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                          }`}
                        >
                          Tất cả ({reviews.length})
                        </button>
                        {[5, 4, 3, 2, 1].map((star) => (
                          <button
                            key={star}
                            onClick={() => setRatingFilter(star)}
                            className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl font-bold text-sm transition-colors ${
                              ratingFilter === star
                                ? "bg-slate-900 text-white"
                                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                            }`}
                          >
                            {star}{" "}
                            <Star
                              className={`w-3.5 h-3.5 ${ratingFilter === star ? "fill-yellow-400 text-yellow-400" : "fill-slate-400 text-slate-400"}`}
                            />
                            <span className="opacity-60 ml-1">
                              ({ratingCounts[star as keyof typeof ratingCounts]}
                              )
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Cột phải: List Reviews */}
                  <div className="lg:col-span-8 space-y-6">
                    {filteredReviews.length === 0 ? (
                      <div className="text-center py-16 bg-slate-50 rounded-[2rem] border border-slate-100 border-dashed">
                        <MessageCircle className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                        <p className="text-slate-500 font-bold">
                          Chưa có đánh giá nào phù hợp.
                        </p>
                      </div>
                    ) : (
                      <>
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
                              className="bg-white rounded-[2rem] p-6 sm:p-8 shadow-sm border border-slate-100"
                            >
                              {/* Parent Review */}
                              <div className="flex items-start gap-4">
                                <img
                                  src={getAvatar(review.user)}
                                  className="w-12 h-12 rounded-full object-cover border-2 border-slate-50"
                                  alt="Avatar"
                                />
                                <div className="flex-1">
                                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-2">
                                    <h4 className="font-bold text-slate-900">
                                      {getDisplayName(review.user)}
                                    </h4>
                                    <span className="text-xs font-bold text-slate-400">
                                      {formatDateTime(
                                        review.created_at || review.createdAt,
                                      )}
                                    </span>
                                  </div>
                                  <div className="flex gap-1 mb-3 text-yellow-400">
                                    {Array.from({ length: 5 }).map((_, i) => (
                                      <Star
                                        key={i}
                                        className={`w-4 h-4 ${i < review.rating ? "fill-current" : "text-slate-200"}`}
                                      />
                                    ))}
                                  </div>
                                  <p className="text-slate-600 font-medium leading-relaxed bg-slate-50 p-4 rounded-2xl relative">
                                    {review.content}
                                  </p>
                                </div>
                              </div>

                              {/* Replies */}
                              {replies.length > 0 && (
                                <div className="mt-6 pl-12 md:pl-16 space-y-4">
                                  {visibleReplies.map((reply) => (
                                    <div
                                      key={reply.id}
                                      className="relative bg-green-50/50 rounded-2xl p-5 border border-green-100/50 flex gap-4"
                                    >
                                      <CornerDownRight className="absolute -left-6 top-6 w-4 h-4 text-green-300" />
                                      <img
                                        src={getAvatar(reply.user)}
                                        className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm"
                                        alt="Avatar"
                                      />
                                      <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                          <h5 className="font-bold text-green-800">
                                            {getDisplayName(reply.user)}
                                          </h5>
                                          <span className="bg-green-600 text-white text-[10px] font-black uppercase px-2 py-0.5 rounded-md">
                                            Admin
                                          </span>
                                        </div>
                                        <span className="text-xs font-bold text-slate-400 block mb-2">
                                          {formatDateTime(
                                            reply.created_at || reply.createdAt,
                                          )}
                                        </span>
                                        <p className="text-slate-600 font-medium leading-relaxed">
                                          {reply.content}
                                        </p>
                                      </div>
                                    </div>
                                  ))}

                                  {hasMoreReplies && (
                                    <button
                                      onClick={() =>
                                        handleShowMoreReplies(review.id)
                                      }
                                      className="text-sm font-bold text-green-600 hover:text-green-700 transition-colors ml-4"
                                    >
                                      Xem thêm phản hồi...
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}

                        {/* Button Load More Reviews */}
                        {filteredReviews.length > visibleReviewCount && (
                          <div className="text-center pt-4">
                            <button
                              onClick={handleShowMoreReviews}
                              className="bg-white border-2 border-slate-200 text-slate-700 font-bold px-8 py-3 rounded-xl hover:border-slate-300 hover:bg-slate-50 transition-all active:scale-95"
                            >
                              Tải thêm đánh giá
                            </button>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ================== RELATED PRODUCTS ================== */}
        {relatedProducts.length > 0 && (
          <section className="py-20 bg-slate-50 mt-10">
            <div className="container mx-auto px-4 lg:px-8">
              <div className="max-w-7xl mx-auto">
                <div className="text-center mb-12">
                  <span className="text-green-600 font-bold tracking-wider uppercase text-sm mb-2 block">
                    Gợi ý cho bạn
                  </span>
                  <h2 className="text-3xl md:text-4xl font-black text-slate-900">
                    Sản Phẩm Cùng Loại
                  </h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
                  {relatedProducts.map((p) => {
                    const hasDiscount = Number(p.discountPercentage ?? 0) > 0;
                    const finalPrice = getFinalPrice(p);
                    const displayStock = getProductDisplayStock(p);
                    const isOutOfStock = displayStock <= 0;

                    return (
                      <div
                        key={p.id}
                        className="group bg-white rounded-[2rem] overflow-hidden border border-slate-100 shadow-sm hover:shadow-[0_20px_50px_rgba(0,0,0,0.08)] transition-all duration-500 hover:-translate-y-1 flex flex-col"
                      >
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
                          <div className="absolute top-4 left-4 flex flex-col gap-2 z-10">
                            {hasDiscount && (
                              <span className="bg-red-500 text-white px-3 py-1.5 rounded-xl text-xs font-black shadow-sm">
                                -{Number(p.discountPercentage ?? 0)}%
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
                          {!isOutOfStock && (
                            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 translate-y-12 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 z-10 w-11/12">
                              <Link
                                to={`/products/${p.id}`}
                                onClick={() => window.scrollTo(0, 0)}
                                className="block w-full bg-slate-900/90 backdrop-blur text-white text-center py-3 rounded-2xl font-bold text-sm hover:bg-green-600 transition-colors"
                              >
                                Xem chi tiết
                              </Link>
                            </div>
                          )}
                        </div>
                        <div className="p-5 flex flex-col flex-grow">
                          <Link
                            to={`/products/${p.id}`}
                            onClick={() => window.scrollTo(0, 0)}
                            className="text-lg font-bold text-slate-900 hover:text-green-600 transition-colors line-clamp-2 mb-4 h-14"
                          >
                            {p.title}
                          </Link>
                          <div className="mt-auto">
                            <div className="flex items-end gap-2 flex-wrap mb-1">
                              <span className="text-xl font-black text-green-600">
                                {finalPrice.toLocaleString("vi-VN")} đ
                              </span>
                              {hasDiscount && (
                                <span className="text-sm font-medium text-slate-400 line-through mb-0.5">
                                  {p.price.toLocaleString("vi-VN")} đ
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </section>
        )}
      </Layout>
      <Footer />
    </div>
  );
};

export default ProductDetailPage;
