import { Router } from "express";
import type { InventoryController } from "../controllers/InventoryController";

type CanFn = (moduleKey: string, actionKey: string) => any;

export const inventoryRoutes = (
  controller: InventoryController,
  auth: any,
  can: CanFn,
) => {
  const r = Router();

  r.get("/", auth, can("inventory", "view"), controller.list);
  r.patch("/set-stock", auth, can("inventory", "edit"), controller.setStock);

  return r;
};
