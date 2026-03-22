import { Request, Response, NextFunction } from "express";
import { ListProductTags } from "../../../../application/product-tags/usecases/ListProductTags";
import { GetProductTagDetail } from "../../../../application/product-tags/usecases/GetProductTagDetail";
import { CreateProductTag } from "../../../../application/product-tags/usecases/CreateProductTag";
import { EditProductTag } from "../../../../application/product-tags/usecases/EditProductTag";
import { ChangeProductTagStatus } from "../../../../application/product-tags/usecases/ChangeProductTagStatus";

const toNum = (v: any) =>
  v === undefined || v === null ? undefined : Number(v);

export const makeProductTagsController = (uc: {
  list: ListProductTags;
  detail: GetProductTagDetail;
  create: CreateProductTag;
  edit: EditProductTag;
  changeStatus: ChangeProductTagStatus;
}) => {
  return {
    list: async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { page, limit, q, status, tagGroup } = req.query as any;

        const data = await uc.list.execute({
          page: toNum(page) ?? 1,
          limit: toNum(limit) ?? 20,
          q,
          status: status ?? "all",
          tagGroup: tagGroup ?? "all",
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

    changeStatus: async (req: Request, res: Response, next: NextFunction) => {
      try {
        const id = Number(req.params.id);
        const { status } = req.body;

        const result = await uc.changeStatus.execute(id, status);

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
