import DashboardSectionCard from "./DashboardSectionCard";
import DashboardNumber from "../shared/DashboardNumber";
import DashboardEmptyState from "../shared/DashboardEmptyState";
import { calcPercent } from "../utils/dashboardFormatters";

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

// --- Configs & Mappings ---

// Chỉ giữ lại hex colors để fill SVG stroke và render dot ở legend
const toneColorMap: Record<NonNullable<MetricDonutItem["tone"]>, string> = {
  default: "#64748b", // slate-500
  blue: "#0ea5e9", // sky-500
  emerald: "#10b981", // emerald-500
  amber: "#f59e0b", // amber-500
  red: "#ef4444", // red-500
  violet: "#8b5cf6", // violet-500
};

// --- Main Component ---

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

  // SVG Geometry
  const size = 160;
  const stroke = 16;
  const center = size / 2;
  const normalizedRadius = center - stroke / 2;
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
        <div className="flex flex-col items-center gap-6 pt-2 sm:flex-row sm:items-start lg:gap-8">
          {/* 1. Hero Visual: Donut Chart */}
          <div className="relative flex shrink-0 items-center justify-center">
            <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
              {/* Background Circle */}
              <circle
                stroke="currentColor"
                fill="transparent"
                strokeWidth={stroke}
                r={normalizedRadius}
                cx={center}
                cy={center}
                className="text-slate-100 dark:text-slate-800"
              />

              {/* Data Segments */}
              {normalizedItems.map((item) => {
                const percent =
                  computedTotal > 0 ? item.value / computedTotal : 0;
                // Trừ đi một lượng nhỏ (e.g., 2) để tạo gap hờ nếu muốn, nhưng default giữ chuẩn
                const dash = circumference * percent;
                const dashOffset = circumference - dash - progressOffset;
                progressOffset += dash;

                return (
                  <circle
                    key={item.key}
                    stroke={toneColorMap[item.tone ?? "default"]}
                    fill="transparent"
                    strokeWidth={stroke}
                    strokeLinecap="round"
                    r={normalizedRadius}
                    cx={center}
                    cy={center}
                    strokeDasharray={`${dash} ${circumference - dash}`}
                    strokeDashoffset={dashOffset}
                    transform={`rotate(-90 ${center} ${center})`}
                    className="transition-all duration-700 ease-out"
                  />
                );
              })}
            </svg>

            {/* Center Summary Content */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pt-1 text-center pointer-events-none">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                {centerLabel}
              </span>
              <DashboardNumber
                value={computedTotal}
                className="mt-0.5 text-2xl font-bold tracking-tight text-slate-900 dark:text-white"
              />
            </div>
          </div>

          {/* 2. Flat Legend List */}
          <div className="flex w-full min-w-0 flex-1 flex-col justify-center gap-1">
            {normalizedItems.map((item) => {
              const toneColor = toneColorMap[item.tone ?? "default"];

              return (
                <div
                  key={item.key}
                  className="flex items-center justify-between gap-3 border-b border-slate-50 py-2.5 last:border-0 dark:border-slate-800/50"
                >
                  {/* Legend Label */}
                  <div className="flex min-w-0 flex-1 items-center gap-2.5">
                    <span
                      className="h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: toneColor }}
                    />
                    <span
                      className="truncate text-sm font-medium text-slate-700 dark:text-slate-300"
                      title={item.label}
                    >
                      {item.label}
                    </span>
                  </div>

                  {/* Legend Values */}
                  <div className="flex shrink-0 items-center justify-end gap-3">
                    <DashboardNumber
                      value={item.value}
                      className="text-sm font-semibold text-slate-900 dark:text-slate-100"
                    />
                    <span className="w-10 text-right text-xs font-medium text-slate-500 dark:text-slate-400">
                      {calcPercent(item.value, computedTotal)}
                    </span>
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
