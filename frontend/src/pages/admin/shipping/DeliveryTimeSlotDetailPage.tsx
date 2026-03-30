import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Edit,
  Loader2,
  Clock3,
  Hash,
  TimerReset,
  PackageCheck,
} from "lucide-react";
import Card from "../../../components/admin/layouts/Card";
import { http } from "../../../services/http";
import { useAdminToast } from "../../../context/AdminToastContext";

interface DeliveryTimeSlotDetail {
  id: number;
  code: string;
  label: string;
  startTime: string;
  endTime: string;
  cutoffMinutes: number;
  maxOrders?: number | null;
  sortOrder: number;
  status: "active" | "inactive";
  createdAt?: string;
  updatedAt?: string;
}

type ApiDetail<T> = { success: true; data: T; meta?: any };

const formatTime = (value?: string) => {
  if (!value) return "—";
  return String(value).slice(0, 5);
};

const formatMaxOrders = (value?: number | null) => {
  if (value === null || value === undefined) return "Không giới hạn";
  return `${Number(value).toLocaleString("vi-VN")} đơn`;
};

const DeliveryTimeSlotDetailPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showErrorToast } = useAdminToast();

  const [row, setRow] = useState<DeliveryTimeSlotDetail | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchDetail = async () => {
    try {
      setLoading(true);

      const detailRes = await http<ApiDetail<DeliveryTimeSlotDetail>>(
        "GET",
        `/api/v1/admin/delivery-time-slots/detail/${id}`,
      );

      if (detailRes?.success && detailRes.data) {
        setRow(detailRes.data);
      } else {
        showErrorToast("Không thể tải chi tiết khung giờ giao hàng.");
      }
    } catch (err: any) {
      console.error(err);
      showErrorToast(err?.message || "Lỗi tải chi tiết khung giờ giao hàng.");
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

  if (!row) return null;

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-6 gap-4">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
          Chi tiết khung giờ giao hàng
        </h1>

        <div className="flex gap-3">
          <button
            onClick={() =>
              navigate(`/admin/shipping/delivery-slots/edit/${row.id}`)
            }
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-900/30 hover:bg-blue-200 dark:hover:bg-blue-900/50 rounded-md transition-colors"
          >
            <Edit className="w-4 h-4" /> Chỉnh sửa
          </button>

          <button
            onClick={() => navigate("/admin/shipping/delivery-slots")}
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
              <div className="flex items-start gap-3">
                <Hash className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Mã khung giờ
                  </p>
                  <p className="font-medium">{row.code}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Clock3 className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Tên khung giờ
                  </p>
                  <p className="font-medium">{row.label}</p>
                </div>
              </div>

              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Trạng thái
                </p>
                <span
                  className={`inline-flex mt-1 px-3 py-1 rounded-full text-xs font-semibold ${
                    row.status === "active"
                      ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                      : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
                  }`}
                >
                  {row.status === "active" ? "Hoạt động" : "Tạm dừng"}
                </span>
              </div>

              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Thứ tự sắp xếp
                </p>
                <p className="font-medium mt-1">{row.sortOrder}</p>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
              Cấu hình thời gian
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-gray-800 dark:text-gray-200">
              <div className="flex items-start gap-3">
                <Clock3 className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Giờ bắt đầu
                  </p>
                  <p className="font-medium">{formatTime(row.startTime)}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Clock3 className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Giờ kết thúc
                  </p>
                  <p className="font-medium">{formatTime(row.endTime)}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <TimerReset className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Cutoff minutes
                  </p>
                  <p className="font-medium">{row.cutoffMinutes} phút</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <PackageCheck className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Số đơn tối đa
                  </p>
                  <p className="font-medium">
                    {formatMaxOrders(row.maxOrders)}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-4 rounded-lg border border-dashed border-gray-300 dark:border-gray-600 p-4 bg-gray-50 dark:bg-gray-800/40">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Xem trước khung giờ:
              </p>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                {formatTime(row.startTime)} - {formatTime(row.endTime)}
              </p>
            </div>
          </div>

          <div className="border-t border-gray-200 dark:border-gray-700 pt-6 grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-gray-700 dark:text-gray-300">
            <p>
              <span className="font-medium text-gray-500 dark:text-gray-400">
                Ngày tạo:
              </span>{" "}
              {row.createdAt ? new Date(row.createdAt).toLocaleString() : "—"}
            </p>
            <p>
              <span className="font-medium text-gray-500 dark:text-gray-400">
                Cập nhật gần nhất:
              </span>{" "}
              {row.updatedAt ? new Date(row.updatedAt).toLocaleString() : "—"}
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default DeliveryTimeSlotDetailPage;
