import React, { useEffect, useMemo, useState } from "react";
import {
  ShoppingCart,
  DollarSign,
  Users,
  Package,
  Loader2,
  GitBranch,
  Truck,
  Store,
} from "lucide-react";
import Card from "../../components/admin/layouts/Card";
import { http } from "../../services/http";
import { useAuth } from "../../auth/AuthContext";

type DashboardOrder = {
  id: number;
  code: string;
  status: string;
  paymentStatus?: string;
  finalPrice: number;
  createdAt: string;
  branch?: { id: number; name: string; code?: string | null } | null;
  fulfillmentType?: "pickup" | "delivery";
  address?: { fullName?: string | null } | null;
};

const SummaryCard: React.FC<{
  title: string;
  value: string;
  icon: React.ReactNode;
  sub?: string;
}> = ({ title, value, icon, sub }) => (
  <Card>
    <div className="p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400">{title}</p>
          <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">
            {value}
          </p>
          {sub && (
            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              {sub}
            </p>
          )}
        </div>
        <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400">
          {icon}
        </div>
      </div>
    </div>
  </Card>
);

const DashboardPage: React.FC = () => {
  const { branches, currentBranchId, currentBranch } = useAuth();

  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<DashboardOrder[]>([]);
  const [recentOrders, setRecentOrders] = useState<DashboardOrder[]>([]);
  const [usersCount, setUsersCount] = useState<number>(0);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      let ordersUrl = "/api/v1/admin/orders?page=1&limit=100";
      if (currentBranchId) {
        ordersUrl += `&branchId=${currentBranchId}`;
      }

      const [ordersRes, usersRes] = await Promise.all([
        http<any>("GET", ordersUrl),
        http<any>("GET", "/api/v1/admin/users?page=1&limit=1"),
      ]);

      const orderRows: DashboardOrder[] = Array.isArray(ordersRes?.data)
        ? ordersRes.data.map((x: any) => x?.props ?? x)
        : [];

      setOrders(orderRows);
      setRecentOrders(orderRows.slice(0, 5));
      setUsersCount(Number(usersRes?.meta?.total ?? 0));
    } catch (err) {
      console.error("Dashboard fetch error:", err);
      setOrders([]);
      setRecentOrders([]);
      setUsersCount(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [currentBranchId]);

  const stats = useMemo(() => {
    const totalOrders = orders.length;
    const revenue = orders
      .filter((o) => o.paymentStatus === "paid")
      .reduce((sum, o) => sum + Number(o.finalPrice ?? 0), 0);

    const pickupCount = orders.filter(
      (o) => o.fulfillmentType === "pickup",
    ).length;
    const deliveryCount = orders.filter(
      (o) => o.fulfillmentType !== "pickup",
    ).length;

    const processingCount = orders.filter((o) =>
      ["pending", "processing", "shipping"].includes(String(o.status)),
    ).length;

    return {
      totalOrders,
      revenue,
      pickupCount,
      deliveryCount,
      processingCount,
    };
  }, [orders]);

  const branchLabel = useMemo(() => {
    if (currentBranch)
      return currentBranch.name || `Branch #${currentBranch.id}`;
    if (branches.length > 1) return "Tất cả chi nhánh được gán";
    return branches[0]?.name || "Chi nhánh hiện tại";
  }, [branches, currentBranch]);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
          Dashboard
        </h1>
        <div className="mt-2 inline-flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
          <GitBranch className="w-4 h-4" />
          <span>{branchLabel}</span>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-gray-500 dark:text-gray-400" />
          <span className="ml-2 text-gray-600 dark:text-gray-400">
            Đang tải dashboard...
          </span>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
            <SummaryCard
              title="Tổng đơn hàng"
              value={stats.totalOrders.toLocaleString()}
              icon={<ShoppingCart className="w-6 h-6" />}
              sub="Theo branch hiện tại"
            />
            <SummaryCard
              title="Doanh thu đã thu"
              value={`${stats.revenue.toLocaleString()} đ`}
              icon={<DollarSign className="w-6 h-6" />}
              sub="Chỉ tính đơn đã thanh toán"
            />
            <SummaryCard
              title="Người dùng"
              value={usersCount.toLocaleString()}
              icon={<Users className="w-6 h-6" />}
              sub="Toàn hệ thống"
            />
            <SummaryCard
              title="Đơn đang xử lý"
              value={stats.processingCount.toLocaleString()}
              icon={<Package className="w-6 h-6" />}
              sub="Pending / Processing / Shipping"
            />
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-6">
            <Card>
              <div className="p-5">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Fulfillment theo branch
                </h2>

                <div className="space-y-4">
                  <div className="flex items-center justify-between rounded-lg bg-blue-50 dark:bg-blue-900/20 p-4">
                    <div className="flex items-center gap-3">
                      <Store className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      <span className="text-gray-800 dark:text-gray-200">
                        Pickup
                      </span>
                    </div>
                    <span className="font-bold text-blue-700 dark:text-blue-300">
                      {stats.pickupCount}
                    </span>
                  </div>

                  <div className="flex items-center justify-between rounded-lg bg-purple-50 dark:bg-purple-900/20 p-4">
                    <div className="flex items-center gap-3">
                      <Truck className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                      <span className="text-gray-800 dark:text-gray-200">
                        Delivery
                      </span>
                    </div>
                    <span className="font-bold text-purple-700 dark:text-purple-300">
                      {stats.deliveryCount}
                    </span>
                  </div>
                </div>
              </div>
            </Card>

            <div className="xl:col-span-2">
              <Card>
                <div className="p-5">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Đơn hàng gần đây
                  </h2>

                  {recentOrders.length === 0 ? (
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Chưa có đơn hàng.
                    </p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-800">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">
                              Mã đơn
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">
                              Khách hàng
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">
                              Chi nhánh
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">
                              Giá trị
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">
                              Trạng thái
                            </th>
                          </tr>
                        </thead>

                        <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                          {recentOrders.map((order) => (
                            <tr
                              key={order.id}
                              className="hover:bg-gray-50 dark:hover:bg-gray-800"
                            >
                              <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                                {order.code}
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                                {order.address?.fullName || "—"}
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                                {order.branch?.name || "—"}
                              </td>
                              <td className="px-4 py-3 text-sm font-semibold text-green-700 dark:text-green-400">
                                {Number(order.finalPrice || 0).toLocaleString()}{" "}
                                đ
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                                {order.status}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </Card>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default DashboardPage;
