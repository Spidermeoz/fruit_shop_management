import type { NotificationRepository } from "../../../domain/notifications/NotificationRepository";
import type { MarkNotificationReadResult } from "../../../domain/notifications/types";

export class MarkNotificationRead {
  constructor(private readonly notificationRepo: NotificationRepository) {}

  async execute(
    notificationId: number,
    userId: number,
  ): Promise<MarkNotificationReadResult> {
    const normalizedNotificationId = Number(notificationId);
    const normalizedUserId = Number(userId);

    if (!Number.isFinite(normalizedNotificationId) || normalizedNotificationId <= 0) {
      throw new Error("Notification id is invalid");
    }

    if (!Number.isFinite(normalizedUserId) || normalizedUserId <= 0) {
      throw new Error("User id is invalid");
    }

    const result = await this.notificationRepo.markRead(
      normalizedNotificationId,
      normalizedUserId,
    );

    if (!result) {
      throw new Error("Thông báo không tồn tại hoặc bạn không có quyền truy cập.");
    }

    return result;
  }
}
