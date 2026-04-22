import { Request, Response, NextFunction } from "express";
import type { CreateAuditLog } from "../../../../application/audit-logs/usecases/CreateAuditLog";
import type { ListAuditLogs } from "../../../../application/audit-logs/usecases/ListAuditLogs";

const toNum = (value: unknown): number | undefined => {
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
};

const getCurrentUserBranchId = (user: Request["user"]): number | null => {
  if (!user) return null;

  if (Array.isArray(user.branchIds)) {
    const firstBranchId = user.branchIds
      .map(Number)
      .find((x) => Number.isFinite(x) && x > 0);

    return firstBranchId ?? null;
  }

  return null;
};

export const makeAuditLogsController = (uc: {
  create: CreateAuditLog;
  list: ListAuditLogs;
}) => {
  return {
    create: async (req: Request, res: Response, next: NextFunction) => {
      try {
        const body = req.body as Record<string, any>;
        const currentUser = req.user ?? null;

        const created = await uc.create.execute({
          actorUserId:
            toNum(body.actorUserId) ??
            (currentUser?.id !== undefined ? Number(currentUser.id) : null),
          actorRoleId:
            toNum(body.actorRoleId) ??
            (currentUser?.roleId !== undefined
              ? Number(currentUser.roleId)
              : null),
          branchId: toNum(body.branchId) ?? getCurrentUserBranchId(currentUser),
          action: String(body.action ?? "").trim(),
          moduleName: String(body.moduleName ?? "").trim(),
          entityType: body.entityType ?? null,
          entityId: toNum(body.entityId) ?? null,
          requestId: body.requestId ?? null,
          httpMethod: body.httpMethod ?? req.method,
          routePath: body.routePath ?? req.originalUrl,
          ipAddress: body.ipAddress ?? req.ip,
          userAgent: body.userAgent ?? req.get("user-agent") ?? null,
          oldValuesJson:
            body.oldValuesJson && typeof body.oldValuesJson === "object"
              ? body.oldValuesJson
              : null,
          newValuesJson:
            body.newValuesJson && typeof body.newValuesJson === "object"
              ? body.newValuesJson
              : null,
          metaJson:
            body.metaJson && typeof body.metaJson === "object"
              ? body.metaJson
              : null,
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
        const query = req.query as Record<string, string>;

        const page = toNum(query.page) ?? 1;
        const limit = toNum(query.limit) ?? 20;

        const result = await uc.list.execute({
          page,
          limit,
          actorUserId: toNum(query.actorUserId) ?? null,
          actorRoleId: toNum(query.actorRoleId) ?? null,
          branchId: toNum(query.branchId) ?? null,
          moduleName: query.moduleName ?? null,
          action: query.action ?? null,
          requestId: query.requestId ?? null,
          q: String(query.q ?? "").trim(),
          dateFrom: query.dateFrom ?? null,
          dateTo: query.dateTo ?? null,
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
  };
};

export type AuditLogsController = ReturnType<typeof makeAuditLogsController>;
