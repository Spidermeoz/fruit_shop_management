import { useMemo } from "react";
import { ChevronRight } from "lucide-react";
import DashboardSectionCard from "./DashboardSectionCard";
import DashboardBadge from "../shared/DashboardBadge";
import DashboardEmptyState from "../shared/DashboardEmptyState";
import DashboardNumber from "../shared/DashboardNumber";

export type WorkQueueItem = {
  key: string;
  label: string;
  value: number;
  href?: string;
  tone?: "default" | "blue" | "emerald" | "amber" | "red" | "violet";
  hint?: string;
};

type WorkQueueCardProps = {
  items: WorkQueueItem[];
  title?: string;
  subtitle?: string;
  className?: string;
};

// --- Configs & Mappings ---

const toneToBadgeVariant: Record<
  NonNullable<WorkQueueItem["tone"]>,
  "default" | "blue" | "emerald" | "amber" | "red" | "violet"
> = {
  default: "default",
  blue: "blue",
  emerald: "emerald",
  amber: "amber",
  red: "red",
  violet: "violet",
};

const toneToValueClass: Record<NonNullable<WorkQueueItem["tone"]>, string> = {
  default: "text-slate-900 dark:text-slate-100",
  blue: "text-blue-700 dark:text-blue-300",
  emerald: "text-emerald-700 dark:text-emerald-300",
  amber: "text-amber-700 dark:text-amber-400",
  red: "text-red-700 dark:text-red-400",
  violet: "text-violet-700 dark:text-violet-300",
};

const toneToRailClass: Record<NonNullable<WorkQueueItem["tone"]>, string> = {
  default: "border-l-slate-200 dark:border-l-slate-700",
  blue: "border-l-blue-400 dark:border-l-blue-500",
  emerald: "border-l-emerald-400 dark:border-l-emerald-500",
  amber: "border-l-amber-400 dark:border-l-amber-500",
  red: "border-l-red-500 dark:border-l-red-500",
  violet: "border-l-violet-400 dark:border-l-violet-500",
};

type PriorityGroup = "Urgent" | "Watch" | "Normal";

const getPriorityGroup = (tone?: WorkQueueItem["tone"]): PriorityGroup => {
  if (tone === "red") return "Urgent";
  if (tone === "amber") return "Watch";
  return "Normal";
};

// --- Subcomponents ---

const WorkQueueRow = ({ item }: { item: WorkQueueItem }) => {
  const tone = item.tone ?? "default";

  const content = (
    <div
      className={`group flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-white p-3 transition-all hover:border-slate-200 hover:shadow-sm dark:border-slate-800 dark:bg-slate-950 dark:hover:border-slate-700 border-l-[3px] ${toneToRailClass[tone]}`}
    >
      {/* Left: Label & Hint */}
      <div className="flex min-w-0 flex-col">
        <div className="flex items-center gap-2">
          <DashboardBadge
            variant={toneToBadgeVariant[tone]}
            className="truncate text-[10px] px-1.5 py-0"
          >
            {item.label}
          </DashboardBadge>
        </div>
        {item.hint && (
          <p className="mt-1 truncate text-xs font-medium text-slate-500 dark:text-slate-400">
            {item.hint}
          </p>
        )}
      </div>

      {/* Right: Value & CTA */}
      <div className="flex shrink-0 items-center gap-2">
        <DashboardNumber
          value={item.value}
          className={`text-lg font-bold leading-none ${toneToValueClass[tone]}`}
        />
        {item.href && (
          <div className="ml-1 text-slate-400 transition-transform group-hover:translate-x-1 group-hover:text-blue-500 dark:text-slate-600 dark:group-hover:text-blue-400">
            <ChevronRight className="h-4 w-4" />
          </div>
        )}
      </div>
    </div>
  );

  if (item.href) {
    return (
      <a href={item.href} className="block outline-none">
        {content}
      </a>
    );
  }

  return <div>{content}</div>;
};

const WorkQueueSection = ({
  title,
  items,
}: {
  title: string;
  items: WorkQueueItem[];
}) => {
  if (items.length === 0) return null;

  return (
    <div className="space-y-2">
      <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
        {title}
      </h4>
      <div className="flex flex-col gap-2">
        {items.map((item) => (
          <WorkQueueRow key={item.key} item={item} />
        ))}
      </div>
    </div>
  );
};

// --- Main Component ---

export default function WorkQueueCard({
  items,
  title = "Work Queue",
  subtitle = "Bảng hành động và các đầu việc ưu tiên.",
  className = "",
}: WorkQueueCardProps) {
  // 1. Filter meaningful items
  const meaningfulItems = useMemo(
    () => items.filter((item) => item.value > 0),
    [items],
  );

  // 2. Derive Metrics & Groups
  const { summary, groups } = useMemo(() => {
    let totalValue = 0;
    let urgentCount = 0;
    let watchCount = 0;

    const grouped: Record<PriorityGroup, WorkQueueItem[]> = {
      Urgent: [],
      Watch: [],
      Normal: [],
    };

    meaningfulItems.forEach((item) => {
      totalValue += item.value;
      const group = getPriorityGroup(item.tone);
      grouped[group].push(item);

      if (group === "Urgent") urgentCount++;
      if (group === "Watch") watchCount++;
    });

    return {
      summary: {
        totalQueues: meaningfulItems.length,
        totalValue,
        urgentCount,
        watchCount,
      },
      groups: grouped,
    };
  }, [meaningfulItems]);

  return (
    <DashboardSectionCard
      title={title}
      subtitle={subtitle}
      className={className}
    >
      {!meaningfulItems.length ? (
        <DashboardEmptyState
          compact
          title="Queue clear"
          description="Chưa có đầu việc nổi bật cần xử lý."
        />
      ) : (
        <div className="flex flex-col gap-4">
          {/* Summary Strip */}
          <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 pb-3 dark:border-slate-800">
            <span className="rounded bg-slate-100 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:bg-slate-800 dark:text-slate-300">
              {summary.totalQueues} Queues
            </span>
            <span className="rounded bg-slate-100 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:bg-slate-800 dark:text-slate-300">
              {summary.totalValue} Total
            </span>
            {summary.urgentCount > 0 && (
              <span className="rounded bg-red-50 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider text-red-600 dark:bg-red-900/30 dark:text-red-400">
                {summary.urgentCount} Urgent
              </span>
            )}
            {summary.watchCount > 0 && (
              <span className="rounded bg-amber-50 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider text-amber-600 dark:bg-amber-900/30 dark:text-amber-400">
                {summary.watchCount} Watch
              </span>
            )}
          </div>

          {/* Grouped Sections */}
          <div className="flex flex-col gap-4">
            <WorkQueueSection title="Urgent" items={groups.Urgent} />
            <WorkQueueSection title="Watch" items={groups.Watch} />
            <WorkQueueSection title="Normal" items={groups.Normal} />
          </div>
        </div>
      )}
    </DashboardSectionCard>
  );
}
