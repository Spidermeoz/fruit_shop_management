import type { Transaction } from "sequelize";

export type InventoryTransactionType =
  | "initial"
  | "adjustment"
  | "manual_update"
  | "order_created"
  | "order_cancelled"
  | "transfer_out"
  | "transfer_in";

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

export type InventoryStockListItem = {
  branchId: number;
  branchName: string;
  branchCode?: string | null;

  productId: number;
  productTitle: string;
  productThumbnail?: string | null;
  productStatus?: string | null;

  variantId: number;
  variantSku?: string | null;
  variantTitle?: string | null;
  variantPrice: number;
  variantStatus?: string | null;

  quantity: number;
  reservedQuantity: number;
  availableQuantity: number;

  createdAt?: Date;
  updatedAt?: Date;
};

export type InventoryTransactionListItem = {
  id: number;
  createdAt?: Date;

  branchId: number;
  branchName: string;
  branchCode?: string | null;

  productId: number;
  productTitle: string;
  productThumbnail?: string | null;

  variantId: number;
  variantTitle?: string | null;
  variantSku?: string | null;

  transactionType: InventoryTransactionType;
  quantityDelta: number;
  quantityBefore: number;
  quantityAfter: number;

  referenceType?: string | null;
  referenceId?: number | null;
  note?: string | null;

  createdById?: number | null;
  createdByName?: string | null;
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

  listStocksByBranch(input: {
    branchId?: number | null;
    q?: string;
    status?: string | null;
  }): Promise<InventoryStockListItem[]>;

  listTransactions(input: {
    branchId?: number | null;
    q?: string;
    transactionType?: string | null;
    dateFrom?: string | null;
    dateTo?: string | null;
  }): Promise<InventoryTransactionListItem[]>;

  createTransaction(
    input: CreateInventoryTransactionInput,
    transaction?: Transaction,
  ): Promise<void>;
}
