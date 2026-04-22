import React, { useEffect, useMemo, useRef, useState } from "react";
import { Bell, CheckCheck, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useNotifications } from "../../../hooks/useNotifications";
import NotificationList from "./NotificationList";
import type { NotificationItem } from "../../../types/notifications";

interface NotificationDropdownProps {
  pollIntervalMs?: number;
  className?: string;
}

const NotificationDropdown: React.FC<NotificationDropdownProps> = ({
  pollIntervalMs = 15000,
  className = "",
}) => {
  const navigate = useNavigate();
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);

  const {
    items,
    unreadCount,
    isLoading,
    isRefreshing,
    isMutating,
    fetchNotifications,
    markRead,
    markAllRead,
  } = useNotifications({
    params: { page: 1, limit: 5, readState: "all" },
    autoFetch: true,
    pollIntervalMs,
  });

  useEffect(() => {
    if (!open) return;

    const handleOutsideClick = (event: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [open]);

  const unreadLabel = useMemo(() => {
    if (unreadCount <= 0) return null;
    return unreadCount > 99 ? "99+" : String(unreadCount);
  }, [unreadCount]);

  const handleOpen = async () => {
    const nextOpen = !open;
    setOpen(nextOpen);
    if (nextOpen) {
      await fetchNotifications({ silent: true }).catch(() => undefined);
    }
  };

  const handleItemClick = async (item: NotificationItem) => {
    if (!item.isRead) {
      await markRead(item.id).catch(() => undefined);
    }

    setOpen(false);

    if (item.targetUrl) {
      navigate(item.targetUrl);
      return;
    }

    navigate("/admin/notifications");
  };

  const handleMarkRead = async (item: NotificationItem) => {
    if (item.isRead) return;
    await markRead(item.id).catch(() => undefined);
  };

  const handleViewAll = () => {
    setOpen(false);
    navigate("/admin/notifications");
  };

  return (
    <div className={`relative ${className}`.trim()} ref={rootRef}>
      <button
        type="button"
        onClick={handleOpen}
        className="relative rounded-full p-2 transition-colors hover:bg-gray-100 dark:hover:bg-gray-700"
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5 text-gray-600 dark:text-gray-300" />
        {unreadLabel && (
          <span className="absolute -right-1 -top-1 inline-flex min-w-[18px] items-center justify-center rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-bold leading-none text-white shadow-sm">
            {unreadLabel}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-30 mt-2 w-[380px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-950">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 dark:border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Thông báo
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {unreadCount > 0
                  ? `${unreadCount} thông báo chưa đọc`
                  : "Mọi thông báo đã được đọc"}
              </p>
            </div>

            <div className="flex items-center gap-2">
              {(isRefreshing || isMutating) && (
                <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
              )}
              <button
                type="button"
                onClick={() => void markAllRead()}
                className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-blue-600 transition-colors hover:bg-blue-50 dark:text-blue-300 dark:hover:bg-blue-950/30"
              >
                <CheckCheck className="h-4 w-4" />
                Đọc hết
              </button>
            </div>
          </div>

          <div className="max-h-[420px] overflow-y-auto px-3 py-3">
            <NotificationList
              items={items}
              loading={isLoading}
              compact
              emptyTitle="Chưa có thông báo mới"
              emptyDescription="Khi có đơn mới, review mới hoặc cảnh báo tồn kho, bạn sẽ thấy ở đây."
              onItemClick={(item) => void handleItemClick(item)}
              onMarkRead={(item) => void handleMarkRead(item)}
            />
          </div>

          <div className="border-t border-slate-100 p-3 dark:border-slate-800">
            <button
              type="button"
              onClick={handleViewAll}
              className="w-full rounded-xl bg-slate-50 px-4 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-100 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              Xem tất cả thông báo
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationDropdown;
