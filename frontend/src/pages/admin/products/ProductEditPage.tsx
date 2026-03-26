// src/pages/admin/ProductEditPage.tsx
import React, { useEffect, useState, useMemo, useRef } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Loader2, Save, ArrowLeft, Plus, Sparkles, Trash2 } from "lucide-react";
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
  group?: {
    id: number;
    name: string;
    slug?: string | null;
  } | null;
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
  stock: number | string;
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
  // --- Thêm fields mới ---
  origin_id: number | string;
  tag_ids: number[];
  short_description: string;
  storage_guide: string;
  usage_suggestions: string;
  nutrition_notes: string;
  // -----------------------
  price: number | string;
  stock: number | string;
  thumbnail: string;
  status: "active" | "inactive";
  featured: number;
  position: number | string;
  options?: ProductOptionInput[];
  variants?: ProductVariantInput[];
}

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

// =============================
// HELPERS
// =============================
const getDerivedProductStockFromVariants = (
  variants: ProductVariantInput[],
) => {
  return variants.reduce((sum, variant) => {
    const stock = Number(variant.stock ?? 0);
    return sum + (Number.isFinite(stock) ? Math.max(0, stock) : 0);
  }, 0);
};

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

const getOptionErrorKey = (optionIndex: number, field: "name") =>
  `options.${optionIndex}.${field}`;

const getOptionValueErrorKey = (optionIndex: number, valueIndex: number) =>
  `options.${optionIndex}.values.${valueIndex}.value`;

const getVariantErrorKey = (variantIndex: number, field: string) =>
  `variants.${variantIndex}.${field}`;

const isNonNegativeIntegerString = (value: number | string) => {
  const normalized = String(value ?? "").trim();
  return /^\d+$/.test(normalized);
};

const ProductEditPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [product, setProduct] = useState<Product | null>(null);
  const [initialProduct, setInitialProduct] = useState<Product | null>(null);

  // States phụ trợ
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [origins, setOrigins] = useState<Origin[]>([]);
  const [tags, setTags] = useState<ProductTag[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [fetchError, setFetchError] = useState("");
  const [formErrors, setFormErrors] = useState<
    Partial<Record<keyof Product | string, string>>
  >({});
  const fieldRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // file ảnh mới (chưa upload)
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewImage, setPreviewImage] = useState<string>("");
  const [imageMethod, setImageMethod] = useState<"upload" | "url" | "keep">(
    "keep",
  );
  const [imageUrl, setImageUrl] = useState<string>("");
  const { showSuccessToast, showErrorToast } = useAdminToast();

  // 🔹 Tính toán derived product stock từ variants
  const derivedProductStock = useMemo(() => {
    return getDerivedProductStockFromVariants(product?.variants || []);
  }, [product?.variants]);

  // Lấy dữ liệu sản phẩm
  const fetchProduct = async () => {
    try {
      setLoading(true);
      const json = await http<any>(`GET`, `/api/v1/admin/products/edit/${id}`);
      if (json.success && json.data) {
        const data = json.data;

        // Chuẩn hóa dữ liệu nhận được
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

          discount_percentage:
            data.discount_percentage ?? data.discountPercentage ?? 0,

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
                stock: v.stock ?? 0,
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
      console.error(err);
      setFetchError(
        err instanceof Error ? err.message : "Không thể kết nối server.",
      );
    } finally {
      setLoading(false);
    }
  };

  const isDirty = React.useMemo(() => {
    if (!product || !initialProduct) return false;

    // Lấy tồn kho chuẩn hóa để compare
    const initialStockComparable =
      Array.isArray(initialProduct.variants) &&
      initialProduct.variants.length > 0
        ? getDerivedProductStockFromVariants(initialProduct.variants)
        : Number(initialProduct.stock ?? 0);

    // So sánh dữ liệu cơ bản
    const hasFieldChanges =
      product.title !== initialProduct.title ||
      product.description !== initialProduct.description ||
      String(product.product_category_id) !==
        String(initialProduct.product_category_id) ||
      Number(product.price) !== Number(initialProduct.price) ||
      derivedProductStock !== initialStockComparable || // Dùng derivedProductStock thay vì product.stock
      product.status !== initialProduct.status ||
      Number(product.featured) !== Number(initialProduct.featured) ||
      String(product.position) !== String(initialProduct.position) ||
      // Các field metadata mới
      String(product.origin_id) !== String(initialProduct.origin_id) ||
      product.short_description !== initialProduct.short_description ||
      product.storage_guide !== initialProduct.storage_guide ||
      product.usage_suggestions !== initialProduct.usage_suggestions ||
      product.nutrition_notes !== initialProduct.nutrition_notes;

    // So sánh mảng tags (sắp xếp trước khi stringify)
    const hasTagChanges =
      JSON.stringify([...(product.tag_ids || [])].sort()) !==
      JSON.stringify([...(initialProduct.tag_ids || [])].sort());

    // So sánh ảnh
    const hasImageChanges =
      (imageMethod === "upload" && selectedFile !== null) ||
      (imageMethod === "url" &&
        imageUrl !== "" &&
        imageUrl !== initialProduct.thumbnail);

    // So sánh options
    const hasOptionChanges =
      JSON.stringify(product.options) !==
      JSON.stringify(initialProduct.options);

    // So sánh variants
    const hasVariantChanges =
      JSON.stringify(product.variants) !==
      JSON.stringify(initialProduct.variants);

    return (
      hasFieldChanges ||
      hasTagChanges ||
      hasImageChanges ||
      hasOptionChanges ||
      hasVariantChanges
    );
  }, [
    product,
    initialProduct,
    selectedFile,
    imageMethod,
    imageUrl,
    derivedProductStock,
  ]);

  // Lấy danh sách danh mục, xuất xứ và tags
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
        const json = await http<any>("GET", "/api/v1/admin/origins?limit=100");
        if (json.success && Array.isArray(json.data)) {
          const activeOrigins = json.data.filter(
            (origin: any) => origin.status === "active",
          );
          setOrigins(activeOrigins);
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

  useEffect(() => {
    fetchProduct();
  }, [id]);

  // Gom nhóm thẻ sản phẩm
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

  const registerFieldRef =
    (key: string) => (element: HTMLDivElement | null) => {
      fieldRefs.current[key] = element;
    };

  const clearFormError = (key: string) => {
    setFormErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const scrollToFirstError = (
    errors: Partial<Record<keyof Product | string, string>>,
  ) => {
    const firstKey = Object.keys(errors)[0];
    if (!firstKey) return;

    const target = fieldRefs.current[firstKey];
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "center" });
      const focusable = target.querySelector<HTMLElement>(
        "input, select, textarea, button, [contenteditable='true']",
      );
      window.setTimeout(() => focusable?.focus(), 120);
    }
  };

  // 🔹 Xử lý input cơ bản
  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => {
    const { name, type, value } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setProduct((prev) =>
      prev
        ? {
            ...prev,
            [name]: type === "checkbox" ? (checked ? 1 : 0) : value,
          }
        : prev,
    );

    clearFormError(name);
  };

  // 🔹 Handler riêng cho Multi-select Tags
  const handleToggleTag = (tagId: number) => {
    setProduct((prev) => {
      if (!prev) return prev;

      const currentTags = prev.tag_ids || [];
      const isSelected = currentTags.includes(tagId);

      const newTagIds = isSelected
        ? currentTags.filter((id) => id !== tagId)
        : [...currentTags, tagId];

      return {
        ...prev,
        tag_ids: [...new Set(newTagIds)],
      };
    });
  };

  // 🔹 Xử lý thay đổi biến thể
  const handleVariantChange = (
    index: number,
    field: keyof ProductVariantInput,
    value: any,
  ) => {
    if (!product) return;
    setProduct((prev) => {
      if (!prev) return prev;
      const newVariants = [...(prev.variants || [])];
      newVariants[index] = { ...newVariants[index], [field]: value };
      return { ...prev, variants: newVariants };
    });
    clearFormError(getVariantErrorKey(index, String(field)));
    clearFormError(getVariantErrorKey(index, "optionValues"));
  };

  const addVariant = () => {
    if (!product) return;
    setProduct((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        variants: [
          ...(prev.variants || []),
          {
            title: "",
            price: "0",
            stock: "0",
            status: "active",
            sortOrder: (prev.variants || []).length,
            optionValueIds: [],
            optionValues: [],
          },
        ],
      };
    });
  };

  const suggestVariants = () => {
    if (!product) return;

    setProduct((prev) => {
      if (!prev) return prev;

      const productTitle = String(prev.title ?? "").trim();
      const combinations = buildVariantCartesian(prev.options || []);
      const totalOptions = (prev.options || []).filter(
        (option) =>
          String(option.name ?? "").trim() &&
          Array.isArray(option.values) &&
          option.values.some((value) => String(value.value ?? "").trim()),
      ).length;

      if (!combinations.length || totalOptions === 0) {
        return prev;
      }

      const existingVariants = prev.variants || [];

      const exactVariantMap = new Map<string, ProductVariantInput>();
      existingVariants.forEach((variant) => {
        const optionValues = variant.optionValues || [];
        if (optionValues.length === totalOptions) {
          exactVariantMap.set(
            buildVariantCombinationKey(optionValues),
            variant,
          );
        }
      });

      const findBestTemplateVariant = (
        combination: ProductVariantSelectedOptionValue[],
      ) => {
        const combinationMap = new Map(
          combination.map((item) => [
            normalizeTextForCompare(item.optionName ?? ""),
            normalizeTextForCompare(item.value ?? ""),
          ]),
        );

        let bestMatch: ProductVariantInput | null = null;
        let bestScore = -1;

        existingVariants.forEach((variant) => {
          const optionValues = (variant.optionValues || []).filter(
            (item) =>
              String(item.optionName ?? "").trim() &&
              String(item.value ?? "").trim(),
          );

          if (!optionValues.length) {
            return;
          }

          const isSubset = optionValues.every((item) => {
            const optionName = normalizeTextForCompare(item.optionName ?? "");
            const optionValue = normalizeTextForCompare(item.value ?? "");
            return combinationMap.get(optionName) === optionValue;
          });

          if (!isSubset) {
            return;
          }

          if (optionValues.length > bestScore) {
            bestMatch = variant;
            bestScore = optionValues.length;
          }
        });

        return bestMatch;
      };

      const nextVariants: ProductVariantInput[] = combinations.map(
        (combination, index) => {
          const key = buildVariantCombinationKey(combination);
          const exactVariant = exactVariantMap.get(key);
          const templateVariant =
            exactVariant || findBestTemplateVariant(combination);
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
            id: exactVariant?.id,
            title:
              autoTitle ||
              templateVariant?.title ||
              exactVariant?.title ||
              `Biến thể ${index + 1}`,
            sku: autoSku || templateVariant?.sku || exactVariant?.sku || null,
            price: templateVariant?.price ?? prev.price ?? "0",
            compareAtPrice: templateVariant?.compareAtPrice ?? "",
            stock: templateVariant?.stock ?? "0",
            status: templateVariant?.status ?? "active",
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

    setFormErrors((prev) => ({
      ...prev,
      options: undefined,
      variants: undefined,
      price: undefined,
    }));
  };

  const removeVariant = (index: number) => {
    if (!product) return;
    setProduct((prev) => {
      if (!prev) return prev;
      const newVariants = (prev.variants || []).filter((_, i) => i !== index);
      return { ...prev, variants: newVariants };
    });
  };

  // 🔹 Xử lý thay đổi tùy chọn (Options)
  const handleOptionChange = (
    optionIndex: number,
    field: keyof ProductOptionInput,
    value: any,
  ) => {
    if (!product) return;

    setProduct((prev) => {
      if (!prev) return prev;

      const nextOptions = [...(prev.options || [])];
      const oldOption = nextOptions[optionIndex];
      const oldName = oldOption?.name ?? "";

      nextOptions[optionIndex] = {
        ...oldOption,
        [field]: value,
      };

      let nextVariants = prev.variants || [];

      if (field === "name") {
        nextVariants = nextVariants.map((variant) => ({
          ...variant,
          optionValues: (variant.optionValues || []).map((ov) =>
            ov.optionName === oldName ? { ...ov, optionName: value } : ov,
          ),
        }));
      }

      return {
        ...prev,
        options: nextOptions,
        variants: nextVariants,
      };
    });

    clearFormError(getOptionErrorKey(optionIndex, "name"));
  };

  const handleOptionValueChange = (
    optionIndex: number,
    valueIndex: number,
    value: string,
  ) => {
    if (!product) return;

    setProduct((prev) => {
      if (!prev) return prev;

      const nextOptions = [...(prev.options || [])];
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

      const nextVariants = (prev.variants || []).map((variant) => ({
        ...variant,
        optionValues: (variant.optionValues || []).map((ov) =>
          ov.optionName === optionName && ov.value === oldValue
            ? { ...ov, value }
            : ov,
        ),
      }));

      return {
        ...prev,
        options: nextOptions,
        variants: nextVariants,
      };
    });

    clearFormError(getOptionValueErrorKey(optionIndex, valueIndex));
  };

  const addOption = () => {
    if (!product) return;
    setProduct((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        options: [
          ...(prev.options || []),
          {
            name: "",
            position: (prev.options || []).length,
            values: [{ value: "", position: 0 }],
          },
        ],
      };
    });
  };

  const removeOption = (optionIndex: number) => {
    if (!product) return;
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

      return {
        ...prev,
        options: nextOptions,
        variants: nextVariants,
      };
    });
  };

  const addOptionValue = (optionIndex: number) => {
    if (!product) return;
    setProduct((prev) => {
      if (!prev) return prev;
      const nextOptions = [...(prev.options || [])];
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

    clearFormError(getOptionErrorKey(optionIndex, "name"));
  };

  const removeOptionValue = (optionIndex: number, valueIndex: number) => {
    if (!product) return;
    setProduct((prev) => {
      if (!prev) return prev;
      const nextOptions = [...(prev.options || [])];
      const option = { ...nextOptions[optionIndex] };
      const removed = option.values[valueIndex];
      option.values = option.values.filter((_, i) => i !== valueIndex);
      nextOptions[optionIndex] = option;

      const nextVariants = (prev.variants || []).map((variant) => ({
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
  };

  const toggleVariantOptionValue = (
    variantIndex: number,
    optionIdOrTempIndex: number,
    valueIdOrTempKey: number,
  ) => {
    if (!product) return;

    setProduct((prev) => {
      if (!prev) return prev;

      const nextVariants = [...(prev.variants || [])];
      const current = nextVariants[variantIndex];

      const option = (prev.options || []).find(
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

      const nextIds = (current.optionValueIds || []).filter(
        (id) => !optionValueKeys.includes(id),
      );
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

    clearFormError(getVariantErrorKey(variantIndex, "optionValues"));
  };

  // 🔹 Chọn ảnh mới → chỉ preview
  const handleImageSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];

    if (!allowedTypes.includes(file.type)) {
      setFormErrors((prev) => ({
        ...prev,
        thumbnail: "File tải lên phải là ảnh (jpg, png, webp, gif).",
      }));
      e.target.value = "";
      setSelectedFile(null);
      setPreviewImage(product?.thumbnail || "");
      return;
    }

    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      setFormErrors((prev) => ({
        ...prev,
        thumbnail: "Ảnh không được lớn hơn 5MB.",
      }));
      e.target.value = "";
      setSelectedFile(null);
      setPreviewImage(product?.thumbnail || "");
      return;
    }

    setSelectedFile(file);
    setPreviewImage(URL.createObjectURL(file));

    if (formErrors.thumbnail) {
      setFormErrors((prev) => ({ ...prev, thumbnail: undefined }));
    }
  };

  const validateForm = () => {
    if (!product) return false;

    const newErrors: Partial<Record<keyof Product | string, string>> = {};

    if (!String(product.title ?? "").trim()) {
      newErrors.title = "Vui lòng nhập tên sản phẩm.";
    }

    if (!product.product_category_id) {
      newErrors.product_category_id = "Vui lòng chọn danh mục.";
    }

    const normalizedOptions = (product.options || []).map(
      (option, optionIndex) => ({
        ...option,
        name: String(option.name ?? "").trim(),
        values: (option.values || []).map((value, valueIndex) => ({
          ...value,
          value: String(value.value ?? "").trim(),
          position: value.position ?? valueIndex,
        })),
        position: option.position ?? optionIndex,
      }),
    );

    normalizedOptions.forEach((option, optionIndex) => {
      if (!option.name) {
        newErrors[getOptionErrorKey(optionIndex, "name")] =
          "Vui lòng nhập tên tùy chọn.";
      }

      if (!option.values.length) {
        newErrors[getOptionErrorKey(optionIndex, "name")] =
          newErrors[getOptionErrorKey(optionIndex, "name")] ||
          "Mỗi tùy chọn phải có ít nhất 1 giá trị.";
      }

      const seenValues = new Set<string>();
      option.values.forEach((value, valueIndex) => {
        const valueKey = getOptionValueErrorKey(optionIndex, valueIndex);
        const normalizedValue = normalizeTextForCompare(value.value);

        if (!value.value) {
          newErrors[valueKey] = "Vui lòng nhập giá trị tùy chọn.";
          return;
        }

        if (seenValues.has(normalizedValue)) {
          newErrors[valueKey] =
            "Giá trị này đang bị trùng trong cùng tùy chọn.";
          return;
        }

        seenValues.add(normalizedValue);
      });
    });

    const activeOptions = normalizedOptions.filter(
      (option) => option.name && option.values.some((value) => value.value),
    );

    const activeOptionNames = activeOptions.map((option) => option.name);
    const duplicateOptionNames = new Set<string>();
    const optionNameTracker = new Set<string>();
    activeOptionNames.forEach((name) => {
      const normalizedName = normalizeTextForCompare(name);
      if (optionNameTracker.has(normalizedName)) {
        duplicateOptionNames.add(normalizedName);
      }
      optionNameTracker.add(normalizedName);
    });

    activeOptions.forEach((option, optionIndex) => {
      if (duplicateOptionNames.has(normalizeTextForCompare(option.name))) {
        newErrors[getOptionErrorKey(optionIndex, "name")] =
          "Tên tùy chọn đang bị trùng.";
      }
    });

    const variants = product.variants || [];
    if (!variants.length) {
      newErrors[getVariantErrorKey(0, "title")] = "Cần ít nhất 1 biến thể.";
    }

    const combinationMap = new Map<string, number>();

    variants.forEach((variant, variantIndex) => {
      const title = String(variant.title ?? "").trim();
      const priceRaw = String(variant.price ?? "").trim();
      const compareAtRaw = String(variant.compareAtPrice ?? "").trim();
      const stockRaw = String(variant.stock ?? "").trim();
      const price = Number(variant.price);
      const compareAtPrice =
        compareAtRaw === "" ? null : Number(variant.compareAtPrice);
      const stock = Number(variant.stock);

      if (!title) {
        newErrors[getVariantErrorKey(variantIndex, "title")] =
          "Vui lòng nhập tên biến thể.";
      }

      if (priceRaw === "" || !Number.isFinite(price) || price <= 0) {
        newErrors[getVariantErrorKey(variantIndex, "price")] =
          "Giá bán phải lớn hơn 0.";
      }

      if (compareAtRaw !== "") {
        if (!Number.isFinite(compareAtPrice) || Number(compareAtPrice) < 0) {
          newErrors[getVariantErrorKey(variantIndex, "compareAtPrice")] =
            "Giá so sánh phải lớn hơn hoặc bằng 0.";
        } else if (Number.isFinite(price) && Number(compareAtPrice) < price) {
          newErrors[getVariantErrorKey(variantIndex, "compareAtPrice")] =
            "Giá so sánh không được nhỏ hơn giá bán.";
        }
      }

      if (
        !isNonNegativeIntegerString(stockRaw) ||
        !Number.isFinite(stock) ||
        stock < 0
      ) {
        newErrors[getVariantErrorKey(variantIndex, "stock")] =
          "Tồn kho phải là số nguyên không âm.";
      }

      const selectedOptionValues = (variant.optionValues || [])
        .map((item) => ({
          ...item,
          optionName: String(item.optionName ?? "").trim(),
          value: String(item.value ?? "").trim(),
        }))
        .filter((item) => item.optionName && item.value);

      if (activeOptions.length) {
        const perOptionCount = new Map<string, number>();
        selectedOptionValues.forEach((item) => {
          const normalizedOptionName = normalizeTextForCompare(
            item.optionName ?? "",
          );
          perOptionCount.set(
            normalizedOptionName,
            (perOptionCount.get(normalizedOptionName) ?? 0) + 1,
          );
        });

        const hasInvalidMapping = activeOptions.some((option) => {
          const normalizedOptionName = normalizeTextForCompare(option.name);
          const count = perOptionCount.get(normalizedOptionName) ?? 0;
          if (count !== 1) return true;

          const matched = selectedOptionValues.find(
            (item) =>
              normalizeTextForCompare(item.optionName ?? "") ===
              normalizedOptionName,
          );

          return !option.values.some(
            (value) =>
              normalizeTextForCompare(value.value) ===
              normalizeTextForCompare(matched?.value ?? ""),
          );
        });

        if (hasInvalidMapping) {
          newErrors[getVariantErrorKey(variantIndex, "optionValues")] =
            "Mỗi biến thể phải chọn đúng 1 giá trị hợp lệ cho mỗi tùy chọn.";
        }

        if (!newErrors[getVariantErrorKey(variantIndex, "optionValues")]) {
          const combinationKey = buildVariantCombinationKey(
            selectedOptionValues.map((item, selectedIndex) => ({
              ...item,
              position: item.position ?? selectedIndex,
            })),
          );

          if (combinationMap.has(combinationKey)) {
            newErrors[getVariantErrorKey(variantIndex, "optionValues")] =
              "Tổ hợp tùy chọn của biến thể này đang bị trùng.";

            const firstIndex = combinationMap.get(combinationKey);
            if (typeof firstIndex === "number") {
              newErrors[getVariantErrorKey(firstIndex, "optionValues")] =
                newErrors[getVariantErrorKey(firstIndex, "optionValues")] ||
                "Tổ hợp tùy chọn của biến thể này đang bị trùng.";
            }
          } else {
            combinationMap.set(combinationKey, variantIndex);
          }
        }
      }
    });

    setFormErrors(newErrors);
    if (Object.keys(newErrors).length > 0) {
      window.setTimeout(() => scrollToFirstError(newErrors), 50);
    }

    return Object.keys(newErrors).length === 0;
  };

  // Lưu sản phẩm (upload thumbnail và ảnh trong nội dung)
  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    if (!product) return;

    if (!validateForm()) {
      return;
    }

    try {
      setSaving(true);
      setFormErrors({});
      let thumbnailUrl = product.thumbnail;

      // 🔸 Upload ảnh thumbnail nếu có chọn mới
      if (selectedFile) {
        const formDataImg = new FormData();
        formDataImg.append("file", selectedFile);
        const dataUpload = await http<any>(
          "POST",
          "/api/v1/admin/upload",
          formDataImg,
        );

        if (dataUpload.success && dataUpload.data?.url) {
          thumbnailUrl = dataUpload.data.url;
        } else if (dataUpload.url) {
          thumbnailUrl = dataUpload.url;
        } else {
          setFormErrors({ thumbnail: "Lỗi tải ảnh thumbnail lên máy chủ." });
          setSaving(false);
          return;
        }
      }

      // 🔸 Upload ảnh trong nội dung của các trường Rich Text
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

      // Tính tổng tồn kho chính xác dựa trên danh sách variants trước khi gửi payload
      const derivedStockFromNormalizedVariants =
        getDerivedProductStockFromVariants(product.variants || []);

      // --- Chuẩn hóa payload ---
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
        stock: derivedStockFromNormalizedVariants, // 🔹 Sử dụng stock tổng hợp
        position: product.position === "" ? null : Number(product.position),
        featured: Boolean(Number(product.featured)),
      };

      // Map product_category_id -> categoryId
      if (payload.product_category_id !== undefined) {
        payload.categoryId =
          payload.product_category_id === ""
            ? null
            : Number(payload.product_category_id);
        delete payload.product_category_id;
      }

      // Map origin_id -> originId
      if (payload.origin_id !== undefined) {
        payload.originId =
          payload.origin_id === "" ? null : Number(payload.origin_id);
        delete payload.origin_id;
      }

      // Dọn dẹp các key dùng ở client (snake_case)
      delete payload.short_description;
      delete payload.storage_guide;
      delete payload.usage_suggestions;
      delete payload.nutrition_notes;
      delete payload.tag_ids;

      // Chuẩn hóa Options
      payload.options = (product.options || []).map((option, optionIndex) => ({
        id: option.id,
        name: option.name,
        position: option.position ?? optionIndex,
        values: option.values.map((value, valueIndex) => ({
          id: value.id,
          value: value.value,
          position: value.position ?? valueIndex,
        })),
      }));

      // Chuẩn hóa Variants
      payload.variants = (product.variants || []).map((variant, index) => ({
        id: variant.id,
        sku: variant.sku ?? null,
        title: variant.title ?? null,
        price: Number(variant.price),
        compareAtPrice:
          variant.compareAtPrice !== undefined &&
          variant.compareAtPrice !== null &&
          variant.compareAtPrice !== ""
            ? Number(variant.compareAtPrice)
            : null,
        stock: Number(variant.stock),
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

      // Set fallback cho price từ variant đầu tiên nếu trống
      if (payload.variants.length > 0) {
        if (!payload.price) payload.price = payload.variants[0].price;
      }

      const json = await http<any>(
        "PATCH",
        `/api/v1/admin/products/edit/${id}`,
        payload,
      );

      if (json.success) {
        showSuccessToast({ message: "Cập nhật sản phẩm thành công!" });
        fetchProduct(); // Re-fetch to get latest data
      } else {
        if (json.errors) {
          setFormErrors(json.errors);
        } else {
          showErrorToast(json.message || "Cập nhật thất bại.");
        }
      }
    } catch (err: any) {
      console.error(err);

      if (err?.message) {
        showErrorToast(err.message);
      } else {
        showErrorToast(
          "Không thể xử lý yêu cầu. Vui lòng kiểm tra định dạng file.",
        );
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-gray-500 dark:text-gray-400" />
        <span className="ml-2 text-gray-600 dark:text-gray-400">
          Đang tải dữ liệu sản phẩm...
        </span>
      </div>
    );
  }

  if (fetchError)
    return (
      <p className="text-center text-red-500 dark:text-red-400 py-10">
        {fetchError}
      </p>
    );
  if (!product) return null;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
          Chỉnh sửa sản phẩm
        </h1>
        <button
          onClick={() => navigate("/admin/products")}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-md transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Quay lại
        </button>
      </div>

      <Card>
        <form onSubmit={handleSave} className="space-y-4 p-2">
          {/* Danh mục */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Danh mục sản phẩm <span className="text-red-500">*</span>
            </label>
            <select
              name="product_category_id"
              value={product.product_category_id || ""}
              onChange={handleChange}
              className={`w-full border ${
                formErrors.product_category_id
                  ? "border-red-500 dark:border-red-500"
                  : "border-gray-300 dark:border-gray-600"
              } rounded-md p-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors`}
            >
              <option value="" disabled>
                -- Chọn danh mục --
              </option>
              {renderCategoryOptions(buildCategoryTree(categories))}
            </select>
            {formErrors.product_category_id && (
              <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                {formErrors.product_category_id}
              </p>
            )}
          </div>

          {/* Xuất xứ */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Xuất xứ
            </label>
            <select
              name="origin_id"
              value={product.origin_id || ""}
              onChange={handleChange}
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

          {/* Tên sản phẩm */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Tên sản phẩm <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="title"
              value={product.title || ""}
              onChange={handleChange}
              className={`w-full border ${
                formErrors.title
                  ? "border-red-500 dark:border-red-500"
                  : "border-gray-300 dark:border-gray-600"
              } rounded-md p-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors`}
            />
            {formErrors.title && (
              <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                {formErrors.title}
              </p>
            )}
          </div>

          {/* Mô tả ngắn */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Mô tả ngắn
            </label>
            <textarea
              name="short_description"
              rows={3}
              value={product.short_description || ""}
              onChange={handleChange}
              className="w-full border border-gray-300 dark:border-gray-600 rounded-md p-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
              placeholder="Nhập mô tả ngắn gọn về sản phẩm..."
            />
          </div>

          {/* Mô tả */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Mô tả chi tiết
            </label>
            <RichTextEditor
              value={product.description || ""}
              onChange={(content) =>
                setProduct((prev) =>
                  prev ? { ...prev, description: content } : prev,
                )
              }
            />
          </div>

          {/* Hướng dẫn bảo quản */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Hướng dẫn bảo quản
            </label>
            <RichTextEditor
              value={product.storage_guide || ""}
              onChange={(content) =>
                setProduct((prev) =>
                  prev ? { ...prev, storage_guide: content } : prev,
                )
              }
            />
          </div>

          {/* Gợi ý sử dụng */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Gợi ý sử dụng
            </label>
            <RichTextEditor
              value={product.usage_suggestions || ""}
              onChange={(content) =>
                setProduct((prev) =>
                  prev ? { ...prev, usage_suggestions: content } : prev,
                )
              }
            />
          </div>

          {/* Ghi chú dinh dưỡng */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Ghi chú dinh dưỡng
            </label>
            <RichTextEditor
              value={product.nutrition_notes || ""}
              onChange={(content) =>
                setProduct((prev) =>
                  prev ? { ...prev, nutrition_notes: content } : prev,
                )
              }
            />
          </div>

          {/* Product Tags */}
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
                            checked={(product.tag_ids || []).includes(tag.id)}
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

          {/* --- Block Quản Lý Biến Thể --- */}
          <div className="mt-8 border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-800/50">
            {/* Block Tùy chọn sản phẩm */}
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
                {(product.options || []).map((option, optionIndex) => (
                  <div
                    key={option.id ?? `option-${optionIndex}`}
                    ref={registerFieldRef(
                      getOptionErrorKey(optionIndex, "name"),
                    )}
                    className="border border-gray-200 dark:border-gray-700 rounded-md p-4 bg-white dark:bg-gray-800"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <input
                        type="text"
                        value={option.name}
                        onChange={(e) =>
                          handleOptionChange(
                            optionIndex,
                            "name",
                            e.target.value,
                          )
                        }
                        placeholder="Tên tùy chọn, ví dụ: Size"
                        className={`flex-1 border ${formErrors[getOptionErrorKey(optionIndex, "name")] ? "border-red-500 dark:border-red-500" : "border-gray-300 dark:border-gray-600"} rounded p-2 text-sm bg-white dark:bg-gray-900 dark:text-white`}
                      />
                      <button
                        type="button"
                        onClick={() => removeOption(optionIndex)}
                        disabled={(product.options || []).length === 1}
                        className="bg-red-500 text-white p-2 rounded-md hover:bg-red-600 disabled:opacity-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    {formErrors[getOptionErrorKey(optionIndex, "name")] && (
                      <p className="mb-3 text-sm text-red-600 dark:text-red-400">
                        {formErrors[getOptionErrorKey(optionIndex, "name")]}
                      </p>
                    )}

                    <div className="space-y-2">
                      {option.values.map((value, valueIndex) => (
                        <div
                          key={value.id ?? `value-${valueIndex}`}
                          ref={registerFieldRef(
                            getOptionValueErrorKey(optionIndex, valueIndex),
                          )}
                          className="flex flex-col gap-1"
                        >
                          <div className="flex gap-2">
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
                              placeholder="Giá trị, ví dụ: S / M / L"
                              className={`flex-1 border ${formErrors[getOptionErrorKey(optionIndex, "name")] ? "border-red-500 dark:border-red-500" : "border-gray-300 dark:border-gray-600"} rounded p-2 text-sm bg-white dark:bg-gray-900 dark:text-white`}
                            />
                            <button
                              type="button"
                              onClick={() =>
                                removeOptionValue(optionIndex, valueIndex)
                              }
                              disabled={option.values.length === 1}
                              className="bg-red-100 text-red-600 px-3 rounded-md hover:bg-red-200 disabled:opacity-50"
                            >
                              Xóa
                            </button>
                          </div>
                          {formErrors[
                            getOptionValueErrorKey(optionIndex, valueIndex)
                          ] && (
                            <p className="text-sm text-red-600 dark:text-red-400">
                              {
                                formErrors[
                                  getOptionValueErrorKey(
                                    optionIndex,
                                    valueIndex,
                                  )
                                ]
                              }
                            </p>
                          )}
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

            <div className="flex items-center justify-between mb-4 mt-8 gap-3 flex-wrap">
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

            {/* 🔹 Thêm UI Text hiển thị Tồn kho tổng hợp */}
            <div className="mb-4 text-sm text-gray-600 dark:text-gray-300">
              Tổng tồn kho sản phẩm (tự tính từ các biến thể):{" "}
              <span className="font-semibold">{derivedProductStock}</span>
            </div>

            <div className="space-y-4">
              {(product.variants || []).map((variant, index) => (
                <div
                  key={variant.id || `temp-${index}`}
                  ref={registerFieldRef(getVariantErrorKey(index, "title"))}
                  className="grid grid-cols-1 md:grid-cols-12 gap-4 p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md relative group"
                >
                  {/* Nút xóa biến thể */}
                  <div className="absolute top-2 right-2 md:-right-3 md:-top-3 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      type="button"
                      onClick={() => removeVariant(index)}
                      disabled={(product.variants || []).length === 1}
                      className="bg-red-500 text-white p-1.5 rounded-full shadow-sm hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="col-span-1 md:col-span-3">
                    <label className="block text-xs font-medium text-gray-500 mb-1">
                      Tên biến thể
                    </label>
                    <input
                      type="text"
                      value={variant.title || ""}
                      onChange={(e) =>
                        handleVariantChange(index, "title", e.target.value)
                      }
                      placeholder="VD: Đỏ - Size L"
                      className={`w-full border ${formErrors[getVariantErrorKey(index, "title")] ? "border-red-500 dark:border-red-500" : "border-gray-300 dark:border-gray-600"} rounded p-2 text-sm bg-white dark:bg-gray-900 dark:text-white focus:ring-1 focus:ring-blue-500`}
                    />
                    {formErrors[getVariantErrorKey(index, "title")] && (
                      <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                        {formErrors[getVariantErrorKey(index, "title")]}
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

                  {/* Block gán tùy chọn cho biến thể */}
                  <div
                    ref={registerFieldRef(
                      getVariantErrorKey(index, "optionValues"),
                    )}
                    className="col-span-1 md:col-span-12"
                  >
                    <label className="block text-xs font-medium text-gray-500 mb-2">
                      Gán tùy chọn cho biến thể
                    </label>

                    {formErrors[getVariantErrorKey(index, "optionValues")] && (
                      <p className="mb-2 text-sm text-red-600 dark:text-red-400">
                        {formErrors[getVariantErrorKey(index, "optionValues")]}
                      </p>
                    )}

                    <div className="space-y-3">
                      {(product.options || []).map((option, optionIndex) => (
                        <div key={option.id ?? optionIndex}>
                          <p className="text-xs font-semibold text-gray-600 mb-2">
                            {option.name || `Tùy chọn ${optionIndex + 1}`}
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {option.values.map((value, valueIndex) => {
                              const optionKey = option.id ?? optionIndex;
                              const valueKey = value.id ?? valueIndex;
                              const selected = (
                                variant.optionValues || []
                              ).some(
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
                  </div>

                  <div className="col-span-1 md:col-span-2">
                    <label className="block text-xs font-medium text-gray-500 mb-1">
                      Giá bán *
                    </label>
                    <input
                      type="number"
                      value={variant.price}
                      onChange={(e) =>
                        handleVariantChange(index, "price", e.target.value)
                      }
                      className={`w-full border ${formErrors[getVariantErrorKey(index, "price")] ? "border-red-500 dark:border-red-500" : "border-gray-300 dark:border-gray-600"} rounded p-2 text-sm bg-white dark:bg-gray-900 dark:text-white focus:ring-1 focus:ring-blue-500`}
                    />
                    {formErrors[getVariantErrorKey(index, "price")] && (
                      <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                        {formErrors[getVariantErrorKey(index, "price")]}
                      </p>
                    )}
                  </div>

                  <div className="col-span-1 md:col-span-2">
                    <label className="block text-xs font-medium text-gray-500 mb-1">
                      Giá so sánh
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
                      className={`w-full border ${formErrors[getVariantErrorKey(index, "compareAtPrice")] ? "border-red-500 dark:border-red-500" : "border-gray-300 dark:border-gray-600"} rounded p-2 text-sm bg-white dark:bg-gray-900 dark:text-white focus:ring-1 focus:ring-blue-500`}
                    />
                    {formErrors[
                      getVariantErrorKey(index, "compareAtPrice")
                    ] && (
                      <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                        {
                          formErrors[
                            getVariantErrorKey(index, "compareAtPrice")
                          ]
                        }
                      </p>
                    )}
                  </div>

                  <div className="col-span-1 md:col-span-2">
                    <label className="block text-xs font-medium text-gray-500 mb-1">
                      Tồn kho *
                    </label>
                    <input
                      type="number"
                      value={variant.stock}
                      onChange={(e) =>
                        handleVariantChange(index, "stock", e.target.value)
                      }
                      className={`w-full border ${formErrors[getVariantErrorKey(index, "stock")] ? "border-red-500 dark:border-red-500" : "border-gray-300 dark:border-gray-600"} rounded p-2 text-sm bg-white dark:bg-gray-900 dark:text-white focus:ring-1 focus:ring-blue-500`}
                    />
                    {formErrors[getVariantErrorKey(index, "stock")] && (
                      <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                        {formErrors[getVariantErrorKey(index, "stock")]}
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

            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={addVariant}
                className="flex items-center gap-1 text-sm bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200 px-3 py-1.5 rounded-md hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
              >
                <Plus className="w-4 h-4" /> Thêm biến thể
              </button>
            </div>
          </div>

          {/* Vị trí */}
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Vị trí hiển thị
            </label>
            <input
              type="number"
              name="position"
              value={product.position || ""}
              onChange={handleChange}
              placeholder="Nếu bỏ trống sẽ tự xếp cuối"
              className="w-full border border-gray-300 dark:border-gray-600 rounded-md p-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
            />
          </div>

          {/* Ảnh sản phẩm */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Ảnh sản phẩm
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
                Upload ảnh mới
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
              <button
                type="button"
                className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
                  imageMethod === "keep"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                }`}
                onClick={() => {
                  setImageMethod("keep");
                  setPreviewImage(product.thumbnail);
                }}
              >
                Giữ ảnh hiện tại
              </button>
            </div>

            {/* Nội dung theo phương thức */}
            {imageMethod === "upload" ? (
              <div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageSelect}
                  className="block w-full text-sm text-gray-500 dark:text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-gray-700 dark:file:text-gray-200 dark:hover:file:bg-gray-600 cursor-pointer"
                />
              </div>
            ) : imageMethod === "url" ? (
              <div>
                <input
                  type="url"
                  placeholder="Nhập URL ảnh"
                  value={imageUrl}
                  onChange={(e) => {
                    setImageUrl(e.target.value);
                    setPreviewImage(e.target.value);
                    setProduct((prev) =>
                      prev ? { ...prev, thumbnail: e.target.value } : prev,
                    );
                  }}
                  className={`w-full border ${
                    formErrors.thumbnail
                      ? "border-red-500 dark:border-red-500"
                      : "border-gray-300 dark:border-gray-600"
                  } rounded-md p-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors`}
                />
              </div>
            ) : (
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Sẽ giữ nguyên ảnh hiện tại
              </div>
            )}

            {formErrors.thumbnail && (
              <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                {formErrors.thumbnail}
              </p>
            )}

            {previewImage && (
              <div className="mt-4 relative w-fit">
                <img
                  src={previewImage}
                  alt="preview"
                  className="h-24 w-24 object-cover rounded-md border border-gray-300 dark:border-gray-600 shadow-sm"
                />
                {imageMethod !== "keep" && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedFile(null);
                      setImageUrl("");
                      setImageMethod("keep");
                      setPreviewImage(product.thumbnail);
                    }}
                    className="absolute -top-2 -right-2 bg-gray-500 dark:bg-gray-600 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-gray-600 dark:hover:bg-gray-500 transition-colors shadow-md"
                  >
                    ×
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Trạng thái & Nổi bật */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            {/* Trạng thái */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Trạng thái
              </label>
              <div className="flex gap-6">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    name="status"
                    value="active"
                    checked={product.status === "active"}
                    onChange={handleChange}
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
                    checked={product.status === "inactive"}
                    onChange={handleChange}
                    className="text-red-600 focus:ring-red-500 dark:bg-gray-700 dark:border-gray-600"
                  />
                  <span className="text-gray-800 dark:text-gray-200">
                    Dừng hoạt động
                  </span>
                </label>
              </div>
            </div>

            {/* Sản phẩm nổi bật */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Sản phẩm nổi bật
              </label>
              <div className="flex gap-6">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    name="featured"
                    value={1}
                    checked={Number(product.featured) === 1}
                    onChange={handleChange}
                    className="text-blue-600 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
                  />
                  <span className="text-gray-800 dark:text-gray-200">
                    Nổi bật
                  </span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    name="featured"
                    value={0}
                    checked={Number(product.featured) === 0}
                    onChange={handleChange}
                    className="text-gray-600 focus:ring-gray-500 dark:bg-gray-700 dark:border-gray-600"
                  />
                  <span className="text-gray-800 dark:text-gray-200">
                    Không nổi bật
                  </span>
                </label>
              </div>
            </div>
          </div>

          {/* Nút lưu */}
          <div className="flex justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="submit"
              disabled={saving || !isDirty}
              className="flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-400 dark:disabled:bg-gray-600 font-medium"
            >
              {saving ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" /> Đang lưu...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" /> Lưu thay đổi
                </>
              )}
            </button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default ProductEditPage;
