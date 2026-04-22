// src/interfaces/http/express/controllers/BranchesController.ts
import { Request, Response, NextFunction } from "express";
import { CreateBranch } from "../../../../application/branches/usecases/CreateBranch";
import { ListBranches } from "../../../../application/branches/usecases/ListBranches";
import { GetBranchDetail } from "../../../../application/branches/usecases/GetBranchDetail";
import { EditBranch } from "../../../../application/branches/usecases/EditBranch";
import { ChangeBranchStatus } from "../../../../application/branches/usecases/ChangeBranchStatus";
import { SoftDeleteBranch } from "../../../../application/branches/usecases/SoftDeleteBranch";

const toNum = (v: any) => {
  if (v === undefined || v === null || v === "") return undefined;
  const n = Number(v);
  return Number.isNaN(n) ? undefined : n;
};

const toBool = (v: any) => {
  if (v === undefined) return undefined;
  if (typeof v === "boolean") return v;
  if (typeof v === "number") return v === 1;
  if (typeof v === "string") {
    const s = v.trim().toLowerCase();
    if (["true", "1", "yes", "y", "on"].includes(s)) return true;
    if (["false", "0", "no", "n", "off"].includes(s)) return false;
  }
  return undefined;
};



const getActorId = (req: Request): number | null => {
  const user = (req as any).user ?? (req as any).authUser ?? null;
  const rawId = user?.id ?? user?.userId ?? user?.adminId ?? user?.sub ?? null;

  const num = Number(rawId);
  return Number.isInteger(num) && num > 0 ? num : null;
};

const buildActor = (req: Request) => ({
  id: getActorId(req),
  roleId:
    (req as any)?.user?.roleId ??
    (req as any)?.authUser?.roleId ??
    null,
  roleCode:
    (req as any)?.user?.roleCode ??
    (req as any)?.authUser?.roleCode ??
    null,
  roleLevel:
    (req as any)?.user?.roleLevel ??
    (req as any)?.authUser?.roleLevel ??
    null,
  isSuperAdmin:
    (req as any)?.user?.isSuperAdmin === true ||
    (req as any)?.authUser?.isSuperAdmin === true,
  branchIds:
    (req as any)?.user?.branchIds ??
    (req as any)?.authUser?.branchIds ??
    [],
  requestId: (req as any)?.requestId ?? null,
  ipAddress: req.ip ?? null,
  userAgent: req.get("user-agent") ?? null,
});

export const makeBranchesController = (uc: {
  list: ListBranches;
  detail: GetBranchDetail;
  create: CreateBranch;
  edit: EditBranch;
  changeStatus: ChangeBranchStatus;
  softDelete: SoftDeleteBranch;
}) => {
  return {
    list: async (req: Request, res: Response, next: NextFunction) => {
      try {
        const {
          page,
          limit,
          q,
          keyword,
          status,
          includeDeleted,
          sortBy,
          sortDir,
        } = req.query as Record<string, string>;

        const normalizedPage = Math.max(1, toNum(page) ?? 1);
        const normalizedLimit = Math.max(1, toNum(limit) ?? 10);
        const offset = (normalizedPage - 1) * normalizedLimit;
        const normalizedQuery = String(q ?? keyword ?? "").trim();

        const data = await uc.list.execute({
          q: normalizedQuery || undefined,
          status: (status as any) ?? "all",
          includeDeleted: toBool(includeDeleted) ?? false,
          limit: normalizedLimit,
          offset,
          sort: sortBy
            ? {
                column: sortBy as any,
                dir: sortDir === "ASC" || sortDir === "DESC" ? sortDir : "DESC",
              }
            : undefined,
        });

        res.json({
          success: true,
          data: data.rows,
          meta: {
            total: data.count,
            page: normalizedPage,
            limit: normalizedLimit,
          },
        });
      } catch (e) {
        next(e);
      }
    },

    detail: async (req: Request, res: Response, next: NextFunction) => {
      try {
        const id = Number(req.params.id);
        const dto = await uc.detail.execute(id);

        if (!dto) {
          return res.status(404).json({
            success: false,
            message: "Branch not found",
          });
        }

        return res.json({
          success: true,
          data: dto,
          meta: { total: 0, page: 1, limit: 10 },
        });
      } catch (e) {
        next(e);
      }
    },

    create: async (req: Request, res: Response, next: NextFunction) => {
      try {
        const payload = req.body ?? {};

        const result = await (uc.create.execute as any)({
          name: payload.name,
          code: payload.code,
          phone: payload.phone ?? null,
          email: payload.email ?? null,
          addressLine1: payload.addressLine1 ?? null,
          addressLine2: payload.addressLine2 ?? null,
          ward: payload.ward ?? null,
          district: payload.district ?? null,
          province: payload.province ?? null,
          latitude: toNum(payload.latitude) ?? null,
          longitude: toNum(payload.longitude) ?? null,
          openTime: payload.openTime ?? null,
          closeTime: payload.closeTime ?? null,
          supportsPickup: toBool(payload.supportsPickup) ?? true,
          supportsDelivery: toBool(payload.supportsDelivery) ?? true,
          status: payload.status ?? "active",
        }, buildActor(req));

        res.status(201).json({
          success: true,
          data: result,
          meta: { total: 0, page: 1, limit: 10 },
        });
      } catch (e) {
        next(e);
      }
    },

    getEdit: async (req: Request, res: Response, next: NextFunction) => {
      try {
        const id = Number(req.params.id);
        const dto = await uc.detail.execute(id);

        if (!dto) {
          return res.status(404).json({
            success: false,
            message: "Branch not found",
          });
        }

        return res.json({
          success: true,
          data: dto,
          meta: { total: 0, page: 1, limit: 10 },
        });
      } catch (e) {
        next(e);
      }
    },

    edit: async (req: Request, res: Response, next: NextFunction) => {
      try {
        const id = Number(req.params.id);
        const payload = req.body ?? {};

        const result = await (uc.edit.execute as any)(id, {
          name: payload.name,
          code: payload.code,
          phone: payload.phone,
          email: payload.email,
          addressLine1: payload.addressLine1,
          addressLine2: payload.addressLine2,
          ward: payload.ward,
          district: payload.district,
          province: payload.province,
          latitude:
            payload.latitude !== undefined
              ? (toNum(payload.latitude) ?? null)
              : undefined,
          longitude:
            payload.longitude !== undefined
              ? (toNum(payload.longitude) ?? null)
              : undefined,
          openTime: payload.openTime,
          closeTime: payload.closeTime,
          supportsPickup: toBool(payload.supportsPickup),
          supportsDelivery: toBool(payload.supportsDelivery),
          status: payload.status,
        }, buildActor(req));

        res.json({
          success: true,
          data: result,
          meta: { total: 0, page: 1, limit: 10 },
        });
      } catch (e) {
        next(e);
      }
    },

    changeStatus: async (req: Request, res: Response, next: NextFunction) => {
      try {
        const id = Number(req.params.id);
        const { status } = req.body;
        const result = await (uc.changeStatus.execute as any)(id, status, buildActor(req));

        res.json({
          success: true,
          data: result,
          meta: { total: 0, page: 1, limit: 10 },
        });
      } catch (e) {
        next(e);
      }
    },

    softDelete: async (req: Request, res: Response, next: NextFunction) => {
      try {
        const id = Number(req.params.id);
        const result = await (uc.softDelete.execute as any)(id, buildActor(req));

        res.json({
          success: true,
          data: result,
          meta: { total: 0, page: 1, limit: 10 },
        });
      } catch (e) {
        next(e);
      }
    },
  };
};

export type BranchesController = ReturnType<typeof makeBranchesController>;
