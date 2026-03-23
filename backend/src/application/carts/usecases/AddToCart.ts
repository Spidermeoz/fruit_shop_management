import type { CartRepository } from "../../../domain/carts/CartRepository";
import type { ProductRepository } from "../../../domain/products/ProductRepository";

type Input = {
  userId: number;
  productVariantId: number;
  quantity?: number;
};

export class AddToCart {
  constructor(
    private cartRepo: CartRepository,
    private productRepo: ProductRepository,
    private inventoryRepo: any,
  ) {}

  async execute(input: Input) {
    const quantity =
      input.quantity && input.quantity > 0 ? Number(input.quantity) : 1;

    const variant = await this.productRepo.findVariantById(
      input.productVariantId,
    );

    if (!variant) {
      throw new Error("Product variant not found");
    }

    if (variant.status !== "active") {
      throw new Error("Product variant is inactive");
    }

    const stock = await this.inventoryRepo.ensureStockForVariant(
      input.productVariantId,
      Number(variant.stock ?? 0),
    );

    const items = await this.cartRepo.listItems(input.userId);

    const currentQty =
      items.find((i) => i.productVariantId === input.productVariantId)
        ?.quantity || 0;

    if (currentQty + quantity > stock.quantity) {
      throw new Error("Quantity exceeds stock");
    }

    return this.cartRepo.addItem(
      input.userId,
      input.productVariantId,
      quantity,
    );
  }
}
