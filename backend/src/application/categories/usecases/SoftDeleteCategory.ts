// src/application/categories/usecases/SoftDeleteCategory.ts
import type { ProductCategoryRepository } from "../../../domain/categories/ProductCategoryRepository";

export class SoftDeleteCategory {
  constructor(private repo: ProductCategoryRepository) {}

  async execute(id: number) {
    // Hạ tầng sẽ soft-delete và (khuyến nghị) detach children (parent_id = null)
    await this.repo.softDelete(id);
    return { id };
  }
}
