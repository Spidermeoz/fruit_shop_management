import type { CartRepository } from "../../../domain/carts/CartRepository";

const normalizeNullableNumber = (value: unknown): number | null => {
  if (value === undefined || value === null || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
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

    return {
      ...quote,
      discountAmount: Number(promotionResult.discountAmount ?? 0),
      shippingDiscountAmount: Number(
        promotionResult.shippingDiscountAmount ?? 0,
      ),
      finalPrice: Number(
        promotionResult.finalPrice ??
          Number(quote?.subtotal ?? 0) + Number(quote?.shippingFee ?? 0),
      ),
      promotionCode: promotionResult.promotionCode ?? null,
      appliedPromotions: Array.isArray(promotionResult.appliedPromotions)
        ? promotionResult.appliedPromotions
        : [],
      promotionSnapshotJson: promotionResult.promotionSnapshotJson ?? null,
      promotionMessages: Array.isArray(promotionResult.messages)
        ? promotionResult.messages
        : [],
      selectedBranchId: normalizeNullableNumber(resolvedBranchId),
    };
  }
}
