import type { CartItemDTO } from "./types";

export interface CartRepository {
  addItem(
    userId: number,
    productVariantId: number,
    quantity: number,
  ): Promise<CartItemDTO>;

  listItems(userId: number): Promise<CartItemDTO[]>;

  updateItem(
    userId: number,
    productVariantId: number,
    quantity: number,
  ): Promise<CartItemDTO>;

  removeItem(userId: number, productVariantId: number): Promise<void>;

  removeAllItems(userId: number): Promise<void>;

  listSelectedItems(
    userId: number,
    productVariantIds: number[],
  ): Promise<CartItemDTO[]>;

  clearSelectedItems(
    userId: number,
    productVariantIds: number[],
  ): Promise<void>;
}
