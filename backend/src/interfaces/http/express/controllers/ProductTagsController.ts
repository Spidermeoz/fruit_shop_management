import { Request, Response, NextFunction } from "express";
import { ListProductTags } from "../../../../application/product-tags/usecases/ListProductTags";
import { GetProductTagDetail } from "../../../../application/product-tags/usecases/GetProductTagDetail";
import { CreateProductTag } from "../../../../application/product-tags/usecases/CreateProductTag";
import { EditProductTag } from "../../../../application/product-tags/usecases/EditProductTag";
import { DeleteProductTag } from "../../../../application/product-tags/usecases/DeleteProductTag";
import { BulkDeleteProductTags } from "../../../../application/product-tags/usecases/BulkDeleteProductTags";

const toNum = (v: any) =>
  v === undefined || v === null ? undefined : Number(v);



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

export const makeProductTagsController = (uc: {
  list: ListProductTags;
  detail: GetProductTagDetail;
  create: CreateProductTag;
  edit: EditProductTag;
  deleteTag: DeleteProductTag;
  bulkDelete: BulkDeleteProductTags;
}) => {
  return {
    list: async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { page, limit, q, productTagGroupId, sortBy, order } =
          req.query as any;

        const data = await uc.list.execute({
          page: toNum(page) ?? 1,
          limit: toNum(limit) ?? 20,
          q,
          productTagGroupId:
            productTagGroupId !== undefined ? Number(productTagGroupId) : "all",
          sortBy: sortBy ?? "name",
          order: order ?? "ASC",
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
          data: dto,
        });
      } catch (e) {
        next(e);
      }
    },

    create: async (req: Request, res: Response, next: NextFunction) => {
      try {
        const result = await (uc.create.execute as any)(req.body, buildActor(req));

        return res.status(201).json({
          success: true,
          data: result,
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
        });
      } catch (e) {
        next(e);
      }
    },

    edit: async (req: Request, res: Response, next: NextFunction) => {
      try {
        const id = Number(req.params.id);
        const result = await (uc.edit.execute as any)(id, req.body, buildActor(req));

        return res.json({
          success: true,
          data: result,
        });
      } catch (e) {
        next(e);
      }
    },

    delete: async (req: Request, res: Response, next: NextFunction) => {
      try {
        const id = Number(req.params.id);
        const result = await (uc.deleteTag.execute as any)(id, buildActor(req));

        return res.json({
          success: true,
          data: result,
        });
      } catch (e) {
        next(e);
      }
    },

    bulkDelete: async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { ids } = req.body;
        const result = await (uc.bulkDelete.execute as any)(ids, buildActor(req));

        return res.json({
          success: true,
          data: result,
        });
      } catch (e) {
        next(e);
      }
    },
  };
};

export type ProductTagsController = ReturnType<
  typeof makeProductTagsController
>;
