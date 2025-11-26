import { Request, Response, NextFunction } from "express";

export const makeAdminReviewsController = (uc: {
  getPendingReviewSummary: any;
  replyReview: any;
  listByProduct: any;
}) => {
  return {
    // POST /admin/reviews/:id/reply
    reply: async (req: Request, res: Response, next: NextFunction) => {
      try {
        const adminId = req.user!.id;
        const parentId = Number(req.params.id);
        const { content } = req.body;

        const reply = await uc.replyReview.execute(adminId, {
          parentId,
          content,
        });

        res.json({ success: true, data: reply });
      } catch (e) {
        next(e);
      }
    },

    // GET /admin/reviews/product/:productId
    listByProduct: async (req: Request, res: Response, next: NextFunction) => {
      try {
        const productId = Number(req.params.productId);
        const list = await uc.listByProduct.execute(productId);

        res.json({ success: true, data: list });
      } catch (e) {
        next(e);
      }
    },

    async getPendingSummary(req: Request, res: Response) {
      try {
        const result = await uc.getPendingReviewSummary.execute();

        res.json({
          success: true,
          data: result,
        });
      } catch (err: any) {
        console.error("getPendingSummary error:", err);
        res.status(500).json({ success: false, message: err.message });
      }
    },
  };
};

export type AdminReviewsController = ReturnType<
  typeof makeAdminReviewsController
>;
