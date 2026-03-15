import type { CartRepository } from "../../../domain/carts/CartRepository";
import type { ProductRepository } from "../../../domain/products/ProductRepository";

type Input = {
  userId: number;
  productId: number;
  quantity: number;
};

export class UpdateCartItem {
  constructor(
    private cartRepo: CartRepository,
    private productRepo: ProductRepository
  ) {}

  async execute(input: Input) {
    if (!input.quantity || input.quantity <= 0) {
      throw new Error("Quantity must be greater than 0");
    }

    const product = await this.productRepo.findById(input.productId);

    if (!product) {
      throw new Error("Product not found");
    }

    if (input.quantity > product.stock) {
      throw new Error("Quantity exceeds stock");
    }

    return this.cartRepo.updateItem(
      input.userId,
      input.productId,
      input.quantity
    );
  }
}
