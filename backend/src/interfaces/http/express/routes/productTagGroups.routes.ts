import { Router } from "express";
import type { ProductTagGroupsController } from "../controllers/ProductTagGroupsController";

type CanFn = (moduleKey: string, actionKey: string) => any;

export const productTagGroupsRoutes = (
  controller: ProductTagGroupsController,
  auth: any,
  can: CanFn,
) => {
  const r = Router();

  r.get("/", auth, can("product", "view"), controller.list);

  r.post("/create", auth, can("product", "create"), controller.create);
  r.patch("/edit/:id", auth, can("product", "edit"), controller.edit);

  r.delete("/:id", auth, can("product", "delete"), controller.delete);

  return r;
};
