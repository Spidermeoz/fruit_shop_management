import express from "express";
import { uploadImage } from "../../controllers/admin/upload.controller";

const router = express.Router();

// POST /api/v1/admin/upload
router.post("/", uploadImage);

export default router;
