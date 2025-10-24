// src/application/categories/usecases/GetCategoryDetail.ts
import type { ProductCategoryRepository } from "../../../domain/categories/ProductCategoryRepository";
import { toDTO } from "../dto";

export class GetCategoryDetail {
  constructor(private repo: ProductCategoryRepository) {}

  async execute(id: number) {
    const c = await this.repo.findById(id);
    if (!c) throw new Error("Category not found");
    return toDTO(c);
  }
}
