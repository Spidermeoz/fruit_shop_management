import type { CartRepository } from "../../../domain/carts/CartRepository";

type Input = {
  userId: number;
  productId: number;
  quantity: number;
};

export class UpdateCartItem {
  constructor(private repo: CartRepository) {}

  async execute(input: Input) {
    if (!input.quantity || input.quantity <= 0) {
      throw new Error("Quantity must be greater than 0");
    }

    const item = await this.repo.updateItem(
      input.userId,
      input.productId,
      input.quantity
    );

    return item;
  }
}
