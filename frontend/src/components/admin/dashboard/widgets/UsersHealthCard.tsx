import DashboardSectionCard from "./DashboardSectionCard";
import DashboardHealthPill from "../shared/DashboardHealthPill";
import MiniStatList, { type MiniStatListItem } from "./MiniStatList";
import DashboardEmptyState from "../shared/DashboardEmptyState";

type UsersHealthCardProps = {
  summary: {
    totalUsers: number;
    totalCustomers: number;
    totalInternal: number;
    inactiveUsers: number;
    recentUsers: number;
    internalNoBranches: number;
    internalMissingPrimary: number;
  };
  className?: string;
};

const resolveUsersStatus = (
  internalNoBranches: number,
  internalMissingPrimary: number,
): "healthy" | "warning" | "critical" => {
  if (internalNoBranches > 0) return "critical";
  if (internalMissingPrimary > 0) return "warning";
  return "healthy";
};

export default function UsersHealthCard({
  summary,
  className = "",
}: UsersHealthCardProps) {
  const status = resolveUsersStatus(
    summary.internalNoBranches,
    summary.internalMissingPrimary,
  );

  const hasUserData =
    summary.totalUsers > 0 ||
    summary.totalCustomers > 0 ||
    summary.totalInternal > 0;

  const items: MiniStatListItem[] = [
    {
      key: "users-total",
      label: "Tổng người dùng",
      value: summary.totalUsers,
      format: "number",
    },
    {
      key: "customers",
      label: "Khách hàng",
      value: summary.totalCustomers,
      format: "number",
      tone: "blue",
    },
    {
      key: "internal",
      label: "Nhân sự nội bộ",
      value: summary.totalInternal,
      format: "number",
      tone: "emerald",
    },
    {
      key: "inactive",
      label: "Tài khoản inactive",
      value: summary.inactiveUsers,
      format: "number",
      tone: "amber",
    },
    {
      key: "recent",
      label: "Người dùng mới trong kỳ",
      value: summary.recentUsers,
      format: "number",
      tone: "violet",
    },
    {
      key: "no-branches",
      label: "Nhân sự chưa gán chi nhánh",
      value: summary.internalNoBranches,
      format: "number",
      tone: "red",
    },
    {
      key: "missing-primary",
      label: "Thiếu primary branch",
      value: summary.internalMissingPrimary,
      format: "number",
      tone: "amber",
    },
  ];

  return (
    <DashboardSectionCard
      title="Users Health"
      subtitle="Tình trạng user base, internal staff và các vấn đề phân quyền chi nhánh."
      className={className}
      actions={<DashboardHealthPill status={status} />}
    >
      {!hasUserData ? (
        <DashboardEmptyState
          compact
          title="Chưa có dữ liệu người dùng"
          description="Hiện chưa có dữ liệu người dùng trong phạm vi dashboard."
        />
      ) : (
        <MiniStatList items={items} />
      )}
    </DashboardSectionCard>
  );
}
