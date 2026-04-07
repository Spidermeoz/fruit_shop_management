import type { PostCategoryRepository } from "../../../domain/post-categories/PostCategoryRepository";

type ReorderPair = {
  id: number;
  position: number;
};

type ExtendedPostCategoryRepository = PostCategoryRepository & {
  reorderPositions?: (pairs: ReorderPair[]) => Promise<number>;
};

export class ReorderPostCategoryPositions {
  constructor(private repo: PostCategoryRepository) {}

  async execute(pairs: ReorderPair[]) {
    const normalizedPairs = Array.isArray(pairs)
      ? pairs
          .map((item) => ({
            id: Number(item.id),
            position: Number(item.position),
          }))
          .filter(
            (item) =>
              Number.isInteger(item.id) &&
              item.id > 0 &&
              Number.isFinite(item.position),
          )
      : [];

    if (!normalizedPairs.length) {
      throw new Error("At least one reorder pair is required");
    }

    const uniqueIds = new Set<number>();
    for (const pair of normalizedPairs) {
      if (uniqueIds.has(pair.id)) {
        throw new Error(`Duplicate category id in reorder payload: ${pair.id}`);
      }
      uniqueIds.add(pair.id);

      const existing = await this.repo.findById(pair.id);
      if (!existing) {
        throw new Error(`Post category not found: ${pair.id}`);
      }
    }

    const extendedRepo = this.repo as ExtendedPostCategoryRepository;

    if (typeof extendedRepo.reorderPositions !== "function") {
      throw new Error("Post category reorder is not supported");
    }

    const affected = await extendedRepo.reorderPositions(normalizedPairs);

    return {
      count: Number(affected || 0),
      pairs: normalizedPairs,
    };
  }
}
