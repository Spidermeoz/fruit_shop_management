// src/application/orders/usecases/admin/AddPayment.ts
export class AddPayment {
  constructor(private orderRepo: any) {}

  async execute(data: any) {
    await this.orderRepo.addPayment({
      orderId: data.orderId,
      provider: data.provider,
      method: data.method,
      amount: data.amount,
      status: data.status,
      transactionId: data.transactionId ?? null,
      rawPayload: data.rawPayload ?? null,
    });
  }
}
