import { Express } from "express";
import { productRoutes } from "./product.route";
import { homeRoutes } from "./home.route";

const mainV1Routes = (app: Express): void => {
  // Đường base cho API version 1
  const version = "/api/v1/client";

  app.use(`${version}/`, homeRoutes);
  
  // Nhóm route sản phẩm
  app.use(`${version}/products`, productRoutes);
  
};

export default mainV1Routes;
