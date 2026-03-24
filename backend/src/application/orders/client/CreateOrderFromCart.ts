// src/application/orders/client/CreateOrderFromCart.ts

export class CreateOrderFromCart {
  constructor(
    private orderRepo: any,
    private cartRepo: any,
    private productRepo: any,
    private inventoryRepo: any,
  ) {}

  async execute(userId: number, payload: any) {
    const { productVariantIds, address } = payload;

    if (!productVariantIds?.length) {
      throw new Error("Bạn chưa chọn sản phẩm để thanh toán");
    }

    const cartItems = await this.cartRepo.listSelectedItems(
      userId,
      productVariantIds,
    );

    if (!cartItems.length) {
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

        if (variant.status !== "active") {
          throw new Error(
            `Variant không khả dụng (${variant.title || "variant"})`,
          );
        }

        const availableStock =
          typeof this.inventoryRepo.getAvailableStockByVariantId === "function"
            ? await this.inventoryRepo.getAvailableStockByVariantId(
                item.productVariantId,
                Number(variant.stock ?? 0),
                transaction,
              )
            : (() => {
                const fallback = Number(
                  variant.availableStock ?? variant.stock ?? 0,
                );
                return Math.max(0, fallback);
              })();

        if (availableStock < item.quantity) {
          throw new Error(
            `Không đủ tồn kho khả dụng (${variant.title || "variant"})`,
          );
        }
      }

      const subtotal = cartItems.reduce((sum: number, item: any) => {
        const price = Number(item.variant?.price ?? 0);
        return sum + price * item.quantity;
      }, 0);

      const shippingFee = Number(payload.shippingFee ?? 20000);
      const discountAmount = Number(payload.discountAmount ?? 0);
      const finalPrice = subtotal + shippingFee - discountAmount;

      if (finalPrice < 0) {
        throw new Error("Tổng tiền đơn hàng không hợp lệ");
      }

      const order = await this.orderRepo.create(
        {
          userId,
          items: cartItems.map((i: any) => ({
            productId: i.productId,
            productVariantId: i.productVariantId,
            quantity: i.quantity,
            price: Number(i.variant?.price ?? 0),
            title: i.product?.title ?? "(deleted)",
            variantTitle: i.variant?.title ?? null,
            variantSku: i.variant?.sku ?? null,
            thumbnail: i.product?.thumbnail ?? null,
            optionSummary: Array.isArray(i.variant?.optionValues)
              ? i.variant.optionValues.map((x: any) => x.value).join(" / ")
              : null,
          })),
          address,
          shippingFee,
          discountAmount,
          totalPrice: subtotal,
          userInfo: payload.userInfo ?? null,
        },
        transaction,
      );

      for (const item of cartItems) {
        await this.inventoryRepo.decreaseStockByVariantId(
          item.productVariantId,
          item.quantity,
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
      };
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  }
}
