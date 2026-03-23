import type { OriginRepository } from "../../../domain/products/OriginRepository";

export class BulkDeleteOrigins {
  constructor(private repo: OriginRepository) {}

  async execute(ids: number[]) {
    const normalized = Array.from(
      new Set(
        (ids || [])
          .map((id) => Number(id))
          .filter((id) => Number.isInteger(id) && id > 0),
      ),
    );

    if (normalized.length === 0) {
      throw new Error("Ids are required");
    }

    const affected = await this.repo.bulkSoftDelete(normalized);

    return {
      count: affected,
      ids: normalized,
    };
  }
}
