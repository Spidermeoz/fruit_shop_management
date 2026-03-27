export class GetMyOrderDetail {
  constructor(private orderRepo: any) {}

  async execute(userId: number, orderId: number) {
    const order = await this.orderRepo.findById(orderId);

    if (!order) {
      throw new Error("Không tìm thấy đơn hàng");
    }

    if (Number(order.props.userId) !== Number(userId)) {
      throw new Error("Bạn không có quyền xem đơn hàng này");
    }

    return order;
  }
}
