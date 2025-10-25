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

    // GET /detail/:id
    detail: async (req: Request, res: Response, next: NextFunction) => {
      try {
        const id = Number(req.params.id);
        const dto = await uc.detail.execute(id);

        // Fetch parent category name if parentId exists
        let parent_name = null;
        if (dto.parentId) {
          try {
            const parent = await uc.detail.execute(dto.parentId);
            parent_name = parent.title;
          } catch (err) {
            console.error("Error fetching parent category:", err);
          }
        }

        return res.json({
          success: true,
          data: {
            id: dto.id,
            title: dto.title,
            parent_id: dto.parentId ?? null,
            parent_name, // Add parent name to response
            description: dto.description ?? null,
            thumbnail: dto.thumbnail ?? null,
            status: dto.status,
            position: dto.position ?? null,
            slug: dto.slug ?? null,
            created_at: dto.createdAt ?? null,
            updated_at: dto.updatedAt ?? null,
          },
          meta: { total: 0, page: 1, limit: 10 },
        });
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

        // If position is not provided, get the last position based on parent
        if (payload.position === undefined || payload.position === null) {
          const lastPositionQuery = await uc.list.execute({
            page: 1,
            limit: 1,
            parentId: payload.parentId ?? null,
            sortBy: "position",
            order: "DESC",
          });

          if (lastPositionQuery.rows.length > 0) {
            payload.position = (lastPositionQuery.rows[0].position ?? 0) + 1;
          } else {
            payload.position = 1; // First item in this parent level
          }
        }

        const result = await uc.create.execute(payload);
        res.status(201).json({
          success: true,
          data: result,
          meta: { total: 0, page: 1, limit: 10 },
        });
      } catch (e) {
        next(e);
      }
    },

    // GET /edit/:id (thường FE dùng để lấy detail)
    getEdit: async (req: Request, res: Response, next: NextFunction) => {
      try {
        const id = Number(req.params.id);
        const dto = await uc.detail.execute(id);

        let parent_name = null;
        if (dto.parentId) {
          try {
            const parent = await uc.detail.execute(dto.parentId);
            parent_name = parent.title;
          } catch (err) {
            console.error("Error fetching parent category:", err);
          }
        }

        return res.json({
          success: true,
          data: {
            id: dto.id,
            title: dto.title,
            parent_id: dto.parentId ?? null,
            parent_name,
            description: dto.description ?? null,
            thumbnail: dto.thumbnail ?? null,
            status: dto.status,
            position: dto.position ?? null,
            slug: dto.slug ?? null,
            created_at: dto.createdAt ?? null,
            updated_at: dto.updatedAt ?? null,
          },
          meta: { total: 0, page: 1, limit: 10 },
        });
      } catch (e) {
        next(e);
      }
    },

    // PATCH /edit/:id
    edit: async (req: Request, res: Response, next: NextFunction) => {
      try {
        const id = Number(req.params.id);
        const b = req.body as any;

        // Get current category to check if parent changed
        const currentCategory = await uc.detail.execute(id);

        // Handle parentId (accept both camelCase and snake_case)
        let parentId: number | null | undefined;
        if (b.parentId !== undefined) {
          parentId = b.parentId === "" ? null : Number(b.parentId);
        } else if (b.parent_id !== undefined) {
          parentId = b.parent_id === "" ? null : Number(b.parent_id);
        }

        // If parent changed or position not provided, get new position
        if (
          parentId !== undefined &&
          (parentId !== currentCategory.parentId ||
            b.position === undefined ||
            b.position === null)
        ) {
          const lastPositionQuery = await uc.list.execute({
            page: 1,
            limit: 1,
            parentId: parentId,
            sortBy: "position",
            order: "DESC",
          });

          b.position =
            lastPositionQuery.rows.length > 0
              ? (lastPositionQuery.rows[0].position ?? 0) + 1
              : 1;
        }

        const patch: UpdateCategoryPatch = {
          ...(b.title !== undefined ? { title: String(b.title) } : {}),
          ...(parentId !== undefined ? { parentId } : {}),
          ...(b.description !== undefined
            ? { description: b.description }
            : {}),
          ...(b.thumbnail !== undefined ? { thumbnail: b.thumbnail } : {}),
          ...(b.status !== undefined
            ? { status: String(b.status) as any }
            : {}),
          ...(b.slug !== undefined ? { slug: b.slug || null } : {}),
          ...(b.position !== undefined ? { position: Number(b.position) } : {}),
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

    // PATCH /:id/status
    changeStatus: async (req: Request, res: Response, next: NextFunction) => {
      try {
        const id = Number(req.params.id);
        const { status } = req.body as { status: CategoryStatus };
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

    // DELETE /delete/:id
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
            return res.status(400).json({
              success: false,
              message: "Invalid positions/value payload",
              data: null,
              meta: { total: 0, page: 1, limit: 10 },
            });
          }
          const result = await uc.reorder.execute(pairs);
          return res.json({
            success: true,
            data: result,
            meta: { total: 0, page: 1, limit: 10 },
          });
        }

        // ✨ hỗ trợ action = 'status'
        if (body.action === "status") {
          const patch = {
            status: body.value,
          };
          const result = await uc.bulkEdit.execute(body.ids, patch);
          return res.json({
            success: true,
            data: result,
            meta: { total: 0, page: 1, limit: 10 },
          });
        }

        // Mặc định: bulk patch (status/flags/parent/...)
        const { ids, patch } = body as {
          ids: number[];
          patch: UpdateCategoryPatch;
        };
        const result = await uc.bulkEdit.execute(ids, patch);
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

export type ProductCategoriesController = ReturnType<
  typeof makeProductCategoriesController
>;
