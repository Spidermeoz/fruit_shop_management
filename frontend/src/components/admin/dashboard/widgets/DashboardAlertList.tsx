import { AlertCircle, AlertTriangle, ArrowRight, Info } from "lucide-react";
import type { DashboardAlert } from "../types/dashboard";
import { getSeverityClasses } from "../utils/dashboardFormatters";
import DashboardBadge from "../shared/DashboardBadge";
import DashboardEmptyState from "../shared/DashboardEmptyState";

type DashboardAlertListProps = {
  alerts: DashboardAlert[];
  className?: string;
  compact?: boolean;
  maxItems?: number;
};

const severityIconMap = {
  critical: <AlertCircle className="h-4 w-4" />,
  warning: <AlertTriangle className="h-4 w-4" />,
  info: <Info className="h-4 w-4" />,
};

const categoryLabelMap: Record<DashboardAlert["category"], string> = {
  orders: "Đơn hàng",
  inventory: "Tồn kho",
  users: "Người dùng",
  branches: "Chi nhánh",
  shipping: "Giao hàng",
  promotions: "Khuyến mãi",
  reviews: "Đánh giá",
  content: "Nội dung",
  system: "Hệ thống",
};

export default function DashboardAlertList({
  alerts,
  className = "",
  maxItems,
}: DashboardAlertListProps) {
  const items =
    typeof maxItems === "number" ? alerts.slice(0, maxItems) : alerts;

  if (!items.length) {
    return (
      <DashboardEmptyState
        compact
        title="Chưa có cảnh báo"
        description="Hiện tại chưa có tín hiệu bất thường nào trong phạm vi bạn đang theo dõi."
        className={className}
      />
    );
  }

  return (
    <div className={`space-y-3 ${className}`.trim()}>
      {items.map((alert) => {
        const classes = getSeverityClasses(alert.severity);
        const content = (
          <div
            className={`rounded-2xl border px-4 py-4 transition-colors ${classes.container}`}
          >
            <div className="flex items-start gap-3">
              <div
                className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/80 dark:bg-slate-950/40 ${classes.text}`}
              >
                {severityIconMap[alert.severity]}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <DashboardBadge variant="slate">
                    {categoryLabelMap[alert.category]}
                  </DashboardBadge>
                  <span
                    className={`inline-flex h-2 w-2 rounded-full ${classes.dot}`}
                  />
                </div>

                <h4 className="mt-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
                  {alert.title}
                </h4>

                <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">
                  {alert.message}
                </p>

                {alert.href ? (
                  <div className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-slate-600 dark:text-slate-300">
                    Xem chi tiết
                    <ArrowRight className="h-3.5 w-3.5" />
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        );

        if (alert.href) {
          return (
            <a key={alert.id} href={alert.href} className="block">
              {content}
            </a>
          );
        }

        return <div key={alert.id}>{content}</div>;
      })}
    </div>
  );
}
