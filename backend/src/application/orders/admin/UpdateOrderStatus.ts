// src/application/orders/usecases/admin/UpdateOrderStatus.ts
export class UpdateOrderStatus {
  constructor(private orderRepo: any) {}

  async execute(orderId: number, status: string) {
    await this.orderRepo.updateStatus(orderId, status);
  }
}
