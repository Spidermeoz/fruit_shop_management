import { Express } from "express";
import { dashboardRoutes } from "./dashboard.route";
import { productRoutes } from "./product.route";
import uploadRoute from "./upload.route";
import { productCategoryRoutes } from "./productCategory.route";

const adminRoutes = (app: Express): void => {
  const version = "/api/v1/admin";

  // Dashboard
  app.use(`${version}/dashboard`, dashboardRoutes);

  // Products
  app.use(`${version}/products`, productRoutes);

  app.use(`${version}/upload`, uploadRoute);

  // Product Categories
  app.use(`${version}/product-category`, productCategoryRoutes);
};

export default adminRoutes;
