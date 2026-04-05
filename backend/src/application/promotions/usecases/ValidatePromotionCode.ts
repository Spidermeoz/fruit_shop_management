import { ValidatePromotionCodeService } from "../services/ValidatePromotionCodeService";
import type { PromotionValidationResult } from "../../../domain/promotions/types";

type Input = {
  userId: number;
  promotionCode: string;
  subtotal: number;
  now?: Date;
};

export class ValidatePromotionCode {
  constructor(
    private readonly validatePromotionCodeService: ValidatePromotionCodeService,
  ) {}

  async execute(input: Input): Promise<PromotionValidationResult> {
    const userId = Number(input.userId);
    const subtotal = Number(input.subtotal ?? 0);
    const promotionCode = String(input.promotionCode ?? "").trim();

    if (!Number.isFinite(userId) || userId <= 0) {
      throw new Error("Người dùng không hợp lệ");
    }

    if (!promotionCode) {
      throw new Error("Bạn chưa nhập mã khuyến mãi");
    }

    if (!Number.isFinite(subtotal) || subtotal < 0) {
      throw new Error("Giá trị đơn hàng không hợp lệ");
    }

    return this.validatePromotionCodeService.execute({
      userId,
      promotionCode,
      subtotal,
      now: input.now,
    });
  }
}
