import DashboardSectionCard from "./DashboardSectionCard";
import DashboardHealthPill from "../shared/DashboardHealthPill";
import DashboardNumber from "../shared/DashboardNumber";
import MiniStatList, { type MiniStatListItem } from "./MiniStatList";
import DashboardEmptyState from "../shared/DashboardEmptyState";

type InventoryHealthCardProps = {
  summary: {
    totalProducts: number;
    totalVariants: number;
    totalStockRows: number;
    totalQuantity: number;
    reservedQuantity: number;
    availableQuantity: number;
    lowStockCount: number;
    outOfStockCount: number;
  };
  className?: string;
};

const resolveInventoryStatus = (
  lowStockCount: number,
  outOfStockCount: number,
): "healthy" | "warning" | "critical" => {
  if (outOfStockCount > 0) return "critical";
  if (lowStockCount > 0) return "warning";
  return "healthy";
};

export default function InventoryHealthCard({
  summary,
  className = "",
}: InventoryHealthCardProps) {
  const status = resolveInventoryStatus(
    summary.lowStockCount,
    summary.outOfStockCount,
  );

  const items: MiniStatListItem[] = [
    {
      key: "products",
      label: "Sản phẩm có tồn",
      value: summary.totalProducts,
      format: "number",
    },
    {
      key: "variants",
      label: "Biến thể đang theo dõi",
      value: summary.totalVariants,
      format: "number",
    },
    {
      key: "available",
      label: "Tồn khả dụng",
      value: summary.availableQuantity,
      format: "number",
      tone: "emerald",
    },
    {
      key: "reserved",
      label: "Đã giữ chỗ",
      value: summary.reservedQuantity,
      format: "number",
      tone: "amber",
    },
    {
      key: "low",
      label: "Tồn thấp",
      value: summary.lowStockCount,
      format: "number",
      tone: "amber",
    },
    {
      key: "out",
      label: "Hết hàng",
      value: summary.outOfStockCount,
      format: "number",
      tone: "red",
    },
  ];

  const hasAnyInventory =
    summary.totalStockRows > 0 ||
    summary.totalVariants > 0 ||
    summary.totalProducts > 0;

  return (
    <DashboardSectionCard
      title="Inventory Health"
      subtitle="Sức khỏe tồn kho trong phạm vi hiện tại."
      className={className}
      actions={<DashboardHealthPill status={status} />}
    >
      {!hasAnyInventory ? (
        <DashboardEmptyState
          compact
          title="Chưa có dữ liệu tồn kho"
          description="Hiện chưa có bản ghi tồn kho nào trong phạm vi đang chọn."
        />
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4 dark:border-slate-800 dark:bg-slate-900/50">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Tổng dòng tồn kho
              </p>
              <DashboardNumber
                value={summary.totalStockRows}
                className="mt-2 text-2xl font-bold"
              />
            </div>

            <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4 dark:border-slate-800 dark:bg-slate-900/50">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Tổng số lượng
              </p>
              <DashboardNumber
                value={summary.totalQuantity}
                className="mt-2 text-2xl font-bold"
              />
            </div>

            <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4 dark:border-slate-800 dark:bg-slate-900/50">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Khả dụng hiện tại
              </p>
              <DashboardNumber
                value={summary.availableQuantity}
                className="mt-2 text-2xl font-bold text-emerald-700 dark:text-emerald-300"
              />
            </div>
          </div>

          <MiniStatList items={items} />
        </div>
      )}
    </DashboardSectionCard>
  );
}
