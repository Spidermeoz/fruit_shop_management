// src/application/orders/usecases/client/GetMyOrderDetail.ts
export class GetMyOrderDetail {
  constructor(private orderRepo: any) {}

  async execute(userId: number, orderId: number) {
    const order = await this.orderRepo.findById(orderId);

    if (!order) throw new Error("Không tìm thấy đơn hàng");
    if (order.props.userId !== userId)
      throw new Error("Bạn không có quyền xem đơn hàng này");

    return order;
  }
}
