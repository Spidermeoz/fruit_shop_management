// src/application/orders/client/CancelMyOrder.ts

export class CancelMyOrder {
  constructor(private orderRepo: any, private productRepo: any) {}

  async execute(userId: number, orderId: number) {
    // lấy order
    const order = await this.orderRepo.findById(orderId);
    if (!order) {
      throw new Error("Đơn hàng không tồn tại");
    }

    if (order.userId !== userId) {
      throw new Error("Bạn không có quyền hủy đơn hàng này");
    }

    if (order.status !== "pending" && order.status !== "processing") {
      throw new Error("Đơn hàng không thể hủy ở trạng thái hiện tại");
    }

    // mở transaction
    const t = await this.orderRepo.startTransaction();

    try {
      // cập nhật trạng thái đơn hàng
      await this.orderRepo.updateStatus(orderId, "cancelled", t);

      // ghi vào delivery history
      await this.orderRepo.addDeliveryHistory(
        orderId,
        "cancelled",
        null,
        "Khách hàng đã hủy đơn",
        t
      );

      // 🔥🔥🔥 TĂNG LẠI TỒN KHO
      for (const item of order.items) {
        await this.productRepo.increaseStock(item.productId, item.quantity, t);
      }

      await t.commit();

      return { success: true };
    } catch (err) {
      await t.rollback();
      throw err;
    }
  }
}
