import { Router } from "express";
import type { PostTagsController } from "../controllers/PostTagsController";

type CanFn = (moduleKey: string, actionKey: string) => any;

export const postTagsRoutes = (
  controller: PostTagsController,
  auth: any,
  can: CanFn,
) => {
  const r = Router();

  r.get("/", auth, can("post_tag", "view"), controller.list);
  r.get("/summary", auth, can("post_tag", "view"), controller.summary);
  r.get("/detail/:id", auth, can("post_tag", "view"), controller.detail);
  r.get("/:id/usage", auth, can("post_tag", "view"), controller.usage);
  r.get("/:id/can-delete", auth, can("post_tag", "view"), controller.canDelete);

  r.post("/create", auth, can("post_tag", "create"), controller.create);
  r.get("/edit/:id", auth, can("post_tag", "edit"), controller.getEdit);
  r.patch("/edit/:id", auth, can("post_tag", "edit"), controller.edit);
  r.patch("/bulk-edit", auth, can("post_tag", "edit"), controller.bulkEdit);
  r.patch("/reorder", auth, can("post_tag", "edit"), controller.reorder);
  r.patch(
    "/:id/status",
    auth,
    can("post_tag", "edit"),
    controller.changeStatus,
  );
  r.delete(
    "/delete/:id",
    auth,
    can("post_tag", "delete"),
    controller.softDelete,
  );

  return r;
};
