// src/application/products/usecases/ChangeProductStatus.ts
import type { ProductRepository } from '../../../domain/products/ProductRepository';
import type { ProductStatus } from '../../../domain/products/types';

export class ChangeProductStatus {
  constructor(private repo: ProductRepository) {}

  async execute(id: number, status: ProductStatus) {
    await this.repo.changeStatus(id, status);
    return { id, status };
  }
}
