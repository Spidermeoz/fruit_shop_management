import React, { useEffect, useMemo, useState } from "react";
import Card from "../../../components/admin/layouts/Card";
import Pagination from "../../../components/admin/common/Pagination";
import {
  Search,
  Plus,
  Edit,
  Trash2,
  Loader2,
  Clock3,
  Store,
  Power,
  PowerOff,
  Settings2,
  Layers,
  CheckCircle2,
  AlertCircle,
  Timer,
} from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { http } from "../../../services/http";
import { useAdminToast } from "../../../context/AdminToastContext";

type BranchDeliveryTimeSlotStatus = "active" | "inactive";

interface BranchDeliveryTimeSlot {
  id: number;
  branchId: number;
  deliveryTimeSlotId: number;
  maxOrdersOverride?: number | null;
  status: BranchDeliveryTimeSlotStatus;
  createdAt?: string;
  updatedAt?: string;
  branch?: {
    id: number;
    name?: string;
    code?: string;
  } | null;
  deliveryTimeSlot?: {
    id: number;
    code?: string;
    label?: string;
    startTime?: string;
    endTime?: string;
  } | null;
}

interface BranchOption {
  id: number;
  name: string;
  code: string;
}

interface DeliveryTimeSlotOption {
  id: number;
  code: string;
  label: string;
  startTime: string;
  endTime: string;
}

type ApiList<T> = {
  success: true;
  data:
    | T[]
    | {
        items?: T[];
        pagination?: {
          page?: number;
          limit?: number;
          totalItems?: number;
          totalPages?: number;
        };
      };
  meta?: { total?: number; limit?: number; offset?: number; page?: number };
};

const statusMap: Record<
  BranchDeliveryTimeSlotStatus,
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

const formatMaxOrders = (value?: number | null) => {
  if (value === null || value === undefined) return "Không giới hạn";
  return `${Number(value).toLocaleString("vi-VN")} đơn`;
};

const formatTimeRange = (startTime?: string, endTime?: string) => {
  if (!startTime || !endTime) return "—";
  return `${String(startTime).slice(0, 5)} - ${String(endTime).slice(0, 5)}`;
};

const getTimeInsight = (startTime?: string) => {
  if (!startTime) return null;
  const hour = parseInt(startTime.split(":")[0], 10);
  if (isNaN(hour)) return null;
  if (hour < 12)
    return {
      label: "Sáng",
      color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    };
  if (hour < 18)
    return {
      label: "Chiều",
      color:
        "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
    };
  return {
    label: "Tối",
    color:
      "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400",
  };
};

const BranchDeliveryTimeSlotsPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [rows, setRows] = useState<BranchDeliveryTimeSlot[]>([]);
  const [branches, setBranches] = useState<BranchOption[]>([]);
  const [slots, setSlots] = useState<DeliveryTimeSlotOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [bootstrapLoading, setBootstrapLoading] = useState(true);
  const [error, setError] = useState("");

  const [searchInput, setSearchInput] = useState(searchParams.get("q") || "");
  const statusFilter = searchParams.get("status") || "all";
  const branchFilter = searchParams.get("branchId") || "all";
  const slotFilter = searchParams.get("deliveryTimeSlotId") || "all";
  const currentPage = Number(searchParams.get("page") || 1);
  const [totalPages, setTotalPages] = useState(1);

  const { showSuccessToast, showErrorToast } = useAdminToast();

  const branchMap = useMemo(
    () => new Map(branches.map((x) => [x.id, x])),
    [branches],
  );
  const slotMap = useMemo(() => new Map(slots.map((x) => [x.id, x])), [slots]);

  const fetchBootstrap = async () => {
    try {
      setBootstrapLoading(true);

      const [branchesRes, slotsRes] = await Promise.all([
        http<any>("GET", "/api/v1/admin/branches?limit=1000&status=active"),
        http<any>(
          "GET",
          "/api/v1/admin/delivery-time-slots?page=1&limit=1000&status=active",
        ),
      ]);

      const branchesData = Array.isArray(branchesRes?.data)
        ? branchesRes.data
        : Array.isArray(branchesRes?.data?.items)
          ? branchesRes.data.items
          : [];

      const slotsData = Array.isArray(slotsRes?.data)
        ? slotsRes.data
        : Array.isArray(slotsRes?.data?.items)
          ? slotsRes.data.items
          : [];

      setBranches(branchesData);
      setSlots(slotsData);
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
      let url = `/api/v1/admin/branch-delivery-time-slots?page=${currentPage}&limit=${limit}`;

      if (statusFilter !== "all")
        url += `&status=${encodeURIComponent(statusFilter)}`;
      if (branchFilter !== "all")
        url += `&branchId=${encodeURIComponent(branchFilter)}`;
      if (slotFilter !== "all")
        url += `&deliveryTimeSlotId=${encodeURIComponent(slotFilter)}`;

      const q = searchParams.get("q");
      if (q?.trim()) url += `&keyword=${encodeURIComponent(q.trim())}`;

      const res = await http<ApiList<BranchDeliveryTimeSlot>>("GET", url);

      if (res?.success) {
        if (Array.isArray(res.data)) {
          setRows(res.data);
          const total = Number(res.meta?.total ?? 0);
          setTotalPages(Math.max(1, Math.ceil(total / limit)));
        } else {
          const items = Array.isArray(res.data?.items) ? res.data.items : [];
          const total =
            Number(res.data?.pagination?.totalPages ?? 0) > 0
              ? Number(res.data.pagination?.totalPages)
              : 1;
          setRows(items);
          setTotalPages(total);
        }
      } else {
        setError(
          "Không thể tải danh sách cấu hình branch delivery time slots.",
        );
      }
    } catch (err: any) {
      console.error(err);
      setError(
        err?.message ||
          "Lỗi tải danh sách cấu hình khung giờ giao hàng theo chi nhánh.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBootstrap();
  }, []);

  useEffect(() => {
    fetchRows();
  }, [currentPage, statusFilter, branchFilter, slotFilter, searchParams]);

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
    key: "status" | "branchId" | "deliveryTimeSlotId",
    value: string,
  ) => {
    const params = new URLSearchParams(searchParams);
    if (value === "all") params.delete(key);
    else params.set(key, value);
    params.delete("page");
    setSearchParams(params);
  };

  const handleDelete = async (
    e: React.MouseEvent,
    row: BranchDeliveryTimeSlot,
  ) => {
    e.stopPropagation();
    const branchName =
      row.branch?.name ||
      branchMap.get(row.branchId)?.name ||
      `Chi nhánh #${row.branchId}`;
    const slotName =
      row.deliveryTimeSlot?.label ||
      slotMap.get(row.deliveryTimeSlotId)?.label ||
      `Slot #${row.deliveryTimeSlotId}`;

    const ok = window.confirm(
      `Bạn có chắc muốn xóa mapping "${branchName} - ${slotName}" không?`,
    );
    if (!ok) return;

    try {
      await http(
        "DELETE",
        `/api/v1/admin/branch-delivery-time-slots/delete/${row.id}`,
      );
      showSuccessToast({ message: "Đã xóa cấu hình thành công!" });
      fetchRows();
    } catch (err: any) {
      console.error(err);
      showErrorToast(err?.message || "Không thể xóa cấu hình.");
    }
  };

  const handleToggleStatus = async (
    e: React.MouseEvent,
    row: BranchDeliveryTimeSlot,
  ) => {
    e.stopPropagation();
    const nextStatus = row.status === "active" ? "inactive" : "active";

    try {
      await http(
        "PATCH",
        `/api/v1/admin/branch-delivery-time-slots/${row.id}/status`,
        { status: nextStatus },
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
    navigate(`/admin/shipping/branch-delivery-slots/edit/${id}`);
  };

  // Metrics
  const totalLoaded = rows.length;
  const activeCount = rows.filter((r) => r.status === "active").length;
  const overrideCount = rows.filter(
    (r) => r.maxOrdersOverride !== null && r.maxOrdersOverride !== undefined,
  ).length;
  const uniqueBranches = new Set(rows.map((r) => r.branchId)).size;

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-2">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
            Gán khung giờ giao hàng
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Kích hoạt các khung giờ cho từng chi nhánh và tùy chỉnh capacity mặc
            định nếu cần.
          </p>
        </div>

        <button
          onClick={() =>
            navigate("/admin/shipping/branch-delivery-slots/create")
          }
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm whitespace-nowrap w-full sm:w-auto"
        >
          <Plus className="w-5 h-5" />
          Thêm mapping
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
          <div className="p-3 bg-amber-50 dark:bg-amber-900/30 rounded-lg text-amber-600 dark:text-amber-400">
            <Settings2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider font-medium">
              Có Override
            </p>
            <p className="text-xl font-bold text-gray-900 dark:text-white">
              {overrideCount}
            </p>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg text-indigo-600 dark:text-indigo-400">
            <Store className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider font-medium">
              Chi nhánh gán
            </p>
            <p className="text-xl font-bold text-gray-900 dark:text-white">
              {uniqueBranches}
            </p>
          </div>
        </div>
      </div>

      {/* Filters Toolbar */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm mb-6 flex flex-col lg:flex-row gap-4">
        {/* Status Segmented Control */}
        <div className="inline-flex bg-gray-100 dark:bg-gray-900 p-1 rounded-lg w-full lg:w-auto shrink-0 border border-gray-200 dark:border-gray-700">
          {(["all", "active", "inactive"] as const).map((status) => (
            <button
              key={status}
              onClick={() => handleFilterChange("status", status)}
              className={`flex-1 lg:flex-none px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                statusFilter === status
                  ? "bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800/50"
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

        <div className="flex flex-col sm:flex-row gap-3 w-full lg:flex-1">
          <select
            value={branchFilter}
            onChange={(e) => handleFilterChange("branchId", e.target.value)}
            disabled={bootstrapLoading}
            className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white disabled:opacity-60 focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Tất cả chi nhánh</option>
            {branches.map((branch) => (
              <option key={branch.id} value={branch.id}>
                {branch.name}
              </option>
            ))}
          </select>

          <select
            value={slotFilter}
            onChange={(e) =>
              handleFilterChange("deliveryTimeSlotId", e.target.value)
            }
            disabled={bootstrapLoading}
            className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white disabled:opacity-60 focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Tất cả khung giờ</option>
            {slots.map((slot) => (
              <option key={slot.id} value={slot.id}>
                {slot.label}
              </option>
            ))}
          </select>
        </div>

        <div className="relative w-full lg:w-72 shrink-0">
          <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Tìm kiếm nhanh..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
          />
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
                <Store className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                Chưa có mapping branch - slot nào
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md mx-auto">
                Hãy gán khung giờ đầu tiên cho chi nhánh để hệ thống bắt đầu vận
                hành nhận đơn giao hàng.
              </p>
              <button
                onClick={() =>
                  navigate("/admin/shipping/branch-delivery-slots/create")
                }
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-5 h-5" />
                Thêm mapping đầu tiên
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
                    Khung giờ
                  </th>
                  <th className="px-5 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Capacity áp dụng
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
                  const branch = row.branch || branchMap.get(row.branchId);
                  const slot =
                    row.deliveryTimeSlot || slotMap.get(row.deliveryTimeSlotId);

                  const isOverride =
                    row.maxOrdersOverride !== null &&
                    row.maxOrdersOverride !== undefined;
                  const timeInsight = getTimeInsight(slot?.startTime);

                  return (
                    <tr
                      key={row.id}
                      onClick={() =>
                        navigate(
                          `/admin/shipping/branch-delivery-slots/edit/${row.id}`,
                        )
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
                              {branch?.code || "Mã: N/A"}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Khung giờ */}
                      <td className="px-5 py-4">
                        <div className="flex items-start gap-2.5">
                          <div className="p-1.5 bg-gray-50 dark:bg-gray-800 rounded-md">
                            <Clock3 className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                          </div>
                          <div>
                            <div className="font-semibold text-gray-900 dark:text-white">
                              {slot?.label || `Slot #${row.deliveryTimeSlotId}`}
                            </div>
                            <div className="text-xs text-gray-500 mt-0.5 font-mono">
                              {slot?.code || "Mã: N/A"}
                            </div>
                            <div className="text-xs font-medium text-gray-600 dark:text-gray-400 mt-1.5 flex items-center gap-1">
                              <Timer className="w-3 h-3" />
                              {formatTimeRange(slot?.startTime, slot?.endTime)}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Capacity áp dụng */}
                      <td className="px-5 py-4 text-sm">
                        {isOverride ? (
                          <>
                            <div className="font-bold text-amber-700 dark:text-amber-400">
                              Override: {formatMaxOrders(row.maxOrdersOverride)}
                            </div>
                            <div className="mt-1">
                              <span className="inline-flex px-2 py-0.5 rounded text-[11px] font-medium bg-amber-50 border border-amber-200 text-amber-700 dark:bg-amber-900/20 dark:border-amber-800 dark:text-amber-400">
                                Custom capacity
                              </span>
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="text-gray-900 dark:text-white font-medium">
                              Theo slot mặc định
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              Không override
                            </div>
                          </>
                        )}
                      </td>

                      {/* Nhãn Insight */}
                      <td className="px-5 py-4">
                        <div className="flex flex-col gap-1.5 items-start">
                          {isOverride ? (
                            <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                              Custom
                            </span>
                          ) : row.status === "active" ? (
                            <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                              Standard
                            </span>
                          ) : null}

                          {row.status === "inactive" && (
                            <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                              Đang tắt
                            </span>
                          )}

                          {timeInsight && (
                            <span
                              className={`px-2 py-0.5 rounded text-[11px] font-medium ${timeInsight.color}`}
                            >
                              Ca {timeInsight.label}
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
                            title="Xóa mapping"
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

export default BranchDeliveryTimeSlotsPage;
