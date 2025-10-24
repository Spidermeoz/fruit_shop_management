// src/application/categories/usecases/EditCategory.ts
import type { ProductCategoryRepository, UpdateCategoryPatch } from "../../../domain/categories/ProductCategoryRepository";

export class EditCategory {
  constructor(private repo: ProductCategoryRepository) {}

  async execute(id: number, patch: UpdateCategoryPatch) {
    const updated = await this.repo.update(id, patch);
    return { id: updated.props.id! };
  }
}
