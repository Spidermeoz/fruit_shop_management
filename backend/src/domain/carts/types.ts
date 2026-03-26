// src/domain/carts/types.ts

export type CartItemProduct = {
  id: number;
  title: string;
  thumbnail: string | null;
  slug: string | null;
};

export type CartItemVariantOptionValue = {
  id: number;
  value: string;
  optionId?: number;
  optionName?: string;
};

export type CartItemVariant = {
  id: number;
  productId: number;
  title: string | null;
  sku: string | null;
  price: number;
  compareAtPrice?: number | null;

  // mirror / compatibility
  stock: number;

  // phase 3 inventory-aware fields
  availableStock?: number;
  reservedQuantity?: number;

  status?: string;
  optionValues?: CartItemVariantOptionValue[];
};

export type CartItemDTO = {
  id: number;
  cartId: number;
  productId: number | null;
  productVariantId: number | null;
  quantity: number;
  unitPrice: number | null;
  createdAt: Date;
  updatedAt: Date;
  product: CartItemProduct | null;
  variant: CartItemVariant | null;
};
