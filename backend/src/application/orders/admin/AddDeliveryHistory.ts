import type { CreateAuditLog } from "../../audit-logs/usecases/CreateAuditLog";

// src/application/orders/usecases/admin/AddDeliveryHistory.ts
export class AddDeliveryHistory {
  constructor(
    private orderRepo: any,
    private createAuditLog?: CreateAuditLog,
  ) {}

  async execute(
    orderId: number,
    data: any,
    actor?: { id?: number | null },
  ) {
    const order =
      typeof this.orderRepo.findById === "function"
        ? await this.orderRepo.findById(orderId)
        : null;

    if (!order) {
      throw new Error("Order not found");
    }

    await this.orderRepo.addDeliveryHistory(
      orderId,
      data.status,
      data.location,
      data.note,
    );

    if (this.createAuditLog) {
      await this.createAuditLog.execute({
        actorUserId:
          actor?.id !== undefined && actor?.id !== null
            ? Number(actor.id)
            : null,
        branchId: Number(order.props.branchId ?? 0) || null,
        action: "add_delivery_history",
        moduleName: "order",
        entityType: "order",
        entityId: Number(orderId),
        newValuesJson: {
          status: data.status ?? null,
          location: data.location ?? null,
          note: data.note ?? null,
        },
        metaJson: {
          orderCode: order.props.code ?? null,
        },
      });
    }
  }
}
