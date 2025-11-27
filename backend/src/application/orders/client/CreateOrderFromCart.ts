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

    // 1) Lấy các item user chọn
    const cartItems = await this.cartRepo.listSelectedItems(userId, productIds);

    if (cartItems.length === 0) {
      throw new Error("Không tìm thấy sản phẩm hợp lệ trong giỏ hàng");
    }

    // 2) Transaction
    const transaction = await this.orderRepo.startTransaction();

    try {
      // 3) Kiểm tra tồn kho
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

      // ============================
      // 4) TÍNH TOÁN GIÁ TRỊ ĐƠN HÀNG
      // ============================

      // 4.1 Tính subtotal (tổng giá hàng sau giảm giá)
      const subtotal = cartItems.reduce((sum: number, item: any) => {
        const effectivePrice =
          item.product?.discountPercentage > 0
            ? item.product.price * (1 - item.product.discountPercentage / 100)
            : item.product?.price ?? 0;

        return sum + item.quantity * effectivePrice;
      }, 0);

      // 4.2 Phí giao hàng (FE gửi lên → backend không tự tính lại)
      const shippingFee = payload.shippingFee ?? 20000;

      // 4.3 Giảm giá (nếu có)
      const discountAmount = payload.discountAmount ?? 0;

      // 4.4 Tổng cuối cùng
      const finalPrice = subtotal + shippingFee - discountAmount;

      // ============================
      // 5) TẠO ORDER
      // ============================
      const order = await this.orderRepo.create(
        {
          userId,

          items: cartItems.map((i: any) => {
            const effectivePrice =
              i.product?.discountPercentage > 0
                ? i.product.price * (1 - i.product.discountPercentage / 100)
                : i.product?.price ?? 0;

            return {
              productId: i.productId,
              quantity: i.quantity,
              price: effectivePrice,
              title: i.product?.title ?? "(Sản phẩm đã xóa)",
            };
          }),

          address: payload.address,

          shippingFee,
          discountAmount,

          // ⛑ CHỈNH SỬA QUAN TRỌNG
          totalPrice: subtotal, // tổng tiền hàng (đã trừ giảm giá)
          finalPrice: finalPrice, // tổng cuối cùng

          userInfo: payload.userInfo ?? null,
        },
        transaction
      );

      // 6) Giảm tồn kho
      for (const item of cartItems) {
        await this.productRepo.decreaseStock(
          item.productId,
          item.quantity,
          transaction
        );
      }

      // 7) Xoá chỉ các item đã mua
      await this.cartRepo.clearSelectedItems(userId, productIds, transaction);

      // 8) Commit
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
