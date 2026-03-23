import { Router } from "express";
import type { OriginsController } from "../controllers/OriginsController";

type CanFn = (moduleKey: string, actionKey: string) => any;

export const originsRoutes = (
  controller: OriginsController,
  auth: any,
  can: CanFn,
) => {
  const r = Router();

  r.get("/", auth, can("product", "view"), controller.list);
  r.get("/detail/:id", auth, can("product", "view"), controller.detail);
  r.post("/create", auth, can("product", "create"), controller.create);
  r.delete("/:id", auth, can("product", "delete"), controller.softDelete);
  r.post("/bulk-delete", auth, can("product", "delete"), controller.bulkDelete);
  r.get("/edit/:id", auth, can("product", "edit"), controller.getEdit);
  r.patch("/edit/:id", auth, can("product", "edit"), controller.edit);
  r.patch("/:id/status", auth, can("product", "edit"), controller.changeStatus);

  return r;
};
