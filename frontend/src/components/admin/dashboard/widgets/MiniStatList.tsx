import DashboardNumber from "../shared/DashboardNumber";
import type { DashboardStatTone } from "../types/dashboard";
import { getToneClasses } from "../utils/dashboardFormatters";

export type MiniStatListItem = {
  key: string;
  label: string;
  value: number;
  format?: "number" | "currency" | "compact" | "percent";
  tone?: DashboardStatTone;
  hint?: string;
};

type MiniStatListProps = {
  items: MiniStatListItem[];
  className?: string;
};

export default function MiniStatList({
  items,
  className = "",
}: MiniStatListProps) {
  if (!items.length) return null;

  return (
    <div className={`space-y-3 ${className}`.trim()}>
      {items.map((item) => {
        const tone = getToneClasses(item.tone ?? "default");

        return (
          <div
            key={item.key}
            className="flex items-center justify-between gap-4 rounded-2xl border border-slate-100 bg-slate-50/80 px-4 py-3 dark:border-slate-800 dark:bg-slate-900/50"
          >
            <div className="min-w-0">
              <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
                {item.label}
              </p>
              {item.hint ? (
                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                  {item.hint}
                </p>
              ) : null}
            </div>

            <DashboardNumber
              value={item.value}
              format={item.format ?? "number"}
              className={`text-base font-semibold ${tone.value}`}
            />
          </div>
        );
      })}
    </div>
  );
}
