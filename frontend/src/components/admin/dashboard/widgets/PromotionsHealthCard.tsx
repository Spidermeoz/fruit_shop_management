import DashboardSectionCard from "./DashboardSectionCard";
import DashboardHealthPill from "../shared/DashboardHealthPill";
import DashboardNumber from "../shared/DashboardNumber";
import DashboardEmptyState from "../shared/DashboardEmptyState";

type PromotionsHealthCardProps = {
  summary: {
    totalPromotions: number;
    activePromotions: number;
    autoApplyPromotions: number;
    endingSoonCount: number;
    recentUsageCount: number;
  };
  className?: string;
};

// --- Helper Functions ---

const resolvePromotionStatus = (
  totalPromotions: number,
  activePromotions: number,
  endingSoonCount: number,
): "healthy" | "warning" | "critical" => {
  if (totalPromotions <= 0) return "warning";
  if (endingSoonCount > 0) return "warning";
  // Attention state logic có thể gom vào warning hoặc để healthy tùy mức độ
  if (activePromotions === 0 && totalPromotions > 0) return "warning";
  return "healthy";
};

// --- Subcomponents ---

const SignalBlock = ({
  label,
  value,
  activeTone,
}: {
  label: string;
  value: number;
  activeTone: "amber" | "blue" | "violet";
}) => {
  const hasSignal = value > 0;

  const bg = hasSignal
    ? activeTone === "amber"
      ? "bg-amber-50 dark:bg-amber-950/30"
      : activeTone === "blue"
        ? "bg-blue-50 dark:bg-blue-950/30"
        : "bg-violet-50 dark:bg-violet-950/30"
    : "bg-slate-50 dark:bg-slate-800/50";

  const border = hasSignal
    ? activeTone === "amber"
      ? "border-amber-100 dark:border-amber-900/50"
      : activeTone === "blue"
        ? "border-blue-100 dark:border-blue-900/50"
        : "border-violet-100 dark:border-violet-900/50"
    : "border-slate-100 dark:border-slate-800";

  const textColor = hasSignal
    ? activeTone === "amber"
      ? "text-amber-600 dark:text-amber-400"
      : activeTone === "blue"
        ? "text-blue-600 dark:text-blue-400"
        : "text-violet-600 dark:text-violet-400"
    : "text-slate-500 dark:text-slate-400";

  const valueColor = hasSignal
    ? activeTone === "amber"
      ? "text-amber-700 dark:text-amber-300"
      : activeTone === "blue"
        ? "text-blue-700 dark:text-blue-300"
        : "text-violet-700 dark:text-violet-300"
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

export default function PromotionsHealthCard({
  summary,
  className = "",
}: PromotionsHealthCardProps) {
  const status = resolvePromotionStatus(
    summary.totalPromotions,
    summary.activePromotions,
    summary.endingSoonCount,
  );

  const hasPromotionData =
    summary.totalPromotions > 0 ||
    summary.activePromotions > 0 ||
    summary.recentUsageCount > 0;

  return (
    <DashboardSectionCard
      title="Promotions Health"
      subtitle="Tổng quan chiến dịch và tín hiệu hoạt động."
      className={className}
      actions={<DashboardHealthPill status={status} />}
    >
      {!hasPromotionData ? (
        <DashboardEmptyState
          compact
          title="Chưa có chiến dịch"
          description="Không có dữ liệu khuyến mãi trong phạm vi này."
        />
      ) : (
        <div className="flex flex-col gap-5">
          {/* 1. Meta Line */}
          <div className="truncate text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            {summary.totalPromotions} Total Campaigns
          </div>

          {/* 2. Hero Summary */}
          <div className="flex items-end gap-4">
            <div className="flex flex-col">
              <DashboardNumber
                value={summary.activePromotions}
                className="text-3xl font-bold leading-none tracking-tight text-slate-900 dark:text-white"
              />
              <span className="mt-1.5 text-[11px] font-bold uppercase tracking-wide text-emerald-600 dark:text-emerald-500">
                Active
              </span>
            </div>

            {/* Optional: Indicator bar if you want visual weight for active vs total (without stacked segments) */}
            <div className="mb-2 flex-1 max-w-[120px]">
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                <div
                  className="h-full bg-emerald-500 transition-all duration-500"
                  style={{
                    width: `${
                      summary.totalPromotions === 0
                        ? 0
                        : (summary.activePromotions / summary.totalPromotions) *
                          100
                    }%`,
                  }}
                />
              </div>
            </div>
          </div>

          {/* 3. Signal Blocks Grid */}
          <div className="grid grid-cols-3 gap-3 pt-1">
            <SignalBlock
              label="Auto"
              value={summary.autoApplyPromotions}
              activeTone="violet"
            />
            <SignalBlock
              label="Sắp hết"
              value={summary.endingSoonCount}
              activeTone="amber"
            />
            <SignalBlock
              label="Lượt dùng"
              value={summary.recentUsageCount}
              activeTone="blue"
            />
          </div>
        </div>
      )}
    </DashboardSectionCard>
  );
}
