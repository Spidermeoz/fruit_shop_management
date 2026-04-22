import { Op } from "sequelize";
import type { DashboardRepository } from "../../domain/dashboard/DashboardRepository";
import type {
  DashboardAlert,
  DashboardBranchPerformanceItem,
  DashboardData,
  DashboardFilters,
  DashboardOrdersSummary,
  DashboardQueryInput,
  DashboardQuickLink,
} from "../../domain/dashboard/types";

type DashboardModels = {
  Order?: any;
  InventoryStock?: any;
  Product?: any;
  ProductVariant?: any;
  User?: any;
  UserBranch?: any;
  Branch?: any;
  ShippingZone?: any;
  BranchServiceArea?: any;
  BranchDeliveryTimeSlot?: any;
  BranchDeliverySlotCapacity?: any;
  Promotion?: any;
  PromotionUsage?: any;
  ProductReview?: any;
  Post?: any;
  PostCategory?: any;
  PostTag?: any;
};

type BranchLite = {
  id: number;
  name: string;
  code: string | null;
  status: string;
  supportsPickup: boolean;
  supportsDelivery: boolean;
  addressLine1: string | null;
  district: string | null;
  province: string | null;
  latitude: number | null;
  longitude: number | null;
};

type InventoryLite = {
  branchId: number;
  productId: number;
  variantId: number;
  quantity: number;
  reservedQuantity: number;
  availableQuantity: number;
};

const startOfDay = (date: Date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

const endOfDay = (date: Date) => {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
};

const toNumber = (value: any, fallback = 0): number => {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};

const toBool = (value: any): boolean =>
  value === true || value === 1 || value === "1";

const uniqueNumbers = (items: number[]) => Array.from(new Set(items));

const emptyOrdersSummary = (): DashboardOrdersSummary => ({
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
});

export class SequelizeDashboardRepository implements DashboardRepository {
  constructor(private readonly models: DashboardModels) {}

  async getAdminDashboard(input: DashboardQueryInput): Promise<DashboardData> {
    const filters: DashboardFilters = {
      range: input.range,
      from: input.from.toISOString(),
      to: input.to.toISOString(),
      branchId: input.resolvedBranchId,
    };

    const scopedBranchIds = await this.resolveScopedBranchIds(input);

    const [
      branches,
      orderRows,
      inventoryRows,
      userRows,
      serviceAreaRows,
      branchSlotRows,
      capacityRows,
      shippingZonesSummary,
      promotionsSummary,
      reviewsSummary,
      contentSummary,
    ] = await Promise.all([
      this.loadBranches(scopedBranchIds),
      this.loadOrderRows(scopedBranchIds, input.from, input.to),
      this.loadInventoryRows(scopedBranchIds),
      this.loadUsers(scopedBranchIds),
      this.loadBranchServiceAreas(scopedBranchIds),
      this.loadBranchDeliveryTimeSlots(scopedBranchIds),
      this.loadBranchDeliverySlotCapacities(
        scopedBranchIds,
        input.from,
        input.to,
      ),
      this.loadShippingZonesSummary(),
      this.loadPromotionsSummary(scopedBranchIds, input.from, input.to),
      this.loadReviewsSummary(),
      this.loadContentSummary(),
    ]);

    const ordersSummary = this.computeOrdersSummary(orderRows);
    const inventorySummary = this.computeInventorySummary(inventoryRows);
    const usersSummary = this.computeUsersSummary(userRows, input.from);
    const branchesSummary = this.computeBranchesSummary(
      branches,
      serviceAreaRows,
      branchSlotRows,
    );
    const shippingSummary = this.computeShippingSummary(
      shippingZonesSummary,
      serviceAreaRows,
      branchSlotRows,
      capacityRows,
    );

    const branchPerformance = this.computeBranchPerformance({
      branches,
      orderRows,
      inventoryRows,
      userRows,
      serviceAreaRows,
      branchSlotRows,
      capacityRows,
      scopeMode: input.scopeMode,
      resolvedBranchId: input.resolvedBranchId,
    });

    const alerts = this.buildAlerts({
      input,
      ordersSummary,
      inventorySummary,
      usersSummary,
      branchesSummary,
      shippingSummary,
      promotionsSummary,
      reviewsSummary,
      branchPerformance,
    });

    const quickLinks = this.buildQuickLinks(input.resolvedBranchId);

    return {
      viewer: {
        userId: input.actorUserId,
        roleId: input.actorRoleId,
        tier: input.tier,
        scopeMode: input.scopeMode,
        requestedBranchId: input.requestedBranchId,
        resolvedBranchId: input.resolvedBranchId,
        currentBranchId: input.currentBranchId,
        allowedBranchIds: input.allowedBranchIds,
        permissions: input.permissions,
      },
      filters,
      widgets: input.widgets,
      summary: {
        orders: ordersSummary,
        inventory: inventorySummary,
        users: usersSummary,
        branches: branchesSummary,
        shipping: shippingSummary,
        promotions: promotionsSummary,
        reviews: reviewsSummary,
        content: contentSummary,
      },
      branchPerformance,
      alerts,
      quickLinks,
    };
  }

  private async resolveScopedBranchIds(input: DashboardQueryInput) {
    const Branch = this.models.Branch;
    if (!Branch) return [];

    if (input.scopeMode !== "system") {
      if (input.resolvedBranchId) {
        return [input.resolvedBranchId];
      }

      if (input.allowedBranchIds.length > 0) {
        return uniqueNumbers(input.allowedBranchIds);
      }

      return [];
    }

    if (input.allowedBranchIds.length > 0) {
      return uniqueNumbers(input.allowedBranchIds);
    }

    const rows = await Branch.findAll({
      where: { deleted: 0 },
      attributes: ["id"],
      raw: true,
    });

    return uniqueNumbers(rows.map((r: any) => Number(r.id)));
  }

  private async loadBranches(branchIds: number[]): Promise<BranchLite[]> {
    const Branch = this.models.Branch;
    if (!Branch) return [];

    const where: any = { deleted: 0 };
    if (branchIds.length > 0) {
      where.id = { [Op.in]: branchIds };
    }

    const rows = await Branch.findAll({
      where,
      attributes: [
        "id",
        "name",
        "code",
        "status",
        "supports_pickup",
        "supports_delivery",
        "address_line1",
        "district",
        "province",
        "latitude",
        "longitude",
      ],
      order: [["id", "ASC"]],
      raw: true,
    });

    return rows.map((r: any) => ({
      id: Number(r.id),
      name: String(r.name ?? ""),
      code: r.code ?? null,
      status: String(r.status ?? "inactive"),
      supportsPickup: toBool(r.supports_pickup),
      supportsDelivery: toBool(r.supports_delivery),
      addressLine1: r.address_line1 ?? null,
      district: r.district ?? null,
      province: r.province ?? null,
      latitude:
        r.latitude !== null && r.latitude !== undefined
          ? Number(r.latitude)
          : null,
      longitude:
        r.longitude !== null && r.longitude !== undefined
          ? Number(r.longitude)
          : null,
    }));
  }

  private async loadOrderRows(branchIds: number[], from: Date, to: Date) {
    const Order = this.models.Order;
    if (!Order) return [];

    const where: any = {
      deleted: 0,
      created_at: {
        [Op.gte]: startOfDay(from),
        [Op.lte]: endOfDay(to),
      },
    };

    if (branchIds.length > 0) {
      where.branch_id = { [Op.in]: branchIds };
    }

    return Order.findAll({
      where,
      attributes: [
        "id",
        "branch_id",
        "status",
        "payment_status",
        "fulfillment_type",
        "total_price",
        "shipping_fee",
        "discount_amount",
        "shipping_discount_amount",
      ],
      raw: true,
    });
  }

  private async loadInventoryRows(
    branchIds: number[],
  ): Promise<InventoryLite[]> {
    const InventoryStock = this.models.InventoryStock;
    const ProductVariant = this.models.ProductVariant;
    const Product = this.models.Product;

    if (!InventoryStock || !ProductVariant || !Product) return [];

    const where: any = {};
    if (branchIds.length > 0) {
      where.branch_id = { [Op.in]: branchIds };
    }

    const rows = await InventoryStock.findAll({
      where,
      attributes: [
        "branch_id",
        "product_variant_id",
        "quantity",
        "reserved_quantity",
      ],
      include: [
        {
          model: ProductVariant,
          as: "productVariant",
          required: true,
          attributes: ["id", "product_id"],
          include: [
            {
              model: Product,
              as: "product",
              required: true,
              attributes: ["id", "deleted"],
              where: { deleted: 0 },
            },
          ],
        },
      ],
    });

    return rows.map((row: any) => {
      const plain =
        typeof row.get === "function" ? row.get({ plain: true }) : row;
      const quantity = toNumber(plain.quantity);
      const reservedQuantity = toNumber(plain.reserved_quantity);

      return {
        branchId: Number(plain.branch_id),
        productId: Number(plain.productVariant?.product?.id),
        variantId: Number(plain.product_variant_id),
        quantity,
        reservedQuantity,
        availableQuantity: Math.max(0, quantity - reservedQuantity),
      };
    });
  }

  private async loadUsers(branchIds: number[]) {
    const User = this.models.User;
    const UserBranch = this.models.UserBranch;

    if (!User) return [];

    const users = await User.findAll({
      where: { deleted: 0 },
      attributes: ["id", "role_id", "status", "created_at"],
      raw: true,
    });

    const userIds = users.map((u: any) => Number(u.id));
    if (!UserBranch || userIds.length === 0) {
      return users.map((u: any) => ({ ...u, branchAssignments: [] as any[] }));
    }

    const branchWhere: any = {
      user_id: { [Op.in]: userIds },
    };

    if (branchIds.length > 0) {
      branchWhere.branch_id = { [Op.in]: branchIds };
    }

    const assignments = await UserBranch.findAll({
      where: branchWhere,
      attributes: ["user_id", "branch_id", "is_primary"],
      raw: true,
    });

    const map = new Map<number, any[]>();
    for (const row of assignments) {
      const userId = Number(row.user_id);
      const arr = map.get(userId) ?? [];
      arr.push({
        branchId: Number(row.branch_id),
        isPrimary: toBool(row.is_primary),
      });
      map.set(userId, arr);
    }

    return users.map((u: any) => ({
      ...u,
      branchAssignments: map.get(Number(u.id)) ?? [],
    }));
  }

  private async loadBranchServiceAreas(branchIds: number[]) {
    const Model = this.models.BranchServiceArea;
    if (!Model) return [];

    const where: any = { deleted: 0 };
    if (branchIds.length > 0) {
      where.branch_id = { [Op.in]: branchIds };
    }

    return Model.findAll({
      where,
      attributes: ["id", "branch_id", "status"],
      raw: true,
    });
  }

  private async loadBranchDeliveryTimeSlots(branchIds: number[]) {
    const Model = this.models.BranchDeliveryTimeSlot;
    if (!Model) return [];

    const where: any = { deleted: 0 };
    if (branchIds.length > 0) {
      where.branch_id = { [Op.in]: branchIds };
    }

    return Model.findAll({
      where,
      attributes: ["id", "branch_id", "status"],
      raw: true,
    });
  }

  private async loadBranchDeliverySlotCapacities(
    branchIds: number[],
    from: Date,
    to: Date,
  ) {
    const Model = this.models.BranchDeliverySlotCapacity;
    if (!Model) return [];

    const where: any = {
      delivery_date: {
        [Op.gte]: startOfDay(from),
        [Op.lte]: endOfDay(to),
      },
    };

    if (branchIds.length > 0) {
      where.branch_id = { [Op.in]: branchIds };
    }

    return Model.findAll({
      where,
      attributes: ["id", "branch_id", "status", "delivery_date"],
      raw: true,
    });
  }

  private async loadShippingZonesSummary() {
    const Model = this.models.ShippingZone;
    if (!Model) {
      return {
        totalZones: 0,
        activeZones: 0,
      };
    }

    const rows = await Model.findAll({
      where: { deleted: 0 },
      attributes: ["id", "status"],
      raw: true,
    });

    return {
      totalZones: rows.length,
      activeZones: rows.filter((r: any) => r.status === "active").length,
    };
  }

  private async loadPromotionsSummary(
    scopedBranchIds: number[],
    from: Date,
    to: Date,
  ) {
    const Promotion = this.models.Promotion;
    const PromotionUsage = this.models.PromotionUsage;
    if (!Promotion) {
      return {
        totalPromotions: 0,
        activePromotions: 0,
        autoApplyPromotions: 0,
        endingSoonCount: 0,
        recentUsageCount: 0,
      };
    }

    const rows = await Promotion.findAll({
      where: { deleted: 0 },
      attributes: [
        "id",
        "status",
        "is_auto_apply",
        "end_at",
        "promotion_scope",
      ],
      raw: true,
    });

    const now = new Date();
    const endingSoonThreshold = new Date(now);
    endingSoonThreshold.setDate(endingSoonThreshold.getDate() + 3);

    let recentUsageCount = 0;
    if (PromotionUsage) {
      recentUsageCount = await PromotionUsage.count({
        where: {
          created_at: {
            [Op.gte]: startOfDay(from),
            [Op.lte]: endOfDay(to),
          },
        },
      });
    }

    return {
      totalPromotions: rows.length,
      activePromotions: rows.filter((r: any) => r.status === "active").length,
      autoApplyPromotions: rows.filter((r: any) => toBool(r.is_auto_apply))
        .length,
      endingSoonCount: rows.filter((r: any) => {
        if (!r.end_at) return false;
        const endAt = new Date(r.end_at);
        return endAt >= now && endAt <= endingSoonThreshold;
      }).length,
      recentUsageCount,
    };
  }

  private async loadReviewsSummary() {
    const ProductReview = this.models.ProductReview;
    if (!ProductReview) {
      return { pendingReviewProducts: 0 };
    }

    const rows = await ProductReview.findAll({
      attributes: ["product_id"],
      where: {
        parent_id: null,
        status: "approved",
        id: {
          [Op.notIn]: this.models.ProductReview.sequelize.literal(`
            (
              SELECT DISTINCT child.parent_id
              FROM product_reviews AS child
              WHERE child.parent_id IS NOT NULL
            )
          `),
        },
      },
      group: ["product_id"],
      raw: true,
    });

    return {
      pendingReviewProducts: rows.length,
    };
  }

  private async loadContentSummary() {
    const Post = this.models.Post;
    const PostCategory = this.models.PostCategory;
    const PostTag = this.models.PostTag;

    const [postRows, postCategoryRows, postTagRows] = await Promise.all([
      Post
        ? Post.findAll({
            where: { deleted: 0 },
            attributes: ["id", "status"],
            raw: true,
          })
        : Promise.resolve([]),
      PostCategory
        ? PostCategory.findAll({
            where: { deleted: 0 },
            attributes: ["id"],
            raw: true,
          })
        : Promise.resolve([]),
      PostTag
        ? PostTag.findAll({
            where: { deleted: 0 },
            attributes: ["id"],
            raw: true,
          })
        : Promise.resolve([]),
    ]);

    return {
      totalPosts: postRows.length,
      activePosts: postRows.filter((r: any) => r.status === "active").length,
      inactivePosts: postRows.filter((r: any) => r.status !== "active").length,
      totalPostCategories: postCategoryRows.length,
      totalPostTags: postTagRows.length,
    };
  }

  private computeOrdersSummary(rows: any[]): DashboardOrdersSummary {
    const summary = emptyOrdersSummary();

    for (const row of rows) {
      const status = String(row.status ?? "");
      const paymentStatus = String(row.payment_status ?? "");
      const fulfillmentType = String(row.fulfillment_type ?? "");

      summary.totalOrders += 1;

      if (status === "pending") summary.pending += 1;
      if (status === "processing") summary.processing += 1;
      if (status === "shipping") summary.shipping += 1;
      if (status === "delivered") summary.delivered += 1;
      if (status === "completed") summary.completed += 1;
      if (status === "cancelled") summary.cancelled += 1;

      if (paymentStatus === "paid") summary.paid += 1;
      if (paymentStatus !== "paid" && status !== "cancelled") {
        summary.unpaidActive += 1;
      }

      if (fulfillmentType === "pickup") summary.pickup += 1;
      if (fulfillmentType === "delivery") summary.delivery += 1;

      const gross = toNumber(row.total_price);
      const net =
        toNumber(row.total_price) +
        toNumber(row.shipping_fee) -
        toNumber(row.discount_amount) -
        toNumber(row.shipping_discount_amount);

      summary.grossRevenue += gross;
      summary.netRevenue += net;
    }

    return summary;
  }

  private computeInventorySummary(rows: InventoryLite[]) {
    const productIds = new Set<number>();
    const variantIds = new Set<number>();

    let totalQuantity = 0;
    let reservedQuantity = 0;
    let availableQuantity = 0;
    let lowStockCount = 0;
    let outOfStockCount = 0;

    for (const row of rows) {
      productIds.add(row.productId);
      variantIds.add(row.variantId);

      totalQuantity += row.quantity;
      reservedQuantity += row.reservedQuantity;
      availableQuantity += row.availableQuantity;

      if (row.availableQuantity <= 0) outOfStockCount += 1;
      else if (row.availableQuantity <= 10) lowStockCount += 1;
    }

    return {
      totalProducts: productIds.size,
      totalVariants: variantIds.size,
      totalStockRows: rows.length,
      totalQuantity,
      reservedQuantity,
      availableQuantity,
      lowStockCount,
      outOfStockCount,
    };
  }

  private computeUsersSummary(rows: any[], from: Date) {
    let totalCustomers = 0;
    let totalInternal = 0;
    let inactiveUsers = 0;
    let recentUsers = 0;
    let internalNoBranches = 0;
    let internalMissingPrimary = 0;

    const fromDate = startOfDay(from);

    for (const row of rows) {
      const isInternal = row.role_id !== null && row.role_id !== undefined;
      const createdAt = row.created_at ? new Date(row.created_at) : null;
      const assignments = Array.isArray(row.branchAssignments)
        ? row.branchAssignments
        : [];

      if (isInternal) totalInternal += 1;
      else totalCustomers += 1;

      if (String(row.status ?? "") === "inactive") inactiveUsers += 1;
      if (createdAt && createdAt >= fromDate) recentUsers += 1;

      if (isInternal) {
        if (assignments.length === 0) {
          internalNoBranches += 1;
        } else if (!assignments.some((a: any) => a.isPrimary === true)) {
          internalMissingPrimary += 1;
        }
      }
    }

    return {
      totalUsers: rows.length,
      totalCustomers,
      totalInternal,
      inactiveUsers,
      recentUsers,
      internalNoBranches,
      internalMissingPrimary,
    };
  }

  private computeBranchesSummary(
    branches: BranchLite[],
    serviceAreaRows: any[],
    branchSlotRows: any[],
  ) {
    let active = 0;
    let inactive = 0;
    let pickupOnly = 0;
    let deliveryEnabled = 0;
    let hybrid = 0;
    let needsSetup = 0;

    const activeServiceAreaSet = new Set<number>();
    const activeBranchSlotSet = new Set<number>();

    for (const row of serviceAreaRows) {
      if (String(row.status ?? "") === "active") {
        activeServiceAreaSet.add(Number(row.branch_id));
      }
    }

    for (const row of branchSlotRows) {
      if (String(row.status ?? "") === "active") {
        activeBranchSlotSet.add(Number(row.branch_id));
      }
    }

    for (const branch of branches) {
      if (branch.status === "active") active += 1;
      else inactive += 1;

      if (branch.supportsPickup && branch.supportsDelivery) hybrid += 1;
      else if (branch.supportsPickup && !branch.supportsDelivery)
        pickupOnly += 1;

      if (branch.supportsDelivery) deliveryEnabled += 1;

      const hasFullAddress = Boolean(
        branch.addressLine1 && branch.district && branch.province,
      );
      const hasCoordinates = Boolean(branch.latitude && branch.longitude);

      const branchNeedsSetup =
        !branch.supportsPickup && !branch.supportsDelivery
          ? true
          : branch.supportsDelivery &&
            (!hasFullAddress ||
              !hasCoordinates ||
              !activeServiceAreaSet.has(branch.id) ||
              !activeBranchSlotSet.has(branch.id));

      if (branchNeedsSetup) needsSetup += 1;
    }

    return {
      total: branches.length,
      active,
      inactive,
      pickupOnly,
      deliveryEnabled,
      hybrid,
      needsSetup,
    };
  }

  private computeShippingSummary(
    shippingZonesSummary: { totalZones: number; activeZones: number },
    serviceAreaRows: any[],
    branchSlotRows: any[],
    capacityRows: any[],
  ) {
    return {
      totalZones: shippingZonesSummary.totalZones,
      activeZones: shippingZonesSummary.activeZones,
      totalServiceAreas: serviceAreaRows.length,
      activeServiceAreas: serviceAreaRows.filter(
        (x) => String(x.status ?? "") === "active",
      ).length,
      inactiveServiceAreas: serviceAreaRows.filter(
        (x) => String(x.status ?? "") !== "active",
      ).length,
      totalBranchDeliverySlots: branchSlotRows.length,
      activeBranchDeliverySlots: branchSlotRows.filter(
        (x) => String(x.status ?? "") === "active",
      ).length,
      inactiveBranchDeliverySlots: branchSlotRows.filter(
        (x) => String(x.status ?? "") !== "active",
      ).length,
      totalCapacityRecords: capacityRows.length,
      activeCapacityRecords: capacityRows.filter(
        (x) => String(x.status ?? "") === "active",
      ).length,
      inactiveCapacityRecords: capacityRows.filter(
        (x) => String(x.status ?? "") !== "active",
      ).length,
    };
  }

  private computeBranchPerformance(args: {
    branches: BranchLite[];
    orderRows: any[];
    inventoryRows: InventoryLite[];
    userRows: any[];
    serviceAreaRows: any[];
    branchSlotRows: any[];
    capacityRows: any[];
    scopeMode: string;
    resolvedBranchId: number | null;
  }): DashboardBranchPerformanceItem[] {
    const {
      branches,
      orderRows,
      inventoryRows,
      userRows,
      serviceAreaRows,
      branchSlotRows,
      capacityRows,
      scopeMode,
      resolvedBranchId,
    } = args;

    const items: DashboardBranchPerformanceItem[] = [];

    for (const branch of branches) {
      const branchOrders = orderRows.filter(
        (row) => Number(row.branch_id) === branch.id,
      );

      const branchInventory = inventoryRows.filter(
        (row) => row.branchId === branch.id,
      );

      const branchUsers = userRows.filter((row) =>
        Array.isArray(row.branchAssignments)
          ? row.branchAssignments.some(
              (a: any) => Number(a.branchId) === branch.id,
            )
          : false,
      );

      const branchServiceAreas = serviceAreaRows.filter(
        (row) => Number(row.branch_id) === branch.id,
      );
      const branchSlots = branchSlotRows.filter(
        (row) => Number(row.branch_id) === branch.id,
      );
      const branchCapacities = capacityRows.filter(
        (row) => Number(row.branch_id) === branch.id,
      );

      const orderSummary = this.computeOrdersSummary(branchOrders);
      const lowStockCount = branchInventory.filter(
        (row) => row.availableQuantity > 0 && row.availableQuantity <= 10,
      ).length;
      const outOfStockCount = branchInventory.filter(
        (row) => row.availableQuantity <= 0,
      ).length;

      const activeServiceAreas = branchServiceAreas.filter(
        (x) => String(x.status ?? "") === "active",
      ).length;
      const inactiveServiceAreas =
        branchServiceAreas.length - activeServiceAreas;

      const activeBranchDeliverySlots = branchSlots.filter(
        (x) => String(x.status ?? "") === "active",
      ).length;
      const inactiveBranchDeliverySlots =
        branchSlots.length - activeBranchDeliverySlots;

      const activeCapacityRecords = branchCapacities.filter(
        (x) => String(x.status ?? "") === "active",
      ).length;
      const inactiveCapacityRecords =
        branchCapacities.length - activeCapacityRecords;

      const healthSignals: string[] = [];

      const hasFullAddress = Boolean(
        branch.addressLine1 && branch.district && branch.province,
      );
      const hasCoordinates = Boolean(branch.latitude && branch.longitude);

      if (branch.supportsDelivery && !hasFullAddress) {
        healthSignals.push("Thiếu địa chỉ giao hàng");
      }
      if (branch.supportsDelivery && !hasCoordinates) {
        healthSignals.push("Thiếu tọa độ");
      }
      if (branch.supportsDelivery && activeServiceAreas === 0) {
        healthSignals.push("Chưa có service area hoạt động");
      }
      if (branch.supportsDelivery && activeBranchDeliverySlots === 0) {
        healthSignals.push("Chưa có delivery slot branch hoạt động");
      }
      if (outOfStockCount > 0) {
        healthSignals.push("Có biến thể hết hàng");
      }
      if (orderSummary.unpaidActive > 0) {
        healthSignals.push("Có đơn chưa thanh toán");
      }

      let healthStatus: "healthy" | "warning" | "critical" = "healthy";
      if (
        branch.supportsDelivery &&
        (!hasFullAddress || !hasCoordinates || activeServiceAreas === 0)
      ) {
        healthStatus = "critical";
      } else if (
        healthSignals.length > 0 ||
        inactiveBranchDeliverySlots > 0 ||
        lowStockCount > 0
      ) {
        healthStatus = "warning";
      }

      items.push({
        branchId: branch.id,
        branchName: branch.name,
        branchCode: branch.code,
        branchStatus: branch.status,

        totalOrders: orderSummary.totalOrders,
        pendingOrders: orderSummary.pending,
        unpaidActiveOrders: orderSummary.unpaidActive,
        netRevenue: orderSummary.netRevenue,

        lowStockCount,
        outOfStockCount,

        activeServiceAreas,
        inactiveServiceAreas,

        activeBranchDeliverySlots,
        inactiveBranchDeliverySlots,

        activeCapacityRecords,
        inactiveCapacityRecords,

        internalUsers: branchUsers.filter(
          (u) => u.role_id !== null && u.role_id !== undefined,
        ).length,

        healthStatus,
        healthSignals,
      });
    }

    if (scopeMode === "system") {
      return items.sort((a, b) => {
        const scoreA =
          a.healthStatus === "critical"
            ? 3
            : a.healthStatus === "warning"
              ? 2
              : 1;
        const scoreB =
          b.healthStatus === "critical"
            ? 3
            : b.healthStatus === "warning"
              ? 2
              : 1;
        if (scoreA !== scoreB) return scoreB - scoreA;
        return b.netRevenue - a.netRevenue;
      });
    }

    if (resolvedBranchId) {
      return items.filter((x) => x.branchId === resolvedBranchId);
    }

    return items;
  }

  private buildAlerts(args: {
    input: DashboardQueryInput;
    ordersSummary: any;
    inventorySummary: any;
    usersSummary: any;
    branchesSummary: any;
    shippingSummary: any;
    promotionsSummary: any;
    reviewsSummary: any;
    branchPerformance: DashboardBranchPerformanceItem[];
  }): DashboardAlert[] {
    const {
      input,
      ordersSummary,
      inventorySummary,
      usersSummary,
      branchesSummary,
      shippingSummary,
      promotionsSummary,
      reviewsSummary,
      branchPerformance,
    } = args;

    const alerts: DashboardAlert[] = [];

    if (usersSummary.internalNoBranches > 0) {
      alerts.push({
        id: "users-no-branches",
        severity: "critical",
        category: "users",
        title: "Nhân sự thiếu branch scope",
        message: `${usersSummary.internalNoBranches} tài khoản nội bộ chưa được gán chi nhánh.`,
        href: "/admin/users?type=internal&smartFilter=no-branches",
      });
    }

    if (usersSummary.internalMissingPrimary > 0) {
      alerts.push({
        id: "users-missing-primary",
        severity: "warning",
        category: "users",
        title: "Thiếu primary branch",
        message: `${usersSummary.internalMissingPrimary} nhân sự chưa có primary branch hợp lệ.`,
        href: "/admin/users?type=internal&smartFilter=missing-primary",
      });
    }

    if (branchesSummary.needsSetup > 0) {
      alerts.push({
        id: "branches-needs-setup",
        severity: "warning",
        category: "branches",
        title: "Chi nhánh cần hoàn thiện setup",
        message: `${branchesSummary.needsSetup} chi nhánh đang thiếu dữ liệu hoặc cấu hình vận hành.`,
        href: "/admin/branches",
      });
    }

    if (inventorySummary.outOfStockCount > 0) {
      alerts.push({
        id: "inventory-out-of-stock",
        severity: "critical",
        category: "inventory",
        title: "Biến thể hết hàng",
        message: `${inventorySummary.outOfStockCount} biến thể đang hết hàng trong scope hiện tại.`,
        href: input.resolvedBranchId
          ? `/admin/inventory?branchId=${input.resolvedBranchId}`
          : "/admin/inventory",
      });
    }

    if (inventorySummary.lowStockCount > 0) {
      alerts.push({
        id: "inventory-low-stock",
        severity: "warning",
        category: "inventory",
        title: "Tồn kho thấp",
        message: `${inventorySummary.lowStockCount} biến thể đang ở mức tồn kho thấp.`,
        href: input.resolvedBranchId
          ? `/admin/inventory?branchId=${input.resolvedBranchId}`
          : "/admin/inventory",
      });
    }

    if (ordersSummary.unpaidActive > 0) {
      alerts.push({
        id: "orders-unpaid-active",
        severity: "warning",
        category: "orders",
        title: "Đơn chưa thanh toán",
        message: `${ordersSummary.unpaidActive} đơn chưa thanh toán nhưng vẫn đang hoạt động.`,
        href: input.resolvedBranchId
          ? `/admin/orders?branchId=${input.resolvedBranchId}`
          : "/admin/orders",
      });
    }

    if (shippingSummary.inactiveServiceAreas > 0) {
      alerts.push({
        id: "shipping-inactive-service-areas",
        severity: "warning",
        category: "shipping",
        title: "Service area đang tắt",
        message: `${shippingSummary.inactiveServiceAreas} cấu hình service area đang inactive.`,
        href: "/admin/shipping/service-areas",
      });
    }

    if (shippingSummary.inactiveBranchDeliverySlots > 0) {
      alerts.push({
        id: "shipping-inactive-branch-slots",
        severity: "warning",
        category: "shipping",
        title: "Khung giờ giao hàng theo branch đang tắt",
        message: `${shippingSummary.inactiveBranchDeliverySlots} cấu hình khung giờ theo branch đang inactive.`,
        href: "/admin/shipping/branch-delivery-slots",
      });
    }

    if (promotionsSummary.endingSoonCount > 0) {
      alerts.push({
        id: "promotions-ending-soon",
        severity: "info",
        category: "promotions",
        title: "Khuyến mãi sắp kết thúc",
        message: `${promotionsSummary.endingSoonCount} khuyến mãi sẽ kết thúc trong 3 ngày tới.`,
        href: "/admin/promotions",
      });
    }

    if (reviewsSummary.pendingReviewProducts > 0) {
      alerts.push({
        id: "reviews-pending",
        severity: "info",
        category: "reviews",
        title: "Review chưa phản hồi",
        message: `${reviewsSummary.pendingReviewProducts} sản phẩm đang có review chưa được phản hồi.`,
        href: "/admin/notifications?category=review",
      });
    }

    for (const item of branchPerformance.slice(0, 3)) {
      if (item.healthStatus === "critical") {
        alerts.push({
          id: `branch-critical-${item.branchId}`,
          severity: "critical",
          category: "branches",
          title: `Chi nhánh ${item.branchName} có cảnh báo nghiêm trọng`,
          message: item.healthSignals.join("; "),
          branchId: item.branchId,
          href: `/admin/branches/edit/${item.branchId}`,
        });
      }
    }

    return alerts.slice(0, 12);
  }

  private buildQuickLinks(branchId: number | null): DashboardQuickLink[] {
    const withBranch = (href: string) => {
      if (!branchId) return href;
      return href.includes("?")
        ? `${href}&branchId=${branchId}`
        : `${href}?branchId=${branchId}`;
    };

    return [
      {
        key: "orders",
        label: "Orders Workspace",
        href: withBranch("/admin/orders"),
        module: "orders",
      },
      {
        key: "inventory",
        label: "Inventory Workspace",
        href: withBranch("/admin/inventory"),
        module: "inventory",
      },
      {
        key: "users",
        label: "Users Hub",
        href: withBranch("/admin/users/hub"),
        module: "users",
      },
      {
        key: "branches",
        label: "Branches Board",
        href: "/admin/branches",
        module: "branches",
      },
      {
        key: "shipping",
        label: "Shipping Overview",
        href: withBranch("/admin/shipping"),
        module: "shipping",
      },
      {
        key: "promotions",
        label: "Promotions",
        href: "/admin/promotions",
        module: "promotions",
      },
      {
        key: "reviews",
        label: "Reviews",
        href: "/admin/notifications?category=review",
        module: "reviews",
      },
      {
        key: "content",
        label: "Content",
        href: "/admin/content/posts",
        module: "content",
      },
    ];
  }
}
