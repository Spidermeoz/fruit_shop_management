import type {
  PostTagRepository,
  ReorderPostTagPositionsInput,
} from "../../../domain/post-tags/PostTagRepository";

export class ReorderPostTagPositions {
  constructor(private repo: PostTagRepository) {}

  async execute(items: ReorderPostTagPositionsInput[]) {
    const pairs = (items || [])
      .map((item) => ({
        id: Number(item.id),
        position: Number(item.position),
      }))
      .filter(
        (item) =>
          Number.isFinite(item.id) &&
          Number.isFinite(item.position) &&
          item.position >= 0,
      );

    if (!pairs.length) {
      throw new Error("No valid reorder items provided");
    }

    const affected = await this.repo.reorderPositions(pairs);

    return {
      affected,
      items: pairs,
    };
  }
}
