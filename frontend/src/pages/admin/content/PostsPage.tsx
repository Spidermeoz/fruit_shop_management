import React, { useEffect, useMemo, useState, useCallback } from "react";
import Card from "../../../components/admin/layouts/Card";
import Pagination from "../../../components/admin/common/Pagination";
import {
  Search,
  Plus,
  RefreshCw,
  FileText,
  PenSquare,
  CheckCircle2,
  Archive,
  Eye,
  Trash2,
  Loader2,
  AlertTriangle,
  Image as ImageIcon,
  Tag,
  FolderTree,
  Star,
  ShieldAlert,
  Sparkles,
  LayoutGrid,
  List,
  X,
  Clock3,
  Globe,
  Filter,
  Link2,
  CopyCheck,
  Layers,
  MoreHorizontal,
  Pencil,
  Power,
  PowerOff,
  Hash,
} from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { http } from "../../../services/http";
import { useAdminToast } from "../../../context/AdminToastContext";

// =============================
// TYPES
// =============================
type PostStatus = "draft" | "published" | "inactive" | "archived";

interface PostCategory {
  id: number;
  title: string;
  slug: string | null;
}

interface PostTag {
  id: number;
  name: string;
  slug: string | null;
}

interface RelatedProduct {
  id: number;
  title: string;
}

interface Post {
  id: number;
  post_category_id: number | null;

  category: PostCategory | null;
  title: string;
  slug: string;
  excerpt: string;
  content: string | null;
  thumbnail: string;
  status: PostStatus;
  featured: boolean;
  position: number | null;

  published_at: string | null;

  seo_title: string;
  seo_description: string;
  seo_keywords: string;
  og_image: string;
  canonical_url: string;

  view_count: number;

  tags: PostTag[];
  relatedProducts: RelatedProduct[];

  created_at: string | null;
  updated_at: string | null;
}

interface PostListSummary {
  totalItems: number;
  draftCount: number;
  publishedCount: number;
  inactiveCount: number;
  archivedCount: number;
  featuredCount: number;
  missingThumbnailCount: number;
  missingSeoCount: number;
}

type ApiList<T> = {
  success: boolean;
  data: T[];
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
    offset?: number;
    summary?: Partial<PostListSummary>;
  };
};

type ApiSummary = {
  success: boolean;
  data: PostListSummary;
};

type BulkEditResponse = {
  success: boolean;
  data: {
    ids: number[];
    count: number;
    patch: Record<string, any>;
  };
};

type ReorderResponse = {
  success: boolean;
  data: {
    count: number;
    pairs: { id: number; position: number }[];
  };
};

type ReorderPair = {
  id: number;
  position: number;
};

type QuickFilterType =
  | "all"
  | "featured"
  | "missing-thumbnail"
  | "missing-seo"
  | "unpublished"
  | "no-category";

type SortValue =
  | "newest"
  | "updated_desc"
  | "title_asc"
  | "title_desc"
  | "position_asc"
  | "published_desc"
  | "views_desc";

type BulkActionValue =
  | ""
  | "publish"
  | "draft"
  | "inactive"
  | "archived"
  | "delete";

type EnrichedPost = Post & {
  ui: ReturnType<typeof getPostHealth>;
};

// =============================
// HELPERS
// =============================
const statusMap: Record<
  PostStatus,
  {
    label: string;
    badge: string;
    dot: string;
    icon: React.ComponentType<{ className?: string }>;
  }
> = {
  draft: {
    label: "Draft",
    badge:
      "bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-800",
    dot: "bg-amber-500",
    icon: PenSquare,
  },
  published: {
    label: "Published",
    badge:
      "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-800",
    dot: "bg-emerald-500",
    icon: CheckCircle2,
  },
  inactive: {
    label: "Inactive",
    badge:
      "bg-gray-100 text-gray-700 border border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700",
    dot: "bg-gray-400",
    icon: PowerOff,
  },
  archived: {
    label: "Archived",
    badge:
      "bg-slate-100 text-slate-700 border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700",
    dot: "bg-slate-400",
    icon: Archive,
  },
};

function parseNumberParam(
  value: string | null,
  fallback: number,
  min = 1,
): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  if (parsed < min) return fallback;
  return parsed;
}

function formatDateTime(value?: string | null): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function formatShortDate(value?: string | null): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

function hasThumbnail(post: Post): boolean {
  return Boolean(post.thumbnail?.trim() || post.og_image?.trim());
}

function hasSeoReady(post: Post): boolean {
  return Boolean(post.seo_title.trim() && post.seo_description.trim());
}

function normalizePost(raw: any): Post {
  const safeStatus = String(raw?.status || "draft").toLowerCase();
  const normalizedStatus: PostStatus = (
    ["draft", "published", "inactive", "archived"].includes(safeStatus)
      ? safeStatus
      : "draft"
  ) as PostStatus;

  const category =
    raw?.category && typeof raw.category === "object"
      ? {
          id: Number(raw.category.id),
          title: String(raw.category.title || "Danh mục"),
          slug: raw.category.slug ?? null,
        }
      : null;

  const tags = Array.isArray(raw?.tags)
    ? raw.tags
        .map((tag: any) => ({
          id: Number(tag?.id),
          name: String(tag?.name || "Tag"),
          slug: tag?.slug ?? null,
        }))
        .filter((tag: PostTag) => Number.isInteger(tag.id) && tag.id > 0)
    : [];

  const relatedProducts = Array.isArray(raw?.relatedProducts)
    ? raw.relatedProducts
        .map((item: any) => ({
          id: Number(item?.id),
          title: String(item?.title || `#${item?.id ?? ""}`),
        }))
        .filter(
          (item: RelatedProduct) => Number.isInteger(item.id) && item.id > 0,
        )
    : [];

  return {
    id: Number(raw?.id ?? 0),
    post_category_id:
      raw?.post_category_id != null ? Number(raw.post_category_id) : null,

    category,
    title: String(raw?.title ?? "Untitled post"),
    slug: String(raw?.slug ?? ""),
    excerpt: String(raw?.excerpt ?? ""),
    content: raw?.content != null ? String(raw.content) : null,
    thumbnail: String(raw?.thumbnail ?? ""),
    status: normalizedStatus,
    featured: Boolean(raw?.featured),
    position:
      raw?.position != null && raw?.position !== ""
        ? Number(raw.position)
        : null,

    published_at: raw?.published_at ?? null,

    seo_title: String(raw?.seo_title ?? ""),
    seo_description: String(raw?.seo_description ?? ""),
    seo_keywords: String(raw?.seo_keywords ?? ""),
    og_image: String(raw?.og_image ?? ""),
    canonical_url: String(raw?.canonical_url ?? ""),

    view_count:
      raw?.view_count != null && raw?.view_count !== ""
        ? Number(raw.view_count)
        : 0,

    tags,
    relatedProducts,
    created_at: raw?.created_at ?? null,
    updated_at: raw?.updated_at ?? null,
  };
}

function getPostHealth(post: Post) {
  const checks = [
    hasThumbnail(post),
    Boolean(post.excerpt.trim()),
    Boolean(post.category?.id || post.post_category_id),
    Boolean(post.seo_title.trim()),
    Boolean(post.seo_description.trim()),
    post.status === "published",
  ];

  const score = checks.filter(Boolean).length;
  const percent = Math.round((score / checks.length) * 100);

  const missingSignals: string[] = [];
  if (!hasThumbnail(post)) missingSignals.push("Thiếu ảnh đại diện");
  if (!post.excerpt.trim()) missingSignals.push("Thiếu mô tả ngắn");
  if (!(post.category?.id || post.post_category_id)) {
    missingSignals.push("Chưa có danh mục");
  }

  if (!post.seo_title.trim()) {
    missingSignals.push("Thiếu SEO title");
  }

  if (!post.seo_description.trim()) {
    missingSignals.push("Thiếu SEO description");
  }
  if (post.status !== "published") missingSignals.push("Chưa publish");

  let label = "Hoàn chỉnh";
  let tone =
    "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-800";
  let textTone = "text-emerald-600 dark:text-emerald-400";

  if (percent < 40) {
    label = "Thiếu nhiều dữ liệu";
    tone =
      "bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-900/20 dark:text-rose-300 dark:border-rose-800";
    textTone = "text-rose-600 dark:text-rose-400";
  } else if (percent < 70) {
    label = "Cần bổ sung";
    tone =
      "bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-800";
    textTone = "text-amber-600 dark:text-amber-400";
  } else if (percent < 100) {
    label = "Khá tốt";
    tone =
      "bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800";
    textTone = "text-blue-600 dark:text-blue-400";
  }

  const seoTitle = post.seo_title;
  const seoDescription = post.seo_description;

  const publishWarning =
    post.status === "published" &&
    (!hasThumbnail(post) || !seoTitle.trim() || !seoDescription.trim());

  return {
    percent,
    label,
    tone,
    textTone,
    missingSignals,
    publishWarning,
    hasThumbnail: hasThumbnail(post),
    hasSeo: hasSeoReady(post),
    hasExcerpt: Boolean(post.excerpt.trim()),
    hasCategory: Boolean(post.category?.id || post.post_category_id),
    hasCanonical: Boolean(post.canonical_url.trim()),
  };
}

function buildQueryUrl(
  base: string,
  params: Record<string, string | number | boolean | undefined | null>,
) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (
      value === undefined ||
      value === null ||
      value === "" ||
      value === false
    ) {
      return;
    }
    query.set(key, String(value));
  });
  return `${base}?${query.toString()}`;
}

function mapPostSort(sort: SortValue): {
  sortBy:
    | "id"
    | "title"
    | "position"
    | "publishedAt"
    | "createdAt"
    | "updatedAt"
    | "viewCount";
  order: "ASC" | "DESC";
} {
  switch (sort) {
    case "updated_desc":
      return { sortBy: "updatedAt", order: "DESC" };
    case "title_asc":
      return { sortBy: "title", order: "ASC" };
    case "title_desc":
      return { sortBy: "title", order: "DESC" };
    case "position_asc":
      return { sortBy: "position", order: "ASC" };
    case "published_desc":
      return { sortBy: "publishedAt", order: "DESC" };
    case "views_desc":
      return { sortBy: "viewCount", order: "DESC" };
    case "newest":
    default:
      return { sortBy: "id", order: "DESC" };
  }
}

function getApiErrorMessage(err: any, fallback: string) {
  return err?.response?.data?.message || err?.message || fallback;
}

function normalizeReorderPairs(rows: Post[]): ReorderPair[] {
  return rows.map((row, index) => ({
    id: Number(row.id),
    position: index,
  }));
}

// =============================
// MAIN PAGE
// =============================
const PostsPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { showSuccessToast, showErrorToast } = useAdminToast();

  // URL-synced filters
  const currentPage = parseNumberParam(searchParams.get("page"), 1);
  const statusFilter = searchParams.get("status") || "all";
  const sortOrder = (searchParams.get("sort") || "newest") as SortValue;
  const categoryFilter = searchParams.get("categoryId") || "all";
  const featuredFilter = searchParams.get("featured") === "true";
  const missingThumbnailFilter =
    searchParams.get("missingThumbnail") === "true";
  const missingSeoFilter = searchParams.get("missingSeo") === "true";

  // data states
  const [posts, setPosts] = useState<Post[]>([]);
  const [categories, setCategories] = useState<PostCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [bootstrapLoading, setBootstrapLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [reordering, setReordering] = useState(false);
  const [error, setError] = useState("");
  const [totalPages, setTotalPages] = useState(1);
  const [, setTotalCount] = useState(0);
  const [summary, setSummary] = useState<PostListSummary>({
    totalItems: 0,
    draftCount: 0,
    publishedCount: 0,
    inactiveCount: 0,
    archivedCount: 0,
    featuredCount: 0,
    missingThumbnailCount: 0,
    missingSeoCount: 0,
  });

  // ui/filter states
  const [searchTerm, setSearchTerm] = useState(
    searchParams.get("keyword") || "",
  );
  const [quickFilter, setQuickFilter] = useState<QuickFilterType>("all");
  const [viewMode, setViewMode] = useState<"table" | "board">("table");
  const [selectedPosts, setSelectedPosts] = useState<number[]>([]);
  const [bulkAction, setBulkAction] = useState<BulkActionValue>("");
  const [actionLoadingIds, setActionLoadingIds] = useState<number[]>([]);
  const [localOrderRows, setLocalOrderRows] = useState<Post[]>([]);

  // =============================
  // FETCHERS
  // =============================
  const fetchCategories = useCallback(async () => {
    try {
      const res = await http<ApiList<any>>(
        "GET",
        "/api/v1/admin/post-categories?limit=1000",
      );
      if (res?.success && Array.isArray(res.data)) {
        setCategories(
          res.data.map((item: any) => ({
            id: Number(item?.id),
            title: String(item?.title || item?.name || `Category #${item?.id}`),
            slug: item?.slug ?? null,
          })),
        );
      }
    } catch (err) {
      console.error("Không thể tải danh mục bài viết", err);
    }
  }, []);

  const fetchSummary = useCallback(async () => {
    try {
      setSummaryLoading(true);

      const mappedSort = mapPostSort(sortOrder);

      const queryUrl = buildQueryUrl("/api/v1/admin/posts/summary", {
        keyword: searchParams.get("keyword")?.trim() || undefined,
        status: statusFilter !== "all" ? statusFilter : undefined,
        categoryId: categoryFilter !== "all" ? categoryFilter : undefined,
        featured: featuredFilter ? true : undefined,
        missingThumbnail: missingThumbnailFilter ? true : undefined,
        missingSeo: missingSeoFilter ? true : undefined,
        sortBy: mappedSort.sortBy,
        order: mappedSort.order,
      });

      const res = await http<ApiSummary>("GET", queryUrl);

      if (res?.success && res.data) {
        setSummary({
          totalItems: Number(res.data.totalItems ?? 0),
          draftCount: Number(res.data.draftCount ?? 0),
          publishedCount: Number(res.data.publishedCount ?? 0),
          inactiveCount: Number(res.data.inactiveCount ?? 0),
          archivedCount: Number(res.data.archivedCount ?? 0),
          featuredCount: Number(res.data.featuredCount ?? 0),
          missingThumbnailCount: Number(res.data.missingThumbnailCount ?? 0),
          missingSeoCount: Number(res.data.missingSeoCount ?? 0),
        });
      }
    } catch (err) {
      console.error("Không thể tải summary bài viết", err);
    } finally {
      setSummaryLoading(false);
    }
  }, [
    sortOrder,
    statusFilter,
    categoryFilter,
    featuredFilter,
    missingThumbnailFilter,
    missingSeoFilter,
    searchParams,
  ]);

  const fetchPosts = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const limit = 12;
      const mappedSort = mapPostSort(sortOrder);

      const queryUrl = buildQueryUrl("/api/v1/admin/posts", {
        limit,
        page: currentPage,
        keyword: searchParams.get("keyword")?.trim() || undefined,
        status: statusFilter !== "all" ? statusFilter : undefined,
        categoryId: categoryFilter !== "all" ? categoryFilter : undefined,
        featured: featuredFilter ? true : undefined,
        missingThumbnail: missingThumbnailFilter ? true : undefined,
        missingSeo: missingSeoFilter ? true : undefined,
        sortBy: mappedSort.sortBy,
        order: mappedSort.order,
      });

      const res = await http<ApiList<any>>("GET", queryUrl);

      if (res?.success && Array.isArray(res.data)) {
        const normalized = res.data.map(normalizePost);
        setPosts(normalized);
        setLocalOrderRows(normalized);

        const total =
          res.meta?.total != null ? Number(res.meta.total) : normalized.length;

        setTotalCount(total);
        setTotalPages(Math.max(1, Math.ceil(total / limit)));
      } else {
        setPosts([]);
        setLocalOrderRows([]);
        setTotalCount(0);
        setTotalPages(1);
        setError("Không thể tải danh sách bài viết.");
      }
    } catch (err: any) {
      setError(getApiErrorMessage(err, "Lỗi tải dữ liệu bài viết."));
    } finally {
      setLoading(false);
    }
  }, [
    currentPage,
    statusFilter,
    sortOrder,
    categoryFilter,
    featuredFilter,
    missingThumbnailFilter,
    missingSeoFilter,
    searchParams,
  ]);

  const refreshAllData = useCallback(async () => {
    await Promise.all([fetchPosts(), fetchSummary(), fetchCategories()]);
  }, [fetchPosts, fetchSummary, fetchCategories]);

  useEffect(() => {
    let mounted = true;

    const bootstrap = async () => {
      try {
        setBootstrapLoading(true);
        await Promise.all([fetchCategories(), fetchPosts(), fetchSummary()]);
      } finally {
        if (mounted) setBootstrapLoading(false);
      }
    };

    bootstrap();

    return () => {
      mounted = false;
    };
  }, [fetchCategories, fetchPosts, fetchSummary]);

  useEffect(() => {
    const timer = setTimeout(() => {
      const params = new URLSearchParams(searchParams);
      if (searchTerm.trim()) params.set("keyword", searchTerm.trim());
      else params.delete("keyword");
      params.delete("page");
      setSearchParams(params);
    }, 450);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm]);

  useEffect(() => {
    setSelectedPosts([]);
  }, [
    currentPage,
    statusFilter,
    sortOrder,
    categoryFilter,
    featuredFilter,
    missingThumbnailFilter,
    missingSeoFilter,
    quickFilter,
  ]);

  useEffect(() => {
    setLocalOrderRows(posts);
  }, [posts]);

  // =============================
  // DERIVED DATA
  // =============================
  const enrichedPosts = useMemo<EnrichedPost[]>(() => {
    return posts.map((post) => ({
      ...post,
      ui: getPostHealth(post),
    }));
  }, [posts]);

  const displayedPosts = useMemo(() => {
    let rows = enrichedPosts;

    if (quickFilter === "featured") {
      rows = rows.filter((post) => !!post.featured);
    }

    if (quickFilter === "missing-thumbnail") {
      rows = rows.filter((post) => !post.ui.hasThumbnail);
    }

    if (quickFilter === "missing-seo") {
      rows = rows.filter((post) => !post.ui.hasSeo);
    }

    if (quickFilter === "unpublished") {
      rows = rows.filter((post) => post.status !== "published");
    }

    if (quickFilter === "no-category") {
      rows = rows.filter((post) => !post.ui.hasCategory);
    }

    return rows;
  }, [enrichedPosts, quickFilter]);

  const displayedOrderedPosts = useMemo(() => {
    const displayedIds = new Set(displayedPosts.map((item) => item.id));
    return localOrderRows
      .map((row) => enrichedPosts.find((item) => item.id === row.id))
      .filter(
        (item): item is EnrichedPost => !!item && displayedIds.has(item.id),
      );
  }, [localOrderRows, enrichedPosts, displayedPosts]);

  const effectiveSummary = useMemo<PostListSummary>(() => summary, [summary]);

  const attentionStats = useMemo(() => {
    const draftBacklog = enrichedPosts.filter(
      (post) => post.status === "draft",
    );
    const missingThumbnailPosts = enrichedPosts.filter(
      (post) => !post.ui.hasThumbnail,
    );
    const missingSeoPosts = enrichedPosts.filter((post) => !post.ui.hasSeo);
    const featuredUnpublished = enrichedPosts.filter(
      (post) => post.featured && post.status !== "published",
    );
    const noCategoryPosts = enrichedPosts.filter(
      (post) => !post.ui.hasCategory,
    );
    const noExcerptPosts = enrichedPosts.filter((post) => !post.ui.hasExcerpt);

    return {
      draftBacklog,
      missingThumbnailPosts,
      missingSeoPosts,
      featuredUnpublished,
      noCategoryPosts,
      noExcerptPosts,
    };
  }, [enrichedPosts]);

  const mostUsedCategoryText = useMemo(() => {
    const counts = new Map<string, number>();

    enrichedPosts.forEach((post) => {
      const key = post.category?.title?.trim();
      if (!key) return;
      counts.set(key, (counts.get(key) || 0) + 1);
    });

    let winner = "";
    let winnerCount = 0;

    counts.forEach((value, key) => {
      if (value > winnerCount) {
        winner = key;
        winnerCount = value;
      }
    });

    if (!winner) return null;
    return `Trong danh sách hiện tại, nhóm nội dung nhiều nhất là "${winner}" với ${winnerCount} bài viết.`;
  }, [enrichedPosts]);

  const allCurrentSelected =
    displayedOrderedPosts.length > 0 &&
    displayedOrderedPosts.every((post) => selectedPosts.includes(post.id));

  // =============================
  // ACTIONS
  // =============================
  const updateParams = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams);
    Object.entries(updates).forEach(([key, value]) => {
      if (value == null || value === "" || value === "all") params.delete(key);
      else params.set(key, value);
    });
    params.delete("page");
    setSearchParams(params);
  };

  const handleResetFilters = () => {
    setQuickFilter("all");
    setSelectedPosts([]);
    setBulkAction("");
    setSearchParams(new URLSearchParams());
    setSearchTerm("");
  };

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      await refreshAllData();
      showSuccessToast({ message: "Đã làm mới dữ liệu bài viết." });
    } catch (err: any) {
      showErrorToast(getApiErrorMessage(err, "Không thể làm mới dữ liệu."));
    } finally {
      setRefreshing(false);
    }
  };

  const handleDelete = async (post: Post) => {
    const confirmed = window.confirm(
      `Bạn có chắc muốn xóa mềm bài viết "${post.title}" không?`,
    );
    if (!confirmed) return;

    try {
      setActionLoadingIds((prev) => [...prev, post.id]);
      await http("DELETE", `/api/v1/admin/posts/delete/${post.id}`);
      showSuccessToast({ message: "Đã xóa bài viết thành công!" });
      await Promise.all([fetchPosts(), fetchSummary()]);
    } catch (err: any) {
      showErrorToast(getApiErrorMessage(err, "Không thể xóa bài viết."));
    } finally {
      setActionLoadingIds((prev) => prev.filter((id) => id !== post.id));
    }
  };

  const handleStatusChange = async (post: Post, nextStatus: PostStatus) => {
    try {
      setActionLoadingIds((prev) => [...prev, post.id]);
      await http("PATCH", `/api/v1/admin/posts/${post.id}/status`, {
        status: nextStatus,
      });
      showSuccessToast({ message: "Cập nhật trạng thái bài viết thành công!" });
      setPosts((prev) =>
        prev.map((item) =>
          item.id === post.id
            ? {
                ...item,
                status: nextStatus,
                published_at:
                  nextStatus === "published"
                    ? item.published_at || new Date().toISOString()
                    : item.published_at,
              }
            : item,
        ),
      );
      await Promise.all([fetchPosts(), fetchSummary()]);
    } catch (err: any) {
      showErrorToast(
        getApiErrorMessage(err, "Không thể cập nhật trạng thái bài viết."),
      );
    } finally {
      setActionLoadingIds((prev) => prev.filter((id) => id !== post.id));
    }
  };

  const toggleSelectOne = (id: number) => {
    setSelectedPosts((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  const toggleSelectAllCurrentPage = () => {
    if (allCurrentSelected) {
      setSelectedPosts((prev) =>
        prev.filter(
          (id) => !displayedOrderedPosts.some((post) => post.id === id),
        ),
      );
      return;
    }
    setSelectedPosts((prev) => {
      const next = new Set(prev);
      displayedOrderedPosts.forEach((post) => next.add(post.id));
      return Array.from(next);
    });
  };

  const handleBulkExecute = async () => {
    if (!bulkAction || selectedPosts.length === 0) return;

    const selectedItems = posts.filter((post) =>
      selectedPosts.includes(post.id),
    );

    if (bulkAction === "delete") {
      const confirmed = window.confirm(
        `Bạn có chắc muốn xóa mềm ${selectedItems.length} bài viết đã chọn không?`,
      );
      if (!confirmed) return;

      try {
        await http<BulkEditResponse>("PATCH", "/api/v1/admin/posts/bulk-edit", {
          ids: selectedPosts,
          patch: {
            deleted: true,
          },
        });

        showSuccessToast({
          message: `Đã xóa mềm ${selectedItems.length} bài viết thành công!`,
        });

        setSelectedPosts([]);
        setBulkAction("");
        await Promise.all([fetchPosts(), fetchSummary()]);
      } catch (err: any) {
        showErrorToast(
          getApiErrorMessage(err, "Không thể xóa hàng loạt bài viết."),
        );
      }
      return;
    }

    const nextStatusMap: Record<
      Exclude<BulkActionValue, "" | "delete">,
      PostStatus
    > = {
      publish: "published",
      draft: "draft",
      inactive: "inactive",
      archived: "archived",
    };

    const nextStatus =
      nextStatusMap[bulkAction as Exclude<BulkActionValue, "" | "delete">];

    const confirmed = window.confirm(
      `Bạn có chắc muốn chuyển ${selectedItems.length} bài viết sang trạng thái "${statusMap[nextStatus].label}" không?`,
    );
    if (!confirmed) return;

    try {
      await http<BulkEditResponse>("PATCH", "/api/v1/admin/posts/bulk-edit", {
        ids: selectedPosts,
        patch: {
          status: nextStatus,
        },
      });

      showSuccessToast({
        message: `Đã cập nhật ${selectedItems.length} bài viết thành công!`,
      });

      setSelectedPosts([]);
      setBulkAction("");
      await Promise.all([fetchPosts(), fetchSummary()]);
    } catch (err: any) {
      showErrorToast(
        getApiErrorMessage(
          err,
          "Không thể thực hiện bulk action cho bài viết.",
        ),
      );
    }
  };

  const movePostRow = (postId: number, direction: "up" | "down") => {
    setLocalOrderRows((prev) => {
      const index = prev.findIndex((item) => item.id === postId);
      if (index === -1) return prev;

      const targetIndex = direction === "up" ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= prev.length) return prev;

      const next = [...prev];
      const temp = next[index];
      next[index] = next[targetIndex];
      next[targetIndex] = temp;
      return next;
    });
  };

  const handleSaveReorder = async () => {
    if (!localOrderRows.length) return;

    try {
      setReordering(true);

      const pairs = normalizeReorderPairs(localOrderRows);

      await http<ReorderResponse>("PATCH", "/api/v1/admin/posts/reorder", {
        pairs,
      });

      showSuccessToast({ message: "Đã lưu thứ tự bài viết thành công!" });
      await Promise.all([fetchPosts(), fetchSummary()]);
    } catch (err: any) {
      showErrorToast(getApiErrorMessage(err, "Không thể lưu thứ tự bài viết."));
    } finally {
      setReordering(false);
    }
  };

  // =============================
  // RENDER HELPERS
  // =============================
  const renderThumbnail = (post: EnrichedPost) => {
    if (post.thumbnail) {
      return (
        <img
          src={post.thumbnail}
          alt={post.title}
          className="w-16 h-12 rounded-lg object-cover border border-gray-200 dark:border-gray-700"
        />
      );
    }

    return (
      <div className="w-16 h-12 rounded-lg border border-dashed border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 flex items-center justify-center shrink-0">
        <ImageIcon className="w-4 h-4 text-gray-400" />
      </div>
    );
  };

  const renderStatusBadge = (status: PostStatus) => {
    const meta = statusMap[status];
    const Icon = meta.icon;
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider ${meta.badge}`}
      >
        <Icon className="w-3.5 h-3.5" />
        {meta.label}
      </span>
    );
  };

  const renderHealthDots = (post: EnrichedPost) => {
    const items = [
      { label: "Thumbnail", ok: post.ui.hasThumbnail },
      { label: "SEO", ok: post.ui.hasSeo },
      { label: "Excerpt", ok: post.ui.hasExcerpt },
    ];

    return (
      <div className="flex items-center gap-3">
        {items.map((item) => (
          <div key={item.label} className="flex items-center gap-1.5">
            <span
              className={`w-2.5 h-2.5 rounded-full ${item.ok ? "bg-emerald-500" : "bg-rose-400"}`}
            />
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {item.label}
            </span>
          </div>
        ))}
      </div>
    );
  };

  const renderActionButtons = (post: EnrichedPost) => {
    const isLoading = actionLoadingIds.includes(post.id);

    return (
      <div className="flex items-center justify-end gap-1.5">
        <button
          type="button"
          onClick={() => movePostRow(post.id, "up")}
          className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 hover:text-blue-600 hover:bg-blue-50 dark:text-gray-300 dark:hover:bg-blue-900/20 transition"
          title="Đưa lên"
        >
          <span className="text-xs font-bold">↑</span>
        </button>

        <button
          type="button"
          onClick={() => movePostRow(post.id, "down")}
          className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 hover:text-blue-600 hover:bg-blue-50 dark:text-gray-300 dark:hover:bg-blue-900/20 transition"
          title="Đưa xuống"
        >
          <span className="text-xs font-bold">↓</span>
        </button>

        <button
          type="button"
          disabled
          title="Preview chưa được cấu hình"
          className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-400 cursor-not-allowed"
        >
          <Eye className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={() => navigate(`/admin/content/posts/edit/${post.id}`)}
          className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 hover:text-blue-600 hover:bg-blue-50 dark:text-gray-300 dark:hover:bg-blue-900/20 transition"
          title="Sửa bài viết"
        >
          <Pencil className="w-4 h-4" />
        </button>

        {post.status !== "published" ? (
          <button
            type="button"
            onClick={() => handleStatusChange(post, "published")}
            disabled={isLoading}
            className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 hover:text-emerald-600 hover:bg-emerald-50 dark:text-gray-300 dark:hover:bg-emerald-900/20 transition disabled:opacity-50"
            title="Publish nhanh"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Power className="w-4 h-4" />
            )}
          </button>
        ) : (
          <button
            type="button"
            onClick={() => handleStatusChange(post, "inactive")}
            disabled={isLoading}
            className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 hover:text-amber-600 hover:bg-amber-50 dark:text-gray-300 dark:hover:bg-amber-900/20 transition disabled:opacity-50"
            title="Chuyển inactive"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <PowerOff className="w-4 h-4" />
            )}
          </button>
        )}

        <button
          type="button"
          onClick={() => handleDelete(post)}
          disabled={isLoading}
          className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 hover:text-rose-600 hover:bg-rose-50 dark:text-gray-300 dark:hover:bg-rose-900/20 transition disabled:opacity-50"
          title="Xóa mềm"
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Trash2 className="w-4 h-4" />
          )}
        </button>
      </div>
    );
  };

  // =============================
  // UI
  // =============================
  return (
    <div className="w-full pb-10 space-y-6">
      {/* Header / Command Bar */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="min-w-0">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-11 h-11 rounded-2xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center border border-blue-100 dark:border-blue-800">
              <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Content Workspace
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Điều hành bài viết, lịch xuất bản, độ hoàn thiện SEO và chất
                lượng thư viện nội dung.
              </p>
            </div>
          </div>

          {mostUsedCategoryText && (
            <div className="inline-flex items-center gap-2 mt-1 px-3 py-1.5 rounded-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-xs text-gray-600 dark:text-gray-300">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              {mostUsedCategoryText}
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition disabled:opacity-50"
            title="Làm mới dữ liệu"
          >
            <RefreshCw
              className={`w-5 h-5 ${refreshing ? "animate-spin" : ""}`}
            />
          </button>

          <button
            onClick={() => navigate("/admin/content/categories")}
            className="px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition"
          >
            Quản lý danh mục
          </button>

          <button
            onClick={() => navigate("/admin/content/tags")}
            className="px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition"
          >
            Quản lý tag
          </button>

          <button
            onClick={handleSaveReorder}
            disabled={reordering || !localOrderRows.length}
            className="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition disabled:opacity-50"
          >
            {reordering ? "Đang lưu thứ tự..." : "Lưu thứ tự"}
          </button>

          <button
            onClick={() => navigate("/admin/content/posts/create")}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition shadow-sm ml-auto xl:ml-0"
          >
            <Plus className="w-4 h-4" />
            Tạo bài viết
          </button>
        </div>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-8 gap-3">
        {[
          {
            label: "Tổng bài viết",
            value: effectiveSummary.totalItems,
            icon: Layers,
            bg: "bg-blue-50",
            color: "text-blue-600",
            onClick: () => {
              setQuickFilter("all");
              updateParams({
                status: null,
                featured: null,
                missingThumbnail: null,
                missingSeo: null,
                categoryId: null,
                sort: null,
              });
            },
          },
          {
            label: "Draft",
            value: effectiveSummary.draftCount,
            icon: PenSquare,
            bg: "bg-amber-50",
            color: "text-amber-600",
            onClick: () => {
              setQuickFilter("all");
              updateParams({ status: "draft" });
            },
          },
          {
            label: "Published",
            value: effectiveSummary.publishedCount,
            icon: CheckCircle2,
            bg: "bg-emerald-50",
            color: "text-emerald-600",
            onClick: () => {
              setQuickFilter("all");
              updateParams({ status: "published" });
            },
          },
          {
            label: "Inactive",
            value: effectiveSummary.inactiveCount,
            icon: PowerOff,
            bg: "bg-gray-100",
            color: "text-gray-600",
            onClick: () => {
              setQuickFilter("all");
              updateParams({ status: "inactive" });
            },
          },
          {
            label: "Archived",
            value: effectiveSummary.archivedCount,
            icon: Archive,
            bg: "bg-slate-100",
            color: "text-slate-600",
            onClick: () => {
              setQuickFilter("all");
              updateParams({ status: "archived" });
            },
          },
          {
            label: "Featured",
            value: effectiveSummary.featuredCount,
            icon: Star,
            bg: "bg-violet-50",
            color: "text-violet-600",
            onClick: () => {
              setQuickFilter("all");
              updateParams({ featured: "true" });
            },
          },
          {
            label: "Thiếu thumbnail",
            value: effectiveSummary.missingThumbnailCount,
            icon: ImageIcon,
            bg: "bg-orange-50",
            color: "text-orange-600",
            onClick: () => {
              setQuickFilter("all");
              updateParams({ missingThumbnail: "true" });
            },
          },
          {
            label: "Thiếu SEO",
            value: effectiveSummary.missingSeoCount,
            icon: ShieldAlert,
            bg: "bg-rose-50",
            color: "text-rose-600",
            onClick: () => {
              setQuickFilter("all");
              updateParams({ missingSeo: "true" });
            },
          },
        ].map((item) => (
          <button
            key={item.label}
            type="button"
            onClick={item.onClick}
            className="text-left p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-sm transition"
          >
            <div className="flex items-center gap-2 mb-2">
              <div
                className={`w-8 h-8 rounded-lg ${item.bg} flex items-center justify-center`}
              >
                <item.icon className={`w-4 h-4 ${item.color}`} />
              </div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                {item.label}
              </span>
            </div>
            <div className="text-2xl font-black text-gray-900 dark:text-white">
              {summaryLoading ? "..." : item.value}
            </div>
          </button>
        ))}
      </div>

      {/* Action Center */}
      {!bootstrapLoading &&
        (attentionStats.draftBacklog.length > 0 ||
          attentionStats.missingThumbnailPosts.length > 0 ||
          attentionStats.missingSeoPosts.length > 0 ||
          attentionStats.featuredUnpublished.length > 0 ||
          attentionStats.noCategoryPosts.length > 0 ||
          attentionStats.noExcerptPosts.length > 0) && (
          <Card className="border-amber-200 dark:border-amber-900/40 !p-0 overflow-hidden">
            <div className="p-4 bg-amber-50/70 dark:bg-amber-900/10 border-b border-amber-100 dark:border-amber-900/40 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div>
                <h3 className="font-bold text-amber-800 dark:text-amber-300 flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5" />
                  Trung tâm xử lý nhanh nội dung
                </h3>
                <p className="text-sm text-amber-700/90 dark:text-amber-200/80 mt-1">
                  Những nhóm bài viết đang cần thao tác editorial hoặc tối ưu
                  chất lượng.
                </p>
              </div>
              <span className="text-xs font-semibold text-amber-700 dark:text-amber-300 px-2.5 py-1 rounded-full bg-white/80 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                Content Operations
              </span>
            </div>

            <div className="p-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {[
                {
                  title: `${attentionStats.draftBacklog.length} bài draft chưa xuất bản`,
                  note: "Rà soát backlog biên tập",
                  icon: PenSquare,
                  tone: "text-amber-600 bg-amber-50 border-amber-200",
                  onClick: () => {
                    setQuickFilter("all");
                    updateParams({ status: "draft" });
                  },
                  visible: attentionStats.draftBacklog.length > 0,
                },
                {
                  title: `${attentionStats.missingThumbnailPosts.length} bài thiếu ảnh đại diện`,
                  note: "Bổ sung thumbnail để hoàn thiện hiển thị",
                  icon: ImageIcon,
                  tone: "text-orange-600 bg-orange-50 border-orange-200",
                  onClick: () => {
                    setQuickFilter("missing-thumbnail");
                    updateParams({ missingThumbnail: "true" });
                  },
                  visible: attentionStats.missingThumbnailPosts.length > 0,
                },
                {
                  title: `${attentionStats.missingSeoPosts.length} bài thiếu SEO`,
                  note: "SEO title hoặc description chưa đầy đủ",
                  icon: ShieldAlert,
                  tone: "text-rose-600 bg-rose-50 border-rose-200",
                  onClick: () => {
                    setQuickFilter("missing-seo");
                    updateParams({ missingSeo: "true" });
                  },
                  visible: attentionStats.missingSeoPosts.length > 0,
                },
                {
                  title: `${attentionStats.featuredUnpublished.length} bài nổi bật chưa publish`,
                  note: "Featured nhưng chưa ra mắt",
                  icon: Star,
                  tone: "text-violet-600 bg-violet-50 border-violet-200",
                  onClick: () => {
                    updateParams({ featured: "true" });
                    setQuickFilter("featured");
                  },
                  visible: attentionStats.featuredUnpublished.length > 0,
                },
                {
                  title: `${attentionStats.noCategoryPosts.length} bài chưa có danh mục`,
                  note: "Cần phân loại để quản trị dễ hơn",
                  icon: FolderTree,
                  tone: "text-blue-600 bg-blue-50 border-blue-200",
                  onClick: () => setQuickFilter("no-category"),
                  visible: attentionStats.noCategoryPosts.length > 0,
                },
                {
                  title: `${attentionStats.noExcerptPosts.length} bài thiếu mô tả ngắn`,
                  note: "Thiếu excerpt cho list view và SEO hỗ trợ",
                  icon: CopyCheck,
                  tone: "text-slate-600 bg-slate-50 border-slate-200",
                  onClick: () => {
                    setQuickFilter("all");
                    setSearchTerm("");
                  },
                  visible: attentionStats.noExcerptPosts.length > 0,
                },
              ]
                .filter((item) => item.visible)
                .map((item) => (
                  <div
                    key={item.title}
                    className={`p-4 rounded-xl border flex flex-col gap-3 ${item.tone} dark:bg-gray-900/20`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-white/80 dark:bg-gray-800 flex items-center justify-center border border-current/10 shrink-0">
                        <item.icon className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-sm leading-5">
                          {item.title}
                        </div>
                        <div className="text-xs opacity-80 mt-1">
                          {item.note}
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={item.onClick}
                      className="mt-auto px-3 py-2 rounded-lg bg-white dark:bg-gray-800 text-sm font-semibold border border-current/10 hover:shadow-sm transition"
                    >
                      Lọc xem ngay
                    </button>
                  </div>
                ))}
            </div>
          </Card>
        )}

      {/* Filter Workspace */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm space-y-4">
        {/* Search + commands */}
        <div className="flex flex-col xl:flex-row gap-4 xl:items-center xl:justify-between">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm theo tiêu đề, slug, mô tả ngắn..."
              className="w-full pl-9 pr-10 py-2.5 text-sm rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {searchTerm.trim() && (
              <button
                type="button"
                onClick={() => setSearchTerm("")}
                className="absolute right-3 top-2.5 p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                title="Xóa từ khóa"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <select
              value={sortOrder}
              onChange={(e) => updateParams({ sort: e.target.value })}
              className="px-3 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-white min-w-[200px]"
            >
              <option value="newest">Mới nhất</option>
              <option value="updated_desc">Cập nhật gần nhất</option>
              <option value="title_asc">Tiêu đề A-Z</option>
              <option value="title_desc">Tiêu đề Z-A</option>
              <option value="position_asc">Vị trí tăng dần</option>
              <option value="published_desc">Published mới nhất</option>
              <option value="views_desc">Lượt xem cao nhất</option>
            </select>

            <div className="flex bg-gray-100 dark:bg-gray-900 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setViewMode("table")}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1.5 transition ${
                  viewMode === "table"
                    ? "bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm"
                    : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                }`}
              >
                <List className="w-4 h-4" />
                Table
              </button>
              <button
                type="button"
                onClick={() => setViewMode("board")}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1.5 transition ${
                  viewMode === "board"
                    ? "bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm"
                    : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                }`}
              >
                <LayoutGrid className="w-4 h-4" />
                Board
              </button>
            </div>

            <button
              type="button"
              onClick={handleResetFilters}
              className="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
            >
              Reset filters
            </button>
          </div>
        </div>

        {/* Status tabs */}
        <div className="flex flex-wrap items-center gap-2 border-t border-b border-gray-100 dark:border-gray-700 py-4">
          {[
            { key: "all", label: "Tất cả" },
            { key: "draft", label: "Draft" },
            { key: "published", label: "Published" },
            { key: "inactive", label: "Inactive" },
            { key: "archived", label: "Archived" },
          ].map((tab) => {
            const active =
              statusFilter === tab.key ||
              (tab.key === "all" && !searchParams.get("status"));
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => {
                  setQuickFilter("all");
                  updateParams({
                    status: tab.key === "all" ? null : tab.key,
                  });
                }}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                  active
                    ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                    : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:border-gray-300"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Secondary filters */}
        <div className="flex flex-col 2xl:flex-row gap-4 2xl:items-center 2xl:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1.5 mr-1">
              <Filter className="w-4 h-4" />
              Quick filters:
            </span>

            {[
              {
                id: "featured",
                label: "Chỉ bài nổi bật",
                active: featuredFilter || quickFilter === "featured",
                onClick: () => {
                  const nextActive = !(
                    featuredFilter || quickFilter === "featured"
                  );
                  setQuickFilter(nextActive ? "featured" : "all");
                  updateParams({ featured: nextActive ? "true" : null });
                },
              },
              {
                id: "missing-thumbnail",
                label: "Thiếu thumbnail",
                active:
                  missingThumbnailFilter || quickFilter === "missing-thumbnail",
                onClick: () => {
                  const nextActive = !(
                    missingThumbnailFilter ||
                    quickFilter === "missing-thumbnail"
                  );
                  setQuickFilter(nextActive ? "missing-thumbnail" : "all");
                  updateParams({
                    missingThumbnail: nextActive ? "true" : null,
                  });
                },
              },
              {
                id: "missing-seo",
                label: "Thiếu SEO",
                active: missingSeoFilter || quickFilter === "missing-seo",
                onClick: () => {
                  const nextActive = !(
                    missingSeoFilter || quickFilter === "missing-seo"
                  );
                  setQuickFilter(nextActive ? "missing-seo" : "all");
                  updateParams({ missingSeo: nextActive ? "true" : null });
                },
              },
              {
                id: "unpublished",
                label: "Chưa publish",
                active: quickFilter === "unpublished",
                onClick: () => {
                  setQuickFilter((prev) =>
                    prev === "unpublished" ? "all" : "unpublished",
                  );
                },
              },
              {
                id: "no-category",
                label: "Không category",
                active: quickFilter === "no-category",
                onClick: () =>
                  setQuickFilter((prev) =>
                    prev === "no-category" ? "all" : "no-category",
                  ),
              },
            ].map((chip) => (
              <button
                key={chip.id}
                type="button"
                onClick={chip.onClick}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition ${
                  chip.active
                    ? "bg-gray-900 text-white dark:bg-white dark:text-gray-900 border-gray-900 dark:border-white"
                    : "bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-gray-300"
                }`}
              >
                {chip.label}
              </button>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3">
            <select
              value={categoryFilter}
              onChange={(e) => {
                setQuickFilter("all");
                updateParams({
                  categoryId: e.target.value === "all" ? null : e.target.value,
                });
              }}
              className="px-3 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-white min-w-[220px]"
            >
              <option value="all">Tất cả danh mục</option>
              {categories.map((category) => (
                <option key={category.id} value={String(category.id)}>
                  {category.title}
                </option>
              ))}
            </select>

            <select
              value="12"
              disabled
              className="px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-sm text-gray-400 min-w-[120px] cursor-not-allowed"
              title="Page size đang cố định 12 items"
            >
              <option value="12">12 / trang</option>
            </select>
          </div>
        </div>
      </div>

      {/* Bulk Action Bar */}
      {selectedPosts.length > 0 && (
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 p-4 rounded-2xl border border-blue-200 dark:border-blue-900/40 bg-blue-50/70 dark:bg-blue-900/10">
          <div className="flex items-center gap-2 text-blue-800 dark:text-blue-300">
            <CheckCircle2 className="w-5 h-5" />
            <span className="font-semibold">
              Đã chọn {selectedPosts.length} bài viết
            </span>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3">
            <select
              value={bulkAction}
              onChange={(e) => setBulkAction(e.target.value as BulkActionValue)}
              className="px-3 py-2 rounded-xl border border-blue-200 dark:border-blue-800 bg-white dark:bg-gray-900 text-sm min-w-[220px]"
            >
              <option value="">Chọn hành động hàng loạt</option>
              <option value="publish">Publish hàng loạt</option>
              <option value="draft">Chuyển về draft</option>
              <option value="inactive">Chuyển inactive</option>
              <option value="archived">Chuyển archived</option>
              <option value="delete">Xóa mềm hàng loạt</option>
            </select>

            <button
              type="button"
              onClick={handleBulkExecute}
              disabled={!bulkAction}
              className="px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Thực thi
            </button>

            <button
              type="button"
              onClick={() => {
                setSelectedPosts([]);
                setBulkAction("");
              }}
              className="px-4 py-2 rounded-xl border border-blue-200 dark:border-blue-800 bg-white dark:bg-gray-900 text-sm font-medium text-blue-700 dark:text-blue-300"
            >
              Bỏ chọn
            </button>
          </div>
        </div>
      )}

      {/* Content Area */}
      {bootstrapLoading ? (
        <div className="flex flex-col justify-center items-center py-24 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <p className="mt-3 text-gray-500 font-medium">
            Đang đồng bộ thư viện bài viết...
          </p>
        </div>
      ) : error ? (
        <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700">
          <AlertTriangle className="w-10 h-10 text-red-500 mx-auto mb-3" />
          <p className="text-red-600 font-medium">{error}</p>
          <button
            type="button"
            onClick={fetchPosts}
            className="mt-4 px-4 py-2 rounded-lg bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 transition"
          >
            Thử tải lại
          </button>
        </div>
      ) : displayedOrderedPosts.length === 0 ? (
        posts.length === 0 &&
        !searchParams.get("keyword") &&
        !searchParams.get("status") &&
        !searchParams.get("categoryId") &&
        !searchParams.get("featured") &&
        !searchParams.get("missingThumbnail") &&
        !searchParams.get("missingSeo") ? (
          <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-2xl border border-dashed border-gray-300 dark:border-gray-600 flex flex-col items-center">
            <FileText className="w-12 h-12 text-gray-300 dark:text-gray-600 mb-4" />
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              Chưa có bài viết nào
            </h3>
            <p className="text-sm text-gray-500 mt-1 mb-5">
              Hãy tạo bài viết đầu tiên để bắt đầu xây dựng thư viện nội dung.
            </p>
            <button
              onClick={() => navigate("/admin/content/posts/create")}
              className="px-5 py-2.5 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition"
            >
              Tạo bài viết đầu tiên
            </button>
          </div>
        ) : (
          <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-2xl border border-dashed border-gray-300 dark:border-gray-600 flex flex-col items-center">
            <MoreHorizontal className="w-12 h-12 text-gray-300 dark:text-gray-600 mb-4" />
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              Không tìm thấy bài viết phù hợp
            </h3>
            <p className="text-sm text-gray-500 mt-1 mb-5">
              Thử đổi từ khóa, danh mục, trạng thái hoặc xóa các bộ lọc hiện
              tại.
            </p>
            <button
              onClick={handleResetFilters}
              className="px-5 py-2.5 bg-gray-100 text-gray-700 font-semibold rounded-lg hover:bg-gray-200 transition"
            >
              Xóa bộ lọc
            </button>
          </div>
        )
      ) : (
        <>
          {loading && !bootstrapLoading && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-blue-100 dark:border-blue-900/40 bg-blue-50/70 dark:bg-blue-900/10 text-sm text-blue-700 dark:text-blue-300">
              <Loader2 className="w-4 h-4 animate-spin" />
              Đang cập nhật danh sách bài viết...
            </div>
          )}

          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-gray-500 font-medium pl-1">
              Hiển thị {displayedOrderedPosts.length} bài viết trong tập kết quả
              hiện tại.
            </p>
            <p className="text-xs text-gray-400">
              Chất lượng nội dung được tính theo thumbnail, excerpt, category,
              SEO và trạng thái publish.
            </p>
          </div>

          {/* Desktop table */}
          {viewMode === "table" ? (
            <Card className="!p-0 overflow-hidden border border-gray-200 dark:border-gray-700">
              <div className="overflow-x-auto">
                <table className="min-w-[1320px] w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th className="px-4 py-3 text-left">
                        <input
                          type="checkbox"
                          checked={allCurrentSelected}
                          onChange={toggleSelectAllCurrentPage}
                          className="rounded border-gray-300"
                        />
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                        Bài viết
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                        Category / Tags
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                        Trạng thái
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                        Content Health
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                        Metadata
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>

                  <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-100 dark:divide-gray-800">
                    {displayedOrderedPosts.map((post) => (
                      <tr
                        key={post.id}
                        className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors align-top"
                      >
                        <td className="px-4 py-4">
                          <input
                            type="checkbox"
                            checked={selectedPosts.includes(post.id)}
                            onChange={() => toggleSelectOne(post.id)}
                            className="rounded border-gray-300"
                          />
                        </td>

                        <td className="px-4 py-4 min-w-[360px]">
                          <div className="flex items-start gap-3">
                            {renderThumbnail(post)}
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2 mb-1">
                                <button
                                  type="button"
                                  onClick={() =>
                                    navigate(
                                      `/admin/content/posts/edit/${post.id}`,
                                    )
                                  }
                                  className="text-left font-bold text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 line-clamp-1"
                                >
                                  {post.title}
                                </button>

                                {post.featured && (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-violet-50 text-violet-700 border border-violet-200 dark:bg-violet-900/20 dark:text-violet-300 dark:border-violet-800">
                                    <Star className="w-3 h-3" />
                                    Featured
                                  </span>
                                )}

                                {!post.ui.hasSeo && (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-900/20 dark:text-rose-300 dark:border-rose-800">
                                    No SEO
                                  </span>
                                )}

                                {!post.ui.hasThumbnail && (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-orange-50 text-orange-700 border border-orange-200 dark:bg-orange-900/20 dark:text-orange-300 dark:border-orange-800">
                                    No Image
                                  </span>
                                )}
                              </div>

                              <div className="text-xs text-gray-500 font-mono mb-1">
                                /{post.slug || "no-slug"}
                              </div>

                              <div className="text-sm text-gray-600 dark:text-gray-300 line-clamp-1">
                                {post.excerpt?.trim() ? (
                                  post.excerpt
                                ) : (
                                  <span className="italic text-amber-600 dark:text-amber-400">
                                    Chưa có mô tả ngắn
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="px-4 py-4 min-w-[220px]">
                          <div className="flex flex-col gap-2">
                            {post.category ? (
                              <span className="inline-flex w-fit items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800">
                                <FolderTree className="w-3.5 h-3.5" />
                                {post.category.title}
                              </span>
                            ) : (
                              <span className="inline-flex w-fit items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-800">
                                <AlertTriangle className="w-3.5 h-3.5" />
                                Chưa có category
                              </span>
                            )}

                            <div className="flex flex-wrap gap-1.5">
                              {post.tags?.slice(0, 2).map((tag) => (
                                <span
                                  key={tag.id}
                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] bg-gray-100 text-gray-700 border border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700"
                                >
                                  <Tag className="w-3 h-3" />
                                  {tag.name}
                                </span>
                              ))}

                              {(post.tags?.length || 0) > 2 && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] bg-gray-100 text-gray-700 border border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700">
                                  +{(post.tags?.length || 0) - 2}
                                </span>
                              )}

                              {!post.tags?.length && (
                                <span className="text-xs text-gray-400 italic">
                                  Chưa gắn tag
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        <td className="px-4 py-4 min-w-[180px]">
                          <div className="flex flex-col gap-2">
                            {renderStatusBadge(post.status)}
                            {post.status === "published" && (
                              <div className="text-xs text-gray-500 flex items-center gap-1.5">
                                <Clock3 className="w-3.5 h-3.5" />
                                {formatDateTime(post.published_at)}
                              </div>
                            )}
                            {post.ui.publishWarning && (
                              <div className="text-xs text-rose-600 dark:text-rose-400 font-medium">
                                Published nhưng chưa tối ưu đủ
                              </div>
                            )}
                          </div>
                        </td>

                        <td className="px-4 py-4 min-w-[240px]">
                          <div className="space-y-2">
                            <div className="flex items-center justify-between gap-3">
                              <span
                                className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${post.ui.tone}`}
                              >
                                {post.ui.label}
                              </span>
                              <span
                                className={`text-xs font-bold ${post.ui.textTone}`}
                              >
                                {post.ui.percent}%
                              </span>
                            </div>

                            <div className="w-full h-2 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                              <div
                                className={`h-full rounded-full ${
                                  post.ui.percent >= 100
                                    ? "bg-emerald-500"
                                    : post.ui.percent >= 70
                                      ? "bg-blue-500"
                                      : post.ui.percent >= 40
                                        ? "bg-amber-500"
                                        : "bg-rose-500"
                                }`}
                                style={{ width: `${post.ui.percent}%` }}
                              />
                            </div>

                            {renderHealthDots(post)}

                            <div className="flex flex-wrap gap-1">
                              {!post.ui.hasThumbnail && (
                                <span className="text-[11px] px-2 py-0.5 rounded-full bg-orange-50 text-orange-700 border border-orange-200 dark:bg-orange-900/20 dark:text-orange-300 dark:border-orange-800">
                                  Thiếu ảnh
                                </span>
                              )}
                              {!post.ui.hasSeo && (
                                <span className="text-[11px] px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-900/20 dark:text-rose-300 dark:border-rose-800">
                                  Thiếu SEO
                                </span>
                              )}
                              {!post.ui.hasExcerpt && (
                                <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-50 text-slate-700 border border-slate-200 dark:bg-slate-900/20 dark:text-slate-300 dark:border-slate-800">
                                  Thiếu excerpt
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        <td className="px-4 py-4 min-w-[200px]">
                          <div className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                            <div className="flex items-center gap-2">
                              <Hash className="w-4 h-4 text-gray-400" />
                              <span>Position: {post.position ?? "—"}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Eye className="w-4 h-4 text-gray-400" />
                              <span>{post.view_count} lượt xem</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Link2 className="w-4 h-4 text-gray-400" />
                              <span>
                                Canonical:{" "}
                                {post.ui.hasCanonical ? "Có" : "Chưa có"}
                              </span>
                            </div>
                            <div className="text-xs text-gray-500 pt-1">
                              Updated: {formatShortDate(post.updated_at)}
                            </div>
                          </div>
                        </td>

                        <td className="px-4 py-4 min-w-[220px]">
                          {renderActionButtons(post)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-5">
              {displayedOrderedPosts.map((post) => (
                <div
                  key={post.id}
                  className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-sm overflow-hidden flex flex-col"
                >
                  <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={selectedPosts.includes(post.id)}
                      onChange={() => toggleSelectOne(post.id)}
                      className="mt-1 rounded border-gray-300"
                    />

                    {renderThumbnail(post)}

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <button
                            type="button"
                            onClick={() =>
                              navigate(`/admin/content/posts/edit/${post.id}`)
                            }
                            className="text-left font-bold text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 line-clamp-2"
                          >
                            {post.title}
                          </button>
                          <div className="text-xs text-gray-500 font-mono mt-1 truncate">
                            /{post.slug || "no-slug"}
                          </div>
                        </div>
                        {renderStatusBadge(post.status)}
                      </div>

                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {post.featured && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-violet-50 text-violet-700 border border-violet-200 dark:bg-violet-900/20 dark:text-violet-300 dark:border-violet-800">
                            Featured
                          </span>
                        )}
                        {!post.ui.hasSeo && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-900/20 dark:text-rose-300 dark:border-rose-800">
                            No SEO
                          </span>
                        )}
                        {!post.ui.hasThumbnail && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-orange-50 text-orange-700 border border-orange-200 dark:bg-orange-900/20 dark:text-orange-300 dark:border-orange-800">
                            No Image
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="p-4 space-y-4">
                    <div className="text-sm text-gray-600 dark:text-gray-300">
                      {post.excerpt?.trim() ? (
                        <p className="line-clamp-2">{post.excerpt}</p>
                      ) : (
                        <p className="italic text-amber-600 dark:text-amber-400">
                          Chưa có mô tả ngắn
                        </p>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {post.category ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800">
                          <FolderTree className="w-3.5 h-3.5" />
                          {post.category.title}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-800">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          Chưa có category
                        </span>
                      )}

                      {post.tags?.slice(0, 2).map((tag) => (
                        <span
                          key={tag.id}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] bg-gray-100 text-gray-700 border border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700"
                        >
                          <Tag className="w-3 h-3" />
                          {tag.name}
                        </span>
                      ))}
                    </div>

                    <div className="p-3 rounded-xl border border-gray-100 dark:border-gray-700 bg-gray-50/80 dark:bg-gray-900/40 space-y-2">
                      <div className="flex items-center justify-between">
                        <span
                          className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${post.ui.tone}`}
                        >
                          {post.ui.label}
                        </span>
                        <span
                          className={`text-xs font-bold ${post.ui.textTone}`}
                        >
                          {post.ui.percent}%
                        </span>
                      </div>

                      <div className="w-full h-2 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            post.ui.percent >= 100
                              ? "bg-emerald-500"
                              : post.ui.percent >= 70
                                ? "bg-blue-500"
                                : post.ui.percent >= 40
                                  ? "bg-amber-500"
                                  : "bg-rose-500"
                          }`}
                          style={{ width: `${post.ui.percent}%` }}
                        />
                      </div>

                      {renderHealthDots(post)}
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-sm text-gray-600 dark:text-gray-300">
                      <div className="flex items-center gap-2">
                        <Hash className="w-4 h-4 text-gray-400" />
                        <span>Pos: {post.position ?? "—"}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Eye className="w-4 h-4 text-gray-400" />
                        <span>{post.view_count} views</span>
                      </div>
                      <div className="flex items-center gap-2 col-span-2">
                        <Globe className="w-4 h-4 text-gray-400" />
                        <span>
                          Published:{" "}
                          {post.status === "published"
                            ? formatDateTime(post.published_at)
                            : "Chưa publish"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                    {renderActionButtons(post)}
                  </div>
                </div>
              ))}
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex justify-end mt-6">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={(page) => {
                  const params = new URLSearchParams(searchParams);
                  params.set("page", String(page));
                  setSearchParams(params);
                }}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default PostsPage;
