import type { PromotionRepository } from "../../../domain/promotions/PromotionRepository";
import type {
  PromotionApplicabilityReason,
  PromotionCodeProps,
  PromotionProps,
  PromotionValidationResult,
} from "../../../domain/promotions/types";

type Input = {
  userId: number;
  promotionCode: string;
  subtotal: number;
  now?: Date;
};

const normalizeCode = (value?: string | null): string => {
  return String(value ?? "")
    .trim()
    .toUpperCase();
};

const buildResult = (
  ok: boolean,
  reason: PromotionApplicabilityReason,
  message: string,
  promotion: PromotionProps | null,
  promotionCode: PromotionCodeProps | null,
): PromotionValidationResult => ({
  ok,
  reason,
  message,
  promotion,
  promotionCode,
});

export class ValidatePromotionCodeService {
  constructor(private readonly promotionRepo: PromotionRepository) {}

  async execute(input: Input): Promise<PromotionValidationResult> {
    const userId = Number(input.userId);
    const subtotal = Number(input.subtotal ?? 0);
    const now = input.now ?? new Date();
    const normalizedCode = normalizeCode(input.promotionCode);

    if (!normalizedCode) {
      return buildResult(
        false,
        "CODE_NOT_FOUND",
        "Bạn chưa nhập mã khuyến mãi",
        null,
        null,
      );
    }

    const foundCode =
      await this.promotionRepo.findPromotionCodeByCode(normalizedCode);

    if (!foundCode) {
      return buildResult(
        false,
        "CODE_NOT_FOUND",
        "Mã khuyến mãi không tồn tại",
        null,
        null,
      );
    }

    if (foundCode.deleted) {
      return buildResult(
        false,
        "CODE_DELETED",
        "Mã khuyến mãi không còn khả dụng",
        null,
        foundCode,
      );
    }

    if (foundCode.status !== "active") {
      return buildResult(
        false,
        "CODE_INACTIVE",
        "Mã khuyến mãi hiện không hoạt động",
        null,
        foundCode,
      );
    }

    if (foundCode.startAt && now < foundCode.startAt) {
      return buildResult(
        false,
        "CODE_NOT_STARTED",
        "Mã khuyến mãi chưa bắt đầu",
        null,
        foundCode,
      );
    }

    if (foundCode.endAt && now > foundCode.endAt) {
      return buildResult(
        false,
        "CODE_EXPIRED",
        "Mã khuyến mãi đã hết hạn",
        null,
        foundCode,
      );
    }

    const promotion = await this.promotionRepo.findById(foundCode.promotionId);

    if (!promotion) {
      return buildResult(
        false,
        "PROMOTION_NOT_FOUND",
        "Chương trình khuyến mãi không tồn tại",
        null,
        foundCode,
      );
    }

    if (promotion.deleted) {
      return buildResult(
        false,
        "PROMOTION_DELETED",
        "Chương trình khuyến mãi không còn khả dụng",
        promotion,
        foundCode,
      );
    }

    if (promotion.status !== "active") {
      return buildResult(
        false,
        "PROMOTION_INACTIVE",
        "Chương trình khuyến mãi hiện không hoạt động",
        promotion,
        foundCode,
      );
    }

    if (promotion.startAt && now < promotion.startAt) {
      return buildResult(
        false,
        "PROMOTION_NOT_STARTED",
        "Chương trình khuyến mãi chưa bắt đầu",
        promotion,
        foundCode,
      );
    }

    if (promotion.endAt && now > promotion.endAt) {
      return buildResult(
        false,
        "PROMOTION_EXPIRED",
        "Chương trình khuyến mãi đã hết hạn",
        promotion,
        foundCode,
      );
    }

    if (
      promotion.minOrderValue !== null &&
      promotion.minOrderValue !== undefined &&
      subtotal < Number(promotion.minOrderValue)
    ) {
      return buildResult(
        false,
        "MIN_ORDER_NOT_MET",
        `Đơn hàng chưa đạt giá trị tối thiểu ${Number(
          promotion.minOrderValue,
        ).toLocaleString("vi-VN")} đ`,
        promotion,
        foundCode,
      );
    }

    if (
      foundCode.usageLimit !== null &&
      foundCode.usageLimit !== undefined &&
      Number(foundCode.usageCount ?? 0) >= Number(foundCode.usageLimit)
    ) {
      return buildResult(
        false,
        "PROMOTION_USAGE_LIMIT_EXCEEDED",
        "Mã khuyến mãi đã hết lượt sử dụng",
        promotion,
        foundCode,
      );
    }

    if (
      promotion.usageLimit !== null &&
      promotion.usageLimit !== undefined &&
      (await this.promotionRepo.countUsageByPromotion(
        promotion.id!,
        undefined,
      )) >= Number(promotion.usageLimit)
    ) {
      return buildResult(
        false,
        "PROMOTION_USAGE_LIMIT_EXCEEDED",
        "Chương trình khuyến mãi đã hết lượt sử dụng",
        promotion,
        foundCode,
      );
    }

    if (
      promotion.usageLimitPerUser !== null &&
      promotion.usageLimitPerUser !== undefined &&
      (await this.promotionRepo.countUsageByPromotionAndUser(
        promotion.id!,
        userId,
        undefined,
      )) >= Number(promotion.usageLimitPerUser)
    ) {
      return buildResult(
        false,
        "PROMOTION_USER_LIMIT_EXCEEDED",
        "Bạn đã dùng hết số lượt cho mã này",
        promotion,
        foundCode,
      );
    }

    return buildResult(
      true,
      "OK",
      "Mã khuyến mãi hợp lệ",
      promotion,
      foundCode,
    );
  }
}
