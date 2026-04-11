import { Router, type RequestHandler } from "express";

type ClientPostCategoriesController = {
  list: RequestHandler;
};

const clientPostCategoriesRoutes = (
  controller: ClientPostCategoriesController,
) => {
  const r = Router();

  r.get("/", controller.list);

  return r;
};

export default clientPostCategoriesRoutes;
