import { Router } from "express";
import multer from "multer";
import type { UploadController } from "../../controllers/UploadController";

export const clientUploadRoutes = (controller: UploadController, auth: any) => {
  const r = Router();

  const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 },
  });

  r.post("/", auth, upload.single("file"), controller.upload);

  return r;
};
