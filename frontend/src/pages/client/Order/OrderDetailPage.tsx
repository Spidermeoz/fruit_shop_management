import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Layout from "../../../components/client/layout/Layout";
import { http } from "../../../services/http";
import { 
  Clock, 
  Package, 
  Truck, 
  CheckCircle, 
  XCircle, 
  MapPin, 
  Phone, 
  Mail,
  User,
  Calendar,
  CreditCard,
  FileText,
  ArrowLeft,
  HelpCircle
} from "lucide-react";

// ==========================
// TYPES
// ==========================
interface OrderDetail {
  totalPrice: any;
  id: number;
  code: string;
  status: string;
  subtotal: number;
  shippingFee: number;
  discountAmount: number;
  finalPrice: number;
  createdAt: string;
  paymentStatus: string;
  paymentMethod?: string;
  trackingToken?: string;
  estimatedDelivery?: string;
  
  items: {
    productId: number;
    productTitle: string;
    price: number;
    quantity: number;
    thumbnail?: string;
  }[];

  address: {
    fullName: string;
    phone: string;
    addressLine1: string;
    ward: string;
    district: string;
    province: string;
    notes?: string;
  } | null;
  
  deliveryHistory?: {
    id: number;
    status: string;
    location?: string;
    note?: string;
    createdAt: string;
  }[];
}

// ==========================
// PAGE
// ==========================
const OrderDetailPage: React.FC = () => {
  const { id } = useParams();

  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("details");
  const [error, setError] = useState<string | null>(null);
  const [showAllHistory, setShowAllHistory] = useState(false);

  // ==========================
  // LOAD ORDER DETAIL
  // ==========================
  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const res = await http("GET", `/api/v1/client/orders/${id}`);

        if (!res.success) {
          setError(res.message || "Không tìm thấy đơn hàng");
        } else {
          setOrder(res.data);
        }
      } catch (err: any) {
        setError(err.message || "Có lỗi xảy ra");
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [id]);

  // ==========================
  // STATUS INFO
  // ==========================
  const getStatusInfo = (status: string) => {
    switch (status) {
      case "pending":
        return {
          text: "Chờ xác nhận",
          bg: "bg-yellow-100",
          color: "text-yellow-700",
          icon: <Clock className="w-5 h-5" />
        };

      case "processing":
        return {
          text: "Đang xử lý",
          bg: "bg-blue-100",
          color: "text-blue-700",
          icon: <Package className="w-5 h-5" />
        };

      case "shipping":
        return {
          text: "Đang giao hàng",
          bg: "bg-purple-100",
          color: "text-purple-700",
          icon: <Truck className="w-5 h-5" />
        };

      case "delivered":
        return {
          text: "Đã giao hàng",
          bg: "bg-green-100",
          color: "text-green-700",
          icon: <CheckCircle className="w-5 h-5" />
        };

      case "completed":
        return {
          text: "Hoàn tất",
          bg: "bg-green-200",
          color: "text-green-800",
          icon: <CheckCircle className="w-5 h-5" />
        };

      case "cancelled":
        return {
          text: "Đã hủy",
          bg: "bg-red-100",
          color: "text-red-700",
          icon: <XCircle className="w-5 h-5" />
        };

      default:
        return {
          text: "Không xác định",
          bg: "bg-gray-100",
          color: "text-gray-700",
          icon: <Package className="w-5 h-5" />
        };
    }
  };

  // Hàm lấy icon cho từng trạng thái
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-5 h-5" />;
      case 'processing':
        return <Package className="w-5 h-5" />;
      case 'shipping':
        return <Truck className="w-5 h-5" />;
      case 'delivered':
      case 'completed':
        return <CheckCircle className="w-5 h-5" />;
      case 'cancelled':
        return <XCircle className="w-5 h-5" />;
      default:
        return <Package className="w-5 h-5" />;
    }
  };

  // Hàm lấy văn bản cho từng trạng thái
  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Chờ xác nhận';
      case 'processing':
        return 'Đang xử lý';
      case 'shipping':
        return 'Đang giao hàng';
      case 'delivered':
        return 'Đã giao hàng';
      case 'completed':
        return 'Hoàn tất';
      case 'cancelled':
        return 'Đã hủy';
      default:
        return status;
    }
  };

  // Hàm tính toán tiến trình (phần trăm)
  const calculateProgress = (order: OrderDetail) => {
    const statusFlow = ['pending', 'processing', 'shipping', 'delivered', 'completed'];
    const currentIndex = statusFlow.indexOf(order.status);
    
    if (currentIndex === -1) return 0;
    
    // Nếu đã hủy, trả về 0%
    if (order.status === 'cancelled') return 0;
    
    // Tính toán phần trăm dựa trên vị trí trong luồng
    return ((currentIndex + 1) / statusFlow.length) * 100;
  };

  // Hàm định dạng thời gian tương đối
  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffMins < 1) return 'Vừa xong';
    if (diffMins < 60) return `${diffMins} phút trước`;
    if (diffHours < 24) return `${diffHours} giờ trước`;
    if (diffDays < 7) return `${diffDays} ngày trước`;
    
    return date.toLocaleDateString('vi-VN');
  };

  // ==========================
  // RENDER
  // ==========================
  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen flex justify-center items-center">
          <div className="animate-spin h-10 w-10 border-b-2 border-green-600 rounded-full"></div>
        </div>
      </Layout>
    );
  }

  if (error || !order) {
    return (
      <Layout>
        <div className="min-h-screen flex justify-center items-center">
          <div className="text-center">
            <h2 className="text-xl text-gray-700 mb-3">{error}</h2>
            <Link
              to="/orders"
              className="px-6 py-3 bg-green-600 text-white rounded-lg"
            >
              Quay lại lịch sử đơn hàng
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  const statusUI = getStatusInfo(order.status);

  return (
    <Layout>
      {/* HEADER */}
      <section className="bg-gradient-to-r from-green-100 to-yellow-100 py-8 text-center">
        <h1 className="text-3xl font-bold text-green-800 mb-2">
          Chi tiết đơn hàng
        </h1>
        <p className="text-gray-700">Mã đơn: #{order.code}</p>
      </section>

      <div className="container mx-auto px-6 py-10">
        {/* ORDER HEADER */}
        <div className="bg-white shadow rounded-2xl p-6 mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-green-800">
                Đơn hàng #{order.code}
              </h2>
              <p className="text-gray-600 flex items-center gap-1 mt-1">
                <Calendar className="w-4 h-4" />
                Ngày đặt: {new Date(order.createdAt).toLocaleString()}
              </p>
              {order.estimatedDelivery && (
                <p className="text-gray-600 flex items-center gap-1 mt-1">
                  <Truck className="w-4 h-4" />
                  Dự kiến giao: {new Date(order.estimatedDelivery).toLocaleDateString()}
                </p>
              )}
            </div>

            <div className="flex items-center gap-3">
              <span
                className={`px-4 py-2 rounded-full flex items-center gap-2 ${statusUI.bg} ${statusUI.color}`}
              >
                {statusUI.icon}
                {statusUI.text}
              </span>
              {order.paymentStatus === "paid" ? (
                <span className="px-4 py-2 rounded-full bg-green-100 text-green-700 flex items-center gap-2">
                  <CreditCard className="w-4 h-4" />
                  Đã thanh toán
                </span>
              ) : (
                <span className="px-4 py-2 rounded-full bg-red-100 text-red-700 flex items-center gap-2">
                  <CreditCard className="w-4 h-4" />
                  Chưa thanh toán
                </span>
              )}
            </div>
          </div>
        </div>

        {/* TABS */}
        <div className="bg-white rounded-2xl shadow overflow-hidden mb-8">
          <div className="border-b flex flex-wrap">
            <button
              onClick={() => setActiveTab("details")}
              className={`px-6 py-4 border-b-2 flex items-center gap-2 ${
                activeTab === "details"
                  ? "border-green-600 text-green-600"
                  : "border-transparent text-gray-600"
              }`}
            >
              <FileText className="w-4 h-4" />
              Chi tiết
            </button>
            <button
              onClick={() => setActiveTab("items")}
              className={`px-6 py-4 border-b-2 flex items-center gap-2 ${
                activeTab === "items"
                  ? "border-green-600 text-green-600"
                  : "border-transparent text-gray-600"
              }`}
            >
              <Package className="w-4 h-4" />
              Sản phẩm
            </button>
            <button
              onClick={() => setActiveTab("timeline")}
              className={`px-6 py-4 border-b-2 flex items-center gap-2 ${
                activeTab === "timeline"
                  ? "border-green-600 text-green-600"
                  : "border-transparent text-gray-600"
              }`}
            >
              <Clock className="w-4 h-4" />
              Tiến trình
            </button>
          </div>

          {/* TAB CONTENT */}
          <div className="p-6">
            {/* DETAILS */}
            {activeTab === "details" && (
              <div className="space-y-6">
                {/* CUSTOMER */}
                <div>
                  <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                    <User className="w-5 h-5" />
                    Thông tin nhận hàng
                  </h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    {order.address ? (
                      <div className="space-y-2 text-sm">
                        <div className="flex items-start gap-2">
                          <User className="w-4 h-4 mt-0.5 text-gray-500" />
                          <p>
                            <strong>Họ tên:</strong> {order.address.fullName}
                          </p>
                        </div>
                        <div className="flex items-start gap-2">
                          <Phone className="w-4 h-4 mt-0.5 text-gray-500" />
                          <p>
                            <strong>SĐT:</strong> {order.address.phone}
                          </p>
                        </div>
                        <div className="flex items-start gap-2">
                          <MapPin className="w-4 h-4 mt-0.5 text-gray-500" />
                          <p>
                            <strong>Địa chỉ:</strong> {order.address.addressLine1}
                            , {order.address.ward}, {order.address.district},{" "}
                            {order.address.province}
                          </p>
                        </div>
                        {order.address.notes && (
                          <div className="flex items-start gap-2">
                            <FileText className="w-4 h-4 mt-0.5 text-gray-500" />
                            <p>
                              <strong>Ghi chú:</strong> {order.address.notes}
                            </p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-gray-600">Không có thông tin</p>
                    )}
                  </div>
                </div>

                {/* PAYMENT */}
                <div>
                  <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                    <CreditCard className="w-5 h-5" />
                    Thông tin thanh toán
                  </h3>
                  <div className="bg-gray-50 p-4 rounded-lg space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Phương thức:</span>
                      <span>{order.paymentMethod || "COD"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Trạng thái:</span>
                      <span className={order.paymentStatus === "paid" ? "text-green-600" : "text-red-600"}>
                        {order.paymentStatus === "paid" ? "Đã thanh toán" : "Chưa thanh toán"}
                      </span>
                    </div>
                    {order.trackingToken && (
                      <div className="flex justify-between">
                        <span>Mã theo dõi:</span>
                        <span className="font-mono">{order.trackingToken}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* PRICE */}
                <div>
                  <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                    <CreditCard className="w-5 h-5" />
                    Chi tiết giá
                  </h3>
                  <div className="bg-gray-50 p-4 rounded-lg space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Tạm tính:</span>
                      <span>{order.totalPrice.toLocaleString()} đ</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Phí giao hàng:</span>
                      <span>{order.shippingFee.toLocaleString()} đ</span>
                    </div>
                    {order.discountAmount > 0 && (
                      <div className="flex justify-between text-green-600">
                        <span>Giảm giá:</span>
                        <span>-{order.discountAmount.toLocaleString()} đ</span>
                      </div>
                    )}
                    <div className="flex justify-between font-bold pt-2 border-t">
                      <span>Tổng cộng:</span>
                      <span className="text-green-700">{order.finalPrice.toLocaleString()} đ</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ITEMS */}
            {activeTab === "items" && (
              <div className="space-y-4">
                {order.items.map((item) => (
                  <div
                    key={item.productId}
                    className="flex items-center gap-4 border-b pb-4"
                  >
                    <img
                      src={item.thumbnail || "/placeholder-image.jpg"}
                      className="w-20 h-20 rounded-lg object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "/placeholder-image.jpg";
                      }}
                    />
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-800">
                        {item.productTitle}
                      </h4>
                      <p className="text-sm text-gray-600">x{item.quantity}</p>
                      <p className="text-sm text-gray-500">
                        {item.price.toLocaleString()} đ / sản phẩm
                      </p>
                    </div>

                    <p className="font-medium text-green-700">
                      {(item.price * item.quantity).toLocaleString()} đ
                    </p>
                  </div>
                ))}
              </div>
            )}

            {/* TIMELINE */}
            {activeTab === "timeline" && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-semibold text-gray-800 text-lg">Tiến trình giao hàng</h3>
                  {order.deliveryHistory && order.deliveryHistory.length > 0 && (
                    <button 
                      className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
                      onClick={() => setShowAllHistory(!showAllHistory)}
                    >
                      {showAllHistory ? "Thu gọn" : "Xem tất cả"}
                    </button>
                  )}
                </div>

                {order.deliveryHistory && order.deliveryHistory.length > 0 ? (
                  <div className="relative">
                    {/* Timeline Progress Bar */}
                    <div className="relative h-2 bg-gray-200 rounded-full mb-6 overflow-hidden">
                      <div 
                        className="absolute h-full bg-green-500 rounded-full transition-all duration-500 ease-out"
                        style={{ width: `${calculateProgress(order)}%` }}
                      ></div>
                    </div>

                    {/* Timeline Steps */}
                    <div className="relative ml-3 pl-4 space-y-4">
                      {order.deliveryHistory
                        ?.slice()
                        .sort(
                          (a, b) =>
                            new Date(a.createdAt).getTime() -
                            new Date(b.createdAt).getTime()
                        )
                        ?.map((step, idx) => (
                          <div 
                            key={step.id} 
                            className={`relative transition-all duration-300 ${!showAllHistory && idx > 2 ? 'hidden' : ''}`}
                          >
                            {/* Connector Line */}
                            {idx < (order.deliveryHistory?.length ?? 0) - 1 && (
                              <div className="absolute left-0 top-6 w-0.5 h-12 bg-gray-300"></div>
                            )}

                            {/* Timeline Item */}
                            <div className="flex items-start gap-3">
                              {/* Status Icon */}
                              <div className={`relative z-10 flex items-center justify-center w-10 h-10 rounded-full ${
                                step.status === 'completed' || step.status === 'delivered' 
                                  ? 'bg-green-100 text-green-600' 
                                  : step.status === 'cancelled'
                                  ? 'bg-red-100 text-red-600'
                                  : step.status === 'shipping'
                                  ? 'bg-blue-100 text-blue-600'
                                  : 'bg-gray-100 text-gray-600'
                              }`}>
                                {getStatusIcon(step.status)}
                              </div>

                              {/* Content */}
                              <div className="flex-1 pb-6">
                                <div className="flex items-start justify-between">
                                  <div>
                                    <p className="font-medium text-gray-800">
                                      {getStatusText(step.status)}
                                    </p>
                                    <p className="text-sm text-gray-500 mt-1">
                                      {formatRelativeTime(step.createdAt)}
                                    </p>
                                  </div>
                                  <span className="text-xs text-gray-400">
                                    {new Date(step.createdAt).toLocaleString('vi-VN', {
                                      hour: '2-digit',
                                      minute: '2-digit',
                                      day: '2-digit',
                                      month: '2-digit',
                                      year: 'numeric'
                                    })}
                                  </span>
                                </div>

                                {step.location && (
                                  <div className="flex items-center gap-1 mt-2 text-sm text-gray-600">
                                    <MapPin className="w-4 h-4" />
                                    <span>{step.location}</span>
                                  </div>
                                )}

                                {step.note && (
                                  <div className="mt-2 p-2 bg-gray-50 rounded text-sm text-gray-700">
                                    <p>{step.note}</p>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>

                    {/* Current Status Summary */}
                    <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-100">
                      <div className="flex items-center gap-2">
                        <HelpCircle className="w-5 h-5 text-blue-600" />
                        <div>
                          <p className="font-medium text-blue-900">
                            Trạng thái hiện tại: {getStatusText(order.status)}
                          </p>
                          <p className="text-sm text-blue-700 mt-1">
                            {order.status === 'pending' && 'Đơn hàng của bạn đang chờ được xác nhận.'}
                            {order.status === 'processing' && 'Đơn hàng của bạn đang được chuẩn bị.'}
                            {order.status === 'shipping' && 'Đơn hàng đang được giao đến bạn.'}
                            {order.status === 'delivered' && 'Đơn hàng đã được giao thành công.'}
                            {order.status === 'completed' && 'Đơn hàng đã hoàn tất.'}
                            {order.status === 'cancelled' && 'Đơn hàng đã bị hủy.'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center py-8 bg-gray-50 rounded-lg">
                    <div className="text-center">
                      <Package className="w-10 h-10 mx-auto text-gray-400 mb-2" />
                      <p className="text-gray-500">Đang chờ cập nhật tiến trình giao hàng...</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ACTIONS */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/orders"
            className="px-6 py-3 border rounded-lg text-gray-700 flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Quay lại lịch sử đơn hàng
          </Link>
          {order.status === 'pending' && (
            <button className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700">
              Hủy đơn hàng
            </button>
          )}
          {order.status === 'shipping' && order.trackingToken && (
            <button 
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              onClick={() => window.open(`/track/${order.trackingToken}`, '_blank')}
            >
              Theo dõi đơn hàng
            </button>
          )}
          <button className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center justify-center gap-2">
            <HelpCircle className="w-4 h-4" />
            Liên hệ hỗ trợ
          </button>
        </div>
      </div>
    </Layout>
  );
};

export default OrderDetailPage;