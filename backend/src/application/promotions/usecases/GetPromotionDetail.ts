import type { PromotionRepository } from "../../../domain/promotions/PromotionRepository";
import type { PromotionProps } from "../../../domain/promotions/types";

export class GetPromotionDetail {
  constructor(private readonly promotionRepo: PromotionRepository) {}

  async execute(id: number): Promise<PromotionProps> {
    const promotionId = Number(id);

    if (!Number.isFinite(promotionId) || promotionId <= 0) {
      throw new Error("ID khuyến mãi không hợp lệ");
    }

    const promotion = await this.promotionRepo.findById(promotionId);

    if (!promotion) {
      throw new Error("Khuyến mãi không tồn tại");
    }

    return promotion;
  }
}
