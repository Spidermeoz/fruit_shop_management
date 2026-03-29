import React, { useEffect, useMemo, useState } from "react";
import Card from "../../../components/admin/layouts/Card";
import Pagination from "../../../components/admin/common/Pagination";
import {
  Search,
  Plus,
  Edit,
  Trash2,
  Eye,
  Loader2,
  Truck,
  Store,
  MapPinned,
  BadgePercent,
} from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { http } from "../../../services/http";
import { useAdminToast } from "../../../context/AdminToastContext";

type BranchServiceAreaStatus = "active" | "inactive";

interface BranchServiceArea {
  id: number;
  branchId: number;
  shippingZoneId: number;
  deliveryFeeOverride?: number | null;
  minOrderValue?: number | null;
  maxOrderValue?: number | null;
  supportsSameDay?: boolean;
  status: BranchServiceAreaStatus;
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

type ApiList<T> = {
  success: true;
  data: T[];
  meta?: { total?: number; limit?: number; offset?: number; page?: number };
};

const statusMap: Record<
  BranchServiceAreaStatus,
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
  if (value === null || value === undefined) return "—";
  return Number(value).toLocaleString("vi-VN") + " đ";
};

const BranchServiceAreasPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [rows, setRows] = useState<BranchServiceArea[]>([]);
  const [branches, setBranches] = useState<BranchOption[]>([]);
  const [zones, setZones] = useState<ShippingZoneOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [bootstrapLoading, setBootstrapLoading] = useState(true);
  const [error, setError] = useState("");

  const [searchInput, setSearchInput] = useState(searchParams.get("q") || "");
  const statusFilter = searchParams.get("status") || "all";
  const branchFilter = searchParams.get("branchId") || "all";
  const zoneFilter = searchParams.get("shippingZoneId") || "all";
  const currentPage = Number(searchParams.get("page") || 1);
  const [totalPages, setTotalPages] = useState(1);

  const { showSuccessToast, showErrorToast } = useAdminToast();

  const branchMap = useMemo(
    () => new Map(branches.map((x) => [x.id, x])),
    [branches],
  );
  const zoneMap = useMemo(() => new Map(zones.map((x) => [x.id, x])), [zones]);

  const fetchBootstrap = async () => {
    try {
      setBootstrapLoading(true);
      const [branchesRes, zonesRes] = await Promise.all([
        http<ApiList<BranchOption>>(
          "GET",
          "/api/v1/admin/branches?limit=1000&status=active",
        ),
        http<ApiList<ShippingZoneOption>>(
          "GET",
          "/api/v1/admin/shipping-zones?limit=1000&status=active",
        ),
      ]);

      setBranches(Array.isArray(branchesRes?.data) ? branchesRes.data : []);
      setZones(Array.isArray(zonesRes?.data) ? zonesRes.data : []);
    } catch (err: any) {
      console.error(err);
      showErrorToast(err?.message || "Không thể tải dữ liệu danh mục.");
    } finally {
      setBootstrapLoading(false);
    }
  };

  const fetchRows = async () => {
    try {
      setLoading(true);
      setError("");

      const limit = 10;
      const offset = (currentPage - 1) * limit;

      let url = `/api/v1/admin/branch-service-areas?limit=${limit}&offset=${offset}`;

      if (statusFilter !== "all") {
        url += `&status=${encodeURIComponent(statusFilter)}`;
      }

      if (branchFilter !== "all") {
        url += `&branchId=${encodeURIComponent(branchFilter)}`;
      }

      if (zoneFilter !== "all") {
        url += `&shippingZoneId=${encodeURIComponent(zoneFilter)}`;
      }

      const q = searchParams.get("q");
      if (q?.trim()) {
        url += `&q=${encodeURIComponent(q.trim())}`;
      }

      const res = await http<ApiList<BranchServiceArea>>("GET", url);

      if (res?.success && Array.isArray(res.data)) {
        setRows(res.data);
        const total = Number(res.meta?.total ?? 0);
        setTotalPages(Math.max(1, Math.ceil(total / limit)));
      } else {
        setError("Không thể tải danh sách vùng phục vụ.");
      }
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Lỗi tải danh sách vùng phục vụ.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBootstrap();
  }, []);

  useEffect(() => {
    fetchRows();
  }, [currentPage, statusFilter, branchFilter, zoneFilter, searchParams]);

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

  const handleFilterChange = (
    key: "status" | "branchId" | "shippingZoneId",
    value: string,
  ) => {
    const params = new URLSearchParams(searchParams);
    if (value === "all") params.delete(key);
    else params.set(key, value);
    params.delete("page");
    setSearchParams(params);
  };

  const handleDelete = async (row: BranchServiceArea) => {
    const branchName = branchMap.get(row.branchId)?.name || `#${row.branchId}`;
    const zoneName =
      zoneMap.get(row.shippingZoneId)?.name || `#${row.shippingZoneId}`;

    const ok = window.confirm(
      `Bạn có chắc muốn xóa mềm cấu hình "${branchName} - ${zoneName}" không?`,
    );
    if (!ok) return;

    try {
      await http(
        "DELETE",
        `/api/v1/admin/branch-service-areas/delete/${row.id}`,
      );
      showSuccessToast({ message: "Đã xóa cấu hình vùng phục vụ thành công!" });
      fetchRows();
    } catch (err: any) {
      console.error(err);
      showErrorToast(err?.message || "Không thể xóa cấu hình vùng phục vụ.");
    }
  };

  const handleToggleStatus = async (row: BranchServiceArea) => {
    const nextStatus = row.status === "active" ? "inactive" : "active";

    try {
      await http(
        "PATCH",
        `/api/v1/admin/branch-service-areas/${row.id}/status`,
        {
          status: nextStatus,
        },
      );

      showSuccessToast({ message: "Cập nhật trạng thái thành công!" });
      fetchRows();
    } catch (err: any) {
      console.error(err);
      showErrorToast(err?.message || "Không thể cập nhật trạng thái.");
    }
  };

  return (
    <div>
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 mb-6">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
          Quản lý vùng phục vụ theo chi nhánh
        </h1>

        <div className="flex flex-col sm:flex-row gap-4 w-full xl:w-auto">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm kiếm branch hoặc zone..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <button
            onClick={() => navigate("/admin/shipping/service-areas/create")}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Thêm cấu hình
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-4 gap-3 mb-4">
        <select
          value={statusFilter}
          onChange={(e) => handleFilterChange("status", e.target.value)}
          className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        >
          <option value="all">Tất cả trạng thái</option>
          <option value="active">Hoạt động</option>
          <option value="inactive">Tạm dừng</option>
        </select>

        <select
          value={branchFilter}
          onChange={(e) => handleFilterChange("branchId", e.target.value)}
          disabled={bootstrapLoading}
          className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:opacity-60"
        >
          <option value="all">Tất cả chi nhánh</option>
          {branches.map((branch) => (
            <option key={branch.id} value={branch.id}>
              {branch.name} ({branch.code})
            </option>
          ))}
        </select>

        <select
          value={zoneFilter}
          onChange={(e) => handleFilterChange("shippingZoneId", e.target.value)}
          disabled={bootstrapLoading}
          className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:opacity-60"
        >
          <option value="all">Tất cả vùng giao hàng</option>
          {zones.map((zone) => (
            <option key={zone.id} value={zone.id}>
              {zone.name} ({zone.code})
            </option>
          ))}
        </select>
      </div>

      <Card>
        <div className="overflow-x-auto">
          {loading || bootstrapLoading ? (
            <div className="flex justify-center items-center py-16">
              <Loader2 className="w-6 h-6 animate-spin text-gray-500 dark:text-gray-400" />
              <span className="ml-2 text-gray-600 dark:text-gray-400">
                Đang tải dữ liệu...
              </span>
            </div>
          ) : error ? (
            <p className="text-center text-red-500 py-8">{error}</p>
          ) : rows.length === 0 ? (
            <div className="text-center py-12">
              <Truck className="w-12 h-12 mx-auto text-gray-400 mb-3" />
              <p className="text-gray-600 dark:text-gray-400">
                Chưa có cấu hình vùng phục vụ nào.
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
                    Chi nhánh
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Vùng giao hàng
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Điều kiện đơn
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Cấu hình giao hàng
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
                {rows.map((row, index) => {
                  const branch = branchMap.get(row.branchId);
                  const zone = zoneMap.get(row.shippingZoneId);

                  return (
                    <tr
                      key={row.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                      <td className="px-4 py-4 text-sm text-gray-700 dark:text-gray-300">
                        {(currentPage - 1) * 10 + index + 1}
                      </td>

                      <td className="px-4 py-4">
                        <div className="flex items-start gap-2">
                          <Store className="w-4 h-4 text-gray-400 mt-0.5" />
                          <div>
                            <div className="font-semibold text-gray-900 dark:text-white">
                              {branch?.name || `Chi nhánh #${row.branchId}`}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              {branch?.code || `ID: ${row.branchId}`}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-4">
                        <div className="flex items-start gap-2">
                          <MapPinned className="w-4 h-4 text-gray-400 mt-0.5" />
                          <div>
                            <div className="font-semibold text-gray-900 dark:text-white">
                              {zone?.name || `Vùng #${row.shippingZoneId}`}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              {zone?.code || `ID: ${row.shippingZoneId}`}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-4 text-sm text-gray-700 dark:text-gray-300">
                        <div>Min: {formatCurrency(row.minOrderValue)}</div>
                        <div className="mt-1">
                          Max: {formatCurrency(row.maxOrderValue)}
                        </div>
                      </td>

                      <td className="px-4 py-4 text-sm text-gray-700 dark:text-gray-300">
                        <div className="flex items-center gap-2">
                          <BadgePercent className="w-4 h-4 text-gray-400" />
                          <span>
                            Override phí:{" "}
                            {formatCurrency(row.deliveryFeeOverride)}
                          </span>
                        </div>
                        <div className="mt-2">
                          {row.supportsSameDay ? (
                            <span className="px-2 py-1 rounded-full text-[11px] font-semibold bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
                              Same-day
                            </span>
                          ) : (
                            <span className="px-2 py-1 rounded-full text-[11px] font-semibold bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                              Không same-day
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="px-4 py-4">
                        <button
                          onClick={() => handleToggleStatus(row)}
                          className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                            statusMap[row.status]?.className
                          }`}
                          title="Bấm để đổi trạng thái"
                        >
                          {statusMap[row.status]?.label || row.status}
                        </button>
                      </td>

                      <td className="px-4 py-4 text-right">
                        <div className="flex justify-end gap-3">
                          <button
                            onClick={() =>
                              navigate(
                                `/admin/shipping/service-areas/detail/${row.id}`,
                              )
                            }
                            className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                            title="Xem chi tiết"
                          >
                            <Eye className="w-5 h-5" />
                          </button>

                          <button
                            onClick={() =>
                              navigate(
                                `/admin/shipping/service-areas/edit/${row.id}`,
                              )
                            }
                            className="text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300"
                            title="Chỉnh sửa"
                          >
                            <Edit className="w-5 h-5" />
                          </button>

                          <button
                            onClick={() => handleDelete(row)}
                            className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                            title="Xóa mềm"
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

export default BranchServiceAreasPage;
