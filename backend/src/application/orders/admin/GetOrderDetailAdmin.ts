export class GetOrderDetailAdmin {
  constructor(private orderRepo: any) {}

  async execute(orderId: number, actor?: any) {
    const order = await this.orderRepo.findById(orderId);

    if (!order) {
      throw new Error("Order not found");
    }

    const allowedBranchIds = Array.isArray(actor?.branchIds)
      ? actor.branchIds
          .map(Number)
          .filter((x: number) => Number.isFinite(x) && x > 0)
      : [];

    if (
      allowedBranchIds.length > 0 &&
      order.props.branchId &&
      !allowedBranchIds.includes(Number(order.props.branchId))
    ) {
      throw new Error("Bạn không có quyền xem đơn hàng của chi nhánh này");
    }

    return order;
  }
}
