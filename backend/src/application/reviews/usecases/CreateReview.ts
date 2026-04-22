import type { ReviewRepository } from "../../../domain/reviews/ReviewRepository";
import type { CreateNotification } from "../../notifications/usecases/CreateNotification";

export class CreateReview {
  constructor(
    private repo: ReviewRepository,
    private createNotification?: CreateNotification,
  ) {}

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

    const created = await this.repo.create({
      userId,
      productId: input.productId,
      productVariantId: input.productVariantId ?? null,
      orderId: input.orderId,
      rating: input.rating,
      content: input.content,
    });

    if (this.createNotification) {
      await this.createNotification.execute({
        eventKey: "review_created",
        category: "review",
        severity: "info",
        title: `Có đánh giá mới cho sản phẩm #${input.productId}`,
        message: `Khách hàng vừa gửi đánh giá mới cho sản phẩm #${input.productId} từ đơn hàng #${input.orderId}.`,
        entityType: "product_review",
        entityId: Number(created?.id ?? 0) || null,
        actorUserId: userId,
        targetUrl: "/admin/notifications?category=review",
        metaJson: {
          productId: input.productId,
          productVariantId: input.productVariantId ?? null,
          orderId: input.orderId,
          rating: input.rating,
        },
        dedupeKey:
          Number(created?.id ?? 0) > 0
            ? `review_created:${Number(created.id)}`
            : null,
        includeSuperAdmins: true,
        deliverToAllInternalUsers: true,
      });
    }

    return created;
  }
}
