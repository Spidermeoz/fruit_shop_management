import type { ProductHealthFact } from "./types";

export interface ProductHealthFactRepository {
  listByProductId(productId: number): Promise<ProductHealthFact[]>;
  listByProductIds(productIds: number[]): Promise<ProductHealthFact[]>;
}
