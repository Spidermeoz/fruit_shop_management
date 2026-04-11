import { useMemo } from "react";
import type { LucideIcon } from "lucide-react";
import DashboardSectionCard from "./DashboardSectionCard";
import DashboardNumber from "../shared/DashboardNumber";
import DashboardEmptyState from "../shared/DashboardEmptyState";
import { clampPercent } from "../utils/dashboardFormatters";

export type MetricBarListItem = {
  key: string;
  label: string;
  value: number;
  format?: "number" | "currency" | "compact" | "percent";
  tone?: "default" | "blue" | "emerald" | "amber" | "red" | "violet";
  icon?: LucideIcon;
};

type MetricBarListCardProps = {
  title: string;
  subtitle?: string;
  items: MetricBarListItem[];
  className?: string;
};

// --- Configs & Mappings ---

// Đã loại bỏ badge vì card ranking cần gọn nhẹ, dùng text + bar color là đủ
const toneMap: Record<
  NonNullable<MetricBarListItem["tone"]>,
  { bar: string; icon: string }
> = {
  default: { bar: "bg-slate-400 dark:bg-slate-500", icon: "text-slate-400" },
  blue: { bar: "bg-blue-500", icon: "text-blue-500" },
  emerald: { bar: "bg-emerald-500", icon: "text-emerald-500" },
  amber: { bar: "bg-amber-500", icon: "text-amber-500" },
  red: { bar: "bg-red-500", icon: "text-red-500" },
  violet: { bar: "bg-violet-500", icon: "text-violet-500" },
};

// --- Main Component ---

export default function MetricBarListCard({
  title,
  subtitle,
  items,
  className = "",
}: MetricBarListCardProps) {
  // Lọc và sắp xếp để đảm bảo đúng tính chất của bảng Ranking
  const normalizedItems = useMemo(() => {
    return items
      .filter((item) => item.value > 0)
      .sort((a, b) => b.value - a.value); // Sort descending
  }, [items]);

  const maxValue = normalizedItems.length ? normalizedItems[0].value : 0;

  return (
    <DashboardSectionCard
      title={title}
      subtitle={subtitle}
      className={className}
    >
      {!normalizedItems.length ? (
        <DashboardEmptyState
          compact
          title="Chưa có dữ liệu"
          description="Số liệu so sánh sẽ xuất hiện tại đây."
        />
      ) : (
        <div className="flex flex-col gap-4 pt-1">
          {normalizedItems.map((item, index) => {
            const isTop1 = index === 0;
            const tone = toneMap[item.tone ?? "default"];
            const width =
              maxValue > 0 ? clampPercent((item.value / maxValue) * 100) : 0;
            const Icon = item.icon;

            return (
              <div key={item.key} className="group flex flex-col gap-1.5">
                {/* 1. Header Row (Label + Value) */}
                <div className="flex items-center justify-between gap-3">
                  <div className="flex min-w-0 flex-1 items-center gap-2">
                    {/* Icon or Colored Dot Fallback */}
                    {Icon ? (
                      <Icon className={`h-4 w-4 shrink-0 ${tone.icon}`} />
                    ) : (
                      <span
                        className={`h-2 w-2 shrink-0 rounded-full ${tone.bar}`}
                      />
                    )}

                    <span
                      className={`truncate ${
                        isTop1
                          ? "text-sm font-bold text-slate-900 dark:text-slate-100"
                          : "text-xs font-semibold text-slate-600 dark:text-slate-300"
                      }`}
                      title={item.label}
                    >
                      {item.label}
                    </span>
                  </div>

                  <DashboardNumber
                    value={item.value}
                    format={item.format ?? "number"}
                    className={`shrink-0 ${
                      isTop1
                        ? "text-base font-bold text-slate-900 dark:text-white"
                        : "text-sm font-semibold text-slate-700 dark:text-slate-200"
                    }`}
                  />
                </div>

                {/* 2. Progress Bar Row */}
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ease-out ${tone.bar}`}
                    style={{ width: `${width}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </DashboardSectionCard>
  );
}
