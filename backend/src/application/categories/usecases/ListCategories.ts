// src/application/categories/usecases/ListCategories.ts
import type { ProductCategoryRepository } from "../../../domain/categories/ProductCategoryRepository";
import type { CategoryListFilter } from "../../../domain/categories/types";
import { toDTO } from "../dto";

export class ListCategories {
  constructor(private repo: ProductCategoryRepository) {}

  async execute(filter: CategoryListFilter) {
    const { rows, count } = await this.repo.list({
      page: filter.page ?? 1,
      limit: filter.limit ?? 20,
      q: filter.q,
      parentId: filter.parentId ?? undefined,
      status: filter.status ?? "all",
      includeDeleted: filter.includeDeleted ?? false,
      tree: filter.tree ?? false,
      sortBy: filter.sortBy ?? "position",
      order: filter.order ?? "ASC",
    });
    return { rows: rows.map(toDTO), count };
  }
}
