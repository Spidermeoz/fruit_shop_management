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
} from "lucide-react";
import { http } from "../../../services/http";
import { useAdminToast } from "../../../context/AdminToastContext";
import { useAuth } from "../../../context/AuthContextAdmin";
import type { InventoryListItem } from "../../../types/inventory";

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

const InventoryPage: React.FC = () => {
  const { showSuccessToast, showErrorToast } = useAdminToast();
  const { branches, currentBranchId } = useAuth();

  const [rows, setRows] = useState<InventoryListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [savingMap, setSavingMap] = useState<Record<string, boolean>>({});
  const [error, setError] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [selectedBranchId, setSelectedBranchId] = useState<number | "all">(
    currentBranchId ?? "all",
  );
  const [draftMap, setDraftMap] = useState<Record<string, number>>({});
  const [expandedGroups, setExpandedGroups] = useState<Record<number, boolean>>(
    {},
  );

  const [transferModal, setTransferModal] = useState<InventoryListItem | null>(
    null,
  );
  const [transferQty, setTransferQty] = useState(0);
  const [targetBranchId, setTargetBranchId] = useState<number | null>(null);

  const makeKey = (row: InventoryListItem) =>
    `${row.branchId}-${row.variantId}`;

  const toggleProduct = (productId: number) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [productId]: !prev[productId],
    }));
  };

  const isExpanded = (productId: number) => !!expandedGroups[productId];

  const fetchInventory = async () => {
    try {
      setLoading(true);
      setError("");

      let url = "/api/v1/admin/inventory";
      const params = new URLSearchParams();

      if (selectedBranchId !== "all") {
        params.set("branchId", String(selectedBranchId));
      }
      if (searchInput.trim()) {
        params.set("q", searchInput.trim());
      }

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

  const visibleRows = useMemo(() => rows, [rows]);

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

  useEffect(() => {
    if (groupedRows.length === 0) return;
    if (searchInput.trim()) {
      const allExpanded = groupedRows.reduce(
        (acc, g) => {
          acc[g.productId] = true;
          return acc;
        },
        {} as Record<number, boolean>,
      );
      setExpandedGroups(allExpanded);
    } else if (Object.keys(expandedGroups).length === 0) {
      setExpandedGroups({ [groupedRows[0].productId]: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupedRows, searchInput]);

  const handleChangeDraft = (row: InventoryListItem, value: string) => {
    const key = makeKey(row);
    const next = Number(value);
    setDraftMap((prev) => ({
      ...prev,
      [key]: Number.isFinite(next) ? Math.max(0, next) : 0,
    }));
  };

  const handleSave = async (row: InventoryListItem) => {
    const key = makeKey(row);
    const quantity =
      draftMap[key] !== undefined
        ? Number(draftMap[key])
        : Number(row.quantity);

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
                  quantity - Number(item.reservedQuantity ?? 0),
                ),
              }
            : item,
        ),
      );
    } catch (err: any) {
      console.error(err);
      showErrorToast(err?.message || "Không thể cập nhật tồn kho");
    } finally {
      setSavingMap((prev) => ({ ...prev, [key]: false }));
    }
  };

  const currentBranchLabel =
    selectedBranchId === "all"
      ? "Nhiều chi nhánh"
      : branches.find((b: any) => Number(b.id) === Number(selectedBranchId))
          ?.name || `Chi nhánh #${selectedBranchId}`;

  return (
    <div>
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
            Inventory
          </h1>
          <div className="mt-2 inline-flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <GitBranch className="w-4 h-4" />
            <span>
              {selectedBranchId === "all"
                ? "Tất cả chi nhánh"
                : currentBranchLabel}
            </span>
          </div>
        </div>

        <div className="w-full xl:w-auto flex flex-col sm:flex-row gap-3">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm theo sản phẩm / SKU..."
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
              className="px-3 py-2 border dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
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
      </div>

      <Card>
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-gray-500" />
              <span className="ml-2 text-gray-600 dark:text-gray-400">
                Loading inventory...
              </span>
            </div>
          ) : error ? (
            <p className="text-center text-red-500 py-6">{error}</p>
          ) : groupedRows.length === 0 ? (
            <p className="text-center text-gray-500 py-6">
              Không có dữ liệu tồn kho.
            </p>
          ) : (
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">
                    Product
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">
                    Variant
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">
                    Branch
                  </th>
                  {/* Các cột số liệu được căn phải */}
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">
                    Price
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">
                    Quantity
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">
                    Reserved
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">
                    Available
                  </th>
                  {/* Cột Thao tác cố định độ rộng để chống nhảy layout */}
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase w-[220px]">
                    Thao tác
                  </th>
                </tr>
              </thead>

              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                {groupedRows.map((group) => {
                  const expanded = isExpanded(group.productId);

                  return (
                    <React.Fragment key={`group-${group.productId}`}>
                      {/* HÀNG SẢN PHẨM CHA */}
                      <tr
                        onClick={() => toggleProduct(group.productId)}
                        className="bg-gray-50/80 dark:bg-gray-800/60 hover:bg-gray-100 dark:hover:bg-gray-700/80 cursor-pointer transition-colors"
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <button className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 focus:outline-none transition-colors">
                              {expanded ? (
                                <ChevronDown className="w-5 h-5" />
                              ) : (
                                <ChevronRight className="w-5 h-5" />
                              )}
                            </button>
                            <img
                              src={
                                group.productThumbnail ||
                                "https://via.placeholder.com/40"
                              }
                              alt={group.productTitle}
                              className="w-10 h-10 rounded-md object-cover border border-gray-200 dark:border-gray-600 shadow-sm"
                            />
                            <div>
                              <div className="font-bold text-gray-900 dark:text-white leading-tight">
                                {group.productTitle}
                              </div>
                              <div className="text-xs font-medium text-gray-400 mt-0.5">
                                ID: #{group.productId}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm font-medium text-gray-600 dark:text-gray-400">
                          {group.variantCount} variants
                        </td>
                        <td className="px-4 py-3 text-sm font-medium text-gray-600 dark:text-gray-400">
                          {selectedBranchId === "all"
                            ? "Nhiều chi nhánh"
                            : currentBranchLabel}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-400 text-right">
                          —
                        </td>
                        <td className="px-4 py-3 font-bold text-gray-900 dark:text-white text-right">
                          {group.totalQuantity}
                        </td>
                        <td className="px-4 py-3 font-bold text-gray-900 dark:text-white text-right">
                          {group.totalReservedQuantity}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span
                            className={`font-bold ${
                              group.totalAvailableQuantity <= 0
                                ? "text-red-600"
                                : group.totalAvailableQuantity < 10
                                  ? "text-yellow-600"
                                  : "text-green-600"
                            }`}
                          >
                            {group.totalAvailableQuantity}
                          </span>
                        </td>
                        <td className="px-4 py-3 w-[220px]"></td>
                      </tr>

                      {/* CÁC HÀNG BIẾN THỂ CON */}
                      {expanded &&
                        group.rows.map((row) => {
                          const key = makeKey(row);
                          const draft =
                            draftMap[key] !== undefined
                              ? draftMap[key]
                              : row.quantity;

                          return (
                            <tr
                              key={key}
                              className="hover:bg-gray-50/50 dark:hover:bg-gray-800/40 relative group"
                            >
                              <td className="px-4 py-3 pl-14 relative">
                                {/* Đường kẻ (Tree-line) tinh tế */}
                                <div className="absolute left-7 top-0 bottom-0 w-[1.5px] bg-gray-200 dark:bg-gray-700 group-last:bottom-1/2"></div>
                                <div className="absolute left-7 top-1/2 w-4 h-[1.5px] bg-gray-200 dark:bg-gray-700"></div>
                              </td>

                              <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                                <div className="font-medium text-gray-800 dark:text-gray-200">
                                  {row.variantTitle || "Mặc định"}
                                </div>
                                <div className="text-xs text-gray-500 mt-0.5">
                                  {row.variantSku || "—"}
                                </div>
                              </td>

                              <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                                <div className="font-medium">
                                  {row.branchName}
                                </div>
                                <div className="text-xs text-gray-500 mt-0.5">
                                  {row.branchCode || "—"}
                                </div>
                              </td>

                              <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300 text-right font-medium">
                                {Number(row.variantPrice).toLocaleString()}₫
                              </td>

                              <td className="px-4 py-3 text-right">
                                <input
                                  type="number"
                                  min={0}
                                  value={draft}
                                  onChange={(e) =>
                                    handleChangeDraft(row, e.target.value)
                                  }
                                  // Ẩn mũi tên spinner mặc định và làm cho input tinh gọn hơn
                                  className="w-20 border border-gray-300 dark:border-gray-600 rounded-md py-1 px-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-right focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                />
                              </td>

                              <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300 text-right">
                                {row.reservedQuantity}
                              </td>

                              <td className="px-4 py-3 text-right">
                                <span
                                  className={`text-sm font-semibold ${
                                    row.availableQuantity <= 0
                                      ? "text-red-600"
                                      : row.availableQuantity < 10
                                        ? "text-yellow-600"
                                        : "text-green-600"
                                  }`}
                                >
                                  {row.availableQuantity}
                                </span>
                              </td>

                              <td className="px-4 py-3 w-[220px]">
                                <div className="flex items-center justify-end gap-2 whitespace-nowrap">
                                  <button
                                    onClick={() => handleSave(row)}
                                    disabled={!!savingMap[key]}
                                    // Chuyển sang phong cách Soft Button (Xanh lam nhạt)
                                    className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-sm font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 dark:text-blue-400 dark:bg-blue-900/30 dark:border-blue-800 dark:hover:bg-blue-900/50 transition-colors disabled:opacity-50"
                                  >
                                    {savingMap[key] ? (
                                      <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                      <Save className="w-4 h-4" />
                                    )}
                                    Lưu
                                  </button>

                                  <button
                                    onClick={() => {
                                      setTransferModal(row);
                                      setTransferQty(0);
                                      setTargetBranchId(null);
                                    }}
                                    // Chuyển sang phong cách Soft Button (Tím nhạt)
                                    className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-sm font-medium text-purple-700 bg-purple-50 border border-purple-200 rounded-md hover:bg-purple-100 dark:text-purple-400 dark:bg-purple-900/30 dark:border-purple-800 dark:hover:bg-purple-900/50 transition-colors"
                                  >
                                    <ArrowRightLeft className="w-4 h-4" />
                                    Điều chuyển
                                  </button>
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

      {/* Modal Transfer giữ nguyên logic */}
      {transferModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg w-[400px] shadow-xl">
            <h2 className="text-lg font-bold mb-4 text-gray-900 dark:text-white">
              Điều chuyển tồn kho (Transfer)
            </h2>
            <p className="mb-2 font-medium text-gray-800 dark:text-gray-200">
              {transferModal.productTitle}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              {transferModal.variantTitle}
            </p>

            <select
              value={targetBranchId ?? ""}
              onChange={(e) => setTargetBranchId(Number(e.target.value))}
              className="w-full mb-3 border border-gray-300 dark:border-gray-600 p-2 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Chọn chi nhánh đích</option>
              {branches
                .filter((b: any) => Number(b.id) !== transferModal.branchId)
                .map((b: any) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
            </select>

            <input
              type="number"
              value={transferQty}
              onChange={(e) => setTransferQty(Number(e.target.value))}
              className="w-full border border-gray-300 dark:border-gray-600 p-2 mb-4 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Số lượng"
              min={0}
            />

            <div className="flex justify-end gap-3 mt-2">
              <button
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                onClick={() => setTransferModal(null)}
              >
                Hủy bỏ
              </button>
              <button
                className="px-4 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
                onClick={async () => {
                  try {
                    if (!targetBranchId) {
                      throw new Error("Vui lòng chọn chi nhánh đích");
                    }
                    if (transferQty <= 0) {
                      throw new Error("Số lượng phải lớn hơn 0");
                    }

                    await http("POST", "/api/v1/admin/inventory/transfer", {
                      sourceBranchId: transferModal.branchId,
                      targetBranchId,
                      productVariantId: transferModal.variantId,
                      quantity: transferQty,
                    });

                    showSuccessToast({ message: "Điều chuyển thành công" });
                    setTransferModal(null);
                    fetchInventory();
                  } catch (e: any) {
                    showErrorToast(
                      e.message || "Đã xảy ra lỗi khi điều chuyển",
                    );
                  }
                }}
              >
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryPage;
