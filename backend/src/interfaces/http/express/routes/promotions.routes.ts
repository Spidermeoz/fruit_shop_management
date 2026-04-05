import { Router } from "express";
import type { PromotionsController } from "../controllers/PromotionsController";
type CanFn = (moduleKey: string, actionKey: string) => any;

export const promotionsRoutes = (
  controller: PromotionsController,
  auth: any,
  can: CanFn,
) => {
  const r = Router();

  r.get("/", auth, can("promotion", "view"), controller.list);
  r.get("/usages", auth, can("promotion", "view"), controller.listUsages);
  r.post("/validate-code", auth, can("promotion", "create"), controller.validateCode);
  r.get("/:id", auth, can("promotion", "view"), controller.detail);
  r.post("/", auth, can("promotion", "create"), controller.create);
  r.put("/:id", auth, can("promotion", "edit"), controller.edit);
  r.patch("/:id/status", auth, can("promotion", "edit"), controller.changeStatus);
  r.delete("/:id", auth, can("promotion", "delete"), controller.softDelete);

  return r;
};
