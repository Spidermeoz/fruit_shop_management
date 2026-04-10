type DashboardSkeletonProps = {
  lines?: number;
  className?: string;
};

export default function DashboardSkeleton({
  lines = 3,
  className = "",
}: DashboardSkeletonProps) {
  return (
    <div
      className={`animate-pulse rounded-3xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-950 ${className}`.trim()}
    >
      <div className="h-5 w-40 rounded-full bg-slate-200 dark:bg-slate-800" />
      <div className="mt-3 h-9 w-28 rounded-2xl bg-slate-200 dark:bg-slate-800" />

      <div className="mt-5 space-y-3">
        {Array.from({ length: lines }).map((_, index) => (
          <div
            // eslint-disable-next-line react/no-array-index-key
            key={index}
            className="h-4 w-full rounded-full bg-slate-100 dark:bg-slate-900"
          />
        ))}
      </div>
    </div>
  );
}
