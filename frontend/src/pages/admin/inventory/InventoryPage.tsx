import React, { useEffect, useMemo, useState } from "react";
import Card from "../../../components/admin/layouts/Card";
import {
  Search,
  Loader2,
  Save,
  GitBranch,
  ChevronRight,
  ChevronDown,
  ArrowRightLeft,
  AlertTriangle,
  CheckCircle2,
  Package,
  Layers,
  X,
  Undo2,
  Inbox,
  AlertCircle,
} from "lucide-react";
import { http } from "../../../services/http";
import { useAdminToast } from "../../../context/AdminToastContext";
import { useAuth } from "../../../context/AuthContextAdmin";

// --- TYPES ---
export interface InventoryListItem {
  branchId: number;
  branchName: string;
  branchCode: string | null;
  productId: number;
  productTitle: string;
  productThumbnail: string | null;
  productStatus: string | null;
  variantId: number;
  variantSku: string | null;
  variantTitle: string | null;
  variantPrice: number;
  variantStatus: string | null;
  quantity: number;
  reservedQuantity: number;
  availableQuantity: number;
  createdAt: string | null;
  updatedAt: string | null;
}

interface ProductGroup {
  productId: number;
  productTitle: string;
  productThumbnail: string | null;
  productStatus: string | null;
  rows: InventoryListItem[];
  totalQuantity: number;
  totalReservedQuantity: number;
  totalAvailableQuantity: number;
  variantCount: number;
}

type QuickFilter = "all" | "low" | "out";

// --- HELPERS ---
const getStockStatus = (available: number) => {
  if (available <= 0)
    return {
      label: "Hết hàng",
      color:
        "text-red-600 bg-red-50 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800",
    };
  if (available <= 10)
    return {
      label: "Sắp hết",
      color:
        "text-amber-600 bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800",
    };
  return {
    label: "Ổn định",
    color:
      "text-emerald-600 bg-emerald-50 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800",
  };
};

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(value);
};

const InventoryPage: React.FC = () => {
  const { showSuccessToast, showErrorToast } = useAdminToast();
  const { branches, currentBranchId } = useAuth();

  // --- STATES ---
  const [rows, setRows] = useState<InventoryListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [savingMap, setSavingMap] = useState<Record<string, boolean>>({});
  const [error, setError] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [selectedBranchId, setSelectedBranchId] = useState<number | "all">(
    currentBranchId ?? "all",
  );
  const [quickFilter, setQuickFilter] = useState<QuickFilter>("all");
  const [draftMap, setDraftMap] = useState<Record<string, number>>({});
  const [expandedGroups, setExpandedGroups] = useState<Record<number, boolean>>(
    {},
  );

  const [transferModal, setTransferModal] = useState<InventoryListItem | null>(
    null,
  );
  const [transferQty, setTransferQty] = useState<number | "">("");
  const [targetBranchId, setTargetBranchId] = useState<number | "">("");

  const makeKey = (row: InventoryListItem) =>
    `${row.branchId}-${row.variantId}`;

  const toggleProduct = (productId: number) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [productId]: !prev[productId],
    }));
  };

  const isExpanded = (productId: number) => !!expandedGroups[productId];

  // --- FETCH DATA ---
  const fetchInventory = async (isRefresh = false) => {
    try {
      setLoading(true);
      setError("");
      if (isRefresh) {
        setDraftMap({}); // Xóa các bản nháp đang chỉnh sửa khi refresh
      }

      let url = "/api/v1/admin/inventory";
      const params = new URLSearchParams();

      if (selectedBranchId !== "all")
        params.set("branchId", String(selectedBranchId));
      if (searchInput.trim()) params.set("q", searchInput.trim());

      const qs = params.toString();
      if (qs) url += `?${qs}`;

      const res = await http<any>("GET", url);

      if (res?.success && Array.isArray(res.data)) {
        setRows(
          res.data.map((item: any) => ({
            branchId: Number(item.branchId),
            branchName: String(item.branchName ?? ""),
            branchCode: item.branchCode ?? null,
            productId: Number(item.productId),
            productTitle: String(item.productTitle ?? ""),
            productThumbnail: item.productThumbnail ?? null,
            productStatus: item.productStatus ?? null,
            variantId: Number(item.variantId),
            variantSku: item.variantSku ?? null,
            variantTitle: item.variantTitle ?? null,
            variantPrice: Number(item.variantPrice ?? 0),
            variantStatus: item.variantStatus ?? null,
            quantity: Number(item.quantity ?? 0),
            reservedQuantity: Number(item.reservedQuantity ?? 0),
            availableQuantity: Number(item.availableQuantity ?? 0),
            createdAt: item.createdAt ?? null,
            updatedAt: item.updatedAt ?? null,
          })),
        );
      } else {
        setRows([]);
      }
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Không thể tải dữ liệu kho");
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
    setExpandedGroups({});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedBranchId]);

  useEffect(() => {
    const t = setTimeout(() => {
      fetchInventory();
    }, 400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput]);

  // --- DERIVED DATA & LOGIC ---
  const kpiData = useMemo(() => {
    let available = 0,
      reserved = 0,
      lowCount = 0,
      outCount = 0;
    const variantSet = new Set<number>();
    const productSet = new Set<number>();

    rows.forEach((r) => {
      available += r.availableQuantity;
      reserved += r.reservedQuantity;
      if (r.availableQuantity <= 0) outCount++;
      else if (r.availableQuantity <= 10) lowCount++;
      variantSet.add(r.variantId);
      productSet.add(r.productId);
    });

    return {
      totalProducts: productSet.size,
      totalVariants: variantSet.size,
      available,
      reserved,
      lowCount,
      outCount,
    };
  }, [rows]);

  const visibleRows = useMemo(() => {
    return rows.filter((row) => {
      if (quickFilter === "low")
        return row.availableQuantity > 0 && row.availableQuantity <= 10;
      if (quickFilter === "out") return row.availableQuantity <= 0;
      return true;
    });
  }, [rows, quickFilter]);

  const groupedRows = useMemo(() => {
    const groups: Record<number, ProductGroup> = {};
    visibleRows.forEach((row) => {
      if (!groups[row.productId]) {
        groups[row.productId] = {
          productId: row.productId,
          productTitle: row.productTitle,
          productThumbnail: row.productThumbnail ?? null,
          productStatus: row.productStatus ?? null,
          rows: [],
          totalQuantity: 0,
          totalReservedQuantity: 0,
          totalAvailableQuantity: 0,
          variantCount: 0,
        };
      }
      const g = groups[row.productId];
      g.rows.push(row);
      g.totalQuantity += row.quantity;
      g.totalReservedQuantity += row.reservedQuantity;
      g.totalAvailableQuantity += row.availableQuantity;
    });

    Object.values(groups).forEach((g) => {
      const uniqueVariants = new Set(g.rows.map((r) => r.variantId));
      g.variantCount = uniqueVariants.size;
    });

    return Object.values(groups);
  }, [visibleRows]);

  // Tự động mở rộng cây nếu có search/filter
  useEffect(() => {
    if (groupedRows.length === 0) return;
    if (searchInput.trim() || quickFilter !== "all") {
      const allExpanded = groupedRows.reduce(
        (acc, g) => {
          acc[g.productId] = true;
          return acc;
        },
        {} as Record<number, boolean>,
      );
      setExpandedGroups(allExpanded);
    } else if (Object.keys(expandedGroups).length === 0) {
      setExpandedGroups({ [groupedRows[0]?.productId]: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupedRows.length, searchInput, quickFilter]);

  // --- ACTIONS ---
  const handleChangeDraft = (row: InventoryListItem, value: string) => {
    const key = makeKey(row);
    if (value === "") {
      setDraftMap((prev) => {
        const next = { ...prev };
        delete next[key]; // Reset về giá trị gốc nếu xóa rỗng
        return next;
      });
      return;
    }
    const nextVal = parseInt(value, 10);
    setDraftMap((prev) => ({
      ...prev,
      [key]: Number.isNaN(nextVal) ? 0 : Math.max(0, nextVal),
    }));
  };

  const handleResetDraft = (row: InventoryListItem) => {
    const key = makeKey(row);
    setDraftMap((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const handleSave = async (row: InventoryListItem) => {
    const key = makeKey(row);
    const quantity = draftMap[key] !== undefined ? draftMap[key] : row.quantity;

    if (quantity === row.quantity) return; // Không thay đổi thì không lưu

    try {
      setSavingMap((prev) => ({ ...prev, [key]: true }));
      await http("PATCH", "/api/v1/admin/inventory/set-stock", {
        branchId: row.branchId,
        productVariantId: row.variantId,
        quantity,
        note: `Admin cập nhật tồn kho cho branch ${row.branchName}`,
      });

      showSuccessToast({ message: "Cập nhật tồn kho thành công" });
      setRows((prev) =>
        prev.map((item) =>
          item.branchId === row.branchId && item.variantId === row.variantId
            ? {
                ...item,
                quantity,
                availableQuantity: Math.max(
                  0,
                  quantity - item.reservedQuantity,
                ),
              }
            : item,
        ),
      );
      handleResetDraft(row);
    } catch (err: any) {
      console.error(err);
      showErrorToast(err?.message || "Không thể cập nhật tồn kho");
    } finally {
      setSavingMap((prev) => ({ ...prev, [key]: false }));
    }
  };

  const currentBranchLabel =
    selectedBranchId === "all"
      ? "Tất cả chi nhánh"
      : branches.find((b: any) => Number(b.id) === Number(selectedBranchId))
          ?.name || `Chi nhánh #${selectedBranchId}`;

  return (
    <div className="w-full pb-10 space-y-6">
      {/* TẦNG 1: HEADER WORKSPACE */}
      <section className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
            Inventory Operations
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">
            Bảng điều hành tồn kho chi tiết theo sản phẩm, biến thể và chi
            nhánh.
          </p>
          <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 text-blue-700 border border-blue-100 text-xs font-bold dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800">
            <GitBranch className="w-3.5 h-3.5" />
            {currentBranchLabel}
          </div>
        </div>
      </section>

      {/* TẦNG 2: KPI SUMMARY CARDS */}
      <section className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        <Card className="p-4 flex flex-col justify-center border-l-4 border-indigo-500">
          <div className="flex items-center justify-between text-indigo-600 dark:text-indigo-400">
            <span className="text-xs font-bold uppercase tracking-wider">
              Sản phẩm
            </span>
            <Package className="w-4 h-4" />
          </div>
          <p className="mt-2 text-2xl font-black text-gray-900 dark:text-white">
            {kpiData.totalProducts}
          </p>
        </Card>

        <Card className="p-4 flex flex-col justify-center border-l-4 border-blue-500">
          <div className="flex items-center justify-between text-blue-600 dark:text-blue-400">
            <span className="text-xs font-bold uppercase tracking-wider">
              Biến thể
            </span>
            <Layers className="w-4 h-4" />
          </div>
          <p className="mt-2 text-2xl font-black text-gray-900 dark:text-white">
            {kpiData.totalVariants}
          </p>
        </Card>

        <Card className="p-4 flex flex-col justify-center border-l-4 border-emerald-500 bg-emerald-50/30 dark:bg-emerald-900/10">
          <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400">
            <span className="text-xs font-bold uppercase tracking-wider">
              Tồn khả dụng
            </span>
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <p className="mt-2 text-2xl font-black text-gray-900 dark:text-white">
            {kpiData.available}
          </p>
        </Card>

        <Card className="p-4 flex flex-col justify-center border-l-4 border-purple-500">
          <div className="flex items-center justify-between text-purple-600 dark:text-purple-400">
            <span className="text-xs font-bold uppercase tracking-wider">
              Đang tạm giữ
            </span>
            <GitBranch className="w-4 h-4" />
          </div>
          <p className="mt-2 text-2xl font-black text-gray-900 dark:text-white">
            {kpiData.reserved}
          </p>
        </Card>

        <Card className="p-4 flex flex-col justify-center border-l-4 border-amber-500 bg-amber-50/30 dark:bg-amber-900/10">
          <div className="flex items-center justify-between text-amber-600 dark:text-amber-400">
            <span className="text-xs font-bold uppercase tracking-wider">
              Sắp hết (≤10)
            </span>
            <AlertTriangle className="w-4 h-4" />
          </div>
          <p className="mt-2 text-2xl font-black text-amber-600 dark:text-amber-400">
            {kpiData.lowCount}
          </p>
        </Card>

        <Card className="p-4 flex flex-col justify-center border-l-4 border-red-500 bg-red-50/30 dark:bg-red-900/10">
          <div className="flex items-center justify-between text-red-600 dark:text-red-400">
            <span className="text-xs font-bold uppercase tracking-wider">
              Hết hàng
            </span>
            <AlertCircle className="w-4 h-4" />
          </div>
          <p className="mt-2 text-2xl font-black text-red-600 dark:text-red-400">
            {kpiData.outCount}
          </p>
        </Card>
      </section>

      {/* TẦNG 3: CONTROL BAR */}
      <section className="bg-white/90 dark:bg-gray-800/90 backdrop-blur p-4 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between sticky top-0 z-10">
        <div className="flex flex-col md:flex-row gap-3 w-full lg:w-auto flex-1">
          {/* Search */}
          <div className="relative w-full md:w-80">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Tìm theo sản phẩm / SKU..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="block w-full pl-10 pr-8 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
            />
            {searchInput && (
              <button
                onClick={() => setSearchInput("")}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Branch Filter */}
          {branches.length > 1 && (
            <select
              value={selectedBranchId}
              onChange={(e) => {
                const value = e.target.value;
                setSelectedBranchId(value === "all" ? "all" : Number(value));
              }}
              className="block w-full md:w-48 px-3 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition cursor-pointer appearance-none"
            >
              <option value="all">Tất cả chi nhánh</option>
              {branches.map((branch: any) => (
                <option key={branch.id} value={branch.id}>
                  {branch.name}
                </option>
              ))}
            </select>
          )}

          {/* Quick Filters */}
          <div className="flex items-center gap-2 p-1 bg-gray-100 dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700">
            {[
              { id: "all", label: "Tất cả" },
              { id: "low", label: "Sắp hết" },
              { id: "out", label: "Hết hàng" },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setQuickFilter(f.id as QuickFilter)}
                className={`px-4 py-1.5 text-sm font-semibold rounded-lg transition-colors ${
                  quickFilter === f.id
                    ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
                    : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* TẦNG 4: INVENTORY BOARD MAIN AREA */}
      <Card className="overflow-hidden border border-gray-200 dark:border-gray-700 shadow-sm rounded-2xl">
        <div className="overflow-x-auto">
          {loading && groupedRows.length === 0 ? (
            <div className="flex flex-col justify-center items-center py-24 space-y-4">
              <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
              <span className="text-gray-500 font-medium">
                Đang tải dữ liệu vận hành kho...
              </span>
            </div>
          ) : error ? (
            <div className="text-center py-16">
              <AlertTriangle className="w-10 h-10 text-red-500 mx-auto mb-3" />
              <p className="text-red-600 font-medium mb-4">{error}</p>
              <button
                onClick={() => fetchInventory()}
                className="px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-xl font-medium hover:bg-gray-200 transition-colors"
              >
                Thử lại
              </button>
            </div>
          ) : groupedRows.length === 0 ? (
            <div className="text-center py-20 flex flex-col items-center">
              <Inbox className="w-16 h-16 text-gray-300 dark:text-gray-600 mb-4" />
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                Không tìm thấy dữ liệu
              </h3>
              <p className="text-gray-500 mt-1 mb-6 text-sm">
                {searchInput || quickFilter !== "all"
                  ? "Không có sản phẩm nào khớp với bộ lọc hiện tại."
                  : "Hệ thống chưa có dữ liệu tồn kho."}
              </p>
              {(searchInput || quickFilter !== "all") && (
                <button
                  onClick={() => {
                    setSearchInput("");
                    setQuickFilter("all");
                  }}
                  className="px-5 py-2.5 bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 rounded-xl font-bold hover:bg-blue-100 transition-colors"
                >
                  Xóa bộ lọc
                </button>
              )}
            </div>
          ) : (
            <table className="min-w-full text-left table-fixed">
              <thead className="bg-gray-50/80 dark:bg-gray-800/80 border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="px-5 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider w-[35%]">
                    Sản phẩm / Biến thể
                  </th>
                  <th className="px-4 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider w-[15%]">
                    Chi nhánh
                  </th>
                  <th className="px-4 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider w-[10%]">
                    Giá trị
                  </th>
                  <th className="px-4 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider w-[12%]">
                    Thực tế (Qty)
                  </th>
                  <th className="px-4 py-4 text-right text-xs font-bold text-purple-500 uppercase tracking-wider w-[10%]">
                    Tạm giữ
                  </th>
                  <th className="px-4 py-4 text-right text-xs font-bold text-emerald-500 uppercase tracking-wider w-[10%]">
                    Khả dụng
                  </th>
                  <th className="px-5 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider w-[150px]">
                    Thao tác
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100 dark:divide-gray-800 bg-white dark:bg-gray-900">
                {groupedRows.map((group) => {
                  const expanded = isExpanded(group.productId);
                  const groupStatus = getStockStatus(
                    group.totalAvailableQuantity,
                  );

                  return (
                    <React.Fragment key={`group-${group.productId}`}>
                      {/* --- PRODUCT GROUP HEADER ROW --- */}
                      <tr
                        onClick={() => toggleProduct(group.productId)}
                        className="group bg-slate-50/40 hover:bg-slate-100/60 dark:bg-slate-800/20 dark:hover:bg-slate-800/40 cursor-pointer transition-colors border-t-2 border-gray-100 dark:border-gray-800"
                      >
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <button className="shrink-0 text-gray-400 group-hover:text-blue-500 transition-colors">
                              {expanded ? (
                                <ChevronDown className="w-5 h-5" />
                              ) : (
                                <ChevronRight className="w-5 h-5" />
                              )}
                            </button>
                            <img
                              src={
                                group.productThumbnail ||
                                "https://via.placeholder.com/48"
                              }
                              alt={group.productTitle}
                              className="w-12 h-12 rounded-lg object-cover border border-gray-200 dark:border-gray-700 shadow-sm"
                            />
                            <div className="min-w-0">
                              <div
                                className="font-bold text-gray-900 dark:text-white truncate"
                                title={group.productTitle}
                              >
                                {group.productTitle}
                              </div>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-xs font-medium text-gray-500 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-md">
                                  ID: {group.productId}
                                </span>
                                <span className="text-xs font-medium text-gray-500 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-md">
                                  {group.variantCount} biến thể
                                </span>
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                          {selectedBranchId === "all"
                            ? "Nhiều chi nhánh"
                            : currentBranchLabel}
                        </td>
                        <td className="px-4 py-4 text-sm text-gray-400 text-right">
                          —
                        </td>
                        <td className="px-4 py-4 font-bold text-gray-900 dark:text-white text-right text-lg">
                          {group.totalQuantity}
                        </td>
                        <td className="px-4 py-4 font-bold text-purple-600 dark:text-purple-400 text-right">
                          {group.totalReservedQuantity}
                        </td>
                        <td className="px-4 py-4 text-right">
                          <div className="flex flex-col items-end">
                            <span className="font-bold text-lg text-gray-900 dark:text-white leading-none">
                              {group.totalAvailableQuantity}
                            </span>
                            <span
                              className={`mt-1 text-[10px] font-bold px-1.5 py-0.5 rounded border ${groupStatus.color}`}
                            >
                              {groupStatus.label}
                            </span>
                          </div>
                        </td>
                        <td className="px-5 py-4"></td>
                      </tr>

                      {/* --- VARIANT ROWS --- */}
                      {expanded &&
                        group.rows.map((row) => {
                          const key = makeKey(row);
                          const draftValue = draftMap[key];
                          const isDraftChanged =
                            draftValue !== undefined &&
                            draftValue !== row.quantity;
                          const currentDisplayValue =
                            draftValue !== undefined
                              ? draftValue
                              : row.quantity;

                          // Tính toán khả dụng nháp để render màu sắc real-time
                          const tempAvailable = Math.max(
                            0,
                            currentDisplayValue - row.reservedQuantity,
                          );
                          const varStatus = getStockStatus(tempAvailable);

                          return (
                            <tr
                              key={key}
                              className={`hover:bg-blue-50/30 dark:hover:bg-blue-900/10 transition-colors relative group/row ${
                                isDraftChanged
                                  ? "bg-amber-50/20 dark:bg-amber-900/10"
                                  : ""
                              }`}
                            >
                              <td className="px-5 py-3 pl-[4.5rem] relative">
                                {/* Tree structure lines */}
                                <div className="absolute left-[2.25rem] top-0 bottom-0 w-[2px] bg-gray-100 dark:bg-gray-800 group-last/row:bottom-1/2"></div>
                                <div className="absolute left-[2.25rem] top-1/2 w-6 h-[2px] bg-gray-100 dark:bg-gray-800"></div>

                                <div className="min-w-0">
                                  <div
                                    className="font-semibold text-sm text-gray-800 dark:text-gray-200 truncate"
                                    title={row.variantTitle || "Mặc định"}
                                  >
                                    {row.variantTitle || "Mặc định"}
                                  </div>
                                  <div className="text-xs font-mono text-gray-500 mt-0.5">
                                    {row.variantSku || "Chưa có SKU"}
                                  </div>
                                </div>
                              </td>

                              <td className="px-4 py-3">
                                <div className="font-medium text-sm text-gray-800 dark:text-gray-200 truncate">
                                  {row.branchName}
                                </div>
                                <div className="text-[11px] text-gray-500 uppercase tracking-wider mt-0.5">
                                  {row.branchCode || "NO-CODE"}
                                </div>
                              </td>

                              <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400 text-right font-medium">
                                {formatCurrency(row.variantPrice)}
                              </td>

                              <td className="px-4 py-3 text-right">
                                <div className="flex items-center justify-end gap-1 relative">
                                  <input
                                    type="number"
                                    min={0}
                                    value={
                                      currentDisplayValue === 0
                                        ? "0"
                                        : currentDisplayValue || ""
                                    }
                                    onChange={(e) =>
                                      handleChangeDraft(row, e.target.value)
                                    }
                                    className={`w-20 font-mono font-bold text-right rounded-lg py-1.5 px-2 outline-none transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none focus:ring-2 focus:ring-blue-500 ${
                                      isDraftChanged
                                        ? "bg-amber-100 border-amber-300 text-amber-900 dark:bg-amber-900/40 dark:border-amber-700 dark:text-amber-100 shadow-inner"
                                        : "bg-gray-100 border-transparent text-gray-900 dark:bg-gray-800 dark:text-white border border-gray-200 dark:border-gray-700"
                                    }`}
                                  />
                                </div>
                              </td>

                              <td className="px-4 py-3 text-sm font-bold text-purple-600 dark:text-purple-400 text-right">
                                {row.reservedQuantity > 0
                                  ? row.reservedQuantity
                                  : "-"}
                              </td>

                              <td className="px-4 py-3 text-right">
                                <div className="flex items-center justify-end gap-2">
                                  <span
                                    className={`text-sm font-black ${varStatus.color.split(" ")[0]}`}
                                  >
                                    {tempAvailable}
                                  </span>
                                </div>
                              </td>

                              <td className="px-5 py-3 w-[150px]">
                                <div className="flex items-center justify-end gap-1.5">
                                  {isDraftChanged ? (
                                    <>
                                      <button
                                        onClick={() => handleResetDraft(row)}
                                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                        title="Hủy thay đổi"
                                      >
                                        <Undo2 className="w-4 h-4" />
                                      </button>
                                      <button
                                        onClick={() => handleSave(row)}
                                        disabled={!!savingMap[key]}
                                        className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-blue-600 rounded-lg hover:bg-blue-700 shadow-sm transition-colors disabled:opacity-50 w-20"
                                      >
                                        {savingMap[key] ? (
                                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                        ) : (
                                          <Save className="w-3.5 h-3.5" />
                                        )}
                                        Lưu
                                      </button>
                                    </>
                                  ) : (
                                    <button
                                      onClick={() => {
                                        setTransferModal(row);
                                        setTransferQty("");
                                        setTargetBranchId("");
                                      }}
                                      className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-bold text-purple-700 bg-purple-50 border border-purple-200 rounded-lg hover:bg-purple-100 dark:text-purple-300 dark:bg-purple-900/30 dark:border-purple-800 dark:hover:bg-purple-900/50 transition-colors w-full"
                                    >
                                      <ArrowRightLeft className="w-3.5 h-3.5" />
                                      Chuyển kho
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </Card>

      {/* TẦNG 5: TRANSFER MODAL REDESIGNED */}
      {transferModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
            onClick={() => setTransferModal(null)}
          />

          <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50/50 dark:bg-gray-800/50">
              <h2 className="text-lg font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
                <ArrowRightLeft className="w-5 h-5 text-purple-500" />
                Điều chuyển Tồn kho
              </h2>
              <button
                onClick={() => setTransferModal(null)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Product Info Card */}
              <div className="flex gap-3 items-start p-3 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-100 dark:border-gray-700">
                <img
                  src={
                    transferModal.productThumbnail ||
                    "https://via.placeholder.com/48"
                  }
                  alt="thumb"
                  className="w-12 h-12 rounded-lg object-cover border border-gray-200 dark:border-gray-600"
                />
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-gray-900 dark:text-white truncate">
                    {transferModal.productTitle}
                  </p>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400 truncate">
                    {transferModal.variantTitle || "Mặc định"}
                  </p>
                </div>
              </div>

              {/* Transfer Flow Viz */}
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                    Từ chi nhánh
                  </label>
                  <div className="px-3 py-2 bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm font-semibold text-gray-700 dark:text-gray-300">
                    {transferModal.branchName}
                    <div className="text-xs font-normal text-gray-500 mt-0.5">
                      Tồn khả dụng:{" "}
                      <span className="font-bold text-emerald-600">
                        {transferModal.availableQuantity}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-5 shrink-0 text-gray-300 dark:text-gray-600">
                  <ArrowRightLeft className="w-6 h-6" />
                </div>

                <div className="flex-1">
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                    Đến chi nhánh
                  </label>
                  <select
                    value={targetBranchId}
                    onChange={(e) =>
                      setTargetBranchId(
                        e.target.value === "" ? "" : Number(e.target.value),
                      )
                    }
                    className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-purple-300 dark:border-purple-700/50 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 rounded-lg text-sm font-semibold text-gray-900 dark:text-white outline-none transition-shadow"
                  >
                    <option value="" disabled>
                      Chọn đích đến...
                    </option>
                    {branches
                      .filter(
                        (b: any) => Number(b.id) !== transferModal.branchId,
                      )
                      .map((b: any) => (
                        <option key={b.id} value={b.id}>
                          {b.name}
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              {/* Quantity Input */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                  Số lượng điều chuyển
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={transferQty}
                    onChange={(e) =>
                      setTransferQty(
                        e.target.value === "" ? "" : Number(e.target.value),
                      )
                    }
                    className="w-full pl-4 pr-16 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 rounded-xl text-lg font-bold text-gray-900 dark:text-white outline-none transition-all"
                    placeholder="0"
                    min={1}
                    max={transferModal.availableQuantity}
                  />
                  <button
                    onClick={() =>
                      setTransferQty(transferModal.availableQuantity)
                    }
                    className="absolute right-2 top-2 bottom-2 px-2 text-xs font-bold text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/30 rounded-lg transition-colors"
                  >
                    TỐI ĐA
                  </button>
                </div>
                {typeof transferQty === "number" &&
                  transferQty > transferModal.availableQuantity && (
                    <p className="mt-1.5 text-xs font-medium text-red-500 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" /> Không được vượt
                      quá tồn khả dụng
                    </p>
                  )}
              </div>
            </div>

            <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800/80 border-t border-gray-100 dark:border-gray-700 flex justify-end gap-3">
              <button
                className="px-5 py-2.5 text-sm font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl transition-colors"
                onClick={() => setTransferModal(null)}
              >
                Hủy bỏ
              </button>
              <button
                className="px-5 py-2.5 text-sm font-bold bg-purple-600 hover:bg-purple-700 text-white rounded-xl shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                disabled={
                  !targetBranchId ||
                  !transferQty ||
                  transferQty <= 0 ||
                  transferQty > transferModal.availableQuantity
                }
                onClick={async () => {
                  try {
                    await http("POST", "/api/v1/admin/inventory/transfer", {
                      sourceBranchId: transferModal.branchId,
                      targetBranchId,
                      productVariantId: transferModal.variantId,
                      quantity: transferQty,
                    });

                    showSuccessToast({
                      message: "Điều chuyển tồn kho thành công",
                    });
                    setTransferModal(null);
                    fetchInventory(); // Refresh data sau transfer
                  } catch (e: any) {
                    showErrorToast(
                      e.message || "Đã xảy ra lỗi khi điều chuyển",
                    );
                  }
                }}
              >
                Xác nhận chuyển
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryPage;
