// src/application/orders/usecases/admin/ListOrders.ts
export class ListOrders {
  constructor(private orderRepo: any) {}

  async execute(filter: any) {
    return await this.orderRepo.list(filter);
  }
}
