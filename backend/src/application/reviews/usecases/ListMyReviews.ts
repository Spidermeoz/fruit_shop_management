import type { ReviewRepository } from "../../../domain/reviews/ReviewRepository";

export class ListMyReviews {
  constructor(private repo: ReviewRepository) {}

  async execute(userId: number) {
    return await this.repo.listByUser(userId);
  }
}
