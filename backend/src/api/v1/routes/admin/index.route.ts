import { Express } from "express";
import { dashboardRoutes } from "./dashboard.route";
import { productRoutes } from "./product.route";
import uploadRoute from "./upload.route";

const adminRoutes = (app: Express): void => {
  const version = "/api/v1/admin";

  // Dashboard
  app.use(`${version}/dashboard`, dashboardRoutes);

  // Products
  app.use(`${version}/products`, productRoutes);

  app.use("/api/v1/admin/upload", uploadRoute);
};

export default adminRoutes;
