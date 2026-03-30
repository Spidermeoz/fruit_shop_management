import { Router } from "express";
import type { BranchDeliverySlotCapacitiesController } from "../controllers/BranchDeliverySlotCapacitiesController";

export function branchDeliverySlotCapacitiesRoutes(
  controller: BranchDeliverySlotCapacitiesController,
  auth: any,
  can: any,
) {
  const router = Router();

  router.get(
    "/",
    auth,
    can("branch_delivery_slot_capacity", "view"),
    controller.list,
  );

  router.post(
    "/create",
    auth,
    can("branch_delivery_slot_capacity", "create"),
    controller.create,
  );

  router.get(
    "/detail/:id",
    auth,
    can("branch_delivery_slot_capacity", "view"),
    controller.detail,
  );

  router.get(
    "/edit/:id",
    auth,
    can("branch_delivery_slot_capacity", "view"),
    controller.detail,
  );

  router.patch(
    "/edit/:id",
    auth,
    can("branch_delivery_slot_capacity", "update"),
    controller.edit,
  );

  router.patch(
    "/:id/status",
    auth,
    can("branch_delivery_slot_capacity", "update"),
    controller.changeStatus,
  );

  router.delete(
    "/delete/:id",
    auth,
    can("branch_delivery_slot_capacity", "delete"),
    controller.softDelete,
  );

  return router;
}
