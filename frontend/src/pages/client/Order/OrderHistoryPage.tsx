import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Layout from "../../../components/client/layout/Layout";
import { http } from "../../../services/http";

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

  // =============================
  // LOAD ORDERS FROM API
  // =============================
  const loadOrders = async () => {
    try {
      const res = await http("GET", "/api/v1/client/orders");

      if (res.success && res.data) {
        if (res.data.rows) setOrders(res.data.rows);
        else if (Array.isArray(res.data))
          setOrders(res.data.map((o: any) => o.props));
      }
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
    { text: string; bg: string; color: string }
  > = {
    pending: {
      text: "Chờ xác nhận",
      bg: "bg-yellow-100",
      color: "text-yellow-700",
    },
    processing: {
      text: "Đang xử lý",
      bg: "bg-blue-100",
      color: "text-blue-700",
    },
    shipping: {
      text: "Đang giao hàng",
      bg: "bg-purple-100",
      color: "text-purple-700",
    },
    delivered: {
      text: "Đã giao hàng",
      bg: "bg-green-100",
      color: "text-green-700",
    },
    cancelled: { text: "Đã hủy", bg: "bg-red-100", color: "text-red-700" },
  };

  const getPaymentMethod = (s?: string) => {
    switch (s) {
      case "paid":
        return "Đã thanh toán";
      case "unpaid":
        return "Thanh toán khi nhận hàng (COD)";
      default:
        return "Không rõ";
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
      <section className="bg-gradient-to-r from-green-100 to-yellow-100 py-8 text-center">
        <h1 className="text-4xl font-bold text-green-800">Lịch sử đơn hàng</h1>
        <p className="text-gray-700">Xem lại các đơn hàng đã mua</p>
      </section>

      <div className="container mx-auto px-6 py-10">
        {/* FILTER */}
        <div className="bg-white rounded-2xl shadow p-6 mb-10">
          <h2 className="text-xl font-semibold text-green-800 mb-4">
            Bộ lọc đơn hàng
          </h2>

          <div className="flex flex-wrap gap-3">
            {[
              "all",
              "pending",
              "processing",
              "shipping",
              "delivered",
              "cancelled",
            ].map((s) => (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  filterStatus === s
                    ? "bg-green-600 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {s === "all" ? "Tất cả" : statusFormat[s]?.text || s} (
                {s === "all"
                  ? orders.length
                  : orders.filter((o) => o.status === s).length}
                )
              </button>
            ))}
          </div>
        </div>

        {/* EMPTY */}
        {filteredOrders.length === 0 ? (
          <div className="text-center py-20">
            <h2 className="text-xl text-gray-700 mb-4">Không có đơn hàng</h2>
            <Link
              to="/products"
              className="px-6 py-3 bg-green-600 text-white rounded-lg"
            >
              Mua sắm ngay
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredOrders.map((order) => {
              const st = statusFormat[order.status] || statusFormat["pending"];

              const canCancel =
                order.status === "pending" || order.status === "processing";

              return (
                <div key={order.id} className="bg-white rounded-2xl shadow p-6">
                  {/* TOP */}
                  <div className="flex flex-col md:flex-row justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-bold text-green-800">
                          Đơn hàng #{order.code}
                        </h3>
                        <span
                          className={`${st.bg} ${st.color} px-3 py-1 rounded-full text-sm font-medium`}
                        >
                          {st.text}
                        </span>
                      </div>

                      <p className="text-gray-600">
                        Ngày đặt:{" "}
                        {new Date(order.createdAt).toLocaleString("vi-VN")}
                      </p>

                      {order.address && (
                        <p className="text-gray-600 mt-1">
                          Giao đến: {order.address.address_line1},{" "}
                          {order.address.ward}, {order.address.district},{" "}
                          {order.address.province}
                        </p>
                      )}

                      <p className="text-gray-600 mt-1">
                        Thanh toán: {getPaymentMethod(order.paymentStatus)}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="text-gray-600">Tổng cộng:</p>
                      <p className="text-2xl font-bold text-green-700">
                        {order.finalPrice.toLocaleString()} đ
                      </p>
                    </div>
                  </div>

                  {/* ITEMS */}
                  <div className="mt-6 space-y-3">
                    {order.items.map((i) => (
                      <div
                        key={i.productId}
                        className="flex items-center gap-3 pb-3 border-b last:border-0"
                      >
                        <img
                          src={i.thumbnail || ""}
                          className="w-16 h-16 rounded-lg object-cover bg-gray-100"
                        />

                        <div className="flex-1">
                          <h4 className="font-medium">{i.productTitle}</h4>
                          <p className="text-sm text-gray-600">x{i.quantity}</p>
                        </div>

                        <p className="font-medium text-green-700">
                          {(i.quantity * i.price).toLocaleString()} đ
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* ACTIONS */}
                  <div className="flex justify-between items-center mt-6 pt-6 border-t">
                    <Link
                      to={`/orders/${order.id}`}
                      className="text-green-600 hover:underline"
                    >
                      Xem chi tiết →
                    </Link>

                    <div className="flex gap-3">
                      {/* CANCEL ORDER */}
                      {canCancel && (
                        <button
                          disabled={isCancelling === order.id}
                          onClick={() => handleCancelOrder(order.id)}
                          className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50"
                        >
                          {isCancelling === order.id
                            ? "Đang hủy..."
                            : "Hủy đơn hàng"}
                        </button>
                      )}

                      {/* MUA LẠI */}
                      <Link
                        to="/products"
                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                      >
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
