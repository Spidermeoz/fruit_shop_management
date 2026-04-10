import type { Request, Response, NextFunction } from "express";
import type { TokenService } from "../../../../application/auth/services/TokenService";
import type { UserRepository } from "../../../../domain/users/UserRepository";
import type { AccessTokenPayload } from "../../../../domain/auth/types";

type Opts = {
  header?: string;
  cookie?: string;
  enforceActive?: boolean;
};

type PermissionMap = Record<string, string[]>;

const normalizePermissionMap = (input: unknown): PermissionMap => {
  const output = new Map<string, Set<string>>();

  const add = (moduleValue: unknown, actionValue: unknown) => {
    const module = String(moduleValue ?? "")
      .trim()
      .toLowerCase();
    const action = String(actionValue ?? "")
      .trim()
      .toLowerCase();

    if (!module || !action) return;

    if (!output.has(module)) {
      output.set(module, new Set<string>());
    }

    output.get(module)!.add(action);
  };

  if (Array.isArray(input)) {
    for (const item of input) {
      if (typeof item === "string") {
        const raw = item.trim().toLowerCase();
        if (!raw) continue;

        const [module, action] = raw.split(".");
        if (!module || !action) continue;

        add(module, action);
        continue;
      }

      if (item && typeof item === "object") {
        add((item as any).module, (item as any).action);
      }
    }
  } else if (input && typeof input === "object") {
    for (const [module, actions] of Object.entries(
      input as Record<string, unknown>,
    )) {
      if (!Array.isArray(actions)) continue;

      for (const action of actions) {
        add(module, action);
      }
    }
  }

  return Array.from(output.entries()).reduce<PermissionMap>(
    (acc, [module, actions]) => {
      acc[module] = Array.from(actions);
      return acc;
    },
    {},
  );
};

const normalizeRoleCode = (value: unknown): string | null => {
  const raw = String(value ?? "")
    .trim()
    .toLowerCase();
  return raw || null;
};

const normalizeRoleName = (value: unknown): string | null => {
  const raw = String(value ?? "").trim();
  return raw || null;
};

const inferIsSuperAdmin = (input: {
  roleCode?: string | null;
  roleName?: string | null;
  permissions?: PermissionMap;
}): boolean => {
  const roleCode = normalizeRoleCode(input.roleCode);
  const normalizedRoleName = String(input.roleName ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_");

  if (
    roleCode === "super_admin" ||
    roleCode === "superadmin" ||
    normalizedRoleName === "super_admin" ||
    normalizedRoleName === "superadmin"
  ) {
    return true;
  }

  const permissions = input.permissions ?? {};
  const modules = Object.keys(permissions);

  if (modules.length === 0) return false;

  const has = (module: string, action: string) =>
    Array.isArray(permissions[module]) && permissions[module].includes(action);

  const dashboardCoverage =
    has("order", "view") &&
    has("inventory", "view") &&
    has("user", "view") &&
    has("branch", "view") &&
    (has("shipping_zone", "view") ||
      has("branch_service_area", "view") ||
      has("delivery_time_slot", "view") ||
      has("branch_delivery_time_slot", "view") ||
      has("branch_delivery_slot_capacity", "view")) &&
    has("promotion", "view") &&
    has("review", "view") &&
    (has("post", "view") ||
      has("post_category", "view") ||
      has("post_tag", "view"));

  return dashboardCoverage;
};

export const makeAuthMiddleware = (
  tokenService: TokenService,
  userRepo?: UserRepository,
  opts: Opts = {},
) => {
  const headerName = (opts.header || "authorization").toLowerCase();
  const useCookie = opts.cookie;
  const enforceActive = opts.enforceActive ?? !!userRepo;

  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      let raw = "";

      const h = (req.headers as any)[headerName];
      if (h && typeof h === "string" && h.toLowerCase().startsWith("bearer ")) {
        raw = h.slice(7).trim();
      }

      if (!raw && useCookie && (req as any).cookies) {
        raw = (req as any).cookies[useCookie] || "";
      }

      if (!raw) {
        return res
          .status(401)
          .json({ success: false, message: "Unauthorized" });
      }

      const payload = tokenService.verifyAccessToken(raw) as AccessTokenPayload;
      if (!payload?.sub) {
        return res
          .status(401)
          .json({ success: false, message: "Unauthorized" });
      }

      let resolvedUser: any = null;
      if (userRepo) {
        resolvedUser = await userRepo.findById(Number(payload.sub), false);
      }

      if (enforceActive && userRepo) {
        if (!resolvedUser || resolvedUser.props.status !== "active") {
          return res
            .status(401)
            .json({ success: false, message: "Unauthorized" });
        }
      }

      const branchAssignments = Array.isArray(
        resolvedUser?.props.branchAssignments,
      )
        ? resolvedUser.props.branchAssignments
        : [];

      const branchIds = branchAssignments
        .map((x: any) => Number(x.branchId))
        .filter((x: number) => Number.isFinite(x) && x > 0);

      const primaryBranchId =
        resolvedUser?.props.primaryBranchId ??
        branchAssignments.find((x: any) => x.isPrimary)?.branchId ??
        null;

      const currentBranchHeader = req.headers["x-branch-id"];
      const currentBranchId =
        typeof currentBranchHeader === "string" &&
        currentBranchHeader.trim() !== ""
          ? Number(currentBranchHeader)
          : (primaryBranchId ?? null);

      if (
        currentBranchId &&
        branchIds.length > 0 &&
        !branchIds.includes(Number(currentBranchId))
      ) {
        return res.status(403).json({
          success: false,
          message: "Forbidden: branch scope denied",
        });
      }

      const resolvedRole = resolvedUser?.props.role ?? null;
      const roleCode = normalizeRoleCode(
        resolvedRole?.code ??
          resolvedUser?.props.roleCode ??
          (payload as any)?.roleCode,
      );
      const roleName = normalizeRoleName(
        resolvedRole?.name ??
          resolvedRole?.title ??
          resolvedUser?.props.roleName ??
          (payload as any)?.roleName,
      );

      const permissions = normalizePermissionMap(
        resolvedRole?.permissions ??
          resolvedUser?.props.permissions ??
          (payload as any)?.permissions,
      );

      const isSuperAdmin = inferIsSuperAdmin({
        roleCode,
        roleName,
        permissions,
      });

      req.user = {
        id: Number(payload.sub),
        email: resolvedUser?.props.email ?? payload.email,
        roleId: resolvedUser?.props.roleId ?? (payload as any)?.roleId ?? null,
        roleCode,
        roleName,
        isSuperAdmin,
        permissions,
        branchIds,
        primaryBranchId: primaryBranchId ? Number(primaryBranchId) : null,
        currentBranchId: currentBranchId ? Number(currentBranchId) : null,
        branches: branchAssignments.map((x: any) => ({
          id: Number(x.branch?.id ?? x.branchId),
          name: x.branch?.name ?? null,
          code: x.branch?.code ?? null,
          status: x.branch?.status ?? null,
          isPrimary: !!x.isPrimary,
        })),
        payload,
      };

      next();
    } catch {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
  };
};
