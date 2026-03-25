import type { ProductTagGroupRepository } from "../../../domain/products/ProductTagGroupRepository";
import { toDTO } from "../dto";

export class GetProductTagGroupDetail {
  constructor(private repo: ProductTagGroupRepository) {}

  async execute(id: number) {
    if (!Number.isInteger(id) || id <= 0) {
      throw new Error("Invalid product tag group id");
    }

    const found = await this.repo.findById(id, { includeTags: true });

    if (!found) {
      throw new Error("Không tìm thấy product tag group");
    }

    return toDTO(found);
  }
}
