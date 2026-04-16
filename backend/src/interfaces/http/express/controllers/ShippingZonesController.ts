import { Request, Response, NextFunction } from "express";
import { ListShippingZones } from "../../../../application/shipping/usecases/ListShippingZones";
import { GetShippingZoneDetail } from "../../../../application/shipping/usecases/GetShippingZoneDetail";
import { CreateShippingZone } from "../../../../application/shipping/usecases/CreateShippingZone";
import { EditShippingZone } from "../../../../application/shipping/usecases/EditShippingZone";
import { ChangeShippingZoneStatus } from "../../../../application/shipping/usecases/ChangeShippingZoneStatus";
import { SoftDeleteShippingZone } from "../../../../application/shipping/usecases/SoftDeleteShippingZone";
import { BulkChangeShippingZoneStatus } from "../../../../application/shipping/usecases/BulkChangeShippingZoneStatus";
import { BulkDeleteShippingZones } from "../../../../application/shipping/usecases/BulkDeleteShippingZones";
import { BulkUpdateShippingZonePriority } from "../../../../application/shipping/usecases/BulkUpdateShippingZonePriority";

const toNum = (v: any) => {
  if (v === undefined || v === null || v === "") return undefined;
  const n = Number(v);
  return Number.isNaN(n) ? undefined : n;
};

export const makeShippingZonesController = (uc: {
  list: ListShippingZones;
  detail: GetShippingZoneDetail;
  create: CreateShippingZone;
  edit: EditShippingZone;
  changeStatus: ChangeShippingZoneStatus;
  softDelete: SoftDeleteShippingZone;
  bulkChangeStatus: BulkChangeShippingZoneStatus;
  bulkDelete: BulkDeleteShippingZones;
  bulkUpdatePriority: BulkUpdateShippingZonePriority;
}) => {
  return {
    list: async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { page, limit, q, keyword, status } = req.query as Record<
          string,
          string
        >;
        const normalizedPage = Math.max(1, toNum(page) ?? 1);
        const normalizedLimit = Math.max(1, toNum(limit) ?? 10);
        const offset = (normalizedPage - 1) * normalizedLimit;
        const normalizedQuery = String(q ?? keyword ?? "").trim();
        const data = await uc.list.execute({
          q: normalizedQuery || undefined,
          status: (status as any) ?? "all",
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
        if (!dto) {
          return res
            .status(404)
            .json({ success: false, message: "Shipping zone not found" });
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
        const result = await uc.create.execute({
          code: payload.code,
          name: payload.name,
          province: payload.province ?? null,
          district: payload.district ?? null,
          ward: payload.ward ?? null,
          baseFee: toNum(payload.baseFee) ?? 0,
          freeShipThreshold:
            payload.freeShipThreshold !== undefined &&
            payload.freeShipThreshold !== null &&
            payload.freeShipThreshold !== ""
              ? (toNum(payload.freeShipThreshold) ?? null)
              : null,
          priority: toNum(payload.priority) ?? 0,
          status: payload.status ?? "active",
        });
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
        const id = Number(req.params.id);
        const dto = await uc.detail.execute(id);
        if (!dto) {
          return res
            .status(404)
            .json({ success: false, message: "Shipping zone not found" });
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
        const result = await uc.edit.execute(id, {
          code: payload.code,
          name: payload.name,
          province: payload.province,
          district: payload.district,
          ward: payload.ward,
          baseFee:
            payload.baseFee !== undefined
              ? (toNum(payload.baseFee) ?? null)
              : undefined,
          freeShipThreshold:
            payload.freeShipThreshold !== undefined
              ? payload.freeShipThreshold === null ||
                payload.freeShipThreshold === ""
                ? null
                : (toNum(payload.freeShipThreshold) ?? null)
              : undefined,
          priority:
            payload.priority !== undefined
              ? (toNum(payload.priority) ?? null)
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

    bulkChangeStatus: async (
      req: Request,
      res: Response,
      next: NextFunction,
    ) => {
      try {
        const ids = Array.isArray(req.body?.ids) ? req.body.ids : [];
        const status = String(req.body?.status ?? "");
        const result = await uc.bulkChangeStatus.execute({ ids, status });
        res.json({ success: true, data: result });
      } catch (e) {
        next(e);
      }
    },

    bulkDelete: async (req: Request, res: Response, next: NextFunction) => {
      try {
        const ids = Array.isArray(req.body?.ids) ? req.body.ids : [];
        const result = await uc.bulkDelete.execute({ ids });
        res.json({ success: true, data: result });
      } catch (e) {
        next(e);
      }
    },

    bulkUpdatePriority: async (
      req: Request,
      res: Response,
      next: NextFunction,
    ) => {
      try {
        const items = Array.isArray(req.body?.items) ? req.body.items : [];
        const result = await uc.bulkUpdatePriority.execute({ items });
        res.json({ success: true, data: result });
      } catch (e) {
        next(e);
      }
    },
  };
};

export type ShippingZonesController = ReturnType<
  typeof makeShippingZonesController
>;
