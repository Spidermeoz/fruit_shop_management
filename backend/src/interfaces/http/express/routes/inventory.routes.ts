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
  r.post("/transfer", auth, can("inventory", "edit"), controller.transfer);
  r.get(
    "/transactions",
    auth,
    can("inventory", "view"),
    controller.listTransactions,
  );

  return r;
};
