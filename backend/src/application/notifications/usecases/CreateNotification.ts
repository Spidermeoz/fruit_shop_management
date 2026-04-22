import type { NotificationRepository } from "../../../domain/notifications/NotificationRepository";
import type {
  CreateNotificationInput,
  NotificationCategory,
  NotificationCreateResult,
  NotificationSeverity,
  NotificationStatus,
} from "../../../domain/notifications/types";

const normalizeText = (value?: string | null): string | null => {
  const normalized = String(value ?? "").trim();
  return normalized ? normalized : null;
};

const normalizeId = (value: unknown): number | null => {
  if (value === null || value === undefined || value === "") return null;

  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : null;
};

const normalizeIds = (values?: unknown[]): number[] => {
  if (!Array.isArray(values)) return [];

  return Array.from(
    new Set(
      values
        .map((value) => normalizeId(value))
        .filter((value): value is number => value !== null),
    ),
  );
};

const normalizeCategory = (value?: string | null): NotificationCategory => {
  if (
    value === "system" ||
    value === "order" ||
    value === "review" ||
    value === "inventory" ||
    value === "shipping" ||
    value === "user" ||
    value === "promotion" ||
    value === "content"
  ) {
    return value;
  }

  return "system";
};

const normalizeSeverity = (value?: string | null): NotificationSeverity => {
  if (value === "info" || value === "warning" || value === "critical") {
    return value;
  }

  return "info";
};

const normalizeStatus = (value?: string | null): NotificationStatus => {
  if (value === "active" || value === "archived") {
    return value;
  }

  return "active";
};

export class CreateNotification {
  constructor(private readonly notificationRepo: NotificationRepository) {}

  async execute(input: CreateNotificationInput): Promise<NotificationCreateResult> {
    const eventKey = String(input?.eventKey ?? "").trim();
    const title = String(input?.title ?? "").trim();
    const message = String(input?.message ?? "").trim();

    if (!eventKey) {
      throw new Error("Notification eventKey is required");
    }

    if (!title) {
      throw new Error("Notification title is required");
    }

    if (!message) {
      throw new Error("Notification message is required");
    }

    const normalizedInput: CreateNotificationInput = {
      eventKey,
      category: normalizeCategory(input?.category),
      severity: normalizeSeverity(input?.severity),
      title,
      message,
      entityType: normalizeText(input?.entityType),
      entityId: normalizeId(input?.entityId),
      actorUserId: normalizeId(input?.actorUserId),
      branchId: normalizeId(input?.branchId),
      targetUrl: normalizeText(input?.targetUrl),
      metaJson:
        input?.metaJson && typeof input.metaJson === "object"
          ? input.metaJson
          : null,
      dedupeKey: normalizeText(input?.dedupeKey),
      status: normalizeStatus(input?.status),
      recipientUserIds: normalizeIds(input?.recipientUserIds as unknown[]),
      recipientRoleIds: normalizeIds(input?.recipientRoleIds as unknown[]),
      recipientBranchIds: normalizeIds(input?.recipientBranchIds as unknown[]),
      excludeUserIds: normalizeIds(input?.excludeUserIds as unknown[]),
      includeSuperAdmins: input?.includeSuperAdmins ?? true,
      deliverToAllInternalUsers: input?.deliverToAllInternalUsers ?? false,
    };

    const hasExplicitTargets =
      (normalizedInput.recipientUserIds?.length ?? 0) > 0 ||
      (normalizedInput.recipientRoleIds?.length ?? 0) > 0 ||
      (normalizedInput.recipientBranchIds?.length ?? 0) > 0;

    if (!hasExplicitTargets && !normalizedInput.deliverToAllInternalUsers) {
      normalizedInput.deliverToAllInternalUsers = true;
    }

    return this.notificationRepo.create(normalizedInput);
  }
}
