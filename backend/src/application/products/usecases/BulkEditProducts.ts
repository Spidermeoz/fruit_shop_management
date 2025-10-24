// src/application/products/usecases/BulkEditProducts.ts
import type { ProductRepository, UpdateProductPatch } from '../../../domain/products/ProductRepository';

export class BulkEditProducts {
  constructor(private repo: ProductRepository) {}

  async execute(ids: number[], patch: UpdateProductPatch) {
    if (!Array.isArray(ids) || ids.length === 0) {
      throw new Error('ids must be a non-empty array');
    }
    const affected = await this.repo.bulkEdit(ids, patch);
    return { affected };
  }
}
