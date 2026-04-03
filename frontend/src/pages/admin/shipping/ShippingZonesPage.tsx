import React, { useEffect, useState } from "react";
import Card from "../../../components/admin/layouts/Card";
import Pagination from "../../../components/admin/common/Pagination";
import {
  Search,
  Plus,
  Edit,
  Trash2,
  Loader2,
  MapPinned,
  Truck,
  BadgePercent,
  Power,
  PowerOff,
  Globe,
  CheckCircle2,
  AlertCircle,
  Tag,
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
      "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border border-green-200 dark:border-green-800",
  },
  inactive: {
    label: "Tạm dừng",
    className:
      "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-800",
  },
};

const formatCurrency = (value?: number | null) => {
  const amount = Number(value ?? 0);
  return amount.toLocaleString("vi-VN") + " đ";
};

const formatArea = (zone: ShippingZone) => {
  return [zone.ward, zone.district, zone.province].filter(Boolean).join(", ");
};

const isGlobalZone = (zone: ShippingZone) => {
  return !zone.province && !zone.district && !zone.ward;
};

const getMatchLevelInfo = (zone: ShippingZone) => {
  if (zone.ward)
    return {
      text: "Match rất cụ thể",
      color: "text-blue-600 dark:text-blue-400",
    };
  if (zone.district)
    return {
      text: "Match theo quận/huyện",
      color: "text-indigo-600 dark:text-indigo-400",
    };
  if (zone.province)
    return {
      text: "Match theo tỉnh/thành",
      color: "text-teal-600 dark:text-teal-400",
    };
  return { text: "Fallback zone", color: "text-gray-500 dark:text-gray-400" };
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

  const handleDelete = async (e: React.MouseEvent, zone: ShippingZone) => {
    e.stopPropagation(); // Ngăn trigger row click
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

  const handleToggleStatus = async (
    e: React.MouseEvent,
    zone: ShippingZone,
  ) => {
    e.stopPropagation(); // Ngăn trigger row click
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

  const handleEdit = (e: React.MouseEvent, id: number) => {
    e.stopPropagation(); // Ngăn trigger row click nếu bấm trực tiếp vào icon
    navigate(`/admin/shipping/zones/edit/${id}`);
  };

  // Thống kê (dựa trên dữ liệu page hiện tại)
  const totalLoaded = zones.length;
  const activeCount = zones.filter((z) => z.status === "active").length;
  const inactiveCount = zones.filter((z) => z.status === "inactive").length;
  const globalCount = zones.filter(isGlobalZone).length;

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-2">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
            Quản lý vùng giao hàng
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Thiết lập khu vực áp dụng, mức phí cơ bản, ngưỡng freeship và độ ưu
            tiên match địa chỉ.
          </p>
        </div>

        <button
          onClick={() => navigate("/admin/shipping/zones/create")}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm whitespace-nowrap w-full sm:w-auto"
        >
          <Plus className="w-5 h-5" />
          Thêm vùng
        </button>
      </div>

      {/* Overview Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 mt-6">
        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400">
            <MapPinned className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Tổng số vùng
            </p>
            <p className="text-xl font-bold text-gray-900 dark:text-white">
              {totalLoaded}
            </p>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-green-50 dark:bg-green-900/30 rounded-lg text-green-600 dark:text-green-400">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Hoạt động
            </p>
            <p className="text-xl font-bold text-gray-900 dark:text-white">
              {activeCount}
            </p>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-yellow-50 dark:bg-yellow-900/30 rounded-lg text-yellow-600 dark:text-yellow-400">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Tạm dừng</p>
            <p className="text-xl font-bold text-gray-900 dark:text-white">
              {inactiveCount}
            </p>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-purple-50 dark:bg-purple-900/30 rounded-lg text-purple-600 dark:text-purple-400">
            <Globe className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Mặc định/Toàn quốc
            </p>
            <p className="text-xl font-bold text-gray-900 dark:text-white">
              {globalCount}
            </p>
          </div>
        </div>
      </div>

      {/* Toolbar: Search & Segmented Filter */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
        {/* Segmented Control */}
        <div className="inline-flex bg-gray-100 dark:bg-gray-800 p-1 rounded-lg w-full md:w-auto">
          {(["all", "active", "inactive"] as const).map((status) => (
            <button
              key={status}
              onClick={() => handleFilterChange(status)}
              className={`flex-1 md:flex-none px-4 py-2 rounded-md text-sm font-medium transition-all ${
                statusFilter === status
                  ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/50"
              }`}
            >
              {status === "all"
                ? "Tất cả"
                : status === "active"
                  ? "Hoạt động"
                  : "Tạm dừng"}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Tìm theo tên hoặc mã vùng..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
          />
        </div>
      </div>

      <Card className="!p-0 overflow-hidden">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex justify-center items-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600 dark:text-blue-400" />
              <span className="ml-3 text-gray-600 dark:text-gray-400 font-medium">
                Đang tải dữ liệu...
              </span>
            </div>
          ) : error ? (
            <div className="text-center py-12 text-red-500 bg-red-50 dark:bg-red-900/10">
              <AlertCircle className="w-10 h-10 mx-auto mb-2 opacity-80" />
              <p>{error}</p>
            </div>
          ) : zones.length === 0 ? (
            <div className="text-center py-20 px-4">
              <div className="bg-gray-100 dark:bg-gray-800 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                <MapPinned className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                Chưa có vùng giao hàng nào
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md mx-auto">
                Hãy tạo vùng giao hàng đầu tiên để bắt đầu cấu hình phạm vi giao
                hàng, phí vận chuyển và các ưu đãi freeship.
              </p>
              <button
                onClick={() => navigate("/admin/shipping/zones/create")}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-5 h-5" />
                Tạo vùng đầu tiên
              </button>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50/80 dark:bg-gray-800/80">
                <tr>
                  <th className="px-5 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Vùng
                  </th>
                  <th className="px-5 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Khu vực áp dụng
                  </th>
                  <th className="px-5 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Phí / Freeship
                  </th>
                  <th className="px-5 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Ưu tiên
                  </th>
                  <th className="px-5 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Nhãn
                  </th>
                  <th className="px-5 py-4 text-center text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Trạng thái
                  </th>
                  <th className="px-5 py-4 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Hành động
                  </th>
                </tr>
              </thead>

              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-100 dark:divide-gray-800">
                {zones.map((zone) => {
                  const isGlobal = isGlobalZone(zone);
                  const matchInfo = getMatchLevelInfo(zone);

                  return (
                    <tr
                      key={zone.id}
                      onClick={() =>
                        navigate(`/admin/shipping/zones/edit/${zone.id}`)
                      }
                      className="hover:bg-blue-50/50 dark:hover:bg-gray-800/60 transition-colors cursor-pointer group"
                    >
                      {/* Vùng */}
                      <td className="px-5 py-4">
                        <div className="font-semibold text-gray-900 dark:text-white">
                          {zone.name}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-500 mt-1 flex items-center gap-1.5">
                          <Tag className="w-3 h-3" />
                          {zone.code}
                        </div>
                      </td>

                      {/* Khu vực áp dụng */}
                      <td className="px-5 py-4">
                        {isGlobal ? (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-gray-100 dark:bg-gray-800 text-sm font-medium text-gray-800 dark:text-gray-200">
                            <Globe className="w-4 h-4 text-gray-500" />
                            Mặc định / Toàn khu vực
                          </div>
                        ) : (
                          <div className="text-sm text-gray-700 dark:text-gray-300">
                            <span className="font-medium">
                              {formatArea(zone)}
                            </span>
                          </div>
                        )}
                        <div
                          className={`text-xs mt-1.5 font-medium ${matchInfo.color}`}
                        >
                          • {matchInfo.text}
                        </div>
                      </td>

                      {/* Phí / Freeship */}
                      <td className="px-5 py-4 text-sm">
                        <div className="flex items-center gap-2 font-semibold text-gray-900 dark:text-white">
                          <Truck className="w-4 h-4 text-blue-500" />
                          {formatCurrency(zone.baseFee)}
                        </div>
                        <div className="flex items-center gap-2 mt-1.5 text-gray-500 dark:text-gray-400">
                          <BadgePercent className="w-4 h-4" />
                          {zone.freeShipThreshold !== null &&
                          zone.freeShipThreshold !== undefined ? (
                            <span className="text-green-600 dark:text-green-500 font-medium">
                              Freeship từ{" "}
                              {formatCurrency(zone.freeShipThreshold)}
                            </span>
                          ) : (
                            <span>Không có freeship</span>
                          )}
                        </div>
                      </td>

                      {/* Ưu tiên */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white font-bold text-sm">
                            {zone.priority}
                          </div>
                        </div>
                        <div className="text-[11px] text-gray-400 mt-1 whitespace-nowrap">
                          Số nhỏ ưu tiên cao hơn
                        </div>
                      </td>

                      {/* Nhãn/Cảnh báo */}
                      <td className="px-5 py-4">
                        <div className="flex flex-col gap-1.5 items-start">
                          {isGlobal && (
                            <span className="px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                              Fallback
                            </span>
                          )}
                          {zone.priority === 0 && (
                            <span className="px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                              Ưu tiên cao nhất
                            </span>
                          )}
                          {zone.status === "inactive" && (
                            <span className="px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                              Đang tắt
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Trạng thái */}
                      <td className="px-5 py-4 text-center">
                        <span
                          className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${
                            statusMap[zone.status]?.className
                          }`}
                        >
                          {statusMap[zone.status]?.label || zone.status}
                        </span>
                      </td>

                      {/* Hành động */}
                      <td className="px-5 py-4 text-right">
                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                          <button
                            onClick={(e) => handleToggleStatus(e, zone)}
                            className={`p-2 rounded-md transition-colors ${
                              zone.status === "active"
                                ? "text-yellow-600 hover:bg-yellow-50 dark:hover:bg-yellow-900/30"
                                : "text-green-600 hover:bg-green-50 dark:hover:bg-green-900/30"
                            }`}
                            title={
                              zone.status === "active"
                                ? "Tạm dừng"
                                : "Bật hoạt động"
                            }
                          >
                            {zone.status === "active" ? (
                              <PowerOff className="w-5 h-5" />
                            ) : (
                              <Power className="w-5 h-5" />
                            )}
                          </button>

                          <button
                            onClick={(e) => handleEdit(e, zone.id)}
                            className="p-2 text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/30 rounded-md transition-colors"
                            title="Chỉnh sửa"
                          >
                            <Edit className="w-5 h-5" />
                          </button>

                          <button
                            onClick={(e) => handleDelete(e, zone)}
                            className="p-2 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/30 rounded-md transition-colors"
                            title="Xóa vùng"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </Card>

      {!loading && !error && totalPages > 1 && (
        <div className="mt-6 flex justify-end">
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
