import { Request, Response, NextFunction } from "express";

export const makeClientReviewsController = (uc: {
  checkReviewed: any;
  createReview: any;
  listByProduct: any;
  listMyReviews: any;
}) => {
  return {
    create: async (req: Request, res: Response, next: NextFunction) => {
      try {
        const userId = req.user!.id;
        const { productId, productVariantId, orderId, rating, content } =
          req.body;

        const review = await uc.createReview.execute(userId, {
          productId: Number(productId),
          productVariantId:
            productVariantId !== undefined && productVariantId !== null
              ? Number(productVariantId)
              : null,
          orderId: Number(orderId),
          rating,
          content,
        });

        res.json({ success: true, data: review });
      } catch (e) {
        next(e);
      }
    },

    listByProduct: async (req: Request, res: Response, next: NextFunction) => {
      try {
        const productId = Number(req.params.productId);
        const list = await uc.listByProduct.execute(productId);

        res.json({ success: true, data: list });
      } catch (e) {
        next(e);
      }
    },

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
        const productVariantId =
          req.query.productVariantId !== undefined &&
          req.query.productVariantId !== null &&
          req.query.productVariantId !== ""
            ? Number(req.query.productVariantId)
            : null;

        const reviewed = await uc.checkReviewed.execute(
          userId,
          orderId,
          productId,
          productVariantId,
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
