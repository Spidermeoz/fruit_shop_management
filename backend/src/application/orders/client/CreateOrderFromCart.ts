export class CreateOrderFromCart {
  constructor(
    private orderRepo: any,
    private cartRepo: any,
    private productRepo: any,
    private inventoryRepo: any,
  ) {}

  async execute(userId: number, payload: any) {
    const {
      productVariantIds,
      address,
      branchId: rawBranchId,
      fulfillmentType: rawFulfillmentType,
      shippingFee: rawShippingFee,
      discountAmount: rawDiscountAmount,
      userInfo,
    } = payload ?? {};

    const branchId = Number(rawBranchId);
    const fulfillmentType = String(
      rawFulfillmentType || "delivery",
    ).toLowerCase();

    if (!Array.isArray(productVariantIds) || productVariantIds.length === 0) {
      throw new Error("Bạn chưa chọn sản phẩm để thanh toán");
    }

    if (!Number.isFinite(branchId) || branchId <= 0) {
      throw new Error("Bạn chưa chọn chi nhánh");
    }

    if (!["pickup", "delivery"].includes(fulfillmentType)) {
      throw new Error("Hình thức nhận hàng không hợp lệ");
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
                branchId,
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

      const subtotal = cartItems.reduce((sum: number, item: any) => {
        const price = Number(item.variant?.price ?? item.price ?? 0);
        return sum + price * Number(item.quantity ?? 0);
      }, 0);

      const shippingFee = Number(rawShippingFee ?? 0);
      const discountAmount = Number(rawDiscountAmount ?? 0);
      const finalPrice = subtotal + shippingFee - discountAmount;

      if (finalPrice < 0) {
        throw new Error("Tổng tiền đơn hàng không hợp lệ");
      }

      const order = await this.orderRepo.create(
        {
          userId,
          branchId,
          fulfillmentType,
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
          address,
          shippingFee,
          discountAmount,
          totalPrice: subtotal,
          finalPrice,
          userInfo: userInfo ?? null,
        },
        transaction,
      );

      for (const item of cartItems) {
        await this.inventoryRepo.decreaseStock(
          branchId,
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
      };
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  }
}
