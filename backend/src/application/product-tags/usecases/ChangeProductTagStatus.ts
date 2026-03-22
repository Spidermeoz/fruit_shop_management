import type {
  ProductTagRepository,
  ProductTagStatus,
} from "../../../domain/products/ProductTagRepository";

export class ChangeProductTagStatus {
  constructor(private repo: ProductTagRepository) {}

  async execute(id: number, status: ProductTagStatus) {
    const existing = await this.repo.findById(id);

    if (!existing) {
      throw new Error("Product tag not found");
    }

    await this.repo.changeStatus(id, status);

    return { id };
  }
}
