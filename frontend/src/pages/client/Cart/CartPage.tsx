import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Layout from "../../../components/client/layout/Layout";

interface CartItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
  image: string;
  category: string;
  origin: string;
}

const CartPage: React.FC = () => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [promoCode, setPromoCode] = useState("");
  const [discount, setDiscount] = useState(0);
  const [isApplyingPromo, setIsApplyingPromo] = useState(false);

  // Giả lập dữ liệu giỏ hàng (sau này sẽ thay bằng localStorage hoặc API)
  useEffect(() => {
    setCartItems([
      {
        id: 1,
        name: "Táo Envy Mỹ",
        price: 250000,
        quantity: 2,
        image: "https://i.imgur.com/k2P1k5M.jpg",
        category: "Trái cây nhập khẩu",
        origin: "Mỹ"
      },
      {
        id: 2,
        name: "Cam Úc",
        price: 180000,
        quantity: 1,
        image: "https://i.imgur.com/8Jk3l7n.jpg",
        category: "Trái cây nhập khẩu",
        origin: "Úc"
      },
      {
        id: 3,
        name: "Cherry Mỹ",
        price: 550000,
        quantity: 1,
        image: "https://i.imgur.com/5Hd9p2q.jpg",
        category: "Trái cây nhập khẩu",
        origin: "Mỹ"
      },
    ]);
  }, []);

  // Tính tổng tiền
  const subtotal = cartItems.reduce(
    (acc, item) => acc + item.price * item.quantity,
    0
  );
  const shippingFee = 20000;
  const total = subtotal + shippingFee - discount;

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

  // Áp dụng mã giảm giá
  const applyPromoCode = () => {
    setIsApplyingPromo(true);
    setTimeout(() => {
      if (promoCode === "FRESH10") {
        setDiscount(subtotal * 0.1);
        alert("Áp dụng mã giảm giá thành công! Giảm 10%");
      } else if (promoCode === "FRESH20") {
        setDiscount(subtotal * 0.2);
        alert("Áp dụng mã giảm giá thành công! Giảm 20%");
      } else {
        alert("Mã giảm giá không hợp lệ");
        setDiscount(0);
      }
      setIsApplyingPromo(false);
    }, 1000);
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
          <h1 className="text-4xl font-bold text-green-800 mb-2">Giỏ hàng của bạn</h1>
          <p className="text-gray-700">Kiểm tra sản phẩm trước khi thanh toán nhé!</p>
          <div className="flex items-center justify-center text-gray-600 mt-2">
            <Link to="/" className="hover:text-green-600 transition">Trang chủ</Link>
            <span className="mx-2">/</span>
            <span className="text-green-700">Giỏ hàng</span>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-6 py-10">
        {cartItems.length === 0 ? (
          <div className="text-center py-20">
            <div className="mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-24 w-24 mx-auto text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </div>
            <h2 className="text-2xl text-gray-700 mb-4">Giỏ hàng của bạn đang trống</h2>
            <p className="text-gray-600 mb-6">Hãy thêm một vài sản phẩm tươi ngon vào giỏ hàng nhé!</p>
            <Link
              to="/product"
              className="inline-block bg-gradient-to-r from-green-600 to-green-700 text-white px-8 py-3 rounded-lg font-medium hover:shadow-lg transform hover:scale-105 transition-all duration-300"
            >
              Mua sắm ngay
            </Link>
          </div>
        ) : (
          <div className="grid md:grid-cols-3 gap-10">
            {/* Bảng sản phẩm */}
            <div className="md:col-span-2">
              <div className="bg-white rounded-2xl shadow-md overflow-hidden">
                <div className="bg-gradient-to-r from-green-600 to-green-700 text-white p-4">
                  <h2 className="text-xl font-semibold">Sản phẩm trong giỏ hàng ({cartItems.length})</h2>
                </div>
                
                <div className="p-4">
                  {cartItems.map((item, index) => (
                    <div
                      key={item.id}
                      className={`flex flex-col md:flex-row items-center gap-4 p-4 ${index !== cartItems.length - 1 ? 'border-b' : ''} hover:bg-green-50 transition rounded-lg`}
                    >
                      <div className="w-full md:w-auto">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-24 h-24 rounded-lg object-cover"
                        />
                      </div>
                      
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-green-800">{item.name}</h3>
                        <p className="text-sm text-gray-500">{item.category}</p>
                        <p className="text-sm text-gray-500">Xuất xứ: {item.origin}</p>
                        <p className="text-green-700 font-medium mt-1">
                          {item.price.toLocaleString()} đ / kg
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="inline-flex items-center border border-gray-300 rounded-lg">
                          <button
                            onClick={() => updateQuantity(item.id, -1)}
                            className="px-3 py-2 text-green-700 hover:bg-green-100 transition"
                          >
                            -
                          </button>
                          <span className="px-3 py-2 border-l border-r border-gray-300">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.id, +1)}
                            className="px-3 py-2 text-green-700 hover:bg-green-100 transition"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      <div className="text-right">
                        <p className="font-semibold text-green-700 text-lg">
                          {(item.price * item.quantity).toLocaleString()} đ
                        </p>
                        <button
                          onClick={() => removeItem(item.id)}
                          className="text-red-500 hover:text-red-700 mt-2 transition"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="p-4 bg-gray-50 flex flex-col sm:flex-row justify-between items-center gap-4">
                  <Link
                    to="/product"
                    className="flex items-center text-green-700 hover:text-green-800 transition"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    Tiếp tục mua sắm
                  </Link>
                  
                  <button
                    onClick={() => setCartItems([])}
                    className="text-red-500 hover:text-red-700 transition"
                  >
                    Xóa tất cả sản phẩm
                  </button>
                </div>
              </div>
            </div>

            {/* Tổng thanh toán */}
            <div>
              <div className="bg-gradient-to-br from-green-50 to-yellow-50 rounded-2xl p-6 shadow-md sticky top-6">
                <h3 className="text-xl font-semibold text-green-800 mb-4">
                  Thông tin đơn hàng
                </h3>
                
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between text-gray-700">
                    <span>Tạm tính:</span>
                    <span>{subtotal.toLocaleString()} đ</span>
                  </div>
                  <div className="flex justify-between text-gray-700">
                    <span>Phí giao hàng:</span>
                    <span>{shippingFee.toLocaleString()} đ</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Giảm giá:</span>
                      <span>-{discount.toLocaleString()} đ</span>
                    </div>
                  )}
                  <div className="border-t pt-3">
                    <div className="flex justify-between text-green-800 font-bold text-lg">
                      <span>Tổng cộng:</span>
                      <span>{total.toLocaleString()} đ</span>
                    </div>
                  </div>
                </div>

                {/* Mã giảm giá */}
                <div className="mb-6">
                  <label className="block text-gray-700 text-sm font-medium mb-2">
                    Mã giảm giá
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={promoCode}
                      onChange={(e) => setPromoCode(e.target.value)}
                      placeholder="Nhập mã giảm giá"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                    <button
                      onClick={applyPromoCode}
                      disabled={isApplyingPromo}
                      className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition disabled:opacity-50"
                    >
                      {isApplyingPromo ? "..." : "Áp dụng"}
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Thử: FRESH10 hoặc FRESH20</p>
                </div>

                <Link
                  to="/checkout"
                  className="block w-full bg-gradient-to-r from-green-600 to-green-700 text-white text-center py-3 rounded-lg font-medium hover:shadow-lg transform hover:scale-105 transition-all duration-300"
                >
                  Thanh toán ngay →
                </Link>
                
                <div className="mt-4 text-center">
                  <p className="text-sm text-gray-600">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 inline mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                    Bảo mật thanh toán
                  </p>
                </div>
              </div>
              
              {/* Thông tin vận chuyển */}
              <div className="bg-white rounded-2xl p-6 shadow-md mt-6">
                <h3 className="text-lg font-semibold text-green-800 mb-4">
                  Thông tin vận chuyển
                </h3>
                <div className="space-y-3">
                  <div className="flex items-start">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-600 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <div>
                      <p className="font-medium text-gray-800">Giao hàng tận nơi</p>
                      <p className="text-sm text-gray-600">Miễn phí vận chuyển cho đơn hàng từ 500.000đ</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-600 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                      <p className="font-medium text-gray-800">Giao hàng nhanh</p>
                      <p className="text-sm text-gray-600">Nhận hàng trong vòng 2-3 ngày làm việc</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-600 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                      <p className="font-medium text-gray-800">Đảm bảo chất lượng</p>
                      <p className="text-sm text-gray-600">Hoàn tiền nếu sản phẩm không đạt chất lượng</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default CartPage;