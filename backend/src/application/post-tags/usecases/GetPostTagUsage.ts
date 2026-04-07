import type { PostTagRepository } from "../../../domain/post-tags/PostTagRepository";

export class GetPostTagUsage {
  constructor(private repo: PostTagRepository) {}

  async execute(id: number) {
    const normalizedId = Number(id);

    if (!Number.isFinite(normalizedId) || normalizedId <= 0) {
      throw new Error("Invalid post tag id");
    }

    const postCount = await this.repo.countPostsUsingTag(normalizedId);

    return {
      id: normalizedId,
      postCount,
    };
  }
}
