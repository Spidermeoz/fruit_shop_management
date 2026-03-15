import type { CartRepository } from "../../../domain/carts/CartRepository";
import type { ProductRepository } from "../../../domain/products/ProductRepository";

type Input = {
  userId: number;
  productId: number;
  quantity?: number;
};

export class AddToCart {
  constructor(
    private cartRepo: CartRepository,
    private productRepo: ProductRepository,
  ) {}

  async execute(input: Input) {
    const quantity =
      input.quantity && input.quantity > 0 ? Number(input.quantity) : 1;

    const product = await this.productRepo.findById(input.productId);

    if (!product) {
      throw new Error("Product not found");
    }

    const items = await this.cartRepo.listItems(input.userId);

    const currentQty =
      items.find((i) => i.productId === input.productId)?.quantity || 0;

    if (currentQty + quantity > product.stock) {
      throw new Error("Quantity exceeds stock");
    }

    return this.cartRepo.addItem(input.userId, input.productId, quantity);
  }
}
