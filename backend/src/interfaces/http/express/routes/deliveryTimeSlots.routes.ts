import { Router } from "express";
import type { DeliveryTimeSlotsController } from "../controllers/DeliveryTimeSlotsController";

export function deliveryTimeSlotsRoutes(
  controller: DeliveryTimeSlotsController,
  auth: any,
  can: any,
) {
  const router = Router();

  router.get("/", auth, can("delivery_time_slot", "view"), controller.list);

  router.post(
    "/create",
    auth,
    can("delivery_time_slot", "create"),
    controller.create,
  );

  router.get(
    "/detail/:id",
    auth,
    can("delivery_time_slot", "view"),
    controller.detail,
  );

  router.get(
    "/edit/:id",
    auth,
    can("delivery_time_slot", "view"),
    controller.detail,
  );

  router.patch(
    "/edit/:id",
    auth,
    can("delivery_time_slot", "edit"),
    controller.edit,
  );

  router.patch(
    "/:id/status",
    auth,
    can("delivery_time_slot", "edit"),
    controller.changeStatus,
  );

  router.delete(
    "/delete/:id",
    auth,
    can("delivery_time_slot", "delete"),
    controller.softDelete,
  );

  return router;
}
