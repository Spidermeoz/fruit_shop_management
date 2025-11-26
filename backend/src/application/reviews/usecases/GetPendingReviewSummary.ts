import { ReviewRepository } from "../../../domain/reviews/ReviewRepository";

export class GetPendingReviewSummary {
  constructor(private reviewRepo: ReviewRepository) {}

  async execute() {
    const rows = await this.reviewRepo.countPendingReviewsByProduct();

    return rows.map((r: any) => ({
      productId: r.product_id,
      pending: Number(r.dataValues.pending_count || 0),
    }));
  }
}
