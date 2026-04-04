import React, { useEffect, useRef } from "react";
import { ImagePlus, Link2, RotateCcw, UploadCloud, X } from "lucide-react";

interface UserAvatarFieldProps {
  previewImage: string;
  imageMethod: "upload" | "url" | "keep";
  imageUrl: string;
  error?: string;
  uploadLabel?: string;
  urlLabel?: string;
  keepLabel?: string;
  allowKeep?: boolean;

  onImageMethodChange: (value: "upload" | "url" | "keep") => void;
  onImageUrlChange: (value: string) => void;
  onFileSelect: (file: File) => void;
  onClear: () => void;
}

const methodButtonClass = (active: boolean) =>
  `inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
    active
      ? "bg-blue-600 text-white"
      : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
  }`;

const UserAvatarField: React.FC<UserAvatarFieldProps> = ({
  previewImage,
  imageMethod,
  imageUrl,
  error,
  uploadLabel = "Upload ảnh",
  urlLabel = "Nhập URL",
  keepLabel = "Giữ ảnh hiện tại",
  allowKeep = true,
  onImageMethodChange,
  onImageUrlChange,
  onFileSelect,
  onClear,
}) => {
  const objectUrlRef = useRef<string | null>(null);

  useEffect(() => {
    if (previewImage?.startsWith("blob:")) {
      if (objectUrlRef.current && objectUrlRef.current !== previewImage) {
        URL.revokeObjectURL(objectUrlRef.current);
      }
      objectUrlRef.current = previewImage;
    }

    return () => {
      if (objectUrlRef.current?.startsWith("blob:")) {
        URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = null;
      }
    };
  }, [previewImage]);

  const handleInputFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    onFileSelect(file);
    e.target.value = "";
  };

  return (
    <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4">
      <div className="flex items-center gap-2 mb-1">
        <ImagePlus className="w-4 h-4 text-gray-500 dark:text-gray-400" />
        <label className="text-sm font-semibold text-gray-900 dark:text-white">
          Ảnh đại diện
        </label>
      </div>

      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
        Bạn có thể tải ảnh mới lên, nhập URL ảnh, hoặc giữ nguyên ảnh hiện tại.
      </p>

      <div className="flex flex-wrap gap-2 mb-4">
        <button
          type="button"
          className={methodButtonClass(imageMethod === "upload")}
          onClick={() => onImageMethodChange("upload")}
        >
          <UploadCloud className="w-4 h-4" />
          {uploadLabel}
        </button>

        <button
          type="button"
          className={methodButtonClass(imageMethod === "url")}
          onClick={() => onImageMethodChange("url")}
        >
          <Link2 className="w-4 h-4" />
          {urlLabel}
        </button>

        {allowKeep ? (
          <button
            type="button"
            className={methodButtonClass(imageMethod === "keep")}
            onClick={() => onImageMethodChange("keep")}
          >
            <RotateCcw className="w-4 h-4" />
            {keepLabel}
          </button>
        ) : null}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_180px] gap-4">
        <div>
          {imageMethod === "upload" ? (
            <div className="rounded-xl border border-dashed border-gray-300 dark:border-gray-600 p-4 bg-gray-50 dark:bg-gray-800/40">
              <input
                type="file"
                accept="image/*"
                onChange={handleInputFileChange}
                className="block w-full text-sm text-gray-500 dark:text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-gray-700 dark:file:text-gray-200 dark:hover:file:bg-gray-600 cursor-pointer"
              />
              <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                Hỗ trợ JPG, PNG, WEBP, GIF. Kích thước tối đa 5MB.
              </p>
            </div>
          ) : imageMethod === "url" ? (
            <div>
              <input
                type="url"
                placeholder="Nhập URL ảnh đại diện"
                value={imageUrl}
                onChange={(e) => onImageUrlChange(e.target.value)}
                className={`w-full border rounded-md p-2.5 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
                  error
                    ? "border-red-500 dark:border-red-500"
                    : "border-gray-300 dark:border-gray-600"
                }`}
              />
              <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                Dùng khi ảnh đã có sẵn trên CDN hoặc URL công khai.
              </p>
            </div>
          ) : (
            <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-800/40">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Hệ thống sẽ giữ nguyên ảnh hiện tại nếu có.
              </p>
            </div>
          )}

          {error ? (
            <p className="text-sm text-red-600 dark:text-red-400 mt-2">
              {error}
            </p>
          ) : null}
        </div>

        <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-800/40">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-3 uppercase tracking-wide">
            Xem trước
          </p>

          {previewImage ? (
            <div className="relative w-fit">
              <img
                src={previewImage}
                alt="preview"
                className="h-28 w-28 object-cover rounded-2xl border border-gray-300 dark:border-gray-600 shadow-sm"
              />
              <button
                type="button"
                onClick={onClear}
                className="absolute -top-2 -right-2 h-7 w-7 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition-colors shadow"
                aria-label="Xóa ảnh"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="h-28 w-28 rounded-2xl border border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center text-gray-400 dark:text-gray-500 bg-white dark:bg-gray-900">
              <ImagePlus className="w-6 h-6" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserAvatarField;
