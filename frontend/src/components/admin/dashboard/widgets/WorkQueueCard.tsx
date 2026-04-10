import { ArrowRight } from "lucide-react";
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
  blue: "text-sky-700 dark:text-sky-300",
  emerald: "text-emerald-700 dark:text-emerald-300",
  amber: "text-amber-700 dark:text-amber-300",
  red: "text-red-700 dark:text-red-300",
  violet: "text-violet-700 dark:text-violet-300",
};

export default function WorkQueueCard({
  items,
  title = "Work Queue",
  subtitle = "Các đầu việc cần ưu tiên xử lý trong phạm vi hiện tại.",
  className = "",
}: WorkQueueCardProps) {
  const meaningfulItems = items.filter((item) => item.value > 0);

  return (
    <DashboardSectionCard
      title={title}
      subtitle={subtitle}
      className={className}
    >
      {!meaningfulItems.length ? (
        <DashboardEmptyState
          compact
          title="Không có đầu việc nổi bật"
          description="Hiện chưa có tín hiệu nào vượt ngưỡng để đưa vào hàng đợi xử lý."
        />
      ) : (
        <div className="space-y-3">
          {meaningfulItems.map((item) => {
            const tone = item.tone ?? "default";

            const content = (
              <div className="rounded-2xl border border-slate-100 bg-slate-50/80 px-4 py-4 transition-colors hover:bg-slate-100/80 dark:border-slate-800 dark:bg-slate-900/50 dark:hover:bg-slate-900">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <DashboardBadge variant={toneToBadgeVariant[tone]}>
                      {item.label}
                    </DashboardBadge>

                    {item.hint ? (
                      <p className="mt-2 text-xs leading-5 text-slate-500 dark:text-slate-400">
                        {item.hint}
                      </p>
                    ) : null}
                  </div>

                  <div className="flex shrink-0 items-center gap-3">
                    <DashboardNumber
                      value={item.value}
                      className={`text-xl font-bold ${toneToValueClass[tone]}`}
                    />
                    {item.href ? (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 dark:text-slate-400">
                        Mở
                        <ArrowRight className="h-3.5 w-3.5" />
                      </span>
                    ) : null}
                  </div>
                </div>
              </div>
            );

            if (item.href) {
              return (
                <a key={item.key} href={item.href} className="block">
                  {content}
                </a>
              );
            }

            return <div key={item.key}>{content}</div>;
          })}
        </div>
      )}
    </DashboardSectionCard>
  );
}
