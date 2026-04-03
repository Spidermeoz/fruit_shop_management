import React, { useEffect, useMemo, useState } from "react";
import Card from "../../../components/admin/layouts/Card";
import Pagination from "../../../components/admin/common/Pagination";
import {
  Search,
  Plus,
  Edit,
  Trash2,
  Loader2,
  CalendarDays,
  Clock3,
  Power,
  PowerOff,
  PackageSearch,
  CheckCircle2,
  Infinity as InfinityIcon,
  AlertTriangle,
  TrendingUp,
} from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { http } from "../../../services/http";
import { useAdminToast } from "../../../context/AdminToastContext";

type BranchDeliverySlotCapacityStatus = "active" | "inactive";

interface BranchDeliverySlotCapacity {
  id: number;
  branchId: number;
  deliveryDate: string;
  deliveryTimeSlotId: number;
  maxOrders?: number | null;
  reservedOrders: number;
  status: BranchDeliverySlotCapacityStatus;
  createdAt?: string;
  updatedAt?: string;
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
  data: T[];
  meta?: { total?: number; limit?: number; offset?: number; page?: number };
};

const statusMap: Record<
  BranchDeliverySlotCapacityStatus,
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
      "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400 border border-gray-200 dark:border-gray-700",
  },
};

const formatTimeRange = (startTime?: string, endTime?: string) => {
  if (!startTime || !endTime) return "—";
  return `${String(startTime).slice(0, 5)} - ${String(endTime).slice(0, 5)}`;
};

const isToday = (dateString: string) => {
  const today = new Date();
  const d = new Date(dateString);
  return (
    d.getDate() === today.getDate() &&
    d.getMonth() === today.getMonth() &&
    d.getFullYear() === today.getFullYear()
  );
};

const getCapacityInsight = (
  max: number | null | undefined,
  reserved: number,
  status: string,
) => {
  if (status === "inactive")
    return {
      label: "Đang tắt",
      color: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
    };
  if (max === null || max === undefined)
    return {
      label: "Unlimited",
      color:
        "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
    };

  if (reserved >= max)
    return {
      label: "Full",
      color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    };
  if (reserved / max >= 0.8)
    return {
      label: "Sắp đầy",
      color:
        "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
    };

  return {
    label: "Còn chỗ",
    color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  };
};

const BranchDeliverySlotCapacitiesPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [rows, setRows] = useState<BranchDeliverySlotCapacity[]>([]);
  const [branches, setBranches] = useState<BranchOption[]>([]);
  const [slots, setSlots] = useState<DeliveryTimeSlotOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [bootstrapLoading, setBootstrapLoading] = useState(true);
  const [error, setError] = useState("");

  const [searchInput, setSearchInput] = useState(searchParams.get("q") || "");
  const statusFilter = searchParams.get("status") || "all";
  const branchFilter = searchParams.get("branchId") || "all";
  const slotFilter = searchParams.get("deliveryTimeSlotId") || "all";
  const deliveryDateFilter = searchParams.get("deliveryDate") || "";
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
      const offset = (currentPage - 1) * limit;

      let url = `/api/v1/admin/branch-delivery-slot-capacities?limit=${limit}&page=${currentPage}&offset=${offset}`;

      if (statusFilter !== "all")
        url += `&status=${encodeURIComponent(statusFilter)}`;
      if (branchFilter !== "all")
        url += `&branchId=${encodeURIComponent(branchFilter)}`;
      if (slotFilter !== "all")
        url += `&deliveryTimeSlotId=${encodeURIComponent(slotFilter)}`;
      if (deliveryDateFilter.trim())
        url += `&deliveryDate=${encodeURIComponent(deliveryDateFilter.trim())}`;

      const q = searchParams.get("q");
      if (q?.trim()) url += `&q=${encodeURIComponent(q.trim())}`;

      const res = await http<ApiList<BranchDeliverySlotCapacity>>("GET", url);

      if (res?.success && Array.isArray(res.data)) {
        setRows(res.data);
        const total = Number(res.meta?.total ?? 0);
        setTotalPages(Math.max(1, Math.ceil(total / limit)));
      } else {
        setError("Không thể tải danh sách capacity.");
      }
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Lỗi tải danh sách capacity.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBootstrap();
  }, []);

  useEffect(() => {
    fetchRows();
  }, [
    currentPage,
    statusFilter,
    branchFilter,
    slotFilter,
    deliveryDateFilter,
    searchParams,
  ]);

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
    key: "status" | "branchId" | "deliveryTimeSlotId" | "deliveryDate",
    value: string,
  ) => {
    const params = new URLSearchParams(searchParams);
    if (!value || value === "all") params.delete(key);
    else params.set(key, value);
    params.delete("page");
    setSearchParams(params);
  };

  const handleDelete = async (
    e: React.MouseEvent,
    row: BranchDeliverySlotCapacity,
  ) => {
    e.stopPropagation();
    const branchName =
      branchMap.get(row.branchId)?.name || `Chi nhánh #${row.branchId}`;
    const slotName =
      slotMap.get(row.deliveryTimeSlotId)?.label ||
      `Khung giờ #${row.deliveryTimeSlotId}`;

    const ok = window.confirm(
      `Bạn có chắc muốn xóa capacity "${branchName} - ${slotName} - ${row.deliveryDate}" không?`,
    );
    if (!ok) return;

    try {
      await http(
        "DELETE",
        `/api/v1/admin/branch-delivery-slot-capacities/delete/${row.id}`,
      );
      showSuccessToast({ message: "Đã xóa capacity thành công!" });
      fetchRows();
    } catch (err: any) {
      console.error(err);
      showErrorToast(err?.message || "Không thể xóa capacity.");
    }
  };

  const handleToggleStatus = async (
    e: React.MouseEvent,
    row: BranchDeliverySlotCapacity,
  ) => {
    e.stopPropagation();
    const nextStatus = row.status === "active" ? "inactive" : "active";

    try {
      await http(
        "PATCH",
        `/api/v1/admin/branch-delivery-slot-capacities/${row.id}/status`,
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
    navigate(`/admin/shipping/branch-delivery-slot-capacities/edit/${id}`);
  };

  // Metrics calculation
  const totalLoaded = rows.length;
  const activeCount = rows.filter((r) => r.status === "active").length;
  const limitedCount = rows.filter(
    (r) => r.maxOrders !== null && r.maxOrders !== undefined,
  ).length;
  const totalReserved = rows.reduce(
    (sum, r) => sum + (Number(r.reservedOrders) || 0),
    0,
  );

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-2">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
            Quản lý Capacity vận hành
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Quản lý sức chứa đơn hàng theo ngày, chi nhánh và khung giờ giao
            hàng.
          </p>
        </div>

        <button
          onClick={() =>
            navigate("/admin/shipping/branch-delivery-slot-capacities/create")
          }
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm whitespace-nowrap w-full sm:w-auto"
        >
          <Plus className="w-5 h-5" />
          Thêm capacity
        </button>
      </div>

      {/* Overview Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 mt-6">
        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400">
            <PackageSearch className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider font-medium">
              Tổng records
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
              Đang hoạt động
            </p>
            <p className="text-xl font-bold text-gray-900 dark:text-white">
              {activeCount}
            </p>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-amber-50 dark:bg-amber-900/30 rounded-lg text-amber-600 dark:text-amber-400">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider font-medium">
              Có giới hạn
            </p>
            <p className="text-xl font-bold text-gray-900 dark:text-white">
              {limitedCount}
            </p>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg text-indigo-600 dark:text-indigo-400">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider font-medium">
              Đã Reserved
            </p>
            <p className="text-xl font-bold text-gray-900 dark:text-white">
              {totalReserved.toLocaleString("vi-VN")}
            </p>
          </div>
        </div>
      </div>

      {/* Filters Toolbar */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm mb-6 flex flex-col xl:flex-row gap-4">
        <div className="flex gap-3 w-full xl:w-auto overflow-x-auto pb-1 xl:pb-0 hide-scrollbar">
          <select
            value={statusFilter}
            onChange={(e) => handleFilterChange("status", e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 min-w-[140px]"
          >
            <option value="all">Mọi trạng thái</option>
            <option value="active">Hoạt động</option>
            <option value="inactive">Tạm dừng</option>
          </select>

          <input
            type="date"
            value={deliveryDateFilter}
            onChange={(e) => handleFilterChange("deliveryDate", e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 min-w-[150px]"
          />
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full flex-1">
          <select
            value={branchFilter}
            onChange={(e) => handleFilterChange("branchId", e.target.value)}
            disabled={bootstrapLoading}
            className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white disabled:opacity-60 focus:ring-2 focus:ring-blue-500"
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
            className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white disabled:opacity-60 focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Tất cả khung giờ</option>
            {slots.map((slot) => (
              <option key={slot.id} value={slot.id}>
                {slot.label}
              </option>
            ))}
          </select>
        </div>

        <div className="relative w-full xl:w-64 shrink-0">
          <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Tìm kiếm..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
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
              <AlertTriangle className="w-10 h-10 mx-auto mb-2 opacity-80" />
              <p>{error}</p>
            </div>
          ) : rows.length === 0 ? (
            <div className="text-center py-20 px-4">
              <div className="bg-gray-100 dark:bg-gray-800 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                <CalendarDays className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                Chưa có capacity nào theo ngày
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md mx-auto">
                Hãy tạo cấu hình capacity đầu tiên cho ngày cụ thể để bắt đầu
                giới hạn và nhận đơn vận hành.
              </p>
              <button
                onClick={() =>
                  navigate(
                    "/admin/shipping/branch-delivery-slot-capacities/create",
                  )
                }
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-5 h-5" />
                Tạo capacity đầu tiên
              </button>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50/80 dark:bg-gray-800/80">
                <tr>
                  <th className="px-5 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Ngày giao
                  </th>
                  <th className="px-5 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Chi nhánh
                  </th>
                  <th className="px-5 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Khung giờ
                  </th>
                  <th className="px-5 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider w-56">
                    Capacity / Usage
                  </th>
                  <th className="px-5 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Insight
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
                  const slot = slotMap.get(row.deliveryTimeSlotId);

                  const isUnlimited =
                    row.maxOrders === null || row.maxOrders === undefined;
                  const max = row.maxOrders ?? 0;
                  const reserved = Number(row.reservedOrders) || 0;
                  const available = isUnlimited
                    ? "Không giới hạn"
                    : max - reserved > 0
                      ? max - reserved
                      : 0;

                  const insight = getCapacityInsight(
                    row.maxOrders,
                    reserved,
                    row.status,
                  );
                  const today = isToday(row.deliveryDate);

                  const percent =
                    !isUnlimited && max > 0
                      ? Math.min((reserved / max) * 100, 100)
                      : 0;

                  return (
                    <tr
                      key={row.id}
                      onClick={() =>
                        navigate(
                          `/admin/shipping/branch-delivery-slot-capacities/edit/${row.id}`,
                        )
                      }
                      className="hover:bg-blue-50/50 dark:hover:bg-gray-800/60 transition-colors cursor-pointer group"
                    >
                      {/* Ngày giao */}
                      <td className="px-5 py-4">
                        <div className="flex items-start gap-2.5">
                          <div
                            className={`p-1.5 rounded-md ${today ? "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400" : "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400"}`}
                          >
                            <CalendarDays className="w-4 h-4" />
                          </div>
                          <div>
                            <div
                              className={`font-semibold ${today ? "text-blue-700 dark:text-blue-400" : "text-gray-900 dark:text-white"}`}
                            >
                              {row.deliveryDate}
                            </div>
                            <div className="text-xs mt-0.5">
                              {today ? (
                                <span className="font-medium text-blue-600 dark:text-blue-400">
                                  Hôm nay
                                </span>
                              ) : (
                                <span className="text-gray-400">Ngày khác</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Chi nhánh */}
                      <td className="px-5 py-4">
                        <div className="font-semibold text-gray-900 dark:text-white">
                          {branch?.name || `Chi nhánh #${row.branchId}`}
                        </div>
                        <div className="text-xs text-gray-500 mt-0.5 font-mono">
                          {branch?.code || `ID: ${row.branchId}`}
                        </div>
                      </td>

                      {/* Khung giờ */}
                      <td className="px-5 py-4">
                        <div className="font-semibold text-gray-900 dark:text-white">
                          {slot?.label || `Slot #${row.deliveryTimeSlotId}`}
                        </div>
                        <div className="text-xs text-gray-500 mt-0.5 font-mono">
                          {slot?.code || `ID: ${row.deliveryTimeSlotId}`}
                        </div>
                        <div className="text-xs font-medium text-gray-600 dark:text-gray-400 mt-1.5 flex items-center gap-1">
                          <Clock3 className="w-3 h-3" />
                          {formatTimeRange(slot?.startTime, slot?.endTime)}
                        </div>
                      </td>

                      {/* Capacity / Usage */}
                      <td className="px-5 py-4 text-sm">
                        <div className="flex justify-between items-end mb-1.5">
                          <span className="text-gray-500 dark:text-gray-400">
                            Reserved:{" "}
                            <strong className="text-gray-900 dark:text-white">
                              {reserved}
                            </strong>
                          </span>
                          <span className="text-gray-500 dark:text-gray-400 text-xs">
                            Max:{" "}
                            {isUnlimited ? (
                              <InfinityIcon className="w-3.5 h-3.5 inline text-gray-400" />
                            ) : (
                              <strong className="text-gray-900 dark:text-white">
                                {max}
                              </strong>
                            )}
                          </span>
                        </div>

                        {!isUnlimited ? (
                          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-1.5 overflow-hidden">
                            <div
                              className={`h-2 rounded-full ${percent >= 100 ? "bg-red-500" : percent >= 80 ? "bg-orange-500" : "bg-blue-500"}`}
                              style={{ width: `${percent}%` }}
                            ></div>
                          </div>
                        ) : (
                          <div className="w-full bg-purple-100 dark:bg-purple-900/30 rounded-full h-2 mb-1.5 overflow-hidden flex items-center justify-center">
                            <div className="w-full bg-purple-300 dark:bg-purple-700/50 h-full opacity-50"></div>
                          </div>
                        )}

                        <div className="text-xs font-medium text-gray-600 dark:text-gray-300">
                          {isUnlimited
                            ? "Available: ∞"
                            : `Còn lại: ${available}`}
                        </div>
                      </td>

                      {/* Insight */}
                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded text-[11px] font-bold ${insight.color}`}
                        >
                          {insight.label}
                        </span>
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
                            title="Xóa record"
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

export default BranchDeliverySlotCapacitiesPage;
