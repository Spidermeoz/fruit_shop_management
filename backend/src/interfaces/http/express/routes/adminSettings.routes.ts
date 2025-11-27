// src/interfaces/http/express/routes/adminSettings.routes.ts

import { Router } from "express";
import type { SettingsGeneralController } from "../controllers/SettingsGeneralController";
import { uploadMulter } from "../middlewares/multer"; // ✔ đúng middleware thật

type CanFn = (module: string, action: string) => any;

export const adminSettingsRoutes = (
controller: SettingsGeneralController, auth: any, can: CanFn) => {
  const r = Router();

  r.get("/general", auth, can("setting", "view"), controller.getGeneral);

  r.patch(
    "/general",
    auth,
    can("setting", "update"),
    uploadMulter.single("logo"), // ✔ dùng đúng middleware của bạn
    controller.updateGeneral
  );

  return r;
};
