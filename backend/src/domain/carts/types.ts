// src/domain/carts/types.ts

export type CartItemProduct = {
  id: number;
  title: string;
  thumbnail: string | null;
  slug: string | null;
  discountPercentage: number | null;
};

export type CartItemVariant = {
  id: number;
  productId: number;
  title: string | null;
  sku: string | null;
  price: number;
  compareAtPrice?: number | null;
  stock: number;
  status?: string;
  optionValues?: {
    id: number;
    value: string;
    optionName?: string;
  }[];
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
