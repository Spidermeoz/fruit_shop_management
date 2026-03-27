import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Edit,
  Loader2,
  MapPinned,
  Phone,
  Mail,
  Clock3,
  LocateFixed,
} from "lucide-react";
import Card from "../../../components/admin/layouts/Card";
import { http } from "../../../services/http";
import { useAdminToast } from "../../../context/AdminToastContext";

interface Branch {
  id: number;
  name: string;
  code: string;
  phone?: string | null;
  email?: string | null;
  addressLine1?: string | null;
  addressLine2?: string | null;
  ward?: string | null;
  district?: string | null;
  province?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  openTime?: string | null;
  closeTime?: string | null;
  supportsPickup?: boolean;
  supportsDelivery?: boolean;
  status: "active" | "inactive";
  deleted?: boolean;
  deletedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

type ApiDetail<T> = { success: true; data: T; meta?: any };

const BranchDetailPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showErrorToast } = useAdminToast();

  const [branch, setBranch] = useState<Branch | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchDetail = async () => {
    try {
      setLoading(true);
      const res = await http<ApiDetail<Branch>>(
        "GET",
        `/api/v1/admin/branches/${id}`,
      );

      if (res?.success && res.data) {
        setBranch(res.data);
      } else {
        showErrorToast("Không thể tải chi tiết chi nhánh.");
      }
    } catch (err: any) {
      console.error(err);
      showErrorToast(err?.message || "Lỗi tải chi tiết chi nhánh.");
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

  if (!branch) return null;

  const fullAddress = [
    branch.addressLine1,
    branch.addressLine2,
    branch.ward,
    branch.district,
    branch.province,
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-6 gap-4">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
          Chi tiết chi nhánh
        </h1>

        <div className="flex gap-3">
          <button
            onClick={() => navigate(`/admin/branches/edit/${branch.id}`)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-900/30 hover:bg-blue-200 dark:hover:bg-blue-900/50 rounded-md transition-colors"
          >
            <Edit className="w-4 h-4" /> Chỉnh sửa
          </button>

          <button
            onClick={() => navigate("/admin/branches")}
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
                  Tên chi nhánh
                </p>
                <p className="font-semibold text-lg mt-1">{branch.name}</p>
              </div>

              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Mã chi nhánh
                </p>
                <p className="font-semibold text-lg mt-1">{branch.code}</p>
              </div>

              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Trạng thái
                </p>
                <span
                  className={`inline-flex mt-1 px-3 py-1 rounded-full text-xs font-semibold ${
                    branch.status === "active"
                      ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                      : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
                  }`}
                >
                  {branch.status === "active" ? "Hoạt động" : "Tạm dừng"}
                </span>
              </div>

              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Dịch vụ
                </p>
                <div className="flex gap-2 mt-1">
                  {branch.supportsPickup && (
                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                      Pickup
                    </span>
                  )}
                  {branch.supportsDelivery && (
                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
                      Delivery
                    </span>
                  )}
                  {!branch.supportsPickup && !branch.supportsDelivery && (
                    <span className="text-sm text-gray-500">—</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
              Liên hệ và vận hành
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-gray-800 dark:text-gray-200">
              <div className="flex items-start gap-3">
                <Phone className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Số điện thoại
                  </p>
                  <p className="font-medium">{branch.phone || "—"}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Email
                  </p>
                  <p className="font-medium break-all">{branch.email || "—"}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Clock3 className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Giờ hoạt động
                  </p>
                  <p className="font-medium">
                    {branch.openTime || "--:--"} - {branch.closeTime || "--:--"}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <LocateFixed className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Tọa độ
                  </p>
                  <p className="font-medium">
                    {branch.latitude ?? "—"} / {branch.longitude ?? "—"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
              Địa chỉ
            </h2>

            <div className="flex items-start gap-3 text-gray-800 dark:text-gray-200">
              <MapPinned className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <p className="font-medium">
                  {fullAddress || "Chưa có địa chỉ"}
                </p>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-200 dark:border-gray-700 pt-6 grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-gray-700 dark:text-gray-300">
            <p>
              <span className="font-medium text-gray-500 dark:text-gray-400">
                Ngày tạo:
              </span>{" "}
              {branch.createdAt
                ? new Date(branch.createdAt).toLocaleString()
                : "—"}
            </p>
            <p>
              <span className="font-medium text-gray-500 dark:text-gray-400">
                Cập nhật gần nhất:
              </span>{" "}
              {branch.updatedAt
                ? new Date(branch.updatedAt).toLocaleString()
                : "—"}
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default BranchDetailPage;
