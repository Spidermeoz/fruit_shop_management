import React, { useEffect, useMemo, useState } from "react";
import Card from "../../../components/admin/layouts/Card";
import Pagination from "../../../components/admin/common/Pagination";
import {
  Search,
  Plus,
  Edit,
  Trash2,
  Loader2,
  Truck,
  Store,
  MapPinned,
  Power,
  PowerOff,
  Zap,
  Banknote,
  Layers,
  CheckCircle2,
  AlertCircle,
  Tag,
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
      "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border border-green-200 dark:border-green-800",
  },
  inactive: {
    label: "Tạm dừng",
    className:
      "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-800",
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

  const handleDelete = async (e: React.MouseEvent, row: BranchServiceArea) => {
    e.stopPropagation();
    const branchName = branchMap.get(row.branchId)?.name || `#${row.branchId}`;
    const zoneName =
      zoneMap.get(row.shippingZoneId)?.name || `#${row.shippingZoneId}`;

    const ok = window.confirm(
      `Bạn có chắc muốn xóa cấu hình "${branchName} - ${zoneName}" không?`,
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

  const handleToggleStatus = async (
    e: React.MouseEvent,
    row: BranchServiceArea,
  ) => {
    e.stopPropagation();
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

  const handleEdit = (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    navigate(`/admin/shipping/service-areas/edit/${id}`);
  };

  // Tính toán Summary Metrics
  const totalLoaded = rows.length;
  const activeCount = rows.filter((r) => r.status === "active").length;
  const sameDayCount = rows.filter((r) => r.supportsSameDay).length;
  const overrideCount = rows.filter(
    (r) =>
      r.deliveryFeeOverride !== null && r.deliveryFeeOverride !== undefined,
  ).length;

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-2">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
            Coverage theo chi nhánh
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Thiết lập branch nào phục vụ zone nào, có override phí, điều kiện
            đơn hàng và same-day.
          </p>
        </div>

        <button
          onClick={() => navigate("/admin/shipping/service-areas/create")}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm whitespace-nowrap w-full sm:w-auto"
        >
          <Plus className="w-5 h-5" />
          Thêm coverage
        </button>
      </div>

      {/* Overview Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 mt-6">
        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider font-medium">
              Tổng mapping
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
            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider font-medium">
              Hoạt động
            </p>
            <p className="text-xl font-bold text-gray-900 dark:text-white">
              {activeCount}
            </p>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-purple-50 dark:bg-purple-900/30 rounded-lg text-purple-600 dark:text-purple-400">
            <Zap className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider font-medium">
              Hỗ trợ Same-day
            </p>
            <p className="text-xl font-bold text-gray-900 dark:text-white">
              {sameDayCount}
            </p>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-amber-50 dark:bg-amber-900/30 rounded-lg text-amber-600 dark:text-amber-400">
            <Banknote className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider font-medium">
              Custom Phí
            </p>
            <p className="text-xl font-bold text-gray-900 dark:text-white">
              {overrideCount}
            </p>
          </div>
        </div>
      </div>

      {/* Filters Toolbar */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm mb-6 flex flex-col lg:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Tìm kiếm theo ID chi nhánh hoặc zone..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
          />
        </div>

        <div className="flex flex-col sm:flex-row gap-3 lg:w-auto w-full">
          <select
            value={statusFilter}
            onChange={(e) => handleFilterChange("status", e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="active">Hoạt động</option>
            <option value="inactive">Tạm dừng</option>
          </select>

          <select
            value={branchFilter}
            onChange={(e) => handleFilterChange("branchId", e.target.value)}
            disabled={bootstrapLoading}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white disabled:opacity-60 focus:ring-2 focus:ring-blue-500 min-w-[200px]"
          >
            <option value="all">Tất cả chi nhánh</option>
            {branches.map((branch) => (
              <option key={branch.id} value={branch.id}>
                {branch.name}
              </option>
            ))}
          </select>

          <select
            value={zoneFilter}
            onChange={(e) =>
              handleFilterChange("shippingZoneId", e.target.value)
            }
            disabled={bootstrapLoading}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white disabled:opacity-60 focus:ring-2 focus:ring-blue-500 min-w-[200px]"
          >
            <option value="all">Tất cả vùng</option>
            {zones.map((zone) => (
              <option key={zone.id} value={zone.id}>
                {zone.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <Card className="!p-0 overflow-hidden">
        <div className="overflow-x-auto">
          {loading || bootstrapLoading ? (
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
          ) : rows.length === 0 ? (
            <div className="text-center py-20 px-4">
              <div className="bg-gray-100 dark:bg-gray-800 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Truck className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                Chưa có coverage nào
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md mx-auto">
                Hãy tạo mapping chi nhánh - vùng giao hàng đầu tiên để hệ thống
                có thể điều phối đơn hàng chính xác.
              </p>
              <button
                onClick={() => navigate("/admin/shipping/service-areas/create")}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-5 h-5" />
                Tạo coverage đầu tiên
              </button>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50/80 dark:bg-gray-800/80">
                <tr>
                  <th className="px-5 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Chi nhánh
                  </th>
                  <th className="px-5 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Vùng áp dụng
                  </th>
                  <th className="px-5 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Điều kiện đơn
                  </th>
                  <th className="px-5 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Phí vận chuyển
                  </th>
                  <th className="px-5 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Same-day
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
                {rows.map((row) => {
                  const branch = branchMap.get(row.branchId);
                  const zone = zoneMap.get(row.shippingZoneId);
                  const hasCustomFee =
                    row.deliveryFeeOverride !== null &&
                    row.deliveryFeeOverride !== undefined;
                  const hasCondition = row.minOrderValue || row.maxOrderValue;

                  return (
                    <tr
                      key={row.id}
                      onClick={() =>
                        navigate(`/admin/shipping/service-areas/edit/${row.id}`)
                      }
                      className="hover:bg-blue-50/50 dark:hover:bg-gray-800/60 transition-colors cursor-pointer group"
                    >
                      {/* Chi nhánh */}
                      <td className="px-5 py-4">
                        <div className="flex items-start gap-2.5">
                          <div className="p-1.5 bg-blue-50 dark:bg-blue-900/20 rounded-md">
                            <Store className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                          </div>
                          <div>
                            <div className="font-semibold text-gray-900 dark:text-white">
                              {branch?.name || `ID #${row.branchId}`}
                            </div>
                            <div className="text-xs text-gray-500 mt-0.5">
                              {branch?.code || `Mã: N/A`}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Vùng */}
                      <td className="px-5 py-4">
                        <div className="flex items-start gap-2.5">
                          <div className="p-1.5 bg-gray-50 dark:bg-gray-800 rounded-md">
                            <MapPinned className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                          </div>
                          <div>
                            <div className="font-semibold text-gray-900 dark:text-white">
                              {zone?.name || `ID #${row.shippingZoneId}`}
                            </div>
                            <div className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                              <Tag className="w-3 h-3" />
                              {zone?.code || `Mã: N/A`}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Điều kiện */}
                      <td className="px-5 py-4 text-sm">
                        {!hasCondition ? (
                          <span className="text-gray-500 dark:text-gray-400 font-medium bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                            Mọi giá trị đơn hàng
                          </span>
                        ) : (
                          <div className="text-gray-700 dark:text-gray-300 space-y-1">
                            {row.minOrderValue ? (
                              <div>
                                <span className="text-gray-400">Min:</span>{" "}
                                <span className="font-medium">
                                  {formatCurrency(row.minOrderValue)}
                                </span>
                              </div>
                            ) : null}
                            {row.maxOrderValue ? (
                              <div>
                                <span className="text-gray-400">Max:</span>{" "}
                                <span className="font-medium">
                                  {formatCurrency(row.maxOrderValue)}
                                </span>
                              </div>
                            ) : null}
                          </div>
                        )}
                      </td>

                      {/* Phí */}
                      <td className="px-5 py-4 text-sm">
                        {hasCustomFee ? (
                          <div className="inline-flex items-center gap-1.5 font-bold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-2.5 py-1 rounded-md border border-amber-200 dark:border-amber-800">
                            Override: {formatCurrency(row.deliveryFeeOverride)}
                          </div>
                        ) : (
                          <div className="text-gray-500 dark:text-gray-400 italic font-medium flex items-center gap-1.5">
                            Theo zone gốc
                          </div>
                        )}
                      </td>

                      {/* Same day */}
                      <td className="px-5 py-4">
                        {row.supportsSameDay ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 border border-purple-200 dark:border-purple-800">
                            <Zap className="w-3 h-3" /> Có hỗ trợ
                          </span>
                        ) : (
                          <span className="inline-flex px-2.5 py-1 rounded-md text-xs font-medium text-gray-500 bg-gray-100 dark:bg-gray-800 dark:text-gray-400">
                            Không
                          </span>
                        )}
                      </td>

                      {/* Nhãn Insight */}
                      <td className="px-5 py-4">
                        <div className="flex flex-col gap-1.5 items-start">
                          {hasCustomFee && (
                            <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                              Custom fee
                            </span>
                          )}
                          {hasCondition && (
                            <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400">
                              Rule-based
                            </span>
                          )}
                          {row.supportsSameDay && (
                            <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
                              Fast delivery
                            </span>
                          )}
                          {row.status === "inactive" && (
                            <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                              Đang tắt
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Trạng thái */}
                      <td className="px-5 py-4 text-center">
                        <span
                          className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${
                            statusMap[row.status]?.className
                          }`}
                        >
                          {statusMap[row.status]?.label || row.status}
                        </span>
                      </td>

                      {/* Hành động */}
                      <td className="px-5 py-4 text-right">
                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                          <button
                            onClick={(e) => handleToggleStatus(e, row)}
                            className={`p-2 rounded-md transition-colors ${
                              row.status === "active"
                                ? "text-yellow-600 hover:bg-yellow-50 dark:hover:bg-yellow-900/30"
                                : "text-green-600 hover:bg-green-50 dark:hover:bg-green-900/30"
                            }`}
                            title={
                              row.status === "active"
                                ? "Tạm dừng"
                                : "Bật hoạt động"
                            }
                          >
                            {row.status === "active" ? (
                              <PowerOff className="w-5 h-5" />
                            ) : (
                              <Power className="w-5 h-5" />
                            )}
                          </button>

                          <button
                            onClick={(e) => handleEdit(e, row.id)}
                            className="p-2 text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/30 rounded-md transition-colors"
                            title="Chỉnh sửa"
                          >
                            <Edit className="w-5 h-5" />
                          </button>

                          <button
                            onClick={(e) => handleDelete(e, row)}
                            className="p-2 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/30 rounded-md transition-colors"
                            title="Xóa cấu hình"
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

export default BranchServiceAreasPage;
