import { Router } from "express";
import type { ClientReviewsController } from "../../controllers/client/ClientReviewsController";

export const clientReviewsRoutes = (
  controller: ClientReviewsController,
  auth: any
) => {
  const r = Router();

  // client must be logged in to create
  r.post("/", auth, controller.create);

  // public
  r.get("/product/:productId", controller.listByProduct);

  // client only
  r.get("/me", auth, controller.listMine);

  r.get("/check", auth, controller.check);

  return r;
};
