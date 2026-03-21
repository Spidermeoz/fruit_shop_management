import type { CartRepository } from "../../../domain/carts/CartRepository";

export class RemoveAllFromCart {
  constructor(private repo: CartRepository) {}

  async execute(userId: number) {
    await this.repo.removeAllItems(userId);
    return { success: true };
  }
}
