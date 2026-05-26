import type { CartRepository } from "../../../domain/carts/CartRepository";
import type { PromotionRepository } from "../../../domain/promotions/PromotionRepository";

export class GetAvailablePromotionsClient {
  constructor(
    private readonly calculateShippingQuoteService: any,
    private readonly cartRepo: CartRepository,
    private readonly evaluatePromotionService: any,
    private readonly promotionRepo: PromotionRepository,
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
    } = payload ?? {};

    // 1. Calculate base quote to get subtotal & branch info
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

    // 2. Fetch active manual promotions
    const activePromotions = await this.promotionRepo.list({
      status: "active",
      isAutoApply: false,
      includeDeleted: false,
      limit: 100, // Fetch top 100 promotions
    });

    const availableList = [];
    const now = new Date();

    for (const promo of activePromotions.rows) {
      if (promo.startAt && now < promo.startAt) continue;
      if (promo.endAt && now > promo.endAt) continue;

      const codes = Array.isArray(promo.codes) ? promo.codes : [];
      
      for (const code of codes) {
        if (code.status !== "active" || code.deleted) continue;
        if (code.startAt && now < code.startAt) continue;
        if (code.endAt && now > code.endAt) continue;

        const evalResult = await this.evaluatePromotionService.execute({
          userId: Number(userId),
          branchId: resolvedBranchId,
          promotionCode: code.code,
          subtotal: Number(quote?.subtotal ?? 0),
          shippingFee: Number(quote?.shippingFee ?? 0),
          cartItems: promotionCartItems,
          allowAutoApply: false,
        });

        const isApplicable =
          Array.isArray(evalResult.appliedPromotions) &&
          evalResult.appliedPromotions.length > 0;
        
        const reasonMessage = isApplicable
          ? "Đủ điều kiện áp dụng"
          : evalResult.messages?.[0] || "Không đủ điều kiện";

        availableList.push({
          promotionId: promo.id,
          name: promo.name,
          description: promo.description,
          discountType: promo.discountType,
          discountValue: promo.discountValue,
          maxDiscountAmount: promo.maxDiscountAmount,
          minOrderValue: promo.minOrderValue,
          code: code.code,
          isApplicable,
          reasonMessage,
          discountAmount: evalResult.discountAmount ?? 0,
          shippingDiscountAmount: evalResult.shippingDiscountAmount ?? 0,
        });
      }
    }

    return availableList;
  }
}
