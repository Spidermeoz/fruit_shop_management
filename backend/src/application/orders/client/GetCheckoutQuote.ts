export class GetCheckoutQuote {
  constructor(private readonly calculateShippingQuoteService: any) {}

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

    return this.calculateShippingQuoteService.execute({
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
  }
}
