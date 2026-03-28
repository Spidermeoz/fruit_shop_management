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
