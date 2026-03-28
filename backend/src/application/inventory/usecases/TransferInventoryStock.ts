import type { InventoryRepository } from "../../../domain/inventory/InventoryRepository";
import type { ProductRepository } from "../../../domain/products/ProductRepository";

type Input = {
  sourceBranchId: number;
  targetBranchId: number;
  productVariantId: number;
  quantity: number;
  note?: string | null;
  createdById?: number | null;
};

export class TransferInventoryStock {
  constructor(
    private inventoryRepo: InventoryRepository,
    private productRepo: ProductRepository,
    private sequelize: any, // truyền sequelize instance
  ) {}

  async execute(input: Input) {
    const sourceBranchId = Number(input.sourceBranchId);
    const targetBranchId = Number(input.targetBranchId);
    const variantId = Number(input.productVariantId);
    const quantity = Math.max(0, Number(input.quantity || 0));

    if (!sourceBranchId || !targetBranchId) {
      throw new Error("Branch không hợp lệ");
    }

    if (sourceBranchId === targetBranchId) {
      throw new Error("Không thể chuyển trong cùng một branch");
    }

    if (!variantId) {
      throw new Error("Variant không hợp lệ");
    }

    if (quantity <= 0) {
      throw new Error("Số lượng phải > 0");
    }

    const variant = await this.productRepo.findVariantById(variantId);
    if (!variant) {
      throw new Error("Product variant không tồn tại");
    }

    const t = await this.sequelize.transaction();

    try {
      // 1. Trừ kho nguồn
      await this.inventoryRepo.decreaseStock(
        sourceBranchId,
        variantId,
        quantity,
        {
          transaction: t,
          transactionType: "transfer_out",
          referenceType: "inventory_transfer",
          referenceId: variantId,
          note: input.note ?? "Transfer out",
          createdById: input.createdById ?? null,
        },
      );

      // 2. Cộng kho đích
      await this.inventoryRepo.increaseStock(
        targetBranchId,
        variantId,
        quantity,
        {
          transaction: t,
          transactionType: "transfer_in",
          referenceType: "inventory_transfer",
          referenceId: variantId,
          note: input.note ?? "Transfer in",
          createdById: input.createdById ?? null,
        },
      );

      // 3. Update mirror stock
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
          : 0;

        await this.productRepo.updateProductMirrorStock(
          Number(freshProduct.props.id),
          totalStock,
        );
      }

      await t.commit();

      return { success: true };
    } catch (e) {
      await t.rollback();
      throw e;
    }
  }
}
