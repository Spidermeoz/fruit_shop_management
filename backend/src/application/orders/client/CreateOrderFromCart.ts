// src/application/orders/client/CreateOrderFromCart.ts

export class CreateOrderFromCart {
  constructor(
    private orderRepo: any,
    private cartRepo: any,
    private productRepo: any,
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
      // check stock theo variant
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

        if (variant.stock < item.quantity) {
          throw new Error(`Không đủ tồn kho (${variant.title || "variant"})`);
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
          })),
          address,
          shippingFee,
          discountAmount,
          totalPrice: subtotal,
          finalPrice,
          userInfo: payload.userInfo ?? null,
        },
        transaction,
      );

      for (const item of cartItems) {
        await this.productRepo.decreaseVariantStock(
          item.productVariantId,
          item.quantity,
          transaction,
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
