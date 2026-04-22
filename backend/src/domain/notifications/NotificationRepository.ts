import type { Transaction } from "sequelize";
import type {
  CreateNotificationInput,
  MarkAllNotificationsReadResult,
  MarkNotificationReadResult,
  NotificationCreateResult,
  NotificationListFilter,
  NotificationListItem,
  NotificationListResult,
} from "./types";

export interface NotificationRepository {
  create(
    input: CreateNotificationInput,
    transaction?: Transaction,
  ): Promise<NotificationCreateResult>;

  findByIdForUser(
    notificationId: number,
    userId: number,
  ): Promise<NotificationListItem | null>;

  listForUser(filter: NotificationListFilter): Promise<NotificationListResult>;

  countUnreadForUser(userId: number): Promise<number>;

  markRead(
    notificationId: number,
    userId: number,
    transaction?: Transaction,
  ): Promise<MarkNotificationReadResult | null>;

  markAllRead(
    userId: number,
    notificationIds?: number[] | null,
    transaction?: Transaction,
  ): Promise<MarkAllNotificationsReadResult>;
}
