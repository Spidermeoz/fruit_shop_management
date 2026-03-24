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

export function mapClientOrder(order: any) {
  const o = order?.props ?? order ?? {};

  return {
    id: Number(o.id),
    userId:
      o.userId !== undefined && o.userId !== null
        ? Number(o.userId)
        : undefined,
    customer: o.address?.fullName ?? null,
    userName: o.address?.fullName ?? null,
    finalPrice: Number(o.finalPrice ?? o.totalPrice ?? 0),
    totalPrice: Number(o.totalPrice ?? 0),
    discountAmount: Number(o.discountAmount ?? 0),
    shippingFee: Number(o.shippingFee ?? 0),
    paymentStatus: o.paymentStatus ?? "unpaid",
    status: o.status,
    createdAt: o.createdAt,
    code: o.code || `ORD-${o.id}`,
    phone: o.address?.phone || null,
    address: o.address
      ? {
          fullName: o.address.fullName ?? null,
          phone: o.address.phone ?? null,
          email: o.address.email ?? null,
          addressLine1: o.address.addressLine1 ?? null,
          addressLine2: o.address.addressLine2 ?? null,
          ward: o.address.ward ?? null,
          district: o.address.district ?? null,
          province: o.address.province ?? null,
          postalCode: o.address.postalCode ?? null,
          notes: o.address.notes ?? null,
        }
      : null,
    items: Array.isArray(o.items)
      ? o.items.map((item: any) => ({
          id:
            item.id !== undefined && item.id !== null
              ? Number(item.id)
              : undefined,
          productId:
            item.productId !== undefined && item.productId !== null
              ? Number(item.productId)
              : null,
          productVariantId:
            item.productVariantId !== undefined &&
            item.productVariantId !== null
              ? Number(item.productVariantId)
              : null,
          quantity: Number(item.quantity ?? 0),
          price: Number(item.price ?? 0),
          productTitle: item.productTitle ?? item.title ?? null,
          variantTitle: item.variantTitle ?? null,
          variantSku: item.variantSku ?? null,
          thumbnail: item.thumbnail ?? item.product?.thumbnail ?? null,
        }))
      : [],
  };
}
