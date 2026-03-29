import { Request, Response, NextFunction } from "express";
import { ListBranchServiceAreas } from "../../../../application/shipping/usecases/ListBranchServiceAreas";
import { GetBranchServiceAreaDetail } from "../../../../application/shipping/usecases/GetBranchServiceAreaDetail";
import { CreateBranchServiceArea } from "../../../../application/shipping/usecases/CreateBranchServiceArea";
import { EditBranchServiceArea } from "../../../../application/shipping/usecases/EditBranchServiceArea";
import { ChangeBranchServiceAreaStatus } from "../../../../application/shipping/usecases/ChangeBranchServiceAreaStatus";
import { SoftDeleteBranchServiceArea } from "../../../../application/shipping/usecases/SoftDeleteBranchServiceArea";

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

export const makeBranchServiceAreasController = (uc: {
  list: ListBranchServiceAreas;
  detail: GetBranchServiceAreaDetail;
  create: CreateBranchServiceArea;
  edit: EditBranchServiceArea;
  changeStatus: ChangeBranchServiceAreaStatus;
  softDelete: SoftDeleteBranchServiceArea;
}) => {
  return {
    list: async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { page, limit, q, keyword, status, branchId, shippingZoneId } =
          req.query as Record<string, string>;

        const normalizedPage = Math.max(1, toNum(page) ?? 1);
        const normalizedLimit = Math.max(1, toNum(limit) ?? 10);
        const offset = (normalizedPage - 1) * normalizedLimit;
        const normalizedQuery = String(q ?? keyword ?? "").trim();

        const data = await uc.list.execute({
          q: normalizedQuery || undefined,
          status: (status as any) ?? "all",
          branchId: toNum(branchId),
          shippingZoneId: toNum(shippingZoneId),
          limit: normalizedLimit,
          offset,
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
          meta: { total: 0, page: 1, limit: 10 },
        });
      } catch (e) {
        next(e);
      }
    },

    create: async (req: Request, res: Response, next: NextFunction) => {
      try {
        const payload = req.body ?? {};

        const result = await uc.create.execute({
          branchId: toNum(payload.branchId) ?? 0,
          shippingZoneId: toNum(payload.shippingZoneId) ?? 0,
          deliveryFeeOverride:
            payload.deliveryFeeOverride !== undefined &&
            payload.deliveryFeeOverride !== null &&
            payload.deliveryFeeOverride !== ""
              ? (toNum(payload.deliveryFeeOverride) ?? null)
              : null,
          minOrderValue:
            payload.minOrderValue !== undefined &&
            payload.minOrderValue !== null &&
            payload.minOrderValue !== ""
              ? (toNum(payload.minOrderValue) ?? null)
              : null,
          maxOrderValue:
            payload.maxOrderValue !== undefined &&
            payload.maxOrderValue !== null &&
            payload.maxOrderValue !== ""
              ? (toNum(payload.maxOrderValue) ?? null)
              : null,
          supportsSameDay: toBool(payload.supportsSameDay) ?? true,
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
        const payload = req.body ?? {};

        const result = await uc.edit.execute(id, {
          branchId:
            payload.branchId !== undefined
              ? (toNum(payload.branchId) ?? 0)
              : undefined,
          shippingZoneId:
            payload.shippingZoneId !== undefined
              ? (toNum(payload.shippingZoneId) ?? 0)
              : undefined,
          deliveryFeeOverride:
            payload.deliveryFeeOverride !== undefined
              ? payload.deliveryFeeOverride === null ||
                payload.deliveryFeeOverride === ""
                ? null
                : (toNum(payload.deliveryFeeOverride) ?? null)
              : undefined,
          minOrderValue:
            payload.minOrderValue !== undefined
              ? payload.minOrderValue === null || payload.minOrderValue === ""
                ? null
                : (toNum(payload.minOrderValue) ?? null)
              : undefined,
          maxOrderValue:
            payload.maxOrderValue !== undefined
              ? payload.maxOrderValue === null || payload.maxOrderValue === ""
                ? null
                : (toNum(payload.maxOrderValue) ?? null)
              : undefined,
          supportsSameDay:
            payload.supportsSameDay !== undefined
              ? toBool(payload.supportsSameDay)
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

export type BranchServiceAreasController = ReturnType<
  typeof makeBranchServiceAreasController
>;
