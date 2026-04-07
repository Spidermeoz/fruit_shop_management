import type { PostRepository } from "../../../domain/posts/PostRepository";
import type { PostListFilter } from "../../../domain/posts/types";

export class ListPosts {
  constructor(private repo: PostRepository) {}

  async execute(filter: PostListFilter) {
    const { rows, count, summary } = await this.repo.list({
      page: filter.page ?? 1,
      limit: filter.limit ?? 10,
      q: filter.q,
      categoryId: filter.categoryId ?? null,
      status: filter.status ?? "all",
      featured: filter.featured,
      missingThumbnail: filter.missingThumbnail,
      missingSeo: filter.missingSeo,
      publishedOnly: filter.publishedOnly,
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
