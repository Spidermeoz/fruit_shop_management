import { useMemo } from "react";
import DashboardSectionCard from "./DashboardSectionCard";
import DashboardHealthPill from "../shared/DashboardHealthPill";
import DashboardEmptyState from "../shared/DashboardEmptyState";

type ShippingHealthCardProps = {
  summary: {
    totalZones: number;
    activeZones: number;
    totalServiceAreas: number;
    activeServiceAreas: number;
    inactiveServiceAreas: number;
    totalBranchDeliverySlots: number;
    activeBranchDeliverySlots: number;
    inactiveBranchDeliverySlots: number;
    totalCapacityRecords: number;
    activeCapacityRecords: number;
    inactiveCapacityRecords: number;
  };
  className?: string;
};

// --- Helper Functions ---

const resolveShippingStatus = (
  inactiveServiceAreas: number,
  inactiveBranchDeliverySlots: number,
  inactiveCapacityRecords: number,
): "healthy" | "warning" | "critical" => {
  if (inactiveServiceAreas > 0 && inactiveBranchDeliverySlots > 0) {
    return "critical";
  }
  if (
    inactiveServiceAreas > 0 ||
    inactiveBranchDeliverySlots > 0 ||
    inactiveCapacityRecords > 0
  ) {
    return "warning";
  }
  return "healthy";
};

type Tone = "slate" | "emerald" | "amber" | "red";

const getStageTone = (active: number, total: number): Tone => {
  if (total === 0) return "slate";
  if (active === 0) return "red";
  if (active < total) return "amber";
  return "emerald";
};

const toneStyles: Record<
  Tone,
  { dot: string; barBg: string; barFill: string; text: string }
> = {
  slate: {
    dot: "bg-slate-300 dark:bg-slate-600",
    barBg: "bg-slate-100 dark:bg-slate-800",
    barFill: "bg-slate-300 dark:bg-slate-600",
    text: "text-slate-400 dark:text-slate-500",
  },
  emerald: {
    dot: "bg-emerald-500",
    barBg: "bg-emerald-100/50 dark:bg-emerald-950/50",
    barFill: "bg-emerald-500",
    text: "text-emerald-600 dark:text-emerald-400",
  },
  amber: {
    dot: "bg-amber-500",
    barBg: "bg-amber-100/50 dark:bg-amber-950/50",
    barFill: "bg-amber-500",
    text: "text-amber-600 dark:text-amber-400",
  },
  red: {
    dot: "bg-red-500",
    barBg: "bg-red-100/50 dark:bg-red-950/50",
    barFill: "bg-red-500",
    text: "text-red-600 dark:text-red-400",
  },
};

// --- Subcomponents ---

const ShippingStageBlock = ({
  label,
  active,
  total,
  inactive,
}: {
  label: string;
  active: number;
  total: number;
  inactive: number;
}) => {
  const tone = getStageTone(active, total);
  const styles = toneStyles[tone];
  const percent = total === 0 ? 0 : Math.round((active / total) * 100);

  let hint = "not set";
  if (total > 0) {
    hint = inactive === 0 ? "all active" : `${inactive} off`;
  }

  return (
    <div className="flex flex-col min-w-0 rounded-xl border border-slate-100 bg-slate-50/50 p-3 dark:border-slate-800/80 dark:bg-slate-900/30">
      <div className="flex items-center gap-1.5 mb-2">
        <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${styles.dot}`} />
        <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 truncate dark:text-slate-400">
          {label}
        </span>
      </div>

      <div className="flex items-baseline gap-1 truncate mb-2">
        <span className="text-xl font-bold leading-none text-slate-900 dark:text-white">
          {active}
        </span>
        <span className="text-xs font-medium text-slate-400">/ {total}</span>
      </div>

      <div
        className={`h-1 w-full rounded-full overflow-hidden ${styles.barBg} mb-1.5`}
      >
        <div
          className={`h-full rounded-full transition-all duration-500 ${styles.barFill}`}
          style={{ width: `${total === 0 ? 100 : percent}%` }}
        />
      </div>

      <span
        className={`text-[10px] font-medium leading-tight truncate ${styles.text}`}
      >
        {hint}
      </span>
    </div>
  );
};

// --- Main Component ---

export default function ShippingHealthCard({
  summary,
  className = "",
}: ShippingHealthCardProps) {
  const status = resolveShippingStatus(
    summary.inactiveServiceAreas,
    summary.inactiveBranchDeliverySlots,
    summary.inactiveCapacityRecords,
  );

  const hasShippingData =
    summary.totalZones > 0 ||
    summary.totalServiceAreas > 0 ||
    summary.totalBranchDeliverySlots > 0 ||
    summary.totalCapacityRecords > 0;

  // Derived Data
  const stats = useMemo(() => {
    // Ưu tiên tính total = active + inactive cho an toàn nếu data backend lệch
    const totalZones = Math.max(summary.totalZones, summary.activeZones);
    const inactiveZones = totalZones - summary.activeZones;

    const totalAreas =
      summary.activeServiceAreas + summary.inactiveServiceAreas;
    const totalSlots =
      summary.activeBranchDeliverySlots + summary.inactiveBranchDeliverySlots;
    const totalCapacity =
      summary.activeCapacityRecords + summary.inactiveCapacityRecords;

    const totalIssues =
      inactiveZones +
      summary.inactiveServiceAreas +
      summary.inactiveBranchDeliverySlots +
      summary.inactiveCapacityRecords;

    const calcReadiness = (active: number, total: number) =>
      total === 0 ? null : active / total;
    const readys = [
      calcReadiness(summary.activeZones, totalZones),
      calcReadiness(summary.activeServiceAreas, totalAreas),
      calcReadiness(summary.activeBranchDeliverySlots, totalSlots),
      calcReadiness(summary.activeCapacityRecords, totalCapacity),
    ].filter((r) => r !== null) as number[];

    const overallReadiness = readys.length
      ? readys.reduce((a, b) => a + b, 0) / readys.length
      : 0;

    return {
      totalZones,
      inactiveZones,
      totalAreas,
      totalSlots,
      totalCapacity,
      totalIssues,
      overallPercent: Math.round(overallReadiness * 100),
    };
  }, [summary]);

  return (
    <DashboardSectionCard
      title="Shipping Readiness"
      subtitle="Mức sẵn sàng của cấu hình giao hàng hiện tại."
      className={className}
      actions={<DashboardHealthPill status={status} />}
    >
      {!hasShippingData ? (
        <DashboardEmptyState
          compact
          title="No shipping data"
          description="Chưa có cấu hình giao hàng trong phạm vi này."
        />
      ) : (
        <div className="flex flex-col gap-5">
          {/* Hero Summary */}
          <div className="flex items-center gap-5 px-1">
            <div className="flex flex-col">
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                  {stats.overallPercent}
                </span>
                <span className="text-lg font-semibold text-slate-400">%</span>
              </div>
              <span className="text-[11px] font-medium uppercase tracking-wider text-slate-500">
                Ready
              </span>
            </div>

            <div className="h-10 w-px bg-slate-200 dark:bg-slate-800" />

            <div className="flex flex-col">
              <span
                className={`text-xl font-bold tracking-tight ${stats.totalIssues > 0 ? "text-amber-600 dark:text-amber-500" : "text-emerald-600 dark:text-emerald-500"}`}
              >
                {stats.totalIssues}
              </span>
              <span className="text-[11px] font-medium uppercase tracking-wider text-slate-500">
                Issues
              </span>
            </div>
          </div>

          {/* Pipeline Grid 4x1 (Desktop) / 2x2 (Mobile) */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <ShippingStageBlock
              label="Zones"
              active={summary.activeZones}
              total={stats.totalZones}
              inactive={stats.inactiveZones}
            />
            <ShippingStageBlock
              label="Areas"
              active={summary.activeServiceAreas}
              total={stats.totalAreas}
              inactive={summary.inactiveServiceAreas}
            />
            <ShippingStageBlock
              label="Slots"
              active={summary.activeBranchDeliverySlots}
              total={stats.totalSlots}
              inactive={summary.inactiveBranchDeliverySlots}
            />
            <ShippingStageBlock
              label="Capacity"
              active={summary.activeCapacityRecords}
              total={stats.totalCapacity}
              inactive={summary.inactiveCapacityRecords}
            />
          </div>
        </div>
      )}
    </DashboardSectionCard>
  );
}
