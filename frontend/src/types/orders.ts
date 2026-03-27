export interface OrdersSummary {
  totalOrders: number;
  totalRevenue: number;
  totalDiscount: number;
  pendingOrders: number;
}

export interface BranchSummary {
  id: number;
  name?: string | null;
  code?: string | null;
  status?: string | null;
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
  user_name: string | null;
  customer?: string | null;
  final_price: number;
  total_price?: number;
  discount_amount?: number;
  shipping_fee?: number;
  status: string;
  payment_status?: string;
  created_at: string;
  code?: string;
  phone?: string | null;
  branch_id?: number | null;
  fulfillment_type?: "pickup" | "delivery" | string | null;
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
  shippingFee?: number;
  paymentStatus?: string;
  status: string;
  createdAt: string;
  code?: string;
  phone?: string | null;
  branchId?: number | null;
  fulfillmentType?: "pickup" | "delivery" | string | null;
  branch?: BranchSummary | null;
  items?: ClientOrderItem[];
  address?: ClientOrderAddress | null;
}
