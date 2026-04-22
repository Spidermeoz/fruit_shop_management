export type NotificationCategory =
  | "system"
  | "order"
  | "review"
  | "inventory"
  | "shipping"
  | "user"
  | "promotion"
  | "content";

export type NotificationSeverity = "info" | "warning" | "critical";

export type NotificationStatus = "active" | "archived";

export type NotificationRecord = {
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
  dedupeKey?: string | null;
  status: NotificationStatus;
  deleted?: boolean;
  deletedAt?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
};

export type NotificationCreateResult = NotificationRecord & {
  recipientCount: number;
};

export type NotificationListItem = NotificationRecord & {
  recipientId: number;
  userId: number;
  isRead: boolean;
  readAt?: Date | null;
  isHidden: boolean;
  hiddenAt?: Date | null;
  actorName?: string | null;
  actorAvatar?: string | null;
  branchName?: string | null;
  branchCode?: string | null;
};

export type NotificationListFilter = {
  userId: number;
  page?: number;
  limit?: number;
  unreadOnly?: boolean;
  category?: NotificationCategory | "all" | null;
  severity?: NotificationSeverity | "all" | null;
  q?: string;
};

export type NotificationListResult = {
  rows: NotificationListItem[];
  count: number;
  page: number;
  limit: number;
};

export type CreateNotificationInput = {
  eventKey: string;
  category?: NotificationCategory;
  severity?: NotificationSeverity;
  title: string;
  message: string;
  entityType?: string | null;
  entityId?: number | null;
  actorUserId?: number | null;
  branchId?: number | null;
  targetUrl?: string | null;
  metaJson?: Record<string, any> | null;
  dedupeKey?: string | null;
  status?: NotificationStatus;

  recipientUserIds?: number[];
  recipientRoleIds?: number[];
  recipientBranchIds?: number[];
  excludeUserIds?: number[];
  includeSuperAdmins?: boolean;
  deliverToAllInternalUsers?: boolean;
};

export type MarkNotificationReadResult = {
  notificationId: number;
  userId: number;
  isRead: true;
  readAt: Date;
};

export type MarkAllNotificationsReadResult = {
  userId: number;
  affected: number;
};

export type NotificationUnreadCountResult = {
  userId: number;
  unread: number;
};
