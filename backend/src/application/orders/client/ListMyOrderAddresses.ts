export class ListMyOrderAddresses {
  constructor(private orderRepo: any) {}

  async execute(userId: number) {
    return await this.orderRepo.findDistinctAddressesByUser(userId);
  }
}
