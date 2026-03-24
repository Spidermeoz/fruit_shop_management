import type { ProductRepository } from "../../../domain/products/ProductRepository";
import { toDTO } from "../dto";

export class GetProductDetailBySlug {
  constructor(private repo: ProductRepository) {}

  async execute(slug: string) {
    const p = await this.repo.findBySlug(slug);

    if (!p) {
      throw new Error("Product not found");
    }

    return toDTO(p);
  }
}
