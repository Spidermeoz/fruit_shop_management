import type { InventoryRepository } from "../../../domain/inventory/InventoryRepository";
import type { ProductRepository } from "../../../domain/products/ProductRepository";

type Input = {
  branchId: number;
  productVariantId: number;
  quantity: number;
  createdById?: number | null;
  note?: string | null;
};

export class SetInventoryStock {
  constructor(
    private inventoryRepo: InventoryRepository,
    private productRepo: ProductRepository,
  ) {}

  async execute(input: Input) {
    const branchId = Number(input.branchId);
    const productVariantId = Number(input.productVariantId);
    const quantity = Math.max(0, Number(input.quantity ?? 0));

    if (!Number.isInteger(branchId) || branchId <= 0) {
      throw new Error("branchId is required");
    }

    if (!Number.isInteger(productVariantId) || productVariantId <= 0) {
      throw new Error("productVariantId is required");
    }

    const variant = await this.productRepo.findVariantById(productVariantId);

    if (!variant) {
      throw new Error("Product variant not found");
    }

    const stock = await this.inventoryRepo.setStock(
      branchId,
      productVariantId,
      quantity,
      {
        transactionType: "manual_update",
        referenceType: "inventory_manual_set",
        referenceId: productVariantId,
        note: input.note ?? "Manual inventory update",
        createdById: input.createdById !== undefined ? input.createdById : null,
      },
    );

    // update mirror stock for compatibility
    await this.productRepo.updateVariantMirrorStock(
      productVariantId,
      stock.availableQuantity,
    );

    const freshProduct = await this.productRepo.findById(variant.productId);

    if (freshProduct) {
      const totalStock = Array.isArray(freshProduct.props.variants)
        ? freshProduct.props.variants.reduce(
            (sum, item) =>
              sum +
              Number(
                item.availableStock ??
                  item.inventory?.availableQuantity ??
                  item.stock ??
                  0,
              ),
            0,
          )
        : Number(freshProduct.props.stock ?? 0);

      await this.productRepo.updateProductMirrorStock(
        Number(freshProduct.props.id),
        totalStock,
      );
    }

    return {
      branchId,
      productVariantId,
      quantity: stock.quantity,
      reservedQuantity: stock.reservedQuantity,
      availableQuantity: stock.availableQuantity,
    };
  }
}
