import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from "react";
import { createPortal } from "react-dom";
import { AlertTriangle, Clock3, Loader2, ShieldAlert, X } from "lucide-react";
import { http } from "../../../services/http";
import { useAdminToast } from "../../../context/AdminToastContext";

type CategoryStatus = "active" | "inactive";

interface ParentOption {
  id: number;
  title: string;
  level: number;
}

interface PostCategoryEditDetail {
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
  children?: PostCategoryEditDetail[];
  created_at?: string | null;
  updated_at?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

interface CategoryFormData {
  title: string;
  parent_id: string;
  description: string;
  thumbnail: string;
  status: CategoryStatus;
  position: string;
  slug: string;
  seo_title: string;
  seo_description: string;
  seo_keywords: string;
  og_image: string;
  canonical_url: string;
}

interface CategoryFormErrors {
  title?: string;
  parent_id?: string;
  status?: string;
}

interface ApiDetail<T> {
  success: boolean;
  data: T;
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
    offset?: number;
  };
}

interface PostCategoryEditModalProps {
  open: boolean;
  categoryId: number | null;
  onClose: () => void;
  onSuccess?: () => void | Promise<void>;
  parentOptions: ParentOption[];
}

const emptyFormData: CategoryFormData = {
  title: "",
  parent_id: "",
  description: "",
  thumbnail: "",
  status: "active",
  position: "",
  slug: "",
  seo_title: "",
  seo_description: "",
  seo_keywords: "",
  og_image: "",
  canonical_url: "",
};

function getApiErrorMessage(err: unknown, fallback: string): string {
  if (
    typeof err === "object" &&
    err !== null &&
    "response" in err &&
    typeof (err as { response?: unknown }).response === "object"
  ) {
    const response = (err as { response?: { data?: { message?: string } } })
      .response;
    if (response?.data?.message) return response.data.message;
  }

  if (err instanceof Error && err.message) return err.message;
  return fallback;
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

function normalizeCategoryDetail(raw: unknown): PostCategoryEditDetail {
  const source = (raw ?? {}) as Record<string, unknown>;
  const safeStatus = String(source.status || "active").toLowerCase();

  const normalizedStatus: CategoryStatus = (
    ["active", "inactive"].includes(safeStatus) ? safeStatus : "active"
  ) as CategoryStatus;

  const parentRaw =
    source.parent && typeof source.parent === "object"
      ? (source.parent as Record<string, unknown>)
      : null;

  const childrenRaw = Array.isArray(source.children) ? source.children : [];

  return {
    id: Number(source.id),
    title: String(source.title || "Untitled category"),
    parent_id:
      source.parent_id != null && source.parent_id !== ""
        ? Number(source.parent_id)
        : null,
    parent: parentRaw
      ? {
          id: Number(parentRaw.id),
          title: String(parentRaw.title || "Parent"),
        }
      : null,
    description: (source.description as string | null | undefined) ?? null,
    thumbnail: (source.thumbnail as string | null | undefined) ?? null,
    status: normalizedStatus,
    position:
      source.position != null && source.position !== ""
        ? Number(source.position)
        : null,
    slug: (source.slug as string | null | undefined) ?? null,
    seo_title: (source.seo_title as string | null | undefined) ?? null,
    seo_description:
      (source.seo_description as string | null | undefined) ?? null,
    seo_keywords: (source.seo_keywords as string | null | undefined) ?? null,
    og_image: (source.og_image as string | null | undefined) ?? null,
    canonical_url: (source.canonical_url as string | null | undefined) ?? null,
    children: childrenRaw.map((child) => normalizeCategoryDetail(child)),
    created_at: (source.created_at as string | null | undefined) ?? null,
    updated_at: (source.updated_at as string | null | undefined) ?? null,
    createdAt:
      ((source.createdAt as string | null | undefined) ??
        (source.created_at as string | null | undefined)) ||
      null,
    updatedAt:
      ((source.updatedAt as string | null | undefined) ??
        (source.updated_at as string | null | undefined)) ||
      null,
  };
}

function mapCategoryToFormData(
  category: PostCategoryEditDetail | null,
): CategoryFormData {
  if (!category) return emptyFormData;

  return {
    title: category.title || "",
    parent_id: category.parent_id ? String(category.parent_id) : "",
    description: category.description || "",
    thumbnail: category.thumbnail || "",
    status: category.status || "active",
    position:
      category.position != null && category.position !== undefined
        ? String(category.position)
        : "",
    slug: category.slug || "",
    seo_title: category.seo_title || "",
    seo_description: category.seo_description || "",
    seo_keywords: category.seo_keywords || "",
    og_image: category.og_image || "",
    canonical_url: category.canonical_url || "",
  };
}

function buildPayload(formData: CategoryFormData) {
  return {
    title: formData.title.trim(),
    parentId: formData.parent_id ? Number(formData.parent_id) : null,
    description: formData.description.trim() || null,
    thumbnail: formData.thumbnail.trim() || null,
    status: formData.status,
    position:
      formData.position.trim() !== "" ? Number(formData.position.trim()) : null,
    slug: formData.slug.trim() || null,
    seoTitle: formData.seo_title.trim() || null,
    seoDescription: formData.seo_description.trim() || null,
    seoKeywords: formData.seo_keywords.trim() || null,
    ogImage: formData.og_image.trim() || null,
    canonicalUrl: formData.canonical_url.trim() || null,
  };
}

const PostCategoryEditModal: React.FC<PostCategoryEditModalProps> = ({
  open,
  categoryId,
  onClose,
  onSuccess,
  parentOptions,
}) => {
  const { showSuccessToast, showErrorToast } = useAdminToast();

  const [editLoading, setEditLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [fetchError, setFetchError] = useState("");
  const [editingCategory, setEditingCategory] =
    useState<PostCategoryEditDetail | null>(null);
  const [formData, setFormData] = useState<CategoryFormData>(emptyFormData);
  const [formErrors, setFormErrors] = useState<CategoryFormErrors>({});

  const filteredParentOptions = useMemo(() => {
    if (!categoryId) return parentOptions;
    return parentOptions.filter((option) => option.id !== categoryId);
  }, [categoryId, parentOptions]);

  const validParentIds = useMemo(
    () => new Set(filteredParentOptions.map((item) => item.id)),
    [filteredParentOptions],
  );

  const resetState = useCallback(() => {
    setEditLoading(false);
    setSubmitting(false);
    setFetchError("");
    setEditingCategory(null);
    setFormData(emptyFormData);
    setFormErrors({});
  }, []);

  const fetchCategoryDetail = useCallback(async () => {
    if (!open || !categoryId) return;

    try {
      setEditLoading(true);
      setFetchError("");
      setFormErrors({});

      const res = await http<ApiDetail<unknown>>(
        "GET",
        `/api/v1/admin/post-categories/edit/${categoryId}`,
      );

      if (!res?.success || !res.data) {
        throw new Error("Không thể tải dữ liệu chỉnh sửa danh mục.");
      }

      const normalized = normalizeCategoryDetail(res.data);
      setEditingCategory(normalized);
      setFormData(mapCategoryToFormData(normalized));
    } catch (err) {
      setEditingCategory(null);
      setFormData(emptyFormData);
      setFetchError(
        getApiErrorMessage(err, "Không thể tải dữ liệu chỉnh sửa danh mục."),
      );
    } finally {
      setEditLoading(false);
    }
  }, [open, categoryId]);

  useEffect(() => {
    if (open && categoryId) {
      void fetchCategoryDetail();
      return;
    }

    resetState();
  }, [open, categoryId, fetchCategoryDetail, resetState]);

  useEffect(() => {
    if (!open) return undefined;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !submitting) {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose, submitting]);

  const handleClose = useCallback(() => {
    if (submitting) return;
    onClose();
  }, [onClose, submitting]);

  const handleOverlayClick = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      if (event.target === event.currentTarget) {
        handleClose();
      }
    },
    [handleClose],
  );

  const handleFormChange = useCallback(
    <K extends keyof CategoryFormData>(key: K, value: CategoryFormData[K]) => {
      setFormData((prev) => ({
        ...prev,
        [key]: value,
      }));
      setFormErrors((prev) => ({
        ...prev,
        [key]: undefined,
      }));
    },
    [],
  );

  const validateForm = useCallback((): boolean => {
    const nextErrors: CategoryFormErrors = {};

    if (!formData.title.trim()) {
      nextErrors.title = "Tên danh mục là bắt buộc.";
    }

    if (!["active", "inactive"].includes(formData.status)) {
      nextErrors.status = "Trạng thái không hợp lệ.";
    }

    if (
      categoryId &&
      formData.parent_id &&
      Number(formData.parent_id) === categoryId
    ) {
      nextErrors.parent_id = "Danh mục không thể chọn chính nó làm cha.";
    }

    if (formData.parent_id && !validParentIds.has(Number(formData.parent_id))) {
      nextErrors.parent_id = "Danh mục cha không hợp lệ.";
    }

    setFormErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }, [categoryId, formData, validParentIds]);

  const handleSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (!categoryId || !editingCategory) return;
      if (!validateForm()) return;

      try {
        setSubmitting(true);

        await http(
          "PATCH",
          `/api/v1/admin/post-categories/edit/${categoryId}`,
          buildPayload(formData),
        );

        showSuccessToast({ message: "Lưu thay đổi danh mục thành công!" });

        if (onSuccess) {
          await onSuccess();
        }
        onClose();
      } catch (err) {
        showErrorToast(
          getApiErrorMessage(err, "Không thể cập nhật danh mục bài viết."),
        );
      } finally {
        setSubmitting(false);
      }
    },
    [
      categoryId,
      editingCategory,
      formData,
      onClose,
      onSuccess,
      showErrorToast,
      showSuccessToast,
      validateForm,
    ],
  );

  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] bg-black/50 backdrop-blur-[1px] flex items-center justify-center p-4"
      onClick={handleOverlayClick}
      aria-modal="true"
      role="dialog"
    >
      <div className="w-full max-w-4xl max-h-[90vh] rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-2xl overflow-hidden flex flex-col">
        <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-700 flex items-start justify-between gap-4 shrink-0">
          <div className="min-w-0">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              Chỉnh sửa danh mục
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Cập nhật cấu trúc, metadata và tình trạng taxonomy cho danh mục
              này.
            </p>
          </div>

          <button
            type="button"
            onClick={handleClose}
            disabled={submitting}
            className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Đóng modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {editLoading ? (
          <div className="py-20 px-5 flex flex-col items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
              Đang tải dữ liệu danh mục...
            </p>
          </div>
        ) : fetchError ? (
          <div className="py-20 px-5 flex flex-col items-center justify-center text-center">
            <AlertTriangle className="w-8 h-8 text-red-500" />
            <p className="mt-3 text-sm text-red-600">{fetchError}</p>
          </div>
        ) : editingCategory ? (
          <form
            onSubmit={handleSubmit}
            className="flex flex-col min-h-0 flex-1"
          >
            <div className="p-5 overflow-y-auto min-h-0 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2">
                    Tên danh mục <span className="text-red-500">*</span>
                  </label>
                  <input
                    value={formData.title}
                    onChange={(e) => handleFormChange("title", e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-white"
                    placeholder="Ví dụ: Sách kỹ năng, Tin tức, Gợi ý đọc..."
                  />
                  {formErrors.title && (
                    <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1.5">
                      <ShieldAlert className="w-3.5 h-3.5" />
                      {formErrors.title}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2">
                    Danh mục cha
                  </label>
                  <select
                    value={formData.parent_id}
                    onChange={(e) =>
                      handleFormChange("parent_id", e.target.value)
                    }
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-white"
                  >
                    <option value="">Không có (Danh mục gốc)</option>
                    {filteredParentOptions.map((option) => (
                      <option key={option.id} value={String(option.id)}>
                        {`${"— ".repeat(option.level)}${
                          option.level > 0 ? "↳ " : ""
                        }${option.title}`}
                      </option>
                    ))}
                  </select>
                  {formErrors.parent_id && (
                    <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1.5">
                      <ShieldAlert className="w-3.5 h-3.5" />
                      {formErrors.parent_id}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2">
                    Trạng thái
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) =>
                      handleFormChange(
                        "status",
                        e.target.value as CategoryStatus,
                      )
                    }
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-white"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                  {formErrors.status && (
                    <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1.5">
                      <ShieldAlert className="w-3.5 h-3.5" />
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
                    placeholder="Mô tả ngắn cho danh mục..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2">
                    Thumbnail URL
                  </label>
                  <input
                    value={formData.thumbnail}
                    onChange={(e) =>
                      handleFormChange("thumbnail", e.target.value)
                    }
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-white"
                    placeholder="https://..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2">
                    Position
                  </label>
                  <input
                    type="number"
                    value={formData.position}
                    onChange={(e) =>
                      handleFormChange("position", e.target.value)
                    }
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-white"
                    placeholder="0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2">
                    Slug
                  </label>
                  <input
                    value={formData.slug}
                    onChange={(e) => handleFormChange("slug", e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-white"
                    placeholder="slug-danh-muc"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2">
                    Canonical URL
                  </label>
                  <input
                    value={formData.canonical_url}
                    onChange={(e) =>
                      handleFormChange("canonical_url", e.target.value)
                    }
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-white"
                    placeholder="https://..."
                  />
                </div>

                <div className="md:col-span-2 pt-2">
                  <div className="flex items-center gap-2 mb-3">
                    <ShieldAlert className="w-4 h-4 text-violet-600" />
                    <h4 className="text-sm font-bold text-gray-900 dark:text-white">
                      SEO metadata
                    </h4>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2">
                    SEO title
                  </label>
                  <input
                    value={formData.seo_title}
                    onChange={(e) =>
                      handleFormChange("seo_title", e.target.value)
                    }
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-white"
                    placeholder="SEO title..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2">
                    SEO keywords
                  </label>
                  <input
                    value={formData.seo_keywords}
                    onChange={(e) =>
                      handleFormChange("seo_keywords", e.target.value)
                    }
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-white"
                    placeholder="keyword1, keyword2..."
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2">
                    SEO description
                  </label>
                  <textarea
                    rows={3}
                    value={formData.seo_description}
                    onChange={(e) =>
                      handleFormChange("seo_description", e.target.value)
                    }
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-white resize-none"
                    placeholder="SEO description..."
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2">
                    OG image
                  </label>
                  <input
                    value={formData.og_image}
                    onChange={(e) =>
                      handleFormChange("og_image", e.target.value)
                    }
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-white"
                    placeholder="https://..."
                  />
                </div>
              </div>

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
                      editingCategory.created_at || editingCategory.createdAt,
                    )}
                  </div>
                  <div>
                    <span className="font-medium">Updated:</span>{" "}
                    {formatDateTime(
                      editingCategory.updated_at || editingCategory.updatedAt,
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="px-5 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-end gap-3 bg-white/95 dark:bg-gray-800/95 backdrop-blur shrink-0">
              <button
                type="button"
                onClick={handleClose}
                disabled={submitting}
                className="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm font-medium text-gray-700 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <span className="inline-flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Đang lưu...
                  </span>
                ) : (
                  "Lưu thay đổi"
                )}
              </button>
            </div>
          </form>
        ) : (
          <div className="py-20 px-5 flex flex-col items-center justify-center text-center">
            <AlertTriangle className="w-8 h-8 text-red-500" />
            <p className="mt-3 text-sm text-red-600">
              Không thể tải dữ liệu chỉnh sửa danh mục.
            </p>
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
};

export default PostCategoryEditModal;
