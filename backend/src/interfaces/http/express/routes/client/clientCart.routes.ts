import { Router } from "express";
import type { ClientCartController } from "../../controllers/client/ClientCartController";

export const clientCartRoutes = (
  controller: ClientCartController,
  authMiddleware: any
) => {
  const r = Router();

  // Lấy danh sách item trong giỏ
  r.get("/", authMiddleware, controller.list);

  // Thêm sản phẩm vào giỏ
  r.post("/items", authMiddleware, controller.add);

  // Cập nhật số lượng
  r.patch("/items/:productId", authMiddleware, controller.update);

  // Xoá khỏi giỏ
  r.delete("/items/:productId", authMiddleware, controller.remove);

  return r;
};
