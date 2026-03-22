import type { OrderRepository } from "../../../domain/orders/OrderRepository";

export class AddPayment {
  constructor(private repo: OrderRepository) {}

  async execute(input: { orderId: number; amount: number }) {
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

      return { success: true };
    } catch (err) {
      await t.rollback();
      throw err;
    }
  }
}
