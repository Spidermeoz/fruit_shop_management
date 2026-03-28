export interface InventoryListItem {
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

  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface InventoryTransactionListItem {
  id: number;
  createdAt?: string | null;

  branchId: number;
  branchName: string;
  branchCode?: string | null;

  productId: number;
  productTitle: string;
  productThumbnail?: string | null;

  variantId: number;
  variantTitle?: string | null;
  variantSku?: string | null;

  transactionType:
    | "initial"
    | "adjustment"
    | "manual_update"
    | "order_created"
    | "order_cancelled"
    | "transfer_out"
    | "transfer_in";

  quantityDelta: number;
  quantityBefore: number;
  quantityAfter: number;

  referenceType?: string | null;
  referenceId?: number | null;
  note?: string | null;

  createdById?: number | null;
  createdByName?: string | null;
}
