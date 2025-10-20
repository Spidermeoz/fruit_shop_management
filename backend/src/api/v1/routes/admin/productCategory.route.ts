import { Router } from "express";
import * as controller from "../../controllers/admin/productCategory.controller";

const router = Router();

router.get("/", controller.index);
router.post("/create", controller.create);
router.get("/detail/:id", controller.detail);

export const productCategoryRoutes = router;
