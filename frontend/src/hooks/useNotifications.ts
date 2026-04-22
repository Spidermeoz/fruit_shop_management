import { useCallback, useEffect, useRef, useState } from "react";
import { notificationsApi } from "../services/api/notificationsApi";
import type {
  ListNotificationsParams,
  ListNotificationsResponse,
  NotificationItem,
} from "../types/notifications";
import { useAdminToast } from "../context/AdminToastContext";

const DEFAULT_LIST_RESPONSE: ListNotificationsResponse = {
  items: [],
  pagination: {
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  },
  unreadCount: 0,
};

type UseNotificationsOptions = {
  params?: ListNotificationsParams;
  autoFetch?: boolean;
  pollIntervalMs?: number;
};

export const useNotifications = (
  options: UseNotificationsOptions = {},
) => {
  const { params, autoFetch = true, pollIntervalMs = 15000 } = options;
  const { showErrorToast } = useAdminToast();

  const [data, setData] = useState<ListNotificationsResponse>(
    DEFAULT_LIST_RESPONSE,
  );
  const [isLoading, setIsLoading] = useState<boolean>(autoFetch);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isMutating, setIsMutating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchNotifications = useCallback(
    async (opts?: { silent?: boolean }) => {
      const silent = Boolean(opts?.silent);

      if (silent) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }

      try {
        setError(null);
        const nextData = await notificationsApi.list(params ?? {});
        setData(nextData);
        return nextData;
      } catch (err: any) {
        const message = err?.message || "Không tải được danh sách thông báo.";
        setError(message);
        if (!silent) {
          showErrorToast(message, "Tải thông báo thất bại");
        }
        throw err;
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [params, showErrorToast],
  );

  const markRead = useCallback(
    async (notificationId: number) => {
      setIsMutating(true);
      try {
        const result = await notificationsApi.markRead(notificationId);

        setData((prev) => {
          const nextItems = prev.items.map((item) => {
            if (item.id !== notificationId) return item;
            return {
              ...item,
              isRead: true,
              readAt: result.item?.readAt ?? item.readAt ?? new Date().toISOString(),
            };
          });

          const nextUnreadCount = nextItems.filter((x) => !x.isRead).length;

          return {
            ...prev,
            items: nextItems,
            unreadCount: nextUnreadCount,
          };
        });

        return result;
      } catch (err: any) {
        showErrorToast(
          err?.message || "Không thể đánh dấu đã đọc thông báo.",
          "Cập nhật thông báo thất bại",
        );
        throw err;
      } finally {
        setIsMutating(false);
      }
    },
    [showErrorToast],
  );

  const markAllRead = useCallback(async () => {
    setIsMutating(true);
    try {
      const result = await notificationsApi.markAllRead();

      setData((prev) => ({
        ...prev,
        items: prev.items.map((item) => ({
          ...item,
          isRead: true,
          readAt: item.readAt ?? new Date().toISOString(),
        })),
        unreadCount: 0,
      }));

      return result;
    } catch (err: any) {
      showErrorToast(
        err?.message || "Không thể đánh dấu tất cả thông báo đã đọc.",
        "Cập nhật thông báo thất bại",
      );
      throw err;
    } finally {
      setIsMutating(false);
    }
  }, [showErrorToast]);

  const refreshUnreadCount = useCallback(async () => {
    try {
      const res = await notificationsApi.getUnreadCount();
      setData((prev) => ({
        ...prev,
        unreadCount: Number(res.unreadCount ?? 0),
      }));
      return res.unreadCount;
    } catch {
      return null;
    }
  }, []);

  useEffect(() => {
    if (!autoFetch) return;
    void fetchNotifications();
  }, [autoFetch, fetchNotifications]);

  useEffect(() => {
    if (!autoFetch || !pollIntervalMs || pollIntervalMs <= 0) return;

    if (pollTimerRef.current) {
      clearInterval(pollTimerRef.current);
    }

    pollTimerRef.current = setInterval(() => {
      void fetchNotifications({ silent: true });
    }, pollIntervalMs);

    return () => {
      if (pollTimerRef.current) {
        clearInterval(pollTimerRef.current);
        pollTimerRef.current = null;
      }
    };
  }, [autoFetch, pollIntervalMs, fetchNotifications]);

  return {
    data,
    items: data.items,
    pagination: data.pagination,
    unreadCount: data.unreadCount,
    isLoading,
    isRefreshing,
    isMutating,
    error,
    fetchNotifications,
    refreshUnreadCount,
    markRead,
    markAllRead,
  } as {
    data: ListNotificationsResponse;
    items: NotificationItem[];
    pagination: ListNotificationsResponse["pagination"];
    unreadCount: number;
    isLoading: boolean;
    isRefreshing: boolean;
    isMutating: boolean;
    error: string | null;
    fetchNotifications: (opts?: { silent?: boolean }) => Promise<ListNotificationsResponse>;
    refreshUnreadCount: () => Promise<number | null>;
    markRead: (notificationId: number) => Promise<any>;
    markAllRead: () => Promise<any>;
  };
};
