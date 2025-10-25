import React, {
  useEffect,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Loader2, Save, ArrowLeft } from "lucide-react";
import Card from "../../../components/layouts/Card";
import RichTextEditor from "../../../components/common/RichTextEditor";

interface Category {
  id: number;
  title: string;
  parent_id: number | null; // frontend dùng snake_case
  parentId?: number | null; // thêm field này để map với backend
  description: string | null;
  thumbnail: string | null;
  status: string;
  position: number | null;
  parent_name?: string | null;
}

const ProductCategoryEditPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [category, setCategory] = useState<Category | null>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewImage, setPreviewImage] = useState<string>("");

  // ✅ Lấy dữ liệu danh mục cần chỉnh sửa
  const fetchCategory = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/v1/admin/product-category/detail/${id}`);
      const json = await res.json();
      if (json.success && json.data) {
        setCategory(json.data);
        if (json.data.thumbnail) setPreviewImage(json.data.thumbnail);
      } else {
        setError(json.message || "Không tìm thấy danh mục.");
      }
    } catch (err) {
      console.error("fetchCategory error:", err);
      setError("Lỗi khi tải dữ liệu danh mục.");
    } finally {
      setLoading(false);
    }
  };

  // ✅ Lấy danh sách tất cả danh mục để chọn parent
  const fetchCategories = async () => {
    try {
      const res = await fetch(`/api/v1/admin/product-category`);
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setCategories(json.data);
      }
    } catch (err) {
      console.error("fetchCategories error:", err);
    }
  };

  useEffect(() => {
    fetchCategory();
    fetchCategories();
  }, [id]);

  // ✅ Khi chọn file ảnh → chỉ hiển thị preview, chưa upload
  const handleImageSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    setPreviewImage(URL.createObjectURL(file));
  };

  // ✅ Xử lý input
  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setCategory((prev) => (prev ? { ...prev, [name]: value } : prev));
  };

  // ✅ Xử lý RichTextEditor
  const handleDescriptionChange = (content: string) => {
    setCategory((prev) => (prev ? { ...prev, description: content } : prev));
  };

  // ✅ Gửi API cập nhật
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!category) return;

    try {
      setSaving(true);
      let thumbnailUrl = category.thumbnail;
      let updatedDescription = category.description;

      // Upload thumbnail nếu có
      if (selectedFile) {
        const formDataImg = new FormData();
        formDataImg.append("file", selectedFile);
        const res = await fetch("/api/v1/admin/upload", {
          method: "POST",
          body: formDataImg,
        });
        const data = await res.json();
        if (data.success && data.url) {
          thumbnailUrl = data.url;
        } else {
          alert("Không thể tải ảnh lên Cloudinary!");
          return;
        }
      }

      // Upload ảnh từ description nếu có
      if (category.description) {
        const tempDiv = document.createElement("div");
        tempDiv.innerHTML = category.description;
        const imgs = tempDiv.getElementsByTagName("img");

        for (let img of Array.from(imgs)) {
          const src = img.getAttribute("src");
          // Chỉ upload nếu là ảnh local
          if (src && src.startsWith("blob:")) {
            // Convert blob URL to File
            const response = await fetch(src);
            const blob = await response.blob();
            const file = new File([blob], "image.png", { type: "image/png" });

            // Upload to Cloudinary
            const formData = new FormData();
            formData.append("file", file);
            const uploadRes = await fetch("/api/v1/admin/upload", {
              method: "POST",
              body: formData,
            });
            const uploadData = await uploadRes.json();

            if (uploadData.success && uploadData.url) {
              // Replace blob URL with Cloudinary URL
              img.setAttribute("src", uploadData.url);
            }
          }
        }
        updatedDescription = tempDiv.innerHTML;
      }

      // Chuẩn bị payload cho API
      const payload = {
        title: category.title,
        parentId: category.parent_id,
        description: updatedDescription,
        thumbnail: thumbnailUrl,
        status: category.status,
      };

      console.log("Sending payload:", payload); // Debug payload

      const res = await fetch(`/api/v1/admin/product-category/edit/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (json.success) {
        alert("✅ Cập nhật danh mục thành công!");
        await Promise.all([
          fetchCategory(), // Refresh category detail
          fetchCategories(), // Refresh categories list
        ]);
      } else {
        alert(json.message || "Không thể cập nhật danh mục.");
      }
    } catch (err) {
      console.error("saveCategory error:", err);
      alert("Lỗi kết nối server.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-gray-500" />
        <span className="ml-2 text-gray-600 dark:text-gray-400">
          Đang tải danh mục...
        </span>
      </div>
    );
  }

  if (error) {
    return <p className="text-center text-red-500 py-10">{error}</p>;
  }

  if (!category) return null;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
          Chỉnh sửa danh mục
        </h1>
        <button
          onClick={() => navigate("/admin/product-category")}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-md"
        >
          <ArrowLeft className="w-4 h-4" /> Quay lại
        </button>
      </div>

      <Card>
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Tên danh mục */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Tên danh mục
            </label>
            <input
              type="text"
              name="title"
              value={category.title}
              onChange={handleChange}
              required
              className="w-full border border-gray-300 dark:border-gray-600 rounded-md p-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          {/* Danh mục cha */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Danh mục cha
            </label>
            <select
              name="parent_id"
              value={
                category.parent_id === null ? "" : String(category.parent_id)
              }
              onChange={(e) => {
                const value = e.target.value;
                setCategory((prev) =>
                  prev
                    ? {
                        ...prev,
                        parent_id: value === "" ? null : Number(value),
                      }
                    : prev
                );
              }}
              className="w-full border border-gray-300 dark:border-gray-600 rounded-md p-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="">-- Danh mục gốc --</option>
              {categories
                .filter((c) => c.id !== Number(id))
                .map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title}
                  </option>
                ))}
            </select>
          </div>

          {/* Mô tả */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Mô tả
            </label>
            <RichTextEditor
              value={category.description || ""}
              onChange={handleDescriptionChange}
            />
          </div>

          {/* Ảnh minh họa */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Ảnh minh họa
            </label>
            <input type="file" accept="image/*" onChange={handleImageSelect} />
            {previewImage && (
              <div className="mt-3">
                <img
                  src={previewImage}
                  alt="preview"
                  className="h-24 w-24 object-cover rounded-md border border-gray-300 dark:border-gray-600"
                />
              </div>
            )}
          </div>

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
                  checked={category.status === "active"}
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
                  checked={category.status === "inactive"}
                  onChange={handleChange}
                  className="text-red-600 focus:ring-red-500"
                />
                <span className="text-gray-800 dark:text-gray-200">
                  Dừng hoạt động
                </span>
              </label>
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

export default ProductCategoryEditPage;
