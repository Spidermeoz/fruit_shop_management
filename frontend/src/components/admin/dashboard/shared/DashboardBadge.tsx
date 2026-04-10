import React from "react";

type DashboardBadgeVariant =
  | "default"
  | "blue"
  | "emerald"
  | "amber"
  | "red"
  | "violet"
  | "slate";

type DashboardBadgeProps = {
  children: React.ReactNode;
  variant?: DashboardBadgeVariant;
  className?: string;
};

const getVariantClasses = (variant: DashboardBadgeVariant): string => {
  switch (variant) {
    case "blue":
      return "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-800 dark:bg-sky-950/40 dark:text-sky-300";
    case "emerald":
      return "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300";
    case "amber":
      return "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300";
    case "red":
      return "border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950/40 dark:text-red-300";
    case "violet":
      return "border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-800 dark:bg-violet-950/40 dark:text-violet-300";
    case "slate":
      return "border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-300";
    default:
      return "border-slate-200 bg-white text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300";
  }
};

export default function DashboardBadge({
  children,
  variant = "default",
  className = "",
}: DashboardBadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${getVariantClasses(
        variant,
      )} ${className}`.trim()}
    >
      {children}
    </span>
  );
}
