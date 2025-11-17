import { Router } from "express";
import type { OrdersController } from "../controllers/OrdersController";

type CanFn = (moduleKey: string, actionKey: string) => any;

export const ordersRoutes = (
  controller: OrdersController,
  auth: any,
  can: CanFn
) => {
  const r = Router();

  r.get("/", auth, can("orders", "view"), controller.list);
  r.get("/detail/:id", auth, can("orders", "view"), controller.detail);

  r.patch("/:id/status", auth, can("orders", "edit"), controller.updateStatus);
  r.post("/:id/delivery", auth, can("orders", "edit"), controller.addDelivery);
  r.post("/:id/payment", auth, can("orders", "edit"), controller.addPayment);

  return r;
};
