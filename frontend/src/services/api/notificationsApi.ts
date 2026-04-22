import { http } from "../http";
import type {
  ListNotificationsParams,
  ListNotificationsResponse,
  MarkAllNotificationsReadResponse,
  MarkNotificationReadResponse,
  NotificationItem,
  UnreadNotificationsCountResponse,
} from "../../types/notifications";

const NOTIFICATIONS_BASE = "/api/v1/admin/notifications";

const appendParam = (
  searchParams: URLSearchParams,
  key: string,
  value: string | number | null | undefined,
) => {
  if (value === undefined || value === null || value === "") return;
  searchParams.set(key, String(value));
};

const buildQueryString = (params: ListNotificationsParams = {}) => {
  const searchParams = new URLSearchParams();

  appendParam(searchParams, "page", params.page);
  appendParam(searchParams, "limit", params.limit);

  if (params.severity && params.severity !== "all") {
    appendParam(searchParams, "severity", params.severity);
  }

  if (params.category && params.category !== "all") {
    appendParam(searchParams, "category", params.category);
  }

  if (params.readState === "unread") {
    appendParam(searchParams, "unreadOnly", "true");
  }

  appendParam(searchParams, "branchId", params.branchId);
  appendParam(searchParams, "q", params.q?.trim());

  const raw = searchParams.toString();
  return raw ? `?${raw}` : "";
};

const normalizeNotificationItem = (item: any): NotificationItem => ({
  id: Number(item?.id ?? 0),
  eventKey: String(item?.eventKey ?? ""),
  category: item?.category ?? "system",
  severity: item?.severity ?? "info",
  title: String(item?.title ?? ""),
  message: String(item?.message ?? ""),
  entityType: item?.entityType ?? null,
  entityId:
    item?.entityId !== null && item?.entityId !== undefined
      ? Number(item.entityId)
      : null,
  actorUserId:
    item?.actorUserId !== null && item?.actorUserId !== undefined
      ? Number(item.actorUserId)
      : null,
  branchId:
    item?.branchId !== null && item?.branchId !== undefined
      ? Number(item.branchId)
      : null,
  targetUrl: item?.targetUrl ?? null,
  metaJson: item?.metaJson ?? null,
  status: item?.status ?? null,
  isRead: Boolean(item?.isRead),
  readAt: item?.readAt ?? null,
  createdAt: item?.createdAt ?? new Date().toISOString(),
  updatedAt: item?.updatedAt ?? null,
  actor:
    item?.actorUserId || item?.actorName || item?.actorAvatar
      ? {
          id: Number(item?.actorUserId ?? 0),
          fullName: item?.actorName ?? null,
          avatar: item?.actorAvatar ?? null,
          email: item?.actorEmail ?? null,
        }
      : null,
  branch:
    item?.branchId || item?.branchName || item?.branchCode
      ? {
          id: Number(item?.branchId ?? 0),
          name: item?.branchName ?? null,
          code: item?.branchCode ?? null,
        }
      : null,
});

const normalizeListResponse = (res: any): ListNotificationsResponse => {
  const items = Array.isArray(res?.data)
    ? res.data.map(normalizeNotificationItem)
    : [];

  const page = Number(res?.meta?.page ?? 1);
  const limit = Number(res?.meta?.limit ?? 10);
  const total = Number(res?.meta?.total ?? items.length);
  const totalPages = Math.max(1, Math.ceil(total / Math.max(1, limit)));

  return {
    items,
    pagination: {
      page,
      limit,
      total,
      totalPages,
    },
    unreadCount: Number(res?.unreadCount ?? 0),
  };
};

export const notificationsApi = {
  async list(
    params: ListNotificationsParams = {},
  ): Promise<ListNotificationsResponse> {
    const [listRes, unreadRes] = await Promise.all([
      http<any>("GET", `${NOTIFICATIONS_BASE}${buildQueryString(params)}`),
      http<any>("GET", `${NOTIFICATIONS_BASE}/unread-count`).catch(() => null),
    ]);

    const normalized = normalizeListResponse(listRes);
    normalized.unreadCount = Number(unreadRes?.data?.unreadCount ?? 0);

    if (params.readState === "read") {
      normalized.items = normalized.items.filter((item) => item.isRead);
      normalized.pagination.total = normalized.items.length;
      normalized.pagination.totalPages = 1;
      normalized.pagination.page = 1;
    }

    return normalized;
  },

  async getUnreadCount(): Promise<UnreadNotificationsCountResponse> {
    const res = await http<any>("GET", `${NOTIFICATIONS_BASE}/unread-count`);
    return {
      unreadCount: Number(res?.data?.unreadCount ?? 0),
    };
  },

  async markRead(id: number): Promise<MarkNotificationReadResponse> {
    const res = await http<any>("PATCH", `${NOTIFICATIONS_BASE}/${id}/read`);
    return {
      success: Boolean(res?.success ?? true),
      item: res?.data
        ? {
            id: Number(res.data.notificationId ?? id),
            eventKey: "",
            category: "system",
            severity: "info",
            title: "",
            message: "",
            isRead: Boolean(res.data.isRead ?? true),
            readAt: res.data.readAt ?? new Date().toISOString(),
            createdAt: new Date().toISOString(),
          }
        : null,
    };
  },

  async markAllRead(): Promise<MarkAllNotificationsReadResponse> {
    const res = await http<any>("PATCH", `${NOTIFICATIONS_BASE}/read-all`);
    return {
      success: Boolean(res?.success ?? true),
      updatedCount: Number(res?.data?.updatedCount ?? 0),
    };
  },
};
