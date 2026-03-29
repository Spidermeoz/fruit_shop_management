import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Edit,
  Loader2,
  Store,
  MapPinned,
  BadgePercent,
  Truck,
} from "lucide-react";
import Card from "../../../components/admin/layouts/Card";
import { http } from "../../../services/http";
import { useAdminToast } from "../../../context/AdminToastContext";

interface BranchServiceArea {
  id: number;
  branchId: number;
  shippingZoneId: number;
  deliveryFeeOverride?: number | null;
  minOrderValue?: number | null;
  maxOrderValue?: number | null;
  supportsSameDay?: boolean;
  status: "active" | "inactive";
  createdAt?: string;
  updatedAt?: string;
}

interface BranchOption {
  id: number;
  name: string;
  code: string;
}

interface ShippingZoneOption {
  id: number;
  name: string;
  code: string;
}

type ApiDetail<T> = { success: true; data: T; meta?: any };
type ApiList<T> = { success: true; data: T[]; meta?: any };

const formatCurrency = (value?: number | null) => {
  if (value === null || value === undefined) return "Không áp dụng";
  return Number(value).toLocaleString("vi-VN") + " đ";
};

const BranchServiceAreaDetailPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showErrorToast } = useAdminToast();

  const [row, setRow] = useState<BranchServiceArea | null>(null);
  const [branches, setBranches] = useState<BranchOption[]>([]);
  const [zones, setZones] = useState<ShippingZoneOption[]>([]);
  const [loading, setLoading] = useState(true);

  const branch = useMemo(
    () => branches.find((x) => x.id === row?.branchId),
    [branches, row],
  );
  const zone = useMemo(
    () => zones.find((x) => x.id === row?.shippingZoneId),
    [zones, row],
  );

  const fetchDetail = async () => {
    try {
      setLoading(true);

      const [detailRes, branchesRes, zonesRes] = await Promise.all([
        http<ApiDetail<BranchServiceArea>>(
          "GET",
          `/api/v1/admin/branch-service-areas/detail/${id}`,
        ),
        http<ApiList<BranchOption>>(
          "GET",
          "/api/v1/admin/branches?limit=1000&status=active",
        ),
        http<ApiList<ShippingZoneOption>>(
          "GET",
          "/api/v1/admin/shipping-zones?limit=1000&status=active",
        ),
      ]);

      if (detailRes?.success && detailRes.data) {
        setRow(detailRes.data);
      } else {
        showErrorToast("Không thể tải chi tiết cấu hình vùng phục vụ.");
      }

      setBranches(Array.isArray(branchesRes?.data) ? branchesRes.data : []);
      setZones(Array.isArray(zonesRes?.data) ? zonesRes.data : []);
    } catch (err: any) {
      console.error(err);
      showErrorToast(err?.message || "Lỗi tải chi tiết cấu hình vùng phục vụ.");
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
          Chi tiết cấu hình vùng phục vụ
        </h1>

        <div className="flex gap-3">
          <button
            onClick={() =>
              navigate(`/admin/shipping/service-areas/edit/${row.id}`)
            }
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-900/30 hover:bg-blue-200 dark:hover:bg-blue-900/50 rounded-md transition-colors"
          >
            <Edit className="w-4 h-4" /> Chỉnh sửa
          </button>

          <button
            onClick={() => navigate("/admin/shipping/service-areas")}
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
              Mapping chi nhánh và vùng
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-gray-800 dark:text-gray-200">
              <div className="flex items-start gap-3">
                <Store className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Chi nhánh
                  </p>
                  <p className="font-medium">
                    {branch?.name || `Chi nhánh #${row.branchId}`}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    {branch?.code || `ID: ${row.branchId}`}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <MapPinned className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Vùng giao hàng
                  </p>
                  <p className="font-medium">
                    {zone?.name || `Vùng #${row.shippingZoneId}`}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    {zone?.code || `ID: ${row.shippingZoneId}`}
                  </p>
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
                  Same-day
                </p>
                <div className="mt-1">
                  {row.supportsSameDay ? (
                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
                      Có hỗ trợ
                    </span>
                  ) : (
                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                      Không hỗ trợ
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
              Cấu hình áp dụng
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-gray-800 dark:text-gray-200">
              <div className="flex items-start gap-3">
                <BadgePercent className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Phí ship override
                  </p>
                  <p className="font-medium">
                    {formatCurrency(row.deliveryFeeOverride)}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Truck className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Giá trị đơn tối thiểu
                  </p>
                  <p className="font-medium">
                    {formatCurrency(row.minOrderValue)}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Truck className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Giá trị đơn tối đa
                  </p>
                  <p className="font-medium">
                    {formatCurrency(row.maxOrderValue)}
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

export default BranchServiceAreaDetailPage;
