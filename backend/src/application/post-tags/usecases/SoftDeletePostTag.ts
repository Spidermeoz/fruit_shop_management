import type { PostTagRepository } from "../../../domain/post-tags/PostTagRepository";

export class SoftDeletePostTag {
  constructor(private repo: PostTagRepository) {}

  async execute(id: number) {
    await this.repo.softDelete(id);
    return { id };
  }
}
