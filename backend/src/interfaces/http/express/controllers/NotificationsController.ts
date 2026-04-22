import { Request, Response, NextFunction } from "express";
import type { CreateNotification } from "../../../../application/notifications/usecases/CreateNotification";
import type { GetUnreadNotificationCount } from "../../../../application/notifications/usecases/GetUnreadNotificationCount";
import type { ListMyNotifications } from "../../../../application/notifications/usecases/ListMyNotifications";
import type { MarkAllNotificationsRead } from "../../../../application/notifications/usecases/MarkAllNotificationsRead";
import type { MarkNotificationRead } from "../../../../application/notifications/usecases/MarkNotificationRead";

const toBool = (value: unknown) =>
  value === true || value === "true" || value === 1 || value === "1";

const toNum = (value: unknown): number | undefined => {
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
};

const toIdArray = (value: unknown): number[] => {
  if (!Array.isArray(value)) return [];

  return Array.from(
    new Set(
      value
        .map((item) => Number(item))
        .filter((item) => Number.isFinite(item) && item > 0),
    ),
  );
};

export const makeNotificationsController = (uc: {
  create: CreateNotification;
  list: ListMyNotifications;
  unreadCount: GetUnreadNotificationCount;
  markRead: MarkNotificationRead;
  markAllRead: MarkAllNotificationsRead;
}) => {
  return {
    create: async (req: Request, res: Response, next: NextFunction) => {
      try {
        const body = req.body as Record<string, any>;

        const currentUserId =
          req.user?.id !== undefined && req.user?.id !== null
            ? Number(req.user.id)
            : null;

        const created = await uc.create.execute({
          eventKey: String(body.eventKey ?? "").trim(),
          category: body.category ?? "system",
          severity: body.severity ?? "info",
          title: String(body.title ?? "").trim(),
          message: String(body.message ?? "").trim(),
          entityType: body.entityType ?? null,
          entityId: toNum(body.entityId) ?? null,
          actorUserId: toNum(body.actorUserId) ?? currentUserId,
          branchId: toNum(body.branchId) ?? null,
          targetUrl: body.targetUrl ?? null,
          metaJson:
            body.metaJson && typeof body.metaJson === "object"
              ? body.metaJson
              : null,
          dedupeKey: body.dedupeKey ?? null,
          status: body.status ?? "active",
          recipientUserIds: toIdArray(body.recipientUserIds),
          recipientRoleIds: toIdArray(body.recipientRoleIds),
          recipientBranchIds: toIdArray(body.recipientBranchIds),
          excludeUserIds: toIdArray(body.excludeUserIds),
          includeSuperAdmins: body.includeSuperAdmins ?? true,
          deliverToAllInternalUsers: body.deliverToAllInternalUsers ?? false,
        });

        return res.status(201).json({
          success: true,
          data: created,
          meta: { total: 0, page: 1, limit: 10 },
        });
      } catch (e) {
        next(e);
      }
    },

    list: async (req: Request, res: Response, next: NextFunction) => {
      try {
        const userId = Number(req.user?.id);

        const query = req.query as Record<string, string>;
        const page = toNum(query.page) ?? 1;
        const limit = toNum(query.limit) ?? 20;

        const result = await uc.list.execute({
          userId,
          page,
          limit,
          unreadOnly: toBool(query.unreadOnly),
          category: (query.category as any) ?? "all",
          severity: (query.severity as any) ?? "all",
          q: String(query.q ?? "").trim(),
        });

        return res.json({
          success: true,
          data: result.rows,
          meta: {
            total: result.count,
            page: result.page,
            limit: result.limit,
          },
        });
      } catch (e) {
        next(e);
      }
    },

    unreadCount: async (req: Request, res: Response, next: NextFunction) => {
      try {
        const result = await uc.unreadCount.execute(Number(req.user?.id));

        return res.json({
          success: true,
          data: result,
          meta: { total: 0, page: 1, limit: 10 },
        });
      } catch (e) {
        next(e);
      }
    },

    markRead: async (req: Request, res: Response, next: NextFunction) => {
      try {
        const notificationId = Number(req.params.id);
        const userId = Number(req.user?.id);

        const result = await uc.markRead.execute(notificationId, userId);

        return res.json({
          success: true,
          data: result,
          meta: { total: 0, page: 1, limit: 10 },
        });
      } catch (e) {
        next(e);
      }
    },

    markAllRead: async (req: Request, res: Response, next: NextFunction) => {
      try {
        const userId = Number(req.user?.id);
        const body = req.body as { notificationIds?: unknown[] };

        const result = await uc.markAllRead.execute(
          userId,
          body.notificationIds,
        );

        return res.json({
          success: true,
          data: result,
          meta: { total: 0, page: 1, limit: 10 },
        });
      } catch (e) {
        next(e);
      }
    },
  };
};

export type NotificationsController = ReturnType<
  typeof makeNotificationsController
>;
