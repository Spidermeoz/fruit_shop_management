import type { Request, Response, NextFunction } from "express";
import type { RoleRepository } from "../../../../domain/roles/RoleRepository";
import type { Permissions } from "../../../../domain/auth/types";

type CacheEntry = { perms: Permissions; at: number };
const ROLE_CACHE = new Map<number, CacheEntry>();

export const canAccessBranch = (req: Request, branchId?: number | null) => {
  if (!branchId) return true;
  if (!req.user) return false;

  const assigned = Array.isArray(req.user.branchIds) ? req.user.branchIds : [];
  if (!assigned.length) return false;

  return assigned.includes(Number(branchId));
};

export const requireBranchAccess =
  (resolveBranchId: (req: Request) => number | null | undefined) =>
  (req: Request, res: Response, next: NextFunction) => {
    try {
      const branchId = resolveBranchId(req);
      if (!branchId) return next();

      if (!canAccessBranch(req, branchId)) {
        return res.status(403).json({
          success: false,
          message: "Forbidden: branch scope denied",
        });
      }

      return next();
    } catch {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }
  };

export const makeCan =
  (rolesRepo: RoleRepository, cacheMs = 60_000) =>
  (moduleKey: string, actionKey: string) =>
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res
          .status(401)
          .json({ success: false, message: "Unauthorized" });
      }

      const roleId = req.user.roleId;
      if (roleId == null) {
        return res.status(403).json({ success: false, message: "Forbidden" });
      }

      let perms: Permissions | undefined;
      const now = Date.now();
      const cached = ROLE_CACHE.get(roleId);

      if (cached && now - cached.at < cacheMs) {
        perms = cached.perms;
      } else {
        const role = await rolesRepo.findById(roleId);
        perms = (role?.props.permissions as Permissions) || {};
        ROLE_CACHE.set(roleId, { perms, at: now });
      }

      const allowed =
        !!perms &&
        !!perms[moduleKey] &&
        Array.isArray(perms[moduleKey]) &&
        perms[moduleKey].includes(actionKey);

      if (!allowed) {
        return res.status(403).json({ success: false, message: "Forbidden" });
      }

      return next();
    } catch {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }
  };
