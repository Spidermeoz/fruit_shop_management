import { Express } from "express";
import { productRoutes } from "./product.route";

const mainV1Routes = (app: Express): void => {
  // Đường base cho API version 1
  const version = "/api/v1/client";

  // Nhóm route sản phẩm
  app.use(`${version}/products`, productRoutes);
};

export default mainV1Routes;
