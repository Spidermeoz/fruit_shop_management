import type { PromotionRepository } from "../../../domain/promotions/PromotionRepository";
import type { PromotionStatus } from "../../../domain/promotions/types";

export class ChangePromotionStatus {
  constructor(private readonly promotionRepo: PromotionRepository) {}

  async execute(id: number, status: PromotionStatus): Promise<void> {
    const promotionId = Number(id);

    if (!Number.isFinite(promotionId) || promotionId <= 0) {
      throw new Error("ID khuyến mãi không hợp lệ");
    }

    if (!["active", "inactive"].includes(status)) {
      throw new Error("Trạng thái khuyến mãi không hợp lệ");
    }

    const existing = await this.promotionRepo.findById(promotionId);

    if (!existing) {
      throw new Error("Khuyến mãi không tồn tại");
    }

    await this.promotionRepo.changeStatus(promotionId, status);
  }
}
