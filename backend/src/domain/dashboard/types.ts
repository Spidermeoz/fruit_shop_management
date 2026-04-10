export type DashboardRange = "today" | "7d" | "30d";
export type DashboardTier = "super_admin" | "branch_admin" | "branch_staff";
export type DashboardScopeMode = "system" | "branch" | "functional";

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

export type DashboardSummary = {
  orders: DashboardOrdersSummary;
  inventory: DashboardInventorySummary;
  users: DashboardUsersSummary;
  branches: DashboardBranchesSummary;
  shipping: DashboardShippingSummary;
  promotions: DashboardPromotionsSummary;
  reviews: DashboardReviewsSummary;
  content: DashboardContentSummary;
};

export type DashboardData = {
  viewer: DashboardViewer;
  filters: DashboardFilters;
  widgets: DashboardWidgetVisibility;
  summary: DashboardSummary;
  branchPerformance: DashboardBranchPerformanceItem[];
  alerts: DashboardAlert[];
  quickLinks: DashboardQuickLink[];
};

export type DashboardApiResponse = {
  success: boolean;
  data: DashboardData;
  message?: string;
};

export type DashboardTierFlags = {
  isSuperAdmin: boolean;
  isBranchAdmin: boolean;
  isBranchStaff: boolean;
  scopeMode: DashboardScopeMode;
  tier: DashboardTier;
};

export type DashboardVisibility = DashboardWidgetVisibility & {
  hasAnyVisibleWidget: boolean;
  showExecutiveBoard: boolean;
  showBranchOpsBoard: boolean;
  showFunctionalBoard: boolean;
};

export type DashboardHookState = {
  data: DashboardData | null;
  loading: boolean;
  refreshing: boolean;
  error: string;
};

export type DashboardFilterState = {
  range: DashboardRange;
  selectedBranchId: number | null;
};

export type DashboardStatTone =
  | "default"
  | "blue"
  | "emerald"
  | "amber"
  | "red"
  | "violet";

export type DashboardKpiItem = {
  key: string;
  label: string;
  value: number | string;
  subValue?: string;
  hint?: string;
  tone?: DashboardStatTone;
  href?: string;
};

export const DASHBOARD_RANGE_OPTIONS: Array<{
  value: DashboardRange;
  label: string;
}> = [
  { value: "today", label: "Hôm nay" },
  { value: "7d", label: "7 ngày" },
  { value: "30d", label: "30 ngày" },
];

export const EMPTY_DASHBOARD_SUMMARY: DashboardSummary = {
  orders: {
    totalOrders: 0,
    pending: 0,
    processing: 0,
    shipping: 0,
    delivered: 0,
    completed: 0,
    cancelled: 0,
    unpaidActive: 0,
    paid: 0,
    pickup: 0,
    delivery: 0,
    grossRevenue: 0,
    netRevenue: 0,
  },
  inventory: {
    totalProducts: 0,
    totalVariants: 0,
    totalStockRows: 0,
    totalQuantity: 0,
    reservedQuantity: 0,
    availableQuantity: 0,
    lowStockCount: 0,
    outOfStockCount: 0,
  },
  users: {
    totalUsers: 0,
    totalCustomers: 0,
    totalInternal: 0,
    inactiveUsers: 0,
    recentUsers: 0,
    internalNoBranches: 0,
    internalMissingPrimary: 0,
  },
  branches: {
    total: 0,
    active: 0,
    inactive: 0,
    pickupOnly: 0,
    deliveryEnabled: 0,
    hybrid: 0,
    needsSetup: 0,
  },
  shipping: {
    totalZones: 0,
    activeZones: 0,
    totalServiceAreas: 0,
    activeServiceAreas: 0,
    inactiveServiceAreas: 0,
    totalBranchDeliverySlots: 0,
    activeBranchDeliverySlots: 0,
    inactiveBranchDeliverySlots: 0,
    totalCapacityRecords: 0,
    activeCapacityRecords: 0,
    inactiveCapacityRecords: 0,
  },
  promotions: {
    totalPromotions: 0,
    activePromotions: 0,
    autoApplyPromotions: 0,
    endingSoonCount: 0,
    recentUsageCount: 0,
  },
  reviews: {
    pendingReviewProducts: 0,
  },
  content: {
    totalPosts: 0,
    activePosts: 0,
    inactivePosts: 0,
    totalPostCategories: 0,
    totalPostTags: 0,
  },
};

export const EMPTY_DASHBOARD_DATA: DashboardData = {
  viewer: {
    userId: 0,
    roleId: null,
    tier: "branch_staff",
    scopeMode: "functional",
    requestedBranchId: null,
    resolvedBranchId: null,
    currentBranchId: null,
    allowedBranchIds: [],
    permissions: [],
  },
  filters: {
    range: "7d",
    from: "",
    to: "",
    branchId: null,
  },
  widgets: {
    showOrders: false,
    showInventory: false,
    showUsers: false,
    showBranches: false,
    showShipping: false,
    showPromotions: false,
    showReviews: false,
    showContent: false,
  },
  summary: EMPTY_DASHBOARD_SUMMARY,
  branchPerformance: [],
  alerts: [],
  quickLinks: [],
};
