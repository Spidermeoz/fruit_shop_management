import type { ProductRepository } from '../../../domain/products/ProductRepository';

export class BulkReorderProducts {
  constructor(private repo: ProductRepository) {}

  async execute(
    positions: Array<{ id: number; position: number }>,
    updatedById?: number
  ) {
    if (!Array.isArray(positions) || positions.length === 0) {
      throw new Error('positions must be a non-empty array');
    }
    const allValid = positions.every(p =>
      Number.isFinite(p.id) && Number.isFinite(p.position)
    );
    if (!allValid) throw new Error('positions contains invalid id/position');

    const affected = await this.repo.reorderPositions(positions, updatedById);
    return { affected };
  }
}
