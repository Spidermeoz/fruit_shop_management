import type { PostTagRepository } from "../../../domain/post-tags/PostTagRepository";

export class CanDeletePostTag {
  constructor(private repo: PostTagRepository) {}

  async execute(id: number) {
    const normalizedId = Number(id);

    if (!Number.isFinite(normalizedId) || normalizedId <= 0) {
      throw new Error("Invalid post tag id");
    }

    const result = await this.repo.canDelete(normalizedId);

    return {
      id: normalizedId,
      ...result,
    };
  }
}
