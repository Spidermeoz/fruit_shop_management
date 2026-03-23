export class CancelMyOrder {
  constructor(
    private orderRepo: any,
    private inventoryRepo: any,
  ) {}

  async execute(userId: number, orderId: number) {
    const order = await this.orderRepo.findById(orderId);
    if (!order) throw new Error("Không tìm thấy đơn hàng");
    if (order.props.userId !== userId)
      throw new Error("Bạn không có quyền hủy đơn này");

    const cancellableStatuses = ["pending", "processing"];
    if (!cancellableStatuses.includes(order.props.status)) {
      throw new Error("Đơn hàng không thể hủy ở trạng thái hiện tại");
    }

    const transaction = await this.orderRepo.startTransaction();

    try {
      const freshOrder = await this.orderRepo.findById(orderId, transaction);
      if (!freshOrder) throw new Error("Không tìm thấy đơn hàng");

      for (const item of freshOrder.props.items ?? []) {
        if (!item.productVariantId || !item.quantity) continue;

        await this.inventoryRepo.increaseStockByVariantId(
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

      await this.orderRepo.updateStatus(orderId, "cancelled", transaction);

      if (typeof this.orderRepo.addDeliveryHistory === "function") {
        await this.orderRepo.addDeliveryHistory(
          {
            orderId,
            status: "cancelled",
            note: "Khách hàng đã hủy đơn",
          },
          transaction,
        );
      }

      await transaction.commit();
      return { success: true };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
}
