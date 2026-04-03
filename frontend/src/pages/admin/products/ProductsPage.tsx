import React, { useEffect, useMemo, useState } from "react";
import Card from "../../../components/admin/layouts/Card";
import {
  Search,
  Plus,
  Edit,
  Trash2,
  Eye,
  Loader2,
  PackageOpen,
  AlertCircle,
  Image as ImageIcon,
  ListTree,
  CheckCircle2,
  XCircle,
  Star,
  MessageSquareWarning,
  Activity,
  MessageSquare,
  PackagePlus,
  ChevronDown,
  ChevronUp,
  RefreshCcw,
  Clock,
  Filter,
} from "lucide-react";
import { useSearchParams, useNavigate } from "react-router-dom";
import Pagination from "../../../components/admin/common/Pagination";
import { http } from "../../../services/http";
import { useAdminToast } from "../../../context/AdminToastContext";

// =============================
// TYPES
// =============================
interface Product {
  category: any;
  id: number;
  product_category_id: number | string;
  category_name?: string;
  title: string;
  description: string;
  price: number;
  stock: number;
  thumbnail: string;
  status: string;
  featured: number | string;
  position: number;
  slug: string;
  average_rating?: number;
  review_count?: number;
  created_by_id?: number;
  totalStock?: number;
  total_stock?: number;
  priceRange?: {
    min: number;
    max: number;
  } | null;
  variants?: Array<{
    id: number;
    price: number;
    stock: number;
    availableStock?: number;
    inventory?: {
      availableQuantity: number;
    } | null;
    status: string;
  }>;
}

interface ReviewReply {
  id: number;
  content: string;
  createdAt?: string;
  created_at?: string;
  user?: { id: number; name: string; avatar?: string };
}

interface Review {
  id: number;
  rating: number;
  content: string;
  createdAt?: string;
  created_at?: string;
  user?: { id: number; name: string; avatar?: string };
  replies?: ReviewReply[];
}

interface ProductReviewState {
  loading: boolean;
  error: string;
  reviews: Review[];
  visibleReviewCount: number;
  activeReplyReviewId: number | null;
  visibleRepliesMap: Record<number, number>;
  filter: "needs_reply" | "all" | "replied";
}

interface ProductListSummary {
  totalItems: number;
  activeCount: number;
  inactiveCount: number;
  outOfStockCount: number;
  lowStockCount: number;
  missingThumbnailCount: number;
  pendingReviewCount: number;
  productsWithPendingReviewCount: number;
}

// =============================
// HELPERS
// =============================
const formatPrice = (price: number) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(Number(price || 0));

const formatDateTime = (date?: string) => {
  if (!date) return "—";
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return "—";
  return parsed.toLocaleString("vi-VN", {
    dateStyle: "short",
    timeStyle: "short",
  });
};

const parseNumberParam = (value: string | null): string => {
  if (value == null) return "";
  const trimmed = value.trim();
  if (!trimmed) return "";
  return Number.isFinite(Number(trimmed)) ? trimmed : "";
};

const getAverageRatingFromReviews = (reviews: Review[]): number => {
  if (!Array.isArray(reviews) || reviews.length === 0) return 0;

  const total = reviews.reduce((sum, review) => {
    return sum + Math.max(0, Number(review.rating || 0));
  }, 0);

  return Number((total / reviews.length).toFixed(1));
};

const getDisplayAverageRating = (
  product: Product,
  reviewState?: ProductReviewState,
): number => {
  if (
    reviewState &&
    Array.isArray(reviewState.reviews) &&
    reviewState.reviews.length > 0
  ) {
    return getAverageRatingFromReviews(reviewState.reviews);
  }

  const fallback = Number(product.average_rating ?? 0);
  return Number.isFinite(fallback) ? Number(fallback.toFixed(1)) : 0;
};

const getDisplayReviewCount = (
  product: Product,
  reviewState?: ProductReviewState,
): number => {
  if (
    reviewState &&
    Array.isArray(reviewState.reviews) &&
    reviewState.reviews.length > 0
  ) {
    return reviewState.reviews.length;
  }

  const fallback = Number(product.review_count ?? 0);
  return Number.isFinite(fallback) ? fallback : 0;
};

const getDisplayStock = (product: Product): number => {
  if (typeof product.totalStock === "number") {
    return Math.max(0, Number(product.totalStock));
  }
  if (typeof product.total_stock === "number") {
    return Math.max(0, Number(product.total_stock));
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

const getStockStatus = (stock: number) => {
  if (stock <= 0) {
    return {
      label: "Hết hàng",
      color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
    };
  }
  if (stock <= 10) {
    return {
      label: "Sắp hết",
      color:
        "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
    };
  }
  return {
    label: "Còn hàng",
    color:
      "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200",
  };
};

const getCatalogHealth = (product: Product) => {
  let score = 0;
  if (product.thumbnail) score += 25;
  if (product.category || product.category_name) score += 25;
  if (product.price > 0 || product.priceRange) score += 25;
  if (product.variants && product.variants.length > 0) score += 25;

  if (score === 100) {
    return {
      label: "Hoàn chỉnh",
      color:
        "text-emerald-600 bg-emerald-50 border-emerald-200 dark:bg-emerald-900/30 dark:border-emerald-800",
      percent: 100,
    };
  }
  if (score >= 50) {
    return {
      label: "Khá tốt",
      color:
        "text-blue-600 bg-blue-50 border-blue-200 dark:bg-blue-900/30 dark:border-blue-800",
      percent: score,
    };
  }
  return {
    label: "Thiếu dữ liệu",
    color:
      "text-orange-600 bg-orange-50 border-orange-200 dark:bg-orange-900/30 dark:border-orange-800",
    percent: score,
  };
};

const getReviewTaskPriority = (
  productId: number,
  pendingMap: Record<number, number>,
) => Number(pendingMap[productId] || 0);

const buildDefaultReviewState = (): ProductReviewState => ({
  loading: false,
  error: "",
  reviews: [],
  visibleReviewCount: 5,
  activeReplyReviewId: null,
  visibleRepliesMap: {},
  filter: "needs_reply",
});

// =============================
// REVIEW INLINE FORM
// =============================
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

      if (res?.success) {
        setContent("");
        onSuccess();
      } else {
        showErrorToast(res?.message || "Không thể gửi phản hồi.");
      }
    } catch (err) {
      showErrorToast("Lỗi khi gửi phản hồi.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-4 rounded-2xl border border-indigo-100 bg-indigo-50/70 p-4 shadow-sm dark:border-indigo-900/40 dark:bg-indigo-950/20">
      <div className="mb-3 flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-600 text-white shadow-sm">
          <MessageSquare className="h-3.5 w-3.5" />
        </div>
        <p className="text-sm font-bold text-indigo-900 dark:text-indigo-300">
          Phản hồi chính thức từ cửa hàng
        </p>
      </div>

      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={3}
        className="w-full rounded-xl border border-gray-200 bg-white p-3 text-sm text-gray-800 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
        placeholder="Nhập nội dung giải đáp hoặc cảm ơn khách hàng..."
      />

      <div className="mt-3 flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          className="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-100 disabled:opacity-50 dark:text-gray-300 dark:hover:bg-gray-800"
        >
          Hủy bỏ
        </button>
        <button
          type="button"
          onClick={handleReply}
          disabled={loading}
          className="rounded-lg bg-indigo-600 px-5 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-indigo-700 disabled:opacity-50"
        >
          {loading ? "Đang gửi..." : "Đăng phản hồi"}
        </button>
      </div>
    </div>
  );
};

// =============================
// MAIN PAGE
// =============================
const ProductsPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<number[]>([]);
  const [bulkAction, setBulkAction] = useState<string>("");

  const [summary, setSummary] = useState<ProductListSummary>({
    totalItems: 0,
    activeCount: 0,
    inactiveCount: 0,
    outOfStockCount: 0,
    lowStockCount: 0,
    missingThumbnailCount: 0,
    pendingReviewCount: 0,
    productsWithPendingReviewCount: 0,
  });

  const [reviewStates, setReviewStates] = useState<
    Record<number, ProductReviewState>
  >({});
  const [expandedProductIds, setExpandedProductIds] = useState<number[]>([]);

  const { showSuccessToast, showErrorToast } = useAdminToast();

  const [searchParams, setSearchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState<string>(
    searchParams.get("keyword") || "",
  );
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  const [totalPages, setTotalPages] = useState<number>(1);
  const [, setTotalItems] = useState<number>(0);

  const statusFilter = searchParams.get("status") || "all";
  const currentPage = Number(searchParams.get("page")) || 1;
  const navigate = useNavigate();

  const [sortOrder, setSortOrder] = useState<string>(
    searchParams.get("sort") || "",
  );
  const [pendingMap, setPendingMap] = useState<Record<number, number>>({});

  const reviewTaskFilter = searchParams.get("reviewTask") || "all";
  const quickFilter = searchParams.get("quickFilter") || "";

  const stockStatusFilter = searchParams.get("stockStatus") || "all";
  const minPriceFilter = parseNumberParam(searchParams.get("minPrice"));
  const maxPriceFilter = parseNumberParam(searchParams.get("maxPrice"));
  const minStockFilter = parseNumberParam(searchParams.get("minStock"));
  const maxStockFilter = parseNumberParam(searchParams.get("maxStock"));

  // =============================
  // FETCHERS
  // =============================
  const fetchPendingReviews = async () => {
    try {
      const res = await http("GET", "/api/v1/admin/reviews/pending-summary");
      if (res?.success && Array.isArray(res.data)) {
        const map: Record<number, number> = {};
        res.data.forEach((row: any) => {
          const productId = Number(row.productId);
          const pending = Number(row.pending || 0);
          if (!Number.isNaN(productId)) map[productId] = pending;
        });
        setPendingMap(map);
      } else {
        setPendingMap({});
      }
    } catch (err) {
      console.error("Lỗi lấy dữ liệu đánh giá chờ:", err);
      setPendingMap({});
    }
  };

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError("");

      let url = `/api/v1/admin/products?page=${currentPage}&limit=10`;

      if (statusFilter !== "all") {
        url += `&status=${encodeURIComponent(statusFilter)}`;
      }

      if (sortOrder) {
        const [field, dir] = String(sortOrder).split(":");
        if (field) {
          url += `&sortBy=${encodeURIComponent(field)}`;
          if (dir) {
            url += `&order=${encodeURIComponent(dir.toUpperCase())}`;
          }
        }
      }

      if (searchTerm.trim()) {
        url += `&keyword=${encodeURIComponent(searchTerm.trim())}`;
      }

      if (stockStatusFilter !== "all") {
        url += `&stockStatus=${encodeURIComponent(stockStatusFilter)}`;
      }

      if (minPriceFilter) {
        url += `&minPrice=${encodeURIComponent(minPriceFilter)}`;
      }

      if (maxPriceFilter) {
        url += `&maxPrice=${encodeURIComponent(maxPriceFilter)}`;
      }

      if (minStockFilter) {
        url += `&minStock=${encodeURIComponent(minStockFilter)}`;
      }

      if (maxStockFilter) {
        url += `&maxStock=${encodeURIComponent(maxStockFilter)}`;
      }

      if (quickFilter === "missing_thumb") {
        url += `&missingThumbnail=true`;
      }

      if (
        reviewTaskFilter === "pending_only" ||
        reviewTaskFilter === "critical"
      ) {
        url += `&hasPendingReviews=true`;
      }

      if (reviewTaskFilter === "no_pending") {
        url += `&hasPendingReviews=false`;
      }

      const json = await http<any>("GET", url);

      if (Array.isArray(json.data)) {
        const normalizedProducts = json.data.map((raw: any) => {
          const variants = Array.isArray(raw.variants)
            ? raw.variants.map((v: any) => ({
                id: Number(v.id),
                price: Number(v.price ?? 0),
                stock: Number(v.stock ?? 0),
                availableStock: v.availableStock ?? v.available_stock,
                inventory: v.inventory
                  ? {
                      availableQuantity: Number(
                        v.inventory.availableQuantity ??
                          v.inventory.available_quantity ??
                          0,
                      ),
                    }
                  : null,
                status: v.status ?? "active",
              }))
            : [];

          const priceRange = raw.priceRange ?? raw.price_range;
          const minP = priceRange?.min ?? priceRange?.minPrice;
          const maxP = priceRange?.max ?? priceRange?.maxPrice;

          const normalizedTotalStock =
            raw.totalStock ??
            raw.total_stock ??
            variants.reduce(
              (sum: number, variant: any) =>
                sum +
                Number(
                  variant.availableStock ??
                    variant.inventory?.availableQuantity ??
                    variant.stock ??
                    0,
                ),
              0,
            );

          return {
            ...raw,
            id: Number(raw.id),
            product_category_id:
              raw.product_category_id ??
              raw.categoryId ??
              raw.category_id ??
              "",
            price: Number(raw.price ?? 0),
            stock: Number(raw.stock ?? 0),
            position: Number(raw.position ?? 0),
            featured: raw.featured ?? 0,
            average_rating: Number(
              raw.average_rating ?? raw.averageRating ?? 0,
            ),
            review_count: Number(raw.review_count ?? raw.reviewCount ?? 0),
            category: raw.category ?? null,
            variants,
            totalStock: normalizedTotalStock,
            priceRange:
              minP !== undefined && maxP !== undefined
                ? { min: Number(minP), max: Number(maxP) }
                : null,
          } as Product;
        });

        setProducts(normalizedProducts);

        const total = Number(json.meta?.total ?? 0);
        const limit = Number(json.meta?.limit ?? 10);
        const apiSummary = json.meta?.summary ?? {};

        setTotalItems(total);
        setTotalPages(Math.max(1, Math.ceil(total / limit)));

        setSummary({
          totalItems: Number(apiSummary.totalItems ?? total),
          activeCount: Number(apiSummary.activeCount ?? 0),
          inactiveCount: Number(apiSummary.inactiveCount ?? 0),
          outOfStockCount: Number(apiSummary.outOfStockCount ?? 0),
          lowStockCount: Number(apiSummary.lowStockCount ?? 0),
          missingThumbnailCount: Number(apiSummary.missingThumbnailCount ?? 0),
          pendingReviewCount: Number(apiSummary.pendingReviewCount ?? 0),
          productsWithPendingReviewCount: Number(
            apiSummary.productsWithPendingReviewCount ?? 0,
          ),
        });
      } else {
        setError("Không thể tải danh sách sản phẩm.");
        setSummary({
          totalItems: 0,
          activeCount: 0,
          inactiveCount: 0,
          outOfStockCount: 0,
          lowStockCount: 0,
          missingThumbnailCount: 0,
          pendingReviewCount: 0,
          productsWithPendingReviewCount: 0,
        });
      }
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Lỗi kết nối máy chủ.");
      setSummary({
        totalItems: 0,
        activeCount: 0,
        inactiveCount: 0,
        outOfStockCount: 0,
        lowStockCount: 0,
        missingThumbnailCount: 0,
        pendingReviewCount: 0,
        productsWithPendingReviewCount: 0,
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchProductReviews = async (productId: number, force = false) => {
    const currentState = reviewStates[productId];
    if (!force && currentState?.reviews?.length) return;

    setReviewStates((prev) => ({
      ...prev,
      [productId]: {
        ...(prev[productId] || buildDefaultReviewState()),
        loading: true,
        error: "",
      },
    }));

    try {
      const json = await http<any>(
        "GET",
        `/api/v1/admin/reviews/product/${productId}`,
      );
      if (json.success && Array.isArray(json.data)) {
        const initialRepliesMap: Record<number, number> = {};
        json.data.forEach((review: Review) => {
          if (Array.isArray(review.replies) && review.replies.length > 0) {
            initialRepliesMap[review.id] = 2;
          }
        });

        setReviewStates((prev) => ({
          ...prev,
          [productId]: {
            ...(prev[productId] || buildDefaultReviewState()),
            loading: false,
            error: "",
            reviews: json.data,
            visibleReviewCount: 5,
            activeReplyReviewId: null,
            visibleRepliesMap: initialRepliesMap,
          },
        }));
      } else {
        setReviewStates((prev) => ({
          ...prev,
          [productId]: {
            ...(prev[productId] || buildDefaultReviewState()),
            loading: false,
            error: json.message || "Không thể tải đánh giá.",
          },
        }));
      }
    } catch (err) {
      setReviewStates((prev) => ({
        ...prev,
        [productId]: {
          ...(prev[productId] || buildDefaultReviewState()),
          loading: false,
          error: "Lỗi khi tải danh sách đánh giá.",
        },
      }));
    }
  };

  // =============================
  // EFFECTS
  // =============================
  useEffect(() => {
    setSelectedProducts([]);
  }, [
    currentPage,
    statusFilter,
    searchTerm,
    sortOrder,
    reviewTaskFilter,
    quickFilter,
    stockStatusFilter,
    minPriceFilter,
    maxPriceFilter,
    minStockFilter,
    maxStockFilter,
  ]);

  useEffect(() => {
    fetchProducts();
    fetchPendingReviews();
  }, [
    currentPage,
    statusFilter,
    searchTerm,
    sortOrder,
    reviewTaskFilter,
    quickFilter,
    stockStatusFilter,
    minPriceFilter,
    maxPriceFilter,
    minStockFilter,
    maxStockFilter,
  ]);

  useEffect(() => {
    const delay = setTimeout(() => {
      const params = new URLSearchParams(searchParams);
      if (searchTerm.trim()) params.set("keyword", searchTerm.trim());
      else params.delete("keyword");
      params.delete("page");
      setSearchParams(params);
    }, 500);

    return () => clearTimeout(delay);
  }, [searchTerm]);

  // =============================
  // DERIVED LIST
  // =============================
  const displayedProducts = useMemo(() => {
    const rows = [...products];

    if (reviewTaskFilter === "critical") {
      rows.sort((a, b) => {
        const pendingDiff =
          getReviewTaskPriority(b.id, pendingMap) -
          getReviewTaskPriority(a.id, pendingMap);
        if (pendingDiff !== 0) return pendingDiff;

        const ratingA = Number(a.average_rating ?? 0);
        const ratingB = Number(b.average_rating ?? 0);
        if (ratingA !== ratingB) return ratingA - ratingB;

        return Number(b.review_count ?? 0) - Number(a.review_count ?? 0);
      });
    }

    return rows;
  }, [products, reviewTaskFilter, pendingMap]);

  // =============================
  // ACTIONS
  // =============================
  const handleAddProduct = () => navigate("/admin/products/create");
  const handleEditProduct = (id: number) =>
    navigate(`/admin/products/edit/${id}`);

  const handleDeleteProduct = async (id: number) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa sản phẩm này?")) return;

    try {
      setLoading(true);
      await http("DELETE", `/api/v1/admin/products/delete/${id}`);
      setProducts((prev) => prev.filter((p) => p.id !== id));
      showSuccessToast({ message: "Đã xóa sản phẩm thành công!" });
    } catch (err) {
      showErrorToast(
        err instanceof Error ? err.message : "Không thể kết nối đến máy chủ!",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (product: Product) => {
    const newStatus =
      product.status.toLowerCase() === "active" ? "inactive" : "active";

    try {
      await http("PATCH", `/api/v1/admin/products/${product.id}/status`, {
        status: newStatus,
      });
      setProducts((prev) =>
        prev.map((p) =>
          p.id === product.id ? { ...p, status: newStatus } : p,
        ),
      );
      showSuccessToast({ message: "Đã cập nhật trạng thái!" });
    } catch (err) {
      showErrorToast(
        err instanceof Error ? err.message : "Không thể cập nhật trạng thái",
      );
    }
  };

  const handleFilterChange = (filter: string) => {
    const params = new URLSearchParams(searchParams);
    if (filter === "all") params.delete("status");
    else params.set("status", filter);
    params.delete("page");
    setSearchParams(params);
  };

  const handleReviewTaskFilterChange = (value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value === "all") params.delete("reviewTask");
    else params.set("reviewTask", value);
    params.delete("page");
    setSearchParams(params);
  };

  const handleQuickFilterToggle = (value: string) => {
    const params = new URLSearchParams(searchParams);
    if (params.get("quickFilter") === value) params.delete("quickFilter");
    else params.set("quickFilter", value);
    params.delete("page");
    setSearchParams(params);
  };

  const handleStockStatusFilterChange = (value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value === "all") params.delete("stockStatus");
    else params.set("stockStatus", value);
    params.delete("page");
    setSearchParams(params);
  };

  const handleRangeFilterChange = (
    key: "minPrice" | "maxPrice" | "minStock" | "maxStock",
    value: string,
  ) => {
    const params = new URLSearchParams(searchParams);
    const trimmed = value.trim();

    if (!trimmed) {
      params.delete(key);
    } else {
      params.set(key, trimmed);
    }

    params.delete("page");
    setSearchParams(params);
  };

  const handleToggleExpand = async (productId: number) => {
    const isExpanded = expandedProductIds.includes(productId);

    if (isExpanded) {
      setExpandedProductIds((prev) => prev.filter((id) => id !== productId));
      return;
    }

    setExpandedProductIds((prev) => [...prev, productId]);
    await fetchProductReviews(productId);
  };

  const refreshProductReviewWorkspace = async (productId: number) => {
    await Promise.all([
      fetchProductReviews(productId, true),
      fetchPendingReviews(),
    ]);
    await fetchProducts();
  };

  const setProductReviewFilter = (
    productId: number,
    filter: "needs_reply" | "all" | "replied",
  ) => {
    setReviewStates((prev) => ({
      ...prev,
      [productId]: {
        ...(prev[productId] || buildDefaultReviewState()),
        filter,
      },
    }));
  };

  const setProductActiveReply = (
    productId: number,
    reviewId: number | null,
  ) => {
    setReviewStates((prev) => ({
      ...prev,
      [productId]: {
        ...(prev[productId] || buildDefaultReviewState()),
        activeReplyReviewId: reviewId,
      },
    }));
  };

  const loadMoreReviews = (productId: number) => {
    setReviewStates((prev) => ({
      ...prev,
      [productId]: {
        ...(prev[productId] || buildDefaultReviewState()),
        visibleReviewCount: (prev[productId]?.visibleReviewCount || 5) + 5,
      },
    }));
  };

  const loadMoreReplies = (productId: number, reviewId: number) => {
    setReviewStates((prev) => {
      const current = prev[productId] || buildDefaultReviewState();
      return {
        ...prev,
        [productId]: {
          ...current,
          visibleRepliesMap: {
            ...current.visibleRepliesMap,
            [reviewId]: (current.visibleRepliesMap[reviewId] || 2) + 3,
          },
        },
      };
    });
  };

  // =============================
  // BULK ACTION
  // =============================
  const handleBulkAction = async () => {
    if (!bulkAction) {
      showErrorToast("Vui lòng chọn một hành động!");
      return;
    }

    if (
      !window.confirm(
        `Xác nhận thực hiện thao tác này cho ${selectedProducts.length} sản phẩm?`,
      )
    ) {
      return;
    }

    try {
      const body: any = { ids: selectedProducts, updated_by_id: 1 };

      if (bulkAction === "activate") {
        body.action = "status";
        body.value = "active";
      } else if (bulkAction === "deactivate") {
        body.action = "status";
        body.value = "inactive";
      } else if (bulkAction === "delete") {
        body.action = "delete";
      }

      await http("PATCH", "/api/v1/admin/products/bulk-edit", body);
      showSuccessToast({ message: "Thao tác hàng loạt thành công!" });
      setSelectedProducts([]);
      fetchProducts();
    } catch (err) {
      showErrorToast("Có lỗi xảy ra khi thực hiện thao tác hàng loạt.");
    }
  };

  return (
    <div className="w-full pb-10 space-y-8">
      {/* A. HEADER */}
      <section className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
            Bảng Điều Khiển Danh Mục
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">
            Quản lý sản phẩm, tình trạng tồn kho, chất lượng dữ liệu và xử lý
            phản hồi khách hàng ngay trên một màn hình.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <button
            onClick={handleAddProduct}
            className="flex flex-1 md:flex-none items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 shadow-sm transition-colors"
          >
            <Plus className="w-5 h-5" />
            Thêm Sản Phẩm
          </button>
        </div>
      </section>

      {/* B. KPI */}
      <section className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="p-5 flex flex-col justify-between border-l-4 border-blue-500">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Tổng Danh Mục
              </p>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {summary.totalItems}
              </h3>
            </div>
            <PackageOpen className="w-8 h-8 text-blue-100 fill-blue-500" />
          </div>
        </Card>

        <Card className="p-5 flex flex-col justify-between border-l-4 border-emerald-500">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Đang Hoạt Động
              </p>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {summary.activeCount}
              </h3>
            </div>
            <CheckCircle2 className="w-8 h-8 text-emerald-100 fill-emerald-500" />
          </div>
        </Card>

        <Card className="p-5 flex flex-col justify-between border-l-4 border-gray-400">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Dừng Hoạt Động
              </p>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {summary.inactiveCount}
              </h3>
            </div>
            <XCircle className="w-8 h-8 text-gray-200 fill-gray-500" />
          </div>
        </Card>

        <Card className="p-5 flex flex-col justify-between border-l-4 border-orange-500">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Sắp Hết Hàng
              </p>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {summary.lowStockCount}
              </h3>
            </div>
            <AlertCircle className="w-8 h-8 text-orange-100 fill-orange-500" />
          </div>
        </Card>

        <Card className="p-5 flex flex-col justify-between border-l-4 border-purple-500">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Review Chờ Phản Hồi
              </p>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {summary.pendingReviewCount}
              </h3>
            </div>
            <MessageSquareWarning className="w-8 h-8 text-purple-100 fill-purple-500" />
          </div>
        </Card>
      </section>

      {/* C. ACTION CENTER */}
      {(summary.lowStockCount > 0 ||
        summary.outOfStockCount > 0 ||
        summary.missingThumbnailCount > 0 ||
        summary.pendingReviewCount > 0) && (
        <section className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="w-5 h-5 text-orange-600 dark:text-orange-400" />
            <h3 className="text-base font-semibold text-orange-800 dark:text-orange-300">
              Trung Tâm Xử Lý Nhanh
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {summary.pendingReviewCount > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm flex justify-between items-center border border-gray-100 dark:border-gray-700">
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {summary.pendingReviewCount} review đang chờ phản hồi
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Ưu tiên xử lý sản phẩm có khách hàng đang đợi phản hồi
                  </p>
                </div>
                <button
                  onClick={() => handleReviewTaskFilterChange("pending_only")}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  Lọc ngay
                </button>
              </div>
            )}

            {summary.outOfStockCount > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm flex justify-between items-center border border-gray-100 dark:border-gray-700">
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {summary.outOfStockCount} sản phẩm đã hết hàng
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Cần ưu tiên nhập kho ngay
                  </p>
                </div>
                <button
                  onClick={() => handleStockStatusFilterChange("out_of_stock")}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  Lọc ngay
                </button>
              </div>
            )}

            {summary.lowStockCount > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm flex justify-between items-center border border-gray-100 dark:border-gray-700">
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {summary.lowStockCount} sản phẩm sắp hết hàng
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Nên lên kế hoạch nhập kho sớm
                  </p>
                </div>
                <button
                  onClick={() => handleStockStatusFilterChange("low_stock")}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  Lọc ngay
                </button>
              </div>
            )}

            {summary.missingThumbnailCount > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm flex justify-between items-center border border-gray-100 dark:border-gray-700">
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {summary.missingThumbnailCount} thiếu hình ảnh
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Cần bổ sung thumbnail
                  </p>
                </div>
                <button
                  onClick={() => handleQuickFilterToggle("missing_thumb")}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  {quickFilter === "missing_thumb" ? "Hủy lọc" : "Lọc ngay"}
                </button>
              </div>
            )}
          </div>
        </section>
      )}

      {/* D. FILTER BAR */}
      <section className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col gap-4 sticky top-0 z-10">
        <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
          <div className="relative w-full lg:w-96">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-10 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              placeholder="Tìm theo ID, Tên, Mã sản phẩm..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
              >
                <XCircle className="h-5 w-5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 w-full lg:w-auto overflow-x-auto pb-1 lg:pb-0">
            <div className="flex bg-gray-100 dark:bg-gray-900 p-1 rounded-lg">
              {[
                { id: "all", label: "Tất cả" },
                { id: "active", label: "Hoạt động" },
                { id: "inactive", label: "Dừng" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => handleFilterChange(tab.id)}
                  className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${
                    statusFilter === tab.id
                      ? "bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm"
                      : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="h-6 w-px bg-gray-300 dark:bg-gray-700 mx-2 hidden sm:block" />

            <select
              value={sortOrder}
              onChange={(e) => {
                setSortOrder(e.target.value);
                const params = new URLSearchParams(searchParams);
                if (e.target.value) params.set("sort", e.target.value);
                else params.delete("sort");
                params.delete("page");
                setSearchParams(params);
              }}
              className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="">Sắp xếp mặc định</option>
              <option value="createdAt:desc">Mới nhất</option>
              <option value="price:asc">Giá: Thấp đến Cao</option>
              <option value="price:desc">Giá: Cao đến Thấp</option>
              <option value="stock:asc">Tồn kho: Ít đến Nhiều</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-3 border-t border-gray-100 dark:border-gray-700 pt-3">
          <select
            value={stockStatusFilter}
            onChange={(e) => handleStockStatusFilterChange(e.target.value)}
            className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none"
          >
            <option value="all">Tất cả tồn kho</option>
            <option value="out_of_stock">Hết hàng</option>
            <option value="low_stock">Sắp hết</option>
            <option value="in_stock">Còn hàng ổn định</option>
          </select>

          <input
            type="number"
            min="0"
            value={minPriceFilter}
            onChange={(e) =>
              handleRangeFilterChange("minPrice", e.target.value)
            }
            placeholder="Giá từ"
            className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none"
          />

          <input
            type="number"
            min="0"
            value={maxPriceFilter}
            onChange={(e) =>
              handleRangeFilterChange("maxPrice", e.target.value)
            }
            placeholder="Giá đến"
            className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none"
          />

          <input
            type="number"
            min="0"
            value={minStockFilter}
            onChange={(e) =>
              handleRangeFilterChange("minStock", e.target.value)
            }
            placeholder="Tồn kho từ"
            className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none"
          />

          <input
            type="number"
            min="0"
            value={maxStockFilter}
            onChange={(e) =>
              handleRangeFilterChange("maxStock", e.target.value)
            }
            placeholder="Tồn kho đến"
            className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>

        <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-3 border-t border-gray-100 dark:border-gray-700 pt-3">
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
            <Filter className="w-4 h-4" />
            <span className="font-medium">Bộ lọc tác vụ review:</span>
          </div>

          <div className="flex flex-wrap gap-2">
            {[
              { id: "all", label: "Tất cả sản phẩm" },
              { id: "pending_only", label: "Có review chưa reply" },
              { id: "no_pending", label: "Không có review chờ" },
              { id: "critical", label: "Ưu tiên xử lý" },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => handleReviewTaskFilterChange(item.id)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                  reviewTaskFilter === item.id
                    ? "bg-purple-600 text-white border-purple-600 shadow-sm"
                    : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:border-purple-400"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* E. BULK ACTION */}
      {selectedProducts.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-xl shadow-sm animate-in fade-in slide-in-from-top-4">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 text-white text-sm font-bold px-3 py-1 rounded-full">
              {selectedProducts.length}
            </div>
            <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
              Sản phẩm đang được chọn
            </p>
          </div>

          <div className="flex items-center gap-3">
            <select
              value={bulkAction}
              onChange={(e) => setBulkAction(e.target.value)}
              className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="">-- Hành động hàng loạt --</option>
              <option value="activate">Bật hoạt động</option>
              <option value="deactivate">Dừng hoạt động</option>
              <option value="delete">Xóa sản phẩm</option>
            </select>

            <button
              onClick={handleBulkAction}
              className="px-4 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-sm font-medium rounded-lg hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors"
            >
              Áp dụng
            </button>
          </div>
        </div>
      )}

      {/* F. TABLE + EXPANSION */}
      <Card className="overflow-hidden border border-gray-200 dark:border-gray-700 shadow-sm rounded-xl">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex flex-col justify-center items-center py-24 space-y-4">
              <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
              <span className="text-gray-500 dark:text-gray-400 font-medium">
                Đang tải dữ liệu danh mục...
              </span>
            </div>
          ) : error ? (
            <div className="text-center py-16">
              <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-3" />
              <p className="text-red-600 dark:text-red-400 font-medium">
                {error}
              </p>
              <button
                onClick={fetchProducts}
                className="mt-4 px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 rounded-lg text-sm transition-colors"
              >
                Thử lại
              </button>
            </div>
          ) : displayedProducts.length === 0 ? (
            <div className="text-center py-20 flex flex-col items-center">
              <PackageOpen className="w-16 h-16 text-gray-300 dark:text-gray-600 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Không tìm thấy sản phẩm
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mt-1 mb-6 text-sm">
                Thử thay đổi bộ lọc hoặc thêm sản phẩm mới.
              </p>
              <button
                onClick={handleAddProduct}
                className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
              >
                <Plus className="w-5 h-5" />
                Thêm Sản Phẩm Ngay
              </button>
            </div>
          ) : (
            <table className="min-w-full text-left divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50/50 dark:bg-gray-800/50">
                <tr>
                  <th className="px-4 py-4 w-10 text-center">
                    <input
                      type="checkbox"
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                      checked={
                        selectedProducts.length > 0 &&
                        selectedProducts.length === displayedProducts.length
                      }
                      onChange={(e) =>
                        setSelectedProducts(
                          e.target.checked
                            ? displayedProducts.map((p) => p.id)
                            : [],
                        )
                      }
                    />
                  </th>

                  <th className="px-4 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Sản Phẩm
                  </th>
                  <th className="px-4 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Danh Mục
                  </th>
                  <th className="px-4 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">
                    Giá Bán
                  </th>
                  <th className="px-4 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Kho
                  </th>
                  <th className="px-4 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Review
                  </th>
                  <th className="px-4 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Sức Khỏe DL
                  </th>
                  <th className="px-4 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Trạng Thái
                  </th>
                  <th className="px-4 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">
                    Thao Tác
                  </th>
                </tr>
              </thead>

              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-100 dark:divide-gray-800">
                {displayedProducts.map((product) => {
                  const displayStock = getDisplayStock(product);
                  const stockState = getStockStatus(displayStock);
                  const health = getCatalogHealth(product);
                  const hasPending = pendingMap[product.id] > 0;
                  const isExpanded = expandedProductIds.includes(product.id);

                  const productReviewState =
                    reviewStates[product.id] || buildDefaultReviewState();

                  const displayAverageRating = getDisplayAverageRating(
                    product,
                    productReviewState,
                  );
                  const displayReviewCount = getDisplayReviewCount(
                    product,
                    productReviewState,
                  );

                  let filteredReviews = [...productReviewState.reviews];
                  if (productReviewState.filter === "needs_reply") {
                    filteredReviews = filteredReviews.filter(
                      (rv) => !rv.replies || rv.replies.length === 0,
                    );
                  } else if (productReviewState.filter === "replied") {
                    filteredReviews = filteredReviews.filter(
                      (rv) => rv.replies && rv.replies.length > 0,
                    );
                  }

                  filteredReviews.sort(
                    (a, b) =>
                      new Date(b.created_at || b.createdAt || 0).getTime() -
                      new Date(a.created_at || a.createdAt || 0).getTime(),
                  );

                  const visibleReviews = filteredReviews.slice(
                    0,
                    productReviewState.visibleReviewCount,
                  );
                  const hasMoreReviews =
                    productReviewState.visibleReviewCount <
                    filteredReviews.length;

                  const reviewRatingDist = productReviewState.reviews.reduce(
                    (acc, rv) => {
                      const key = Math.max(
                        1,
                        Math.min(5, Math.round(rv.rating || 0)),
                      );
                      acc[key as 1 | 2 | 3 | 4 | 5] += 1;
                      return acc;
                    },
                    { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
                  );

                  return (
                    <React.Fragment key={product.id}>
                      <tr className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group">
                        <td className="px-4 py-4 text-center align-top">
                          <input
                            type="checkbox"
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                            checked={selectedProducts.includes(product.id)}
                            onChange={(e) =>
                              setSelectedProducts((prev) =>
                                e.target.checked
                                  ? [...prev, product.id]
                                  : prev.filter((id) => id !== product.id),
                              )
                            }
                          />
                        </td>

                        <td className="px-4 py-4 align-top">
                          <div className="flex items-start gap-4">
                            <div className="relative shrink-0">
                              {product.thumbnail ? (
                                <img
                                  src={product.thumbnail}
                                  alt={product.title}
                                  className="h-12 w-12 rounded-lg object-cover border border-gray-200 dark:border-gray-700 bg-white"
                                />
                              ) : (
                                <div className="h-12 w-12 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center border border-gray-200 dark:border-gray-700">
                                  <ImageIcon className="w-5 h-5 text-gray-400" />
                                </div>
                              )}

                              {hasPending && (
                                <span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-2 ring-white dark:ring-gray-900">
                                  {pendingMap[product.id]}
                                </span>
                              )}
                            </div>

                            <div className="flex flex-col min-w-[220px] max-w-[340px]">
                              <span
                                className="text-sm font-semibold text-gray-900 dark:text-white truncate"
                                title={product.title}
                              >
                                {product.title}
                              </span>

                              <div className="flex items-center gap-2 mt-1 text-xs text-gray-500 dark:text-gray-400 flex-wrap">
                                <span>ID: {product.id}</span>
                                <span>•</span>
                                <span className="flex items-center gap-1">
                                  <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                                  {displayAverageRating.toFixed(1)} (
                                  {displayReviewCount})
                                </span>
                              </div>

                              <div className="mt-1.5 flex flex-wrap gap-2">
                                {product.variants &&
                                  product.variants.length > 0 && (
                                    <span className="inline-block px-2 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 text-[10px] rounded-md font-medium border border-gray-200 dark:border-gray-700">
                                      {product.variants.length} biến thể
                                    </span>
                                  )}

                                {hasPending && (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-50 text-red-600 border border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800 text-[10px] rounded-md font-bold">
                                    <MessageSquareWarning className="w-3 h-3" />
                                    {pendingMap[product.id]} chờ phản hồi
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="px-4 py-4 whitespace-nowrap align-top">
                          <span className="text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 px-2.5 py-1 rounded-md border border-gray-100 dark:border-gray-700">
                            {product.category?.title ||
                              product.category_name ||
                              "Chưa phân loại"}
                          </span>
                        </td>

                        <td className="px-4 py-4 whitespace-nowrap text-right align-top">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {product.priceRange
                              ? `${formatPrice(product.priceRange.min)} - ${formatPrice(
                                  product.priceRange.max,
                                )}`
                              : formatPrice(product.price)}
                          </div>
                        </td>

                        <td className="px-4 py-4 whitespace-nowrap align-top">
                          <div className="flex flex-col gap-1">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium w-max ${stockState.color}`}
                            >
                              {stockState.label}
                            </span>
                            <span className="text-xs text-gray-500 dark:text-gray-400 font-medium ml-1">
                              {displayStock} sản phẩm
                            </span>
                          </div>
                        </td>

                        <td className="px-4 py-4 whitespace-nowrap align-top">
                          <div className="flex flex-col gap-1">
                            <span className="text-sm font-semibold text-gray-900 dark:text-white">
                              {displayReviewCount} đánh giá
                            </span>
                            <span
                              className={`text-xs font-medium ${
                                hasPending
                                  ? "text-red-600 dark:text-red-400"
                                  : "text-gray-500 dark:text-gray-400"
                              }`}
                            >
                              {hasPending
                                ? `${pendingMap[product.id]} chưa reply`
                                : "Đã xử lý ổn"}
                            </span>
                          </div>
                        </td>

                        <td className="px-4 py-4 whitespace-nowrap align-top">
                          <div className="flex items-center gap-2">
                            <div className="w-16 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                              <div
                                className="h-full rounded-full"
                                style={{
                                  width: `${health.percent}%`,
                                  backgroundColor:
                                    health.percent === 100
                                      ? "#10b981"
                                      : health.percent >= 50
                                        ? "#3b82f6"
                                        : "#f97316",
                                }}
                              />
                            </div>
                            <span
                              className={`text-xs font-medium px-2 py-0.5 rounded-md border ${health.color}`}
                            >
                              {health.label}
                            </span>
                          </div>
                        </td>

                        <td className="px-4 py-4 whitespace-nowrap align-top">
                          <button
                            onClick={() => handleToggleStatus(product)}
                            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900 ${
                              product.status?.toLowerCase() === "active"
                                ? "bg-emerald-500"
                                : "bg-gray-300 dark:bg-gray-600"
                            }`}
                            title="Click để đổi trạng thái"
                          >
                            <span
                              className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                                product.status?.toLowerCase() === "active"
                                  ? "translate-x-5"
                                  : "translate-x-1"
                              }`}
                            />
                          </button>
                        </td>

                        <td className="px-4 py-4 whitespace-nowrap text-right align-top">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleEditProduct(product.id)}
                              className="p-1.5 text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-md transition-colors"
                              title="Chỉnh sửa thông tin"
                            >
                              <Edit className="w-4 h-4" />
                            </button>

                            <button
                              onClick={() => handleToggleExpand(product.id)}
                              className={`relative p-1.5 rounded-md transition-colors ${
                                isExpanded
                                  ? "text-purple-600 bg-purple-50 dark:bg-purple-900/30 dark:text-purple-300"
                                  : "text-gray-500 hover:text-purple-600 dark:text-gray-400 dark:hover:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/30"
                              }`}
                              title="Mở không gian phản hồi review"
                            >
                              <MessageSquare className="w-4 h-4" />
                              {hasPending && !isExpanded && (
                                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border border-white dark:border-gray-900" />
                              )}
                            </button>

                            <button
                              onClick={() =>
                                navigate(
                                  `/admin/inventory?productId=${product.id}`,
                                )
                              }
                              className="p-1.5 text-gray-500 hover:text-emerald-600 dark:text-gray-400 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded-md transition-colors"
                              title="Chi tiết xuất/nhập tồn"
                            >
                              <PackagePlus className="w-4 h-4" />
                            </button>

                            <button
                              onClick={() => handleDeleteProduct(product.id)}
                              className="p-1.5 text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-md transition-colors"
                              title="Xóa sản phẩm"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>

                            <button
                              onClick={() =>
                                window.open(
                                  `/products/${product.slug || product.id}`,
                                  "_blank",
                                )
                              }
                              className="p-1.5 text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white rounded-md transition-colors"
                              title="Xem ngoài cửa hàng"
                            >
                              <Eye className="w-4 h-4" />
                            </button>

                            <button
                              onClick={() => handleToggleExpand(product.id)}
                              className="p-1.5 text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white rounded-md transition-colors"
                              title={isExpanded ? "Thu gọn" : "Mở rộng"}
                            >
                              {isExpanded ? (
                                <ChevronUp className="w-4 h-4" />
                              ) : (
                                <ChevronDown className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>

                      {isExpanded && (
                        <tr className="bg-gray-50/70 dark:bg-gray-900/50">
                          <td colSpan={9} className="px-6 py-6">
                            <div className="rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-900 overflow-hidden">
                              {/* Workspace Header */}
                              <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4 border-b border-gray-100 dark:border-gray-800 px-5 py-4">
                                <div className="flex items-start gap-4">
                                  <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-gray-200 bg-gray-50 dark:border-gray-700">
                                    {product.thumbnail ? (
                                      <img
                                        src={product.thumbnail}
                                        alt={product.title}
                                        className="h-full w-full object-cover"
                                      />
                                    ) : (
                                      <div className="h-full w-full flex items-center justify-center">
                                        <ImageIcon className="w-5 h-5 text-gray-400" />
                                      </div>
                                    )}
                                  </div>

                                  <div>
                                    <h3 className="text-base font-bold text-gray-900 dark:text-white">
                                      Không gian phản hồi review
                                    </h3>
                                    <p className="text-sm text-gray-500 mt-0.5">
                                      {product.title}
                                    </p>
                                    <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 font-semibold text-amber-700 dark:bg-amber-900/20 dark:text-amber-300">
                                        <Star className="w-3 h-3 fill-current" />
                                        {displayAverageRating.toFixed(1)}
                                      </span>
                                      <span className="rounded-full bg-gray-100 px-2.5 py-1 font-medium text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                                        {displayReviewCount} đánh giá
                                      </span>
                                      <span
                                        className={`rounded-full px-2.5 py-1 font-medium ${
                                          hasPending
                                            ? "bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-300"
                                            : "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300"
                                        }`}
                                      >
                                        {hasPending
                                          ? `${pendingMap[product.id]} chưa reply`
                                          : "Không có review chờ"}
                                      </span>
                                    </div>
                                  </div>
                                </div>

                                <div className="flex flex-col sm:flex-row gap-3">
                                  <div className="flex rounded-lg bg-gray-100 p-1 dark:bg-gray-800">
                                    {[
                                      {
                                        id: "needs_reply",
                                        label: "Chưa reply",
                                      },
                                      { id: "all", label: "Tất cả" },
                                      { id: "replied", label: "Đã reply" },
                                    ].map((tab) => (
                                      <button
                                        key={tab.id}
                                        onClick={() =>
                                          setProductReviewFilter(
                                            product.id,
                                            tab.id as
                                              | "needs_reply"
                                              | "all"
                                              | "replied",
                                          )
                                        }
                                        className={`px-4 py-1.5 text-sm font-semibold rounded-md transition-all ${
                                          productReviewState.filter === tab.id
                                            ? "bg-white text-gray-900 shadow-sm dark:bg-gray-700 dark:text-white"
                                            : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-200"
                                        }`}
                                      >
                                        {tab.label}
                                      </button>
                                    ))}
                                  </div>

                                  <button
                                    onClick={() =>
                                      refreshProductReviewWorkspace(product.id)
                                    }
                                    className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                                  >
                                    <RefreshCcw className="w-4 h-4" />
                                    Làm mới
                                  </button>
                                </div>
                              </div>

                              {/* Workspace Body */}
                              <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 p-5">
                                {/* Review Feed */}
                                <div className="xl:col-span-8 space-y-5">
                                  {productReviewState.loading ? (
                                    <div className="flex justify-center py-12">
                                      <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                                    </div>
                                  ) : productReviewState.error ? (
                                    <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center dark:border-red-900/30 dark:bg-red-900/10">
                                      <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
                                      <p className="text-sm font-medium text-red-600 dark:text-red-400">
                                        {productReviewState.error}
                                      </p>
                                    </div>
                                  ) : visibleReviews.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-16 text-center border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-2xl">
                                      <MessageSquare className="h-12 w-12 text-gray-300 dark:text-gray-600 mb-3" />
                                      <p className="text-gray-500 font-medium">
                                        Không có đánh giá nào phù hợp với bộ lọc
                                        hiện tại.
                                      </p>
                                    </div>
                                  ) : (
                                    <>
                                      {visibleReviews.map((rv) => {
                                        const allReplies = Array.isArray(
                                          rv.replies,
                                        )
                                          ? [...rv.replies].sort(
                                              (a, b) =>
                                                new Date(
                                                  a.created_at ||
                                                    a.createdAt ||
                                                    0,
                                                ).getTime() -
                                                new Date(
                                                  b.created_at ||
                                                    b.createdAt ||
                                                    0,
                                                ).getTime(),
                                            )
                                          : [];

                                        const replied = allReplies.length > 0;
                                        const isReplyFormOpen =
                                          productReviewState.activeReplyReviewId ===
                                          rv.id;

                                        const visibleReplyCount =
                                          productReviewState.visibleRepliesMap[
                                            rv.id
                                          ] || 2;
                                        const visibleReplies = allReplies.slice(
                                          0,
                                          visibleReplyCount,
                                        );
                                        const hasMoreReplies =
                                          visibleReplyCount < allReplies.length;

                                        return (
                                          <div
                                            key={rv.id}
                                            className={`rounded-2xl border bg-white p-5 shadow-sm transition-all dark:bg-gray-900 ${
                                              !replied
                                                ? "border-red-200 dark:border-red-900/30"
                                                : "border-gray-200 dark:border-gray-700"
                                            }`}
                                          >
                                            <div className="flex items-start gap-4">
                                              <img
                                                src={
                                                  rv.user?.avatar ||
                                                  `https://ui-avatars.com/api/?name=${
                                                    rv.user?.name || "U"
                                                  }&background=random`
                                                }
                                                alt="User"
                                                className="h-11 w-11 rounded-full border border-gray-100 object-cover shadow-sm dark:border-gray-700"
                                              />

                                              <div className="flex-1">
                                                <div className="flex items-center justify-between gap-3">
                                                  <p className="font-bold text-gray-900 dark:text-white">
                                                    {rv.user?.name ||
                                                      "Khách hàng ẩn danh"}
                                                  </p>

                                                  {!replied && (
                                                    <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-red-600 dark:bg-red-900/30 dark:text-red-400">
                                                      Cần phản hồi
                                                    </span>
                                                  )}
                                                </div>

                                                <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                                                  <div className="flex text-amber-400 text-sm">
                                                    {Array.from({
                                                      length: 5,
                                                    }).map((_, i) => (
                                                      <Star
                                                        key={i}
                                                        className={`h-3.5 w-3.5 ${
                                                          i < rv.rating
                                                            ? "fill-current"
                                                            : "text-gray-300 dark:text-gray-600"
                                                        }`}
                                                      />
                                                    ))}
                                                  </div>

                                                  <span className="text-xs font-medium text-gray-400 flex items-center gap-1">
                                                    <Clock className="w-3 h-3" />
                                                    {formatDateTime(
                                                      rv.created_at ||
                                                        rv.createdAt,
                                                    )}
                                                  </span>
                                                </div>
                                              </div>
                                            </div>

                                            <div className="mt-4 pl-15">
                                              <p className="text-sm leading-relaxed text-gray-700 dark:text-gray-300">
                                                {rv.content}
                                              </p>

                                              {!replied && (
                                                <div className="mt-4">
                                                  <button
                                                    onClick={() =>
                                                      setProductActiveReply(
                                                        product.id,
                                                        isReplyFormOpen
                                                          ? null
                                                          : rv.id,
                                                      )
                                                    }
                                                    className="inline-flex items-center gap-1.5 rounded-lg bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                                                  >
                                                    <MessageSquare className="h-4 w-4" />
                                                    {isReplyFormOpen
                                                      ? "Hủy viết phản hồi"
                                                      : "Viết phản hồi"}
                                                  </button>
                                                </div>
                                              )}

                                              {!replied && isReplyFormOpen && (
                                                <AdminReplyForm
                                                  reviewId={rv.id}
                                                  onSuccess={() =>
                                                    refreshProductReviewWorkspace(
                                                      product.id,
                                                    )
                                                  }
                                                  onCancel={() =>
                                                    setProductActiveReply(
                                                      product.id,
                                                      null,
                                                    )
                                                  }
                                                />
                                              )}

                                              {replied && (
                                                <div className="mt-5 space-y-4 border-l-2 border-gray-100 pl-4 dark:border-gray-800">
                                                  {visibleReplies.map(
                                                    (reply) => (
                                                      <div
                                                        key={reply.id}
                                                        className="rounded-xl bg-gray-50 p-4 dark:bg-gray-800/50"
                                                      >
                                                        <div className="flex items-center justify-between mb-2">
                                                          <div className="flex items-center gap-2">
                                                            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-100 text-indigo-600 dark:bg-indigo-900/50 dark:text-indigo-400">
                                                              <CheckCircle2 className="h-3.5 w-3.5" />
                                                            </div>
                                                            <span className="text-sm font-bold text-gray-900 dark:text-white">
                                                              Phản hồi từ cửa
                                                              hàng
                                                            </span>
                                                          </div>

                                                          <span className="text-xs text-gray-400">
                                                            {formatDateTime(
                                                              reply.created_at ||
                                                                reply.createdAt,
                                                            )}
                                                          </span>
                                                        </div>

                                                        <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed ml-8">
                                                          {reply.content}
                                                        </p>
                                                      </div>
                                                    ),
                                                  )}

                                                  {hasMoreReplies && (
                                                    <button
                                                      onClick={() =>
                                                        loadMoreReplies(
                                                          product.id,
                                                          rv.id,
                                                        )
                                                      }
                                                      className="ml-8 text-sm font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400"
                                                    >
                                                      Xem thêm phản hồi trước
                                                      đó...
                                                    </button>
                                                  )}
                                                </div>
                                              )}
                                            </div>
                                          </div>
                                        );
                                      })}

                                      {hasMoreReviews && (
                                        <button
                                          onClick={() =>
                                            loadMoreReviews(product.id)
                                          }
                                          className="w-full rounded-xl border border-gray-200 bg-white py-3 text-sm font-bold text-gray-700 shadow-sm transition hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                                        >
                                          Tải thêm đánh giá cũ hơn
                                        </button>
                                      )}
                                    </>
                                  )}
                                </div>

                                {/* Sidebar */}
                                <div className="xl:col-span-4">
                                  <Card className="p-5 sticky top-24">
                                    <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-5">
                                      Tóm tắt phản hồi
                                    </h4>

                                    <div className="flex items-center justify-center gap-4 mb-6 pb-6 border-b border-gray-100 dark:border-gray-800">
                                      <div className="text-5xl font-black text-gray-900 dark:text-white">
                                        {displayAverageRating.toFixed(1)}
                                      </div>
                                      <div className="flex flex-col gap-1">
                                        <div className="flex text-amber-400 text-lg">
                                          {Array.from({ length: 5 }).map(
                                            (_, i) => (
                                              <Star
                                                key={i}
                                                className={
                                                  i <
                                                  Math.round(
                                                    displayAverageRating,
                                                  )
                                                    ? "fill-current"
                                                    : "text-gray-300 dark:text-gray-700"
                                                }
                                              />
                                            ),
                                          )}
                                        </div>
                                        <p className="text-xs font-medium text-gray-500">
                                          Dựa trên {product.review_count || 0}{" "}
                                          lượt đánh giá
                                        </p>
                                      </div>
                                    </div>

                                    <div className="space-y-3">
                                      {[5, 4, 3, 2, 1].map((stars) => {
                                        const count =
                                          reviewRatingDist[
                                            stars as 1 | 2 | 3 | 4 | 5
                                          ] || 0;
                                        const percent =
                                          productReviewState.reviews.length > 0
                                            ? (count /
                                                productReviewState.reviews
                                                  .length) *
                                              100
                                            : 0;

                                        return (
                                          <div
                                            key={stars}
                                            className="flex items-center gap-3 text-sm"
                                          >
                                            <span className="w-12 text-gray-600 dark:text-gray-400 font-medium text-right">
                                              {stars} sao
                                            </span>
                                            <div className="flex-1 h-2.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                                              <div
                                                className={`h-full rounded-full ${
                                                  stars >= 4
                                                    ? "bg-emerald-500"
                                                    : stars === 3
                                                      ? "bg-amber-400"
                                                      : "bg-red-500"
                                                }`}
                                                style={{ width: `${percent}%` }}
                                              />
                                            </div>
                                            <span className="w-8 text-gray-500 font-medium text-xs">
                                              {count}
                                            </span>
                                          </div>
                                        );
                                      })}
                                    </div>

                                    <div className="mt-6 rounded-xl border border-blue-100 bg-blue-50 p-4 dark:border-blue-900/30 dark:bg-blue-900/20">
                                      <h5 className="font-bold text-blue-900 dark:text-blue-300 text-sm mb-1">
                                        Mẹo xử lý nhanh
                                      </h5>
                                      <p className="text-xs leading-relaxed text-blue-700 dark:text-blue-400">
                                        Ưu tiên phản hồi review mới, review điểm
                                        thấp, hoặc review chưa được trả lời. Sau
                                        khi gửi reply, badge chờ xử lý ở sản
                                        phẩm sẽ tự giảm.
                                      </p>
                                    </div>
                                  </Card>
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </Card>

      {/* G. PAGINATION */}
      {!loading && displayedProducts.length > 0 && (
        <div className="flex justify-end items-center px-2">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={(page) => {
              const params = new URLSearchParams(searchParams);
              if (page === 1) params.delete("page");
              else params.set("page", String(page));
              setSearchParams(params);
            }}
          />
        </div>
      )}

      {/* H. QUICK ACCESS */}
      <section className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-800">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">
          Công Cụ Danh Mục & Phân Loại
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div
            onClick={() => navigate("/admin/products/categories")}
            className="group p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-500 hover:shadow-md transition-all cursor-pointer flex items-center gap-4"
          >
            <div className="p-3 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg group-hover:scale-110 transition-transform">
              <ListTree className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white">
                Danh Mục
              </h4>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Cây phân cấp sản phẩm
              </p>
            </div>
          </div>

          <div
            onClick={() => navigate("/admin/products/tags")}
            className="group p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-500 hover:shadow-md transition-all cursor-pointer flex items-center gap-4"
          >
            <div className="p-3 bg-violet-50 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 rounded-lg group-hover:scale-110 transition-transform">
              <MessageSquare className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white">
                Tags / Gắn nhãn
              </h4>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Phân loại thuộc tính hiển thị
              </p>
            </div>
          </div>

          <div
            onClick={() => navigate("/admin/products/origins")}
            className="group p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-500 hover:shadow-md transition-all cursor-pointer flex items-center gap-4"
          >
            <div className="p-3 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-lg group-hover:scale-110 transition-transform">
              <PackageOpen className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white">
                Xuất Xứ
              </h4>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Dictionary nguồn gốc sản phẩm
              </p>
            </div>
          </div>

          <div
            onClick={() => navigate("/admin/inventory")}
            className="group p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-500 hover:shadow-md transition-all cursor-pointer flex items-center gap-4"
          >
            <div className="p-3 bg-orange-50 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 rounded-lg group-hover:scale-110 transition-transform">
              <PackagePlus className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white">
                Inventory
              </h4>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Quản lý nhập xuất tồn
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default ProductsPage;
