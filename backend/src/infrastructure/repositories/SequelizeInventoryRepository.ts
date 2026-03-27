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
  Product?: any;
  Branch?: any;
};

const toStock = (row: any): InventoryStock => {
  const quantity = Number(row.quantity ?? 0);
  const reservedQuantity = Number(row.reserved_quantity ?? 0);

  return {
    id: Number(row.id),
    branchId: Number(row.branch_id),
    productVariantId: Number(row.product_variant_id),
    quantity,
    reservedQuantity,
    availableQuantity: Math.max(0, quantity - reservedQuantity),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
};

export class SequelizeInventoryRepository implements InventoryRepository {
  constructor(private models: InventoryModels) {}

  async findStock(
    branchId: number,
    productVariantId: number,
    transaction?: Transaction,
  ): Promise<InventoryStock | null> {
    const row = await this.models.InventoryStock.findOne({
      where: {
        branch_id: branchId,
        product_variant_id: productVariantId,
      },
      transaction,
    });

    return row ? toStock(row) : null;
  }

  async ensureStock(
    branchId: number,
    productVariantId: number,
    fallbackQuantity = 0,
    transaction?: Transaction,
  ): Promise<InventoryStock> {
    const safeFallback = Math.max(0, Number(fallbackQuantity || 0));

    const variant = await this.models.ProductVariant.findByPk(
      productVariantId,
      {
        transaction,
      },
    );

    if (!variant) {
      throw new Error("Product variant not found");
    }

    let row = await this.models.InventoryStock.findOne({
      where: {
        branch_id: branchId,
        product_variant_id: productVariantId,
      },
      transaction,
    });

    if (!row) {
      row = await this.models.InventoryStock.create(
        {
          branch_id: branchId,
          product_variant_id: productVariantId,
          quantity: safeFallback,
          reserved_quantity: 0,
        },
        { transaction },
      );

      await this.createTransaction(
        {
          branchId,
          productVariantId,
          transactionType: "initial",
          quantityDelta: safeFallback,
          quantityBefore: 0,
          quantityAfter: safeFallback,
          referenceType: "inventory_seed",
          referenceId: productVariantId,
          note: "Initial stock row created",
          createdById: null,
        },
        transaction,
      );
    }

    return toStock(row);
  }

  async getAvailableStock(
    branchId: number,
    productVariantId: number,
    fallbackQuantity = 0,
    transaction?: Transaction,
  ): Promise<number> {
    const stock = await this.ensureStock(
      branchId,
      productVariantId,
      fallbackQuantity,
      transaction,
    );

    return Math.max(0, Number(stock.quantity) - Number(stock.reservedQuantity));
  }

  async setStock(
    branchId: number,
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

    const current = await this.ensureStock(
      branchId,
      productVariantId,
      0,
      transaction,
    );

    await this.models.InventoryStock.update(
      { quantity: safeQuantity },
      {
        where: {
          branch_id: branchId,
          product_variant_id: productVariantId,
        },
        transaction,
      },
    );

    await this.createTransaction(
      {
        branchId,
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
      availableQuantity: Math.max(
        0,
        safeQuantity - Number(current.reservedQuantity ?? 0),
      ),
    };
  }

  async increaseStock(
    branchId: number,
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

    const current = await this.ensureStock(
      branchId,
      productVariantId,
      0,
      transaction,
    );

    const nextQuantity = current.quantity + delta;

    await this.models.InventoryStock.update(
      { quantity: nextQuantity },
      {
        where: {
          branch_id: branchId,
          product_variant_id: productVariantId,
        },
        transaction,
      },
    );

    await this.createTransaction(
      {
        branchId,
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
      availableQuantity: Math.max(
        0,
        nextQuantity - Number(current.reservedQuantity ?? 0),
      ),
    };
  }

  async decreaseStock(
    branchId: number,
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

    const current = await this.ensureStock(
      branchId,
      productVariantId,
      0,
      transaction,
    );

    const availableQuantity = Math.max(
      0,
      Number(current.quantity ?? 0) - Number(current.reservedQuantity ?? 0),
    );

    if (availableQuantity < delta) {
      throw new Error("Insufficient available inventory stock");
    }

    const nextQuantity = current.quantity - delta;

    await this.models.InventoryStock.update(
      { quantity: nextQuantity },
      {
        where: {
          branch_id: branchId,
          product_variant_id: productVariantId,
        },
        transaction,
      },
    );

    await this.createTransaction(
      {
        branchId,
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
      availableQuantity: Math.max(
        0,
        nextQuantity - Number(current.reservedQuantity ?? 0),
      ),
    };
  }

  async createTransaction(
    input: CreateInventoryTransactionInput,
    transaction?: Transaction,
  ): Promise<void> {
    await this.models.InventoryTransaction.create(
      {
        branch_id: input.branchId,
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
