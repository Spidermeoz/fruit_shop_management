// src/interfaces/http/express/routes/upload.routes.ts
import { Router } from "express";
import multer from "multer";
import type { UploadController } from "../controllers/UploadController";

type CanFn = (moduleKey: string, actionKey: string) => any;

export const uploadRoutes = (
  controller: UploadController,
  auth: any,
  can: CanFn
) => {
  const r = Router();

  const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB (chỉnh tuỳ ý)
  });

  // Cho phép upload khi có quyền tạo/sửa product
  r.post("/", auth, can("product", "create"), upload.single("file"), controller.upload);

  return r;
};
