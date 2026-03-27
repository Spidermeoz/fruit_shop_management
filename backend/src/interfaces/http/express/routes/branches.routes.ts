import { Router } from "express";
import type { BranchesController } from "../controllers/BranchesController";

type CanFn = (moduleKey: string, actionKey: string) => any;

export const branchesRoutes = (
  controller: BranchesController,
  auth: any,
  can: CanFn,
) => {
  const r = Router();

  r.get("/", auth, can("branch", "view"), controller.list);
  r.get("/detail/:id", auth, can("branch", "view"), controller.detail);

  r.post("/create", auth, can("branch", "create"), controller.create);
  r.get("/edit/:id", auth, can("branch", "edit"), controller.getEdit);
  r.patch("/edit/:id", auth, can("branch", "edit"), controller.edit);
  r.patch("/:id/status", auth, can("branch", "edit"), controller.changeStatus);
  r.delete("/delete/:id", auth, can("branch", "delete"), controller.softDelete);

  return r;
};
