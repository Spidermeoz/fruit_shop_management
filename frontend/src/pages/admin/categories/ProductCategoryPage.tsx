import React, { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import Card from "../../../components/admin/layouts/Card";
import {
  Plus,
  Loader2,
  Network,
  FolderTree,
  ArrowDownToLine,
  ArrowUpToLine,
  ShieldAlert,
  CheckCircle2,
  Search,
  Filter,
  X,
  PencilLine,
  GitBranchPlus,
  RefreshCw,
  AlertCircle,
} from "lucide-react";
import {
  buildCategoryTree,
  CategoryTreeTableBody,
} from "../../../utils/categoryTree";
import { http } from "../../../services/http";
import { useAdminToast } from "../../../context/AdminToastContext";
import { ProductCategoryForm } from "./ProductCategoryCreatePage";
import { ProductCategoryEditForm } from "./ProductCategoryEditPage";

interface ProductCategory {
  id: number;
  title: string;
  description?: string;
  slug?: string;
  thumbnail?: string;
  status: string;
  position: number;
  parent_id?: number | null;
  created_at?: string;
  updated_at?: string;
}

type ApiList<T> = { success: true; data: T[]; meta?: any };
type ApiOk = { success: true; data: any; meta?: any };

type OverlayMode = "create-root" | "create-child" | "edit" | null;

type FilterMode =
  | "all"
  | "active"
  | "inactive"
  | "root-only"
  | "searched-paths";

interface CategoryOverlayPanelProps {
  open: boolean;
  mode: OverlayMode;
  title: string;
  description?: string;
  contextLabel?: string;
  onClose: () => void;
  children: React.ReactNode;
}

const CategoryOverlayPanel: React.FC<CategoryOverlayPanelProps> = ({
  open,
  mode,
  title,
  description,
  contextLabel,
  onClose,
  children,
}) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [open]);

  if (!open || !mode || !mounted) return null;

  const icon =
    mode === "create-root" ? (
      <Plus className="w-5 h-5" />
    ) : mode === "create-child" ? (
      <GitBranchPlus className="w-5 h-5" />
    ) : (
      <PencilLine className="w-5 h-5" />
    );

  const overlayContent = (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-4xl rounded-2xl bg-white dark:bg-gray-900 shadow-2xl border border-gray-200 dark:border-gray-700 flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
        {/* Header Modal */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
              {icon}
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                {title}
                {contextLabel && (
                  <span className="inline-flex items-center gap-1 rounded-md bg-gray-100 text-gray-600 border border-gray-200 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700 ml-2">
                    <FolderTree className="w-3 h-3" />
                    {contextLabel}
                  </span>
                )}
              </h3>
              {description && (
                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mt-0.5">
                  {description}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Modal */}
        <div className="p-6 overflow-y-auto flex-1">{children}</div>
      </div>
    </div>
  );

  return createPortal(overlayContent, document.body);
};

const ProductCategoryPage: React.FC = () => {
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<number[]>([]);
  const [bulkAction, setBulkAction] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterMode, setFilterMode] = useState<FilterMode>("all");

  const [overlayMode, setOverlayMode] = useState<OverlayMode>(null);
  const [activeNodeId, setActiveNodeId] = useState<number | null>(null);

  const { showSuccessToast, showErrorToast } = useAdminToast();

  const fetchCategories = async () => {
    try {
      setLoading(true);
      setError("");

      const res = await http<ApiList<any>>(
        "GET",
        `/api/v1/admin/product-category?limit=1000`,
      );

      const raw = Array.isArray(res.data) ? res.data : [];
      const data: ProductCategory[] = raw.map((c: any) => ({
        ...c,
        parent_id:
          c.parent_id !== undefined
            ? c.parent_id
            : c.parentId !== undefined
              ? c.parentId
              : null,
      }));

      setCategories(data);
    } catch (err: any) {
      setError(err?.message || "Lỗi kết nối server hoặc API không phản hồi.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openCreateRoot = () => {
    setActiveNodeId(null);
    setOverlayMode("create-root");
  };

  const openCreateChild = (parentId: number) => {
    setActiveNodeId(parentId);
    setOverlayMode("create-child");
  };

  const openEditNode = (id: number) => {
    setActiveNodeId(id);
    setOverlayMode("edit");
  };

  const closeOverlay = () => {
    setOverlayMode(null);
    setActiveNodeId(null);
  };

  const handleDelete = async (id: number) => {
    if (
      !window.confirm(
        "Xóa danh mục này có thể ảnh hưởng đến sản phẩm bên trong. Tiếp tục?",
      )
    )
      return;

    try {
      setLoading(true);
      await http<ApiOk>(
        "DELETE",
        `/api/v1/admin/product-category/delete/${id}`,
      );

      showSuccessToast({ message: "Đã xóa nhánh danh mục!" });
      setCategories((prev) => prev.filter((c) => c.id !== id));
      setSelectedCategories((prev) => prev.filter((x) => x !== id));
    } catch (err: any) {
      showErrorToast(err?.message || "Không thể kết nối đến server!");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (category: ProductCategory) => {
    const newStatus =
      category.status.toLowerCase() === "active" ? "inactive" : "active";

    try {
      await http<ApiOk>(
        "PATCH",
        `/api/v1/admin/product-category/${category.id}/status`,
        { status: newStatus },
      );

      setCategories((prev) =>
        prev.map((c) =>
          c.id === category.id ? { ...c, status: newStatus } : c,
        ),
      );
    } catch (err: any) {
      showErrorToast(err?.message || "Cập nhật trạng thái thất bại");
    }
  };

  const handleBulkAction = async () => {
    if (!bulkAction) {
      showErrorToast("Vui lòng chọn hành động!");
      return;
    }

    if (selectedCategories.length === 0) {
      showErrorToast("Chưa chọn danh mục nào!");
      return;
    }

    if (
      !window.confirm(
        `Áp dụng '${bulkAction}' cho ${selectedCategories.length} node đã chọn?`,
      )
    )
      return;

    try {
      const body: any = { ids: selectedCategories, updated_by_id: 1 };

      switch (bulkAction) {
        case "activate":
          body.action = "status";
          body.value = "active";
          break;
        case "deactivate":
          body.action = "status";
          body.value = "inactive";
          break;
        case "delete":
          body.patch = { deleted: true };
          break;
        case "update_position":
          body.action = "position";
          body.value = {};
          categories
            .filter((c) => selectedCategories.includes(c.id))
            .forEach((c) => {
              body.value[c.id] = Number(c.position) || 0;
            });
          break;
        default:
          showErrorToast("Hành động không hợp lệ!");
          return;
      }

      await http<ApiOk>(
        "PATCH",
        "/api/v1/admin/product-category/bulk-edit",
        body,
      );
      showSuccessToast({ message: "Cập nhật cấu trúc thành công!" });
      setSelectedCategories([]);
      fetchCategories();
    } catch (err: any) {
      showErrorToast(err?.message || "Lỗi kết nối server!");
    }
  };

  const insights = useMemo(() => {
    const rootCount = categories.filter((c) => !c.parent_id).length;
    const activeCount = categories.filter((c) => c.status === "active").length;
    const inactiveCount = categories.length - activeCount;

    return {
      rootCount,
      subCount: categories.length - rootCount,
      activeCount,
      inactiveCount,
    };
  }, [categories]);

  const searchMatchedIds = useMemo(() => {
    if (!searchTerm.trim()) return new Set<number>();

    const lowerTerm = searchTerm.toLowerCase();
    const matchedIds = new Set<number>();

    categories.forEach((c) => {
      if (
        String(c.title ?? "")
          .toLowerCase()
          .includes(lowerTerm)
      ) {
        matchedIds.add(c.id);

        let parentId = c.parent_id ?? null;
        while (parentId) {
          matchedIds.add(parentId);
          const parentObj = categories.find((p) => p.id === parentId);
          parentId = parentObj ? (parentObj.parent_id ?? null) : null;
        }
      }
    });

    return matchedIds;
  }, [categories, searchTerm]);

  const displayCategories = useMemo(() => {
    const roots = categories.filter((c) => !c.parent_id);

    switch (filterMode) {
      case "active":
        return categories.filter((c) => c.status === "active");

      case "inactive":
        return categories.filter((c) => c.status !== "active");

      case "root-only":
        return roots;

      case "searched-paths":
        if (!searchTerm.trim()) return categories;
        return categories.filter((c) => searchMatchedIds.has(c.id));

      case "all":
      default:
        if (!searchTerm.trim()) return categories;
        return categories.filter((c) => searchMatchedIds.has(c.id));
    }
  }, [categories, filterMode, searchMatchedIds, searchTerm]);

  const visibleCategoryIds = useMemo(
    () => displayCategories.map((c) => c.id),
    [displayCategories],
  );

  const selectedVisibleCount = useMemo(
    () =>
      selectedCategories.filter((id) => visibleCategoryIds.includes(id)).length,
    [selectedCategories, visibleCategoryIds],
  );

  const allVisibleSelected =
    visibleCategoryIds.length > 0 &&
    selectedVisibleCount === visibleCategoryIds.length;

  const someVisibleSelected =
    selectedVisibleCount > 0 &&
    selectedVisibleCount < visibleCategoryIds.length;

  const activeNode = useMemo(
    () => categories.find((c) => c.id === activeNodeId) ?? null,
    [categories, activeNodeId],
  );

  const overlayTitle =
    overlayMode === "create-root"
      ? "Tạo danh mục gốc"
      : overlayMode === "create-child"
        ? "Thêm danh mục con"
        : overlayMode === "edit"
          ? "Chỉnh sửa danh mục"
          : "";

  const overlayDescription =
    overlayMode === "create-root"
      ? "Tạo một nhánh gốc mới cho cây danh mục ngay trong cùng không gian quản trị."
      : overlayMode === "create-child"
        ? "Thêm node con trực tiếp từ nhánh đang thao tác để giữ flow quản trị liền mạch."
        : overlayMode === "edit"
          ? "Cập nhật node hiện tại mà không rời khỏi tree manager."
          : "";

  const overlayContext =
    overlayMode === "create-root"
      ? "Root level"
      : activeNode?.title || "Node hiện tại";

  return (
    <div className="w-full pb-10 space-y-6">
      {/* 🔹 TẦNG A: HEADER / COMMAND BAR */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
              Cấu trúc Danh mục
            </h1>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Quản lý phân cấp, thứ tự hiển thị và luồng điều hướng của toàn bộ hệ
            thống.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <button
            onClick={fetchCategories}
            className="p-2.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition shadow-sm"
            title="Làm mới dữ liệu"
          >
            <RefreshCw className="w-5 h-5" />
          </button>

          <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1 shadow-sm">
            <button
              onClick={() => (window as any).expandAllCategories?.()}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white transition-colors"
              title="Mở toàn bộ cây"
            >
              <ArrowDownToLine className="w-3.5 h-3.5" /> Mở rộng
            </button>
            <div className="w-px bg-gray-300 dark:bg-gray-600 my-1 mx-0.5"></div>
            <button
              onClick={() => (window as any).collapseAllCategories?.()}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white transition-colors"
              title="Thu gọn nhánh"
            >
              <ArrowUpToLine className="w-3.5 h-3.5" /> Thu gọn
            </button>
          </div>

          <button
            onClick={openCreateRoot}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition shadow-sm w-full md:w-auto justify-center"
          >
            <Plus className="w-4 h-4" /> Thêm Danh Mục Gốc
          </button>
        </div>
      </div>

      {/* 🔹 TẦNG B: KPI CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: "Tổng cộng",
            value: categories.length,
            icon: Network,
            color: "text-blue-600",
            bg: "bg-blue-50",
          },
          {
            label: "Nhánh gốc (Root)",
            value: `${insights.rootCount} / ${insights.subCount} sub`,
            icon: FolderTree,
            color: "text-indigo-600",
            bg: "bg-indigo-50",
          },
          {
            label: "Đang hiển thị",
            value: insights.activeCount,
            icon: CheckCircle2,
            color: "text-emerald-600",
            bg: "bg-emerald-50",
          },
          {
            label: "Đang ẩn",
            value: insights.inactiveCount,
            icon: ShieldAlert,
            color: "text-amber-600",
            bg: "bg-amber-50",
            isWarning: insights.inactiveCount > 0,
          },
        ].map((kpi, idx) => (
          <div
            key={idx}
            className="p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 flex flex-col justify-center shadow-sm"
          >
            <div className="flex items-center gap-2 mb-2">
              <div className={`p-1.5 rounded-lg ${kpi.bg} dark:bg-gray-800`}>
                <kpi.icon className={`w-4 h-4 ${kpi.color}`} />
              </div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 truncate">
                {kpi.label}
              </span>
            </div>
            <div
              className={`text-xl font-black ${
                kpi.isWarning
                  ? "text-amber-600 dark:text-amber-400"
                  : "text-gray-900 dark:text-white"
              }`}
            >
              {kpi.value}
            </div>
          </div>
        ))}
      </div>

      {/* 🔹 TẦNG C & D: TOOLBAR & BULK ACTIONS */}
      <div className="flex flex-col gap-4">
        {/* Bulk Action */}
        {selectedCategories.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-indigo-50 dark:bg-indigo-900/20 px-4 py-3 rounded-xl border border-indigo-100 dark:border-indigo-900/50 animate-in fade-in slide-in-from-top-2 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="bg-indigo-600 text-white text-sm font-bold px-3 py-0.5 rounded-full">
                {selectedCategories.length}
              </span>
              <p className="text-sm font-medium text-indigo-900 dark:text-indigo-200">
                danh mục đang được chọn
              </p>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <select
                value={bulkAction}
                onChange={(e) => setBulkAction(e.target.value)}
                className="flex-1 sm:flex-none border border-indigo-200 dark:border-indigo-700 rounded-lg px-3 py-2 bg-white dark:bg-gray-800 text-sm font-semibold text-gray-700 dark:text-gray-200 outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">-- Chọn thao tác cây --</option>
                <option value="activate">Bật hiển thị tất cả</option>
                <option value="deactivate">Ẩn tất cả</option>
                <option value="update_position">Lưu thứ tự (Position)</option>
                <option value="delete">Xóa các nhánh đã chọn</option>
              </select>

              <button
                onClick={handleBulkAction}
                className="px-4 py-2 bg-indigo-600 text-white text-sm font-bold rounded-lg hover:bg-indigo-700 transition-colors shadow-sm shrink-0"
              >
                Thực thi
              </button>
            </div>
          </div>
        )}

        {/* Toolbar (Search & Filters) */}
        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col lg:flex-row gap-4 items-center justify-between">
          <div className="relative w-full lg:w-80">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm nhanh danh mục..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 lg:pb-0 w-full lg:w-auto">
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-xs font-semibold text-gray-600 dark:text-gray-300 shrink-0">
              <Filter className="w-3.5 h-3.5" /> Lọc theo:
            </div>
            {[
              { value: "all", label: "Tất cả" },
              { value: "active", label: "Đang bật" },
              { value: "inactive", label: "Đang ẩn" },
              { value: "root-only", label: "Nhánh gốc" },
              { value: "searched-paths", label: "Theo tìm kiếm" },
            ].map((item) => (
              <button
                key={item.value}
                onClick={() => setFilterMode(item.value as FilterMode)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors shrink-0 ${
                  filterMode === item.value
                    ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                    : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:border-gray-300"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 🔹 TẦNG E: TREE TABLE */}
      <Card className="!p-0 overflow-hidden border border-gray-200 dark:border-gray-700 shadow-sm mt-4">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 text-sm table-fixed">
            <thead className="bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 uppercase text-[11px] font-bold tracking-wider">
              <tr>
                <th className="px-5 py-4 w-12 text-center">
                  <input
                    ref={(el) => {
                      if (el) el.indeterminate = someVisibleSelected;
                    }}
                    type="checkbox"
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                    checked={allVisibleSelected}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedCategories((prev) =>
                          Array.from(new Set([...prev, ...visibleCategoryIds])),
                        );
                      } else {
                        setSelectedCategories((prev) =>
                          prev.filter((id) => !visibleCategoryIds.includes(id)),
                        );
                      }
                    }}
                  />
                </th>
                <th className="px-5 py-4 text-left">Cấu trúc (Node)</th>
                <th className="px-5 py-4 w-32 text-center">Thứ tự</th>
                <th className="px-5 py-4 w-32 text-center">Trạng thái</th>
                <th className="px-5 py-4 w-48 text-right pr-6">Thao tác</th>
              </tr>
            </thead>

            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-100 dark:divide-gray-800">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-5 py-24 text-center">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-3" />
                    <p className="text-gray-500 font-medium">
                      Đang đồng bộ cấu trúc cây...
                    </p>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={5} className="px-5 py-16 text-center">
                    <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-3" />
                    <p className="text-red-600 font-medium">{error}</p>
                    <button
                      onClick={fetchCategories}
                      className="mt-4 px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg font-medium hover:bg-gray-200 transition"
                    >
                      Thử lại
                    </button>
                  </td>
                </tr>
              ) : displayCategories.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-20 text-center">
                    <div className="flex flex-col items-center">
                      <FolderTree className="w-12 h-12 text-gray-300 dark:text-gray-600 mb-4" />
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                        Cấu trúc trống
                      </h3>
                      <p className="text-sm text-gray-500 mt-1 mb-5">
                        Chưa có danh mục nào hoặc không khớp kết quả lọc.
                      </p>
                      <button
                        onClick={openCreateRoot}
                        className="flex items-center gap-2 px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors text-sm"
                      >
                        <Plus className="w-4 h-4" /> Bắt đầu tạo Nhánh Gốc
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                <CategoryTreeTableBody
                  categories={buildCategoryTree(displayCategories)}
                  selectedCategories={selectedCategories}
                  setSelectedCategories={setSelectedCategories}
                  setCategories={setCategories}
                  handleToggleStatus={handleToggleStatus}
                  handleDelete={handleDelete}
                  onAddChild={openCreateChild}
                  onEditNode={openEditNode}
                  searchTerm={searchTerm}
                  autoExpandAll={filterMode === "searched-paths"}
                />
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* FLOATING PANEL MODAL */}
      <CategoryOverlayPanel
        open={!!overlayMode}
        mode={overlayMode}
        onClose={closeOverlay}
        title={overlayTitle}
        description={overlayDescription}
        contextLabel={overlayContext}
      >
        {overlayMode === "create-root" && (
          <ProductCategoryForm
            mode="modal"
            initialParentId={null}
            onCancel={closeOverlay}
            onSuccess={() => {
              closeOverlay();
              fetchCategories();
            }}
            submitLabel="Tạo danh mục gốc"
          />
        )}

        {overlayMode === "create-child" && activeNodeId !== null && (
          <ProductCategoryForm
            mode="modal"
            initialParentId={activeNodeId}
            onCancel={closeOverlay}
            onSuccess={() => {
              closeOverlay();
              fetchCategories();
            }}
            submitLabel="Tạo danh mục con"
          />
        )}

        {overlayMode === "edit" && activeNodeId !== null && (
          <ProductCategoryEditForm
            mode="modal"
            categoryId={activeNodeId}
            onCancel={closeOverlay}
            onSuccess={() => {
              closeOverlay();
              fetchCategories();
            }}
            submitLabel="Lưu thay đổi"
          />
        )}
      </CategoryOverlayPanel>
    </div>
  );
};

export default ProductCategoryPage;
