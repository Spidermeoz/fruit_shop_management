import { Router } from "express";
import type { RolesController } from "../controllers/RolesController";

type CanFn = (moduleKey: string, actionKey: string) => any;

export const rolesRoutes = (
  controller: RolesController,
  auth: any,
  can: CanFn
) => {
  const r = Router();

  r.get("/", auth, can("role", "view"), controller.list);
  r.get("/detail/:id", auth, can("role", "view"), controller.detail);
  r.post("/create", auth, can("role", "create"), controller.create);
  r.patch("/edit/:id", auth, can("role", "edit"), controller.edit);
  r.get("/edit/:id", auth, can("role", "edit"), controller.getEdit);
  r.delete("/delete/:id", auth, can("role", "delete"), controller.softDelete);

  // permissions
  r.get("/permissions", auth, can("role", "permissions"), controller.permissionsMatrix);
  r.get("/:id/permissions", auth, can("role", "permissions"), controller.getPermissions);
  r.patch("/:id/permissions", auth, can("role", "permissions"), controller.updatePermissions);
  r.patch("/permissions", auth, can("role", "permissions"), controller.permissionsPatchMatrix);

  return r;
};
