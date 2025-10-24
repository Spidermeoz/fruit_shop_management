// src/interfaces/http/express/middlewares/multer.ts
import multer from "multer";

const storage = multer.memoryStorage();

export const uploadMulter = multer({
  storage,
  limits: {
    // tối đa ~10MB (tuỳ chỉnh)
    fileSize: 10 * 1024 * 1024,
  },
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      return cb(new Error("Only image/* is allowed"));
    }
    cb(null, true);
  },
});
