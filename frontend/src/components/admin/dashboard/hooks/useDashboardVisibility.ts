import { useMemo } from "react";
import { useAuth } from "../../../../context/AuthContextAdmin";
import type {
  DashboardTierFlags,
  DashboardViewer,
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
  viewer?: Pick<DashboardViewer, "tier" | "scopeMode"> | null,
): UseDashboardVisibilityResult => {
  const { branches, hasPermission } = useAuth();

  return useMemo(() => {
    const merged: DashboardWidgetVisibility = {
      ...emptyWidgets,
      ...widgets,
    };

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

    const tierFromViewer = viewer?.tier ?? null;
    const scopeModeFromViewer = viewer?.scopeMode ?? null;

    const hasAnyVisibleWidget = Object.values(merged).some(Boolean);

    const fallbackManagementScore = [
      merged.showOrders,
      merged.showInventory,
      merged.showUsers,
      merged.showBranches,
      merged.showShipping,
      merged.showPromotions,
    ].filter(Boolean).length;

    const fallbackTier =
      branches.length > 0 && fallbackManagementScore >= 3
        ? "branch_admin"
        : "branch_staff";

    const tier = tierFromViewer ?? fallbackTier;
    const isSuperAdmin = tier === "super_admin";
    const isBranchAdmin = tier === "branch_admin";
    const isBranchStaff = tier === "branch_staff";

    const scopeMode =
      scopeModeFromViewer ??
      (isSuperAdmin ? "system" : isBranchAdmin ? "branch" : "functional");

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
  }, [
    branches.length,
    hasPermission,
    viewer?.scopeMode,
    viewer?.tier,
    widgets,
  ]);
};
