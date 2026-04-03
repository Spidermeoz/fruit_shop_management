import type { ProductRepository } from "../../../domain/products/ProductRepository";
import type { ProductListFilter } from "../../../domain/products/types";
import { toDTO } from "../dto";

export class ListProducts {
  constructor(private repo: ProductRepository) {}

  async execute(filter: ProductListFilter) {
    const { rows, count, summary } = await this.repo.list({
      page: filter.page ?? 1,
      limit: filter.limit ?? 10,
      q: filter.q,
      categoryId: filter.categoryId ?? null,
      status: filter.status ?? "all",
      featured: filter.featured,
      minPrice: filter.minPrice,
      maxPrice: filter.maxPrice,
      minStock: filter.minStock,
      maxStock: filter.maxStock,
      stockStatus: filter.stockStatus ?? "all",
      missingThumbnail: filter.missingThumbnail,
      hasPendingReviews: filter.hasPendingReviews,
      lowStockThreshold: filter.lowStockThreshold ?? 10,
      sortBy: filter.sortBy ?? "id",
      order: filter.order ?? "DESC",
    });

    return {
      rows: rows.map(toDTO),
      count,
      summary,
    };
  }
}
