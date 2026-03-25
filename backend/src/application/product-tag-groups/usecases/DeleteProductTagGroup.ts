import type { ProductTagGroupRepository } from "../../../domain/products/ProductTagGroupRepository";

export class DeleteProductTagGroup {
  constructor(private repo: ProductTagGroupRepository) {}

  async execute(id: number) {
    if (!Number.isInteger(id) || id <= 0) {
      throw new Error("Invalid product tag group id");
    }

    await this.repo.softDelete(id);
    return { id };
  }
}
