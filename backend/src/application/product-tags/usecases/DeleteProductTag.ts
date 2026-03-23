import type { ProductTagRepository } from "../../../domain/products/ProductTagRepository";

export class DeleteProductTag {
  constructor(private repo: ProductTagRepository) {}

  async execute(id: number) {
    const existing = await this.repo.findById(id);
    if (!existing) throw new Error("Product tag not found");

    await this.repo.softDelete(id);
    return { id };
  }
}
