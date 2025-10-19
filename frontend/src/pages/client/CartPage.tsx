import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";

interface CartItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
  image: string;
}

const CartPage: React.FC = () => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  // Giả lập dữ liệu giỏ hàng (sau này sẽ thay bằng localStorage hoặc API)
  useEffect(() => {
    setCartItems([
      {
        id: 1,
        name: "Rau cải xanh",
        price: 15000,
        quantity: 2,
        image: "https://i.imgur.com/lhluQd3.jpg",
      },
      {
        id: 2,
        name: "Cà rốt Đà Lạt",
        price: 18000,
        quantity: 1,
        image: "https://i.imgur.com/Lm1gY1v.jpg",
      },
    ]);
  }, []);

  // Tính tổng tiền
  const total = cartItems.reduce(
    (acc, item) => acc + item.price * item.quantity,
    0
  );

  // Hàm tăng/giảm số lượng
  const updateQuantity = (id: number, delta: number) => {
    setCartItems((prev) =>
      prev
        .map((item) =>
          item.id === id
            ? { ...item, quantity: Math.max(1, item.quantity + delta) }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  // Xóa sản phẩm
  const removeItem = (id: number) => {
    setCartItems((prev) => prev.filter((item) => item.id !== id));
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Banner nhỏ */}
      <section className="bg-green-100 py-8 text-center">
        <h1 className="text-3xl font-bold text-green-800">Giỏ hàng của bạn</h1>
        <p className="text-gray-700 mt-2">Kiểm tra sản phẩm trước khi thanh toán nhé!</p>
      </section>

      <div className="container mx-auto px-6 py-10">
        {cartItems.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-600 mb-6">Giỏ hàng của bạn đang trống.</p>
            <Link
              to="/shop"
              className="bg-green-700 text-white px-5 py-3 rounded-lg hover:bg-green-800 transition"
            >
              Mua sắm ngay
            </Link>
          </div>
        ) : (
          <div className="grid md:grid-cols-3 gap-10">
            {/* Bảng sản phẩm */}
            <div className="md:col-span-2">
              <div className="bg-white border rounded-2xl shadow-sm overflow-hidden">
                <table className="w-full">
                  <thead className="bg-green-600 text-white">
                    <tr>
                      <th className="p-4 text-left">Sản phẩm</th>
                      <th className="p-4 text-center">Số lượng</th>
                      <th className="p-4 text-center">Giá</th>
                      <th className="p-4 text-center">Tổng</th>
                      <th className="p-4"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {cartItems.map((item) => (
                      <tr
                        key={item.id}
                        className="border-b hover:bg-green-50 transition"
                      >
                        <td className="p-4 flex items-center gap-3">
                          <img
                            src={item.image}
                            alt={item.name}
                            className="w-16 h-16 rounded-lg object-cover"
                          />
                          <div>
                            <p className="font-medium text-green-800">{item.name}</p>
                            <p className="text-sm text-gray-500">
                              {item.price.toLocaleString()} đ / kg
                            </p>
                          </div>
                        </td>

                        <td className="p-4 text-center">
                          <div className="inline-flex items-center border rounded-lg">
                            <button
                              onClick={() => updateQuantity(item.id, -1)}
                              className="px-3 py-1 text-green-700 hover:bg-green-100"
                            >
                              -
                            </button>
                            <span className="px-3">{item.quantity}</span>
                            <button
                              onClick={() => updateQuantity(item.id, +1)}
                              className="px-3 py-1 text-green-700 hover:bg-green-100"
                            >
                              +
                            </button>
                          </div>
                        </td>

                        <td className="p-4 text-center text-gray-700">
                          {item.price.toLocaleString()} đ
                        </td>

                        <td className="p-4 text-center font-semibold text-green-700">
                          {(item.price * item.quantity).toLocaleString()} đ
                        </td>

                        <td className="p-4 text-center">
                          <button
                            onClick={() => removeItem(item.id)}
                            className="text-red-500 hover:text-red-700"
                          >
                            ✕
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Tổng thanh toán */}
            <div>
              <div className="bg-green-50 border border-green-200 rounded-2xl p-6 shadow-sm">
                <h3 className="text-xl font-semibold text-green-800 mb-4">
                  Thông tin đơn hàng
                </h3>
                <div className="flex justify-between text-gray-700 mb-2">
                  <span>Tạm tính:</span>
                  <span>{total.toLocaleString()} đ</span>
                </div>
                <div className="flex justify-between text-gray-700 mb-2">
                  <span>Phí giao hàng:</span>
                  <span>20.000 đ</span>
                </div>
                <div className="flex justify-between text-green-800 font-semibold text-lg mt-4">
                  <span>Tổng cộng:</span>
                  <span>{(total + 20000).toLocaleString()} đ</span>
                </div>

                <Link
                  to="/checkout"
                  className="block mt-6 w-full bg-green-700 text-white text-center py-3 rounded-lg hover:bg-green-800 transition"
                >
                  Thanh toán ngay →
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CartPage;
