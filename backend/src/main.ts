import { controllers } from "./config/di/container";
import { productsRoutes } from "./interfaces/http/express/routes/products.routes";
import { uploadRoutes } from "./interfaces/http/express/routes/upload.routes";
import { productCategoriesRoutes } from "./interfaces/http/express/routes/productCategories.routes";
import express from 'express';
import cors from 'cors'; // Đảm bảo đã import
import helmet from 'helmet';
// import { sequelize } from './config/database'; 

const app = express();

// --- BẮT ĐẦU PHẦN BỔ SUNG BỊ THIẾU ---

// Xác định URL frontend của bạn (ví dụ: 3001 cho React, 5173 cho Vite...)
const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:3001', // <-- THAY BẰNG PORT FRONTEND CỦA BẠN
  'http://localhost:5173', // <-- Port Vite/React/Vue khác (nếu có)
  'http://localhost:3000', // Có thể cho phép chính nó
];

// Định nghĩa biến `corsOptions` mà TS đang báo thiếu
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

// --- KẾT THÚC PHẦN BỔ SUNG ---


// 1. Sử dụng cấu hình CORS (Giờ 'corsOptions' đã được định nghĩa)
app.use(cors(corsOptions));

// 2. Dòng này đã bị xóa chính xác (không gây lỗi)
// app.options('*', cors(corsOptions)); 

// 3. Các middleware khác
app.use(express.json());
app.use(helmet());

app.use(express.json({ limit: "15mb" }));
app.use(express.urlencoded({ extended: true, limit: "15mb" }));

// 4. Mount routes
app.use("/api/v1/admin/products", productsRoutes(controllers.products));
app.use("/api/v1/admin/upload", uploadRoutes(controllers.upload));
app.use("/api/v1/admin/product-category", productCategoriesRoutes(controllers.categories));

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