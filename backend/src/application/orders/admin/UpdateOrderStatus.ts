export class UpdateOrderStatus {
  constructor(private orderRepo: any) {}

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

    const currentStatus = order.status;

    // Không cho hủy sau khi đã giao
    if (
      newStatus === "cancelled" &&
      ["shipping", "delivered", "completed"].includes(currentStatus)
    ) {
      throw new Error("Không thể hủy đơn hàng sau khi đã giao hoặc hoàn thành");
    }

    // Không cho rollback về pending
    if (newStatus === "pending" && currentStatus !== "pending") {
      throw new Error("Không thể chuyển đơn hàng về trạng thái chờ duyệt");
    }

    // Không cho sửa nếu đã cancelled hoặc completed
    if (["cancelled", "completed"].includes(currentStatus)) {
      throw new Error("Order is already finished and cannot be modified");
    }

    // Check transition hợp lệ
    const allowed = this.allowedTransitions[currentStatus] || [];

    if (!allowed.includes(newStatus)) {
      throw new Error(
        `Cannot change order status from ${currentStatus} to ${newStatus}`,
      );
    }

    // Update
    await this.orderRepo.updateStatus(orderId, newStatus);
  }
}
