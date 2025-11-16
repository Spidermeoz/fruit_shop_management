import type { CartRepository } from "../../../domain/carts/CartRepository";

export class ListCartItems {
  constructor(private repo: CartRepository) {}

  async execute(userId: number) {
    const items = await this.repo.listItems(userId);
    return { items };
  }
}
