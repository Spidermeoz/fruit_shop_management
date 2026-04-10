import { useMemo } from "react";
import DashboardSectionCard from "./DashboardSectionCard";
import DashboardHealthPill from "../shared/DashboardHealthPill";
import DashboardNumber from "../shared/DashboardNumber";
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

// --- Helper Functions ---

const resolveInventoryStatus = (
  lowStockCount: number,
  outOfStockCount: number,
): "healthy" | "warning" | "critical" => {
  if (outOfStockCount > 0) return "critical";
  if (lowStockCount > 0) return "warning";
  return "healthy";
};

// --- Subcomponents ---

const RiskBlock = ({
  label,
  value,
  activeTone,
}: {
  label: string;
  value: number;
  activeTone: "amber" | "red";
}) => {
  const hasRisk = value > 0;

  const bg = hasRisk
    ? activeTone === "red"
      ? "bg-red-50 dark:bg-red-950/30"
      : "bg-amber-50 dark:bg-amber-950/30"
    : "bg-slate-50 dark:bg-slate-800/50";

  const border = hasRisk
    ? activeTone === "red"
      ? "border-red-100 dark:border-red-900/50"
      : "border-amber-100 dark:border-amber-900/50"
    : "border-slate-100 dark:border-slate-800";

  const textColor = hasRisk
    ? activeTone === "red"
      ? "text-red-600 dark:text-red-400"
      : "text-amber-600 dark:text-amber-400"
    : "text-slate-500 dark:text-slate-400";

  const valueColor = hasRisk
    ? activeTone === "red"
      ? "text-red-700 dark:text-red-300"
      : "text-amber-700 dark:text-amber-300"
    : "text-slate-700 dark:text-slate-300";

  return (
    <div
      className={`flex min-w-0 flex-col rounded-xl border p-3 transition-colors ${bg} ${border}`}
    >
      <span
        className={`truncate text-[11px] font-bold uppercase tracking-wider ${textColor}`}
      >
        {label}
      </span>
      <DashboardNumber
        value={value}
        className={`mt-1 text-xl font-bold leading-none ${valueColor}`}
      />
    </div>
  );
};

// --- Main Component ---

export default function InventoryHealthCard({
  summary,
  className = "",
}: InventoryHealthCardProps) {
  const status = resolveInventoryStatus(
    summary.lowStockCount,
    summary.outOfStockCount,
  );

  const hasAnyInventory =
    summary.totalStockRows > 0 ||
    summary.totalVariants > 0 ||
    summary.totalProducts > 0;

  // Tính toán % cho Composition Bar
  const { availPct, resPct, isNeutral } = useMemo(() => {
    const total = summary.totalQuantity;
    if (total === 0) return { availPct: 0, resPct: 0, isNeutral: true };

    return {
      availPct: Math.round((summary.availableQuantity / total) * 100),
      resPct: Math.round((summary.reservedQuantity / total) * 100),
      isNeutral: false,
    };
  }, [
    summary.totalQuantity,
    summary.availableQuantity,
    summary.reservedQuantity,
  ]);

  return (
    <DashboardSectionCard
      title="Inventory Health"
      subtitle="Tổng quan quy mô và phân bổ tồn kho hiện tại."
      className={className}
      actions={<DashboardHealthPill status={status} />}
    >
      {!hasAnyInventory ? (
        <DashboardEmptyState
          compact
          title="No inventory data"
          description="Chưa có bản ghi tồn kho trong phạm vi này."
        />
      ) : (
        <div className="flex flex-col gap-5">
          {/* 1. Meta Scale Line */}
          <div className="truncate text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            {summary.totalProducts} Products &bull; {summary.totalVariants}{" "}
            Variants &bull; {summary.totalStockRows} Rows
          </div>

          {/* 2. Hero Summary */}
          <div className="flex items-end gap-4">
            <div className="flex flex-col">
              <DashboardNumber
                value={summary.availableQuantity}
                className="text-3xl font-bold leading-none tracking-tight text-slate-900 dark:text-white"
              />
              <span className="mt-1.5 text-[11px] font-bold uppercase tracking-wide text-emerald-600 dark:text-emerald-500">
                Available
              </span>
            </div>

            <div className="mb-1 h-8 w-px bg-slate-200 dark:bg-slate-800" />

            <div className="flex flex-col pb-0.5">
              <DashboardNumber
                value={summary.reservedQuantity}
                className="text-xl font-bold leading-none tracking-tight text-slate-600 dark:text-slate-300"
              />
              <span className="mt-1 text-[11px] font-bold uppercase tracking-wide text-amber-500 dark:text-amber-500">
                Reserved
              </span>
            </div>
          </div>

          {/* 3. Composition Stacked Bar */}
          <div className="space-y-2">
            <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
              {isNeutral ? (
                <div className="h-full w-full bg-slate-200 dark:bg-slate-700" />
              ) : (
                <>
                  <div
                    style={{ width: `${availPct}%` }}
                    className="h-full bg-emerald-500 transition-all duration-500"
                  />
                  <div
                    style={{ width: `${resPct}%` }}
                    className="h-full bg-amber-400 transition-all duration-500 dark:bg-amber-500"
                  />
                </>
              )}
            </div>

            <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider">
              <span
                className={
                  isNeutral
                    ? "text-slate-400"
                    : "text-emerald-600 dark:text-emerald-500"
                }
              >
                {availPct}% Ready
              </span>
              <span
                className={
                  isNeutral
                    ? "text-slate-400"
                    : "text-amber-600 dark:text-amber-500"
                }
              >
                {resPct}% Held
              </span>
            </div>
          </div>

          {/* 4. Risk Blocks */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            <RiskBlock
              label="Low Stock"
              value={summary.lowStockCount}
              activeTone="amber"
            />
            <RiskBlock
              label="Out of Stock"
              value={summary.outOfStockCount}
              activeTone="red"
            />
          </div>
        </div>
      )}
    </DashboardSectionCard>
  );
}
