import type { DashboardData } from "../types/dashboard";
import {
  buildExecutiveKpis,
  filterQuickLinksByVisibility,
  getBranchPerformanceDistributions,
  getFulfillmentDistribution,
  getOrdersStatusDistribution,
  getSystemHealthMetricBars,
} from "../utils/dashboardMappers";
import DashboardKpiGrid from "../widgets/DashboardKpiGrid";
import DashboardAlertsSection from "./DashboardAlertsSection";
import BranchPerformanceTable from "../widgets/BranchPerformanceTable";
import StatusDistributionCard from "../widgets/StatusDistributionCard";
import MetricDonutCard from "../widgets/MetricDonutCard";
import MetricBarListCard from "../widgets/MetricBarListCard";
import InventoryHealthCard from "../widgets/InventoryHealthCard";
import ShippingHealthCard from "../widgets/ShippingHealthCard";
import UsersHealthCard from "../widgets/UsersHealthCard";
import PromotionsHealthCard from "../widgets/PromotionsHealthCard";
import ReviewsHealthCard from "../widgets/ReviewsHealthCard";
import DashboardQuickLinksSection from "./DashboardQuickLinksSection";

type SuperAdminDashboardSectionProps = {
  data: DashboardData;
  className?: string;
};

export default function SuperAdminDashboardSection({
  data,
  className = "",
}: SuperAdminDashboardSectionProps) {
  const kpis = buildExecutiveKpis(data);
  const quickLinks = filterQuickLinksByVisibility(data);

  return (
    <div className={`space-y-6 ${className}`.trim()}>
      <DashboardKpiGrid items={kpis} columns={4} />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <DashboardAlertsSection
          alerts={data.alerts}
          title="System Alerts"
          subtitle="Các tín hiệu bất thường nổi bật trên toàn hệ thống."
        />

        <MetricBarListCard
          title="System Health Highlights"
          subtitle="Các chỉ số cần theo dõi nhanh trên toàn hệ thống."
          items={getSystemHealthMetricBars(data)}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <StatusDistributionCard
          title="Orders by Status"
          subtitle="Cơ cấu trạng thái đơn hàng trong kỳ."
          total={data.summary.orders.totalOrders}
          items={getOrdersStatusDistribution(data)}
          className="xl:col-span-1"
        />

        <MetricDonutCard
          title="Fulfillment Mix"
          subtitle="Tỷ trọng pickup và delivery trong kỳ."
          total={data.summary.orders.pickup + data.summary.orders.delivery}
          items={getFulfillmentDistribution(data)}
          centerLabel="Fulfillment"
          className="xl:col-span-1"
        />

        <MetricDonutCard
          title="Branch Health"
          subtitle="Phân bổ tình trạng vận hành giữa các chi nhánh."
          total={data.branchPerformance.length}
          items={getBranchPerformanceDistributions(data.branchPerformance)}
          centerLabel="Branches"
          className="xl:col-span-1"
        />
      </div>

      <BranchPerformanceTable rows={data.branchPerformance} />

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
