import { Router } from "express";
import type { ProductCategoriesController } from "../controllers/ProductCategoriesController";

type CanFn = (moduleKey: string, actionKey: string) => any;

export const productCategoriesRoutes = (
  controller: ProductCategoriesController,
  auth: any,
  can: CanFn
) => {
  const r = Router();

  r.get("/", auth, can("product_category", "view"), controller.list);
  r.get("/detail/:id", auth, can("product_category", "view"), controller.detail);

  r.post("/create", auth, can("product_category", "create"), controller.create);
  r.get("/edit/:id", auth, can("product_category", "edit"), controller.getEdit);
  r.patch("/edit/:id", auth, can("product_category", "edit"), controller.edit);
  r.patch("/:id/status", auth, can("product_category", "edit"), controller.changeStatus);
  r.delete("/delete/:id", auth, can("product_category", "delete"), controller.softDelete);

  r.patch("/bulk-edit", auth, can("product_category", "edit"), controller.bulkEdit);

  return r;
};
