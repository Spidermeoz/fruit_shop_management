// src/pages/admin/ProductEditPage.tsx
import React, { useEffect, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Loader2, Save, ArrowLeft } from "lucide-react";
import Card from "../../../components/layouts/Card";
import RichTextEditor from "../../../components/common/RichTextEditor";
import { uploadImagesInContent } from "../../../utils/uploadImagesInContent";
import {
  buildCategoryTree,
  renderCategoryOptions,
} from "../../../utils/categoryTree";
import { http } from "../../../services/http"; // chỉnh path cho đúng

interface ProductCategory {
  id: number;
  title: string;
  parent_id?: number | null;
  children?: ProductCategory[];
  position: number;
  status: string;
}

interface Product {
  id: number;
  title: string;
  description: string;
  product_category_id: number | string;
  price: number | string;
  discount_percentage: number | string;
  stock: number | string;
  thumbnail: string;
  status: "active" | "inactive";
  featured: number;
  position: number | string;
}

const ProductEditPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [product, setProduct] = useState<Product | null>(null);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [fetchError, setFetchError] = useState("");
  const [formErrors, setFormErrors] = useState<
    Partial<Record<keyof Product, string>>
  >({});

  // ✅ file ảnh mới (chưa upload)
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewImage, setPreviewImage] = useState<string>("");
  const [imageMethod, setImageMethod] = useState<"upload" | "url" | "keep">(
    "keep"
  );
  const [imageUrl, setImageUrl] = useState<string>("");
  // 🔹 Lấy dữ liệu sản phẩm
  const fetchProduct = async () => {
    try {
      setLoading(true);
      const json = await http<any>(`GET`, `/api/v1/admin/products/edit/${id}`);
      if (json.success && json.data) {
        setProduct(json.data as Product);
        setPreviewImage(json.data.thumbnail);
      } else {
        setFetchError(json.message || "Không tìm thấy sản phẩm.");
      }
    } catch (err) {
      console.error(err);
      setFetchError(
        err instanceof Error ? err.message : "Không thể kết nối server."
      );
    } finally {
      setLoading(false);
    }
  };

  // ✅ Lấy danh sách danh mục từ backend
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const json = await http<any>("GET", "/api/v1/admin/product-category?limit=100");
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

  useEffect(() => {
    fetchProduct();
  }, [id]);

  // 🔹 Xử lý input
  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, type, value } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setProduct((prev) =>
      prev
        ? {
            ...prev,
            [name]: type === "checkbox" ? (checked ? 1 : 0) : value,
          }
        : prev
    );

    if (formErrors[name as keyof typeof formErrors]) {
      setFormErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  // 🔹 Mô tả
  const handleDescriptionChange = (content: string) => {
    setProduct((prev) => (prev ? { ...prev, description: content } : prev));
  };

  // 🔹 Chọn ảnh mới → chỉ preview
  const handleImageSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    setPreviewImage(URL.createObjectURL(file));
    if (formErrors.thumbnail) {
      setFormErrors((prev) => ({ ...prev, thumbnail: undefined }));
    }
  };

  const validateForm = () => {
    if (!product) return false;

    const newErrors: Partial<Record<keyof Product, string>> = {};

    if (!product.title.trim()) {
      newErrors.title = "Vui lòng nhập tên sản phẩm.";
    }
    if (!product.product_category_id) {
      newErrors.product_category_id = "Vui lòng chọn danh mục.";
    }
    if (!product.price || Number(product.price) <= 0) {
      newErrors.price = "Vui lòng nhập giá sản phẩm hợp lệ (lớn hơn 0).";
    }
    if (
      product.stock === "" ||
      product.stock === null ||
      Number(product.stock) < 0
    ) {
      newErrors.stock = "Vui lòng nhập số lượng tồn kho (không được âm).";
    }

    setFormErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ✅ Lưu sản phẩm (upload thumbnail và ảnh trong mô tả)
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
          formDataImg
        );

        if (dataUpload.success && dataUpload.data?.url) {
          thumbnailUrl = dataUpload.data.url;
        } else if (dataUpload.url) {
          // fallback
          thumbnailUrl = dataUpload.url;
        } else {
          setFormErrors({ thumbnail: "Lỗi tải ảnh thumbnail lên máy chủ." });
          setSaving(false);
          return;
        }
      }

      // 🔸 Upload ảnh trong nội dung TinyMCE (lazy upload)
      const updatedDescription = await uploadImagesInContent(
        product.description
      );

      // --- Chuẩn hóa payload ---
      const payload: any = {
        ...product,
        thumbnail: thumbnailUrl,
        description: updatedDescription,
        price: Number(product.price),
        stock: Number(product.stock),
        discountPercentage: Number(product.discount_percentage),
        position: product.position === "" ? null : Number(product.position),
        featured: Boolean(Number(product.featured)),
      };
      // Chuyển product_category_id thành categoryId cho backend
      if (payload.product_category_id !== undefined) {
        payload.categoryId =
          payload.product_category_id === ""
            ? null
            : Number(payload.product_category_id);
        delete payload.product_category_id;
      }

      const json = await http<any>(
        "PATCH",
        `/api/v1/admin/products/edit/${id}`,
        payload
      );

      if (json.success) {
        alert("✅ Cập nhật sản phẩm thành công!");
        // navigate(`/admin/products/edit/${id}`);
        fetchProduct(); // Re-fetch to get latest data
      } else {
        if (json.errors) {
          setFormErrors(json.errors);
        } else {
          alert(json.message || "Cập nhật thất bại.");
        }
      }
    } catch (err) {
      console.error(err);
      alert("Không thể kết nối server.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-gray-500" />
        <span className="ml-2 text-gray-600 dark:text-gray-400">
          Đang tải dữ liệu sản phẩm...
        </span>
      </div>
    );
  }

  if (fetchError)
    return <p className="text-center text-red-500 py-10">{fetchError}</p>;
  if (!product) return null;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
          Chỉnh sửa sản phẩm
        </h1>
        <button
          onClick={() => navigate("/admin/products")}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-md"
        >
          <ArrowLeft className="w-4 h-4" /> Quay lại
        </button>
      </div>

      <Card>
        <form onSubmit={handleSave} className="space-y-4">
          {/* Danh mục */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Danh mục sản phẩm
            </label>
            <select
              name="product_category_id"
              value={product.product_category_id || ""}
              onChange={handleChange}
              className={`w-full border ${
                formErrors.product_category_id
                  ? "border-red-500"
                  : "border-gray-300"
              } dark:border-gray-600 rounded-md p-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
            >
              <option value="" disabled>
                -- Chọn danh mục --
              </option>
              {renderCategoryOptions(buildCategoryTree(categories))}
            </select>
            {formErrors.product_category_id && (
              <p className="text-sm text-red-600 mt-1">
                {formErrors.product_category_id}
              </p>
            )}
          </div>

          {/* Tên sản phẩm */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Tên sản phẩm
            </label>
            <input
              type="text"
              name="title"
              value={product.title || ""}
              onChange={handleChange}
              className={`w-full border ${
                formErrors.title ? "border-red-500" : "border-gray-300"
              } dark:border-gray-600 rounded-md p-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
            />
            {formErrors.title && (
              <p className="text-sm text-red-600 mt-1">{formErrors.title}</p>
            )}
          </div>

          {/* Mô tả */}
          <RichTextEditor
            value={product.description}
            onChange={handleDescriptionChange}
          />

          {/* Giá & Giảm giá */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Giá (₫)
              </label>
              <input
                type="number"
                name="price"
                value={product.price || ""}
                onChange={handleChange}
                className={`w-full border ${
                  formErrors.price ? "border-red-500" : "border-gray-300"
                } dark:border-gray-600 rounded-md p-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
              />
              {formErrors.price && (
                <p className="text-sm text-red-600 mt-1">{formErrors.price}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Giảm giá (%)
              </label>
              <input
                type="number"
                name="discount_percentage"
                value={product.discount_percentage || ""}
                onChange={handleChange}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-md p-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          </div>

          {/* Tồn kho & vị trí */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Tồn kho
              </label>
              <input
                type="number"
                name="stock"
                value={product.stock || ""}
                onChange={handleChange}
                className={`w-full border ${
                  formErrors.stock ? "border-red-500" : "border-gray-300"
                } dark:border-gray-600 rounded-md p-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
              />
              {formErrors.stock && (
                <p className="text-sm text-red-600 mt-1">{formErrors.stock}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Vị trí hiển thị
              </label>
              <input
                type="number"
                name="position"
                value={product.position || ""}
                onChange={handleChange}
                placeholder="Nếu bỏ trống sẽ tự xếp cuối"
                className="w-full border border-gray-300 dark:border-gray-600 rounded-md p-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          </div>

          {/* Ảnh sản phẩm */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Ảnh sản phẩm
            </label>

            {/* Tab chọn phương thức */}
            <div className="flex mb-3">
              <button
                type="button"
                className={`px-4 py-2 mr-2 rounded ${
                  imageMethod === "upload"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-200 text-gray-700"
                }`}
                onClick={() => setImageMethod("upload")}
              >
                Upload ảnh mới
              </button>
              <button
                type="button"
                className={`px-4 py-2 rounded ${
                  imageMethod === "url"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-200 text-gray-700"
                }`}
                onClick={() => setImageMethod("url")}
              >
                Nhập URL
              </button>
              <button
                type="button"
                className={`px-4 py-2 rounded ${
                  imageMethod === "keep"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-200 text-gray-700"
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
                      prev ? { ...prev, thumbnail: e.target.value } : prev
                    );
                  }}
                  className={`w-full border ${
                    formErrors.thumbnail ? "border-red-500" : "border-gray-300"
                  } dark:border-gray-600 rounded-md p-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
                />
              </div>
            ) : (
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Sẽ giữ nguyên ảnh hiện tại
              </div>
            )}

            {formErrors.thumbnail && (
              <p className="text-sm text-red-600 mt-1">
                {formErrors.thumbnail}
              </p>
            )}

            {previewImage && (
              <div className="mt-3 relative w-fit">
                <img
                  src={previewImage}
                  alt="preview"
                  className="h-24 w-24 object-cover rounded-md border border-gray-300 dark:border-gray-600"
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
                    className="absolute -top-2 -right-2 bg-gray-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-gray-600"
                  >
                    ×
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Trạng thái & Nổi bật */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Trạng thái */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Trạng thái
              </label>
              <div className="flex gap-6">
                <label className="flex items-center space-x-2">
                  <input
                    type="radio"
                    name="status"
                    value="active"
                    checked={product.status === "active"}
                    onChange={handleChange}
                    className="text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-gray-800 dark:text-gray-200">
                    Hoạt động
                  </span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="radio"
                    name="status"
                    value="inactive"
                    checked={product.status === "inactive"}
                    onChange={handleChange}
                    className="text-red-600 focus:ring-red-500"
                  />
                  <span className="text-gray-800 dark:text-gray-200">
                    Dừng hoạt động
                  </span>
                </label>
              </div>
            </div>

            {/* Sản phẩm nổi bật */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Sản phẩm nổi bật
              </label>
              <div className="flex gap-6">
                <label className="flex items-center space-x-2">
                  <input
                    type="radio"
                    name="featured"
                    value={1}
                    checked={Number(product.featured) === 1}
                    onChange={handleChange}
                    className="text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-gray-800 dark:text-gray-200">
                    Nổi bật
                  </span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="radio"
                    name="featured"
                    value={0}
                    checked={Number(product.featured) === 0}
                    onChange={handleChange}
                    className="text-red-600 focus:ring-red-500"
                  />
                  <span className="text-gray-800 dark:text-gray-200">
                    Không nổi bật
                  </span>
                </label>
              </div>
            </div>
          </div>

          {/* Nút lưu */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-colors disabled:opacity-50"
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
