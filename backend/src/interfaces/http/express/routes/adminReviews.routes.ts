import { Router } from "express";
import type { AdminReviewsController } from "../controllers/AdminReviewsController";

export const adminReviewsRoutes = (
  controller: AdminReviewsController,
  auth: any,
  can: any
) => {
  const r = Router();

  // admin must have: review.view
  r.get(
    "/product/:productId",
    auth,
    can("review", "view"),
    controller.listByProduct
  );

  // admin must have: review.reply
  r.post("/:id/reply", auth, can("review", "reply"), controller.reply);

  r.get(
    "/pending-summary",
    auth,
    can("review", "reply"),
    controller.getPendingSummary.bind(controller)
  );

  return r;
};
