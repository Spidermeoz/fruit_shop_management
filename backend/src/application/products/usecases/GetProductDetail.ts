// src/application/products/usecases/GetProductDetail.ts
import type { ProductRepository } from '../../../domain/products/ProductRepository';
import { toDTO } from '../dto';

export class GetProductDetail {
  constructor(private repo: ProductRepository) {}

  async execute(id: number) {
    const p = await this.repo.findById(id);
    if (!p) throw new Error('Product not found');
    return toDTO(p);
  }
}
