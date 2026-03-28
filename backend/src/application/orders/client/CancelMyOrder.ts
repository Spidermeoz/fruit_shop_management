export class CancelMyOrder {
  constructor(
    private orderRepo: any,
    private inventoryRepo: any,
  ) {}

  async execute(userId: number, orderId: number) {
    const order = await this.orderRepo.findById(orderId);
    if (!order) throw new Error("Không tìm thấy đơn hàng");

    if (Number(order.props.userId) !== Number(userId)) {
      throw new Error("Bạn không có quyền hủy đơn này");
    }

    const cancellableStatuses = ["pending", "processing"];
    const currentStatus = String(order.props.status || "").toLowerCase();

    if (!cancellableStatuses.includes(currentStatus)) {
      throw new Error("Đơn hàng không thể hủy ở trạng thái hiện tại");
    }

    const transaction = await this.orderRepo.startTransaction();

    try {
      const freshOrder = await this.orderRepo.findById(orderId, transaction);
      if (!freshOrder) throw new Error("Không tìm thấy đơn hàng");

      const freshStatus = String(freshOrder.props.status || "").toLowerCase();
      if (!cancellableStatuses.includes(freshStatus)) {
        throw new Error("Đơn hàng không thể hủy ở trạng thái hiện tại");
      }

      const branchId = Number(freshOrder.props.branchId);
      if (!Number.isFinite(branchId) || branchId <= 0) {
        throw new Error("Đơn hàng chưa có branch hợp lệ");
      }

      for (const item of freshOrder.props.items ?? []) {
        if (!item.productVariantId || !item.quantity) continue;

        await this.inventoryRepo.increaseStock(
          branchId,
          Number(item.productVariantId),
          Number(item.quantity),
          {
            transaction,
            transactionType: "order_cancelled",
            referenceType: "order",
            referenceId: Number(orderId),
            note: `Hoàn kho khi khách hủy đơn ${freshOrder.props.code}`,
            createdById: userId,
          },
        );
      }

      await this.orderRepo.updateStatus(
        orderId,
        "cancelled",
        transaction,
        "Khách hàng đã hủy đơn",
      );

      await transaction.commit();
      return { success: true };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
}
