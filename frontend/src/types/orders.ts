export interface OrdersSummary {
  totalOrders: number;
  totalRevenue: number;
  totalDiscount: number;
  pendingOrders: number;
}

export interface OrderListSummary {
  totalOrders: number;
  pending: number;
  processing: number;
  shipping: number;
  delivered: number;
  completed: number;
  cancelled: number;
  unpaidActive: number;
  paid: number;
  pickup: number;
  delivery: number;
  grossRevenue: number;
  netRevenue: number;
}

export interface BranchSummary {
  id: number;
  name?: string | null;
  code?: string | null;
  status?: string | null;
}

export interface ShippingZoneSummary {
  id: number;
  code?: string | null;
  name?: string | null;
}

export interface DeliverySlotSummary {
  id: number;
  code?: string | null;
  label?: string | null;
  startTime?: string | null;
  endTime?: string | null;
  cutoffMinutes?: number | null;
  isAvailable?: boolean;
  remainingCapacity?: number | null;
  reason?: string | null;
}

export interface QuoteBranchSummary {
  id: number;
  name: string;
  code?: string | null;
  status?: string | null;
  addressLine1?: string | null;
  district?: string | null;
  province?: string | null;
  supportsPickup?: boolean;
  supportsDelivery?: boolean;
}

export interface AppliedPromotionSummary {
  promotionId: number;
  promotionName: string;
  promotionScope?: "order" | "shipping" | string;
  discountType?: "fixed" | "percent" | "free_shipping" | string;
  discountValue?: number;
  promotionCodeId?: number | null;
  promotionCode?: string | null;
  discountAmount: number;
  shippingDiscountAmount: number;
  affectedProductIds?: number[];
  affectedVariantIds?: number[];
  affectedCategoryIds?: number[];
  affectedOriginIds?: number[];
}

export interface CheckoutQuoteMeta {
  fingerprint: string;
  computedAt: string;
  expiresAt?: string | null;
  consistencyVersion: number;
}

export interface CheckoutQuoteChangedPayload {
  previousQuote?: {
    fingerprint?: string | null;
    finalPrice?: number | null;
    shippingFee?: number | null;
    discountAmount?: number | null;
    shippingDiscountAmount?: number | null;
  } | null;
  currentQuote?: {
    fingerprint: string;
    subtotal: number;
    shippingFee: number;
    discountAmount: number;
    shippingDiscountAmount: number;
    finalPrice: number;
    selectedBranch?: QuoteBranchSummary | null;
    selectedSlot?: {
      id: number;
      label?: string | null;
      startTime?: string | null;
      endTime?: string | null;
    } | null;
    promotionCode?: string | null;
    promotionMessages?: string[];
  } | null;
}

export interface CheckoutQuote {
  subtotal: number;
  shippingFee: number;
  discountAmount: number;
  shippingDiscountAmount?: number;
  finalPrice: number;
  promotionCode?: string | null;
  appliedPromotions?: AppliedPromotionSummary[];
  promotionSnapshotJson?: Record<string, any> | null;
  promotionMessages?: string[];
  shippingZone: {
    id: number;
    code?: string | null;
    name?: string | null;
  } | null;
  availableSlots: DeliverySlotSummary[];
  selectedSlot: {
    id: number;
    label?: string | null;
    startTime?: string | null;
    endTime?: string | null;
  } | null;
  selectedBranch?: QuoteBranchSummary | null;
  candidateBranches?: QuoteBranchSummary[];
  requiresBranchSelection?: boolean;
  quoteMeta?: CheckoutQuoteMeta | null;
}

// =========================
// Admin/list-oriented raw types
// =========================
export interface OrderItem {
  id?: number;
  product_id?: number | null;
  product_variant_id?: number | null;
  quantity: number;
  price: number;
  product_title?: string | null;
  variant_title?: string | null;
  variant_sku?: string | null;
  thumbnail?: string | null;
  slug?: string | null;
}

export interface OrderAddress {
  full_name?: string | null;
  phone?: string | null;
  email?: string | null;
  address_line1?: string | null;
  address_line2?: string | null;
  ward?: string | null;
  district?: string | null;
  province?: string | null;
  postal_code?: string | null;
  notes?: string | null;
}

export interface Order {
  id: number;
  user_id?: number;
  user_name?: string | null;
  customer?: string | null;

  final_price?: number;
  finalPrice?: number;

  total_price?: number;
  totalPrice?: number;

  discount_amount?: number;
  discountAmount?: number;

  shipping_discount_amount?: number;
  shippingDiscountAmount?: number;

  promotion_code?: string | null;
  promotionCode?: string | null;

  promotion_snapshot_json?: Record<string, any> | null;
  promotionSnapshot?: Record<string, any> | null;

  shipping_fee?: number;
  shippingFee?: number;

  status: string;

  payment_status?: string;
  paymentStatus?: string;

  created_at?: string;
  createdAt?: string;

  code?: string;
  phone?: string | null;
  branch_id?: number | null;
  branchId?: number | null;

  fulfillment_type?: "pickup" | "delivery" | string | null;
  fulfillmentType?: "pickup" | "delivery" | string | null;

  delivery_type?: "standard" | "same_day" | "scheduled" | string | null;
  deliveryType?: "standard" | "same_day" | "scheduled" | string | null;

  delivery_date?: string | null;
  deliveryDate?: string | null;

  delivery_time_slot_id?: number | null;
  deliveryTimeSlotId?: number | null;

  delivery_time_slot_label?: string | null;
  deliveryTimeSlotLabel?: string | null;

  shipping_zone_id?: number | null;
  shippingZoneId?: number | null;

  shipping_zone_code?: string | null;
  shippingZoneCode?: string | null;

  shipping_zone_name?: string | null;
  shippingZoneName?: string | null;

  delivery_note?: string | null;
  deliveryNote?: string | null;

  branch?: BranchSummary | null;
  items?: OrderItem[];
  address?: OrderAddress | null;
}

// =========================
// Client normalized types
// =========================
export interface ClientOrderItem {
  id?: number;
  productId?: number | null;
  slug?: string | null;
  productVariantId?: number | null;
  quantity: number;
  price: number;
  productTitle?: string | null;
  variantTitle?: string | null;
  variantSku?: string | null;
  thumbnail?: string | null;
  _reviewed?: boolean;
}

export interface ClientOrderAddress {
  fullName?: string | null;
  phone?: string | null;
  email?: string | null;
  addressLine1?: string | null;
  addressLine2?: string | null;
  ward?: string | null;
  district?: string | null;
  province?: string | null;
  postalCode?: string | null;
  notes?: string | null;
}

export interface ClientOrder {
  id: number;
  userId?: number;
  customer?: string | null;
  userName?: string | null;
  finalPrice: number;
  totalPrice?: number;
  discountAmount?: number;
  shippingDiscountAmount?: number;
  promotionCode?: string | null;
  promotionSnapshot?: Record<string, any> | null;
  shippingFee?: number;
  paymentStatus?: string;
  status: string;
  createdAt: string;
  code?: string;
  phone?: string | null;
  branchId?: number | null;
  fulfillmentType?: "pickup" | "delivery" | string | null;

  deliveryType?: "standard" | "same_day" | "scheduled" | string | null;
  deliveryDate?: string | null;
  deliveryTimeSlotId?: number | null;
  deliveryTimeSlotLabel?: string | null;
  shippingZoneId?: number | null;
  shippingZoneCode?: string | null;
  shippingZoneName?: string | null;
  deliveryNote?: string | null;

  branch?: BranchSummary | null;
  items?: ClientOrderItem[];
  address?: ClientOrderAddress | null;
}
