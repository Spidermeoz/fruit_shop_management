import type { CartRepository } from "../../../domain/carts/CartRepository";

type Input = {
  userId: number;
  productId: number;
  quantity?: number;
};

export class AddToCart {
  constructor(private repo: CartRepository) {}

  async execute(input: Input) {
    const quantity =
      input.quantity && input.quantity > 0 ? Number(input.quantity) : 1;

    const item = await this.repo.addItem(
      input.userId,
      input.productId,
      quantity
    );

    return item;
  }
}
