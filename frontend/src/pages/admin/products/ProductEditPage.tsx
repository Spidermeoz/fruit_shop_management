// src/pages/admin/ProductEditPage.tsx
import React, { useEffect, useState, useMemo } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Loader2, Save, ArrowLeft, Plus, Trash2 } from "lucide-react";
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
  title: string;
  status: string;
}

interface ProductTag {
  id: number;
  title: string;
  group: string;
  status: string;
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
  discount_percentage: number | string;
  stock: number | string;
  thumbnail: string;
  status: "active" | "inactive";
  featured: number;
  position: number | string;
  options?: ProductOptionInput[];
  variants?: ProductVariantInput[];
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

          // 🔹 Chuẩn hóa fields mới từ backend trả về
          origin_id: data.originId ?? data.origin?.id ?? "",
          tag_ids:
            data.tagIds ??
            (Array.isArray(data.tags)
              ? data.tags.map((t: any) => Number(t.id))
              : []),
          short_description: data.shortDescription ?? "",
          storage_guide: data.storageGuide ?? "",
          usage_suggestions: data.usageSuggestions ?? "",
          nutrition_notes: data.nutritionNotes ?? "",

          discount_percentage:
            data.discount_percentage ?? data.discountPercentage ?? 0,
          options: Array.isArray(data.options) ? data.options : [],
          variants: Array.isArray(data.variants)
            ? data.variants.map((v: any, index: number) => ({
                id: v.id,
                sku: v.sku ?? null,
                title: v.title ?? null,
                price: v.price ?? 0,
                compareAtPrice: v.compareAtPrice ?? null,
                stock: v.stock ?? 0,
                status: v.status ?? "active",
                sortOrder: v.sortOrder ?? index,
                optionValueIds: Array.isArray(v.optionValueIds)
                  ? v.optionValueIds
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
      Number(product.discount_percentage) !==
        Number(initialProduct.discount_percentage) ||
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

    // So sánh variants
    const hasVariantChanges =
      JSON.stringify(product.variants) !==
      JSON.stringify(initialProduct.variants);

    return (
      hasFieldChanges || hasTagChanges || hasImageChanges || hasVariantChanges
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
          setOrigins(json.data);
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
        if (json.success && Array.isArray(json.data)) {
          const activeTags = json.data.filter(
            (t: any) => t.status === "active",
          );
          setTags(activeTags);
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
        const groupName = tag.group || "Khác";
        if (!acc[groupName]) {
          acc[groupName] = [];
        }
        acc[groupName].push(tag);
        return acc;
      },
      {} as Record<string, ProductTag[]>,
    );
  }, [tags]);

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

    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: undefined }));
    }
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
      return { ...prev, tag_ids: newTagIds };
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
    if (formErrors.price) {
      setFormErrors((prev) => ({ ...prev, price: undefined }));
    }
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
          },
        ],
      };
    });
  };

  const removeVariant = (index: number) => {
    if (!product) return;
    setProduct((prev) => {
      if (!prev) return prev;
      const newVariants = (prev.variants || []).filter((_, i) => i !== index);
      return { ...prev, variants: newVariants };
    });
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

    if (!product.title.trim()) {
      newErrors.title = "Vui lòng nhập tên sản phẩm.";
    }
    if (!product.product_category_id) {
      newErrors.product_category_id = "Vui lòng chọn danh mục.";
    }

    // Validate theo variant
    const variants = product.variants || [];
    if (!variants.length) {
      newErrors.price = "Cần ít nhất 1 biến thể.";
    } else {
      const invalidVariant = variants.find(
        (v) =>
          Number(v.price) <= 0 ||
          Number(v.stock) < 0 ||
          String(v.price) === "" ||
          String(v.stock) === "",
      );

      if (invalidVariant) {
        newErrors.price = "Mỗi biến thể phải có giá > 0 và tồn kho >= 0.";
      }
    }

    const discount = Number(product.discount_percentage);
    if (
      product.discount_percentage !== "" &&
      (discount < 0 || discount > 100)
    ) {
      newErrors.discount_percentage =
        "Giảm giá phải nằm trong khoảng từ 0 đến 100%.";
    }

    setFormErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ✅ Lưu sản phẩm (upload thumbnail và ảnh trong nội dung)
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
        tagIds: product.tag_ids,
        price: Number(product.price),
        stock: derivedStockFromNormalizedVariants, // 🔹 Sử dụng stock tổng hợp
        discountPercentage: Number(product.discount_percentage),
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
                  {origin.title}
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
                            {tag.title}
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
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-800 dark:text-white">
                Danh sách biến thể <span className="text-red-500">*</span>
              </h3>
              <button
                type="button"
                onClick={addVariant}
                className="flex items-center gap-1 text-sm bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200 px-3 py-1.5 rounded-md hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
              >
                <Plus className="w-4 h-4" /> Thêm biến thể
              </button>
            </div>

            {/* 🔹 Thêm UI Text hiển thị Tồn kho tổng hợp */}
            <div className="mb-4 text-sm text-gray-600 dark:text-gray-300">
              Tổng tồn kho sản phẩm (tự tính từ các biến thể):{" "}
              <span className="font-semibold">{derivedProductStock}</span>
            </div>

            {formErrors.price && (
              <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md text-sm border border-red-200">
                {formErrors.price}
              </div>
            )}

            <div className="space-y-4">
              {(product.variants || []).map((variant, index) => (
                <div
                  key={variant.id || `temp-${index}`}
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
                      className="w-full border border-gray-300 dark:border-gray-600 rounded p-2 text-sm bg-white dark:bg-gray-900 dark:text-white focus:ring-1 focus:ring-blue-500"
                    />
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
                      className="w-full border border-gray-300 dark:border-gray-600 rounded p-2 text-sm bg-white dark:bg-gray-900 dark:text-white focus:ring-1 focus:ring-blue-500"
                    />
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
                      className="w-full border border-gray-300 dark:border-gray-600 rounded p-2 text-sm bg-white dark:bg-gray-900 dark:text-white focus:ring-1 focus:ring-blue-500"
                    />
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
                      className="w-full border border-gray-300 dark:border-gray-600 rounded p-2 text-sm bg-white dark:bg-gray-900 dark:text-white focus:ring-1 focus:ring-blue-500"
                    />
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

          {/* Giảm giá (Ẩn do logic chuyển sang fallback) */}
          <div className="mt-4 hidden">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Giảm giá (%)
            </label>
            <input
              type="number"
              name="discount_percentage"
              value={product.discount_percentage || "0"}
              onChange={handleChange}
              className="w-full border border-gray-300 dark:border-gray-600 rounded-md p-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
            />
            {formErrors.discount_percentage && (
              <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                {formErrors.discount_percentage}
              </p>
            )}
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
