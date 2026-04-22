import type { NotificationRepository } from "../../../domain/notifications/NotificationRepository";
import type { MarkAllNotificationsReadResult } from "../../../domain/notifications/types";

const normalizeIds = (values?: unknown[]): number[] => {
  if (!Array.isArray(values)) return [];

  return Array.from(
    new Set(
      values
        .map((value) => Number(value))
        .filter((value) => Number.isFinite(value) && value > 0),
    ),
  );
};

export class MarkAllNotificationsRead {
  constructor(private readonly notificationRepo: NotificationRepository) {}

  async execute(
    userId: number,
    notificationIds?: unknown[],
  ): Promise<MarkAllNotificationsReadResult> {
    const normalizedUserId = Number(userId);

    if (!Number.isFinite(normalizedUserId) || normalizedUserId <= 0) {
      throw new Error("User id is invalid");
    }

    return this.notificationRepo.markAllRead(
      normalizedUserId,
      normalizeIds(notificationIds),
    );
  }
}
