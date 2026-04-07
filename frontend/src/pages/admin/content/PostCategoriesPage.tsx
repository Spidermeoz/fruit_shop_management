import React, { useCallback, useEffect, useMemo, useState } from "react";
import Card from "../../../components/admin/layouts/Card";
import Pagination from "../../../components/admin/common/Pagination";
import {
  Search,
  Plus,
  RefreshCw,
  FolderTree,
  FolderOpen,
  Layers,
  CheckCircle2,
  PowerOff,
  Image as ImageIcon,
  ShieldAlert,
  Loader2,
  AlertTriangle,
  ChevronRight,
  Pencil,
  Trash2,
  Power,
  CornerDownRight,
  Hash,
  Sparkles,
  LayoutGrid,
  List,
  CopyPlus,
  Link2,
  FileText,
  X,
} from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { http } from "../../../services/http";
import { useAdminToast } from "../../../context/AdminToastContext";
import PostCategoryCreateModal from "./PostCategoryCreateModal";
import PostCategoryEditModal from "./PostCategoryEditModal";

// =============================
// TYPES
// =============================
type CategoryStatus = "active" | "inactive";
type ParentTypeFilter = "all" | "root" | "child";
type SortValue =
  | "newest"
  | "updated_desc"
  | "title_asc"
  | "title_desc"
  | "position_asc";
type QuickFilterType = "all" | "missing-thumbnail" | "missing-seo";
type BulkActionValue = "" | "active" | "inactive" | "delete";

interface PostCategory {
  id: number;
  title: string;
  parent_id?: number | null;
  parent?: {
    id: number;
    title: string;
  } | null;
  description?: string | null;
  thumbnail?: string | null;
  status: CategoryStatus;
  position?: number | null;
  slug?: string | null;
  seo_title?: string | null;
  seo_description?: string | null;
  seo_keywords?: string | null;
  og_image?: string | null;
  canonical_url?: string | null;
  children?: PostCategory[];
  created_at?: string | null;
  updated_at?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

type PostCategoryListRow = PostCategory;

interface PostCategoryListSummary {
  totalItems: number;
  activeCount: number;
  inactiveCount: number;
  rootCount: number;
  childCount: number;
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
    summary?: Partial<PostCategoryListSummary>;
  };
};

type ApiSummary = {
  success: boolean;
  data: PostCategoryListSummary;
};

type BulkEditResponse = {
  success: boolean;
  data: {
    ids: number[];
    count: number;
    rows: any[];
  };
};

type ReorderPair = {
  id: number;
  position: number;
};

type ParentOption = {
  id: number;
  title: string;
  level: number;
};

type EnrichedCategory = PostCategory & {
  ui: ReturnType<typeof getCategoryHealth>;
  hierarchy: ReturnType<typeof getHierarchyInfo>;
};

// =============================
// HELPERS
// =============================
const statusMap: Record<
  CategoryStatus,
  {
    label: string;
    badge: string;
  }
> = {
  active: {
    label: "Active",
    badge:
      "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-800",
  },
  inactive: {
    label: "Inactive",
    badge:
      "bg-gray-100 text-gray-700 border border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700",
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

function hasThumbnail(category: PostCategory): boolean {
  return Boolean(category.thumbnail?.trim() || category.og_image?.trim());
}

function isSeoReady(category: PostCategory): boolean {
  return Boolean(
    category.seo_title?.trim() && category.seo_description?.trim(),
  );
}

function getApiErrorMessage(err: any, fallback: string): string {
  return err?.response?.data?.message || err?.message || fallback;
}

function normalizeCategoryListRow(raw: any): PostCategoryListRow {
  const safeStatus = String(raw?.status || "active").toLowerCase();
  const normalizedStatus: CategoryStatus = (
    ["active", "inactive"].includes(safeStatus) ? safeStatus : "active"
  ) as CategoryStatus;

  return {
    id: Number(raw?.id),
    title: String(raw?.title || "Untitled category"),
    parent_id:
      raw?.parent_id != null && raw?.parent_id !== ""
        ? Number(raw.parent_id)
        : null,
    parent:
      raw?.parent && typeof raw.parent === "object"
        ? {
            id: Number(raw.parent.id),
            title: String(raw.parent.title || "Parent"),
          }
        : null,
    description: raw?.description ?? null,
    thumbnail: raw?.thumbnail ?? null,
    status: normalizedStatus,
    position:
      raw?.position != null && raw?.position !== ""
        ? Number(raw.position)
        : null,
    slug: raw?.slug ?? null,
    seo_title: raw?.seo_title ?? null,
    seo_description: raw?.seo_description ?? null,
    seo_keywords: raw?.seo_keywords ?? null,
    og_image: raw?.og_image ?? null,
    canonical_url: raw?.canonical_url ?? null,
    children: [],
    created_at: raw?.created_at ?? null,
    updated_at: raw?.updated_at ?? null,
    createdAt: raw?.created_at ?? null,
    updatedAt: raw?.updated_at ?? null,
  };
}

function getCategoryHealth(category: PostCategory) {
  const checks = [
    hasThumbnail(category),
    Boolean(category.slug?.trim()),
    Boolean(category.seo_title?.trim()),
    Boolean(category.seo_description?.trim()),
  ];

  const passed = checks.filter(Boolean).length;
  const percent = Math.round((passed / checks.length) * 100);

  const missingSignals: string[] = [];
  if (!hasThumbnail(category)) missingSignals.push("Thiếu thumbnail");
  if (!category.slug?.trim()) missingSignals.push("Thiếu slug");
  if (!category.seo_title?.trim()) missingSignals.push("Thiếu SEO title");
  if (!category.seo_description?.trim()) {
    missingSignals.push("Thiếu SEO description");
  }

  let label = "Hoàn chỉnh";
  let tone =
    "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-800";
  let barColor = "bg-emerald-500";

  if (percent < 40) {
    label = "Thiếu nhiều dữ liệu";
    tone =
      "bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-900/20 dark:text-rose-300 dark:border-rose-800";
    barColor = "bg-rose-500";
  } else if (percent < 70) {
    label = "Cần bổ sung";
    tone =
      "bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-800";
    barColor = "bg-amber-500";
  } else if (percent < 100) {
    label = "Khá tốt";
    tone =
      "bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800";
    barColor = "bg-blue-500";
  }

  const activeButIncomplete =
    category.status === "active" &&
    (!hasThumbnail(category) || !isSeoReady(category));

  return {
    percent,
    label,
    tone,
    barColor,
    missingSignals,
    hasThumbnail: hasThumbnail(category),
    hasSeo: isSeoReady(category),
    hasSlug: Boolean(category.slug?.trim()),
    activeButIncomplete,
  };
}

function getHierarchyInfo(
  category: PostCategory,
  categoryMap: Map<number, PostCategory>,
  childCountMap: Map<number, number>,
) {
  const isRoot = !category.parent_id;
  const parent = category.parent_id
    ? categoryMap.get(category.parent_id)
    : null;
  const childCount = childCountMap.get(category.id) || 0;

  return {
    isRoot,
    typeLabel: isRoot ? "Root" : "Child",
    parentName: parent?.title || category.parent?.title || null,
    childCount,
  };
}

function buildParentOptions(
  categories: PostCategory[],
  excludeId?: number | null,
): ParentOption[] {
  const byParent = new Map<number | null, PostCategory[]>();

  categories.forEach((item) => {
    if (excludeId != null && item.id === excludeId) return;

    const key = item.parent_id ?? null;
    const bucket = byParent.get(key) ?? [];
    bucket.push(item);
    byParent.set(key, bucket);
  });

  byParent.forEach((bucket) => {
    bucket.sort((a, b) => {
      const posA = a.position ?? Number.MAX_SAFE_INTEGER;
      const posB = b.position ?? Number.MAX_SAFE_INTEGER;
      if (posA !== posB) return posA - posB;
      return a.title.localeCompare(b.title, "vi");
    });
  });

  const result: ParentOption[] = [];

  const walk = (parentId: number | null, level: number) => {
    const children = byParent.get(parentId) ?? [];
    children.forEach((child) => {
      result.push({
        id: child.id,
        title: child.title,
        level,
      });
      walk(child.id, level + 1);
    });
  };

  walk(null, 0);

  return result;
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

function mapCategorySort(sort: SortValue): {
  sortBy: "id" | "title" | "position" | "createdAt" | "updatedAt";
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
    case "newest":
    default:
      return { sortBy: "id", order: "DESC" };
  }
}

// =============================
// MAIN PAGE
// =============================
const PostCategoriesPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { showSuccessToast, showErrorToast } = useAdminToast();

  // search params
  const currentPage = parseNumberParam(searchParams.get("page"), 1);
  const statusFilter = searchParams.get("status") || "all";
  const sortOrder = (searchParams.get("sort") || "newest") as SortValue;
  const parentTypeFilter = (searchParams.get("parentType") ||
    "all") as ParentTypeFilter;
  const missingThumbnailFilter =
    searchParams.get("missingThumbnail") === "true";
  const missingSeoFilter = searchParams.get("missingSeo") === "true";

  // states
  const [categories, setCategories] = useState<PostCategoryListRow[]>([]);
  const [summaryRows, setSummaryRows] = useState<PostCategoryListRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [bootstrapLoading, setBootstrapLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [reordering, setReordering] = useState(false);
  const [error, setError] = useState("");
  const [summary, setSummary] = useState<PostCategoryListSummary>({
    totalItems: 0,
    activeCount: 0,
    inactiveCount: 0,
    rootCount: 0,
    childCount: 0,
    missingThumbnailCount: 0,
    missingSeoCount: 0,
  });
  const [totalPages, setTotalPages] = useState(1);
  const [, setTotalCount] = useState(0);

  const [searchTerm, setSearchTerm] = useState(
    searchParams.get("keyword") || "",
  );
  const [quickFilter, setQuickFilter] = useState<QuickFilterType>("all");
  const [viewMode, setViewMode] = useState<"table" | "board">("table");
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<number[]>([]);
  const [bulkAction, setBulkAction] = useState<BulkActionValue>("");
  const [statusUpdatingId, setStatusUpdatingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // modal/editor states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);

  const [createParentId, setCreateParentId] = useState<number | null>(null);
  const [editingCategoryId, setEditingCategoryId] = useState<number | null>(
    null,
  );

  // fetchers
  const fetchSummary = useCallback(async () => {
    try {
      setBootstrapLoading(true);

      const res = await http<ApiSummary>(
        "GET",
        "/api/v1/admin/post-categories/summary",
      );

      if (res?.success && res.data) {
        setSummary({
          totalItems: Number(res.data.totalItems ?? 0),
          activeCount: Number(res.data.activeCount ?? 0),
          inactiveCount: Number(res.data.inactiveCount ?? 0),
          rootCount: Number(res.data.rootCount ?? 0),
          childCount: Number(res.data.childCount ?? 0),
          missingThumbnailCount: Number(res.data.missingThumbnailCount ?? 0),
          missingSeoCount: Number(res.data.missingSeoCount ?? 0),
        });
      }
    } catch (err) {
      console.error("Không thể tải summary post categories", err);
    } finally {
      setBootstrapLoading(false);
    }
  }, []);

  const fetchHierarchyRows = useCallback(async () => {
    try {
      const res = await http<ApiList<any>>(
        "GET",
        "/api/v1/admin/post-categories?limit=1000&sortBy=position&order=ASC",
      );

      if (res?.success && Array.isArray(res.data)) {
        const normalized = res.data.map(normalizeCategoryListRow);
        setSummaryRows(normalized);
      }
    } catch (err) {
      console.error("Không thể tải hierarchy rows post categories", err);
    }
  }, []);

  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const limit = 12;
      const mappedSort = mapCategorySort(sortOrder);

      const queryUrl = buildQueryUrl("/api/v1/admin/post-categories", {
        limit,
        page: currentPage,
        keyword: searchParams.get("keyword")?.trim() || undefined,
        status: statusFilter !== "all" ? statusFilter : undefined,
        parentType: parentTypeFilter !== "all" ? parentTypeFilter : undefined,
        missingThumbnail: missingThumbnailFilter ? true : undefined,
        missingSeo: missingSeoFilter ? true : undefined,
        sortBy: mappedSort.sortBy,
        order: mappedSort.order,
      });

      const res = await http<ApiList<any>>("GET", queryUrl);

      if (res?.success && Array.isArray(res.data)) {
        const normalized = res.data.map(normalizeCategoryListRow);
        setCategories(normalized);

        const total = Number(res.meta?.total ?? normalized.length ?? 0);
        setTotalCount(total);
        setTotalPages(Math.max(1, Math.ceil(total / limit)));
      } else {
        setError("Không thể tải danh sách danh mục bài viết.");
      }
    } catch (err: any) {
      setError(getApiErrorMessage(err, "Lỗi tải dữ liệu danh mục bài viết."));
    } finally {
      setLoading(false);
    }
  }, [
    currentPage,
    statusFilter,
    sortOrder,
    parentTypeFilter,
    missingThumbnailFilter,
    missingSeoFilter,
    searchParams,
  ]);

  useEffect(() => {
    fetchSummary();
    fetchHierarchyRows();
  }, [fetchSummary, fetchHierarchyRows]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

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
    setSelectedCategoryIds([]);
  }, [
    currentPage,
    statusFilter,
    sortOrder,
    parentTypeFilter,
    missingThumbnailFilter,
    missingSeoFilter,
    quickFilter,
  ]);

  // derived
  const categoryMap = useMemo(() => {
    const map = new Map<number, PostCategory>();
    summaryRows.forEach((item) => map.set(item.id, item));
    return map;
  }, [summaryRows]);

  const childCountMap = useMemo(() => {
    const map = new Map<number, number>();
    summaryRows.forEach((item) => {
      if (item.parent_id) {
        map.set(item.parent_id, (map.get(item.parent_id) || 0) + 1);
      }
    });
    return map;
  }, [summaryRows]);

  const enrichedCategories = useMemo<EnrichedCategory[]>(() => {
    return categories.map((category) => ({
      ...category,
      ui: getCategoryHealth(category),
      hierarchy: getHierarchyInfo(category, categoryMap, childCountMap),
    }));
  }, [categories, categoryMap, childCountMap]);

  const summaryEnrichedCategories = useMemo<EnrichedCategory[]>(() => {
    return summaryRows.map((category) => ({
      ...category,
      ui: getCategoryHealth(category),
      hierarchy: getHierarchyInfo(category, categoryMap, childCountMap),
    }));
  }, [summaryRows, categoryMap, childCountMap]);

  const displayedCategories = useMemo(() => {
    let rows = enrichedCategories;

    if (quickFilter === "missing-thumbnail") {
      rows = rows.filter((item) => !item.ui.hasThumbnail);
    }

    if (quickFilter === "missing-seo") {
      rows = rows.filter((item) => !item.ui.hasSeo);
    }

    return [...rows].sort((a, b) => {
      if (a.parent_id === b.parent_id) return 0;
      if (!a.parent_id && b.parent_id) return -1;
      if (a.parent_id && !b.parent_id) return 1;
      return 0;
    });
  }, [enrichedCategories, quickFilter]);

  const computedSummary = useMemo<PostCategoryListSummary>(() => {
    const totalItems = summaryEnrichedCategories.length;
    const activeCount = summaryEnrichedCategories.filter(
      (item) => item.status === "active",
    ).length;
    const inactiveCount = summaryEnrichedCategories.filter(
      (item) => item.status === "inactive",
    ).length;
    const rootCount = summaryEnrichedCategories.filter(
      (item) => !item.parent_id,
    ).length;
    const childCount = summaryEnrichedCategories.filter(
      (item) => !!item.parent_id,
    ).length;
    const missingThumbnailCount = summaryEnrichedCategories.filter(
      (item) => !item.ui.hasThumbnail,
    ).length;
    const missingSeoCount = summaryEnrichedCategories.filter(
      (item) => !item.ui.hasSeo,
    ).length;

    return {
      totalItems,
      activeCount,
      inactiveCount,
      rootCount,
      childCount,
      missingThumbnailCount,
      missingSeoCount,
    };
  }, [summaryEnrichedCategories]);

  const effectiveSummary = useMemo(() => {
    return summary.totalItems > 0 ? summary : computedSummary;
  }, [summary, computedSummary]);

  const attentionStats = useMemo(() => {
    return {
      missingThumbnailRows: summaryEnrichedCategories.filter(
        (item) => !item.ui.hasThumbnail,
      ),
      missingSeoRows: summaryEnrichedCategories.filter(
        (item) => !item.ui.hasSeo,
      ),
      inactiveRows: summaryEnrichedCategories.filter(
        (item) => item.status === "inactive",
      ),
      rootIncompleteRows: summaryEnrichedCategories.filter(
        (item) => item.hierarchy.isRoot && item.ui.percent < 100,
      ),
      childRows: summaryEnrichedCategories.filter((item) => !!item.parent_id),
      missingSlugRows: summaryEnrichedCategories.filter(
        (item) => !item.ui.hasSlug,
      ),
    };
  }, [summaryEnrichedCategories]);

  const parentOptions = useMemo(
    () => buildParentOptions(summaryRows),
    [summaryRows],
  );

  const allCurrentSelected =
    displayedCategories.length > 0 &&
    displayedCategories.every((item) => selectedCategoryIds.includes(item.id));

  const hasActiveFilters =
    !!searchParams.get("keyword") ||
    !!searchParams.get("status") ||
    !!searchParams.get("parentType") ||
    !!searchParams.get("missingThumbnail") ||
    !!searchParams.get("missingSeo") ||
    quickFilter !== "all";

  // actions
  const updateParams = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams);
    Object.entries(updates).forEach(([key, value]) => {
      if (value == null || value === "" || value === "all") params.delete(key);
      else params.set(key, value);
    });
    params.delete("page");
    setSearchParams(params);
  };

  const refreshAllData = useCallback(async () => {
    await Promise.all([
      fetchCategories(),
      fetchSummary(),
      fetchHierarchyRows(),
    ]);
  }, [fetchCategories, fetchSummary, fetchHierarchyRows]);

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      await refreshAllData();
    } finally {
      setRefreshing(false);
    }
  };

  const handleSaveReorder = async (pairs: ReorderPair[]) => {
    if (!pairs.length) return;

    try {
      setReordering(true);
      await http("PATCH", "/api/v1/admin/post-categories/reorder", {
        pairs,
      });
      showSuccessToast({ message: "Đã lưu thứ tự danh mục thành công!" });
      await refreshAllData();
    } catch (err: any) {
      showErrorToast(getApiErrorMessage(err, "Không thể lưu thứ tự danh mục."));
    } finally {
      setReordering(false);
    }
  };

  const handleResetFilters = () => {
    setQuickFilter("all");
    setSearchParams(new URLSearchParams());
    setSearchTerm("");
  };

  const toggleSelectOne = (id: number) => {
    setSelectedCategoryIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  const toggleSelectAllCurrentPage = () => {
    if (allCurrentSelected) {
      setSelectedCategoryIds((prev) =>
        prev.filter(
          (id) => !displayedCategories.some((item) => item.id === id),
        ),
      );
      return;
    }

    setSelectedCategoryIds((prev) => {
      const next = new Set(prev);
      displayedCategories.forEach((item) => next.add(item.id));
      return Array.from(next);
    });
  };

  const openCreateModal = (parentId?: number | null) => {
    setCreateParentId(parentId ?? null);
    setIsCreateOpen(true);
  };

  const openEditModal = (category: PostCategory) => {
    setEditingCategoryId(category.id);
    setIsEditOpen(true);
  };

  const closeModals = () => {
    setIsCreateOpen(false);
    setIsEditOpen(false);
    setCreateParentId(null);
    setEditingCategoryId(null);
  };

  const handleToggleStatus = async (category: PostCategory) => {
    const nextStatus: CategoryStatus =
      category.status === "active" ? "inactive" : "active";

    try {
      setStatusUpdatingId(category.id);
      await http(
        "PATCH",
        `/api/v1/admin/post-categories/${category.id}/status`,
        {
          status: nextStatus,
        },
      );
      showSuccessToast({ message: "Cập nhật trạng thái danh mục thành công!" });
      await refreshAllData();
    } catch (err: any) {
      showErrorToast(
        getApiErrorMessage(err, "Không thể cập nhật trạng thái danh mục."),
      );
    } finally {
      setStatusUpdatingId(null);
    }
  };

  const handleDelete = async (category: PostCategory) => {
    const confirmed = window.confirm(
      `Bạn có chắc muốn xóa mềm danh mục "${category.title}" không?`,
    );
    if (!confirmed) return;

    try {
      setDeletingId(category.id);
      await http(
        "DELETE",
        `/api/v1/admin/post-categories/delete/${category.id}`,
      );
      showSuccessToast({ message: "Đã xóa danh mục thành công!" });
      await refreshAllData();
    } catch (err: any) {
      showErrorToast(
        getApiErrorMessage(err, "Không thể xóa danh mục bài viết."),
      );
    } finally {
      setDeletingId(null);
    }
  };

  const handleBulkExecute = async () => {
    if (!bulkAction || selectedCategoryIds.length === 0) return;

    if (bulkAction === "delete") {
      const confirmed = window.confirm(
        `Bạn có chắc muốn xóa mềm ${selectedCategoryIds.length} danh mục đã chọn không?`,
      );
      if (!confirmed) return;

      try {
        await http<BulkEditResponse>(
          "PATCH",
          "/api/v1/admin/post-categories/bulk",
          {
            ids: selectedCategoryIds,
            patch: { deleted: true },
          },
        );

        showSuccessToast({
          message: `Đã xóa ${selectedCategoryIds.length} danh mục thành công!`,
        });

        setSelectedCategoryIds([]);
        setBulkAction("");
        await refreshAllData();
      } catch (err: any) {
        showErrorToast(
          getApiErrorMessage(err, "Không thể xóa hàng loạt danh mục."),
        );
      }

      return;
    }

    const nextStatus = bulkAction as CategoryStatus;
    const confirmed = window.confirm(
      `Bạn có chắc muốn chuyển ${selectedCategoryIds.length} danh mục sang trạng thái "${statusMap[nextStatus].label}" không?`,
    );
    if (!confirmed) return;

    try {
      await http<BulkEditResponse>(
        "PATCH",
        "/api/v1/admin/post-categories/bulk",
        {
          ids: selectedCategoryIds,
          patch: { status: nextStatus },
        },
      );

      showSuccessToast({
        message: `Đã cập nhật ${selectedCategoryIds.length} danh mục thành công!`,
      });

      setSelectedCategoryIds([]);
      setBulkAction("");
      await refreshAllData();
    } catch (err: any) {
      showErrorToast(
        getApiErrorMessage(err, "Không thể cập nhật hàng loạt danh mục."),
      );
    }
  };

  // tránh cảnh báo unused khi chưa có UI reorder
  void handleSaveReorder;
  void reordering;

  // render helpers
  const renderThumbnail = (category: EnrichedCategory) => {
    const imageSrc = category.thumbnail?.trim() || category.og_image?.trim();

    if (imageSrc) {
      return (
        <img
          src={imageSrc}
          alt={category.title}
          className="w-14 h-14 rounded-xl object-cover border border-gray-200 dark:border-gray-700 shrink-0"
        />
      );
    }

    return (
      <div className="w-14 h-14 rounded-xl border border-dashed border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 flex items-center justify-center shrink-0">
        <ImageIcon className="w-4 h-4 text-gray-400" />
      </div>
    );
  };

  const renderStatusBadge = (status: CategoryStatus) => (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider ${statusMap[status].badge}`}
    >
      {statusMap[status].label}
    </span>
  );

  const renderHealthDots = (category: EnrichedCategory) => {
    const items = [
      { label: "Thumbnail", ok: category.ui.hasThumbnail },
      { label: "SEO", ok: category.ui.hasSeo },
      { label: "Slug", ok: category.ui.hasSlug },
    ];

    return (
      <div className="flex items-center gap-3 flex-wrap">
        {items.map((item) => (
          <div key={item.label} className="flex items-center gap-1.5">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                item.ok ? "bg-emerald-500" : "bg-rose-400"
              }`}
            />
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {item.label}
            </span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="w-full pb-10 space-y-6">
      {/* Header */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="min-w-0">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-11 h-11 rounded-2xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center border border-blue-100 dark:border-blue-800">
              <FolderTree className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Content Categories
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Quản lý cấu trúc danh mục, phân cấp nội dung và chất lượng hiển
                thị/SEO cho hệ thống bài viết.
              </p>
            </div>
          </div>

          <div className="inline-flex items-center gap-2 mt-1 px-3 py-1.5 rounded-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-xs text-gray-600 dark:text-gray-300">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            Taxonomy là xương sống giúp nội dung có cấu trúc và điều hướng rõ
            ràng.
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
          <button
            onClick={handleRefresh}
            className="p-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
            title="Làm mới dữ liệu"
          >
            {refreshing ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <RefreshCw className="w-5 h-5" />
            )}
          </button>

          <button
            onClick={() => navigate("/admin/content/posts")}
            className="px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition"
          >
            Đi tới bài viết
          </button>

          <button
            onClick={() => navigate("/admin/content/tags")}
            className="px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition"
          >
            Quản lý tags
          </button>

          <button
            onClick={() => openCreateModal()}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition shadow-sm ml-auto xl:ml-0"
          >
            <Plus className="w-4 h-4" />
            Tạo danh mục mới
          </button>
        </div>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-7 gap-3">
        {[
          {
            label: "Tổng danh mục",
            value: effectiveSummary.totalItems,
            icon: Layers,
            color: "text-blue-600",
            bg: "bg-blue-50",
            onClick: () => {
              setQuickFilter("all");
              updateParams({
                status: null,
                parentType: null,
                missingThumbnail: null,
                missingSeo: null,
              });
            },
          },
          {
            label: "Đang hoạt động",
            value: effectiveSummary.activeCount,
            icon: CheckCircle2,
            color: "text-emerald-600",
            bg: "bg-emerald-50",
            onClick: () => updateParams({ status: "active" }),
          },
          {
            label: "Đang tắt",
            value: effectiveSummary.inactiveCount,
            icon: PowerOff,
            color: "text-gray-600",
            bg: "bg-gray-100",
            onClick: () => updateParams({ status: "inactive" }),
          },
          {
            label: "Danh mục gốc",
            value: effectiveSummary.rootCount,
            icon: FolderOpen,
            color: "text-blue-600",
            bg: "bg-blue-50",
            onClick: () => updateParams({ parentType: "root" }),
          },
          {
            label: "Danh mục con",
            value: effectiveSummary.childCount,
            icon: CornerDownRight,
            color: "text-indigo-600",
            bg: "bg-indigo-50",
            onClick: () => updateParams({ parentType: "child" }),
          },
          {
            label: "Thiếu thumbnail",
            value: effectiveSummary.missingThumbnailCount,
            icon: ImageIcon,
            color: "text-orange-600",
            bg: "bg-orange-50",
            onClick: () => updateParams({ missingThumbnail: "true" }),
          },
          {
            label: "Thiếu SEO",
            value: effectiveSummary.missingSeoCount,
            icon: ShieldAlert,
            color: "text-violet-600",
            bg: "bg-violet-50",
            onClick: () => updateParams({ missingSeo: "true" }),
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
              {item.value}
            </div>
          </button>
        ))}
      </div>

      {/* Action center */}
      {!bootstrapLoading &&
        (attentionStats.missingThumbnailRows.length > 0 ||
          attentionStats.missingSeoRows.length > 0 ||
          attentionStats.inactiveRows.length > 0 ||
          attentionStats.rootIncompleteRows.length > 0 ||
          attentionStats.childRows.length > 0 ||
          attentionStats.missingSlugRows.length > 0) && (
          <Card className="border-amber-200 dark:border-amber-900/40 !p-0 overflow-hidden">
            <div className="p-4 bg-amber-50/70 dark:bg-amber-900/10 border-b border-amber-100 dark:border-amber-900/40 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div>
                <h3 className="font-bold text-amber-800 dark:text-amber-300 flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5" />
                  Trung tâm xử lý nhanh taxonomy
                </h3>
                <p className="text-sm text-amber-700/90 dark:text-amber-200/80 mt-1">
                  Những nhóm danh mục đang cần được hoàn thiện để taxonomy gọn,
                  rõ và tối ưu hơn.
                </p>
              </div>
              <span className="text-xs font-semibold text-amber-700 dark:text-amber-300 px-2.5 py-1 rounded-full bg-white/80 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                Content Taxonomy Workspace
              </span>
            </div>

            <div className="p-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {[
                {
                  title: `${attentionStats.missingThumbnailRows.length} danh mục thiếu ảnh đại diện`,
                  note: "Bổ sung thumbnail để taxonomy trực quan hơn",
                  visible: attentionStats.missingThumbnailRows.length > 0,
                  icon: ImageIcon,
                  tone: "text-orange-600 bg-orange-50 border-orange-200",
                  onClick: () => {
                    setQuickFilter("missing-thumbnail");
                    updateParams({ missingThumbnail: "true" });
                  },
                },
                {
                  title: `${attentionStats.missingSeoRows.length} danh mục thiếu SEO`,
                  note: "SEO title hoặc description chưa đầy đủ",
                  visible: attentionStats.missingSeoRows.length > 0,
                  icon: ShieldAlert,
                  tone: "text-violet-600 bg-violet-50 border-violet-200",
                  onClick: () => {
                    setQuickFilter("missing-seo");
                    updateParams({ missingSeo: "true" });
                  },
                },
                {
                  title: `${attentionStats.inactiveRows.length} danh mục đang tắt`,
                  note: "Kiểm tra lại taxonomy không còn dùng hoặc tạm ẩn",
                  visible: attentionStats.inactiveRows.length > 0,
                  icon: PowerOff,
                  tone: "text-gray-600 bg-gray-100 border-gray-200",
                  onClick: () => updateParams({ status: "inactive" }),
                },
                {
                  title: `${attentionStats.rootIncompleteRows.length} danh mục gốc chưa tối ưu metadata`,
                  note: "Các nhóm cấp cao nên được tối ưu trước",
                  visible: attentionStats.rootIncompleteRows.length > 0,
                  icon: FolderOpen,
                  tone: "text-blue-600 bg-blue-50 border-blue-200",
                  onClick: () => updateParams({ parentType: "root" }),
                },
                {
                  title: `${attentionStats.childRows.length} danh mục con cần rà soát`,
                  note: "Theo dõi cấu trúc phân cấp cha–con",
                  visible: attentionStats.childRows.length > 0,
                  icon: CornerDownRight,
                  tone: "text-indigo-600 bg-indigo-50 border-indigo-200",
                  onClick: () => updateParams({ parentType: "child" }),
                },
                {
                  title: `${attentionStats.missingSlugRows.length} danh mục thiếu slug`,
                  note: "Cần slug rõ ràng để URL và SEO tốt hơn",
                  visible: attentionStats.missingSlugRows.length > 0,
                  icon: Link2,
                  tone: "text-rose-600 bg-rose-50 border-rose-200",
                  onClick: () => {
                    setQuickFilter("all");
                    updateParams({
                      missingThumbnail: null,
                      missingSeo: null,
                      status: null,
                    });
                  },
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

      {/* Filter bar */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm space-y-4">
        <div className="flex flex-col xl:flex-row gap-4 xl:items-center xl:justify-between">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm theo tên danh mục, slug..."
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
              <option value="position_asc">Position tăng dần</option>
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

        <div className="flex flex-wrap items-center gap-2 border-t border-b border-gray-100 dark:border-gray-700 py-4">
          {[
            { key: "all", label: "Tất cả" },
            { key: "active", label: "Hoạt động" },
            { key: "inactive", label: "Dừng" },
          ].map((tab) => {
            const active =
              statusFilter === tab.key ||
              (tab.key === "all" && !searchParams.get("status"));
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() =>
                  updateParams({
                    status: tab.key === "all" ? null : tab.key,
                  })
                }
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

        <div className="flex flex-col 2xl:flex-row gap-4 2xl:items-center 2xl:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <select
              value={parentTypeFilter}
              onChange={(e) =>
                updateParams({
                  parentType: e.target.value === "all" ? null : e.target.value,
                })
              }
              className="px-3 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-white min-w-[180px]"
            >
              <option value="all">Tất cả cấp danh mục</option>
              <option value="root">Chỉ danh mục gốc</option>
              <option value="child">Chỉ danh mục con</option>
            </select>

            <button
              type="button"
              onClick={() => {
                setQuickFilter((prev) =>
                  prev === "missing-thumbnail" ? "all" : "missing-thumbnail",
                );
                updateParams({
                  missingThumbnail: missingThumbnailFilter ? null : "true",
                });
              }}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition ${
                missingThumbnailFilter || quickFilter === "missing-thumbnail"
                  ? "bg-gray-900 text-white dark:bg-white dark:text-gray-900 border-gray-900 dark:border-white"
                  : "bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-gray-300"
              }`}
            >
              Thiếu thumbnail
            </button>

            <button
              type="button"
              onClick={() => {
                setQuickFilter((prev) =>
                  prev === "missing-seo" ? "all" : "missing-seo",
                );
                updateParams({
                  missingSeo: missingSeoFilter ? null : "true",
                });
              }}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition ${
                missingSeoFilter || quickFilter === "missing-seo"
                  ? "bg-gray-900 text-white dark:bg-white dark:text-gray-900 border-gray-900 dark:border-white"
                  : "bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-gray-300"
              }`}
            >
              Thiếu SEO
            </button>
          </div>

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

      {/* Bulk action */}
      {selectedCategoryIds.length > 0 && (
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 p-4 rounded-2xl border border-blue-200 dark:border-blue-900/40 bg-blue-50/70 dark:bg-blue-900/10">
          <div className="flex items-center gap-2 text-blue-800 dark:text-blue-300">
            <CheckCircle2 className="w-5 h-5" />
            <span className="font-semibold">
              Đã chọn {selectedCategoryIds.length} danh mục
            </span>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3">
            <select
              value={bulkAction}
              onChange={(e) => setBulkAction(e.target.value as BulkActionValue)}
              className="px-3 py-2 rounded-xl border border-blue-200 dark:border-blue-800 bg-white dark:bg-gray-900 text-sm min-w-[220px]"
            >
              <option value="">Chọn hành động hàng loạt</option>
              <option value="active">Chuyển active</option>
              <option value="inactive">Chuyển inactive</option>
              <option value="delete">Xóa mềm hàng loạt</option>
            </select>

            <button
              type="button"
              onClick={handleBulkExecute}
              disabled={!bulkAction}
              className="px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition disabled:opacity-50"
            >
              Thực thi
            </button>

            <button
              type="button"
              onClick={() => {
                setSelectedCategoryIds([]);
                setBulkAction("");
              }}
              className="px-4 py-2 rounded-xl border border-blue-200 dark:border-blue-800 bg-white dark:bg-gray-900 text-sm font-medium text-blue-700 dark:text-blue-300"
            >
              Bỏ chọn
            </button>
          </div>
        </div>
      )}

      {/* Content area */}
      {loading ? (
        <div className="flex flex-col justify-center items-center py-24 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <p className="mt-3 text-gray-500 font-medium">
            Đang đồng bộ taxonomy nội dung...
          </p>
        </div>
      ) : error ? (
        <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700">
          <AlertTriangle className="w-10 h-10 text-red-500 mx-auto mb-3" />
          <p className="text-red-600 font-medium">{error}</p>
          <button
            type="button"
            onClick={fetchCategories}
            className="mt-4 px-4 py-2 rounded-lg bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 transition"
          >
            Thử tải lại
          </button>
        </div>
      ) : displayedCategories.length === 0 ? (
        categories.length === 0 && !hasActiveFilters ? (
          <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-2xl border border-dashed border-gray-300 dark:border-gray-600 flex flex-col items-center">
            <FolderTree className="w-12 h-12 text-gray-300 dark:text-gray-600 mb-4" />
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              Chưa có danh mục bài viết
            </h3>
            <p className="text-sm text-gray-500 mt-1 mb-5">
              Hãy tạo danh mục đầu tiên để bắt đầu xây dựng taxonomy nội dung.
            </p>
            <button
              onClick={() => openCreateModal()}
              className="px-5 py-2.5 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition"
            >
              Tạo danh mục đầu tiên
            </button>
          </div>
        ) : (
          <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-2xl border border-dashed border-gray-300 dark:border-gray-600 flex flex-col items-center">
            <FileText className="w-12 h-12 text-gray-300 dark:text-gray-600 mb-4" />
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              Không tìm thấy danh mục phù hợp
            </h3>
            <p className="text-sm text-gray-500 mt-1 mb-5">
              Thử đổi từ khóa hoặc xóa các bộ lọc hiện tại để xem kết quả.
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
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-gray-500 font-medium pl-1">
              Hiển thị {displayedCategories.length} danh mục ở trang hiện tại.
            </p>
            <p className="text-xs text-gray-400">
              Taxonomy health dựa trên thumbnail, slug và SEO metadata.
            </p>
          </div>

          {viewMode === "table" ? (
            <Card className="!p-0 overflow-hidden border border-gray-200 dark:border-gray-700">
              <div className="overflow-x-auto">
                <table className="min-w-[1280px] w-full divide-y divide-gray-200 dark:divide-gray-700">
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
                        Category info
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                        Hierarchy
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                        SEO / Completeness
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
                    {displayedCategories.map((category) => (
                      <tr
                        key={category.id}
                        className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors align-top"
                      >
                        <td className="px-4 py-4">
                          <input
                            type="checkbox"
                            checked={selectedCategoryIds.includes(category.id)}
                            onChange={() => toggleSelectOne(category.id)}
                            className="rounded border-gray-300"
                          />
                        </td>

                        <td className="px-4 py-4 min-w-[340px]">
                          <div
                            className={`flex items-start gap-3 ${
                              category.hierarchy.isRoot ? "" : "pl-5"
                            }`}
                          >
                            {!category.hierarchy.isRoot && (
                              <div className="pt-2">
                                <CornerDownRight className="w-4 h-4 text-gray-400" />
                              </div>
                            )}

                            {renderThumbnail(category)}

                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2 mb-1">
                                <button
                                  type="button"
                                  onClick={() => openEditModal(category)}
                                  className="text-left font-bold text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 line-clamp-1"
                                >
                                  {category.title}
                                </button>

                                <span
                                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                    category.hierarchy.isRoot
                                      ? "bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800"
                                      : "bg-indigo-50 text-indigo-700 border border-indigo-200 dark:bg-indigo-900/20 dark:text-indigo-300 dark:border-indigo-800"
                                  }`}
                                >
                                  {category.hierarchy.isRoot ? (
                                    <FolderOpen className="w-3 h-3" />
                                  ) : (
                                    <ChevronRight className="w-3 h-3" />
                                  )}
                                  {category.hierarchy.typeLabel}
                                </span>

                                {category.ui.activeButIncomplete && (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-800">
                                    Active cần tối ưu
                                  </span>
                                )}
                              </div>

                              <div className="text-xs text-gray-500 font-mono mb-1">
                                /{category.slug || "no-slug"}
                              </div>

                              <div className="text-sm text-gray-600 dark:text-gray-300 line-clamp-1">
                                {category.description?.trim() ? (
                                  category.description
                                ) : (
                                  <span className="italic text-gray-400">
                                    Chưa có mô tả danh mục
                                  </span>
                                )}
                              </div>

                              {!category.hierarchy.isRoot &&
                                category.hierarchy.parentName && (
                                  <div className="mt-1 text-xs text-gray-500 flex items-center gap-1.5">
                                    <ChevronRight className="w-3.5 h-3.5" />
                                    Parent: {category.hierarchy.parentName}
                                  </div>
                                )}
                            </div>
                          </div>
                        </td>

                        <td className="px-4 py-4 min-w-[220px]">
                          <div className="space-y-2">
                            <div className="flex flex-wrap items-center gap-2">
                              <span
                                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
                                  category.hierarchy.isRoot
                                    ? "bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800"
                                    : "bg-indigo-50 text-indigo-700 border border-indigo-200 dark:bg-indigo-900/20 dark:text-indigo-300 dark:border-indigo-800"
                                }`}
                              >
                                {category.hierarchy.isRoot ? (
                                  <FolderOpen className="w-3.5 h-3.5" />
                                ) : (
                                  <CornerDownRight className="w-3.5 h-3.5" />
                                )}
                                {category.hierarchy.typeLabel}
                              </span>
                            </div>

                            <div className="text-sm text-gray-600 dark:text-gray-300">
                              <div>
                                Parent:{" "}
                                <span className="font-medium">
                                  {category.hierarchy.parentName || "—"}
                                </span>
                              </div>
                              <div className="mt-1">
                                Child count:{" "}
                                <span className="font-medium">
                                  {category.hierarchy.childCount}
                                </span>
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="px-4 py-4 min-w-[150px]">
                          <div className="space-y-2">
                            {renderStatusBadge(category.status)}
                          </div>
                        </td>

                        <td className="px-4 py-4 min-w-[240px]">
                          <div className="space-y-2">
                            <div className="flex items-center justify-between gap-3">
                              <span
                                className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${category.ui.tone}`}
                              >
                                {category.ui.label}
                              </span>
                              <span className="text-xs font-bold text-gray-600 dark:text-gray-300">
                                {category.ui.percent}%
                              </span>
                            </div>

                            <div className="w-full h-2 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                              <div
                                className={`h-full rounded-full ${category.ui.barColor}`}
                                style={{ width: `${category.ui.percent}%` }}
                              />
                            </div>

                            {renderHealthDots(category)}

                            <div className="flex flex-wrap gap-1">
                              {!category.ui.hasThumbnail && (
                                <span className="text-[11px] px-2 py-0.5 rounded-full bg-orange-50 text-orange-700 border border-orange-200 dark:bg-orange-900/20 dark:text-orange-300 dark:border-orange-800">
                                  Thiếu ảnh
                                </span>
                              )}
                              {!category.ui.hasSeo && (
                                <span className="text-[11px] px-2 py-0.5 rounded-full bg-violet-50 text-violet-700 border border-violet-200 dark:bg-violet-900/20 dark:text-violet-300 dark:border-violet-800">
                                  Thiếu SEO
                                </span>
                              )}
                              {!category.ui.hasSlug && (
                                <span className="text-[11px] px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-900/20 dark:text-rose-300 dark:border-rose-800">
                                  Thiếu slug
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        <td className="px-4 py-4 min-w-[210px]">
                          <div className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                            <div className="flex items-center gap-2">
                              <Hash className="w-4 h-4 text-gray-400" />
                              <span>Position: {category.position ?? "—"}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Link2 className="w-4 h-4 text-gray-400" />
                              <span>
                                Canonical:{" "}
                                {category.canonical_url?.trim()
                                  ? "Có"
                                  : "Chưa có"}
                              </span>
                            </div>
                            <div className="text-xs text-gray-500 pt-1">
                              Updated:{" "}
                              {formatShortDate(
                                category.updated_at || category.updatedAt,
                              )}
                            </div>
                            <div className="text-xs text-gray-500">
                              Created:{" "}
                              {formatShortDate(
                                category.created_at || category.createdAt,
                              )}
                            </div>
                          </div>
                        </td>

                        <td className="px-4 py-4 min-w-[220px]">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => openCreateModal(category.id)}
                              className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 dark:text-gray-300 dark:hover:bg-indigo-900/20 transition"
                              title="Tạo child category"
                            >
                              <CopyPlus className="w-4 h-4" />
                            </button>

                            <button
                              type="button"
                              onClick={() => openEditModal(category)}
                              className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 hover:text-blue-600 hover:bg-blue-50 dark:text-gray-300 dark:hover:bg-blue-900/20 transition"
                              title="Sửa danh mục"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>

                            <button
                              type="button"
                              onClick={() => handleToggleStatus(category)}
                              disabled={statusUpdatingId === category.id}
                              className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 hover:text-amber-600 hover:bg-amber-50 dark:text-gray-300 dark:hover:bg-amber-900/20 transition disabled:opacity-50"
                              title="Đổi trạng thái"
                            >
                              {statusUpdatingId === category.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Power className="w-4 h-4" />
                              )}
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDelete(category)}
                              disabled={deletingId === category.id}
                              className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 hover:text-rose-600 hover:bg-rose-50 dark:text-gray-300 dark:hover:bg-rose-900/20 transition disabled:opacity-50"
                              title="Xóa mềm"
                            >
                              {deletingId === category.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Trash2 className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-5">
              {displayedCategories.map((category) => (
                <div
                  key={category.id}
                  className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-sm overflow-hidden flex flex-col"
                >
                  <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={selectedCategoryIds.includes(category.id)}
                      onChange={() => toggleSelectOne(category.id)}
                      className="mt-1 rounded border-gray-300"
                    />

                    {renderThumbnail(category)}

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <button
                            type="button"
                            onClick={() => openEditModal(category)}
                            className="text-left font-bold text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 line-clamp-2"
                          >
                            {category.title}
                          </button>
                          <div className="text-xs text-gray-500 font-mono mt-1 truncate">
                            /{category.slug || "no-slug"}
                          </div>
                        </div>
                        {renderStatusBadge(category.status)}
                      </div>

                      <div className="flex flex-wrap gap-1.5 mt-2">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            category.hierarchy.isRoot
                              ? "bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800"
                              : "bg-indigo-50 text-indigo-700 border border-indigo-200 dark:bg-indigo-900/20 dark:text-indigo-300 dark:border-indigo-800"
                          }`}
                        >
                          {category.hierarchy.typeLabel}
                        </span>
                        {!category.ui.hasSeo && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-violet-50 text-violet-700 border border-violet-200 dark:bg-violet-900/20 dark:text-violet-300 dark:border-violet-800">
                            No SEO
                          </span>
                        )}
                        {!category.ui.hasThumbnail && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-orange-50 text-orange-700 border border-orange-200 dark:bg-orange-900/20 dark:text-orange-300 dark:border-orange-800">
                            No Image
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="p-4 space-y-4">
                    <div className="text-sm text-gray-600 dark:text-gray-300">
                      {category.description?.trim() ? (
                        <p className="line-clamp-2">{category.description}</p>
                      ) : (
                        <p className="italic text-gray-400">
                          Chưa có mô tả danh mục
                        </p>
                      )}
                    </div>

                    <div className="rounded-xl border border-gray-100 dark:border-gray-700 bg-gray-50/80 dark:bg-gray-900/40 p-3 space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${category.ui.tone}`}
                        >
                          {category.ui.label}
                        </span>
                        <span className="text-xs font-bold text-gray-600 dark:text-gray-300">
                          {category.ui.percent}%
                        </span>
                      </div>

                      <div className="w-full h-2 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${category.ui.barColor}`}
                          style={{ width: `${category.ui.percent}%` }}
                        />
                      </div>

                      {renderHealthDots(category)}
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-sm text-gray-600 dark:text-gray-300">
                      <div className="flex items-center gap-2">
                        <FolderTree className="w-4 h-4 text-gray-400" />
                        <span>{category.hierarchy.typeLabel}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Hash className="w-4 h-4 text-gray-400" />
                        <span>Pos: {category.position ?? "—"}</span>
                      </div>
                      <div className="col-span-2 text-xs text-gray-500">
                        Parent: {category.hierarchy.parentName || "—"}
                      </div>
                      <div className="col-span-2 text-xs text-gray-500">
                        Updated:{" "}
                        {formatShortDate(
                          category.updated_at || category.updatedAt,
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => openCreateModal(category.id)}
                        className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 dark:text-gray-300 dark:hover:bg-indigo-900/20 transition"
                        title="Tạo child category"
                      >
                        <CopyPlus className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => openEditModal(category)}
                        className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 hover:text-blue-600 hover:bg-blue-50 dark:text-gray-300 dark:hover:bg-blue-900/20 transition"
                        title="Sửa danh mục"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleToggleStatus(category)}
                        disabled={statusUpdatingId === category.id}
                        className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 hover:text-amber-600 hover:bg-amber-50 dark:text-gray-300 dark:hover:bg-amber-900/20 transition disabled:opacity-50"
                        title="Đổi trạng thái"
                      >
                        {statusUpdatingId === category.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Power className="w-4 h-4" />
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDelete(category)}
                        disabled={deletingId === category.id}
                        className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 hover:text-rose-600 hover:bg-rose-50 dark:text-gray-300 dark:hover:bg-rose-900/20 transition disabled:opacity-50"
                        title="Xóa mềm"
                      >
                        {deletingId === category.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </button>
                    </div>
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

      <PostCategoryCreateModal
        open={isCreateOpen}
        onClose={closeModals}
        onSuccess={refreshAllData}
        parentOptions={parentOptions}
        initialParentId={createParentId}
      />

      <PostCategoryEditModal
        open={isEditOpen}
        categoryId={editingCategoryId}
        onClose={closeModals}
        onSuccess={refreshAllData}
        parentOptions={parentOptions}
      />
    </div>
  );
};

export default PostCategoriesPage;
