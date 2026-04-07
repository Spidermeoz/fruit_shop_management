import type { PostCategoryRepository } from "../../../domain/post-categories/PostCategoryRepository";
import type { PostCategoryListFilter } from "../../../domain/post-categories/types";

export class ListPostCategories {
  constructor(private repo: PostCategoryRepository) {}

  async execute(filter: PostCategoryListFilter) {
    const { rows, count, summary } = await this.repo.list({
      page: filter.page ?? 1,
      limit: filter.limit ?? 10,
      q: filter.q,
      parentId: filter.parentId ?? null,
      status: filter.status ?? "all",
      missingThumbnail: filter.missingThumbnail,
      missingSeo: filter.missingSeo,
      sortBy: filter.sortBy ?? "id",
      order: filter.order ?? "DESC",
    });

    return {
      rows,
      count,
      summary,
    };
  }
}
