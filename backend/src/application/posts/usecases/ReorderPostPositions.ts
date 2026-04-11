import type { PostRepository } from "../../../domain/posts/PostRepository";

export type ReorderPostPositionPair = {
  id: number;
  position: number;
};

function normalizePairs(pairs: ReorderPostPositionPair[]) {
  if (!Array.isArray(pairs)) return [];

  const seen = new Set<number>();

  return pairs
    .map((pair) => ({
      id: Number(pair?.id),
      position: Number(pair?.position),
    }))
    .filter((pair) => {
      if (!Number.isInteger(pair.id) || pair.id <= 0) return false;
      if (!Number.isFinite(pair.position) || pair.position < 0) return false;
      if (seen.has(pair.id)) return false;

      seen.add(pair.id);
      return true;
    });
}

export class ReorderPostPositions {
  constructor(private repo: PostRepository) {}

  async execute(pairs: ReorderPostPositionPair[], updatedById?: number | null) {
    const normalizedPairs = normalizePairs(pairs);

    if (!normalizedPairs.length) {
      throw new Error("Reorder pairs are required");
    }

    if (typeof this.repo.reorderPositions !== "function") {
      throw new Error("PostRepository.reorderPositions is not implemented");
    }

    const affected = await this.repo.reorderPositions(
      normalizedPairs,
      updatedById != null ? Number(updatedById) : undefined,
    );

    return {
      count: affected,
      pairs: normalizedPairs,
    };
  }
}
