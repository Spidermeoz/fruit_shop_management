import type {
  BranchSummary,
  ClientOrder,
  ClientOrderAddress,
  ClientOrderItem,
  Order,
  OrderAddress,
  OrderItem,
} from "../types/orders";

const mapBranchSummary = (branch: any): BranchSummary | null => {
  if (!branch) return null;

  return {
    id: branch.id !== undefined && branch.id !== null ? Number(branch.id) : 0,
    name: branch.name ?? null,
    code: branch.code ?? null,
    status: branch.status ?? null,
  };
};

const mapOrderAddress = (address: any): OrderAddress | null => {
  if (!address) return null;

  return {
    full_name: address.fullName ?? address.full_name ?? null,
    phone: address.phone ?? null,
    email: address.email ?? null,
    address_line1: address.addressLine1 ?? address.address_line1 ?? null,
    address_line2: address.addressLine2 ?? address.address_line2 ?? null,
    ward: address.ward ?? null,
    district: address.district ?? null,
    province: address.province ?? null,
    postal_code: address.postalCode ?? address.postal_code ?? null,
    notes: address.notes ?? null,
  };
};

const mapClientOrderAddress = (address: any): ClientOrderAddress | null => {
  if (!address) return null;

  return {
    fullName: address.fullName ?? address.full_name ?? null,
    phone: address.phone ?? null,
    email: address.email ?? null,
    addressLine1: address.addressLine1 ?? address.address_line1 ?? null,
    addressLine2: address.addressLine2 ?? address.address_line2 ?? null,
    ward: address.ward ?? null,
    district: address.district ?? null,
    province: address.province ?? null,
    postalCode: address.postalCode ?? address.postal_code ?? null,
    notes: address.notes ?? null,
  };
};

const mapOrderItem = (item: any): OrderItem => {
  return {
    id: item.id !== undefined && item.id !== null ? Number(item.id) : undefined,
    product_id:
      item.productId !== undefined && item.productId !== null
        ? Number(item.productId)
        : item.product_id !== undefined && item.product_id !== null
          ? Number(item.product_id)
          : null,
    slug: item.slug ?? null,
    product_variant_id:
      item.productVariantId !== undefined && item.productVariantId !== null
        ? Number(item.productVariantId)
        : item.product_variant_id !== undefined &&
            item.product_variant_id !== null
          ? Number(item.product_variant_id)
          : null,
    quantity: Number(item.quantity ?? 0),
    price: Number(item.price ?? 0),
    product_title:
      item.productTitle ?? item.product_title ?? item.title ?? null,
    variant_title: item.variantTitle ?? item.variant_title ?? null,
    variant_sku: item.variantSku ?? item.variant_sku ?? null,
    thumbnail: item.thumbnail ?? item.product?.thumbnail ?? null,
  };
};

const mapClientOrderItem = (item: any): ClientOrderItem => {
  return {
    id: item.id !== undefined && item.id !== null ? Number(item.id) : undefined,
    productId:
      item.productId !== undefined && item.productId !== null
        ? Number(item.productId)
        : item.product_id !== undefined && item.product_id !== null
          ? Number(item.product_id)
          : null,
    slug: item.slug ?? null,
    productVariantId:
      item.productVariantId !== undefined && item.productVariantId !== null
        ? Number(item.productVariantId)
        : item.product_variant_id !== undefined &&
            item.product_variant_id !== null
          ? Number(item.product_variant_id)
          : null,
    quantity: Number(item.quantity ?? 0),
    price: Number(item.price ?? 0),
    productTitle: item.productTitle ?? item.product_title ?? item.title ?? null,
    variantTitle: item.variantTitle ?? item.variant_title ?? null,
    variantSku: item.variantSku ?? item.variant_sku ?? null,
    thumbnail: item.thumbnail ?? item.product?.thumbnail ?? null,
    _reviewed: item._reviewed ?? false,
  };
};

export function mapOrder(order: any): Order {
  const o = order?.props ?? order ?? {};

  return {
    id: Number(o.id),
    user_id:
      o.userId !== undefined && o.userId !== null
        ? Number(o.userId)
        : o.user_id !== undefined && o.user_id !== null
          ? Number(o.user_id)
          : undefined,
    customer:
      o.customer ??
      o.address?.fullName ??
      o.address?.full_name ??
      o.user_name ??
      "-",
    user_name:
      o.userName ??
      o.user_name ??
      o.address?.fullName ??
      o.address?.full_name ??
      "-",
    final_price: Number(o.finalPrice ?? o.final_price ?? o.totalPrice ?? 0),
    total_price: Number(o.totalPrice ?? o.total_price ?? 0),
    discount_amount: Number(o.discountAmount ?? o.discount_amount ?? 0),
    shipping_fee: Number(o.shippingFee ?? o.shipping_fee ?? 0),
    status: o.status,
    payment_status: o.paymentStatus ?? o.payment_status,
    created_at: o.createdAt ?? o.created_at,
    code: o.code || `ORD-${o.id}`,
    phone: o.phone ?? o.address?.phone ?? "-",
    branch_id:
      o.branchId !== undefined && o.branchId !== null
        ? Number(o.branchId)
        : o.branch_id !== undefined && o.branch_id !== null
          ? Number(o.branch_id)
          : null,
    fulfillment_type: o.fulfillmentType ?? o.fulfillment_type ?? null,

    delivery_type: o.deliveryType ?? o.delivery_type ?? null,
    delivery_date: o.deliveryDate ?? o.delivery_date ?? null,
    delivery_time_slot_id:
      o.deliveryTimeSlotId !== undefined && o.deliveryTimeSlotId !== null
        ? Number(o.deliveryTimeSlotId)
        : o.delivery_time_slot_id !== undefined &&
            o.delivery_time_slot_id !== null
          ? Number(o.delivery_time_slot_id)
          : null,
    delivery_time_slot_label:
      o.deliveryTimeSlotLabel ?? o.delivery_time_slot_label ?? null,
    shipping_zone_id:
      o.shippingZoneId !== undefined && o.shippingZoneId !== null
        ? Number(o.shippingZoneId)
        : o.shipping_zone_id !== undefined && o.shipping_zone_id !== null
          ? Number(o.shipping_zone_id)
          : null,
    shipping_zone_code: o.shippingZoneCode ?? o.shipping_zone_code ?? null,
    shipping_zone_name: o.shippingZoneName ?? o.shipping_zone_name ?? null,
    delivery_note: o.deliveryNote ?? o.delivery_note ?? null,

    branch: mapBranchSummary(o.branch),
    address: mapOrderAddress(o.address),
    items: Array.isArray(o.items) ? o.items.map(mapOrderItem) : [],
  };
}

export function mapClientOrder(order: any): ClientOrder {
  const o = order?.props ?? order ?? {};

  return {
    id: Number(o.id),
    userId:
      o.userId !== undefined && o.userId !== null
        ? Number(o.userId)
        : o.user_id !== undefined && o.user_id !== null
          ? Number(o.user_id)
          : undefined,
    customer: o.customer ?? o.address?.fullName ?? o.address?.full_name ?? null,
    userName:
      o.userName ??
      o.user_name ??
      o.address?.fullName ??
      o.address?.full_name ??
      null,
    finalPrice: Number(o.finalPrice ?? o.final_price ?? o.totalPrice ?? 0),
    totalPrice: Number(o.totalPrice ?? o.total_price ?? 0),
    discountAmount: Number(o.discountAmount ?? o.discount_amount ?? 0),
    shippingFee: Number(o.shippingFee ?? o.shipping_fee ?? 0),
    paymentStatus: o.paymentStatus ?? o.payment_status ?? "unpaid",
    status: o.status,
    createdAt: o.createdAt ?? o.created_at,
    code: o.code || `ORD-${o.id}`,
    phone: o.phone ?? o.address?.phone ?? null,
    branchId:
      o.branchId !== undefined && o.branchId !== null
        ? Number(o.branchId)
        : o.branch_id !== undefined && o.branch_id !== null
          ? Number(o.branch_id)
          : null,
    fulfillmentType: o.fulfillmentType ?? o.fulfillment_type ?? null,

    deliveryType: o.deliveryType ?? o.delivery_type ?? null,
    deliveryDate: o.deliveryDate ?? o.delivery_date ?? null,
    deliveryTimeSlotId:
      o.deliveryTimeSlotId !== undefined && o.deliveryTimeSlotId !== null
        ? Number(o.deliveryTimeSlotId)
        : o.delivery_time_slot_id !== undefined &&
            o.delivery_time_slot_id !== null
          ? Number(o.delivery_time_slot_id)
          : null,
    deliveryTimeSlotLabel:
      o.deliveryTimeSlotLabel ?? o.delivery_time_slot_label ?? null,
    shippingZoneId:
      o.shippingZoneId !== undefined && o.shippingZoneId !== null
        ? Number(o.shippingZoneId)
        : o.shipping_zone_id !== undefined && o.shipping_zone_id !== null
          ? Number(o.shipping_zone_id)
          : null,
    shippingZoneCode: o.shippingZoneCode ?? o.shipping_zone_code ?? null,
    shippingZoneName: o.shippingZoneName ?? o.shipping_zone_name ?? null,
    deliveryNote: o.deliveryNote ?? o.delivery_note ?? null,

    branch: mapBranchSummary(o.branch),
    address: mapClientOrderAddress(o.address),
    items: Array.isArray(o.items) ? o.items.map(mapClientOrderItem) : [],
  };
}
