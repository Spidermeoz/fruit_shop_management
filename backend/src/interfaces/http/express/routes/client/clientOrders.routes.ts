import { Router } from "express";
import type { ClientOrdersController } from "../../controllers/client/ClientOrdersController";

export const clientOrdersRoutes = (
  controller: ClientOrdersController,
  auth: any
) => {
  const r = Router();

  r.post("/checkout", auth, controller.checkout);
  r.get("/", auth, controller.list);
  r.get("/:id", auth, controller.detail);
  r.post("/:id/cancel", auth, controller.cancel);

  return r;
};
