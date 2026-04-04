import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Loader2,
  Printer,
  GitBranch,
  ShoppingBag,
  MapPin,
  Clock,
  CheckCircle2,
  Truck,
  Activity,
  XCircle,
  CreditCard,
  AlertTriangle,
  Banknote,
  Store,
  FileText,
  User,
  PackageCheck,
  ArrowRight,
  Phone,
} from "lucide-react";
import Card from "../../../components/admin/layouts/Card";
import { http } from "../../../services/http";
import { useAdminToast } from "../../../context/AdminToastContext";

// ==========================================
// TYPES & INTERFACES
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
  thumbnail?: string | null;
}

interface OrderAddress {
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  ward?: string;
  district?: string;
  province?: string;
  postalCode?: string;
  notes?: string;
}

interface BranchInfo {
  id: number;
  name: string;
  code?: string | null;
}

interface DeliveryItem {
  id: number;
  status: string;
  note: string | null;
  location: string | null;
  createdAt: string;
}

interface Order {
  id: number;
  code: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  shippingFee: number;
  discountAmount: number;
  totalPrice: number;
  finalPrice: number;
  trackingToken?: string;
  inventoryApplied: boolean;
  createdAt: string;
  updatedAt: string;
  branchId?: number;
  fulfillmentType?: FulfillmentType;
  branch?: BranchInfo | null;
  address: OrderAddress | null;
  items: OrderItem[];
  deliveryHistory?: DeliveryItem[]; // Tích hợp từ Timeline
}

// ==========================================
// CONSTANTS & HELPERS
// ==========================================
const statusConfig: Record<
  OrderStatus,
  { label: string; color: string; icon: any; border: string }
> = {
  pending: {
    label: "Chờ duyệt",
    color:
      "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
    border: "border-amber-200",
    icon: Clock,
  },
  processing: {
    label: "Đang xử lý",
    color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
    border: "border-blue-200",
    icon: Activity,
  },
  shipping: {
    label: "Đang giao",
    color:
      "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
    border: "border-purple-200",
    icon: Truck,
  },
  delivered: {
    label: "Đã giao",
    color:
      "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400",
    border: "border-indigo-200",
    icon: MapPin,
  },
  completed: {
    label: "Hoàn tất",
    color:
      "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
    border: "border-green-200",
    icon: CheckCircle2,
  },
  cancelled: {
    label: "Đã hủy",
    color: "bg-gray-100 text-gray-600 dark:bg-gray-800/50 dark:text-gray-400",
    border: "border-gray-200",
    icon: XCircle,
  },
};

const WORKFLOW_STEPS: OrderStatus[] = [
  "pending",
  "processing",
  "shipping",
  "delivered",
  "completed",
];

const getOperationalHint = (order: Order) => {
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

// ==========================================
// MAIN COMPONENT
// ==========================================
const OrderWorkspacePage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showSuccessToast, showErrorToast } = useAdminToast();

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Modals
  const [showInvoice, setShowInvoice] = useState(false);
  const [showCodModal, setShowCodModal] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  // --- API Fetching ---
  const fetchDetail = async () => {
    try {
      setLoading(true);
      // NOTE: Giả định endpoint này đã bao gồm `deliveryHistory` hoặc bạn sẽ gộp 2 lời gọi API ở đây.
      const json = await http<any>("GET", `/api/v1/admin/orders/detail/${id}`);
      if (json.success && json.data) {
        // Fallback array nếu backend chưa map deliveryHistory vào detail
        const orderData = {
          ...json.data,
          deliveryHistory: json.data.deliveryHistory || [],
        };
        setOrder(orderData);
      }
    } catch (err: any) {
      showErrorToast(err.message || "Lỗi tải dữ liệu Workspace đơn hàng!");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // --- Action Handlers ---
  const handleUpdateWorkflow = async (newStatus: OrderStatus) => {
    if (!order) return;
    if (newStatus === "completed" && order.paymentStatus !== "paid") {
      showErrorToast("Không thể hoàn tất. Đơn hàng chưa được thanh toán.");
      return;
    }

    const confirmMsg =
      newStatus === "cancelled"
        ? "Bạn có chắc chắn muốn hủy đơn hàng này?"
        : `Xác nhận chuyển sang: ${statusConfig[newStatus].label}?`;
    if (!window.confirm(confirmMsg)) return;

    try {
      setActionLoading(true);
      await http("PATCH", `/api/v1/admin/orders/${order.id}/status`, {
        status: newStatus,
      });
      showSuccessToast({ message: "Cập nhật Workflow thành công!" });
      await fetchDetail();
    } catch (err: any) {
      showErrorToast(err?.message || "Lỗi cập nhật trạng thái");
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmCOD = async () => {
    if (!order) return;
    try {
      setActionLoading(true);
      await http("POST", `/api/v1/admin/orders/${order.id}/payment`, {
        amount: order.finalPrice,
      });
      showSuccessToast({ message: "Xác nhận thu COD thành công!" });
      setShowCodModal(false);
      await fetchDetail();
    } catch (err: any) {
      showErrorToast(err?.message || "Lỗi xác nhận thanh toán");
    } finally {
      setActionLoading(false);
    }
  };

  const handlePrint = () => {
    if (!printRef.current) return;
    const printContent = printRef.current.innerHTML;
    const win = window.open("", "PrintWindow", "width=800,height=900");
    if (!win) return;
    win.document.write(`
      <html>
        <head>
          <title>Hóa đơn ${order?.code}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; color: #000; background: #fff; }
            table { width: 100%; border-collapse: collapse; }
            th, td { padding: 8px; border-bottom: 1px solid #ddd; font-size: 14px; text-align: left;}
            h2, h3 { margin: 0 0 8px 0; }
            .text-right { text-align: right; }
          </style>
        </head>
        <body>${printContent}</body>
      </html>
    `);
    win.document.close();
    win.focus();
    win.print();
  };

  // --- Derived State ---
  const currentStepIndex = order ? WORKFLOW_STEPS.indexOf(order.status) : -1;
  const isCancelled = order?.status === "cancelled";

  // --- Render ---
  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-[70vh] text-gray-500 dark:text-gray-400">
        <Loader2 className="w-10 h-10 animate-spin text-blue-600 mb-4" />
        <span className="text-lg font-semibold">
          Đang tải Order Workspace...
        </span>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex flex-col justify-center items-center h-[70vh] text-gray-500">
        <AlertTriangle className="w-12 h-12 text-red-500 mb-4" />
        <p className="text-xl font-bold text-gray-800 dark:text-gray-200">
          Không tìm thấy đơn hàng
        </p>
        <button
          onClick={() => navigate(-1)}
          className="mt-6 px-6 py-2.5 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition"
        >
          Quay lại danh sách
        </button>
      </div>
    );
  }

  const statusInfo = statusConfig[order.status];

  return (
    <div className="max-w-[1600px] mx-auto pb-20 space-y-6">
      {/* VÙNG A: WORKSPACE HEADER */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
        <div>
          <button
            onClick={() => navigate("/admin/orders")}
            className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-blue-600 transition-colors mb-2"
          >
            <ArrowLeft className="w-4 h-4" /> Về Orders Board
          </button>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">
              {order.code}
            </h1>
            <span
              className={`px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider border ${statusInfo.color} ${statusInfo.border}`}
            >
              {statusInfo.label}
            </span>
            {isCancelled && (
              <span className="px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider bg-red-100 text-red-800 border border-red-200">
                Đã đóng
              </span>
            )}
            {order.status === "completed" && (
              <span className="px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider bg-gray-100 text-gray-600 border border-gray-200 dark:bg-gray-700 dark:text-gray-300">
                Khép vòng
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-2">
            <Clock className="w-3.5 h-3.5" /> Tạo lúc:{" "}
            {new Date(order.createdAt).toLocaleString()}
          </p>
        </div>

        {/* Workspace Quick Badges */}
        <div className="flex flex-wrap gap-2">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-semibold">
            {order.fulfillmentType === "pickup" ? (
              <Store className="w-4 h-4 text-blue-600" />
            ) : (
              <Truck className="w-4 h-4 text-purple-600" />
            )}
            <span className="text-gray-700 dark:text-gray-200">
              {order.fulfillmentType === "pickup" ? "Pickup" : "Delivery"}
            </span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-semibold">
            <CreditCard
              className={`w-4 h-4 ${order.paymentStatus === "paid" ? "text-green-600" : "text-orange-500"}`}
            />
            <span
              className={
                order.paymentStatus === "paid"
                  ? "text-green-700 dark:text-green-400"
                  : "text-orange-700 dark:text-orange-400"
              }
            >
              {order.paymentStatus === "paid"
                ? "Đã thanh toán"
                : "Chưa thanh toán"}
            </span>
          </div>
        </div>
      </div>

      {/* VÙNG B: WORKFLOW HERO (Stepper) */}
      <Card className="!p-6 overflow-hidden">
        <h2 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-6">
          Workflow Progress
        </h2>

        {isCancelled ? (
          <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-xl">
            <XCircle className="w-6 h-6 text-red-600" />
            <div>
              <h3 className="font-bold text-red-800 dark:text-red-400">
                Đơn hàng đã bị hủy
              </h3>
              <p className="text-sm text-red-600 dark:text-red-300">
                Tiến trình vận hành đã đóng và không thể tiếp tục.
              </p>
            </div>
          </div>
        ) : (
          <div className="relative">
            {/* Connecting Line */}
            <div className="absolute top-5 left-8 right-8 h-1 bg-gray-200 dark:bg-gray-700 rounded-full">
              <div
                className="absolute top-0 left-0 h-1 bg-blue-500 rounded-full transition-all duration-500"
                style={{
                  width: `${(Math.max(0, currentStepIndex) / (WORKFLOW_STEPS.length - 1)) * 100}%`,
                }}
              ></div>
            </div>

            <div className="flex justify-between relative z-10">
              {WORKFLOW_STEPS.map((step, idx) => {
                const isPassed = idx < currentStepIndex;
                const isCurrent = idx === currentStepIndex;
                const stepConfig = statusConfig[step];

                return (
                  <div
                    key={step}
                    className="flex flex-col items-center gap-2 w-24"
                  >
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center border-4 transition-all duration-300 ${
                        isPassed
                          ? "bg-blue-600 border-blue-200 text-white"
                          : isCurrent
                            ? "bg-white dark:bg-gray-800 border-blue-600 text-blue-600 shadow-md ring-4 ring-blue-100 dark:ring-blue-900/40"
                            : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-400"
                      }`}
                    >
                      {isPassed ? (
                        <CheckCircle2 className="w-5 h-5" />
                      ) : (
                        <stepConfig.icon className="w-5 h-5" />
                      )}
                    </div>
                    <span
                      className={`text-[11px] font-bold uppercase tracking-wider text-center ${isCurrent ? "text-blue-700 dark:text-blue-400" : isPassed ? "text-gray-800 dark:text-gray-200" : "text-gray-400"}`}
                    >
                      {stepConfig.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </Card>

      {/* MAIN LAYOUT GRID (Left 8, Right 4) */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* === CỘT TRÁI (Nội dung chính) === */}
        <div className="xl:col-span-8 space-y-6">
          {/* C1. Customer & Delivery Context */}
          <Card className="!p-0 overflow-hidden border border-gray-200 dark:border-gray-700">
            <div className="p-4 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700 flex items-center gap-2">
              <User className="w-5 h-5 text-blue-600" />
              <h2 className="text-base font-bold text-gray-900 dark:text-white">
                Thông tin Giao nhận
              </h2>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
                  Người nhận
                </p>
                <p className="font-bold text-lg text-gray-900 dark:text-white mb-1">
                  {order.address?.fullName || "Khách Vãng Lai"}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-300 flex items-center gap-2">
                  <Phone className="w-4 h-4 text-gray-400" />{" "}
                  {order.address?.phone || "Chưa cung cấp SĐT"}
                </p>
              </div>
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
                  {order.fulfillmentType === "pickup"
                    ? "Điểm nhận hàng (Pickup)"
                    : "Địa chỉ giao hàng (Delivery)"}
                </p>
                {order.fulfillmentType === "pickup" ? (
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-800">
                    <p className="font-bold text-blue-800 dark:text-blue-300">
                      {order.branch?.name}
                    </p>
                    <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">
                      Khách sẽ đến chi nhánh này để nhận hàng.
                    </p>
                  </div>
                ) : (
                  <div>
                    <p className="text-sm text-gray-800 dark:text-gray-200 leading-relaxed font-medium">
                      {order.address?.addressLine1}{" "}
                      {order.address?.addressLine2 &&
                        `, ${order.address.addressLine2}`}
                      <br />
                      {order.address?.ward}, {order.address?.district},{" "}
                      {order.address?.province}
                    </p>
                    {order.address?.notes && (
                      <p className="mt-3 text-sm text-amber-700 bg-amber-50 dark:bg-amber-900/20 dark:text-amber-400 p-2 rounded-lg border border-amber-100 dark:border-amber-800">
                        <strong>Ghi chú:</strong> {order.address.notes}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </Card>

          {/* C3. Order Items */}
          <Card className="!p-0 overflow-hidden border border-gray-200 dark:border-gray-700">
            <div className="p-4 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700 flex items-center gap-2 justify-between">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-indigo-600" />
                <h2 className="text-base font-bold text-gray-900 dark:text-white">
                  Sản phẩm trong đơn
                </h2>
              </div>
              <span className="text-xs font-bold text-gray-500 bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">
                {order.items.length} mục
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 text-xs text-gray-400 uppercase">
                  <tr>
                    <th className="py-3 px-5 text-left font-semibold">
                      Sản phẩm
                    </th>
                    <th className="py-3 px-5 text-right font-semibold">
                      Đơn giá
                    </th>
                    <th className="py-3 px-5 text-center font-semibold">SL</th>
                    <th className="py-3 px-5 text-right font-semibold">
                      Thành tiền
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {order.items.map((item, idx) => (
                    <tr
                      key={idx}
                      className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                    >
                      <td className="py-3 px-5">
                        <div className="font-bold text-gray-900 dark:text-white">
                          {item.productTitle}
                        </div>
                        {item.variantTitle && (
                          <div className="text-[11px] font-medium text-gray-500 mt-0.5">
                            {item.variantTitle}
                          </div>
                        )}
                        {item.variantSku && (
                          <div className="text-[10px] text-gray-400 font-mono mt-0.5">
                            SKU: {item.variantSku}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-5 text-right text-gray-600 dark:text-gray-400 font-medium">
                        {item.price.toLocaleString()} đ
                      </td>
                      <td className="py-3 px-5 text-center font-bold text-gray-900 dark:text-white">
                        {item.quantity}
                      </td>
                      <td className="py-3 px-5 text-right font-bold text-green-700 dark:text-green-400">
                        {(item.price * item.quantity).toLocaleString()} đ
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* D. Integrated Timeline */}
          {order.fulfillmentType === "delivery" && (
            <Card className="!p-0 overflow-hidden border border-gray-200 dark:border-gray-700">
              <div className="p-4 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700 flex items-center gap-2">
                <Activity className="w-5 h-5 text-purple-600" />
                <h2 className="text-base font-bold text-gray-900 dark:text-white">
                  Tiến trình Giao hàng
                </h2>
              </div>
              <div className="p-6">
                {!order.deliveryHistory ||
                order.deliveryHistory.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 bg-gray-50 dark:bg-gray-800/30 rounded-xl border border-dashed border-gray-200 dark:border-gray-700">
                    Chưa có ghi nhận giao hàng nào từ hệ thống logistics.
                  </div>
                ) : (
                  <div className="relative border-l-2 border-gray-200 dark:border-gray-700 ml-4 space-y-8">
                    {order.deliveryHistory.map((log, index) => {
                      const isLast =
                        index === order.deliveryHistory!.length - 1;
                      return (
                        <div key={log.id} className="relative pl-6">
                          <div
                            className={`absolute -left-[9px] top-1 w-4 h-4 rounded-full border-2 bg-white dark:bg-gray-900 ${isLast ? "border-purple-500 ring-4 ring-purple-100 dark:ring-purple-900/30" : "border-gray-300 dark:border-gray-600"}`}
                          ></div>
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span
                                className={`font-bold text-sm ${isLast ? "text-purple-700 dark:text-purple-400" : "text-gray-700 dark:text-gray-300"}`}
                              >
                                {log.status}
                              </span>
                              <span className="text-[11px] text-gray-400 font-medium flex items-center gap-1">
                                <Clock className="w-3 h-3" />{" "}
                                {new Date(log.createdAt).toLocaleString()}
                              </span>
                            </div>
                            {log.note && (
                              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                {log.note}
                              </p>
                            )}
                            {log.location && (
                              <p className="text-xs text-gray-400 mt-1 font-medium flex items-center gap-1">
                                <MapPin className="w-3 h-3" /> {log.location}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </Card>
          )}
        </div>

        {/* === CỘT PHẢI (Action Center & Ops) === */}
        <div className="xl:col-span-4 space-y-6">
          {/* E. ACTION CENTER (Workflow Panel) */}
          <Card className="!p-0 border-none shadow-lg overflow-hidden border border-blue-200 dark:border-blue-900/30 ring-1 ring-blue-50 dark:ring-gray-800">
            <div className="bg-blue-600 p-5 text-white">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5" /> Thao tác khả dụng
              </h2>
            </div>
            <div className="p-5 space-y-4 bg-white dark:bg-gray-900">
              {/* Context Hint */}
              <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg border border-gray-100 dark:border-gray-700">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                  Gợi ý hệ thống:
                </p>
                <p className="text-sm font-bold text-gray-900 dark:text-white">
                  {order.status === "delivered" &&
                  order.paymentStatus !== "paid" ? (
                    <span className="text-orange-600 flex items-start gap-1.5">
                      <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" /> Cần
                      xác nhận thu COD trước khi hoàn tất đơn.
                    </span>
                  ) : (
                    getOperationalHint(order)
                  )}
                </p>
              </div>

              {/* Dynamic Action Buttons */}
              <div className="space-y-3 pt-2">
                {actionLoading && (
                  <div className="flex justify-center py-2">
                    <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                  </div>
                )}
                {!actionLoading && (
                  <>
                    {order.status === "pending" && (
                      <>
                        <button
                          onClick={() => handleUpdateWorkflow("processing")}
                          className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md transition flex items-center justify-center gap-2"
                        >
                          Duyệt đơn <ArrowRight className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleUpdateWorkflow("cancelled")}
                          className="w-full py-2.5 bg-white hover:bg-red-50 text-red-600 font-bold rounded-xl border border-red-200 transition"
                        >
                          Hủy đơn hàng
                        </button>
                      </>
                    )}

                    {order.status === "processing" && (
                      <>
                        {order.fulfillmentType === "delivery" ? (
                          <button
                            onClick={() => handleUpdateWorkflow("shipping")}
                            className="w-full py-3.5 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl shadow-md transition flex items-center justify-center gap-2"
                          >
                            Giao cho Vận chuyển <Truck className="w-4 h-4" />
                          </button>
                        ) : (
                          <button
                            onClick={() => handleUpdateWorkflow("delivered")}
                            className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md transition flex items-center justify-center gap-2"
                          >
                            Khách đã đến nhận{" "}
                            <PackageCheck className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleUpdateWorkflow("cancelled")}
                          className="w-full py-2.5 bg-white hover:bg-red-50 text-red-600 font-bold rounded-xl border border-red-200 transition"
                        >
                          Hủy đơn hàng
                        </button>
                      </>
                    )}

                    {order.status === "shipping" && (
                      <button
                        onClick={() => handleUpdateWorkflow("delivered")}
                        className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md transition flex items-center justify-center gap-2"
                      >
                        Đánh dấu Đã Giao <MapPin className="w-4 h-4" />
                      </button>
                    )}

                    {order.status === "delivered" &&
                      (order.paymentStatus === "paid" ? (
                        <button
                          onClick={() => handleUpdateWorkflow("completed")}
                          className="w-full py-3.5 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl shadow-md transition flex items-center justify-center gap-2"
                        >
                          Hoàn tất đơn hàng <CheckCircle2 className="w-5 h-5" />
                        </button>
                      ) : (
                        <button
                          onClick={() => setShowCodModal(true)}
                          className="w-full py-3.5 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl shadow-md transition flex items-center justify-center gap-2"
                        >
                          Xác nhận thu COD <Banknote className="w-5 h-5" />
                        </button>
                      ))}

                    {(order.status === "completed" ||
                      order.status === "cancelled") && (
                      <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg text-sm text-gray-500 font-medium border border-gray-200 dark:border-gray-700">
                        Vòng đời đơn hàng đã khép kín. Không còn thao tác
                        Workflow khả dụng.
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </Card>

          {/* C4. Payment Breakdown */}
          <Card className="!p-0 border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="p-4 border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 flex justify-between items-center">
              <h2 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Banknote className="w-5 h-5 text-green-600" /> Thanh toán
              </h2>
              <span
                className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${order.paymentStatus === "paid" ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"}`}
              >
                {order.paymentStatus === "paid" ? "Đã thu tiền" : "COD / Nợ"}
              </span>
            </div>
            <div className="p-5 space-y-3 text-sm">
              <div className="flex justify-between text-gray-600 dark:text-gray-400">
                <span>Tạm tính</span>{" "}
                <span className="font-medium">
                  {order.totalPrice.toLocaleString()} đ
                </span>
              </div>
              <div className="flex justify-between text-gray-600 dark:text-gray-400">
                <span>Phí vận chuyển</span>{" "}
                <span className="font-medium">
                  {order.shippingFee.toLocaleString()} đ
                </span>
              </div>
              {order.discountAmount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Giảm giá</span>{" "}
                  <span className="font-medium">
                    - {order.discountAmount.toLocaleString()} đ
                  </span>
                </div>
              )}
              <div className="border-t border-gray-100 dark:border-gray-800 pt-3 mt-3 flex justify-between items-center">
                <span className="font-bold text-gray-900 dark:text-white">
                  Tổng cộng
                </span>
                <span className="text-2xl font-black text-green-600 dark:text-green-500">
                  {order.finalPrice.toLocaleString()} đ
                </span>
              </div>
            </div>
            {order.paymentStatus !== "paid" && order.status !== "cancelled" && (
              <div className="p-4 bg-orange-50 dark:bg-orange-900/20 border-t border-orange-100 dark:border-orange-900/50 text-center">
                <button
                  onClick={() => setShowCodModal(true)}
                  className="text-sm font-bold text-orange-600 hover:text-orange-800"
                >
                  Nhấn để Xác nhận đã thu tiền
                </button>
              </div>
            )}
          </Card>

          {/* C2. Fulfillment & Routing Snapshot */}
          <Card className="border border-gray-200 dark:border-gray-700">
            <h2 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
              <GitBranch className="w-5 h-5 text-gray-400" /> Routing & Meta
            </h2>
            <div className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
              <div className="flex justify-between">
                <span>Chi nhánh xử lý:</span>
                <span className="font-bold text-gray-900 dark:text-white">
                  {order.branch?.name || "Chưa gán"}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Trừ tồn kho (Inventory):</span>
                {order.inventoryApplied ? (
                  <span className="font-bold text-green-600">Đã kích hoạt</span>
                ) : (
                  <span className="font-medium text-gray-400">
                    Chưa áp dụng
                  </span>
                )}
              </div>
              <div className="flex justify-between">
                <span>Fulfillment Type:</span>
                <span className="font-medium capitalize">
                  {order.fulfillmentType}
                </span>
              </div>
            </div>
          </Card>

          {/* F. Documents & Tools */}
          <Card className="border border-gray-200 dark:border-gray-700">
            <h2 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
              <FileText className="w-5 h-5 text-gray-400" /> Công cụ chứng từ
            </h2>
            <button
              onClick={() => setShowInvoice(true)}
              className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-700 rounded-xl border border-gray-200 dark:border-gray-700 transition"
            >
              <span className="font-semibold text-gray-700 dark:text-gray-300 text-sm">
                Xem & In hóa đơn
              </span>
              <Printer className="w-4 h-4 text-gray-500" />
            </button>
          </Card>
        </div>
      </div>

      {/* ========================================== */}
      {/* MODALS */}
      {/* ========================================== */}

      {/* PAYMENT COD MODAL */}
      {showCodModal && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-2xl w-full max-w-md border border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Banknote className="w-5 h-5 text-orange-500" /> Xác nhận thu
                COD
              </h2>
              <button
                onClick={() => setShowCodModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-xl p-6 text-center mb-6">
              <p className="text-sm text-orange-800 dark:text-orange-400 font-medium mb-1">
                Số tiền cần thu từ khách
              </p>
              <p className="text-4xl font-black text-orange-600 dark:text-orange-500">
                {order.finalPrice.toLocaleString()} đ
              </p>
            </div>
            <p className="text-xs text-gray-500 text-center mb-6 px-4">
              Hành động này sẽ cập nhật Payment Status thành{" "}
              <strong>Đã thanh toán</strong>.{" "}
              {order.status === "delivered" &&
                "Sau đó bạn có thể Hoàn tất đơn hàng."}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowCodModal(false)}
                className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl transition"
              >
                Hủy
              </button>
              <button
                onClick={handleConfirmCOD}
                disabled={actionLoading}
                className="flex-1 py-3 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl transition shadow-md"
              >
                {actionLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                ) : (
                  "Xác nhận đã thu"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* INVOICE MODAL (Giữ logic preview cũ, bọc trong UI mới) */}
      {showInvoice && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-100 rounded-2xl shadow-2xl w-full max-w-lg p-6 relative">
            <h2 className="text-xl font-bold mb-4 text-gray-900">
              Xem trước hóa đơn
            </h2>
            <div
              ref={printRef}
              className="border border-gray-300 p-6 text-sm bg-white text-gray-900 rounded-lg"
            >
              <h2 className="text-center text-2xl font-bold mb-2">
                HÓA ĐƠN FREESH FRUITS
              </h2>
              <p>
                <strong>Mã đơn:</strong> {order.code}
              </p>
              <p>
                <strong>Ngày:</strong>{" "}
                {new Date(order.createdAt).toLocaleString()}
              </p>
              <p>
                <strong>Chi nhánh:</strong> {order.branch?.name || "—"}
              </p>
              <hr className="my-3 border-gray-300" />
              <h3 className="font-bold mb-1">Khách hàng:</h3>
              <p>
                {order.address?.fullName || "—"} - {order.address?.phone || "—"}
              </p>
              <p>
                {order.address
                  ? `${order.address.addressLine1}, ${order.address.ward}, ${order.address.district}, ${order.address.province}`
                  : ""}
              </p>
              <hr className="my-3 border-gray-300" />
              <table className="w-full text-sm text-gray-900">
                <thead>
                  <tr className="border-b border-gray-400">
                    <th className="py-2 text-left">Sản phẩm</th>
                    <th className="py-2 text-center">SL</th>
                    <th className="py-2 text-right">Đơn giá</th>
                  </tr>
                </thead>
                <tbody>
                  {order.items.map((item, idx) => (
                    <tr key={idx} className="border-b border-gray-200">
                      <td className="py-2">
                        <div>{item.productTitle}</div>
                        {item.variantTitle && (
                          <div className="text-[11px] text-gray-500">
                            {item.variantTitle}
                          </div>
                        )}
                      </td>
                      <td className="py-2 text-center">{item.quantity}</td>
                      <td className="py-2 text-right">
                        {(item.price * item.quantity).toLocaleString()} đ
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="mt-4 text-right space-y-1">
                <p>Tạm tính: {order.totalPrice.toLocaleString()} đ</p>
                <p>Phí ship: {order.shippingFee.toLocaleString()} đ</p>
                {order.discountAmount > 0 && (
                  <p>Giảm giá: -{order.discountAmount.toLocaleString()} đ</p>
                )}
                <p className="font-bold text-lg mt-2">
                  Tổng cộng: {order.finalPrice.toLocaleString()} đ
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowInvoice(false)}
                className="px-5 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold rounded-xl"
              >
                Đóng
              </button>
              <button
                onClick={handlePrint}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl flex items-center gap-2"
              >
                <Printer className="w-4 h-4" /> In hóa đơn
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderWorkspacePage;
