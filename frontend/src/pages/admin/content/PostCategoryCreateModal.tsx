import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from "react";
import { createPortal } from "react-dom";
import {
  Check,
  FolderTree,
  Image as ImageIcon,
  Link as LinkIcon,
  Loader2,
  ShieldAlert,
  Sparkles,
  X,
  FileText,
  Settings2,
  Search,
  Share2,
} from "lucide-react";
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

  const selectedParent = useMemo(() => {
    if (!formData.parent_id) return null;
    return (
      parentOptions.find((item) => item.id === Number(formData.parent_id)) ||
      null
    );
  }, [formData.parent_id, parentOptions]);

  const isSubcategory = Boolean(formData.parent_id);
  const footerSubmitLabel = isSubcategory
    ? "Tạo danh mục con"
    : "Tạo danh mục gốc";

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
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/55 p-4 backdrop-blur-[2px]"
      onClick={handleOverlayClick}
      aria-modal="true"
      role="dialog"
    >
      <div className="flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-[28px] border border-gray-200 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.24)] dark:border-gray-700 dark:bg-gray-800">
        {/* TOP BAR */}
        <div className="flex items-center justify-between gap-4 border-b border-gray-200 px-5 py-4 dark:border-gray-700">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-gray-500 dark:text-gray-400">
              Create post category
            </p>
          </div>

          <button
            type="button"
            onClick={handleClose}
            disabled={submitting}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-500 transition hover:bg-gray-50 hover:text-gray-700 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white"
            aria-label="Đóng modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6 sm:py-6">
            <div className="space-y-6">
              {/* HERO HEADER */}
              <section className="relative overflow-hidden rounded-[28px] border border-indigo-100 bg-gradient-to-br from-blue-50 via-indigo-50/80 to-white p-5 shadow-sm sm:p-6 dark:border-indigo-900/30 dark:from-blue-950/30 dark:via-indigo-950/20 dark:to-gray-900">
                <div className="absolute -right-10 -top-10 h-36 w-36 rounded-full bg-indigo-400/12 blur-3xl dark:bg-indigo-500/10" />
                <div className="absolute right-12 top-10 h-16 w-16 rounded-full bg-blue-300/20 blur-2xl dark:bg-blue-400/10" />

                <div className="relative flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                  <div className="flex min-w-0 gap-4">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[20px] bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-lg shadow-indigo-500/20">
                      <Sparkles className="h-6 w-6" />
                    </div>

                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-xl font-extrabold tracking-tight text-gray-900 dark:text-white sm:text-2xl">
                          {isSubcategory
                            ? "Tạo danh mục con trong cây bài viết"
                            : "Tạo danh mục bài viết gốc mới"}
                        </h2>

                        <span className="inline-flex items-center gap-1 rounded-full border border-indigo-100 bg-white/85 px-3 py-1 text-[11px] font-bold text-indigo-700 shadow-sm dark:border-indigo-900/40 dark:bg-gray-800/85 dark:text-indigo-300">
                          <Sparkles className="h-3.5 w-3.5" />
                          {isSubcategory ? "Contextual create" : "Root create"}
                        </span>
                      </div>

                      <p className="mt-2 max-w-3xl text-sm leading-6 text-gray-600 dark:text-gray-300">
                        {isSubcategory
                          ? `Bạn đang tạo một node con bên trong cấu trúc taxonomy hiện tại. Danh mục mới sẽ kế thừa ngữ cảnh từ nhánh cha "${selectedParent?.title ?? "đang chọn"}" để giúp việc tổ chức nội dung bài viết rõ ràng hơn.`
                          : "Bạn đang mở rộng tầng gốc của taxonomy bài viết. Danh mục mới sẽ trở thành một entry-level node để định hướng các nhóm nội dung lớn trong hệ thống."}
                      </p>
                    </div>
                  </div>

                  <div className="grid w-full gap-3 sm:grid-cols-2 lg:max-w-md">
                    <div className="rounded-2xl border border-white/80 bg-white/85 p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800/80">
                      <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-gray-500 dark:text-gray-400">
                        Cấp tạo
                      </p>
                      <p className="mt-2 text-sm font-bold text-gray-900 dark:text-white">
                        {isSubcategory ? "Subcategory" : "Root category"}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-white/80 bg-white/85 p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800/80">
                      <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-gray-500 dark:text-gray-400">
                        Nhánh cha
                      </p>
                      <p className="mt-2 truncate text-sm font-bold text-gray-900 dark:text-white">
                        {selectedParent?.title || "Cấp cao nhất (Root)"}
                      </p>
                    </div>
                  </div>
                </div>
              </section>

              {/* SECTION 1 - TREE PLACEMENT */}
              <section
                className={`rounded-[28px] border p-5 shadow-sm sm:p-6 ${
                  isSubcategory
                    ? "border-indigo-100 bg-indigo-50/70 dark:border-indigo-900/30 dark:bg-indigo-950/10"
                    : "border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-900/40"
                }`}
              >
                <div className="mb-5 flex items-start gap-3">
                  <div
                    className={`mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${
                      isSubcategory
                        ? "bg-white text-indigo-600 shadow-sm dark:bg-gray-800 dark:text-indigo-300"
                        : "bg-white text-gray-600 shadow-sm dark:bg-gray-800 dark:text-gray-300"
                    }`}
                  >
                    <FolderTree className="h-5 w-5" />
                  </div>

                  <div className="min-w-0">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                      Vị trí cấu trúc
                    </h3>
                    <p className="mt-1 text-sm leading-6 text-gray-600 dark:text-gray-300">
                      {isSubcategory
                        ? "Danh mục này sẽ được thêm như một node con trong cây phân loại bài viết."
                        : "Danh mục này sẽ được tạo ở cấp cao nhất của taxonomy bài viết."}
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200">
                    Danh mục cha
                  </label>

                  <select
                    value={formData.parent_id}
                    onChange={(e) =>
                      handleFormChange("parent_id", e.target.value)
                    }
                    className={`w-full rounded-2xl border px-4 py-3 text-sm font-medium outline-none transition focus:ring-2 focus:ring-indigo-500 dark:bg-gray-900 dark:text-white ${
                      formErrors.parent_id
                        ? "border-red-400 bg-red-50 text-gray-900 dark:border-red-500 dark:bg-red-950/20"
                        : "border-gray-300 bg-white text-gray-900 dark:border-gray-700"
                    }`}
                  >
                    <option value="">-- Cấp cao nhất (Root) --</option>
                    {parentOptions.map((option) => (
                      <option key={option.id} value={String(option.id)}>
                        {`${"— ".repeat(option.level)}${
                          option.level > 0 ? "↳ " : ""
                        }${option.title}`}
                      </option>
                    ))}
                  </select>

                  {formErrors.parent_id ? (
                    <p className="flex items-center gap-1.5 text-xs font-medium text-red-600 dark:text-red-400">
                      <ShieldAlert className="h-3.5 w-3.5" />
                      {formErrors.parent_id}
                    </p>
                  ) : null}

                  <div className="rounded-2xl border border-white/80 bg-white/80 px-4 py-3 text-sm text-gray-600 shadow-sm dark:border-gray-700 dark:bg-gray-800/80 dark:text-gray-300">
                    {selectedParent ? (
                      <span>
                        Node mới sẽ nằm dưới:{" "}
                        <span className="font-semibold text-gray-900 dark:text-white">
                          {selectedParent.title}
                        </span>
                      </span>
                    ) : (
                      <span>
                        Node mới sẽ được tạo ở{" "}
                        <span className="font-semibold text-gray-900 dark:text-white">
                          tầng gốc
                        </span>
                      </span>
                    )}
                  </div>
                </div>
              </section>

              {/* SECTION 2 - IDENTITY */}
              <section className="rounded-[28px] border border-gray-200 bg-white p-5 shadow-sm sm:p-6 dark:border-gray-800 dark:bg-gray-900/40">
                <div className="mb-5 flex items-start gap-3">
                  <div className="mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 shadow-sm dark:bg-blue-900/20 dark:text-blue-300">
                    <FileText className="h-5 w-5" />
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                      Thông tin định danh
                    </h3>
                    <p className="mt-1 text-sm leading-6 text-gray-600 dark:text-gray-300">
                      Thiết lập tên hiển thị và trạng thái hoạt động cho danh
                      mục bài viết mới.
                    </p>
                  </div>
                </div>

                <div className="space-y-5">
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-gray-800 dark:text-gray-200">
                      Tiêu đề danh mục <span className="text-red-500">*</span>
                    </label>
                    <input
                      value={formData.title}
                      onChange={(e) =>
                        handleFormChange("title", e.target.value)
                      }
                      className={`w-full rounded-2xl border px-4 py-3 text-sm text-gray-900 outline-none transition focus:ring-2 focus:ring-blue-500 dark:text-white ${
                        formErrors.title
                          ? "border-red-400 bg-red-50 dark:border-red-500 dark:bg-red-950/20"
                          : "border-gray-300 bg-white dark:border-gray-700 dark:bg-gray-900"
                      }`}
                      placeholder="VD: Tin nổi bật, Gợi ý đọc, Tác giả, Kiến thức marketing..."
                    />
                    {formErrors.title ? (
                      <p className="mt-2 flex items-center gap-1.5 text-xs font-medium text-red-600 dark:text-red-400">
                        <ShieldAlert className="h-3.5 w-3.5" />
                        {formErrors.title}
                      </p>
                    ) : (
                      <p className="mt-2 text-xs leading-5 text-gray-500 dark:text-gray-400">
                        Tên hiển thị chính thức của danh mục bài viết trong hệ
                        thống quản trị và giao diện người dùng.
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-gray-800 dark:text-gray-200">
                      Trạng thái hiển thị
                    </label>

                    <div className="inline-flex rounded-2xl border border-gray-200 bg-gray-100 p-1 dark:border-gray-700 dark:bg-gray-800">
                      <button
                        type="button"
                        onClick={() => handleFormChange("status", "active")}
                        className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
                          formData.status === "active"
                            ? "bg-white text-emerald-700 shadow-sm dark:bg-gray-900 dark:text-emerald-300"
                            : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                        }`}
                      >
                        <Check
                          className={`h-4 w-4 ${
                            formData.status === "active"
                              ? "opacity-100"
                              : "opacity-40"
                          }`}
                        />
                        Hoạt động
                      </button>

                      <button
                        type="button"
                        onClick={() => handleFormChange("status", "inactive")}
                        className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
                          formData.status === "inactive"
                            ? "bg-white text-gray-900 shadow-sm dark:bg-gray-900 dark:text-white"
                            : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                        }`}
                      >
                        <span
                          className={`h-2.5 w-2.5 rounded-full ${
                            formData.status === "inactive"
                              ? "bg-gray-500 dark:bg-gray-300"
                              : "bg-gray-300 dark:bg-gray-600"
                          }`}
                        />
                        Đang ẩn
                      </button>
                    </div>

                    {formErrors.status ? (
                      <p className="mt-2 flex items-center gap-1.5 text-xs font-medium text-red-600 dark:text-red-400">
                        <ShieldAlert className="h-3.5 w-3.5" />
                        {formErrors.status}
                      </p>
                    ) : (
                      <p className="mt-2 text-xs leading-5 text-gray-500 dark:text-gray-400">
                        Giữ ở trạng thái hoạt động nếu danh mục có thể được sử
                        dụng ngay trong các luồng nội dung.
                      </p>
                    )}
                  </div>
                </div>
              </section>

              {/* SECTION 3 - CONTENT & MEDIA */}
              <section className="rounded-[28px] border border-gray-200 bg-white p-5 shadow-sm sm:p-6 dark:border-gray-800 dark:bg-gray-900/40">
                <div className="mb-5 flex items-start gap-3">
                  <div className="mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-violet-50 text-violet-600 shadow-sm dark:bg-violet-900/20 dark:text-violet-300">
                    <ImageIcon className="h-5 w-5" />
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                      Nội dung &amp; media
                    </h3>
                    <p className="mt-1 text-sm leading-6 text-gray-600 dark:text-gray-300">
                      Bổ sung mô tả và hình ảnh đại diện để taxonomy dễ nhận
                      diện hơn trong các khu vực hiển thị liên quan.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-[340px_minmax(0,1fr)]">
                  {/* Thumbnail */}
                  <div className="space-y-4">
                    <div className="overflow-hidden rounded-[24px] border border-gray-200 bg-gray-50 shadow-sm dark:border-gray-700 dark:bg-gray-900">
                      <div className="aspect-[1/1] w-full">
                        {formData.thumbnail.trim() ? (
                          <img
                            src={formData.thumbnail}
                            alt="Thumbnail preview"
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full flex-col items-center justify-center px-6 text-center">
                            <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-gray-400 shadow-sm dark:bg-gray-800 dark:text-gray-500">
                              <ImageIcon className="h-6 w-6" />
                            </div>
                            <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                              Ảnh đại diện danh mục
                            </p>
                            <p className="mt-1 text-xs leading-5 text-gray-500 dark:text-gray-400">
                              Preview sẽ hiển thị ngay khi bạn nhập URL ảnh.
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-semibold text-gray-800 dark:text-gray-200">
                        Thumbnail URL
                      </label>

                      <div className="relative">
                        <LinkIcon className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                        <input
                          value={formData.thumbnail}
                          onChange={(e) =>
                            handleFormChange("thumbnail", e.target.value)
                          }
                          className="w-full rounded-2xl border border-gray-300 bg-white py-3 pl-11 pr-4 text-sm text-gray-900 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                          placeholder="https://..."
                        />
                      </div>

                      <div className="mt-2 flex items-center justify-between gap-3">
                        <p className="text-xs leading-5 text-gray-500 dark:text-gray-400">
                          Dùng ảnh đại diện để tăng nhận diện cho taxonomy hoặc
                          block hiển thị liên quan.
                        </p>

                        {formData.thumbnail.trim() ? (
                          <button
                            type="button"
                            onClick={() => handleFormChange("thumbnail", "")}
                            className="shrink-0 text-xs font-semibold text-red-600 transition hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                          >
                            Xóa ảnh
                          </button>
                        ) : null}
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  <div className="space-y-3">
                    <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200">
                      Mô tả danh mục
                    </label>

                    <div className="overflow-hidden rounded-[24px] border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-900">
                      <div className="border-b border-gray-100 px-4 py-3 dark:border-gray-800">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500 dark:text-gray-400">
                          Content note
                        </p>
                      </div>

                      <textarea
                        rows={6}
                        value={formData.description}
                        onChange={(e) =>
                          handleFormChange("description", e.target.value)
                        }
                        className="min-h-[180px] w-full resize-none border-0 bg-transparent px-4 py-4 text-sm leading-6 text-gray-900 outline-none placeholder:text-gray-400 dark:text-white dark:placeholder:text-gray-500"
                        placeholder="Mô tả mục đích, nhóm nội dung hoặc phạm vi bài viết mà danh mục này sẽ bao quát..."
                      />
                    </div>

                    <p className="text-xs leading-5 text-gray-500 dark:text-gray-400">
                      Mô tả ngắn giúp quản trị viên hiểu mục đích và phạm vi nội
                      dung của danh mục này.
                    </p>
                  </div>
                </div>
              </section>

              {/* SECTION 4 - ADDITIONAL DISPLAY CONFIG */}
              <section className="rounded-[28px] border border-gray-200 bg-white p-5 shadow-sm sm:p-6 dark:border-gray-800 dark:bg-gray-900/40">
                <div className="mb-5 flex items-start gap-3">
                  <div className="mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 shadow-sm dark:bg-amber-900/20 dark:text-amber-300">
                    <Settings2 className="h-5 w-5" />
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                      Cấu hình hiển thị bổ sung
                    </h3>
                    <p className="mt-1 text-sm leading-6 text-gray-600 dark:text-gray-300">
                      Tối ưu thứ tự hiển thị và cấu hình URL chuẩn hóa khi cần.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-gray-800 dark:text-gray-200">
                      Position
                    </label>
                    <input
                      type="number"
                      value={formData.position}
                      onChange={(e) =>
                        handleFormChange("position", e.target.value)
                      }
                      className="w-full rounded-2xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                      placeholder="0"
                    />
                    <p className="mt-2 text-xs leading-5 text-gray-500 dark:text-gray-400">
                      Dùng để kiểm soát thứ tự hiển thị tương đối trong cùng một
                      cấp danh mục.
                    </p>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-gray-800 dark:text-gray-200">
                      Canonical URL
                    </label>
                    <input
                      value={formData.canonical_url}
                      onChange={(e) =>
                        handleFormChange("canonical_url", e.target.value)
                      }
                      className="w-full rounded-2xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                      placeholder="https://..."
                    />
                    <p className="mt-2 text-xs leading-5 text-gray-500 dark:text-gray-400">
                      Tuỳ chọn. Dùng khi cần chuẩn hoá URL canonical cho SEO.
                    </p>
                  </div>
                </div>
              </section>

              {/* SECTION 5 - SEO */}
              <section className="rounded-[28px] border border-gray-200 bg-white p-5 shadow-sm sm:p-6 dark:border-gray-800 dark:bg-gray-900/40">
                <div className="mb-5 flex items-start gap-3">
                  <div className="mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 shadow-sm dark:bg-emerald-900/20 dark:text-emerald-300">
                    <Search className="h-5 w-5" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                        SEO metadata
                      </h3>

                      <span className="inline-flex items-center gap-1 rounded-full border border-emerald-100 bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700 dark:border-emerald-900/30 dark:bg-emerald-950/20 dark:text-emerald-300">
                        Optional
                      </span>

                      <span className="inline-flex items-center gap-1 rounded-full border border-blue-100 bg-blue-50 px-2.5 py-1 text-[11px] font-bold text-blue-700 dark:border-blue-900/30 dark:bg-blue-950/20 dark:text-blue-300">
                        <Share2 className="h-3.5 w-3.5" />
                        Search &amp; sharing
                      </span>
                    </div>

                    <p className="mt-1 text-sm leading-6 text-gray-600 dark:text-gray-300">
                      Tối ưu metadata cho taxonomy page khi danh mục được public
                      ra ngoài.
                    </p>
                  </div>
                </div>

                <div className="space-y-5">
                  <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-gray-800 dark:text-gray-200">
                        SEO title
                      </label>
                      <input
                        value={formData.seo_title}
                        onChange={(e) =>
                          handleFormChange("seo_title", e.target.value)
                        }
                        className="w-full rounded-2xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                        placeholder="Tiêu đề SEO cho trang danh mục..."
                      />
                      <p className="mt-2 text-xs leading-5 text-gray-500 dark:text-gray-400">
                        Tiêu đề ưu tiên cho máy tìm kiếm.
                      </p>
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-semibold text-gray-800 dark:text-gray-200">
                        SEO keywords
                      </label>
                      <input
                        value={formData.seo_keywords}
                        onChange={(e) =>
                          handleFormChange("seo_keywords", e.target.value)
                        }
                        className="w-full rounded-2xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                        placeholder="keyword1, keyword2, keyword3..."
                      />
                      <p className="mt-2 text-xs leading-5 text-gray-500 dark:text-gray-400">
                        Chuỗi từ khóa mô tả chủ đề chính của taxonomy.
                      </p>
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-gray-800 dark:text-gray-200">
                      SEO description
                    </label>
                    <textarea
                      rows={4}
                      value={formData.seo_description}
                      onChange={(e) =>
                        handleFormChange("seo_description", e.target.value)
                      }
                      className="w-full resize-none rounded-2xl border border-gray-300 bg-white px-4 py-3 text-sm leading-6 text-gray-900 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                      placeholder="Mô tả SEO ngắn cho trang danh mục..."
                    />
                    <p className="mt-2 text-xs leading-5 text-gray-500 dark:text-gray-400">
                      Mô tả ngắn hỗ trợ search snippet và bối cảnh hiển thị.
                    </p>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-gray-800 dark:text-gray-200">
                      OG image URL
                    </label>
                    <input
                      value={formData.og_image}
                      onChange={(e) =>
                        handleFormChange("og_image", e.target.value)
                      }
                      className="w-full rounded-2xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                      placeholder="https://..."
                    />
                    <p className="mt-2 text-xs leading-5 text-gray-500 dark:text-gray-400">
                      Ảnh dùng khi chia sẻ taxonomy page trên social platforms.
                    </p>
                  </div>
                </div>
              </section>
            </div>
          </div>

          {/* STICKY FOOTER */}
          <div className="sticky bottom-0 z-10 border-t border-gray-200 bg-white/92 px-5 py-4 backdrop-blur-xl dark:border-gray-700 dark:bg-gray-800/92 sm:px-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs leading-5 text-gray-500 dark:text-gray-400">
                Danh mục mới sẽ xuất hiện sau khi lưu thành công.
              </p>

              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={submitting}
                  className="inline-flex items-center justify-center rounded-2xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-700"
                >
                  Hủy bỏ
                </button>

                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex min-w-[180px] items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Đang lưu...
                    </>
                  ) : (
                    footerSubmitLabel
                  )}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  );
};

export default PostCategoryCreateModal;
