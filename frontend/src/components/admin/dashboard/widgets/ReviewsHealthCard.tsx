import { useMemo } from "react";
import DashboardSectionCard from "./DashboardSectionCard";
import DashboardHealthPill from "../shared/DashboardHealthPill";
import DashboardNumber from "../shared/DashboardNumber";

type ReviewsHealthCardProps = {
  summary: {
    pendingReviewProducts: number;
  };
  className?: string;
};

// --- Helper Functions ---

type Tone = "emerald" | "amber" | "red";

const getQueueMetrics = (pending: number) => {
  if (pending === 0) {
    return {
      status: "healthy" as const,
      tone: "emerald" as Tone,
      priority: "Stable",
      queueLabel: "All clear",
      percent: 0,
    };
  }
  if (pending <= 5) {
    return {
      status: "warning" as const,
      tone: "amber" as Tone,
      priority: "Watch",
      queueLabel: "Needs reply",
      percent: Math.min((pending / 15) * 100, 100),
    };
  }
  if (pending <= 10) {
    return {
      status: "warning" as const,
      tone: "amber" as Tone,
      priority: "High",
      queueLabel: "Busy queue",
      percent: Math.min((pending / 15) * 100, 100),
    };
  }

  return {
    status: "critical" as const,
    tone: "red" as Tone,
    priority: "Urgent",
    queueLabel: "Escalate",
    percent: Math.min((pending / 20) * 100, 100), // Max gauge at 20 for UI purpose
  };
};

// --- Subcomponents ---

const QueueBlock = ({
  label,
  value,
  tone,
  isString = false,
}: {
  label: string;
  value: string | number;
  tone: Tone;
  isString?: boolean;
}) => {
  const isNeutral = tone === "emerald";

  const bg = isNeutral
    ? "bg-slate-50 dark:bg-slate-800/50"
    : tone === "amber"
      ? "bg-amber-50 dark:bg-amber-950/30"
      : "bg-red-50 dark:bg-red-950/30";

  const border = isNeutral
    ? "border-slate-100 dark:border-slate-800"
    : tone === "amber"
      ? "border-amber-100 dark:border-amber-900/50"
      : "border-red-100 dark:border-red-900/50";

  const textColor = isNeutral
    ? "text-slate-500 dark:text-slate-400"
    : tone === "amber"
      ? "text-amber-600 dark:text-amber-400"
      : "text-red-600 dark:text-red-400";

  const valueColor = isNeutral
    ? "text-slate-700 dark:text-slate-300"
    : tone === "amber"
      ? "text-amber-700 dark:text-amber-300"
      : "text-red-700 dark:text-red-300";

  return (
    <div
      className={`flex min-w-0 flex-col rounded-xl border p-3 transition-colors ${bg} ${border}`}
    >
      <span
        className={`truncate text-[11px] font-bold uppercase tracking-wider ${textColor}`}
      >
        {label}
      </span>
      {isString ? (
        <span
          className={`mt-1 truncate text-base font-bold leading-none sm:text-lg ${valueColor}`}
        >
          {value}
        </span>
      ) : (
        <DashboardNumber
          value={value as number}
          className={`mt-1 text-base font-bold leading-none sm:text-lg ${valueColor}`}
        />
      )}
    </div>
  );
};

// --- Main Component ---

export default function ReviewsHealthCard({
  summary,
  className = "",
}: ReviewsHealthCardProps) {
  const { pendingReviewProducts } = summary;
  const metrics = useMemo(
    () => getQueueMetrics(pendingReviewProducts),
    [pendingReviewProducts],
  );

  return (
    <DashboardSectionCard
      title="Reviews Health"
      subtitle="Tín hiệu phản hồi khách hàng."
      className={className}
      actions={<DashboardHealthPill status={metrics.status} />}
    >
      <div className="flex flex-col gap-5">
        {/* 1. Hero Summary */}
        <div className="flex items-center gap-4">
          <DashboardNumber
            value={pendingReviewProducts}
            className={`text-4xl font-bold leading-none tracking-tight ${
              metrics.tone === "emerald"
                ? "text-emerald-600 dark:text-emerald-500"
                : metrics.tone === "amber"
                  ? "text-amber-600 dark:text-amber-500"
                  : "text-red-600 dark:text-red-500"
            }`}
          />
          <div className="flex flex-col justify-center">
            <span className="text-[13px] font-bold uppercase tracking-wide text-slate-900 dark:text-white">
              Pending
            </span>
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
              {metrics.queueLabel}
            </span>
          </div>
        </div>

        {/* 2. Queue Gauge Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            <span>Queue Load</span>
            <span>{Math.round(metrics.percent)}%</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
            <div
              className={`h-full transition-all duration-700 ease-out ${
                metrics.tone === "emerald"
                  ? "bg-emerald-400 dark:bg-emerald-500"
                  : metrics.tone === "amber"
                    ? "bg-amber-400 dark:bg-amber-500"
                    : "bg-red-500 dark:bg-red-500"
              }`}
              style={{ width: `${Math.max(2, metrics.percent)}%` }} // Minimum width for visibility
            />
          </div>
        </div>

        {/* 3. Signal Blocks Grid */}
        <div className="grid grid-cols-2 gap-3 pt-1">
          <QueueBlock
            label="Pending"
            value={pendingReviewProducts}
            tone={metrics.tone}
          />
          <QueueBlock
            label="Priority"
            value={metrics.priority}
            tone={metrics.tone}
            isString
          />
        </div>
      </div>
    </DashboardSectionCard>
  );
}
