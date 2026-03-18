import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Layout from "../../../components/client/layouts/Layout";
import { http } from "../../../services/http";
import {
  Package,
  Calendar,
  CreditCard,
  Eye,
  XCircle,
  ShoppingBag,
  Clock,
  Truck,
  CheckCircle,
  Star,
  Filter,
  RefreshCw,
  Home,
} from "lucide-react";
import Footer from "../../../components/client/layouts/Footer";

// =============================
// TYPE MAPPING TỪ BACKEND
// =============================
interface Order {
  id: number;
  code: string;
  status: string;
  totalPrice: number;
  finalPrice: number;
  shippingFee: number;
  createdAt: string;

  items: {
    _reviewed: any;
    productId: number;
    productTitle: string;
    price: number;
    quantity: number;
    thumbnail?: string | null;
  }[];

  address?: {
    full_name: string;
    phone: string;
    address_line1: string;
    ward: string;
    district: string;
    province: string;
  } | null;

  paymentStatus?: string;
}

const OrderHistoryPage: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filterStatus, setFilterStatus] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [isCancelling, setIsCancelling] = useState<number | null>(null);
  const [reviewingOrderId, setReviewingOrderId] = useState<number | null>(null);
  const [reviewsData, setReviewsData] = useState<any>({});
  const [submittingReviewId, setSubmittingReviewId] = useState<number | null>(
    null,
  );

  // =============================
  // LOAD ORDERS FROM API
  // =============================
  const loadOrders = async () => {
    try {
      const res = await http("GET", "/api/v1/client/orders");
      let result: Order[] = [];

      if (res.success && res.data) {
        if (res.data.rows) result = res.data.rows;
        else if (Array.isArray(res.data))
          result = res.data.map((o: any) => o.props);
      }

      const extendedOrders = [];

      for (const ord of result) {
        const newItems = [];
        for (const item of ord.items) {
          const check = await http(
            "GET",
            `/api/v1/client/reviews/check?orderId=${ord.id}&productId=${item.productId}`,
          );
          const reviewed = check?.success ? check.reviewed : false;
          newItems.push({ ...item, _reviewed: reviewed });
        }
        extendedOrders.push({ ...ord, items: newItems });
      }

      setOrders(extendedOrders);
    } catch (err) {
      console.error("Order load error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  // =============================
  // CANCEL ORDER
  // =============================
  const handleCancelOrder = async (orderId: number) => {
    const ok = window.confirm("Bạn có chắc chắn muốn hủy đơn hàng này không?");
    if (!ok) return;

    setIsCancelling(orderId);

    try {
      const res = await http("POST", `/api/v1/client/orders/${orderId}/cancel`);
      if (res.success) {
        alert("Hủy đơn hàng thành công!");
        await loadOrders();
      } else {
        alert(res.message || "Không thể hủy đơn hàng");
      }
    } catch (err) {
      console.error("Cancel error:", err);
      alert("Đã xảy ra lỗi khi hủy đơn hàng");
    } finally {
      setIsCancelling(null);
    }
  };

  // =============================
  // FILTER ORDERS
  // =============================
  const filteredOrders =
    filterStatus === "all"
      ? orders
      : orders.filter((o) => o.status === filterStatus);

  // =============================
  // STATUS UI
  // =============================
  const statusFormat: Record<
    string,
    { text: string; bg: string; color: string; icon: React.ReactNode }
  > = {
    pending: {
      text: "Pending",
      bg: "bg-yellow-100",
      color: "text-yellow-700",
      icon: <Clock className="w-5 h-5 md:w-4 md:h-4" />,
    },
    processing: {
      text: "Processing",
      bg: "bg-blue-100",
      color: "text-blue-700",
      icon: <Package className="w-5 h-5 md:w-4 md:h-4" />,
    },
    shipping: {
      text: "Shipping",
      bg: "bg-purple-100",
      color: "text-purple-700",
      icon: <Truck className="w-5 h-5 md:w-4 md:h-4" />,
    },
    delivered: {
      text: "Delivered",
      bg: "bg-emerald-100",
      color: "text-emerald-700",
      icon: <CheckCircle className="w-5 h-5 md:w-4 md:h-4" />,
    },
    completed: {
      text: "Completed",
      bg: "bg-green-100",
      color: "text-green-700",
      icon: <CheckCircle className="w-5 h-5 md:w-4 md:h-4" />,
    },
    cancelled: {
      text: "Cancelled",
      bg: "bg-red-100",
      color: "text-red-700",
      icon: <XCircle className="w-5 h-5 md:w-4 md:h-4" />,
    },
  };

  const getPaymentMethod = (s?: string) => {
    switch (s) {
      case "paid":
        return {
          text: "Đã thanh toán",
          color: "text-green-600",
          bg: "bg-green-50",
        };
      case "unpaid":
        return {
          text: "Thanh toán khi nhận hàng",
          color: "text-slate-600",
          bg: "bg-slate-100",
        };
      default:
        return {
          text: "Không rõ",
          color: "text-slate-600",
          bg: "bg-slate-100",
        };
    }
  };

  const updateReviewData = (productId: number, field: string, value: any) => {
    setReviewsData((prev: any) => ({
      ...prev,
      [productId]: {
        ...(prev[productId] || {}),
        [field]: value,
      },
    }));
  };

  // =============================
  // SUBMIT SINGLE REVIEW
  // =============================
  const submitSingleReview = async (orderId: number, productId: number) => {
    try {
      const rd = reviewsData[productId];

      if (!rd || (!rd.rating && !rd.content?.trim())) {
        alert("Vui lòng nhập nội dung hoặc chọn số sao.");
        return;
      }

      setSubmittingReviewId(productId);

      const res = await http("POST", "/api/v1/client/reviews", {
        productId,
        orderId,
        rating: rd.rating || null,
        content: rd.content?.trim() || null,
      });

      if (!res?.success) {
        alert(res?.message || "Gửi đánh giá thất bại.");
        return;
      }

      alert("Đánh giá thành công!");

      setReviewsData((prev: any) => {
        const next = { ...prev };
        delete next[productId];
        return next;
      });

      await loadOrders();
    } catch (err) {
      console.error(err);
      alert("Lỗi khi gửi đánh giá.");
    } finally {
      setSubmittingReviewId(null);
    }
  };

  // =============================
  // RENDER LOADING
  // =============================
  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen bg-[#fcfdfc]">
        <Layout>
          <div className="min-h-[70vh] flex justify-center items-center">
            <div className="animate-spin h-12 w-12 border-4 border-slate-200 border-t-green-600 rounded-full"></div>
          </div>
        </Layout>
      </div>
    );
  }

  // =============================
  // RENDER MAIN
  // =============================
  return (
    <div className="flex flex-col min-h-screen bg-[#fcfdfc]">
      <Layout>
        {/* Banner Section */}
        <section className="relative overflow-hidden bg-gradient-to-b from-green-100/50 to-transparent py-10 text-center">
          <div className="container mx-auto relative z-10 px-4">
            <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-4 tracking-tight flex items-center justify-center gap-3">
              <Package className="w-10 h-10 text-green-600" />
              Lịch sử đơn hàng
            </h1>
            <div className="flex items-center justify-center text-slate-500 text-sm md:text-base font-medium mb-2">
              <Link
                to="/"
                className="hover:text-green-600 transition-colors flex items-center gap-1"
              >
                <Home className="w-4 h-4" /> Trang chủ
              </Link>
              <span className="mx-3 opacity-30">/</span>
              <span className="text-green-700 font-bold">Đơn hàng của tôi</span>
            </div>
          </div>
        </section>

        <div className="container mx-auto px-4 lg:px-8 py-6 pb-20 max-w-6xl">
          {/* Bộ lọc đơn hàng */}
          <div className="bg-white rounded-[2rem] shadow-[0_20px_60px_rgba(0,0,0,0.04)] border border-slate-50 p-4 md:p-6 mb-8">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2 uppercase tracking-wider mb-4">
              <Filter className="w-5 h-5 text-green-600" />
              Lọc trạng thái
            </h2>

            {/* Chỉnh sửa Responsive: Hiển thị trọn vẹn 1 hàng trên mọi thiết bị */}
            <div className="flex w-full justify-between gap-1 sm:gap-2">
              {[
                "all",
                "pending",
                "processing",
                "shipping",
                "delivered",
                "completed",
                "cancelled",
              ].map((s) => (
                <button
                  key={s}
                  onClick={() => setFilterStatus(s)}
                  className={`flex-1 flex flex-col lg:flex-row items-center justify-center gap-1.5 lg:gap-2 py-2 md:py-3 px-1 sm:px-2 rounded-xl transition-all duration-300 ${
                    filterStatus === s
                      ? "bg-slate-900 text-white shadow-lg"
                      : "bg-slate-50 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                  }`}
                >
                  <div className="flex items-center justify-center">
                    {s === "all" ? (
                      <Package className="w-5 h-5 md:w-4 md:h-4" />
                    ) : (
                      statusFormat[s]?.icon
                    )}
                  </div>

                  <span className="text-[9px] sm:text-xs md:text-sm font-bold text-center leading-tight line-clamp-2 lg:line-clamp-1">
                    {s === "all" ? "Tất cả" : statusFormat[s]?.text}
                  </span>

                  <span
                    className={`hidden xl:inline-flex items-center justify-center px-2 py-0.5 rounded-lg text-xs font-bold ${
                      filterStatus === s
                        ? "bg-white/20 text-white"
                        : "bg-slate-200 text-slate-600"
                    }`}
                  >
                    {s === "all"
                      ? orders.length
                      : orders.filter((o) => o.status === s).length}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Danh sách đơn hàng */}
          {filteredOrders.length === 0 ? (
            <div className="bg-white rounded-[2.5rem] p-12 text-center shadow-[0_30px_80px_rgba(0,0,0,0.06)] border border-slate-50">
              <div className="w-24 h-24 bg-slate-50 text-slate-400 rounded-[2rem] flex items-center justify-center mx-auto mb-6">
                <Package className="h-10 w-10" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">
                {filterStatus === "all"
                  ? "Bạn chưa có đơn hàng nào"
                  : `Không có đơn hàng ${statusFormat[filterStatus]?.text?.toLowerCase()}`}
              </h2>
              <p className="text-slate-500 font-medium mb-8">
                Hãy bắt đầu lựa chọn những trái cây tươi ngon nhất cho mình nhé!
              </p>
              <Link
                to="/products"
                className="inline-flex items-center gap-2 px-8 py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-green-700 transition-colors active:scale-95 shadow-lg"
              >
                <ShoppingBag className="w-5 h-5" /> Mua sắm ngay
              </Link>
            </div>
          ) : (
            <div className="space-y-6">
              {filteredOrders.map((order) => {
                const st =
                  statusFormat[order.status] || statusFormat["pending"];
                const paymentInfo = getPaymentMethod(order.paymentStatus);
                const canCancel =
                  order.status === "pending" || order.status === "processing";

                return (
                  <div
                    key={order.id}
                    className="bg-white rounded-[2rem] shadow-[0_10px_40px_rgba(0,0,0,0.04)] border border-slate-50 overflow-hidden hover:shadow-[0_20px_60px_rgba(22,101,52,0.08)] transition-all duration-500"
                  >
                    {/* ORDER HEADER */}
                    <div className="bg-slate-50/50 p-6 border-b border-slate-100 flex flex-col md:flex-row justify-between gap-4">
                      <div>
                        <div className="flex flex-wrap items-center gap-3 mb-3">
                          <Link
                            to={`/orders/${order.id}`}
                            className="text-xl font-black text-slate-900 hover:text-green-600 transition-colors flex items-center gap-2"
                          >
                            Đơn hàng #{order.code}{" "}
                            <Eye className="w-4 h-4 text-slate-400" />
                          </Link>
                          <span
                            className={`${st.bg} ${st.color} px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 uppercase tracking-wider`}
                          >
                            {st.icon} {st.text}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-4 text-sm font-medium text-slate-500">
                          <span className="flex items-center gap-1.5">
                            <Calendar className="w-4 h-4" />
                            Ngày đặt:{" "}
                            {new Date(order.createdAt).toLocaleDateString(
                              "vi-VN",
                            )}
                          </span>
                          <span className="hidden sm:inline text-slate-300">
                            |
                          </span>
                          <span
                            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md ${paymentInfo.bg} ${paymentInfo.color}`}
                          >
                            <CreditCard className="w-4 h-4" />{" "}
                            {paymentInfo.text}
                          </span>
                        </div>
                      </div>
                      <div className="md:text-right">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                          Tổng thanh toán
                        </p>
                        <p className="text-2xl font-black text-green-600">
                          {order.finalPrice.toLocaleString()} đ
                        </p>
                      </div>
                    </div>

                    {/* ORDER ITEMS */}
                    <div className="p-6">
                      <div className="space-y-4">
                        {order.items.slice(0, 2).map((i) => (
                          <div
                            key={i.productId}
                            className="flex items-center gap-4 p-3 rounded-2xl border border-slate-100 hover:border-green-200 transition-colors bg-white"
                          >
                            <Link
                              to={`/products/${i.productId}`}
                              className="shrink-0 w-20 h-20 rounded-xl overflow-hidden bg-slate-50"
                            >
                              <img
                                src={i.thumbnail || ""}
                                className="w-full h-full object-cover hover:scale-110 transition-transform duration-500"
                                alt="product"
                              />
                            </Link>
                            <div className="flex-1 min-w-0">
                              <Link
                                to={`/products/${i.productId}`}
                                className="font-bold text-slate-900 text-lg hover:text-green-600 transition-colors block truncate"
                              >
                                {i.productTitle}
                              </Link>
                              <div className="flex flex-wrap items-center gap-3 mt-2">
                                <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded-md">
                                  Số lượng: {i.quantity}
                                </span>
                                <span className="text-slate-500 font-medium text-sm">
                                  {i.price.toLocaleString()} đ / sp
                                </span>
                              </div>
                            </div>
                            <div className="text-right hidden sm:block">
                              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                                Thành tiền
                              </p>
                              <p className="font-black text-slate-900">
                                {(i.quantity * i.price).toLocaleString()} đ
                              </p>
                            </div>
                          </div>
                        ))}
                        {order.items.length > 2 && (
                          <div className="text-center">
                            <Link
                              to={`/orders/${order.id}`}
                              className="inline-block text-sm font-bold text-green-600 bg-green-50 px-4 py-2 rounded-xl hover:bg-green-100 transition-colors"
                            >
                              Xem thêm {order.items.length - 2} sản phẩm khác
                            </Link>
                          </div>
                        )}
                      </div>

                      {/* REVIEW SECTION (Nếu đơn hàng đã hoàn tất) */}
                      {order.status === "completed" && (
                        <div className="mt-6 border-t border-slate-100 pt-6">
                          <button
                            onClick={() =>
                              setReviewingOrderId(
                                reviewingOrderId === order.id ? null : order.id,
                              )
                            }
                            className="px-6 py-3 bg-yellow-50 hover:bg-yellow-100 text-yellow-700 rounded-xl flex items-center justify-center gap-2 font-bold transition-colors w-full sm:w-auto"
                          >
                            <Star className="w-5 h-5 fill-yellow-500 text-yellow-500" />{" "}
                            Đánh giá sản phẩm
                          </button>

                          {reviewingOrderId === order.id && (
                            <div className="mt-6 space-y-4 bg-slate-50 p-6 rounded-2xl border border-slate-200 animate-in fade-in slide-in-from-top-4">
                              <h4 className="font-bold text-slate-800 uppercase tracking-wider text-sm mb-4">
                                Viết đánh giá của bạn
                              </h4>
                              {order.items.map((item) =>
                                item._reviewed ? (
                                  <div
                                    key={item.productId}
                                    className="p-4 border border-green-200 rounded-2xl bg-green-50/50 flex flex-col sm:flex-row items-start sm:items-center gap-4"
                                  >
                                    <img
                                      src={item.thumbnail || ""}
                                      className="w-16 h-16 rounded-xl object-cover border border-slate-200 bg-white"
                                      alt="product"
                                    />
                                    <div>
                                      <p className="font-bold text-slate-900 mb-1">
                                        {item.productTitle}
                                      </p>
                                      <p className="text-sm font-bold text-green-600 flex items-center gap-1.5">
                                        <CheckCircle className="w-4 h-4" /> Bạn
                                        đã đánh giá sản phẩm này
                                      </p>
                                    </div>
                                  </div>
                                ) : (
                                  <div
                                    key={item.productId}
                                    className="border border-slate-200 p-4 sm:p-6 rounded-2xl bg-white shadow-sm"
                                  >
                                    <div className="flex items-center gap-4 mb-4">
                                      <img
                                        src={item.thumbnail || ""}
                                        className="w-14 h-14 rounded-xl object-cover bg-slate-50 border border-slate-100"
                                        alt="product"
                                      />
                                      <p className="font-bold text-slate-900">
                                        {item.productTitle}
                                      </p>
                                    </div>

                                    <div className="flex gap-1.5 mb-4">
                                      {[1, 2, 3, 4, 5].map((n) => (
                                        <Star
                                          key={n}
                                          className={`w-8 h-8 cursor-pointer transition-colors ${
                                            reviewsData[item.productId]
                                              ?.rating >= n
                                              ? "text-yellow-500 fill-yellow-400"
                                              : "text-slate-200 hover:text-yellow-300"
                                          }`}
                                          onClick={() =>
                                            updateReviewData(
                                              item.productId,
                                              "rating",
                                              n,
                                            )
                                          }
                                        />
                                      ))}
                                    </div>

                                    <textarea
                                      rows={3}
                                      className="w-full border border-slate-200 p-4 rounded-2xl focus:outline-none focus:ring-4 focus:ring-green-500/10 focus:border-green-500 transition-all font-medium resize-none bg-slate-50 focus:bg-white"
                                      placeholder="Hãy chia sẻ cảm nhận của bạn về độ tươi ngon của sản phẩm nhé..."
                                      value={
                                        reviewsData[item.productId]?.content ||
                                        ""
                                      }
                                      onChange={(e) =>
                                        updateReviewData(
                                          item.productId,
                                          "content",
                                          e.target.value,
                                        )
                                      }
                                    />

                                    <div className="mt-4 text-right">
                                      <button
                                        disabled={
                                          submittingReviewId === item.productId
                                        }
                                        onClick={() =>
                                          submitSingleReview(
                                            order.id,
                                            item.productId,
                                          )
                                        }
                                        className="px-8 py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-green-700 disabled:opacity-50 transition-all shadow-md active:scale-95"
                                      >
                                        {submittingReviewId ===
                                        item.productId ? (
                                          <span className="flex items-center gap-2">
                                            <RefreshCw className="w-4 h-4 animate-spin" />{" "}
                                            Đang gửi...
                                          </span>
                                        ) : (
                                          "Gửi đánh giá"
                                        )}
                                      </button>
                                    </div>
                                  </div>
                                ),
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* ORDER FOOTER ACTIONS */}
                    <div className="bg-slate-50 px-6 py-4 flex flex-col sm:flex-row justify-between items-center gap-4 border-t border-slate-100">
                      <Link
                        to={`/orders/${order.id}`}
                        className="text-slate-700 font-bold hover:text-green-600 flex items-center gap-1.5 transition-colors"
                      >
                        <Eye className="w-4 h-4" /> Xem chi tiết đơn hàng
                      </Link>

                      <div className="flex flex-wrap gap-3 w-full sm:w-auto">
                        {canCancel && (
                          <button
                            disabled={isCancelling === order.id}
                            onClick={() => handleCancelOrder(order.id)}
                            className="flex-1 sm:flex-none px-6 py-3 bg-white border border-red-200 text-red-600 font-bold rounded-xl hover:bg-red-50 disabled:opacity-50 transition-colors flex items-center justify-center gap-2 shadow-sm"
                          >
                            {isCancelling === order.id ? (
                              <>
                                <RefreshCw className="w-4 h-4 animate-spin" />{" "}
                                Đang hủy...
                              </>
                            ) : (
                              <>
                                <XCircle className="w-4 h-4" /> Hủy đơn
                              </>
                            )}
                          </button>
                        )}

                        {order.items && order.items.length > 0 ? (
                          <Link
                            to={`/products/${order.items[0].productId}`}
                            className="flex-1 sm:flex-none px-6 py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-green-700 transition-colors flex items-center justify-center gap-2 shadow-sm"
                          >
                            <ShoppingBag className="w-4 h-4" /> Mua lại
                          </Link>
                        ) : (
                          <Link
                            to="/products"
                            className="flex-1 sm:flex-none px-6 py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-green-700 transition-colors flex items-center justify-center gap-2 shadow-sm"
                          >
                            <ShoppingBag className="w-4 h-4" /> Mua sắm
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </Layout>
      <Footer />
    </div>
  );
};

export default OrderHistoryPage;
