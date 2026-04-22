import type { NotificationRepository } from "../../../domain/notifications/NotificationRepository";
import type {
  NotificationCategory,
  NotificationListResult,
  NotificationSeverity,
} from "../../../domain/notifications/types";

type Input = {
  userId: number;
  page?: number;
  limit?: number;
  unreadOnly?: boolean;
  category?: NotificationCategory | "all" | null;
  severity?: NotificationSeverity | "all" | null;
  q?: string;
};

const normalizePositiveInt = (value: unknown, fallback: number) => {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : fallback;
};

export class ListMyNotifications {
  constructor(private readonly notificationRepo: NotificationRepository) {}

  async execute(input: Input): Promise<NotificationListResult> {
    const userId = Number(input?.userId);

    if (!Number.isFinite(userId) || userId <= 0) {
      throw new Error("User id is invalid");
    }

    return this.notificationRepo.listForUser({
      userId,
      page: normalizePositiveInt(input?.page, 1),
      limit: Math.min(100, normalizePositiveInt(input?.limit, 20)),
      unreadOnly: input?.unreadOnly === true,
      category: input?.category ?? "all",
      severity: input?.severity ?? "all",
      q: String(input?.q ?? "").trim(),
    });
  }
}
