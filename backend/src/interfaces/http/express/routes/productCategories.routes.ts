// src/interfaces/http/express/routes/productCategories.routes.ts
import { Router } from "express";
import type { ProductCategoriesController } from "../controllers/ProductCategoriesController";

export const productCategoriesRoutes = (controller: ProductCategoriesController) => {
  const r = Router();

  r.get("/", controller.list);
  r.get("/detail/:id", controller.detail);
  r.post("/create", controller.create);
  r.get("/edit/:id", controller.getEdit);
  r.patch("/edit/:id", controller.edit);
  r.patch("/:id/status", controller.changeStatus);
  r.delete("/delete/:id", controller.softDelete);
  r.patch("/bulk-edit", controller.bulkEdit);

  return r;
};
