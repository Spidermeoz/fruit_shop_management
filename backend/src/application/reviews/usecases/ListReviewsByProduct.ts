import type { ReviewRepository } from "../../../domain/reviews/ReviewRepository";

export class ListReviewsByProduct {
  constructor(private repo: ReviewRepository) {}

  async execute(productId: number) {
    const rows = await this.repo.listByProduct(productId);

    // Group replies theo parentId
    const map = new Map<number, any>();

    rows.forEach((r: any) => {
      const obj = {
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
      };

      if (!r.parent_id) {
        map.set(r.id, { ...obj, replies: [] });
      } else {
        const parent = map.get(r.parent_id);
        if (parent) parent.replies.push(obj);
      }
    });

    return Array.from(map.values());
  }
}
