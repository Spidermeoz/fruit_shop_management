import { Router } from "express";
import type { ProductsController } from "../controllers/ProductsController";

type CanFn = (moduleKey: string, actionKey: string) => any;

export const productsRoutes = (
  controller: ProductsController,
  auth: any,
  can: CanFn
) => {
  const r = Router();

  r.get("/", auth, can("product", "view"), controller.list);
  r.get("/detail/:id", auth, can("product", "view"), controller.detail);

  r.post("/create", auth, can("product", "create"), controller.create);
  r.get("/edit/:id", auth, can("product", "edit"), controller.getEdit);
  r.patch("/edit/:id", auth, can("product", "edit"), controller.edit);
  r.patch("/:id/status", auth, can("product", "edit"), controller.changeStatus);
  r.delete("/delete/:id", auth, can("product", "delete"), controller.softDelete);
  r.patch("/bulk-edit", auth, can("product", "edit"), controller.bulkEdit);

  return r;
};
