// src/application/categories/usecases/ChangeCategoryStatus.ts
import type { ProductCategoryRepository } from "../../../domain/categories/ProductCategoryRepository";
import type { CategoryStatus } from "../../../domain/categories/types";

export class ChangeCategoryStatus {
  constructor(private repo: ProductCategoryRepository) {}

  async execute(id: number, status: CategoryStatus) {
    await this.repo.changeStatus(id, status);
    return { id, status };
  }
}
