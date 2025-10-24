// src/application/categories/usecases/ReorderCategoryPositions.ts
import type { ProductCategoryRepository } from "../../../domain/categories/ProductCategoryRepository";

export class ReorderCategoryPositions {
  constructor(private repo: ProductCategoryRepository) {}

  async execute(pairs: Array<{ id: number; position: number }>) {
    if (!Array.isArray(pairs) || pairs.length === 0) {
      throw new Error("pairs must be a non-empty array");
    }
    const allValid = pairs.every(p => Number.isFinite(p.id) && Number.isFinite(p.position));
    if (!allValid) throw new Error("pairs contains invalid id/position");

    const affected = await this.repo.reorderPositions(pairs);
    return { affected };
  }
}
