// src/application/orders/usecases/admin/UpdateOrderStatus.ts
export class UpdateOrderStatus {
  constructor(private orderRepo: any) {}

  async execute(orderId: number, status: string) {
    await this.orderRepo.updateStatus(orderId, status);
    await this.orderRepo.addDeliveryHistory(
      orderId,
      status,
      null,
      `State changed to ${status}`
    );
  }
}
