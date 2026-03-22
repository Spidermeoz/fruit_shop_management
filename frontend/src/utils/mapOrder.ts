export function mapOrder(order: any) {
  const o = order?.props ?? order ?? {};

  return {
    id: Number(o.id),
    user_id:
      o.userId !== undefined && o.userId !== null
        ? Number(o.userId)
        : undefined,
    customer: o.address?.fullName || "-",
    user_name: o.address?.fullName || "-",
    final_price: Number(o.finalPrice ?? o.totalPrice ?? 0),
    total_price: Number(o.totalPrice ?? 0),
    discount_amount: Number(o.discountAmount ?? 0),
    status: o.status,
    payment_status: o.paymentStatus,
    created_at: o.createdAt,
    code: o.code || `ORD-${o.id}`,
    phone: o.address?.phone || "-",
    address: o.address
      ? {
          full_name: o.address.fullName ?? null,
          phone: o.address.phone ?? null,
          address_line1: o.address.addressLine1 ?? null,
          address_line2: o.address.addressLine2 ?? null,
          ward: o.address.ward ?? null,
          district: o.address.district ?? null,
          province: o.address.province ?? null,
          postal_code: o.address.postalCode ?? null,
          notes: o.address.notes ?? null,
        }
      : null,
    items: Array.isArray(o.items)
      ? o.items.map((item: any) => ({
          id:
            item.id !== undefined && item.id !== null
              ? Number(item.id)
              : undefined,
          product_id:
            item.productId !== undefined && item.productId !== null
              ? Number(item.productId)
              : null,
          product_variant_id:
            item.productVariantId !== undefined &&
            item.productVariantId !== null
              ? Number(item.productVariantId)
              : null,
          quantity: Number(item.quantity ?? 0),
          price: Number(item.price ?? 0),
          product_title: item.productTitle ?? item.title ?? null,
          variant_title: item.variantTitle ?? null,
          variant_sku: item.variantSku ?? null,
          thumbnail: item.thumbnail ?? item.product?.thumbnail ?? null,
        }))
      : [],
  };
}
