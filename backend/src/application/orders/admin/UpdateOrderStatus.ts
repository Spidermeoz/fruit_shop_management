export class UpdateOrderStatus {
  constructor(
    private orderRepo: any,
    private inventoryRepo: any,
  ) {}

  async execute(orderId: number, nextStatus: string) {
    const order = await this.orderRepo.findById(orderId);
    if (!order) throw new Error("Order not found");

    const currentStatus = String(order.props.status || "").toLowerCase();
    const normalizedNextStatus = String(nextStatus || "").toLowerCase();

    if (currentStatus === normalizedNextStatus) {
      return { success: true };
    }

    const transaction = await this.orderRepo.startTransaction();

    try {
      const freshOrder = await this.orderRepo.findById(orderId, transaction);
      if (!freshOrder) throw new Error("Order not found");

      const freshCurrentStatus = String(
        freshOrder.props.status || "",
      ).toLowerCase();

      if (
        normalizedNextStatus === "cancelled" &&
        freshCurrentStatus !== "cancelled"
      ) {
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
              note: `Hoàn kho khi admin hủy đơn ${freshOrder.props.code}`,
              createdById: null,
            },
          );
        }
      }

      await this.orderRepo.updateStatus(
        orderId,
        normalizedNextStatus,
        transaction,
        `Status changed to ${normalizedNextStatus}`,
      );

      await transaction.commit();
      return { success: true };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
}
