import type { ProductRecommendationLog } from "./types";

export type CreateProductRecommendationLogInput = {
  chatSessionId: number;
  chatMessageId?: number | null;
  productId: number;
  productVariantId?: number | null;
  rankPosition: number;
  score?: number | null;
  reason?: string | null;
  matchedTagsJson?: string[] | null;
  matchedAttributesJson?: Record<string, any> | null;
};

export interface ProductRecommendationLogRepository {
  create(
    input: CreateProductRecommendationLogInput,
  ): Promise<ProductRecommendationLog>;
  createMany(
    inputs: CreateProductRecommendationLogInput[],
  ): Promise<ProductRecommendationLog[]>;
  listBySessionId(chatSessionId: number): Promise<ProductRecommendationLog[]>;
}
