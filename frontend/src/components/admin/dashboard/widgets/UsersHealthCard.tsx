import { useMemo } from "react";
import DashboardSectionCard from "./DashboardSectionCard";
import DashboardHealthPill from "../shared/DashboardHealthPill";
import DashboardNumber from "../shared/DashboardNumber";
import DashboardEmptyState from "../shared/DashboardEmptyState";

type UsersHealthCardProps = {
  summary: {
    totalUsers: number;
    totalCustomers: number;
    totalInternal: number;
    inactiveUsers: number;
    recentUsers: number;
    internalNoBranches: number;
    internalMissingPrimary: number;
  };
  className?: string;
};

// --- Helper Functions ---

const resolveUsersStatus = (
  internalNoBranches: number,
  internalMissingPrimary: number,
): "healthy" | "warning" | "critical" => {
  if (internalNoBranches > 0) return "critical";
  if (internalMissingPrimary > 0) return "warning";
  return "healthy";
};

// --- Subcomponents ---

const RiskBlock = ({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "red" | "amber" | "slate";
}) => {
  const hasIssue = value > 0;

  const bg = hasIssue
    ? tone === "red"
      ? "bg-red-50 dark:bg-red-950/30"
      : tone === "amber"
        ? "bg-amber-50 dark:bg-amber-950/30"
        : "bg-slate-100 dark:bg-slate-800"
    : "bg-slate-50 dark:bg-slate-800/50";

  const border = hasIssue
    ? tone === "red"
      ? "border-red-100 dark:border-red-900/50"
      : tone === "amber"
        ? "border-amber-100 dark:border-amber-900/50"
        : "border-slate-200 dark:border-slate-700"
    : "border-slate-100 dark:border-slate-800";

  const textColor = hasIssue
    ? tone === "red"
      ? "text-red-600 dark:text-red-400"
      : tone === "amber"
        ? "text-amber-600 dark:text-amber-400"
        : "text-slate-700 dark:text-slate-300"
    : "text-slate-500 dark:text-slate-400";

  const valueColor = hasIssue
    ? tone === "red"
      ? "text-red-700 dark:text-red-300"
      : tone === "amber"
        ? "text-amber-700 dark:text-amber-300"
        : "text-slate-900 dark:text-white"
    : "text-slate-700 dark:text-slate-300";

  return (
    <div
      className={`flex min-w-0 flex-col rounded-xl border p-3 transition-colors ${bg} ${border}`}
    >
      <span
        className={`truncate text-[11px] font-bold uppercase tracking-wider ${textColor}`}
      >
        {label}
      </span>
      <DashboardNumber
        value={value}
        className={`mt-1 text-xl font-bold leading-none ${valueColor}`}
      />
    </div>
  );
};

// --- Main Component ---

export default function UsersHealthCard({
  summary,
  className = "",
}: UsersHealthCardProps) {
  const status = resolveUsersStatus(
    summary.internalNoBranches,
    summary.internalMissingPrimary,
  );

  const hasUserData =
    summary.totalUsers > 0 ||
    summary.totalCustomers > 0 ||
    summary.totalInternal > 0;

  // Tính toán % cho User Mix Bar
  const { custPct, intPct } = useMemo(() => {
    const total = summary.totalUsers;
    if (total === 0) return { custPct: 0, intPct: 0 };

    return {
      custPct: Math.round((summary.totalCustomers / total) * 100),
      intPct: Math.round((summary.totalInternal / total) * 100),
    };
  }, [summary.totalUsers, summary.totalCustomers, summary.totalInternal]);

  return (
    <DashboardSectionCard
      title="Users Health"
      subtitle="Cơ cấu user và rủi ro phân bổ nội bộ."
      className={className}
      actions={<DashboardHealthPill status={status} />}
    >
      {!hasUserData ? (
        <DashboardEmptyState
          compact
          title="No user data"
          description="Chưa có dữ liệu người dùng trong phạm vi này."
        />
      ) : (
        <div className="flex flex-col gap-5">
          {/* 1. Hero Summary */}
          <div className="flex items-end gap-4">
            <div className="flex flex-col">
              <DashboardNumber
                value={summary.totalUsers}
                className="text-3xl font-bold leading-none tracking-tight text-slate-900 dark:text-white"
              />
              <span className="mt-1.5 text-[11px] font-bold uppercase tracking-wide text-slate-500">
                Total Users
              </span>
            </div>

            <div className="mb-1 h-8 w-px bg-slate-200 dark:bg-slate-800" />

            <div className="flex flex-col pb-0.5">
              <span className="text-xl font-bold leading-none tracking-tight text-violet-600 dark:text-violet-400">
                +{summary.recentUsers}
              </span>
              <span className="mt-1 text-[11px] font-bold uppercase tracking-wide text-violet-500 dark:text-violet-400">
                Recent
              </span>
            </div>
          </div>

          {/* 2. User Mix Stacked Bar */}
          <div className="space-y-2">
            <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
              <div
                style={{ width: `${custPct}%` }}
                className="h-full bg-blue-500 transition-all duration-500"
              />
              <div
                style={{ width: `${intPct}%` }}
                className="h-full bg-emerald-500 transition-all duration-500"
              />
            </div>

            <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider">
              <span className="text-blue-600 dark:text-blue-500">
                {custPct}% Customers
              </span>
              <span className="text-emerald-600 dark:text-emerald-500">
                {intPct}% Internal
              </span>
            </div>
          </div>

          {/* 3. Risk / Internal Assignment Blocks */}
          <div className="grid grid-cols-3 gap-3 pt-1">
            <RiskBlock
              label="No Branch"
              value={summary.internalNoBranches}
              tone="red"
            />
            <RiskBlock
              label="No Primary"
              value={summary.internalMissingPrimary}
              tone="amber"
            />
            <RiskBlock
              label="Inactive"
              value={summary.inactiveUsers}
              tone="slate"
            />
          </div>
        </div>
      )}
    </DashboardSectionCard>
  );
}
