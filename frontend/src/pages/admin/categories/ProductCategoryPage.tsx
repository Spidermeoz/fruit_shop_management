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
  // Thêm state để đảm bảo Portal chỉ chạy trên client-side (trình duyệt)
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    // Tùy chọn: Khóa cuộn trang (scroll) khi mở modal
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

  // Gói nội dung Modal vào một biến
  const overlayContent = (
    <div className="fixed inset-0 z-[99999]">
      {/* Lớp phủ background */}
      <div
        className="absolute inset-0 bg-slate-950/35 backdrop-blur-[6px]"
        onClick={onClose}
      />

      <div className="absolute inset-0 flex items-center justify-center p-4 sm:p-6 lg:p-10 pointer-events-none">
        <div className="relative w-full transition-all duration-300 max-w-5xl pointer-events-auto">
          <div className="relative overflow-hidden rounded-[28px] border border-white/60 bg-white/95 shadow-[0_24px_80px_rgba(15,23,42,0.18)] ring-1 ring-black/5 dark:border-gray-800 dark:bg-gray-900/95">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-cyan-500/10" />

            <div className="relative px-5 sm:px-7 pt-6 pb-5 border-b border-gray-100 dark:border-gray-800">
              <div className="flex items-start gap-4">
                <div className="shrink-0 w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center shadow-md">
                  {icon}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900 dark:text-white tracking-tight">
                      {title}
                    </h2>

                    {contextLabel && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 text-blue-700 border border-blue-100 px-3 py-1 text-xs font-bold dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800">
                        <FolderTree className="w-3.5 h-3.5" />
                        {contextLabel}
                      </span>
                    )}
                  </div>

                  {description && (
                    <p className="mt-1.5 text-sm text-gray-500 dark:text-gray-400 max-w-2xl">
                      {description}
                    </p>
                  )}
                </div>

                <button
                  onClick={onClose}
                  className="shrink-0 w-10 h-10 rounded-xl border border-gray-200 bg-white text-gray-500 hover:text-gray-900 hover:bg-gray-50 transition-colors dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:text-white"
                >
                  <X className="w-5 h-5 mx-auto" />
                </button>
              </div>
            </div>

            <div className="relative overflow-y-auto px-5 sm:px-7 py-6 max-h-[85vh]">
              {children}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Sử dụng createPortal để gắn modal trực tiếp vào body thay vì div hiện tại
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
    <div className="w-full pb-10 space-y-8">
      {/* HEADER */}
      <section className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
            Cấu Trúc Danh Mục
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">
            Quản lý phân cấp, thứ tự hiển thị và luồng điều hướng của toàn bộ
            cửa hàng.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex bg-white dark:bg-gray-800 rounded-xl p-1 border border-gray-200 dark:border-gray-700 shadow-sm">
            <button
              onClick={() => (window as any).expandAllCategories?.()}
              className="flex items-center gap-1.5 px-3 py-2 text-sm font-semibold text-gray-600 hover:text-blue-600 dark:text-gray-300 transition-colors"
              title="Mở toàn bộ cây"
            >
              <ArrowDownToLine className="w-4 h-4" />
              Mở rộng
            </button>

            <div className="w-px bg-gray-200 dark:bg-gray-700 my-1 mx-1"></div>

            <button
              onClick={() => (window as any).collapseAllCategories?.()}
              className="flex items-center gap-1.5 px-3 py-2 text-sm font-semibold text-gray-600 hover:text-blue-600 dark:text-gray-300 transition-colors"
              title="Thu gọn nhánh"
            >
              <ArrowUpToLine className="w-4 h-4" />
              Thu gọn
            </button>
          </div>

          <button
            onClick={openCreateRoot}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-sm transition-all"
          >
            <Plus className="w-5 h-5" />
            Thêm Danh Mục Gốc
          </button>
        </div>
      </section>

      {/* KPI */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5 flex flex-col justify-center border-l-4 border-blue-500 bg-gradient-to-r from-white to-blue-50/30 dark:from-gray-800 dark:to-blue-900/10">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 uppercase">
              Tổng cộng
            </span>
            <Network className="w-5 h-5 text-blue-400" />
          </div>
          <p className="mt-2 text-2xl font-black text-gray-900 dark:text-white">
            {categories.length}
          </p>
        </Card>

        <Card className="p-5 flex flex-col justify-center border-l-4 border-indigo-500">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 uppercase">
              Nhánh gốc (Root)
            </span>
            <FolderTree className="w-5 h-5 text-indigo-400" />
          </div>
          <p className="mt-2 text-2xl font-black text-gray-900 dark:text-white">
            {insights.rootCount}{" "}
            <span className="text-sm font-medium text-gray-400">
              / {insights.subCount} sub
            </span>
          </p>
        </Card>

        <Card className="p-5 flex flex-col justify-center border-l-4 border-emerald-500">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 uppercase">
              Đang hiển thị
            </span>
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          </div>
          <p className="mt-2 text-2xl font-black text-gray-900 dark:text-white">
            {insights.activeCount}
          </p>
        </Card>

        <Card className="p-5 flex flex-col justify-center border-l-4 border-red-500">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 uppercase">
              Đang ẩn
            </span>
            <ShieldAlert className="w-5 h-5 text-red-400" />
          </div>
          <p className="mt-2 text-2xl font-black text-red-600 dark:text-red-400">
            {insights.inactiveCount}
          </p>
        </Card>
      </section>

      {/* BULK ACTION */}
      {selectedCategories.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-2xl shadow-sm animate-in fade-in slide-in-from-top-4 z-10 sticky top-0">
          <div className="flex items-center gap-3">
            <span className="bg-indigo-600 text-white text-sm font-bold px-3 py-1 rounded-full">
              {selectedCategories.length}
            </span>
            <p className="text-sm font-medium text-indigo-900 dark:text-indigo-200">
              danh mục đang được chọn
            </p>
          </div>

          <div className="flex items-center gap-3">
            <select
              value={bulkAction}
              onChange={(e) => setBulkAction(e.target.value)}
              className="border border-indigo-200 dark:border-indigo-700 rounded-xl px-3 py-2 bg-white dark:bg-gray-800 text-sm font-semibold text-gray-700 outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">-- Chọn thao tác cây --</option>
              <option value="activate">Bật hiển thị tất cả</option>
              <option value="deactivate">Ẩn tất cả</option>
              <option value="update_position">Lưu thứ tự (Position)</option>
              <option value="delete">Xóa các nhánh đã chọn</option>
            </select>

            <button
              onClick={handleBulkAction}
              className="px-5 py-2 bg-indigo-600 text-white text-sm font-bold rounded-xl hover:bg-indigo-700 transition-colors"
            >
              Thực thi
            </button>
          </div>
        </div>
      )}

      {/* CONTROL BAR */}
      <section className="bg-white/90 dark:bg-gray-800/90 backdrop-blur p-4 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col xl:flex-row gap-4 items-start xl:items-center justify-between">
        <div className="flex flex-col lg:flex-row gap-3 w-full">
          <div className="relative w-full lg:w-96">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>

            <input
              type="text"
              placeholder="Tìm nhanh danh mục..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <div className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-sm font-semibold text-gray-600 dark:text-gray-300">
              <Filter className="w-4 h-4" />
              Bộ lọc
            </div>

            {[
              { value: "all", label: "Tất cả" },
              { value: "active", label: "Active" },
              { value: "inactive", label: "Inactive" },
              { value: "root-only", label: "Root only" },
              { value: "searched-paths", label: "Searched paths" },
            ].map((item) => {
              const isActive = filterMode === item.value;

              return (
                <button
                  key={item.value}
                  onClick={() => setFilterMode(item.value as FilterMode)}
                  className={`px-3 py-2 rounded-xl text-sm font-semibold border transition-colors ${
                    isActive
                      ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                      : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-blue-300"
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* TREE */}
      <Card className="overflow-hidden border border-gray-200 dark:border-gray-700 shadow-sm rounded-2xl">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex flex-col justify-center items-center py-24 space-y-4">
              <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
              <span className="text-gray-500 font-medium">
                Đang tải cấu trúc cây...
              </span>
            </div>
          ) : error ? (
            <div className="text-center py-16">
              <ShieldAlert className="w-10 h-10 text-red-500 mx-auto mb-3" />
              <p className="text-red-600 font-medium">{error}</p>
              <button
                onClick={fetchCategories}
                className="mt-4 px-4 py-2 bg-gray-100 rounded-xl font-medium"
              >
                Thử lại
              </button>
            </div>
          ) : displayCategories.length === 0 ? (
            <div className="text-center py-20 flex flex-col items-center">
              <FolderTree className="w-16 h-16 text-gray-300 dark:text-gray-600 mb-4" />
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                Cấu trúc trống
              </h3>
              <p className="text-gray-500 mt-1 mb-6 text-sm">
                Chưa có danh mục nào trong hệ thống hoặc không tìm thấy kết quả.
              </p>
              <button
                onClick={openCreateRoot}
                className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-medium transition-colors"
              >
                <Plus className="w-5 h-5" />
                Bắt đầu tạo Root Category
              </button>
            </div>
          ) : (
            <table className="min-w-full text-left table-fixed">
              <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="px-4 py-3 w-12 text-center">
                    <input
                      ref={(el) => {
                        if (el) el.indeterminate = someVisibleSelected;
                      }}
                      type="checkbox"
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
                      checked={allVisibleSelected}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedCategories((prev) =>
                            Array.from(
                              new Set([...prev, ...visibleCategoryIds]),
                            ),
                          );
                        } else {
                          setSelectedCategories((prev) =>
                            prev.filter(
                              (id) => !visibleCategoryIds.includes(id),
                            ),
                          );
                        }
                      }}
                    />
                  </th>

                  <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Cấu trúc (Node)
                  </th>

                  <th className="px-4 py-3 w-32 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Thứ tự
                  </th>

                  <th className="px-4 py-3 w-32 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Trạng thái
                  </th>

                  <th className="px-4 py-3 w-48 text-right pr-6 text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Thao tác
                  </th>
                </tr>
              </thead>

              <tbody className="bg-white dark:bg-gray-900">
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
              </tbody>
            </table>
          )}
        </div>
      </Card>

      {/* FLOATING PANEL */}
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
