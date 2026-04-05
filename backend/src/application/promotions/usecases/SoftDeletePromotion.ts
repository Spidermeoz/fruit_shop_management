import type { PromotionRepository } from "../../../domain/promotions/PromotionRepository";

export class SoftDeletePromotion {
  constructor(private readonly promotionRepo: PromotionRepository) {}

  async execute(id: number): Promise<void> {
    const promotionId = Number(id);

    if (!Number.isFinite(promotionId) || promotionId <= 0) {
      throw new Error("ID khuyến mãi không hợp lệ");
    }

    const existing = await this.promotionRepo.findById(promotionId);

    if (!existing) {
      throw new Error("Khuyến mãi không tồn tại");
    }

    await this.promotionRepo.softDelete(promotionId);
  }
}
