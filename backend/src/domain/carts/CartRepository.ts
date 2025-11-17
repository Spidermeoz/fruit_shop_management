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

  /**
   * Lấy danh sách các item được chọn để checkout
   */
  listSelectedItems(
    userId: number,
    productIds: number[]
  ): Promise<CartItemDTO[]>;

  /**
   * Xóa chỉ những item đã được checkout thành công
   */
  clearSelectedItems(userId: number, productIds: number[]): Promise<void>;
}
