import DashboardSectionCard from "./DashboardSectionCard";
import DashboardHealthPill from "../shared/DashboardHealthPill";
import MiniStatList, { type MiniStatListItem } from "./MiniStatList";
import DashboardEmptyState from "../shared/DashboardEmptyState";

type ReviewsHealthCardProps = {
  summary: {
    pendingReviewProducts: number;
  };
  className?: string;
};

const resolveReviewsStatus = (
  pendingReviewProducts: number,
): "healthy" | "warning" | "critical" => {
  if (pendingReviewProducts > 10) return "critical";
  if (pendingReviewProducts > 0) return "warning";
  return "healthy";
};

export default function ReviewsHealthCard({
  summary,
  className = "",
}: ReviewsHealthCardProps) {
  const status = resolveReviewsStatus(summary.pendingReviewProducts);

  const hasReviewData = summary.pendingReviewProducts > 0;

  const items: MiniStatListItem[] = [
    {
      key: "pending-reviews",
      label: "Sản phẩm có review chờ phản hồi",
      value: summary.pendingReviewProducts,
      format: "number",
      tone: summary.pendingReviewProducts > 0 ? "amber" : "emerald",
      hint: "Dùng để ưu tiên team CS / content phản hồi kịp thời.",
    },
  ];

  return (
    <DashboardSectionCard
      title="Reviews Health"
      subtitle="Theo dõi các review đang cần phản hồi để tránh bỏ sót trải nghiệm khách hàng."
      className={className}
      actions={<DashboardHealthPill status={status} />}
    >
      {!hasReviewData ? (
        <DashboardEmptyState
          compact
          title="Chưa có review chờ phản hồi"
          description="Hiện không có tín hiệu review nào cần ưu tiên xử lý."
        />
      ) : (
        <MiniStatList items={items} />
      )}
    </DashboardSectionCard>
  );
}
