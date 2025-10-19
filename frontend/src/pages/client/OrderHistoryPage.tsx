import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";

interface Order {
  id: string;
  date: string;
  total: number;
  status: string;
}

const OrderHistoryPage: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    // Gọi API thực tế sau khi backend hoàn thiện, ví dụ:
    // fetch("/api/orders/user")
    //   .then((res) => res.json())
    //   .then((data) => setOrders(data));
    // Tạm thời dùng dữ liệu giả:
    setOrders([
      {
        id: "DH12345",
        date: "2025-10-15",
        total: 350000,
        status: "Đã giao",
      },
      {
        id: "DH12346",
        date: "2025-10-17",
        total: 220000,
        status: "Đang xử lý",
      },
    ]);
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4 py-10">
      <div className="bg-white dark:bg-gray-800 shadow-xl rounded-2xl p-8 w-full max-w-4xl">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6 text-center">
          Lịch sử đơn hàng
        </h2>

        {orders.length === 0 ? (
          <p className="text-center text-gray-600 dark:text-gray-400">
            Bạn chưa có đơn hàng nào.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full border border-gray-200 dark:border-gray-700 rounded-xl">
              <thead>
                <tr className="bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-100 text-sm">
                  <th className="py-3 px-4 text-left">Mã đơn</th>
                  <th className="py-3 px-4 text-left">Ngày đặt</th>
                  <th className="py-3 px-4 text-left">Tổng tiền</th>
                  <th className="py-3 px-4 text-left">Trạng thái</th>
                  <th className="py-3 px-4 text-center">Chi tiết</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr
                    key={order.id}
                    className="border-t border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                  >
                    <td className="py-3 px-4 text-gray-800 dark:text-gray-200 font-medium">
                      {order.id}
                    </td>
                    <td className="py-3 px-4 text-gray-700 dark:text-gray-300">
                      {order.date}
                    </td>
                    <td className="py-3 px-4 text-gray-700 dark:text-gray-300">
                      {order.total.toLocaleString()} đ
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          order.status === "Đã giao"
                            ? "bg-green-100 text-green-700 dark:bg-green-800 dark:text-green-300"
                            : "bg-yellow-100 text-yellow-700 dark:bg-yellow-700 dark:text-yellow-300"
                        }`}
                      >
                        {order.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Link
                        to={`/orders/${order.id}`}
                        className="text-green-600 hover:underline dark:text-green-400"
                      >
                        Xem
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="text-center mt-6">
          <Link
            to="/shop"
            className="inline-block bg-green-600 hover:bg-green-700 text-white py-2 px-6 rounded-xl transition"
          >
            Tiếp tục mua sắm
          </Link>
        </div>
      </div>
    </div>
  );
};

export default OrderHistoryPage;
