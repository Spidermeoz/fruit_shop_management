import { Request, Response, NextFunction } from "express";



const getActorId = (req: Request): number | null => {
  const user = (req as any).user ?? (req as any).authUser ?? null;
  const rawId = user?.id ?? user?.userId ?? user?.adminId ?? user?.sub ?? null;

  const num = Number(rawId);
  return Number.isInteger(num) && num > 0 ? num : null;
};

const buildActor = (req: Request) => ({
  id: getActorId(req),
  roleId:
    (req as any)?.user?.roleId ??
    (req as any)?.authUser?.roleId ??
    null,
  roleCode:
    (req as any)?.user?.roleCode ??
    (req as any)?.authUser?.roleCode ??
    null,
  roleLevel:
    (req as any)?.user?.roleLevel ??
    (req as any)?.authUser?.roleLevel ??
    null,
  isSuperAdmin:
    (req as any)?.user?.isSuperAdmin === true ||
    (req as any)?.authUser?.isSuperAdmin === true,
  branchIds:
    (req as any)?.user?.branchIds ??
    (req as any)?.authUser?.branchIds ??
    [],
  requestId: (req as any)?.requestId ?? null,
  ipAddress: req.ip ?? null,
  userAgent: req.get("user-agent") ?? null,
});

export const makePromotionsController = (uc: {
  list: any;
  detail: any;
  create: any;
  edit: any;
  changeStatus: any;
  softDelete: any;
  validateCode: any;
  listUsages: any;
}) => {
  return {
    list: async (req: Request, res: Response, next: NextFunction) => {
      try {
        const {
          page,
          limit,
          q,
          status,
          promotionScope,
          isAutoApply,
          includeDeleted,
        } = req.query;

        const data = await uc.list.execute({
          page: page ? Number(page) : 1,
          limit: limit ? Number(limit) : 10,
          q: q ? String(q) : undefined,
          status: status ? String(status) : "all",
          promotionScope: promotionScope ? String(promotionScope) : "all",
          isAutoApply:
            isAutoApply !== undefined ? String(isAutoApply) === "true" : null,
          includeDeleted:
            includeDeleted !== undefined
              ? String(includeDeleted) === "true"
              : false,
        });

        res.json({
          success: true,
          data: data.rows,
          meta: {
            total: data.count,
            page: Number(page ?? 1),
            limit: Number(limit ?? 10),
          },
        });
      } catch (e) {
        next(e);
      }
    },

    detail: async (req: Request, res: Response, next: NextFunction) => {
      try {
        const id = Number(req.params.id);
        const data = await uc.detail.execute(id);

        res.json({
          success: true,
          data,
        });
      } catch (e) {
        next(e);
      }
    },

    create: async (req: Request, res: Response, next: NextFunction) => {
      try {
        const data = await (uc.create.execute as any)(req.body, buildActor(req));

        res.status(201).json({
          success: true,
          data,
          message: "Tạo khuyến mãi thành công",
        });
      } catch (e) {
        next(e);
      }
    },

    edit: async (req: Request, res: Response, next: NextFunction) => {
      try {
        const id = Number(req.params.id);
        const data = await (uc.edit.execute as any)(id, req.body, buildActor(req));

        res.json({
          success: true,
          data,
          message: "Cập nhật khuyến mãi thành công",
        });
      } catch (e) {
        next(e);
      }
    },

    changeStatus: async (req: Request, res: Response, next: NextFunction) => {
      try {
        const id = Number(req.params.id);
        const status = String(req.body?.status ?? "");

        await (uc.changeStatus.execute as any)(id, status, buildActor(req));

        res.json({
          success: true,
          message: "Cập nhật trạng thái khuyến mãi thành công",
        });
      } catch (e) {
        next(e);
      }
    },

    softDelete: async (req: Request, res: Response, next: NextFunction) => {
      try {
        const id = Number(req.params.id);

        await (uc.softDelete.execute as any)(id, buildActor(req));

        res.json({
          success: true,
          message: "Xóa mềm khuyến mãi thành công",
        });
      } catch (e) {
        next(e);
      }
    },

    validateCode: async (req: Request, res: Response, next: NextFunction) => {
      try {
        const userId =
          req.user?.id !== undefined && req.user?.id !== null
            ? Number(req.user.id)
            : Number(req.body?.userId);

        const { promotionCode, subtotal, now } = req.body ?? {};

        const data = await uc.validateCode.execute({
          userId,
          promotionCode,
          subtotal,
          now: now ? new Date(now) : undefined,
        });

        res.json({
          success: true,
          data,
        });
      } catch (e) {
        next(e);
      }
    },

    listUsages: async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { promotionId, userId, orderId, page, limit } = req.query;

        const data = await uc.listUsages.execute({
          promotionId:
            promotionId !== undefined ? Number(promotionId) : undefined,
          userId: userId !== undefined ? Number(userId) : undefined,
          orderId: orderId !== undefined ? Number(orderId) : undefined,
          page: page !== undefined ? Number(page) : 1,
          limit: limit !== undefined ? Number(limit) : 20,
        });

        res.json({
          success: true,
          data: data.rows,
          meta: {
            total: data.count,
            page: Number(page ?? 1),
            limit: Number(limit ?? 20),
          },
        });
      } catch (e) {
        next(e);
      }
    },
  };
};

export type PromotionsController = ReturnType<typeof makePromotionsController>;
