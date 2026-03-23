import { Request, Response, NextFunction } from "express";
import { ListProductTags } from "../../../../application/product-tags/usecases/ListProductTags";
import { GetProductTagDetail } from "../../../../application/product-tags/usecases/GetProductTagDetail";
import { CreateProductTag } from "../../../../application/product-tags/usecases/CreateProductTag";
import { EditProductTag } from "../../../../application/product-tags/usecases/EditProductTag";
import { DeleteProductTag } from "../../../../application/product-tags/usecases/DeleteProductTag";
import { BulkDeleteProductTags } from "../../../../application/product-tags/usecases/BulkDeleteProductTags";

const toNum = (v: any) =>
  v === undefined || v === null ? undefined : Number(v);

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
        const { page, limit, q, tagGroup, sortBy, order } = req.query as any;

        const data = await uc.list.execute({
          page: toNum(page) ?? 1,
          limit: toNum(limit) ?? 20,
          q,
          tagGroup: tagGroup ?? "all",
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
        const result = await uc.create.execute(req.body);

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
        const result = await uc.edit.execute(id, req.body);

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
        const result = await uc.deleteTag.execute(id);

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
        const result = await uc.bulkDelete.execute(ids);

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
