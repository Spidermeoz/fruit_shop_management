// src/pages/ProductCreatePage.tsx
import React, { useEffect, useState, useMemo, useRef } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Loader2,
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

// --- INTERFACES ---
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
interface ProductCategory {
  id: number;
  title: string;
  parent_id?: number | null;
  children?: ProductCategory[];
  position: number;
  status: string;
}
interface ProductFormData {
  product_category_id: number | string;
  origin_id: number | string;
  tag_ids: number[];
  short_description: string;
  storage_guide: string;
  usage_suggestions: string;
  nutrition_notes: string;
  title: string;
  description: string;
  price: number | string;
  stock: number | string;
  thumbnail: string;
  status: string;
  featured: number | string;
  position: number | string;
  slug: string;
  average_rating: number;
  review_count: number;
  created_by_id: number;
  options: ProductOptionInput[];
  variants: ProductVariantInput[];
}
type ErrorMap = Partial<Record<keyof ProductFormData | string, string>>;

// --- HELPERS ---
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

type TabKey = "basic" | "content" | "media" | "variants" | "review";

const TABS: { id: TabKey; label: string; icon: React.FC<any> }[] = [
  { id: "basic", label: "Thông tin cơ bản", icon: Info },
  { id: "content", label: "Nội dung", icon: FileText },
  { id: "media", label: "Hình ảnh", icon: ImageIcon },
  { id: "variants", label: "Tùy chọn & Biến thể", icon: Layers },
  { id: "review", label: "Đánh giá & Xuất bản", icon: CheckCircle },
];

const ProductCreatePage: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabKey>("basic");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<ErrorMap>({});
  const fieldRefs = useRef<Record<string, HTMLElement | null>>({});

  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [origins, setOrigins] = useState<Origin[]>([]);
  const [tags, setTags] = useState<ProductTag[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewImage, setPreviewImage] = useState<string>("");
  const [imageMethod, setImageMethod] = useState<"upload" | "url">("upload");
  const [imageUrl, setImageUrl] = useState<string>("");

  const { showSuccessToast, showErrorToast } = useAdminToast();

  const [formData, setFormData] = useState<ProductFormData>({
    product_category_id: "",
    origin_id: "",
    tag_ids: [],
    short_description: "",
    storage_guide: "",
    usage_suggestions: "",
    nutrition_notes: "",
    title: "",
    description: "",
    price: "",
    stock: "",
    thumbnail: "",
    status: "active",
    featured: 0,
    position: "",
    slug: "",
    average_rating: 0,
    review_count: 0,
    created_by_id: 1,
    options: [
      {
        name: "Kích cỡ",
        position: 0,
        values: [{ value: "Mặc định", position: 0 }],
      },
    ],
    variants: [
      {
        title: "Mặc định",
        price: "0",
        status: "active",
        sortOrder: 0,
        optionValueIds: [0],
        optionValues: [
          { value: "Mặc định", optionName: "Kích cỡ", position: 0 },
        ],
      },
    ],
  });

  const setFieldRef = (key: string) => (element: HTMLElement | null) => {
    fieldRefs.current[key] = element;
  };
  const clearError = (key: string) => {
    setErrors((prev) => {
      if (!prev[key]) return prev;
      return { ...prev, [key]: undefined };
    });
  };

  // Helper để tự động chuyển tab khi có lỗi
  const getTabForField = (fieldKey: string): TabKey => {
    if (
      fieldKey.startsWith("title") ||
      fieldKey.startsWith("product_category_id") ||
      fieldKey.startsWith("origin_id")
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

  const scrollToFirstError = (errorMap: ErrorMap) => {
    const firstErrorKey = Object.keys(errorMap)[0];
    if (!firstErrorKey) return;

    const targetTab = getTabForField(firstErrorKey);
    if (activeTab !== targetTab) {
      setActiveTab(targetTab);
    }

    setTimeout(() => {
      const target = fieldRefs.current[firstErrorKey];
      if (target) {
        target.scrollIntoView({ behavior: "smooth", block: "center" });
        if (typeof (target as HTMLInputElement).focus === "function") {
          (target as HTMLInputElement).focus();
        }
      }
    }, 100);
  };

  // --- MỨC ĐỘ HOÀN THIỆN (READINESS LOGIC) ---
  const readiness = useMemo(() => {
    const checks = [
      {
        id: "title",
        label: "Tên sản phẩm",
        passed: !!formData.title.trim(),
        tab: "basic" as TabKey,
      },
      {
        id: "category",
        label: "Danh mục",
        passed: !!formData.product_category_id,
        tab: "basic" as TabKey,
      },
      {
        id: "thumbnail",
        label: "Ảnh minh họa",
        passed: !!previewImage || (imageMethod === "url" && !!imageUrl),
        tab: "media" as TabKey,
      },
      {
        id: "desc",
        label: "Mô tả chi tiết",
        passed:
          !!formData.description.trim() &&
          formData.description !== "<p><br></p>",
        tab: "content" as TabKey,
      },
      {
        id: "tags",
        label: "Thẻ sản phẩm (Tags)",
        passed: formData.tag_ids.length > 0,
        tab: "basic" as TabKey,
      },
      {
        id: "variants",
        label: "Biến thể hợp lệ (Có giá)",
        passed:
          formData.variants.length > 0 &&
          formData.variants.every((v) => v.title && Number(v.price) > 0),
        tab: "variants" as TabKey,
      },
    ];
    const passedCount = checks.filter((c) => c.passed).length;
    const percentage = Math.round((passedCount / checks.length) * 100);
    return { checks, percentage };
  }, [formData, previewImage, imageMethod, imageUrl]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const json = await http<any>(
          "GET",
          "/api/v1/admin/product-category?limit=100",
        );
        if (json.success && Array.isArray(json.data))
          setCategories(
            json.data.map((c: any) => ({ ...c, parent_id: c.parentId })),
          );
      } catch (err) {
        console.error(err);
      }
    };
    const fetchOrigins = async () => {
      try {
        const json = await http<{ success: boolean; data: Origin[] }>(
          "GET",
          "/api/v1/admin/origins?limit=100",
        );
        if (json.success && Array.isArray(json.data))
          setOrigins(json.data.filter((origin) => origin.status === "active"));
      } catch (err) {
        console.error(err);
      }
    };
    const fetchTags = async () => {
      try {
        const json = await http<any>(
          "GET",
          "/api/v1/admin/product-tags?limit=1000",
        );
        const rows = Array.isArray(json?.data)
          ? json.data
          : Array.isArray(json?.data?.items)
            ? json.data.items
            : Array.isArray(json?.items)
              ? json.items
              : [];
        if (json.success && rows.length > 0) {
          const availableTags = rows
            .map(normalizeProductTag)
            .filter(
              (tag: ProductTag) => !tag.deleted && tag.id > 0 && !!tag.name,
            )
            .sort((a: ProductTag, b: ProductTag) => {
              const groupA = a.tagGroup ?? "Khác";
              const groupB = b.tagGroup ?? "Khác";
              if (groupA !== groupB) return groupA.localeCompare(groupB, "vi");
              return a.name.localeCompare(b.name, "vi");
            });
          setTags(availableTags);
        } else setTags([]);
      } catch (err) {
        console.error(err);
      }
    };
    fetchCategories();
    fetchOrigins();
    fetchTags();
  }, []);

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

  const handleInputChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    clearError(name);
  };

  const handleToggleTag = (tagId: number) => {
    setFormData((prev) => {
      const isSelected = prev.tag_ids.includes(tagId);
      const newTagIds = isSelected
        ? prev.tag_ids.filter((id) => id !== tagId)
        : [...prev.tag_ids, tagId];
      return { ...prev, tag_ids: [...new Set(newTagIds)] };
    });
  };

  // --- VARIANTS LOGIC ---
  const handleVariantChange = (
    index: number,
    field: keyof ProductVariantInput,
    value: any,
  ) => {
    setFormData((prev) => {
      const newVariants = [...prev.variants];
      newVariants[index] = { ...newVariants[index], [field]: value };
      return { ...prev, variants: newVariants };
    });
    clearError(`variants.${index}.${String(field)}`);
    clearError(`variant-card-${index}`);
  };

  const addVariant = () => {
    setFormData((prev) => ({
      ...prev,
      variants: [
        ...prev.variants,
        {
          title: "",
          price: "0",
          status: "active",
          sortOrder: prev.variants.length,
          optionValueIds: [],
          optionValues: [],
        },
      ],
    }));
  };

  const suggestVariants = () => {
    setFormData((prev) => {
      const productTitle = String(prev.title ?? "").trim();
      const combinations = buildVariantCartesian(prev.options);
      if (!combinations.length) return prev;

      const existingVariantMap = new Map(
        prev.variants.map((variant) => [
          buildVariantCombinationKey(variant.optionValues || []),
          variant,
        ]),
      );
      const nextVariants: ProductVariantInput[] = combinations.map(
        (combination, index) => {
          const key = buildVariantCombinationKey(combination);
          const existingVariant = existingVariantMap.get(key);
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
            id: existingVariant?.id,
            title:
              autoTitle || existingVariant?.title || `Biến thể ${index + 1}`,
            sku: autoSku || existingVariant?.sku || null,
            price: existingVariant?.price ?? prev.price ?? "0",
            compareAtPrice: existingVariant?.compareAtPrice ?? "",
            status: existingVariant?.status ?? "active",
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
    setErrors({});
  };

  const handleOptionChange = (
    optionIndex: number,
    field: keyof ProductOptionInput,
    value: any,
  ) => {
    setFormData((prev) => {
      const next = [...prev.options];
      const oldOption = next[optionIndex];
      const oldName = oldOption?.name ?? "";
      next[optionIndex] = { ...oldOption, [field]: value };

      let nextVariants = prev.variants;
      if (field === "name") {
        nextVariants = prev.variants.map((variant) => ({
          ...variant,
          optionValues: (variant.optionValues || []).map((ov) =>
            ov.optionName === oldName ? { ...ov, optionName: value } : ov,
          ),
        }));
      }
      return { ...prev, options: next, variants: nextVariants };
    });
    clearError(`options.${optionIndex}.name`);
  };

  const handleOptionValueChange = (
    optionIndex: number,
    valueIndex: number,
    value: string,
  ) => {
    setFormData((prev) => {
      const nextOptions = [...prev.options];
      const option = { ...nextOptions[optionIndex] };
      const oldValue = option.values[valueIndex]?.value ?? "";
      const optionName = option.name ?? "";
      const values = [...option.values];
      values[valueIndex] = { ...values[valueIndex], value };
      option.values = values;
      nextOptions[optionIndex] = option;

      const nextVariants = prev.variants.map((variant) => ({
        ...variant,
        optionValues: (variant.optionValues || []).map((ov) =>
          ov.optionName === optionName && ov.value === oldValue
            ? { ...ov, value }
            : ov,
        ),
      }));
      return { ...prev, options: nextOptions, variants: nextVariants };
    });
    clearError(`options.${optionIndex}.values.${valueIndex}`);
  };

  const addOption = () => {
    setFormData((prev) => ({
      ...prev,
      options: [
        ...prev.options,
        {
          name: "",
          position: prev.options.length,
          values: [{ value: "", position: 0 }],
        },
      ],
    }));
  };
  const removeOption = (optionIndex: number) => {
    setFormData((prev) => {
      const nextOptions = prev.options.filter((_, i) => i !== optionIndex);
      const remainingValueIds = new Set(
        nextOptions.flatMap((o) => o.values.map((v) => v.id)).filter(Boolean),
      );
      const removedOption = prev.options[optionIndex];
      const nextVariants = prev.variants.map((variant) => ({
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
    setErrors({});
  };

  const addOptionValue = (optionIndex: number) => {
    setFormData((prev) => {
      const nextOptions = [...prev.options];
      const option = { ...nextOptions[optionIndex] };
      option.values = [
        ...option.values,
        { value: "", position: option.values.length },
      ];
      nextOptions[optionIndex] = option;
      return { ...prev, options: nextOptions };
    });
  };

  const removeOptionValue = (optionIndex: number, valueIndex: number) => {
    setFormData((prev) => {
      const nextOptions = [...prev.options];
      const option = { ...nextOptions[optionIndex] };
      const removed = option.values[valueIndex];
      option.values = option.values.filter((_, i) => i !== valueIndex);
      nextOptions[optionIndex] = option;
      const nextVariants = prev.variants.map((variant) => ({
        ...variant,
        optionValueIds: (variant.optionValueIds || []).filter(
          (id) => id !== removed?.id,
        ),
        optionValues: (variant.optionValues || []).filter(
          (ov) =>
            !(ov.optionName === option.name && ov.value === removed?.value),
        ),
      }));
      return { ...prev, options: nextOptions, variants: nextVariants };
    });
    setErrors({});
  };

  const toggleVariantOptionValue = (
    variantIndex: number,
    optionIdOrTempIndex: number,
    valueIdOrTempKey: number,
  ) => {
    setFormData((prev) => {
      const nextVariants = [...prev.variants];
      const current = nextVariants[variantIndex];
      const currentIds = [...(current.optionValueIds || [])];
      const option = prev.options.find(
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

      const optionValueKeys = option.values.map((v, idx) => v.id ?? idx);
      const nextIds = currentIds.filter((id) => !optionValueKeys.includes(id));
      nextIds.push(targetValue.id ?? valueIdOrTempKey);

      const nextOptionValues = (current.optionValues || []).filter(
        (ov) => ov.optionName !== option.name,
      );
      nextOptionValues.push({
        id: targetValue.id,
        value: targetValue.value,
        optionId: option.id,
        optionName: option.name,
        position: targetValue.position,
      });

      nextVariants[variantIndex] = {
        ...current,
        optionValueIds: nextIds,
        optionValues: nextOptionValues,
      };
      return { ...prev, variants: nextVariants };
    });
    clearError(`variants.${variantIndex}.optionValues`);
    clearError(`variant-card-${variantIndex}`);
  };

  const removeVariant = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      variants: prev.variants.filter((_, i) => i !== index),
    }));
    setErrors({});
  };

  // --- IMAGE UPLOAD ---
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
    clearError("thumbnail");
  };

  // --- VALIDATION & SUBMIT ---
  const validateForm = () => {
    const newErrors: ErrorMap = {};
    if (!formData.title.trim()) newErrors.title = "Vui lòng nhập tên sản phẩm.";
    if (!formData.product_category_id)
      newErrors.product_category_id = "Vui lòng chọn danh mục.";

    formData.options.forEach((option, optionIndex) => {
      if (!String(option.name ?? "").trim())
        newErrors[`options.${optionIndex}.name`] =
          "Vui lòng nhập tên tùy chọn.";
      if (!Array.isArray(option.values) || option.values.length === 0)
        newErrors[`options.${optionIndex}.name`] =
          "Mỗi tùy chọn phải có ít nhất 1 giá trị.";
      const normalizedValueMap = new Set<string>();
      option.values.forEach((value, valueIndex) => {
        const normalizedValue = normalizeTextForCompare(value.value);
        if (!normalizedValue) {
          newErrors[`options.${optionIndex}.values.${valueIndex}`] =
            "Vui lòng nhập giá trị tùy chọn.";
          return;
        }
        if (normalizedValueMap.has(normalizedValue)) {
          newErrors[`options.${optionIndex}.values.${valueIndex}`] =
            "Giá trị trong cùng một tùy chọn không được trùng nhau.";
          return;
        }
        normalizedValueMap.add(normalizedValue);
      });
    });

    if (!formData.variants.length)
      newErrors["variants.0.title"] = "Cần ít nhất 1 biến thể.";

    const usedVariantCombinationKeys = new Set<string>();
    formData.variants.forEach((variant, index) => {
      const variantTitle = String(variant.title ?? "").trim();
      const priceRaw = String(variant.price ?? "").trim();
      const compareAtPriceRaw = String(variant.compareAtPrice ?? "").trim();
      const priceNumber = Number(variant.price);
      const compareAtPriceNumber = Number(variant.compareAtPrice);
      const cardKey = `variant-card-${index}`;

      if (!variantTitle) {
        newErrors[`variants.${index}.title`] = "Vui lòng nhập tên biến thể.";
        newErrors[cardKey] = newErrors[cardKey] || "Thiếu thông tin.";
      }
      if (!priceRaw || !Number.isFinite(priceNumber) || priceNumber <= 0) {
        newErrors[`variants.${index}.price`] = "Giá bán phải lớn hơn 0.";
        newErrors[cardKey] = newErrors[cardKey] || "Thiếu thông tin.";
      }
      if (
        compareAtPriceRaw &&
        (!Number.isFinite(compareAtPriceNumber) || compareAtPriceNumber < 0)
      ) {
        newErrors[`variants.${index}.compareAtPrice`] = "Giá so sánh >= 0.";
        newErrors[cardKey] = newErrors[cardKey] || "Thiếu thông tin.";
      }
      if (
        compareAtPriceRaw &&
        Number.isFinite(compareAtPriceNumber) &&
        Number.isFinite(priceNumber) &&
        compareAtPriceNumber > 0 &&
        compareAtPriceNumber < priceNumber
      ) {
        newErrors[`variants.${index}.compareAtPrice`] =
          "Giá so sánh phải lớn hơn hoặc bằng giá bán.";
        newErrors[cardKey] = newErrors[cardKey] || "Thiếu thông tin.";
      }

      const normalizedSelections = formData.options.map((option) => {
        const optionName = String(option.name ?? "").trim();
        const matches = (variant.optionValues || []).filter(
          (ov) =>
            normalizeTextForCompare(ov.optionName ?? "") ===
            normalizeTextForCompare(optionName),
        );
        if (!optionName || !option.values.length) return null;
        if (matches.length !== 1 || !String(matches[0]?.value ?? "").trim()) {
          newErrors[`variants.${index}.optionValues`] =
            "Mỗi biến thể phải chọn đúng 1 giá trị cho mỗi tùy chọn.";
          newErrors[cardKey] = newErrors[cardKey] || "Thiếu thông tin.";
          return null;
        }
        const selectedValue = normalizeTextForCompare(matches[0].value ?? "");
        const validOptionValues = option.values.map((value) =>
          normalizeTextForCompare(value.value),
        );
        if (!validOptionValues.includes(selectedValue)) {
          newErrors[`variants.${index}.optionValues`] =
            "Có giá trị tùy chọn không còn hợp lệ.";
          newErrors[cardKey] = newErrors[cardKey] || "Thiếu thông tin.";
          return null;
        }
        return {
          optionName,
          value: matches[0].value,
          position: matches[0].position,
        };
      });

      if (normalizedSelections.every(Boolean)) {
        const key = buildVariantCombinationKey(
          normalizedSelections.filter(
            Boolean,
          ) as ProductVariantSelectedOptionValue[],
        );
        if (usedVariantCombinationKeys.has(key)) {
          newErrors[`variants.${index}.optionValues`] =
            "Tổ hợp tùy chọn bị trùng.";
          newErrors[cardKey] = newErrors[cardKey] || "Thiếu thông tin.";
        } else usedVariantCombinationKeys.add(key);
      }
    });

    setErrors(newErrors);
    scrollToFirstError(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e?: FormEvent) => {
    if (e) e.preventDefault();
    if (!validateForm()) return;

    try {
      setLoading(true);
      setErrors({});
      let uploadedThumbnailUrl = formData.thumbnail;
      if (selectedFile) {
        const formDataImg = new FormData();
        formDataImg.append("file", selectedFile);
        const uploadJson = await http<any>(
          "POST",
          "/api/v1/admin/upload",
          formDataImg,
        );
        if (uploadJson.success && uploadJson.data?.url)
          uploadedThumbnailUrl = uploadJson.data.url;
        else if (uploadJson.url) uploadedThumbnailUrl = uploadJson.url;
        else {
          setErrors({ thumbnail: "Không thể tải ảnh lên. Vui lòng thử lại." });
          setLoading(false);
          return;
        }
      } else if (imageMethod === "url" && imageUrl)
        uploadedThumbnailUrl = imageUrl;

      const updatedDescription = await uploadImagesInContent(
        formData.description,
      );
      const updatedStorageGuide = await uploadImagesInContent(
        formData.storage_guide,
      );
      const updatedUsageSuggestions = await uploadImagesInContent(
        formData.usage_suggestions,
      );
      const updatedNutritionNotes = await uploadImagesInContent(
        formData.nutrition_notes,
      );

      const normalizedOptions = formData.options.map((option, optionIndex) => ({
        name: option.name,
        position: option.position ?? optionIndex,
        values: option.values.map((value, valueIndex) => ({
          value: value.value,
          position: value.position ?? valueIndex,
        })),
      }));

      const normalizedVariants = formData.variants.map((variant, index) => ({
        title: variant.title ?? null,
        sku: variant.sku ?? null,
        price: Number(variant.price),
        compareAtPrice:
          variant.compareAtPrice !== undefined &&
          variant.compareAtPrice !== null &&
          variant.compareAtPrice !== ""
            ? Number(variant.compareAtPrice)
            : null,
        status: variant.status ?? "active",
        sortOrder: variant.sortOrder ?? index,
        optionValueIds: Array.isArray(variant.optionValueIds)
          ? variant.optionValueIds
          : [],
        optionValues: Array.isArray(variant.optionValues)
          ? variant.optionValues.map((ov) => ({
              id: ov.id,
              value: ov.value,
              optionId: ov.optionId,
              optionName: ov.optionName,
              position: ov.position,
            }))
          : [],
      }));

      const fallbackPrice =
        normalizedVariants.length > 0 ? normalizedVariants[0].price : null;

      const payload = {
        categoryId: formData.product_category_id
          ? Number(formData.product_category_id)
          : null,
        originId: formData.origin_id ? Number(formData.origin_id) : null,
        tagIds: [...new Set(formData.tag_ids.map(Number))].filter(
          (id) => Number.isInteger(id) && id > 0,
        ),
        shortDescription: formData.short_description || null,
        storageGuide: updatedStorageGuide,
        usageSuggestions: updatedUsageSuggestions,
        nutritionNotes: updatedNutritionNotes,
        title: formData.title,
        description: updatedDescription,
        price: formData.price === "" ? fallbackPrice : Number(formData.price),
        thumbnail: uploadedThumbnailUrl,
        status: formData.status,
        featured: Boolean(Number(formData.featured)),
        position: formData.position === "" ? null : Number(formData.position),
        slug: formData.slug || null,
        options: normalizedOptions,
        variants: normalizedVariants,
      };

      const json = await http<any>(
        "POST",
        "/api/v1/admin/products/create",
        payload,
      );

      if (json.success) {
        showSuccessToast({ message: "Thêm sản phẩm thành công!" });
        navigate("/admin/products");
      } else {
        if (json.errors) {
          setErrors(json.errors);
          scrollToFirstError(json.errors);
        } else showErrorToast(json.message || "Không thể thêm sản phẩm!");
      }
    } catch (err: any) {
      showErrorToast(err?.message || "Lỗi hệ thống. Vui lòng kiểm tra lại.");
    } finally {
      setLoading(false);
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
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
              Tên sản phẩm <span className="text-red-500">*</span>
            </label>
            <input
              ref={setFieldRef("title") as React.Ref<HTMLInputElement>}
              type="text"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              placeholder="Nhập tên sản phẩm (VD: Giỏ hoa quả...)"
              className={`w-full border ${errors.title ? "border-red-500" : "border-gray-300 dark:border-gray-600"} rounded-lg p-3 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 transition-shadow`}
            />
            {errors.title && (
              <p className="text-sm text-red-600 mt-1.5 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {errors.title}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                Danh mục <span className="text-red-500">*</span>
              </label>
              <select
                ref={
                  setFieldRef(
                    "product_category_id",
                  ) as React.Ref<HTMLSelectElement>
                }
                name="product_category_id"
                value={formData.product_category_id}
                onChange={handleInputChange}
                className={`w-full border ${errors.product_category_id ? "border-red-500" : "border-gray-300 dark:border-gray-600"} rounded-lg p-3 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500`}
              >
                <option value="" disabled>
                  -- Chọn danh mục --
                </option>
                {renderCategoryOptions(buildCategoryTree(categories))}
              </select>
              {errors.product_category_id && (
                <p className="text-sm text-red-600 mt-1.5 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.product_category_id}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                Xuất xứ
              </label>
              <select
                name="origin_id"
                value={formData.origin_id}
                onChange={handleInputChange}
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
          Phân loại & Cài đặt hiển thị
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
                        const isSelected = formData.tag_ids.includes(tag.id);
                        return (
                          <button
                            key={tag.id}
                            type="button"
                            onClick={() => handleToggleTag(tag.id)}
                            className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                              isSelected
                                ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                                : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:border-blue-400"
                            }`}
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
              <div className="flex gap-4">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    name="status"
                    value="active"
                    checked={formData.status === "active"}
                    onChange={handleInputChange}
                    className="text-blue-600 focus:ring-blue-500 w-4 h-4"
                  />
                  <span className="text-sm font-medium">Hoạt động</span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    name="status"
                    value="inactive"
                    checked={formData.status === "inactive"}
                    onChange={handleInputChange}
                    className="text-gray-400 focus:ring-gray-500 w-4 h-4"
                  />
                  <span className="text-sm font-medium">Ẩn</span>
                </label>
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Đánh dấu nổi bật
              </label>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  name="featured"
                  value={1}
                  checked={Number(formData.featured) === 1}
                  onChange={(e) =>
                    setFormData((p) => ({
                      ...p,
                      featured: e.target.checked ? 1 : 0,
                    }))
                  }
                  className="rounded text-amber-500 focus:ring-amber-500 w-4 h-4"
                />
                <span className="text-sm font-medium text-amber-700 dark:text-amber-500">
                  Sản phẩm nổi bật
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
                value={formData.position || ""}
                onChange={handleInputChange}
                placeholder="Tự động xếp cuối"
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
        <div className="mb-4">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">
            Mô tả tổng quan
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            Đoạn văn ngắn gọn thu hút khách hàng hiển thị ở đầu trang sản phẩm.
          </p>
        </div>
        <textarea
          name="short_description"
          rows={3}
          value={formData.short_description}
          onChange={handleInputChange}
          placeholder="Nhập mô tả ngắn gọn..."
          className="w-full border border-gray-300 dark:border-gray-600 rounded-lg p-3 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
        />
      </Card>

      <Card className="p-6">
        <div className="mb-4">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">
            Bài viết chi tiết
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            Nội dung đầy đủ giới thiệu về tính năng, chất liệu và lợi ích của
            sản phẩm.
          </p>
        </div>
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
          <RichTextEditor
            value={formData.description}
            onChange={(content) =>
              setFormData((prev) => ({ ...prev, description: content }))
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
                value={formData.storage_guide}
                onChange={(c) =>
                  setFormData((p) => ({ ...p, storage_guide: c }))
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
                value={formData.usage_suggestions}
                onChange={(c) =>
                  setFormData((p) => ({ ...p, usage_suggestions: c }))
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
                value={formData.nutrition_notes}
                onChange={(c) =>
                  setFormData((p) => ({ ...p, nutrition_notes: c }))
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
        <div className="mb-6">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">
            Ảnh minh họa (Thumbnail)
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            Hình ảnh chính đại diện cho sản phẩm trên danh mục.
          </p>
        </div>

        <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-lg w-fit mb-6">
          <button
            type="button"
            onClick={() => setImageMethod("upload")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-md text-sm font-medium transition-all ${imageMethod === "upload" ? "bg-white dark:bg-gray-700 text-blue-600 shadow-sm" : "text-gray-600 hover:text-gray-900"}`}
          >
            <UploadCloud className="w-4 h-4" /> Tải ảnh lên
          </button>
          <button
            type="button"
            onClick={() => setImageMethod("url")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-md text-sm font-medium transition-all ${imageMethod === "url" ? "bg-white dark:bg-gray-700 text-blue-600 shadow-sm" : "text-gray-600 hover:text-gray-900"}`}
          >
            <LinkIcon className="w-4 h-4" /> Sử dụng URL
          </button>
        </div>

        {imageMethod === "upload" ? (
          <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-8 text-center hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors relative">
            <input
              type="file"
              accept="image/*"
              onChange={handleImageSelect}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <div className="flex flex-col items-center justify-center pointer-events-none">
              <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/30 text-blue-500 rounded-full flex items-center justify-center mb-4">
                <UploadCloud className="w-8 h-8" />
              </div>
              <p className="text-base font-semibold text-gray-700 dark:text-gray-200">
                Kéo thả ảnh vào đây hoặc click để duyệt
              </p>
              <p className="text-sm text-gray-500 mt-2">
                Hỗ trợ JPG, PNG, WEBP, GIF (Tối đa 5MB)
              </p>
            </div>
          </div>
        ) : (
          <div>
            <input
              ref={setFieldRef("thumbnail") as React.Ref<HTMLInputElement>}
              type="url"
              placeholder="https://example.com/image.jpg"
              value={imageUrl}
              onChange={(e) => {
                setImageUrl(e.target.value);
                setPreviewImage(e.target.value);
                setFormData((p) => ({ ...p, thumbnail: e.target.value }));
                clearError("thumbnail");
              }}
              className={`w-full border ${errors.thumbnail ? "border-red-500" : "border-gray-300 dark:border-gray-600"} rounded-lg p-3 bg-white dark:bg-gray-800 text-gray-900 focus:ring-2 focus:ring-blue-500`}
            />
          </div>
        )}

        {errors.thumbnail && (
          <p className="text-sm text-red-600 mt-3 flex items-center gap-1">
            <AlertCircle className="w-4 h-4" />
            {errors.thumbnail}
          </p>
        )}

        {previewImage && (
          <div className="mt-8 border border-gray-200 dark:border-gray-700 rounded-xl p-4 bg-gray-50 dark:bg-gray-800/30 inline-block relative group">
            <p className="text-xs font-semibold text-gray-500 mb-3 uppercase tracking-wider">
              Xem trước
            </p>
            <div className="relative">
              <img
                src={previewImage}
                alt="Preview"
                className="h-48 w-48 object-cover rounded-lg border border-gray-200 shadow-sm bg-white"
              />
              <button
                type="button"
                onClick={() => {
                  setSelectedFile(null);
                  setImageUrl("");
                  setPreviewImage("");
                  setFormData((p) => ({ ...p, thumbnail: "" }));
                }}
                className="absolute -top-3 -right-3 bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-red-600 transition-colors shadow-lg opacity-0 group-hover:opacity-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
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
              Bộ xây dựng thuộc tính
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              Định nghĩa các chiều phân loại (VD: Màu sắc, Kích cỡ).
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
          {formData.options.map((option, optionIndex) => (
            <div
              key={option.id ?? optionIndex}
              className="border border-gray-200 dark:border-gray-700 rounded-xl p-5 bg-gray-50 dark:bg-gray-800/30 relative"
            >
              <button
                type="button"
                onClick={() => removeOption(optionIndex)}
                disabled={formData.options.length === 1}
                className="absolute top-4 right-4 text-gray-400 hover:text-red-500 disabled:opacity-30 transition-colors"
              >
                <Trash2 className="w-5 h-5" />
              </button>

              <div className="mb-4 pr-8">
                <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase">
                  Tên thuộc tính
                </label>
                <input
                  ref={
                    setFieldRef(
                      `options.${optionIndex}.name`,
                    ) as React.Ref<HTMLInputElement>
                  }
                  type="text"
                  value={option.name}
                  onChange={(e) =>
                    handleOptionChange(optionIndex, "name", e.target.value)
                  }
                  placeholder="VD: Kích cỡ"
                  className={`w-full border-b-2 bg-transparent text-lg font-bold text-gray-900 dark:text-white placeholder-gray-300 focus:outline-none focus:border-blue-500 pb-1 ${errors[`options.${optionIndex}.name`] ? "border-red-500" : "border-gray-300 dark:border-gray-600"}`}
                />
                {errors[`options.${optionIndex}.name`] && (
                  <p className="text-xs text-red-600 mt-1">
                    {errors[`options.${optionIndex}.name`]}
                  </p>
                )}
              </div>

              <div className="space-y-3">
                <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase">
                  Các giá trị
                </label>
                {option.values.map((value, valueIndex) => (
                 <>
                  <div
                    key={value.id ?? valueIndex}
                    className="flex items-center gap-2"
                  >
                    <input
                      ref={
                        setFieldRef(
                          `options.${optionIndex}.values.${valueIndex}`,
                        ) as React.Ref<HTMLInputElement>
                      }
                      type="text"
                      value={value.value}
                      onChange={(e) =>
                        handleOptionValueChange(
                          optionIndex,
                          valueIndex,
                          e.target.value,
                        )
                      }
                      placeholder="VD: S / M / L"
                      className={`flex-1 border rounded-md p-2 text-sm bg-white dark:bg-gray-900 focus:ring-1 focus:ring-blue-500 ${errors[`options.${optionIndex}.values.${valueIndex}`] ? "border-red-500 outline-red-500" : "border-gray-300 dark:border-gray-600"}`}
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
                  {
                    errors[`options.${optionIndex}.values.${valueIndex}`] && 
                    (
                      <p className="text-xs text-red-600 mt-1">
                        {errors[`options.${optionIndex}.values.${valueIndex}`]}
                      </p>
                    )
                  }
                 </>
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

      {/* SECTION 2 & 3: Variant Generator & Matrix */}
      <Card className="p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              Danh sách biến thể (SKUs)
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              Mỗi biến thể đại diện cho một mặt hàng cụ thể để quản lý tồn kho
              và giá cả.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={addVariant}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Thêm dòng trống
            </button>
            <button
              type="button"
              onClick={suggestVariants}
              className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-white bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 rounded-lg shadow-sm transition-all"
            >
              <Sparkles className="w-4 h-4" /> Tạo tự động từ thuộc tính
            </button>
          </div>
        </div>

        {errors["variants.0.title"] && (
          <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm">
            {errors["variants.0.title"]}
          </div>
        )}

        <div className="space-y-4">
          {formData.variants.map((variant, index) => {
            const hasError = !!errors[`variant-card-${index}`];
            return (
              <div
                key={index}
                ref={
                  setFieldRef(
                    `variant-card-${index}`,
                  ) as React.Ref<HTMLDivElement>
                }
                className={`border rounded-xl p-4 transition-colors ${hasError ? "border-red-400 bg-red-50/30" : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"}`}
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-xs font-semibold text-gray-500 mb-1">
                        Tên mặt hàng <span className="text-red-500">*</span>
                      </label>
                      <input
                        ref={
                          setFieldRef(
                            `variants.${index}.title`,
                          ) as React.Ref<HTMLInputElement>
                        }
                        type="text"
                        value={variant.title || ""}
                        onChange={(e) =>
                          handleVariantChange(index, "title", e.target.value)
                        }
                        placeholder="VD: Giỏ quả-đặc biệt..."
                        className={`w-full border rounded-lg p-2.5 text-sm font-medium ${errors[`variants.${index}.title`] ? "border-red-500" : "border-gray-300 dark:border-gray-600"} focus:ring-1 focus:ring-blue-500`}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 mb-1">
                        Mã SKU
                      </label>
                      <input
                        type="text"
                        value={variant.sku || ""}
                        onChange={(e) =>
                          handleVariantChange(index, "sku", e.target.value)
                        }
                        placeholder="VD: DAC-BIET-.."
                        className="w-full border border-gray-300 dark:border-gray-600 rounded-lg p-2.5 text-sm uppercase focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeVariant(index)}
                    disabled={formData.variants.length === 1}
                    className="ml-4 p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors mt-5"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                  <div className="md:col-span-1">
                    <label className="block text-xs font-semibold text-gray-500 mb-1">
                      Giá bán (VNĐ) <span className="text-red-500">*</span>
                    </label>
                    <input
                      ref={
                        setFieldRef(
                          `variants.${index}.price`,
                        ) as React.Ref<HTMLInputElement>
                      }
                      type="number"
                      min={1000}
                      value={+variant.price > 1000 ? variant.price : 1000}
                      onChange={(e) =>
                        handleVariantChange(index, "price", e.target.value)
                      }
                      className={`w-full border rounded-lg p-2 text-sm ${errors[`variants.${index}.price`] ? "border-red-500" : "border-gray-300"}`}
                    />
                  </div>
                  <div className="md:col-span-1">
                    <label className="block text-xs font-semibold text-gray-500 mb-1">
                      Giá gốc (VNĐ)
                    </label>
                    <input
                      ref={
                        setFieldRef(
                          `variants.${index}.compareAtPrice`,
                        ) as React.Ref<HTMLInputElement>
                      }
                      type="number"
                      min={1000}
                      value={variant.compareAtPrice || 1000}
                      onChange={(e) =>
                        handleVariantChange(
                          index,
                          "compareAtPrice",
                          e.target.value,
                        )
                      }
                      className={`w-full border rounded-lg p-2 text-sm ${errors[`variants.${index}.compareAtPrice`] ? "border-red-500" : "border-gray-300"}`}
                    />
                  </div>
                  <div className="md:col-span-2 flex items-end pb-2">
                    <label className="flex items-center space-x-2 cursor-pointer bg-gray-50 dark:bg-gray-700 px-3 py-2 rounded-lg border border-gray-200 w-fit">
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
                        className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                      />
                      <span className="text-sm font-medium text-gray-700">
                        Đang kinh doanh
                      </span>
                    </label>
                  </div>
                </div>

                <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded-lg border border-gray-100 dark:border-gray-700">
                  <p className="text-xs font-semibold text-gray-500 mb-2 uppercase">
                    Tổ hợp thuộc tính
                  </p>
                  <div className="flex flex-wrap gap-x-6 gap-y-3">
                    {formData.options.map((option, optionIndex) => (
                      <div
                        key={option.id ?? optionIndex}
                        className="flex items-center gap-2"
                      >
                        <span className="text-sm text-gray-600 font-medium">
                          {option.name}:
                        </span>
                        <div className="flex gap-1.5">
                          {option.values.map((value, valueIndex) => {
                            const selected = (variant.optionValues || []).some(
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
                                className={`px-2.5 py-1 rounded-md text-xs font-bold transition-colors border ${selected ? "bg-indigo-600 text-white border-indigo-600" : "bg-white text-gray-600 border-gray-300 hover:border-indigo-400"}`}
                              >
                                {value.value || "?"}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                  {errors[`variants.${index}.optionValues`] && (
                    <p className="text-xs text-red-600 mt-2 font-medium bg-red-50 p-2 rounded">
                      {errors[`variants.${index}.optionValues`]}
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
      <Card className="p-8 text-center bg-gradient-to-b from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 border-2 border-dashed border-gray-200">
        <div className="mx-auto w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-4">
          <CheckCircle className="w-10 h-10" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Sẵn sàng xuất bản
        </h2>
        <p className="text-gray-500 mb-8 max-w-lg mx-auto">
          Kiểm tra lại một lần nữa các thông tin quan trọng bên bảng Mức độ hoàn
          thiện. Nếu mọi thứ đã ổn, hãy nhấn nút Tạo sản phẩm phía dưới.
        </p>

        <button
          type="button"
          onClick={() => handleSubmit()}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 px-8 py-3.5 text-lg font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-lg hover:shadow-blue-500/30 transition-all disabled:opacity-70"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" /> Đang xử lý...
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5" /> Hoàn tất Tạo Sản Phẩm
            </>
          )}
        </button>
      </Card>
    </div>
  );

  return (
    <div className="w-full max-w-[1600px] mx-auto pb-12">
      {/* HEADER TỔNG */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <button
            onClick={() => navigate("/admin/products")}
            className="flex items-center gap-1 text-sm font-medium text-gray-500 hover:text-gray-900 dark:hover:text-white mb-2 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Danh sách sản phẩm
          </button>
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
            Tạo Mới Sản Phẩm
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Không gian thiết lập thông tin, hình ảnh và biến thể sản phẩm.
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => navigate("/admin/products")}
            className="px-5 py-2.5 rounded-lg border border-gray-300 bg-white font-medium text-gray-700 hover:bg-gray-50 shadow-sm transition-colors"
          >
            Hủy
          </button>
          <button
            onClick={() => handleSubmit()}
            disabled={loading}
            className="px-5 py-2.5 rounded-lg bg-blue-600 text-white font-bold hover:bg-blue-700 shadow-md transition-colors flex items-center gap-2"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null} Lưu
            & Xuất bản
          </button>
        </div>
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
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-5 py-3 rounded-xl font-semibold text-sm whitespace-nowrap transition-all duration-200 flex-1 justify-center ${
                    isActive
                      ? "bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 shadow-sm"
                      : "text-gray-500 hover:text-gray-900 hover:bg-gray-50 dark:hover:bg-gray-700"
                  }`}
                >
                  <Icon className="w-4 h-4" /> {tab.label}
                </button>
              );
            })}
          </div>

          {/* TAB CONTENT */}
          <form onSubmit={handleSubmit}>
            {activeTab === "basic" && renderBasicInfo()}
            {activeTab === "content" && renderContent()}
            {activeTab === "media" && renderMedia()}
            {activeTab === "variants" && renderVariants()}
            {activeTab === "review" && renderReview()}
          </form>
        </div>

        {/* READINESS PANEL (RIGHT SIDEBAR) */}
        <div className="xl:col-span-1">
          <div className="sticky top-6">
            <Card className="p-6 border-t-4 border-t-blue-500 shadow-lg">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                Mức độ hoàn thiện
              </h3>
              <p className="text-sm text-gray-500 mb-4">
                Các trường thông tin cần thiết để sản phẩm sẵn sàng lên kệ.
              </p>

              <div className="mb-6">
                <div className="flex justify-between items-end mb-2">
                  <span className="text-3xl font-extrabold text-blue-600">
                    {readiness.percentage}%
                  </span>
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
                    Tiến độ
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700 overflow-hidden">
                  <div
                    className="bg-blue-600 h-2.5 rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${readiness.percentage}%` }}
                  ></div>
                </div>
              </div>

              <div className="space-y-3">
                {readiness.checks.map((check) => (
                  <div
                    key={check.id}
                    className={`flex items-start gap-3 p-2 rounded-lg cursor-pointer transition-colors ${check.passed ? "hover:bg-gray-50" : "hover:bg-red-50 group"}`}
                    onClick={() => !check.passed && setActiveTab(check.tab)}
                  >
                    <div
                      className={`mt-0.5 w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${check.passed ? "bg-emerald-100 text-emerald-600" : "bg-gray-100 text-gray-400 group-hover:bg-red-100 group-hover:text-red-500"}`}
                    >
                      {check.passed ? (
                        <Check className="w-3 h-3 font-bold" />
                      ) : (
                        <div className="w-1.5 h-1.5 rounded-full bg-current" />
                      )}
                    </div>
                    <div>
                      <p
                        className={`text-sm font-medium ${check.passed ? "text-gray-900 dark:text-gray-200" : "text-gray-500 group-hover:text-red-600"}`}
                      >
                        {check.label}
                      </p>
                      {!check.passed && (
                        <p className="text-xs text-gray-400 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          Nhấn để bổ sung
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {Object.keys(errors).length > 0 && (
                <div className="mt-6 p-4 bg-red-50 border border-red-100 rounded-xl">
                  <div className="flex items-center gap-2 text-red-600 font-bold mb-2">
                    <AlertCircle className="w-4 h-4" /> Phát hiện lỗi
                  </div>
                  <p className="text-xs text-red-500 leading-relaxed">
                    Có {Object.keys(errors).length} trường thông tin chưa hợp
                    lệ. Vui lòng kiểm tra các ô báo đỏ.
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

export default ProductCreatePage;
