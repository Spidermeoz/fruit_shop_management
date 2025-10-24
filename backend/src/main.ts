// src/main.ts
import express from "express";
import cors from "cors";
import helmet from "helmet";
import sequelize from "./infrastructure/db/sequelize"; // kết nối DB
import { controllers } from "./config/di/container";
import { productsRoutes } from "./interfaces/http/express/routes/products.routes";
import { uploadRoutes } from "./interfaces/http/express/routes/upload.routes";

const app = express();
app.use(express.json());
app.use(cors());
app.use(helmet());

// Mount routes (giữ prefix giống cũ)
app.use("/api/v1/admin/products", productsRoutes(controllers.products));
app.use("/api/v1/admin/upload", uploadRoutes(controllers.upload));

// Error middleware đơn giản
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  const status = err.statusCode || 400;
  res.status(status).json({ error: err.message || "Unexpected error" });
});

(async () => {
  try {
    await sequelize.authenticate();
    console.log("✅ DB connected");
  } catch (e) {
    console.error("❌ DB connection error:", e);
  }

  const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;
  app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
})();
