import React, {
  useEffect,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Loader2, Save, ArrowLeft } from "lucide-react";
import Card from "../../../components/admin/layouts/Card";
import RichTextEditor from "../../../components/admin/common/RichTextEditor";
import { http } from "../../../services/http";
import { uploadImagesInContent } from "../../../utils/uploadImagesInContent";
import { useAdminToast } from "../../../context/AdminToastContext";

interface Origin {
  id: number;
  title: string;
  description: string | null;
  thumbnail: string | null;
  slug?: string | null;
  status: string;
  position: number | null;
}

type ApiDetail<T> = { success: true; data: T; meta?: any };
type ApiOk = { success: true; data?: any; meta?: any };

const ProductOriginEditPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [fetchError, setFetchError] = useState("");
  const [formErrors, setFormErrors] = useState<
    Partial<Record<keyof Origin, string>>
  >({});
  const { showSuccessToast, showErrorToast } = useAdminToast();

  const [origin, setOrigin] = useState<Origin | null>(null);
  const [initialOrigin, setInitialOrigin] = useState<Origin | null>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>("");
  const [imageMethod, setImageMethod] = useState<"upload" | "url" | "keep">(
    "keep",
  );
  const [imageUrl, setImageUrl] = useState<string>("");

  const fetchOrigin = async () => {
    try {
      setLoading(true);
      const res = await http<ApiDetail<Origin>>(
        "GET",
        `/api/v1/admin/origins/edit/${id}`,
      );
      if (res.success && res.data) {
        setOrigin(res.data);
        setInitialOrigin(res.data);
        if (res.data.thumbnail) setPreviewImage(res.data.thumbnail);
      }
    } catch (err: any) {
      console.error("fetchOrigin error:", err);
      setFetchError(err?.message || "Không tìm thấy xuất xứ.");
    } finally {
      setLoading(false);
    }
  };

  const isDirty = React.useMemo(() => {
    if (!origin || !initialOrigin) return false;

    const hasFieldChanges =
      origin.title !== initialOrigin.title ||
      (origin.description || "") !== (initialOrigin.description || "") ||
      origin.status !== initialOrigin.status ||
      String(origin.slug || "") !== String(initialOrigin.slug || "") ||
      String(origin.position ?? "") !== String(initialOrigin.position ?? "");

    const hasImageChanges =
      (imageMethod === "upload" && selectedFile !== null) ||
      (imageMethod === "url" && imageUrl !== initialOrigin.thumbnail);

    return hasFieldChanges || hasImageChanges;
  }, [origin, initialOrigin, selectedFile, imageMethod, imageUrl]);

  useEffect(() => {
    fetchOrigin();
  }, [id]);

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
      setPreviewImage(origin?.thumbnail || null);
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
      setPreviewImage(origin?.thumbnail || null);
      return;
    }

    setSelectedFile(file);
    setPreviewImage(URL.createObjectURL(file));

    if (formErrors.thumbnail) {
      setFormErrors((prev) => ({ ...prev, thumbnail: undefined }));
    }
  };

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setOrigin((prev) => (prev ? { ...prev, [name]: value } : prev));
    if (formErrors[name as keyof typeof formErrors]) {
      setFormErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleDescriptionChange = (content: string) => {
    setOrigin((prev) => (prev ? { ...prev, description: content } : prev));
  };

  const validateForm = () => {
    if (!origin) return false;
    const newErrors: Partial<Record<keyof Origin, string>> = {};
    if (!origin.title.trim()) {
      newErrors.title = "Vui lòng nhập tên xuất xứ.";
    }
    setFormErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!origin) return;

    if (!validateForm()) return;

    try {
      setSaving(true);
      setFormErrors({});
      let thumbnailUrl = origin.thumbnail;

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
      } else if (imageMethod === "keep") {
        thumbnailUrl = origin.thumbnail;
      }

      const updatedDescription = await uploadImagesInContent(
        origin.description || "",
      );

      const payload = {
        title: origin.title,
        description: updatedDescription,
        thumbnail: thumbnailUrl,
        status: origin.status,
        slug: origin.slug || null,
        position:
          origin.position === null ||
          origin.position === undefined ||
          (origin.position as any) === ""
            ? null
            : Number(origin.position),
      };

      const res = await http<ApiOk & { errors?: any }>(
        "PATCH",
        `/api/v1/admin/origins/edit/${id}`,
        payload,
      );

      if (res.success) {
        showSuccessToast({ message: "Cập nhật xuất xứ thành công!" });
        await fetchOrigin();
      } else {
        if ((res as any).errors) {
          setFormErrors((res as any).errors);
        } else {
          showErrorToast((res as any).message || "Cập nhật xuất xứ thất bại.");
        }
      }
    } catch (err: any) {
      console.error("saveOrigin error:", err);
      showErrorToast(
        err?.data?.message || err?.message || "Lỗi kết nối server.",
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-gray-500 dark:text-gray-400" />
        <span className="ml-2 text-gray-600 dark:text-gray-400">
          Đang tải xuất xứ...
        </span>
      </div>
    );
  }

  if (fetchError) {
    return (
      <p className="text-center text-red-500 dark:text-red-400 py-10">
        {fetchError}
      </p>
    );
  }

  if (!origin) return null;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
          Chỉnh sửa xuất xứ
        </h1>
        <button
          onClick={() => navigate("/admin/product-origin")}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-md transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Quay lại
        </button>
      </div>

      <Card>
        <form onSubmit={handleSubmit} className="space-y-5 p-2">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Tên xuất xứ
            </label>
            <input
              type="text"
              name="title"
              value={origin.title}
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

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Slug
            </label>
            <input
              type="text"
              name="slug"
              value={origin.slug || ""}
              onChange={handleChange}
              className="w-full border border-gray-300 dark:border-gray-600 rounded-md p-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Mô tả
            </label>
            <RichTextEditor
              value={origin.description || ""}
              onChange={handleDescriptionChange}
            />
          </div>

          <div>
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
                  setPreviewImage(origin.thumbnail);
                }}
              >
                Giữ ảnh hiện tại
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
            ) : imageMethod === "url" ? (
              <div>
                <input
                  type="url"
                  placeholder="Nhập URL ảnh"
                  value={imageUrl}
                  onChange={(e) => {
                    setImageUrl(e.target.value);
                    setPreviewImage(e.target.value);
                    setOrigin((prev) =>
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
                      setPreviewImage(origin.thumbnail);
                    }}
                    className="absolute -top-2 -right-2 bg-gray-500 dark:bg-gray-600 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-gray-600 dark:hover:bg-gray-500 transition-colors shadow-md"
                  >
                    ×
                  </button>
                )}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Vị trí hiển thị
            </label>
            <input
              type="number"
              name="position"
              value={origin.position ?? ""}
              onChange={handleChange}
              placeholder="Nếu bỏ trống sẽ tự xếp cuối"
              className="w-full border border-gray-300 dark:border-gray-600 rounded-md p-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
            />
          </div>

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
                  checked={origin.status === "active"}
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
                  checked={origin.status === "inactive"}
                  onChange={handleChange}
                  className="text-red-600 focus:ring-red-500 dark:bg-gray-700 dark:border-gray-600"
                />
                <span className="text-gray-800 dark:text-gray-200">
                  Dừng hoạt động
                </span>
              </label>
            </div>
          </div>

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

export default ProductOriginEditPage;
