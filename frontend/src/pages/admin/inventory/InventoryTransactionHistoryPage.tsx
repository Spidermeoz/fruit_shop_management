import React, { useEffect, useMemo, useState } from "react";
import Card from "../../../components/admin/layouts/Card";
import {
  Search,
  Loader2,
  History,
  GitBranch,
  ArrowLeft,
  FilterX,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  Settings2,
  ArrowRightLeft,
  Calendar,
  AlertTriangle,
  FileText,
  User,
} from "lucide-react";
import { http } from "../../../services/http";
import { useAuth } from "../../../context/AuthContextAdmin";

// --- TYPES ---
export interface InventoryTransactionListItem {
  id: number;
  createdAt: string | null;
  branchId: number;
  branchName: string;
  branchCode: string | null;
  productId: number;
  productTitle: string;
  productThumbnail: string | null;
  variantId: number;
  variantTitle: string | null;
  variantSku: string | null;
  transactionType: string;
  quantityDelta: number;
  quantityBefore: number;
  quantityAfter: number;
  referenceType: string | null;
  referenceId: number | null;
  note: string | null;
  createdById: number | null;
  createdByName: string | null;
}

// --- HELPERS ---
const getTransactionTypeUI = (type: string) => {
  switch (type) {
    case "initial":
      return {
        label: "Khởi tạo",
        color:
          "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800",
      };
    case "transfer_in":
      return {
        label: "Chuyển vào",
        color:
          "bg-teal-100 text-teal-700 border-teal-200 dark:bg-teal-900/30 dark:text-teal-400 dark:border-teal-800",
      };
    case "transfer_out":
      return {
        label: "Chuyển ra",
        color:
          "bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800",
      };
    case "manual_update":
      return {
        label: "Cập nhật tay",
        color:
          "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800",
      };
    case "adjustment":
      return {
        label: "Điều chỉnh",
        color:
          "bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-400 dark:border-indigo-800",
      };
    case "order_created":
      return {
        label: "Tạo đơn hàng",
        color:
          "bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800",
      };
    case "order_cancelled":
      return {
        label: "Hủy đơn hàng",
        color:
          "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800",
      };
    default:
      return {
        label: type,
        color:
          "bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700",
      };
  }
};

const formatDateTime = (isoString: string | null) => {
  if (!isoString) return { date: "—", time: "" };
  const d = new Date(isoString);
  return {
    date: d.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }),
    time: d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }),
  };
};

const InventoryTransactionHistoryPage: React.FC = () => {
  const { branches, currentBranchId } = useAuth();

  // --- STATES ---
  const [rows, setRows] = useState<InventoryTransactionListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [searchInput, setSearchInput] = useState("");
  const [selectedBranchId, setSelectedBranchId] = useState<number | "all">(
    currentBranchId ?? "all",
  );
  const [transactionType, setTransactionType] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  // --- FETCH DATA ---
  const fetchTransactions = async () => {
    try {
      setLoading(true);
      setError("");

      let url = "/api/v1/admin/inventory/transactions";
      const params = new URLSearchParams();

      if (selectedBranchId !== "all")
        params.set("branchId", String(selectedBranchId));
      if (searchInput.trim()) params.set("q", searchInput.trim());
      if (transactionType !== "all")
        params.set("transactionType", transactionType);
      if (dateFrom) params.set("dateFrom", dateFrom);
      if (dateTo) params.set("dateTo", dateTo);

      const qs = params.toString();
      if (qs) url += `?${qs}`;

      const res = await http<any>("GET", url);

      if (res?.success && Array.isArray(res.data)) {
        setRows(
          res.data.map((item: any) => ({
            id: Number(item.id),
            createdAt: item.createdAt ?? null,
            branchId: Number(item.branchId),
            branchName: String(item.branchName ?? ""),
            branchCode: item.branchCode ?? null,
            productId: Number(item.productId),
            productTitle: String(item.productTitle ?? ""),
            productThumbnail: item.productThumbnail ?? null,
            variantId: Number(item.variantId),
            variantTitle: item.variantTitle ?? null,
            variantSku: item.variantSku ?? null,
            transactionType: item.transactionType,
            quantityDelta: Number(item.quantityDelta ?? 0),
            quantityBefore: Number(item.quantityBefore ?? 0),
            quantityAfter: Number(item.quantityAfter ?? 0),
            referenceType: item.referenceType ?? null,
            referenceId:
              item.referenceId !== undefined && item.referenceId !== null
                ? Number(item.referenceId)
                : null,
            note: item.note ?? null,
            createdById:
              item.createdById !== undefined && item.createdById !== null
                ? Number(item.createdById)
                : null,
            createdByName: item.createdByName ?? null,
          })),
        );
      } else {
        setRows([]);
      }
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Không thể tải lịch sử kho");
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedBranchId, transactionType, dateFrom, dateTo]);

  useEffect(() => {
    const t = setTimeout(() => {
      fetchTransactions();
    }, 400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput]);

  // --- DERIVED DATA ---
  const visibleRows = useMemo(() => rows, [rows]);

  const kpiData = useMemo(() => {
    let inbound = 0,
      outbound = 0,
      manual = 0,
      transfers = 0;
    visibleRows.forEach((r) => {
      if (r.quantityDelta > 0) inbound++;
      if (r.quantityDelta < 0) outbound++;
      if (
        r.transactionType === "manual_update" ||
        r.transactionType === "adjustment"
      )
        manual++;
      if (
        r.transactionType === "transfer_in" ||
        r.transactionType === "transfer_out"
      )
        transfers++;
    });
    return { total: visibleRows.length, inbound, outbound, manual, transfers };
  }, [visibleRows]);

  const currentBranchLabel =
    selectedBranchId === "all"
      ? "Tất cả chi nhánh"
      : branches.find((b: any) => Number(b.id) === Number(selectedBranchId))
          ?.name || `Chi nhánh #${selectedBranchId}`;

  const hasActiveFilters =
    searchInput ||
    selectedBranchId !== "all" ||
    transactionType !== "all" ||
    dateFrom ||
    dateTo;

  const handleResetFilters = () => {
    setSearchInput("");
    setSelectedBranchId(currentBranchId ?? "all");
    setTransactionType("all");
    setDateFrom("");
    setDateTo("");
  };

  return (
    <div className="w-full pb-10 space-y-6">
      {/* TẦNG 1: HEADER WORKSPACE */}
      <section className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
            Inventory Audit Board
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">
            Giám sát, kiểm toán lịch sử điều chỉnh và dịch chuyển tồn kho.
          </p>
          <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 text-blue-700 border border-blue-100 text-xs font-bold dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800">
            <GitBranch className="w-3.5 h-3.5" />
            {currentBranchLabel}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => window.history.back()}
            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 font-medium rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Về Inventory
          </button>
        </div>
      </section>

      {/* TẦNG 2: KPI SUMMARY CARDS */}
      <section className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="p-4 flex flex-col justify-center border-l-4 border-gray-500 dark:border-gray-400">
          <div className="flex items-center justify-between text-gray-600 dark:text-gray-400">
            <span className="text-xs font-bold uppercase tracking-wider">
              Tổng giao dịch
            </span>
            <History className="w-4 h-4" />
          </div>
          <p className="mt-2 text-2xl font-black text-gray-900 dark:text-white">
            {kpiData.total}
          </p>
        </Card>

        <Card className="p-4 flex flex-col justify-center border-l-4 border-emerald-500 bg-emerald-50/30 dark:bg-emerald-900/10">
          <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400">
            <span className="text-xs font-bold uppercase tracking-wider">
              Nhập / Tăng
            </span>
            <TrendingUp className="w-4 h-4" />
          </div>
          <p className="mt-2 text-2xl font-black text-emerald-600 dark:text-emerald-400">
            {kpiData.inbound}
          </p>
        </Card>

        <Card className="p-4 flex flex-col justify-center border-l-4 border-orange-500 bg-orange-50/30 dark:bg-orange-900/10">
          <div className="flex items-center justify-between text-orange-600 dark:text-orange-400">
            <span className="text-xs font-bold uppercase tracking-wider">
              Xuất / Giảm
            </span>
            <TrendingDown className="w-4 h-4" />
          </div>
          <p className="mt-2 text-2xl font-black text-orange-600 dark:text-orange-400">
            {kpiData.outbound}
          </p>
        </Card>

        <Card className="p-4 flex flex-col justify-center border-l-4 border-blue-500 bg-blue-50/30 dark:bg-blue-900/10">
          <div className="flex items-center justify-between text-blue-600 dark:text-blue-400">
            <span className="text-xs font-bold uppercase tracking-wider">
              Thao tác tay
            </span>
            <Settings2 className="w-4 h-4" />
          </div>
          <p className="mt-2 text-2xl font-black text-blue-600 dark:text-blue-400">
            {kpiData.manual}
          </p>
        </Card>

        <Card className="p-4 flex flex-col justify-center border-l-4 border-purple-500 bg-purple-50/30 dark:bg-purple-900/10">
          <div className="flex items-center justify-between text-purple-600 dark:text-purple-400">
            <span className="text-xs font-bold uppercase tracking-wider">
              Chuyển kho
            </span>
            <ArrowRightLeft className="w-4 h-4" />
          </div>
          <p className="mt-2 text-2xl font-black text-purple-600 dark:text-purple-400">
            {kpiData.transfers}
          </p>
        </Card>
      </section>

      {/* TẦNG 3: FILTER CONTROL BAR */}
      <section className="bg-white/90 dark:bg-gray-800/90 backdrop-blur p-4 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col xl:flex-row gap-4 items-start xl:items-center justify-between sticky top-0 z-10">
        <div className="flex flex-col lg:flex-row gap-3 w-full flex-wrap items-center">
          {/* Search */}
          <div className="relative w-full lg:w-72">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Tìm sản phẩm / SKU..."
              className="block w-full pl-10 pr-3 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </div>

          {/* Branch Filter */}
          {branches.length > 1 && (
            <select
              value={selectedBranchId}
              onChange={(e) =>
                setSelectedBranchId(
                  e.target.value === "all" ? "all" : Number(e.target.value),
                )
              }
              className="px-3 py-2.5 w-full lg:w-48 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="all">Tất cả chi nhánh</option>
              {branches.map((branch: any) => (
                <option key={branch.id} value={branch.id}>
                  {branch.name}
                </option>
              ))}
            </select>
          )}

          {/* Type Filter */}
          <select
            value={transactionType}
            onChange={(e) => setTransactionType(e.target.value)}
            className="px-3 py-2.5 w-full lg:w-48 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="all">Tất cả loại giao dịch</option>
            <option value="initial">Khởi tạo</option>
            <option value="adjustment">Điều chỉnh</option>
            <option value="manual_update">Cập nhật tay</option>
            <option value="order_created">Tạo đơn hàng</option>
            <option value="order_cancelled">Hủy đơn hàng</option>
            <option value="transfer_out">Chuyển ra</option>
            <option value="transfer_in">Chuyển vào</option>
          </select>

          {/* Date Range Block */}
          <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-1.5 w-full lg:w-auto">
            <Calendar className="w-4 h-4 text-gray-400 shrink-0" />
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="bg-transparent border-none text-sm text-gray-900 dark:text-white focus:ring-0 outline-none p-1"
              title="Từ ngày"
            />
            <span className="text-gray-400">→</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="bg-transparent border-none text-sm text-gray-900 dark:text-white focus:ring-0 outline-none p-1"
              title="Đến ngày"
            />
          </div>

          {/* Reset Filters */}
          {hasActiveFilters && (
            <button
              onClick={handleResetFilters}
              className="flex items-center gap-1.5 px-3 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors ml-auto"
            >
              <FilterX className="w-4 h-4" />
              Xóa lọc
            </button>
          )}
        </div>
      </section>

      {/* TẦNG 4 & 5: AUDIT FEED / TRANSACTION TABLE */}
      <Card className="overflow-hidden border border-gray-200 dark:border-gray-700 shadow-sm rounded-2xl">
        <div className="overflow-x-auto">
          {loading && visibleRows.length === 0 ? (
            <div className="flex flex-col justify-center items-center py-24 space-y-4">
              <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
              <span className="text-gray-500 font-medium">
                Đang tải lịch sử kiểm toán...
              </span>
            </div>
          ) : error ? (
            <div className="text-center py-16">
              <AlertTriangle className="w-10 h-10 text-red-500 mx-auto mb-3" />
              <p className="text-red-600 font-medium mb-4">{error}</p>
              <button
                onClick={() => fetchTransactions()}
                className="px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-xl font-medium hover:bg-gray-200 transition-colors"
              >
                Thử lại
              </button>
            </div>
          ) : visibleRows.length === 0 ? (
            <div className="text-center py-20 flex flex-col items-center">
              <History className="w-16 h-16 text-gray-300 dark:text-gray-600 mb-4" />
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                Không tìm thấy giao dịch
              </h3>
              <p className="text-gray-500 mt-1 mb-6 text-sm">
                {hasActiveFilters
                  ? "Không có giao dịch nào khớp với bộ lọc hiện tại."
                  : "Hệ thống chưa ghi nhận lịch sử giao dịch kho nào."}
              </p>
              {hasActiveFilters && (
                <button
                  onClick={handleResetFilters}
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
                  <th className="px-5 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider w-[12%]">
                    Thời gian
                  </th>
                  <th className="px-4 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider w-[22%]">
                    Sản phẩm / Biến thể
                  </th>
                  <th className="px-4 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider w-[12%]">
                    Chi nhánh
                  </th>
                  <th className="px-4 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider w-[14%]">
                    Loại giao dịch
                  </th>
                  <th className="px-4 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider w-[18%]">
                    Luồng biến động (Flow)
                  </th>
                  <th className="px-4 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider w-[10%]">
                    Thực hiện bởi
                  </th>
                  <th className="px-5 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider w-[12%]">
                    Ghi chú
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100 dark:divide-gray-800 bg-white dark:bg-gray-900">
                {visibleRows.map((row) => {
                  const { date, time } = formatDateTime(row.createdAt);
                  const typeUI = getTransactionTypeUI(row.transactionType);
                  const isPositive = row.quantityDelta > 0;
                  const isNegative = row.quantityDelta < 0;

                  return (
                    <tr
                      key={row.id}
                      className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors group"
                    >
                      {/* Cột: Thời gian */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="font-semibold text-gray-900 dark:text-gray-200">
                          {date}
                        </div>
                        <div className="text-xs text-gray-500 mt-0.5">
                          {time}
                        </div>
                      </td>

                      {/* Cột: Sản phẩm */}
                      <td className="px-4 py-4">
                        <div className="flex items-start gap-3">
                          <img
                            src={
                              row.productThumbnail ||
                              "https://via.placeholder.com/40"
                            }
                            alt={row.productTitle}
                            className="w-10 h-10 rounded-lg object-cover border border-gray-200 dark:border-gray-700 shrink-0 mt-0.5"
                          />
                          <div className="min-w-0">
                            <div
                              className="font-bold text-gray-900 dark:text-white truncate"
                              title={row.productTitle}
                            >
                              {row.productTitle}
                            </div>
                            <div className="text-xs font-medium text-gray-500 truncate mt-0.5">
                              {row.variantTitle || "Mặc định"}{" "}
                              <span className="mx-1">•</span>{" "}
                              <span className="font-mono">
                                {row.variantSku || "NO-SKU"}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Cột: Chi nhánh */}
                      <td className="px-4 py-4">
                        <div className="font-semibold text-sm text-gray-800 dark:text-gray-200 truncate">
                          {row.branchName}
                        </div>
                        <div className="text-[11px] text-gray-500 uppercase tracking-wider mt-0.5">
                          {row.branchCode || "—"}
                        </div>
                      </td>

                      {/* Cột: Loại giao dịch */}
                      <td className="px-4 py-4">
                        <span
                          className={`inline-flex px-2.5 py-1 text-xs font-bold rounded border ${typeUI.color}`}
                        >
                          {typeUI.label}
                        </span>
                        {row.referenceId && (
                          <div className="text-[10px] text-gray-400 font-mono mt-1.5 flex items-center gap-1">
                            <FileText className="w-3 h-3" />
                            Ref: #{row.referenceId}
                          </div>
                        )}
                      </td>

                      {/* Cột: Luồng biến động (Gộp Before - Delta - After) */}
                      <td className="px-4 py-4">
                        <div className="flex items-center justify-center gap-2 bg-gray-50 dark:bg-gray-800/50 rounded-lg py-2 px-3 border border-gray-100 dark:border-gray-700">
                          <span className="text-sm font-medium text-gray-500 w-8 text-right shrink-0">
                            {row.quantityBefore}
                          </span>

                          <ArrowRight className="w-3.5 h-3.5 text-gray-300 dark:text-gray-600 shrink-0" />

                          <span
                            className={`inline-flex justify-center items-center px-2 py-0.5 min-w-[2.5rem] rounded-md text-xs font-black ${
                              isPositive
                                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400"
                                : isNegative
                                  ? "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400"
                                  : "bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-400"
                            }`}
                          >
                            {isPositive ? "+" : ""}
                            {row.quantityDelta}
                          </span>

                          <ArrowRight className="w-3.5 h-3.5 text-gray-300 dark:text-gray-600 shrink-0" />

                          <span className="text-sm font-black text-gray-900 dark:text-white w-8 text-left shrink-0">
                            {row.quantityAfter}
                          </span>
                        </div>
                      </td>

                      {/* Cột: Thực hiện bởi */}
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-1.5">
                          {row.createdByName ? (
                            <>
                              <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                                <User className="w-3 h-3" />
                              </div>
                              <span className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">
                                {row.createdByName}
                              </span>
                            </>
                          ) : (
                            <>
                              <div className="w-5 h-5 rounded-full bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-400 flex items-center justify-center shrink-0">
                                <Settings2 className="w-3 h-3" />
                              </div>
                              <span className="text-sm font-medium text-gray-500 italic">
                                System
                              </span>
                            </>
                          )}
                        </div>
                      </td>

                      {/* Cột: Ghi chú */}
                      <td className="px-5 py-4">
                        <div
                          className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2"
                          title={row.note || "Không có ghi chú"}
                        >
                          {row.note || "—"}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </Card>
    </div>
  );
};

export default InventoryTransactionHistoryPage;
