import { Router, RequestHandler } from "express";
import type { ClientAuthController } from "../../controllers/client/ClientAuthController";

export const clientAuthRoutes = (
  controller: ClientAuthController,
  authMiddleware: RequestHandler
) => {
  const r = Router();

  // Đăng ký tài khoản
  r.post("/register", controller.register);

  // Đăng nhập
  r.post("/login", controller.login);

  // Làm mới token
  r.post("/refresh", controller.refresh);

  // Lấy thông tin người dùng hiện tại (cần token)
  r.get("/me", authMiddleware, controller.me);

  // Đăng xuất
  r.post("/logout", controller.logout);

  r.post("/change-password", authMiddleware, controller.changePassword);

  r.patch("/profile", authMiddleware, controller.updateProfile);

  return r;
};

export default clientAuthRoutes;
