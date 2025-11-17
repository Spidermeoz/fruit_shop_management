import type { CartItemDTO } from "./types";

export interface CartRepository {
  /**
   * Thêm sản phẩm vào giỏ (tăng số lượng nếu đã tồn tại)
   */
  addItem(
    userId: number,
    productId: number,
    quantity: number
  ): Promise<CartItemDTO>;

  /**
   * Lấy toàn bộ giỏ hàng của user
   */
  listItems(userId: number): Promise<CartItemDTO[]>;

  /**
   * Cập nhật số lượng 1 sản phẩm trong giỏ
   */
  updateItem(
    userId: number,
    productId: number,
    quantity: number
  ): Promise<CartItemDTO>;

  /**
   * Xóa 1 sản phẩm khỏi giỏ
   */
  removeItem(userId: number, productId: number): Promise<void>;

  /**
   * Lấy danh sách item được chọn (theo productIds)
   * Dùng cho quá trình checkout
   */
  listSelectedItems(
    userId: number,
    productIds: number[]
  ): Promise<CartItemDTO[]>;

  /**
   * Xóa những item đã được checkout thành công
   */
  clearSelectedItems(userId: number, productIds: number[]): Promise<void>;
}
