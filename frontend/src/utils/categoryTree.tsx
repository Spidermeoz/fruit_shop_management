import React, { useEffect, useMemo, useState, type JSX } from "react";
import {
  Edit,
  Trash2,
  FolderOpen,
  ChevronRight,
  ChevronDown,
  Plus,
  Activity,
  Layers,
  Image as ImageIcon,
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

// ============================================
// 1. DATA UTILITIES
// ============================================
export const buildCategoryTree = (categories: ProductCategoryNode[]) => {
  const map = new Map<number, ProductCategoryNode>();
  const roots: ProductCategoryNode[] = [];

  categories.forEach((cat) => map.set(cat.id, { ...cat, children: [] }));

  categories.forEach((cat) => {
    const parentKey = (cat as any).parent_id ?? (cat as any).parentId;
    if (parentKey) {
      const parent = map.get(parentKey);
      if (parent) parent.children!.push(map.get(cat.id)!);
      else roots.push(map.get(cat.id)!);
    } else {
      roots.push(map.get(cat.id)!);
    }
  });

  return roots;
};

// Dùng cho dropdown select danh mục cha
export const renderCategoryOptions = (
  categories: ProductCategoryNode[],
  level = 0,
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

// ============================================
// 2. HELPERS
// ============================================
const collectAllIds = (nodes: ProductCategoryNode[]) => {
  const ids: number[] = [];

  const walk = (items: ProductCategoryNode[]) => {
    items.forEach((item) => {
      ids.push(item.id);
      if (item.children?.length) walk(item.children);
    });
  };

  walk(nodes);
  return ids;
};

const shouldHighlightTitle = (title: string, keyword: string) => {
  return keyword.trim() && title.toLowerCase().includes(keyword.toLowerCase());
};

// ============================================
// 3. RECURSIVE NODE RENDERER
// ============================================
const MerchandisingNodeRow: React.FC<{
  cat: ProductCategoryNode;
  level: number;
  expanded: Record<number, boolean>;
  toggleExpand: (id: number) => void;
  selectedCategories: number[];
  setSelectedCategories: React.Dispatch<React.SetStateAction<number[]>>;
  setCategories: React.Dispatch<React.SetStateAction<any[]>>;
  handleToggleStatus: (cat: ProductCategoryNode) => void;
  handleDelete: (id: number) => void;
  onAddChild: (id: number) => void;
  onEditNode: (id: number) => void;
  searchTerm?: string;
}> = ({
  cat,
  level,
  expanded,
  toggleExpand,
  selectedCategories,
  setSelectedCategories,
  setCategories,
  handleToggleStatus,
  handleDelete,
  onAddChild,
  onEditNode,
  searchTerm = "",
}) => {
  const hasChildren = !!(cat.children && cat.children.length > 0);
  const isExpanded = expanded[cat.id] ?? false;
  const childCount = cat.children?.length || 0;
  const isMatched = shouldHighlightTitle(cat.title, searchTerm);

  return (
    <>
      <tr
        className={`border-b border-gray-100 dark:border-gray-800 transition-all hover:bg-blue-50/50 dark:hover:bg-blue-900/10 group ${
          level === 0
            ? "bg-white dark:bg-gray-900"
            : "bg-gray-50/50 dark:bg-gray-800/20"
        }`}
      >
        {/* Selection */}
        <td className="px-4 py-4 w-12 text-center align-middle">
          <input
            type="checkbox"
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
            checked={selectedCategories.includes(cat.id)}
            onChange={(e) => {
              if (e.target.checked) {
                setSelectedCategories((prev) =>
                  prev.includes(cat.id) ? prev : [...prev, cat.id],
                );
              } else {
                setSelectedCategories((prev) =>
                  prev.filter((id) => id !== cat.id),
                );
              }
            }}
          />
        </td>

        {/* Identity */}
        <td className="px-4 py-4 align-middle">
          <div
            className="flex items-center"
            style={{ paddingLeft: `${level * 32}px` }}
          >
            <div className="flex items-center gap-3 relative">
              {level > 0 && (
                <div className="absolute -left-6 top-1/2 w-4 h-px bg-gray-300 dark:bg-gray-600"></div>
              )}
              {level > 0 && (
                <div className="absolute -left-6 -top-1/2 bottom-1/2 w-px bg-gray-300 dark:bg-gray-600"></div>
              )}

              <button
                onClick={() => toggleExpand(cat.id)}
                className={`w-6 h-6 flex items-center justify-center rounded-md transition-colors ${
                  hasChildren
                    ? "hover:bg-gray-200 dark:hover:bg-gray-700 cursor-pointer"
                    : "opacity-0 cursor-default"
                }`}
                disabled={!hasChildren}
              >
                {isExpanded ? (
                  <ChevronDown className="w-4 h-4 text-gray-500" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-gray-500" />
                )}
              </button>

              <div className="relative shrink-0 w-10 h-10 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800 flex items-center justify-center border border-gray-200 dark:border-gray-700 shadow-sm">
                {cat.thumbnail ? (
                  <img
                    src={cat.thumbnail}
                    alt={cat.title}
                    className="w-full h-full object-cover"
                  />
                ) : level === 0 ? (
                  <FolderOpen className="w-5 h-5 text-blue-500" />
                ) : (
                  <ImageIcon className="w-5 h-5 text-gray-400" />
                )}
              </div>

              <div className="flex flex-col">
                <span
                  className={`text-sm ${
                    level === 0
                      ? "font-bold text-gray-900 dark:text-white"
                      : "font-semibold text-gray-700 dark:text-gray-300"
                  }`}
                >
                  {isMatched ? (
                    <span className="px-1.5 py-0.5 rounded bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300">
                      {cat.title}
                    </span>
                  ) : (
                    cat.title
                  )}
                </span>

                <div className="flex items-center gap-2 mt-1 text-[11px] font-medium">
                  {level === 0 && (
                    <span className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400">
                      Gốc
                    </span>
                  )}

                  <span className="flex items-center gap-1 text-gray-500">
                    <Layers className="w-3 h-3" /> {childCount} nhánh con
                  </span>
                </div>
              </div>
            </div>
          </div>
        </td>

        {/* Position */}
        <td className="px-4 py-4 w-32 align-middle">
          <div className="flex items-center justify-center">
            <input
              type="number"
              value={cat.position ?? ""}
              onChange={(e) => {
                const newPos = Number(e.target.value);
                setCategories((prev) =>
                  prev.map((c) =>
                    c.id === cat.id ? { ...c, position: newPos } : c,
                  ),
                );
              }}
              placeholder="0"
              className="w-16 border border-gray-200 dark:border-gray-700 rounded-md p-1.5 text-center text-sm font-semibold bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 hover:border-blue-400 transition-colors"
            />
          </div>
        </td>

        {/* Status */}
        <td className="px-4 py-4 w-32 align-middle text-center">
          <button
            onClick={() => handleToggleStatus(cat)}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold transition-all ${
              cat.status === "active"
                ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400"
                : "bg-gray-100 text-gray-500 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400"
            }`}
            title="Đổi trạng thái hiển thị"
          >
            <Activity className="w-3 h-3" />
            {cat.status === "active" ? "Đang hiện" : "Đang ẩn"}
          </button>
        </td>

        {/* Actions */}
        <td className="px-4 py-4 w-48 align-middle text-right pr-6">
          <div className="flex items-center justify-end gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => onAddChild(cat.id)}
              className="p-1.5 text-blue-600 dark:text-blue-400 hover:text-blue-800 hover:bg-blue-50 dark:hover:bg-blue-900/40 rounded-md transition-colors flex items-center gap-1 text-xs font-bold"
              title="Tạo nhánh con"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden xl:inline">Thêm con</span>
            </button>

            <div className="w-px h-4 bg-gray-200 dark:bg-gray-700 mx-1"></div>

            <button
              onClick={() => onEditNode(cat.id)}
              className="p-1.5 text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded-md transition-colors"
              title="Chỉnh sửa cấu trúc"
            >
              <Edit className="w-4 h-4" />
            </button>

            <button
              onClick={() => handleDelete(cat.id)}
              className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-md transition-colors"
              title="Xóa danh mục"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </td>
      </tr>

      {hasChildren &&
        isExpanded &&
        cat.children!.map((child) => (
          <MerchandisingNodeRow
            key={child.id}
            cat={child}
            level={level + 1}
            expanded={expanded}
            toggleExpand={toggleExpand}
            selectedCategories={selectedCategories}
            setSelectedCategories={setSelectedCategories}
            setCategories={setCategories}
            handleToggleStatus={handleToggleStatus}
            handleDelete={handleDelete}
            onAddChild={onAddChild}
            onEditNode={onEditNode}
            searchTerm={searchTerm}
          />
        ))}
    </>
  );
};

// ============================================
// 4. TREE BODY WRAPPER
// ============================================
export const CategoryTreeTableBody: React.FC<{
  categories: ProductCategoryNode[];
  selectedCategories: number[];
  setSelectedCategories: React.Dispatch<React.SetStateAction<number[]>>;
  setCategories: React.Dispatch<React.SetStateAction<any[]>>;
  handleToggleStatus: (cat: ProductCategoryNode) => void;
  handleDelete: (id: number) => void;
  onAddChild: (id: number) => void;
  onEditNode: (id: number) => void;
  searchTerm?: string;
  autoExpandAll?: boolean;
}> = ({
  categories,
  selectedCategories,
  setSelectedCategories,
  setCategories,
  handleToggleStatus,
  handleDelete,
  onAddChild,
  onEditNode,
  searchTerm = "",
  autoExpandAll = false,
}) => {
  const [expanded, setExpanded] = useState<Record<number, boolean>>({});

  const allIds = useMemo(() => collectAllIds(categories), [categories]);

  const toggleExpand = (id: number) =>
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));

  const expandAll = () => {
    const all: Record<number, boolean> = {};
    allIds.forEach((id) => {
      all[id] = true;
    });
    setExpanded(all);
  };

  const collapseAll = () => setExpanded({});

  useEffect(() => {
    if (autoExpandAll) {
      const all: Record<number, boolean> = {};
      allIds.forEach((id) => {
        all[id] = true;
      });
      setExpanded(all);
    }
  }, [autoExpandAll, allIds]);

  useEffect(() => {
    (window as any).expandAllCategories = expandAll;
    (window as any).collapseAllCategories = collapseAll;

    return () => {
      delete (window as any).expandAllCategories;
      delete (window as any).collapseAllCategories;
    };
  }, [allIds]);

  return (
    <>
      {categories.map((cat) => (
        <MerchandisingNodeRow
          key={cat.id}
          cat={cat}
          level={0}
          expanded={expanded}
          toggleExpand={toggleExpand}
          selectedCategories={selectedCategories}
          setSelectedCategories={setSelectedCategories}
          setCategories={setCategories}
          handleToggleStatus={handleToggleStatus}
          handleDelete={handleDelete}
          onAddChild={onAddChild}
          onEditNode={onEditNode}
          searchTerm={searchTerm}
        />
      ))}
    </>
  );
};
