import { Router, type RequestHandler } from "express";

type ClientPostTagsController = {
  list: RequestHandler;
};

const clientPostTagsRoutes = (controller: ClientPostTagsController) => {
  const r = Router();

  r.get("/", controller.list);

  return r;
};

export default clientPostTagsRoutes;
