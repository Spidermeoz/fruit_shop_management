import { Router } from "express";
import type { UsersController } from "../controllers/UsersController";

type CanFn = (moduleKey: string, actionKey: string) => any;

export const usersRoutes = (
  controller: UsersController,
  auth: any,
  can: CanFn
) => {
  const r = Router();

  r.get("/", auth, can("user", "view"), controller.list);
  r.get("/detail/:id", auth, can("user", "view"), controller.detail);

  r.post("/create", auth, can("user", "create"), controller.create);
  r.get("/edit/:id", auth, can("user", "edit"), controller.getEdit);
  r.patch("/edit/:id", auth, can("user", "edit"), controller.edit);
  r.patch("/:id/status", auth, can("user", "edit"), controller.updateStatus);
  r.delete("/delete/:id", auth, can("user", "delete"), controller.softDelete);

  r.patch("/bulk-edit", auth, can("user", "edit"), controller.bulkEdit);

  return r;
};
