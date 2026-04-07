import React, { useEffect, useMemo, useRef, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertCircle,
  ArrowLeft,
  CalendarClock,
  Check,
  CheckCircle2,
  Eye,
  FileSearch,
  FileText,
  Image as ImageIcon,
  Info,
  Link as LinkIcon,
  Loader2,
  Plus,
  Search,
  Sparkles,
  Tag,
  UploadCloud,
  X,
  Layers3,
  ExternalLink,
  Clock3,
  Star,
  Package,
} from "lucide-react";

import Card from "../../../components/admin/layouts/Card";
import RichTextEditor from "../../../components/admin/common/RichTextEditor";
import { uploadImagesInContent } from "../../../utils/uploadImagesInContent";
import { http } from "../../../services/http";
import { useAdminToast } from "../../../context/AdminToastContext";

interface PostCategory {
  id: number;
  name: string;
  title?: string | null;
  slug?: string | null;
  status?: string;
  position?: number | null;
}

interface PostTag {
  id: number;
  name: string;
  slug?: string | null;
  status?: string;
  deleted?: boolean;
}

interface RelatedProduct {
  id: number;
  title: string;
  slug?: string | null;
  thumbnail?: string | null;
  status?: string;
  sku?: string | null;
}

type PostStatus = "draft" | "published" | "inactive" | "archived";

interface PostFormData {
  post_category_id: number | string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  thumbnail: string;
  status: PostStatus;
  featured: boolean;
  position: number | string;
  published_at: string;
  seo_title: string;
  seo_description: string;
  seo_keywords: string;
  og_image: string;
  canonical_url: string;
  tag_ids: number[];
  related_product_ids: number[];
}

type ErrorMap = Partial<Record<keyof PostFormData | string, string>>;
type TabKey = "basic" | "content" | "media" | "seo" | "publish";

type CreatePostResponse = {
  success?: boolean;
  data?: {
    id?: number;
  };
  errors?: Record<string, string>;
  message?: string;
};

const TABS: { id: TabKey; label: string; icon: React.FC<any> }[] = [
  { id: "basic", label: "Thông tin cơ bản", icon: Info },
  { id: "content", label: "Nội dung bài viết", icon: FileText },
  { id: "media", label: "Ảnh đại diện & Media", icon: ImageIcon },
  { id: "seo", label: "SEO & Metadata", icon: FileSearch },
  { id: "publish", label: "Xuất bản & Liên kết", icon: CalendarClock },
];

const STATUS_OPTIONS: {
  value: PostStatus;
  label: string;
  tone: string;
  hint: string;
}[] = [
  {
    value: "draft",
    label: "Draft",
    tone: "bg-amber-50 text-amber-700 border-amber-200",
    hint: "Lưu để tiếp tục biên tập",
  },
  {
    value: "published",
    label: "Published",
    tone: "bg-emerald-50 text-emerald-700 border-emerald-200",
    hint: "Hiển thị công khai trên website",
  },
  {
    value: "inactive",
    label: "Inactive",
    tone: "bg-gray-100 text-gray-700 border-gray-200",
    hint: "Tạm ẩn khỏi bề mặt hiển thị",
  },
  {
    value: "archived",
    label: "Archived",
    tone: "bg-slate-100 text-slate-700 border-slate-200",
    hint: "Lưu trữ nội dung cũ",
  },
];

const normalizeText = (value: string) =>
  String(value ?? "")
    .replace(/\s+/g, " ")
    .trim();

const stripHtml = (html: string) =>
  String(html ?? "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const isEditorEmpty = (value: string) => stripHtml(value).length === 0;

const countWords = (html: string) => {
  const text = stripHtml(html);
  if (!text) return 0;
  return text.split(/\s+/).filter(Boolean).length;
};

const slugify = (value: string) =>
  String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");

const nowAsDatetimeLocal = () => {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
};

const formatDateTimeDisplay = (value: string) => {
  if (!value) return "Chưa thiết lập";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("vi-VN");
};

const normalizeIdArray = (values: number[] = []) =>
  [...new Set(values.map(Number))].filter(
    (id) => Number.isInteger(id) && id > 0,
  );

const normalizeSingleId = (value: number | string | null | undefined) => {
  const num = Number(value);
  return Number.isInteger(num) && num > 0 ? num : null;
};

const normalizeCategoryOption = (item: any): PostCategory | null => {
  const id = Number(item?.id);
  const title = String(item?.title ?? item?.name ?? "").trim();

  if (!Number.isInteger(id) || id <= 0 || !title) return null;

  return {
    id,
    name: title,
    title,
    slug: item?.slug ?? null,
    status: item?.status ?? "active",
    position: item?.position != null ? Number(item.position) : null,
  };
};

const normalizeTagOption = (item: any): PostTag | null => {
  const id = Number(item?.id);
  const name = String(item?.name ?? item?.title ?? "").trim();

  if (!Number.isInteger(id) || id <= 0 || !name) return null;
  if (Boolean(item?.deleted ?? false)) return null;

  return {
    id,
    name,
    slug: item?.slug ?? null,
    status: item?.status ?? "active",
    deleted: Boolean(item?.deleted ?? false),
  };
};

const normalizeProductOption = (item: any): RelatedProduct | null => {
  const id = Number(item?.id);
  const title = String(item?.title ?? item?.name ?? "").trim();

  if (!Number.isInteger(id) || id <= 0 || !title) return null;

  return {
    id,
    title,
    slug: item?.slug ?? null,
    thumbnail: item?.thumbnail ?? null,
    status: item?.status ?? "inactive",
    sku: item?.sku ?? null,
  };
};

const statusBadgeClass = (status: PostStatus) => {
  switch (status) {
    case "published":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    case "inactive":
      return "bg-gray-100 text-gray-700 border-gray-200";
    case "archived":
      return "bg-slate-100 text-slate-700 border-slate-200";
    case "draft":
    default:
      return "bg-amber-50 text-amber-700 border-amber-200";
  }
};

const getApiErrorMessage = (error: any, fallback: string) => {
  return error?.response?.data?.message || error?.message || fallback;
};

const extractListData = (response: any): any[] => {
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.data?.items)) return response.data.items;
  if (Array.isArray(response?.items)) return response.items;
  return [];
};

const PostCreatePage: React.FC = () => {
  const navigate = useNavigate();
  const { showSuccessToast, showErrorToast } = useAdminToast();

  const [activeTab, setActiveTab] = useState<TabKey>("basic");
  const [submitting, setSubmitting] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const [bootLoading, setBootLoading] = useState(true);
  const [errors, setErrors] = useState<ErrorMap>({});

  const [categories, setCategories] = useState<PostCategory[]>([]);
  const [tags, setTags] = useState<PostTag[]>([]);
  const [products, setProducts] = useState<RelatedProduct[]>([]);

  const [selectedThumbnailFile, setSelectedThumbnailFile] =
    useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState("");
  const [thumbnailMethod, setThumbnailMethod] = useState<"upload" | "url">(
    "upload",
  );

  const [productSearch, setProductSearch] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [ogUseThumbnail, setOgUseThumbnail] = useState(true);

  const fieldRefs = useRef<Record<string, HTMLElement | null>>({});

  const [formData, setFormData] = useState<PostFormData>({
    post_category_id: "",
    title: "",
    slug: "",
    excerpt: "",
    content: "",
    thumbnail: "",
    status: "draft",
    featured: false,
    position: "",
    published_at: "",
    seo_title: "",
    seo_description: "",
    seo_keywords: "",
    og_image: "",
    canonical_url: "",
    tag_ids: [],
    related_product_ids: [],
  });

  const isBusy = submitting || savingDraft;

  const setFieldRef = (key: string) => (element: HTMLElement | null) => {
    fieldRefs.current[key] = element;
  };

  const clearError = (key: string) => {
    setErrors((prev) => {
      if (!prev[key]) return prev;
      return { ...prev, [key]: undefined };
    });
  };

  const getTabForField = (fieldKey: string): TabKey => {
    if (
      fieldKey.startsWith("title") ||
      fieldKey.startsWith("slug") ||
      fieldKey.startsWith("excerpt") ||
      fieldKey.startsWith("post_category_id") ||
      fieldKey.startsWith("tag_ids") ||
      fieldKey.startsWith("position") ||
      fieldKey.startsWith("featured")
    ) {
      return "basic";
    }
    if (fieldKey.startsWith("content")) return "content";
    if (fieldKey.startsWith("thumbnail")) return "media";
    if (
      fieldKey.startsWith("seo_") ||
      fieldKey.startsWith("og_image") ||
      fieldKey.startsWith("canonical_url")
    ) {
      return "seo";
    }
    if (
      fieldKey.startsWith("status") ||
      fieldKey.startsWith("published_at") ||
      fieldKey.startsWith("related_product_ids")
    ) {
      return "publish";
    }
    return "basic";
  };

  const scrollToFirstError = (errorMap: ErrorMap) => {
    const firstKey = Object.keys(errorMap)[0];
    if (!firstKey) return;

    const nextTab = getTabForField(firstKey);
    if (activeTab !== nextTab) setActiveTab(nextTab);

    setTimeout(() => {
      const target = fieldRefs.current[firstKey];
      if (target) {
        target.scrollIntoView({ behavior: "smooth", block: "center" });
        if (typeof (target as HTMLInputElement).focus === "function") {
          (target as HTMLInputElement).focus();
        }
      }
    }, 120);
  };

  const resolvedThumbnail = useMemo(() => {
    return normalizeText(thumbnailPreview) || normalizeText(formData.thumbnail);
  }, [thumbnailPreview, formData.thumbnail]);

  const derivedSeoTitle =
    normalizeText(formData.seo_title) || normalizeText(formData.title);
  const derivedSeoDescription =
    normalizeText(formData.seo_description) || normalizeText(formData.excerpt);
  const derivedOgImage = normalizeText(formData.og_image) || resolvedThumbnail;
  const contentWordCount = useMemo(
    () => countWords(formData.content),
    [formData.content],
  );

  useEffect(() => {
    if (!slugTouched) {
      setFormData((prev) => ({
        ...prev,
        slug: slugify(prev.title),
      }));
    }
  }, [formData.title, slugTouched]);

  useEffect(() => {
    if (!ogUseThumbnail) return;

    setFormData((prev) => ({
      ...prev,
      og_image: resolvedThumbnail || "",
    }));
  }, [resolvedThumbnail, ogUseThumbnail]);

  useEffect(() => {
    return () => {
      if (thumbnailPreview && thumbnailPreview.startsWith("blob:")) {
        URL.revokeObjectURL(thumbnailPreview);
      }
    };
  }, [thumbnailPreview]);

  useEffect(() => {
    let mounted = true;

    const fetchBootstrap = async () => {
      setBootLoading(true);
      try {
        const [categoriesRes, tagsRes, productsRes] = await Promise.allSettled([
          http<any>("GET", "/api/v1/admin/post-categories?limit=1000"),
          http<any>("GET", "/api/v1/admin/post-tags?limit=1000"),
          http<any>("GET", "/api/v1/admin/products?limit=1000"),
        ]);

        if (!mounted) return;

        if (categoriesRes.status === "fulfilled") {
          const categoryRows = extractListData(categoriesRes.value);
          setCategories(
            categoryRows
              .map(normalizeCategoryOption)
              .filter(Boolean) as PostCategory[],
          );
        }

        if (tagsRes.status === "fulfilled") {
          const tagRows = extractListData(tagsRes.value);
          setTags(
            (tagRows.map(normalizeTagOption).filter(Boolean) as PostTag[]).sort(
              (a, b) => a.name.localeCompare(b.name, "vi"),
            ),
          );
        }

        if (productsRes.status === "fulfilled") {
          const productRows = extractListData(productsRes.value);
          setProducts(
            productRows
              .map(normalizeProductOption)
              .filter(Boolean) as RelatedProduct[],
          );
        }

        const hasFailure =
          categoriesRes.status === "rejected" ||
          tagsRes.status === "rejected" ||
          productsRes.status === "rejected";

        if (hasFailure) {
          showErrorToast(
            "Một phần dữ liệu nền chưa tải được. Bạn vẫn có thể tiếp tục kiểm tra và nhập bài viết.",
          );
        }
      } catch (error: any) {
        console.error(error);
        showErrorToast(
          getApiErrorMessage(
            error,
            "Không thể tải dữ liệu nền cho trang tạo bài viết.",
          ),
        );
      } finally {
        if (mounted) setBootLoading(false);
      }
    };

    fetchBootstrap();
    return () => {
      mounted = false;
    };
  }, [showErrorToast]);

  const handleInputChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    clearError(name);
  };

  const handleTitleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    setFormData((prev) => ({ ...prev, title: value }));
    clearError("title");
  };

  const handleSlugChange = (e: ChangeEvent<HTMLInputElement>) => {
    setSlugTouched(true);
    setFormData((prev) => ({ ...prev, slug: slugify(e.target.value) }));
    clearError("slug");
  };

  const handleContentChange = (value: string) => {
    setFormData((prev) => ({ ...prev, content: value }));
    clearError("content");
  };

  const handleToggleTag = (tagId: number) => {
    setFormData((prev) => {
      const exists = prev.tag_ids.includes(tagId);
      return {
        ...prev,
        tag_ids: exists
          ? prev.tag_ids.filter((id) => id !== tagId)
          : [...prev.tag_ids, tagId],
      };
    });
    clearError("tag_ids");
  };

  const handleThumbnailSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setErrors((prev) => ({
        ...prev,
        thumbnail: "File được chọn phải là ảnh hợp lệ.",
      }));
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setErrors((prev) => ({
        ...prev,
        thumbnail: "Ảnh đại diện không được lớn hơn 5MB.",
      }));
      return;
    }

    if (thumbnailPreview && thumbnailPreview.startsWith("blob:")) {
      URL.revokeObjectURL(thumbnailPreview);
    }

    const previewUrl = URL.createObjectURL(file);
    setSelectedThumbnailFile(file);
    setThumbnailPreview(previewUrl);
    setThumbnailMethod("upload");
    setFormData((prev) => ({ ...prev, thumbnail: "" }));
    clearError("thumbnail");
  };

  const handleThumbnailUrlChange = (e: ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value;

    if (thumbnailPreview && thumbnailPreview.startsWith("blob:")) {
      URL.revokeObjectURL(thumbnailPreview);
    }

    setThumbnailMethod("url");
    setSelectedThumbnailFile(null);
    setFormData((prev) => ({ ...prev, thumbnail: url }));
    setThumbnailPreview(url);
    clearError("thumbnail");
  };

  const resetThumbnail = () => {
    if (thumbnailPreview && thumbnailPreview.startsWith("blob:")) {
      URL.revokeObjectURL(thumbnailPreview);
    }

    setSelectedThumbnailFile(null);
    setThumbnailPreview("");
    setThumbnailMethod("upload");
    setFormData((prev) => ({ ...prev, thumbnail: "" }));
    clearError("thumbnail");
  };

  const selectedCategory = useMemo(() => {
    return categories.find(
      (item) => Number(item.id) === Number(formData.post_category_id),
    );
  }, [categories, formData.post_category_id]);

  const selectedTags = useMemo(() => {
    const selectedSet = new Set(formData.tag_ids);
    return tags.filter((item) => selectedSet.has(item.id));
  }, [tags, formData.tag_ids]);

  const selectedProducts = useMemo(() => {
    const selectedSet = new Set(formData.related_product_ids);
    return products.filter((item) => selectedSet.has(item.id));
  }, [products, formData.related_product_ids]);

  const filteredProducts = useMemo(() => {
    const keyword = normalizeText(productSearch).toLowerCase();
    const selectedSet = new Set(formData.related_product_ids);

    return products
      .filter((item) => !selectedSet.has(item.id))
      .filter((item) => {
        if (!keyword) return true;
        return (
          item.title.toLowerCase().includes(keyword) ||
          String(item.sku ?? "")
            .toLowerCase()
            .includes(keyword)
        );
      })
      .slice(0, 10);
  }, [products, productSearch, formData.related_product_ids]);

  const readiness = useMemo(() => {
    const checks = [
      {
        id: "title",
        label: "Có tiêu đề bài viết",
        passed: normalizeText(formData.title).length > 0,
        tab: "basic" as TabKey,
      },
      {
        id: "category",
        label: "Đã chọn danh mục",
        passed: !!formData.post_category_id,
        tab: "basic" as TabKey,
      },
      {
        id: "excerpt",
        label: "Có excerpt / mô tả ngắn",
        passed: normalizeText(formData.excerpt).length >= 20,
        tab: "basic" as TabKey,
      },
      {
        id: "content",
        label: "Có nội dung bài viết",
        passed: !isEditorEmpty(formData.content),
        tab: "content" as TabKey,
      },
      {
        id: "thumbnail",
        label: "Có ảnh đại diện",
        passed: !!resolvedThumbnail,
        tab: "media" as TabKey,
      },
      {
        id: "tags",
        label: "Có ít nhất 1 tag",
        passed: formData.tag_ids.length > 0,
        tab: "basic" as TabKey,
      },
      {
        id: "seo_title",
        label: "Có SEO title",
        passed: normalizeText(formData.seo_title).length > 0,
        tab: "seo" as TabKey,
      },
      {
        id: "seo_description",
        label: "Có SEO description",
        passed: normalizeText(formData.seo_description).length > 0,
        tab: "seo" as TabKey,
      },
      {
        id: "status",
        label: "Đã chọn trạng thái",
        passed: !!formData.status,
        tab: "publish" as TabKey,
      },
      {
        id: "published_at",
        label: "Published có lịch xuất bản",
        passed:
          formData.status !== "published" ||
          normalizeText(formData.published_at).length > 0,
        tab: "publish" as TabKey,
      },
    ];

    const passedCount = checks.filter((item) => item.passed).length;
    const percentage = Math.round((passedCount / checks.length) * 100);

    return {
      checks,
      passedCount,
      total: checks.length,
      percentage,
    };
  }, [formData, resolvedThumbnail]);

  const softWarnings = useMemo(() => {
    const warnings: string[] = [];

    if (!normalizeText(formData.excerpt)) {
      warnings.push(
        "Bài viết chưa có excerpt, card preview và SEO snippet sẽ yếu.",
      );
    }

    if (contentWordCount > 0 && contentWordCount < 120) {
      warnings.push(
        "Nội dung còn khá ngắn, nên mở rộng để bài viết có chiều sâu hơn.",
      );
    }

    if (!resolvedThumbnail) {
      warnings.push("Chưa có ảnh đại diện, bài viết sẽ kém nổi bật ở listing.");
    }

    if (!normalizeText(formData.seo_title)) {
      warnings.push(
        "Chưa có SEO title riêng, hệ thống sẽ dùng fallback từ title.",
      );
    }

    if (!normalizeText(formData.seo_description)) {
      warnings.push(
        "Chưa có SEO description riêng, hệ thống sẽ dùng fallback từ excerpt.",
      );
    }

    if (formData.tag_ids.length === 0) {
      warnings.push(
        "Bài viết chưa có tag, khả năng phân nhóm và điều hướng nội dung sẽ yếu hơn.",
      );
    }

    if (formData.featured && formData.status !== "published") {
      warnings.push(
        "Bài viết đang được đánh dấu nổi bật nhưng chưa ở trạng thái published.",
      );
    }

    if (formData.status === "published" && contentWordCount < 120) {
      warnings.push("Bài viết sắp publish nhưng nội dung hiện vẫn khá ngắn.");
    }

    return warnings;
  }, [
    formData.excerpt,
    formData.featured,
    formData.seo_description,
    formData.seo_title,
    formData.status,
    formData.tag_ids.length,
    contentWordCount,
    resolvedThumbnail,
  ]);

  const publishBlockingIssues = useMemo(() => {
    const issues: string[] = [];

    if (!normalizeText(formData.title)) {
      issues.push("Thiếu tiêu đề bài viết.");
    }

    if (!normalizeText(formData.slug) && normalizeText(formData.title)) {
      issues.push("Slug hiện chưa hợp lệ.");
    }

    if (isEditorEmpty(formData.content)) {
      issues.push("Thiếu nội dung bài viết.");
    }

    if (!formData.status) {
      issues.push("Chưa chọn trạng thái bài viết.");
    }

    if (
      formData.status === "published" &&
      !normalizeText(formData.published_at)
    ) {
      issues.push("Bài viết published cần có thời điểm xuất bản.");
    }

    return issues;
  }, [
    formData.title,
    formData.slug,
    formData.content,
    formData.status,
    formData.published_at,
  ]);

  const validateForm = (mode: "draft" | "submit"): boolean => {
    const nextErrors: ErrorMap = {};

    if (!normalizeText(formData.title)) {
      nextErrors.title = "Vui lòng nhập tiêu đề bài viết.";
    }

    if (
      normalizeText(formData.title).length > 0 &&
      !normalizeText(formData.slug)
    ) {
      nextErrors.slug = "Slug không hợp lệ. Vui lòng kiểm tra lại.";
    }

    if (mode === "submit" && isEditorEmpty(formData.content)) {
      nextErrors.content = "Vui lòng nhập nội dung bài viết.";
    }

    if (!formData.status) {
      nextErrors.status = "Vui lòng chọn trạng thái bài viết.";
    }

    if (
      String(formData.position).trim() !== "" &&
      (!Number.isFinite(Number(formData.position)) ||
        Number(formData.position) < 0)
    ) {
      nextErrors.position = "Position phải là số nguyên không âm.";
    }

    if (
      formData.status === "published" &&
      !normalizeText(formData.published_at) &&
      mode === "submit"
    ) {
      nextErrors.published_at = "Bài viết published cần có thời điểm xuất bản.";
    }

    if (normalizeText(formData.canonical_url)) {
      try {
        new URL(formData.canonical_url);
      } catch {
        nextErrors.canonical_url = "Canonical URL không hợp lệ.";
      }
    }

    if (normalizeText(formData.og_image)) {
      try {
        new URL(formData.og_image);
      } catch {
        nextErrors.og_image = "OG image URL không hợp lệ.";
      }
    }

    if (thumbnailMethod === "url" && normalizeText(formData.thumbnail)) {
      try {
        new URL(formData.thumbnail);
      } catch {
        nextErrors.thumbnail = "URL ảnh đại diện không hợp lệ.";
      }
    }

    if (mode === "submit" && !formData.post_category_id) {
      nextErrors.post_category_id = "Vui lòng chọn danh mục cho bài viết.";
    }

    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      scrollToFirstError(nextErrors);
      return false;
    }

    return true;
  };

  const uploadThumbnailIfNeeded = async () => {
    if (thumbnailMethod === "upload" && selectedThumbnailFile) {
      const form = new FormData();
      form.append("file", selectedThumbnailFile);

      const uploadRes = await http<any>("POST", "/api/v1/admin/upload", form);
      if (uploadRes?.success && uploadRes?.data?.url) return uploadRes.data.url;
      if (uploadRes?.url) return uploadRes.url;

      throw new Error("Không thể tải ảnh đại diện lên hệ thống.");
    }

    if (thumbnailMethod === "url") {
      return normalizeText(formData.thumbnail) || "";
    }

    return "";
  };

  const buildPayload = async (mode: "draft" | "submit") => {
    const uploadedThumbnail = await uploadThumbnailIfNeeded();
    const uploadedContent = await uploadImagesInContent(formData.content);

    const nextStatus: PostStatus = mode === "draft" ? "draft" : formData.status;

    const nextPublishedAtLocal =
      nextStatus === "published"
        ? normalizeText(formData.published_at) || nowAsDatetimeLocal()
        : null;

    const normalizedPublishedAtIso = nextPublishedAtLocal
      ? new Date(nextPublishedAtLocal).toISOString()
      : null;

    const normalizedOgImage = ogUseThumbnail
      ? uploadedThumbnail || null
      : normalizeText(formData.og_image) || null;

    return {
      postCategoryId: normalizeSingleId(formData.post_category_id),
      title: normalizeText(formData.title),
      slug: normalizeText(formData.slug) || null,
      excerpt: normalizeText(formData.excerpt) || null,
      content: uploadedContent,
      thumbnail: uploadedThumbnail || null,
      status: nextStatus,
      featured: Boolean(formData.featured),
      position:
        String(formData.position).trim() === "" ||
        !Number.isFinite(Number(formData.position))
          ? null
          : Number(formData.position),
      publishedAt: normalizedPublishedAtIso,
      seoTitle: normalizeText(formData.seo_title) || null,
      seoDescription: normalizeText(formData.seo_description) || null,
      seoKeywords: normalizeText(formData.seo_keywords) || null,
      ogImage: normalizedOgImage,
      canonicalUrl: normalizeText(formData.canonical_url) || null,
      tagIds: normalizeIdArray(formData.tag_ids),
      relatedProductIds: normalizeIdArray(formData.related_product_ids),
      // createdById / updatedById:
      // bổ sung tại đây nếu hệ thống auth admin đã expose user id ở frontend
    };
  };

  const submitForm = async (mode: "draft" | "submit") => {
    const isValid = validateForm(mode);
    if (!isValid) return;

    try {
      if (mode === "draft") {
        setSavingDraft(true);
      } else {
        setSubmitting(true);
      }

      const payload = await buildPayload(mode);
      const response = await http<CreatePostResponse>(
        "POST",
        "/api/v1/admin/posts/create",
        payload,
      );

      if (response?.success) {
        showSuccessToast({
          message:
            mode === "draft"
              ? "Đã lưu bài viết nháp."
              : "Tạo bài viết thành công.",
        });
        navigate("/admin/content/posts");
        return;
      }

      if (response?.errors && Object.keys(response.errors).length > 0) {
        setErrors(response.errors);
        scrollToFirstError(response.errors);
        return;
      }

      showErrorToast(response?.message || "Không thể tạo bài viết.");
    } catch (error: any) {
      console.error(error);

      const serverErrors = error?.response?.data?.errors;
      if (serverErrors && typeof serverErrors === "object") {
        setErrors(serverErrors);
        scrollToFirstError(serverErrors);
        return;
      }

      showErrorToast(
        getApiErrorMessage(error, "Lỗi hệ thống khi tạo bài viết."),
      );
    } finally {
      if (mode === "draft") {
        setSavingDraft(false);
      } else {
        setSubmitting(false);
      }
    }
  };

  const handleSubmit = async (e?: FormEvent) => {
    if (e) e.preventDefault();
    await submitForm("submit");
  };

  const handleSaveDraft = async () => {
    await submitForm("draft");
  };

  const handleAddProduct = (productId: number) => {
    setFormData((prev) => ({
      ...prev,
      related_product_ids: [
        ...new Set([...prev.related_product_ids, productId]),
      ],
    }));
    clearError("related_product_ids");
  };

  const handleRemoveProduct = (productId: number) => {
    setFormData((prev) => ({
      ...prev,
      related_product_ids: prev.related_product_ids.filter(
        (id) => id !== productId,
      ),
    }));
  };

  const renderHeader = () => (
    <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4 mb-8">
      <div>
        <button
          type="button"
          onClick={() => navigate("/admin/content/posts")}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors mb-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Quay lại danh sách bài viết
        </button>

        <div className="flex items-start gap-3">
          <div className="w-11 h-11 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center border border-blue-100 shadow-sm">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white">
              Tạo bài viết mới
            </h1>
            <p className="text-sm text-gray-500 mt-1 max-w-2xl">
              Soạn thảo, tối ưu SEO và chuẩn bị xuất bản nội dung mới cho
              website.
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          disabled
          className="px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-400 font-medium cursor-not-allowed inline-flex items-center gap-2"
        >
          <Eye className="w-4 h-4" />
          Xem trước
        </button>

        <button
          type="button"
          onClick={handleSaveDraft}
          disabled={savingDraft || submitting}
          className="px-4 py-2.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 font-semibold shadow-sm transition-colors inline-flex items-center gap-2"
        >
          {savingDraft ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Clock3 className="w-4 h-4" />
          )}
          Lưu nháp
        </button>

        <button
          type="button"
          onClick={() => void handleSubmit()}
          disabled={submitting || savingDraft}
          className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-md transition-colors inline-flex items-center gap-2"
        >
          {submitting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Sparkles className="w-4 h-4" />
          )}
          Tạo bài viết
        </button>
      </div>
    </div>
  );

  const renderTabs = () => (
    <div className="bg-white dark:bg-gray-800 p-2 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm flex overflow-x-auto hide-scrollbar">
      {TABS.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;

        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 min-w-max inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold transition-all ${
              isActive
                ? "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 shadow-sm"
                : "text-gray-500 hover:text-gray-900 hover:bg-gray-50 dark:hover:bg-gray-700/70"
            }`}
          >
            <Icon className="w-4 h-4" />
            {tab.label}
          </button>
        );
      })}
    </div>
  );

  const renderBasicTab = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <Card className="p-6">
        <div className="mb-5">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">
            Thông tin cơ bản
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            Xây nền cho bài viết: tiêu đề, slug, mô tả ngắn, phân loại và tín
            hiệu nổi bật.
          </p>
        </div>

        <div className="space-y-5">
          <div ref={setFieldRef("title")}>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
              Tiêu đề bài viết <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleTitleChange}
              placeholder="Nhập tiêu đề bài viết"
              className={`w-full rounded-xl border px-4 py-3.5 text-base bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 transition-shadow ${
                errors.title
                  ? "border-red-500"
                  : "border-gray-300 dark:border-gray-600"
              }`}
            />
            {errors.title ? (
              <p className="text-sm text-red-600 mt-1.5 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {errors.title}
              </p>
            ) : (
              <p className="text-xs text-gray-500 mt-1.5">
                Tiêu đề rõ ràng giúp cả người đọc lẫn công cụ tìm kiếm hiểu đúng
                trọng tâm bài viết.
              </p>
            )}
          </div>

          <div ref={setFieldRef("slug")}>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
              Slug
            </label>
            <input
              type="text"
              name="slug"
              value={formData.slug}
              onChange={handleSlugChange}
              placeholder="slug-duong-dan-bai-viet"
              className={`w-full rounded-xl border px-4 py-3 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 ${
                errors.slug
                  ? "border-red-500"
                  : "border-gray-300 dark:border-gray-600"
              }`}
            />
            {errors.slug ? (
              <p className="text-sm text-red-600 mt-1.5 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {errors.slug}
              </p>
            ) : (
              <p className="text-xs text-gray-500 mt-1.5">
                Slug dùng trong URL bài viết. Nếu bạn chưa sửa thủ công, hệ
                thống sẽ tự gợi ý từ tiêu đề.
              </p>
            )}
          </div>

          <div ref={setFieldRef("excerpt")}>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
              Excerpt / Mô tả ngắn
            </label>
            <textarea
              name="excerpt"
              rows={4}
              value={formData.excerpt}
              onChange={handleInputChange}
              placeholder="Dùng cho preview, card bài viết và SEO"
              className="w-full rounded-xl border border-gray-300 dark:border-gray-600 px-4 py-3 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            />
            <div className="mt-1.5 flex items-center justify-between gap-3">
              <p className="text-xs text-gray-500">
                Excerpt tốt nên tóm tắt được giá trị chính của bài viết trong
                1–2 câu.
              </p>
              <span
                className={`text-xs font-medium ${
                  normalizeText(formData.excerpt).length > 180
                    ? "text-amber-600"
                    : "text-gray-400"
                }`}
              >
                {normalizeText(formData.excerpt).length} ký tự
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
            <div ref={setFieldRef("post_category_id")}>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                Danh mục
              </label>
              <select
                name="post_category_id"
                value={formData.post_category_id}
                onChange={handleInputChange}
                className={`w-full rounded-xl border px-4 py-3 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 ${
                  errors.post_category_id
                    ? "border-red-500"
                    : "border-gray-300 dark:border-gray-600"
                }`}
              >
                <option value="">-- Chọn danh mục --</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name || category.title}
                  </option>
                ))}
              </select>
              {errors.post_category_id && (
                <p className="text-sm text-red-600 mt-1.5 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.post_category_id}
                </p>
              )}
            </div>

            <div ref={setFieldRef("position")}>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                Position
              </label>
              <input
                type="number"
                name="position"
                value={formData.position}
                onChange={handleInputChange}
                placeholder="Dùng để sắp xếp khi hiển thị"
                className={`w-full rounded-xl border px-4 py-3 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 ${
                  errors.position
                    ? "border-red-500"
                    : "border-gray-300 dark:border-gray-600"
                }`}
              />
              {errors.position ? (
                <p className="text-sm text-red-600 mt-1.5 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.position}
                </p>
              ) : (
                <p className="text-xs text-gray-500 mt-1.5">
                  Dùng để sắp xếp khi hiển thị ở các block nội dung.
                </p>
              )}
            </div>
          </div>

          <div ref={setFieldRef("tag_ids")}>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Tags
            </label>
            {tags.length > 0 ? (
              <div className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  {tags.map((tagItem) => {
                    const selected = formData.tag_ids.includes(tagItem.id);
                    return (
                      <button
                        key={tagItem.id}
                        type="button"
                        onClick={() => handleToggleTag(tagItem.id)}
                        className={`px-3 py-1.5 rounded-full border text-sm font-medium transition-colors ${
                          selected
                            ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                            : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:border-blue-400"
                        }`}
                      >
                        {tagItem.name}
                      </button>
                    );
                  })}
                </div>

                {selectedTags.length > 0 && (
                  <div className="rounded-2xl border border-blue-100 bg-blue-50/70 p-4">
                    <div className="text-xs font-semibold uppercase tracking-wider text-blue-700 mb-2">
                      Đã chọn
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {selectedTags.map((tagItem) => (
                        <span
                          key={tagItem.id}
                          className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm font-medium bg-white text-blue-700 border border-blue-200"
                        >
                          <Tag className="w-3.5 h-3.5" />
                          {tagItem.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {errors.tag_ids && (
                  <p className="text-sm text-red-600 mt-1.5 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.tag_ids}
                  </p>
                )}
              </div>
            ) : (
              <p className="text-sm text-gray-500 italic">
                Chưa có tag nào trong hệ thống.
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 pt-2">
            <div ref={setFieldRef("featured")}>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Bài viết nổi bật
              </label>
              <button
                type="button"
                onClick={() => {
                  setFormData((prev) => ({
                    ...prev,
                    featured: !prev.featured,
                  }));
                  clearError("featured");
                }}
                className={`w-full flex items-center justify-between rounded-2xl border px-4 py-3 transition-colors ${
                  formData.featured
                    ? "border-amber-300 bg-amber-50 text-amber-800"
                    : "border-gray-200 bg-white text-gray-700"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Star className="w-4 h-4" />
                  <div className="text-left">
                    <div className="text-sm font-semibold">
                      Đánh dấu là bài viết nổi bật
                    </div>
                    <div className="text-xs opacity-80">
                      Dùng cho các block ưu tiên hiển thị trên website
                    </div>
                  </div>
                </div>
                <div
                  className={`w-12 h-6 rounded-full p-1 transition-colors ${
                    formData.featured ? "bg-amber-400" : "bg-gray-300"
                  }`}
                >
                  <div
                    className={`w-4 h-4 bg-white rounded-full transition-transform ${
                      formData.featured ? "translate-x-6" : "translate-x-0"
                    }`}
                  />
                </div>
              </button>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Trạng thái nhanh
              </label>
              <div className="rounded-2xl border border-gray-200 bg-gray-50 p-3">
                <div
                  className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-semibold border ${statusBadgeClass(formData.status)}`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  {
                    STATUS_OPTIONS.find((s) => s.value === formData.status)
                      ?.label
                  }
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Thiết lập đầy đủ hơn ở tab Xuất bản & Liên kết.
                </p>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );

  const renderContentTab = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <Card className="p-6">
        <div className="mb-4">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">
            Nội dung bài viết
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            Đây là phần trọng tâm của workspace biên tập. Hãy giữ cấu trúc rõ,
            đoạn văn ngắn, heading mạch lạc và dễ quét.
          </p>
        </div>

        <div className="mb-5 rounded-2xl border border-blue-100 bg-blue-50/70 p-4">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-white text-blue-700 border border-blue-100 flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-blue-800">
                Gợi ý chất lượng nội dung
              </h4>
              <p className="text-sm text-blue-700 mt-1 leading-6">
                Mở bài nên đặt ngữ cảnh rõ, phần thân chia heading hợp lý, mỗi
                đoạn không quá dài, và nếu phù hợp có thể kết thúc bằng CTA nhẹ
                hoặc gợi ý sản phẩm liên quan.
              </p>
            </div>
          </div>
        </div>

        <div ref={setFieldRef("content")}>
          <div className="border border-gray-200 dark:border-gray-700 rounded-2xl overflow-hidden">
            <RichTextEditor
              value={formData.content}
              onChange={handleContentChange}
            />
          </div>

          {errors.content ? (
            <p className="text-sm text-red-600 mt-2 flex items-center gap-1">
              <AlertCircle className="w-4 h-4" />
              {errors.content}
            </p>
          ) : (
            <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-gray-500">
              <span>{contentWordCount} từ</span>
              {contentWordCount > 0 && contentWordCount < 120 && (
                <span className="inline-flex items-center gap-1 text-amber-600 font-medium">
                  <AlertCircle className="w-3.5 h-3.5" />
                  Nội dung còn khá ngắn
                </span>
              )}
              {contentWordCount === 0 && (
                <span className="inline-flex items-center gap-1 text-red-500 font-medium">
                  <AlertCircle className="w-3.5 h-3.5" />
                  Bài viết chưa có nội dung
                </span>
              )}
            </div>
          )}
        </div>
      </Card>
    </div>
  );

  const renderMediaTab = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <Card className="p-6">
        <div className="mb-6">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">
            Ảnh đại diện & Media
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            Thiết lập thumbnail và card preview để hình dung bài viết khi xuất
            hiện trên danh sách.
          </p>
        </div>

        <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-xl w-fit mb-6">
          <button
            type="button"
            onClick={() => {
              setThumbnailMethod("upload");
              clearError("thumbnail");
            }}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
              thumbnailMethod === "upload"
                ? "bg-white dark:bg-gray-700 text-blue-700 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <UploadCloud className="w-4 h-4" />
            Tải ảnh lên
          </button>
          <button
            type="button"
            onClick={() => {
              setThumbnailMethod("url");
              clearError("thumbnail");
            }}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
              thumbnailMethod === "url"
                ? "bg-white dark:bg-gray-700 text-blue-700 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <LinkIcon className="w-4 h-4" />
            Dùng URL
          </button>
        </div>

        <div ref={setFieldRef("thumbnail")}>
          {thumbnailMethod === "upload" ? (
            <div className="relative border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-2xl p-8 text-center hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors">
              <input
                type="file"
                accept="image/*"
                onChange={handleThumbnailSelect}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
              <div className="pointer-events-none flex flex-col items-center justify-center">
                <div className="w-16 h-16 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
                  <UploadCloud className="w-8 h-8" />
                </div>
                <p className="text-base font-semibold text-gray-800 dark:text-gray-200">
                  Kéo thả ảnh vào đây hoặc click để chọn
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  Hỗ trợ JPG, PNG, WEBP. Tối đa 5MB.
                </p>
              </div>
            </div>
          ) : (
            <div>
              <input
                type="url"
                value={formData.thumbnail}
                onChange={handleThumbnailUrlChange}
                placeholder="https://example.com/thumbnail.jpg"
                className={`w-full rounded-xl border px-4 py-3 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 ${
                  errors.thumbnail
                    ? "border-red-500"
                    : "border-gray-300 dark:border-gray-600"
                }`}
              />
              <p className="text-xs text-gray-500 mt-1.5">
                Dán URL ảnh đại diện nếu asset đã có sẵn trên CDN hoặc media
                server.
              </p>
            </div>
          )}

          {errors.thumbnail && (
            <p className="text-sm text-red-600 mt-2 flex items-center gap-1">
              <AlertCircle className="w-4 h-4" />
              {errors.thumbnail}
            </p>
          )}
        </div>

        <div className="mt-6 grid grid-cols-1 2xl:grid-cols-[360px_minmax(0,1fr)] gap-6">
          <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm font-semibold text-gray-800">
                Xem trước thumbnail
              </div>
              {resolvedThumbnail && (
                <button
                  type="button"
                  onClick={resetThumbnail}
                  className="inline-flex items-center gap-1 text-xs text-red-600 hover:text-red-700 font-medium"
                >
                  <X className="w-3.5 h-3.5" />
                  Xóa
                </button>
              )}
            </div>

            {resolvedThumbnail ? (
              <img
                src={resolvedThumbnail}
                alt="Thumbnail preview"
                className="w-full aspect-[16/10] object-cover rounded-xl border border-gray-200 bg-white"
              />
            ) : (
              <div className="w-full aspect-[16/10] rounded-xl border border-dashed border-gray-300 bg-white flex flex-col items-center justify-center text-gray-400">
                <ImageIcon className="w-8 h-8 mb-2" />
                <span className="text-sm font-medium">
                  Chưa có ảnh đại diện
                </span>
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-4">
            <div className="text-sm font-semibold text-gray-800 mb-3">
              Preview card
            </div>

            <div className="rounded-2xl overflow-hidden border border-gray-200 shadow-sm bg-white">
              <div className="aspect-[16/9] bg-gray-100">
                {resolvedThumbnail ? (
                  <img
                    src={resolvedThumbnail}
                    alt="Post card preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    <ImageIcon className="w-8 h-8" />
                  </div>
                )}
              </div>

              <div className="p-4">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  {selectedCategory ? (
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100">
                      {selectedCategory.name || selectedCategory.title}
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-500 border border-gray-200">
                      Chưa chọn danh mục
                    </span>
                  )}

                  <span
                    className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${statusBadgeClass(formData.status)}`}
                  >
                    {formData.status}
                  </span>
                </div>

                <h4 className="text-lg font-bold text-gray-900 line-clamp-2">
                  {normalizeText(formData.title) ||
                    "Tiêu đề bài viết sẽ hiển thị ở đây"}
                </h4>

                <p className="text-sm text-gray-600 mt-2 line-clamp-3 leading-6">
                  {normalizeText(formData.excerpt) ||
                    "Excerpt sẽ xuất hiện tại đây để mô phỏng card preview của bài viết."}
                </p>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );

  const renderSeoTab = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <Card className="p-6">
        <div className="mb-5">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">
            SEO & Metadata
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            Tối ưu cách bài viết xuất hiện trên công cụ tìm kiếm và social
            preview.
          </p>
        </div>

        <div className="space-y-5">
          <div ref={setFieldRef("seo_title")}>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
              SEO Title
            </label>
            <input
              type="text"
              name="seo_title"
              value={formData.seo_title}
              onChange={handleInputChange}
              placeholder="Tiêu đề tối ưu cho công cụ tìm kiếm"
              className="w-full rounded-xl border border-gray-300 dark:border-gray-600 px-4 py-3 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            />
            <div className="mt-1.5 flex items-center justify-between">
              <p className="text-xs text-gray-500">
                Nếu để trống, hệ thống sẽ dùng title hiện tại làm fallback.
              </p>
              <span
                className={`text-xs font-medium ${
                  normalizeText(formData.seo_title).length > 65
                    ? "text-amber-600"
                    : "text-gray-400"
                }`}
              >
                {normalizeText(formData.seo_title).length} ký tự
              </span>
            </div>
          </div>

          <div ref={setFieldRef("seo_description")}>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
              SEO Description
            </label>
            <textarea
              name="seo_description"
              rows={4}
              value={formData.seo_description}
              onChange={handleInputChange}
              placeholder="Mô tả ngắn hiển thị trên Google/social preview"
              className="w-full rounded-xl border border-gray-300 dark:border-gray-600 px-4 py-3 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            />
            <div className="mt-1.5 flex items-center justify-between">
              <p className="text-xs text-gray-500">
                Nếu để trống, excerpt hiện tại sẽ được dùng làm fallback.
              </p>
              <span
                className={`text-xs font-medium ${
                  normalizeText(formData.seo_description).length > 160
                    ? "text-amber-600"
                    : "text-gray-400"
                }`}
              >
                {normalizeText(formData.seo_description).length} ký tự
              </span>
            </div>
          </div>

          <div ref={setFieldRef("seo_keywords")}>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
              SEO Keywords
            </label>
            <input
              type="text"
              name="seo_keywords"
              value={formData.seo_keywords}
              onChange={handleInputChange}
              placeholder="Ví dụ: trái cây mùa hè, cách chọn xoài, dinh dưỡng"
              className="w-full rounded-xl border border-gray-300 dark:border-gray-600 px-4 py-3 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div ref={setFieldRef("canonical_url")}>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
              Canonical URL
            </label>
            <input
              type="url"
              name="canonical_url"
              value={formData.canonical_url}
              onChange={handleInputChange}
              placeholder="https://example.com/bai-viet-goc"
              className={`w-full rounded-xl border px-4 py-3 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 ${
                errors.canonical_url
                  ? "border-red-500"
                  : "border-gray-300 dark:border-gray-600"
              }`}
            />
            {errors.canonical_url ? (
              <p className="text-sm text-red-600 mt-1.5 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {errors.canonical_url}
              </p>
            ) : (
              <p className="text-xs text-gray-500 mt-1.5">
                Chỉ dùng khi cần tránh trùng lặp nội dung giữa nhiều URL.
              </p>
            )}
          </div>

          <div ref={setFieldRef("og_image")}>
            <div className="flex items-center justify-between gap-3 mb-1.5">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                OG Image
              </label>
              <button
                type="button"
                onClick={() => {
                  setOgUseThumbnail(true);
                  setFormData((prev) => ({
                    ...prev,
                    og_image: resolvedThumbnail || "",
                  }));
                }}
                className="text-xs font-medium text-blue-600 hover:text-blue-700"
              >
                Dùng thumbnail hiện tại
              </button>
            </div>

            <input
              type="url"
              name="og_image"
              value={formData.og_image}
              onChange={(e) => {
                setOgUseThumbnail(false);
                handleInputChange(e);
              }}
              placeholder="https://example.com/og-image.jpg"
              className={`w-full rounded-xl border px-4 py-3 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 ${
                errors.og_image
                  ? "border-red-500"
                  : "border-gray-300 dark:border-gray-600"
              }`}
            />

            <label className="mt-3 inline-flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
              <input
                type="checkbox"
                checked={ogUseThumbnail}
                onChange={(e) => setOgUseThumbnail(e.target.checked)}
                className="rounded border-gray-300"
              />
              Dùng thumbnail làm OG image mặc định
            </label>

            {errors.og_image && (
              <p className="text-sm text-red-600 mt-1.5 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {errors.og_image}
              </p>
            )}
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <div className="mb-4">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">
            SEO Preview
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            Mô phỏng cách bài viết có thể xuất hiện trên trang kết quả tìm kiếm.
          </p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5">
          <div className="text-[#1a0dab] text-[22px] leading-7 font-medium hover:underline cursor-default">
            {derivedSeoTitle || "SEO title sẽ hiển thị tại đây"}
          </div>

          <div className="mt-1 text-sm text-[#006621] flex items-center gap-2 break-all">
            <ExternalLink className="w-3.5 h-3.5 shrink-0" />
            {normalizeText(formData.canonical_url) ||
              `yourdomain.com/${normalizeText(formData.slug) || "duong-dan-bai-viet"}`}
          </div>

          <p className="mt-2 text-[15px] leading-6 text-[#4d5156]">
            {derivedSeoDescription ||
              "SEO description hoặc excerpt sẽ xuất hiện tại đây để mô phỏng meta description."}
          </p>

          {derivedOgImage && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <div className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
                OG preview image
              </div>
              <img
                src={derivedOgImage}
                alt="OG Preview"
                className="w-full max-w-sm aspect-[1.91/1] rounded-xl object-cover border border-gray-200"
              />
            </div>
          )}
        </div>
      </Card>
    </div>
  );

  const renderPublishTab = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <Card className="p-6">
        <div className="mb-5">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">
            Publish settings
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            Quyết định trạng thái xuất bản, thời điểm lên bài và mối liên kết
            với các sản phẩm liên quan.
          </p>
        </div>

        <div className="space-y-6">
          <div ref={setFieldRef("status")}>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Trạng thái
            </label>
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
              {STATUS_OPTIONS.map((option) => {
                const selected = formData.status === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => {
                      setFormData((prev) => ({
                        ...prev,
                        status: option.value,
                      }));
                      clearError("status");
                    }}
                    className={`rounded-2xl border px-4 py-4 text-left transition-colors ${
                      selected
                        ? `${option.tone} shadow-sm`
                        : "border-gray-200 bg-white hover:bg-gray-50 text-gray-700"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="text-sm font-bold">{option.label}</div>
                        <div className="text-xs mt-1 opacity-80">
                          {option.hint}
                        </div>
                      </div>
                      {selected && <CheckCircle2 className="w-5 h-5" />}
                    </div>
                  </button>
                );
              })}
            </div>
            {errors.status && (
              <p className="text-sm text-red-600 mt-2 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {errors.status}
              </p>
            )}
          </div>

          <div ref={setFieldRef("published_at")}>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
              Published At
            </label>
            <input
              type="datetime-local"
              name="published_at"
              value={formData.published_at}
              onChange={handleInputChange}
              className={`w-full xl:max-w-sm rounded-xl border px-4 py-3 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 ${
                errors.published_at
                  ? "border-red-500"
                  : "border-gray-300 dark:border-gray-600"
              }`}
            />
            {errors.published_at ? (
              <p className="text-sm text-red-600 mt-1.5 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {errors.published_at}
              </p>
            ) : (
              <p className="text-xs text-gray-500 mt-1.5">
                Nếu status là Published và bạn chưa nhập thời điểm, hệ thống sẽ
                tự dùng thời điểm hiện tại khi submit.
              </p>
            )}
          </div>
        </div>
      </Card>

      <Card className="p-6" ref={setFieldRef("related_product_ids")}>
        <div className="mb-5">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">
            Related Products
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            Liên kết bài viết với các sản phẩm liên quan để tăng tính điều hướng
            và khả năng chuyển đổi.
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Danh sách hiện đang tải sẵn từ hệ thống. Nếu dữ liệu sản phẩm tăng
            lớn, nên chuyển sang remote search để tối ưu hiệu năng.
          </p>
        </div>

        <div className="grid grid-cols-1 2xl:grid-cols-[minmax(0,1fr)_420px] gap-6">
          <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Tìm kiếm sản phẩm
            </label>
            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                placeholder="Tìm theo tên sản phẩm hoặc SKU"
                className="w-full rounded-xl border border-gray-300 bg-white pl-10 pr-4 py-3 text-sm text-gray-900 focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="mt-4 space-y-3 max-h-[420px] overflow-auto pr-1">
              {filteredProducts.length > 0 ? (
                filteredProducts.map((product) => (
                  <div
                    key={product.id}
                    className="rounded-2xl border border-gray-200 bg-white p-3 flex items-center gap-3"
                  >
                    <div className="w-14 h-14 rounded-xl overflow-hidden border border-gray-200 bg-gray-100 shrink-0">
                      {product.thumbnail ? (
                        <img
                          src={product.thumbnail}
                          alt={product.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          <Package className="w-5 h-5" />
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-semibold text-gray-900 line-clamp-2">
                        {product.title}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {product.sku ? `SKU: ${product.sku}` : "Không có SKU"}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleAddProduct(product.id)}
                      className="inline-flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-semibold bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-100"
                    >
                      <Plus className="w-4 h-4" />
                      Thêm
                    </button>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-6 text-center text-sm text-gray-500">
                  Không tìm thấy sản phẩm phù hợp.
                </div>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-4">
            <div className="flex items-center justify-between gap-3 mb-3">
              <h4 className="text-sm font-bold text-gray-900">
                Sản phẩm đã liên kết
              </h4>
              <span className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold bg-gray-100 text-gray-700 border border-gray-200">
                {selectedProducts.length} sản phẩm
              </span>
            </div>

            {selectedProducts.length > 0 ? (
              <div className="space-y-3">
                {selectedProducts.map((product) => (
                  <div
                    key={product.id}
                    className="rounded-2xl border border-gray-200 bg-gray-50 p-3 flex items-center gap-3"
                  >
                    <div className="w-14 h-14 rounded-xl overflow-hidden border border-gray-200 bg-white shrink-0">
                      {product.thumbnail ? (
                        <img
                          src={product.thumbnail}
                          alt={product.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          <Package className="w-5 h-5" />
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-semibold text-gray-900 line-clamp-2">
                        {product.title}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {product.status || "inactive"}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveProduct(product.id)}
                      className="w-9 h-9 rounded-lg border border-gray-200 bg-white hover:bg-red-50 hover:border-red-200 text-gray-500 hover:text-red-600 flex items-center justify-center transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-6 text-center">
                <Layers3 className="w-7 h-7 text-gray-400 mx-auto mb-2" />
                <p className="text-sm font-medium text-gray-700">
                  Chưa có sản phẩm liên kết
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Chọn sản phẩm ở khung bên trái để thêm vào bài viết.
                </p>
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  );

  const renderSidebarPanel = () => (
    <div className="space-y-5 xl:sticky xl:top-6">
      <Card className="p-5 border-t-4 border-t-blue-500 shadow-lg">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              Mức độ hoàn thiện
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              Theo dõi tiến độ trước khi xuất bản.
            </p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-extrabold text-blue-600">
              {readiness.percentage}%
            </div>
            <div className="text-xs text-gray-400 uppercase tracking-wider">
              Progress
            </div>
          </div>
        </div>

        <div className="w-full h-2.5 bg-gray-200 rounded-full overflow-hidden mb-5">
          <div
            className="h-full bg-blue-600 rounded-full transition-all duration-500"
            style={{ width: `${readiness.percentage}%` }}
          />
        </div>

        <div className="space-y-2">
          {readiness.checks.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                if (!item.passed) setActiveTab(item.tab);
              }}
              className={`w-full text-left rounded-xl px-3 py-2.5 transition-colors ${
                item.passed
                  ? "hover:bg-gray-50"
                  : "hover:bg-red-50 group cursor-pointer"
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`mt-0.5 w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
                    item.passed
                      ? "bg-emerald-100 text-emerald-600"
                      : "bg-gray-100 text-gray-400 group-hover:bg-red-100 group-hover:text-red-500"
                  }`}
                >
                  {item.passed ? (
                    <Check className="w-3.5 h-3.5" />
                  ) : (
                    <div className="w-1.5 h-1.5 rounded-full bg-current" />
                  )}
                </div>
                <div>
                  <div
                    className={`text-sm font-medium ${
                      item.passed
                        ? "text-gray-900 dark:text-gray-200"
                        : "text-gray-500 group-hover:text-red-600"
                    }`}
                  >
                    {item.label}
                  </div>
                  {!item.passed && (
                    <div className="text-xs text-gray-400 mt-0.5">
                      Nhấn để hoàn thiện
                    </div>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      </Card>

      <Card className="p-5">
        <div className="flex items-start gap-3 mb-4">
          <div
            className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
              publishBlockingIssues.length === 0
                ? "bg-emerald-50 text-emerald-600 border border-emerald-100"
                : "bg-amber-50 text-amber-600 border border-amber-100"
            }`}
          >
            {publishBlockingIssues.length === 0 ? (
              <CheckCircle2 className="w-5 h-5" />
            ) : (
              <AlertCircle className="w-5 h-5" />
            )}
          </div>
          <div>
            <h3 className="text-base font-bold text-gray-900 dark:text-white">
              Publish checklist
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              {publishBlockingIssues.length === 0
                ? "Bài viết đã đạt mức tối thiểu để submit."
                : "Cần bổ sung trước khi submit chính thức."}
            </p>
          </div>
        </div>

        {publishBlockingIssues.length === 0 ? (
          <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-sm text-emerald-700 font-medium">
            Ready to publish. Bạn vẫn nên xem lại các cảnh báo mềm bên dưới để
            tối ưu chất lượng hiển thị.
          </div>
        ) : (
          <div className="space-y-2">
            {publishBlockingIssues.map((issue) => (
              <div
                key={issue}
                className="rounded-xl border border-amber-100 bg-amber-50 px-3 py-2 text-sm text-amber-700"
              >
                {issue}
              </div>
            ))}
          </div>
        )}

        {softWarnings.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
              Soft warnings
            </div>
            <div className="space-y-2">
              {softWarnings.slice(0, 5).map((warning) => (
                <div
                  key={warning}
                  className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-600"
                >
                  {warning}
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>

      <Card className="p-5">
        <h3 className="text-base font-bold text-gray-900 dark:text-white mb-4">
          Quick summary
        </h3>

        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3 text-sm">
            <span className="text-gray-500">Danh mục</span>
            <span className="font-medium text-gray-900 text-right">
              {selectedCategory?.name || "Chưa chọn"}
            </span>
          </div>
          <div className="flex items-center justify-between gap-3 text-sm">
            <span className="text-gray-500">Tags</span>
            <span className="font-medium text-gray-900">
              {formData.tag_ids.length}
            </span>
          </div>
          <div className="flex items-center justify-between gap-3 text-sm">
            <span className="text-gray-500">Related products</span>
            <span className="font-medium text-gray-900">
              {formData.related_product_ids.length}
            </span>
          </div>
          <div className="flex items-center justify-between gap-3 text-sm">
            <span className="text-gray-500">Trạng thái</span>
            <span
              className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${statusBadgeClass(formData.status)}`}
            >
              {formData.status}
            </span>
          </div>
          <div className="flex items-center justify-between gap-3 text-sm">
            <span className="text-gray-500">Featured</span>
            <span className="font-medium text-gray-900">
              {formData.featured ? "Có" : "Không"}
            </span>
          </div>
          <div className="flex items-start justify-between gap-3 text-sm">
            <span className="text-gray-500">Published at</span>
            <span className="font-medium text-gray-900 text-right">
              {formatDateTimeDisplay(formData.published_at)}
            </span>
          </div>
        </div>
      </Card>

      <Card className="p-5">
        <h3 className="text-base font-bold text-gray-900 dark:text-white mb-4">
          Hành động nhanh
        </h3>

        <div className="space-y-3">
          <button
            type="button"
            onClick={handleSaveDraft}
            disabled={isBusy}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 px-4 py-3 text-sm font-semibold text-gray-700 shadow-sm transition-colors"
          >
            {savingDraft ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Clock3 className="w-4 h-4" />
            )}
            Lưu nháp
          </button>

          <button
            type="button"
            onClick={() => void handleSubmit()}
            disabled={isBusy}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 px-4 py-3 text-sm font-bold text-white shadow-md transition-colors"
          >
            {submitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
            Tạo bài viết
          </button>

          <button
            type="button"
            disabled
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-medium text-gray-400 cursor-not-allowed"
          >
            <Eye className="w-4 h-4" />
            Xem trước
          </button>
        </div>
      </Card>
    </div>
  );

  if (bootLoading) {
    return (
      <div className="w-full max-w-[1600px] mx-auto py-16">
        <div className="rounded-3xl border border-gray-200 bg-white p-10 shadow-sm">
          <div className="flex items-center gap-3 text-gray-700">
            <Loader2 className="w-5 h-5 animate-spin" />
            Đang chuẩn bị Content Studio...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[1600px] mx-auto pb-12">
      {renderHeader()}

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        <div className="xl:col-span-8 2xl:col-span-9 space-y-6">
          {renderTabs()}

          <form onSubmit={handleSubmit}>
            {activeTab === "basic" && renderBasicTab()}
            {activeTab === "content" && renderContentTab()}
            {activeTab === "media" && renderMediaTab()}
            {activeTab === "seo" && renderSeoTab()}
            {activeTab === "publish" && renderPublishTab()}
          </form>
        </div>

        <div className="xl:col-span-4 2xl:col-span-3">
          {renderSidebarPanel()}
        </div>
      </div>
    </div>
  );
};

export default PostCreatePage;
