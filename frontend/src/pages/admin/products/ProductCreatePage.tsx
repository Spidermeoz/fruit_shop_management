// src/pages/ProductCreatePage.tsx
import React, { useEffect, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2, Plus, Trash2 } from "lucide-react";
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
// TYPES MỚI
// =============================
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
  title: string;
  description: string;
  price: number | string; // Giữ lại như fallback
  discount_percentage: number | string;
  stock: number | string; // Giữ lại như fallback
  thumbnail: string;
  status: string;
  featured: number | string;
  position: number | string;
  slug: string;
  average_rating: number;
  review_count: number;
  created_by_id: number;
  // --- Thêm mảng cho options và variants ---
  options: ProductOptionInput[];
  variants: ProductVariantInput[];
}

const ProductCreatePage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<
    Partial<Record<keyof ProductFormData | string, string>>
  >({});

  const [categories, setCategories] = useState<ProductCategory[]>([]);

  // file ảnh gốc (để upload sau)
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // preview ảnh local
  const [previewImage, setPreviewImage] = useState<string>("");

  const [imageMethod, setImageMethod] = useState<"upload" | "url">("upload");
  const [imageUrl, setImageUrl] = useState<string>("");

  const { showSuccessToast, showErrorToast } = useAdminToast();

  const [formData, setFormData] = useState<ProductFormData>({
    product_category_id: "",
    title: "",
    description: "",
    price: "",
    discount_percentage: "",
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
        stock: "0",
        status: "active",
        sortOrder: 0,
        optionValueIds: [],
      },
    ],
  });

  // Lấy danh sách danh mục từ backend
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
    fetchCategories();
  }, []);

  const handleInputChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
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
    // Xóa lỗi price nếu có khi sửa variant
    if (errors.price) {
      setErrors((prev) => ({ ...prev, price: undefined }));
    }
  };

  const addVariant = () => {
    setFormData((prev) => ({
      ...prev,
      variants: [
        ...prev.variants,
        {
          title: "",
          price: "0",
          stock: "0",
          status: "active",
          sortOrder: prev.variants.length,
          optionValueIds: [],
        },
      ],
    }));
  };

  const removeVariant = (index: number) => {
    setFormData((prev) => {
      const newVariants = prev.variants.filter((_, i) => i !== index);
      return { ...prev, variants: newVariants };
    });
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

    if (errors.thumbnail) {
      setErrors((prev) => ({ ...prev, thumbnail: undefined }));
    }
  };

  const validateForm = () => {
    const newErrors: Partial<Record<keyof ProductFormData | string, string>> =
      {};

    if (!formData.title.trim()) {
      newErrors.title = "Vui lòng nhập tên sản phẩm.";
    }
    if (!formData.product_category_id) {
      newErrors.product_category_id = "Vui lòng chọn danh mục.";
    }

    // Validate theo variant
    if (!formData.variants.length) {
      newErrors.price = "Cần ít nhất 1 biến thể.";
    } else {
      const invalidVariant = formData.variants.find(
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

    setErrors(newErrors);
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

      // 🔹 Upload Thumbnail
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

      // 🔹 Upload ảnh trong nội dung
      const updatedDescription = await uploadImagesInContent(
        formData.description,
      );

      // 🔹 Normalize Payload
      const normalizedOptions = formData.options.map((option, optionIndex) => ({
        name: option.name,
        position: option.position ?? optionIndex,
        values: option.values.map((value, valueIndex) => ({
          value: value.value,
          position: value.position ?? valueIndex,
        })),
      }));

      const optionValueIdMap = new Map<string, number>();
      let syntheticId = 1;

      normalizedOptions.forEach((option) => {
        option.values.forEach((value) => {
          optionValueIdMap.set(
            `${option.name}::${value.value}`.toLowerCase(),
            syntheticId++,
          );
        });
      });

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
        stock: Number(variant.stock),
        status: variant.status ?? "active",
        sortOrder: variant.sortOrder ?? index,
        optionValueIds: Array.isArray(variant.optionValueIds)
          ? variant.optionValueIds
          : [],
      }));

      // Lấy price và stock đầu tiên làm fallback cho product cha
      const fallbackPrice =
        normalizedVariants.length > 0 ? normalizedVariants[0].price : null;
      const fallbackStock =
        normalizedVariants.length > 0 ? normalizedVariants[0].stock : 0;

      const json = await http<any>("POST", "/api/v1/admin/products/create", {
        categoryId: formData.product_category_id
          ? Number(formData.product_category_id)
          : null,
        title: formData.title,
        description: updatedDescription,
        price: formData.price === "" ? fallbackPrice : Number(formData.price),
        discountPercentage:
          formData.discount_percentage === undefined ||
          formData.discount_percentage === null ||
          formData.discount_percentage === ""
            ? null
            : Number(formData.discount_percentage),
        stock: Number(formData.stock) || fallbackStock,
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
          "Không thể upload ảnh. Vui lòng kiểm tra định dạng file.",
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
        {/* --- Tên sản phẩm --- */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Tên sản phẩm <span className="text-red-500">*</span>
          </label>
          <input
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

        {/* --- Danh mục --- */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Danh mục <span className="text-red-500">*</span>
          </label>
          <select
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

        {/* --- Mô tả sản phẩm --- */}
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

          {errors.price && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md text-sm border border-red-200">
              {errors.price}
            </div>
          )}

          <div className="space-y-4">
            {formData.variants.map((variant, index) => (
              <div
                key={index}
                className="grid grid-cols-1 md:grid-cols-12 gap-4 p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md relative group"
              >
                {/* Nút xóa biến thể */}
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

        {/* --- Fallback Fields (Giữ lại cho tương thích nhưng ko cần validate gắt) --- */}
        <div className="grid grid-cols-2 gap-4 hidden">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Giảm giá (%)
            </label>
            <input
              type="number"
              name="discount_percentage"
              value={formData.discount_percentage}
              onChange={handleInputChange}
              min="0"
              max="100"
              step="0.1"
              className="w-full border border-gray-300 dark:border-gray-600 rounded-md p-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
            />
          </div>
        </div>

        {/* Ảnh minh họa */}
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

        {/* --- Vị trí hiển thị --- */}
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

        {/* --- Trạng thái sản phẩm --- */}
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

        {/* --- Sản phẩm nổi bật --- */}
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

        {/* --- Nút hành động --- */}
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
