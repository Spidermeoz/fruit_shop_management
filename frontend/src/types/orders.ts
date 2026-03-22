export interface OrdersSummary {
  totalOrders: number;
  totalRevenue: number;
  totalDiscount: number;
  pendingOrders: number;
}

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
