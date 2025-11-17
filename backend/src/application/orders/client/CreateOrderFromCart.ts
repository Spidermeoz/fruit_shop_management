export class CreateOrderFromCart {
  constructor(private orderRepo: any, private cartRepo: any) {}

  async execute(userId: number, payload: any) {
    const { productIds } = payload;

    if (!productIds || productIds.length === 0) {
      throw new Error("Bạn chưa chọn sản phẩm để thanh toán");
    }

    // Lấy đúng item được chọn
    const cartItems = await this.cartRepo.listSelectedItems(userId, productIds);

    if (cartItems.length === 0) {
      throw new Error("Không tìm thấy sản phẩm hợp lệ trong giỏ hàng");
    }

    const total = cartItems.reduce(
      (sum: number, item: any) =>
        sum + item.quantity * (item.product?.price ?? 0),
      0
    );

    const order = await this.orderRepo.create({
      userId,
      items: cartItems.map((i: any) => ({
        productId: i.product_id,
        quantity: i.quantity,
        price: i.product?.price ?? 0,
        title: i.product?.title ?? "(Sản phẩm không còn tồn tại)",
      })),
      address: payload.address,
      shippingFee: payload.shippingFee ?? 0,
      discountAmount: payload.discountAmount ?? 0,
      totalPrice: total,
      userInfo: payload.userInfo ?? null,
    });

    // Xóa đúng item user đã chọn
    await this.cartRepo.clearSelectedItems(userId, productIds);

    return {
      id: order.props.id,
      code: order.props.code,
    };
  }
}
