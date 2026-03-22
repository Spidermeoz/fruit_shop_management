// src/application/orders/client/CancelMyOrder.ts

export class CancelMyOrder {
  constructor(
    private orderRepo: any,
    private productRepo: any,
  ) {}

  async execute(userId: number, orderId: number) {
    const order = await this.orderRepo.findById(orderId);

    if (!order) {
      throw new Error("Đơn hàng không tồn tại");
    }

    if (order.props.userId !== userId) {
      throw new Error("Bạn không có quyền hủy đơn hàng này");
    }

    if (
      order.props.status !== "pending" &&
      order.props.status !== "processing"
    ) {
      throw new Error("Đơn hàng không thể hủy ở trạng thái hiện tại");
    }

    const t = await this.orderRepo.startTransaction();

    try {
      // hoàn kho variant trước
      for (const item of order.props.items) {
        if (item.productVariantId) {
          await this.productRepo.increaseVariantStock(
            item.productVariantId,
            item.quantity,
            t,
          );
        }
      }

      // update status + ghi history trong cùng transaction
      await this.orderRepo.updateStatus(
        orderId,
        "cancelled",
        t,
        "Khách hàng đã hủy đơn",
      );

      await t.commit();

      return { success: true };
    } catch (err) {
      await t.rollback();
      throw err;
    }
  }
}
