import { Request, Response, NextFunction } from "express";
import { ListBranchServiceAreas } from "../../../../application/shipping/usecases/ListBranchServiceAreas";
import { GetBranchServiceAreaDetail } from "../../../../application/shipping/usecases/GetBranchServiceAreaDetail";
import { CreateBranchServiceArea } from "../../../../application/shipping/usecases/CreateBranchServiceArea";
import { EditBranchServiceArea } from "../../../../application/shipping/usecases/EditBranchServiceArea";
import { ChangeBranchServiceAreaStatus } from "../../../../application/shipping/usecases/ChangeBranchServiceAreaStatus";
import { SoftDeleteBranchServiceArea } from "../../../../application/shipping/usecases/SoftDeleteBranchServiceArea";
import { BulkUpsertBranchServiceAreas } from "../../../../application/shipping/usecases/BulkUpsertBranchServiceAreas";
import { CopyBranchServiceAreasFromBranch } from "../../../../application/shipping/usecases/CopyBranchServiceAreasFromBranch";
import { BulkChangeBranchServiceAreaStatus } from "../../../../application/shipping/usecases/BulkChangeBranchServiceAreaStatus";
import { GetBranchShippingSetupChecklist } from "../../../../application/shipping/usecases/GetBranchShippingSetupChecklist";

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

export const makeBranchServiceAreasController = (uc: {
  list: ListBranchServiceAreas;
  detail: GetBranchServiceAreaDetail;
  create: CreateBranchServiceArea;
  edit: EditBranchServiceArea;
  changeStatus: ChangeBranchServiceAreaStatus;
  softDelete: SoftDeleteBranchServiceArea;
  bulkUpsert: BulkUpsertBranchServiceAreas;
  copyFromBranch: CopyBranchServiceAreasFromBranch;
  bulkChangeStatus: BulkChangeBranchServiceAreaStatus;
  checklist: GetBranchShippingSetupChecklist;
}) => ({
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
      const dto = await uc.detail.execute(Number(req.params.id));
      res.json({
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
      }, buildActor(req));
      res
        .status(201)
        .json({
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
      const dto = await uc.detail.execute(Number(req.params.id));
      res.json({
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
      const result = await (uc.changeStatus.execute as any)(
        Number(req.params.id),
        req.body.status,
        buildActor(req));
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
      const result = await (uc.softDelete.execute as any)(Number(req.params.id), buildActor(req));
      res.json({
        success: true,
        data: result,
        meta: { total: 0, page: 1, limit: 10 },
      });
    } catch (e) {
      next(e);
    }
  },
  bulkUpsert: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await (uc.bulkUpsert.execute as any)({
        items: Array.isArray(req.body?.items) ? req.body.items : [],
        mode: req.body?.mode,
      }, buildActor(req));
      res.json({ success: true, data: result });
    } catch (e) {
      next(e);
    }
  },
  copyFromBranch: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await (uc.copyFromBranch.execute as any)({
        sourceBranchId: Number(req.body?.sourceBranchId),
        targetBranchIds: Array.isArray(req.body?.targetBranchIds)
          ? req.body.targetBranchIds
          : [],
        mode: req.body?.mode,
        statusOverride: req.body?.statusOverride,
      }, buildActor(req));
      res.json({ success: true, data: result });
    } catch (e) {
      next(e);
    }
  },
  bulkChangeStatus: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await (uc.bulkChangeStatus.execute as any)({
        ids: Array.isArray(req.body?.ids) ? req.body.ids : [],
        status: req.body?.status,
      }, buildActor(req));
      res.json({ success: true, data: result });
    } catch (e) {
      next(e);
    }
  },
  checklist: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const branchIds = req.query.branchIds
        ? String(req.query.branchIds).split(",").map(Number)
        : undefined;
      const result = await uc.checklist.execute({
        branchIds,
        deliveryDate: req.query.deliveryDate
          ? String(req.query.deliveryDate)
          : undefined,
      });
      res.json({ success: true, data: result });
    } catch (e) {
      next(e);
    }
  },
});
export type BranchServiceAreasController = ReturnType<
  typeof makeBranchServiceAreasController
>;
