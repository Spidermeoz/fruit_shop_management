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
  router.get(
    "/planner",
    auth,
    can("branch_delivery_slot_capacity", "view"),
    controller.planner,
  );
  router.post(
    "/create",
    auth,
    can("branch_delivery_slot_capacity", "create"),
    controller.create,
  );
  router.post(
    "/bulk-upsert",
    auth,
    can("branch_delivery_slot_capacity", "create"),
    controller.bulkUpsert,
  );
  router.post(
    "/copy-from-date",
    auth,
    can("branch_delivery_slot_capacity", "create"),
    controller.copyFromDate,
  );
  router.post(
    "/generate-from-defaults",
    auth,
    can("branch_delivery_slot_capacity", "create"),
    controller.generateFromDefaults,
  );
  router.patch(
    "/bulk/status",
    auth,
    can("branch_delivery_slot_capacity", "edit"),
    controller.bulkChangeStatus,
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
    can("branch_delivery_slot_capacity", "edit"),
    controller.edit,
  );
  router.patch(
    "/:id/status",
    auth,
    can("branch_delivery_slot_capacity", "edit"),
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
