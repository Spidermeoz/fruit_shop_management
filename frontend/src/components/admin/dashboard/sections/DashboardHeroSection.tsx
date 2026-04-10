import React from "react";
import { RefreshCcw } from "lucide-react";
import type {
  DashboardRange,
  DashboardScopeMode,
  DashboardTier,
} from "../types/dashboard";
import DashboardScopeHeader from "../shared/DashboardScopeHeader";
import { DASHBOARD_RANGE_OPTIONS } from "../types/dashboard";

type BranchOption = {
  id: number;
  name: string;
  code?: string | null;
};

type DashboardHeroSectionProps = {
  title: string;
  subtitle: string;
  tier: DashboardTier;
  scopeMode: DashboardScopeMode;
  branchName?: string | null;

  range: DashboardRange;
  onRangeChange: (range: DashboardRange) => void;

  selectedBranchId: number | null;
  onBranchChange: (branchId: number | null) => void;
  branches: BranchOption[];
  canAccessBranchSwitcher: boolean;
  canSeeAllBranches: boolean;
  isBranchLocked?: boolean;

  refreshing?: boolean;
  onRefresh?: () => void | Promise<void>;

  actions?: React.ReactNode;
  className?: string;
};

export default function DashboardHeroSection({
  title,
  subtitle,
  tier,
  scopeMode,
  branchName,
  range,
  onRangeChange,
  selectedBranchId,
  onBranchChange,
  branches,
  canAccessBranchSwitcher,
  canSeeAllBranches,
  isBranchLocked = false,
  refreshing = false,
  onRefresh,
  actions,
  className = "",
}: DashboardHeroSectionProps) {
  const controlBar = (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-1 dark:border-slate-800 dark:bg-slate-900">
        {DASHBOARD_RANGE_OPTIONS.map((option) => {
          const active = option.value === range;
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onRangeChange(option.value)}
              className={`rounded-xl px-3 py-2 text-xs font-semibold transition-colors ${
                active
                  ? "bg-white text-slate-900 shadow-sm dark:bg-slate-950 dark:text-slate-100"
                  : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
              }`}
            >
              {option.label}
            </button>
          );
        })}
      </div>

      {canAccessBranchSwitcher ? (
        <select
          value={selectedBranchId ?? ""}
          disabled={isBranchLocked}
          onChange={(e) => {
            const value = e.target.value;
            onBranchChange(value ? Number(value) : null);
          }}
          className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm outline-none ring-0 transition focus:border-slate-300 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200"
        >
          {canSeeAllBranches ? (
            <option value="">Tất cả chi nhánh</option>
          ) : null}
          {branches.map((branch) => (
            <option key={branch.id} value={branch.id}>
              {branch.name}
              {branch.code ? ` (${branch.code})` : ""}
            </option>
          ))}
        </select>
      ) : null}

      {onRefresh ? (
        <button
          type="button"
          onClick={() => void onRefresh()}
          className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-900"
        >
          <RefreshCcw
            className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
          />
          Làm mới
        </button>
      ) : null}

      {actions}
    </div>
  );

  return (
    <DashboardScopeHeader
      title={title}
      subtitle={subtitle}
      tier={tier}
      scopeMode={scopeMode}
      branchName={branchName}
      actions={controlBar}
      className={className}
    />
  );
}
