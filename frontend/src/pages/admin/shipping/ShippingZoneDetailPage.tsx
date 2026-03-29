import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Edit,
  Loader2,
  MapPinned,
  Truck,
  BadgePercent,
  ArrowUpDown,
} from "lucide-react";
import Card from "../../../components/admin/layouts/Card";
import { http } from "../../../services/http";
import { useAdminToast } from "../../../context/AdminToastContext";

interface ShippingZone {
  id: number;
  code: string;
  name: string;
  province?: string | null;
  district?: string | null;
  ward?: string | null;
  baseFee: number;
  freeShipThreshold?: number | null;
  priority: number;
  status: "active" | "inactive";
  createdAt?: string;
  updatedAt?: string;
}

type ApiDetail<T> = { success: true; data: T; meta?: any };

const formatCurrency = (value?: number | null) => {
  const amount = Number(value ?? 0);
  return amount.toLocaleString("vi-VN") + " đ";
};

const ShippingZoneDetailPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showErrorToast } = useAdminToast();

  const [zone, setZone] = useState<ShippingZone | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchDetail = async () => {
    try {
      setLoading(true);
      const res = await http<ApiDetail<ShippingZone>>(
        "GET",
        `/api/v1/admin/shipping-zones/detail/${id}`,
      );

      if (res?.success && res.data) {
        setZone(res.data);
      } else {
        showErrorToast("Không thể tải chi tiết vùng giao hàng.");
      }
    } catch (err: any) {
      console.error(err);
      showErrorToast(err?.message || "Lỗi tải chi tiết vùng giao hàng.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-gray-500 dark:text-gray-400" />
        <span className="ml-2 text-gray-600 dark:text-gray-400">
          Đang tải dữ liệu...
        </span>
      </div>
    );
  }

  if (!zone) return null;

  const fullArea = [zone.ward, zone.district, zone.province]
    .filter(Boolean)
    .join(", ");

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-6 gap-4">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
          Chi tiết vùng giao hàng
        </h1>

        <div className="flex gap-3">
          <button
            onClick={() => navigate(`/admin/shipping/zones/edit/${zone.id}`)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-900/30 hover:bg-blue-200 dark:hover:bg-blue-900/50 rounded-md transition-colors"
          >
            <Edit className="w-4 h-4" /> Chỉnh sửa
          </button>

          <button
            onClick={() => navigate("/admin/shipping/zones")}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-md transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Quay lại
          </button>
        </div>
      </div>

      <Card>
        <div className="space-y-8 p-2">
          <div>
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
              Thông tin cơ bản
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-gray-800 dark:text-gray-200">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Tên vùng
                </p>
                <p className="font-semibold text-lg mt-1">{zone.name}</p>
              </div>

              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Mã vùng
                </p>
                <p className="font-semibold text-lg mt-1">{zone.code}</p>
              </div>

              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Trạng thái
                </p>
                <span
                  className={`inline-flex mt-1 px-3 py-1 rounded-full text-xs font-semibold ${
                    zone.status === "active"
                      ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                      : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
                  }`}
                >
                  {zone.status === "active" ? "Hoạt động" : "Tạm dừng"}
                </span>
              </div>

              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Độ ưu tiên
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <ArrowUpDown className="w-4 h-4 text-gray-400" />
                  <span className="font-medium">{zone.priority}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
              Khu vực áp dụng
            </h2>

            <div className="flex items-start gap-3 text-gray-800 dark:text-gray-200">
              <MapPinned className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <p className="font-medium">
                  {fullArea || "Vùng mặc định / toàn khu vực"}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Match theo độ cụ thể của địa chỉ và ưu tiên nhỏ hơn sẽ được
                  chọn trước.
                </p>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
              Cấu hình phí giao hàng
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-gray-800 dark:text-gray-200">
              <div className="flex items-start gap-3">
                <Truck className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Phí giao hàng cơ bản
                  </p>
                  <p className="font-medium">{formatCurrency(zone.baseFee)}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <BadgePercent className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Ngưỡng freeship
                  </p>
                  <p className="font-medium">
                    {zone.freeShipThreshold !== null &&
                    zone.freeShipThreshold !== undefined
                      ? formatCurrency(zone.freeShipThreshold)
                      : "Không áp dụng"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-200 dark:border-gray-700 pt-6 grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-gray-700 dark:text-gray-300">
            <p>
              <span className="font-medium text-gray-500 dark:text-gray-400">
                Ngày tạo:
              </span>{" "}
              {zone.createdAt ? new Date(zone.createdAt).toLocaleString() : "—"}
            </p>
            <p>
              <span className="font-medium text-gray-500 dark:text-gray-400">
                Cập nhật gần nhất:
              </span>{" "}
              {zone.updatedAt ? new Date(zone.updatedAt).toLocaleString() : "—"}
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default ShippingZoneDetailPage;
