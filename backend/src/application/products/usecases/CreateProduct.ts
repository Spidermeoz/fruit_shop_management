// src/application/products/usecases/CreateProduct.ts
import type { ProductRepository, CreateProductInput } from '../../../domain/products/ProductRepository';

export class CreateProduct {
  constructor(private repo: ProductRepository) {}

  async execute(input: CreateProductInput) {
    // Tối thiểu: title bắt buộc, các rule còn lại đã có ở domain/entity
    if (!input.title?.trim()) throw new Error('Title is required');

    const created = await this.repo.create({
      status: input.status ?? 'active',
      stock: input.stock ?? 0,
      ...input,
    });

    return { id: created.props.id! };
  }
}
