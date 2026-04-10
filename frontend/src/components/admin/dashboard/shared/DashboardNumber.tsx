import {
  formatCompactNumber,
  formatCurrency,
  formatNumber,
  formatPercent,
} from "../utils/dashboardFormatters";

type DashboardNumberFormat = "number" | "currency" | "compact" | "percent";

type DashboardNumberProps = {
  value: number | null | undefined;
  format?: DashboardNumberFormat;
  digits?: number;
  className?: string;
  prefix?: string;
  suffix?: string;
  mutedWhenZero?: boolean;
};

export default function DashboardNumber({
  value,
  format = "number",
  digits = 0,
  className = "",
  prefix = "",
  suffix = "",
  mutedWhenZero = false,
}: DashboardNumberProps) {
  const safe = Number(value ?? 0);

  let display = "--";

  if (Number.isFinite(safe)) {
    switch (format) {
      case "currency":
        display = formatCurrency(safe);
        break;
      case "compact":
        display = formatCompactNumber(safe);
        break;
      case "percent":
        display = formatPercent(safe, digits);
        break;
      default:
        display = formatNumber(safe);
        break;
    }
  }

  const mutedClass =
    mutedWhenZero && safe === 0
      ? "text-slate-400 dark:text-slate-500"
      : "text-slate-900 dark:text-slate-100";

  return (
    <span className={`${mutedClass} ${className}`.trim()}>
      {prefix}
      {display}
      {suffix}
    </span>
  );
}
