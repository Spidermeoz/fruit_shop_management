import type { DashboardQuickLink } from "../types/dashboard";
import DashboardSectionCard from "../widgets/DashboardSectionCard";
import DashboardQuickLinksGrid from "../widgets/DashboardQuickLinksGrid";

type DashboardQuickLinksSectionProps = {
  links: DashboardQuickLink[];
  title?: string;
  subtitle?: string;
  className?: string;
};

export default function DashboardQuickLinksSection({
  links,
  title = "Quick Access",
  subtitle = "Đi tới các workspace chuyên sâu để thao tác và xử lý dữ liệu chi tiết hơn.",
  className = "",
}: DashboardQuickLinksSectionProps) {
  return (
    <DashboardSectionCard
      title={title}
      subtitle={subtitle}
      className={className}
    >
      <DashboardQuickLinksGrid links={links} />
    </DashboardSectionCard>
  );
}
