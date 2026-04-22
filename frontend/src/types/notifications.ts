export type NotificationSeverity = "info" | "warning" | "critical";
export type NotificationCategory =
  | "orders"
  | "inventory"
  | "users"
  | "branches"
  | "shipping"
  | "promotions"
  | "reviews"
  | "content"
  | "system";

export interface NotificationActorSummary {
  id: number;
  email?: string | null;
  fullName?: string | null;
  avatar?: string | null;
}

export interface NotificationBranchSummary {
  id: number;
  name?: string | null;
  code?: string | null;
}

export interface NotificationItem {
  id: number;
  eventKey: string;
  category: NotificationCategory;
  severity: NotificationSeverity;
  title: string;
  message: string;
  entityType?: string | null;
  entityId?: number | null;
  actorUserId?: number | null;
  branchId?: number | null;
  targetUrl?: string | null;
  metaJson?: Record<string, any> | null;
  status?: string | null;
  isRead: boolean;
  readAt?: string | null;
  createdAt: string;
  updatedAt?: string | null;
  actor?: NotificationActorSummary | null;
  branch?: NotificationBranchSummary | null;
}

export interface NotificationsPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ListNotificationsParams {
  page?: number;
  limit?: number;
  severity?: NotificationSeverity | "all";
  category?: NotificationCategory | "all";
  readState?: "all" | "read" | "unread";
  branchId?: number | null;
  q?: string;
}

export interface ListNotificationsResponse {
  items: NotificationItem[];
  pagination: NotificationsPagination;
  unreadCount: number;
}

export interface UnreadNotificationsCountResponse {
  unreadCount: number;
}

export interface MarkNotificationReadResponse {
  success: boolean;
  item?: NotificationItem | null;
}

export interface MarkAllNotificationsReadResponse {
  success: boolean;
  updatedCount: number;
}
