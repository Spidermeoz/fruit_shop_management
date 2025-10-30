import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Layout from "../../../components/client/layout/Layout";

interface OrderItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
  image: string;
}

interface Order {
  id: string;
  date: string;
  total: number;
  status: "pending" | "processing" | "shipping" | "delivered" | "cancelled";
  items: OrderItem[];
  shippingAddress: string;
  paymentMethod: string;
}

const OrderHistoryPage: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filterStatus, setFilterStatus] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);

  useEffect(() => {
    // Giả lập tải dữ liệu
    setTimeout(() => {
      setOrders([
        {
          id: "DH12345",
          date: "2025-08-10",
          total: 730000,
          status: "delivered",
          items: [
            {
              id: 1,
              name: "Táo Envy Mỹ",
              price: 250000,
              quantity: 2,
              image: "https://i.imgur.com/k2P1k5M.jpg"
            },
            {
              id: 2,
              name: "Cam Úc",
              price: 180000,
              quantity: 1,
              image: "https://i.imgur.com/8Jk3l7n.jpg"
            },
            {
              id: 3,
              name: "Cherry Mỹ",
              price: 550000,
              quantity: 1,
              image: "https://i.imgur.com/5Hd9p2q.jpg"
            }
          ],
          shippingAddress: "123 Đường Trái Cây, Quận 1, TP.HCM",
          paymentMethod: "cod"
        },
        {
          id: "DH12346",
          date: "2025-08-12",
          total: 450000,
          status: "shipping",
          items: [
            {
              id: 4,
              name: "Nho Úc",
              price: 320000,
              quantity: 1,
              image: "https://i.imgur.com/7Mj4k9l.jpg"
            },
            {
              id: 5,
              name: "Dâu Hàn Quốc",
              price: 450000,
              quantity: 1,
              image: "https://i.imgur.com/3Kd8p5m.jpg"
            }
          ],
          shippingAddress: "456 Đường Cây Xanh, Quận 3, TP.HCM",
          paymentMethod: "bank"
        },
        {
          id: "DH12347",
          date: "2025-08-13",
          total: 280000,
          status: "processing",
          items: [
            {
              id: 6,
              name: "Xoài Cát Hòa Lộc",
              price: 120000,
              quantity: 2,
              image: "https://i.imgur.com/9Ld7k3j.jpg"
            },
            {
              id: 7,
              name: "Lê Hàn Quốc",
              price: 280000,
              quantity: 1,
              image: "https://i.imgur.com/2Kd6p4n.jpg"
            }
          ],
          shippingAddress: "789 Đường Nông Sản, Quận 7, TP.HCM",
          paymentMethod: "momo"
        },
        {
          id: "DH12348",
          date: "2025-08-14",
          total: 550000,
          status: "pending",
          items: [
            {
              id: 8,
              name: "Kiwi New Zealand",
              price: 200000,
              quantity: 2,
              image: "https://i.imgur.com/5Jd9p8k.jpg"
            },
            {
              id: 9,
              name: "Bưởi Da Xanh",
              price: 90000,
              quantity: 1,
              image: "https://i.imgur.com/6Ld9k2j.jpg"
            },
            {
              id: 10,
              name: "Thanh Long Ruột Đỏ",
              price: 110000,
              quantity: 1,
              image: "https://i.imgur.com/3Kd8p5m.jpg"
            }
          ],
          shippingAddress: "321 Đường Hoa Quả, Quận Bình Thạnh, TP.HCM",
          paymentMethod: "cod"
        }
      ]);
      setIsLoading(false);
    }, 1000);
  }, []);

  // Lọc đơn hàng theo trạng thái
  const filteredOrders = filterStatus === "all" 
    ? orders 
    : orders.filter(order => order.status === filterStatus);

  // Định dạng trạng thái đơn hàng
  const getStatusInfo = (status: string) => {
    switch (status) {
      case "pending":
        return {
          text: "Chờ xác nhận",
          bgColor: "bg-yellow-100",
          textColor: "text-yellow-700",
          icon: (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )
        };
      case "processing":
        return {
          text: "Đang xử lý",
          bgColor: "bg-blue-100",
          textColor: "text-blue-700",
          icon: (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          )
        };
      case "shipping":
        return {
          text: "Đang giao hàng",
          bgColor: "bg-purple-100",
          textColor: "text-purple-700",
          icon: (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
            </svg>
          )
        };
      case "delivered":
        return {
          text: "Đã giao hàng",
          bgColor: "bg-green-100",
          textColor: "text-green-700",
          icon: (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )
        };
      case "cancelled":
        return {
          text: "Đã hủy",
          bgColor: "bg-red-100",
          textColor: "text-red-700",
          icon: (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )
        };
      default:
        return {
          text: "Không xác định",
          bgColor: "bg-gray-100",
          textColor: "text-gray-700",
          icon: null
        };
    }
  };

  // Định dạng phương thức thanh toán
  const getPaymentMethod = (method: string) => {
    switch (method) {
      case "cod":
        return "Thanh toán khi nhận hàng";
      case "bank":
        return "Chuyển khoản ngân hàng";
      case "momo":
        return "Ví MoMo";
      default:
        return "Không xác định";
    }
  };

  // Toggle chi tiết đơn hàng
  const toggleOrderDetails = (orderId: string) => {
    setExpandedOrder(expandedOrder === orderId ? null : orderId);
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
          <h1 className="text-4xl font-bold text-green-800 mb-2">Lịch sử đơn hàng</h1>
          <p className="text-gray-700">Xem lại các đơn hàng đã đặt của bạn</p>
          <div className="flex items-center justify-center text-gray-600 mt-2">
            <Link to="/" className="hover:text-green-600 transition">Trang chủ</Link>
            <span className="mx-2">/</span>
            <span className="text-green-700">Lịch sử đơn hàng</span>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-6 py-10">
        {/* Bộ lọc */}
        <div className="bg-white rounded-2xl shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold text-green-800 mb-4">Bộ lọc đơn hàng</h2>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setFilterStatus("all")}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                filterStatus === "all"
                  ? "bg-green-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Tất cả ({orders.length})
            </button>
            <button
              onClick={() => setFilterStatus("pending")}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                filterStatus === "pending"
                  ? "bg-green-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Chờ xác nhận ({orders.filter(o => o.status === "pending").length})
            </button>
            <button
              onClick={() => setFilterStatus("processing")}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                filterStatus === "processing"
                  ? "bg-green-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Đang xử lý ({orders.filter(o => o.status === "processing").length})
            </button>
            <button
              onClick={() => setFilterStatus("shipping")}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                filterStatus === "shipping"
                  ? "bg-green-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Đang giao hàng ({orders.filter(o => o.status === "shipping").length})
            </button>
            <button
              onClick={() => setFilterStatus("delivered")}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                filterStatus === "delivered"
                  ? "bg-green-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Đã giao hàng ({orders.filter(o => o.status === "delivered").length})
            </button>
          </div>
        </div>

        {/* Loading state */}
        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
          </div>
        ) : (
          <>
            {/* Danh sách đơn hàng */}
            {filteredOrders.length === 0 ? (
              <div className="text-center py-20">
                <div className="mb-6">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-24 w-24 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <h2 className="text-2xl text-gray-700 mb-4">Không có đơn hàng nào</h2>
                <p className="text-gray-600 mb-6">Bạn chưa có đơn hàng nào trong danh mục này.</p>
                <Link
                  to="/product"
                  className="inline-block bg-gradient-to-r from-green-600 to-green-700 text-white px-8 py-3 rounded-lg font-medium hover:shadow-lg transform hover:scale-105 transition-all duration-300"
                >
                  Mua sắm ngay
                </Link>
              </div>
            ) : (
              <div className="space-y-6">
                {filteredOrders.map((order) => {
                  const statusInfo = getStatusInfo(order.status);
                  const isExpanded = expandedOrder === order.id;
                  
                  return (
                    <div key={order.id} className="bg-white rounded-2xl shadow-md overflow-hidden">
                      {/* Header đơn hàng */}
                      <div className="p-6 border-b">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div>
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="text-xl font-semibold text-green-800">Đơn hàng #{order.id}</h3>
                              <span className={`${statusInfo.bgColor} ${statusInfo.textColor} px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1`}>
                                {statusInfo.icon}
                                {statusInfo.text}
                              </span>
                            </div>
                            <p className="text-gray-600">Ngày đặt: {order.date}</p>
                            
                          </div>
                          <div className="text-right">
                            <p className="text-gray-600 mb-1">Tổng tiền:</p>
                            <p className="text-2xl font-bold text-green-700">{order.total.toLocaleString()} đ</p>
                          </div>
                        </div>
                      </div>

                      {/* Nội dung đơn hàng */}
                      <div className="p-6">
                        <div className="flex flex-col md:flex-row gap-6">
                          {/* Danh sách sản phẩm */}
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-800 mb-3">Sản phẩm ({order.items.length})</h4>
                            <div className="space-y-3">
                              {order.items.map((item) => (
                                <div key={item.id} className="flex items-center gap-3">
                                  <img
                                    src={item.image}
                                    alt={item.name}
                                    className="w-16 h-16 rounded-lg object-cover"
                                  />
                                  <div className="flex-1">
                                    <h5 className="font-medium text-gray-800">{item.name}</h5>
                                    <p className="text-sm text-gray-600">Số lượng: {item.quantity}</p>
                                  </div>
                                  <p className="font-medium text-green-700">
                                    {(item.price * item.quantity).toLocaleString()} đ
                                  </p>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Thông tin giao hàng */}
                          <div className="md:w-1/3">
                            <h4 className="font-medium text-gray-800 mb-3">Thông tin giao hàng</h4>
                            <div className="space-y-2 text-sm">
                              <div className="flex items-start">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                <span className="text-gray-600">{order.shippingAddress}</span>
                              </div>
                              <div className="flex items-start">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                                </svg>
                                <span className="text-gray-600">{getPaymentMethod(order.paymentMethod)}</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Nút hành động */}
                        <div className="flex justify-between items-center mt-6 pt-6 border-t">
                          <button
                            onClick={() => toggleOrderDetails(order.id)}
                            className="text-green-600 hover:text-green-700 font-medium flex items-center gap-1 transition"
                          ><p className="text-gray-600">
  <Link to={`/orders/${order.id}`}>Xem chi tiết</Link></p>
                            {/* {isExpanded ? (
                              <>
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                                </svg>
                                Ẩn chi tiết
                              </>
                            ) : (
                              <>
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                                Xem chi tiết
                              </>
                            )} */}
                          </button>
                          <div className="flex gap-3">
                            {order.status === "delivered" && (
                              <button className="bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 transition">
                                Đánh giá
                              </button>
                            )}
                            {(order.status === "pending" || order.status === "processing") && (
                              <button className="bg-red-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-red-600 transition">
                                Hủy đơn hàng
                              </button>
                            )}
                            <Link
                              to={`/product`}
                              className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-300 transition"
                            >
                              Mua lại
                            </Link>
                          </div>
                        </div>

                        {/* Chi tiết đơn hàng (ẩn/hiện) */}
                        {isExpanded && (
                          <div className="mt-6 pt-6 border-t">
                            <h4 className="font-medium text-gray-800 mb-3">Chi tiết đơn hàng</h4>
                            <div className="bg-gray-50 rounded-lg p-4">
                              <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Tạm tính:</span>
                                  <span className="text-gray-800">{(order.total - 20000).toLocaleString()} đ</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Phí vận chuyển:</span>
                                  <span className="text-gray-800">20.000 đ</span>
                                </div>
                                <div className="flex justify-between font-medium text-green-700 pt-2 border-t">
                                  <span>Tổng cộng:</span>
                                  <span>{order.total.toLocaleString()} đ</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Nút tiếp tục mua sắm */}
            <div className="text-center mt-10">
              <Link
                to="/product"
                className="inline-block bg-gradient-to-r from-green-600 to-green-700 text-white px-8 py-3 rounded-lg font-medium hover:shadow-lg transform hover:scale-105 transition-all duration-300"
              >
                Tiếp tục mua sắm
              </Link>
            </div>
          </>
        )}
      </div>
    </Layout>
  );
};

export default OrderHistoryPage;