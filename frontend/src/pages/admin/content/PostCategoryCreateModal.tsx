import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from "react";
import { createPortal } from "react-dom";
import { Loader2, ShieldAlert, Sparkles, X } from "lucide-react";
import { http } from "../../../services/http";
import { useAdminToast } from "../../../context/AdminToastContext";

type CategoryStatus = "active" | "inactive";

interface ParentOption {
  id: number;
  title: string;
  level: number;
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

interface PostCategoryCreateModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void | Promise<void>;
  parentOptions: ParentOption[];
  initialParentId?: number | null;
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

function buildInitialFormData(
  initialParentId?: number | null,
): CategoryFormData {
  return {
    ...emptyFormData,
    parent_id: initialParentId ? String(initialParentId) : "",
    status: "active",
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

const PostCategoryCreateModal: React.FC<PostCategoryCreateModalProps> = ({
  open,
  onClose,
  onSuccess,
  parentOptions,
  initialParentId = null,
}) => {
  const { showSuccessToast, showErrorToast } = useAdminToast();

  const [formData, setFormData] = useState<CategoryFormData>(
    buildInitialFormData(initialParentId),
  );
  const [formErrors, setFormErrors] = useState<CategoryFormErrors>({});
  const [submitting, setSubmitting] = useState(false);

  const validParentIds = useMemo(
    () => new Set(parentOptions.map((item) => item.id)),
    [parentOptions],
  );

  const resetState = useCallback(() => {
    setFormData(buildInitialFormData(initialParentId));
    setFormErrors({});
    setSubmitting(false);
  }, [initialParentId]);

  useEffect(() => {
    if (open) {
      setFormData(buildInitialFormData(initialParentId));
      setFormErrors({});
      setSubmitting(false);
    } else {
      resetState();
    }
  }, [open, initialParentId, resetState]);

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

    if (formData.parent_id && !validParentIds.has(Number(formData.parent_id))) {
      nextErrors.parent_id = "Danh mục cha không hợp lệ.";
    }

    setFormErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }, [formData, validParentIds]);

  const handleSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (!validateForm()) return;

      try {
        setSubmitting(true);

        await http(
          "POST",
          "/api/v1/admin/post-categories/create",
          buildPayload(formData),
        );

        showSuccessToast({ message: "Tạo danh mục bài viết thành công!" });

        resetState();
        if (onSuccess) {
          await onSuccess();
        }
        onClose();
      } catch (err) {
        showErrorToast(
          getApiErrorMessage(err, "Không thể tạo danh mục bài viết."),
        );
      } finally {
        setSubmitting(false);
      }
    },
    [
      formData,
      onClose,
      onSuccess,
      resetState,
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
            <div className="flex items-center gap-2 mb-1.5">
              <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 flex items-center justify-center shrink-0">
                <Sparkles className="w-4.5 h-4.5 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="min-w-0">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                  Tạo danh mục bài viết
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                  Thiết lập taxonomy mới ngay trong workspace hiện tại.
                </p>
              </div>
            </div>
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

        <form onSubmit={handleSubmit} className="flex flex-col min-h-0 flex-1">
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
                  {parentOptions.map((option) => (
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
                    handleFormChange("status", e.target.value as CategoryStatus)
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
                  onChange={(e) => handleFormChange("position", e.target.value)}
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
                  onChange={(e) => handleFormChange("og_image", e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-white"
                  placeholder="https://..."
                />
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
                "Tạo danh mục"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  );
};

export default PostCategoryCreateModal;
