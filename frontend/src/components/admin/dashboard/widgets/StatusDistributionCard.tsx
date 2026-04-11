import { useMemo } from "react";
import DashboardSectionCard from "./DashboardSectionCard";
import DashboardNumber from "../shared/DashboardNumber";
import DashboardEmptyState from "../shared/DashboardEmptyState";
import { calcPercent, clampPercent } from "../utils/dashboardFormatters";

export type StatusDistributionItem = {
  key: string;
  label: string;
  value: number;
  tone?: "blue" | "emerald" | "amber" | "red" | "violet" | "default";
};

type StatusDistributionCardProps = {
  title: string;
  subtitle?: string;
  total?: number;
  items: StatusDistributionItem[];
  className?: string;
};

// --- Configs & Mappings ---

// Loại bỏ badge, chỉ giữ lại bar/dot color để UI gọn gàng, giảm nhiễu
const toneMap: Record<
  NonNullable<StatusDistributionItem["tone"]>,
  { bar: string }
> = {
  default: { bar: "bg-slate-400 dark:bg-slate-500" },
  blue: { bar: "bg-blue-500" },
  emerald: { bar: "bg-emerald-500" },
  amber: { bar: "bg-amber-500" },
  red: { bar: "bg-red-500" },
  violet: { bar: "bg-violet-500" },
};

// --- Main Component ---

export default function StatusDistributionCard({
  title,
  subtitle,
  total,
  items,
  className = "",
}: StatusDistributionCardProps) {
  // Chỉ lấy các item có giá trị để phân bố
  const normalizedItems = useMemo(
    () => items.filter((item) => item.value > 0),
    [items],
  );

  const computedTotal = useMemo(() => {
    return typeof total === "number"
      ? total
      : normalizedItems.reduce((sum, item) => sum + item.value, 0);
  }, [total, normalizedItems]);

  const hasData = computedTotal > 0 && normalizedItems.length > 0;

  return (
    <DashboardSectionCard
      title={title}
      subtitle={subtitle}
      className={className}
    >
      {!hasData ? (
        <DashboardEmptyState
          compact
          title="Chưa có phân bố"
          description="Không có dữ liệu cơ cấu trạng thái trong phạm vi này."
        />
      ) : (
        <div className="flex flex-col">
          {/* 1. Compact Summary */}
          <div className="mb-4 flex items-baseline gap-2 border-b border-slate-50 pb-3 dark:border-slate-800/50">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Total
            </span>
            <DashboardNumber
              value={computedTotal}
              className="text-2xl font-bold leading-none tracking-tight text-slate-900 dark:text-white"
            />
          </div>

          {/* 2. Flat Distribution List */}
          <div className="flex flex-col gap-3">
            {normalizedItems.map((item) => {
              const tone = toneMap[item.tone ?? "default"];

              // Tính % cho UI Bar (clamp để an toàn UI) và % hiển thị dạng Text
              const percentValue = clampPercent(
                (item.value / computedTotal) * 100,
              );
              const percentText = calcPercent(item.value, computedTotal);

              return (
                <div key={item.key} className="group flex flex-col gap-1.5">
                  {/* Info Row */}
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex min-w-0 flex-1 items-center gap-2">
                      <span
                        className={`h-2 w-2 shrink-0 rounded-full ${tone.bar}`}
                      />
                      <span
                        className="truncate text-xs font-semibold text-slate-700 dark:text-slate-300"
                        title={item.label}
                      >
                        {item.label}
                      </span>
                    </div>

                    <div className="flex shrink-0 items-center justify-end gap-3">
                      <DashboardNumber
                        value={item.value}
                        className="text-sm font-semibold text-slate-900 dark:text-slate-100"
                      />
                      <span className="w-10 text-right text-xs font-medium text-slate-500 dark:text-slate-400">
                        {percentText}
                      </span>
                    </div>
                  </div>

                  {/* Progress Bar Row */}
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ease-out ${tone.bar}`}
                      style={{ width: `${percentValue}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </DashboardSectionCard>
  );
}
