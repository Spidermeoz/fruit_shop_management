import { Router } from "express";
import * as controller from "../../controllers/admin/productCategory.controller";

const router = Router();

router.get("/", controller.index);
router.post("/create", controller.create);

export const productCategoryRoutes = router;
