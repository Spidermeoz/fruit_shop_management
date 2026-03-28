import React, { useEffect, useMemo, useState } from "react";
import Card from "../../../components/admin/layouts/Card";
import { Search, Loader2, Save, GitBranch } from "lucide-react";
import { http } from "../../../services/http";
import { useAdminToast } from "../../../context/AdminToastContext";
import { useAuth } from "../../../auth/AuthContext";
import type { InventoryListItem } from "../../../types/inventory";

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

  const makeKey = (row: InventoryListItem) =>
    `${row.branchId}-${row.variantId}`;

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
  }, [selectedBranchId]);

  useEffect(() => {
    const t = setTimeout(() => {
      fetchInventory();
    }, 400);

    return () => clearTimeout(t);
  }, [searchInput]);

  const visibleRows = useMemo(() => rows, [rows]);

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

      showSuccessToast({
        message: "Cập nhật tồn kho thành công",
      });

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
      ? "Tất cả chi nhánh"
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
            <span>{currentBranchLabel}</span>
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
          ) : visibleRows.length === 0 ? (
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
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">
                    Price
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">
                    Quantity
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">
                    Reserved
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">
                    Available
                  </th>
                  <th className="px-4 py-3 text-right"></th>
                </tr>
              </thead>

              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                {visibleRows.map((row) => {
                  const key = makeKey(row);
                  const draft =
                    draftMap[key] !== undefined ? draftMap[key] : row.quantity;

                  return (
                    <tr
                      key={key}
                      className="hover:bg-gray-50 dark:hover:bg-gray-800"
                    >
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
                              #{row.productId}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                        <div className="font-medium">
                          {row.variantTitle || "Variant mặc định"}
                        </div>
                        <div className="text-xs text-gray-400">
                          {row.variantSku || "—"}
                        </div>
                      </td>

                      <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                        <div className="font-medium">{row.branchName}</div>
                        <div className="text-xs text-gray-400">
                          {row.branchCode || "—"}
                        </div>
                      </td>

                      <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                        {Number(row.variantPrice).toLocaleString()}₫
                      </td>

                      <td className="px-4 py-3">
                        <input
                          type="number"
                          min={0}
                          value={draft}
                          onChange={(e) =>
                            handleChangeDraft(row, e.target.value)
                          }
                          className="w-24 border border-gray-300 dark:border-gray-600 rounded-md p-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        />
                      </td>

                      <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                        {row.reservedQuantity}
                      </td>

                      <td className="px-4 py-3">
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

                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => handleSave(row)}
                          disabled={!!savingMap[key]}
                          className="inline-flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                        >
                          {savingMap[key] ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Save className="w-4 h-4" />
                          )}
                          Lưu
                        </button>
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

export default InventoryPage;
