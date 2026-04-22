import type { NotificationRepository } from "../../../domain/notifications/NotificationRepository";
import type { NotificationUnreadCountResult } from "../../../domain/notifications/types";

export class GetUnreadNotificationCount {
  constructor(private readonly notificationRepo: NotificationRepository) {}

  async execute(userId: number): Promise<NotificationUnreadCountResult> {
    const normalizedUserId = Number(userId);

    if (!Number.isFinite(normalizedUserId) || normalizedUserId <= 0) {
      throw new Error("User id is invalid");
    }

    const unread = await this.notificationRepo.countUnreadForUser(
      normalizedUserId,
    );

    return {
      userId: normalizedUserId,
      unread,
    };
  }
}
