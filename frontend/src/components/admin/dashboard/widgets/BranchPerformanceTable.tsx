import {
  ArrowRight,
  CircleAlert,
  CircleCheck,
  CircleEllipsis,
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
};

const getStatusBadgeVariant = (
  status: string,
): "default" | "emerald" | "amber" | "red" | "violet" => {
  if (status === "active") return "emerald";
  if (status === "inactive") return "amber";
  return "default";
};

const getHealthIcon = (
  status: DashboardBranchPerformanceItem["healthStatus"],
) => {
  if (status === "healthy") return <CircleCheck className="h-4 w-4" />;
  if (status === "critical") return <CircleAlert className="h-4 w-4" />;
  return <CircleEllipsis className="h-4 w-4" />;
};

export default function BranchPerformanceTable({
  rows,
  className = "",
}: BranchPerformanceTableProps) {
  return (
    <DashboardSectionCard
      title="Branch Performance Board"
      subtitle="So sánh nhanh hiệu suất và tình trạng vận hành giữa các chi nhánh."
      className={className}
    >
      {!rows.length ? (
        <DashboardEmptyState
          compact
          title="Chưa có dữ liệu chi nhánh"
          description="Hiện chưa có dữ liệu performance để hiển thị trong phạm vi này."
        />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-100 dark:border-slate-800">
          <div className="max-h-[560px] overflow-auto">
            <table className="min-w-full border-separate border-spacing-0">
              <thead className="sticky top-0 z-10 bg-slate-50 dark:bg-slate-900">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    Chi nhánh
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    Orders
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    Revenue
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    Inventory
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    Shipping
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    Team
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    Health
                  </th>
                </tr>
              </thead>

              <tbody className="bg-white dark:bg-slate-950">
                {rows.map((row) => (
                  <tr
                    key={row.branchId}
                    className="border-t border-slate-100 align-top transition-colors hover:bg-slate-50/80 dark:border-slate-800 dark:hover:bg-slate-900/40"
                  >
                    <td className="px-4 py-4">
                      <div className="min-w-[220px]">
                        <div className="flex flex-wrap items-center gap-2">
                          <a
                            href={`/admin/branches/edit/${row.branchId}`}
                            className="text-sm font-semibold text-slate-900 hover:text-slate-700 dark:text-slate-100 dark:hover:text-slate-300"
                          >
                            {row.branchName}
                          </a>
                          {row.branchCode ? (
                            <DashboardBadge variant="slate">
                              {row.branchCode}
                            </DashboardBadge>
                          ) : null}
                          <DashboardBadge
                            variant={getStatusBadgeVariant(row.branchStatus)}
                          >
                            {row.branchStatus}
                          </DashboardBadge>
                        </div>

                        <div className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-slate-500 dark:text-slate-400">
                          Xem chi tiết
                          <ArrowRight className="h-3.5 w-3.5" />
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-4">
                      <div className="space-y-1 text-sm">
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-slate-500 dark:text-slate-400">
                            Tổng đơn
                          </span>
                          <DashboardNumber
                            value={row.totalOrders}
                            className="font-semibold"
                          />
                        </div>
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-slate-500 dark:text-slate-400">
                            Pending
                          </span>
                          <DashboardNumber
                            value={row.pendingOrders}
                            className="font-semibold text-amber-700 dark:text-amber-300"
                          />
                        </div>
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-slate-500 dark:text-slate-400">
                            Unpaid
                          </span>
                          <DashboardNumber
                            value={row.unpaidActiveOrders}
                            className="font-semibold text-red-700 dark:text-red-300"
                          />
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-4">
                      <DashboardNumber
                        value={row.netRevenue}
                        format="currency"
                        className="text-sm font-semibold text-emerald-700 dark:text-emerald-300"
                      />
                    </td>

                    <td className="px-4 py-4">
                      <div className="space-y-1 text-sm">
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-slate-500 dark:text-slate-400">
                            Low
                          </span>
                          <DashboardNumber
                            value={row.lowStockCount}
                            className="font-semibold text-amber-700 dark:text-amber-300"
                          />
                        </div>
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-slate-500 dark:text-slate-400">
                            Out
                          </span>
                          <DashboardNumber
                            value={row.outOfStockCount}
                            className="font-semibold text-red-700 dark:text-red-300"
                          />
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-4">
                      <div className="space-y-1 text-sm">
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-slate-500 dark:text-slate-400">
                            Areas
                          </span>
                          <span className="font-semibold text-slate-900 dark:text-slate-100">
                            {row.activeServiceAreas}/
                            {row.activeServiceAreas + row.inactiveServiceAreas}
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-slate-500 dark:text-slate-400">
                            Slots
                          </span>
                          <span className="font-semibold text-slate-900 dark:text-slate-100">
                            {row.activeBranchDeliverySlots}/
                            {row.activeBranchDeliverySlots +
                              row.inactiveBranchDeliverySlots}
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-slate-500 dark:text-slate-400">
                            Capacity
                          </span>
                          <span className="font-semibold text-slate-900 dark:text-slate-100">
                            {row.activeCapacityRecords}/
                            {row.activeCapacityRecords +
                              row.inactiveCapacityRecords}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-4">
                      <DashboardNumber
                        value={row.internalUsers}
                        className="text-sm font-semibold"
                      />
                    </td>

                    <td className="px-4 py-4">
                      <div className="min-w-[220px] space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="text-slate-500 dark:text-slate-400">
                            {getHealthIcon(row.healthStatus)}
                          </span>
                          <DashboardHealthPill status={row.healthStatus} />
                        </div>

                        {row.healthSignals.length ? (
                          <ul className="space-y-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
                            {row.healthSignals.slice(0, 3).map((signal) => (
                              <li key={signal}>• {signal}</li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            Không có tín hiệu bất thường nổi bật.
                          </p>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </DashboardSectionCard>
  );
}
