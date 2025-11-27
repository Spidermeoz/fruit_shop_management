// Thông tin sản phẩm nhúng trong item giỏ hàng (để FE render)
export type CartItemProduct = {
  id: number;
  title: string;
  price: number | null;
  discountPercentage: number; // Thêm trường này để lưu phần trăm giảm giá
  thumbnail: string | null;
  slug: string | null;
};

// Domain DTO cho 1 cart item
export type CartItemDTO = {
  id: number;
  cartId: number;
  productId: number;
  quantity: number;
  createdAt: Date;
  updatedAt: Date;
  product: CartItemProduct | null;
};