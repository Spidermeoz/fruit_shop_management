import type { ReviewRepository } from "../../../domain/reviews/ReviewRepository";

export class CreateReview {
  constructor(private repo: ReviewRepository) {}

  async execute(userId: number, input: {
    productId: number;
    orderId: number;
    rating: number | null;
    content: string | null;
  }) {
    // Kiểm tra quyền review
    const can = await this.repo.userCanReview(
      userId,
      input.productId,
      input.orderId
    );

    if (!can) {
      throw new Error("Bạn không thể đánh giá sản phẩm này.");
    }

    return await this.repo.create({
      userId,
      productId: input.productId,
      orderId: input.orderId,
      rating: input.rating,
      content: input.content,
    });
  }
}
