import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Loader2,
  Printer,
  GitBranch,
  ShoppingBag,
} from "lucide-react";
import Card from "../../../components/admin/layouts/Card";
import { http } from "../../../services/http";
import { useAdminToast } from "../../../context/AdminToastContext";

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

interface Order {
  id: number;
  code: string;
  status: string;
  paymentStatus: string;
  shippingFee: number;
  discountAmount: number;
  totalPrice: number;
  finalPrice: number;
  trackingToken?: string;
  inventoryApplied: boolean;
  createdAt: string;
  branchId?: number;
  fulfillmentType?: "pickup" | "delivery";
  branch?: BranchInfo | null;
  address: OrderAddress | null;
  items: OrderItem[];
}

const OrdersDetailPageAdmin: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  const { showErrorToast } = useAdminToast();
  const [showInvoice, setShowInvoice] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  const fetchDetail = async () => {
    try {
      setLoading(true);

      const json = await http<any>("GET", `/api/v1/admin/orders/detail/${id}`);

      if (json.success && json.data) {
        setOrder(json.data);
      }
    } catch (err: any) {
      console.error(err);
      showErrorToast(err.message || "Lỗi tải dữ liệu đơn hàng!");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
  }, [id]);

  const statusMap: any = {
    pending: {
      label: "Chờ duyệt",
      color:
        "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
    },
    processing: {
      label: "Đang xử lý",
      color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
    },
    shipping: {
      label: "Đang giao",
      color:
        "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
    },
    delivered: {
      label: "Đã giao",
      color:
        "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
    },
    completed: {
      label: "Hoàn thành",
      color:
        "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
    },
    cancelled: {
      label: "Đã hủy",
      color: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
    },
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
            th, td { padding: 6px; border-bottom: 1px solid #ddd; font-size: 14px; }
            h2, h3 { margin: 0 0 8px 0; }
          </style>
        </head>
        <body>${printContent}</body>
      </html>
    `);

    win.document.close();
    win.focus();
    win.print();
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[70vh] dark:text-gray-300">
        <Loader2 className="w-6 h-6 animate-spin text-gray-500 dark:text-gray-400" />
        <span className="ml-2">Đang tải...</span>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="p-4 text-center dark:text-gray-300">
        <p className="text-red-500 dark:text-red-400">
          Không tìm thấy đơn hàng
        </p>
        <button
          onClick={() => navigate(-1)}
          className="mt-4 px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-white"
        >
          Quay lại
        </button>
      </div>
    );
  }

  const statusInfo = statusMap[order.status] || {
    label: order.status,
    color: "bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300",
  };

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
            Chi tiết đơn hàng
          </h1>
        </div>

        <div className="flex gap-3 flex-wrap">
          <button
            onClick={() => navigate(`/admin/orders/${order.id}/timeline`)}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Xem tiến trình giao hàng
          </button>
          <button
            onClick={() => setShowInvoice(true)}
            className="flex items-center gap-2 px-4 py-2 text-sm bg-green-600 text-white rounded hover:bg-green-700"
          >
            <Printer className="w-4 h-4" />
            In hóa đơn
          </button>

          <button
            onClick={() => navigate("/admin/orders")}
            className="flex items-center gap-2 px-4 py-2 text-sm bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-white rounded"
          >
            <ArrowLeft className="w-4 h-4" />
            Quay lại
          </button>
        </div>
      </div>

      <Card className="mb-4">
        <div className="p-6">
          <div className="flex flex-col md:flex-row justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
                Đơn hàng: {order.code}
              </h2>
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                Ngày đặt: {new Date(order.createdAt).toLocaleString()}
              </p>

              <div className="flex flex-wrap gap-2 mt-3">
                <span
                  className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${statusInfo.color}`}
                >
                  {statusInfo.label}
                </span>

                <span
                  className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                    order.fulfillmentType === "pickup"
                      ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                      : "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300"
                  }`}
                >
                  {order.fulfillmentType === "pickup" ? "Pickup" : "Delivery"}
                </span>
              </div>
            </div>

            <div className="text-right">
              <p className="text-gray-600 dark:text-gray-400 mb-1">
                Tổng thanh toán:
              </p>
              <p className="text-2xl text-green-700 dark:text-green-400 font-bold">
                {order.finalPrice.toLocaleString()} đ
              </p>

              {order.paymentStatus === "paid" ? (
                <span className="inline-block mt-2 px-3 py-1 rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 text-xs font-semibold">
                  ĐÃ THANH TOÁN
                </span>
              ) : (
                <span className="inline-block mt-2 px-3 py-1 rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 text-xs font-semibold">
                  CHƯA THANH TOÁN
                </span>
              )}
            </div>
          </div>
        </div>
      </Card>

      <Card className="mb-4">
        <div className="p-6">
          <h2 className="text-lg font-semibold mb-3 dark:text-white">
            Thông tin chi nhánh xử lý
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-700 dark:text-gray-300">
            <p className="flex items-center gap-2">
              <GitBranch className="w-4 h-4 text-gray-400" />
              <span className="font-medium">Chi nhánh:</span>
              {order.branch?.name || "—"}
            </p>
            <p>
              <span className="font-medium">Mã chi nhánh:</span>{" "}
              {order.branch?.code || "—"}
            </p>
            <p>
              <span className="font-medium">Branch ID:</span>{" "}
              {order.branchId || order.branch?.id || "—"}
            </p>
            <p>
              <span className="font-medium">Fulfillment:</span>{" "}
              {order.fulfillmentType === "pickup" ? "Pickup" : "Delivery"}
            </p>
          </div>
        </div>
      </Card>

      <Card className="mb-4">
        <div className="p-6">
          <h2 className="text-lg font-semibold mb-3 dark:text-white">
            Thông tin giao hàng
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-gray-700 dark:text-gray-300">
            <p>
              <span className="font-medium">Họ tên: </span>
              {order.address?.fullName || "—"}
            </p>
            <p>
              <span className="font-medium">Số điện thoại: </span>
              {order.address?.phone || "—"}
            </p>
            <p className="sm:col-span-2">
              <span className="font-medium">Địa chỉ: </span>
              {order.address ? (
                <>
                  {order.address.addressLine1},{" "}
                  {order.address.addressLine2 &&
                    order.address.addressLine2 + ", "}
                  {order.address.ward}, {order.address.district},{" "}
                  {order.address.province}
                </>
              ) : (
                "—"
              )}
            </p>
            {order.address?.notes && (
              <p className="sm:col-span-2">
                <span className="font-medium">Ghi chú: </span>
                {order.address.notes}
              </p>
            )}
          </div>
        </div>
      </Card>

      <Card className="mb-4">
        <div className="p-6">
          <h2 className="text-lg font-semibold mb-3 dark:text-white">
            Sản phẩm trong đơn
          </h2>

          <table className="w-full text-sm dark:text-gray-300">
            <thead>
              <tr className="text-left border-b dark:border-gray-700">
                <th className="py-2">Sản phẩm</th>
                <th className="py-2">Giá</th>
                <th className="py-2">SL</th>
                <th className="py-2">Thành tiền</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((item, idx) => (
                <tr
                  key={`${item.productId ?? "x"}-${item.productVariantId ?? "no-variant"}-${idx}`}
                  className="border-b dark:border-gray-700"
                >
                  <td className="py-2">
                    <div className="font-medium text-gray-900 dark:text-gray-100 flex items-center gap-2">
                      <ShoppingBag className="w-4 h-4 text-gray-400" />
                      <span>{item.productTitle}</span>
                    </div>

                    {item.variantTitle && (
                      <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 mt-1">
                        {item.variantTitle}
                      </div>
                    )}

                    {item.variantSku && (
                      <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                        SKU: {item.variantSku}
                      </div>
                    )}
                  </td>

                  <td className="py-2">{item.price.toLocaleString()} đ</td>
                  <td className="py-2">{item.quantity}</td>
                  <td className="py-2 font-medium">
                    {(item.price * item.quantity).toLocaleString()} đ
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card>
        <div className="p-6 text-sm dark:text-gray-300">
          <h2 className="text-lg font-semibold mb-3 dark:text-white">
            Chi tiết thanh toán
          </h2>

          <div className="space-y-2">
            <p>
              <span className="font-medium">Tạm tính: </span>
              {order.totalPrice.toLocaleString()} đ
            </p>

            <p>
              <span className="font-medium">Phí vận chuyển: </span>
              {order.shippingFee.toLocaleString()} đ
            </p>

            {order.discountAmount > 0 && (
              <p className="text-green-700 dark:text-green-400">
                <span className="font-medium">Giảm giá: </span>-
                {order.discountAmount.toLocaleString()} đ
              </p>
            )}

            <p className="font-bold text-green-700 dark:text-green-400 text-lg pt-2 border-t dark:border-gray-700">
              Tổng thanh toán: {order.finalPrice.toLocaleString()} đ
            </p>
          </div>
        </div>
      </Card>

      {showInvoice && (
        <div className="fixed inset-0 bg-black bg-opacity-40 dark:bg-opacity-60 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded shadow-lg w-full max-w-lg p-6 relative">
            <h2 className="text-lg font-semibold mb-4 dark:text-white">
              Xem trước hóa đơn
            </h2>

            <div
              ref={printRef}
              className="border p-4 text-sm bg-white text-gray-900"
            >
              <h2 className="text-center text-xl font-bold mb-2">
                HÓA ĐƠN GIAO HÀNG-FRESH FRUITS
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
              <p>
                <strong>Hình thức:</strong>{" "}
                {order.fulfillmentType === "pickup" ? "Pickup" : "Delivery"}
              </p>

              <hr className="my-2 border-gray-300" />

              <h3 className="font-semibold mb-1">Thông tin khách hàng:</h3>
              <p>{order.address?.fullName || "—"}</p>
              <p>{order.address?.phone || "—"}</p>
              <p>
                {order.address ? (
                  <>
                    {order.address.addressLine1}, {order.address.ward},{" "}
                    {order.address.district}, {order.address.province}
                  </>
                ) : (
                  "—"
                )}
              </p>

              <hr className="my-2 border-gray-300" />

              <h3 className="font-semibold mb-1">Sản phẩm:</h3>

              <table className="w-full text-xs text-gray-900">
                <thead>
                  <tr className="border-b border-gray-300">
                    <th className="py-1 text-left">Tên</th>
                    <th className="py-1 text-right">SL</th>
                    <th className="py-1 text-right">Giá</th>
                  </tr>
                </thead>
                <tbody>
                  {order.items.map((item, idx) => (
                    <tr
                      key={`${item.productId ?? "x"}-${item.productVariantId ?? "no-variant"}-${idx}`}
                      className="border-b border-gray-200"
                    >
                      <td className="py-1">
                        <div>{item.productTitle}</div>
                        {item.variantTitle && (
                          <div
                            style={{
                              fontSize: "11px",
                              color: "#666",
                              marginTop: "2px",
                            }}
                          >
                            {item.variantTitle}
                          </div>
                        )}
                        {item.variantSku && (
                          <div
                            style={{
                              fontSize: "10px",
                              color: "#888",
                              marginTop: "2px",
                            }}
                          >
                            SKU: {item.variantSku}
                          </div>
                        )}
                      </td>
                      <td className="py-1 text-right">{item.quantity}</td>
                      <td className="py-1 text-right">
                        {(item.price * item.quantity).toLocaleString()} đ
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <hr className="my-2 border-gray-300" />

              <p>
                <strong>Tạm tính:</strong> {order.totalPrice.toLocaleString()} đ
              </p>
              <p>
                <strong>Phí ship:</strong> {order.shippingFee.toLocaleString()}{" "}
                đ
              </p>

              {order.discountAmount > 0 && (
                <p className="text-green-700">
                  <strong>Giảm giá:</strong> -
                  {order.discountAmount.toLocaleString()} đ
                </p>
              )}

              <p className="font-bold mt-2 text-lg">
                Tổng cộng: {order.finalPrice.toLocaleString()} đ
              </p>
            </div>

            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={() => setShowInvoice(false)}
                className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-white"
              >
                Đóng
              </button>

              <button
                onClick={handlePrint}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 flex items-center gap-2"
              >
                <Printer className="w-4 h-4" />
                In hóa đơn
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrdersDetailPageAdmin;
