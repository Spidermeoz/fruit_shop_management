import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Layout from "../../../components/client/layout/Layout";
import { useCart } from "../../../context/CartContext";

const CartPage: React.FC = () => {
  const { items, fetchCart, updateItem, removeItem, clearCart } = useCart();
  const navigate = useNavigate();

  // Danh sách sản phẩm được chọn
  const [selectedItems, setSelectedItems] = useState<number[]>([]);

  useEffect(() => {
    fetchCart();
  }, []);

  // Toggle chọn sản phẩm
  const toggleSelect = (productId: number) => {
    setSelectedItems((prev) =>
      prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId]
    );
  };

  // NEW: Tính subtotal theo selected items
  const selectedProducts = items.filter((item) =>
    selectedItems.includes(item.productId)
  );

  const subtotal = selectedProducts.reduce(
    (acc, item) => acc + (item.product?.price || 0) * item.quantity,
    0
  );

  const shippingFee = selectedItems.length > 0 ? 20000 : 0;
  const total = subtotal + shippingFee;

  // Tăng/giảm số lượng
  const handleUpdateQty = (productId: number, delta: number) => {
    const item = items.find((i) => i.productId === productId);
    if (!item) return;
    const newQty = Math.max(1, item.quantity + delta);
    updateItem(productId, newQty);
  };

  // Xóa sản phẩm
  const handleRemove = (productId: number) => {
    removeItem(productId);
    setSelectedItems((prev) => prev.filter((id) => id !== productId));
  };

  // Điều hướng checkout
  const handleCheckout = () => {
    if (selectedItems.length === 0) {
      alert("Vui lòng chọn ít nhất một sản phẩm trước khi thanh toán.");
      return;
    }
    navigate("/checkout", { state: { selectedItems } });
  };

  return (
    <Layout>
      {/* Header nhỏ */}
      <section className="bg-gradient-to-r from-green-100 to-yellow-100 py-8 text-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-4 left-10 w-16 h-16 bg-yellow-300 rounded-full animate-pulse"></div>
          <div className="absolute bottom-4 right-10 w-12 h-12 bg-green-400 rounded-full animate-pulse"></div>
        </div>
        <div className="relative z-10">
          <h1 className="text-4xl font-bold text-green-800 mb-2">
            Giỏ hàng của bạn
          </h1>
          <p className="text-gray-700">
            Kiểm tra sản phẩm trước khi thanh toán nhé!
          </p>
        </div>
      </section>

      <div className="container mx-auto px-6 py-10">
        {items.length === 0 ? (
          <div className="text-center py-20">
            <div className="mb-6">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-24 w-24 mx-auto text-green-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1}
                  d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                />
              </svg>
            </div>
            <h2 className="text-2xl text-gray-700 mb-4">
              Giỏ hàng của bạn đang trống
            </h2>
            <Link
              to="/products"
              className="inline-block bg-gradient-to-r from-green-600 to-green-700 text-white px-8 py-3 rounded-lg font-medium hover:shadow-lg transform hover:scale-105 transition-all duration-300"
            >
              Mua sắm ngay
            </Link>
          </div>
        ) : (
          <div className="grid md:grid-cols-3 gap-10">
            {/* DANH SÁCH SẢN PHẨM */}
            <div className="md:col-span-2">
              <div className="bg-white rounded-2xl shadow-md overflow-hidden">
                <div className="bg-gradient-to-r from-green-600 to-green-700 text-white p-4">
                  <h2 className="text-xl font-semibold">
                    Sản phẩm trong giỏ hàng ({items.length})
                  </h2>
                </div>

                <div className="p-4">
                  {items.map((item, index) => (
                    <div
                      key={item.id}
                      className={`flex flex-col md:flex-row items-center gap-4 p-4 ${
                        index !== items.length - 1 ? "border-b" : ""
                      } hover:bg-green-50 transition rounded-lg`}
                    >
                      {/* Checkbox chọn */}
                      <input
                        type="checkbox"
                        checked={selectedItems.includes(item.productId)}
                        onChange={() => toggleSelect(item.productId)}
                        className="w-5 h-5 accent-green-600"
                      />

                      <img
                        src={item.product?.thumbnail || ""}
                        alt={item.product?.title}
                        className="w-24 h-24 rounded-lg object-cover"
                      />

                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-green-800">
                          {item.product?.title}
                        </h3>
                        <p className="text-green-700 font-medium mt-1">
                          {(item.product?.price || 0).toLocaleString()} đ / kg
                        </p>
                      </div>

                      {/* Nút tăng giảm */}
                      <div className="flex items-center gap-2">
                        <div className="inline-flex items-center border border-gray-300 rounded-lg">
                          <button
                            onClick={() => handleUpdateQty(item.productId, -1)}
                            className="px-3 py-2 text-green-700 hover:bg-green-100 transition"
                          >
                            -
                          </button>
                          <span className="px-3 py-2 border-l border-r border-gray-300">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => handleUpdateQty(item.productId, 1)}
                            className="px-3 py-2 text-green-700 hover:bg-green-100 transition"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      {/* Giá & Xóa */}
                      <div className="text-right">
                        <p className="font-semibold text-green-700 text-lg">
                          {(
                            (item.product?.price || 0) * item.quantity
                          ).toLocaleString()}{" "}
                          đ
                        </p>

                        <button
                          onClick={() => handleRemove(item.productId)}
                          className="text-red-500 hover:text-red-700 mt-2 transition"
                        >
                          🗑 Xoá
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Clear all */}
                <div className="p-4 bg-gray-50 flex flex-col sm:flex-row justify-between items-center gap-4">
                  <Link
                    to="/products"
                    className="flex items-center text-green-700 hover:text-green-800 transition"
                  >
                    ← Tiếp tục mua sắm
                  </Link>

                  <button
                    onClick={clearCart}
                    className="text-red-500 hover:text-red-700 transition"
                  >
                    Xóa tất cả sản phẩm
                  </button>
                </div>
              </div>
            </div>

            {/* TỔNG THANH TOÁN (cập nhật theo selected items) */}
            <div>
              <div className="bg-gradient-to-br from-green-50 to-yellow-50 rounded-2xl p-6 shadow-md sticky top-6">
                <h3 className="text-xl font-semibold text-green-800 mb-4">
                  Thông tin đơn hàng
                </h3>

                {selectedItems.length === 0 ? (
                  <p className="text-gray-600 mb-4 text-sm">
                    Vui lòng chọn sản phẩm để xem tổng tiền.
                  </p>
                ) : (
                  <div className="space-y-3 mb-6">
                    <div className="flex justify-between text-gray-700">
                      <span>Tạm tính:</span>
                      <span>{subtotal.toLocaleString()} đ</span>
                    </div>

                    <div className="flex justify-between text-gray-700">
                      <span>Phí giao hàng:</span>
                      <span>{shippingFee.toLocaleString()} đ</span>
                    </div>

                    <div className="border-t pt-3">
                      <div className="flex justify-between text-green-800 font-bold text-lg">
                        <span>Tổng cộng:</span>
                        <span>{total.toLocaleString()} đ</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Nút checkout */}
                <button
                  onClick={handleCheckout}
                  className={`block w-full text-center py-3 rounded-lg font-medium transition-all duration-200
                    ${
                      selectedItems.length === 0
                        ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                        : "bg-gradient-to-r from-green-600 to-green-700 text-white hover:shadow-lg"
                    }`}
                >
                  Thanh toán ngay{" "}
                  {selectedItems.length > 0
                    ? `(${selectedItems.length} sản phẩm)`
                    : ""}
                  →
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default CartPage;
