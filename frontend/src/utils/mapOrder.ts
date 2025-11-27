export function mapOrder(order: any) {
  const o = order?.props ?? {};

  return {
    id: o.id,
    user_id: o.userId,
    customer: o.address?.fullName || "-", // lấy tên từ address
    user_name: o.address?.fullName || "-", // Thêm cả user_name để tương thích
    final_price: o.finalPrice ?? o.totalPrice ?? 0,
    total_price: o.totalPrice ?? 0,
    discount_amount: o.discountAmount ?? 0,
    status: o.status,
    payment_status: o.paymentStatus,
    created_at: o.createdAt,
    items: o.items ?? [],
    code: o.code || `ORD-${o.id}`, // Thêm mã đơn hàng
    phone: o.address?.phone || "-", // Thêm số điện thoại
  };
}