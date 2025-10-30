import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Layout from "../../../components/client/layout/Layout";

interface OrderItem {
  id: number;
  name: string;
  image: string;
  price: number;
  quantity: number;
  category: string;
  origin: string;
}

interface OrderDetail {
  id: string;
  date: string;
  status: "pending" | "processing" | "shipping" | "delivered" | "cancelled";
  total: number;
  subtotal: number;
  shippingFee: number;
  discount: number;
  paymentMethod: string;
  trackingNumber?: string;
  customer: {
    name: string;
    phone: string;
    email: string;
    address: string;
  };
  items: OrderItem[];
  estimatedDelivery?: string;
  actualDelivery?: string;
}

const OrderDetailPage: React.FC = () => {
  const { id } = useParams();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("details");

  useEffect(() => {
    // Giả lập tải dữ liệu
    setTimeout(() => {
      if (id === "DH12345") {
        setOrder({
          id: "DH12345",
          date: "2025-08-10",
          status: "delivered",
          total: 730000,
          subtotal: 710000,
          shippingFee: 20000,
          discount: 0,
          paymentMethod: "cod",
          trackingNumber: "FX123456789VN",
          customer: {
            name: "Nguyễn Văn A",
            phone: "0912345678",
            email: "nguyenvana@example.com",
            address: "123 Đường Trái Cây, Phường 1, Quận 1, TP. Hồ Chí Minh",
          },
          items: [
            {
              id: 1,
              name: "Táo Envy Mỹ",
              image: "https://i.imgur.com/k2P1k5M.jpg",
              price: 250000,
              quantity: 2,
              category: "Trái cây nhập khẩu",
              origin: "Mỹ"
            },
            {
              id: 2,
              name: "Cam Úc",
              image: "https://i.imgur.com/8Jk3l7n.jpg",
              price: 180000,
              quantity: 1,
              category: "Trái cây nhập khẩu",
              origin: "Úc"
            },
            {
              id: 3,
              name: "Cherry Mỹ",
              image: "https://i.imgur.com/5Hd9p2q.jpg",
              price: 550000,
              quantity: 1,
              category: "Trái cây nhập khẩu",
              origin: "Mỹ"
            }
          ],
          estimatedDelivery: "2025-08-12",
          actualDelivery: "2025-08-11"
        });
      } else if (id === "DH12346") {
        setOrder({
          id: "DH12346",
          date: "2025-08-12",
          status: "shipping",
          total: 450000,
          subtotal: 430000,
          shippingFee: 20000,
          discount: 0,
          paymentMethod: "bank",
          trackingNumber: "FX987654321VN",
          customer: {
            name: "Trần Thị B",
            phone: "0987654321",
            email: "tranthib@example.com",
            address: "456 Đường Cây Xanh, Phường 3, Quận 3, TP. Hồ Chí Minh",
          },
          items: [
            {
              id: 4,
              name: "Nho Úc",
              image: "https://i.imgur.com/7Mj4k9l.jpg",
              price: 320000,
              quantity: 1,
              category: "Trái cây nhập khẩu",
              origin: "Úc"
            },
            {
              id: 5,
              name: "Dâu Hàn Quốc",
              image: "https://i.imgur.com/3Kd8p5m.jpg",
              price: 450000,
              quantity: 1,
              category: "Trái cây nhập khẩu",
              origin: "Hàn Quốc"
            }
          ],
          estimatedDelivery: "2025-08-15"
        });
      } else {
        setError("Không tìm thấy đơn hàng");
      }
      setIsLoading(false);
    }, 1000);
  }, [id]);

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

  // Theo dõi đơn hàng
  const trackOrder = () => {
    if (order?.trackingNumber) {
      alert(`Mã vận đơn: ${order.trackingNumber}\nĐang chuyển hướng đến trang theo dõi đơn hàng...`);
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
        </div>
      </Layout>
    );
  }

  if (error || !order) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-24 w-24 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h2 className="text-2xl text-gray-700 mb-4">{error || "Không tìm thấy đơn hàng"}</h2>
            <Link
              to="/orders"
              className="inline-block bg-gradient-to-r from-green-600 to-green-700 text-white px-8 py-3 rounded-lg font-medium hover:shadow-lg transform hover:scale-105 transition-all duration-300"
            >
              Quay lại lịch sử đơn hàng
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  const statusInfo = getStatusInfo(order.status);

  return (
    <Layout>
      {/* Header nhỏ */}
      <section className="bg-gradient-to-r from-green-100 to-yellow-100 py-8 text-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-4 left-10 w-16 h-16 bg-yellow-300 rounded-full animate-pulse"></div>
          <div className="absolute bottom-4 right-10 w-12 h-12 bg-green-400 rounded-full animate-pulse"></div>
        </div>
        <div className="relative z-10">
          <h1 className="text-4xl font-bold text-green-800 mb-2">Chi tiết đơn hàng</h1>
          <p className="text-gray-700">Xem thông tin chi tiết về đơn hàng của bạn</p>
          <div className="flex items-center justify-center text-gray-600 mt-2">
            <Link to="/" className="hover:text-green-600 transition">Trang chủ</Link>
            <span className="mx-2">/</span>
            <Link to="/orders" className="hover:text-green-600 transition">Lịch sử đơn hàng</Link>
            <span className="mx-2">/</span>
            <span className="text-green-700">#{order.id}</span>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-6 py-10">
        {/* Thông tin đơn hàng */}
        <div className="bg-white rounded-2xl shadow-md overflow-hidden mb-8">
          <div className="p-6 border-b">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h2 className="text-2xl font-bold text-green-800">Đơn hàng #{order.id}</h2>
                  <span className={`${statusInfo.bgColor} ${statusInfo.textColor} px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1`}>
                    {statusInfo.icon}
                    {statusInfo.text}
                  </span>
                </div>
                <p className="text-gray-600">Ngày đặt: {order.date}</p>
                {order.trackingNumber && (
                  <div className="flex items-center mt-2">
                    <span className="text-gray-600 mr-2">Mã vận đơn:</span>
                    <span className="font-medium text-gray-800">{order.trackingNumber}</span>
                    <button
                      onClick={trackOrder}
                      className="ml-2 text-green-600 hover:text-green-700 text-sm font-medium transition"
                    >
                      Theo dõi
                    </button>
                  </div>
                )}
              </div>
              <div className="text-right">
                <p className="text-gray-600 mb-1">Tổng tiền:</p>
                <p className="text-2xl font-bold text-green-700">{order.total.toLocaleString()} đ</p>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="border-b">
            <nav className="-mb-px flex">
              <button
                onClick={() => setActiveTab("details")}
                className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${
                  activeTab === "details"
                    ? "border-green-500 text-green-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                Chi tiết đơn hàng
              </button>
              <button
                onClick={() => setActiveTab("timeline")}
                className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${
                  activeTab === "timeline"
                    ? "border-green-500 text-green-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                Lịch sử giao hàng
              </button>
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === "details" && (
              <div className="space-y-6">
                {/* Thông tin khách hàng */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">Thông tin khách hàng</h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="grid md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600">Họ và tên:</p>
                        <p className="font-medium text-gray-800">{order.customer.name}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Số điện thoại:</p>
                        <p className="font-medium text-gray-800">{order.customer.phone}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Email:</p>
                        <p className="font-medium text-gray-800">{order.customer.email}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Địa chỉ:</p>
                        <p className="font-medium text-gray-800">{order.customer.address}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Thông tin thanh toán */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">Thông tin thanh toán</h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="grid md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600">Phương thức thanh toán:</p>
                        <p className="font-medium text-gray-800">{getPaymentMethod(order.paymentMethod)}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Ngày đặt hàng:</p>
                        <p className="font-medium text-gray-800">{order.date}</p>
                      </div>
                      {order.estimatedDelivery && (
                        <div>
                          <p className="text-gray-600">Ngày giao hàng dự kiến:</p>
                          <p className="font-medium text-gray-800">{order.estimatedDelivery}</p>
                        </div>
                      )}
                      {order.actualDelivery && (
                        <div>
                          <p className="text-gray-600">Ngày giao hàng thực tế:</p>
                          <p className="font-medium text-gray-800">{order.actualDelivery}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Chi tiết giá */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">Chi tiết giá</h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Tạm tính:</span>
                        <span className="text-gray-800">{order.subtotal.toLocaleString()} đ</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Phí vận chuyển:</span>
                        <span className="text-gray-800">{order.shippingFee.toLocaleString()} đ</span>
                      </div>
                      {order.discount > 0 && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Giảm giá:</span>
                          <span className="text-green-600">-{order.discount.toLocaleString()} đ</span>
                        </div>
                      )}
                      <div className="flex justify-between font-medium text-green-700 pt-2 border-t">
                        <span>Tổng cộng:</span>
                        <span>{order.total.toLocaleString()} đ</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "timeline" && (
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-6">Lịch sử giao hàng</h3>
                <div className="relative">
                  <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-300"></div>
                  <div className="space-y-6">
                    <div className="flex items-start">
                      <div className="relative z-10 w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <div className="ml-4">
                        <p className="font-medium text-gray-800">Đặt hàng thành công</p>
                        <p className="text-sm text-gray-600">{order.date}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start">
                      <div className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center ${
                        order.status !== "pending" ? "bg-green-600" : "bg-gray-300"
                      }`}>
                        {order.status !== "pending" ? (
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          <div className="w-2 h-2 bg-white rounded-full"></div>
                        )}
                      </div>
                      <div className="ml-4">
                        <p className={`font-medium ${order.status !== "pending" ? "text-gray-800" : "text-gray-400"}`}>
                          Xác nhận đơn hàng
                        </p>
                        <p className="text-sm text-gray-600">
                          {order.status !== "pending" ? order.date : "Chưa xác nhận"}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-start">
                      <div className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center ${
                        order.status === "processing" || order.status === "shipping" || order.status === "delivered" ? "bg-green-600" : "bg-gray-300"
                      }`}>
                        {order.status === "processing" || order.status === "shipping" || order.status === "delivered" ? (
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          <div className="w-2 h-2 bg-white rounded-full"></div>
                        )}
                      </div>
                      <div className="ml-4">
                        <p className={`font-medium ${
                          order.status === "processing" || order.status === "shipping" || order.status === "delivered" ? "text-gray-800" : "text-gray-400"
                        }`}>
                          Đang chuẩn bị hàng
                        </p>
                        <p className="text-sm text-gray-600">
                          {order.status === "processing" || order.status === "shipping" || order.status === "delivered" ? order.date : "Chưa chuẩn bị"}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-start">
                      <div className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center ${
                        order.status === "shipping" || order.status === "delivered" ? "bg-green-600" : "bg-gray-300"
                      }`}>
                        {order.status === "shipping" || order.status === "delivered" ? (
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          <div className="w-2 h-2 bg-white rounded-full"></div>
                        )}
                      </div>
                      <div className="ml-4">
                        <p className={`font-medium ${
                          order.status === "shipping" || order.status === "delivered" ? "text-gray-800" : "text-gray-400"
                        }`}>
                          Đang giao hàng
                        </p>
                        <p className="text-sm text-gray-600">
                          {order.status === "shipping" || order.status === "delivered" ? order.estimatedDelivery || "Đang giao" : "Chưa giao hàng"}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-start">
                      <div className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center ${
                        order.status === "delivered" ? "bg-green-600" : "bg-gray-300"
                      }`}>
                        {order.status === "delivered" ? (
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          <div className="w-2 h-2 bg-white rounded-full"></div>
                        )}
                      </div>
                      <div className="ml-4">
                        <p className={`font-medium ${order.status === "delivered" ? "text-gray-800" : "text-gray-400"}`}>
                          Giao hàng thành công
                        </p>
                        <p className="text-sm text-gray-600">
                          {order.actualDelivery || "Chưa giao hàng"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Danh sách sản phẩm */}
        <div className="bg-white rounded-2xl shadow-md overflow-hidden mb-8">
          <div className="p-6 border-b">
            <h3 className="text-lg font-semibold text-gray-800">Sản phẩm trong đơn hàng ({order.items.length})</h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {order.items.map((item) => (
                <div key={item.id} className="flex items-center gap-4 pb-4 border-b last:border-0">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-20 h-20 rounded-lg object-cover"
                  />
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-800">{item.name}</h4>
                    <p className="text-sm text-gray-500">{item.category}</p>
                    <p className="text-sm text-gray-500">Xuất xứ: {item.origin}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">Số lượng: {item.quantity}</p>
                    <p className="font-medium text-green-700">
                      {(item.price * item.quantity).toLocaleString()} đ
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Nút hành động */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          {order.status === "delivered" && (
            <button className="bg-green-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-700 transition">
              Đánh giá sản phẩm
            </button>
          )}
          <Link
            to="/product"
            className="bg-gray-200 text-gray-700 px-6 py-3 rounded-lg font-medium hover:bg-gray-300 transition text-center"
          >
            Mua lại sản phẩm
          </Link>
          <Link
            to="/orders"
            className="border border-gray-300 text-gray-700 px-6 py-3 rounded-lg font-medium hover:bg-gray-50 transition text-center"
          >
            Quay lại lịch sử đơn hàng
          </Link>
        </div>
      </div>
    </Layout>
  );
};

export default OrderDetailPage;