import type { ProductTagRepository } from "../../../domain/products/ProductTagRepository";
import { toDTO } from "../dto";

export class GetProductTagDetail {
  constructor(private repo: ProductTagRepository) {}

  async execute(id: number) {
    const tag = await this.repo.findById(id);

    if (!tag) throw new Error("Product tag not found");

    return toDTO(tag);
  }
}
