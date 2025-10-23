import { Router } from "express";

import * as controller from "../../controllers/admin/role.controller";

const router: Router = Router();

router.get("/", controller.index);
router.get("/detail/:id", controller.detail);
router.post("/create", controller.create);
router.get("/edit/:id", controller.edit);
router.patch("/edit/:id", controller.editPatch);
router.delete("/delete/:id", controller.deleteRole);
router.get("/permissions", controller.permissions);
router.patch("/permissions", controller.permissionsPatch);

export const roleRoutes: Router = router;