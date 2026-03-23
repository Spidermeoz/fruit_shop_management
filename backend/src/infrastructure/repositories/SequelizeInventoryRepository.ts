import { Transaction } from "sequelize";
import type {
  CreateInventoryTransactionInput,
  InventoryRepository,
  InventoryStock,
  InventoryTransactionType,
} from "../../domain/inventory/InventoryRepository";

type InventoryModels = {
  InventoryStock: any;
  InventoryTransaction: any;
  ProductVariant: any;
  Product: any;
};

const toStock = (row: any): InventoryStock => ({
  id: Number(row.id),
  productVariantId: Number(row.product_variant_id),
  quantity: Number(row.quantity ?? 0),
  reservedQuantity: Number(row.reserved_quantity ?? 0),
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

export class SequelizeInventoryRepository implements InventoryRepository {
  constructor(private models: InventoryModels) {}

  async findStockByVariantId(
    productVariantId: number,
    transaction?: Transaction,
  ): Promise<InventoryStock | null> {
    const row = await this.models.InventoryStock.findOne({
      where: { product_variant_id: productVariantId },
      transaction,
    });

    return row ? toStock(row) : null;
  }

  async ensureStockForVariant(
    productVariantId: number,
    fallbackQuantity = 0,
    transaction?: Transaction,
  ): Promise<InventoryStock> {
    let row = await this.models.InventoryStock.findOne({
      where: { product_variant_id: productVariantId },
      transaction,
    });

    if (!row) {
      row = await this.models.InventoryStock.create(
        {
          product_variant_id: productVariantId,
          quantity: Math.max(0, Number(fallbackQuantity || 0)),
          reserved_quantity: 0,
        },
        { transaction },
      );

      await this.createTransaction(
        {
          productVariantId,
          transactionType: "initial",
          quantityDelta: Math.max(0, Number(fallbackQuantity || 0)),
          quantityBefore: 0,
          quantityAfter: Math.max(0, Number(fallbackQuantity || 0)),
          referenceType: "inventory_seed",
          referenceId: productVariantId,
          note: "Initial stock row created",
        },
        transaction,
      );
    }

    return toStock(row);
  }

  async setStockByVariantId(
    productVariantId: number,
    quantity: number,
    meta?: {
      transaction?: Transaction;
      transactionType?: InventoryTransactionType;
      referenceType?: string | null;
      referenceId?: number | null;
      note?: string | null;
      createdById?: number | null;
    },
  ): Promise<InventoryStock> {
    const transaction = meta?.transaction;
    const safeQuantity = Math.max(0, Number(quantity || 0));

    const variant = await this.models.ProductVariant.findByPk(
      productVariantId,
      {
        transaction,
      },
    );

    if (!variant) {
      throw new Error("Product variant not found");
    }

    const current = await this.ensureStockForVariant(
      productVariantId,
      Number(variant.stock ?? 0),
      transaction,
    );

    await this.models.InventoryStock.update(
      { quantity: safeQuantity },
      {
        where: { product_variant_id: productVariantId },
        transaction,
      },
    );

    await this.models.ProductVariant.update(
      { stock: safeQuantity },
      {
        where: { id: productVariantId },
        transaction,
      },
    );

    await this.recalculateProductStockFromVariants(
      Number(variant.product_id),
      transaction,
    );

    await this.createTransaction(
      {
        productVariantId,
        transactionType: meta?.transactionType ?? "manual_update",
        quantityDelta: safeQuantity - current.quantity,
        quantityBefore: current.quantity,
        quantityAfter: safeQuantity,
        referenceType: meta?.referenceType ?? null,
        referenceId: meta?.referenceId ?? null,
        note: meta?.note ?? null,
        createdById: meta?.createdById ?? null,
      },
      transaction,
    );

    return {
      ...current,
      quantity: safeQuantity,
    };
  }

  async increaseStockByVariantId(
    productVariantId: number,
    quantity: number,
    meta?: {
      transaction?: Transaction;
      transactionType?: InventoryTransactionType;
      referenceType?: string | null;
      referenceId?: number | null;
      note?: string | null;
      createdById?: number | null;
    },
  ): Promise<InventoryStock> {
    const transaction = meta?.transaction;
    const delta = Math.max(0, Number(quantity || 0));

    const variant = await this.models.ProductVariant.findByPk(
      productVariantId,
      {
        transaction,
      },
    );

    if (!variant) {
      throw new Error("Product variant not found");
    }

    const current = await this.ensureStockForVariant(
      productVariantId,
      Number(variant.stock ?? 0),
      transaction,
    );

    const nextQuantity = current.quantity + delta;

    await this.models.InventoryStock.update(
      { quantity: nextQuantity },
      {
        where: { product_variant_id: productVariantId },
        transaction,
      },
    );

    await this.models.ProductVariant.update(
      { stock: nextQuantity },
      {
        where: { id: productVariantId },
        transaction,
      },
    );

    await this.recalculateProductStockFromVariants(
      Number(variant.product_id),
      transaction,
    );

    await this.createTransaction(
      {
        productVariantId,
        transactionType: meta?.transactionType ?? "adjustment",
        quantityDelta: delta,
        quantityBefore: current.quantity,
        quantityAfter: nextQuantity,
        referenceType: meta?.referenceType ?? null,
        referenceId: meta?.referenceId ?? null,
        note: meta?.note ?? null,
        createdById: meta?.createdById ?? null,
      },
      transaction,
    );

    return {
      ...current,
      quantity: nextQuantity,
    };
  }

  async decreaseStockByVariantId(
    productVariantId: number,
    quantity: number,
    meta?: {
      transaction?: Transaction;
      transactionType?: InventoryTransactionType;
      referenceType?: string | null;
      referenceId?: number | null;
      note?: string | null;
      createdById?: number | null;
    },
  ): Promise<InventoryStock> {
    const transaction = meta?.transaction;
    const delta = Math.max(0, Number(quantity || 0));

    const variant = await this.models.ProductVariant.findByPk(
      productVariantId,
      {
        transaction,
      },
    );

    if (!variant) {
      throw new Error("Product variant not found");
    }

    const current = await this.ensureStockForVariant(
      productVariantId,
      Number(variant.stock ?? 0),
      transaction,
    );

    if (current.quantity < delta) {
      throw new Error("Insufficient inventory stock");
    }

    const nextQuantity = current.quantity - delta;

    await this.models.InventoryStock.update(
      { quantity: nextQuantity },
      {
        where: { product_variant_id: productVariantId },
        transaction,
      },
    );

    await this.models.ProductVariant.update(
      { stock: nextQuantity },
      {
        where: { id: productVariantId },
        transaction,
      },
    );

    await this.recalculateProductStockFromVariants(
      Number(variant.product_id),
      transaction,
    );

    await this.createTransaction(
      {
        productVariantId,
        transactionType: meta?.transactionType ?? "adjustment",
        quantityDelta: -delta,
        quantityBefore: current.quantity,
        quantityAfter: nextQuantity,
        referenceType: meta?.referenceType ?? null,
        referenceId: meta?.referenceId ?? null,
        note: meta?.note ?? null,
        createdById: meta?.createdById ?? null,
      },
      transaction,
    );

    return {
      ...current,
      quantity: nextQuantity,
    };
  }

  async recalculateProductStockFromVariants(
    productId: number,
    transaction?: Transaction,
  ): Promise<number> {
    const variants = await this.models.ProductVariant.findAll({
      where: { product_id: productId },
      attributes: ["stock"],
      transaction,
    });

    const total = variants.reduce(
      (sum: number, v: any) => sum + Number(v.stock ?? 0),
      0,
    );

    await this.models.Product.update(
      { stock: total },
      {
        where: { id: productId },
        transaction,
      },
    );

    return total;
  }

  async createTransaction(
    input: CreateInventoryTransactionInput,
    transaction?: Transaction,
  ): Promise<void> {
    await this.models.InventoryTransaction.create(
      {
        product_variant_id: input.productVariantId,
        transaction_type: input.transactionType,
        quantity_delta: input.quantityDelta,
        quantity_before: input.quantityBefore,
        quantity_after: input.quantityAfter,
        reference_type: input.referenceType ?? null,
        reference_id: input.referenceId ?? null,
        note: input.note ?? null,
        created_by_id: input.createdById ?? null,
      },
      { transaction },
    );
  }
}
