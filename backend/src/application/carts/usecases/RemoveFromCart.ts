import type { CartRepository } from "../../../domain/carts/CartRepository";

type Input = {
  userId: number;
  productVariantId: number;
};

export class RemoveFromCart {
  constructor(private repo: CartRepository) {}

  async execute(input: Input) {
    await this.repo.removeItem(input.userId, input.productVariantId);
    return { success: true };
  }
}
