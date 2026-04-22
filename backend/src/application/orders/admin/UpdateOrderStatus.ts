import type { CreateAuditLog } from "../../audit-logs/usecases/CreateAuditLog";

export class UpdateOrderStatus {
  constructor(
    private orderRepo: any,
    private inventoryRepo: any,
    private createAuditLog?: CreateAuditLog,
  ) {}

  async execute(orderId: number, nextStatus: string, actor?: any) {
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
      throw new Error("Bạn không có quyền cập nhật đơn hàng của chi nhánh này");
    }

    const currentStatus = String(order.props.status || "").toLowerCase();
    const normalizedNextStatus = String(nextStatus || "").toLowerCase();

    if (!normalizedNextStatus) {
      throw new Error("Trạng thái đơn hàng không hợp lệ");
    }

    if (currentStatus === normalizedNextStatus) {
      return { success: true };
    }

    const transaction = await this.orderRepo.startTransaction();

    try {
      const freshOrder = await this.orderRepo.findById(orderId, transaction);
      if (!freshOrder) {
        throw new Error("Order not found");
      }

      const branchId = Number(freshOrder.props.branchId);
      if (!Number.isFinite(branchId) || branchId <= 0) {
        throw new Error("Order chưa có branch hợp lệ");
      }

      const freshCurrentStatus = String(
        freshOrder.props.status || "",
      ).toLowerCase();

      if (
        normalizedNextStatus === "cancelled" &&
        freshCurrentStatus !== "cancelled"
      ) {
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
              note: `Hoàn kho khi admin hủy đơn ${freshOrder.props.code}`,
              createdById: actor?.id ?? null,
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

if (this.createAuditLog) {
  await this.createAuditLog.execute({
    actorUserId:
      actor?.id !== undefined && actor?.id !== null
        ? Number(actor.id)
        : null,
    branchId: Number(freshOrder.props.branchId ?? 0) || null,
    action: "update_status",
    moduleName: "order",
    entityType: "order",
    entityId: Number(orderId),
    oldValuesJson: {
      status: freshCurrentStatus,
    },
    newValuesJson: {
      status: normalizedNextStatus,
    },
    metaJson: {
      orderCode: freshOrder.props.code ?? null,
    },
  });
}

return { success: true };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
}
