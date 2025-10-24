// src/domain/storage/FileStorage.ts
export type UploadResult = {
  url: string;
  publicId?: string;
  width?: number;
  height?: number;
  format?: string;
};

export interface FileStorage {
  /**
   * Upload ảnh nhị phân (buffer) lên storage.
   * - folder: đường dẫn thư mục logic trên storage (vd: "fruitshop/products")
   */
  uploadImage(input: {
    data: Buffer;
    mimetype: string;
    folder?: string;
  }): Promise<UploadResult>;

  /**
   * (Tùy chọn) Xoá theo publicId nếu storage hỗ trợ.
   */
  deleteByPublicId?(publicId: string): Promise<void>;
}
