import { Request, Response, NextFunction } from "express";
import { ListProductTagGroups } from "../../../../application/product-tag-groups/usecases/ListProductTagGroups";
import { CreateProductTagGroup } from "../../../../application/product-tag-groups/usecases/CreateProductTagGroup";
import { EditProductTagGroup } from "../../../../application/product-tag-groups/usecases/EditProductTagGroup";
import { DeleteProductTagGroup } from "../../../../application/product-tag-groups/usecases/DeleteProductTagGroup";

const toNum = (v: any) =>
  v === undefined || v === null ? undefined : Number(v);

export const makeProductTagGroupsController = (uc: {
  list: ListProductTagGroups;
  create: CreateProductTagGroup;
  edit: EditProductTagGroup;
  deleteGroup: DeleteProductTagGroup;
}) => {
  return {
    list: async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { page, limit, q, sortBy, order, includeTags } = req.query as any;

        const data = await uc.list.execute({
          page: toNum(page) ?? 1,
          limit: toNum(limit) ?? 50,
          q,
          sortBy: sortBy ?? "name",
          order: order ?? "ASC",
          includeTags:
            includeTags === undefined ? true : String(includeTags) === "true",
        });

        return res.json({
          success: true,
          data: data.rows,
          meta: {
            total: data.count,
            page: Number(page ?? 1),
            limit: Number(limit ?? 50),
          },
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
        const result = await uc.deleteGroup.execute(id);

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

export type ProductTagGroupsController = ReturnType<
  typeof makeProductTagGroupsController
>;
