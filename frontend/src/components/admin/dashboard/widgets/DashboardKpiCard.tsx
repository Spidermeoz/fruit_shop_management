import React from "react";
import { ArrowRight } from "lucide-react";
import type { DashboardKpiItem } from "../types/dashboard";
import { getToneClasses } from "../utils/dashboardFormatters";
import DashboardNumber from "../shared/DashboardNumber";

type DashboardKpiCardProps = DashboardKpiItem & {
  icon?: React.ReactNode;
  onClick?: () => void;
  className?: string;
};

export default function DashboardKpiCard({
  label,
  value,
  subValue,
  hint,
  tone = "default",
  href,
  icon,
  onClick,
  className = "",
}: DashboardKpiCardProps) {
  const toneClasses = getToneClasses(tone);
  const clickable = Boolean(href || onClick);

  const content = (
    <div
      className={`group relative overflow-hidden rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm transition-all dark:border-slate-800 dark:bg-slate-950 ${
        clickable ? "cursor-pointer hover:-translate-y-0.5 hover:shadow-md" : ""
      } ${className}`.trim()}
    >
      <div
        className={`absolute inset-x-0 top-0 h-1 ${toneClasses.accent} opacity-80`}
      />

      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
            {label}
          </p>

          <div className="mt-3">
            {typeof value === "number" ? (
              <DashboardNumber
                value={value}
                className={`text-3xl font-bold tracking-tight ${toneClasses.value}`}
              />
            ) : (
              <span
                className={`text-3xl font-bold tracking-tight ${toneClasses.value}`}
              >
                {value}
              </span>
            )}
          </div>

          {subValue ? (
            <p className="mt-2 text-sm font-medium text-slate-600 dark:text-slate-300">
              {subValue}
            </p>
          ) : null}

          {hint ? (
            <p className="mt-2 text-xs leading-5 text-slate-500 dark:text-slate-400">
              {hint}
            </p>
          ) : null}
        </div>

        <div className="flex shrink-0 flex-col items-end gap-3">
          {icon ? (
            <div
              className={`flex h-11 w-11 items-center justify-center rounded-2xl ${toneClasses.iconBg}`}
            >
              {icon}
            </div>
          ) : null}

          {clickable ? (
            <div className="flex items-center gap-1 text-xs font-medium text-slate-400 transition-colors group-hover:text-slate-600 dark:text-slate-500 dark:group-hover:text-slate-300">
              Xem
              <ArrowRight className="h-3.5 w-3.5" />
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );

  if (href) {
    return (
      <a href={href} className="block">
        {content}
      </a>
    );
  }

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className="block w-full text-left"
      >
        {content}
      </button>
    );
  }

  return content;
}
