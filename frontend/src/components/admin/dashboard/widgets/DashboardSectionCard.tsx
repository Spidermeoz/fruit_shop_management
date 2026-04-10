import React from "react";

type DashboardSectionCardProps = {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
  contentClassName?: string;
};

export default function DashboardSectionCard({
  title,
  subtitle,
  children,
  actions,
  footer,
  className = "",
  contentClassName = "",
}: DashboardSectionCardProps) {
  return (
    <section
      className={`rounded-[28px] border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950 ${className}`.trim()}
    >
      <div className="flex flex-col gap-4 border-b border-slate-100 px-5 py-5 dark:border-slate-800 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
            {title}
          </h2>
          {subtitle ? (
            <p className="mt-1 text-sm leading-6 text-slate-500 dark:text-slate-400">
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

      <div className={`p-5 ${contentClassName}`.trim()}>{children}</div>

      {footer ? (
        <div className="border-t border-slate-100 px-5 py-4 dark:border-slate-800">
          {footer}
        </div>
      ) : null}
    </section>
  );
}
