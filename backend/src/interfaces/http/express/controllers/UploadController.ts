// src/interfaces/http/express/controllers/UploadController.ts
import { Request, Response, NextFunction } from "express";
import { UploadImage } from "../../../../application/uploads/usecases/UploadImage";

export const makeUploadController = (uc: { upload: UploadImage }) => {
  return {
    // POST /api/v1/admin/upload
    upload: async (req: Request, res: Response, next: NextFunction) => {
      try {
        // multer.memoryStorage() sẽ đặt file buffer tại req.file.buffer
        const file = req.file as Express.Multer.File | undefined;
        if (!file || !file.buffer) {
          return res.status(400).json({ success: false, message: "Missing file" });
        }

        // có thể truyền folder qua body form-data (không bắt buộc)
        const folder = (req.body?.folder as string | undefined) || undefined;

        const result = await uc.upload.execute({
          data: file.buffer,
          mimetype: file.mimetype,
          folder,
        });

        return res.status(201).json({
          success: true,
          data: result, // { url, publicId?, width?, height?, format? }
        });
      } catch (err) {
        next(err);
      }
    },
  };
};

export type UploadController = ReturnType<typeof makeUploadController>;
