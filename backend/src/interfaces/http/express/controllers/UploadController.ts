// src/interfaces/http/express/controllers/UploadController.ts
import { Request, Response, NextFunction } from "express";
import { UploadImage } from "../../../../application/uploads/usecases/UploadImage";

export const makeUploadController = (uc: { upload: UploadImage }) => {
  return {
    // POST /api/v1/admin/upload
    upload: async (req: Request, res: Response, next: NextFunction) => {
      try {
        // có thể là file (FormData) hoặc dataUrl (JSON/text từ FE)
        const file = req.file as Express.Multer.File | undefined;
        const dataUrl: string | undefined = req.body?.dataUrl;

        let buffer: Buffer;
        let mimetype: string;

        if (file?.buffer) {
          buffer = file.buffer;
          mimetype = file.mimetype;
        } else if (typeof dataUrl === "string") {
          const match = dataUrl.match(/^data:(.+);base64,(.*)$/);
          if (!match) {
            return res
              .status(400)
              .json({ success: false, message: "Invalid dataUrl" });
          }
          mimetype = match[1];
          buffer = Buffer.from(match[2], "base64");
        } else {
          return res
            .status(400)
            .json({ success: false, message: "Missing file or dataUrl" });
        }

        const folder = (req.body?.folder as string | undefined) || undefined;
        const result = await uc.upload.execute({
          data: buffer,
          mimetype,
          folder,
        });

        // Trả cả data.url và url top-level (để FE cũ/tiện ích đọc hai kiểu đều OK)
        return res
          .status(201)
          .json({ success: true, data: result, url: result.url });
      } catch (err) {
        next(err);
      }
    },
  };
};

export type UploadController = ReturnType<typeof makeUploadController>;
