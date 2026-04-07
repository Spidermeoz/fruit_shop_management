import { Router } from "express";
import type { PostsController } from "../controllers/PostsController";

type CanFn = (moduleKey: string, actionKey: string) => any;

export const postsRoutes = (
  controller: PostsController,
  auth: any,
  can: CanFn,
) => {
  const r = Router();

  r.get("/", auth, can("post", "view"), controller.list);
  r.get("/summary", auth, can("post", "view"), controller.summary);
  r.get("/detail/:id", auth, can("post", "view"), controller.detail);

  r.post("/create", auth, can("post", "create"), controller.create);
  r.get("/edit/:id", auth, can("post", "edit"), controller.getEdit);
  r.patch("/edit/:id", auth, can("post", "edit"), controller.edit);
  r.patch("/:id/status", auth, can("post", "edit"), controller.changeStatus);

  r.patch("/bulk-edit", auth, can("post", "edit"), controller.bulkEdit);
  r.patch("/reorder", auth, can("post", "edit"), controller.reorder);

  r.delete("/delete/:id", auth, can("post", "delete"), controller.softDelete);

  return r;
};
