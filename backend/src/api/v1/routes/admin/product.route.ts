import { Router } from "express";

import * as controller from "../../controllers/admin/product.controller";

const router: Router = Router();

router.get("/", controller.index);
router.get("/detail/:id", controller.detail);
router.post("/create", controller.createProduct);

export const productRoutes: Router = router;