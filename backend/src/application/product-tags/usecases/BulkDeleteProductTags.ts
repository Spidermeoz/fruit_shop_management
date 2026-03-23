import type { ProductTagRepository } from "../../../domain/products/ProductTagRepository";

export class BulkDeleteProductTags {
  constructor(private repo: ProductTagRepository) {}

  async execute(ids: number[]) {
    if (!Array.isArray(ids) || ids.length === 0) {
      throw new Error("Ids are required");
    }

    const normalizedIds = ids
      .map((id) => Number(id))
      .filter((id) => Number.isInteger(id) && id > 0);

    if (normalizedIds.length === 0) {
      throw new Error("Ids are invalid");
    }

    const affected = await this.repo.bulkSoftDelete(normalizedIds);

    return {
      affected,
      ids: normalizedIds,
    };
  }
}
