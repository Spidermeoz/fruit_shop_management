import { Router } from "express";
import * as controller from "../../controllers/admin/productCategory.controller";

const router = Router();

router.get("/", controller.index);

export const productCategoryRoutes = router;
