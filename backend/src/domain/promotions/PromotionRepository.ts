import type {
  CreatePromotionInput,
  PromotionCodeProps,
  PromotionListFilter,
  PromotionListResult,
  PromotionProps,
  PromotionUsageProps,
  UpdatePromotionPatch,
} from "./types";

export interface PromotionRepository {
  list(filter: PromotionListFilter): Promise<PromotionListResult>;

  findById(id: number): Promise<PromotionProps | null>;

  create(input: CreatePromotionInput): Promise<PromotionProps>;

  update(id: number, patch: UpdatePromotionPatch): Promise<PromotionProps>;

  changeStatus(id: number, status: "active" | "inactive"): Promise<void>;

  softDelete(id: number): Promise<void>;

  findPromotionCodeByCode(code: string): Promise<PromotionCodeProps | null>;

  findPromotionByCode(code: string): Promise<PromotionProps | null>;

  findActiveAutoApplyPromotions(now: Date): Promise<PromotionProps[]>;

  countUsageByPromotion(
    promotionId: number,
    transaction?: any,
  ): Promise<number>;

  countUsageByPromotionAndUser(
    promotionId: number,
    userId: number,
    transaction?: any,
  ): Promise<number>;

  createUsage(input: PromotionUsageProps, transaction?: any): Promise<void>;

  incrementCodeUsage(codeId: number, transaction?: any): Promise<void>;
}
