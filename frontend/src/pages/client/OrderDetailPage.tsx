import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

interface OrderItem {
  id: number;
  name: string;
  image: string;
  price: number;
  quantity: number;
}

interface OrderDetail {
  id: string;
  date: string;
  status: string;
  total: number;
  customer: {
    name: string;
    phone: string;
    address: string;
  };
  items: OrderItem[];
}

const OrderDetailPage: React.FC = () => {
  const { id } = useParams();
  const [order, setOrder] = useState<OrderDetail | null>(null);

  useEffect(() => {
    // Gọi API thực tế khi backend sẵn sàng, ví dụ:
    // fetch(`/api/orders/${id}`)
    //   .then((res) => res.json())
    //   .then((data) => setOrder(data));
    // Tạm thời dùng dữ liệu giả:
    setOrder({
      id: id || "DH12345",
      date: "2025-10-15",
      status: "Đã giao",
      total: 350000,
      customer: {
        name: "Nguyễn Văn Test",
        phone: "1234567890",
        address: "123 Nguyễn Trãi, Hà Nội",
      },
      items: [
        {
          id: 1,
          name: "Cà chua bi Đà Lạt",
          image: "https://cdn.tgdd.vn/Products/Images/8783/260320/bhx/ca-chua-bi-do-tui-500g-202205041141292753.jpg",
          price: 45000,
          quantity: 2,
        },
        {
          id: 2,
          name: "Rau cải xanh",
          image: "https://cdn.tgdd.vn/Products/Images/8783/260329/bhx/rau-cai-xanh-tui-500g-202205041142002433.jpg",
          price: 30000,
          quantity: 3,
        },
      ],
    });
  }, [id]);

  if (!order)
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-600 dark:text-gray-300">
        Đang tải dữ liệu đơn hàng...
      </div>
    );

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4 py-10">
      <div className="bg-white dark:bg-gray-800 shadow-xl rounded-2xl p-8 w-full max-w-4xl">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6 text-center">
          Chi tiết đơn hàng #{order.id}
        </h2>

        {/* Thông tin đơn hàng */}
        <div className="mb-6 space-y-2 text-gray-700 dark:text-gray-300">
          <p>
            <span className="font-semibold">Ngày đặt:</span> {order.date}
          </p>
          <p>
            <span className="font-semibold">Trạng thái:</span>{" "}
            <span
              className={`px-3 py-1 rounded-full text-xs font-semibold ${
                order.status === "Đã giao"
                  ? "bg-green-100 text-green-700 dark:bg-green-800 dark:text-green-300"
                  : "bg-yellow-100 text-yellow-700 dark:bg-yellow-700 dark:text-yellow-300"
              }`}
            >
              {order.status}
            </span>
          </p>
          <p>
            <span className="font-semibold">Tổng tiền:</span>{" "}
            {order.total.toLocaleString()} đ
          </p>
        </div>

        {/* Thông tin khách hàng */}
        <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mb-6">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">
            Thông tin giao hàng
          </h3>
          <p className="text-gray-700 dark:text-gray-300">
            <span className="font-semibold">Người nhận:</span>{" "}
            {order.customer.name}
          </p>
          <p className="text-gray-700 dark:text-gray-300">
            <span className="font-semibold">Số điện thoại:</span>{" "}
            {order.customer.phone}
          </p>
          <p className="text-gray-700 dark:text-gray-300">
            <span className="font-semibold">Địa chỉ:</span>{" "}
            {order.customer.address}
          </p>
        </div>

        {/* Danh sách sản phẩm */}
        <div className="overflow-x-auto border-t border-gray-200 dark:border-gray-700 pt-4">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-3">
            Sản phẩm trong đơn hàng
          </h3>
          <table className="min-w-full border border-gray-200 dark:border-gray-700 rounded-xl">
            <thead>
              <tr className="bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-100 text-sm">
                <th className="py-3 px-4 text-left">Sản phẩm</th>
                <th className="py-3 px-4 text-left">Số lượng</th>
                <th className="py-3 px-4 text-left">Đơn giá</th>
                <th className="py-3 px-4 text-left">Thành tiền</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((item) => (
                <tr
                  key={item.id}
                  className="border-t border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                >
                  <td className="py-3 px-4 flex items-center space-x-3">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-12 h-12 rounded-lg object-cover"
                    />
                    <span className="text-gray-800 dark:text-gray-200">
                      {item.name}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-gray-700 dark:text-gray-300">
                    {item.quantity}
                  </td>
                  <td className="py-3 px-4 text-gray-700 dark:text-gray-300">
                    {item.price.toLocaleString()} đ
                  </td>
                  <td className="py-3 px-4 text-gray-700 dark:text-gray-300">
                    {(item.price * item.quantity).toLocaleString()} đ
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Nút quay lại */}
        <div className="text-center mt-8">
          <Link
            to="/orders"
            className="inline-block bg-green-600 hover:bg-green-700 text-white py-2 px-6 rounded-xl transition"
          >
            ← Quay lại lịch sử đơn hàng
          </Link>
        </div>
      </div>
    </div>
  );
};

export default OrderDetailPage;
