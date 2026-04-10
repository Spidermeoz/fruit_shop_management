import { useMemo } from "react";
import { useAuth } from "../../../../context/AuthContextAdmin";
import type {
  DashboardTierFlags,
  DashboardVisibility,
  DashboardWidgetVisibility,
} from "../types/dashboard";

type UseDashboardVisibilityResult = DashboardTierFlags &
  DashboardVisibility & {
    canAccessBranchSwitcher: boolean;
    canSeeAllBranches: boolean;
  };

const emptyWidgets: DashboardWidgetVisibility = {
  showOrders: false,
  showInventory: false,
  showUsers: false,
  showBranches: false,
  showShipping: false,
  showPromotions: false,
  showReviews: false,
  showContent: false,
};

export const useDashboardVisibility = (
  widgets?: Partial<DashboardWidgetVisibility> | null,
): UseDashboardVisibilityResult => {
  const { user, branches, hasPermission } = useAuth();

  return useMemo(() => {
    const roleId = Number(user?.role_id ?? 0);
    const isSuperAdmin = roleId === 1;

    const merged: DashboardWidgetVisibility = {
      ...emptyWidgets,
      ...widgets,
    };

    // Khi dashboard data chưa về, vẫn có thể fallback theo permission hiện tại
    // để page có skeleton/empty-state hợp lý.
    if (!widgets) {
      merged.showOrders = hasPermission("order", "view");
      merged.showInventory = hasPermission("inventory", "view");
      merged.showUsers = hasPermission("user", "view");
      merged.showBranches = hasPermission("branch", "view");
      merged.showShipping =
        hasPermission("shipping_zone", "view") ||
        hasPermission("branch_service_area", "view") ||
        hasPermission("delivery_time_slot", "view") ||
        hasPermission("branch_delivery_time_slot", "view") ||
        hasPermission("branch_delivery_slot_capacity", "view");
      merged.showPromotions = hasPermission("promotion", "view");
      merged.showReviews =
        hasPermission("review", "view") || hasPermission("review", "reply");
      merged.showContent =
        hasPermission("post", "view") ||
        hasPermission("post_category", "view") ||
        hasPermission("post_tag", "view");
    }

    const managementScore = [
      merged.showOrders,
      merged.showInventory,
      merged.showUsers,
      merged.showBranches,
      merged.showShipping,
      merged.showPromotions,
    ].filter(Boolean).length;

    const isBranchAdmin =
      !isSuperAdmin && branches.length > 0 && managementScore >= 3;

    const isBranchStaff = !isSuperAdmin && !isBranchAdmin;

    const scopeMode = isSuperAdmin
      ? "system"
      : isBranchAdmin
        ? "branch"
        : "functional";

    const tier = isSuperAdmin
      ? "super_admin"
      : isBranchAdmin
        ? "branch_admin"
        : "branch_staff";

    const hasAnyVisibleWidget = Object.values(merged).some(Boolean);

    return {
      tier,
      scopeMode,
      isSuperAdmin,
      isBranchAdmin,
      isBranchStaff,

      ...merged,
      hasAnyVisibleWidget,

      showExecutiveBoard: isSuperAdmin,
      showBranchOpsBoard: isBranchAdmin,
      showFunctionalBoard: isBranchStaff,

      canAccessBranchSwitcher: isSuperAdmin || branches.length > 1,
      canSeeAllBranches: isSuperAdmin,
    };
  }, [branches.length, hasPermission, user?.role_id, widgets]);
};
