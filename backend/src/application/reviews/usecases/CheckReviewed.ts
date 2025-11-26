import type { ReviewRepository } from "../../../domain/reviews/ReviewRepository";

export class CheckReviewed {
  constructor(private repo: ReviewRepository) {}

  async execute(userId: number, orderId: number, productId: number) {
    return await this.repo.hasReviewed(userId, orderId, productId);
  }
}
