export interface ReviewCreateInput {
  productId: number;
  productVariantId?: number | null;
  orderId: number;
  userId: number;
  rating: number | null;
  content: string | null;
}

export interface ReviewReplyInput {
  parentId: number;
  userId: number;
  content: string;
}

export interface ReviewRepository {
  create(input: ReviewCreateInput): Promise<any>;
  reply(input: ReviewReplyInput): Promise<any>;

  listByProduct(productId: number): Promise<any[]>;
  listByUser(userId: number): Promise<any[]>;

  userCanReview(
    userId: number,
    productId: number,
    orderId: number,
    productVariantId?: number | null,
  ): Promise<boolean>;

  hasReviewed(
    userId: number,
    orderId: number,
    productId: number,
    productVariantId?: number | null,
  ): Promise<boolean>;

  countPendingReviewsByProduct(): Promise<any[]>;
}
