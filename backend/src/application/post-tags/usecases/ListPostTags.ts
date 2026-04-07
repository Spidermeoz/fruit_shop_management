import type { PostTagRepository } from "../../../domain/post-tags/PostTagRepository";
import type { PostTagListFilter } from "../../../domain/post-tags/types";

export class ListPostTags {
  constructor(private repo: PostTagRepository) {}

  async execute(filter: PostTagListFilter) {
    const { rows, count, summary } = await this.repo.list({
      page: filter.page ?? 1,
      limit: filter.limit ?? 10,
      q: filter.q,
      status: filter.status ?? "all",
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
