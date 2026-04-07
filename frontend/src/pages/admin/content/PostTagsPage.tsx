import React, { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import Card from "../../../components/admin/layouts/Card";
import Pagination from "../../../components/admin/common/Pagination";
import {
  Search,
  Plus,
  RefreshCw,
  Tags,
  CheckCircle2,
  PowerOff,
  ShieldAlert,
  Loader2,
  AlertTriangle,
  X,
  Pencil,
  Trash2,
  Power,
  Hash,
  Clock3,
  Sparkles,
  LayoutGrid,
  List,
  Link2,
  FileText,
  CopyCheck,
} from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { http } from "../../../services/http";
import { useAdminToast } from "../../../context/AdminToastContext";

// =============================
// TYPES
// =============================
type TagStatus = "active" | "inactive";
type SortValue =
  | "newest"
  | "updated_desc"
  | "name_asc"
  | "name_desc"
  | "position_asc";
type QuickFilterType =
  | "all"
  | "missing-description"
  | "slug-issue"
  | "position-issue";
type BulkActionValue = "" | "active" | "inactive" | "delete";

interface PostTag {
  id: number;
  name: string;
  slug?: string | null;
  description?: string | null;
  status: TagStatus;
  position?: number | null;
  created_at?: string | null;
  updated_at?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

interface PostTagListSummary {
  totalItems: number;
  activeCount: number;
  inactiveCount: number;

  missingDescriptionCount: number;
  missingSlugCount: number;
  zeroPositionCount: number;
  duplicateNameCount: number;

  usedCount: number;
  unusedCount: number;
}

interface TagFormData {
  name: string;
  slug: string;
  description: string;
  status: TagStatus;
  position: string;
}

interface TagFormErrors {
  name?: string;
  slug?: string;
  status?: string;
  position?: string;
}

type ApiList<T> = {
  success: boolean;
  data: T[];
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
    offset?: number;
    summary?: Partial<PostTagListSummary>;
  };
};

type ApiResponse<T> = {
  success: boolean;
  data: T;
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
    offset?: number;
    summary?: Partial<PostTagListSummary>;
  };
};

type PostTagCanDeleteResponse = {
  id: number;
  canDelete: boolean;
  usageCount: number;
};

type EnrichedTag = PostTag & {
  ui: ReturnType<typeof getTagHealth>;
};

// =============================
// HELPERS
// =============================
const statusMap: Record<
  TagStatus,
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

function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function hasDescription(tag: PostTag): boolean {
  return Boolean(tag.description?.trim());
}

function hasValidSlug(tag: PostTag): boolean {
  const slug = tag.slug?.trim();
  if (!slug) return false;
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug);
}

function normalizeTagListRow(raw: any): PostTag {
  const safeStatus = String(raw?.status || "active").toLowerCase();
  const normalizedStatus: TagStatus = (
    ["active", "inactive"].includes(safeStatus) ? safeStatus : "active"
  ) as TagStatus;

  return {
    id: Number(raw?.id),
    name: String(raw?.name || "Untitled tag"),
    slug: raw?.slug ?? null,
    description: raw?.description ?? null,
    status: normalizedStatus,
    position:
      raw?.position != null && raw?.position !== ""
        ? Number(raw.position)
        : null,
    created_at: raw?.created_at ?? raw?.createdAt ?? null,
    updated_at: raw?.updated_at ?? raw?.updatedAt ?? null,
    createdAt: raw?.createdAt ?? raw?.created_at ?? null,
    updatedAt: raw?.updatedAt ?? raw?.updated_at ?? null,
  };
}

function normalizeTagEditDetail(raw: any): PostTag {
  const payload = raw?.data ?? raw ?? {};
  const safeStatus = String(payload?.status || "active").toLowerCase();
  const normalizedStatus: TagStatus = (
    ["active", "inactive"].includes(safeStatus) ? safeStatus : "active"
  ) as TagStatus;

  return {
    id: Number(payload?.id),
    name: String(payload?.name || "Untitled tag"),
    slug: payload?.slug ?? null,
    description: payload?.description ?? null,
    status: normalizedStatus,
    position:
      payload?.position != null && payload?.position !== ""
        ? Number(payload.position)
        : null,
    created_at: payload?.created_at ?? payload?.createdAt ?? null,
    updated_at: payload?.updated_at ?? payload?.updatedAt ?? null,
    createdAt: payload?.createdAt ?? payload?.created_at ?? null,
    updatedAt: payload?.updatedAt ?? payload?.updated_at ?? null,
  };
}

function getTagHealth(tag: PostTag) {
  const hasSlug = hasValidSlug(tag);
  const hasDesc = hasDescription(tag);
  const hasPosition =
    tag.position != null &&
    tag.position !== undefined &&
    Number.isFinite(Number(tag.position));

  const checks = [hasSlug, hasDesc, hasPosition];
  const passed = checks.filter(Boolean).length;
  const percent = Math.round((passed / checks.length) * 100);

  const missingSignals: string[] = [];
  if (!hasSlug) missingSignals.push("Slug chưa chuẩn");
  if (!hasDesc) missingSignals.push("Thiếu mô tả");
  if (!hasPosition) missingSignals.push("Position chưa chuẩn");

  let label = "Hoàn chỉnh";
  let tone =
    "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-800";
  let barColor = "bg-emerald-500";

  if (percent < 40) {
    label = "Chưa chuẩn";
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

  return {
    percent,
    label,
    tone,
    barColor,
    hasSlug,
    hasDescription: hasDesc,
    hasPosition,
    missingSignals,
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

function mapTagSort(sort: SortValue): {
  sortBy: "id" | "name" | "position" | "createdAt" | "updatedAt";
  order: "ASC" | "DESC";
} {
  switch (sort) {
    case "updated_desc":
      return { sortBy: "updatedAt", order: "DESC" };
    case "name_asc":
      return { sortBy: "name", order: "ASC" };
    case "name_desc":
      return { sortBy: "name", order: "DESC" };
    case "position_asc":
      return { sortBy: "position", order: "ASC" };
    case "newest":
    default:
      return { sortBy: "id", order: "DESC" };
  }
}

const emptyFormData: TagFormData = {
  name: "",
  slug: "",
  description: "",
  status: "active",
  position: "",
};

// =============================
// MAIN PAGE
// =============================
const PostTagsPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { showSuccessToast, showErrorToast } = useAdminToast();

  // search params
  const currentPage = parseNumberParam(searchParams.get("page"), 1);
  const statusFilter = searchParams.get("status") || "all";
  const sortOrder = (searchParams.get("sort") || "newest") as SortValue;

  // states
  const [tags, setTags] = useState<PostTag[]>([]);
  const [loading, setLoading] = useState(false);
  const [bootstrapLoading, setBootstrapLoading] = useState(true);
  const [error, setError] = useState("");
  const [summary, setSummary] = useState<PostTagListSummary>({
    totalItems: 0,
    activeCount: 0,
    inactiveCount: 0,
    missingDescriptionCount: 0,
    missingSlugCount: 0,
    zeroPositionCount: 0,
    duplicateNameCount: 0,
    usedCount: 0,
    unusedCount: 0,
  });
  const [totalPages, setTotalPages] = useState(1);
  const [, setTotalCount] = useState(0);

  const [searchTerm, setSearchTerm] = useState(
    searchParams.get("keyword") || "",
  );
  const [quickFilter, setQuickFilter] = useState<QuickFilterType>("all");
  const [viewMode, setViewMode] = useState<"table" | "board">("table");
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>([]);
  const [bulkAction, setBulkAction] = useState<BulkActionValue>("");
  const [submitting, setSubmitting] = useState(false);
  const [statusUpdatingId, setStatusUpdatingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // modal/editor states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [editingTag, setEditingTag] = useState<PostTag | null>(null);
  const [formData, setFormData] = useState<TagFormData>(emptyFormData);
  const [formErrors, setFormErrors] = useState<TagFormErrors>({});
  const [isSlugTouched, setIsSlugTouched] = useState(false);

  // fetchers
  const fetchSummary = useCallback(async () => {
    try {
      setBootstrapLoading(true);

      const res = await http<ApiResponse<Partial<PostTagListSummary>>>(
        "GET",
        "/api/v1/admin/post-tags/summary",
      );

      if (res?.success && res.data) {
        setSummary({
          totalItems: Number(res.data.totalItems ?? 0),
          activeCount: Number(res.data.activeCount ?? 0),
          inactiveCount: Number(res.data.inactiveCount ?? 0),
          missingDescriptionCount: Number(
            res.data.missingDescriptionCount ?? 0,
          ),
          missingSlugCount: Number(res.data.missingSlugCount ?? 0),
          zeroPositionCount: Number(res.data.zeroPositionCount ?? 0),
          duplicateNameCount: Number(res.data.duplicateNameCount ?? 0),
          usedCount: Number(res.data.usedCount ?? 0),
          unusedCount: Number(res.data.unusedCount ?? 0),
        });
      }
    } catch (err) {
      console.error("Không thể tải summary post tags", err);
    } finally {
      setBootstrapLoading(false);
    }
  }, []);

  const fetchTags = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const limit = 12;
      const mappedSort = mapTagSort(sortOrder);

      const queryUrl = buildQueryUrl("/api/v1/admin/post-tags", {
        limit,
        page: currentPage,
        keyword: searchParams.get("keyword")?.trim() || undefined,
        status: statusFilter !== "all" ? statusFilter : undefined,
        sortBy: mappedSort.sortBy,
        order: mappedSort.order,
      });

      const res = await http<ApiList<any>>("GET", queryUrl);

      if (res?.success && Array.isArray(res.data)) {
        const normalized = res.data.map(normalizeTagListRow);
        setTags(normalized);

        const total = Number(res.meta?.total ?? normalized.length ?? 0);
        setTotalCount(total);
        setTotalPages(Math.max(1, Math.ceil(total / limit)));

        if (res.meta?.summary) {
          setSummary((prev) => ({
            ...prev,
            totalItems: Number(
              res.meta?.summary?.totalItems ??
                res.meta?.total ??
                prev.totalItems,
            ),
            activeCount: Number(
              res.meta?.summary?.activeCount ?? prev.activeCount,
            ),
            inactiveCount: Number(
              res.meta?.summary?.inactiveCount ?? prev.inactiveCount,
            ),
          }));
        }
      } else {
        setError("Không thể tải danh sách tags bài viết.");
      }
    } catch (err: any) {
      setError(err?.message || "Lỗi tải dữ liệu tags bài viết.");
    } finally {
      setLoading(false);
    }
  }, [currentPage, statusFilter, sortOrder, searchParams]);

  const fetchTagEditDetail = useCallback(async (id: number) => {
    const res = await http<any>("GET", `/api/v1/admin/post-tags/edit/${id}`);

    if (!res?.success || !res.data) {
      throw new Error("Không thể tải dữ liệu chỉnh sửa tag.");
    }

    return normalizeTagEditDetail(res);
  }, []);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  useEffect(() => {
    fetchTags();
  }, [fetchTags]);

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
    setSelectedTagIds([]);
  }, [currentPage, statusFilter, sortOrder, quickFilter]);

  // derived
  const enrichedTags = useMemo<EnrichedTag[]>(() => {
    return tags.map((tag) => ({
      ...tag,
      ui: getTagHealth(tag),
    }));
  }, [tags]);

  const displayedTags = useMemo(() => {
    let rows = enrichedTags;

    if (quickFilter === "missing-description") {
      rows = rows.filter((item) => !item.ui.hasDescription);
    }

    if (quickFilter === "slug-issue") {
      rows = rows.filter((item) => !item.ui.hasSlug);
    }

    if (quickFilter === "position-issue") {
      rows = rows.filter(
        (item) => !item.ui.hasPosition || Number(item.position) === 0,
      );
    }

    return rows;
  }, [enrichedTags, quickFilter]);

  const effectiveSummary = useMemo<PostTagListSummary>(
    () => summary,
    [summary],
  );

  const allCurrentSelected =
    displayedTags.length > 0 &&
    displayedTags.every((item) => selectedTagIds.includes(item.id));

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

  const handleRefresh = async () => {
    await Promise.all([fetchTags(), fetchSummary()]);
  };

  const handleResetFilters = () => {
    setQuickFilter("all");
    setSelectedTagIds([]);
    setBulkAction("");
    setSearchParams(new URLSearchParams());
    setSearchTerm("");
  };

  const toggleSelectOne = (id: number) => {
    setSelectedTagIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  const toggleSelectAllCurrentPage = () => {
    if (allCurrentSelected) {
      setSelectedTagIds((prev) =>
        prev.filter((id) => !displayedTags.some((item) => item.id === id)),
      );
      return;
    }

    setSelectedTagIds((prev) => {
      const next = new Set(prev);
      displayedTags.forEach((item) => next.add(item.id));
      return Array.from(next);
    });
  };

  const openCreateModal = () => {
    setFormErrors({});
    setEditingTag(null);
    setFormData(emptyFormData);
    setIsSlugTouched(false);
    setIsCreateOpen(true);
  };

  const openEditModal = async (tag: PostTag) => {
    try {
      setFormErrors({});
      setEditLoading(true);
      setIsEditOpen(true);

      const detail = await fetchTagEditDetail(tag.id);

      setEditingTag(detail);
      setFormData({
        name: detail.name || "",
        slug: detail.slug || "",
        description: detail.description || "",
        status: detail.status || "active",
        position:
          detail.position != null && detail.position !== undefined
            ? String(detail.position)
            : "",
      });
      setIsSlugTouched(Boolean(detail.slug?.trim()));
    } catch (err: any) {
      setIsEditOpen(false);
      setEditingTag(null);
      setFormData(emptyFormData);
      setIsSlugTouched(false);
      showErrorToast(err?.message || "Không thể tải dữ liệu chỉnh sửa tag.");
    } finally {
      setEditLoading(false);
    }
  };

  const closeModals = () => {
    setIsCreateOpen(false);
    setIsEditOpen(false);
    setEditLoading(false);
    setEditingTag(null);
    setFormErrors({});
    setFormData(emptyFormData);
    setIsSlugTouched(false);
  };

  const validateForm = (): boolean => {
    const nextErrors: TagFormErrors = {};

    if (!formData.name.trim()) {
      nextErrors.name = "Tên tag là bắt buộc.";
    }

    if (!["active", "inactive"].includes(formData.status)) {
      nextErrors.status = "Trạng thái không hợp lệ.";
    }

    if (formData.position.trim()) {
      const value = Number(formData.position.trim());
      if (!Number.isFinite(value) || value < 0) {
        nextErrors.position = "Position phải là số không âm hợp lệ.";
      }
    }

    if (
      formData.slug.trim() &&
      !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(formData.slug.trim())
    ) {
      nextErrors.slug = "Slug chỉ nên chứa chữ thường, số và dấu gạch nối.";
    }

    setFormErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleFormChange = <K extends keyof TagFormData>(
    key: K,
    value: TagFormData[K],
  ) => {
    setFormData((prev) => {
      const next = {
        ...prev,
        [key]: value,
      };

      if (key === "name" && !isSlugTouched) {
        next.slug = slugify(String(value));
      }

      return next;
    });

    setFormErrors((prev) => ({
      ...prev,
      [key]: undefined,
      ...(key === "name" && !isSlugTouched ? { slug: undefined } : {}),
    }));
  };

  const buildPayload = () => {
    return {
      name: formData.name.trim(),
      slug: formData.slug.trim() || null,
      description: formData.description.trim() || null,
      status: formData.status,
      position:
        formData.position.trim() !== ""
          ? Number(formData.position.trim())
          : null,
    };
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setSubmitting(true);
      await http("POST", "/api/v1/admin/post-tags/create", buildPayload());
      showSuccessToast({ message: "Tạo tag mới thành công!" });
      closeModals();
      await Promise.all([fetchTags(), fetchSummary()]);
    } catch (err: any) {
      showErrorToast(err?.message || "Không thể tạo tag mới.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTag) return;
    if (!validateForm()) return;

    try {
      setSubmitting(true);
      await http(
        "PATCH",
        `/api/v1/admin/post-tags/edit/${editingTag.id}`,
        buildPayload(),
      );
      showSuccessToast({ message: "Lưu thay đổi tag thành công!" });
      closeModals();
      await Promise.all([fetchTags(), fetchSummary()]);
    } catch (err: any) {
      showErrorToast(err?.message || "Không thể cập nhật tag.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (tag: PostTag) => {
    const nextStatus: TagStatus =
      tag.status === "active" ? "inactive" : "active";

    try {
      setStatusUpdatingId(tag.id);
      await http("PATCH", `/api/v1/admin/post-tags/${tag.id}/status`, {
        status: nextStatus,
      });
      showSuccessToast({ message: "Cập nhật trạng thái tag thành công!" });
      await Promise.all([fetchTags(), fetchSummary()]);
    } catch (err: any) {
      showErrorToast(err?.message || "Không thể cập nhật trạng thái tag.");
    } finally {
      setStatusUpdatingId(null);
    }
  };

  const handleDelete = async (tag: PostTag) => {
    try {
      const check = await http<ApiResponse<PostTagCanDeleteResponse>>(
        "GET",
        `/api/v1/admin/post-tags/${tag.id}/can-delete`,
      );

      if (!check?.success || !check.data) {
        throw new Error("Không thể kiểm tra điều kiện xóa tag.");
      }

      if (!check.data.canDelete) {
        showErrorToast(
          `Không thể xóa tag "${tag.name}" vì đang được dùng trong ${check.data.usageCount} bài viết.`,
        );
        return;
      }

      const confirmed = window.confirm(
        `Bạn có chắc muốn xóa mềm tag "${tag.name}" không?`,
      );
      if (!confirmed) return;

      setDeletingId(tag.id);
      await http("DELETE", `/api/v1/admin/post-tags/delete/${tag.id}`);
      showSuccessToast({ message: "Đã xóa tag thành công!" });
      await Promise.all([fetchTags(), fetchSummary()]);
    } catch (err: any) {
      showErrorToast(err?.message || "Không thể xóa tag.");
    } finally {
      setDeletingId(null);
    }
  };

  const handleBulkExecute = async () => {
    if (!bulkAction || selectedTagIds.length === 0) return;

    const selectedCount = selectedTagIds.length;

    if (bulkAction === "delete") {
      const confirmed = window.confirm(
        `Bạn có chắc muốn xóa mềm ${selectedCount} tags đã chọn không?`,
      );
      if (!confirmed) return;

      try {
        await http("PATCH", "/api/v1/admin/post-tags/bulk-edit", {
          ids: selectedTagIds,
          patch: { deleted: true },
        });

        showSuccessToast({
          message: `Đã xóa ${selectedCount} tags thành công!`,
        });
        setSelectedTagIds([]);
        setBulkAction("");
        await Promise.all([fetchTags(), fetchSummary()]);
      } catch (err: any) {
        showErrorToast(err?.message || "Không thể xóa hàng loạt tags.");
      }
      return;
    }

    const nextStatus = bulkAction as TagStatus;
    const confirmed = window.confirm(
      `Bạn có chắc muốn chuyển ${selectedCount} tags sang trạng thái "${statusMap[nextStatus].label}" không?`,
    );
    if (!confirmed) return;

    try {
      await http("PATCH", "/api/v1/admin/post-tags/bulk-edit", {
        ids: selectedTagIds,
        patch: { status: nextStatus },
      });

      showSuccessToast({
        message: `Đã cập nhật ${selectedCount} tags thành công!`,
      });
      setSelectedTagIds([]);
      setBulkAction("");
      await Promise.all([fetchTags(), fetchSummary()]);
    } catch (err: any) {
      showErrorToast(err?.message || "Không thể cập nhật hàng loạt tags.");
    }
  };

  // render helpers
  const renderStatusBadge = (status: TagStatus) => (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider ${statusMap[status].badge}`}
    >
      {statusMap[status].label}
    </span>
  );

  const renderHealthDots = (tag: EnrichedTag) => {
    const items = [
      { label: "Slug", ok: tag.ui.hasSlug },
      { label: "Description", ok: tag.ui.hasDescription },
      { label: "Position", ok: tag.ui.hasPosition },
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

  const renderTagForm = () => {
    return (
      <form
        onSubmit={isEditOpen ? handleEditSubmit : handleCreateSubmit}
        className="flex flex-col h-full"
      >
        <div className="p-5 overflow-y-auto max-h-[80vh] space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2">
                Tên tag <span className="text-red-500">*</span>
              </label>
              <input
                value={formData.name}
                onChange={(e) => handleFormChange("name", e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-white"
                placeholder="Ví dụ: self-help, marketing, review-sach..."
              />
              {formErrors.name && (
                <p className="mt-1.5 text-xs text-red-600">{formErrors.name}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2">
                Slug
              </label>
              <input
                value={formData.slug}
                onChange={(e) => {
                  setIsSlugTouched(true);
                  handleFormChange("slug", e.target.value);
                }}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-white"
                placeholder="slug-tag"
              />
              <p className="mt-1.5 text-xs text-gray-500">
                Slug dùng trong URL/taxonomy của tag.
              </p>
              {formErrors.slug && (
                <p className="mt-1.5 text-xs text-red-600">{formErrors.slug}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2">
                Trạng thái
              </label>
              <select
                value={formData.status}
                onChange={(e) =>
                  handleFormChange("status", e.target.value as TagStatus)
                }
                className="w-full px-3 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-white"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
              {formErrors.status && (
                <p className="mt-1.5 text-xs text-red-600">
                  {formErrors.status}
                </p>
              )}
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2">
                Mô tả
              </label>
              <textarea
                rows={3}
                value={formData.description}
                onChange={(e) =>
                  handleFormChange("description", e.target.value)
                }
                className="w-full px-3 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-white resize-none"
                placeholder="Mô tả ngắn cho tag..."
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2">
                Position
              </label>
              <input
                type="number"
                value={formData.position}
                onChange={(e) => handleFormChange("position", e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-white"
                placeholder="0"
              />
              {formErrors.position && (
                <p className="mt-1.5 text-xs text-red-600">
                  {formErrors.position}
                </p>
              )}
            </div>
          </div>

          {isEditOpen && editingTag && (
            <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 p-4">
              <div className="flex items-center gap-2 mb-3">
                <Clock3 className="w-4 h-4 text-gray-500" />
                <h4 className="text-sm font-bold text-gray-900 dark:text-white">
                  Metadata
                </h4>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-gray-600 dark:text-gray-300">
                <div>
                  <span className="font-medium">Created:</span>{" "}
                  {formatDateTime(
                    editingTag.created_at || editingTag.createdAt,
                  )}
                </div>
                <div>
                  <span className="font-medium">Updated:</span>{" "}
                  {formatDateTime(
                    editingTag.updated_at || editingTag.updatedAt,
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="px-5 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-end gap-3 bg-white dark:bg-gray-800">
          <button
            type="button"
            onClick={closeModals}
            className="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Hủy
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="px-5 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition disabled:opacity-50"
          >
            {submitting ? (
              <span className="inline-flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Đang lưu...
              </span>
            ) : isEditOpen ? (
              "Lưu thay đổi"
            ) : (
              "Tạo tag"
            )}
          </button>
        </div>
      </form>
    );
  };

  return (
    <div className="w-full pb-10 space-y-6">
      {/* Header */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="min-w-0">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-11 h-11 rounded-2xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center border border-blue-100 dark:border-blue-800">
              <Tags className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Content Tags
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Quản lý từ khóa nội dung, chuẩn hóa taxonomy và hỗ trợ phân loại
                bài viết linh hoạt.
              </p>
            </div>
          </div>

          <div className="inline-flex items-center gap-2 mt-1 px-3 py-1.5 rounded-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-xs text-gray-600 dark:text-gray-300">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            Tag workspace ưu tiên tốc độ thao tác, taxonomy hygiene và tính nhất
            quán.
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
          <button
            onClick={handleRefresh}
            className="p-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
            title="Làm mới dữ liệu"
          >
            <RefreshCw className="w-5 h-5" />
          </button>

          <button
            onClick={() => navigate("/admin/content/posts")}
            className="px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition"
          >
            Đi tới bài viết
          </button>

          <button
            onClick={() => navigate("/admin/content/categories")}
            className="px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition"
          >
            Quản lý danh mục
          </button>

          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition shadow-sm ml-auto xl:ml-0"
          >
            <Plus className="w-4 h-4" />
            Tạo tag mới
          </button>
        </div>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        {[
          {
            label: "Tổng tags",
            value: effectiveSummary.totalItems,
            icon: Tags,
            color: "text-blue-600",
            bg: "bg-blue-50",
            onClick: () => {
              setQuickFilter("all");
              updateParams({
                status: null,
              });
            },
          },
          {
            label: "Active",
            value: effectiveSummary.activeCount,
            icon: CheckCircle2,
            color: "text-emerald-600",
            bg: "bg-emerald-50",
            onClick: () => updateParams({ status: "active" }),
          },
          {
            label: "Inactive",
            value: effectiveSummary.inactiveCount,
            icon: PowerOff,
            color: "text-gray-600",
            bg: "bg-gray-100",
            onClick: () => updateParams({ status: "inactive" }),
          },
          {
            label: "Thiếu mô tả",
            value: effectiveSummary.missingDescriptionCount,
            icon: FileText,
            color: "text-amber-600",
            bg: "bg-amber-50",
            onClick: () => setQuickFilter("missing-description"),
          },
          {
            label: "Chưa dùng",
            value: effectiveSummary.unusedCount,
            icon: CopyCheck,
            color: "text-violet-600",
            bg: "bg-violet-50",
            onClick: () => {
              setQuickFilter("all");
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
              {item.value}
            </div>
          </button>
        ))}
      </div>

      {/* Action center */}
      {!bootstrapLoading &&
        (summary.inactiveCount > 0 ||
          summary.missingDescriptionCount > 0 ||
          summary.missingSlugCount > 0 ||
          summary.duplicateNameCount > 0 ||
          summary.zeroPositionCount > 0) && (
          <Card className="border-amber-200 dark:border-amber-900/40 !p-0 overflow-hidden">
            <div className="p-4 bg-amber-50/70 dark:bg-amber-900/10 border-b border-amber-100 dark:border-amber-900/40 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div>
                <h3 className="font-bold text-amber-800 dark:text-amber-300 flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5" />
                  Trung tâm xử lý nhanh tag taxonomy
                </h3>
                <p className="text-sm text-amber-700/90 dark:text-amber-200/80 mt-1">
                  Các chỉ số tổng quan của toàn bộ hệ thống tags; khi bấm lọc,
                  danh sách bên dưới sẽ ưu tiên rà soát trên trang hiện tại.
                </p>
              </div>
              <span className="text-xs font-semibold text-amber-700 dark:text-amber-300 px-2.5 py-1 rounded-full bg-white/80 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                Tag Hygiene Workspace
              </span>
            </div>

            <div className="p-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {[
                {
                  title: `${summary.inactiveCount} tags đang tắt`,
                  note: "Kiểm tra lại tag tạm ngưng hoặc không còn dùng",
                  visible: summary.inactiveCount > 0,
                  icon: PowerOff,
                  tone: "text-gray-600 bg-gray-100 border-gray-200",
                  onClick: () => updateParams({ status: "inactive" }),
                },
                {
                  title: `${summary.missingDescriptionCount} tags chưa có mô tả`,
                  note: "Bổ sung mô tả để taxonomy rõ nghĩa hơn",
                  visible: summary.missingDescriptionCount > 0,
                  icon: FileText,
                  tone: "text-amber-600 bg-amber-50 border-amber-200",
                  onClick: () => {
                    setQuickFilter("missing-description");
                  },
                },
                {
                  title: `${summary.missingSlugCount} tags có slug chưa chuẩn`,
                  note: "Slug rỗng hoặc chưa đúng format",
                  visible: summary.missingSlugCount > 0,
                  icon: ShieldAlert,
                  tone: "text-violet-600 bg-violet-50 border-violet-200",
                  onClick: () => {
                    setQuickFilter("slug-issue");
                  },
                },
                {
                  title: `${summary.zeroPositionCount} tags cần rà soát position`,
                  note: "Vị trí hiển thị có thể chưa tối ưu",
                  visible: summary.zeroPositionCount > 0,
                  icon: Hash,
                  tone: "text-orange-600 bg-orange-50 border-orange-200",
                  onClick: () => setQuickFilter("position-issue"),
                },
                {
                  title: `${summary.duplicateNameCount} nhóm tên tag đang bị trùng`,
                  note: "Nên gom hoặc chuẩn hóa lại để taxonomy sạch hơn",
                  visible: summary.duplicateNameCount > 0,
                  icon: CopyCheck,
                  tone: "text-rose-600 bg-rose-50 border-rose-200",
                  onClick: () => {
                    setQuickFilter("all");
                    setSearchTerm("");
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
              placeholder="Tìm theo tên tag, slug, mô tả..."
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
              <option value="name_asc">Tên A-Z</option>
              <option value="name_desc">Tên Z-A</option>
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
            { key: "active", label: "Active" },
            { key: "inactive", label: "Inactive" },
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
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() =>
                setQuickFilter((prev) =>
                  prev === "missing-description"
                    ? "all"
                    : "missing-description",
                )
              }
              className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition ${
                quickFilter === "missing-description"
                  ? "bg-gray-900 text-white dark:bg-white dark:text-gray-900 border-gray-900 dark:border-white"
                  : "bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-gray-300"
              }`}
            >
              Thiếu mô tả
            </button>

            <button
              type="button"
              onClick={() => {
                setQuickFilter((prev) =>
                  prev === "slug-issue" ? "all" : "slug-issue",
                );
              }}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition ${
                quickFilter === "slug-issue"
                  ? "bg-gray-900 text-white dark:bg-white dark:text-gray-900 border-gray-900 dark:border-white"
                  : "bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-gray-300"
              }`}
            >
              Slug lỗi / thiếu slug
            </button>

            <button
              type="button"
              onClick={() =>
                setQuickFilter((prev) =>
                  prev === "position-issue" ? "all" : "position-issue",
                )
              }
              className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition ${
                quickFilter === "position-issue"
                  ? "bg-gray-900 text-white dark:bg-white dark:text-gray-900 border-gray-900 dark:border-white"
                  : "bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-gray-300"
              }`}
            >
              Position chưa tối ưu
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
      {selectedTagIds.length > 0 && (
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 p-4 rounded-2xl border border-blue-200 dark:border-blue-900/40 bg-blue-50/70 dark:bg-blue-900/10">
          <div className="flex items-center gap-2 text-blue-800 dark:text-blue-300">
            <CheckCircle2 className="w-5 h-5" />
            <span className="font-semibold">
              Đã chọn {selectedTagIds.length} tags
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
                setSelectedTagIds([]);
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
            Đang đồng bộ hệ thống tags...
          </p>
        </div>
      ) : error ? (
        <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700">
          <AlertTriangle className="w-10 h-10 text-red-500 mx-auto mb-3" />
          <p className="text-red-600 font-medium">{error}</p>
          <button
            type="button"
            onClick={fetchTags}
            className="mt-4 px-4 py-2 rounded-lg bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 transition"
          >
            Thử tải lại
          </button>
        </div>
      ) : displayedTags.length === 0 ? (
        tags.length === 0 &&
        !searchParams.get("keyword") &&
        !searchParams.get("status") &&
        quickFilter === "all" ? (
          <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-2xl border border-dashed border-gray-300 dark:border-gray-600 flex flex-col items-center">
            <Tags className="w-12 h-12 text-gray-300 dark:text-gray-600 mb-4" />
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              Chưa có tag bài viết
            </h3>
            <p className="text-sm text-gray-500 mt-1 mb-5">
              Hãy tạo tag đầu tiên để hoàn thiện taxonomy nội dung.
            </p>
            <button
              onClick={openCreateModal}
              className="px-5 py-2.5 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition"
            >
              Tạo tag đầu tiên
            </button>
          </div>
        ) : (
          <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-2xl border border-dashed border-gray-300 dark:border-gray-600 flex flex-col items-center">
            <FileText className="w-12 h-12 text-gray-300 dark:text-gray-600 mb-4" />
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              Không tìm thấy tags phù hợp
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
              Hiển thị {displayedTags.length} tags ở trang hiện tại.
            </p>
            <p className="text-xs text-gray-400">
              Quick filter đang áp dụng trên dữ liệu của trang hiện tại; summary
              lấy từ toàn hệ thống.
            </p>
          </div>

          {viewMode === "table" ? (
            <Card className="!p-0 overflow-hidden border border-gray-200 dark:border-gray-700">
              <div className="overflow-x-auto">
                <table className="min-w-[1180px] w-full divide-y divide-gray-200 dark:divide-gray-700">
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
                        Tag identity
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                        Taxonomy quality
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
                    {displayedTags.map((tag) => (
                      <tr
                        key={tag.id}
                        className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors align-top"
                      >
                        <td className="px-4 py-4">
                          <input
                            type="checkbox"
                            checked={selectedTagIds.includes(tag.id)}
                            onChange={() => toggleSelectOne(tag.id)}
                            className="rounded border-gray-300"
                          />
                        </td>

                        <td className="px-4 py-4 min-w-[340px]">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2 mb-1">
                              <button
                                type="button"
                                onClick={() => openEditModal(tag)}
                                className="text-left font-bold text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 line-clamp-1"
                              >
                                {tag.name}
                              </button>

                              {!tag.ui.hasDescription && (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-800">
                                  Chưa có mô tả
                                </span>
                              )}

                              {!tag.ui.hasSlug && (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-violet-50 text-violet-700 border border-violet-200 dark:bg-violet-900/20 dark:text-violet-300 dark:border-violet-800">
                                  Slug issue
                                </span>
                              )}
                            </div>

                            <div className="text-xs text-gray-500 font-mono mb-1">
                              /{tag.slug || "no-slug"}
                            </div>

                            <div className="text-sm text-gray-600 dark:text-gray-300 line-clamp-1">
                              {tag.description?.trim() ? (
                                tag.description
                              ) : (
                                <span className="italic text-gray-400">
                                  Chưa có mô tả tag
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        <td className="px-4 py-4 min-w-[140px]">
                          {renderStatusBadge(tag.status)}
                        </td>

                        <td className="px-4 py-4 min-w-[240px]">
                          <div className="space-y-2">
                            <div className="flex items-center justify-between gap-3">
                              <span
                                className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${tag.ui.tone}`}
                              >
                                {tag.ui.label}
                              </span>
                              <span className="text-xs font-bold text-gray-600 dark:text-gray-300">
                                {tag.ui.percent}%
                              </span>
                            </div>

                            <div className="w-full h-2 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                              <div
                                className={`h-full rounded-full ${tag.ui.barColor}`}
                                style={{ width: `${tag.ui.percent}%` }}
                              />
                            </div>

                            {renderHealthDots(tag)}

                            <div className="flex flex-wrap gap-1">
                              {!tag.ui.hasSlug && (
                                <span className="text-[11px] px-2 py-0.5 rounded-full bg-violet-50 text-violet-700 border border-violet-200 dark:bg-violet-900/20 dark:text-violet-300 dark:border-violet-800">
                                  Slug cần rà soát
                                </span>
                              )}
                              {!tag.ui.hasDescription && (
                                <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-800">
                                  No description
                                </span>
                              )}
                              {(!tag.ui.hasPosition ||
                                Number(tag.position) === 0) && (
                                <span className="text-[11px] px-2 py-0.5 rounded-full bg-orange-50 text-orange-700 border border-orange-200 dark:bg-orange-900/20 dark:text-orange-300 dark:border-orange-800">
                                  Position issue
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        <td className="px-4 py-4 min-w-[210px]">
                          <div className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                            <div className="flex items-center gap-2">
                              <Hash className="w-4 h-4 text-gray-400" />
                              <span>Position: {tag.position ?? "—"}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Link2 className="w-4 h-4 text-gray-400" />
                              <span>
                                Slug: {tag.ui.hasSlug ? "OK" : "Cần rà soát"}
                              </span>
                            </div>
                            <div className="text-xs text-gray-500 pt-1">
                              Updated:{" "}
                              {formatShortDate(tag.updated_at || tag.updatedAt)}
                            </div>
                            <div className="text-xs text-gray-500">
                              Created:{" "}
                              {formatShortDate(tag.created_at || tag.createdAt)}
                            </div>
                          </div>
                        </td>

                        <td className="px-4 py-4 min-w-[180px]">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => openEditModal(tag)}
                              className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 hover:text-blue-600 hover:bg-blue-50 dark:text-gray-300 dark:hover:bg-blue-900/20 transition"
                              title="Sửa tag"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>

                            <button
                              type="button"
                              onClick={() => handleToggleStatus(tag)}
                              disabled={statusUpdatingId === tag.id}
                              className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 hover:text-amber-600 hover:bg-amber-50 dark:text-gray-300 dark:hover:bg-amber-900/20 transition disabled:opacity-50"
                              title="Đổi trạng thái"
                            >
                              {statusUpdatingId === tag.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Power className="w-4 h-4" />
                              )}
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDelete(tag)}
                              disabled={deletingId === tag.id}
                              className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 hover:text-rose-600 hover:bg-rose-50 dark:text-gray-300 dark:hover:bg-rose-900/20 transition disabled:opacity-50"
                              title="Xóa mềm"
                            >
                              {deletingId === tag.id ? (
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
              {displayedTags.map((tag) => (
                <div
                  key={tag.id}
                  className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-sm overflow-hidden flex flex-col"
                >
                  <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={selectedTagIds.includes(tag.id)}
                      onChange={() => toggleSelectOne(tag.id)}
                      className="mt-1 rounded border-gray-300"
                    />

                    <div className="w-12 h-12 rounded-xl border border-gray-200 dark:border-gray-700 bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center shrink-0">
                      <Tags className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <button
                            type="button"
                            onClick={() => openEditModal(tag)}
                            className="text-left font-bold text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 line-clamp-2"
                          >
                            {tag.name}
                          </button>
                          <div className="text-xs text-gray-500 font-mono mt-1 truncate">
                            /{tag.slug || "no-slug"}
                          </div>
                        </div>
                        {renderStatusBadge(tag.status)}
                      </div>

                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {!tag.ui.hasDescription && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-800">
                            No description
                          </span>
                        )}
                        {!tag.ui.hasSlug && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-violet-50 text-violet-700 border border-violet-200 dark:bg-violet-900/20 dark:text-violet-300 dark:border-violet-800">
                            Slug issue
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="p-4 space-y-4">
                    <div className="text-sm text-gray-600 dark:text-gray-300">
                      {tag.description?.trim() ? (
                        <p className="line-clamp-2">{tag.description}</p>
                      ) : (
                        <p className="italic text-gray-400">
                          Chưa có mô tả tag
                        </p>
                      )}
                    </div>

                    <div className="rounded-xl border border-gray-100 dark:border-gray-700 bg-gray-50/80 dark:bg-gray-900/40 p-3 space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${tag.ui.tone}`}
                        >
                          {tag.ui.label}
                        </span>
                        <span className="text-xs font-bold text-gray-600 dark:text-gray-300">
                          {tag.ui.percent}%
                        </span>
                      </div>

                      <div className="w-full h-2 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${tag.ui.barColor}`}
                          style={{ width: `${tag.ui.percent}%` }}
                        />
                      </div>

                      {renderHealthDots(tag)}
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-sm text-gray-600 dark:text-gray-300">
                      <div className="flex items-center gap-2">
                        <Hash className="w-4 h-4 text-gray-400" />
                        <span>Pos: {tag.position ?? "—"}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Link2 className="w-4 h-4 text-gray-400" />
                        <span>{tag.ui.hasSlug ? "Slug OK" : "Slug issue"}</span>
                      </div>
                      <div className="col-span-2 text-xs text-gray-500">
                        Updated:{" "}
                        {formatDateTime(tag.updated_at || tag.updatedAt)}
                      </div>
                    </div>
                  </div>

                  <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => openEditModal(tag)}
                        className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 hover:text-blue-600 hover:bg-blue-50 dark:text-gray-300 dark:hover:bg-blue-900/20 transition"
                        title="Sửa tag"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleToggleStatus(tag)}
                        disabled={statusUpdatingId === tag.id}
                        className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 hover:text-amber-600 hover:bg-amber-50 dark:text-gray-300 dark:hover:bg-amber-900/20 transition disabled:opacity-50"
                        title="Đổi trạng thái"
                      >
                        {statusUpdatingId === tag.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Power className="w-4 h-4" />
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDelete(tag)}
                        disabled={deletingId === tag.id}
                        className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 hover:text-rose-600 hover:bg-rose-50 dark:text-gray-300 dark:hover:bg-rose-900/20 transition disabled:opacity-50"
                        title="Xóa mềm"
                      >
                        {deletingId === tag.id ? (
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

      {/* Create Modal */}
      {isCreateOpen &&
        createPortal(
          <div className="fixed inset-0 z-[9999] bg-black/50 backdrop-blur-[1px] flex items-center justify-center p-4">
            <div className="w-full max-w-3xl max-h-[90vh] rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-2xl overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                    Tạo tag mới
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Tạo tag nhanh ngay trong taxonomy workspace.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={closeModals}
                  className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              {renderTagForm()}
            </div>
          </div>,
          document.body,
        )}

      {/* Edit Modal */}
      {isEditOpen &&
        createPortal(
          <div className="fixed inset-0 z-[9999] bg-black/50 backdrop-blur-[1px] flex items-center justify-center p-4">
            <div className="w-full max-w-3xl max-h-[90vh] rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-2xl overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                    Chỉnh sửa tag
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Cập nhật tên, slug, mô tả và trạng thái của tag này.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={closeModals}
                  className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {editLoading ? (
                <div className="py-20 flex flex-col items-center justify-center">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                  <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
                    Đang tải dữ liệu tag...
                  </p>
                </div>
              ) : editingTag ? (
                renderTagForm()
              ) : (
                <div className="py-20 flex flex-col items-center justify-center">
                  <AlertTriangle className="w-8 h-8 text-red-500" />
                  <p className="mt-3 text-sm text-red-600">
                    Không thể tải dữ liệu chỉnh sửa tag.
                  </p>
                </div>
              )}
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
};

export default PostTagsPage;
