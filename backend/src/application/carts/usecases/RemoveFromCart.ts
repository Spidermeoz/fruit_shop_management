import type { CartRepository } from "../../../domain/carts/CartRepository";

type Input = {
  userId: number;
  productId: number;
};

export class RemoveFromCart {
  constructor(private repo: CartRepository) {}

  async execute(input: Input) {
    await this.repo.removeItem(input.userId, input.productId);
    return { success: true };
  }
}
