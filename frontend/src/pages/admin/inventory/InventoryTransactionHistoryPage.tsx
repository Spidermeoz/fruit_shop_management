import React, { useEffect, useMemo, useState } from "react";
import Card from "../../../components/admin/layouts/Card";
import { Search, Loader2, History, GitBranch } from "lucide-react";
import { http } from "../../../services/http";
import { useAuth } from "../../../context/AuthContextAdmin";
import type { InventoryTransactionListItem } from "../../../types/inventory";

const transactionTypeLabel: Record<string, string> = {
  initial: "Khởi tạo",
  adjustment: "Điều chỉnh",
  manual_update: "Cập nhật tay",
  order_created: "Tạo đơn hàng",
  order_cancelled: "Hủy đơn hàng",
  transfer_out: "Chuyển ra",
  transfer_in: "Chuyển vào",
};

const transactionTypeClass = (type: string) => {
  switch (type) {
    case "transfer_in":
    case "initial":
      return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300";
    case "transfer_out":
      return "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300";
    case "manual_update":
    case "adjustment":
      return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300";
    case "order_created":
      return "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300";
    case "order_cancelled":
      return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300";
    default:
      return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300";
  }
};

const InventoryTransactionHistoryPage: React.FC = () => {
  const { branches, currentBranchId } = useAuth();

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

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      setError("");

      let url = "/api/v1/admin/inventory/transactions";
      const params = new URLSearchParams();

      if (selectedBranchId !== "all") {
        params.set("branchId", String(selectedBranchId));
      }

      if (searchInput.trim()) {
        params.set("q", searchInput.trim());
      }

      if (transactionType !== "all") {
        params.set("transactionType", transactionType);
      }

      if (dateFrom) {
        params.set("dateFrom", dateFrom);
      }

      if (dateTo) {
        params.set("dateTo", dateTo);
      }

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
  }, [selectedBranchId, transactionType, dateFrom, dateTo]);

  useEffect(() => {
    const t = setTimeout(() => {
      fetchTransactions();
    }, 400);

    return () => clearTimeout(t);
  }, [searchInput]);

  const visibleRows = useMemo(() => rows, [rows]);

  const currentBranchLabel =
    selectedBranchId === "all"
      ? "Tất cả chi nhánh"
      : branches.find((b: any) => Number(b.id) === Number(selectedBranchId))
          ?.name || `Chi nhánh #${selectedBranchId}`;

  return (
    <div>
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
            Inventory History
          </h1>
          <div className="mt-2 inline-flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <GitBranch className="w-4 h-4" />
            <span>{currentBranchLabel}</span>
          </div>
        </div>

        <div className="w-full xl:w-auto flex flex-col lg:flex-row gap-3">
          <div className="relative w-full lg:w-72">
            <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm sản phẩm / SKU..."
              className="w-full pl-10 pr-3 py-2 border dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </div>

          {branches.length > 1 && (
            <select
              value={selectedBranchId}
              onChange={(e) => {
                const value = e.target.value;
                setSelectedBranchId(value === "all" ? "all" : Number(value));
              }}
              className="px-3 py-2 border dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="all">Tất cả chi nhánh</option>
              {branches.map((branch: any) => (
                <option key={branch.id} value={branch.id}>
                  {branch.name}
                </option>
              ))}
            </select>
          )}

          <select
            value={transactionType}
            onChange={(e) => setTransactionType(e.target.value)}
            className="px-3 py-2 border dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
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

          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="px-3 py-2 border dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />

          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="px-3 py-2 border dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>
      </div>

      <Card>
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-gray-500" />
              <span className="ml-2 text-gray-600 dark:text-gray-400">
                Loading inventory history...
              </span>
            </div>
          ) : error ? (
            <p className="text-center text-red-500 py-6">{error}</p>
          ) : visibleRows.length === 0 ? (
            <div className="text-center text-gray-500 py-10">
              <History className="mx-auto h-8 w-8 mb-2 opacity-60" />
              Không có lịch sử giao dịch kho.
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">
                    Time
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">
                    Product
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">
                    Branch
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">
                    Type
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">
                    Delta
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">
                    Before
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">
                    After
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">
                    User
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">
                    Note
                  </th>
                </tr>
              </thead>

              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                {visibleRows.map((row) => (
                  <tr
                    key={row.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300 whitespace-nowrap">
                      {row.createdAt
                        ? new Date(row.createdAt).toLocaleString()
                        : "—"}
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={
                            row.productThumbnail ||
                            "https://via.placeholder.com/40"
                          }
                          alt={row.productTitle}
                          className="w-10 h-10 rounded object-cover"
                        />
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white">
                            {row.productTitle}
                          </div>
                          <div className="text-xs text-gray-400">
                            {row.variantTitle || "Variant mặc định"} •{" "}
                            {row.variantSku || "—"}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                      <div className="font-medium">{row.branchName}</div>
                      <div className="text-xs text-gray-400">
                        {row.branchCode || "—"}
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-1 text-xs rounded-full font-semibold ${transactionTypeClass(
                          row.transactionType,
                        )}`}
                      >
                        {transactionTypeLabel[row.transactionType] ||
                          row.transactionType}
                      </span>
                    </td>

                    <td className="px-4 py-3">
                      <span
                        className={`font-semibold ${
                          row.quantityDelta > 0
                            ? "text-green-600"
                            : row.quantityDelta < 0
                              ? "text-red-600"
                              : "text-gray-600 dark:text-gray-300"
                        }`}
                      >
                        {row.quantityDelta > 0 ? "+" : ""}
                        {row.quantityDelta}
                      </span>
                    </td>

                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                      {row.quantityBefore}
                    </td>

                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                      {row.quantityAfter}
                    </td>

                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                      {row.createdByName || "System"}
                    </td>

                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300 max-w-xs">
                      <div className="truncate" title={row.note || ""}>
                        {row.note || "—"}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </Card>
    </div>
  );
};

export default InventoryTransactionHistoryPage;
