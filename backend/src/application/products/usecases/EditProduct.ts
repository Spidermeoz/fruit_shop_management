// src/application/products/usecases/EditProduct.ts
import type { ProductRepository, UpdateProductPatch } from '../../../domain/products/ProductRepository';

export class EditProduct {
  constructor(private repo: ProductRepository) {}

  async execute(id: number, patch: UpdateProductPatch) {
    const updated = await this.repo.update(id, patch);
    return { id: updated.props.id! };
  }
}
