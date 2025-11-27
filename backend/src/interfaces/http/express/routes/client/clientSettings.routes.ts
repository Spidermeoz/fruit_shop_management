// src/interfaces/http/express/routes/client/clientSettings.routes.ts

import { Router } from "express";
import type { SettingsGeneralController } from "../../controllers/SettingsGeneralController";

export const clientSettingsRoutes = (controller: SettingsGeneralController) => {
  const r = Router();

  // Client GET general settings
  r.get("/general", controller.getGeneral);

  return r;
};
