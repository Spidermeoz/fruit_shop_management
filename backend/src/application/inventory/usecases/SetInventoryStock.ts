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
    private createNotification?: CreateNotification,
    private createAuditLog?: CreateAuditLog,
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
    const beforeStock = await this.inventoryRepo.findStock(
      branchId,
      productVariantId,
    );

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

    if (this.createAuditLog) {
      await this.createAuditLog.execute({
        actorUserId:
          input.createdById !== undefined && input.createdById !== null
            ? Number(input.createdById)
            : null,
        branchId,
        action: "set_stock",
        moduleName: "inventory",
        entityType: "product_variant",
        entityId: productVariantId,
        oldValuesJson: {
          quantity: Number(beforeStock?.quantity ?? 0),
          reservedQuantity: Number(beforeStock?.reservedQuantity ?? 0),
          availableQuantity: Number(beforeStock?.availableQuantity ?? 0),
        },
        newValuesJson: {
          quantity: Number(stock.quantity ?? 0),
          reservedQuantity: Number(stock.reservedQuantity ?? 0),
          availableQuantity: Number(stock.availableQuantity ?? 0),
        },
        metaJson: {
          note: input.note ?? null,
          productId: Number(variant.productId),
        },
      });
    }

    const severity = buildInventorySeverity(
      Number(stock.availableQuantity ?? 0),
    );

    if (this.createNotification && severity) {
      const availableQuantity = Number(stock.availableQuantity ?? 0);
      const productTitle = String(
        freshProduct?.props?.title ??
          variant.title ??
          variant.sku ??
          `Variant #${productVariantId}`,
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
            ? `Hết hàng: ${productTitle}`
            : `Tồn kho thấp: ${productTitle}`,
        message:
          availableQuantity <= 0
            ? `Biến thể #${productVariantId} tại chi nhánh #${branchId} đã hết hàng.`
            : `Biến thể #${productVariantId} tại chi nhánh #${branchId} chỉ còn ${availableQuantity} sản phẩm khả dụng.`,
        entityType: "product_variant",
        entityId: productVariantId,
        actorUserId:
          input.createdById !== undefined && input.createdById !== null
            ? Number(input.createdById)
            : null,
        branchId,
        targetUrl: `/admin/inventory?branchId=${branchId}`,
        metaJson: {
          productId: Number(variant.productId),
          productVariantId,
          availableQuantity,
          quantity: Number(stock.quantity ?? 0),
          reservedQuantity: Number(stock.reservedQuantity ?? 0),
        },
        dedupeKey: `${availableQuantity <= 0 ? "inventory_out_of_stock" : "inventory_low_stock"}:${branchId}:${productVariantId}:${availableQuantity}`,
        includeSuperAdmins: true,
        recipientBranchIds: [branchId],
      });
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
