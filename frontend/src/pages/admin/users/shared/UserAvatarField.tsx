import React, { useEffect, useRef } from "react";

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
    return () => {
      if (objectUrlRef.current?.startsWith("blob:")) {
        URL.revokeObjectURL(objectUrlRef.current);
      }
    };
  }, []);

  const handleInputFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    onFileSelect(file);

    e.target.value = "";
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        Ảnh đại diện
      </label>

      <div className="flex flex-wrap gap-3 mb-4">
        <button
          type="button"
          className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
            imageMethod === "upload"
              ? "bg-blue-600 text-white"
              : "bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
          }`}
          onClick={() => onImageMethodChange("upload")}
        >
          {uploadLabel}
        </button>

        <button
          type="button"
          className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
            imageMethod === "url"
              ? "bg-blue-600 text-white"
              : "bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
          }`}
          onClick={() => onImageMethodChange("url")}
        >
          {urlLabel}
        </button>

        {allowKeep ? (
          <button
            type="button"
            className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
              imageMethod === "keep"
                ? "bg-blue-600 text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
            }`}
            onClick={() => onImageMethodChange("keep")}
          >
            {keepLabel}
          </button>
        ) : null}
      </div>

      {imageMethod === "upload" ? (
        <div>
          <input
            type="file"
            accept="image/*"
            onChange={handleInputFileChange}
            className="block w-full text-sm text-gray-500 dark:text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-gray-700 dark:file:text-gray-200 dark:hover:file:bg-gray-600 cursor-pointer"
          />
        </div>
      ) : imageMethod === "url" ? (
        <div>
          <input
            type="url"
            placeholder="Nhập URL ảnh đại diện"
            value={imageUrl}
            onChange={(e) => onImageUrlChange(e.target.value)}
            className={`w-full border ${
              error
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

      {error ? (
        <p className="text-sm text-red-600 dark:text-red-400 mt-1">{error}</p>
      ) : null}

      {previewImage ? (
        <div className="mt-4 relative w-fit">
          <img
            src={previewImage}
            alt="preview"
            className="h-24 w-24 object-cover rounded-md border border-gray-300 dark:border-gray-600 shadow-sm"
          />
          <button
            type="button"
            onClick={onClear}
            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600 shadow-md transition-colors"
          >
            ×
          </button>
        </div>
      ) : null}
    </div>
  );
};

export default UserAvatarField;
