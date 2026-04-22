import React from "react";
import type { NotificationItem as NotificationItemType } from "../../../types/notifications";
import NotificationItem from "./NotificationItem";

interface NotificationListProps {
  items: NotificationItemType[];
  loading?: boolean;
  compact?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  onItemClick?: (item: NotificationItemType) => void;
  onMarkRead?: (item: NotificationItemType) => void;
}

const SkeletonRow = () => (
  <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950">
    <div className="animate-pulse">
      <div className="flex items-start gap-3">
        <div className="h-10 w-10 rounded-xl bg-slate-200 dark:bg-slate-800" />
        <div className="min-w-0 flex-1 space-y-2">
          <div className="h-4 w-2/5 rounded bg-slate-200 dark:bg-slate-800" />
          <div className="h-3.5 w-full rounded bg-slate-200 dark:bg-slate-800" />
          <div className="h-3.5 w-3/4 rounded bg-slate-200 dark:bg-slate-800" />
          <div className="h-3 w-1/4 rounded bg-slate-200 dark:bg-slate-800" />
        </div>
      </div>
    </div>
  </div>
);

const NotificationList: React.FC<NotificationListProps> = ({
  items,
  loading = false,
  compact = false,
  emptyTitle = "Chưa có thông báo",
  emptyDescription = "Hiện chưa có sự kiện mới cần xử lý.",
  onItemClick,
  onMarkRead,
}) => {
  if (loading) {
    return (
      <div className="flex flex-col gap-3">
        {Array.from({ length: compact ? 3 : 5 }).map((_, index) => (
          <SkeletonRow key={index} />
        ))}
      </div>
    );
  }

  if (!items.length) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-12 text-center shadow-sm dark:border-slate-800 dark:bg-slate-950">
        <p className="text-base font-semibold text-slate-800 dark:text-slate-100">
          {emptyTitle}
        </p>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          {emptyDescription}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {items.map((item) => (
        <NotificationItem
          key={item.id}
          item={item}
          compact={compact}
          onClick={onItemClick}
          onMarkRead={onMarkRead}
        />
      ))}
    </div>
  );
};

export default NotificationList;
