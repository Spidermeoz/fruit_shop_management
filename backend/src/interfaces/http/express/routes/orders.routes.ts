import { Router } from "express";
import type { OrdersController } from "../controllers/OrdersController";

type CanFn = (moduleKey: string, actionKey: string) => any;

export const ordersRoutes = (
  controller: OrdersController,
  auth: any,
  can: CanFn,
) => {
  const r = Router();

  r.get("/", auth, can("order", "view"), controller.list);
  r.get("/detail/:id", auth, can("order", "view"), controller.detail);

  r.patch(
    "/:id/status",
    auth,
    can("order", "update_status"),
    controller.updateStatus,
  );

  r.post(
    "/:id/delivery",
    auth,
    can("order", "add_history"),
    controller.addDelivery,
  );

  r.post(
    "/:id/payment",
    auth,
    can("order", "add_payment"),
    controller.addPayment,
  );

  return r;
};
