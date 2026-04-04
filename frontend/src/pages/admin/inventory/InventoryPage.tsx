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
  RefreshCw,
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
        "text-red-700 bg-red-100 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800",
    };
  if (available <= 10)
    return {
      label: "Sắp hết",
      color:
        "text-amber-700 bg-amber-100 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800",
    };
  return {
    label: "Ổn định",
    color:
      "text-emerald-700 bg-emerald-100 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800",
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

      showSuccessToast({ message: "Cập nhật tồn kho thành công!" });
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
      {/* 🔹 TẦNG A: HEADER WORKSPACE */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
              Bảng Điều hành Tồn kho
            </h1>
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 rounded text-xs font-semibold border border-blue-100 dark:border-blue-800">
              <GitBranch className="w-3.5 h-3.5" /> {currentBranchLabel}
            </span>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Quản lý tồn kho chi tiết theo sản phẩm, biến thể và chi nhánh.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <button
            onClick={() => fetchInventory(true)}
            className="p-2.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition shadow-sm"
            title="Làm mới dữ liệu"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* 🔹 TẦNG B: KPI SUMMARY CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        {[
          {
            label: "Sản phẩm",
            value: kpiData.totalProducts,
            icon: Package,
            color: "text-indigo-600",
            bg: "bg-indigo-50",
          },
          {
            label: "Biến thể",
            value: kpiData.totalVariants,
            icon: Layers,
            color: "text-blue-600",
            bg: "bg-blue-50",
          },
          {
            label: "Tồn khả dụng",
            value: kpiData.available,
            icon: CheckCircle2,
            color: "text-emerald-600",
            bg: "bg-emerald-50",
          },
          {
            label: "Đang tạm giữ",
            value: kpiData.reserved,
            icon: GitBranch,
            color: "text-purple-600",
            bg: "bg-purple-50",
          },
          {
            label: "Sắp hết (≤10)",
            value: kpiData.lowCount,
            icon: AlertTriangle,
            color: "text-amber-600",
            bg: "bg-amber-50",
            isWarning: kpiData.lowCount > 0,
          },
          {
            label: "Hết hàng",
            value: kpiData.outCount,
            icon: AlertCircle,
            color: "text-red-600",
            bg: "bg-red-50",
            isWarning: kpiData.outCount > 0,
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
              className={`text-xl font-black truncate ${
                kpi.isWarning
                  ? kpi.label === "Hết hàng"
                    ? "text-red-600 dark:text-red-400"
                    : "text-amber-600 dark:text-amber-400"
                  : "text-gray-900 dark:text-white"
              }`}
            >
              {kpi.value}
            </div>
          </div>
        ))}
      </div>

      {/* 🔹 TẦNG C: CONTROL BAR */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col lg:flex-row gap-4 items-center justify-between sticky top-4 z-20">
        <div className="flex flex-col md:flex-row gap-4 w-full lg:w-auto flex-1">
          {/* Search */}
          <div className="relative w-full md:w-80">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Tìm theo sản phẩm / SKU..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="block w-full pl-9 pr-8 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
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
              className="block w-full md:w-48 px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors cursor-pointer"
            >
              <option value="all">Tất cả chi nhánh</option>
              {branches.map((branch: any) => (
                <option key={branch.id} value={branch.id}>
                  {branch.name}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Quick Filters */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 lg:pb-0 w-full lg:w-auto">
          {[
            { id: "all", label: "Tất cả" },
            { id: "low", label: "Sắp hết" },
            { id: "out", label: "Hết hàng" },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setQuickFilter(f.id as QuickFilter)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors shrink-0 ${
                quickFilter === f.id
                  ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                  : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:border-gray-300"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* 🔹 TẦNG D: INVENTORY BOARD MAIN AREA */}
      <Card className="!p-0 overflow-hidden border border-gray-200 dark:border-gray-700 shadow-sm rounded-xl mt-4">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left table-fixed divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 uppercase text-[11px] font-bold tracking-wider">
              <tr>
                <th className="px-5 py-4 w-[35%]">Sản phẩm / Biến thể</th>
                <th className="px-5 py-4 w-[15%]">Chi nhánh</th>
                <th className="px-5 py-4 text-right w-[10%]">Giá trị</th>
                <th className="px-5 py-4 text-right w-[12%]">Thực tế (Qty)</th>
                <th className="px-5 py-4 text-right w-[10%] text-purple-600 dark:text-purple-400">
                  Tạm giữ
                </th>
                <th className="px-5 py-4 text-right w-[10%] text-emerald-600 dark:text-emerald-400">
                  Khả dụng
                </th>
                <th className="px-5 py-4 text-center w-[150px]">Thao tác</th>
              </tr>
            </thead>

            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-100 dark:divide-gray-800">
              {loading && groupedRows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-24 text-center">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-3" />
                    <span className="text-gray-500 font-medium">
                      Đang tải dữ liệu vận hành kho...
                    </span>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={7} className="px-5 py-16 text-center">
                    <AlertTriangle className="w-10 h-10 text-red-500 mx-auto mb-3" />
                    <p className="text-red-600 font-medium mb-4">{error}</p>
                    <button
                      onClick={() => fetchInventory()}
                      className="px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                    >
                      Thử lại
                    </button>
                  </td>
                </tr>
              ) : groupedRows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-20 text-center">
                    <div className="flex flex-col items-center">
                      <Inbox className="w-12 h-12 text-gray-300 dark:text-gray-600 mb-4" />
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                        Không tìm thấy dữ liệu
                      </h3>
                      <p className="text-sm text-gray-500 mt-1 mb-5">
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
                          className="px-4 py-2 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition"
                        >
                          Xóa bộ lọc
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                groupedRows.map((group) => {
                  const expanded = isExpanded(group.productId);
                  const groupStatus = getStockStatus(
                    group.totalAvailableQuantity,
                  );

                  return (
                    <React.Fragment key={`group-${group.productId}`}>
                      {/* --- PRODUCT GROUP HEADER ROW --- */}
                      <tr
                        onClick={() => toggleProduct(group.productId)}
                        className="group bg-gray-50/50 hover:bg-gray-100 dark:bg-gray-800/40 dark:hover:bg-gray-800/70 cursor-pointer transition-colors border-t-4 border-gray-100 dark:border-gray-800"
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
                              className="w-10 h-10 rounded-lg object-cover border border-gray-200 dark:border-gray-700 shadow-sm"
                            />
                            <div className="min-w-0">
                              <div
                                className="font-bold text-gray-900 dark:text-white truncate text-sm"
                                title={group.productTitle}
                              >
                                {group.productTitle}
                              </div>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-[10px] font-bold text-gray-500 bg-gray-200 dark:bg-gray-700 px-1.5 py-0.5 rounded uppercase tracking-wider">
                                  ID: {group.productId}
                                </span>
                                <span className="text-[10px] font-bold text-blue-600 bg-blue-100 dark:bg-blue-900/40 dark:text-blue-400 px-1.5 py-0.5 rounded uppercase tracking-wider">
                                  {group.variantCount} biến thể
                                </span>
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                          {selectedBranchId === "all"
                            ? "Nhiều chi nhánh"
                            : currentBranchLabel}
                        </td>
                        <td className="px-5 py-4 text-sm text-gray-400 text-right">
                          —
                        </td>
                        <td className="px-5 py-4 font-bold text-gray-900 dark:text-white text-right text-base">
                          {group.totalQuantity}
                        </td>
                        <td className="px-5 py-4 font-bold text-purple-600 dark:text-purple-400 text-right text-base">
                          {group.totalReservedQuantity > 0
                            ? group.totalReservedQuantity
                            : "-"}
                        </td>
                        <td className="px-5 py-4 text-right">
                          <div className="flex flex-col items-end">
                            <span className="font-bold text-base text-gray-900 dark:text-white leading-none">
                              {group.totalAvailableQuantity}
                            </span>
                            <span
                              className={`mt-1 text-[10px] font-bold px-1.5 py-0.5 rounded border uppercase tracking-wider ${groupStatus.color}`}
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

                          const tempAvailable = Math.max(
                            0,
                            currentDisplayValue - row.reservedQuantity,
                          );
                          const varStatus = getStockStatus(tempAvailable);

                          return (
                            <tr
                              key={key}
                              className={`hover:bg-blue-50/40 dark:hover:bg-gray-800/60 transition-colors relative group/row ${
                                isDraftChanged
                                  ? "bg-amber-50/30 dark:bg-amber-900/10"
                                  : ""
                              }`}
                            >
                              <td className="px-5 py-4 pl-[4.5rem] relative">
                                {/* Tree structure lines */}
                                <div className="absolute left-[2.25rem] top-0 bottom-0 w-[2px] bg-gray-200 dark:bg-gray-700 group-last/row:bottom-1/2"></div>
                                <div className="absolute left-[2.25rem] top-1/2 w-6 h-[2px] bg-gray-200 dark:bg-gray-700"></div>

                                <div className="min-w-0">
                                  <div
                                    className="font-semibold text-sm text-gray-800 dark:text-gray-200 truncate"
                                    title={row.variantTitle || "Mặc định"}
                                  >
                                    {row.variantTitle || "Mặc định"}
                                  </div>
                                  <div className="text-[11px] font-mono font-medium text-gray-500 mt-0.5">
                                    {row.variantSku || "Chưa có SKU"}
                                  </div>
                                </div>
                              </td>

                              <td className="px-5 py-4">
                                <div className="font-medium text-sm text-gray-800 dark:text-gray-200 truncate">
                                  {row.branchName}
                                </div>
                                <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mt-0.5 bg-gray-100 dark:bg-gray-800 inline-block px-1.5 rounded">
                                  {row.branchCode || "NO-CODE"}
                                </div>
                              </td>

                              <td className="px-5 py-4 text-sm text-gray-600 dark:text-gray-400 text-right font-medium">
                                {formatCurrency(row.variantPrice)}
                              </td>

                              <td className="px-5 py-4 text-right">
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
                                    className={`w-20 font-mono font-bold text-right rounded-lg py-1.5 px-2 outline-none transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none focus:ring-2 focus:ring-blue-500 text-sm border ${
                                      isDraftChanged
                                        ? "bg-amber-50 border-amber-300 text-amber-900 dark:bg-amber-900/20 dark:border-amber-700/50 dark:text-amber-100"
                                        : "bg-gray-50 border-gray-200 text-gray-900 dark:bg-gray-900 dark:border-gray-700 dark:text-white"
                                    }`}
                                  />
                                </div>
                              </td>

                              <td className="px-5 py-4 text-sm font-bold text-purple-600 dark:text-purple-400 text-right">
                                {row.reservedQuantity > 0
                                  ? row.reservedQuantity
                                  : "-"}
                              </td>

                              <td className="px-5 py-4 text-right">
                                <div className="flex flex-col items-end">
                                  <span
                                    className={`text-base font-black ${
                                      varStatus.color.split(" ")[0]
                                    }`}
                                  >
                                    {tempAvailable}
                                  </span>
                                </div>
                              </td>

                              <td className="px-5 py-4 w-[150px]">
                                <div className="flex items-center justify-center gap-1.5">
                                  {isDraftChanged ? (
                                    <>
                                      <button
                                        onClick={() => handleResetDraft(row)}
                                        className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                                        title="Hủy thay đổi"
                                      >
                                        <Undo2 className="w-4 h-4" />
                                      </button>
                                      <button
                                        onClick={() => handleSave(row)}
                                        disabled={!!savingMap[key]}
                                        className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-blue-600 rounded-lg hover:bg-blue-700 shadow-sm transition-colors disabled:opacity-50 w-16"
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
                                      className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-purple-700 bg-purple-50 border border-purple-200 rounded-lg hover:bg-purple-100 dark:text-purple-300 dark:bg-purple-900/30 dark:border-purple-800 dark:hover:bg-purple-900/50 transition-colors w-full"
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
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* 🔹 TẦNG E: TRANSFER MODAL */}
      {transferModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-gray-900 shadow-2xl border border-gray-200 dark:border-gray-700 flex flex-col animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <ArrowRightLeft className="w-5 h-5 text-purple-500" />
                Điều chuyển Tồn kho
              </h3>
              <button
                onClick={() => setTransferModal(null)}
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Product Info Card */}
              <div className="flex gap-3 items-start p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700">
                <img
                  src={
                    transferModal.productThumbnail ||
                    "https://via.placeholder.com/48"
                  }
                  alt="thumb"
                  className="w-12 h-12 rounded-lg object-cover border border-gray-200 dark:border-gray-700"
                />
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-sm text-gray-900 dark:text-white truncate">
                    {transferModal.productTitle}
                  </p>
                  <p className="text-xs font-medium text-gray-600 dark:text-gray-400 truncate mt-0.5">
                    {transferModal.variantTitle || "Mặc định"}
                  </p>
                  <p className="text-[10px] font-mono text-gray-500 mt-0.5">
                    {transferModal.variantSku || "No SKU"}
                  </p>
                </div>
              </div>

              {/* Transfer Flow Viz */}
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                    Từ chi nhánh
                  </label>
                  <div className="px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-semibold text-gray-700 dark:text-gray-300 shadow-sm">
                    <span className="truncate block">
                      {transferModal.branchName}
                    </span>
                    <div className="text-xs font-normal text-gray-500 mt-1">
                      Tồn khả dụng:{" "}
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">
                        {transferModal.availableQuantity}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-5 shrink-0 text-gray-400 dark:text-gray-500">
                  <ArrowRightLeft className="w-5 h-5" />
                </div>

                <div className="flex-1">
                  <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                    Đến chi nhánh
                  </label>
                  <select
                    value={targetBranchId}
                    onChange={(e) =>
                      setTargetBranchId(
                        e.target.value === "" ? "" : Number(e.target.value),
                      )
                    }
                    className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-purple-300 dark:border-purple-700/50 focus:border-purple-500 focus:ring-2 focus:ring-purple-500 rounded-lg text-sm font-semibold text-gray-900 dark:text-white outline-none transition-shadow shadow-sm"
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
                <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">
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
                    className="w-full pl-4 pr-20 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 focus:border-purple-500 focus:ring-2 focus:ring-purple-500 rounded-lg text-base font-bold text-gray-900 dark:text-white outline-none transition-all shadow-sm"
                    placeholder="0"
                    min={1}
                    max={transferModal.availableQuantity}
                  />
                  <button
                    onClick={() =>
                      setTransferQty(transferModal.availableQuantity)
                    }
                    className="absolute right-2 top-2 bottom-2 px-2.5 text-[10px] font-bold text-purple-600 bg-purple-50 hover:bg-purple-100 dark:text-purple-400 dark:bg-purple-900/30 dark:hover:bg-purple-900/50 rounded-md transition-colors uppercase tracking-wider"
                  >
                    Tối đa
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

            <div className="flex justify-end gap-3 px-6 py-4 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-800 rounded-b-2xl">
              <button
                className="px-5 py-2.5 text-sm font-semibold text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700 shadow-sm rounded-lg transition-colors"
                onClick={() => setTransferModal(null)}
              >
                Hủy bỏ
              </button>
              <button
                className="px-5 py-2.5 text-sm font-bold bg-purple-600 hover:bg-purple-700 text-white rounded-lg shadow-sm transition-colors disabled:opacity-50 flex items-center gap-2"
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
                      message: "Điều chuyển tồn kho thành công!",
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
