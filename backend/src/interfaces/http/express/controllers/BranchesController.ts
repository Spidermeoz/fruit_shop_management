// src/interfaces/http/express/controllers/BranchesController.ts
import { Request, Response, NextFunction } from "express";
import { CreateBranch } from "../../../../application/branches/usecases/CreateBranch";
import { ListBranches } from "../../../../application/branches/usecases/ListBranches";
import { GetBranchDetail } from "../../../../application/branches/usecases/GetBranchDetail";
import { EditBranch } from "../../../../application/branches/usecases/EditBranch";
import { ChangeBranchStatus } from "../../../../application/branches/usecases/ChangeBranchStatus";
import { SoftDeleteBranch } from "../../../../application/branches/usecases/SoftDeleteBranch";

const toNum = (v: any) => (v === undefined ? undefined : Number(v));
const toBool = (v: any) =>
  v === undefined
    ? undefined
    : v === "true" || v === true || v === 1 || v === "1";

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
          offset: offset,
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

        return res.json({
          success: true,
          data: dto,
        });
      } catch (e) {
        next(e);
      }
    },

    create: async (req: Request, res: Response, next: NextFunction) => {
      try {
        const payload = req.body;

        const result = await uc.create.execute({
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
          supportsPickup:
            payload.supportsPickup !== undefined
              ? Boolean(payload.supportsPickup)
              : true,
          supportsDelivery:
            payload.supportsDelivery !== undefined
              ? Boolean(payload.supportsDelivery)
              : true,
          status: payload.status ?? "active",
        });

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
        const payload = req.body;

        const result = await uc.edit.execute(id, {
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
              ? toNum(payload.latitude)
              : undefined,
          longitude:
            payload.longitude !== undefined
              ? toNum(payload.longitude)
              : undefined,
          openTime: payload.openTime,
          closeTime: payload.closeTime,
          supportsPickup:
            payload.supportsPickup !== undefined
              ? Boolean(payload.supportsPickup)
              : undefined,
          supportsDelivery:
            payload.supportsDelivery !== undefined
              ? Boolean(payload.supportsDelivery)
              : undefined,
          status: payload.status,
        });

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
        const result = await uc.changeStatus.execute(id, status);

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
        const result = await uc.softDelete.execute(id);

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
