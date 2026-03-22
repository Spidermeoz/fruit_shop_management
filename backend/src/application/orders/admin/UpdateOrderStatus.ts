export class UpdateOrderStatus {
  constructor(
    private orderRepo: any,
    private productRepo: any,
  ) {}

  private allowedTransitions: Record<string, string[]> = {
    pending: ["processing", "cancelled"],
    processing: ["shipping", "cancelled"],
    shipping: ["delivered"],
    delivered: ["completed"],
    completed: [],
    cancelled: [],
  };

  async execute(orderId: number, newStatus: string) {
    const order = await this.orderRepo.findById(orderId);

    if (!order) {
      throw new Error("Order not found");
    }

    const currentStatus = order.props.status;

    if (
      newStatus === "cancelled" &&
      ["shipping", "delivered", "completed"].includes(currentStatus)
    ) {
      throw new Error("Không thể hủy đơn hàng sau khi đã giao hoặc hoàn thành");
    }

    if (newStatus === "pending" && currentStatus !== "pending") {
      throw new Error("Không thể chuyển đơn hàng về trạng thái chờ duyệt");
    }

    if (["cancelled", "completed"].includes(currentStatus)) {
      throw new Error("Order is already finished and cannot be modified");
    }

    const allowed = this.allowedTransitions[currentStatus] || [];

    if (!allowed.includes(newStatus)) {
      throw new Error(
        `Cannot change order status from ${currentStatus} to ${newStatus}`,
      );
    }

    const t = await this.orderRepo.startTransaction();

    try {
      // nếu admin cancel thì hoàn kho
      if (newStatus === "cancelled") {
        for (const item of order.props.items) {
          if (item.productVariantId) {
            await this.productRepo.increaseVariantStock(
              item.productVariantId,
              item.quantity,
              t,
            );
          }
        }
      }

      await this.orderRepo.updateStatus(orderId, newStatus, t);

      await t.commit();
    } catch (err) {
      await t.rollback();
      throw err;
    }
  }
}
