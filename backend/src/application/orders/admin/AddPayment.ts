// src/application/orders/admin/AddPayment.ts
import type { OrderRepository } from "../../../domain/orders/OrderRepository";

export class AddPayment {
  constructor(private repo: OrderRepository) {}

  async execute(input: { orderId: number; amount: number }) {
    const order = await this.repo.findById(input.orderId);
    if (!order) throw new Error("Order not found");

    // Chỉ cho admin xác nhận thanh toán COD đủ số tiền
    if (input.amount < order.finalPrice) {
      throw new Error("Số tiền thanh toán chưa đủ tổng đơn hàng");
    }

    // Ghi payment tối giản
    await this.repo.addPayment({
      orderId: input.orderId,
      provider: "cod",
      method: "cod",
      amount: input.amount,
      status: "paid",
      transactionId: null,
      rawPayload: null,
    });

    // Cập nhật trạng thái thanh toán
    await this.repo.updatePaymentStatus(input.orderId, "paid");

    return { success: true };
  }
}
