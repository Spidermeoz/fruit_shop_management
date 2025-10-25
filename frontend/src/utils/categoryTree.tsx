import React, { useState, type JSX } from "react";
import {
  Eye,
  Edit,
  Trash2,
  Folder,
  FolderOpen,
  ChevronRight,
  ChevronDown,
} from "lucide-react";

export interface ProductCategoryNode {
  id: number;
  title: string;
  thumbnail?: string;
  position: number;
  status: string;
  parent_id?: number | null;
  children?: ProductCategoryNode[];
}

// 🧱 Chuyển danh sách phẳng → cây
export const buildCategoryTree = (categories: ProductCategoryNode[]) => {
  const map = new Map<number, ProductCategoryNode>();
  const roots: ProductCategoryNode[] = [];

  categories.forEach((cat) => map.set(cat.id, { ...cat, children: [] }));
  categories.forEach((cat) => {
    const parentKey = (cat as any).parent_id ?? (cat as any).parentId; // ✅ fix
    if (parentKey) {
      const parent = map.get(parentKey);
      if (parent) parent.children!.push(map.get(cat.id)!);
      else roots.push(map.get(cat.id)!);
    } else roots.push(map.get(cat.id)!);
  });

  return roots;
};

// 🧩 Render từng dòng danh mục
const CategoryRow: React.FC<{
  cat: ProductCategoryNode;
  level: number;
  expanded: Record<number, boolean>;
  toggleExpand: (id: number) => void;
  selectedCategories: number[];
  setSelectedCategories: React.Dispatch<React.SetStateAction<number[]>>;
  setCategories: React.Dispatch<React.SetStateAction<any[]>>;
  navigate: (path: string) => void;
  handleToggleStatus: (cat: ProductCategoryNode) => void;
  handleDelete: (id: number) => void;
}> = ({
  cat,
  level,
  expanded,
  toggleExpand,
  selectedCategories,
  setSelectedCategories,
  setCategories,
  navigate,
  handleToggleStatus,
  handleDelete,
}) => {
  const hasChildren = cat.children && cat.children.length > 0;
  const isExpanded = expanded[cat.id] ?? false;

  return (
    <>
      <tr
        className={`border-b border-gray-200 dark:border-gray-700 transition-colors
          ${
            level === 0
              ? "bg-gray-50 dark:bg-gray-800"
              : "bg-gray-100 dark:bg-gray-700"
          }
          hover:bg-blue-50 dark:hover:bg-gray-600`}
      >
        {/* Checkbox */}
        <td className="px-4 py-3 text-center align-middle">
          <input
            type="checkbox"
            checked={selectedCategories.includes(cat.id)}
            onChange={(e) => {
              if (e.target.checked)
                setSelectedCategories((prev) => [...prev, cat.id]);
              else
                setSelectedCategories((prev) =>
                  prev.filter((id) => id !== cat.id)
                );
            }}
          />
        </td>

        {/* Thumbnail */}
        <td className="px-4 py-3 text-center align-middle">
          <img
            src={
              cat.thumbnail || "https://via.placeholder.com/60x60?text=No+Img"
            }
            alt={cat.title}
            className="h-10 w-10 mx-auto rounded-md object-cover border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800"
          />
        </td>

        {/* Tên danh mục */}
        <td className="px-6 py-3 text-sm text-gray-900 dark:text-white align-middle">
          <div
            className="flex items-center gap-2"
            style={{
              paddingLeft: `${level * 24}px`,
              borderLeft:
                level > 0
                  ? "1px dashed rgba(0,0,0,0.15)"
                  : "none",
            }}
          >
            {/* Toggle mở/đóng */}
            {hasChildren && (
              <button
                onClick={() => toggleExpand(cat.id)}
                className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition"
                title={isExpanded ? "Thu gọn" : "Mở rộng"}
              >
                {isExpanded ? (
                  <ChevronDown className="w-4 h-4 text-blue-500" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-blue-500" />
                )}
              </button>
            )}

            {/* Icon folder */}
            {level === 0 ? (
              <FolderOpen className="w-4 h-4 text-blue-500 shrink-0" />
            ) : (
              <Folder className="w-4 h-4 text-gray-400 shrink-0" />
            )}

            {/* Tên danh mục */}
            <span
              className={`truncate ${
                level === 0
                  ? "font-semibold text-gray-900 dark:text-white"
                  : "text-gray-700 dark:text-gray-300"
              }`}
            >
              {level > 0 && (
                <span className="text-gray-400 dark:text-gray-500 mr-1">
                  ↳
                </span>
              )}
              {cat.title}
            </span>
          </div>
        </td>

        {/* Vị trí */}
        <td className="px-6 py-3 text-sm text-gray-800 dark:text-gray-200 text-center align-middle">
          <input
            type="number"
            value={cat.position || ""}
            onChange={(e) => {
              const newPos = Number(e.target.value);
              setCategories((prev) =>
                prev.map((c) =>
                  c.id === cat.id ? { ...c, position: newPos } : c
                )
              );
            }}
            className="w-20 border border-gray-300 dark:border-gray-600 rounded-md p-1 text-center bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </td>

        {/* Trạng thái */}
        <td className="px-6 py-3 text-center align-middle">
          <span
            onClick={() => handleToggleStatus(cat)}
            className={`cursor-pointer text-xs font-semibold px-3 py-1 rounded-full transition-colors ${
              cat.status === "active"
                ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                : "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"
            }`}
          >
            {cat.status === "active" ? "active" : "inactive"}
          </span>
        </td>

        {/* Hành động */}
        <td className="px-6 py-3 text-right align-middle">
          <div className="flex justify-end gap-2">
            <button
              onClick={() =>
                navigate(`/admin/product-category/detail/${cat.id}`)
              }
              className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
              title="Xem chi tiết"
            >
              <Eye className="w-5 h-5" />
            </button>
            <button
              onClick={() => navigate(`/admin/product-category/edit/${cat.id}`)}
              className="text-blue-600 hover:text-blue-800 dark:text-blue-400"
              title="Chỉnh sửa"
            >
              <Edit className="w-5 h-5" />
            </button>
            <button
              onClick={() => handleDelete(cat.id)}
              className="text-red-600 hover:text-red-800 dark:text-red-400"
              title="Xóa"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        </td>
      </tr>

      {/* Hiển thị danh mục con */}
      {hasChildren &&
        expanded[cat.id] &&
        cat.children!.map((child) => (
          <CategoryRow
            key={child.id}
            cat={child}
            level={level + 1}
            expanded={expanded}
            toggleExpand={toggleExpand}
            selectedCategories={selectedCategories}
            setSelectedCategories={setSelectedCategories}
            setCategories={setCategories}
            navigate={navigate}
            handleToggleStatus={handleToggleStatus}
            handleDelete={handleDelete}
          />
        ))}
    </>
  );
};

// ✅ Component chính hiển thị toàn bộ cây
export const CategoryTreeTableBody: React.FC<{
  categories: ProductCategoryNode[];
  selectedCategories: number[];
  setSelectedCategories: React.Dispatch<React.SetStateAction<number[]>>;
  setCategories: React.Dispatch<React.SetStateAction<any[]>>;
  navigate: (path: string) => void;
  handleToggleStatus: (cat: ProductCategoryNode) => void;
  handleDelete: (id: number) => void;
}> = ({
  categories,
  selectedCategories,
  setSelectedCategories,
  setCategories,
  navigate,
  handleToggleStatus,
  handleDelete,
}) => {
  const [expanded, setExpanded] = useState<Record<number, boolean>>({});

  const toggleExpand = (id: number) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // 🆕 Hàm mở / đóng tất cả
  const expandAll = () => {
    const all: Record<number, boolean> = {};
    const traverse = (cats: ProductCategoryNode[]) => {
      cats.forEach((c) => {
        all[c.id] = true;
        if (c.children) traverse(c.children);
      });
    };
    traverse(categories);
    setExpanded(all);
  };

  const collapseAll = () => setExpanded({});

  // 👉 Đăng ký global để nút ngoài bảng có thể gọi
  (window as any).expandAllCategories = expandAll;
  (window as any).collapseAllCategories = collapseAll;

  return (
    <>
      {categories.map((cat) => (
        <CategoryRow
          key={cat.id}
          cat={cat}
          level={0}
          expanded={expanded}
          toggleExpand={toggleExpand}
          selectedCategories={selectedCategories}
          setSelectedCategories={setSelectedCategories}
          setCategories={setCategories}
          navigate={navigate}
          handleToggleStatus={handleToggleStatus}
          handleDelete={handleDelete}
        />
      ))}
    </>
  );
};

// 🧩 Dùng cho dropdown select danh mục cha
export const renderCategoryOptions = (
  categories: ProductCategoryNode[],
  level = 0
): JSX.Element[] => {
  return categories.flatMap((cat) => [
    <option key={cat.id} value={cat.id}>
      {"  ".repeat(level)}
      {level > 0 ? "↳ " : ""}
      {cat.title}
    </option>,
    ...(cat.children ? renderCategoryOptions(cat.children, level + 1) : []),
  ]);
};
