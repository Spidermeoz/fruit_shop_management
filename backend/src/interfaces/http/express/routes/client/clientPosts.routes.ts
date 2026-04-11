import { Router } from "express";
import type { ClientPostsController } from "../../controllers/client/ClientPostsController";

export const clientPostsRoutes = (controller: ClientPostsController) => {
  const r = Router();

  r.get("/", controller.list);
  r.get("/related-by-product/:productId", controller.relatedByProduct);
  r.get("/:slug", controller.detail);

  return r;
};
