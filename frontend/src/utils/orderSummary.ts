interface Order {
  final_price?: number;
  discount_amount?: number;
  status: string;
}

export function summarizeOrders(orders: Order[]) {
  const totalOrders = orders.length;

  const totalRevenue = orders.reduce((sum: number, o: Order) => {
    return sum + (o.final_price || 0);
  }, 0);

  const totalDiscount = orders.reduce((sum: number, o: Order) => {
    return sum + (o.discount_amount || 0);
  }, 0);

  const pendingOrders = orders.filter((o: Order) => o.status === "pending").length;

  return {
    totalOrders,
    totalRevenue,
    totalDiscount,
    pendingOrders,
  };
}
