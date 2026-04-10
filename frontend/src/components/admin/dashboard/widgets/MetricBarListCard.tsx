import DashboardSectionCard from "./DashboardSectionCard";
import DashboardBadge from "../shared/DashboardBadge";
import DashboardNumber from "../shared/DashboardNumber";
import DashboardEmptyState from "../shared/DashboardEmptyState";
import { clampPercent } from "../utils/dashboardFormatters";
import type { LucideIcon } from "lucide-react";

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

const toneMap: Record<
  NonNullable<MetricBarListItem["tone"]>,
  {
    bar: string;
    badge: "default" | "blue" | "emerald" | "amber" | "red" | "violet";
    icon: string;
  }
> = {
  default: {
    bar: "bg-slate-500",
    badge: "default",
    icon: "text-slate-500 dark:text-slate-400",
  },
  blue: {
    bar: "bg-sky-500",
    badge: "blue",
    icon: "text-sky-600 dark:text-sky-300",
  },
  emerald: {
    bar: "bg-emerald-500",
    badge: "emerald",
    icon: "text-emerald-600 dark:text-emerald-300",
  },
  amber: {
    bar: "bg-amber-500",
    badge: "amber",
    icon: "text-amber-600 dark:text-amber-300",
  },
  red: {
    bar: "bg-red-500",
    badge: "red",
    icon: "text-red-600 dark:text-red-300",
  },
  violet: {
    bar: "bg-violet-500",
    badge: "violet",
    icon: "text-violet-600 dark:text-violet-300",
  },
};

export default function MetricBarListCard({
  title,
  subtitle,
  items,
  className = "",
}: MetricBarListCardProps) {
  const normalizedItems = items.filter((item) => item.value > 0);
  const maxValue = normalizedItems.length
    ? Math.max(...normalizedItems.map((item) => item.value))
    : 0;

  return (
    <DashboardSectionCard
      title={title}
      subtitle={subtitle}
      className={className}
    >
      {!normalizedItems.length ? (
        <DashboardEmptyState
          compact
          title="Chưa có dữ liệu so sánh"
          description="Danh sách này sẽ xuất hiện khi có số liệu phù hợp."
        />
      ) : (
        <div className="space-y-3">
          {normalizedItems.map((item) => {
            const tone = toneMap[item.tone ?? "default"];
            const width =
              maxValue > 0 ? clampPercent((item.value / maxValue) * 100) : 0;

            const Icon = item.icon;

            return (
              <div
                key={item.key}
                className="rounded-2xl border border-slate-100 bg-slate-50/70 px-4 py-4 dark:border-slate-800 dark:bg-slate-900/40"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-2">
                    {Icon ? (
                      <span className={tone.icon}>
                        <Icon className="h-4 w-4" />
                      </span>
                    ) : null}
                    <DashboardBadge variant={tone.badge}>
                      {item.label}
                    </DashboardBadge>
                  </div>

                  <DashboardNumber
                    value={item.value}
                    format={item.format ?? "number"}
                    className="text-sm font-semibold"
                  />
                </div>

                <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                  <div
                    className={`h-full rounded-full ${tone.bar}`}
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
