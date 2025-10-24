// src/application/uploads/usecases/UploadImage.ts
import type { FileStorage } from "../../../domain/storage/FileStorage";

export class UploadImage {
  constructor(private storage: FileStorage) {}

  async execute(input: {
    data: Buffer;
    mimetype: string;
    folder?: string; // mặc định sẽ set ở layer interface nếu không truyền
  }) {
    if (!input?.data || !Buffer.isBuffer(input.data)) {
      throw new Error("Invalid file data");
    }
    if (!input?.mimetype?.startsWith("image/")) {
      throw new Error("Invalid mimetype (must be image/*)");
    }

    const result = await this.storage.uploadImage({
      data: input.data,
      mimetype: input.mimetype,
      folder: input.folder,
    });

    return result; // { url, publicId?, width?, height? }
  }
}
