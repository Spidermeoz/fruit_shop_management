import { Request, Response, NextFunction } from "express";

export const makeClientReviewsController = (uc: {
  checkReviewed: any;
  createReview: any;
  listByProduct: any;
  listMyReviews: any;
}) => {
  return {
    // POST /client/reviews
    create: async (req: Request, res: Response, next: NextFunction) => {
      try {
        const userId = req.user!.id;
        const { productId, orderId, rating, content } = req.body;

        const review = await uc.createReview.execute(userId, {
          productId,
          orderId,
          rating,
          content,
        });

        res.json({ success: true, data: review });
      } catch (e) {
        next(e);
      }
    },

    // GET /client/reviews/product/:productId
    listByProduct: async (req: Request, res: Response, next: NextFunction) => {
      try {
        const productId = Number(req.params.productId);
        const list = await uc.listByProduct.execute(productId);

        res.json({ success: true, data: list });
      } catch (e) {
        next(e);
      }
    },

    // GET /client/reviews/me
    listMine: async (req: Request, res: Response, next: NextFunction) => {
      try {
        const userId = req.user!.id;
        const list = await uc.listMyReviews.execute(userId);

        res.json({ success: true, data: list });
      } catch (e) {
        next(e);
      }
    },

    check: async (req: Request, res: Response, next: NextFunction) => {
      try {
        const userId = req.user!.id;
        const orderId = Number(req.query.orderId);
        const productId = Number(req.query.productId);

        const reviewed = await uc.checkReviewed.execute(
          userId,
          orderId,
          productId
        );

        res.json({ success: true, reviewed });
      } catch (e) {
        next(e);
      }
    },
  };
};

export type ClientReviewsController = ReturnType<
  typeof makeClientReviewsController
>;
