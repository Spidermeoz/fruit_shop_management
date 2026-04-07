import type { PostTagRepository } from "../../../domain/post-tags/PostTagRepository";

export class GetPostTagSummary {
  constructor(private repo: PostTagRepository) {}

  async execute() {
    return this.repo.getSummary();
  }
}
