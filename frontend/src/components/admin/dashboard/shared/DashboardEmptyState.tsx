import React from "react";
import { LayoutGrid } from "lucide-react";

type DashboardEmptyStateProps = {
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  compact?: boolean;
  className?: string;
};

export default function DashboardEmptyState({
  title = "Chưa có dữ liệu phù hợp",
  description = "Hãy thử đổi bộ lọc, phạm vi chi nhánh hoặc khoảng thời gian để xem thêm thông tin.",
  icon,
  action,
  compact = false,
  className = "",
}: DashboardEmptyStateProps) {
  return (
    <div
      className={`flex w-full flex-col items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-white px-6 text-center dark:border-slate-800 dark:bg-slate-950 ${
        compact ? "py-8" : "py-12"
      } ${className}`.trim()}
    >
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-500 dark:bg-slate-900 dark:text-slate-400">
        {icon ?? <LayoutGrid className="h-7 w-7" />}
      </div>

      <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
        {title}
      </h3>

      <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500 dark:text-slate-400">
        {description}
      </p>

      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
