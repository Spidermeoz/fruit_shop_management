import { Request, Response, NextFunction } from "express";

export const makeClientOrdersController = (uc: {
  createFromCart: any;
  myOrders: any;
  myOrderDetail: any;
  cancelMyOrder: any;
}) => {
  return {
    // POST /client/orders/checkout
    checkout: async (req: Request, res: Response, next: NextFunction) => {
      try {
        const userId = req.user!.id;
        const result = await uc.createFromCart.execute(userId, req.body);

        res.json({
          success: true,
          data: result,
        });
      } catch (e) {
        next(e);
      }
    },

    // GET /client/orders
    list: async (req: Request, res: Response, next: NextFunction) => {
      try {
        const userId = req.user!.id;
        const { page, limit } = req.query;

        const data = await uc.myOrders.execute(userId, {
          page: page ? Number(page) : 1,
          limit: limit ? Number(limit) : 10,
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

    // GET /client/orders/:id
    detail: async (req: Request, res: Response, next: NextFunction) => {
      try {
        const userId = req.user!.id;
        const id = Number(req.params.id);

        const order = await uc.myOrderDetail.execute(userId, id);

        res.json({
          success: true,
          data: order.props,
        });
      } catch (e) {
        next(e);
      }
    },

    // POST /client/orders/:id/cancel
    cancel: async (req: Request, res: Response, next: NextFunction) => {
      try {
        const userId = req.user!.id;
        const id = Number(req.params.id);

        await uc.cancelMyOrder.execute(userId, id);

        res.json({
          success: true,
          data: true,
        });
      } catch (e) {
        next(e);
      }
    },
  };
};

export type ClientOrdersController = ReturnType<
  typeof makeClientOrdersController
>;
