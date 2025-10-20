import { Router } from "express";
import * as controller from "../../controllers/admin/productCategory.controller";

const router = Router();

router.get("/", controller.index);
router.post("/create", controller.create);
router.get("/detail/:id", controller.detail);
router.get("/edit/:id", controller.editProductCategory);
router.patch("/edit/:id", controller.editPatchProductCategory);
router.patch("/:id/status", controller.updateProductCategoryStatus);
router.delete("/delete/:id", controller.softDeleteProductCategory);

export const productCategoryRoutes = router;
