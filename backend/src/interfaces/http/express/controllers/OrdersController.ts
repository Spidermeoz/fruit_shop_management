import { Request, Response, NextFunction } from "express";

export const makeOrdersController = (uc: {
  list: any;
  detail: any;
  updateStatus: any;
  addDeliveryStatus: any;
  addPayment: any;
}) => {
  return {
    // GET /admin/orders
    list: async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { page, limit, q, status, userId } = req.query as Record<
          string,
          string
        >;

        const data = await uc.list.execute({
          page: page ? Number(page) : 1,
          limit: limit ? Number(limit) : 10,
          q,
          status,
          userId: userId ? Number(userId) : undefined,
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

    // GET /admin/orders/detail/:id
    detail: async (req: Request, res: Response, next: NextFunction) => {
      try {
        const id = Number(req.params.id);
        const order = await uc.detail.execute(id);

        res.json({
          success: true,
          data: order.props,
        });
      } catch (e) {
        next(e);
      }
    },

    // PATCH /admin/orders/:id/status
    updateStatus: async (req: Request, res: Response, next: NextFunction) => {
      try {
        const id = Number(req.params.id);
        const { status } = req.body;

        await uc.updateStatus.execute(id, status);

        res.json({
          success: true,
          data: true,
        });
      } catch (e) {
        next(e);
      }
    },

    // POST /admin/orders/:id/delivery
    addDelivery: async (req: Request, res: Response, next: NextFunction) => {
      try {
        const id = Number(req.params.id);

        await uc.addDeliveryStatus.execute(id, req.body);

        res.json({
          success: true,
          data: true,
        });
      } catch (e) {
        next(e);
      }
    },

    // POST /admin/orders/:id/payment
    addPayment: async (req: Request, res: Response, next: NextFunction) => {
      try {
        const orderId = Number(req.params.id);
        const { amount } = req.body;

        if (!amount) {
          return res.status(400).json({
            success: false,
            message: "Vui lòng nhập số tiền thanh toán",
          });
        }

        const result = await uc.addPayment.execute({ orderId, amount });

        // Lấy lại order mới nhất
        const order = await uc.detail.execute(orderId);

        return res.json({
          success: true,
          message: "Xác nhận thanh toán thành công",
          data: order,
        });
      } catch (e) {
        next(e);
      }
    },
  };
};

export type OrdersController = ReturnType<typeof makeOrdersController>;
