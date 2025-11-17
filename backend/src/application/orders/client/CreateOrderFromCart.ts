// src/application/orders/client/CreateOrderFromCart.ts

export class CreateOrderFromCart {
  constructor(
    private orderRepo: any,
    private cartRepo: any,
    private productRepo: any
  ) {}

  async execute(userId: number, payload: any) {
    const { productIds } = payload;

    if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
      throw new Error("Bạn chưa chọn sản phẩm để thanh toán");
    }

    // 1) Lấy đúng item user chọn
    const cartItems = await this.cartRepo.listSelectedItems(userId, productIds);

    if (cartItems.length === 0) {
      throw new Error("Không tìm thấy sản phẩm hợp lệ trong giỏ hàng");
    }

    // === 2) Tạo transaction ===
    const transaction = await this.orderRepo.startTransaction();

    try {
      // === 3) Check tồn kho từng sản phẩm ===
      for (const item of cartItems) {
        const product = await this.productRepo.findById(item.productId);

        if (!product) {
          throw new Error(`Sản phẩm không tồn tại (ID ${item.productId})`);
        }

        if (product.stock < item.quantity) {
          throw new Error(
            `Sản phẩm "${product.title}" không đủ tồn kho (còn ${product.stock})`
          );
        }
      }

      // === 4) Tính giá ===
      const subtotal = cartItems.reduce(
        (sum: number, item: any) =>
          sum + item.quantity * (item.product?.price ?? 0),
        0
      );

      const shippingFee = payload.shippingFee ?? 20000;
      const discountAmount = payload.discountAmount ?? 0;
      const finalPrice = subtotal + shippingFee - discountAmount;

      // === 5) Tạo order ===
      const order = await this.orderRepo.create(
        {
          userId,
          items: cartItems.map((i: any) => ({
            productId: i.productId, // CHUẨN KEY
            quantity: i.quantity,
            price: i.product?.price ?? 0,
            title: i.product?.title ?? "(Sản phẩm đã xóa)",
          })),
          address: payload.address,
          shippingFee,
          discountAmount,
          totalPrice: finalPrice,
          userInfo: payload.userInfo ?? null,
        },
        transaction
      );

      // === 6) Giảm tồn kho ===
      for (const item of cartItems) {
        await this.productRepo.decreaseStock(
          item.productId,
          item.quantity,
          transaction
        );
      }

      // === 7) Xóa chỉ item đã mua ===
      await this.cartRepo.clearSelectedItems(userId, productIds, transaction);

      // === 8) Commit transaction ===
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
