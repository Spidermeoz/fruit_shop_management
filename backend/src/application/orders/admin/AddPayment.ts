import type { OrderRepository } from "../../../domain/orders/OrderRepository";

export class AddPayment {
  constructor(private repo: OrderRepository) {}

  async execute(input: { orderId: number; amount: number }) {
    const order = await this.repo.findById(input.orderId);

    if (!order) throw new Error("Order not found");

    // Không cho thanh toán nếu order đã bị hủy
    if (order.status === "cancelled") {
      throw new Error("Cannot add payment to a cancelled order");
    }

    // Không cho thanh toán nếu đã thanh toán
    if (order.paymentStatus === "paid") {
      throw new Error("Order already paid");
    }

    // Check đủ tiền
    if (input.amount < order.finalPrice) {
      throw new Error("Số tiền thanh toán chưa đủ tổng đơn hàng");
    }

    // Tạo payment record
    await this.repo.addPayment({
      orderId: input.orderId,
      provider: "cod",
      method: "cod",
      amount: input.amount,
      status: "paid",
      transactionId: null,
      rawPayload: null,
    });

    // Update payment status
    await this.repo.updatePaymentStatus(input.orderId, "paid");

    return { success: true };
  }
}
