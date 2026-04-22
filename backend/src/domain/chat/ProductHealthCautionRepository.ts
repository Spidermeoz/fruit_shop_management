import type { ProductHealthCaution } from "./types";

export interface ProductHealthCautionRepository {
  listActiveByProductId(productId: number): Promise<ProductHealthCaution[]>;
  listActiveByProductIds(productIds: number[]): Promise<ProductHealthCaution[]>;
}
