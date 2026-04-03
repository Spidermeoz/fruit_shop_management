// src/pages/admin/ProductEditPage.tsx
import React, { useEffect, useState, useMemo, useRef } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import {
  Loader2,
  Save,
  ArrowLeft,
  Plus,
  Sparkles,
  Trash2,
  Info,
  FileText,
  Image as ImageIcon,
  Layers,
  CheckCircle,
  AlertCircle,
  UploadCloud,
  Link as LinkIcon,
  Check,
  X,
  Eye,
  RefreshCcw,
  ImageOff,
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

// =============================
// TYPES
// =============================
interface Origin {
  id: number;
  name: string;
  slug?: string | null;
  status: string;
}
interface ProductTag {
  id: number;
  name: string;
  slug?: string | null;
  productTagGroupId?: number | null;
  tagGroup?: string | null;
  group?: { id: number; name: string; slug?: string | null } | null;
  deleted?: boolean;
}
interface ProductCategory {
  id: number;
  title: string;
  parent_id?: number | null;
  children?: ProductCategory[];
  position: number;
  status: string;
}
interface ProductOptionValueInput {
  id?: number;
  value: string;
  position?: number;
}
interface ProductOptionInput {
  id?: number;
  name: string;
  position?: number;
  values: ProductOptionValueInput[];
}
interface ProductVariantSelectedOptionValue {
  id?: number;
  value: string;
  optionId?: number;
  optionName?: string;
  position?: number;
}
interface ProductVariantInput {
  id?: number;
  sku?: string | null;
  title?: string | null;
  price: number | string;
  compareAtPrice?: number | string | null;
  status?: string;
  sortOrder?: number;
  optionValueIds?: number[];
  optionValues?: ProductVariantSelectedOptionValue[];
}

interface Product {
  id: number;
  title: string;
  description: string;
  product_category_id: number | string;
  origin_id: number | string;
  tag_ids: number[];
  short_description: string;
  storage_guide: string;
  usage_suggestions: string;
  nutrition_notes: string;
  price: number | string;
  stock: number | string;
  thumbnail: string;
  status: "active" | "inactive";
  featured: number;
  position: number | string;
  slug: string;
  options?: ProductOptionInput[];
  variants?: ProductVariantInput[];
  category?: { title: string } | null;
  origin?: { name: string } | null;
}

// =============================
// HELPERS
// =============================
function normalizeProductTag(raw: any): ProductTag {
  const resolvedGroup =
    raw.group && typeof raw.group === "object"
      ? {
          id: Number(raw.group.id),
          name: String(raw.group.name ?? ""),
          slug: raw.group.slug ?? null,
        }
      : null;
  const resolvedTagGroupName =
    typeof raw.tagGroup === "string"
      ? raw.tagGroup
      : typeof raw.tag_group === "string"
        ? raw.tag_group
        : (resolvedGroup?.name ?? null);
  return {
    id: Number(raw.id),
    name: String(raw.name ?? ""),
    slug: raw.slug ?? null,
    productTagGroupId:
      raw.productTagGroupId != null
        ? Number(raw.productTagGroupId)
        : raw.product_tag_group_id != null
          ? Number(raw.product_tag_group_id)
          : (resolvedGroup?.id ?? null),
    tagGroup: resolvedTagGroupName,
    group: resolvedGroup,
    deleted: Boolean(raw.deleted ?? false),
  };
}

const normalizeTextForCompare = (value: string) =>
  String(value ?? "")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();
const slugifyVariantPart = (value: string | undefined) =>
  String(value ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toUpperCase();
const buildVariantCombinationKey = (
  optionValues: ProductVariantSelectedOptionValue[],
) => {
  return [...optionValues]
    .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
    .map(
      (item) =>
        `${normalizeTextForCompare(item.optionName ?? "")}:${normalizeTextForCompare(item.value ?? "")}`,
    )
    .join("|");
};
const buildVariantCartesian = (
  options: ProductOptionInput[],
): ProductVariantSelectedOptionValue[][] => {
  const normalizedOptions = options
    .map((option, optionIndex) => ({
      ...option,
      position: option.position ?? optionIndex,
      values: (option.values || [])
        .map((value, valueIndex) => ({
          ...value,
          position: value.position ?? valueIndex,
        }))
        .filter((value) => String(value.value ?? "").trim()),
    }))
    .filter(
      (option) =>
        String(option.name ?? "").trim() &&
        Array.isArray(option.values) &&
        option.values.length > 0,
    );
  if (!normalizedOptions.length) return [];
  return normalizedOptions.reduce<ProductVariantSelectedOptionValue[][]>(
    (acc, option, optionIndex) => {
      const mappedValues = option.values.map((value) => ({
        id: value.id,
        value: value.value,
        optionId: option.id,
        optionName: option.name,
        position: option.position ?? optionIndex,
      }));
      if (!acc.length) return mappedValues.map((value) => [value]);
      return acc.flatMap((existing) =>
        mappedValues.map((value) => [...existing, value]),
      );
    },
    [],
  );
};

type TabKey = "basic" | "content" | "media" | "variants" | "publish";

const TABS: { id: TabKey; label: string; icon: React.FC<any> }[] = [
  { id: "basic", label: "Thông tin cơ bản", icon: Info },
  { id: "content", label: "Nội dung", icon: FileText },
  { id: "media", label: "Hình ảnh", icon: ImageIcon },
  { id: "variants", label: "Tùy chọn & Biến thể", icon: Layers },
  { id: "publish", label: "Xuất bản", icon: CheckCircle },
];

const getOptionErrorKey = (optionIndex: number, field: "name") =>
  `options.${optionIndex}.${field}`;

const getOptionValueErrorKey = (optionIndex: number, valueIndex: number) =>
  `options.${optionIndex}.values.${valueIndex}.value`;

const getVariantErrorKey = (variantIndex: number, field: string) =>
  `variants.${variantIndex}.${field}`;

const ProductEditPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [searchParams, setSearchParams] = useSearchParams();

  const validTabs: TabKey[] = [
    "basic",
    "content",
    "media",
    "variants",
    "publish",
  ];
  const tabQuery = searchParams.get("tab") as TabKey;
  const initialTab = validTabs.includes(tabQuery) ? tabQuery : "basic";

  const [activeTab, setActiveTab] = useState<TabKey>(initialTab);

  useEffect(() => {
    const currentTab = searchParams.get("tab") as TabKey;
    if (validTabs.includes(currentTab) && currentTab !== activeTab) {
      setActiveTab(currentTab);
    } else if (!currentTab && activeTab !== "basic") {
      setActiveTab("basic");
    }
  }, [searchParams]);

  const handleTabChange = (tabId: TabKey) => {
    setActiveTab(tabId);
    // Dùng replace: true để không làm rác lịch sử trình duyệt khi click tab liên tục
    setSearchParams({ tab: tabId }, { replace: true });
  };
  const [product, setProduct] = useState<Product | null>(null);
  const [initialProduct, setInitialProduct] = useState<Product | null>(null);

  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [origins, setOrigins] = useState<Origin[]>([]);
  const [tags, setTags] = useState<ProductTag[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [fetchError, setFetchError] = useState("");
  const [formErrors, setFormErrors] = useState<
    Partial<Record<keyof Product | string, string>>
  >({});
  const fieldRefs = useRef<Record<string, HTMLElement | null>>({});

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewImage, setPreviewImage] = useState<string>("");
  const [imageMethod, setImageMethod] = useState<"upload" | "url" | "keep">(
    "keep",
  );
  const [imageUrl, setImageUrl] = useState<string>("");

  const { showSuccessToast, showErrorToast } = useAdminToast();

  // --- FETCH DATA ---
  const fetchProduct = async () => {
    try {
      setLoading(true);
      const json = await http<any>(`GET`, `/api/v1/admin/products/edit/${id}`);
      if (json.success && json.data) {
        const data = json.data;
        const normalized: Product = {
          ...data,
          product_category_id:
            data.product_category_id ?? data.categoryId ?? "",
          origin_id: data.origin_id ?? data.originId ?? data.origin?.id ?? "",
          tag_ids: Array.isArray(data.tagIds)
            ? data.tagIds
                .map(Number)
                .filter((id: number) => Number.isInteger(id) && id > 0)
            : Array.isArray(data.tags)
              ? data.tags
                  .map((t: any) => Number(t.id))
                  .filter((id: number) => Number.isInteger(id) && id > 0)
              : [],
          short_description:
            data.short_description ?? data.shortDescription ?? "",
          storage_guide: data.storage_guide ?? data.storageGuide ?? "",
          usage_suggestions:
            data.usage_suggestions ?? data.usageSuggestions ?? "",
          nutrition_notes: data.nutrition_notes ?? data.nutritionNotes ?? "",
          options: Array.isArray(data.options)
            ? data.options.map((o: any, index: number) => ({
                id: o.id,
                name: o.name ?? "",
                position: o.position ?? index,
                values: Array.isArray(o.values)
                  ? o.values.map((v: any, valueIndex: number) => ({
                      id: v.id,
                      value: v.value ?? "",
                      position: v.position ?? valueIndex,
                    }))
                  : [],
              }))
            : [],
          variants: Array.isArray(data.variants)
            ? data.variants.map((v: any, index: number) => ({
                id: v.id,
                sku: v.sku ?? null,
                title: v.title ?? null,
                price: v.price ?? 0,
                compareAtPrice: v.compareAtPrice ?? v.compare_at_price ?? null,
                status: v.status ?? "active",
                sortOrder: v.sortOrder ?? v.sort_order ?? index,
                optionValueIds: Array.isArray(v.optionValueIds)
                  ? v.optionValueIds
                  : [],
                optionValues: Array.isArray(v.optionValues)
                  ? v.optionValues.map((ov: any) => ({
                      id: ov.id,
                      value: ov.value ?? "",
                      optionId: ov.optionId,
                      optionName: ov.optionName ?? "",
                      position: ov.position,
                    }))
                  : [],
              }))
            : [],
        };

        setProduct(normalized);
        setInitialProduct(normalized);
        setPreviewImage(normalized.thumbnail);
      } else {
        setFetchError(json.message || "Không tìm thấy sản phẩm.");
      }
    } catch (err) {
      setFetchError(err instanceof Error ? err.message : "Lỗi kết nối server.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchDicts = async () => {
      try {
        const [catRes, originRes, tagRes] = await Promise.all([
          http<any>("GET", "/api/v1/admin/product-category?limit=100"),
          http<any>("GET", "/api/v1/admin/origins?limit=100"),
          http<any>("GET", "/api/v1/admin/product-tags?limit=1000"),
        ]);

        if (catRes.success)
          setCategories(
            catRes.data.map((c: any) => ({ ...c, parent_id: c.parentId })),
          );
        if (originRes.success)
          setOrigins(originRes.data.filter((o: any) => o.status === "active"));

        const rows = Array.isArray(tagRes?.data)
          ? tagRes.data
          : Array.isArray(tagRes?.data?.items)
            ? tagRes.data.items
            : Array.isArray(tagRes?.items)
              ? tagRes.items
              : [];
        if (tagRes.success && rows.length > 0) {
          setTags(
            rows
              .map(normalizeProductTag)
              .filter(
                (tag: ProductTag) => !tag.deleted && tag.id > 0 && !!tag.name,
              ),
          );
        }
      } catch (err) {
        console.error("Fetch Dicts error:", err);
      }
    };
    fetchDicts();
  }, []);

  useEffect(() => {
    fetchProduct();
  }, [id]);

  const groupedTags = useMemo(() => {
    return tags.reduce(
      (acc, tag) => {
        const groupName = tag.tagGroup || "Khác";
        if (!acc[groupName]) acc[groupName] = [];
        acc[groupName].push(tag);
        return acc;
      },
      {} as Record<string, ProductTag[]>,
    );
  }, [tags]);

  // --- DIRTY TRACKING ---
  const dirtyState = useMemo(() => {
    if (!product || !initialProduct) return { isDirty: false, sections: [] };
    const changedSections: string[] = [];

    if (
      product.title !== initialProduct.title ||
      String(product.product_category_id) !==
        String(initialProduct.product_category_id) ||
      String(product.origin_id) !== String(initialProduct.origin_id) ||
      product.status !== initialProduct.status ||
      Number(product.featured) !== Number(initialProduct.featured) ||
      JSON.stringify([...(product.tag_ids || [])].sort()) !==
        JSON.stringify([...(initialProduct.tag_ids || [])].sort())
    )
      changedSections.push("Thông tin cơ bản");

    if (
      product.description !== initialProduct.description ||
      product.short_description !== initialProduct.short_description ||
      product.storage_guide !== initialProduct.storage_guide ||
      product.usage_suggestions !== initialProduct.usage_suggestions
    )
      changedSections.push("Nội dung");
    if (
      (imageMethod === "upload" && selectedFile !== null) ||
      (imageMethod === "url" &&
        imageUrl !== "" &&
        imageUrl !== initialProduct.thumbnail) ||
      (imageMethod === "keep" && !previewImage && initialProduct.thumbnail)
    )
      changedSections.push("Hình ảnh");
    if (
      JSON.stringify(product.options) !==
        JSON.stringify(initialProduct.options) ||
      JSON.stringify(product.variants) !==
        JSON.stringify(initialProduct.variants)
    )
      changedSections.push("Biến thể");

    return { isDirty: changedSections.length > 0, sections: changedSections };
  }, [
    product,
    initialProduct,
    selectedFile,
    imageMethod,
    imageUrl,
    previewImage,
  ]);

  const isDirty = dirtyState.isDirty;

  // --- READINESS PANEL ---
  const readiness = useMemo(() => {
    if (!product) return { checks: [], percentage: 0 };
    const checks = [
      {
        id: "title",
        label: "Tên sản phẩm",
        passed: !!product.title.trim(),
        tab: "basic" as TabKey,
      },
      {
        id: "category",
        label: "Danh mục",
        passed: !!product.product_category_id,
        tab: "basic" as TabKey,
      },
      {
        id: "thumbnail",
        label: "Ảnh minh họa",
        passed:
          !!previewImage ||
          (imageMethod === "url" && !!imageUrl) ||
          (imageMethod === "keep" && !!product.thumbnail),
        tab: "media" as TabKey,
      },
      {
        id: "desc",
        label: "Mô tả chi tiết",
        passed:
          !!product.description.trim() && product.description !== "<p><br></p>",
        tab: "content" as TabKey,
      },
      {
        id: "variants",
        label: "Biến thể hợp lệ",
        passed:
          (product.variants || []).length > 0 &&
          (product.variants || []).every((v) => v.title && Number(v.price) > 0),
        tab: "variants" as TabKey,
      },
    ];
    const passedCount = checks.filter((c) => c.passed).length;
    return {
      checks,
      percentage: Math.round((passedCount / checks.length) * 100),
    };
  }, [product, previewImage, imageMethod, imageUrl]);

  // --- INPUT HANDLERS ---
  const setFieldRef = (key: string) => (element: HTMLElement | null) => {
    fieldRefs.current[key] = element;
  };
  const clearError = (key: string) => {
    setFormErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const getTabForField = (fieldKey: string): TabKey => {
    if (
      fieldKey.startsWith("title") ||
      fieldKey.startsWith("product_category_id")
    )
      return "basic";
    if (
      fieldKey.startsWith("short_description") ||
      fieldKey.startsWith("description")
    )
      return "content";
    if (fieldKey.startsWith("thumbnail")) return "media";
    if (
      fieldKey.startsWith("options") ||
      fieldKey.startsWith("variants") ||
      fieldKey.startsWith("variant-card")
    )
      return "variants";
    return "basic";
  };

  const scrollToFirstError = (
    errors: Partial<Record<keyof Product | string, string>>,
  ) => {
    const firstKey = Object.keys(errors)[0];
    if (!firstKey) return;
    const targetTab = getTabForField(firstKey);
    if (activeTab !== targetTab) handleTabChange(targetTab);
    setTimeout(() => {
      const target = fieldRefs.current[firstKey];
      if (target) {
        target.scrollIntoView({ behavior: "smooth", block: "center" });
        const focusable =
          target.querySelector<HTMLElement>(
            "input, select, textarea, button, [contenteditable='true']",
          ) || target;
        if (typeof (focusable as any).focus === "function")
          (focusable as any).focus();
      }
    }, 150);
  };

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => {
    const { name, type, value } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setProduct((prev) =>
      prev
        ? { ...prev, [name]: type === "checkbox" ? (checked ? 1 : 0) : value }
        : prev,
    );
    clearError(name);
  };

  const handleToggleTag = (tagId: number) => {
    setProduct((prev) => {
      if (!prev) return prev;
      const currentTags = prev.tag_ids || [];
      const newTagIds = currentTags.includes(tagId)
        ? currentTags.filter((id) => id !== tagId)
        : [...currentTags, tagId];
      return { ...prev, tag_ids: [...new Set(newTagIds)] };
    });
  };

  // --- VARIANTS HANDLERS ---
  const handleVariantChange = (
    index: number,
    field: keyof ProductVariantInput,
    value: any,
  ) => {
    setProduct((prev) => {
      if (!prev) return prev;
      const newVariants = [...(prev.variants || [])];
      newVariants[index] = { ...newVariants[index], [field]: value };
      return { ...prev, variants: newVariants };
    });
    clearError(`variants.${index}.${String(field)}`);
    clearError(`variant-card-${index}`);
  };

  const addVariant = () => {
    setProduct((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        variants: [
          ...(prev.variants || []),
          {
            title: "",
            price: "0",
            status: "active",
            sortOrder: (prev.variants || []).length,
            optionValueIds: [],
            optionValues: [],
          },
        ],
      };
    });
  };

  const removeVariant = (index: number) => {
    setProduct((prev) =>
      prev
        ? {
            ...prev,
            variants: (prev.variants || []).filter((_, i) => i !== index),
          }
        : prev,
    );
  };

  const suggestVariants = () => {
    setProduct((prev) => {
      if (!prev) return prev;
      const productTitle = String(prev.title ?? "").trim();
      const combinations = buildVariantCartesian(prev.options || []);
      const totalOptions = (prev.options || []).filter(
        (o) =>
          String(o.name ?? "").trim() &&
          Array.isArray(o.values) &&
          o.values.some((v) => String(v.value ?? "").trim()),
      ).length;
      if (!combinations.length || totalOptions === 0) return prev;

      const existingVariants = prev.variants || [];
      const exactVariantMap = new Map<string, ProductVariantInput>();
      existingVariants.forEach((variant) => {
        if ((variant.optionValues || []).length === totalOptions)
          exactVariantMap.set(
            buildVariantCombinationKey(variant.optionValues || []),
            variant,
          );
      });

      const nextVariants: ProductVariantInput[] = combinations.map(
        (combination, index) => {
          const key = buildVariantCombinationKey(combination);
          const exactVariant = exactVariantMap.get(key);
          // Note: Lược bớt hàm template search phức tạp cho brevity, dùng exact match hoặc copy giá cơ bản
          const combinationLabel = combination
            .map((item) => `${item.optionName}: ${item.value}`)
            .join(" - ");
          const autoTitle = [productTitle, combinationLabel]
            .filter(Boolean)
            .join(" - ");
          const autoSku = [
            productTitle,
            ...combination.flatMap((item) => [item.optionName, item.value]),
          ]
            .map(slugifyVariantPart)
            .filter(Boolean)
            .join("-");

          return {
            id: exactVariant?.id,
            title: autoTitle || exactVariant?.title || `Biến thể ${index + 1}`,
            sku: autoSku || exactVariant?.sku || null,
            price: exactVariant?.price ?? prev.price ?? "0",
            compareAtPrice: exactVariant?.compareAtPrice ?? "",
            status: exactVariant?.status ?? "active",
            sortOrder: index,
            optionValueIds: combination
              .map((item, optionIndex) => item.id ?? optionIndex)
              .filter(
                (valueId): valueId is number => typeof valueId === "number",
              ),
            optionValues: combination,
          };
        },
      );
      return { ...prev, variants: nextVariants };
    });
    setFormErrors((prev) => ({
      ...prev,
      options: undefined,
      variants: undefined,
      price: undefined,
    }));
  };

  const handleOptionChange = (
    optionIndex: number,
    field: keyof ProductOptionInput,
    value: any,
  ) => {
    setProduct((prev) => {
      if (!prev) return prev;
      const nextOptions = [...(prev.options || [])];
      const oldName = nextOptions[optionIndex]?.name ?? "";
      nextOptions[optionIndex] = {
        ...nextOptions[optionIndex],
        [field]: value,
      };
      const nextVariants =
        field === "name"
          ? (prev.variants || []).map((variant) => ({
              ...variant,
              optionValues: (variant.optionValues || []).map((ov) =>
                ov.optionName === oldName ? { ...ov, optionName: value } : ov,
              ),
            }))
          : prev.variants || [];
      return { ...prev, options: nextOptions, variants: nextVariants };
    });
    clearError(`options.${optionIndex}.name`);
  };

  const handleOptionValueChange = (
    optionIndex: number,
    valueIndex: number,
    value: string,
  ) => {
    setProduct((prev) => {
      if (!prev) return prev;
      const nextOptions = [...(prev.options || [])];
      const option = { ...nextOptions[optionIndex] };
      const oldValue = option.values[valueIndex]?.value ?? "";
      const values = [...option.values];
      values[valueIndex] = { ...values[valueIndex], value };
      option.values = values;
      nextOptions[optionIndex] = option;
      const nextVariants = (prev.variants || []).map((variant) => ({
        ...variant,
        optionValues: (variant.optionValues || []).map((ov) =>
          ov.optionName === option.name && ov.value === oldValue
            ? { ...ov, value }
            : ov,
        ),
      }));
      return { ...prev, options: nextOptions, variants: nextVariants };
    });
    clearError(`options.${optionIndex}.values.${valueIndex}.value`);
  };

  const addOption = () =>
    setProduct((prev) =>
      prev
        ? {
            ...prev,
            options: [
              ...(prev.options || []),
              {
                name: "",
                position: (prev.options || []).length,
                values: [{ value: "", position: 0 }],
              },
            ],
          }
        : prev,
    );
  const removeOption = (optionIndex: number) => {
    setProduct((prev) => {
      if (!prev) return prev;
      const nextOptions = (prev.options || []).filter(
        (_, i) => i !== optionIndex,
      );
      const remainingValueIds = new Set(
        nextOptions.flatMap((o) => o.values.map((v) => v.id)).filter(Boolean),
      );
      const removedOption = (prev.options || [])[optionIndex];
      const nextVariants = (prev.variants || []).map((variant) => ({
        ...variant,
        optionValueIds: (variant.optionValueIds || []).filter((id) =>
          remainingValueIds.has(id),
        ),
        optionValues: (variant.optionValues || []).filter(
          (ov) => ov.optionName !== removedOption?.name,
        ),
      }));
      return { ...prev, options: nextOptions, variants: nextVariants };
    });
  };

  const addOptionValue = (optionIndex: number) => {
    setProduct((prev) => {
      if (!prev) return prev;
      const nextOptions = [...(prev.options || [])];
      nextOptions[optionIndex] = {
        ...nextOptions[optionIndex],
        values: [
          ...nextOptions[optionIndex].values,
          { value: "", position: nextOptions[optionIndex].values.length },
        ],
      };
      return { ...prev, options: nextOptions };
    });
  };
  const removeOptionValue = (optionIndex: number, valueIndex: number) => {
    setProduct((prev) => {
      if (!prev) return prev;
      const nextOptions = [...(prev.options || [])];
      const removed = nextOptions[optionIndex].values[valueIndex];
      nextOptions[optionIndex] = {
        ...nextOptions[optionIndex],
        values: nextOptions[optionIndex].values.filter(
          (_, i) => i !== valueIndex,
        ),
      };
      const nextVariants = (prev.variants || []).map((variant) => ({
        ...variant,
        optionValueIds: (variant.optionValueIds || []).filter(
          (id) => id !== removed?.id,
        ),
        optionValues: (variant.optionValues || []).filter(
          (ov) =>
            !(
              ov.optionName === nextOptions[optionIndex].name &&
              ov.value === removed?.value
            ),
        ),
      }));
      return { ...prev, options: nextOptions, variants: nextVariants };
    });
  };

  const toggleVariantOptionValue = (
    variantIndex: number,
    optionIdOrTempIndex: number,
    valueIdOrTempKey: number,
  ) => {
    setProduct((prev) => {
      if (!prev) return prev;
      const nextVariants = [...(prev.variants || [])];
      const option = (prev.options || []).find(
        (o, idx) => (o.id ?? idx) === optionIdOrTempIndex,
      );
      const targetValue = option?.values.find(
        (v, idx) => (v.id ?? idx) === valueIdOrTempKey,
      );
      if (
        !option ||
        !targetValue ||
        !String(option.name ?? "").trim() ||
        !String(targetValue.value ?? "").trim()
      )
        return prev;

      const currentIds = [...(nextVariants[variantIndex].optionValueIds || [])];
      const optionValueKeys = option.values.map((v, idx) => v.id ?? idx);
      const nextIds = currentIds.filter((id) => !optionValueKeys.includes(id));
      nextIds.push(targetValue.id ?? valueIdOrTempKey);

      const nextOptionValues = (
        nextVariants[variantIndex].optionValues || []
      ).filter((ov) => ov.optionName !== option.name);
      nextOptionValues.push({
        id: targetValue.id,
        value: targetValue.value,
        optionId: option.id,
        optionName: option.name,
        position: targetValue.position,
      });

      nextVariants[variantIndex] = {
        ...nextVariants[variantIndex],
        optionValueIds: nextIds,
        optionValues: nextOptionValues,
      };
      return { ...prev, variants: nextVariants };
    });
    clearError(`variants.${variantIndex}.optionValues`);
  };

  // --- IMAGE HANDLERS ---
  const handleImageSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (
      !["image/jpeg", "image/png", "image/webp", "image/gif"].includes(
        file.type,
      )
    ) {
      setFormErrors((p) => ({
        ...p,
        thumbnail: "Chỉ hỗ trợ file ảnh (jpg, png, webp, gif).",
      }));
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setFormErrors((p) => ({
        ...p,
        thumbnail: "Ảnh không được lớn hơn 5MB.",
      }));
      return;
    }
    setSelectedFile(file);
    setPreviewImage(URL.createObjectURL(file));
    clearError("thumbnail");
  };

  // --- VALIDATION & SUBMIT ---
  const validateForm = () => {
    if (!product) return false;
    const newErrors: Partial<Record<keyof Product | string, string>> = {};

    if (!String(product.title ?? "").trim())
      newErrors.title = "Vui lòng nhập tên sản phẩm.";
    if (!product.product_category_id)
      newErrors.product_category_id = "Vui lòng chọn danh mục.";

    (product.options || []).forEach((option, optionIndex) => {
      if (!String(option.name ?? "").trim())
        newErrors[`options.${optionIndex}.name`] =
          "Vui lòng nhập tên tùy chọn.";
      if (!option.values.length)
        newErrors[`options.${optionIndex}.name`] =
          "Mỗi tùy chọn cần ít nhất 1 giá trị.";
      const seenValues = new Set<string>();
      option.values.forEach((value, valueIndex) => {
        const valStr = String(value.value ?? "").trim();
        if (!valStr) {
          newErrors[`options.${optionIndex}.values.${valueIndex}.value`] =
            "Vui lòng nhập giá trị.";
          return;
        }
        const norm = normalizeTextForCompare(valStr);
        if (seenValues.has(norm))
          newErrors[`options.${optionIndex}.values.${valueIndex}.value`] =
            "Giá trị bị trùng.";
        seenValues.add(norm);
      });
    });

    const variants = product.variants || [];
    if (!variants.length)
      newErrors[`variants.0.title`] = "Cần ít nhất 1 biến thể.";
    const combinationMap = new Map<string, number>();

    variants.forEach((variant, variantIndex) => {
      const title = String(variant.title ?? "").trim();
      const priceStr = String(variant.price ?? "").trim();
      const compareStr = String(variant.compareAtPrice ?? "").trim();
      const price = Number(variant.price);
      const compare = compareStr === "" ? null : Number(variant.compareAtPrice);
      const cardKey = `variant-card-${variantIndex}`;

      if (!title) {
        newErrors[`variants.${variantIndex}.title`] =
          "Vui lòng nhập tên biến thể.";
        newErrors[cardKey] = newErrors[cardKey] || "Thiếu thông tin";
      }
      if (!priceStr || !Number.isFinite(price) || price <= 0) {
        newErrors[`variants.${variantIndex}.price`] = "Giá bán phải > 0.";
        newErrors[cardKey] = newErrors[cardKey] || "Thiếu thông tin";
      }
      if (compareStr !== "") {
        if (!Number.isFinite(compare) || Number(compare) < 0) {
          newErrors[`variants.${variantIndex}.compareAtPrice`] =
            "Giá so sánh >= 0.";
          newErrors[cardKey] = newErrors[cardKey] || "Thiếu thông tin";
        } else if (Number.isFinite(price) && Number(compare) < price) {
          newErrors[`variants.${variantIndex}.compareAtPrice`] =
            "Giá so sánh không được nhỏ hơn giá bán.";
          newErrors[cardKey] = newErrors[cardKey] || "Thiếu thông tin";
        }
      }

      const activeOptions = (product.options || []).filter(
        (o) => o.name && o.values.some((v) => v.value),
      );
      if (activeOptions.length > 0) {
        const selectedValues = (variant.optionValues || []).filter(
          (item) => item.optionName && item.value,
        );
        if (selectedValues.length !== activeOptions.length) {
          newErrors[`variants.${variantIndex}.optionValues`] =
            "Phải chọn đủ tổ hợp giá trị.";
          newErrors[cardKey] = newErrors[cardKey] || "Thiếu thông tin";
        } else {
          const key = buildVariantCombinationKey(selectedValues as any);
          if (combinationMap.has(key)) {
            newErrors[`variants.${variantIndex}.optionValues`] =
              "Tổ hợp bị trùng lặp.";
            newErrors[cardKey] = newErrors[cardKey] || "Thiếu thông tin";
          } else combinationMap.set(key, variantIndex);
        }
      }
    });

    setFormErrors(newErrors);
    if (Object.keys(newErrors).length > 0) scrollToFirstError(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async (e?: FormEvent) => {
    if (e) e.preventDefault();
    if (!product || !isDirty) return;
    if (!validateForm()) return;

    try {
      setSaving(true);
      setFormErrors({});
      let thumbnailUrl = product.thumbnail;

      if (imageMethod === "upload" && selectedFile) {
        const formDataImg = new FormData();
        formDataImg.append("file", selectedFile);
        const dataUpload = await http<any>(
          "POST",
          "/api/v1/admin/upload",
          formDataImg,
        );
        if (dataUpload.success && dataUpload.data?.url)
          thumbnailUrl = dataUpload.data.url;
        else if (dataUpload.url) thumbnailUrl = dataUpload.url;
        else {
          setFormErrors({ thumbnail: "Lỗi tải ảnh lên máy chủ." });
          setSaving(false);
          return;
        }
      } else if (imageMethod === "url" && imageUrl) thumbnailUrl = imageUrl;
      else if (imageMethod === "keep" && !previewImage) thumbnailUrl = "";

      const updatedDescription = await uploadImagesInContent(
        product.description,
      );
      const updatedStorageGuide = await uploadImagesInContent(
        product.storage_guide,
      );
      const updatedUsageSuggestions = await uploadImagesInContent(
        product.usage_suggestions,
      );
      const updatedNutritionNotes = await uploadImagesInContent(
        product.nutrition_notes,
      );

      const payload: any = {
        ...product,
        thumbnail: thumbnailUrl,
        description: updatedDescription,
        storageGuide: updatedStorageGuide,
        usageSuggestions: updatedUsageSuggestions,
        nutritionNotes: updatedNutritionNotes,
        shortDescription: product.short_description || null,
        tagIds: [...new Set((product.tag_ids || []).map(Number))].filter(
          (id) => Number.isInteger(id) && id > 0,
        ),
        price: Number(product.price),
        position: product.position === "" ? null : Number(product.position),
        featured: Boolean(Number(product.featured)),
      };

      if (payload.product_category_id !== undefined) {
        payload.categoryId =
          payload.product_category_id === ""
            ? null
            : Number(payload.product_category_id);
        delete payload.product_category_id;
      }
      if (payload.origin_id !== undefined) {
        payload.originId =
          payload.origin_id === "" ? null : Number(payload.origin_id);
        delete payload.origin_id;
      }

      delete payload.short_description;
      delete payload.storage_guide;
      delete payload.usage_suggestions;
      delete payload.nutrition_notes;
      delete payload.tag_ids;

      payload.options = (product.options || []).map((o, idx) => ({
        id: o.id,
        name: o.name,
        position: o.position ?? idx,
        values: o.values.map((v, vIdx) => ({
          id: v.id,
          value: v.value,
          position: v.position ?? vIdx,
        })),
      }));
      payload.variants = (product.variants || []).map((v, idx) => ({
        id: v.id,
        sku: v.sku ?? null,
        title: v.title ?? null,
        price: Number(v.price),
        compareAtPrice:
          v.compareAtPrice !== undefined &&
          v.compareAtPrice !== null &&
          v.compareAtPrice !== ""
            ? Number(v.compareAtPrice)
            : null,
        status: v.status ?? "active",
        sortOrder: v.sortOrder ?? idx,
        optionValueIds: Array.isArray(v.optionValueIds) ? v.optionValueIds : [],
        optionValues: Array.isArray(v.optionValues)
          ? v.optionValues.map((ov) => ({
              id: ov.id,
              value: ov.value,
              optionId: ov.optionId,
              optionName: ov.optionName,
              position: ov.position,
            }))
          : [],
      }));

      if (payload.variants.length > 0 && !payload.price)
        payload.price = payload.variants[0].price;

      const json = await http<any>(
        "PATCH",
        `/api/v1/admin/products/edit/${id}`,
        payload,
      );
      if (json.success) {
        showSuccessToast({ message: "Cập nhật sản phẩm thành công!" });
        fetchProduct();
        setImageMethod("keep");
        setSelectedFile(null);
        setImageUrl("");
      } else {
        if (json.errors) {
          setFormErrors(json.errors);
          scrollToFirstError(json.errors);
        } else showErrorToast(json.message || "Cập nhật thất bại.");
      }
    } catch (err: any) {
      showErrorToast(err?.message || "Lỗi hệ thống khi cập nhật.");
    } finally {
      setSaving(false);
    }
  };

  // --- RENDER SECTIONS ---
  const renderBasicInfo = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <Card className="p-6">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
          Định danh sản phẩm
        </h3>
        <div className="space-y-5">
          <div ref={setFieldRef("title") as React.Ref<HTMLDivElement>}>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
              Tên sản phẩm <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="title"
              value={product?.title || ""}
              onChange={handleChange}
              className={`w-full border ${formErrors.title ? "border-red-500" : "border-gray-300 dark:border-gray-600"} rounded-lg p-3 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 transition-shadow`}
            />
            {formErrors.title && (
              <p className="text-sm text-red-600 mt-1.5 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {formErrors.title}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div
              ref={
                setFieldRef("product_category_id") as React.Ref<HTMLDivElement>
              }
            >
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                Danh mục <span className="text-red-500">*</span>
              </label>
              <select
                name="product_category_id"
                value={product?.product_category_id || ""}
                onChange={handleChange}
                className={`w-full border ${formErrors.product_category_id ? "border-red-500" : "border-gray-300 dark:border-gray-600"} rounded-lg p-3 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500`}
              >
                <option value="" disabled>
                  -- Chọn danh mục --
                </option>
                {renderCategoryOptions(buildCategoryTree(categories))}
              </select>
              {formErrors.product_category_id && (
                <p className="text-sm text-red-600 mt-1.5 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {formErrors.product_category_id}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                Xuất xứ
              </label>
              <select
                name="origin_id"
                value={product?.origin_id || ""}
                onChange={handleChange}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg p-3 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              >
                <option value="">-- Chọn xuất xứ --</option>
                {origins.map((origin) => (
                  <option key={origin.id} value={origin.id}>
                    {origin.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
          Phân loại & Trạng thái
        </h3>
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
              Thẻ sản phẩm (Tags)
            </label>
            {Object.keys(groupedTags).length > 0 ? (
              <div className="space-y-5">
                {Object.entries(groupedTags).map(([group, groupTags]) => (
                  <div
                    key={group}
                    className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-xl border border-gray-100 dark:border-gray-700"
                  >
                    <h4 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
                      {group}
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {groupTags.map((tag) => {
                        const isSelected = (product?.tag_ids || []).includes(
                          tag.id,
                        );
                        return (
                          <button
                            key={tag.id}
                            type="button"
                            onClick={() => handleToggleTag(tag.id)}
                            className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${isSelected ? "bg-blue-600 text-white border-blue-600 shadow-sm" : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:border-blue-400"}`}
                          >
                            {tag.name}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 italic">
                Chưa có thẻ sản phẩm nào trong hệ thống.
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-4 border-t border-gray-100 dark:border-gray-700">
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Trạng thái
              </label>
              <div className="flex gap-4 bg-gray-50 dark:bg-gray-800 p-2 rounded-lg border border-gray-200 dark:border-gray-700 w-fit">
                <label
                  className={`flex items-center space-x-2 cursor-pointer px-3 py-1.5 rounded-md transition-colors ${product?.status === "active" ? "bg-white dark:bg-gray-700 shadow-sm" : ""}`}
                >
                  <input
                    type="radio"
                    name="status"
                    value="active"
                    checked={product?.status === "active"}
                    onChange={handleChange}
                    className="text-blue-600 focus:ring-blue-500 w-4 h-4"
                  />
                  <span
                    className={`text-sm font-medium ${product?.status === "active" ? "text-blue-700 dark:text-blue-400" : "text-gray-600 dark:text-gray-400"}`}
                  >
                    Kinh doanh
                  </span>
                </label>
                <label
                  className={`flex items-center space-x-2 cursor-pointer px-3 py-1.5 rounded-md transition-colors ${product?.status === "inactive" ? "bg-white dark:bg-gray-700 shadow-sm" : ""}`}
                >
                  <input
                    type="radio"
                    name="status"
                    value="inactive"
                    checked={product?.status === "inactive"}
                    onChange={handleChange}
                    className="text-red-500 focus:ring-red-500 w-4 h-4"
                  />
                  <span
                    className={`text-sm font-medium ${product?.status === "inactive" ? "text-red-600 dark:text-red-400" : "text-gray-600 dark:text-gray-400"}`}
                  >
                    Ngừng bán
                  </span>
                </label>
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Đánh dấu nổi bật
              </label>
              <label className="flex items-center space-x-2 cursor-pointer mt-3">
                <input
                  type="checkbox"
                  name="featured"
                  value={1}
                  checked={Number(product?.featured) === 1}
                  onChange={(e) =>
                    setProduct((p) =>
                      p ? { ...p, featured: e.target.checked ? 1 : 0 } : p,
                    )
                  }
                  className="rounded text-amber-500 focus:ring-amber-500 w-5 h-5"
                />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Hiện trên mục Nổi Bật
                </span>
              </label>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Vị trí ưu tiên
              </label>
              <input
                type="number"
                name="position"
                value={product?.position || ""}
                onChange={handleChange}
                placeholder="Mặc định xếp cuối"
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg p-2.5 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      </Card>
    </div>
  );

  const renderContent = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <Card className="p-6">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
          Mô tả tổng quan
        </h3>
        <textarea
          name="short_description"
          rows={3}
          value={product?.short_description || ""}
          onChange={handleChange}
          placeholder="Đoạn văn ngắn gọn thu hút hiển thị ở đầu trang..."
          className="w-full border border-gray-300 dark:border-gray-600 rounded-lg p-3 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
        />
      </Card>
      <Card className="p-6">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
          Bài viết chi tiết
        </h3>
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
          <RichTextEditor
            value={product?.description || ""}
            onChange={(c) =>
              setProduct((p) => (p ? { ...p, description: c } : p))
            }
          />
        </div>
      </Card>
      <Card className="p-6">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
          Thông tin bổ sung
        </h3>
        <div className="space-y-8">
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Hướng dẫn bảo quản
            </label>
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
              <RichTextEditor
                value={product?.storage_guide || ""}
                onChange={(c) =>
                  setProduct((p) => (p ? { ...p, storage_guide: c } : p))
                }
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Gợi ý sử dụng
            </label>
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
              <RichTextEditor
                value={product?.usage_suggestions || ""}
                onChange={(c) =>
                  setProduct((p) => (p ? { ...p, usage_suggestions: c } : p))
                }
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Ghi chú dinh dưỡng / Cảnh báo
            </label>
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
              <RichTextEditor
                value={product?.nutrition_notes || ""}
                onChange={(c) =>
                  setProduct((p) => (p ? { ...p, nutrition_notes: c } : p))
                }
              />
            </div>
          </div>
        </div>
      </Card>
    </div>
  );

  const renderMedia = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6 border-b border-gray-100 dark:border-gray-800 pb-4">
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              Thay đổi hình ảnh
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              Ảnh chính hiển thị trên danh mục và chi tiết sản phẩm.
            </p>
          </div>
          {dirtyState.sections.includes("Hình ảnh") && (
            <span className="bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-xs font-bold">
              Chưa lưu thay đổi
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-lg w-full mb-6">
              {[
                { id: "keep", label: "Giữ ảnh cũ", icon: ImageIcon },
                { id: "upload", label: "Tải ảnh mới", icon: UploadCloud },
                { id: "url", label: "Dùng URL", icon: LinkIcon },
              ].map((mode) => (
                <button
                  key={mode.id}
                  type="button"
                  onClick={() => setImageMethod(mode.id as any)}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-md text-sm font-medium transition-all ${imageMethod === mode.id ? "bg-white dark:bg-gray-700 text-blue-600 shadow-sm" : "text-gray-500 hover:text-gray-900 dark:hover:text-white"}`}
                >
                  <mode.icon className="w-4 h-4" />{" "}
                  <span className="hidden sm:inline">{mode.label}</span>
                </button>
              ))}
            </div>

            <div className="min-h-[200px]">
              {imageMethod === "keep" && (
                <div className="h-full flex flex-col items-center justify-center text-gray-500 bg-gray-50 dark:bg-gray-800/50 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                  <ImageIcon className="w-10 h-10 mb-2 opacity-50" />
                  <p className="text-sm font-medium">
                    Đang sử dụng ảnh gốc của sản phẩm.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setImageMethod("upload");
                      setPreviewImage("");
                      setSelectedFile(null);
                    }}
                    className="mt-4 text-blue-600 hover:underline text-sm font-semibold"
                  >
                    Muốn đổi ảnh?
                  </button>
                </div>
              )}

              {imageMethod === "upload" && (
                <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-8 text-center hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors relative h-full flex flex-col justify-center">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageSelect}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <div className="pointer-events-none">
                    <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/30 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-3">
                      <UploadCloud className="w-6 h-6" />
                    </div>
                    <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                      Kéo thả ảnh hoặc click để duyệt
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Hỗ trợ JPG, PNG, WEBP (Max 5MB)
                    </p>
                  </div>
                </div>
              )}

              {imageMethod === "url" && (
                <div className="h-full">
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Đường dẫn hình ảnh
                  </label>
                  <input
                    ref={
                      setFieldRef("thumbnail") as React.Ref<HTMLInputElement>
                    }
                    type="url"
                    placeholder="https://example.com/image.jpg"
                    value={imageUrl}
                    onChange={(e) => {
                      setImageUrl(e.target.value);
                      setPreviewImage(e.target.value);
                      clearError("thumbnail");
                    }}
                    className={`w-full border ${formErrors.thumbnail ? "border-red-500" : "border-gray-300 dark:border-gray-600"} rounded-lg p-3 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500`}
                  />
                  {formErrors.thumbnail && (
                    <p className="text-sm text-red-600 mt-2 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {formErrors.thumbnail}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-700 flex flex-col items-center justify-center">
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 w-full text-center">
              Bản xem trước
            </h4>
            {previewImage ||
            (imageMethod === "keep" && initialProduct?.thumbnail) ? (
              <div className="relative group">
                <img
                  src={previewImage || initialProduct?.thumbnail}
                  alt="Preview"
                  className="h-64 w-64 object-cover rounded-xl shadow-md border-4 border-white dark:border-gray-800"
                />
                {imageMethod !== "keep" && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedFile(null);
                      setImageUrl("");
                      setPreviewImage(initialProduct?.thumbnail || "");
                      setImageMethod("keep");
                    }}
                    className="absolute -top-3 -right-3 bg-gray-800 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-gray-900 transition-colors shadow-lg opacity-0 group-hover:opacity-100"
                  >
                    <RefreshCcw className="w-4 h-4" />
                  </button>
                )}
              </div>
            ) : (
              <div className="h-64 w-64 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl flex flex-col items-center justify-center text-gray-400">
                <ImageOff className="w-12 h-12 mb-2 opacity-50" />
                <p className="text-sm font-medium">Chưa có ảnh</p>
              </div>
            )}
            <p className="text-sm text-gray-500 mt-6 font-medium">
              {imageMethod === "keep"
                ? "Ảnh đang được sử dụng trên gian hàng"
                : "Ảnh mới sẽ thay thế ảnh cũ khi lưu"}
            </p>
          </div>
        </div>
      </Card>
    </div>
  );

  const renderVariants = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* SECTION 1: Lớp Option Builder */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              Thuộc tính phân loại
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              Nếu thay đổi thuộc tính, bạn có thể cần Tạo lại biến thể phía
              dưới.
            </p>
          </div>
          <button
            type="button"
            onClick={addOption}
            className="flex items-center gap-2 text-sm bg-blue-50 text-blue-700 hover:bg-blue-100 px-4 py-2 rounded-lg font-medium transition-colors"
          >
            <Plus className="w-4 h-4" /> Thêm thuộc tính
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {(product?.options || []).map((option, optionIndex) => (
            <div
              key={option.id ?? optionIndex}
              className="border border-gray-200 dark:border-gray-700 rounded-xl p-5 bg-gray-50 dark:bg-gray-800/30 relative group"
            >
              <button
                type="button"
                onClick={() => removeOption(optionIndex)}
                disabled={(product?.options || []).length === 1}
                className="absolute top-4 right-4 text-gray-400 hover:text-red-500 disabled:opacity-30 transition-colors"
              >
                <Trash2 className="w-5 h-5" />
              </button>

              <div className="mb-4 pr-8">
                <div
                  ref={
                    setFieldRef(
                      getOptionErrorKey(optionIndex, "name"),
                    ) as React.Ref<HTMLDivElement>
                  }
                >
                  <input
                    type="text"
                    value={option.name}
                    onChange={(e) =>
                      handleOptionChange(optionIndex, "name", e.target.value)
                    }
                    placeholder="Tên thuộc tính (VD: Màu sắc)"
                    className={`w-full border-b-2 bg-transparent text-lg font-bold text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 pb-1 ${formErrors[getOptionErrorKey(optionIndex, "name")] ? "border-red-500" : "border-gray-300 dark:border-gray-600"}`}
                  />
                  {formErrors[getOptionErrorKey(optionIndex, "name")] && (
                    <p className="text-xs text-red-600 mt-1">
                      {formErrors[getOptionErrorKey(optionIndex, "name")]}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase">
                  Giá trị phân loại
                </label>
                {option.values.map((value, valueIndex) => (
                  <div
                    key={value.id ?? valueIndex}
                    ref={
                      setFieldRef(
                        getOptionValueErrorKey(optionIndex, valueIndex),
                      ) as React.Ref<HTMLDivElement>
                    }
                    className="flex items-center gap-2"
                  >
                    <input
                      type="text"
                      value={value.value}
                      onChange={(e) =>
                        handleOptionValueChange(
                          optionIndex,
                          valueIndex,
                          e.target.value,
                        )
                      }
                      placeholder="Nhập giá trị"
                      className={`flex-1 border rounded-md p-2 text-sm bg-white dark:bg-gray-900 focus:ring-1 focus:ring-blue-500 ${formErrors[getOptionValueErrorKey(optionIndex, valueIndex)] ? "border-red-500" : "border-gray-300 dark:border-gray-600"}`}
                    />
                    <button
                      type="button"
                      onClick={() => removeOptionValue(optionIndex, valueIndex)}
                      disabled={option.values.length === 1}
                      className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md disabled:opacity-30"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => addOptionValue(optionIndex)}
                  className="text-sm text-blue-600 hover:text-blue-800 font-medium mt-2 flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" /> Thêm giá trị
                </button>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* SECTION 2 & 3: Variant Matrix */}
      <Card className="p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              Ma trận biến thể
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              Cập nhật giá, mã SKU, và trạng thái kinh doanh của từng loại sản
              phẩm.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={addVariant}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Thêm dòng
            </button>
            <button
              type="button"
              onClick={suggestVariants}
              className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-all"
              title="Ghi đè lại tên/SKU nếu có thay đổi Option bên trên"
            >
              <RefreshCcw className="w-4 h-4" /> Đồng bộ & Tạo mới
            </button>
          </div>
        </div>

        {formErrors["variants.0.title"] && (
          <div className="mb-4 p-3 bg-red-50 text-red-600 border border-red-100 rounded-lg text-sm font-medium flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            {formErrors["variants.0.title"]}
          </div>
        )}

        <div className="space-y-5">
          {(product?.variants || []).map((variant, index) => {
            const hasError = !!formErrors[`variant-card-${index}`];
            const isExisting = !!variant.id;

            return (
              <div
                key={variant.id || `temp-${index}`}
                ref={
                  setFieldRef(
                    `variant-card-${index}`,
                  ) as React.Ref<HTMLDivElement>
                }
                className={`border rounded-xl p-5 transition-colors relative ${hasError ? "border-red-400 bg-red-50/20 shadow-sm" : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"}`}
              >
                <div className="absolute -top-3 left-4 flex gap-2">
                  <span
                    className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${isExisting ? "bg-gray-100 text-gray-600 border-gray-200" : "bg-emerald-100 text-emerald-700 border-emerald-200"}`}
                  >
                    {isExisting ? "Đã lưu" : "Tạo mới"}
                  </span>
                  {hasError && (
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-red-100 text-red-600 border border-red-200 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> Cần sửa lỗi
                    </span>
                  )}
                </div>

                <div className="flex justify-between items-start mb-4 mt-2">
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-xs font-semibold text-gray-500 mb-1.5">
                        Tên biến thể <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={variant.title || ""}
                        onChange={(e) =>
                          handleVariantChange(index, "title", e.target.value)
                        }
                        placeholder="VD: Áo Thun - Đỏ - Size L"
                        className={`w-full border rounded-lg p-2.5 text-sm font-medium ${formErrors[getVariantErrorKey(index, "title")] ? "border-red-500" : "border-gray-300 dark:border-gray-600"} focus:ring-1 focus:ring-blue-500`}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 mb-1.5">
                        Mã SKU
                      </label>
                      <input
                        type="text"
                        value={variant.sku || ""}
                        onChange={(e) =>
                          handleVariantChange(index, "sku", e.target.value)
                        }
                        placeholder="Tự động hoặc nhập tay"
                        className="w-full border border-gray-300 dark:border-gray-600 rounded-lg p-2.5 text-sm uppercase focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeVariant(index)}
                    disabled={(product?.variants || []).length === 1}
                    className="ml-4 p-2.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors mt-6"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-5 mb-5">
                  <div className="md:col-span-1">
                    <label className="block text-xs font-semibold text-gray-500 mb-1.5">
                      Giá bán thực (VNĐ) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      value={variant.price}
                      onChange={(e) =>
                        handleVariantChange(index, "price", e.target.value)
                      }
                      className={`w-full border rounded-lg p-2.5 text-sm font-semibold text-blue-700 dark:text-blue-400 ${formErrors[getVariantErrorKey(index, "price")] ? "border-red-500" : "border-gray-300 dark:border-gray-600 bg-blue-50 dark:bg-gray-900"}`}
                    />
                  </div>
                  <div className="md:col-span-1">
                    <label className="block text-xs font-semibold text-gray-500 mb-1.5">
                      Giá niêm yết (VNĐ)
                    </label>
                    <input
                      type="number"
                      value={variant.compareAtPrice || ""}
                      onChange={(e) =>
                        handleVariantChange(
                          index,
                          "compareAtPrice",
                          e.target.value,
                        )
                      }
                      placeholder="Tạo giá gạch ngang"
                      className={`w-full border rounded-lg p-2.5 text-sm ${formErrors[getVariantErrorKey(index, "compareAtPrice")] ? "border-red-500" : "border-gray-300 dark:border-gray-600"}`}
                    />
                  </div>
                  <div className="md:col-span-2 flex items-end pb-1">
                    <label
                      className={`flex items-center space-x-2 cursor-pointer px-4 py-2.5 rounded-lg border transition-colors ${variant.status === "active" ? "bg-emerald-50 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800" : "bg-gray-50 border-gray-200 dark:bg-gray-800 dark:border-gray-700"}`}
                    >
                      <input
                        type="checkbox"
                        checked={variant.status === "active"}
                        onChange={(e) =>
                          handleVariantChange(
                            index,
                            "status",
                            e.target.checked ? "active" : "inactive",
                          )
                        }
                        className="rounded text-emerald-600 focus:ring-emerald-500 w-5 h-5"
                      />
                      <span
                        className={`text-sm font-bold ${variant.status === "active" ? "text-emerald-700 dark:text-emerald-400" : "text-gray-500"}`}
                      >
                        Đang kinh doanh biến thể này
                      </span>
                    </label>
                  </div>
                </div>

                <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
                  <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-3">
                    Tổ hợp thuộc tính bắt buộc
                  </p>
                  <div className="flex flex-wrap gap-x-8 gap-y-4">
                    {(product?.options || []).map((option, optionIndex) => {
                      if (!option.name) return null;
                      return (
                        <div
                          key={option.id ?? optionIndex}
                          className="flex flex-col gap-2"
                        >
                          <span className="text-xs text-gray-500 font-semibold">
                            {option.name}:
                          </span>
                          <div className="flex flex-wrap gap-2">
                            {option.values
                              .filter((v) => v.value)
                              .map((value, valueIndex) => {
                                const isSelected = (
                                  variant.optionValues || []
                                ).some(
                                  (ov) =>
                                    String(ov.optionName).trim() ===
                                      String(option.name).trim() &&
                                    String(ov.value).trim() ===
                                      String(value.value).trim(),
                                );
                                return (
                                  <button
                                    key={value.id ?? valueIndex}
                                    type="button"
                                    onClick={() =>
                                      toggleVariantOptionValue(
                                        index,
                                        option.id ?? optionIndex,
                                        value.id ?? valueIndex,
                                      )
                                    }
                                    className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all border shadow-sm ${isSelected ? "bg-indigo-600 text-white border-indigo-600 hover:bg-indigo-700" : "bg-white text-gray-600 border-gray-200 hover:border-indigo-300 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300"}`}
                                  >
                                    {value.value}
                                  </button>
                                );
                              })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  {formErrors[getVariantErrorKey(index, "optionValues")] && (
                    <p className="text-sm text-red-600 mt-3 font-medium bg-red-100/50 p-2 rounded-md border border-red-200 flex items-center gap-1.5">
                      <AlertCircle className="w-4 h-4" />
                      {formErrors[getVariantErrorKey(index, "optionValues")]}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );

  const renderReview = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <Card className="p-8 border-2 border-dashed border-blue-200 dark:border-blue-800 bg-gradient-to-b from-blue-50/50 to-white dark:from-gray-800 dark:to-gray-900">
        <div className="flex flex-col items-center text-center">
          <div className="w-20 h-20 bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center mb-5 shadow-sm">
            <CheckCircle className="w-10 h-10" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
            Sẵn sàng ghi nhận thay đổi
          </h2>
          <p className="text-gray-500 mb-8 max-w-md">
            Hãy kiểm tra bảng{" "}
            <strong className="text-gray-700 dark:text-gray-300">
              Mức độ hoàn thiện
            </strong>{" "}
            bên phải. Nếu thông tin đã chính xác, hệ thống sẽ áp dụng dữ liệu
            này lên gian hàng thực tế.
          </p>

          <div className="flex gap-4 w-full max-w-sm">
            <button
              type="button"
              onClick={() => fetchProduct()}
              disabled={loading || !isDirty}
              className="flex-1 py-3.5 px-4 text-sm font-bold text-gray-600 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Hủy thay đổi
            </button>
            <button
              type="button"
              onClick={() => handleSave()}
              disabled={saving || !isDirty}
              className="flex-1 inline-flex items-center justify-center gap-2 py-3.5 px-4 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-lg hover:shadow-blue-500/30 transition-all disabled:opacity-50 disabled:bg-gray-400"
            >
              {saving ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" /> Đang xử lý
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" /> Lưu & Cập nhật
                </>
              )}
            </button>
          </div>
        </div>
      </Card>
    </div>
  );

  if (loading)
    return (
      <div className="flex justify-center items-center py-32">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        <span className="ml-3 text-lg font-medium text-gray-500">
          Đang tải cấu trúc sản phẩm...
        </span>
      </div>
    );
  if (fetchError)
    return (
      <div className="text-center py-20">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <p className="text-lg font-medium text-red-600">{fetchError}</p>
        <button
          onClick={() => navigate("/admin/products")}
          className="mt-4 px-6 py-2 bg-gray-100 rounded-lg font-medium"
        >
          Trở về danh sách
        </button>
      </div>
    );
  if (!product) return null;

  return (
    <div className="w-full max-w-[1600px] mx-auto pb-24 relative">
      {/* 🔹 STICKY SAVE BAR (Hiện khi có thay đổi) */}
      <div
        className={`fixed bottom-0 left-0 right-0 z-50 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md border-t border-gray-200 dark:border-gray-800 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] transform transition-transform duration-300 ${isDirty ? "translate-y-0" : "translate-y-full"}`}
      >
        <div className="max-w-[1600px] mx-auto px-4 md:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-3 w-3 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
            </span>
            <span className="font-semibold text-gray-800 dark:text-white hidden sm:inline">
              Phát hiện thay đổi chưa lưu
            </span>
            {Object.keys(formErrors).length > 0 && (
              <span className="text-sm text-red-600 font-bold ml-2">
                ({Object.keys(formErrors).length} lỗi cần sửa)
              </span>
            )}
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => fetchProduct()}
              disabled={saving}
              className="px-5 py-2.5 rounded-lg text-sm font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 transition-colors"
            >
              Discard
            </button>
            <button
              onClick={() => handleSave()}
              disabled={saving}
              className="px-6 py-2.5 rounded-lg text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-md transition-colors flex items-center gap-2"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}{" "}
              Lưu thay đổi
            </button>
          </div>
        </div>
      </div>

      {/* HEADER TỔNG */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <button
            onClick={() => navigate("/admin/products")}
            className="flex items-center gap-1 text-sm font-medium text-gray-500 hover:text-gray-900 dark:hover:text-white mb-3 transition-colors w-fit"
          >
            <ArrowLeft className="w-4 h-4" /> Danh mục sản phẩm
          </button>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
              Chỉnh sửa: {initialProduct?.title || "Sản phẩm"}
            </h1>
            <span
              className={`px-2.5 py-1 text-xs font-bold rounded-md ${initialProduct?.status === "active" ? "bg-emerald-100 text-emerald-700" : "bg-gray-200 text-gray-600"}`}
            >
              {initialProduct?.status === "active" ? "Đang bán" : "Ngừng bán"}
            </span>
          </div>
        </div>
        <button
          onClick={() =>
            window.open(
              `/products/${initialProduct?.slug || initialProduct?.id}`,
              "_blank",
            )
          }
          className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 shadow-sm transition-all"
        >
          <Eye className="w-4 h-4" /> Xem ngoài Store
        </button>
      </div>

      {/* CONTEXT SUMMARY Đầu trang */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card className="p-4 flex items-center gap-4 border-l-4 border-blue-500">
          <div className="w-14 h-14 rounded-lg bg-gray-100 overflow-hidden shrink-0 border border-gray-200">
            {initialProduct?.thumbnail ? (
              <img
                src={initialProduct.thumbnail}
                alt=""
                className="w-full h-full object-cover"
              />
            ) : (
              <ImageIcon className="w-6 h-6 text-gray-400 m-auto mt-4" />
            )}
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase">
              Danh mục
            </p>
            <p className="text-sm font-bold text-gray-900 dark:text-white truncate">
              {categories.find(
                (c) => c.id === Number(initialProduct?.product_category_id),
              )?.title || "Chưa phân loại"}
            </p>
          </div>
        </Card>
        <Card className="p-4 flex items-center justify-between border-l-4 border-purple-500">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase">
              Mã / SKU
            </p>
            <p className="text-lg font-bold text-gray-900 dark:text-white mt-0.5">
              #{initialProduct?.id}
            </p>
          </div>
        </Card>
        <Card className="p-4 flex items-center justify-between border-l-4 border-indigo-500">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase">
              Quy mô biến thể
            </p>
            <p className="text-lg font-bold text-gray-900 dark:text-white mt-0.5">
              {(initialProduct?.variants || []).length} SKU
            </p>
          </div>
          <Layers className="w-8 h-8 text-indigo-100 fill-indigo-500" />
        </Card>
        <Card className="p-4 flex items-center justify-between border-l-4 border-emerald-500">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase">
              Độ hoàn thiện
            </p>
            <p className="text-lg font-bold text-gray-900 dark:text-white mt-0.5">
              {readiness.percentage}%
            </p>
          </div>
          <CheckCircle className="w-8 h-8 text-emerald-100 fill-emerald-500" />
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
        {/* MAIN WORKSPACE */}
        <div className="xl:col-span-3 space-y-6">
          {/* TABS NAVIGATION */}
          <div className="bg-white dark:bg-gray-800 p-2 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex overflow-x-auto hide-scrollbar">
            {TABS.map((tab) => {
              const isActive = activeTab === tab.id;
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  type="button"
                  className={`flex items-center gap-2 px-5 py-3 rounded-xl font-semibold text-sm whitespace-nowrap transition-all duration-200 flex-1 justify-center ${isActive ? "bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 shadow-sm" : "text-gray-500 hover:text-gray-900 hover:bg-gray-50 dark:hover:bg-gray-700"}`}
                >
                  <Icon className="w-4 h-4" /> {tab.label}
                </button>
              );
            })}
          </div>

          {/* TAB CONTENT */}
          <form id="product-edit-form" onSubmit={handleSave}>
            {activeTab === "basic" && renderBasicInfo()}
            {activeTab === "content" && renderContent()}
            {activeTab === "media" && renderMedia()}
            {activeTab === "variants" && renderVariants()}
            {activeTab === "publish" && renderReview()}
          </form>
        </div>

        {/* READINESS PANEL (RIGHT SIDEBAR) */}
        <div className="xl:col-span-1">
          <div className="sticky top-6 space-y-6">
            {/* Unsaved Changes Panel */}
            <Card
              className={`p-6 border-t-4 shadow-md transition-colors ${isDirty ? "border-t-amber-400 bg-amber-50/10" : "border-t-gray-300"}`}
            >
              <div className="flex items-center gap-2 mb-4">
                {isDirty ? (
                  <Sparkles className="w-5 h-5 text-amber-500" />
                ) : (
                  <CheckCircle className="w-5 h-5 text-gray-400" />
                )}
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                  Tình trạng chỉnh sửa
                </h3>
              </div>

              {isDirty ? (
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    Bạn đã thực hiện thay đổi ở các khu vực:
                  </p>
                  <ul className="space-y-2 mb-6">
                    {dirtyState.sections.map((sec) => (
                      <li
                        key={sec}
                        className="text-sm font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>{" "}
                        {sec}
                      </li>
                    ))}
                  </ul>
                  <button
                    onClick={() => handleSave()}
                    disabled={saving}
                    className="w-full py-2.5 bg-blue-600 text-white text-sm font-bold rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                  >
                    {saving ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}{" "}
                    Lưu thay đổi ngay
                  </button>
                </div>
              ) : (
                <p className="text-sm text-gray-500 italic">
                  Chưa có thay đổi nào so với bản gốc đang được lưu.
                </p>
              )}
            </Card>

            {/* Readiness Checklist */}
            <Card className="p-6 shadow-sm border border-gray-100 dark:border-gray-800">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                Đánh giá cấu trúc
              </h3>
              <p className="text-sm text-gray-500 mb-5">
                Danh mục tối thiểu để hiển thị tốt trên store.
              </p>
              <div className="space-y-3">
                {readiness.checks.map((check) => (
                  <div key={check.id} className="flex items-start gap-3 p-1.5">
                    <div
                      className={`mt-0.5 w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${check.passed ? "bg-emerald-100 text-emerald-600" : "bg-red-100 text-red-500"}`}
                    >
                      {check.passed ? (
                        <Check className="w-3 h-3 font-bold" />
                      ) : (
                        <div className="w-1.5 h-1.5 rounded-full bg-current" />
                      )}
                    </div>
                    <p
                      className={`text-sm font-medium ${check.passed ? "text-gray-900 dark:text-gray-200" : "text-red-600"}`}
                    >
                      {check.label}
                    </p>
                  </div>
                ))}
              </div>
              {Object.keys(formErrors).length > 0 && (
                <div className="mt-5 pt-5 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-2 text-red-600 font-bold mb-2">
                    <AlertCircle className="w-4 h-4" /> Lỗi nhập liệu
                  </div>
                  <p className="text-xs text-red-500 leading-relaxed">
                    Phát hiện {Object.keys(formErrors).length} trường không hợp
                    lệ. Hãy kiểm tra các ô báo đỏ.
                  </p>
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductEditPage;
