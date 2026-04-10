import DashboardSectionCard from "./DashboardSectionCard";
import DashboardHealthPill from "../shared/DashboardHealthPill";
import MiniStatList, { type MiniStatListItem } from "./MiniStatList";
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

  const items: MiniStatListItem[] = [
    {
      key: "zones",
      label: "Vùng giao hàng hoạt động",
      value: summary.activeZones,
      format: "number",
      tone: "blue",
      hint: `Tổng ${summary.totalZones} vùng`,
    },
    {
      key: "service-areas-active",
      label: "Service areas hoạt động",
      value: summary.activeServiceAreas,
      format: "number",
      tone: "emerald",
      hint: `Inactive: ${summary.inactiveServiceAreas}`,
    },
    {
      key: "branch-slots-active",
      label: "Khung giờ branch hoạt động",
      value: summary.activeBranchDeliverySlots,
      format: "number",
      tone: "violet",
      hint: `Inactive: ${summary.inactiveBranchDeliverySlots}`,
    },
    {
      key: "capacity-active",
      label: "Capacity records hoạt động",
      value: summary.activeCapacityRecords,
      format: "number",
      tone: "amber",
      hint: `Inactive: ${summary.inactiveCapacityRecords}`,
    },
  ];

  return (
    <DashboardSectionCard
      title="Shipping Health"
      subtitle="Trạng thái readiness của cấu hình giao hàng và năng lực phục vụ."
      className={className}
      actions={<DashboardHealthPill status={status} />}
    >
      {!hasShippingData ? (
        <DashboardEmptyState
          compact
          title="Chưa có dữ liệu giao hàng"
          description="Hiện chưa có đủ cấu hình shipping trong phạm vi đang chọn."
        />
      ) : (
        <MiniStatList items={items} />
      )}
    </DashboardSectionCard>
  );
}
