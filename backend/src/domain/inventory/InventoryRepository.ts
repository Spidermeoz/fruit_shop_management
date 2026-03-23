import type { Transaction } from "sequelize";

export type InventoryTransactionType =
  | "initial"
  | "adjustment"
  | "manual_update"
  | "order_created"
  | "order_cancelled";

export type InventoryStock = {
  id?: number;
  productVariantId: number;
  quantity: number;
  reservedQuantity: number;
  createdAt?: Date;
  updatedAt?: Date;
};

export type CreateInventoryTransactionInput = {
  productVariantId: number;
  transactionType: InventoryTransactionType;
  quantityDelta: number;
  quantityBefore: number;
  quantityAfter: number;
  referenceType?: string | null;
  referenceId?: number | null;
  note?: string | null;
  createdById?: number | null;
};

export interface InventoryRepository {
  findStockByVariantId(
    productVariantId: number,
    transaction?: Transaction,
  ): Promise<InventoryStock | null>;

  ensureStockForVariant(
    productVariantId: number,
    fallbackQuantity?: number,
    transaction?: Transaction,
  ): Promise<InventoryStock>;

  setStockByVariantId(
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
  ): Promise<InventoryStock>;

  increaseStockByVariantId(
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
  ): Promise<InventoryStock>;

  decreaseStockByVariantId(
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
  ): Promise<InventoryStock>;

  recalculateProductStockFromVariants(
    productId: number,
    transaction?: Transaction,
  ): Promise<number>;

  createTransaction(
    input: CreateInventoryTransactionInput,
    transaction?: Transaction,
  ): Promise<void>;
}
