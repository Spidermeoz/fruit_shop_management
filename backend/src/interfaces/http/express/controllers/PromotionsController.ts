import { Request, Response, NextFunction } from "express";

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
        const data = await uc.create.execute(req.body);

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
        const data = await uc.edit.execute(id, req.body);

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

        await uc.changeStatus.execute(id, status);

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

        await uc.softDelete.execute(id);

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
