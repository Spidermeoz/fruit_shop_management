import React, { useEffect, useState } from "react";
import Card from "../../../components/layouts/Card";
import { Search, Eye, Loader2, Edit } from "lucide-react";
import { useSearchParams, useNavigate } from "react-router-dom";
import Pagination from "../../../components/common/Pagination";
import { http } from "../../../services/http";

// =======================
// 🟦 Kiểu dữ liệu Order
// =======================
interface OrderItem {
  productId: number | null;
  productTitle: string;
  price: number;
  quantity: number;
}

interface OrderProps {
  id: number;
  userId: number;
  code: string;
  status: string;
  paymentStatus: string;
  shippingFee: number;
  discountAmount: number;
  totalPrice: number;
  finalPrice: number;
  trackingToken?: string;
  createdAt: string;
  address: any;
  items: OrderItem[];
}

interface OrderWrapper {
  props: OrderProps;
}

const OrdersPage: React.FC = () => {
  const [orders, setOrders] = useState<OrderProps[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  const [searchParams, setSearchParams] = useSearchParams();
  const searchTerm = searchParams.get("q") || "";
  const statusFilter = searchParams.get("status") || "all";

  const navigate = useNavigate();

  const currentPage = Number(searchParams.get("page") || 1);
  const [totalPages, setTotalPages] = useState(1);

  // ============================
  // Modal cập nhật trạng thái
  // ============================
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<OrderProps | null>(null);

  const openUpdateStatusModal = (order: OrderProps) => {
    setSelectedOrder(order);
    setShowStatusModal(true);
  };

  // ============================
  // Modal Thanh toán COD
  // ============================
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState("");

  const openPaymentModal = (order: OrderProps) => {
    setSelectedOrder(order);
    setPaymentAmount(order.finalPrice.toString()); // gợi ý theo giá trị đơn
    setShowPaymentModal(true);
  };

  // Popup hỏi hoàn tất đơn hàng
  const [confirmCompleteModal, setConfirmCompleteModal] = useState(false);
  const [, setPendingNewStatus] = useState<string | null>(null);

  // Hàm gọi khi admin chọn "Đã giao"
  const requestChangeToDelivered = (order: OrderProps, newStatus: string) => {
    if (order.paymentStatus === "paid") {
      setPendingNewStatus(newStatus); // = delivered
      setConfirmCompleteModal(true);
    } else {
      // Nếu chưa thanh toán → cho đổi bình thường
      saveStatusChange(order, newStatus);
    }
  };

  // Hàm lưu thay đổi trạng thái
  const saveStatusChange = async (order: OrderProps, status: string) => {
    try {
      await http("PATCH", `/api/v1/admin/orders/${order.id}/status`, {
        status,
      });
      alert("Cập nhật trạng thái thành công!");
      setShowStatusModal(false);
      setConfirmCompleteModal(false);
      fetchOrders();
    } catch (err: any) {
      alert(err?.message || "Không thể cập nhật trạng thái");
    }
  };

  // ============================
  // Gọi API danh sách Orders
  // ============================
  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError("");

      let url = `/api/v1/admin/orders?page=${currentPage}&limit=10`;

      if (statusFilter !== "all") {
        url += `&status=${encodeURIComponent(statusFilter)}`;
      }

      if (searchTerm.trim()) {
        url += `&q=${encodeURIComponent(searchTerm.trim())}`;
      }

      const json = await http<any>("GET", url);

      if (json.success) {
        const mapped = json.data
          .map((item: OrderWrapper) => item.props)
          .filter(Boolean);

        setOrders(mapped);

        const total = Number(json.meta?.total ?? 1);
        const limit = Number(json.meta?.limit ?? 10);
        setTotalPages(Math.max(1, Math.ceil(total / limit)));
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Lỗi tải đơn hàng");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [statusFilter, currentPage, searchTerm]);

  const [searchInput, setSearchInput] = useState(searchTerm);

  useEffect(() => {
    const delay = setTimeout(() => {
      const params = new URLSearchParams(searchParams);
      if (searchInput.trim()) params.set("q", searchInput.trim());
      else params.delete("q");
      params.delete("page");
      setSearchParams(params);
    }, 500);

    return () => clearTimeout(delay);
  }, [searchInput]);

  const handleFilterChange = (status: string) => {
    const params = new URLSearchParams(searchParams);
    if (status === "all") params.delete("status");
    else params.set("status", status);
    params.delete("page");
    setSearchParams(params);
  };

  const statusLabels: Record<string, string> = {
    pending: "Chờ duyệt",
    processing: "Đang xử lý",
    shipping: "Đang giao",
    delivered: "Đã giao",
    completed: "Hoàn thành",
    cancelled: "Đã hủy",
  };

  const statusColors: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-800",
    processing: "bg-blue-100 text-blue-800",
    shipping: "bg-purple-100 text-purple-800",
    delivered: "bg-green-100 text-green-800",
    completed: "bg-green-100 text-green-800",
    cancelled: "bg-red-100 text-red-800",
  };

  return (
    <div>
      {/* ====================== */}
      {/* Header */}
      {/* ====================== */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
          Orders
        </h1>

        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Tìm kiếm mã đơn hàng..."
            className="w-full pl-10 pr-3 py-2 border rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </div>
      </div>

      {/* ====================== */}
      {/* Filter Status */}
      {/* ====================== */}
      <div className="flex gap-3 mb-4">
        {[
          ["all", "Tất cả"],
          ["pending", "Chờ duyệt"],
          ["processing", "Đang xử lý"],
          ["shipping", "Đang giao"],
          ["delivered", "Đã giao"],
          ["completed", "Hoàn thành"],
          ["cancelled", "Đã hủy"],
        ].map(([value, label]) => (
          <button
            key={value}
            onClick={() => handleFilterChange(value)}
            className={`px-4 py-2 rounded-md text-sm border ${
              statusFilter === value
                ? "bg-blue-600 text-white border-blue-600"
                : "bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 border-gray-300"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ====================== */}
      {/* Table */}
      {/* ====================== */}
      <Card>
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex justify-center items-center py-10">
              <Loader2 className="w-6 h-6 animate-spin text-gray-500" />
              <span className="ml-2 text-gray-600 dark:text-gray-400">
                Loading orders...
              </span>
            </div>
          ) : error ? (
            <p className="text-center text-red-500 py-6">{error}</p>
          ) : orders.length === 0 ? (
            <p className="text-center py-6 text-gray-500">Không có đơn hàng.</p>
          ) : (
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">
                    STT
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">
                    Mã đơn
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">
                    Người nhận
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">
                    Giá trị
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">
                    Trạng thái
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">
                    Thanh toán
                  </th>
                  <th className="px-4 py-3 text-right"></th>
                </tr>
              </thead>

              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                {orders.map((order, index) => (
                  <tr
                    key={order.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {(currentPage - 1) * 10 + index + 1}
                    </td>

                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900 dark:text-white">
                        {order.code}
                      </p>
                      <p className="text-xs text-gray-400">
                        {new Date(order.createdAt).toLocaleString()}
                      </p>
                    </td>

                    <td className="px-4 py-3 text-sm text-gray-700">
                      <p>{order.address?.fullName || "—"}</p>
                      <p className="text-xs text-gray-400">
                        {order.address?.phone}
                      </p>
                    </td>

                    <td className="px-4 py-3 text-sm font-semibold text-green-700">
                      {order.finalPrice.toLocaleString()} đ
                    </td>

                    <td className="px-4 py-3">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          statusColors[order.status] || "bg-gray-200"
                        }`}
                      >
                        {statusLabels[order.status] || order.status}
                      </span>
                    </td>

                    <td className="px-4 py-3">
                      {order.paymentStatus === "paid" ? (
                        <span className="px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs font-semibold">
                          Đã thanh toán
                        </span>
                      ) : (
                        <span className="px-3 py-1 rounded-full bg-red-100 text-red-700 text-xs font-semibold">
                          Chưa thanh toán
                        </span>
                      )}
                    </td>

                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-3">
                        <button
                          onClick={() =>
                            navigate(`/admin/orders/detail/${order.id}`)
                          }
                          className="text-blue-600 hover:text-blue-800"
                          title="Xem chi tiết"
                        >
                          <Eye className="w-5 h-5 inline-block" />
                        </button>

                        {/* Nút cập nhật trạng thái */}
                        <button
                          onClick={() => openUpdateStatusModal(order)}
                          className="text-green-600 hover:text-green-800"
                          title="Cập nhật trạng thái"
                        >
                          <Edit className="w-5 h-5 inline-block" />
                        </button>

                        {/* Nút xác nhận thanh toán COD */}
                        {order.paymentStatus !== "paid" && (
                          <button
                            onClick={() => openPaymentModal(order)}
                            className="text-purple-600 hover:text-purple-800"
                            title="Xác nhận thanh toán COD"
                          >
                            💰
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </Card>

      {/* ====================== */}
      {/* Modal Cập nhật trạng thái */}
      {/* ====================== */}
      {showStatusModal && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg w-full max-w-md">
            <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
              Cập nhật trạng thái đơn hàng
            </h2>

            <select
              className="w-full border rounded-md p-2 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200"
              value={selectedOrder.status}
              onChange={(e) => {
                const newStatus = e.target.value;

                // Nếu chọn "delivered" và đơn đã thanh toán → hỏi hoàn tất
                if (newStatus === "delivered") {
                  requestChangeToDelivered(selectedOrder, newStatus);
                  return;
                }

                // ❌ Không cho hủy đơn đã thanh toán
                if (
                  newStatus === "cancelled" &&
                  selectedOrder.paymentStatus === "paid"
                ) {
                  alert(
                    "Đơn hàng đã được thanh toán, không thể chuyển sang trạng thái 'Đã hủy'."
                  );
                  return;
                }

                // Ngược lại → đổi trạng thái ngay
                setSelectedOrder({
                  ...selectedOrder,
                  status: newStatus,
                });
              }}
            >
              <option value="pending">Chờ duyệt</option>
              <option value="processing">Đang xử lý</option>
              <option value="shipping">Đang giao</option>
              <option value="delivered">Hoàn thành</option>
              <option value="completed">Hoàn tất</option>
              <option value="cancelled">Đã hủy</option>
            </select>

            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={() => setShowStatusModal(false)}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded"
              >
                Đóng
              </button>

              <button
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                onClick={async () => {
                  try {
                    await http(
                      "PATCH",
                      `/api/v1/admin/orders/${selectedOrder.id}/status`,
                      {
                        status: selectedOrder.status,
                      }
                    );

                    alert("Cập nhật trạng thái thành công!");
                    setShowStatusModal(false);
                    fetchOrders();
                  } catch (err: any) {
                    alert(err?.message || "Không thể cập nhật trạng thái");
                  }
                }}
              >
                Lưu
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ====================== */}
      {/* Modal Thanh toán COD */}
      {/* ====================== */}
      {showPaymentModal && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg w-full max-w-md">
            <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
              Xác nhận thanh toán COD
            </h2>

            {/* Amount */}
            <label className="block text-sm mb-2 font-medium text-gray-700 dark:text-gray-300">
              Số tiền khách trả
            </label>
            <input
              type="number"
              className="w-full border rounded-md p-2 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 mb-3"
              value={paymentAmount}
              onChange={(e) => setPaymentAmount(e.target.value)}
            />

            <p className="text-xs text-gray-500 dark:text-gray-400">
              Tổng cần thu:{" "}
              <strong className="text-green-700">
                {selectedOrder.finalPrice.toLocaleString()} đ
              </strong>
            </p>

            {/* Buttons */}
            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={() => setShowPaymentModal(false)}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded"
              >
                Đóng
              </button>

              <button
                className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
                onClick={async () => {
                  try {
                    const amountNumber = Number(paymentAmount);

                    if (amountNumber < selectedOrder.finalPrice) {
                      return alert("Số tiền thanh toán nhỏ hơn tổng đơn hàng!");
                    }

                    await http(
                      "POST",
                      `/api/v1/admin/orders/${selectedOrder.id}/payment`,
                      {
                        amount: amountNumber, // 🎯 chỉ gửi amount theo backend mới
                      }
                    );

                    alert("Xác nhận thanh toán thành công!");

                    setShowPaymentModal(false);
                    fetchOrders();
                  } catch (err: any) {
                    alert(err?.message || "Không thể xác nhận thanh toán");
                  }
                }}
              >
                Xác nhận thanh toán
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ====================== */}
      {/* Modal Xác nhận hoàn tất */}
      {/* ====================== */}
      {confirmCompleteModal && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-xl w-full max-w-md text-center">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
              Đơn hàng đã được thanh toán
            </h2>
            <p className="text-gray-700 dark:text-gray-300 mb-5">
              Bạn muốn đánh dấu đơn hàng này là <strong>Hoàn tất</strong> luôn
              không?
            </p>

            <div className="flex justify-center gap-3">
              <button
                onClick={() => {
                  // Hoàn tất luôn
                  saveStatusChange(selectedOrder, "completed");
                }}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded"
              >
                Hoàn tất đơn hàng
              </button>

              <button
                onClick={() => {
                  // Giữ trạng thái delivered
                  saveStatusChange(selectedOrder, "delivered");
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded"
              >
                Chỉ đánh dấu đã giao
              </button>

              <button
                onClick={() => setConfirmCompleteModal(false)}
                className="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-800 dark:text-gray-200 rounded"
              >
                Hủy
              </button>
            </div>
          </div>
        </div>
      )}

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={(p) => {
          const params = new URLSearchParams(searchParams);
          if (p === 1) params.delete("page");
          else params.set("page", String(p));
          setSearchParams(params);
        }}
      />
    </div>
  );
};

export default OrdersPage;
