import { Router } from "express";
import type { AuthController } from "../controllers/AuthController";

export const authRoutes = (controller: AuthController, auth: any) => {
  const r = Router();
  r.post("/login", controller.login);
  r.post("/refresh", controller.refresh);
  r.post("/logout", auth, controller.logout);
  r.get("/me", auth, controller.me);
  return r;
};
