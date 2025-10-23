import { Express } from "express";
import { dashboardRoutes } from "./dashboard.route";
import { productRoutes } from "./product.route";
import uploadRoute from "./upload.route";
import { productCategoryRoutes } from "./productCategory.route";
import { roleRoutes } from "./role.route";
import { userRoutes } from "./user.route";

const adminRoutes = (app: Express): void => {
  const version = "/api/v1/admin";

  // Dashboard
  app.use(`${version}/dashboard`, dashboardRoutes);

  // Products
  app.use(`${version}/products`, productRoutes);

  // Upload
  app.use(`${version}/upload`, uploadRoute);

  // Product Categories
  app.use(`${version}/product-category`, productCategoryRoutes);

  // Roles
  app.use(`${version}/roles`, roleRoutes);

  // Users
  app.use(`${version}/users`, userRoutes);
};

export default adminRoutes;
