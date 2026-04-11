import type { PostRepository } from "../../../domain/posts/PostRepository";
import type {
  PostListFilter,
  PostListSummary,
} from "../../../domain/posts/types";

export class GetPostSummary {
  constructor(private repo: PostRepository) {}

  async execute(filter: Omit<PostListFilter, "page" | "limit"> = {}) {
    const { summary } = await this.repo.list({
      page: 1,
      limit: 1,
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

    const normalized: PostListSummary = {
      totalItems: Number(summary?.totalItems ?? 0),
      draftCount: Number(summary?.draftCount ?? 0),
      publishedCount: Number(summary?.publishedCount ?? 0),
      inactiveCount: Number(summary?.inactiveCount ?? 0),
      archivedCount: Number(summary?.archivedCount ?? 0),
      featuredCount: Number(summary?.featuredCount ?? 0),
      missingThumbnailCount: Number(summary?.missingThumbnailCount ?? 0),
      missingSeoCount: Number(summary?.missingSeoCount ?? 0),
    };

    return normalized;
  }
}
