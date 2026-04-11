import type { PostCategoryRepository } from "../../../domain/post-categories/PostCategoryRepository";

export class ListClientPostCategories {
  constructor(private repo: PostCategoryRepository) {}

  async execute() {
    const { rows } = await this.repo.list({
      page: 1,
      limit: 1000,
      status: "active",
      sortBy: "position",
      order: "ASC",
    });

    return rows
      .map((row) => row.props)
      .filter((item) => !item.deleted && item.status === "active");
  }
}
