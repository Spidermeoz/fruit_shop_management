import React, { useEffect, useMemo, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Loader2,
  UploadCloud,
  Link as LinkIcon,
  FolderTree,
  Check,
  ShieldAlert,
  Image as ImageIcon,
  Sparkles,
  GitBranchPlus,
  Plus,
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
interface CategoryFormData {
  parent_id: number | null;
  title: string;
  description: string;
  slug: string;
  status: "active" | "inactive";
  thumbnail: string;
}

interface ParentCategory {
  id: number;
  title: string;
  parent_id?: number | null;
  children?: ParentCategory[];
  position: number;
  status: string;
}

type ApiList<T> = { success: true; data: T[]; meta?: any };
type ApiOk = { success: true; data?: any; url?: string; meta?: any };

// ============================================
// REUSABLE CATEGORY FORM COMPONENT
// ============================================
interface ProductCategoryFormProps {
  mode?: "page" | "drawer" | "modal";
  initialParentId?: number | null;
  onSuccess?: () => void;
  onCancel?: () => void;
  submitLabel?: string;
  hideHeader?: boolean;
}

export const ProductCategoryForm: React.FC<ProductCategoryFormProps> = ({
  mode = "page",
  initialParentId = null,
  onSuccess,
  onCancel,
  submitLabel,
  hideHeader = false,
}) => {
  const [loading, setLoading] = useState(false);
  const [initLoading, setInitLoading] = useState(true);
  const [errors, setErrors] = useState<
    Partial<Record<keyof CategoryFormData, string>>
  >({});

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewImage, setPreviewImage] = useState<string>("");
  const [imageMethod, setImageMethod] = useState<"upload" | "url">("upload");
  const [imageUrl, setImageUrl] = useState<string>("");

  const { showSuccessToast, showErrorToast } = useAdminToast();
  const [parentCategories, setParentCategories] = useState<ParentCategory[]>(
    [],
  );

  const [formData, setFormData] = useState<CategoryFormData>({
    parent_id: initialParentId,
    title: "",
    description: "",
    slug: "",
    status: "active",
    thumbnail: "",
  });

  const isOverlayMode = mode === "drawer" || mode === "modal";

  const fetchParentCategories = async () => {
    try {
      setInitLoading(true);
      const res = await http<ApiList<any>>(
        "GET",
        "/api/v1/admin/product-category?limit=1000",
      );
      if (res.success && Array.isArray(res.data)) {
        const rawCats = res.data.map((c) => ({
          ...c,
          parent_id:
            c.parent_id !== undefined
              ? c.parent_id
              : c.parentId !== undefined
                ? c.parentId
                : null,
        }));
        setParentCategories(rawCats);
      }
    } catch (err) {
      console.error("Fetch categories error:", err);
    } finally {
      setInitLoading(false);
    }
  };

  useEffect(() => {
    fetchParentCategories();
  }, []);

  const selectedParent = useMemo(() => {
    if (!formData.parent_id) return null;
    return (
      parentCategories.find((cat) => cat.id === formData.parent_id) || null
    );
  }, [formData.parent_id, parentCategories]);

  const handleInputChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name as keyof typeof errors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
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
      setErrors((prev) => ({
        ...prev,
        thumbnail: "File tải lên phải là ảnh (jpg, png, webp, gif).",
      }));
      e.target.value = "";
      setSelectedFile(null);
      setPreviewImage("");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setErrors((prev) => ({
        ...prev,
        thumbnail: "Ảnh không được lớn hơn 5MB.",
      }));
      e.target.value = "";
      setSelectedFile(null);
      setPreviewImage("");
      return;
    }

    setSelectedFile(file);
    setPreviewImage(URL.createObjectURL(file));
    if (errors.thumbnail) {
      setErrors((prev) => ({ ...prev, thumbnail: undefined }));
    }
  };

  const validateForm = () => {
    const newErrors: Partial<Record<keyof CategoryFormData, string>> = {};
    if (!formData.title.trim()) {
      newErrors.title = "Vui lòng nhập tên danh mục.";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setLoading(true);
      setErrors({});
      let uploadedThumbnailUrl = formData.thumbnail;

      if (imageMethod === "upload" && selectedFile) {
        const formDataImg = new FormData();
        formDataImg.append("file", selectedFile);
        const uploadRes = await http<ApiOk>(
          "POST",
          "/api/v1/admin/upload",
          formDataImg,
        );
        uploadedThumbnailUrl = uploadRes?.data?.url || uploadRes?.url || "";
        if (!uploadedThumbnailUrl) {
          setErrors({
            thumbnail: "Không thể upload ảnh minh họa. Vui lòng thử lại.",
          });
          setLoading(false);
          return;
        }
      } else if (imageMethod === "url" && imageUrl) {
        uploadedThumbnailUrl = imageUrl;
      }

      const updatedDescription = await uploadImagesInContent(
        formData.description,
      );

      const payload = {
        parentId: formData.parent_id,
        title: formData.title,
        description: updatedDescription,
        slug: formData.slug || null,
        status: formData.status,
        thumbnail: uploadedThumbnailUrl,
      };

      const createRes = await http<ApiOk & { errors?: any }>(
        "POST",
        "/api/v1/admin/product-category/create",
        payload,
      );

      if (createRes.success) {
        showSuccessToast({ message: "Thêm mới danh mục thành công!" });
        if (onSuccess) onSuccess();
      } else {
        if (createRes.errors) {
          setErrors(createRes.errors);
        } else {
          showErrorToast(
            (createRes as any).message || "Thêm mới danh mục thất bại.",
          );
        }
      }
    } catch (err: any) {
      showErrorToast(err?.message || "Lỗi hệ thống. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  if (initLoading) {
    return (
      <div className="flex py-12 justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col h-full relative">
      <div className={`space-y-7 ${isOverlayMode ? "p-0" : ""}`}>
        {/* OVERLAY CONTEXT HEADER */}
        {isOverlayMode && !hideHeader && (
          <div className="relative overflow-hidden rounded-[24px] border border-blue-100 bg-gradient-to-br from-blue-50 via-indigo-50/70 to-white p-5 shadow-sm dark:border-blue-900/30 dark:from-blue-950/20 dark:via-indigo-950/10 dark:to-gray-900">
            <div className="absolute right-0 top-0 h-24 w-24 rounded-full bg-blue-400/10 blur-2xl" />
            <div className="flex items-start gap-4 relative">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center shadow-md shrink-0">
                {formData.parent_id ? (
                  <GitBranchPlus className="w-5 h-5" />
                ) : (
                  <Plus className="w-5 h-5" />
                )}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-lg font-extrabold text-gray-900 dark:text-white">
                    {formData.parent_id
                      ? "Tạo danh mục con trong cây"
                      : "Tạo danh mục gốc mới"}
                  </p>

                  <span className="inline-flex items-center gap-1 rounded-full bg-white/80 border border-blue-100 px-3 py-1 text-[11px] font-bold text-blue-700 shadow-sm dark:bg-gray-800 dark:border-blue-900/30 dark:text-blue-300">
                    <Sparkles className="w-3.5 h-3.5" />
                    {formData.parent_id ? "Contextual create" : "Root create"}
                  </span>
                </div>

                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                  {formData.parent_id
                    ? "Bạn đang thêm một node con trực tiếp trong ngữ cảnh của nhánh hiện tại."
                    : "Bạn đang mở rộng tầng gốc của hệ thống phân loại danh mục."}
                </p>

                <div className="mt-4 flex flex-wrap gap-3">
                  <div className="rounded-2xl border border-white/70 bg-white/80 px-4 py-3 shadow-sm dark:bg-gray-800/80 dark:border-gray-700">
                    <p className="text-[11px] uppercase tracking-wider font-bold text-gray-500">
                      Cấp tạo
                    </p>
                    <p className="mt-1 text-sm font-bold text-gray-900 dark:text-white">
                      {formData.parent_id ? "Subcategory" : "Root category"}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-white/70 bg-white/80 px-4 py-3 shadow-sm dark:bg-gray-800/80 dark:border-gray-700 min-w-[220px]">
                    <p className="text-[11px] uppercase tracking-wider font-bold text-gray-500">
                      Nhánh cha
                    </p>
                    <p className="mt-1 text-sm font-bold text-gray-900 dark:text-white truncate">
                      {selectedParent?.title || "Cấp cao nhất (Root)"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SECTION 1: TREE PLACEMENT */}
        <section
          className={`rounded-[24px] border p-5 sm:p-6 ${
            formData.parent_id
              ? "bg-indigo-50/60 border-indigo-100 dark:bg-indigo-950/10 dark:border-indigo-900/30"
              : "bg-gray-50 border-gray-200 dark:bg-gray-900/40 dark:border-gray-800"
          }`}
        >
          <div className="flex items-center gap-2 mb-3">
            <FolderTree
              className={`w-5 h-5 ${
                formData.parent_id ? "text-indigo-600" : "text-gray-500"
              }`}
            />
            <h3 className="font-bold text-gray-900 dark:text-white">
              Vị trí cấu trúc
            </h3>
          </div>

          <p className="text-sm text-gray-500 mb-4">
            {formData.parent_id
              ? "Danh mục này sẽ được thêm như một node con thuộc nhánh đang chọn."
              : "Danh mục này sẽ được tạo ở cấp cao nhất của cây danh mục."}
          </p>

          <select
            name="parent_id"
            value={formData.parent_id ?? ""}
            onChange={(e) =>
              setFormData((p) => ({
                ...p,
                parent_id: e.target.value ? Number(e.target.value) : null,
              }))
            }
            className="w-full border border-gray-300 rounded-xl p-3 bg-white text-gray-900 text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none dark:bg-gray-800 dark:border-gray-700 dark:text-white"
          >
            <option value="">-- Cấp cao nhất (Root) --</option>
            {parentCategories.length > 0 &&
              renderCategoryOptions(buildCategoryTree(parentCategories as any))}
          </select>
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
              value={formData.title}
              onChange={handleInputChange}
              placeholder="VD: Trái cây nhập khẩu"
              className={`w-full border rounded-xl p-3 text-gray-900 dark:text-white font-medium focus:ring-2 focus:ring-blue-500 outline-none transition-colors ${
                errors.title
                  ? "border-red-500 bg-red-50"
                  : "border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
              }`}
            />
            {errors.title ? (
              <p className="text-sm text-red-600 mt-1.5 flex items-center gap-1">
                <ShieldAlert className="w-4 h-4" />
                {errors.title}
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
                    setFormData((p) => ({ ...p, status: "active" }))
                  }
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                    formData.status === "active"
                      ? "bg-white text-emerald-700 shadow-sm"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  <Check
                    className={`w-4 h-4 ${
                      formData.status === "active" ? "opacity-100" : "opacity-0"
                    }`}
                  />
                  Hoạt động
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setFormData((p) => ({ ...p, status: "inactive" }))
                  }
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                    formData.status === "inactive"
                      ? "bg-white text-gray-900 shadow-sm"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  Đang ẩn
                </button>
              </div>
            </div>

            <div className="flex flex-col justify-center">
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                Mã URL (Slug)
              </label>
              <input
                type="text"
                name="slug"
                value={formData.slug}
                onChange={handleInputChange}
                placeholder="Tuỳ chọn (Tự tạo nếu trống)"
                className="w-full border border-gray-300 dark:border-gray-600 rounded-xl p-3 text-sm bg-gray-50 dark:bg-gray-900 text-gray-700 dark:text-gray-200 focus:bg-white focus:ring-1 focus:ring-gray-300 outline-none"
              />
            </div>
          </div>
        </section>

        {/* SECTION 3: MEDIA & CONTENT */}
        <section className="space-y-5 rounded-[24px] border border-gray-200 bg-white p-5 sm:p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900/40">
          <h3 className="font-bold text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-800 pb-3">
            Hình ảnh & Mô tả
          </h3>

          <div className="flex flex-col lg:flex-row gap-6 items-start">
            {/* Image Box */}
            <div className="w-full lg:w-[320px] shrink-0 flex flex-col items-center">
              <div className="w-full aspect-square border border-gray-200 dark:border-gray-700 rounded-[24px] bg-gray-50 dark:bg-gray-800 flex items-center justify-center overflow-hidden relative group shadow-sm">
                {previewImage ? (
                  <img
                    src={previewImage}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-center p-4">
                    <ImageIcon className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-xs font-medium text-gray-400">
                      Ảnh đại diện danh mục
                    </p>
                  </div>
                )}

                {previewImage && (
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedFile(null);
                        setImageUrl("");
                        setPreviewImage("");
                        setFormData((p) => ({ ...p, thumbnail: "" }));
                      }}
                      className="px-3 py-1.5 bg-red-500 text-white text-xs font-bold rounded-xl hover:bg-red-600"
                    >
                      Gỡ ảnh
                    </button>
                  </div>
                )}
              </div>

              <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-xl w-full mt-3 border border-gray-200 dark:border-gray-700">
                <button
                  type="button"
                  onClick={() => setImageMethod("upload")}
                  className={`flex-1 flex justify-center py-2 rounded-lg text-xs font-bold transition-all ${
                    imageMethod === "upload"
                      ? "bg-white text-blue-600 shadow-sm"
                      : "text-gray-500"
                  }`}
                >
                  <UploadCloud className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setImageMethod("url")}
                  className={`flex-1 flex justify-center py-2 rounded-lg text-xs font-bold transition-all ${
                    imageMethod === "url"
                      ? "bg-white text-blue-600 shadow-sm"
                      : "text-gray-500"
                  }`}
                >
                  <LinkIcon className="w-4 h-4" />
                </button>
              </div>

              <div className="w-full mt-2">
                {imageMethod === "upload" ? (
                  <label className="flex items-center justify-center w-full px-3 py-2.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-xl cursor-pointer hover:bg-blue-100 transition-colors text-xs font-bold">
                    <span>Chọn tệp tải lên</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageSelect}
                      className="hidden"
                    />
                  </label>
                ) : (
                  <input
                    type="url"
                    placeholder="Paste URL ảnh..."
                    value={imageUrl}
                    onChange={(e) => {
                      setImageUrl(e.target.value);
                      setPreviewImage(e.target.value);
                      setFormData((p) => ({ ...p, thumbnail: e.target.value }));
                      setErrors((p) => ({ ...p, thumbnail: undefined }));
                    }}
                    className="w-full border border-gray-300 rounded-xl p-3 text-xs bg-white focus:ring-2 focus:ring-blue-500 outline-none dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                  />
                )}
                {errors.thumbnail && (
                  <p className="text-[11px] text-red-600 mt-1.5 font-medium">
                    {errors.thumbnail}
                  </p>
                )}
              </div>
            </div>

            {/* Description Box */}
            <div className="w-full flex-1 border border-gray-200 dark:border-gray-700 rounded-[24px] overflow-hidden shadow-sm">
              <RichTextEditor
                value={formData.description}
                onChange={(content) =>
                  setFormData((prev) => ({ ...prev, description: content }))
                }
              />
            </div>
          </div>
        </section>
      </div>

      {/* FOOTER CTA */}
      <div
        className={`mt-8 flex justify-end gap-3 pt-5 border-t border-gray-200 dark:border-gray-700 ${
          isOverlayMode
            ? "sticky bottom-0 z-10 bg-white/92 dark:bg-gray-900/92 backdrop-blur-xl pb-4 px-1 shadow-[0_-8px_30px_rgba(15,23,42,0.06)]"
            : ""
        }`}
      >
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="px-5 py-2.5 rounded-xl border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 font-bold transition-colors disabled:opacity-50 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-700"
          >
            Hủy bỏ
          </button>
        )}

        <button
          type="submit"
          disabled={loading}
          className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 text-white hover:bg-blue-700 font-bold shadow-md transition-colors disabled:opacity-50"
        >
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          {submitLabel ||
            (formData.parent_id ? "Tạo danh mục con" : "Tạo danh mục gốc")}
        </button>
      </div>
    </form>
  );
};

// ============================================
// PAGE WRAPPER COMPONENT
// ============================================
const ProductCategoryCreatePage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const parentIdParam = searchParams.get("parent_id");
  const parsedParentId = parentIdParam ? parseInt(parentIdParam, 10) : null;

  return (
    <div className="w-full max-w-[1200px] mx-auto pb-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
        <div>
          <button
            onClick={() => navigate("/admin/products/categories")}
            className="mb-3 flex items-center gap-1 text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Quản lý cấu trúc
          </button>
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
            Thêm Danh Mục Mới
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Mở rộng cây danh mục catalog của bạn.
          </p>
        </div>
      </div>

      <Card className="p-2 sm:p-6">
        <ProductCategoryForm
          mode="page"
          initialParentId={
            !isNaN(parsedParentId as number) ? parsedParentId : null
          }
          onSuccess={() => navigate("/admin/products/categories")}
          onCancel={() => navigate("/admin/products/categories")}
        />
      </Card>
    </div>
  );
};

export default ProductCategoryCreatePage;
