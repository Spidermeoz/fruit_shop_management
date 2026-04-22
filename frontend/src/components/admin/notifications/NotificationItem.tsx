import React from "react";
import { AlertCircle, AlertTriangle, Bell, CheckCircle2, ChevronRight } from "lucide-react";
import type { NotificationItem as NotificationItemType } from "../../../types/notifications";

interface NotificationItemProps {
  item: NotificationItemType;
  onClick?: (item: NotificationItemType) => void;
  onMarkRead?: (item: NotificationItemType) => void;
  compact?: boolean;
}

const severityConfig = {
  critical: {
    icon: AlertCircle,
    iconClassName: "text-red-500",
    badgeClassName:
      "bg-red-50 text-red-700 ring-1 ring-inset ring-red-100 dark:bg-red-950/30 dark:text-red-300 dark:ring-red-900/40",
    cardClassName:
      "border-red-100 hover:border-red-200 dark:border-red-900/30 dark:hover:border-red-800/50",
  },
  warning: {
    icon: AlertTriangle,
    iconClassName: "text-amber-500",
    badgeClassName:
      "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-100 dark:bg-amber-950/30 dark:text-amber-300 dark:ring-amber-900/40",
    cardClassName:
      "border-amber-100 hover:border-amber-200 dark:border-amber-900/30 dark:hover:border-amber-800/50",
  },
  info: {
    icon: Bell,
    iconClassName: "text-blue-500",
    badgeClassName:
      "bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-100 dark:bg-blue-950/30 dark:text-blue-300 dark:ring-blue-900/40",
    cardClassName:
      "border-slate-200 hover:border-slate-300 dark:border-slate-800 dark:hover:border-slate-700",
  },
} as const;

const categoryLabelMap: Record<string, string> = {
  orders: "Đơn hàng",
  inventory: "Tồn kho",
  users: "User",
  branches: "Chi nhánh",
  shipping: "Giao hàng",
  promotions: "Khuyến mãi",
  reviews: "Review",
  content: "Nội dung",
  system: "Hệ thống",
};

const formatRelativeTime = (value: string) => {
  const date = new Date(value);
  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);

  if (!Number.isFinite(diffMinutes)) return "Vừa xong";
  if (diffMinutes < 1) return "Vừa xong";
  if (diffMinutes < 60) return `${diffMinutes} phút trước`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} giờ trước`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays} ngày trước`;

  return date.toLocaleString("vi-VN");
};

const NotificationItem: React.FC<NotificationItemProps> = ({
  item,
  onClick,
  onMarkRead,
  compact = false,
}) => {
  const config = severityConfig[item.severity] ?? severityConfig.info;
  const Icon = config.icon;
  const categoryLabel = categoryLabelMap[item.category] ?? "Thông báo";

  return (
    <div
      className={`group rounded-2xl border bg-white p-4 shadow-sm transition-all dark:bg-slate-950 ${config.cardClassName} ${
        item.isRead ? "opacity-90" : "ring-1 ring-inset ring-blue-100 dark:ring-blue-900/30"
      } ${compact ? "p-3" : "p-4"}`}
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-50 dark:bg-slate-900">
          <Icon className={`h-5 w-5 ${config.iconClassName}`} />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="line-clamp-1 text-sm font-bold text-slate-900 dark:text-slate-100">
              {item.title}
            </h4>

            {!item.isRead && (
              <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-blue-700 ring-1 ring-inset ring-blue-100 dark:bg-blue-950/40 dark:text-blue-300 dark:ring-blue-900/40">
                Mới
              </span>
            )}

            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${config.badgeClassName}`}>
              {categoryLabel}
            </span>
          </div>

          <p className="mt-1 line-clamp-2 text-sm leading-6 text-slate-600 dark:text-slate-400">
            {item.message}
          </p>

          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <span>{formatRelativeTime(item.createdAt)}</span>
            {item.branch?.name && (
              <span className="rounded bg-slate-100 px-2 py-0.5 dark:bg-slate-800">
                {item.branch.name}
              </span>
            )}
            {item.actor?.fullName && (
              <span className="rounded bg-slate-100 px-2 py-0.5 dark:bg-slate-800">
                {item.actor.fullName}
              </span>
            )}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {!item.isRead && onMarkRead && (
            <button
              type="button"
              onClick={() => onMarkRead(item)}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-900"
              title="Đánh dấu đã đọc"
            >
              <CheckCircle2 className="h-4 w-4" />
              {!compact && <span>Đã đọc</span>}
            </button>
          )}

          {(item.targetUrl || onClick) && (
            <button
              type="button"
              onClick={() => onClick?.(item)}
              className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-semibold text-blue-600 transition-colors hover:bg-blue-50 dark:text-blue-300 dark:hover:bg-blue-950/30"
            >
              <span className="hidden sm:inline">Xem</span>
              <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationItem;
