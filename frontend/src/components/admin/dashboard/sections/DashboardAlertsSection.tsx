import type { DashboardAlert } from "../types/dashboard";
import DashboardSectionCard from "../widgets/DashboardSectionCard";
import DashboardAlertList from "../widgets/DashboardAlertList";

type DashboardAlertsSectionProps = {
  alerts: DashboardAlert[];
  title?: string;
  subtitle?: string;
  className?: string;
  maxItems?: number;
};

export default function DashboardAlertsSection({
  alerts,
  title = "Operational Alerts",
  subtitle = "Các tín hiệu cần ưu tiên theo dõi và xử lý trong phạm vi hiện tại.",
  className = "",
  maxItems,
}: DashboardAlertsSectionProps) {
  return (
    <DashboardSectionCard
      title={title}
      subtitle={subtitle}
      className={className}
    >
      <DashboardAlertList alerts={alerts} maxItems={maxItems} />
    </DashboardSectionCard>
  );
}
