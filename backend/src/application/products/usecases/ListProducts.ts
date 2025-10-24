// src/application/products/usecases/ListProducts.ts
import type { ProductRepository } from '../../../domain/products/ProductRepository';
import type { ProductListFilter } from '../../../domain/products/types';
import { toDTO } from '../dto';

export class ListProducts {
  constructor(private repo: ProductRepository) {}

  async execute(filter: ProductListFilter) {
    const { rows, count } = await this.repo.list({
      page: filter.page ?? 1,
      limit: filter.limit ?? 10,
      q: filter.q,
      categoryId: filter.categoryId ?? null,
      status: filter.status ?? 'all',
      featured: filter.featured,
      minPrice: filter.minPrice,
      maxPrice: filter.maxPrice,
      sortBy: filter.sortBy ?? 'id',
      order: filter.order ?? 'DESC',
    });
    return { rows: rows.map(toDTO), count };
  }
}
