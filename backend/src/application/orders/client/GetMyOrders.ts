// src/application/orders/usecases/client/GetMyOrders.ts
export class GetMyOrders {
  constructor(private orderRepo: any) {}

  async execute(userId: number, filter: any) {
    return await this.orderRepo.findByUser(userId, filter);
  }
}
