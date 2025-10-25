// src/interfaces/http/express/routes/roles.routes.ts
import { Router } from "express";
import type { RolesController } from "../controllers/RolesController";

export const rolesRoutes = (controller: RolesController) => {
  const r = Router();

  // CRUD
  r.get("/", controller.list);
  r.get("/detail/:id", controller.detail);
  r.post("/create", controller.create);
  r.get("/edit/:id", controller.getEdit);
  r.patch("/edit/:id", controller.edit);
  r.delete("/delete/:id", controller.softDelete);

  // Permissions
  r.get("/permissions", controller.permissionsMatrix);
  r.patch("/permissions", controller.permissionsPatchMatrix);

  return r;
};
