import DashboardSectionCard from "./DashboardSectionCard";
import DashboardNumber from "../shared/DashboardNumber";
import DashboardBadge from "../shared/DashboardBadge";
import { calcPercent, clampPercent } from "../utils/dashboardFormatters";
import DashboardEmptyState from "../shared/DashboardEmptyState";

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

const toneMap: Record<
  NonNullable<StatusDistributionItem["tone"]>,
  {
    bar: string;
    badge: "blue" | "emerald" | "amber" | "red" | "violet" | "default";
  }
> = {
  default: { bar: "bg-slate-500", badge: "default" },
  blue: { bar: "bg-sky-500", badge: "blue" },
  emerald: { bar: "bg-emerald-500", badge: "emerald" },
  amber: { bar: "bg-amber-500", badge: "amber" },
  red: { bar: "bg-red-500", badge: "red" },
  violet: { bar: "bg-violet-500", badge: "violet" },
};

export default function StatusDistributionCard({
  title,
  subtitle,
  total,
  items,
  className = "",
}: StatusDistributionCardProps) {
  const normalizedItems = items.filter((item) => item.value > 0);
  const computedTotal =
    typeof total === "number"
      ? total
      : normalizedItems.reduce((sum, item) => sum + item.value, 0);

  return (
    <DashboardSectionCard
      title={title}
      subtitle={subtitle}
      className={className}
    >
      {computedTotal <= 0 || normalizedItems.length === 0 ? (
        <DashboardEmptyState
          compact
          title="Chưa có phân bố dữ liệu"
          description="Hiện chưa có đủ dữ liệu để hiển thị cơ cấu trạng thái."
        />
      ) : (
        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4 dark:border-slate-800 dark:bg-slate-900/50">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Tổng
            </p>
            <DashboardNumber
              value={computedTotal}
              className="mt-2 text-3xl font-bold tracking-tight"
            />
          </div>

          <div className="space-y-3">
            {normalizedItems.map((item) => {
              const tone = toneMap[item.tone ?? "default"];
              const percentNumber =
                computedTotal > 0
                  ? clampPercent((item.value / computedTotal) * 100)
                  : 0;

              return (
                <div
                  key={item.key}
                  className="rounded-2xl border border-slate-100 p-4 dark:border-slate-800"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-2">
                      <DashboardBadge variant={tone.badge}>
                        {item.label}
                      </DashboardBadge>
                    </div>

                    <div className="flex items-center gap-3 text-right">
                      <DashboardNumber
                        value={item.value}
                        className="text-sm font-semibold"
                      />
                      <span className="min-w-[52px] text-xs font-medium text-slate-500 dark:text-slate-400">
                        {calcPercent(item.value, computedTotal)}
                      </span>
                    </div>
                  </div>

                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                    <div
                      className={`h-full rounded-full ${tone.bar}`}
                      style={{ width: `${percentNumber}%` }}
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
