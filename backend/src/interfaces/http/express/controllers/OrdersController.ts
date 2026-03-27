import { Request, Response, NextFunction } from "express";

export const makeOrdersController = (uc: {
  list: any;
  detail: any;
  updateStatus: any;
  addDeliveryStatus: any;
  addPayment: any;
}) => {
  return {
    list: async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { page, limit, q, status, userId, branchId, fulfillmentType } =
          req.query as Record<string, string>;

        const data = await uc.list.execute(
          {
            page: page ? Number(page) : 1,
            limit: limit ? Number(limit) : 10,
            q,
            status,
            userId: userId ? Number(userId) : undefined,
            branchId: branchId ? Number(branchId) : undefined,
            fulfillmentType: fulfillmentType || undefined,
          },
          req.user,
        );

        res.json({
          success: true,
          data: data.rows.map((row: any) => row.props ?? row),
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
        const order = await uc.detail.execute(id, req.user);

        res.json({
          success: true,
          data: order.props ?? order,
        });
      } catch (e) {
        next(e);
      }
    },

    updateStatus: async (req: Request, res: Response, next: NextFunction) => {
      try {
        const id = Number(req.params.id);
        const { status } = req.body;

        await uc.updateStatus.execute(id, status, req.user);

        const order = await uc.detail.execute(id, req.user);

        res.json({
          success: true,
          data: order.props ?? order,
        });
      } catch (e) {
        next(e);
      }
    },

    addDelivery: async (req: Request, res: Response, next: NextFunction) => {
      try {
        const id = Number(req.params.id);

        const orderBefore = await uc.detail.execute(id, req.user);

        if (
          req.user?.branchIds?.length &&
          orderBefore.props.branchId &&
          !req.user.branchIds.includes(Number(orderBefore.props.branchId))
        ) {
          return res.status(403).json({
            success: false,
            message: "Forbidden: branch scope denied",
          });
        }

        await uc.addDeliveryStatus.execute(id, req.body);

        const order = await uc.detail.execute(id, req.user);

        res.json({
          success: true,
          data: order.props ?? order,
        });
      } catch (e) {
        next(e);
      }
    },

    addPayment: async (req: Request, res: Response, next: NextFunction) => {
      try {
        const orderId = Number(req.params.id);
        const amount = Number(req.body.amount);

        if (!Number.isFinite(amount) || amount <= 0) {
          return res.status(400).json({
            success: false,
            message: "Số tiền thanh toán không hợp lệ",
          });
        }

        const orderBefore = await uc.detail.execute(orderId, req.user);

        if (
          req.user?.branchIds?.length &&
          orderBefore.props.branchId &&
          !req.user.branchIds.includes(Number(orderBefore.props.branchId))
        ) {
          return res.status(403).json({
            success: false,
            message: "Forbidden: branch scope denied",
          });
        }

        await uc.addPayment.execute({ orderId, amount });

        const order = await uc.detail.execute(orderId, req.user);

        return res.json({
          success: true,
          message: "Xác nhận thanh toán thành công",
          data: order.props ?? order,
        });
      } catch (e) {
        next(e);
      }
    },
  };
};

export type OrdersController = ReturnType<typeof makeOrdersController>;
