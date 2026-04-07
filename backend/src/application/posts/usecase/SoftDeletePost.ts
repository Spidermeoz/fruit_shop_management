import type { PostRepository } from "../../../domain/posts/PostRepository";

export class SoftDeletePost {
  constructor(private repo: PostRepository) {}

  async execute(id: number, deletedById?: number | null) {
    await this.repo.softDelete(id, deletedById ?? null);
    return { id };
  }
}
