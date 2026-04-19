import type { CartRepository } from "../../../domain/carts/CartRepository";

const normalizeNullableNumber = (value: unknown): number | null => {
  if (value === undefined || value === null || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const roundMoney = (value: unknown): number =>
  Math.max(0, Math.round(Number(value ?? 0) * 100) / 100);

const stableStringify = (value: any): string => {
  if (value === null || value === undefined) return "null";
  if (Array.isArray(value)) {
    return `[${value.map((item) => stableStringify(item)).join(",")}]`;
  }
  if (typeof value === "object") {
    return `{${Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
};

const buildQuoteFingerprint = (input: {
  subtotal: number;
  shippingFee: number;
  discountAmount: number;
  shippingDiscountAmount: number;
  finalPrice: number;
  fulfillmentType?: string | null;
  deliveryType?: string | null;
  deliveryDate?: string | null;
  selectedBranchId?: number | null;
  selectedSlotId?: number | null;
  shippingZoneId?: number | null;
  promotionCode?: string | null;
  productVariantIds?: number[];
}) => {
  return stableStringify({
    subtotal: roundMoney(input.subtotal),
    shippingFee: roundMoney(input.shippingFee),
    discountAmount: roundMoney(input.discountAmount),
    shippingDiscountAmount: roundMoney(input.shippingDiscountAmount),
    finalPrice: roundMoney(input.finalPrice),
    fulfillmentType: input.fulfillmentType ?? null,
    deliveryType: input.deliveryType ?? null,
    deliveryDate: input.deliveryDate ?? null,
    selectedBranchId: input.selectedBranchId ?? null,
    selectedSlotId: input.selectedSlotId ?? null,
    shippingZoneId: input.shippingZoneId ?? null,
    promotionCode: input.promotionCode ?? null,
    productVariantIds: Array.isArray(input.productVariantIds)
      ? [...input.productVariantIds].map(Number).sort((a, b) => a - b)
      : [],
  });
};

export class GetCheckoutQuote {
  constructor(
    private readonly calculateShippingQuoteService: any,
    private readonly cartRepo: CartRepository,
    private readonly evaluatePromotionService: any,
  ) {}

  async execute(userId: number, payload: any) {
    const {
      productVariantIds,
      branchId,
      fulfillmentType,
      deliveryType,
      deliveryDate,
      deliveryTimeSlotId,
      address,
      promotionCode,
    } = payload ?? {};

    const quote = await this.calculateShippingQuoteService.execute({
      userId,
      productVariantIds,
      branchId,
      fulfillmentType,
      deliveryType,
      deliveryDate: deliveryDate ?? null,
      deliveryTimeSlotId:
        deliveryTimeSlotId !== undefined && deliveryTimeSlotId !== null
          ? Number(deliveryTimeSlotId)
          : null,
      address: address ?? null,
    });

    const cartItems = await this.cartRepo.listSelectedItems(
      userId,
      Array.isArray(productVariantIds) ? productVariantIds : [],
    );

    const promotionCartItems = Array.isArray(cartItems)
      ? cartItems.map((item: any) => {
          const quantity = Number(item.quantity ?? 0);
          const unitPrice = Number(item.variant?.price ?? item.price ?? 0);

          return {
            productId:
              item.productId !== undefined && item.productId !== null
                ? Number(item.productId)
                : null,
            categoryId:
              item.product?.categoryId !== undefined &&
              item.product?.categoryId !== null
                ? Number(item.product.categoryId)
                : item.product?.productCategoryId !== undefined &&
                    item.product?.productCategoryId !== null
                  ? Number(item.product.productCategoryId)
                  : item.product?.category?.id !== undefined &&
                      item.product?.category?.id !== null
                    ? Number(item.product.category.id)
                    : null,
            originId:
              item.product?.originId !== undefined &&
              item.product?.originId !== null
                ? Number(item.product.originId)
                : item.product?.origin?.id !== undefined &&
                    item.product?.origin?.id !== null
                  ? Number(item.product.origin.id)
                  : null,
            productVariantId:
              item.productVariantId !== undefined &&
              item.productVariantId !== null
                ? Number(item.productVariantId)
                : null,
            quantity,
            unitPrice,
            lineSubtotal: quantity * unitPrice,
            title: item.product?.title ?? item.title ?? null,
            variantTitle: item.variant?.title ?? item.variantTitle ?? null,
          };
        })
      : [];

    const resolvedBranchId =
      quote?.selectedBranch?.id !== undefined &&
      quote?.selectedBranch?.id !== null
        ? Number(quote.selectedBranch.id)
        : branchId !== undefined && branchId !== null
          ? Number(branchId)
          : null;

    const promotionResult = await this.evaluatePromotionService.execute({
      userId: Number(userId),
      branchId: resolvedBranchId,
      promotionCode:
        promotionCode !== undefined && promotionCode !== null
          ? String(promotionCode).trim()
          : null,
      subtotal: Number(quote?.subtotal ?? 0),
      shippingFee: Number(quote?.shippingFee ?? 0),
      cartItems: promotionCartItems,
      allowAutoApply: true,
    });

    const discountAmount = Number(promotionResult.discountAmount ?? 0);
    const shippingDiscountAmount = Number(
      promotionResult.shippingDiscountAmount ?? 0,
    );
    const finalPrice = Number(
      promotionResult.finalPrice ??
        Number(quote?.subtotal ?? 0) + Number(quote?.shippingFee ?? 0),
    );

    const selectedBranchIdForMeta =
      quote?.selectedBranch?.id !== undefined &&
      quote?.selectedBranch?.id !== null
        ? Number(quote.selectedBranch.id)
        : resolvedBranchId;

    const selectedSlotIdForMeta =
      quote?.selectedSlot?.id !== undefined && quote?.selectedSlot?.id !== null
        ? Number(quote.selectedSlot.id)
        : deliveryTimeSlotId !== undefined && deliveryTimeSlotId !== null
          ? Number(deliveryTimeSlotId)
          : null;

    const shippingZoneIdForMeta =
      quote?.shippingZone?.id !== undefined && quote?.shippingZone?.id !== null
        ? Number(quote.shippingZone.id)
        : null;

    const quoteMeta = {
      fingerprint: buildQuoteFingerprint({
        subtotal: Number(quote?.subtotal ?? 0),
        shippingFee: Number(quote?.shippingFee ?? 0),
        discountAmount,
        shippingDiscountAmount,
        finalPrice,
        fulfillmentType: quote?.fulfillmentType ?? fulfillmentType ?? null,
        deliveryType: quote?.deliveryType ?? deliveryType ?? null,
        deliveryDate: deliveryDate ?? null,
        selectedBranchId: selectedBranchIdForMeta,
        selectedSlotId: selectedSlotIdForMeta,
        shippingZoneId: shippingZoneIdForMeta,
        promotionCode: promotionResult.promotionCode ?? null,
        productVariantIds: Array.isArray(productVariantIds)
          ? productVariantIds.map(Number)
          : [],
      }),
      computedAt: new Date().toISOString(),
      expiresAt: null,
      consistencyVersion: 1,
    };

    return {
      ...quote,
      discountAmount,
      shippingDiscountAmount,
      finalPrice,
      promotionCode: promotionResult.promotionCode ?? null,
      appliedPromotions: Array.isArray(promotionResult.appliedPromotions)
        ? promotionResult.appliedPromotions
        : [],
      promotionSnapshotJson: promotionResult.promotionSnapshotJson ?? null,
      promotionMessages: Array.isArray(promotionResult.messages)
        ? promotionResult.messages
        : [],
      selectedBranchId: normalizeNullableNumber(resolvedBranchId),
      quoteMeta,
    };
  }
}
