import type { Transaction } from "sequelize";

export type InventoryTransactionType =
  | "initial"
  | "adjustment"
  | "manual_update"
  | "order_created"
  | "order_cancelled";

export type InventoryStock = {
  id?: number;
  branchId: number;
  productVariantId: number;
  quantity: number;
  reservedQuantity: number;
  availableQuantity: number;
  createdAt?: Date;
  updatedAt?: Date;
};

export type CreateInventoryTransactionInput = {
  branchId: number;
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
  findStock(
    branchId: number,
    productVariantId: number,
    transaction?: Transaction,
  ): Promise<InventoryStock | null>;

  ensureStock(
    branchId: number,
    productVariantId: number,
    fallbackQuantity?: number,
    transaction?: Transaction,
  ): Promise<InventoryStock>;

  getAvailableStock(
    branchId: number,
    productVariantId: number,
    fallbackQuantity?: number,
    transaction?: Transaction,
  ): Promise<number>;

  setStock(
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
  ): Promise<InventoryStock>;

  increaseStock(
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
  ): Promise<InventoryStock>;

  decreaseStock(
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
  ): Promise<InventoryStock>;

  createTransaction(
    input: CreateInventoryTransactionInput,
    transaction?: Transaction,
  ): Promise<void>;
}
