import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Layout from "../../../components/client/layouts/Layout";
import { http } from "../../../services/http";
import Footer from "../../../components/client/layouts/Footer";
import {
  Clock,
  Package,
  Truck,
  CheckCircle,
  XCircle,
  MapPin,
  User,
  Calendar,
  CreditCard,
  FileText,
  ArrowLeft,
  HelpCircle,
} from "lucide-react";

// ==========================
// TYPES
// ==========================
interface OrderDetail {
  totalPrice: number;
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
    productId: number | null;
    productVariantId?: number | null;
    productTitle: string;
    variantTitle?: string | null;
    variantSku?: string | null;
    price: number;
    quantity: number;
    thumbnail?: string | null;
  }[];

  address: {
    fullName: string;
    phone: string;
    email?: string;
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

  const handleCancelOrder = async () => {
    if (!order) return;

    const ok = window.confirm("Bạn có chắc muốn hủy đơn hàng này?");
    if (!ok) return;

    try {
      const res = await http(
        "POST",
        `/api/v1/client/orders/${order.id}/cancel`,
      );

      if (res.success) {
        alert("Hủy đơn hàng thành công");
        window.location.reload();
      } else {
        alert(res.message || "Không thể hủy đơn hàng");
      }
    } catch (err) {
      alert("Có lỗi khi hủy đơn hàng");
    }
  };

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
          icon: <Clock className="w-5 h-5" />,
        };
      case "processing":
        return {
          text: "Đang xử lý",
          bg: "bg-blue-100",
          color: "text-blue-700",
          icon: <Package className="w-5 h-5" />,
        };
      case "shipping":
        return {
          text: "Đang giao hàng",
          bg: "bg-purple-100",
          color: "text-purple-700",
          icon: <Truck className="w-5 h-5" />,
        };
      case "delivered":
        return {
          text: "Đã giao hàng",
          bg: "bg-emerald-100",
          color: "text-emerald-700",
          icon: <CheckCircle className="w-5 h-5" />,
        };
      case "completed":
        return {
          text: "Hoàn tất",
          bg: "bg-green-100",
          color: "text-green-700",
          icon: <CheckCircle className="w-5 h-5" />,
        };
      case "cancelled":
        return {
          text: "Đã hủy",
          bg: "bg-red-100",
          color: "text-red-700",
          icon: <XCircle className="w-5 h-5" />,
        };
      default:
        return {
          text: "Không xác định",
          bg: "bg-slate-100",
          color: "text-slate-700",
          icon: <Package className="w-5 h-5" />,
        };
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="w-5 h-5" />;
      case "processing":
        return <Package className="w-5 h-5" />;
      case "shipping":
        return <Truck className="w-5 h-5" />;
      case "delivered":
      case "completed":
        return <CheckCircle className="w-5 h-5" />;
      case "cancelled":
        return <XCircle className="w-5 h-5" />;
      default:
        return <Package className="w-5 h-5" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "pending":
        return "Chờ xác nhận";
      case "processing":
        return "Đang xử lý";
      case "shipping":
        return "Đang giao hàng";
      case "delivered":
        return "Đã giao hàng";
      case "completed":
        return "Hoàn tất";
      case "cancelled":
        return "Đã hủy";
      default:
        return status;
    }
  };

  const calculateProgress = (order: OrderDetail) => {
    const statusFlow = [
      "pending",
      "processing",
      "shipping",
      "delivered",
      "completed",
    ];
    const currentIndex = statusFlow.indexOf(order.status);
    if (currentIndex === -1) return 0;
    if (order.status === "cancelled") return 0;
    return ((currentIndex + 1) / statusFlow.length) * 100;
  };

  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "Vừa xong";
    if (diffMins < 60) return `${diffMins} phút trước`;
    if (diffHours < 24) return `${diffHours} giờ trước`;
    if (diffDays < 7) return `${diffDays} ngày trước`;
    return date.toLocaleDateString("vi-VN");
  };

  // ==========================
  // RENDER
  // ==========================
  if (loading) {
    return (
      <Layout>
        <div className="min-h-[70vh] flex justify-center items-center bg-[#fcfdfc]">
          <div className="animate-spin h-12 w-12 border-4 border-slate-200 border-t-green-600 rounded-full"></div>
        </div>
      </Layout>
    );
  }

  if (error || !order) {
    return (
      <Layout>
        <div className="min-h-[70vh] flex justify-center items-center bg-[#fcfdfc] px-4">
          <div className="text-center bg-white p-10 rounded-[2.5rem] shadow-[0_20px_60px_rgba(0,0,0,0.05)] border border-slate-50 max-w-md w-full">
            <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-slate-900 mb-2">
              Lỗi tải dữ liệu
            </h2>
            <p className="text-slate-500 font-medium mb-8">{error}</p>
            <Link
              to="/orders"
              className="inline-flex items-center justify-center gap-2 bg-slate-900 text-white px-8 py-4 rounded-2xl font-bold hover:bg-green-700 transition-colors w-full active:scale-95"
            >
              <ArrowLeft className="w-5 h-5" /> Về lịch sử đơn hàng
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  const statusUI = getStatusInfo(order.status);

  return (
    <div className="flex flex-col min-h-screen bg-[#fcfdfc]">
      <Layout>
        {/* HEADER BANNER */}
        <section className="relative overflow-hidden bg-gradient-to-b from-green-100/50 to-transparent py-10 text-center">
          <div className="container mx-auto relative z-10 px-4">
            <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-4 tracking-tight flex items-center justify-center gap-3">
              Chi tiết đơn hàng
            </h1>
            <div className="flex items-center justify-center text-slate-500 text-sm md:text-base font-medium mb-2">
              <Link
                to="/orders"
                className="hover:text-green-600 transition-colors"
              >
                Đơn hàng của tôi
              </Link>
              <span className="mx-3 opacity-30">/</span>
              <span className="text-green-700 font-bold">#{order.code}</span>
            </div>
          </div>
        </section>

        <div className="container mx-auto px-4 lg:px-8 py-6 pb-20 max-w-5xl">
          {/* ORDER HEADER CARD */}
          <div className="bg-white rounded-[2.5rem] p-6 md:p-8 shadow-[0_20px_60px_rgba(0,0,0,0.04)] border border-slate-50 mb-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <p className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Mã đơn hàng
                </p>
                <h2 className="text-2xl md:text-3xl font-black text-slate-900 mb-4">
                  #{order.code}
                </h2>
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-6 text-sm font-medium text-slate-500">
                  <p className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-green-600" />
                    Đặt lúc:{" "}
                    <span className="text-slate-700">
                      {new Date(order.createdAt).toLocaleString()}
                    </span>
                  </p>
                  {order.estimatedDelivery && (
                    <p className="flex items-center gap-2">
                      <Truck className="w-4 h-4 text-blue-600" />
                      Dự kiến giao:{" "}
                      <span className="text-slate-700">
                        {new Date(order.estimatedDelivery).toLocaleDateString()}
                      </span>
                    </p>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <span
                  className={`px-4 py-2.5 rounded-xl flex items-center gap-2 font-bold text-sm ${statusUI.bg} ${statusUI.color}`}
                >
                  {statusUI.icon} {statusUI.text}
                </span>
                <span
                  className={`px-4 py-2.5 rounded-xl flex items-center gap-2 font-bold text-sm ${order.paymentStatus === "paid" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}
                >
                  <CreditCard className="w-4 h-4" />
                  {order.paymentStatus === "paid"
                    ? "Đã thanh toán"
                    : "Chưa thanh toán"}
                </span>
              </div>
            </div>
          </div>

          {/* TABS NAVIGATION */}
          <div className="flex gap-2 p-1.5 bg-slate-100 rounded-2xl mb-8 overflow-x-auto custom-scrollbar">
            <button
              onClick={() => setActiveTab("details")}
              className={`flex-1 min-w-[120px] flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold transition-all duration-300 ${
                activeTab === "details"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
              }`}
            >
              <FileText className="w-4 h-4" /> Chi tiết
            </button>
            <button
              onClick={() => setActiveTab("items")}
              className={`flex-1 min-w-[120px] flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold transition-all duration-300 ${
                activeTab === "items"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
              }`}
            >
              <Package className="w-4 h-4" /> Sản phẩm
            </button>
            <button
              onClick={() => setActiveTab("timeline")}
              className={`flex-1 min-w-[120px] flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold transition-all duration-300 ${
                activeTab === "timeline"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
              }`}
            >
              <Clock className="w-4 h-4" /> Tiến trình
            </button>
          </div>

          {/* TAB CONTENT */}
          <div className="bg-white rounded-[2.5rem] shadow-[0_30px_80px_rgba(0,0,0,0.06)] border border-slate-50 overflow-hidden min-h-[400px]">
            <div className="p-6 md:p-10">
              {/* DETAILS TAB */}
              {activeTab === "details" && (
                <div className="grid md:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  {/* CUSTOMER */}
                  <div className="space-y-4">
                    <h3 className="font-bold text-slate-800 flex items-center gap-2 uppercase tracking-wider text-sm">
                      <User className="w-4 h-4 text-slate-400" /> Thông tin nhận
                      hàng
                    </h3>
                    <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 h-full">
                      {order.address ? (
                        <div className="space-y-4">
                          <div>
                            <p className="text-xs font-bold text-slate-400 uppercase mb-1">
                              Người nhận
                            </p>
                            <p className="font-bold text-slate-900 text-lg">
                              {order.address.fullName}
                            </p>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-xs font-bold text-slate-400 uppercase mb-1">
                                Điện thoại
                              </p>
                              <p className="font-bold text-slate-900">
                                {order.address.phone}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs font-bold text-slate-400 uppercase mb-1">
                                Email
                              </p>
                              <p className="font-bold text-slate-900 truncate">
                                {order.address.email || "Không có"}
                              </p>
                            </div>
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-400 uppercase mb-1">
                              Giao đến
                            </p>
                            <p className="font-medium text-slate-700 leading-relaxed">
                              {order.address.addressLine1}, {order.address.ward}
                              , {order.address.district},{" "}
                              {order.address.province}
                            </p>
                          </div>
                          {order.address.notes && (
                            <div className="pt-3 border-t border-slate-200">
                              <p className="text-xs font-bold text-slate-400 uppercase mb-1">
                                Ghi chú đơn hàng
                              </p>
                              <p className="font-medium text-slate-700 italic">
                                {order.address.notes}
                              </p>
                            </div>
                          )}
                        </div>
                      ) : (
                        <p className="text-slate-500 font-medium">
                          Không có thông tin
                        </p>
                      )}
                    </div>
                  </div>

                  {/* PAYMENT & SUMMARY */}
                  <div className="space-y-8">
                    {/* PAYMENT */}
                    <div className="space-y-4">
                      <h3 className="font-bold text-slate-800 flex items-center gap-2 uppercase tracking-wider text-sm">
                        <CreditCard className="w-4 h-4 text-slate-400" /> Thông
                        tin thanh toán
                      </h3>
                      <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-bold text-slate-500">
                            Phương thức
                          </span>
                          <span className="font-bold text-slate-900 uppercase">
                            {order.paymentMethod || "COD"}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-bold text-slate-500">
                            Trạng thái
                          </span>
                          <span
                            className={`font-bold ${order.paymentStatus === "paid" ? "text-green-600" : "text-red-600"}`}
                          >
                            {order.paymentStatus === "paid"
                              ? "Đã thanh toán"
                              : "Chưa thanh toán"}
                          </span>
                        </div>
                        {order.trackingToken && (
                          <div className="flex justify-between items-center pt-3 border-t border-slate-200">
                            <span className="text-sm font-bold text-slate-500">
                              Mã vận đơn
                            </span>
                            <span className="font-mono font-bold text-slate-900 bg-white px-2 py-1 rounded border border-slate-200">
                              {order.trackingToken}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* PRICE */}
                    <div className="space-y-4">
                      <h3 className="font-bold text-slate-800 flex items-center gap-2 uppercase tracking-wider text-sm">
                        <FileText className="w-4 h-4 text-slate-400" /> Chi tiết
                        thanh toán
                      </h3>
                      <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 space-y-3">
                        <div className="flex justify-between font-medium text-slate-600 text-sm">
                          <span>Tạm tính</span>
                          <span className="font-bold text-slate-900">
                            {order.totalPrice.toLocaleString()} đ
                          </span>
                        </div>
                        <div className="flex justify-between font-medium text-slate-600 text-sm">
                          <span>Phí giao hàng</span>
                          <span className="font-bold text-slate-900">
                            {order.shippingFee.toLocaleString()} đ
                          </span>
                        </div>
                        {order.discountAmount > 0 && (
                          <div className="flex justify-between font-medium text-green-600 text-sm">
                            <span>Giảm giá</span>
                            <span className="font-bold">
                              -{order.discountAmount.toLocaleString()} đ
                            </span>
                          </div>
                        )}
                        <div className="flex justify-between items-end pt-4 mt-2 border-t border-slate-200">
                          <span className="text-sm font-bold text-slate-400 uppercase tracking-wider">
                            Tổng cộng
                          </span>
                          <span className="text-2xl font-black text-green-600 leading-none">
                            {order.finalPrice.toLocaleString()} đ
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ITEMS TAB */}
              {activeTab === "items" && (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2 uppercase tracking-wider text-sm">
                    <Package className="w-4 h-4 text-slate-400" /> Danh sách sản
                    phẩm ({order.items.length})
                  </h3>
                  <div className="grid gap-4">
                    {order.items.map((item) => (
                      <div
                        key={`${item.productId ?? "x"}-${item.productVariantId ?? "no-variant"}-${item.variantSku ?? item.productTitle}`}
                        className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors"
                      >
                        <Link
                          to={
                            item.productId
                              ? `/products/${item.productId}`
                              : "/products"
                          }
                          className="shrink-0 relative overflow-hidden rounded-xl w-20 h-20 border border-slate-200 bg-white"
                        >
                          <img
                            src={item.thumbnail || "/placeholder-image.jpg"}
                            className="w-full h-full object-cover hover:scale-110 transition-transform duration-500"
                            alt={item.productTitle}
                            onError={(e) => {
                              (e.target as HTMLImageElement).src =
                                "/placeholder-image.jpg";
                            }}
                          />
                        </Link>
                        <div className="flex-1 min-w-0">
                          <Link
                            to={
                              item.productId
                                ? `/products/${item.productId}`
                                : "/products"
                            }
                            className="font-bold text-slate-900 text-lg hover:text-green-600 transition-colors block truncate"
                          >
                            {item.productTitle}
                            {item.variantTitle && (
                              <p className="text-sm font-bold text-slate-500 mt-1">
                                {item.variantTitle}
                              </p>
                            )}

                            {item.variantSku && (
                              <p className="text-xs text-slate-400 font-medium mt-1">
                                SKU: {item.variantSku}
                              </p>
                            )}
                          </Link>
                          <div className="flex flex-wrap items-center gap-3 mt-2">
                            <span className="bg-white border border-slate-200 px-3 py-1 rounded-lg text-xs font-bold text-slate-500 shadow-sm">
                              Số lượng: {item.quantity}
                            </span>
                            <span className="text-slate-500 font-medium text-sm">
                              {item.price.toLocaleString()} đ / sp
                            </span>
                          </div>
                        </div>
                        <div className="text-right mt-2 sm:mt-0">
                          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                            Thành tiền
                          </p>
                          <p className="font-black text-slate-900 text-lg">
                            {(item.price * item.quantity).toLocaleString()} đ
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TIMELINE TAB */}
              {activeTab === "timeline" && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-10 gap-4">
                    <h3 className="font-bold text-slate-800 flex items-center gap-2 uppercase tracking-wider text-sm">
                      <Clock className="w-4 h-4 text-slate-400" /> Hành trình
                      đơn hàng
                    </h3>
                    {order.deliveryHistory &&
                      order.deliveryHistory.length > 0 && (
                        <button
                          className="text-sm font-bold text-green-600 hover:text-green-800 underline transition-colors"
                          onClick={() => setShowAllHistory(!showAllHistory)}
                        >
                          {showAllHistory
                            ? "Thu gọn chi tiết"
                            : "Xem toàn bộ lịch sử"}
                        </button>
                      )}
                  </div>

                  {order.deliveryHistory && order.deliveryHistory.length > 0 ? (
                    <div className="relative max-w-3xl mx-auto">
                      {/* Timeline Progress Bar (Nằm ngang) */}
                      <div className="relative h-3 bg-slate-100 rounded-full mb-12 overflow-hidden shadow-inner">
                        <div
                          className="absolute top-0 left-0 h-full bg-gradient-to-r from-green-400 to-green-600 rounded-full transition-all duration-1000 ease-out"
                          style={{ width: `${calculateProgress(order)}%` }}
                        ></div>
                      </div>

                      {/* Timeline Steps (Trục dọc) */}
                      <div className="relative border-l-2 border-dashed border-slate-200 ml-6 md:ml-8 space-y-8 pb-4">
                        {order.deliveryHistory
                          ?.slice()
                          .sort(
                            (a, b) =>
                              new Date(b.createdAt).getTime() -
                              new Date(a.createdAt).getTime(),
                          )
                          ?.map((step, idx) => (
                            <div
                              key={step.id}
                              className={`relative pl-8 md:pl-10 transition-all duration-300 ${!showAllHistory && idx > 2 ? "hidden" : ""}`}
                            >
                              {/* Dot Icon */}
                              <div
                                className={`absolute -left-[21px] top-0 flex items-center justify-center w-10 h-10 rounded-full border-4 border-white shadow-sm transition-colors ${
                                  idx === 0
                                    ? step.status === "cancelled"
                                      ? "bg-red-500 text-white"
                                      : "bg-green-500 text-white"
                                    : "bg-slate-100 text-slate-400"
                                }`}
                              >
                                {getStatusIcon(step.status)}
                              </div>

                              {/* Content Card */}
                              <div
                                className={`p-5 rounded-2xl border transition-colors ${idx === 0 ? "bg-green-50/50 border-green-100 shadow-sm" : "bg-white border-slate-100"}`}
                              >
                                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 mb-2">
                                  <div>
                                    <p
                                      className={`font-bold text-lg ${idx === 0 ? "text-slate-900" : "text-slate-700"}`}
                                    >
                                      {getStatusText(step.status)}
                                    </p>
                                    <p className="text-sm font-medium text-slate-500 flex items-center gap-1.5 mt-1">
                                      <Clock className="w-3.5 h-3.5" />
                                      {formatRelativeTime(step.createdAt)}
                                      <span className="opacity-50">•</span>
                                      <span>
                                        {new Date(
                                          step.createdAt,
                                        ).toLocaleString("vi-VN", {
                                          hour: "2-digit",
                                          minute: "2-digit",
                                          day: "2-digit",
                                          month: "2-digit",
                                          year: "numeric",
                                        })}
                                      </span>
                                    </p>
                                  </div>
                                </div>

                                {step.location && (
                                  <div className="flex items-center gap-1.5 mt-3 text-sm font-medium text-slate-600 bg-slate-50 w-fit px-3 py-1.5 rounded-lg border border-slate-100">
                                    <MapPin className="w-4 h-4 text-slate-400" />
                                    <span>{step.location}</span>
                                  </div>
                                )}

                                {step.note && (
                                  <div className="mt-3 p-3 bg-white/50 border border-slate-100 rounded-xl text-sm font-medium text-slate-600 italic">
                                    "{step.note}"
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                      </div>

                      {/* Current Status Summary */}
                      <div className="mt-10 p-5 bg-blue-50 rounded-2xl border border-blue-100 flex items-start gap-4">
                        <HelpCircle className="w-6 h-6 text-blue-500 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-bold text-blue-900 text-lg mb-1">
                            Trạng thái hiện tại: {getStatusText(order.status)}
                          </p>
                          <p className="text-sm font-medium text-blue-700 leading-relaxed">
                            {order.status === "pending" &&
                              "Đơn hàng của bạn đã được ghi nhận và đang chờ bộ phận CSKH xác nhận."}
                            {order.status === "processing" &&
                              "Đơn hàng của bạn đang được đóng gói cẩn thận tại kho."}
                            {order.status === "shipping" &&
                              "Tài xế đang trên đường giao hàng đến bạn. Vui lòng chú ý điện thoại."}
                            {order.status === "delivered" &&
                              "Đơn hàng đã được giao thành công. Cảm ơn bạn đã tin tưởng FreshFruits!"}
                            {order.status === "completed" &&
                              "Đơn hàng đã hoàn tất. Chúc bạn có một bữa ăn ngon miệng!"}
                            {order.status === "cancelled" &&
                              "Đơn hàng đã bị hủy. Nếu bạn có thắc mắc, vui lòng liên hệ CSKH."}
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-16 bg-slate-50 rounded-3xl border border-slate-100 border-dashed">
                      <Package className="w-12 h-12 text-slate-300 mb-4" />
                      <p className="text-slate-500 font-medium">
                        Hệ thống đang cập nhật tiến trình giao hàng...
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* BOTTOM ACTIONS */}
          <div className="mt-8 flex flex-col sm:flex-row flex-wrap gap-4 justify-center items-center">
            <Link
              to="/orders"
              className="w-full sm:w-auto px-8 py-4 bg-white border-2 border-slate-200 text-slate-700 font-bold rounded-2xl hover:border-slate-300 hover:bg-slate-50 transition-all flex items-center justify-center gap-2 active:scale-95"
            >
              <ArrowLeft className="w-5 h-5 stroke-[3]" /> Quay lại danh sách
            </Link>

            {(order.status === "pending" || order.status === "processing") && (
              <button
                onClick={handleCancelOrder}
                className="w-full sm:w-auto px-8 py-4 bg-white border-2 border-red-100 text-red-600 font-bold rounded-2xl hover:bg-red-50 hover:border-red-200 transition-all active:scale-95"
              >
                Hủy đơn hàng này
              </button>
            )}

            {order.status === "shipping" && order.trackingToken && (
              <button
                className="w-full sm:w-auto px-8 py-4 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-700 hover:shadow-lg transition-all flex items-center justify-center gap-2 active:scale-95"
                onClick={() =>
                  window.open(`/track/${order.trackingToken}`, "_blank")
                }
              >
                <Truck className="w-5 h-5" /> Theo dõi vận đơn
              </button>
            )}

            <Link
              to="/contact"
              className="w-full sm:w-auto px-8 py-4 bg-slate-900 text-white font-bold rounded-2xl hover:bg-green-700 hover:shadow-lg transition-all flex items-center justify-center gap-2 active:scale-95"
            >
              <HelpCircle className="w-5 h-5" /> Liên hệ hỗ trợ ngay
            </Link>
          </div>
        </div>
      </Layout>
      <Footer />
    </div>
  );
};

export default OrderDetailPage;
