export interface OrdersSummary {
  totalOrders: number;
  totalRevenue: number;
  totalDiscount: number;
  pendingOrders: number;
}

export interface Order {
  id: number;
  user_name: string | null;
  final_price: number;
  status: string;
  created_at: string;
}
