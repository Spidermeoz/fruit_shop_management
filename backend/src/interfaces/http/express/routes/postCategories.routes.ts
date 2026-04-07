import { Router } from "express";
import type { PostCategoriesController } from "../controllers/PostCategoriesController";

type CanFn = (moduleKey: string, actionKey: string) => any;

export const postCategoriesRoutes = (
  controller: PostCategoriesController,
  auth: any,
  can: CanFn,
) => {
  const r = Router();

  r.get("/", auth, can("post_category", "view"), controller.list);
  r.get("/summary", auth, can("post_category", "view"), controller.summary);
  r.get("/detail/:id", auth, can("post_category", "view"), controller.detail);

  r.post("/create", auth, can("post_category", "create"), controller.create);

  r.get("/edit/:id", auth, can("post_category", "edit"), controller.getEdit);
  r.patch("/edit/:id", auth, can("post_category", "edit"), controller.edit);

  r.patch("/bulk", auth, can("post_category", "edit"), controller.bulkEdit);

  r.patch("/reorder", auth, can("post_category", "edit"), controller.reorder);

  r.patch(
    "/:id/status",
    auth,
    can("post_category", "edit"),
    controller.changeStatus,
  );

  r.delete(
    "/delete/:id",
    auth,
    can("post_category", "delete"),
    controller.softDelete,
  );

  return r;
};
