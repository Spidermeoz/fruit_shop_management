import type { CartRepository } from "../../../domain/carts/CartRepository";
import type { ProductRepository } from "../../../domain/products/ProductRepository";

type Input = {
  userId: number;
  productVariantId: number;
  quantity: number;
};

export class UpdateCartItem {
  constructor(
    private cartRepo: CartRepository,
    private productRepo: ProductRepository,
  ) {}

  async execute(input: Input) {
    if (!input.quantity || input.quantity <= 0) {
      throw new Error("Quantity must be greater than 0");
    }

    const variant = await this.productRepo.findVariantById(
      input.productVariantId,
    );

    if (!variant) {
      throw new Error("Product variant not found");
    }

    if (variant.status !== "active") {
      throw new Error("Product variant is inactive");
    }

    const availableStock = Number(
      variant.availableStock ?? variant.stock ?? 0,
    );

    if (availableStock <= 0) {
      throw new Error("Product is out of stock");
    }

    if (input.quantity > availableStock) {
      throw new Error(
        `Only ${availableStock} item(s) available in stock`,
      );
    }

    return await this.cartRepo.updateItem(
      input.userId,
      input.productVariantId,
      input.quantity,
    );
  }
}