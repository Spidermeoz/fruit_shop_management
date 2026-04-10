import { useState, useMemo } from "react";
import {
  ArrowRight,
  LayoutList,
  BarChart2,
  TrendingUp,
  AlertTriangle,
  Package,
  Users,
  ArrowDownUp,
  Filter,
} from "lucide-react";
import type { DashboardBranchPerformanceItem } from "../types/dashboard";
import DashboardSectionCard from "./DashboardSectionCard";
import DashboardBadge from "../shared/DashboardBadge";
import DashboardHealthPill from "../shared/DashboardHealthPill";
import DashboardNumber from "../shared/DashboardNumber";
import DashboardEmptyState from "../shared/DashboardEmptyState";

type BranchPerformanceTableProps = {
  rows: DashboardBranchPerformanceItem[];
  className?: string;
  defaultView?: "table" | "chart";
};

// --- Helper Functions ---

const getStatusBadgeVariant = (
  status: string,
): "default" | "emerald" | "amber" | "red" | "violet" => {
  if (status === "active") return "emerald";
  if (status === "inactive") return "amber";
  return "default";
};

// Logic tính điểm sức khỏe (0 - 100)
const calculateHealthScore = (row: DashboardBranchPerformanceItem): number => {
  let score = 100;
  if (row.healthStatus === "warning") score -= 15;
  if (row.healthStatus === "critical") score -= 30;

  // Trừ điểm dựa trên tồn kho
  if (row.outOfStockCount > 0) score -= Math.min(row.outOfStockCount * 3, 20);
  if (row.lowStockCount > 0) score -= Math.min(row.lowStockCount * 1, 10);

  // Trừ điểm dựa trên đơn hàng rủi ro
  if (row.unpaidActiveOrders > 0)
    score -= Math.min(row.unpaidActiveOrders * 2, 15);

  // Trừ điểm dựa trên vận hành (inactive setups)
  const inactiveShipping =
    row.inactiveServiceAreas +
    row.inactiveBranchDeliverySlots +
    row.inactiveCapacityRecords;
  if (inactiveShipping > 0) score -= Math.min(inactiveShipping * 2, 15);

  return Math.max(0, Math.min(100, score));
};

// --- Subcomponents ---

const MiniProgressBar = ({
  label,
  active,
  total,
}: {
  label: string;
  active: number;
  total: number;
}) => {
  const percent = total === 0 ? 0 : (active / total) * 100;
  const isZeroTotal = total === 0;
  const isPerfect = active === total && total > 0;

  return (
    <div className="space-y-1.5 w-full max-w-[140px]">
      <div className="flex items-center justify-between text-[11px] leading-none">
        <span className="text-slate-500 dark:text-slate-400 font-medium">
          {label}
        </span>
        <span className="text-slate-700 dark:text-slate-300 font-semibold">
          {isZeroTotal ? "0/0" : `${active}/${total}`}
        </span>
      </div>
      <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            isZeroTotal
              ? "bg-slate-300 dark:bg-slate-600"
              : isPerfect
                ? "bg-emerald-500"
                : "bg-amber-500"
          }`}
          style={{ width: `${isZeroTotal ? 100 : percent}%` }}
        />
      </div>
    </div>
  );
};

export default function BranchPerformanceTable({
  rows,
  className = "",
  defaultView = "table",
}: BranchPerformanceTableProps) {
  // --- States ---
  const [viewMode, setViewMode] = useState<"table" | "chart">(defaultView);
  const [sortBy, setSortBy] = useState<"revenue" | "orders" | "risk" | "team">(
    "revenue",
  );
  const [healthFilter, setHealthFilter] = useState<
    "all" | "healthy" | "warning" | "critical"
  >("all");

  // --- Derived Data & Sorting ---
  const { processedRows, summaryStats } = useMemo(() => {
    // 1. Tính toán insight phụ cho từng row
    let data = rows.map((row) => ({
      ...row,
      _healthScore: calculateHealthScore(row),
      _totalServiceAreas: row.activeServiceAreas + row.inactiveServiceAreas,
      _totalSlots:
        row.activeBranchDeliverySlots + row.inactiveBranchDeliverySlots,
      _totalCapacity: row.activeCapacityRecords + row.inactiveCapacityRecords,
    }));

    // Tính stats cho Summary Strip (dựa trên dữ liệu gốc chưa filter)
    const stats = {
      totalRevenue: data.reduce((sum, r) => sum + r.netRevenue, 0),
      totalOrders: data.reduce((sum, r) => sum + r.totalOrders, 0),
      riskCount: data.filter((r) => r.healthStatus !== "healthy").length,
      totalBranches: data.length,
    };

    // 2. Lọc dữ liệu
    if (healthFilter !== "all") {
      data = data.filter((r) => r.healthStatus === healthFilter);
    }

    // 3. Sắp xếp dữ liệu
    data.sort((a, b) => {
      switch (sortBy) {
        case "revenue":
          return b.netRevenue - a.netRevenue;
        case "orders":
          return b.totalOrders - a.totalOrders;
        case "risk":
          // Risk cao nhất (điểm thấp nhất) lên đầu
          return a._healthScore - b._healthScore;
        case "team":
          return b.internalUsers - a.internalUsers;
        default:
          return 0;
      }
    });

    return { processedRows: data, summaryStats: stats };
  }, [rows, sortBy, healthFilter]);

  // Tìm giá trị max để vẽ chart
  const maxMetricValue = useMemo(() => {
    if (processedRows.length === 0) return 0;
    return Math.max(
      ...processedRows.map((r) =>
        sortBy === "orders" ? r.totalOrders : r.netRevenue,
      ),
    );
  }, [processedRows, sortBy]);

  // --- Renderers ---
  const renderControls = () => (
    <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 p-4 bg-slate-50/50 dark:bg-slate-900/20">
      {/* View Toggle */}
      <div className="flex items-center rounded-lg bg-slate-100 p-1 dark:bg-slate-800">
        <button
          onClick={() => setViewMode("table")}
          className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
            viewMode === "table"
              ? "bg-white text-slate-900 shadow-sm dark:bg-slate-900 dark:text-white"
              : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
          }`}
        >
          <LayoutList className="h-3.5 w-3.5" />
          Bảng
        </button>
        <button
          onClick={() => setViewMode("chart")}
          className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
            viewMode === "chart"
              ? "bg-white text-slate-900 shadow-sm dark:bg-slate-900 dark:text-white"
              : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
          }`}
        >
          <BarChart2 className="h-3.5 w-3.5" />
          Biểu đồ
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        {/* Filters */}
        <div className="flex items-center gap-1.5 border-r border-slate-200 pr-3 dark:border-slate-700">
          <Filter className="h-3.5 w-3.5 text-slate-400" />
          {(["all", "healthy", "warning", "critical"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setHealthFilter(f)}
              className={`rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider transition-colors ${
                healthFilter === f
                  ? "bg-slate-800 text-white dark:bg-slate-200 dark:text-slate-900"
                  : "bg-slate-100 text-slate-500 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700"
              }`}
            >
              {f === "all" ? "Tất cả" : f}
            </button>
          ))}
        </div>

        {/* Sort */}
        <div className="flex items-center gap-2 text-sm">
          <ArrowDownUp className="h-3.5 w-3.5 text-slate-400" />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="rounded-md border-0 bg-transparent py-1 pl-1 pr-6 text-sm font-medium text-slate-700 focus:ring-0 dark:text-slate-300"
          >
            <option value="revenue">Doanh thu</option>
            <option value="orders">Đơn hàng</option>
            <option value="risk">Mức độ rủi ro</option>
            <option value="team">Nhân sự</option>
          </select>
        </div>
      </div>
    </div>
  );

  const renderSummaryStrip = () => (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 p-4 border-b border-slate-100 dark:border-slate-800">
      <div className="flex items-center gap-3">
        <div className="rounded-full bg-blue-50 p-2.5 dark:bg-blue-900/30">
          <TrendingUp className="h-5 w-5 text-blue-600 dark:text-blue-400" />
        </div>
        <div>
          <p className="text-[11px] font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Tổng Doanh Thu
          </p>
          <DashboardNumber
            value={summaryStats.totalRevenue}
            format="currency"
            className="text-lg font-bold text-slate-900 dark:text-white"
          />
        </div>
      </div>
      <div className="flex items-center gap-3 border-l border-slate-100 pl-4 dark:border-slate-800">
        <div className="rounded-full bg-emerald-50 p-2.5 dark:bg-emerald-900/30">
          <Package className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
        </div>
        <div>
          <p className="text-[11px] font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Tổng Đơn Hàng
          </p>
          <DashboardNumber
            value={summaryStats.totalOrders}
            className="text-lg font-bold text-slate-900 dark:text-white"
          />
        </div>
      </div>
      <div className="flex items-center gap-3 border-l border-slate-100 pl-4 dark:border-slate-800">
        <div className="rounded-full bg-amber-50 p-2.5 dark:bg-amber-900/30">
          <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
        </div>
        <div>
          <p className="text-[11px] font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Cần Chú Ý (Risk)
          </p>
          <div className="text-lg font-bold text-slate-900 dark:text-white">
            {summaryStats.riskCount}{" "}
            <span className="text-sm font-normal text-slate-400">
              / {summaryStats.totalBranches}
            </span>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-3 border-l border-slate-100 pl-4 dark:border-slate-800">
        <div className="rounded-full bg-violet-50 p-2.5 dark:bg-violet-900/30">
          <Users className="h-5 w-5 text-violet-600 dark:text-violet-400" />
        </div>
        <div>
          <p className="text-[11px] font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Phạm Vi Vận Hành
          </p>
          <div className="text-lg font-bold text-slate-900 dark:text-white">
            {summaryStats.totalBranches}{" "}
            <span className="text-sm font-normal text-slate-400">
              Chi nhánh
            </span>
          </div>
        </div>
      </div>
    </div>
  );

  const renderTableView = () => (
    <div className="overflow-x-auto">
      <table className="min-w-full border-separate border-spacing-0">
        <thead className="bg-slate-50/50 dark:bg-slate-900/50">
          <tr>
            <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Chi nhánh
            </th>
            <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Hiệu suất
            </th>
            <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Tồn kho
            </th>
            <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 w-40">
              Vận chuyển
            </th>
            <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Nhân sự
            </th>
            <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Sức khỏe (Score)
            </th>
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-slate-950">
          {processedRows.map((row) => (
            <tr
              key={row.branchId}
              className="border-b border-slate-50 align-top transition-colors hover:bg-slate-50/80 dark:border-slate-800/50 dark:hover:bg-slate-900/40"
            >
              {/* Cột 1: Chi nhánh */}
              <td className="px-4 py-4 border-b border-slate-100 dark:border-slate-800">
                <div className="min-w-[200px] flex gap-3">
                  <div className="mt-1">
                    <div
                      className={`h-2.5 w-2.5 rounded-full ${row.healthStatus === "healthy" ? "bg-emerald-500" : row.healthStatus === "warning" ? "bg-amber-500" : "bg-red-500"}`}
                    />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <a
                        href={`/admin/branches/edit/${row.branchId}`}
                        className="text-sm font-bold text-slate-900 hover:text-blue-600 dark:text-slate-100 dark:hover:text-blue-400"
                      >
                        {row.branchName}
                      </a>
                      {row.branchCode && (
                        <DashboardBadge
                          variant="slate"
                          className="text-[10px] px-1.5 py-0"
                        >
                          {row.branchCode}
                        </DashboardBadge>
                      )}
                    </div>
                    <DashboardBadge
                      variant={getStatusBadgeVariant(row.branchStatus)}
                    >
                      {row.branchStatus}
                    </DashboardBadge>
                    <div className="mt-2 text-xs text-slate-500 flex items-center gap-1 group cursor-pointer hover:text-blue-600 dark:hover:text-blue-400">
                      Xem workspace chi nhánh
                      <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-1" />
                    </div>
                  </div>
                </div>
              </td>

              {/* Cột 2: Hiệu suất (Orders + Revenue) */}
              <td className="px-4 py-4 border-b border-slate-100 dark:border-slate-800">
                <div className="space-y-2 min-w-[140px]">
                  <div>
                    <span className="text-[10px] uppercase font-semibold text-slate-400 block mb-0.5">
                      Doanh Thu
                    </span>
                    <DashboardNumber
                      value={row.netRevenue}
                      format="currency"
                      className="text-base font-bold text-slate-900 dark:text-white"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-xs">
                    <span className="text-slate-500">Orders:</span>
                    <DashboardNumber
                      value={row.totalOrders}
                      className="font-medium text-right text-slate-700 dark:text-slate-300"
                    />
                    <span className="text-slate-500">Pending:</span>
                    <DashboardNumber
                      value={row.pendingOrders}
                      className="font-medium text-right text-amber-600 dark:text-amber-400"
                    />
                    <span className="text-slate-500">Unpaid:</span>
                    <DashboardNumber
                      value={row.unpaidActiveOrders}
                      className="font-medium text-right text-red-600 dark:text-red-400"
                    />
                  </div>
                </div>
              </td>

              {/* Cột 3: Tồn kho */}
              <td className="px-4 py-4 border-b border-slate-100 dark:border-slate-800">
                <div className="space-y-2 min-w-[120px]">
                  <DashboardBadge
                    variant={
                      row.outOfStockCount > 0
                        ? "red"
                        : row.lowStockCount > 0
                          ? "amber"
                          : "emerald"
                    }
                    className="w-fit"
                  >
                    {row.outOfStockCount > 0
                      ? "Hết hàng"
                      : row.lowStockCount > 0
                        ? "Thiếu hàng"
                        : "Kho ổn định"}
                  </DashboardBadge>
                  <div className="text-xs space-y-1 mt-2">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Low stock:</span>
                      <DashboardNumber
                        value={row.lowStockCount}
                        className="font-medium"
                      />
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Out of stock:</span>
                      <DashboardNumber
                        value={row.outOfStockCount}
                        className={`font-medium ${row.outOfStockCount > 0 ? "text-red-600 dark:text-red-400" : ""}`}
                      />
                    </div>
                  </div>
                </div>
              </td>

              {/* Cột 4: Vận chuyển (Shipping readiness) */}
              <td className="px-4 py-4 border-b border-slate-100 dark:border-slate-800">
                <div className="space-y-3">
                  <MiniProgressBar
                    label="Service Areas"
                    active={row.activeServiceAreas}
                    total={row._totalServiceAreas}
                  />
                  <MiniProgressBar
                    label="Slots"
                    active={row.activeBranchDeliverySlots}
                    total={row._totalSlots}
                  />
                  <MiniProgressBar
                    label="Capacity"
                    active={row.activeCapacityRecords}
                    total={row._totalCapacity}
                  />
                </div>
              </td>

              {/* Cột 5: Nhân sự */}
              <td className="px-4 py-4 border-b border-slate-100 dark:border-slate-800 text-center">
                <div className="flex flex-col items-start gap-1">
                  <span className="text-xl font-light text-slate-900 dark:text-white">
                    {row.internalUsers}
                  </span>
                  <span
                    className={`text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded-sm ${
                      row.internalUsers < 3
                        ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                        : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                    }`}
                  >
                    {row.internalUsers < 3 ? "Core team mỏng" : "Đủ nhân sự"}
                  </span>
                </div>
              </td>

              {/* Cột 6: Health Score & Signals */}
              <td className="px-4 py-4 border-b border-slate-100 dark:border-slate-800">
                <div className="min-w-[220px] space-y-2.5">
                  <div className="flex items-center gap-3">
                    {/* Fake radial score indicator */}
                    <div className="relative flex h-10 w-10 items-center justify-center rounded-full bg-slate-50 dark:bg-slate-900">
                      <svg
                        className="absolute inset-0 h-full w-full -rotate-90"
                        viewBox="0 0 36 36"
                      >
                        <path
                          className="text-slate-200 dark:text-slate-800"
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="3"
                        />
                        <path
                          className={
                            row._healthScore > 80
                              ? "text-emerald-500"
                              : row._healthScore > 50
                                ? "text-amber-500"
                                : "text-red-500"
                          }
                          strokeDasharray={`${row._healthScore}, 100`}
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="3"
                        />
                      </svg>
                      <span className="text-[10px] font-bold">
                        {row._healthScore}
                      </span>
                    </div>

                    <DashboardHealthPill status={row.healthStatus} />
                  </div>

                  {row.healthSignals.length > 0 ? (
                    <ul className="space-y-1 text-[11px] leading-tight text-slate-500 dark:text-slate-400">
                      {row.healthSignals.slice(0, 2).map((signal, idx) => (
                        <li key={idx} className="flex items-start gap-1">
                          <span className="mt-0.5">•</span>
                          <span className="line-clamp-2">{signal}</span>
                        </li>
                      ))}
                      {row.healthSignals.length > 2 && (
                        <li className="text-slate-400 italic">
                          +{row.healthSignals.length - 2} tín hiệu khác...
                        </li>
                      )}
                    </ul>
                  ) : (
                    <p className="text-[11px] text-slate-400 italic">
                      Vận hành trơn tru
                    </p>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderChartView = () => (
    <div className="p-4 space-y-4">
      {processedRows.map((row) => {
        // Metric chính để render bar
        const primaryVal =
          sortBy === "orders" ? row.totalOrders : row.netRevenue;
        const barPercent =
          maxMetricValue === 0 ? 0 : (primaryVal / maxMetricValue) * 100;

        // Màu sắc bar theo healthScore
        const barColor =
          row._healthScore > 80
            ? "bg-emerald-500"
            : row._healthScore > 50
              ? "bg-amber-400"
              : "bg-red-400";

        return (
          <div
            key={row.branchId}
            className="group relative rounded-xl border border-slate-100 p-4 transition-all hover:border-slate-200 hover:shadow-sm dark:border-slate-800 dark:hover:border-slate-700 bg-white dark:bg-slate-950"
          >
            <div className="flex flex-col md:flex-row md:items-center gap-4">
              {/* Info Trái */}
              <div className="w-full md:w-48 shrink-0">
                <a
                  href={`/admin/branches/edit/${row.branchId}`}
                  className="text-sm font-bold text-slate-900 hover:text-blue-600 dark:text-white mb-1 block truncate"
                >
                  {row.branchName}
                </a>
                <div className="flex items-center gap-2">
                  <DashboardHealthPill status={row.healthStatus} />
                  <span className="text-xs font-semibold text-slate-500">
                    Score: {row._healthScore}
                  </span>
                </div>
              </div>

              {/* Bar Giữa */}
              <div className="flex-1 min-w-[200px] py-2">
                <div className="mb-1.5 flex justify-between text-xs text-slate-500">
                  <span className="uppercase tracking-wider font-semibold">
                    {sortBy === "orders" ? "Đơn hàng" : "Doanh thu"}
                  </span>
                  <DashboardNumber
                    value={primaryVal}
                    format={sortBy === "revenue" ? "currency" : "number"}
                    className="font-bold text-slate-900 dark:text-slate-100"
                  />
                </div>
                <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-1000 ${barColor}`}
                    style={{ width: `${Math.max(1, barPercent)}%` }}
                  />
                </div>

                {/* Insight Tags (Signals) */}
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {row.outOfStockCount > 0 && (
                    <span className="inline-flex items-center rounded-md bg-red-50 px-1.5 py-0.5 text-[10px] font-medium text-red-700 ring-1 ring-inset ring-red-600/10 dark:bg-red-900/30 dark:text-red-400 dark:ring-red-900/50">
                      Tồn kho: {row.outOfStockCount} Out
                    </span>
                  )}
                  {row.unpaidActiveOrders > 0 && (
                    <span className="inline-flex items-center rounded-md bg-amber-50 px-1.5 py-0.5 text-[10px] font-medium text-amber-700 ring-1 ring-inset ring-amber-600/10 dark:bg-amber-900/30 dark:text-amber-400 dark:ring-amber-900/50">
                      Đơn nợ: {row.unpaidActiveOrders}
                    </span>
                  )}
                  {row._totalServiceAreas > 0 &&
                    row.activeServiceAreas < row._totalServiceAreas && (
                      <span className="inline-flex items-center rounded-md bg-slate-50 px-1.5 py-0.5 text-[10px] font-medium text-slate-600 ring-1 ring-inset ring-slate-500/10 dark:bg-slate-800 dark:text-slate-400 dark:ring-slate-700">
                        Shipping rủi ro
                      </span>
                    )}
                  {row._healthScore >= 90 && (
                    <span className="inline-flex items-center rounded-md bg-emerald-50 px-1.5 py-0.5 text-[10px] font-medium text-emerald-700 ring-1 ring-inset ring-emerald-600/10 dark:bg-emerald-900/30 dark:text-emerald-400 dark:ring-emerald-900/50">
                      Top vận hành
                    </span>
                  )}
                </div>
              </div>

              {/* Stats Phải */}
              <div className="w-full md:w-auto shrink-0 flex gap-6 border-t md:border-t-0 md:border-l border-slate-100 pt-3 md:pt-0 md:pl-6 dark:border-slate-800">
                <div>
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-0.5">
                    Orders
                  </p>
                  <DashboardNumber
                    value={row.totalOrders}
                    className="text-sm font-semibold text-slate-700 dark:text-slate-300"
                  />
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-0.5">
                    Revenue
                  </p>
                  <DashboardNumber
                    value={row.netRevenue}
                    format="currency"
                    className="text-sm font-semibold text-slate-700 dark:text-slate-300"
                  />
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-0.5">
                    Team
                  </p>
                  <DashboardNumber
                    value={row.internalUsers}
                    className="text-sm font-semibold text-slate-700 dark:text-slate-300"
                  />
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );

  // --- Main Render ---
  return (
    <DashboardSectionCard
      title="Branch Performance Workspace"
      subtitle="Giám sát, phân tích hiệu suất và phát hiện rủi ro vận hành theo từng chi nhánh."
      className={className}
    >
      {!rows.length ? (
        <DashboardEmptyState
          compact
          title="Không có dữ liệu chi nhánh"
          description="Hiện chưa có dữ liệu performance để hiển thị hoặc do bộ lọc trống."
        />
      ) : (
        <div className="flex flex-col rounded-2xl border border-slate-100 bg-white overflow-hidden dark:border-slate-800 dark:bg-slate-950/50 shadow-sm">
          {renderControls()}
          {renderSummaryStrip()}

          <div className="max-h-[650px] overflow-auto custom-scrollbar">
            {processedRows.length === 0 ? (
              <div className="p-8 text-center text-slate-500">
                Không tìm thấy chi nhánh nào khớp với bộ lọc hiện tại.
              </div>
            ) : viewMode === "table" ? (
              renderTableView()
            ) : (
              renderChartView()
            )}
          </div>
        </div>
      )}
    </DashboardSectionCard>
  );
}
