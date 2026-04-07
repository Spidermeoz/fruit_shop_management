import type { PostCategoryRepository } from "../../../domain/post-categories/PostCategoryRepository";

type ExtendedPostCategoryRepository = PostCategoryRepository & {
  hasChildren?: (id: number) => Promise<boolean>;
  countActivePostsUsingCategory?: (id: number) => Promise<number>;
};

export class SoftDeletePostCategory {
  constructor(private repo: PostCategoryRepository) {}

  async execute(id: number) {
    const extendedRepo = this.repo as ExtendedPostCategoryRepository;

    const existing = await this.repo.findById(id);
    if (!existing) {
      throw new Error("Post category not found");
    }

    if (typeof extendedRepo.hasChildren === "function") {
      const hasChildren = await extendedRepo.hasChildren(id);
      if (hasChildren) {
        throw new Error(
          "Cannot delete this category because it still has child categories",
        );
      }
    }

    if (typeof extendedRepo.countActivePostsUsingCategory === "function") {
      const activePosts = await extendedRepo.countActivePostsUsingCategory(id);
      if (activePosts > 0) {
        throw new Error(
          "Cannot delete this category because there are posts using it",
        );
      }
    }

    await this.repo.softDelete(id);
    return { id };
  }
}
