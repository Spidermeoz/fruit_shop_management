import { Router, Request, Response } from "express";
import * as controller from "../../controllers/client/product.controller";

const router: Router = Router();

router.get("/", controller.index);
router.get("/detail/:id", controller.detail);

export const productRoutes: Router = router;
