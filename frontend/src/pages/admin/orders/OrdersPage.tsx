import React, { useEffect, useState } from "react";
import Card from "../../../components/admin/layouts/Card";
import { Search, Eye, Loader2, Edit } from "lucide-react";
import { useSearchParams, useNavigate } from "react-router-dom";
import Pagination from "../../../components/admin/common/Pagination";
import { http } from "../../../services/http";

// =======================
// 🟦 Kiểu dữ liệu Order
// =======================
type OrderStatus =
  | "pending"
  | "processing"
  | "shipping"
  | "delivered"
  | "completed"
  | "cancelled";

type PaymentStatus = "unpaid" | "paid" | "partial" | "refunded" | "failed";

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
  status: OrderStatus;
  paymentStatus: PaymentStatus;
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

const statusLabels: Record<OrderStatus, string> = {
  pending: "Chờ duyệt",
  processing: "Đang xử lý",
  shipping: "Đang giao",
  delivered: "Đã giao",
  completed: "Hoàn thành",
  cancelled: "Đã hủy",
};

const statusColors: Record<OrderStatus, string> = {
  pending:
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  processing:
    "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  shipping:
    "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
  delivered:
    "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  completed:
    "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  cancelled: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
};

// FE nên phản ánh đúng rule backend nhưng vẫn giữ sự linh động mà bạn muốn
const editableStatusMap: Record<OrderStatus, OrderStatus[]> = {
  pending: ["processing", "cancelled"],
  processing: ["pending", "shipping", "cancelled"],
  shipping: ["processing", "delivered"],
  delivered: ["completed"],
  completed: [],
  cancelled: [],
};

const isStatusOptionDisabled = (
  order: OrderProps,
  optionStatus: OrderStatus,
) => {
  // luôn cho phép giữ nguyên trạng thái hiện tại để select hiển thị bình thường
  if (optionStatus === order.status) return false;

  // completed và cancelled thì modal đã chặn mở từ trước,
  // nhưng cứ chặn cứng thêm cho an toàn
  if (order.status === "completed" || order.status === "cancelled") {
    return true;
  }

  // Không cho hoàn thành nếu chưa thanh toán
  if (optionStatus === "completed" && order.paymentStatus !== "paid") {
    return true;
  }

  // Không cho hủy nếu đơn đã thanh toán
  if (optionStatus === "cancelled" && order.paymentStatus === "paid") {
    return true;
  }

  // Chỉ cho phép các trạng thái nằm trong map
  return !editableStatusMap[order.status].includes(optionStatus);
};

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
  const [originalStatus, setOriginalStatus] = useState<OrderStatus | null>(
    null,
  );

  const closeStatusModal = () => {
    setShowStatusModal(false);
    setSelectedOrder(null);
    setOriginalStatus(null);
  };

  const openUpdateStatusModal = (order: OrderProps) => {
    if (order.status === "cancelled") {
      alert("Đơn hàng đã bị hủy nên không thể chỉnh sửa.");
      return;
    }

    if (order.status === "completed") {
      alert("Đơn hàng đã hoàn thành nên không thể chỉnh sửa.");
      return;
    }

    setSelectedOrder(order);
    setOriginalStatus(order.status);
    setShowStatusModal(true);
  };

  // ============================
  // Modal Thanh toán COD
  // ============================
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [, setPaymentAmount] = useState("");

  const closePaymentModal = () => {
    setShowPaymentModal(false);
    setSelectedOrder(null);
  };

  const openPaymentModal = (order: OrderProps) => {
    if (order.status === "cancelled") {
      alert("Không thể thanh toán đơn hàng đã bị huỷ.");
      return;
    }

    if (order.status === "completed") {
      alert("Đơn hàng đã hoàn tất.");
      return;
    }

    if (order.paymentStatus === "paid") {
      alert("Đơn hàng đã thanh toán.");
      return;
    }

    setSelectedOrder(order);
    setPaymentAmount(order.finalPrice.toString());
    setShowPaymentModal(true);
  };

  // Popup hỏi hoàn tất đơn hàng
  const [confirmCompleteModal, setConfirmCompleteModal] = useState(false);

  const closeConfirmCompleteModal = () => {
    setConfirmCompleteModal(false);
  };

  // Hàm gọi khi admin chọn "Đã giao"
  const requestChangeToDelivered = (
    order: OrderProps,
    newStatus: OrderStatus,
  ) => {
    if (order.paymentStatus === "paid") {
      setConfirmCompleteModal(true);
    } else {
      saveStatusChange(order, newStatus);
    }
  };

  // Hàm lưu thay đổi trạng thái
  const saveStatusChange = async (order: OrderProps, status: OrderStatus) => {
    try {
      await http("PATCH", `/api/v1/admin/orders/${order.id}/status`, {
        status,
      });

      alert("Cập nhật trạng thái thành công!");
      setShowStatusModal(false);
      setConfirmCompleteModal(false);
      setSelectedOrder(null);
      setOriginalStatus(null);
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

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
          Orders
        </h1>

        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Tìm kiếm mã đơn hàng..."
            className="w-full pl-10 pr-3 py-2 border dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-3 mb-4">
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
            className={`px-4 py-2 rounded-md text-sm border transition-colors ${
              statusFilter === value
                ? "bg-blue-600 text-white border-blue-600 dark:bg-blue-600 dark:border-blue-600"
                : "bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <Card>
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex justify-center items-center py-10">
              <Loader2 className="w-6 h-6 animate-spin text-gray-500 dark:text-gray-400" />
              <span className="ml-2 text-gray-600 dark:text-gray-400">
                Loading orders...
              </span>
            </div>
          ) : error ? (
            <p className="text-center text-red-500 dark:text-red-400 py-6">
              {error}
            </p>
          ) : orders.length === 0 ? (
            <p className="text-center py-6 text-gray-500 dark:text-gray-400">
              Không có đơn hàng.
            </p>
          ) : (
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                    STT
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                    Mã đơn
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                    Người nhận
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                    Giá trị
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                    Trạng thái
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                    Thanh toán
                  </th>
                  <th className="px-4 py-3 text-right"></th>
                </tr>
              </thead>

              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                {orders.map((order, index) => (
                  <tr
                    key={order.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                      {(currentPage - 1) * 10 + index + 1}
                    </td>

                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900 dark:text-white">
                        {order.code}
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-500">
                        {new Date(order.createdAt).toLocaleString()}
                      </p>
                    </td>

                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                      <p>{order.address?.fullName || "—"}</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500">
                        {order.address?.phone}
                      </p>
                    </td>

                    <td className="px-4 py-3 text-sm font-semibold text-green-700 dark:text-green-400">
                      {order.finalPrice.toLocaleString()} đ
                    </td>

                    <td className="px-4 py-3">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          statusColors[order.status] ||
                          "bg-gray-200 dark:bg-gray-700 dark:text-gray-300"
                        }`}
                      >
                        {statusLabels[order.status] || order.status}
                      </span>
                    </td>

                    <td className="px-4 py-3">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          order.paymentStatus === "paid"
                            ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                            : order.status === "cancelled"
                              ? "bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-300"
                              : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                        }`}
                      >
                        {order.paymentStatus === "paid"
                          ? "Đã thanh toán"
                          : order.status === "cancelled"
                            ? "Đã hủy"
                            : "Chưa thanh toán"}
                      </span>
                    </td>

                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-3">
                        <button
                          onClick={() =>
                            navigate(`/admin/orders/detail/${order.id}`)
                          }
                          className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                          title="Xem chi tiết"
                        >
                          <Eye className="w-5 h-5 inline-block" />
                        </button>

                        <button
                          onClick={() => openUpdateStatusModal(order)}
                          className={`${
                            order.status === "cancelled" ||
                            order.status === "completed"
                              ? "text-gray-400 cursor-not-allowed"
                              : "text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300"
                          }`}
                          title={
                            order.status === "cancelled"
                              ? "Đơn hàng đã hủy"
                              : order.status === "completed"
                                ? "Đơn hàng đã hoàn thành"
                                : "Cập nhật trạng thái"
                          }
                        >
                          <Edit className="w-5 h-5 inline-block" />
                        </button>

                        <button
                          onClick={() => {
                            if (
                              order.paymentStatus !== "paid" &&
                              order.status !== "cancelled" &&
                              order.status !== "completed"
                            ) {
                              openPaymentModal(order);
                            }
                          }}
                          className={`${
                            order.paymentStatus === "paid" ||
                            order.status === "cancelled" ||
                            order.status === "completed"
                              ? "text-gray-400 cursor-not-allowed"
                              : "text-purple-600 hover:text-purple-800 dark:text-purple-400 dark:hover:text-purple-300"
                          }`}
                          title={
                            order.status === "cancelled"
                              ? "Đơn hàng đã bị huỷ"
                              : order.status === "completed"
                                ? "Đơn hàng đã hoàn tất"
                                : order.paymentStatus === "paid"
                                  ? "Đơn hàng đã thanh toán"
                                  : "Xác nhận thanh toán COD"
                          }
                        >
                          {order.paymentStatus === "paid" ? "✔️" : "💰"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </Card>

      {showStatusModal && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-40 dark:bg-opacity-60 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg w-full max-w-md">
            <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
              Cập nhật trạng thái đơn hàng
            </h2>

            <select
              className="w-full border dark:border-gray-600 rounded-md p-2 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={selectedOrder.status}
              onChange={(e) => {
                const newStatus = e.target.value as OrderStatus;

                if (newStatus === selectedOrder.status) return;

                if (isStatusOptionDisabled(selectedOrder, newStatus)) {
                  return;
                }

                if (newStatus === "completed") {
                  const ok = window.confirm(
                    "Bạn có chắc muốn đánh dấu đơn hàng này là HOÀN THÀNH không?",
                  );
                  if (!ok) return;
                }

                if (newStatus === "cancelled") {
                  const ok = window.confirm(
                    "Bạn có chắc muốn HỦY đơn hàng này không?",
                  );
                  if (!ok) return;
                }

                if (newStatus === "delivered") {
                  requestChangeToDelivered(selectedOrder, newStatus);
                  return;
                }

                setSelectedOrder({
                  ...selectedOrder,
                  status: newStatus,
                });
              }}
            >
              {(
                [
                  "pending",
                  "processing",
                  "shipping",
                  "delivered",
                  "completed",
                  "cancelled",
                ] as OrderStatus[]
              ).map((status) => (
                <option
                  key={status}
                  value={status}
                  disabled={isStatusOptionDisabled(selectedOrder, status)}
                >
                  {statusLabels[status]}
                  {status === "completed" &&
                  selectedOrder.paymentStatus !== "paid"
                    ? " (Chưa thanh toán)"
                    : ""}
                  {status === "cancelled" &&
                  selectedOrder.paymentStatus === "paid"
                    ? " (Đã thanh toán)"
                    : ""}
                </option>
              ))}
            </select>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={closeStatusModal}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-white rounded transition-colors"
              >
                Đóng
              </button>

              <button
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={
                  !selectedOrder ||
                  !originalStatus ||
                  selectedOrder.status === originalStatus
                }
                onClick={async () => {
                  if (!selectedOrder) return;

                  try {
                    await http(
                      "PATCH",
                      `/api/v1/admin/orders/${selectedOrder.id}/status`,
                      {
                        status: selectedOrder.status,
                      },
                    );

                    alert("Cập nhật trạng thái thành công!");
                    setShowStatusModal(false);
                    setSelectedOrder(null);
                    setOriginalStatus(null);
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

      {showPaymentModal && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-40 dark:bg-opacity-60 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg w-full max-w-md">
            <h2 className="text-lg font-semibold mb-5 text-gray-900 dark:text-white">
              Xác nhận thanh toán COD
            </h2>

            <div className="space-y-3 mb-5 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">
                  Mã đơn hàng
                </span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {selectedOrder.code}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">
                  Khách hàng
                </span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {selectedOrder.address?.fullName || "—"}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">
                  Trạng thái đơn
                </span>

                <span
                  className={`px-2 py-1 text-xs rounded-full ${
                    statusColors[selectedOrder.status]
                  }`}
                >
                  {statusLabels[selectedOrder.status]}
                </span>
              </div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-700/40 rounded-lg p-4 mb-4 text-center">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Số tiền cần thu
              </p>

              <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">
                {selectedOrder.finalPrice.toLocaleString()} đ
              </p>
            </div>

            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-300 dark:border-yellow-700 rounded-lg p-3 text-sm text-yellow-800 dark:text-yellow-300 mb-5">
              ⚠️ Hãy chắc chắn rằng khách hàng đã thanh toán{" "}
              <b>đầy đủ số tiền</b> trước khi xác nhận.
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={closePaymentModal}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-white rounded transition-colors"
              >
                Đóng
              </button>

              <button
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                onClick={async () => {
                  try {
                    await http(
                      "POST",
                      `/api/v1/admin/orders/${selectedOrder.id}/payment`,
                      {
                        amount: selectedOrder.finalPrice,
                      },
                    );

                    alert("Xác nhận thanh toán thành công!");
                    setShowPaymentModal(false);
                    setSelectedOrder(null);
                    fetchOrders();
                  } catch (err: any) {
                    alert(err?.message || "Không thể xác nhận thanh toán");
                  }
                }}
              >
                Xác nhận đã thanh toán
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmCompleteModal && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-40 dark:bg-opacity-60 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-xl w-full max-w-md text-center">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
              Đơn hàng đã được thanh toán
            </h2>
            <p className="text-gray-700 dark:text-gray-300 mb-6">
              Bạn muốn đánh dấu đơn hàng này là <strong>Hoàn tất</strong> luôn
              không?
            </p>

            <div className="flex flex-col sm:flex-row justify-center gap-3">
              <button
                onClick={() => {
                  saveStatusChange(selectedOrder, "completed");
                }}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded transition-colors"
              >
                Hoàn tất đơn hàng
              </button>

              <button
                onClick={() => {
                  saveStatusChange(selectedOrder, "delivered");
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
              >
                Chỉ đánh dấu đã giao
              </button>

              <button
                onClick={closeConfirmCompleteModal}
                className="px-4 py-2 bg-gray-300 hover:bg-gray-400 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 rounded transition-colors"
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
