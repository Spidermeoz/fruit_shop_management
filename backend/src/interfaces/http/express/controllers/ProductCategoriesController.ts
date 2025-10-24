// src/interfaces/http/express/controllers/ProductCategoriesController.ts
import { Request, Response, NextFunction } from "express";
import { ListCategories } from "../../../../application/categories/usecases/ListCategories";
import { GetCategoryDetail } from "../../../../application/categories/usecases/GetCategoryDetail";
import { CreateCategory } from "../../../../application/categories/usecases/CreateCategory";
import { EditCategory } from "../../../../application/categories/usecases/EditCategory";
import { ChangeCategoryStatus } from "../../../../application/categories/usecases/ChangeCategoryStatus";
import { SoftDeleteCategory } from "../../../../application/categories/usecases/SoftDeleteCategory";
import { BulkEditCategories } from "../../../../application/categories/usecases/BulkEditCategories";
import { ReorderCategoryPositions } from "../../../../application/categories/usecases/ReorderCategoryPositions";
import type { CategoryStatus } from "../../../../domain/categories/types";
import type { UpdateCategoryPatch } from "../../../../domain/categories/ProductCategoryRepository";

const toNum = (v: any) =>
  v === undefined || v === null ? undefined : Number(v);
const toBool = (v: any) =>
  v === undefined || v === null
    ? undefined
    : v === "true" || v === true || v === 1 || v === "1";

export const makeProductCategoriesController = (uc: {
  list: ListCategories;
  detail: GetCategoryDetail;
  create: CreateCategory;
  edit: EditCategory;
  changeStatus: ChangeCategoryStatus;
  softDelete: SoftDeleteCategory;
  bulkEdit: BulkEditCategories;
  reorder: ReorderCategoryPositions;
}) => {
  return {
    // GET /
    list: async (req: Request, res: Response, next: NextFunction) => {
      try {
        const {
          page,
          limit,
          q,
          parentId,
          status,
          includeDeleted,
          tree,
          sortBy,
          order,
        } = req.query as Record<string, string>;
        const data = await uc.list.execute({
          page: toNum(page) ?? 1,
          limit: toNum(limit) ?? 20,
          q,
          parentId:
            parentId !== undefined ? toNum(parentId) ?? null : undefined,
          status: (status as any) ?? "all",
          includeDeleted: toBool(includeDeleted) ?? false,
          tree: toBool(tree) ?? false,
          sortBy: (sortBy as any) ?? "position",
          order: (order as any) ?? "ASC",
        });
        res.json({
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

    // GET /detail/:id
    detail: async (req: Request, res: Response, next: NextFunction) => {
      try {
        const id = Number(req.params.id);
        const data = await uc.detail.execute(id);
        res.json({ data });
      } catch (e) {
        next(e);
      }
    },

    // POST /create
    create: async (req: Request, res: Response, next: NextFunction) => {
      try {
        const payload = req.body as {
          title: string;
          parentId?: number | null;
          description?: string | null;
          thumbnail?: string | null;
          status?: CategoryStatus;
          position?: number | null;
          slug?: string | null;
        };
        const result = await uc.create.execute(payload);
        res.status(201).json({ data: result });
      } catch (e) {
        next(e);
      }
    },

    // GET /edit/:id (thường FE dùng để lấy detail)
    getEdit: async (req: Request, res: Response, next: NextFunction) => {
      try {
        const id = Number(req.params.id);
        const data = await uc.detail.execute(id);
        res.json({ data });
      } catch (e) {
        next(e);
      }
    },

    // PATCH /edit/:id
    edit: async (req: Request, res: Response, next: NextFunction) => {
      try {
        const id = Number(req.params.id);
        const patch = req.body as UpdateCategoryPatch;
        const result = await uc.edit.execute(id, patch);
        res.json({ data: result });
      } catch (e) {
        next(e);
      }
    },

    // PATCH /:id/status
    changeStatus: async (req: Request, res: Response, next: NextFunction) => {
      try {
        const id = Number(req.params.id);
        const { status } = req.body as { status: CategoryStatus };
        const result = await uc.changeStatus.execute(id, status);
        res.json({ data: result });
      } catch (e) {
        next(e);
      }
    },

    // DELETE /delete/:id
    softDelete: async (req: Request, res: Response, next: NextFunction) => {
      try {
        const id = Number(req.params.id);
        const result = await uc.softDelete.execute(id);
        res.json({ data: result });
      } catch (e) {
        next(e);
      }
    },

    // PATCH /bulk-edit
    bulkEdit: async (req: Request, res: Response, next: NextFunction) => {
      try {
        const body = req.body as any;

        // ✨ hỗ trợ action = 'position' (đổi vị trí từng id)
        if (body.action === "position") {
          let pairs: Array<{ id: number; position: number }> = [];
          if (Array.isArray(body.positions)) {
            pairs = body.positions.map((p: any) => ({
              id: Number(p.id),
              position: Number(p.position),
            }));
          } else if (
            body.value &&
            typeof body.value === "object" &&
            !Array.isArray(body.value)
          ) {
            pairs = Object.entries(body.value).map(([id, pos]) => ({
              id: Number(id),
              position: Number(pos),
            }));
          }
          if (!pairs.length) {
            return res
              .status(400)
              .json({
                success: false,
                message: "Invalid positions/value payload",
              });
          }
          const result = await uc.reorder.execute(pairs);
          return res.json({ data: result });
        }

        // ✨ hỗ trợ action = 'status'
        if (body.action === "status") {
          const patch = {
            status: body.value,
          };
          const result = await uc.bulkEdit.execute(body.ids, patch);
          return res.json({ data: result });
        }

        // Mặc định: bulk patch (status/flags/parent/...)
        const { ids, patch } = body as {
          ids: number[];
          patch: UpdateCategoryPatch;
        };
        const result = await uc.bulkEdit.execute(ids, patch);
        res.json({ data: result });
      } catch (e) {
        next(e);
      }
    },
  };
};

export type ProductCategoriesController = ReturnType<
  typeof makeProductCategoriesController
>;
