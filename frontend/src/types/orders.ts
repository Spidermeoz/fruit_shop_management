export interface OrdersSummary {
  totalOrders: number;
  totalRevenue: number;
  totalDiscount: number;
  pendingOrders: number;
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
}

export interface OrderAddress {
  full_name?: string | null;
  phone?: string | null;
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
  status: string;
  payment_status?: string;
  created_at: string;
  code?: string;
  phone?: string | null;
  items?: OrderItem[];
  address?: OrderAddress | null;
}

// =========================
// Client normalized types
// =========================
export interface ClientOrderItem {
  id?: number;
  productId?: number | null;
  productVariantId?: number | null;
  quantity: number;
  price: number;
  productTitle?: string | null;
  variantTitle?: string | null;
  variantSku?: string | null;
  thumbnail?: string | null;
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
  items?: ClientOrderItem[];
  address?: ClientOrderAddress | null;
}
