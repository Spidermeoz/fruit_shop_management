import React, { useEffect, useState } from "react";
import Card from "../../../components/admin/layouts/Card";
import Pagination from "../../../components/admin/common/Pagination";
import {
  Search,
  Plus,
  Edit,
  Trash2,
  Eye,
  Loader2,
  MapPinned,
  Truck,
  BadgePercent,
  ArrowUpDown,
} from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { http } from "../../../services/http";
import { useAdminToast } from "../../../context/AdminToastContext";

type ShippingZoneStatus = "active" | "inactive";

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
  status: ShippingZoneStatus;
}

type ApiList<T> = {
  success: true;
  data: T[];
  meta?: { total?: number; limit?: number; offset?: number; page?: number };
};

const statusMap: Record<
  ShippingZoneStatus,
  { label: string; className: string }
> = {
  active: {
    label: "Hoạt động",
    className:
      "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  },
  inactive: {
    label: "Tạm dừng",
    className:
      "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  },
};

const formatCurrency = (value?: number | null) => {
  const amount = Number(value ?? 0);
  return amount.toLocaleString("vi-VN") + " đ";
};

const formatArea = (zone: ShippingZone) => {
  return [zone.ward, zone.district, zone.province].filter(Boolean).join(", ");
};

const ShippingZonesPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [zones, setZones] = useState<ShippingZone[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [searchInput, setSearchInput] = useState(searchParams.get("q") || "");
  const statusFilter = searchParams.get("status") || "all";
  const currentPage = Number(searchParams.get("page") || 1);
  const [totalPages, setTotalPages] = useState(1);

  const { showSuccessToast, showErrorToast } = useAdminToast();

  const fetchZones = async () => {
    try {
      setLoading(true);
      setError("");

      const limit = 10;
      const offset = (currentPage - 1) * limit;

      let url = `/api/v1/admin/shipping-zones?limit=${limit}&offset=${offset}`;

      if (statusFilter !== "all") {
        url += `&status=${encodeURIComponent(statusFilter)}`;
      }

      const q = searchParams.get("q");
      if (q?.trim()) {
        url += `&q=${encodeURIComponent(q.trim())}`;
      }

      const res = await http<ApiList<ShippingZone>>("GET", url);

      if (res?.success && Array.isArray(res.data)) {
        setZones(res.data);

        const total = Number(res.meta?.total ?? 0);
        setTotalPages(Math.max(1, Math.ceil(total / limit)));
      } else {
        setError("Không thể tải danh sách vùng giao hàng.");
      }
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Lỗi tải danh sách vùng giao hàng.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchZones();
  }, [currentPage, statusFilter, searchParams]);

  useEffect(() => {
    const t = setTimeout(() => {
      const params = new URLSearchParams(searchParams);
      if (searchInput.trim()) params.set("q", searchInput.trim());
      else params.delete("q");
      params.delete("page");
      setSearchParams(params);
    }, 400);

    return () => clearTimeout(t);
  }, [searchInput]);

  const handleFilterChange = (status: "all" | "active" | "inactive") => {
    const params = new URLSearchParams(searchParams);
    if (status === "all") params.delete("status");
    else params.set("status", status);
    params.delete("page");
    setSearchParams(params);
  };

  const handleDelete = async (zone: ShippingZone) => {
    const ok = window.confirm(
      `Bạn có chắc muốn xóa mềm vùng giao hàng "${zone.name}" không?`,
    );
    if (!ok) return;

    try {
      await http("DELETE", `/api/v1/admin/shipping-zones/delete/${zone.id}`);
      showSuccessToast({ message: "Đã xóa vùng giao hàng thành công!" });
      fetchZones();
    } catch (err: any) {
      console.error(err);
      showErrorToast(err?.message || "Không thể xóa vùng giao hàng.");
    }
  };

  const handleToggleStatus = async (zone: ShippingZone) => {
    const nextStatus = zone.status === "active" ? "inactive" : "active";

    try {
      await http("PATCH", `/api/v1/admin/shipping-zones/${zone.id}/status`, {
        status: nextStatus,
      });

      showSuccessToast({ message: "Cập nhật trạng thái thành công!" });
      fetchZones();
    } catch (err: any) {
      console.error(err);
      showErrorToast(err?.message || "Không thể cập nhật trạng thái.");
    }
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
          Quản lý vùng giao hàng
        </h1>

        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm kiếm vùng giao hàng..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <button
            onClick={() => navigate("/admin/shipping/zones/create")}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Thêm vùng
          </button>
        </div>
      </div>

      <div className="flex gap-3 mb-4">
        <button
          onClick={() => handleFilterChange("all")}
          className={`px-4 py-2 rounded-md text-sm font-medium border ${
            statusFilter === "all"
              ? "bg-blue-600 text-white border-blue-600"
              : "bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 border-gray-300 hover:bg-gray-100"
          }`}
        >
          Tất cả
        </button>

        <button
          onClick={() => handleFilterChange("active")}
          className={`px-4 py-2 rounded-md text-sm font-medium border ${
            statusFilter === "active"
              ? "bg-green-600 text-white border-green-600"
              : "bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 border-gray-300 hover:bg-gray-100"
          }`}
        >
          Hoạt động
        </button>

        <button
          onClick={() => handleFilterChange("inactive")}
          className={`px-4 py-2 rounded-md text-sm font-medium border ${
            statusFilter === "inactive"
              ? "bg-yellow-600 text-white border-yellow-600"
              : "bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 border-gray-300 hover:bg-gray-100"
          }`}
        >
          Tạm dừng
        </button>
      </div>

      <Card>
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex justify-center items-center py-16">
              <Loader2 className="w-6 h-6 animate-spin text-gray-500 dark:text-gray-400" />
              <span className="ml-2 text-gray-600 dark:text-gray-400">
                Đang tải dữ liệu...
              </span>
            </div>
          ) : error ? (
            <p className="text-center text-red-500 py-8">{error}</p>
          ) : zones.length === 0 ? (
            <div className="text-center py-12">
              <Truck className="w-12 h-12 mx-auto text-gray-400 mb-3" />
              <p className="text-gray-600 dark:text-gray-400">
                Chưa có vùng giao hàng nào.
              </p>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    STT
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Vùng
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Khu vực áp dụng
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Phí / freeship
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Ưu tiên
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Trạng thái
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Hành động
                  </th>
                </tr>
              </thead>

              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                {zones.map((zone, index) => (
                  <tr
                    key={zone.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    <td className="px-4 py-4 text-sm text-gray-700 dark:text-gray-300">
                      {(currentPage - 1) * 10 + index + 1}
                    </td>

                    <td className="px-4 py-4">
                      <div className="font-semibold text-gray-900 dark:text-white">
                        {zone.name}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Code: {zone.code}
                      </div>
                    </td>

                    <td className="px-4 py-4 text-sm text-gray-700 dark:text-gray-300">
                      <div className="flex items-start gap-2">
                        <MapPinned className="w-4 h-4 text-gray-400 mt-0.5" />
                        <span>
                          {formatArea(zone) || "Toàn khu vực mặc định"}
                        </span>
                      </div>
                    </td>

                    <td className="px-4 py-4 text-sm text-gray-700 dark:text-gray-300">
                      <div className="flex items-center gap-2">
                        <Truck className="w-4 h-4 text-gray-400" />
                        <span>{formatCurrency(zone.baseFee)}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <BadgePercent className="w-4 h-4 text-gray-400" />
                        <span>
                          {zone.freeShipThreshold !== null &&
                          zone.freeShipThreshold !== undefined
                            ? `Freeship từ ${formatCurrency(zone.freeShipThreshold)}`
                            : "Không có ngưỡng freeship"}
                        </span>
                      </div>
                    </td>

                    <td className="px-4 py-4 text-sm text-gray-700 dark:text-gray-300">
                      <div className="flex items-center gap-2">
                        <ArrowUpDown className="w-4 h-4 text-gray-400" />
                        <span>{zone.priority}</span>
                      </div>
                    </td>

                    <td className="px-4 py-4">
                      <button
                        onClick={() => handleToggleStatus(zone)}
                        className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                          statusMap[zone.status]?.className
                        }`}
                        title="Bấm để đổi trạng thái"
                      >
                        {statusMap[zone.status]?.label || zone.status}
                      </button>
                    </td>

                    <td className="px-4 py-4 text-right">
                      <div className="flex justify-end gap-3">
                        <button
                          onClick={() =>
                            navigate(`/admin/shipping/zones/detail/${zone.id}`)
                          }
                          className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                          title="Xem chi tiết"
                        >
                          <Eye className="w-5 h-5" />
                        </button>

                        <button
                          onClick={() =>
                            navigate(`/admin/shipping/zones/edit/${zone.id}`)
                          }
                          className="text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300"
                          title="Chỉnh sửa"
                        >
                          <Edit className="w-5 h-5" />
                        </button>

                        <button
                          onClick={() => handleDelete(zone)}
                          className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                          title="Xóa mềm"
                        >
                          <Trash2 className="w-5 h-5" />
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

      {!loading && !error && totalPages > 1 && (
        <div className="mt-6">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={(page) => {
              const params = new URLSearchParams(searchParams);
              params.set("page", String(page));
              setSearchParams(params);
            }}
          />
        </div>
      )}
    </div>
  );
};

export default ShippingZonesPage;
