import { Router } from "express";
import type { UsersController } from "../controllers/UsersController";

export const usersRoutes = (controller: UsersController) => {
  const r = Router();

  r.get("/", controller.list);
  r.get("/detail/:id", controller.detail);
  r.post("/create", controller.create);
  r.get("/edit/:id", controller.getEdit);
  r.patch("/edit/:id", controller.edit);
  r.patch("/:id/status", controller.updateStatus);
  r.delete("/delete/:id", controller.softDelete);
  r.patch("/bulk-edit", controller.bulkEdit);

  return r;
};
