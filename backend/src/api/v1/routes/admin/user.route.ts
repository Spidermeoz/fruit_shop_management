import { Router } from "express";

import * as controller from "../../controllers/admin/user.controller";

const router: Router = Router();

router.get("/", controller.index);
router.get("/detail/:id", controller.detail);
router.post("/create", controller.create);
router.get("/edit/:id", controller.edit);
router.patch("/edit/:id", controller.editPatch);
router.patch("/:id/status", controller.updateStatus);
router.delete("/delete/:id", controller.deleteUser);
router.patch("/bulk-edit", controller.bulkEdit);

export const userRoutes: Router = router;