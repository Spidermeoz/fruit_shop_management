import React, { useCallback, useEffect, useMemo, type FormEvent } from "react";
import { createPortal } from "react-dom";
import {
  CheckCircle2,
  Clock3,
  FileText,
  Loader2,
  Pencil,
  Settings2,
  ShieldAlert,
  Sparkles,
  Tags,
  X,
  AlertTriangle,
} from "lucide-react";

type TagStatus = "active" | "inactive";

interface PostTag {
  id: number;
  name: string;
  slug: string | null;
  description: string | null;
  status: TagStatus;
  deleted?: boolean;
  deleted_at?: string | null;
  created_at: string | null;
  updated_at: string | null;
}

interface TagFormData {
  name: string;
  description: string;
  status: TagStatus;
}

interface TagFormErrors {
  name?: string;
  status?: string;
}

interface PostTagFormModalProps {
  open: boolean;
  mode: "create" | "edit";
  loading?: boolean;
  submitting?: boolean;
  formData: TagFormData;
  formErrors: TagFormErrors;
  editingTag?: PostTag | null;
  onClose: () => void;
  onChange: <K extends keyof TagFormData>(
    key: K,
    value: TagFormData[K],
  ) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
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

function hasDescription(description?: string | null): boolean {
  return Boolean(description?.trim());
}

function buildSlugPreview(name: string): string {
  const normalized = name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");

  return normalized || "post-tag-preview";
}

const PostTagFormModal: React.FC<PostTagFormModalProps> = ({
  open,
  mode,
  loading = false,
  submitting = false,
  formData,
  formErrors,
  editingTag = null,
  onClose,
  onChange,
  onSubmit,
}) => {
  const isEdit = mode === "edit";

  const generatedSlugPreview = useMemo(
    () => buildSlugPreview(formData.name),
    [formData.name],
  );

  const healthPercent = useMemo(() => {
    const checks = [
      Boolean(formData.name.trim()),
      hasDescription(formData.description),
    ];
    const passed = checks.filter(Boolean).length;
    return Math.round((passed / checks.length) * 100);
  }, [formData.description, formData.name]);

  const healthTone = useMemo(() => {
    if (healthPercent < 50) {
      return {
        label: "Chưa chuẩn",
        badge:
          "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900/40 dark:bg-rose-950/20 dark:text-rose-300",
        bar: "bg-rose-500",
      };
    }

    if (healthPercent < 100) {
      return {
        label: "Cần bổ sung",
        badge:
          "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-300",
        bar: "bg-amber-500",
      };
    }

    return {
      label: "Hoàn chỉnh",
      badge:
        "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-950/20 dark:text-emerald-300",
      bar: "bg-emerald-500",
    };
  }, [healthPercent]);

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

  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/55 p-4 backdrop-blur-[2px]"
      onClick={handleOverlayClick}
      aria-modal="true"
      role="dialog"
    >
      <div className="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-[28px] border border-gray-200 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.24)] dark:border-gray-700 dark:bg-gray-800">
        {/* TOP BAR */}
        <div className="flex items-center justify-between gap-4 border-b border-gray-200 px-5 py-4 dark:border-gray-700">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-gray-500 dark:text-gray-400">
              {isEdit ? "Edit post tag" : "Create post tag"}
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

        {isEdit && loading ? (
          <div className="flex min-h-[360px] flex-col items-center justify-center px-6 py-16">
            <Loader2 className="h-9 w-9 animate-spin text-blue-600" />
            <p className="mt-4 text-sm font-medium text-gray-600 dark:text-gray-300">
              Đang tải dữ liệu tag...
            </p>
          </div>
        ) : isEdit && !editingTag ? (
          <div className="flex min-h-[360px] flex-col items-center justify-center px-6 py-16">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 dark:bg-rose-950/20 dark:text-rose-300">
              <AlertTriangle className="h-7 w-7" />
            </div>
            <p className="mt-4 text-sm font-semibold text-gray-900 dark:text-white">
              Không thể tải dữ liệu chỉnh sửa tag.
            </p>
            <p className="mt-1 text-center text-sm text-gray-500 dark:text-gray-400">
              Hãy đóng modal và thử mở lại thao tác chỉnh sửa.
            </p>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="flex min-h-0 flex-1 flex-col">
            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6 sm:py-6">
              <div className="space-y-6">
                {/* HERO HEADER */}
                <section className="relative overflow-hidden rounded-[28px] border border-indigo-100 bg-gradient-to-br from-blue-50 via-indigo-50/80 to-white p-5 shadow-sm sm:p-6 dark:border-indigo-900/30 dark:from-blue-950/30 dark:via-indigo-950/20 dark:to-gray-900">
                  <div className="absolute -right-10 -top-10 h-36 w-36 rounded-full bg-indigo-400/12 blur-3xl dark:bg-indigo-500/10" />
                  <div className="absolute right-12 top-10 h-16 w-16 rounded-full bg-blue-300/20 blur-2xl dark:bg-blue-400/10" />

                  <div className="relative flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                    <div className="flex min-w-0 gap-4">
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[20px] bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-lg shadow-indigo-500/20">
                        {isEdit ? (
                          <Pencil className="h-6 w-6" />
                        ) : (
                          <Sparkles className="h-6 w-6" />
                        )}
                      </div>

                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="text-xl font-extrabold tracking-tight text-gray-900 dark:text-white sm:text-2xl">
                            {isEdit
                              ? "Chỉnh sửa taxonomy tag"
                              : "Tạo tag bài viết mới"}
                          </h2>

                          <span className="inline-flex items-center gap-1 rounded-full border border-indigo-100 bg-white/85 px-3 py-1 text-[11px] font-bold text-indigo-700 shadow-sm dark:border-indigo-900/40 dark:bg-gray-800/85 dark:text-indigo-300">
                            <Sparkles className="h-3.5 w-3.5" />
                            {isEdit ? "Edit flow" : "Quick create"}
                          </span>
                        </div>

                        <p className="mt-2 max-w-3xl text-sm leading-6 text-gray-600 dark:text-gray-300">
                          {isEdit
                            ? "Cập nhật nhanh tên hiển thị, mô tả và trạng thái của tag để taxonomy nội dung luôn nhất quán, rõ nghĩa và dễ quản lý."
                            : "Tạo một tag mới ngay trong workspace để mở rộng taxonomy nội dung, hỗ trợ phân loại bài viết linh hoạt và nhất quán hơn."}
                        </p>
                      </div>
                    </div>

                    <div className="grid w-full gap-3 sm:grid-cols-2 lg:max-w-md">
                      <div className="rounded-2xl border border-white/80 bg-white/85 p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800/80">
                        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-gray-500 dark:text-gray-400">
                          Chế độ
                        </p>
                        <p className="mt-2 text-sm font-bold text-gray-900 dark:text-white">
                          {isEdit ? "Edit existing tag" : "Create new tag"}
                        </p>
                      </div>

                      <div className="rounded-2xl border border-white/80 bg-white/85 p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800/80">
                        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-gray-500 dark:text-gray-400">
                          Slug preview
                        </p>
                        <p className="mt-2 truncate text-sm font-bold text-gray-900 dark:text-white">
                          /{generatedSlugPreview}
                        </p>
                      </div>
                    </div>
                  </div>
                </section>

                {/* SECTION 1 - TAG IDENTITY */}
                <section className="rounded-[28px] border border-gray-200 bg-white p-5 shadow-sm sm:p-6 dark:border-gray-800 dark:bg-gray-900/40">
                  <div className="mb-5 flex items-start gap-3">
                    <div className="mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 shadow-sm dark:bg-blue-900/20 dark:text-blue-300">
                      <Tags className="h-5 w-5" />
                    </div>

                    <div>
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                        Thông tin định danh
                      </h3>
                      <p className="mt-1 text-sm leading-6 text-gray-600 dark:text-gray-300">
                        Thiết lập tên hiển thị chính của tag và trạng thái hoạt
                        động để phục vụ phân loại bài viết.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-5">
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-gray-800 dark:text-gray-200">
                        Tên tag <span className="text-red-500">*</span>
                      </label>
                      <input
                        value={formData.name}
                        onChange={(e) => onChange("name", e.target.value)}
                        className={`w-full rounded-2xl border px-4 py-3 text-sm text-gray-900 outline-none transition focus:ring-2 focus:ring-blue-500 dark:text-white ${
                          formErrors.name
                            ? "border-red-400 bg-red-50 dark:border-red-500 dark:bg-red-950/20"
                            : "border-gray-300 bg-white dark:border-gray-700 dark:bg-gray-900"
                        }`}
                        placeholder="VD: self-help, marketing, review-sach..."
                      />
                      {formErrors.name ? (
                        <p className="mt-2 flex items-center gap-1.5 text-xs font-medium text-red-600 dark:text-red-400">
                          <ShieldAlert className="h-3.5 w-3.5" />
                          {formErrors.name}
                        </p>
                      ) : (
                        <p className="mt-2 text-xs leading-5 text-gray-500 dark:text-gray-400">
                          Đây là tên hiển thị chính thức của tag trong workspace
                          quản trị và khi gắn vào bài viết.
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
                          onClick={() => onChange("status", "active")}
                          className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
                            formData.status === "active"
                              ? "bg-white text-emerald-700 shadow-sm dark:bg-gray-900 dark:text-emerald-300"
                              : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                          }`}
                        >
                          <CheckCircle2
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
                          onClick={() => onChange("status", "inactive")}
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
                          Tag ở trạng thái hoạt động có thể được sử dụng ngay
                          trong các luồng tạo và chỉnh sửa bài viết.
                        </p>
                      )}
                    </div>
                  </div>
                </section>

                {/* SECTION 2 - DESCRIPTION */}
                <section className="rounded-[28px] border border-gray-200 bg-white p-5 shadow-sm sm:p-6 dark:border-gray-800 dark:bg-gray-900/40">
                  <div className="mb-5 flex items-start gap-3">
                    <div className="mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-violet-50 text-violet-600 shadow-sm dark:bg-violet-900/20 dark:text-violet-300">
                      <FileText className="h-5 w-5" />
                    </div>

                    <div>
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                        Mô tả & ngữ nghĩa
                      </h3>
                      <p className="mt-1 text-sm leading-6 text-gray-600 dark:text-gray-300">
                        Bổ sung mô tả ngắn để tag dễ hiểu hơn, giúp taxonomy rõ
                        nghĩa và giảm nhầm lẫn khi biên tập nội dung.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200">
                      Mô tả tag
                    </label>

                    <div className="overflow-hidden rounded-[24px] border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-900">
                      <div className="border-b border-gray-100 px-4 py-3 dark:border-gray-800">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500 dark:text-gray-400">
                          Taxonomy note
                        </p>
                      </div>

                      <textarea
                        rows={5}
                        value={formData.description}
                        onChange={(e) =>
                          onChange("description", e.target.value)
                        }
                        className="min-h-[160px] w-full resize-none border-0 bg-transparent px-4 py-4 text-sm leading-6 text-gray-900 outline-none placeholder:text-gray-400 dark:text-white dark:placeholder:text-gray-500"
                        placeholder="Mô tả ngắn về ngữ cảnh sử dụng của tag này, ví dụ phạm vi nội dung, nhóm bài viết phù hợp hoặc ý nghĩa phân loại..."
                      />
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <p className="text-xs leading-5 text-gray-500 dark:text-gray-400">
                        Mô tả không bắt buộc, nhưng rất hữu ích để taxonomy rõ
                        ràng và nhất quán hơn khi vận hành lâu dài.
                      </p>

                      <span
                        className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-bold ${
                          hasDescription(formData.description)
                            ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-950/20 dark:text-emerald-300"
                            : "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-300"
                        }`}
                      >
                        {hasDescription(formData.description)
                          ? "Đã có mô tả"
                          : "Chưa có mô tả"}
                      </span>
                    </div>
                  </div>
                </section>

                {/* SECTION 3 - TAG HEALTH */}
                <section className="rounded-[28px] border border-gray-200 bg-white p-5 shadow-sm sm:p-6 dark:border-gray-800 dark:bg-gray-900/40">
                  <div className="mb-5 flex items-start gap-3">
                    <div className="mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 shadow-sm dark:bg-amber-900/20 dark:text-amber-300">
                      <Settings2 className="h-5 w-5" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                          Taxonomy quality
                        </h3>

                        <span
                          className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-bold ${healthTone.badge}`}
                        >
                          {healthTone.label}
                        </span>
                      </div>

                      <p className="mt-1 text-sm leading-6 text-gray-600 dark:text-gray-300">
                        Đánh giá nhanh mức độ hoàn chỉnh của tag dựa trên tên
                        hiển thị và mô tả ngữ nghĩa.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_280px]">
                    <div className="space-y-4">
                      <div>
                        <div className="mb-2 flex items-center justify-between gap-3">
                          <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                            Mức độ hoàn chỉnh
                          </span>
                          <span className="text-sm font-bold text-gray-900 dark:text-white">
                            {healthPercent}%
                          </span>
                        </div>

                        <div className="h-2.5 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                          <div
                            className={`h-full rounded-full ${healthTone.bar}`}
                            style={{ width: `${healthPercent}%` }}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-900/60">
                          <p className="text-xs font-bold uppercase tracking-[0.18em] text-gray-500 dark:text-gray-400">
                            Name check
                          </p>
                          <div className="mt-2 flex items-center gap-2">
                            <span
                              className={`h-2.5 w-2.5 rounded-full ${
                                formData.name.trim()
                                  ? "bg-emerald-500"
                                  : "bg-rose-400"
                              }`}
                            />
                            <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
                              {formData.name.trim()
                                ? "Tên tag hợp lệ"
                                : "Thiếu tên tag"}
                            </span>
                          </div>
                        </div>

                        <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-900/60">
                          <p className="text-xs font-bold uppercase tracking-[0.18em] text-gray-500 dark:text-gray-400">
                            Description check
                          </p>
                          <div className="mt-2 flex items-center gap-2">
                            <span
                              className={`h-2.5 w-2.5 rounded-full ${
                                hasDescription(formData.description)
                                  ? "bg-emerald-500"
                                  : "bg-amber-400"
                              }`}
                            />
                            <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
                              {hasDescription(formData.description)
                                ? "Mô tả đã bổ sung"
                                : "Nên thêm mô tả"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-[24px] border border-indigo-100 bg-indigo-50/70 p-4 dark:border-indigo-900/30 dark:bg-indigo-950/10">
                      <p className="text-xs font-bold uppercase tracking-[0.18em] text-indigo-700 dark:text-indigo-300">
                        Preview
                      </p>

                      <div className="mt-4 rounded-2xl border border-white/80 bg-white/85 p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800/85">
                        <div className="flex items-start gap-3">
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-300">
                            <Tags className="h-5 w-5" />
                          </div>

                          <div className="min-w-0">
                            <p className="truncate text-sm font-bold text-gray-900 dark:text-white">
                              {formData.name.trim() || "Untitled tag"}
                            </p>
                            <p className="mt-1 truncate font-mono text-xs text-gray-500 dark:text-gray-400">
                              /{generatedSlugPreview}
                            </p>
                          </div>
                        </div>

                        <div className="mt-4">
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-bold ${
                              formData.status === "active"
                                ? "border border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-950/20 dark:text-emerald-300"
                                : "border border-gray-200 bg-gray-100 text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
                            }`}
                          >
                            {formData.status === "active"
                              ? "Active"
                              : "Inactive"}
                          </span>
                        </div>

                        <p className="mt-4 line-clamp-3 text-sm leading-6 text-gray-600 dark:text-gray-300">
                          {formData.description.trim() || "Chưa có mô tả tag."}
                        </p>
                      </div>
                    </div>
                  </div>
                </section>

                {/* SECTION 4 - EDIT METADATA */}
                {isEdit && editingTag ? (
                  <section className="rounded-[28px] border border-gray-200 bg-white p-5 shadow-sm sm:p-6 dark:border-gray-800 dark:bg-gray-900/40">
                    <div className="mb-5 flex items-start gap-3">
                      <div className="mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gray-100 text-gray-700 shadow-sm dark:bg-gray-800 dark:text-gray-300">
                        <Clock3 className="h-5 w-5" />
                      </div>

                      <div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                          Metadata hệ thống
                        </h3>
                        <p className="mt-1 text-sm leading-6 text-gray-600 dark:text-gray-300">
                          Thông tin thời gian tạo và cập nhật của tag hiện tại.
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-900/60">
                        <p className="text-xs font-bold uppercase tracking-[0.18em] text-gray-500 dark:text-gray-400">
                          Created
                        </p>
                        <p className="mt-2 text-sm font-semibold text-gray-900 dark:text-white">
                          {formatDateTime(editingTag.created_at)}
                        </p>
                      </div>

                      <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-900/60">
                        <p className="text-xs font-bold uppercase tracking-[0.18em] text-gray-500 dark:text-gray-400">
                          Updated
                        </p>
                        <p className="mt-2 text-sm font-semibold text-gray-900 dark:text-white">
                          {formatDateTime(editingTag.updated_at)}
                        </p>
                      </div>
                    </div>
                  </section>
                ) : null}
              </div>
            </div>

            {/* STICKY FOOTER */}
            <div className="sticky bottom-0 z-10 border-t border-gray-200 bg-white/92 px-5 py-4 backdrop-blur-xl dark:border-gray-700 dark:bg-gray-800/92 sm:px-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs leading-5 text-gray-500 dark:text-gray-400">
                  {isEdit
                    ? "Thay đổi sẽ được áp dụng cho tag sau khi lưu thành công."
                    : "Tag mới sẽ xuất hiện trong workspace sau khi lưu thành công."}
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
                    className="inline-flex min-w-[170px] items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Đang lưu...
                      </>
                    ) : isEdit ? (
                      "Lưu thay đổi"
                    ) : (
                      "Tạo tag mới"
                    )}
                  </button>
                </div>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>,
    document.body,
  );
};

export default PostTagFormModal;
