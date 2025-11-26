export interface ReviewCreateInput {
  productId: number;
  orderId: number;
  userId: number;
  rating: number | null;
  content: string | null;
}

export interface ReviewReplyInput {
  parentId: number;
  userId: number; // admin
  content: string;
}

export interface ReviewRepository {
  create(input: ReviewCreateInput): Promise<any>;
  reply(input: ReviewReplyInput): Promise<any>;

  listByProduct(productId: number): Promise<any[]>;
  listByUser(userId: number): Promise<any[]>;

  userCanReview(userId: number, productId: number, orderId: number): Promise<boolean>;

  hasReviewed(userId: number, orderId: number, productId: number): Promise<boolean>;

  countPendingReviewsByProduct(): Promise<any[]>;

}
