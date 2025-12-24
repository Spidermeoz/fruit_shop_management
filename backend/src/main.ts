// src/main.ts
import express from "express";
import cors from "cors";
import helmet from "helmet";

import {
  controllers,
  authServices,
  userRepo,
  rolesRepo,
  clientControllers,
} from "./config/di/container";

import { makeAuthMiddleware } from "./interfaces/http/express/middlewares/auth";
import { makeCan } from "./interfaces/http/express/middlewares/permissions";

import { uploadMulter } from "./interfaces/http/express/middlewares/multer";

// ===== Admin routes =====
import { authRoutes } from "./interfaces/http/express/routes/auth.routes";
import { productsRoutes } from "./interfaces/http/express/routes/products.routes";
import { productCategoriesRoutes } from "./interfaces/http/express/routes/productCategories.routes";
import { rolesRoutes } from "./interfaces/http/express/routes/roles.routes";
import { usersRoutes } from "./interfaces/http/express/routes/users.routes";
import { uploadRoutes } from "./interfaces/http/express/routes/upload.routes";
import { ordersRoutes } from "./interfaces/http/express/routes/orders.routes";
import { adminReviewsRoutes } from "./interfaces/http/express/routes/adminReviews.routes";
import { adminSettingsRoutes } from "./interfaces/http/express/routes/adminSettings.routes";

// ===== Client routes =====
import { clientProductsRoutes } from "./interfaces/http/express/routes/client/clientProducts.routes";
import clientCategoriesRoutes from "./interfaces/http/express/routes/client/clientCategories.routes";
import clientAuthRoutes from "./interfaces/http/express/routes/client/clientAuth.routes";
import { clientForgotPasswordRoutes } from "./interfaces/http/express/routes/client/clientForgotPassword.routes";
import { clientCartRoutes } from "./interfaces/http/express/routes/client/clientCart.routes";
import { clientOrdersRoutes } from "./interfaces/http/express/routes/client/clientOrders.routes";
import { clientReviewsRoutes } from "./interfaces/http/express/routes/client/clientReviews.routes";
import { clientUploadRoutes } from "./interfaces/http/express/routes/client/clientUpload.routes";
import { clientSettingsRoutes } from "./interfaces/http/express/routes/client/clientSettings.routes";

const app = express();

// ------------------------------------
// CORS config
// ------------------------------------
const allowedOrigins = [
  process.env.FRONTEND_URL || "http://localhost:3001",
  "http://localhost:5173",
  "http://localhost:3000",
];

const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    // Allow requests without origin (like mobile apps or curl)
    if (!origin) return callback(null, true);

    const allowed = [
      "http://localhost:5173",
      "http://localhost:3001",
      "http://localhost:3000",
      process.env.FRONTEND_URL,
      "https://frontend-fruit-shop-w3b3-i6rmf5pej-jeremiews-projects.vercel.app",
      "https://frontend-fruit-shop-w3b3.vercel.app",
    ];

    if (allowed.includes(origin)) {
      return callback(null, true);
    }

    console.warn("❌ Blocked by CORS:", origin);
    callback(new Error("Not allowed by CORS"));
  },

  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
};

// ------------------------------------
// Middlewares
// ------------------------------------
const auth = makeAuthMiddleware(authServices.token, userRepo, {
  enforceActive: true,
});
const can = makeCan(rolesRepo);

app.use(cors(corsOptions));
app.options(/.*/, cors(corsOptions));
app.use(express.json());
app.use(helmet());
app.use(express.json({ limit: "15mb" }));
app.use(express.urlencoded({ extended: true, limit: "15mb" }));

// ------------------------------------
// Admin Auth Routes
// ------------------------------------
app.use("/api/v1/auth", authRoutes(controllers.auth, auth));

// ------------------------------------
// Admin Routes
// ------------------------------------
app.use(
  "/api/v1/admin/products",
  productsRoutes(controllers.products, auth, can)
);
app.use(
  "/api/v1/admin/product-category",
  productCategoriesRoutes(controllers.categories, auth, can)
);
app.use("/api/v1/admin/roles", rolesRoutes(controllers.roles, auth, can));
app.use("/api/v1/admin/users", usersRoutes(controllers.users, auth, can));
app.use("/api/v1/admin/upload", uploadRoutes(controllers.upload, auth, can));

app.use("/api/v1/admin/orders", ordersRoutes(controllers.orders, auth, can));
app.use(
  "/api/v1/admin/reviews",
  adminReviewsRoutes(controllers.reviews, auth, can)
);

// ⭐⭐⭐ NEW — ADMIN GENERAL SETTINGS ⭐⭐⭐
app.use(
  "/api/v1/admin/settings",
  adminSettingsRoutes(controllers.settings, auth, can)
);

// ------------------------------------
// Client Routes
// ------------------------------------
app.use(
  "/api/v1/client/products",
  clientProductsRoutes(clientControllers.products)
);
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

app.use("/api/v1/client/cart", clientCartRoutes(clientControllers.cart, auth));

app.use(
  "/api/v1/client/orders",
  clientOrdersRoutes(clientControllers.orders, auth)
);

app.use(
  "/api/v1/client/reviews",
  clientReviewsRoutes(clientControllers.reviews, auth)
);

app.use("/api/v1/client/upload", clientUploadRoutes(controllers.upload, auth));

// ⭐⭐⭐ NEW — CLIENT GENERAL SETTINGS ⭐⭐⭐
app.use(
  "/api/v1/client/settings",
  clientSettingsRoutes(clientControllers.clientSettings)
);

// ------------------------------------
// Error Handler
// ------------------------------------
app.use(
  (
    err: any,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction
  ) => {
    console.error(err);

    if (err.message === "Not allowed by CORS") {
      return res.status(403).json({ error: "CORS error: Access forbidden" });
    }

    const status = err.statusCode || 400;
    res.status(status).json({ error: err.message || "Unexpected error" });
  }
);

// ------------------------------------
// Server Start
// ------------------------------------
(async () => {
  try {
    // await sequelize.authenticate();
    // console.log("✅ DB connected");
  } catch (e) {
    console.error("❌ DB connection error:", e);
  }

  const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;
  app.listen(PORT, () => console.log(`🚀 Server running`));
})();
