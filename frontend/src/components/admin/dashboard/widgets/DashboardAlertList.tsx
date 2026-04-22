import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { AlertCircle, AlertTriangle, ChevronRight, Info } from "lucide-react";
import type { DashboardAlert } from "../types/dashboard";
import DashboardBadge from "../shared/DashboardBadge";
import DashboardEmptyState from "../shared/DashboardEmptyState";

type DashboardAlertListProps = {
  alerts: DashboardAlert[];
  className?: string;
  compact?: boolean;
  maxItems?: number;
};

type FilterType = "all" | "critical" | "warning" | "info";

// --- Helpers & Configs ---

const severityConfig = {
  critical: {
    icon: <AlertCircle className="h-4 w-4" />,
    rail: "border-l-red-500 dark:border-l-red-500",
    bg: "bg-red-50 dark:bg-red-950/30",
    iconColor: "text-red-600 dark:text-red-400",
    label: "Critical",
  },
  warning: {
    icon: <AlertTriangle className="h-4 w-4" />,
    rail: "border-l-amber-500 dark:border-l-amber-500",
    bg: "bg-amber-50 dark:bg-amber-950/30",
    iconColor: "text-amber-600 dark:text-amber-400",
    label: "Warning",
  },
  info: {
    icon: <Info className="h-4 w-4" />,
    rail: "border-l-blue-500 dark:border-l-blue-500",
    bg: "bg-blue-50 dark:bg-blue-950/30",
    iconColor: "text-blue-600 dark:text-blue-400",
    label: "Info",
  },
};

const severityWeight = { critical: 3, warning: 2, info: 1 };

const categoryLabelMap: Record<DashboardAlert["category"], string> = {
  orders: "Đơn hàng",
  inventory: "Tồn kho",
  users: "User",
  branches: "Chi nhánh",
  shipping: "Giao hàng",
  promotions: "Promo",
  reviews: "Review",
  content: "Content",
  system: "System",
};

// --- Subcomponents ---

const FilterChip = ({
  active,
  label,
  count,
  onClick,
}: {
  active: boolean;
  label: string;
  count?: number;
  onClick: () => void;
}) => (
  <button
    onClick={onClick}
    className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider transition-colors ${
      active
        ? "bg-slate-800 text-white dark:bg-slate-200 dark:text-slate-900"
        : "bg-slate-100 text-slate-500 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700"
    }`}
  >
    {label} {count !== undefined && count > 0 && `(${count})`}
  </button>
);

// --- Main Component ---

export default function DashboardAlertList({
  alerts,
  className = "",
  compact = false,
  maxItems,
}: DashboardAlertListProps) {
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");

  // 1. Sort & Cắt items (base data)
  const baseAlerts = useMemo(() => {
    const sorted = [...alerts].sort(
      (a, b) => severityWeight[b.severity] - severityWeight[a.severity],
    );
    return maxItems !== undefined ? sorted.slice(0, maxItems) : sorted;
  }, [alerts, maxItems]);

  // 2. Tính toán Derived Metrics trên base data
  const metrics = useMemo(() => {
    let critical = 0;
    let warning = 0;
    let info = 0;

    baseAlerts.forEach((a) => {
      if (a.severity === "critical") critical++;
      else if (a.severity === "warning") warning++;
      else if (a.severity === "info") info++;
    });

    return { total: baseAlerts.length, critical, warning, info };
  }, [baseAlerts]);

  // 3. Lọc dữ liệu hiển thị theo filter chip
  const displayedAlerts = useMemo(() => {
    if (activeFilter === "all") return baseAlerts;
    return baseAlerts.filter((a) => a.severity === activeFilter);
  }, [baseAlerts, activeFilter]);

  if (!baseAlerts.length) {
    return (
      <DashboardEmptyState
        compact={compact}
        title="No alerts"
        description="Không có tín hiệu bất thường trong phạm vi này."
        className={className}
      />
    );
  }

  return (
    <div className={`flex flex-col gap-4 ${className}`.trim()}>
      {/* Summary & Filters Strip */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3 dark:border-slate-800">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded bg-slate-100 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:bg-slate-800 dark:text-slate-300">
            {metrics.total} Alerts
          </span>
          {metrics.critical > 0 && (
            <span className="rounded bg-red-50 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider text-red-600 dark:bg-red-900/30 dark:text-red-400">
              {metrics.critical} Critical
            </span>
          )}
          {metrics.warning > 0 && (
            <span className="rounded bg-amber-50 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider text-amber-600 dark:bg-amber-900/30 dark:text-amber-400">
              {metrics.warning} Warning
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <FilterChip
            active={activeFilter === "all"}
            label="All"
            onClick={() => setActiveFilter("all")}
          />
          <FilterChip
            active={activeFilter === "critical"}
            label="Critical"
            count={metrics.critical}
            onClick={() => setActiveFilter("critical")}
          />
          <FilterChip
            active={activeFilter === "warning"}
            label="Warning"
            count={metrics.warning}
            onClick={() => setActiveFilter("warning")}
          />
          <FilterChip
            active={activeFilter === "info"}
            label="Info"
            count={metrics.info}
            onClick={() => setActiveFilter("info")}
          />
        </div>
      </div>

      {/* Alert List */}
      <div className="flex flex-col gap-2.5">
        {displayedAlerts.length === 0 ? (
          <div className="py-6 text-center text-sm text-slate-500 dark:text-slate-400">
            Không có cảnh báo loại <strong>{activeFilter}</strong>.
          </div>
        ) : (
          displayedAlerts.map((alert) => {
            const config = severityConfig[alert.severity];

            const CardContent = (
              <div
                className={`group flex items-start gap-3 rounded-xl border border-slate-100 bg-white p-3 pr-4 transition-all hover:border-slate-200 hover:shadow-sm dark:border-slate-800 dark:bg-slate-950 dark:hover:border-slate-700 border-l-[3px] ${config.rail}`}
              >
                {/* Icon Box */}
                <div
                  className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${config.bg} ${config.iconColor}`}
                >
                  {config.icon}
                </div>

                {/* Content */}
                <div className="flex min-w-0 flex-1 flex-col">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="line-clamp-1 text-sm font-bold text-slate-900 dark:text-slate-100">
                      {alert.title}
                    </h4>
                    <DashboardBadge
                      variant="slate"
                      className="shrink-0 text-[10px] px-1.5 py-0"
                    >
                      {categoryLabelMap[alert.category]}
                    </DashboardBadge>
                  </div>

                  <p className="line-clamp-2 text-xs leading-snug text-slate-500 dark:text-slate-400">
                    {alert.message}
                  </p>
                </div>

                {/* CTA Action */}
                {alert.href && (
                  <div className="mt-2 shrink-0 text-slate-400 transition-transform group-hover:translate-x-1 group-hover:text-blue-500 dark:text-slate-600 dark:group-hover:text-blue-400">
                    <ChevronRight className="h-5 w-5" />
                  </div>
                )}
              </div>
            );

            if (alert.href) {
              const isExternalHref = /^(https?:)?\/\//.test(alert.href);

              if (isExternalHref) {
                return (
                  <a
                    key={alert.id}
                    href={alert.href}
                    className="block outline-none"
                  >
                    {CardContent}
                  </a>
                );
              }

              return (
                <Link
                  key={alert.id}
                  to={alert.href}
                  className="block outline-none"
                >
                  {CardContent}
                </Link>
              );
            }

            return <div key={alert.id}>{CardContent}</div>;
          })
        )}
      </div>
    </div>
  );
}
