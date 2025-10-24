// src/application/products/usecases/SoftDeleteProduct.ts
import type { ProductRepository } from '../../../domain/products/ProductRepository';

export class SoftDeleteProduct {
  constructor(private repo: ProductRepository) {}

  async execute(id: number) {
    await this.repo.softDelete(id);
    return { id };
  }
}
