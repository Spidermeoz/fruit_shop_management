import { Router } from "express";
import type { BranchServiceAreasController } from "../controllers/BranchServiceAreasController";

type CanFn = (moduleKey: string, actionKey: string) => any;

export const branchServiceAreasRoutes = (
  controller: BranchServiceAreasController,
  auth: any,
  can: CanFn,
) => {
  const r = Router();
  r.get("/", auth, can("branch_service_area", "view"), controller.list);
  r.get(
    "/detail/:id",
    auth,
    can("branch_service_area", "view"),
    controller.detail,
  );
  r.get(
    "/setup-checklist",
    auth,
    can("branch_service_area", "view"),
    controller.checklist,
  );
  r.post(
    "/create",
    auth,
    can("branch_service_area", "create"),
    controller.create,
  );
  r.post(
    "/bulk-upsert",
    auth,
    can("branch_service_area", "create"),
    controller.bulkUpsert,
  );
  r.post(
    "/copy-from-branch",
    auth,
    can("branch_service_area", "create"),
    controller.copyFromBranch,
  );
  r.patch(
    "/bulk/status",
    auth,
    can("branch_service_area", "edit"),
    controller.bulkChangeStatus,
  );
  r.get(
    "/edit/:id",
    auth,
    can("branch_service_area", "edit"),
    controller.getEdit,
  );
  r.patch(
    "/edit/:id",
    auth,
    can("branch_service_area", "edit"),
    controller.edit,
  );
  r.patch(
    "/:id/status",
    auth,
    can("branch_service_area", "edit"),
    controller.changeStatus,
  );
  r.delete(
    "/delete/:id",
    auth,
    can("branch_service_area", "delete"),
    controller.softDelete,
  );
  return r;
};
