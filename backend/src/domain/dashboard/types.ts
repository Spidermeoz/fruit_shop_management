export type DashboardRange = "today" | "7d" | "30d";

export type DashboardTier = "super_admin" | "branch_admin" | "branch_staff";

export type DashboardScopeMode = "system" | "branch" | "functional";

export type DashboardAlertSeverity = "info" | "warning" | "critical";

export type DashboardAlertCategory =
  | "orders"
  | "inventory"
  | "users"
  | "branches"
  | "shipping"
  | "promotions"
  | "reviews"
  | "content"
  | "system";

export type DashboardPermission = {
  module: string;
  action: string;
  key: string;
};

export type DashboardWidgetVisibility = {
  showOrders: boolean;
  showInventory: boolean;
  showUsers: boolean;
  showBranches: boolean;
  showShipping: boolean;
  showPromotions: boolean;
  showReviews: boolean;
  showContent: boolean;
};

export type DashboardViewer = {
  userId: number;
  roleId: number | null;
  tier: DashboardTier;
  scopeMode: DashboardScopeMode;
  requestedBranchId: number | null;
  resolvedBranchId: number | null;
  currentBranchId: number | null;
  allowedBranchIds: number[];
  permissions: DashboardPermission[];
};

export type DashboardFilters = {
  range: DashboardRange;
  from: string;
  to: string;
  branchId: number | null;
};

export type DashboardOrdersSummary = {
  totalOrders: number;
  pending: number;
  processing: number;
  shipping: number;
  delivered: number;
  completed: number;
  cancelled: number;
  unpaidActive: number;
  paid: number;
  pickup: number;
  delivery: number;
  grossRevenue: number;
  netRevenue: number;
};

export type DashboardInventorySummary = {
  totalProducts: number;
  totalVariants: number;
  totalStockRows: number;
  totalQuantity: number;
  reservedQuantity: number;
  availableQuantity: number;
  lowStockCount: number;
  outOfStockCount: number;
};

export type DashboardUsersSummary = {
  totalUsers: number;
  totalCustomers: number;
  totalInternal: number;
  inactiveUsers: number;
  recentUsers: number;
  internalNoBranches: number;
  internalMissingPrimary: number;
};

export type DashboardBranchesSummary = {
  total: number;
  active: number;
  inactive: number;
  pickupOnly: number;
  deliveryEnabled: number;
  hybrid: number;
  needsSetup: number;
};

export type DashboardShippingSummary = {
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

export type DashboardPromotionsSummary = {
  totalPromotions: number;
  activePromotions: number;
  autoApplyPromotions: number;
  endingSoonCount: number;
  recentUsageCount: number;
};

export type DashboardReviewsSummary = {
  pendingReviewProducts: number;
};

export type DashboardContentSummary = {
  totalPosts: number;
  activePosts: number;
  inactivePosts: number;
  totalPostCategories: number;
  totalPostTags: number;
};

export type DashboardBranchPerformanceItem = {
  branchId: number;
  branchName: string;
  branchCode: string | null;
  branchStatus: string;

  totalOrders: number;
  pendingOrders: number;
  unpaidActiveOrders: number;
  netRevenue: number;

  lowStockCount: number;
  outOfStockCount: number;

  activeServiceAreas: number;
  inactiveServiceAreas: number;

  activeBranchDeliverySlots: number;
  inactiveBranchDeliverySlots: number;

  activeCapacityRecords: number;
  inactiveCapacityRecords: number;

  internalUsers: number;

  healthStatus: "healthy" | "warning" | "critical";
  healthSignals: string[];
};

export type DashboardAlert = {
  id: string;
  severity: DashboardAlertSeverity;
  category: DashboardAlertCategory;
  title: string;
  message: string;
  branchId?: number | null;
  href?: string | null;
};

export type DashboardQuickLink = {
  key: string;
  label: string;
  href: string;
  module:
    | "orders"
    | "inventory"
    | "users"
    | "branches"
    | "shipping"
    | "promotions"
    | "reviews"
    | "content";
};

export type DashboardData = {
  viewer: DashboardViewer;
  filters: DashboardFilters;
  widgets: DashboardWidgetVisibility;

  summary: {
    orders: DashboardOrdersSummary;
    inventory: DashboardInventorySummary;
    users: DashboardUsersSummary;
    branches: DashboardBranchesSummary;
    shipping: DashboardShippingSummary;
    promotions: DashboardPromotionsSummary;
    reviews: DashboardReviewsSummary;
    content: DashboardContentSummary;
  };

  branchPerformance: DashboardBranchPerformanceItem[];
  alerts: DashboardAlert[];
  quickLinks: DashboardQuickLink[];
};

export type DashboardQueryInput = {
  actorUserId: number;
  actorRoleId: number | null;
  tier: DashboardTier;
  scopeMode: DashboardScopeMode;
  requestedBranchId: number | null;
  resolvedBranchId: number | null;
  currentBranchId: number | null;
  allowedBranchIds: number[];
  permissions: DashboardPermission[];
  widgets: DashboardWidgetVisibility;
  range: DashboardRange;
  from: Date;
  to: Date;
};
