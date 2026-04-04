import React, { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import {
  Search,
  Loader2,
  GitBranch,
  MapPin,
  Truck,
  Package,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  FolderOpen,
  ArrowRight,
  FilterX,
  XCircle,
  RefreshCw,
  Clock,
  Activity,
  Banknote,
  ArchiveRestore,
  Store,
} from "lucide-react";
import { useSearchParams, useNavigate } from "react-router-dom";

import Card from "../../../components/admin/layouts/Card";
import Pagination from "../../../components/admin/common/Pagination";
import { http } from "../../../services/http";
import { useAdminToast } from "../../../context/AdminToastContext";
import { useAuth } from "../../../context/AuthContextAdmin";

// ==========================================
// TYPES
// ==========================================
type OrderStatus =
  | "pending"
  | "processing"
  | "shipping"
  | "delivered"
  | "completed"
  | "cancelled";
type PaymentStatus = "unpaid" | "paid" | "partial" | "refunded" | "failed";
type FulfillmentType = "pickup" | "delivery";

interface OrderItem {
  productId: number | null;
  productVariantId?: number | null;
  productTitle: string;
  variantTitle?: string | null;
  variantSku?: string | null;
  price: number;
  quantity: number;
}

interface BranchInfo {
  id: number;
  name: string;
  code?: string | null;
}

interface OrderProps {
  id: number;
  userId: number;
  branchId?: number;
  fulfillmentType?: FulfillmentType;
  branch?: BranchInfo | null;
  code: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  shippingFee: number;
  discountAmount: number;
  totalPrice: number;
  finalPrice: number;
  trackingToken?: string;
  createdAt: string;
  address: {
    fullName?: string | null;
    phone?: string | null;
  } | null;
  items: OrderItem[];
}

// ==========================================
// HELPERS
// ==========================================
const statusConfig: Record<
  OrderStatus,
  { label: string; colorClass: string; icon: any }
> = {
  pending: {
    label: "Chờ duyệt",
    colorClass:
      "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200",
    icon: Clock,
  },
  processing: {
    label: "Đang xử lý",
    colorClass:
      "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200",
    icon: Activity,
  },
  shipping: {
    label: "Đang giao",
    colorClass:
      "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400 border-purple-200",
    icon: Truck,
  },
  delivered: {
    label: "Đã giao",
    colorClass:
      "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400 border-indigo-200",
    icon: MapPin,
  },
  completed: {
    label: "Hoàn thành",
    colorClass:
      "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border-green-200",
    icon: CheckCircle2,
  },
  cancelled: {
    label: "Đã hủy",
    colorClass:
      "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 border-gray-200 dark:border-gray-700",
    icon: XCircle,
  },
};

const getOperationalHint = (order: OrderProps) => {
  if (order.status === "pending") return "Bước tiếp theo: Duyệt đơn";
  if (order.status === "processing") return "Bước tiếp theo: Giao hàng";
  if (order.status === "shipping") return "Bước tiếp theo: Xác nhận đã giao";
  if (order.status === "delivered")
    return order.paymentStatus === "paid"
      ? "Bước tiếp theo: Hoàn tất đơn"
      : "Bước tiếp theo: Thu COD";
  if (order.status === "completed") return "Đơn đã đóng";
  if (order.status === "cancelled") return "Đơn đã hủy";
  return "";
};

const getRowPriorityClass = (order: OrderProps) => {
  if (order.status === "pending")
    return "border-l-4 border-l-amber-400 bg-amber-50/30 dark:bg-amber-900/10";
  if (order.status === "shipping")
    return "border-l-4 border-l-purple-400 bg-purple-50/20 dark:bg-purple-900/10";
  if (order.status === "delivered" && order.paymentStatus !== "paid")
    return "border-l-4 border-l-orange-500 bg-orange-50/30 dark:bg-orange-900/10";
  if (order.status === "completed" || order.status === "cancelled")
    return "opacity-75 bg-gray-50/50 dark:bg-gray-800/20 border-l-4 border-l-transparent";
  return "border-l-4 border-l-transparent";
};

// ==========================================
// MAIN COMPONENT
// ==========================================
const ModalPortal: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  if (typeof document === "undefined") return null;
  return createPortal(children, document.body);
};

const OrdersPage: React.FC = () => {
  const [orders, setOrders] = useState<OrderProps[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  const [searchParams, setSearchParams] = useSearchParams();
  const searchTerm = searchParams.get("q") || "";
  const statusFilter = searchParams.get("status") || "all";
  const fulfillmentFilter = searchParams.get("fulfillmentType") || "all";

  const currentPage = Number(searchParams.get("page") || 1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const navigate = useNavigate();
  const { showSuccessToast, showErrorToast } = useAdminToast();
  const { branches, currentBranchId } = useAuth();

  // Modals States
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [confirmCompleteModal, setConfirmCompleteModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<OrderProps | null>(null);

  // --- Data Fetching ---
  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError("");

      let url = `/api/v1/admin/orders?page=${currentPage}&limit=12`;

      if (statusFilter !== "all")
        url += `&status=${encodeURIComponent(statusFilter)}`;
      if (fulfillmentFilter !== "all")
        url += `&fulfillmentType=${encodeURIComponent(fulfillmentFilter)}`;
      if (searchTerm.trim())
        url += `&q=${encodeURIComponent(searchTerm.trim())}`;
      if (currentBranchId)
        url += `&branchId=${encodeURIComponent(String(currentBranchId))}`;

      const json = await http<any>("GET", url);

      if (json.success) {
        const mapped = Array.isArray(json.data)
          ? json.data.map((item: any) => item?.props ?? item).filter(Boolean)
          : [];
        setOrders(mapped);

        const total = Number(json.meta?.total ?? 0);
        const limit = Number(json.meta?.limit ?? 12);
        setTotalCount(total);
        setTotalPages(Math.max(1, Math.ceil(total / limit)));
      }
    } catch (err: any) {
      setError(err.message || "Lỗi tải dữ liệu đơn hàng");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    statusFilter,
    fulfillmentFilter,
    currentPage,
    searchTerm,
    currentBranchId,
  ]);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput]);

  // --- Metrics (Calculated from current page fallback) ---
  const metrics = useMemo(() => {
    let pending = 0,
      processing = 0,
      shipping = 0,
      unpaidCOD = 0,
      completed = 0;
    orders.forEach((o) => {
      if (o.status === "pending") pending++;
      if (o.status === "processing") processing++;
      if (o.status === "shipping") shipping++;
      if (o.status === "completed") completed++;
      if (o.paymentStatus !== "paid" && o.status !== "cancelled") unpaidCOD++;
    });
    return { pending, processing, shipping, unpaidCOD, completed };
  }, [orders]);

  const branchName = useMemo(() => {
    if (!currentBranchId) return "Toàn bộ hệ thống";
    return (
      branches.find((b) => b.id === currentBranchId)?.name ||
      `Chi nhánh #${currentBranchId}`
    );
  }, [branches, currentBranchId]);

  // --- Handlers ---
  const handleFilterChange = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value === "all") params.delete(key);
    else params.set(key, value);
    params.delete("page");
    setSearchParams(params);
  };

  const clearFilters = () => {
    setSearchParams(new URLSearchParams());
    setSearchInput("");
  };

  const saveStatusChange = async (order: OrderProps, status: OrderStatus) => {
    try {
      await http("PATCH", `/api/v1/admin/orders/${order.id}/status`, {
        status,
      });
      showSuccessToast({ message: "Đã cập nhật tiến trình đơn hàng!" });
      setShowStatusModal(false);
      setConfirmCompleteModal(false);
      setSelectedOrder(null);
      fetchOrders();
    } catch (err: any) {
      showErrorToast(err?.message || "Không thể cập nhật trạng thái");
    }
  };

  const hasActiveFilters =
    statusFilter !== "all" || fulfillmentFilter !== "all" || searchTerm !== "";

  // ==========================================
  // RENDER
  // ==========================================
  return (
    <div className="w-full pb-10 space-y-6">
      {/* Tầng A: Header / Command Bar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Bảng Điều hành Đơn hàng
            </h1>
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 rounded text-xs font-semibold border border-blue-100 dark:border-blue-800">
              <GitBranch className="w-3.5 h-3.5" /> {branchName}
            </span>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Quản lý, theo dõi và điều phối đơn hàng theo tiến trình.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <button
            onClick={fetchOrders}
            className="p-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition"
            title="Làm mới dữ liệu"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Tầng B: KPI Strip */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        {[
          {
            label: "Tổng số",
            value: totalCount,
            icon: ArchiveRestore,
            color: "text-gray-600",
            bg: "bg-gray-100",
            filter: "all",
          },
          {
            label: "Chờ duyệt",
            value: metrics.pending,
            icon: Clock,
            color: "text-amber-600",
            bg: "bg-amber-50",
            filter: "pending",
          },
          {
            label: "Đang xử lý",
            value: metrics.processing,
            icon: Activity,
            color: "text-blue-600",
            bg: "bg-blue-50",
            filter: "processing",
          },
          {
            label: "Đang giao",
            value: metrics.shipping,
            icon: Truck,
            color: "text-purple-600",
            bg: "bg-purple-50",
            filter: "shipping",
          },
          {
            label: "Cần thu COD",
            value: metrics.unpaidCOD,
            icon: Banknote,
            color: "text-orange-600",
            bg: "bg-orange-50",
            isWarning: true,
          },
          {
            label: "Hoàn tất (Trang)",
            value: metrics.completed,
            icon: CheckCircle2,
            color: "text-green-600",
            bg: "bg-green-50",
            filter: "completed",
          },
        ].map((kpi, idx) => (
          <div
            key={idx}
            onClick={() => {
              if (kpi.filter) handleFilterChange("status", kpi.filter);
            }}
            className={`p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 flex flex-col justify-center transition-all ${
              statusFilter === kpi.filter
                ? "border-blue-400 shadow-sm ring-1 ring-blue-100 dark:ring-blue-900"
                : kpi.filter !== "all"
                  ? "cursor-pointer hover:border-blue-400 hover:shadow-sm"
                  : ""
            }`}
          >
            <div className="flex items-center gap-2 mb-2">
              <kpi.icon className={`w-4 h-4 ${kpi.color}`} />
              <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 truncate">
                {kpi.label}
              </span>
            </div>
            <div
              className={`text-xl font-black ${kpi.isWarning && kpi.value > 0 ? "text-orange-600 dark:text-orange-400" : "text-gray-900 dark:text-white"}`}
            >
              {kpi.value}
            </div>
          </div>
        ))}
      </div>

      {/* Tầng D: Toolbar Phân tầng */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col gap-4">
        {/* Quick Filters */}
        <div className="flex flex-wrap items-center gap-2 border-b border-gray-100 dark:border-gray-700 pb-4">
          <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 mr-2 flex items-center gap-1.5">
            Tiến trình:
          </span>
          {[
            { id: "all", label: "Tất cả" },
            { id: "pending", label: "Chờ duyệt" },
            { id: "processing", label: "Đang xử lý" },
            { id: "shipping", label: "Đang giao" },
            { id: "delivered", label: "Đã giao" },
            { id: "completed", label: "Hoàn tất" },
            { id: "cancelled", label: "Đã hủy" },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => handleFilterChange("status", f.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                statusFilter === f.id
                  ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                  : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:border-gray-300"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Advanced Filters */}
        <div className="flex flex-col lg:flex-row justify-between items-center gap-4">
          <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
            <select
              value={fulfillmentFilter}
              onChange={(e) =>
                handleFilterChange("fulfillmentType", e.target.value)
              }
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white min-w-[180px]"
            >
              <option value="all">Mọi hình thức (Vận chuyển)</option>
              <option value="pickup">Nhận tại quầy (Pickup)</option>
              <option value="delivery">Giao tận nơi (Delivery)</option>
            </select>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4 w-full lg:w-auto">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Tìm mã đơn hàng (VD: ORD-102)..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="p-2 text-gray-500 hover:text-red-600 bg-gray-100 hover:bg-red-50 dark:bg-gray-700 dark:hover:bg-red-900/30 rounded-lg transition shrink-0"
                title="Xóa bộ lọc"
              >
                <FilterX className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <p className="text-sm text-gray-500 font-medium pl-1">
        Hiển thị {orders.length} đơn hàng ở trang hiện tại.
      </p>

      <Card className="!p-0 overflow-hidden mt-4 border border-gray-200 dark:border-gray-700">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-5 py-3.5 text-left text-xs font-bold text-gray-500 uppercase">
                  Mã Đơn
                </th>
                <th className="px-5 py-3.5 text-left text-xs font-bold text-gray-500 uppercase">
                  Khách hàng
                </th>
                <th className="px-5 py-3.5 text-left text-xs font-bold text-gray-500 uppercase">
                  Điều phối
                </th>
                <th className="px-5 py-3.5 text-left text-xs font-bold text-gray-500 uppercase">
                  Giá trị
                </th>
                <th className="px-5 py-3.5 text-left text-xs font-bold text-gray-500 uppercase">
                  Trạng thái
                </th>
                <th className="px-5 py-3.5 text-left text-xs font-bold text-gray-500 uppercase">
                  Thanh toán
                </th>
                <th className="px-5 py-3.5 text-right text-xs font-bold text-gray-500 uppercase">
                  Hành động
                </th>
              </tr>
            </thead>

            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-100 dark:divide-gray-800">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-5 py-24 text-center">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-3" />
                    <p className="text-gray-500 font-medium">
                      Đang đồng bộ Bảng Điều hành...
                    </p>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={7} className="px-5 py-16 text-center">
                    <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-3" />
                    <p className="text-red-600 font-medium">{error}</p>
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-20 text-center">
                    <div className="flex flex-col items-center">
                      <Package className="w-12 h-12 text-gray-300 dark:text-gray-600 mb-4" />
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                        Không tìm thấy đơn hàng phù hợp
                      </h3>
                      <p className="text-sm text-gray-500 mt-1 mb-5">
                        Hãy thử đổi từ khóa tìm kiếm hoặc xóa các bộ lọc hiện
                        tại để xem kết quả.
                      </p>
                      {hasActiveFilters && (
                        <button
                          onClick={clearFilters}
                          className="px-4 py-2 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition"
                        >
                          Xóa bộ lọc nhanh
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                orders.map((order) => {
                  const priorityClass = getRowPriorityClass(order);
                  const statusInfo = statusConfig[order.status];

                  return (
                    <tr
                      key={order.id}
                      className={`hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group ${priorityClass}`}
                    >
                      {/* Order Column */}
                      <td className="px-5 py-4">
                        <div className="font-semibold text-gray-900 dark:text-white text-sm">
                          {order.code}
                        </div>
                        <div className="text-xs text-gray-500 font-mono mt-0.5">
                          ID: #{order.id}
                        </div>
                        <div className="text-[10px] text-gray-400 mt-1 flex items-center gap-1">
                          <Clock className="w-3 h-3" />{" "}
                          {new Date(order.createdAt).toLocaleString()}
                        </div>
                      </td>

                      {/* Customer Column */}
                      <td className="px-5 py-4 text-sm text-gray-600 dark:text-gray-300">
                        <div className="font-medium text-gray-800 dark:text-gray-200">
                          {order.address?.fullName || "—"}
                        </div>
                        <div className="text-xs mt-1">
                          {order.address?.phone || "—"}
                        </div>
                      </td>

                      {/* Routing Column */}
                      <td className="px-5 py-4">
                        <div className="font-medium text-sm text-gray-800 dark:text-gray-200 mb-1.5">
                          {order.branch?.name || "—"}
                        </div>
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide border ${
                            order.fulfillmentType === "pickup"
                              ? "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30"
                              : "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/30"
                          }`}
                        >
                          {order.fulfillmentType === "pickup" ? (
                            <Store className="w-3 h-3" />
                          ) : (
                            <Truck className="w-3 h-3" />
                          )}
                          {order.fulfillmentType === "pickup"
                            ? "Nhận tại quầy"
                            : "Giao tận nơi"}
                        </span>
                      </td>

                      {/* Value Column */}
                      <td className="px-5 py-4">
                        <div className="font-bold text-green-700 dark:text-green-400 text-sm">
                          {order.finalPrice.toLocaleString()} đ
                        </div>
                        <div className="text-[11px] text-gray-500 mt-1">
                          {order.items?.length ?? 0} sản phẩm
                        </div>
                      </td>

                      {/* Workflow Status Column */}
                      <td className="px-5 py-4">
                        <div
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider border ${statusInfo.colorClass}`}
                        >
                          <statusInfo.icon className="w-3.5 h-3.5" />
                          {statusInfo.label}
                        </div>
                        <div className="text-[10px] font-medium text-gray-500 dark:text-gray-400 mt-1.5 ml-1">
                          {getOperationalHint(order)}
                        </div>
                      </td>

                      {/* Payment Column */}
                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider border ${
                            order.paymentStatus === "paid"
                              ? "bg-green-50 text-green-700 border-green-200"
                              : order.status === "cancelled"
                                ? "bg-gray-50 text-gray-500 border-gray-200"
                                : "bg-orange-50 text-orange-700 border-orange-200"
                          }`}
                        >
                          <CreditCard className="w-3 h-3" />
                          {order.paymentStatus === "paid"
                            ? "Đã thanh toán"
                            : order.status === "cancelled"
                              ? "Đã hủy"
                              : "COD / Chưa thu"}
                        </span>
                      </td>

                      {/* Actions Column */}
                      <td className="px-5 py-4 text-right">
                        <div className="flex justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() =>
                              navigate(`/admin/orders/edit/${order.id}`)
                            }
                            className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded"
                            title="Mở Workspace"
                          >
                            <FolderOpen className="w-4 h-4" />
                          </button>

                          {order.status !== "completed" &&
                            order.status !== "cancelled" && (
                              <button
                                onClick={() => {
                                  setSelectedOrder(order);
                                  setShowStatusModal(true);
                                }}
                                className="p-1.5 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded"
                                title="Cập nhật Tiến trình"
                              >
                                <Activity className="w-4 h-4" />
                              </button>
                            )}

                          {order.paymentStatus !== "paid" &&
                            order.status !== "cancelled" &&
                            order.status !== "completed" && (
                              <button
                                onClick={() => {
                                  setSelectedOrder(order);
                                  setShowPaymentModal(true);
                                }}
                                className="p-1.5 text-gray-500 hover:text-orange-600 hover:bg-orange-50 rounded"
                                title="Thu COD"
                              >
                                <Banknote className="w-4 h-4" />
                              </button>
                            )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Pagination */}
      {!loading && !error && totalPages > 1 && (
        <div className="flex justify-end mt-6">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={(p) => {
              const params = new URLSearchParams(searchParams);
              params.set("page", String(p));
              setSearchParams(params);
            }}
          />
        </div>
      )}

      {/* MODAL 1: Update Workflow */}
      {showStatusModal && selectedOrder && (
        <ModalPortal>
          <div className="fixed left-0 top-0 h-screen w-screen z-[9999] bg-gray-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-2xl w-full max-w-md border border-gray-200 dark:border-gray-700">
              <div className="flex justify-between items-center mb-5">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <Activity className="w-5 h-5 text-blue-600" /> Cập nhật Tiến
                  trình
                </h2>
                <button
                  onClick={() => setShowStatusModal(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>

              <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-xl border border-gray-100 dark:border-gray-700 mb-6 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Mã đơn:</span>{" "}
                  <span className="font-bold text-gray-900 dark:text-white">
                    {selectedOrder.code}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Trạng thái hiện tại:</span>
                  <span
                    className={`font-bold ${statusConfig[selectedOrder.status].colorClass.split(" ")[1]}`}
                  >
                    {statusConfig[selectedOrder.status].label}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Thanh toán:</span>
                  <span className="font-bold text-gray-900 dark:text-white">
                    {selectedOrder.paymentStatus === "paid"
                      ? "Đã thanh toán"
                      : "Chưa thu tiền"}
                  </span>
                </div>
              </div>

              <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-3 uppercase tracking-wider">
                Hành động khả dụng
              </h3>
              <div className="space-y-3">
                {selectedOrder.status === "pending" && (
                  <>
                    <button
                      onClick={() =>
                        saveStatusChange(selectedOrder, "processing")
                      }
                      className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-sm flex items-center justify-center gap-2"
                    >
                      Chuyển sang Đang xử lý <ArrowRight className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() =>
                        saveStatusChange(selectedOrder, "cancelled")
                      }
                      className="w-full py-3 bg-white dark:bg-gray-800 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 border border-red-200 dark:border-red-900/50 font-bold rounded-xl transition"
                    >
                      Hủy đơn hàng
                    </button>
                  </>
                )}
                {selectedOrder.status === "processing" && (
                  <>
                    <button
                      onClick={() =>
                        saveStatusChange(selectedOrder, "shipping")
                      }
                      className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl shadow-sm flex items-center justify-center gap-2"
                    >
                      Chuyển sang Đang giao <ArrowRight className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() =>
                        saveStatusChange(selectedOrder, "cancelled")
                      }
                      className="w-full py-3 bg-white dark:bg-gray-800 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 border border-red-200 dark:border-red-900/50 font-bold rounded-xl transition"
                    >
                      Hủy đơn hàng
                    </button>
                  </>
                )}
                {selectedOrder.status === "shipping" && (
                  <button
                    onClick={() => saveStatusChange(selectedOrder, "delivered")}
                    className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-sm flex items-center justify-center gap-2"
                  >
                    Đánh dấu Đã giao <ArrowRight className="w-4 h-4" />
                  </button>
                )}
                {selectedOrder.status === "delivered" &&
                  (selectedOrder.paymentStatus === "paid" ? (
                    <button
                      onClick={() =>
                        saveStatusChange(selectedOrder, "completed")
                      }
                      className="w-full py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl shadow-sm flex items-center justify-center gap-2"
                    >
                      <CheckCircle2 className="w-4 h-4" /> Hoàn tất đơn hàng
                    </button>
                  ) : (
                    <div className="text-center space-y-4">
                      <p className="text-sm text-orange-600 bg-orange-50 p-3 rounded-lg border border-orange-200">
                        Đơn hàng chưa thanh toán. Vui lòng xác nhận thu COD
                        trước khi hoàn tất.
                      </p>
                      <button
                        onClick={() => {
                          setShowStatusModal(false);
                          setShowPaymentModal(true);
                        }}
                        className="w-full py-3 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl shadow-sm"
                      >
                        Thu COD ngay
                      </button>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </ModalPortal>
      )}

      {/* MODAL 2: Payment COD Collection */}
      {showPaymentModal && selectedOrder && (
        <ModalPortal>
          <div className="fixed left-0 top-0 h-screen w-screen z-[9999] bg-gray-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-2xl w-full max-w-md border border-gray-200 dark:border-gray-700">
              <div className="flex justify-between items-center mb-5">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <Banknote className="w-5 h-5 text-orange-500" /> Xác nhận thu
                  COD
                </h2>
                <button
                  onClick={() => setShowPaymentModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3 mb-5 text-sm bg-gray-50 dark:bg-gray-900/50 p-4 rounded-xl border border-gray-100 dark:border-gray-700">
                <div className="flex justify-between">
                  <span className="text-gray-500">Mã đơn:</span>{" "}
                  <span className="font-bold text-gray-900 dark:text-white">
                    {selectedOrder.code}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Khách hàng:</span>{" "}
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {selectedOrder.address?.fullName || "—"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Trạng thái hiện tại:</span>{" "}
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {statusConfig[selectedOrder.status].label}
                  </span>
                </div>
              </div>

              <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-xl p-5 text-center mb-5">
                <p className="text-sm text-orange-800 dark:text-orange-400 font-medium">
                  Số tiền cần thu
                </p>
                <p className="text-3xl font-black text-orange-600 dark:text-orange-500 mt-1">
                  {selectedOrder.finalPrice.toLocaleString()} đ
                </p>
              </div>

              <p className="text-xs text-gray-500 text-center mb-6 px-4">
                Sau khi xác nhận, Trạng thái Thanh toán sẽ chuyển sang{" "}
                <strong>Đã thanh toán</strong>.{" "}
                {selectedOrder.status === "delivered" &&
                  "Bạn có thể hoàn tất đơn ngay sau đó."}
              </p>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowPaymentModal(false)}
                  className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:text-white font-semibold rounded-xl transition"
                >
                  Hủy
                </button>
                <button
                  className="flex-1 py-3 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 transition shadow-sm"
                  onClick={async () => {
                    try {
                      await http(
                        "POST",
                        `/api/v1/admin/orders/${selectedOrder.id}/payment`,
                        { amount: selectedOrder.finalPrice },
                      );
                      showSuccessToast({
                        message: "Xác nhận thanh toán thành công!",
                      });
                      setShowPaymentModal(false);
                      if (selectedOrder.status === "delivered")
                        setConfirmCompleteModal(true);
                      else fetchOrders();
                    } catch (err: any) {
                      showErrorToast(
                        err?.message || "Không thể xác nhận thanh toán",
                      );
                    }
                  }}
                >
                  Xác nhận thu đủ
                </button>
              </div>
            </div>
          </div>
        </ModalPortal>
      )}

      {/* MODAL 3: Confirm Complete Order (Post-payment) */}
      {confirmCompleteModal && selectedOrder && (
        <ModalPortal>
          <div className="fixed left-0 top-0 h-screen w-screen z-[9999] bg-gray-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-2xl w-full max-w-md text-center border border-gray-200 dark:border-gray-700">
              <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                Thanh toán hoàn tất!
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">
                Đơn hàng <strong>{selectedOrder.code}</strong> đã thanh toán
                thành công và đang ở trạng thái Đã giao. Bạn có muốn đóng (Hoàn
                tất) đơn hàng này luôn không?
              </p>

              <div className="flex flex-col gap-3">
                <button
                  onClick={() => saveStatusChange(selectedOrder, "completed")}
                  className="w-full py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl transition shadow-sm"
                >
                  Có, Hoàn tất đơn hàng
                </button>
                <button
                  onClick={() => {
                    setConfirmCompleteModal(false);
                    fetchOrders();
                  }}
                  className="w-full py-3 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-semibold rounded-xl transition"
                >
                  Không, để sau
                </button>
              </div>
            </div>
          </div>
        </ModalPortal>
      )}
    </div>
  );
};

export default OrdersPage;
