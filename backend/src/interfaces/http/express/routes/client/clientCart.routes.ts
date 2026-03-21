// src/interfaces/http/express/routes/client/clientCart.routes.ts

import { Router } from "express";
import type { ClientCartController } from "../../controllers/client/ClientCartController";

export const clientCartRoutes = (
  controller: ClientCartController,
  authMiddleware: any,
) => {
  const r = Router();

  r.get("/", authMiddleware, controller.list);

  r.post("/items", authMiddleware, controller.add);

  r.delete("/all-items", authMiddleware, controller.removeAllItems);

  r.patch("/items/:variantId", authMiddleware, controller.update);

  r.delete("/items/:variantId", authMiddleware, controller.remove);

  return r;
};
