import type { DashboardRepository } from "../../../domain/dashboard/DashboardRepository";
import type {
  DashboardPermission,
  DashboardQueryInput,
  DashboardRange,
  DashboardScopeMode,
  DashboardTier,
  DashboardWidgetVisibility,
} from "../../../domain/dashboard/types";

type PermissionMap = Record<string, string[]>;

type ActorLike = {
  id?: number | null;
  roleId?: number | null;
  role_id?: number | null;
  roleCode?: string | null;
  role_code?: string | null;
  roleName?: string | null;
  role_name?: string | null;
  isSuperAdmin?: boolean | null;
  is_super_admin?: boolean | null;
  currentBranchId?: number | null;
  current_branch_id?: number | null;
  branchIds?: number[];
  branch_ids?: number[];
  permissions?:
    | Array<string | { module?: string; action?: string }>
    | PermissionMap
    | null;
};

type ExecuteInput = {
  actor: ActorLike;
  branchId?: number | null;
  range?: DashboardRange;
};

const uniqNums = (value: unknown): number[] => {
  if (!Array.isArray(value)) return [];
  return Array.from(
    new Set(
      value.map((x) => Number(x)).filter((x) => Number.isFinite(x) && x > 0),
    ),
  );
};

const normalizePermissions = (
  permissions?:
    | Array<string | { module?: string; action?: string }>
    | PermissionMap
    | null,
): DashboardPermission[] => {
  const out = new Map<string, DashboardPermission>();

  const add = (moduleValue: unknown, actionValue: unknown) => {
    const module = String(moduleValue ?? "")
      .trim()
      .toLowerCase();
    const action = String(actionValue ?? "")
      .trim()
      .toLowerCase();

    if (!module || !action) return;

    const key = `${module}.${action}`;
    out.set(key, { module, action, key });
  };

  if (Array.isArray(permissions)) {
    for (const item of permissions) {
      if (typeof item === "string") {
        const raw = item.trim().toLowerCase();
        if (!raw) continue;

        const [module, action] = raw.split(".");
        if (!module || !action) continue;

        add(module, action);
        continue;
      }

      add(item?.module, item?.action);
    }
  } else if (permissions && typeof permissions === "object") {
    for (const [module, actions] of Object.entries(permissions)) {
      if (!Array.isArray(actions)) continue;

      for (const action of actions) {
        add(module, action);
      }
    }
  }

  return Array.from(out.values());
};

const hasPermission = (
  permissions: DashboardPermission[],
  module: string,
  action?: string,
): boolean => {
  const normalizedModule = module.trim().toLowerCase();
  const normalizedAction = action?.trim().toLowerCase();

  return permissions.some((p) => {
    if (p.module !== normalizedModule) return false;
    if (!normalizedAction) return true;
    return p.action === normalizedAction;
  });
};

const resolveExplicitSuperAdminFlag = (actor: ActorLike): boolean => {
  if (actor.isSuperAdmin === true || actor.is_super_admin === true) {
    return true;
  }

  const roleCode = String(actor.roleCode ?? actor.role_code ?? "")
    .trim()
    .toLowerCase();
  const roleName = String(actor.roleName ?? actor.role_name ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_");

  return (
    roleCode === "super_admin" ||
    roleCode === "superadmin" ||
    roleName === "super_admin" ||
    roleName === "superadmin"
  );
};

const inferSuperAdminByCoverage = (
  permissions: DashboardPermission[],
): boolean => {
  if (permissions.length === 0) return false;

  return (
    hasPermission(permissions, "order", "view") &&
    hasPermission(permissions, "inventory", "view") &&
    hasPermission(permissions, "user", "view") &&
    hasPermission(permissions, "branch", "view") &&
    (hasPermission(permissions, "shipping_zone", "view") ||
      hasPermission(permissions, "branch_service_area", "view") ||
      hasPermission(permissions, "delivery_time_slot", "view") ||
      hasPermission(permissions, "branch_delivery_time_slot", "view") ||
      hasPermission(permissions, "branch_delivery_slot_capacity", "view")) &&
    hasPermission(permissions, "promotion", "view") &&
    hasPermission(permissions, "review", "view") &&
    (hasPermission(permissions, "post", "view") ||
      hasPermission(permissions, "post_category", "view") ||
      hasPermission(permissions, "post_tag", "view"))
  );
};

const isSuperAdminActor = (
  actor: ActorLike,
  permissions: DashboardPermission[],
): boolean => {
  return (
    resolveExplicitSuperAdminFlag(actor) ||
    inferSuperAdminByCoverage(permissions)
  );
};

const computeWidgets = (
  isSuperAdmin: boolean,
  permissions: DashboardPermission[],
): DashboardWidgetVisibility => {
  if (isSuperAdmin) {
    return {
      showOrders: true,
      showInventory: true,
      showUsers: true,
      showBranches: true,
      showShipping: true,
      showPromotions: true,
      showReviews: true,
      showContent: true,
    };
  }

  const showOrders =
    hasPermission(permissions, "order", "view") ||
    hasPermission(permissions, "order", "update_status") ||
    hasPermission(permissions, "order", "add_history") ||
    hasPermission(permissions, "order", "add_payment");

  const showInventory =
    hasPermission(permissions, "inventory", "view") ||
    hasPermission(permissions, "inventory", "edit");

  const showUsers =
    hasPermission(permissions, "user", "view") ||
    hasPermission(permissions, "user", "create") ||
    hasPermission(permissions, "user", "edit");

  const showBranches =
    hasPermission(permissions, "branch", "view") ||
    hasPermission(permissions, "branch", "edit");

  const showShipping =
    hasPermission(permissions, "shipping_zone", "view") ||
    hasPermission(permissions, "branch_service_area", "view") ||
    hasPermission(permissions, "delivery_time_slot", "view") ||
    hasPermission(permissions, "branch_delivery_time_slot", "view") ||
    hasPermission(permissions, "branch_delivery_slot_capacity", "view");

  const showPromotions =
    hasPermission(permissions, "promotion", "view") ||
    hasPermission(permissions, "promotion", "create") ||
    hasPermission(permissions, "promotion", "edit");

  const showReviews =
    hasPermission(permissions, "review", "view") ||
    hasPermission(permissions, "review", "reply") ||
    hasPermission(permissions, "review", "edit");

  const showContent =
    hasPermission(permissions, "post", "view") ||
    hasPermission(permissions, "post_category", "view") ||
    hasPermission(permissions, "post_tag", "view");

  return {
    showOrders,
    showInventory,
    showUsers,
    showBranches,
    showShipping,
    showPromotions,
    showReviews,
    showContent,
  };
};

const inferTier = (
  isSuperAdmin: boolean,
  branchIds: number[],
  widgets: DashboardWidgetVisibility,
): DashboardTier => {
  if (isSuperAdmin) return "super_admin";

  const adminLikeScore = [
    widgets.showOrders,
    widgets.showInventory,
    widgets.showUsers,
    widgets.showBranches,
    widgets.showShipping,
    widgets.showPromotions,
  ].filter(Boolean).length;

  if (branchIds.length > 0 && adminLikeScore >= 3) {
    return "branch_admin";
  }

  return "branch_staff";
};

const computeScopeMode = (
  tier: DashboardTier,
  resolvedBranchId: number | null,
): DashboardScopeMode => {
  if (tier === "super_admin" && !resolvedBranchId) return "system";
  if (tier === "branch_staff") return "functional";
  return "branch";
};

const buildRangeWindow = (range: DashboardRange): { from: Date; to: Date } => {
  const now = new Date();
  const to = new Date(now);
  const from = new Date(now);

  if (range === "today") {
    from.setHours(0, 0, 0, 0);
    to.setHours(23, 59, 59, 999);
    return { from, to };
  }

  if (range === "7d") {
    from.setDate(from.getDate() - 6);
    from.setHours(0, 0, 0, 0);
    to.setHours(23, 59, 59, 999);
    return { from, to };
  }

  from.setDate(from.getDate() - 29);
  from.setHours(0, 0, 0, 0);
  to.setHours(23, 59, 59, 999);
  return { from, to };
};

export class GetAdminDashboard {
  constructor(private readonly repo: DashboardRepository) {}

  async execute(input: ExecuteInput) {
    const actor = input.actor ?? {};

    const actorUserId = Number(actor.id ?? 0);
    if (!Number.isFinite(actorUserId) || actorUserId <= 0) {
      throw new Error("Phiên đăng nhập không hợp lệ");
    }

    const actorRoleIdRaw = actor.roleId ?? actor.role_id ?? null;
    const actorRoleId =
      actorRoleIdRaw !== null && actorRoleIdRaw !== undefined
        ? Number(actorRoleIdRaw)
        : null;

    const currentBranchIdRaw =
      actor.currentBranchId ?? actor.current_branch_id ?? null;
    const currentBranchId =
      currentBranchIdRaw !== null && currentBranchIdRaw !== undefined
        ? Number(currentBranchIdRaw)
        : null;

    const allowedBranchIds = uniqNums(actor.branchIds ?? actor.branch_ids);
    const permissions = normalizePermissions(actor.permissions);
    const isSuperAdmin = isSuperAdminActor(actor, permissions);
    const widgets = computeWidgets(isSuperAdmin, permissions);

    const requestedBranchId =
      input.branchId !== null &&
      input.branchId !== undefined &&
      Number(input.branchId) > 0
        ? Number(input.branchId)
        : null;

    let resolvedBranchId: number | null = null;

    if (isSuperAdmin) {
      resolvedBranchId = requestedBranchId;
    } else {
      if (requestedBranchId) {
        if (!allowedBranchIds.includes(requestedBranchId)) {
          throw new Error("Bạn không có quyền truy cập chi nhánh này");
        }
        resolvedBranchId = requestedBranchId;
      } else if (
        currentBranchId &&
        allowedBranchIds.includes(Number(currentBranchId))
      ) {
        resolvedBranchId = Number(currentBranchId);
      } else if (allowedBranchIds.length > 0) {
        resolvedBranchId = allowedBranchIds[0];
      } else {
        resolvedBranchId = null;
      }
    }

    const tier = inferTier(isSuperAdmin, allowedBranchIds, widgets);
    const scopeMode = computeScopeMode(tier, resolvedBranchId);
    const range = input.range ?? "7d";
    const { from, to } = buildRangeWindow(range);

    const query: DashboardQueryInput = {
      actorUserId,
      actorRoleId,
      tier,
      scopeMode,
      requestedBranchId,
      resolvedBranchId,
      currentBranchId,
      allowedBranchIds,
      permissions,
      widgets,
      range,
      from,
      to,
    };

    return this.repo.getAdminDashboard(query);
  }
}
