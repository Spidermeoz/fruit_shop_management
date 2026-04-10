import type { DashboardData } from "../types/dashboard";
import {
  buildBranchAdminKpis,
  buildBranchWorkQueueItems,
  filterQuickLinksByVisibility,
  getBranchOpsMetricBars,
  getFulfillmentDistribution,
  getOrdersStatusDistribution,
} from "../utils/dashboardMappers";
import DashboardKpiGrid from "../widgets/DashboardKpiGrid";
import DashboardAlertsSection from "./DashboardAlertsSection";
import WorkQueueCard from "../widgets/WorkQueueCard";
import StatusDistributionCard from "../widgets/StatusDistributionCard";
import MetricDonutCard from "../widgets/MetricDonutCard";
import MetricBarListCard from "../widgets/MetricBarListCard";
import InventoryHealthCard from "../widgets/InventoryHealthCard";
import ShippingHealthCard from "../widgets/ShippingHealthCard";
import UsersHealthCard from "../widgets/UsersHealthCard";
import PromotionsHealthCard from "../widgets/PromotionsHealthCard";
import ReviewsHealthCard from "../widgets/ReviewsHealthCard";
import DashboardQuickLinksSection from "./DashboardQuickLinksSection";

type BranchAdminDashboardSectionProps = {
  data: DashboardData;
  className?: string;
};

export default function BranchAdminDashboardSection({
  data,
  className = "",
}: BranchAdminDashboardSectionProps) {
  const kpis = buildBranchAdminKpis(data);
  const queueItems = buildBranchWorkQueueItems(data);
  const quickLinks = filterQuickLinksByVisibility(data);

  return (
    <div className={`space-y-6 ${className}`.trim()}>
      <DashboardKpiGrid items={kpis} columns={3} />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <WorkQueueCard
          items={queueItems}
          title="Branch Work Queue"
          subtitle="Các đầu việc ưu tiên cần branch xử lý trong phạm vi hiện tại."
        />

        <DashboardAlertsSection
          alerts={data.alerts}
          title="Branch Alerts"
          subtitle="Cảnh báo và tín hiệu cần theo dõi tại chi nhánh."
          maxItems={8}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <StatusDistributionCard
          title="Order Status"
          subtitle="Cơ cấu trạng thái đơn hàng trong chi nhánh."
          total={data.summary.orders.totalOrders}
          items={getOrdersStatusDistribution(data)}
        />

        <MetricDonutCard
          title="Fulfillment Split"
          subtitle="Tỷ trọng pickup và delivery tại chi nhánh."
          total={data.summary.orders.pickup + data.summary.orders.delivery}
          items={getFulfillmentDistribution(data)}
          centerLabel="Orders"
        />

        <MetricBarListCard
          title="Branch Ops Snapshot"
          subtitle="Những chỉ số vận hành nổi bật tại chi nhánh."
          items={getBranchOpsMetricBars(data)}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <InventoryHealthCard summary={data.summary.inventory} />
        <ShippingHealthCard summary={data.summary.shipping} />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <UsersHealthCard summary={data.summary.users} />
        <PromotionsHealthCard summary={data.summary.promotions} />
        <ReviewsHealthCard summary={data.summary.reviews} />
      </div>

      <DashboardQuickLinksSection links={quickLinks} />
    </div>
  );
}
