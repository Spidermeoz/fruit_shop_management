// src/infrastructure/storage/CloudinaryStorage.ts
import cloudinary from "./cloudinaryClient";
import type { UploadApiResponse } from "cloudinary";
import { Readable } from "stream";
import type { FileStorage, UploadResult } from "../../domain/storage/FileStorage";

// Tên thư mục mặc định trên Cloudinary (có thể override bằng input.folder)
const DEFAULT_FOLDER = process.env.CLOUDINARY_FOLDER || "fruitshop/uploads";

function bufferToStream(buffer: Buffer) {
  const readable = new Readable();
  readable.push(buffer);
  readable.push(null);
  return readable;
}

export class CloudinaryStorage implements FileStorage {
  async uploadImage(input: {
    data: Buffer;
    mimetype: string;
    folder?: string;
  }): Promise<UploadResult> {
    const folder = input.folder || DEFAULT_FOLDER;

    // Thiết lập options cho upload_stream
    const options = {
      resource_type: "image" as const,
      folder,
      use_filename: true,
      unique_filename: true,
      overwrite: false,
      // Gợi ý tối ưu ảnh tự động
      transformation: [{ quality: "auto", fetch_format: "auto" }],
    };

    const result: UploadApiResponse = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(options, (err, res) => {
        if (err) return reject(err);
        if (!res) return reject(new Error("Empty response from Cloudinary"));
        resolve(res);
      });
      bufferToStream(input.data).pipe(stream);
    });

    return {
      url: result.secure_url || result.url,
      publicId: result.public_id,
      width: result.width ?? undefined,
      height: result.height ?? undefined,
      format: result.format ?? undefined,
    };
  }

  async deleteByPublicId(publicId: string): Promise<void> {
    await cloudinary.uploader.destroy(publicId, { resource_type: "image" });
  }
}
