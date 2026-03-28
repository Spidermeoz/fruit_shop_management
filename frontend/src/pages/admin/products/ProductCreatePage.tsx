// src/pages/ProductCreatePage.tsx
import React, { useEffect, useState, useMemo, useRef } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2, Plus, Sparkles, Trash2 } from "lucide-react";
import Card from "../../../components/admin/layouts/Card";
import RichTextEditor from "../../../components/admin/common/RichTextEditor";
import { uploadImagesInContent } from "../../../utils/uploadImagesInContent";
import {
  buildCategoryTree,
  renderCategoryOptions,
} from "../../../utils/categoryTree";
import { http } from "../../../services/http";
import { useAdminToast } from "../../../context/AdminToastContext";

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
  group?: {
    id: number;
    name: string;
    slug?: string | null;
  } | null;
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

  if (!normalizedOptions.length) {
    return [];
  }

  return normalizedOptions.reduce<ProductVariantSelectedOptionValue[][]>(
    (acc, option, optionIndex) => {
      const mappedValues = option.values.map((value) => ({
        id: value.id,
        value: value.value,
        optionId: option.id,
        optionName: option.name,
        position: option.position ?? optionIndex,
      }));

      if (!acc.length) {
        return mappedValues.map((value) => [value]);
      }

      return acc.flatMap((existing) =>
        mappedValues.map((value) => [...existing, value]),
      );
    },
    [],
  );
};

const ProductCreatePage: React.FC = () => {
  const navigate = useNavigate();
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
          {
            value: "Mặc định",
            optionName: "Kích cỡ",
            position: 0,
          },
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

  const scrollToFirstError = (errorMap: ErrorMap) => {
    const firstErrorKey = Object.keys(errorMap)[0];
    if (!firstErrorKey) return;

    const target = fieldRefs.current[firstErrorKey];
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "center" });
      if (typeof (target as HTMLInputElement).focus === "function") {
        (target as HTMLInputElement).focus();
      }
    }
  };

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const json = await http<any>(
          "GET",
          "/api/v1/admin/product-category?limit=100",
        );
        if (json.success && Array.isArray(json.data)) {
          const normalized = json.data.map((c: any) => ({
            ...c,
            parent_id: c.parentId,
          }));
          setCategories(normalized);
        }
      } catch (err) {
        console.error("fetchCategories error:", err);
      }
    };

    const fetchOrigins = async () => {
      try {
        const json = await http<{ success: boolean; data: Origin[] }>(
          "GET",
          "/api/v1/admin/origins?limit=100",
        );

        if (json.success && Array.isArray(json.data)) {
          setOrigins(json.data.filter((origin) => origin.status === "active"));
        }
      } catch (err) {
        console.error("fetchOrigins error:", err);
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

              if (groupA !== groupB) {
                return groupA.localeCompare(groupB, "vi");
              }

              return a.name.localeCompare(b.name, "vi");
            });

          setTags(availableTags);
        } else {
          setTags([]);
        }
      } catch (err) {
        console.error("fetchTags error:", err);
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

        if (!acc[groupName]) {
          acc[groupName] = [];
        }

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

      return {
        ...prev,
        tag_ids: [...new Set(newTagIds)],
      };
    });
  };

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

      if (!combinations.length) {
        return prev;
      }

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
          const skuParts = [
            productTitle,
            ...combination.flatMap((item) => [item.optionName, item.value]),
          ]
            .map(slugifyVariantPart)
            .filter(Boolean);
          const autoSku = skuParts.join("-");

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

      return {
        ...prev,
        variants: nextVariants,
      };
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

      values[valueIndex] = {
        ...values[valueIndex],
        value,
      };

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

      return {
        ...prev,
        options: nextOptions,
        variants: nextVariants,
      };
    });

    setErrors({});
  };

  const addOptionValue = (optionIndex: number) => {
    setFormData((prev) => {
      const nextOptions = [...prev.options];
      const option = { ...nextOptions[optionIndex] };
      option.values = [
        ...option.values,
        {
          value: "",
          position: option.values.length,
        },
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

      return {
        ...prev,
        options: nextOptions,
        variants: nextVariants,
      };
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

      if (!option || !targetValue) return prev;

      if (
        !String(option.name ?? "").trim() ||
        !String(targetValue.value ?? "").trim()
      ) {
        return prev;
      }

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
    setFormData((prev) => {
      const newVariants = prev.variants.filter((_, i) => i !== index);
      return { ...prev, variants: newVariants };
    });

    setErrors({});
  };

  const handleImageSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowedTypes.includes(file.type)) {
      setErrors((prev) => ({
        ...prev,
        thumbnail: "File tải lên phải là ảnh (jpg, png, webp, gif).",
      }));
      e.target.value = "";
      setSelectedFile(null);
      setPreviewImage("");
      return;
    }

    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
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

  const validateForm = () => {
    const newErrors: ErrorMap = {};

    if (!formData.title.trim()) {
      newErrors.title = "Vui lòng nhập tên sản phẩm.";
    }

    if (!formData.product_category_id) {
      newErrors.product_category_id = "Vui lòng chọn danh mục.";
    }

    formData.options.forEach((option, optionIndex) => {
      if (!String(option.name ?? "").trim()) {
        newErrors[`options.${optionIndex}.name`] =
          "Vui lòng nhập tên tùy chọn.";
      }

      if (!Array.isArray(option.values) || option.values.length === 0) {
        newErrors[`options.${optionIndex}.name`] =
          "Mỗi tùy chọn phải có ít nhất 1 giá trị.";
      }

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

    if (!formData.variants.length) {
      newErrors["variants.0.title"] = "Cần ít nhất 1 biến thể.";
    }

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
        newErrors[cardKey] =
          newErrors[cardKey] || "Biến thể này còn thiếu thông tin.";
      }

      if (!priceRaw || !Number.isFinite(priceNumber) || priceNumber <= 0) {
        newErrors[`variants.${index}.price`] = "Giá bán phải lớn hơn 0.";
        newErrors[cardKey] =
          newErrors[cardKey] || "Biến thể này còn thiếu thông tin.";
      }

      if (
        compareAtPriceRaw &&
        (!Number.isFinite(compareAtPriceNumber) || compareAtPriceNumber < 0)
      ) {
        newErrors[`variants.${index}.compareAtPrice`] =
          "Giá so sánh phải lớn hơn hoặc bằng 0.";
        newErrors[cardKey] =
          newErrors[cardKey] || "Biến thể này còn thiếu thông tin.";
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
        newErrors[cardKey] =
          newErrors[cardKey] || "Biến thể này còn thiếu thông tin.";
      }

      const normalizedSelections = formData.options.map((option) => {
        const optionName = String(option.name ?? "").trim();
        const matches = (variant.optionValues || []).filter(
          (ov) =>
            normalizeTextForCompare(ov.optionName ?? "") ===
            normalizeTextForCompare(optionName),
        );

        if (!optionName || !option.values.length) {
          return null;
        }

        if (matches.length !== 1 || !String(matches[0]?.value ?? "").trim()) {
          newErrors[`variants.${index}.optionValues`] =
            "Mỗi biến thể phải chọn đúng 1 giá trị cho mỗi tùy chọn.";
          newErrors[cardKey] =
            newErrors[cardKey] || "Biến thể này còn thiếu thông tin.";
          return null;
        }

        const selectedValue = normalizeTextForCompare(matches[0].value ?? "");
        const validOptionValues = option.values.map((value) =>
          normalizeTextForCompare(value.value),
        );

        if (!validOptionValues.includes(selectedValue)) {
          newErrors[`variants.${index}.optionValues`] =
            "Có giá trị tùy chọn không còn hợp lệ trong biến thể này.";
          newErrors[cardKey] =
            newErrors[cardKey] || "Biến thể này còn thiếu thông tin.";
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
            "Tổ hợp tùy chọn của biến thể này đang bị trùng.";
          newErrors[cardKey] =
            newErrors[cardKey] || "Biến thể này còn thiếu thông tin.";
        } else {
          usedVariantCombinationKeys.add(key);
        }
      }
    });

    setErrors(newErrors);
    scrollToFirstError(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

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
        if (uploadJson.success && uploadJson.data?.url) {
          uploadedThumbnailUrl = uploadJson.data.url;
        } else if (uploadJson.url) {
          uploadedThumbnailUrl = uploadJson.url;
        } else {
          setErrors({
            thumbnail:
              "Không thể upload ảnh minh họa. Vui lòng thử lại hoặc chọn ảnh khác.",
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

      const json = await http<any>("POST", "/api/v1/admin/products/create", {
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
      });

      if (json.success) {
        showSuccessToast({ message: "Thêm sản phẩm thành công!" });
        navigate("/admin/products");
      } else {
        if (json.errors) {
          setErrors(json.errors);
          scrollToFirstError(json.errors);
        } else {
          showErrorToast(json.message || "Không thể thêm sản phẩm!");
        }
      }
    } catch (err: any) {
      console.error("Create product error:", err);
      if (err?.message) {
        showErrorToast(err.message);
      } else {
        showErrorToast(
          "Không thể xử lý yêu cầu. Vui lòng kiểm tra định dạng file.",
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
          Thêm sản phẩm
        </h1>
        <button
          onClick={() => navigate("/admin/products")}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-md transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Quay lại
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 p-2">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Tên sản phẩm <span className="text-red-500">*</span>
          </label>
          <input
            ref={setFieldRef("title") as React.Ref<HTMLInputElement>}
            type="text"
            name="title"
            value={formData.title}
            onChange={handleInputChange}
            className={`w-full border ${
              errors.title
                ? "border-red-500 dark:border-red-500"
                : "border-gray-300 dark:border-gray-600"
            } rounded-md p-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors`}
          />
          {errors.title && (
            <p className="text-sm text-red-600 dark:text-red-400 mt-1">
              {errors.title}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Danh mục <span className="text-red-500">*</span>
          </label>
          <select
            ref={
              setFieldRef("product_category_id") as React.Ref<HTMLSelectElement>
            }
            name="product_category_id"
            value={formData.product_category_id}
            onChange={handleInputChange}
            className={`w-full border ${
              errors.product_category_id
                ? "border-red-500 dark:border-red-500"
                : "border-gray-300 dark:border-gray-600"
            } rounded-md p-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors`}
          >
            <option value="" disabled>
              -- Chọn danh mục --
            </option>
            {renderCategoryOptions(buildCategoryTree(categories))}
          </select>
          {errors.product_category_id && (
            <p className="text-sm text-red-600 dark:text-red-400 mt-1">
              {errors.product_category_id}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Xuất xứ
          </label>
          <select
            name="origin_id"
            value={formData.origin_id}
            onChange={handleInputChange}
            className="w-full border border-gray-300 dark:border-gray-600 rounded-md p-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
          >
            <option value="">-- Chọn xuất xứ --</option>
            {origins.map((origin) => (
              <option key={origin.id} value={origin.id}>
                {origin.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Mô tả ngắn
          </label>
          <textarea
            name="short_description"
            rows={3}
            value={formData.short_description}
            onChange={handleInputChange}
            className="w-full border border-gray-300 dark:border-gray-600 rounded-md p-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
            placeholder="Nhập mô tả ngắn gọn về sản phẩm..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Mô tả sản phẩm
          </label>
          <RichTextEditor
            value={formData.description}
            onChange={(content) =>
              setFormData((prev) => ({ ...prev, description: content }))
            }
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Hướng dẫn bảo quản
          </label>
          <RichTextEditor
            value={formData.storage_guide}
            onChange={(content) =>
              setFormData((prev) => ({ ...prev, storage_guide: content }))
            }
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Gợi ý sử dụng
          </label>
          <RichTextEditor
            value={formData.usage_suggestions}
            onChange={(content) =>
              setFormData((prev) => ({ ...prev, usage_suggestions: content }))
            }
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Ghi chú dinh dưỡng
          </label>
          <RichTextEditor
            value={formData.nutrition_notes}
            onChange={(content) =>
              setFormData((prev) => ({ ...prev, nutrition_notes: content }))
            }
          />
        </div>

        <div className="mt-4 border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-800/50">
          <label className="block text-base font-bold text-gray-800 dark:text-white mb-4">
            Thẻ sản phẩm (Product Tags)
          </label>
          {Object.keys(groupedTags).length > 0 ? (
            <div className="space-y-4">
              {Object.entries(groupedTags).map(([group, groupTags]) => (
                <div key={group}>
                  <h4 className="text-sm font-semibold text-gray-600 dark:text-gray-300 mb-2">
                    {group}
                  </h4>
                  <div className="flex flex-wrap gap-3">
                    {groupTags.map((tag) => (
                      <label
                        key={tag.id}
                        className="flex items-center space-x-2 cursor-pointer bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-full px-3 py-1.5 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={formData.tag_ids.includes(tag.id)}
                          onChange={() => handleToggleTag(tag.id)}
                          className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
                        />
                        <span className="text-sm text-gray-800 dark:text-gray-200">
                          {tag.name}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">Chưa có thẻ sản phẩm nào.</p>
          )}
        </div>

        <div className="mt-8 border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-800/50">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-800 dark:text-white">
              Tùy chọn sản phẩm
            </h3>
            <button
              type="button"
              onClick={addOption}
              className="flex items-center gap-1 text-sm bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-200 px-3 py-1.5 rounded-md hover:bg-green-200 dark:hover:bg-green-800 transition-colors"
            >
              <Plus className="w-4 h-4" /> Thêm tùy chọn
            </button>
          </div>

          <div className="space-y-4">
            {formData.options.map((option, optionIndex) => (
              <div
                key={option.id ?? `option-${optionIndex}`}
                className="border border-gray-200 dark:border-gray-700 rounded-md p-4 bg-white dark:bg-gray-800"
              >
                <div className="flex items-start gap-3 mb-3">
                  <div className="flex-1">
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
                      placeholder="Tên tùy chọn, ví dụ: Size"
                      className={`flex-1 w-full border ${
                        errors[`options.${optionIndex}.name`]
                          ? "border-red-500"
                          : "border-gray-300 dark:border-gray-600"
                      } rounded p-2 text-sm bg-white dark:bg-gray-900 dark:text-white`}
                    />
                    {errors[`options.${optionIndex}.name`] && (
                      <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                        {errors[`options.${optionIndex}.name`]}
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => removeOption(optionIndex)}
                    disabled={formData.options.length === 1}
                    className="bg-red-500 text-white p-2 rounded-md hover:bg-red-600 disabled:opacity-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-2">
                  {option.values.map((value, valueIndex) => (
                    <div
                      key={value.id ?? `value-${valueIndex}`}
                      className="flex gap-2 items-start"
                    >
                      <div className="flex-1">
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
                          placeholder="Giá trị, ví dụ: S / M / L"
                          className={`flex-1 w-full border ${
                            errors[
                              `options.${optionIndex}.values.${valueIndex}`
                            ]
                              ? "border-red-500"
                              : "border-gray-300 dark:border-gray-600"
                          } rounded p-2 text-sm bg-white dark:bg-gray-900 dark:text-white`}
                        />
                        {errors[
                          `options.${optionIndex}.values.${valueIndex}`
                        ] && (
                          <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                            {
                              errors[
                                `options.${optionIndex}.values.${valueIndex}`
                              ]
                            }
                          </p>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          removeOptionValue(optionIndex, valueIndex)
                        }
                        disabled={option.values.length === 1}
                        className="bg-red-100 text-red-600 px-3 h-10 rounded-md hover:bg-red-200 disabled:opacity-50"
                      >
                        Xóa
                      </button>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => addOptionValue(optionIndex)}
                  className="mt-3 text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  + Thêm giá trị
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-8 border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-800/50">
          <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
            <h3 className="text-lg font-bold text-gray-800 dark:text-white">
              Danh sách biến thể <span className="text-red-500">*</span>
            </h3>
            <button
              type="button"
              onClick={suggestVariants}
              className="flex items-center gap-1 text-sm bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-200 px-3 py-1.5 rounded-md hover:bg-amber-200 dark:hover:bg-amber-800 transition-colors"
            >
              <Sparkles className="w-4 h-4" /> Gợi ý biến thể
            </button>
          </div>

          <div className="mb-4 space-y-1 text-sm text-gray-600 dark:text-gray-300">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Sau khi thêm hoặc sửa tùy chọn, bấm{" "}
              <span className="font-semibold">Gợi ý biến thể</span> để tự tạo
              toàn bộ tổ hợp tên biến thể và SKU.
            </p>
          </div>

          <div className="space-y-4">
            {formData.variants.map((variant, index) => (
              <div
                key={index}
                ref={
                  setFieldRef(
                    `variant-card-${index}`,
                  ) as React.Ref<HTMLDivElement>
                }
                className={`grid grid-cols-1 md:grid-cols-12 gap-4 p-4 bg-white dark:bg-gray-800 border rounded-md relative group ${
                  errors[`variant-card-${index}`]
                    ? "border-red-500 dark:border-red-500"
                    : "border-gray-200 dark:border-gray-700"
                }`}
              >
                <div className="absolute top-2 right-2 md:-right-3 md:-top-3 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    type="button"
                    onClick={() => removeVariant(index)}
                    disabled={formData.variants.length === 1}
                    className="bg-red-500 text-white p-1.5 rounded-full shadow-sm hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="col-span-1 md:col-span-3">
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    Tên biến thể *
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
                    placeholder="VD: Đỏ - Size L"
                    className={`w-full border ${
                      errors[`variants.${index}.title`]
                        ? "border-red-500"
                        : "border-gray-300 dark:border-gray-600"
                    } rounded p-2 text-sm bg-white dark:bg-gray-900 dark:text-white focus:ring-1 focus:ring-blue-500`}
                  />
                  {errors[`variants.${index}.title`] && (
                    <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                      {errors[`variants.${index}.title`]}
                    </p>
                  )}
                </div>

                <div className="col-span-1 md:col-span-2">
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    SKU
                  </label>
                  <input
                    type="text"
                    value={variant.sku || ""}
                    onChange={(e) =>
                      handleVariantChange(index, "sku", e.target.value)
                    }
                    placeholder="Mã SP"
                    className="w-full border border-gray-300 dark:border-gray-600 rounded p-2 text-sm bg-white dark:bg-gray-900 dark:text-white focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div className="col-span-1 md:col-span-12">
                  <label className="block text-xs font-medium text-gray-500 mb-2">
                    Gán tùy chọn cho biến thể
                  </label>

                  <div className="space-y-3">
                    {formData.options.map((option, optionIndex) => (
                      <div key={option.id ?? optionIndex}>
                        <p className="text-xs font-semibold text-gray-600 mb-2">
                          {option.name || `Tùy chọn ${optionIndex + 1}`}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {option.values.map((value, valueIndex) => {
                            const optionKey = option.id ?? optionIndex;
                            const valueKey = value.id ?? valueIndex;
                            const selected = (variant.optionValues || []).some(
                              (ov) =>
                                String(ov.optionName ?? "").trim() ===
                                  String(option.name ?? "").trim() &&
                                String(ov.value ?? "").trim() ===
                                  String(value.value ?? "").trim(),
                            );

                            return (
                              <button
                                key={value.id ?? valueIndex}
                                type="button"
                                onClick={() =>
                                  toggleVariantOptionValue(
                                    index,
                                    optionKey,
                                    valueKey,
                                  )
                                }
                                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border ${
                                  selected
                                    ? "bg-blue-600 text-white border-blue-600"
                                    : "bg-white text-gray-700 border-gray-300"
                                }`}
                              >
                                {value.value || `Giá trị ${valueIndex + 1}`}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>

                  {errors[`variants.${index}.optionValues`] && (
                    <p
                      ref={
                        setFieldRef(
                          `variants.${index}.optionValues`,
                        ) as React.Ref<HTMLParagraphElement>
                      }
                      className="text-sm text-red-600 dark:text-red-400 mt-2"
                    >
                      {errors[`variants.${index}.optionValues`]}
                    </p>
                  )}
                </div>

                <div className="col-span-1 md:col-span-2">
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    Giá bán *
                  </label>
                  <input
                    ref={
                      setFieldRef(
                        `variants.${index}.price`,
                      ) as React.Ref<HTMLInputElement>
                    }
                    type="number"
                    value={variant.price}
                    onChange={(e) =>
                      handleVariantChange(index, "price", e.target.value)
                    }
                    className={`w-full border ${
                      errors[`variants.${index}.price`]
                        ? "border-red-500"
                        : "border-gray-300 dark:border-gray-600"
                    } rounded p-2 text-sm bg-white dark:bg-gray-900 dark:text-white focus:ring-1 focus:ring-blue-500`}
                  />
                  {errors[`variants.${index}.price`] && (
                    <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                      {errors[`variants.${index}.price`]}
                    </p>
                  )}
                </div>

                <div className="col-span-1 md:col-span-2">
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    Giá so sánh
                  </label>
                  <input
                    ref={
                      setFieldRef(
                        `variants.${index}.compareAtPrice`,
                      ) as React.Ref<HTMLInputElement>
                    }
                    type="number"
                    value={variant.compareAtPrice || ""}
                    onChange={(e) =>
                      handleVariantChange(
                        index,
                        "compareAtPrice",
                        e.target.value,
                      )
                    }
                    className={`w-full border ${
                      errors[`variants.${index}.compareAtPrice`]
                        ? "border-red-500"
                        : "border-gray-300 dark:border-gray-600"
                    } rounded p-2 text-sm bg-white dark:bg-gray-900 dark:text-white focus:ring-1 focus:ring-blue-500`}
                  />
                  {errors[`variants.${index}.compareAtPrice`] && (
                    <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                      {errors[`variants.${index}.compareAtPrice`]}
                    </p>
                  )}
                </div>

                <div className="col-span-1 md:col-span-1 flex items-end mb-[2px]">
                  <label className="flex items-center space-x-2 text-sm cursor-pointer">
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
                      className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
                    />
                    <span className="text-gray-600 dark:text-gray-300">
                      Active
                    </span>
                  </label>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-4 mt-4 border-t border-dashed border-gray-300 dark:border-gray-600">
            <button
              type="button"
              onClick={addVariant}
              className="flex items-center gap-1 text-sm bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200 px-3 py-1.5 rounded-md hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
            >
              <Plus className="w-4 h-4" /> Thêm biến thể
            </button>
          </div>
        </div>

        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Ảnh minh họa
          </label>
          <div className="flex flex-wrap gap-3 mb-4">
            <button
              type="button"
              className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
                imageMethod === "upload"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
              }`}
              onClick={() => setImageMethod("upload")}
            >
              Upload ảnh
            </button>
            <button
              type="button"
              className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
                imageMethod === "url"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
              }`}
              onClick={() => setImageMethod("url")}
            >
              Nhập URL
            </button>
          </div>

          {imageMethod === "upload" ? (
            <div>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
                className="block w-full text-sm text-gray-500 dark:text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-gray-700 dark:file:text-gray-200 dark:hover:file:bg-gray-600 cursor-pointer"
              />
            </div>
          ) : (
            <div>
              <input
                ref={setFieldRef("thumbnail") as React.Ref<HTMLInputElement>}
                type="url"
                placeholder="Nhập URL ảnh"
                value={imageUrl}
                onChange={(e) => {
                  setImageUrl(e.target.value);
                  setPreviewImage(e.target.value);
                  setFormData((prev) => ({
                    ...prev,
                    thumbnail: e.target.value,
                  }));
                  clearError("thumbnail");
                }}
                className={`w-full border ${
                  errors.thumbnail
                    ? "border-red-500 dark:border-red-500"
                    : "border-gray-300 dark:border-gray-600"
                } rounded-md p-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors`}
              />
            </div>
          )}

          {errors.thumbnail && (
            <p className="text-sm text-red-600 dark:text-red-400 mt-1">
              {errors.thumbnail}
            </p>
          )}

          {previewImage && (
            <div className="mt-4 relative w-fit">
              <img
                src={previewImage}
                alt="preview"
                className="h-24 w-24 object-cover rounded-md border border-gray-300 dark:border-gray-600 shadow-sm"
              />
              <button
                type="button"
                onClick={() => {
                  setSelectedFile(null);
                  setImageUrl("");
                  setPreviewImage("");
                  setFormData((prev) => ({ ...prev, thumbnail: "" }));
                }}
                className="absolute -top-2 -right-2 bg-red-500 dark:bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600 dark:hover:bg-red-500 transition-colors shadow-md"
              >
                ×
              </button>
            </div>
          )}
        </div>

        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Vị trí hiển thị
          </label>
          <input
            type="number"
            name="position"
            value={formData.position || ""}
            onChange={handleInputChange}
            placeholder="Nếu bỏ trống, hệ thống sẽ tự thêm ở cuối"
            className="w-full border border-gray-300 dark:border-gray-600 rounded-md p-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
          />
        </div>

        <div className="pt-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Trạng thái
          </label>
          <div className="flex gap-6">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="radio"
                name="status"
                value="active"
                checked={formData.status === "active"}
                onChange={handleInputChange}
                className="text-blue-600 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
              />
              <span className="text-gray-800 dark:text-gray-200">
                Hoạt động
              </span>
            </label>
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="radio"
                name="status"
                value="inactive"
                checked={formData.status === "inactive"}
                onChange={handleInputChange}
                className="text-red-600 focus:ring-red-500 dark:bg-gray-700 dark:border-gray-600"
              />
              <span className="text-gray-800 dark:text-gray-200">
                Dừng hoạt động
              </span>
            </label>
          </div>
        </div>

        <div className="pt-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Sản phẩm nổi bật
          </label>
          <div className="flex gap-6">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="radio"
                name="featured"
                value={1}
                checked={Number(formData.featured) === 1}
                onChange={handleInputChange}
                className="text-blue-600 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
              />
              <span className="text-gray-800 dark:text-gray-200">Nổi bật</span>
            </label>
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="radio"
                name="featured"
                value={0}
                checked={Number(formData.featured) === 0}
                onChange={handleInputChange}
                className="text-gray-600 focus:ring-gray-500 dark:bg-gray-700 dark:border-gray-600"
              />
              <span className="text-gray-800 dark:text-gray-200">
                Không nổi bật
              </span>
            </label>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
          <button
            type="button"
            onClick={() => navigate("/admin/products")}
            className="px-4 py-2 rounded-md border border-gray-400 dark:border-gray-600 text-gray-700 dark:text-gray-200 bg-transparent hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors font-medium"
          >
            Hủy
          </button>
          <button
            type="submit"
            className="flex items-center gap-2 px-5 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:opacity-50 font-medium"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" /> Đang lưu...
              </>
            ) : (
              "Lưu sản phẩm"
            )}
          </button>
        </div>
      </form>
    </Card>
  );
};

export default ProductCreatePage;
