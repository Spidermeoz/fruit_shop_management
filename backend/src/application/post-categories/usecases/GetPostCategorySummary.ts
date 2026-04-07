import type { PostCategoryRepository } from "../../../domain/post-categories/PostCategoryRepository";

type PostCategorySummary = {
  totalItems: number;
  activeCount: number;
  inactiveCount: number;
  rootCount: number;
  childCount: number;
  missingThumbnailCount: number;
  missingSeoCount: number;
};

type ExtendedPostCategoryRepository = PostCategoryRepository & {
  getSummary?: () => Promise<PostCategorySummary>;
};

function emptySummary(): PostCategorySummary {
  return {
    totalItems: 0,
    activeCount: 0,
    inactiveCount: 0,
    rootCount: 0,
    childCount: 0,
    missingThumbnailCount: 0,
    missingSeoCount: 0,
  };
}

export class GetPostCategorySummary {
  constructor(private repo: PostCategoryRepository) {}

  async execute(): Promise<PostCategorySummary> {
    const extendedRepo = this.repo as ExtendedPostCategoryRepository;

    if (typeof extendedRepo.getSummary === "function") {
      return extendedRepo.getSummary();
    }

    const fallback = await this.repo.list({
      page: 1,
      limit: 10000,
      status: "all",
      sortBy: "id",
      order: "DESC",
    });

    if (fallback.summary) {
      return {
        totalItems: Number(fallback.summary.totalItems ?? 0),
        activeCount: Number(fallback.summary.activeCount ?? 0),
        inactiveCount: Number(fallback.summary.inactiveCount ?? 0),
        rootCount: Number(fallback.summary.rootCount ?? 0),
        childCount: Number(fallback.summary.childCount ?? 0),
        missingThumbnailCount: Number(
          fallback.summary.missingThumbnailCount ?? 0,
        ),
        missingSeoCount: Number(fallback.summary.missingSeoCount ?? 0),
      };
    }

    return emptySummary();
  }
}
