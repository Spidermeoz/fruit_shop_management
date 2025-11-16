import type { CartItemDTO } from "./types";

export interface CartRepository {
  addItem(
    userId: number,
    productId: number,
    quantity: number
  ): Promise<CartItemDTO>;

  listItems(userId: number): Promise<CartItemDTO[]>;

  updateItem(
    userId: number,
    productId: number,
    quantity: number
  ): Promise<CartItemDTO>;

  removeItem(userId: number, productId: number): Promise<void>;
}
