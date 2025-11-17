// src/application/orders/usecases/admin/AddDeliveryHistory.ts
export class AddDeliveryHistory {
  constructor(private orderRepo: any) {}

  async execute(orderId: number, data: any) {
    await this.orderRepo.addDeliveryHistory(
      orderId,
      data.status,
      data.location,
      data.note
    );
  }
}
