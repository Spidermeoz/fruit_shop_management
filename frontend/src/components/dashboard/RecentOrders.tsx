import React from "react";

interface Order {
  id: number;
  user_name: string | null;
  customer?: string;
  code?: string;
  phone?: string;
  final_price?: number;
  total_price?: number;
  status: string;
  payment_status?: string;
  created_at: string;
}

interface RecentOrdersProps {
  orders: Order[];
}

const getStatusBadge = (status: string) => {
  const statusConfig = {
    pending: { color: "bg-yellow-100 text-yellow-800", label: "Chờ xử lý" },
    processing: { color: "bg-blue-100 text-blue-800", label: "Đang xử lý" },
    shipped: { color: "bg-purple-100 text-purple-800", label: "Đang giao" },
    completed: { color: "bg-green-100 text-green-800", label: "Hoàn thành" },
    cancelled: { color: "bg-red-100 text-red-800", label: "Đã hủy" },
  };

  const config = statusConfig[status as keyof typeof statusConfig] || {
    color: "bg-gray-100 text-gray-800",
    label: status,
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}
    >
      {config.label}
    </span>
  );
};

const getPaymentStatusBadge = (status: string) => {
  const statusConfig = {
    paid: { color: "bg-green-100 text-green-800", label: "Đã thanh toán" },
    unpaid: { color: "bg-red-100 text-red-800", label: "Chưa thanh toán" },
  };

  const config = statusConfig[status as keyof typeof statusConfig] || {
    color: "bg-gray-100 text-gray-800",
    label: status,
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}
    >
      {config.label}
    </span>
  );
};

export default function RecentOrders({ orders }: RecentOrdersProps) {
  return (
    <div className="p-4 mt-6 bg-white rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold text-lg text-gray-800">
          Đơn hàng gần đây
        </h3>
        <button className="text-sm text-blue-600 hover:text-blue-800 font-medium">
          Xem tất cả
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="py-3 px-2 text-xs font-medium text-gray-500 uppercase tracking-wider">
                Mã đơn
              </th>
              <th className="py-3 px-2 text-xs font-medium text-gray-500 uppercase tracking-wider">
                Khách hàng
              </th>
              <th className="py-3 px-2 text-xs font-medium text-gray-500 uppercase tracking-wider">
                Số điện thoại
              </th>
              <th className="py-3 px-2 text-xs font-medium text-gray-500 uppercase tracking-wider">
                Giá cuối
              </th>
              <th className="py-3 px-2 text-xs font-medium text-gray-500 uppercase tracking-wider">
                Trạng thái
              </th>
              <th className="py-3 px-2 text-xs font-medium text-gray-500 uppercase tracking-wider">
                Thanh toán
              </th>
              <th className="py-3 px-2 text-xs font-medium text-gray-500 uppercase tracking-wider">
                Ngày tạo
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-200">
            {orders.map((o) => {
              const price = Number(
                o.final_price ?? o.total_price ?? 0
              ).toLocaleString();

              return (
                <tr key={o.id} className="hover:bg-gray-50 transition-colors">
                  <td className="py-3 px-2 text-sm font-medium text-gray-900">
                    {o.code || `#${o.id}`}
                  </td>
                  <td className="py-3 px-2 text-sm text-gray-900">
                    {o.user_name || o.customer || "-"}
                  </td>
                  <td className="py-3 px-2 text-sm text-gray-900">
                    {o.phone || "-"}
                  </td>
                  <td className="py-3 px-2 text-sm font-medium text-gray-900">
                    {price}₫
                  </td>
                  <td className="py-3 px-2">{getStatusBadge(o.status)}</td>
                  <td className="py-3 px-2">
                    {o.payment_status &&
                      getPaymentStatusBadge(o.payment_status)}
                  </td>
                  <td className="py-3 px-2 text-sm text-gray-500">
                    {new Date(o.created_at).toLocaleString("vi-VN")}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
