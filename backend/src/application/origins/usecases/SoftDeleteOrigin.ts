import type { OriginRepository } from "../../../domain/products/OriginRepository";

export class SoftDeleteOrigin {
  constructor(private repo: OriginRepository) {}

  async execute(id: number) {
    await this.repo.softDelete(id);
    return { id };
  }
}
