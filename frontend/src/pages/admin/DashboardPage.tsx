import { useAuth } from "../../auth/AuthContext";
import Can from "../../auth/Can";

import {
  getOrdersForMonth,
  getRecentOrders,
} from "../../services/api/dashboardOrdersService";
import { summarizeOrders } from "../../utils/orderSummary";

import OrdersSummaryCards from "../../components/dashboard/OrdersSummaryCards";
import RecentOrders from "../../components/dashboard/RecentOrders";
import { useEffect, useState } from "react";
import type { Order, OrdersSummary } from "../../types/orders";

import { getAllProducts } from "../../services/api/dashboardProductService";
import { summarizeProducts } from "../../utils/productSummary";
import type { ProductSummary } from "../../types/products";

import ProductsOverview from "../../components/dashboard/ProductsOverview";
import UsersOverview from "../../components/dashboard/UsersOverview";

export default function DashboardPage() {
  const { hasPermission } = useAuth();

  const [summary, setSummary] = useState<OrdersSummary | null>(null);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);

  const [productSummary, setProductSummary] = useState<ProductSummary | null>(
    null
  );

  // ===== Products =====
  useEffect(() => {
    if (!hasPermission("product", "view")) return;

    (async () => {
      const products = await getAllProducts();
      setProductSummary(summarizeProducts(products));
    })();
  }, [hasPermission]);

  // ===== Orders =====
  useEffect(() => {
    if (!hasPermission("order", "view")) return;

    (async () => {
      const orders = await getOrdersForMonth();
      setSummary(summarizeOrders(orders));

      const recent = await getRecentOrders();
      setRecentOrders(recent);
    })();
  }, [hasPermission]);

  return (
    <div className="space-y-12">

      {/* ================== ORDERS ================== */}
      <Can module="order" action="view">
        {summary && <OrdersSummaryCards summary={summary} />}
      </Can>

      <Can module="order" action="view">
        {recentOrders.length > 0 && <RecentOrders orders={recentOrders} />}
      </Can>

      <Can module="product" action="view">
        <ProductsOverview />
      </Can>

      {/* ================== USERS (MODULE 5) ================== */}
      <Can module="user" action="view">
        <UsersOverview />
      </Can>

    </div>
  );
}
