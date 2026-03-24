import type { ReviewRepository } from "../../../domain/reviews/ReviewRepository";

export class CreateReview {
  constructor(private repo: ReviewRepository) {}

  async execute(
    userId: number,
    input: {
      productId: number;
      productVariantId?: number | null;
      orderId: number;
      rating: number | null;
      content: string | null;
    },
  ) {
    const can = await this.repo.userCanReview(
      userId,
      input.productId,
      input.orderId,
      input.productVariantId ?? null,
    );

    if (!input.rating && !input.content) {
      throw new Error("Review phải có rating hoặc nội dung");
    }

    if (!can) {
      throw new Error("Bạn không thể đánh giá sản phẩm này.");
    }

    const reviewed = await this.repo.hasReviewed(
      userId,
      input.orderId,
      input.productId,
      input.productVariantId ?? null,
    );

    if (reviewed) {
      throw new Error("Bạn đã đánh giá biến thể này rồi.");
    }

    return await this.repo.create({
      userId,
      productId: input.productId,
      productVariantId: input.productVariantId ?? null,
      orderId: input.orderId,
      rating: input.rating,
      content: input.content,
    });
  }
}
