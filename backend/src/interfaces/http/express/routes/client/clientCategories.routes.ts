import { Router } from "express";
import { clientControllers } from "../../../../../config/di/container";

const router = Router();

// GET /api/v1/client/categories
router.get("/", clientControllers.categories.list);

export default router;
