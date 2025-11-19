import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Layout from "../../../components/client/layout/Layout";
import { http } from "../../../services/http";

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
        };

      case "processing":
        return {
          text: "Đang xử lý",
          bg: "bg-blue-100",
          color: "text-blue-700",
        };

      case "shipping":
        return {
          text: "Đang giao hàng",
          bg: "bg-purple-100",
          color: "text-purple-700",
        };

      case "delivered":
        return {
          text: "Đã giao hàng",
          bg: "bg-green-100",
          color: "text-green-700",
        };

      case "completed":
        return {
          text: "Hoàn tất",
          bg: "bg-green-200",
          color: "text-green-800",
        };

      case "cancelled":
        return {
          text: "Đã hủy",
          bg: "bg-red-100",
          color: "text-red-700",
        };

      default:
        return {
          text: "Không xác định",
          bg: "bg-gray-100",
          color: "text-gray-700",
        };
    }
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
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-green-800">
                Đơn hàng #{order.code}
              </h2>
              <p className="text-gray-600">
                Ngày đặt: {new Date(order.createdAt).toLocaleString()}
              </p>
            </div>

            <span
              className={`px-4 py-1 rounded-full ${statusUI.bg} ${statusUI.color}`}
            >
              {statusUI.text}
            </span>
          </div>
        </div>

        {/* TABS */}
        <div className="bg-white rounded-2xl shadow overflow-hidden mb-8">
          <div className="border-b flex">
            <button
              onClick={() => setActiveTab("details")}
              className={`px-6 py-4 border-b-2 ${
                activeTab === "details"
                  ? "border-green-600 text-green-600"
                  : "border-transparent text-gray-600"
              }`}
            >
              Chi tiết
            </button>
            <button
              onClick={() => setActiveTab("items")}
              className={`px-6 py-4 border-b-2 ${
                activeTab === "items"
                  ? "border-green-600 text-green-600"
                  : "border-transparent text-gray-600"
              }`}
            >
              Sản phẩm
            </button>
          </div>

          {/* TAB CONTENT */}
          <div className="p-6">
            {/* DETAILS */}
            {activeTab === "details" && (
              <div className="space-y-6">
                {/* CUSTOMER */}
                <div>
                  <h3 className="font-semibold text-gray-800 mb-3">
                    Thông tin nhận hàng
                  </h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    {order.address ? (
                      <div className="space-y-1 text-sm">
                        <p>
                          <strong>Họ tên:</strong> {order.address.fullName}
                        </p>
                        <p>
                          <strong>SĐT:</strong> {order.address.phone}
                        </p>
                        <p>
                          <strong>Địa chỉ:</strong> {order.address.addressLine1}
                          , {order.address.ward}, {order.address.district},{" "}
                          {order.address.province}
                        </p>
                      </div>
                    ) : (
                      <p className="text-gray-600">Không có thông tin</p>
                    )}
                  </div>
                </div>

                {/* PRICE */}
                <div>
                  <h3 className="font-semibold text-gray-800 mb-3">
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
                      <span>{order.finalPrice.toLocaleString()} đ</span>
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
                      src={item.thumbnail || ""}
                      className="w-20 h-20 rounded-lg object-cover"
                    />
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-800">
                        {item.productTitle}
                      </h4>
                      <p className="text-sm text-gray-600">x{item.quantity}</p>
                    </div>

                    <p className="font-medium text-green-700">
                      {(item.price * item.quantity).toLocaleString()} đ
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ACTIONS */}
        <div className="text-center">
          <Link
            to="/orders"
            className="px-6 py-3 border rounded-lg text-gray-700"
          >
            Quay lại lịch sử đơn hàng
          </Link>
        </div>
      </div>
    </Layout>
  );
};

export default OrderDetailPage;
