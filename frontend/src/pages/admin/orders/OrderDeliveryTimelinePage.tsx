import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2, CheckCircle, Clock } from "lucide-react";
import Card from "../../../components/layouts/Card";
import { http } from "../../../services/http";

interface DeliveryItem {
  id: number;
  status: string;
  note: string | null;
  location: string | null;
  createdAt: string;
}

interface OrderDetail {
  id: number;
  code: string;
  deliveryHistory: DeliveryItem[];
}

const statusLabels: Record<string, string> = {
  pending: "Chờ duyệt",
  processing: "Đang xử lý",
  shipping: "Đang giao",
  delivered: "Đã giao",
  completed: "Hoàn thành",
  cancelled: "Đã hủy",
};

const statusColors: Record<string, string> = {
  pending: "text-gray-500",
  processing: "text-blue-600",
  shipping: "text-purple-600",
  delivered: "text-green-600",
  completed: "text-green-600",
  cancelled: "text-red-600",
};

const OrderDeliveryTimelinePage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchDetail = async () => {
    try {
      setLoading(true);
      const res = await http("GET", `/api/v1/admin/orders/detail/${id}`);

      if (res.success) {
        setOrder(res.data);
      }
    } catch (err) {
      console.error(err);
      alert("Không thể tải lịch sử giao hàng!");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[70vh]">
        <Loader2 className="animate-spin w-6 h-6 text-gray-500" />
      </div>
    );
  }

  if (!order) return null;

  return (
    <div className="p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
          Lịch sử giao hàng
        </h1>

        <button
          onClick={() => navigate(`/admin/orders/detail/${order.id}`)}
          className="flex items-center gap-2 px-4 py-2 text-sm bg-gray-200 hover:bg-gray-300 rounded"
        >
          <ArrowLeft className="w-4 h-4" /> Quay lại chi tiết đơn
        </button>
      </div>

      <Card>
        <div className="p-6">
          <h2 className="text-lg font-semibold mb-4">
            Mã đơn: {order.code}
          </h2>

          {/* Timeline */}
          <div className="relative border-l-2 border-gray-300 ml-3">
            {order.deliveryHistory.length === 0 && (
              <p className="text-gray-500">Chưa có lịch sử giao hàng.</p>
            )}

            {order.deliveryHistory.map((log, index) => {
              const isLast = index === order.deliveryHistory.length - 1;

              return (
                <div key={log.id} className="mb-8 ml-4 relative">
                  {/* Dot */}
                  <div
                    className={`absolute -left-5 top-1 w-3 h-3 rounded-full bg-white border-2 ${
                      isLast
                        ? "border-green-600"
                        : "border-gray-400"
                    }`}
                  ></div>

                  {/* Icon */}
                  <div className="flex items-center gap-2">
                    {isLast ? (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    ) : (
                      <Clock className="w-5 h-5 text-gray-500" />
                    )}

                    <p
                      className={`font-medium ${
                        statusColors[log.status] || "text-gray-700"
                      }`}
                    >
                      {statusLabels[log.status] || log.status}
                    </p>
                  </div>

                  {/* Timestamp */}
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(log.createdAt).toLocaleString()}
                  </p>

                  {/* Note */}
                  {log.note && (
                    <p className="mt-2 text-gray-700 dark:text-gray-300 text-sm">
                      📝 {log.note}
                    </p>
                  )}

                  {/* Location */}
                  {log.location && (
                    <p className="text-sm text-gray-500">
                      📍 {log.location}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </Card>
    </div>
  );
};

export default OrderDeliveryTimelinePage;
