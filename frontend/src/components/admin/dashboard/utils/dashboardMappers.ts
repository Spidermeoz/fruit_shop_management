import {
  AlertCircle,
  Boxes,
  Building2,
  Megaphone,
  ShoppingCart,
  Star,
  Truck,
  Users,
  type LucideIcon,
} from "lucide-react";
import type {
  DashboardBranchPerformanceItem,
  DashboardData,
  DashboardKpiItem,
} from "../types/dashboard";
import type { WorkQueueItem } from "../widgets/WorkQueueCard";

export type DashboardMetricBarItem = {
  key: string;
  label: string;
  value: number;
  format?: "number" | "currency" | "compact" | "percent";
  tone?: "default" | "blue" | "emerald" | "amber" | "red" | "violet";
  icon?: LucideIcon;
};

export const buildExecutiveKpis = (data: DashboardData): DashboardKpiItem[] => {
  const { summary } = data;

  return [
    {
      key: "orders-total",
      label: "Tổng đơn hàng",
      value: summary.orders.totalOrders,
      hint: "Trong khoảng thời gian đang chọn",
      tone: "blue",
    },
    {
      key: "orders-revenue",
      label: "Doanh thu ròng",
      value: summary.orders.netRevenue,
      hint: "Doanh thu sau giảm giá",
      tone: "emerald",
    },
    {
      key: "branches-active",
      label: "Chi nhánh hoạt động",
      value: summary.branches.active,
      subValue: `/ ${summary.branches.total} chi nhánh`,
      tone: "violet",
    },
    {
      key: "inventory-low",
      label: "Tồn kho thấp",
      value: summary.inventory.lowStockCount,
      hint: "Cần bổ sung sớm",
      tone: "amber",
    },
    {
      key: "inventory-out",
      label: "Hết hàng",
      value: summary.inventory.outOfStockCount,
      hint: "Biến thể đang hết hàng",
      tone: "red",
    },
    {
      key: "shipping-alerts",
      label: "Cấu hình giao hàng inactive",
      value:
        summary.shipping.inactiveServiceAreas +
        summary.shipping.inactiveBranchDeliverySlots +
        summary.shipping.inactiveCapacityRecords,
      hint: "Service areas, slots, capacities",
      tone: "amber",
    },
    {
      key: "promo-active",
      label: "Khuyến mãi active",
      value: summary.promotions.activePromotions,
      hint: "Chiến dịch đang chạy",
      tone: "violet",
    },
    {
      key: "reviews-pending",
      label: "Review cần phản hồi",
      value: summary.reviews.pendingReviewProducts,
      hint: "Sản phẩm có review chờ xử lý",
      tone: "red",
    },
  ];
};

export const buildBranchAdminKpis = (
  data: DashboardData,
): DashboardKpiItem[] => {
  const { summary } = data;

  return [
    {
      key: "branch-orders-total",
      label: "Đơn hàng",
      value: summary.orders.totalOrders,
      hint: "Trong phạm vi chi nhánh",
      tone: "blue",
    },
    {
      key: "branch-orders-pending",
      label: "Đơn chờ xử lý",
      value:
        summary.orders.pending +
        summary.orders.processing +
        summary.orders.shipping,
      hint: "Ưu tiên xử lý ngay",
      tone: "amber",
    },
    {
      key: "branch-revenue",
      label: "Doanh thu ròng",
      value: summary.orders.netRevenue,
      hint: "Theo khoảng thời gian đang chọn",
      tone: "emerald",
    },
    {
      key: "branch-available",
      label: "Tồn khả dụng",
      value: summary.inventory.availableQuantity,
      tone: "emerald",
    },
    {
      key: "branch-low-stock",
      label: "Tồn thấp / hết hàng",
      value:
        summary.inventory.lowStockCount + summary.inventory.outOfStockCount,
      hint: "Cần theo dõi nhập bổ sung",
      tone: "red",
    },
    {
      key: "branch-shipping-ready",
      label: "Khung giao hàng active",
      value: summary.shipping.activeBranchDeliverySlots,
      subValue: `/ ${summary.shipping.totalBranchDeliverySlots} cấu hình`,
      tone: "violet",
    },
  ];
};

export const buildFunctionalKpis = (
  data: DashboardData,
): DashboardKpiItem[] => {
  const { summary, widgets } = data;
  const items: DashboardKpiItem[] = [];

  if (widgets.showOrders) {
    items.push({
      key: "functional-orders-pending",
      label: "Đơn cần xử lý",
      value:
        summary.orders.pending +
        summary.orders.processing +
        summary.orders.shipping,
      tone: "amber",
    });
  }

  if (widgets.showInventory) {
    items.push({
      key: "functional-inventory-low",
      label: "Tồn kho cần chú ý",
      value:
        summary.inventory.lowStockCount + summary.inventory.outOfStockCount,
      tone: "red",
    });
  }

  if (widgets.showShipping) {
    items.push({
      key: "functional-shipping-inactive",
      label: "Cấu hình giao hàng inactive",
      value:
        summary.shipping.inactiveServiceAreas +
        summary.shipping.inactiveBranchDeliverySlots +
        summary.shipping.inactiveCapacityRecords,
      tone: "amber",
    });
  }

  if (widgets.showUsers) {
    items.push({
      key: "functional-users-issues",
      label: "Vấn đề nhân sự",
      value:
        summary.users.internalNoBranches + summary.users.internalMissingPrimary,
      tone: "violet",
    });
  }

  if (widgets.showPromotions) {
    items.push({
      key: "functional-promotions-active",
      label: "Khuyến mãi active",
      value: summary.promotions.activePromotions,
      tone: "violet",
    });
  }

  if (widgets.showReviews) {
    items.push({
      key: "functional-reviews-pending",
      label: "Review chờ phản hồi",
      value: summary.reviews.pendingReviewProducts,
      tone: "red",
    });
  }

  return items;
};

export const buildBranchWorkQueueItems = (
  data: DashboardData,
): WorkQueueItem[] => {
  const { summary } = data;

  return [
    {
      key: "queue-pending-orders",
      label: "Đơn chờ xác nhận",
      value: summary.orders.pending,
      href: "/admin/orders",
      tone: "amber",
      hint: "Đơn vừa vào hệ thống, cần xác nhận hoặc xử lý.",
    },
    {
      key: "queue-processing-orders",
      label: "Đơn đang xử lý",
      value: summary.orders.processing,
      href: "/admin/orders",
      tone: "blue",
      hint: "Các đơn đang trong khâu chuẩn bị hoặc đóng gói.",
    },
    {
      key: "queue-unpaid-orders",
      label: "Đơn chưa thanh toán",
      value: summary.orders.unpaidActive,
      href: "/admin/orders",
      tone: "red",
      hint: "Ưu tiên kiểm tra các đơn còn active nhưng chưa paid.",
    },
    {
      key: "queue-low-stock",
      label: "Biến thể tồn thấp",
      value: summary.inventory.lowStockCount,
      href: "/admin/inventory",
      tone: "amber",
      hint: "Mức tồn kho sắp chạm ngưỡng rủi ro.",
    },
    {
      key: "queue-out-of-stock",
      label: "Biến thể hết hàng",
      value: summary.inventory.outOfStockCount,
      href: "/admin/inventory",
      tone: "red",
      hint: "Cần nhập hàng hoặc điều phối lại giữa các điểm.",
    },
    {
      key: "queue-service-area-inactive",
      label: "Service area inactive",
      value: summary.shipping.inactiveServiceAreas,
      href: "/admin/branch-service-areas",
      tone: "violet",
      hint: "Có cấu hình vùng phục vụ đang tắt hoặc chưa sẵn sàng.",
    },
    {
      key: "queue-branch-slot-inactive",
      label: "Khung giờ inactive",
      value: summary.shipping.inactiveBranchDeliverySlots,
      href: "/admin/branch-delivery-time-slots",
      tone: "violet",
      hint: "Các khung giờ giao hàng theo chi nhánh cần rà soát.",
    },
    {
      key: "queue-capacity-inactive",
      label: "Capacity inactive",
      value: summary.shipping.inactiveCapacityRecords,
      href: "/admin/branch-delivery-slot-capacities",
      tone: "amber",
      hint: "Năng lực phục vụ theo ngày/slot có bản ghi chưa sẵn sàng.",
    },
    {
      key: "queue-promotions-ending",
      label: "Khuyến mãi sắp kết thúc",
      value: summary.promotions.endingSoonCount,
      href: "/admin/promotions",
      tone: "blue",
      hint: "Kiểm tra campaign để gia hạn hoặc thay thế.",
    },
    {
      key: "queue-reviews-pending",
      label: "Review cần phản hồi",
      value: summary.reviews.pendingReviewProducts,
      href: "/admin/reviews",
      tone: "red",
      hint: "Các review đang chờ phản hồi từ team.",
    },
  ];
};

export const buildFunctionalWorkQueueItems = (
  data: DashboardData,
): WorkQueueItem[] => {
  const { summary, widgets } = data;
  const items: WorkQueueItem[] = [];

  if (widgets.showOrders) {
    items.push(
      {
        key: "func-orders-pending",
        label: "Đơn chờ xử lý",
        value:
          summary.orders.pending +
          summary.orders.processing +
          summary.orders.shipping,
        href: "/admin/orders",
        tone: "amber",
      },
      {
        key: "func-orders-unpaid",
        label: "Đơn chưa thanh toán",
        value: summary.orders.unpaidActive,
        href: "/admin/orders",
        tone: "red",
      },
    );
  }

  if (widgets.showInventory) {
    items.push(
      {
        key: "func-low-stock",
        label: "Tồn kho thấp",
        value: summary.inventory.lowStockCount,
        href: "/admin/inventory",
        tone: "amber",
      },
      {
        key: "func-out-stock",
        label: "Hết hàng",
        value: summary.inventory.outOfStockCount,
        href: "/admin/inventory",
        tone: "red",
      },
    );
  }

  if (widgets.showShipping) {
    items.push({
      key: "func-shipping-inactive",
      label: "Cấu hình giao hàng inactive",
      value:
        summary.shipping.inactiveServiceAreas +
        summary.shipping.inactiveBranchDeliverySlots +
        summary.shipping.inactiveCapacityRecords,
      href: "/admin/branch-delivery-time-slots",
      tone: "violet",
    });
  }

  if (widgets.showReviews) {
    items.push({
      key: "func-reviews-pending",
      label: "Review chờ phản hồi",
      value: summary.reviews.pendingReviewProducts,
      href: "/admin/reviews",
      tone: "red",
    });
  }

  return items;
};

export const getBranchPerformanceDistributions = (
  rows: DashboardBranchPerformanceItem[],
) => {
  const healthy = rows.filter((row) => row.healthStatus === "healthy").length;
  const warning = rows.filter((row) => row.healthStatus === "warning").length;
  const critical = rows.filter((row) => row.healthStatus === "critical").length;

  return [
    {
      key: "healthy",
      label: "Ổn định",
      value: healthy,
      tone: "emerald" as const,
    },
    {
      key: "warning",
      label: "Cần chú ý",
      value: warning,
      tone: "amber" as const,
    },
    {
      key: "critical",
      label: "Nghiêm trọng",
      value: critical,
      tone: "red" as const,
    },
  ];
};

export const getOrdersStatusDistribution = (data: DashboardData) => [
  {
    key: "pending",
    label: "Pending",
    value: data.summary.orders.pending,
    tone: "amber" as const,
  },
  {
    key: "processing",
    label: "Processing",
    value: data.summary.orders.processing,
    tone: "blue" as const,
  },
  {
    key: "shipping",
    label: "Shipping",
    value: data.summary.orders.shipping,
    tone: "violet" as const,
  },
  {
    key: "completed",
    label: "Completed",
    value: data.summary.orders.completed,
    tone: "emerald" as const,
  },
  {
    key: "cancelled",
    label: "Cancelled",
    value: data.summary.orders.cancelled,
    tone: "red" as const,
  },
];

export const getFulfillmentDistribution = (data: DashboardData) => [
  {
    key: "pickup",
    label: "Pickup",
    value: data.summary.orders.pickup,
    tone: "blue" as const,
  },
  {
    key: "delivery",
    label: "Delivery",
    value: data.summary.orders.delivery,
    tone: "emerald" as const,
  },
];

export const getSystemHealthMetricBars = (
  data: DashboardData,
): DashboardMetricBarItem[] => [
  {
    key: "active-branches",
    label: "Chi nhánh active",
    value: data.summary.branches.active,
    tone: "emerald",
    icon: Building2,
  },
  {
    key: "active-promotions",
    label: "Khuyến mãi active",
    value: data.summary.promotions.activePromotions,
    tone: "violet",
    icon: Megaphone,
  },
  {
    key: "pending-reviews",
    label: "Review cần phản hồi",
    value: data.summary.reviews.pendingReviewProducts,
    tone: "red",
    icon: Star,
  },
  {
    key: "inactive-shipping",
    label: "Shipping inactive",
    value:
      data.summary.shipping.inactiveServiceAreas +
      data.summary.shipping.inactiveBranchDeliverySlots +
      data.summary.shipping.inactiveCapacityRecords,
    tone: "amber",
    icon: Truck,
  },
  {
    key: "inventory-risk",
    label: "Tồn kho rủi ro",
    value:
      data.summary.inventory.lowStockCount +
      data.summary.inventory.outOfStockCount,
    tone: "red",
    icon: Boxes,
  },
  {
    key: "internal-issues",
    label: "Vấn đề nhân sự",
    value:
      data.summary.users.internalNoBranches +
      data.summary.users.internalMissingPrimary,
    tone: "violet",
    icon: Users,
  },
];

export const getBranchOpsMetricBars = (
  data: DashboardData,
): DashboardMetricBarItem[] => [
  {
    key: "net-revenue",
    label: "Doanh thu ròng",
    value: data.summary.orders.netRevenue,
    tone: "emerald",
    format: "currency",
    icon: ShoppingCart,
  },
  {
    key: "unpaid-orders",
    label: "Đơn chưa thanh toán",
    value: data.summary.orders.unpaidActive,
    tone: "red",
    icon: AlertCircle,
  },
  {
    key: "available-qty",
    label: "Tồn khả dụng",
    value: data.summary.inventory.availableQuantity,
    tone: "blue",
    icon: Boxes,
  },
  {
    key: "active-slots",
    label: "Khung giao hàng active",
    value: data.summary.shipping.activeBranchDeliverySlots,
    tone: "violet",
    icon: Truck,
  },
];

export const filterQuickLinksByVisibility = (data: DashboardData) => {
  const { quickLinks, widgets } = data;

  return quickLinks.filter((link) => {
    switch (link.module) {
      case "orders":
        return widgets.showOrders;
      case "inventory":
        return widgets.showInventory;
      case "users":
        return widgets.showUsers;
      case "branches":
        return widgets.showBranches;
      case "shipping":
        return widgets.showShipping;
      case "promotions":
        return widgets.showPromotions;
      case "reviews":
        return widgets.showReviews;
      case "content":
        return widgets.showContent;
      default:
        return true;
    }
  });
};
