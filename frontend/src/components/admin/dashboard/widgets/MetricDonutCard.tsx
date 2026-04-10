import DashboardSectionCard from "./DashboardSectionCard";
import DashboardBadge from "../shared/DashboardBadge";
import DashboardNumber from "../shared/DashboardNumber";
import DashboardEmptyState from "../shared/DashboardEmptyState";
import { calcPercent, clampPercent } from "../utils/dashboardFormatters";

export type MetricDonutItem = {
  key: string;
  label: string;
  value: number;
  tone?: "default" | "blue" | "emerald" | "amber" | "red" | "violet";
};

type MetricDonutCardProps = {
  title: string;
  subtitle?: string;
  total?: number;
  items: MetricDonutItem[];
  centerLabel?: string;
  className?: string;
};

const toneColorMap: Record<NonNullable<MetricDonutItem["tone"]>, string> = {
  default: "#64748b",
  blue: "#0ea5e9",
  emerald: "#10b981",
  amber: "#f59e0b",
  red: "#ef4444",
  violet: "#8b5cf6",
};

const toneBadgeMap: Record<
  NonNullable<MetricDonutItem["tone"]>,
  "default" | "blue" | "emerald" | "amber" | "red" | "violet"
> = {
  default: "default",
  blue: "blue",
  emerald: "emerald",
  amber: "amber",
  red: "red",
  violet: "violet",
};

export default function MetricDonutCard({
  title,
  subtitle,
  total,
  items,
  centerLabel = "Tổng",
  className = "",
}: MetricDonutCardProps) {
  const normalizedItems = items.filter((item) => item.value > 0);
  const computedTotal =
    typeof total === "number"
      ? total
      : normalizedItems.reduce((sum, item) => sum + item.value, 0);

  const radius = 54;
  const stroke = 14;
  const normalizedRadius = radius - stroke / 2;
  const circumference = normalizedRadius * 2 * Math.PI;

  let progressOffset = 0;

  return (
    <DashboardSectionCard
      title={title}
      subtitle={subtitle}
      className={className}
    >
      {computedTotal <= 0 || normalizedItems.length === 0 ? (
        <DashboardEmptyState
          compact
          title="Chưa có dữ liệu hiển thị"
          description="Biểu đồ này sẽ xuất hiện khi có đủ số liệu trong phạm vi đang chọn."
        />
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[220px_minmax(0,1fr)] lg:items-center">
          <div className="mx-auto flex w-full max-w-[220px] items-center justify-center">
            <div className="relative">
              <svg width="140" height="140" viewBox="0 0 140 140">
                <circle
                  stroke="currentColor"
                  fill="transparent"
                  strokeWidth={stroke}
                  r={normalizedRadius}
                  cx="70"
                  cy="70"
                  className="text-slate-100 dark:text-slate-800"
                />

                {normalizedItems.map((item) => {
                  const percent =
                    computedTotal > 0 ? item.value / computedTotal : 0;
                  const dash = circumference * percent;
                  const dashOffset = circumference - dash - progressOffset;
                  progressOffset += dash;

                  return (
                    <circle
                      key={item.key}
                      stroke={toneColorMap[item.tone ?? "default"]}
                      fill="transparent"
                      strokeLinecap="round"
                      strokeWidth={stroke}
                      r={normalizedRadius}
                      cx="70"
                      cy="70"
                      strokeDasharray={`${dash} ${circumference - dash}`}
                      strokeDashoffset={dashOffset}
                      transform="rotate(-90 70 70)"
                    />
                  );
                })}
              </svg>

              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-[11px] font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  {centerLabel}
                </span>
                <DashboardNumber
                  value={computedTotal}
                  className="mt-1 text-2xl font-bold tracking-tight"
                />
              </div>
            </div>
          </div>

          <div className="space-y-3">
            {normalizedItems.map((item) => (
              <div
                key={item.key}
                className="rounded-2xl border border-slate-100 bg-slate-50/70 px-4 py-3 dark:border-slate-800 dark:bg-slate-900/40"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-2">
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{
                        backgroundColor: toneColorMap[item.tone ?? "default"],
                      }}
                    />
                    <DashboardBadge
                      variant={toneBadgeMap[item.tone ?? "default"]}
                    >
                      {item.label}
                    </DashboardBadge>
                  </div>

                  <div className="text-right">
                    <DashboardNumber
                      value={item.value}
                      className="text-sm font-semibold"
                    />
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                      {calcPercent(item.value, computedTotal)}
                    </p>
                  </div>
                </div>

                <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${clampPercent(
                        computedTotal > 0
                          ? (item.value / computedTotal) * 100
                          : 0,
                      )}%`,
                      backgroundColor: toneColorMap[item.tone ?? "default"],
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </DashboardSectionCard>
  );
}
