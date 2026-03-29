import { Router } from "express";
import type { ShippingZonesController } from "../controllers/ShippingZonesController";

type CanFn = (moduleKey: string, actionKey: string) => any;

export const shippingZonesRoutes = (
  controller: ShippingZonesController,
  auth: any,
  can: CanFn,
) => {
  const r = Router();

  r.get("/", auth, can("shipping_zone", "view"), controller.list);
  r.get("/detail/:id", auth, can("shipping_zone", "view"), controller.detail);

  r.post("/create", auth, can("shipping_zone", "create"), controller.create);
  r.get("/edit/:id", auth, can("shipping_zone", "edit"), controller.getEdit);
  r.patch("/edit/:id", auth, can("shipping_zone", "edit"), controller.edit);
  r.patch(
    "/:id/status",
    auth,
    can("shipping_zone", "edit"),
    controller.changeStatus,
  );
  r.delete(
    "/delete/:id",
    auth,
    can("shipping_zone", "delete"),
    controller.softDelete,
  );

  return r;
};
