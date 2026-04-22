import type { OrderRepository } from "../../../domain/orders/OrderRepository";
import type { CreateAuditLog } from "../../audit-logs/usecases/CreateAuditLog";
import type { CreateNotification } from "../../notifications/usecases/CreateNotification";

export class AddPayment {
  constructor(
    private repo: OrderRepository,
    private createAuditLog?: CreateAuditLog,
    private createNotification?: CreateNotification,
  ) {}

  async execute(
    input: { orderId: number; amount: number },
    actor?: { id?: number | null },
  ) {
    const order = await this.repo.findById(input.orderId);

    if (!order) throw new Error("Order not found");

    if (order.props.status === "cancelled") {
      throw new Error("Cannot add payment to a cancelled order");
    }

    if (order.props.paymentStatus === "paid") {
      throw new Error("Order already paid");
    }

    if (input.amount < order.props.finalPrice) {
      throw new Error("Số tiền thanh toán chưa đủ tổng đơn hàng");
    }

    const t = await this.repo.startTransaction();

    try {
      await this.repo.addPayment(
        {
          orderId: input.orderId,
          provider: "cod",
          method: "cod",
          amount: input.amount,
          status: "paid",
          transactionId: null,
          rawPayload: null,
        },
        t,
      );

      await this.repo.updatePaymentStatus(input.orderId, "paid", t);

await t.commit();

if (this.createAuditLog) {
  await this.createAuditLog.execute({
    actorUserId:
      actor?.id !== undefined && actor?.id !== null
        ? Number(actor.id)
        : null,
    branchId: Number(order.props.branchId ?? 0) || null,
    action: "add_payment",
    moduleName: "order",
    entityType: "order",
    entityId: Number(input.orderId),
    oldValuesJson: {
      paymentStatus: order.props.paymentStatus ?? null,
    },
    newValuesJson: {
      paymentStatus: "paid",
      paidAmount: Number(input.amount ?? 0),
    },
    metaJson: {
      orderCode: order.props.code ?? null,
      provider: "cod",
      method: "cod",
    },
  });
}

if (this.createNotification) {
  await this.createNotification.execute({
    eventKey: "order_payment_recorded",
    category: "order",
    severity: "info",
    title: `Đã ghi nhận thanh toán cho đơn #${order.props.code}`,
    message: `Đơn hàng #${order.props.code} đã được ghi nhận thanh toán ${Number(input.amount ?? 0).toLocaleString("vi-VN")}đ.`,
    entityType: "order",
    entityId: Number(input.orderId),
    actorUserId:
      actor?.id !== undefined && actor?.id !== null
        ? Number(actor.id)
        : null,
    branchId: Number(order.props.branchId ?? 0) || null,
    targetUrl: `/admin/orders/edit/${Number(input.orderId)}`,
    metaJson: {
      orderCode: order.props.code ?? null,
      amount: Number(input.amount ?? 0),
    },
    dedupeKey: `order_payment_recorded:${Number(input.orderId)}:${Number(input.amount ?? 0)}`,
    includeSuperAdmins: true,
    recipientBranchIds:
      Number(order.props.branchId ?? 0) > 0
        ? [Number(order.props.branchId)]
        : [],
  });
}

return { success: true };
    } catch (err) {
      await t.rollback();
      throw err;
    }
  }
}
