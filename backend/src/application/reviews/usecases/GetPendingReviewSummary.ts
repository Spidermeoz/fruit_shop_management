import { ReviewRepository } from "../../../domain/reviews/ReviewRepository";

export class GetPendingReviewSummary {
  constructor(private reviewRepo: ReviewRepository) {}

  async execute() {
    const rows = await this.reviewRepo.countPendingReviewsByProduct();

    return rows.map((r: any) => ({
      productId: Number(r.product_id),
      pending: Number(r.pending_count || 0),
    }));
  }
}
