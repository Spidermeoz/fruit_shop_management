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
    private inventoryRepo: any,
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

    await this.inventoryRepo.ensureStockForVariant(
      input.productVariantId,
      Number(variant.stock ?? 0),
    );

    const availableStock =
      variant.availableStock !== undefined
        ? Number(variant.availableStock)
        : Number(variant.stock ?? 0);

    if (input.quantity > availableStock) {
      throw new Error("Quantity exceeds available stock");
    }

    return this.cartRepo.updateItem(
      input.userId,
      input.productVariantId,
      input.quantity,
    );
  }
}
