import React, { useEffect, useState, useMemo } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Loader2,
  Save,
  UploadCloud,
  Link as LinkIcon,
  FolderTree,
  ImageOff,
  Check,
  ShieldAlert,
  RefreshCcw,
  FolderOpen,
  Sparkles,
  PencilLine,
} from "lucide-react";
import Card from "../../../components/admin/layouts/Card";
import RichTextEditor from "../../../components/admin/common/RichTextEditor";
import { uploadImagesInContent } from "../../../utils/uploadImagesInContent";
import {
  buildCategoryTree,
  renderCategoryOptions,
} from "../../../utils/categoryTree";
import { http } from "../../../services/http";
import { useAdminToast } from "../../../context/AdminToastContext";

// ============================================
// TYPES
// ============================================
interface Category {
  id: number;
  title: string;
  parent_id: number | null;
  parentId?: number | null;
  description: string | null;
  thumbnail: string | null;
  status: string;
  position: number | null;
  parent_name?: string | null;
}

type ApiDetail<T> = { success: true; data: T; meta?: any };
type ApiList<T> = { success: true; data: T[]; meta?: any };
type ApiOk = { success: true; data: any; meta?: any };

// ============================================
// REUSABLE CATEGORY EDIT FORM COMPONENT
// ============================================
interface ProductCategoryEditFormProps {
  mode?: "page" | "drawer" | "modal";
  categoryId: string | number;
  onSuccess?: () => void;
  onCancel?: () => void;
  submitLabel?: string;
  isDirtyOut?: (dirty: boolean) => void;
}

export const ProductCategoryEditForm: React.FC<
  ProductCategoryEditFormProps
> = ({
  mode = "page",
  categoryId,
  onSuccess,
  onCancel,
  submitLabel,
  isDirtyOut,
}) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [fetchError, setFetchError] = useState("");
  const [formErrors, setFormErrors] = useState<
    Partial<Record<keyof Category, string>>
  >({});

  const [categories, setCategories] = useState<Category[]>([]);
  const [category, setCategory] = useState<Category | null>(null);
  const [initialCategory, setInitialCategory] = useState<Category | null>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>("");
  const [imageMethod, setImageMethod] = useState<"upload" | "url" | "keep">(
    "keep",
  );
  const [imageUrl, setImageUrl] = useState<string>("");

  const { showSuccessToast, showErrorToast } = useAdminToast();

  const isOverlayMode = mode === "drawer" || mode === "modal";

  const fetchCategoryAndList = async () => {
    try {
      setLoading(true);
      setFetchError("");

      const [detailRes, listRes] = await Promise.all([
        http<ApiDetail<Category>>(
          "GET",
          `/api/v1/admin/product-category/edit/${categoryId}`,
        ),
        http<ApiList<Category>>(
          "GET",
          `/api/v1/admin/product-category?limit=1000`,
        ),
      ]);

      if (detailRes.success && detailRes.data) {
        setCategory(detailRes.data);
        setInitialCategory(detailRes.data);
        if (detailRes.data.thumbnail) setPreviewImage(detailRes.data.thumbnail);
      } else {
        setFetchError("Không tìm thấy danh mục.");
      }

      if (listRes.success && Array.isArray(listRes.data)) {
        setCategories(listRes.data);
      }
    } catch (err: any) {
      console.error("fetchCategory error:", err);
      setFetchError(err?.message || "Lỗi kết nối máy chủ.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategoryAndList();
  }, [categoryId]);

  const isDirty = useMemo(() => {
    if (!category || !initialCategory) return false;

    const hasFieldChanges =
      (category.title || "") !== (initialCategory.title || "") ||
      (category.parent_id || null) !== (initialCategory.parent_id || null) ||
      (category.description || "") !== (initialCategory.description || "") ||
      (category.status || "active") !== (initialCategory.status || "active");

    const originalThumb = initialCategory.thumbnail || "";

    const hasImageChanges =
      (imageMethod === "upload" && selectedFile !== null) ||
      (imageMethod === "url" &&
        imageUrl !== "" &&
        imageUrl !== originalThumb) ||
      (imageMethod === "keep" && !previewImage && originalThumb !== "");

    return hasFieldChanges || hasImageChanges;
  }, [
    category,
    initialCategory,
    selectedFile,
    imageMethod,
    imageUrl,
    previewImage,
  ]);

  useEffect(() => {
    if (isDirtyOut) isDirtyOut(isDirty);
  }, [isDirty, isDirtyOut]);

  const currentParent = useMemo(() => {
    if (!category?.parent_id) return null;
    return categories.find((c) => c.id === category.parent_id) || null;
  }, [category?.parent_id, categories]);

  const handleInputChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setCategory((prev) => (prev ? { ...prev, [name]: value } : prev));
    if (formErrors[name as keyof typeof formErrors]) {
      setFormErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleImageSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (
      !["image/jpeg", "image/png", "image/webp", "image/gif"].includes(
        file.type,
      )
    ) {
      setFormErrors((prev) => ({
        ...prev,
        thumbnail: "File tải lên phải là ảnh (jpg, png, webp, gif).",
      }));
      e.target.value = "";
      setSelectedFile(null);
      setPreviewImage(category?.thumbnail || null);
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setFormErrors((prev) => ({
        ...prev,
        thumbnail: "Ảnh không được lớn hơn 5MB.",
      }));
      e.target.value = "";
      setSelectedFile(null);
      setPreviewImage(category?.thumbnail || null);
      return;
    }

    setSelectedFile(file);
    setPreviewImage(URL.createObjectURL(file));
    if (formErrors.thumbnail) {
      setFormErrors((prev) => ({ ...prev, thumbnail: undefined }));
    }
  };

  const validateForm = () => {
    if (!category) return false;
    const newErrors: Partial<Record<keyof Category, string>> = {};
    if (!category.title.trim()) {
      newErrors.title = "Vui lòng nhập tên danh mục.";
    }
    setFormErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e?: FormEvent) => {
    if (e) e.preventDefault();
    if (!category || !isDirty) return;
    if (!validateForm()) return;

    try {
      setSaving(true);
      setFormErrors({});
      let thumbnailUrl = category.thumbnail;

      if (imageMethod === "upload" && selectedFile) {
        const formDataImg = new FormData();
        formDataImg.append("file", selectedFile);
        const up = await http<ApiOk>(
          "POST",
          "/api/v1/admin/upload",
          formDataImg,
        );
        const url = up?.data?.url || (up as any)?.url;
        if (!url) {
          setFormErrors({
            thumbnail: "Không thể tải ảnh lên. Vui lòng thử lại.",
          });
          setSaving(false);
          return;
        }
        thumbnailUrl = url;
      } else if (imageMethod === "url" && imageUrl) {
        thumbnailUrl = imageUrl;
      } else if (imageMethod === "keep" && !previewImage) {
        thumbnailUrl = "";
      }

      const updatedDescription = await uploadImagesInContent(
        category.description || "",
      );

      const payload = {
        title: category.title,
        parentId: category.parent_id,
        description: updatedDescription,
        thumbnail: thumbnailUrl,
        status: category.status,
      };

      const res = await http<ApiOk & { errors?: any }>(
        "PATCH",
        `/api/v1/admin/product-category/edit/${categoryId}`,
        payload,
      );

      if (res.success) {
        showSuccessToast({ message: "Cập nhật danh mục thành công!" });
        await fetchCategoryAndList();
        setImageMethod("keep");
        setSelectedFile(null);
        setImageUrl("");
        if (onSuccess) onSuccess();
      } else {
        if (res.errors) {
          setFormErrors(res.errors);
        } else {
          showErrorToast((res as any).message || "Cập nhật danh mục thất bại.");
        }
      }
    } catch (err: any) {
      showErrorToast(
        err?.data?.message || err?.message || "Lỗi kết nối máy chủ.",
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex py-12 justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="text-center py-12">
        <ShieldAlert className="w-10 h-10 text-red-500 mx-auto mb-3" />
        <p className="font-medium text-red-600">{fetchError}</p>
      </div>
    );
  }

  if (!category || !initialCategory) return null;

  return (
    <form
      id="category-edit-form"
      onSubmit={handleSubmit}
      className="flex flex-col h-full relative"
    >
      <div className={`space-y-7 ${isOverlayMode ? "p-0" : ""}`}>
        {/* OVERLAY CONTEXT HEADER */}
        {isOverlayMode && (
          <div className="relative overflow-hidden rounded-[24px] border border-blue-100 bg-gradient-to-br from-blue-50 via-indigo-50/70 to-white p-5 shadow-sm dark:border-blue-900/30 dark:from-blue-950/20 dark:via-indigo-950/10 dark:to-gray-900">
            <div className="absolute right-0 top-0 h-24 w-24 rounded-full bg-blue-400/10 blur-2xl" />
            <div className="flex items-start gap-4 relative">
              <div className="w-12 h-12 rounded-2xl overflow-hidden bg-white border border-gray-200 shadow-sm flex items-center justify-center shrink-0 dark:bg-gray-800 dark:border-gray-700">
                {initialCategory.thumbnail ? (
                  <img
                    src={initialCategory.thumbnail}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <PencilLine className="w-5 h-5 text-blue-600" />
                )}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-lg font-extrabold text-gray-900 dark:text-white truncate">
                    Chỉnh sửa node danh mục
                  </p>

                  <span className="inline-flex items-center gap-1 rounded-full bg-white/80 border border-blue-100 px-3 py-1 text-[11px] font-bold text-blue-700 shadow-sm dark:bg-gray-800 dark:border-blue-900/30 dark:text-blue-300">
                    <Sparkles className="w-3.5 h-3.5" />
                    In-place edit
                  </span>
                </div>

                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                  Bạn đang cập nhật một node hiện có mà không rời khỏi tree
                  manager.
                </p>

                <div className="mt-4 flex flex-wrap gap-3">
                  <div className="rounded-2xl border border-white/70 bg-white/80 px-4 py-3 shadow-sm dark:bg-gray-800/80 dark:border-gray-700 min-w-[220px]">
                    <p className="text-[11px] uppercase tracking-wider font-bold text-gray-500">
                      Danh mục hiện tại
                    </p>
                    <p className="mt-1 text-sm font-bold text-gray-900 dark:text-white truncate">
                      {initialCategory.title}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-white/70 bg-white/80 px-4 py-3 shadow-sm dark:bg-gray-800/80 dark:border-gray-700 min-w-[220px]">
                    <p className="text-[11px] uppercase tracking-wider font-bold text-gray-500">
                      Vị trí hiện tại
                    </p>
                    <p className="mt-1 text-sm font-bold text-gray-900 dark:text-white truncate">
                      {currentParent?.title || "Cấp cao nhất (Root)"}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-white/70 bg-white/80 px-4 py-3 shadow-sm dark:bg-gray-800/80 dark:border-gray-700">
                    <p className="text-[11px] uppercase tracking-wider font-bold text-gray-500">
                      Trạng thái
                    </p>
                    <p className="mt-1 text-sm font-bold text-gray-900 dark:text-white">
                      {initialCategory.status === "active"
                        ? "Hoạt động"
                        : "Đang ẩn"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* PAGE CONTEXT SUMMARY */}
        {!isOverlayMode && (
          <div className="flex items-center gap-4 bg-blue-50/50 border border-blue-100 rounded-xl p-4 dark:bg-blue-900/10 dark:border-blue-900/30">
            <div className="w-12 h-12 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg flex items-center justify-center shrink-0 overflow-hidden shadow-sm">
              {initialCategory?.thumbnail ? (
                <img
                  src={initialCategory.thumbnail}
                  alt=""
                  className="w-full h-full object-cover"
                />
              ) : (
                <FolderTree className="w-5 h-5 text-gray-400" />
              )}
            </div>
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-0.5">
                Đang chỉnh sửa
              </p>
              <p className="text-base font-bold text-gray-900 dark:text-white truncate">
                {initialCategory?.title}
              </p>
            </div>
            <div className="ml-auto flex items-center">
              <span
                className={`px-2.5 py-1 text-xs font-bold rounded-md ${
                  initialCategory?.status === "active"
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-gray-200 text-gray-600"
                }`}
              >
                {initialCategory?.status === "active"
                  ? "Đang bán"
                  : "Ngừng bán"}
              </span>
            </div>
          </div>
        )}

        {/* SECTION 1: TREE PLACEMENT */}
        <section
          className={`rounded-[24px] border p-5 sm:p-6 ${
            category.parent_id
              ? "bg-indigo-50/60 border-indigo-100 dark:bg-indigo-950/10 dark:border-indigo-900/30"
              : "bg-gray-50 border-gray-200 dark:bg-gray-900/40 dark:border-gray-800"
          }`}
        >
          <div className="flex items-center gap-2 mb-3">
            <FolderTree
              className={`w-5 h-5 ${
                category.parent_id ? "text-indigo-600" : "text-gray-500"
              }`}
            />
            <h3 className="font-bold text-gray-900 dark:text-white">
              Vị trí cấu trúc
            </h3>
          </div>

          <p className="text-sm text-gray-500 mb-4">
            {category.parent_id
              ? "Danh mục này hiện đang nằm dưới một nhánh khác và có thể được chuyển sang vị trí mới."
              : "Danh mục này hiện là nhánh gốc. Để trống nếu muốn tiếp tục giữ ở root level."}
          </p>

          <select
            name="parent_id"
            value={
              category.parent_id === null ? "" : String(category.parent_id)
            }
            onChange={(e) => {
              const value = e.target.value;
              setCategory((prev) =>
                prev
                  ? { ...prev, parent_id: value === "" ? null : Number(value) }
                  : prev,
              );
              if (formErrors.parent_id) {
                setFormErrors((prev) => ({ ...prev, parent_id: undefined }));
              }
            }}
            className={`w-full border rounded-xl p-3 bg-white text-gray-900 text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none dark:bg-gray-800 dark:text-white ${
              formErrors.parent_id
                ? "border-red-500"
                : "border-gray-300 dark:border-gray-700"
            }`}
          >
            <option value="">-- Cấp cao nhất (Root) --</option>
            {categories.length > 0 &&
              renderCategoryOptions(
                buildCategoryTree(
                  categories.filter((c) => c.id !== Number(categoryId)) as any,
                ),
              )}
          </select>

          {formErrors.parent_id && (
            <p className="text-sm text-red-600 mt-1.5 flex items-center gap-1">
              <ShieldAlert className="w-4 h-4" />
              {formErrors.parent_id}
            </p>
          )}
        </section>

        {/* SECTION 2: BASIC INFO */}
        <section className="space-y-5 rounded-[24px] border border-gray-200 bg-white p-5 sm:p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900/40">
          <h3 className="font-bold text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-800 pb-3">
            Thông tin định danh
          </h3>

          <div>
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1.5">
              Tên danh mục <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="title"
              value={category.title}
              onChange={handleInputChange}
              placeholder="VD: Trái cây nhập khẩu"
              className={`w-full border rounded-xl p-3 text-gray-900 dark:text-white font-medium focus:ring-2 focus:ring-blue-500 outline-none transition-colors ${
                formErrors.title
                  ? "border-red-500 bg-red-50"
                  : "border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
              }`}
            />
            {formErrors.title ? (
              <p className="text-sm text-red-600 mt-1.5 flex items-center gap-1">
                <ShieldAlert className="w-4 h-4" />
                {formErrors.title}
              </p>
            ) : (
              <p className="text-xs text-gray-500 mt-1.5">
                Tên hiển thị chính thức trên hệ thống menu khách hàng.
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                Trạng thái hiển thị
              </label>
              <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-xl w-fit border border-gray-200 dark:border-gray-700">
                <button
                  type="button"
                  onClick={() =>
                    setCategory((p) => (p ? { ...p, status: "active" } : p))
                  }
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                    category.status === "active"
                      ? "bg-white text-emerald-700 shadow-sm"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  <Check
                    className={`w-4 h-4 ${
                      category.status === "active" ? "opacity-100" : "opacity-0"
                    }`}
                  />
                  Hoạt động
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setCategory((p) => (p ? { ...p, status: "inactive" } : p))
                  }
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                    category.status === "inactive"
                      ? "bg-white text-gray-900 shadow-sm"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  Đang ẩn
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 3: MEDIA & CONTENT */}
        <section className="space-y-5 rounded-[24px] border border-gray-200 bg-white p-5 sm:p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900/40">
          <h3 className="font-bold text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-800 pb-3">
            Hình ảnh & Mô tả
          </h3>

          <div className="flex flex-col xl:flex-row gap-6 items-start">
            {/* Image Box */}
            <div className="w-full xl:w-[320px] shrink-0 flex flex-col items-center">
              <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-xl w-full mb-3 border border-gray-200 dark:border-gray-700">
                {[
                  { id: "keep", label: "Ảnh cũ", icon: FolderOpen },
                  { id: "upload", label: "Tải lên", icon: UploadCloud },
                  { id: "url", label: "URL", icon: LinkIcon },
                ].map((modeItem) => (
                  <button
                    key={modeItem.id}
                    type="button"
                    onClick={() => {
                      setImageMethod(modeItem.id as any);
                      if (modeItem.id === "keep") {
                        setPreviewImage(category.thumbnail || "");
                      }
                    }}
                    className={`flex-1 flex justify-center items-center gap-1 py-2 rounded-lg text-xs font-bold transition-all ${
                      imageMethod === modeItem.id
                        ? "bg-white text-blue-600 shadow-sm"
                        : "text-gray-500 hover:text-gray-900"
                    }`}
                  >
                    <modeItem.icon className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">{modeItem.label}</span>
                  </button>
                ))}
              </div>

              <div
                className={`w-full aspect-square border rounded-[24px] flex items-center justify-center overflow-hidden relative group shadow-sm transition-colors ${
                  imageMethod === "keep"
                    ? "border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800"
                    : "border-blue-200 bg-blue-50 dark:border-blue-900/30 dark:bg-blue-950/10"
                }`}
              >
                {imageMethod === "upload" && !previewImage && (
                  <label className="absolute inset-0 cursor-pointer flex flex-col items-center justify-center text-blue-500 hover:bg-blue-100/50 transition-colors">
                    <UploadCloud className="w-8 h-8 mb-2" />
                    <span className="text-xs font-bold">
                      Kéo thả hoặc duyệt
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageSelect}
                      className="hidden"
                    />
                  </label>
                )}

                {imageMethod === "url" && !previewImage && (
                  <div className="w-full h-full flex flex-col justify-center px-4">
                    <input
                      type="url"
                      placeholder="Paste URL ảnh..."
                      value={imageUrl}
                      onChange={(e) => {
                        setImageUrl(e.target.value);
                        setPreviewImage(e.target.value);
                        setCategory((p) =>
                          p ? { ...p, thumbnail: e.target.value } : p,
                        );
                        setFormErrors((p) => ({ ...p, thumbnail: undefined }));
                      }}
                      className="w-full border border-gray-300 rounded-xl p-3 text-xs bg-white focus:ring-2 focus:ring-blue-500 outline-none shadow-sm dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                    />
                  </div>
                )}

                {previewImage ? (
                  <>
                    <img
                      src={previewImage}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                    {imageMethod !== "keep" && (
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedFile(null);
                            setImageUrl("");
                            setPreviewImage("");
                            setCategory((p) =>
                              p ? { ...p, thumbnail: "" } : p,
                            );
                          }}
                          className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600 shadow-md"
                        >
                          <RefreshCcw className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </>
                ) : imageMethod === "keep" && !previewImage ? (
                  <div className="text-center p-4">
                    <ImageOff className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-xs font-medium text-gray-400">
                      Không có ảnh
                    </p>
                  </div>
                ) : null}
              </div>

              <p className="text-[11px] text-gray-500 mt-2 font-medium">
                {imageMethod === "keep"
                  ? "Đang giữ nguyên ảnh gốc"
                  : "Ảnh mới sẽ thay thế ảnh cũ sau khi lưu"}
              </p>

              {formErrors.thumbnail && (
                <p className="text-[11px] text-red-600 mt-1 font-medium">
                  {formErrors.thumbnail}
                </p>
              )}
            </div>

            {/* Description Box */}
            <div className="w-full flex-1 border border-gray-200 dark:border-gray-700 rounded-[24px] overflow-hidden shadow-sm">
              <RichTextEditor
                value={category.description || ""}
                onChange={(content) =>
                  setCategory((prev) =>
                    prev ? { ...prev, description: content } : prev,
                  )
                }
              />
            </div>
          </div>
        </section>
      </div>

      {/* STICKY SAVE BAR INSIDE FORM */}
      {isOverlayMode && (
        <div className="mt-8 flex justify-end gap-3 pt-5 border-t border-gray-200 dark:border-gray-700 sticky bottom-0 z-10 bg-white/92 dark:bg-gray-900/92 backdrop-blur-xl pb-4 px-1 shadow-[0_-8px_30px_rgba(15,23,42,0.06)]">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              disabled={saving}
              className="px-5 py-2.5 rounded-xl border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 font-bold transition-colors disabled:opacity-50 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-700"
            >
              Đóng
            </button>
          )}
          <button
            type="submit"
            disabled={saving || !isDirty}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 text-white hover:bg-blue-700 font-bold shadow-md transition-colors disabled:opacity-50 disabled:bg-gray-400"
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            {submitLabel || "Lưu thay đổi"}
          </button>
        </div>
      )}
    </form>
  );
};

// ============================================
// PAGE WRAPPER COMPONENT
// ============================================
const ProductCategoryEditPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isDirty, setIsDirty] = useState(false);

  return (
    <div className="w-full max-w-[1200px] mx-auto pb-24 relative">
      <div
        className={`fixed bottom-0 left-0 right-0 z-50 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md border-t border-gray-200 dark:border-gray-800 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] transform transition-transform duration-300 ${
          isDirty ? "translate-y-0" : "translate-y-full"
        }`}
      >
        <div className="max-w-[1200px] mx-auto px-4 md:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-3 w-3 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
            </span>
            <span className="font-semibold text-gray-800 dark:text-white hidden sm:inline">
              Có thay đổi chưa lưu
            </span>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => window.location.reload()}
              className="px-5 py-2.5 rounded-lg text-sm font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
            >
              Hoàn tác
            </button>
            <button
              onClick={() => {
                const form = document.getElementById("category-edit-form");
                if (form) {
                  form.dispatchEvent(
                    new Event("submit", { cancelable: true, bubbles: true }),
                  );
                }
              }}
              className="px-6 py-2.5 rounded-lg text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-md transition-colors flex items-center gap-2"
            >
              <Save className="w-4 h-4" /> Lưu thay đổi
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
        <div>
          <button
            onClick={() => navigate("/admin/products/categories")}
            className="mb-3 flex items-center gap-1 text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Quản lý cấu trúc
          </button>
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
            Chỉnh sửa Danh mục
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Tổ chức lại hoặc thay đổi thông tin danh mục.
          </p>
        </div>
      </div>

      <Card className="p-2 sm:p-6">
        <ProductCategoryEditForm
          mode="page"
          categoryId={id as string}
          isDirtyOut={setIsDirty}
        />
      </Card>
    </div>
  );
};

export default ProductCategoryEditPage;
