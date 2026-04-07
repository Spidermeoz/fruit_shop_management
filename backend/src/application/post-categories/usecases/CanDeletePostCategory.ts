import type { PostCategoryRepository } from "../../../domain/post-categories/PostCategoryRepository";

type ExtendedPostCategoryRepository = PostCategoryRepository & {
  hasChildren?: (id: number) => Promise<boolean>;
  countActivePostsUsingCategory?: (id: number) => Promise<number>;
};

export class CanDeletePostCategory {
  constructor(private repo: PostCategoryRepository) {}

  async execute(id: number) {
    const normalizedId = Number(id);
    if (!Number.isInteger(normalizedId) || normalizedId <= 0) {
      throw new Error("Post category id is invalid");
    }

    const existing = await this.repo.findById(normalizedId);
    if (!existing) {
      throw new Error("Post category not found");
    }

    const extendedRepo = this.repo as ExtendedPostCategoryRepository;

    let hasChildren = false;
    let activePostsCount = 0;

    if (typeof extendedRepo.hasChildren === "function") {
      hasChildren = await extendedRepo.hasChildren(normalizedId);
    }

    if (typeof extendedRepo.countActivePostsUsingCategory === "function") {
      activePostsCount =
        await extendedRepo.countActivePostsUsingCategory(normalizedId);
    }

    return {
      id: normalizedId,
      canDelete: !hasChildren && activePostsCount === 0,
      reasons: [
        ...(hasChildren ? ["CATEGORY_HAS_CHILDREN"] : []),
        ...(activePostsCount > 0 ? ["CATEGORY_IN_USE_BY_POSTS"] : []),
      ],
      checks: {
        hasChildren,
        activePostsCount,
      },
    };
  }
}
