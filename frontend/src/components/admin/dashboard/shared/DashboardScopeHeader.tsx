import React from "react";
import DashboardBadge from "./DashboardBadge";
import type { DashboardScopeMode, DashboardTier } from "../types/dashboard";

type DashboardScopeHeaderProps = {
  title: string;
  subtitle?: string;
  tier: DashboardTier;
  scopeMode: DashboardScopeMode;
  branchName?: string | null;
  className?: string;
  actions?: React.ReactNode;
};

const tierLabelMap: Record<DashboardTier, string> = {
  super_admin: "Super Admin",
  branch_admin: "Branch Admin",
  branch_staff: "Branch Staff",
};

const scopeLabelMap: Record<DashboardScopeMode, string> = {
  system: "Toàn hệ thống",
  branch: "Theo chi nhánh",
  functional: "Theo nghiệp vụ",
};

const scopeVariantMap: Record<
  DashboardScopeMode,
  "blue" | "emerald" | "violet"
> = {
  system: "blue",
  branch: "emerald",
  functional: "violet",
};

export default function DashboardScopeHeader({
  title,
  subtitle,
  tier,
  scopeMode,
  branchName,
  className = "",
  actions,
}: DashboardScopeHeaderProps) {
  return (
    <div
      className={`flex flex-col gap-4 rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950 ${className}`.trim()}
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <DashboardBadge variant="slate">
              {tierLabelMap[tier]}
            </DashboardBadge>
            <DashboardBadge variant={scopeVariantMap[scopeMode]}>
              {scopeLabelMap[scopeMode]}
            </DashboardBadge>
            {branchName ? (
              <DashboardBadge variant="default">{branchName}</DashboardBadge>
            ) : null}
          </div>

          <h1 className="mt-3 text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            {title}
          </h1>

          {subtitle ? (
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500 dark:text-slate-400">
              {subtitle}
            </p>
          ) : null}
        </div>

        {actions ? (
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            {actions}
          </div>
        ) : null}
      </div>
    </div>
  );
}
