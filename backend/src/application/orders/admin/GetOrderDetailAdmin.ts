// src/application/orders/usecases/admin/GetOrderDetailAdmin.ts
export class GetOrderDetailAdmin {
  constructor(private orderRepo: any) {}

  async execute(orderId: number) {
    const order = await this.orderRepo.findById(orderId);
    if (!order) throw new Error("Order not found");
    return order;
  }
}
