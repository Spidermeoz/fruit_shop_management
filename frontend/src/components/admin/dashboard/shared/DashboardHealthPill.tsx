type DashboardHealthStatus = "healthy" | "warning" | "critical";

type DashboardHealthPillProps = {
  status: DashboardHealthStatus;
  className?: string;
};

const HEALTH_MAP: Record<
  DashboardHealthStatus,
  {
    label: string;
    container: string;
    dot: string;
  }
> = {
  healthy: {
    label: "Ổn định",
    container:
      "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300",
    dot: "bg-emerald-500",
  },
  warning: {
    label: "Cần chú ý",
    container:
      "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300",
    dot: "bg-amber-500",
  },
  critical: {
    label: "Nghiêm trọng",
    container:
      "border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950/40 dark:text-red-300",
    dot: "bg-red-500",
  },
};

export default function DashboardHealthPill({
  status,
  className = "",
}: DashboardHealthPillProps) {
  const item = HEALTH_MAP[status];

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-xs font-semibold ${item.container} ${className}`.trim()}
    >
      <span className={`h-2 w-2 rounded-full ${item.dot}`} />
      {item.label}
    </span>
  );
}
