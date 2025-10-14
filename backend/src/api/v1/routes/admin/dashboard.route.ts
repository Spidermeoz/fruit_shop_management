import { Router } from "express";

import * as controller from "../../controllers/admin/dashboard.controller";

const router: Router = Router();

router.get("/", controller.dashboard);

export const dashboardRoutes: Router = router;