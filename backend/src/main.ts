// src/main.ts
import express from "express";
import cors from "cors";
import helmet from "helmet";
import { controllers, authServices, userRepo, rolesRepo, clientControllers } from "./config/di/container";
import { makeAuthMiddleware } from "./interfaces/http/express/middlewares/auth";
import { makeCan } from "./interfaces/http/express/middlewares/permissions";

import { authRoutes } from "./interfaces/http/express/routes/auth.routes";
import { productsRoutes } from "./interfaces/http/express/routes/products.routes";
import { productCategoriesRoutes } from "./interfaces/http/express/routes/productCategories.routes";
import { rolesRoutes } from "./interfaces/http/express/routes/roles.routes";
import { usersRoutes } from "./interfaces/http/express/routes/users.routes";
import { uploadRoutes } from "./interfaces/http/express/routes/upload.routes";
import { clientProductsRoutes } from "./interfaces/http/express/routes/client/clientProducts.routes";
import clientCategoriesRoutes from "./interfaces/http/express/routes/client/clientCategories.routes";
import clientAuthRoutes from "./interfaces/http/express/routes/client/clientAuth.routes";
import { clientForgotPasswordRoutes } from "./interfaces/http/express/routes/client/clientForgotPassword.routes";
import { clientCartRoutes } from "./interfaces/http/express/routes/client/clientCart.routes";
import { ordersRoutes } from "./interfaces/http/express/routes/orders.routes";
import { clientOrdersRoutes } from "./interfaces/http/express/routes/client/clientOrders.routes";

const app = express();

// Xác định URL frontend của bạn (ví dụ: 3001 cho React, 5173 cho Vite...)
const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:3001', // <-- THAY BẰNG PORT FRONTEND CỦA BẠN
  'http://localhost:5173', // <-- Port Vite/React/Vue khác (nếu có)
  'http://localhost:3000', // Có thể cho phép chính nó
];

const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    // Cho phép request không có origin (như Postman) hoặc origin nằm trong danh sách
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: 'GET,POST,PUT,PATCH,DELETE,OPTIONS', // Các method cho phép
  allowedHeaders: 'Content-Type, Authorization', // Các header cho phép
  credentials: true, 
};

const auth = makeAuthMiddleware(authServices.token, userRepo, { enforceActive: true });
const can = makeCan(rolesRepo);


// 1. Sử dụng cấu hình CORS (Giờ 'corsOptions' đã được định nghĩa)
app.use(cors(corsOptions));

// 3. Các middleware khác
app.use(express.json());
app.use(helmet());

app.use(express.json({ limit: "15mb" }));
app.use(express.urlencoded({ extended: true, limit: "15mb" }));

app.use("/api/v1/auth", authRoutes(controllers.auth, auth));

// 4. Mount routes
app.use("/api/v1/admin/products", productsRoutes(controllers.products, auth, can));
app.use("/api/v1/admin/product-category", productCategoriesRoutes(controllers.categories, auth, can));
app.use("/api/v1/admin/roles", rolesRoutes(controllers.roles, auth, can));
app.use("/api/v1/admin/users", usersRoutes(controllers.users, auth, can));
app.use("/api/v1/admin/upload", uploadRoutes(controllers.upload, auth, can));
app.use(
  "/api/v1/admin/orders",
  ordersRoutes(controllers.orders, auth, can)
);

// 5. Mount routes (client)
app.use("/api/v1/client/products", clientProductsRoutes(clientControllers.products));
app.use("/api/v1/client/categories", clientCategoriesRoutes);
app.use("/api/v1/client/auth", clientAuthRoutes(clientControllers.auth, auth));

app.use(
  "/api/v1/client/forgot-password",
  clientForgotPasswordRoutes(
    clientControllers.forgotPassword,
    clientControllers.verifyOtp,
    clientControllers.resetPassword
  )
);
app.use(
  "/api/v1/client/cart",
  clientCartRoutes(clientControllers.cart, auth)
);
app.use(
  "/api/v1/client/orders",
  clientOrdersRoutes(clientControllers.orders, auth)
);

// Error middleware đơn giản
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  
  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({ error: "CORS error: Access forbidden" });
  }

  const status = err.statusCode || 400;
  res.status(status).json({ error: err.message || "Unexpected error" });
});

(async () => {
  try {
    // await sequelize.authenticate(); // Bỏ comment nếu bạn có sequelize
    // console.log("✅ DB connected");
  } catch (e) {
    console.error("❌ DB connection error:", e);
  }

  const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;
  app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
})();