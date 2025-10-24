// src/interfaces/http/express/routes/upload.routes.ts
import { Router } from "express";
import type { UploadController } from "../controllers/UploadController";
import { uploadMulter } from "../middlewares/multer";

export const uploadRoutes = (controller: UploadController) => {
  const r = Router();

  // giữ nguyên semantics: field tên 'file'
  r.post("/", uploadMulter.single("file"), controller.upload);

  return r;
};
