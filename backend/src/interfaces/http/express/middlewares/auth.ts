import type { Request, Response, NextFunction } from "express";
import type { TokenService } from "../../../../application/auth/services/TokenService";
import type { UserRepository } from "../../../../domain/users/UserRepository";
import type { AccessTokenPayload } from "../../../../domain/auth/types";

type Opts = {
  header?: string;
  cookie?: string;
  enforceActive?: boolean;
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

      req.user = {
        id: Number(payload.sub),
        email: resolvedUser?.props.email ?? payload.email,
        roleId: resolvedUser?.props.roleId ?? payload.roleId ?? null,
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
