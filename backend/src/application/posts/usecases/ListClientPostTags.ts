import type { PostTagRepository } from "../../../domain/post-tags/PostTagRepository";

export class ListClientPostTags {
  constructor(private repo: PostTagRepository) {}

  async execute() {
    const { rows } = await this.repo.list({
      page: 1,
      limit: 1000,
      status: "active",
      sortBy: "name",
      order: "ASC",
    });

    return rows
      .map((row) => row.props)
      .filter((item) => !item.deleted && item.status === "active");
  }
}
