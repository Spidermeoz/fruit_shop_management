import { Router } from "express";
import type { ClientProductsController } from "../../controllers/client/ClientProductsController";

export const clientProductsRoutes = (controller: ClientProductsController) => {
  const r = Router();

  r.get("/", controller.list);
  r.get("/:id", controller.detail);

  return r;
};
