// src/application/products/usecases/EditProduct.ts
import { Product } from "../../../domain/products/Products";
import type {
  ProductRepository,
  UpdateProductPatch,
} from "../../../domain/products/ProductRepository";

export class EditProduct {
  constructor(private repo: ProductRepository) {}

  async execute(id: number, patch: UpdateProductPatch) {
    // 1. Lấy dữ liệu hiện tại từ DB
    const existingProduct = await this.repo.findById(id);
    if (!existingProduct) throw new Error("Product not found");

    const updatedProduct = Product.create({
      ...existingProduct.props,
      ...patch, // Ghi đè các trường mới từ request
    });

    const saved = await this.repo.update(id, patch);
    return { id: saved.props.id! };
  }
}
