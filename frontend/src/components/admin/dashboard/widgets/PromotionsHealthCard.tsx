import DashboardSectionCard from "./DashboardSectionCard";
import DashboardHealthPill from "../shared/DashboardHealthPill";
import MiniStatList, { type MiniStatListItem } from "./MiniStatList";
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

const resolvePromotionStatus = (
  totalPromotions: number,
  endingSoonCount: number,
): "healthy" | "warning" | "critical" => {
  if (totalPromotions <= 0) return "warning";
  if (endingSoonCount > 0) return "warning";
  return "healthy";
};

export default function PromotionsHealthCard({
  summary,
  className = "",
}: PromotionsHealthCardProps) {
  const status = resolvePromotionStatus(
    summary.totalPromotions,
    summary.endingSoonCount,
  );

  const hasPromotionData =
    summary.totalPromotions > 0 ||
    summary.activePromotions > 0 ||
    summary.recentUsageCount > 0;

  const items: MiniStatListItem[] = [
    {
      key: "promo-total",
      label: "Tổng khuyến mãi",
      value: summary.totalPromotions,
      format: "number",
    },
    {
      key: "promo-active",
      label: "Khuyến mãi đang active",
      value: summary.activePromotions,
      format: "number",
      tone: "emerald",
    },
    {
      key: "promo-auto",
      label: "Auto apply",
      value: summary.autoApplyPromotions,
      format: "number",
      tone: "violet",
    },
    {
      key: "promo-ending",
      label: "Sắp kết thúc",
      value: summary.endingSoonCount,
      format: "number",
      tone: "amber",
    },
    {
      key: "promo-usage",
      label: "Lượt dùng gần đây",
      value: summary.recentUsageCount,
      format: "number",
      tone: "blue",
    },
  ];

  return (
    <DashboardSectionCard
      title="Promotions Health"
      subtitle="Theo dõi trạng thái campaign, auto apply và mức độ sử dụng gần đây."
      className={className}
      actions={<DashboardHealthPill status={status} />}
    >
      {!hasPromotionData ? (
        <DashboardEmptyState
          compact
          title="Chưa có dữ liệu khuyến mãi"
          description="Hiện chưa có dữ liệu khuyến mãi phù hợp trong phạm vi này."
        />
      ) : (
        <MiniStatList items={items} />
      )}
    </DashboardSectionCard>
  );
}
