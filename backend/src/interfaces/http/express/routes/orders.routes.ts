import { Router } from "express";
import type { OrdersController } from "../controllers/OrdersController";

type CanFn = (moduleKey: string, actionKey: string) => any;

export const ordersRoutes = (
  controller: OrdersController,
  auth: any,
  can: CanFn
) => {
  const r = Router();

  // LIST + DETAIL
  r.get("/", auth, can("order", "view"), controller.list);
  r.get("/detail/:id", auth, can("order", "view"), controller.detail);

  // UPDATE STATUS
  r.patch("/:id/status", auth, can("order", "update_status"), controller.updateStatus);

  // ADD DELIVERY HISTORY
  r.post("/:id/delivery", auth, can("order", "add_history"), controller.addDelivery);

  // ADD PAYMENT
  r.post("/:id/payment", auth, can("order", "add_payment"), controller.addPayment);

  return r;
};
