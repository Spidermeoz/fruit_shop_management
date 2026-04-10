import type {
  DashboardAlert,
  DashboardBranchPerformanceItem,
  DashboardTier,
  DashboardTierFlags,
  DashboardVisibility,
  DashboardWidgetVisibility,
} from "../types/dashboard";

export const isSuperAdminTier = (tier?: DashboardTier | null): boolean =>
  tier === "super_admin";

export const isBranchAdminTier = (tier?: DashboardTier | null): boolean =>
  tier === "branch_admin";

export const isBranchStaffTier = (tier?: DashboardTier | null): boolean =>
  tier === "branch_staff";

export const hasAnyVisibleWidget = (
  widgets?: Partial<DashboardWidgetVisibility> | null,
): boolean => {
  if (!widgets) return false;
  return Object.values(widgets).some(Boolean);
};

export const canShowExecutiveBoard = (
  tierFlags: Pick<DashboardTierFlags, "isSuperAdmin">,
): boolean => {
  return tierFlags.isSuperAdmin;
};

export const canShowBranchOpsBoard = (
  tierFlags: Pick<DashboardTierFlags, "isBranchAdmin">,
): boolean => {
  return tierFlags.isBranchAdmin;
};

export const canShowFunctionalBoard = (
  tierFlags: Pick<DashboardTierFlags, "isBranchStaff">,
): boolean => {
  return tierFlags.isBranchStaff;
};

export const shouldRenderSection = (
  visible: boolean,
  items?: unknown[] | null,
): boolean => {
  if (!visible) return false;
  if (!items) return true;
  return items.length > 0;
};

export const isCriticalAlert = (alert: DashboardAlert): boolean =>
  alert.severity === "critical";

export const isWarningAlert = (alert: DashboardAlert): boolean =>
  alert.severity === "warning";

export const hasAlerts = (alerts?: DashboardAlert[] | null): boolean =>
  Array.isArray(alerts) && alerts.length > 0;

export const hasCriticalAlerts = (alerts?: DashboardAlert[] | null): boolean =>
  Array.isArray(alerts) && alerts.some(isCriticalAlert);

export const hasWarningAlerts = (alerts?: DashboardAlert[] | null): boolean =>
  Array.isArray(alerts) && alerts.some(isWarningAlert);

export const hasHealthyBranchPerformance = (
  rows?: DashboardBranchPerformanceItem[] | null,
): boolean => {
  return (
    Array.isArray(rows) && rows.some((row) => row.healthStatus === "healthy")
  );
};

export const hasBranchPerformanceRows = (
  rows?: DashboardBranchPerformanceItem[] | null,
): boolean => Array.isArray(rows) && rows.length > 0;

export const getCriticalBranchCount = (
  rows?: DashboardBranchPerformanceItem[] | null,
): number => {
  if (!Array.isArray(rows)) return 0;
  return rows.filter((row) => row.healthStatus === "critical").length;
};

export const getWarningBranchCount = (
  rows?: DashboardBranchPerformanceItem[] | null,
): number => {
  if (!Array.isArray(rows)) return 0;
  return rows.filter((row) => row.healthStatus === "warning").length;
};

export const resolveDashboardTitle = (
  visibility: Pick<
    DashboardVisibility,
    "showExecutiveBoard" | "showBranchOpsBoard" | "showFunctionalBoard"
  >,
): string => {
  if (visibility.showExecutiveBoard) return "System Control Tower";
  if (visibility.showBranchOpsBoard) return "Branch Operations Center";
  if (visibility.showFunctionalBoard) return "Functional Workspace";
  return "Dashboard";
};

export const resolveDashboardSubtitle = (
  visibility: Pick<
    DashboardVisibility,
    "showExecutiveBoard" | "showBranchOpsBoard" | "showFunctionalBoard"
  >,
): string => {
  if (visibility.showExecutiveBoard) {
    return "Tổng quan toàn hệ thống, hiệu suất chi nhánh và các tín hiệu vận hành quan trọng.";
  }

  if (visibility.showBranchOpsBoard) {
    return "Theo dõi tình hình đơn hàng, tồn kho, giao hàng và cảnh báo tại chi nhánh hiện tại.";
  }

  if (visibility.showFunctionalBoard) {
    return "Không gian làm việc theo đúng phạm vi quyền hạn và nhóm nghiệp vụ bạn đang phụ trách.";
  }

  return "Theo dõi nhanh các chỉ số và tín hiệu quan trọng.";
};

export const shouldShowAllBranchesOption = (
  input?: DashboardTier | number | null,
): boolean => {
  if (input === "super_admin") return true;
  return Number(input) === 1;
};
