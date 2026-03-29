export class CreateOrderFromCart {
  constructor(
    private readonly orderRepo: any,
    private readonly cartRepo: any,
    private readonly productRepo: any,
    private readonly inventoryRepo: any,
    private readonly calculateShippingQuoteService: any,
  ) {}

  async execute(userId: number, payload: any) {
    const {
      productVariantIds,
      address,
      branchId: rawBranchId,
      fulfillmentType: rawFulfillmentType,
      deliveryType: rawDeliveryType,
      deliveryDate: rawDeliveryDate,
      deliveryTimeSlotId: rawDeliveryTimeSlotId,
      deliveryNote: rawDeliveryNote,
      userInfo,
      paymentMethod,
    } = payload ?? {};

    const requestedBranchId =
      rawBranchId !== undefined && rawBranchId !== null
        ? Number(rawBranchId)
        : null;

    const fulfillmentType = String(
      rawFulfillmentType || "delivery",
    ).toLowerCase();

    const deliveryType = String(rawDeliveryType || "scheduled").toLowerCase();

    const deliveryDate =
      rawDeliveryDate !== undefined && rawDeliveryDate !== null
        ? String(rawDeliveryDate)
        : null;

    const deliveryTimeSlotId =
      rawDeliveryTimeSlotId !== undefined && rawDeliveryTimeSlotId !== null
        ? Number(rawDeliveryTimeSlotId)
        : null;

    const deliveryNote =
      rawDeliveryNote !== undefined && rawDeliveryNote !== null
        ? String(rawDeliveryNote)
        : null;

    if (!Array.isArray(productVariantIds) || productVariantIds.length === 0) {
      throw new Error("Bạn chưa chọn sản phẩm để thanh toán");
    }

    if (!["pickup", "delivery"].includes(fulfillmentType)) {
      throw new Error("Hình thức nhận hàng không hợp lệ");
    }

    if (!["standard", "same_day", "scheduled"].includes(deliveryType)) {
      throw new Error("Loại giao hàng không hợp lệ");
    }

    const quote = await this.calculateShippingQuoteService.execute({
      userId,
      productVariantIds,
      branchId: requestedBranchId,
      fulfillmentType,
      deliveryType,
      deliveryDate,
      deliveryTimeSlotId,
      address: address ?? null,
    });

    if (quote.requiresBranchSelection) {
      throw new Error("Vui lòng chọn chi nhánh phù hợp để giao hàng");
    }

    const resolvedBranchId =
      quote.selectedBranch?.id !== undefined &&
      quote.selectedBranch?.id !== null
        ? Number(quote.selectedBranch.id)
        : requestedBranchId;

    if (!resolvedBranchId || resolvedBranchId <= 0) {
      throw new Error("Bạn chưa chọn chi nhánh");
    }

    const cartItems = await this.cartRepo.listSelectedItems(
      userId,
      productVariantIds,
    );

    if (!Array.isArray(cartItems) || cartItems.length === 0) {
      throw new Error("Không tìm thấy sản phẩm trong giỏ hàng");
    }

    const transaction = await this.orderRepo.startTransaction();

    try {
      for (const item of cartItems) {
        if (!item.productVariantId) {
          throw new Error("Cart item chưa gắn product variant");
        }

        const variant = await this.productRepo.findVariantById(
          item.productVariantId,
          transaction,
        );

        if (!variant) {
          throw new Error(
            `Variant không tồn tại (ID ${item.productVariantId})`,
          );
        }

        if (
          variant.status &&
          String(variant.status).toLowerCase() !== "active"
        ) {
          throw new Error(
            `Variant không khả dụng (${variant.title || variant.name || "variant"})`,
          );
        }

        const fallbackStock = Number(
          variant.availableStock ?? variant.stock ?? 0,
        );

        const availableStock =
          typeof this.inventoryRepo.getAvailableStock === "function"
            ? await this.inventoryRepo.getAvailableStock(
                resolvedBranchId,
                item.productVariantId,
                fallbackStock,
                transaction,
              )
            : Math.max(0, fallbackStock);

        if (availableStock < Number(item.quantity)) {
          throw new Error(
            `Không đủ tồn kho tại chi nhánh đã chọn (${
              variant.title || variant.name || "variant"
            })`,
          );
        }
      }

      const order = await this.orderRepo.create(
        {
          userId,
          branchId: resolvedBranchId,
          fulfillmentType,
          deliveryType,
          deliveryDate: fulfillmentType === "delivery" ? deliveryDate : null,
          deliveryTimeSlotId:
            fulfillmentType === "delivery" ? deliveryTimeSlotId : null,
          deliveryTimeSlotLabel:
            fulfillmentType === "delivery"
              ? (quote.selectedSlot?.label ?? null)
              : null,
          shippingZoneId:
            fulfillmentType === "delivery"
              ? (quote.shippingZone?.id ?? null)
              : null,
          shippingZoneCode:
            fulfillmentType === "delivery"
              ? (quote.shippingZone?.code ?? null)
              : null,
          shippingZoneName:
            fulfillmentType === "delivery"
              ? (quote.shippingZone?.name ?? null)
              : null,
          deliveryNote: deliveryNote ?? null,
          items: cartItems.map((i: any) => ({
            productId: i.productId ?? null,
            productVariantId: i.productVariantId ?? null,
            quantity: Number(i.quantity ?? 0),
            price: Number(i.variant?.price ?? i.price ?? 0),
            title: i.product?.title ?? i.title ?? "(deleted)",
            variantTitle: i.variant?.title ?? i.variantTitle ?? null,
            variantSku: i.variant?.sku ?? i.variantSku ?? null,
            variantLabel: i.variant?.title ?? i.variantLabel ?? null,
            thumbnail: i.product?.thumbnail ?? i.thumbnail ?? null,
            optionSummary: Array.isArray(i.variant?.optionValues)
              ? i.variant.optionValues.map((x: any) => x.value).join(" / ")
              : (i.optionSummary ?? null),
          })),
          address:
            fulfillmentType === "pickup"
              ? {
                  fullName:
                    address?.fullName ??
                    userInfo?.name ??
                    userInfo?.fullName ??
                    null,
                  phone: address?.phone ?? userInfo?.phone ?? null,
                  email: address?.email ?? userInfo?.email ?? null,
                  addressLine1:
                    quote.selectedBranch?.addressLine1 ?? "Nhận tại chi nhánh",
                  addressLine2: "",
                  ward: "",
                  district: quote.selectedBranch?.district ?? "",
                  province: quote.selectedBranch?.province ?? "",
                  postalCode: "",
                  notes: deliveryNote ?? "",
                }
              : address,
          shippingFee: Number(quote.shippingFee ?? 0),
          discountAmount: Number(quote.discountAmount ?? 0),
          totalPrice: Number(quote.subtotal ?? 0),
          finalPrice: Number(quote.finalPrice ?? 0),
          userInfo: {
            ...(userInfo ?? {}),
            paymentMethod: paymentMethod ?? null,
          },
        },
        transaction,
      );

      for (const item of cartItems) {
        await this.inventoryRepo.decreaseStock(
          resolvedBranchId,
          Number(item.productVariantId),
          Number(item.quantity),
          {
            transaction,
            transactionType: "order_created",
            referenceType: "order",
            referenceId: Number(order.props.id),
            note: `Trừ kho khi tạo đơn ${order.props.code}`,
            createdById: userId,
          },
        );
      }

      await this.cartRepo.clearSelectedItems(
        userId,
        productVariantIds,
        transaction,
      );

      await transaction.commit();

      return {
        id: order.props.id,
        code: order.props.code,
        trackingToken: order.props.trackingToken,
        branchId: order.props.branchId,
        fulfillmentType: order.props.fulfillmentType,
        deliveryType: order.props.deliveryType ?? "standard",
        deliveryDate: order.props.deliveryDate ?? null,
        deliveryTimeSlotId: order.props.deliveryTimeSlotId ?? null,
        deliveryTimeSlotLabel: order.props.deliveryTimeSlotLabel ?? null,
        shippingZoneId: order.props.shippingZoneId ?? null,
        shippingZoneCode: order.props.shippingZoneCode ?? null,
        shippingZoneName: order.props.shippingZoneName ?? null,
        deliveryNote: order.props.deliveryNote ?? null,
        shippingFee: Number(order.props.shippingFee ?? 0),
        discountAmount: Number(order.props.discountAmount ?? 0),
        totalPrice: Number(order.props.totalPrice ?? 0),
        finalPrice: Number(order.props.finalPrice ?? 0),
      };
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  }
}
