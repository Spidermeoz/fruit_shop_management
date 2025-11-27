import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Layout from "../../../components/client/layout/Layout";
import { http } from "../../../services/http";
import {
  Package,
  Calendar,
  MapPin,
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
  ArrowRight,
} from "lucide-react";

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
  const [refreshing, setRefreshing] = useState(false);
  const [reviewingOrderId, setReviewingOrderId] = useState<number | null>(null);
  const [reviewsData, setReviewsData] = useState<any>({});
  const [submittingReview, setSubmittingReview] = useState(false);

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

      // === CHECK REVIEW FOR EACH ORDER ITEM ===
      const extendedOrders = [];

      for (const ord of result) {
        const newItems = [];

        for (const item of ord.items) {
          // gọi API check review
          const check = await http(
            "GET",
            `/api/v1/client/reviews/check?orderId=${ord.id}&productId=${item.productId}`
          );

          const reviewed = check?.success ? check.reviewed : false;

          newItems.push({
            ...item,
            _reviewed: reviewed, // thêm flag đánh giá vào item
          });
        }

        extendedOrders.push({
          ...ord,
          items: newItems, // gán lại list item có flag _reviewed
        });
      }

      setOrders(extendedOrders);
    } catch (err) {
      console.error("Order load error:", err);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
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

        // Reload danh sách để cập nhật trạng thái
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
    {
      text: string;
      bg: string;
      color: string;
      icon: React.ReactNode;
    }
  > = {
    pending: {
      text: "Chờ xác nhận",
      bg: "bg-yellow-100",
      color: "text-yellow-700",
      icon: <Clock className="w-4 h-4" />,
    },
    processing: {
      text: "Đang xử lý",
      bg: "bg-blue-100",
      color: "text-blue-700",
      icon: <Package className="w-4 h-4" />,
    },
    shipping: {
      text: "Đang giao hàng",
      bg: "bg-purple-100",
      color: "text-purple-700",
      icon: <Truck className="w-4 h-4" />,
    },
    delivered: {
      text: "Đã giao hàng",
      bg: "bg-green-100",
      color: "text-green-700",
      icon: <CheckCircle className="w-4 h-4" />,
    },
    completed: {
      text: "Hoàn tất",
      bg: "bg-green-200",
      color: "text-green-800",
      icon: <CheckCircle className="w-4 h-4" />,
    },
    cancelled: {
      text: "Đã hủy",
      bg: "bg-red-100",
      color: "text-red-700",
      icon: <XCircle className="w-4 h-4" />,
    },
  };

  const getPaymentMethod = (s?: string) => {
    switch (s) {
      case "paid":
        return { text: "Đã thanh toán", color: "text-green-600" };
      case "unpaid":
        return {
          text: "Thanh toán khi nhận hàng (COD)",
          color: "text-gray-600",
        };
      default:
        return { text: "Không rõ", color: "text-gray-600" };
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

  const submitReviews = async (order: Order) => {
    try {
      setSubmittingReview(true);

      const products = order.items;

      for (const p of products) {
        const rd = reviewsData[p.productId];
        if (!rd || !rd.rating || !rd.content?.trim()) continue;

        await http("POST", "/api/v1/client/reviews", {
          productId: p.productId,
          orderId: order.id,
          rating: rd.rating,
          content: rd.content,
        });
      }

      alert("Đánh giá thành công!");

      // === GỌI LẠI LOAD ORDERS ĐỂ CẬP NHẬT TRẠNG THÁI ===
      await loadOrders();

      setReviewingOrderId(null);
      setReviewsData({});
    } catch (err) {
      console.error(err);
      alert("Lỗi khi gửi đánh giá.");
    } finally {
      setSubmittingReview(false);
    }
  };

  // =============================
  // LOADING
  // =============================
  if (isLoading) {
    return (
      <Layout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="h-12 w-12 border-b-2 border-green-600 rounded-full animate-spin"></div>
        </div>
      </Layout>
    );
  }

  // =============================
  // RENDER
  // =============================
  return (
    <Layout>
      {/* HEADER */}
      <section className="bg-gradient-to-r from-green-100 to-yellow-100 py-8 text-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-4 left-10 w-16 h-16 bg-yellow-300 rounded-full animate-pulse"></div>
          <div className="absolute bottom-4 right-10 w-12 h-12 bg-green-400 rounded-full animate-pulse"></div>
        </div>
        <div className="relative z-10">
          <h1 className="text-4xl font-bold text-green-800 flex items-center justify-center gap-2">
            <Package className="w-10 h-10" />
            Lịch sử đơn hàng
          </h1>
          <p className="text-gray-700">Xem lại các đơn hàng đã mua</p>
        </div>
      </section>

      <div className="container mx-auto px-6 py-10">
        {/* FILTER */}
        <div className="bg-white rounded-2xl shadow-md p-6 mb-10">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
            <h2 className="text-xl font-semibold text-green-800 flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Bộ lọc đơn hàng
            </h2>

            <button
              onClick={() => {
                setRefreshing(true);
                loadOrders();
              }}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
              disabled={refreshing}
            >
              <RefreshCw
                className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`}
              />
              Làm mới
            </button>
          </div>

          <div className="flex flex-wrap gap-3">
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
                className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center gap-2 ${
                  filterStatus === s
                    ? "bg-green-600 text-white shadow-md"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {s === "all" ? (
                  <>
                    <Package className="w-4 h-4" />
                    Tất cả
                  </>
                ) : (
                  <>
                    {statusFormat[s]?.icon}
                    {statusFormat[s]?.text || s}
                  </>
                )}
                <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs">
                  {s === "all"
                    ? orders.length
                    : orders.filter((o) => o.status === s).length}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* EMPTY */}
        {filteredOrders.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl shadow-md">
            <Package className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h2 className="text-xl text-gray-700 mb-4">
              {filterStatus === "all"
                ? "Bạn chưa có đơn hàng nào"
                : `Không có đơn hàng ${statusFormat[
                    filterStatus
                  ]?.text?.toLowerCase()}`}
            </h2>
            <Link
              to="/products"
              className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
            >
              <ShoppingBag className="w-5 h-5" />
              Mua sắm ngay
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredOrders.map((order) => {
              const st = statusFormat[order.status] || statusFormat["pending"];
              const paymentInfo = getPaymentMethod(order.paymentStatus);

              const canCancel =
                order.status === "pending" || order.status === "processing";

              return (
                <div
                  key={order.id}
                  className="bg-white rounded-2xl shadow-md overflow-hidden hover:shadow-lg transition-all duration-300"
                >
                  {/* TOP */}
                  <div className="bg-gradient-to-r from-green-50 to-blue-50 p-6">
                    <div className="flex flex-col md:flex-row justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <h3
                            className="text-xl font-bold text-green-800 cursor-pointer hover:text-green-600 transition flex items-center gap-2"
                            onClick={() =>
                              (window.location.href = `/orders/${order.id}`)
                            }
                          >
                            Đơn hàng #{order.code}
                            <Eye className="w-4 h-4" />
                          </h3>
                          <span
                            className={`${st.bg} ${st.color} px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1`}
                          >
                            {st.icon}
                            {st.text}
                          </span>
                        </div>

                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            <span>
                              Ngày đặt:{" "}
                              {new Date(order.createdAt).toLocaleDateString(
                                "vi-VN"
                              )}
                            </span>
                          </div>

                          <div className="flex items-center gap-1">
                            <CreditCard className="w-4 h-4" />
                            <span className={paymentInfo.color}>
                              {paymentInfo.text}
                            </span>
                          </div>
                        </div>

                        {order.address && (
                          <div className="flex items-start gap-1 mt-2 text-sm text-gray-600">
                            <MapPin className="w-4 h-4 mt-0.5" />
                            <span>
                              {order.address.address_line1},{" "}
                              {order.address.ward}, {order.address.district},{" "}
                              {order.address.province}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="text-right">
                        <p className="text-sm text-gray-600">Tổng cộng:</p>
                        <p className="text-2xl font-bold text-green-700">
                          {order.finalPrice.toLocaleString()} đ
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* ITEMS */}
                  <div className="p-6">
                    <h4 className="font-semibold text-gray-800 mb-3">
                      Sản phẩm trong đơn
                    </h4>
                    <div className="space-y-3">
                      {order.items.slice(0, 2).map((i) => (
                        <Link
                          key={i.productId}
                          to={`/products/${i.productId}`}
                          className="flex items-center gap-3 pb-3 border-b last:border-0 hover:bg-gray-50 p-2 rounded transition cursor-pointer"
                        >
                          <img
                            src={i.thumbnail || ""}
                            className="w-16 h-16 rounded-lg object-cover bg-gray-100"
                          />

                          <div className="flex-1">
                            <h4 className="font-medium text-gray-800 hover:text-green-600 transition">
                              {i.productTitle}
                            </h4>
                            <p className="text-sm text-gray-600">
                              x{i.quantity}
                            </p>
                          </div>

                          <p className="font-medium text-green-700">
                            {(i.quantity * i.price).toLocaleString()} đ
                          </p>
                        </Link>
                      ))}

                      {order.items.length > 2 && (
                        <div className="text-center text-sm text-gray-500 pt-2">
                          và {order.items.length - 2} sản phẩm khác
                        </div>
                      )}
                    </div>
                  </div>

                  {/* REVIEW FORM */}
                  {order.status === "completed" && (
                    <div className="border-t border-gray-200 pt-4 mt-4">
                      <button
                        onClick={() =>
                          setReviewingOrderId(
                            reviewingOrderId === order.id ? null : order.id
                          )
                        }
                        className="px-4 py-2 bg-yellow-100 hover:bg-yellow-200 text-yellow-800 rounded-lg flex items-center gap-2 font-medium"
                      >
                        ⭐ Đánh giá sản phẩm
                      </button>

                      {reviewingOrderId === order.id && (
                        <div className="mt-4 space-y-6 bg-gray-50 p-4 rounded-xl">
                          {order.items.map((item) =>
                            item._reviewed ? (
                              // ===== SẢN PHẨM ĐÃ ĐƯỢC ĐÁNH GIÁ =====
                              <div
                                key={item.productId}
                                className="p-3 border rounded-lg bg-gray-100 text-gray-600 flex items-center gap-3"
                              >
                                <img
                                  src={item.thumbnail || ""}
                                  className="w-14 h-14 rounded-lg object-cover bg-gray-200"
                                />
                                <div>
                                  <p className="font-semibold text-gray-700">
                                    {item.productTitle}
                                  </p>
                                  <p className="text-sm mt-1 flex items-center gap-1">
                                    <Star className="w-4 h-4 text-yellow-500 fill-yellow-400" />
                                    Bạn đã đánh giá sản phẩm này
                                  </p>
                                </div>
                              </div>
                            ) : (
                              // ===== SẢN PHẨM CHƯA ĐƯỢC ĐÁNH GIÁ → FORM REVIEW =====
                              <div
                                key={item.productId}
                                className="border p-3 rounded-lg bg-white"
                              >
                                {/* Tên + Ảnh */}
                                <div className="flex items-center gap-3 mb-3">
                                  <Link
                                    to={`/products/${item.productId}`}
                                    className="flex items-center gap-3"
                                  >
                                    <img
                                      src={item.thumbnail || ""}
                                      className="w-14 h-14 rounded-lg object-cover bg-gray-200 hover:opacity-80 transition"
                                    />
                                    <p className="font-semibold text-gray-800 hover:text-green-600 transition">
                                      {item.productTitle}
                                    </p>
                                  </Link>
                                </div>

                                {/* Rating */}
                                <div className="flex gap-1 mb-3">
                                  {[1, 2, 3, 4, 5].map((n) => (
                                    <Star
                                      key={n}
                                      className={`w-6 h-6 cursor-pointer ${
                                        reviewsData[item.productId]?.rating >= n
                                          ? "text-yellow-500 fill-yellow-400"
                                          : "text-gray-300"
                                      }`}
                                      onClick={() =>
                                        updateReviewData(
                                          item.productId,
                                          "rating",
                                          n
                                        )
                                      }
                                    />
                                  ))}
                                </div>

                                {/* Nội dung */}
                                <textarea
                                  rows={3}
                                  className="w-full border p-2 rounded-lg focus:ring-green-500 focus:border-green-500"
                                  placeholder="Viết cảm nhận của bạn..."
                                  value={
                                    reviewsData[item.productId]?.content || ""
                                  }
                                  onChange={(e) =>
                                    updateReviewData(
                                      item.productId,
                                      "content",
                                      e.target.value
                                    )
                                  }
                                />

                                <button
                                  disabled={submittingReview}
                                  onClick={() => submitReviews(order)}
                                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                                >
                                  {submittingReview
                                    ? "Đang gửi..."
                                    : "Gửi đánh giá"}
                                </button>
                              </div>
                            )
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* ACTIONS */}
                  <div className="bg-gray-50 px-6 py-4 flex flex-col sm:flex-row justify-between items-center gap-4">
                    <Link
                      to={`/orders/${order.id}`}
                      className="text-green-600 hover:text-green-800 font-medium flex items-center gap-1 transition"
                    >
                      <Eye className="w-4 h-4" />
                      Xem chi tiết
                      <ArrowRight className="w-4 h-4" />
                    </Link>

                    <div className="flex gap-3">
                      {/* CANCEL ORDER */}
                      {canCancel && (
                        <button
                          disabled={isCancelling === order.id}
                          onClick={() => handleCancelOrder(order.id)}
                          className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 transition flex items-center gap-2"
                        >
                          {isCancelling === order.id ? (
                            <>
                              <RefreshCw className="w-4 h-4 animate-spin" />
                              Đang hủy...
                            </>
                          ) : (
                            <>
                              <XCircle className="w-4 h-4" />
                              Hủy đơn hàng
                            </>
                          )}
                        </button>
                      )}

                      {/* MUA LẠI */}
                      <Link
                        to="/products"
                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition flex items-center gap-2"
                      >
                        <ShoppingBag className="w-4 h-4" />
                        Mua lại
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default OrderHistoryPage;
