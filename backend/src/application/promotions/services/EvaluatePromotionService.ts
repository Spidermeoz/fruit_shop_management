import type { PromotionRepository } from "../../../domain/promotions/PromotionRepository";
import type {
  AppliedPromotionBreakdown,
  PromotionCartItemInput,
  PromotionEvaluationInput,
  PromotionEvaluationResult,
  PromotionProps,
} from "../../../domain/promotions/types";
import { ValidatePromotionCodeService } from "./ValidatePromotionCodeService";

const roundMoney = (value: number) =>
  Math.max(0, Math.round(value * 100) / 100);

const uniqueNumbers = (values: Array<number | null | undefined>) =>
  Array.from(
    new Set(
      values
        .filter((x) => x !== null && x !== undefined)
        .map((x) => Number(x))
        .filter((x) => Number.isFinite(x) && x > 0),
    ),
  );

const calcPromotionAmount = (
  baseAmount: number,
  promotion: PromotionProps,
): number => {
  const discountType = promotion.discountType;
  const discountValue = Number(promotion.discountValue ?? 0);
  const maxDiscountAmount =
    promotion.maxDiscountAmount !== null &&
    promotion.maxDiscountAmount !== undefined
      ? Number(promotion.maxDiscountAmount)
      : null;

  let amount = 0;

  if (discountType === "fixed") {
    amount = discountValue;
  } else if (discountType === "percent") {
    amount = (baseAmount * discountValue) / 100;
  } else if (discountType === "free_shipping") {
    amount = baseAmount;
  }

  if (maxDiscountAmount !== null) {
    amount = Math.min(amount, maxDiscountAmount);
  }

  return roundMoney(Math.min(baseAmount, Math.max(0, amount)));
};

const itemMatchesPromotion = (
  item: PromotionCartItemInput,
  promotion: PromotionProps,
): boolean => {
  const targets = promotion.targets ?? {
    productIds: [],
    categoryIds: [],
    variantIds: [],
    originIds: [],
    branchIds: [],
  };

  const hasItemRestrictions =
    targets.productIds.length > 0 ||
    targets.categoryIds.length > 0 ||
    targets.variantIds.length > 0 ||
    targets.originIds.length > 0;

  if (!hasItemRestrictions) {
    return true;
  }

  const productId = item.productId != null ? Number(item.productId) : null;
  const categoryId = item.categoryId != null ? Number(item.categoryId) : null;
  const variantId =
    item.productVariantId != null ? Number(item.productVariantId) : null;
  const originId = item.originId != null ? Number(item.originId) : null;

  if (
    targets.productIds.length > 0 &&
    productId &&
    targets.productIds.includes(productId)
  ) {
    return true;
  }

  if (
    targets.categoryIds.length > 0 &&
    categoryId &&
    targets.categoryIds.includes(categoryId)
  ) {
    return true;
  }

  if (
    targets.variantIds.length > 0 &&
    variantId &&
    targets.variantIds.includes(variantId)
  ) {
    return true;
  }

  if (
    targets.originIds.length > 0 &&
    originId &&
    targets.originIds.includes(originId)
  ) {
    return true;
  }

  return false;
};

const collectMatchedItems = (
  cartItems: PromotionCartItemInput[],
  promotion: PromotionProps,
) => cartItems.filter((item) => itemMatchesPromotion(item, promotion));

export class EvaluatePromotionService {
  constructor(
    private readonly promotionRepo: PromotionRepository,
    private readonly validatePromotionCodeService: ValidatePromotionCodeService,
  ) {}

  async execute(
    input: PromotionEvaluationInput,
  ): Promise<PromotionEvaluationResult> {
    const now = input.now ?? new Date();
    const subtotal = roundMoney(Number(input.subtotal ?? 0));
    const shippingFee = roundMoney(Number(input.shippingFee ?? 0));
    const branchId =
      input.branchId !== null && input.branchId !== undefined
        ? Number(input.branchId)
        : null;
    const cartItems = Array.isArray(input.cartItems) ? input.cartItems : [];

    let discountAmount = 0;
    let shippingDiscountAmount = 0;
    let appliedPromotions: AppliedPromotionBreakdown[] = [];
    const messages: string[] = [];
    let selectedPromotionCode: string | null = null;

    if (input.promotionCode && String(input.promotionCode).trim()) {
      const validation = await this.validatePromotionCodeService.execute({
        userId: Number(input.userId),
        promotionCode: String(input.promotionCode),
        subtotal,
        now,
      });

      if (!validation.ok || !validation.promotion) {
        return {
          subtotal,
          shippingFee,
          discountAmount: 0,
          shippingDiscountAmount: 0,
          finalPrice: roundMoney(subtotal + shippingFee),
          appliedPromotions: [],
          promotionCode: null,
          promotionSnapshotJson: null,
          messages: [validation.message],
        };
      }

      const promotion = validation.promotion;
      const promotionCode = validation.promotionCode;

      if (
        promotion.targets?.branchIds?.length &&
        (!branchId || !promotion.targets.branchIds.includes(branchId))
      ) {
        return {
          subtotal,
          shippingFee,
          discountAmount: 0,
          shippingDiscountAmount: 0,
          finalPrice: roundMoney(subtotal + shippingFee),
          appliedPromotions: [],
          promotionCode: null,
          promotionSnapshotJson: null,
          messages: ["Mã khuyến mãi không áp dụng cho chi nhánh đã chọn"],
        };
      }

      const matchedItems = collectMatchedItems(cartItems, promotion);

      if (promotion.promotionScope === "order") {
        if (
          matchedItems.length === 0 &&
          promotion.targets &&
          (promotion.targets.productIds.length > 0 ||
            promotion.targets.categoryIds.length > 0 ||
            promotion.targets.variantIds.length > 0 ||
            promotion.targets.originIds.length > 0)
        ) {
          return {
            subtotal,
            shippingFee,
            discountAmount: 0,
            shippingDiscountAmount: 0,
            finalPrice: roundMoney(subtotal + shippingFee),
            appliedPromotions: [],
            promotionCode: null,
            promotionSnapshotJson: null,
            messages: [
              "Mã khuyến mãi không áp dụng cho sản phẩm trong giỏ hàng",
            ],
          };
        }

        const eligibleSubtotal =
          matchedItems.length > 0
            ? roundMoney(
                matchedItems.reduce(
                  (sum, item) => sum + Number(item.lineSubtotal ?? 0),
                  0,
                ),
              )
            : subtotal;

        discountAmount = calcPromotionAmount(eligibleSubtotal, promotion);
      } else if (promotion.promotionScope === "shipping") {
        shippingDiscountAmount = calcPromotionAmount(shippingFee, promotion);
      }

      const affectedProductIds = uniqueNumbers(
        matchedItems.map((x) => x.productId),
      );
      const affectedVariantIds = uniqueNumbers(
        matchedItems.map((x) => x.productVariantId),
      );
      const affectedCategoryIds = uniqueNumbers(
        matchedItems.map((x) => x.categoryId),
      );
      const affectedOriginIds = uniqueNumbers(
        matchedItems.map((x) => x.originId),
      );

      appliedPromotions = [
        {
          promotionId: Number(promotion.id),
          promotionName: promotion.name,
          promotionScope: promotion.promotionScope,
          discountType: promotion.discountType,
          discountValue: Number(promotion.discountValue ?? 0),
          promotionCodeId: promotionCode?.id ?? null,
          promotionCode: promotionCode?.code ?? null,
          discountAmount,
          shippingDiscountAmount,
          affectedProductIds,
          affectedVariantIds,
          affectedCategoryIds,
          affectedOriginIds,
        },
      ];

      selectedPromotionCode = promotionCode?.code ?? null;
      messages.push("Áp mã khuyến mãi thành công");
    } else if (input.allowAutoApply !== false) {
      const autoPromotions =
        await this.promotionRepo.findActiveAutoApplyPromotions(now);

      const sorted = [...autoPromotions].sort((a, b) => {
        const priorityDiff = Number(b.priority ?? 0) - Number(a.priority ?? 0);
        if (priorityDiff !== 0) return priorityDiff;
        return Number(b.id ?? 0) - Number(a.id ?? 0);
      });

      for (const promotion of sorted) {
        if (promotion.deleted || promotion.status !== "active") continue;

        if (
          promotion.minOrderValue !== null &&
          promotion.minOrderValue !== undefined &&
          subtotal < Number(promotion.minOrderValue)
        ) {
          continue;
        }

        if (
          promotion.targets?.branchIds?.length &&
          (!branchId || !promotion.targets.branchIds.includes(branchId))
        ) {
          continue;
        }

        const matchedItems = collectMatchedItems(cartItems, promotion);

        if (
          promotion.promotionScope === "order" &&
          matchedItems.length === 0 &&
          promotion.targets &&
          (promotion.targets.productIds.length > 0 ||
            promotion.targets.categoryIds.length > 0 ||
            promotion.targets.variantIds.length > 0 ||
            promotion.targets.originIds.length > 0)
        ) {
          continue;
        }

        const usageTotal =
          promotion.usageLimit !== null && promotion.usageLimit !== undefined
            ? await this.promotionRepo.countUsageByPromotion(
                Number(promotion.id),
              )
            : 0;

        if (
          promotion.usageLimit !== null &&
          promotion.usageLimit !== undefined &&
          usageTotal >= Number(promotion.usageLimit)
        ) {
          continue;
        }

        const usageByUser =
          promotion.usageLimitPerUser !== null &&
          promotion.usageLimitPerUser !== undefined
            ? await this.promotionRepo.countUsageByPromotionAndUser(
                Number(promotion.id),
                Number(input.userId),
              )
            : 0;

        if (
          promotion.usageLimitPerUser !== null &&
          promotion.usageLimitPerUser !== undefined &&
          usageByUser >= Number(promotion.usageLimitPerUser)
        ) {
          continue;
        }

        let currentDiscountAmount = 0;
        let currentShippingDiscountAmount = 0;

        if (promotion.promotionScope === "order") {
          const eligibleSubtotal =
            matchedItems.length > 0
              ? roundMoney(
                  matchedItems.reduce(
                    (sum, item) => sum + Number(item.lineSubtotal ?? 0),
                    0,
                  ),
                )
              : subtotal;

          currentDiscountAmount = calcPromotionAmount(
            eligibleSubtotal,
            promotion,
          );
        } else if (promotion.promotionScope === "shipping") {
          currentShippingDiscountAmount = calcPromotionAmount(
            shippingFee,
            promotion,
          );
        }

        if (currentDiscountAmount <= 0 && currentShippingDiscountAmount <= 0) {
          continue;
        }

        discountAmount = currentDiscountAmount;
        shippingDiscountAmount = currentShippingDiscountAmount;

        appliedPromotions = [
          {
            promotionId: Number(promotion.id),
            promotionName: promotion.name,
            promotionScope: promotion.promotionScope,
            discountType: promotion.discountType,
            discountValue: Number(promotion.discountValue ?? 0),
            promotionCodeId: null,
            promotionCode: null,
            discountAmount,
            shippingDiscountAmount,
            affectedProductIds: uniqueNumbers(
              matchedItems.map((x) => x.productId),
            ),
            affectedVariantIds: uniqueNumbers(
              matchedItems.map((x) => x.productVariantId),
            ),
            affectedCategoryIds: uniqueNumbers(
              matchedItems.map((x) => x.categoryId),
            ),
            affectedOriginIds: uniqueNumbers(
              matchedItems.map((x) => x.originId),
            ),
          },
        ];

        messages.push("Đã áp khuyến mãi tự động");
        break;
      }
    }

    discountAmount = roundMoney(Math.min(subtotal, discountAmount));
    shippingDiscountAmount = roundMoney(
      Math.min(shippingFee, shippingDiscountAmount),
    );

    const finalPrice = roundMoney(
      Math.max(
        0,
        subtotal + shippingFee - discountAmount - shippingDiscountAmount,
      ),
    );

    const promotionSnapshotJson =
      appliedPromotions.length > 0
        ? {
            promotionCode: selectedPromotionCode,
            subtotal,
            shippingFee,
            discountAmount,
            shippingDiscountAmount,
            finalPrice,
            appliedPromotions,
            evaluatedAt: now.toISOString(),
          }
        : null;

    return {
      subtotal,
      shippingFee,
      discountAmount,
      shippingDiscountAmount,
      finalPrice,
      appliedPromotions,
      promotionCode: selectedPromotionCode,
      promotionSnapshotJson,
      messages,
    };
  }
}
