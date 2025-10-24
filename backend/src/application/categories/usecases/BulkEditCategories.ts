// src/application/categories/usecases/BulkEditCategories.ts
import type { ProductCategoryRepository, UpdateCategoryPatch } from "../../../domain/categories/ProductCategoryRepository";

export class BulkEditCategories {
  constructor(private repo: ProductCategoryRepository) {}

  async execute(ids: number[], patch: UpdateCategoryPatch) {
    if (!Array.isArray(ids) || ids.length === 0) {
      throw new Error("ids must be a non-empty array");
    }
    const affected = await this.repo.bulkEdit(ids, patch);
    return { affected };
  }
}
