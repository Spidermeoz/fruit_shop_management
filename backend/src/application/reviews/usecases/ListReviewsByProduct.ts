import type { ReviewRepository } from "../../../domain/reviews/ReviewRepository";

export class ListReviewsByProduct {
  constructor(private repo: ReviewRepository) {}

  async execute(productId: number) {
    const rows = await this.repo.listByProduct(productId);

    return rows.map((r: any) => ({
      id: r.id,
      productId: r.product_id,
      orderId: r.order_id,
      rating: r.rating,
      content: r.content,
      createdAt: r.created_at,
      user: r.user
        ? {
            id: r.user.id,
            name: r.user.full_name,
            avatar: r.user.avatar,
          }
        : null,
      replies:
        r.replies?.map((rep: any) => ({
          id: rep.id,
          content: rep.content,
          createdAt: rep.created_at,
          user: rep.user
            ? {
                id: rep.user.id,
                name: rep.user.full_name,
                avatar: rep.user.avatar,
              }
            : null,
        })) || [],
    }));
  }
}
