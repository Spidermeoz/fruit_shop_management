import { Router } from "express";
import type { NotificationsController } from "../controllers/NotificationsController";

type CanFn = (moduleKey: string, actionKey: string) => any;

export const notificationsRoutes = (
  controller: NotificationsController,
  auth: any,
  can: CanFn,
) => {
  const r = Router();

  r.get("/", auth, can("notification", "view"), controller.list);
  r.get(
    "/unread-count",
    auth,
    can("notification", "view"),
    controller.unreadCount,
  );
  r.post("/create", auth, can("notification", "create"), controller.create);
  r.patch("/:id/read", auth, can("notification", "view"), controller.markRead);
  r.patch(
    "/read-all",
    auth,
    can("notification", "view"),
    controller.markAllRead,
  );

  return r;
};
