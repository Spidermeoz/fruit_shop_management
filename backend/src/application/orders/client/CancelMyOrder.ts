// src/application/orders/usecases/client/CancelMyOrder.ts
export class CancelMyOrder {
  constructor(private orderRepo: any) {}

  async execute(userId: number, orderId: number) {
    const order = await this.orderRepo.findById(orderId);

    if (!order) throw new Error("Không tìm thấy đơn hàng");
    if (order.props.userId !== userId)
      throw new Error("Không có quyền huỷ đơn");

    if (!["pending"].includes(order.props.status))
      throw new Error("Đơn hàng không thể huỷ");

    await this.orderRepo.updateStatus(orderId, "cancelled");

    return true;
  }
}
