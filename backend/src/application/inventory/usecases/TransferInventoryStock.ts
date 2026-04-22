import type { InventoryRepository } from "../../../domain/inventory/InventoryRepository";
import type { ProductRepository } from "../../../domain/products/ProductRepository";
import type { CreateNotification } from "../../notifications/usecases/CreateNotification";
import type { CreateAuditLog } from "../../audit-logs/usecases/CreateAuditLog";

const LOW_STOCK_THRESHOLD = 10;

const buildInventorySeverity = (availableQuantity: number) => {
  if (availableQuantity <= 0) return "critical" as const;
  if (availableQuantity <= LOW_STOCK_THRESHOLD) return "warning" as const;
  return null;
};
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
    private createNotification?: CreateNotification,
    private createAuditLog?: CreateAuditLog,
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
    const sourceBefore = await this.inventoryRepo.findStock(
      sourceBranchId,
      variantId,
    );
    const targetBefore = await this.inventoryRepo.findStock(
      targetBranchId,
      variantId,
    );
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

        const freshVariant = await this.productRepo.findVariantById(variantId);

        if (!freshVariant) {
          throw new Error("Product variant không tồn tại");
        }

        await this.productRepo.updateVariantMirrorStock(
          variantId,
          freshVariant.availableStock ?? 0,
          t,
        );
      }

      await t.commit();

      const sourceAfter = await this.inventoryRepo.findStock(
        sourceBranchId,
        variantId,
      );
      const targetAfter = await this.inventoryRepo.findStock(
        targetBranchId,
        variantId,
      );

      if (this.createAuditLog) {
        await this.createAuditLog.execute({
          actorUserId:
            input.createdById !== undefined && input.createdById !== null
              ? Number(input.createdById)
              : null,
          branchId: sourceBranchId,
          action: "transfer_stock",
          moduleName: "inventory",
          entityType: "product_variant",
          entityId: variantId,
          oldValuesJson: {
            sourceAvailableQuantity: Number(
              sourceBefore?.availableQuantity ?? 0,
            ),
            targetAvailableQuantity: Number(
              targetBefore?.availableQuantity ?? 0,
            ),
          },
          newValuesJson: {
            sourceAvailableQuantity: Number(
              sourceAfter?.availableQuantity ?? 0,
            ),
            targetAvailableQuantity: Number(
              targetAfter?.availableQuantity ?? 0,
            ),
          },
          metaJson: {
            sourceBranchId,
            targetBranchId,
            quantity,
            note: input.note ?? null,
            productId: Number(variant.productId),
          },
        });
      }

      const maybeNotifyLowStock = async (
        branchId: number,
        availableQuantity: number,
      ) => {
        const severity = buildInventorySeverity(availableQuantity);
        if (!this.createNotification || !severity) return;

        const productTitle = String(
          freshProduct?.props?.title ??
            variant.title ??
            variant.sku ??
            `Variant #${variantId}`,
        );

        await this.createNotification.execute({
          eventKey:
            availableQuantity <= 0
              ? "inventory_out_of_stock"
              : "inventory_low_stock",
          category: "inventory",
          severity,
          title:
            availableQuantity <= 0
              ? `Hết hàng sau điều chuyển: ${productTitle}`
              : `Tồn kho thấp sau điều chuyển: ${productTitle}`,
          message:
            availableQuantity <= 0
              ? `Biến thể #${variantId} tại chi nhánh #${branchId} đã hết hàng sau điều chuyển.`
              : `Biến thể #${variantId} tại chi nhánh #${branchId} chỉ còn ${availableQuantity} sản phẩm khả dụng sau điều chuyển.`,
          entityType: "product_variant",
          entityId: variantId,
          actorUserId:
            input.createdById !== undefined && input.createdById !== null
              ? Number(input.createdById)
              : null,
          branchId,
          targetUrl: `/admin/inventory?branchId=${branchId}`,
          metaJson: {
            sourceBranchId,
            targetBranchId,
            productId: Number(variant.productId),
            productVariantId: variantId,
            availableQuantity,
            quantity,
          },
          dedupeKey: `${availableQuantity <= 0 ? "inventory_out_of_stock" : "inventory_low_stock"}:${branchId}:${variantId}:${availableQuantity}`,
          includeSuperAdmins: true,
          recipientBranchIds: [branchId],
        });
      };

      await maybeNotifyLowStock(
        sourceBranchId,
        Number(sourceAfter?.availableQuantity ?? 0),
      );
      await maybeNotifyLowStock(
        targetBranchId,
        Number(targetAfter?.availableQuantity ?? 0),
      );

      return { success: true };
    } catch (e) {
      await t.rollback();
      throw e;
    }
  }
}
