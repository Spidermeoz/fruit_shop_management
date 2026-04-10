import { Router } from "express";
import type { DashboardController } from "../controllers/DashboardController";

export const dashboardRoutes = (controller: DashboardController, auth: any) => {
  const r = Router();

  // Hiện tại hệ thống chưa có permission "dashboard.view",
  // nên route này chỉ cần auth. Widget nào hiển thị sẽ do backend/frontend tự lọc theo permission.
  r.get("/", auth, controller.summary);

  return r;
};
