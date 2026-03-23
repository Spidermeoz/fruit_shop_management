import { Request, Response, NextFunction } from "express";
import { ListOrigins } from "../../../../application/origins/usecases/ListOrigins";
import { GetOriginDetail } from "../../../../application/origins/usecases/GetOriginDetail";
import { CreateOrigin } from "../../../../application/origins/usecases/CreateOrigin";
import { EditOrigin } from "../../../../application/origins/usecases/EditOrigin";
import { ChangeOriginStatus } from "../../../../application/origins/usecases/ChangeOriginStatus";
import { SoftDeleteOrigin } from "../../../../application/origins/usecases/SoftDeleteOrigin";
import { BulkDeleteOrigins } from "../../../../application/origins/usecases/BulkDeleteOrigins";
import type {
  OriginStatus,
  UpdateOriginPatch,
} from "../../../../domain/products/OriginRepository";

const toNum = (v: any) =>
  v === undefined || v === null ? undefined : Number(v);

export const makeOriginsController = (uc: {
  list: ListOrigins;
  detail: GetOriginDetail;
  create: CreateOrigin;
  edit: EditOrigin;
  changeStatus: ChangeOriginStatus;
  softDelete: SoftDeleteOrigin;
  bulkDelete: BulkDeleteOrigins;
}) => {
  return {
    list: async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { page, limit, q, status, sortBy, order } = req.query as Record<
          string,
          string
        >;

        const data = await uc.list.execute({
          page: toNum(page) ?? 1,
          limit: toNum(limit) ?? 20,
          q,
          status: (status as any) ?? "all",
          sortBy: (sortBy as any) ?? "name",
          order: (order as any) ?? "ASC",
        });

        return res.json({
          success: true,
          data: data.rows,
          meta: {
            total: data.count,
            page: Number(page ?? 1),
            limit: Number(limit ?? 20),
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
          data: {
            id: dto.id,
            name: dto.name,
            slug: dto.slug ?? null,
            description: dto.description ?? null,
            country_code: dto.countryCode ?? null,
            status: dto.status,
            position: dto.position ?? null,
            created_at: dto.createdAt ?? null,
            updated_at: dto.updatedAt ?? null,
          },
          meta: { total: 0, page: 1, limit: 10 },
        });
      } catch (e) {
        next(e);
      }
    },

    create: async (req: Request, res: Response, next: NextFunction) => {
      try {
        const payload = req.body as {
          name: string;
          description?: string | null;
          countryCode?: string | null;
          country_code?: string | null;
          status?: OriginStatus;
          position?: number | null;
        };

        const result = await uc.create.execute({
          name: payload.name,
          description: payload.description ?? null,
          countryCode: payload.countryCode ?? payload.country_code ?? null,
          status: payload.status,
          position: payload.position ?? null,
        });

        return res.status(201).json({
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
          data: {
            id: dto.id,
            name: dto.name,
            slug: dto.slug ?? "",
            description: dto.description ?? "",
            country_code: dto.countryCode ?? "",
            status: dto.status,
            position: dto.position ?? "",
            created_at: dto.createdAt ?? null,
            updated_at: dto.updatedAt ?? null,
          },
          meta: { total: 0, page: 1, limit: 10 },
        });
      } catch (e) {
        next(e);
      }
    },

    edit: async (req: Request, res: Response, next: NextFunction) => {
      try {
        const id = Number(req.params.id);
        const b = (req.body ?? {}) as any;

        const patch: UpdateOriginPatch = {
          ...(b.name !== undefined ? { name: String(b.name) } : {}),
          ...(b.description !== undefined
            ? { description: b.description }
            : {}),
          ...(b.countryCode !== undefined
            ? { countryCode: b.countryCode || null }
            : {}),
          ...(b.country_code !== undefined
            ? { countryCode: b.country_code || null }
            : {}),
          ...(b.status !== undefined
            ? { status: String(b.status) as any }
            : {}),
          ...(b.position !== undefined && b.position !== ""
            ? { position: Number(b.position) }
            : {}),
        };

        const result = await uc.edit.execute(id, patch);

        return res.json({
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

        return res.json({
          success: true,
          data: result,
          meta: { total: 0, page: 1, limit: 10 },
        });
      } catch (e) {
        next(e);
      }
    },

    bulkDelete: async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { ids } = req.body as { ids: number[] };
        const result = await uc.bulkDelete.execute(ids);

        return res.json({
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
        const { status } = req.body as { status: OriginStatus };

        const result = await uc.changeStatus.execute(id, status);

        return res.json({
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

export type OriginsController = ReturnType<typeof makeOriginsController>;
