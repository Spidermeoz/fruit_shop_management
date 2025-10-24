// src/interfaces/http/express/controllers/ProductsController.ts
import { Request, Response, NextFunction } from "express";
import { ListProducts } from "../../../../application/products/usecases/ListProducts";
import { GetProductDetail } from "../../../../application/products/usecases/GetProductDetail";
import { CreateProduct } from "../../../../application/products/usecases/CreateProduct";
import { EditProduct } from "../../../../application/products/usecases/EditProduct";
import { ChangeProductStatus } from "../../../../application/products/usecases/ChangeProductStatus";
import { SoftDeleteProduct } from "../../../../application/products/usecases/SoftDeleteProduct";
import { BulkEditProducts } from "../../../../application/products/usecases/BulkEditProducts";
import type { ProductStatus } from "../../../../domain/products/types";
import type { UpdateProductPatch } from "../../../../domain/products/ProductRepository";
import { BulkReorderProducts } from "../../../../application/products/usecases/BulkReorderProducts";

const toNum = (v: any) => (v === undefined ? undefined : Number(v));
const toBool = (v: any) =>
  v === undefined
    ? undefined
    : v === "true" || v === true || v === 1 || v === "1";

export const makeProductsController = (uc: {
  list: ListProducts;
  detail: GetProductDetail;
  create: CreateProduct;
  edit: EditProduct;
  changeStatus: ChangeProductStatus;
  softDelete: SoftDeleteProduct;
  bulkEdit: BulkEditProducts;
  reorder: BulkReorderProducts;
}) => {
  return {
    list: async (req: Request, res: Response, next: NextFunction) => {
      try {
        const {
          page,
          limit,
          q,
          categoryId,
          status,
          featured,
          minPrice,
          maxPrice,
          sortBy,
          order,
        } = req.query as Record<string, string>;

        const data = await uc.list.execute({
          page: toNum(page) ?? 1,
          limit: toNum(limit) ?? 10,
          q,
          categoryId: categoryId !== undefined ? Number(categoryId) : null,
          status: (status as any) ?? "all",
          featured: toBool(featured),
          minPrice: minPrice !== undefined ? Number(minPrice) : undefined,
          maxPrice: maxPrice !== undefined ? Number(maxPrice) : undefined,
          sortBy: (sortBy as any) ?? "id",
          order: (order as any) ?? "DESC",
        });

        res.json({
          data: data.rows,
          meta: {
            total: data.count,
            page: Number(page ?? 1),
            limit: Number(limit ?? 10),
          },
        });
      } catch (e) {
        next(e);
      }
    },

    detail: async (req: Request, res: Response, next: NextFunction) => {
      try {
        const id = Number(req.params.id);
        const data = await uc.detail.execute(id);
        res.json({ data });
      } catch (e) {
        next(e);
      }
    },

    create: async (req: Request, res: Response, next: NextFunction) => {
      try {
        const payload = req.body as {
          categoryId?: number | null;
          title: string;
          description?: string | null;
          price?: number | null;
          discountPercentage?: number | null;
          stock?: number;
          thumbnail?: string | null;
          slug?: string | null;
          status?: ProductStatus;
          featured?: boolean;
          position?: number | null;
        };
        const result = await uc.create.execute(payload);
        res.status(201).json({ data: result });
      } catch (e) {
        next(e);
      }
    },

    getEdit: async (req: Request, res: Response, next: NextFunction) => {
      // nhiều FE dùng /edit/:id để lấy detail
      try {
        const id = Number(req.params.id);
        const data = await uc.detail.execute(id);
        res.json({ data });
      } catch (e) {
        next(e);
      }
    },

    edit: async (req: Request, res: Response, next: NextFunction) => {
      try {
        const id = Number(req.params.id);
        const patch = req.body as UpdateProductPatch;
        const result = await uc.edit.execute(id, patch);
        res.json({ data: result });
      } catch (e) {
        next(e);
      }
    },

    changeStatus: async (req: Request, res: Response, next: NextFunction) => {
      try {
        const id = Number(req.params.id);
        const { status } = req.body as { status: ProductStatus };
        const result = await uc.changeStatus.execute(id, status);
        res.json({ data: result });
      } catch (e) {
        next(e);
      }
    },

    softDelete: async (req: Request, res: Response, next: NextFunction) => {
      try {
        const id = Number(req.params.id);
        const result = await uc.softDelete.execute(id);
        res.json({ data: result });
      } catch (e) {
        next(e);
      }
    },

    bulkEdit: async (req: Request, res: Response, next: NextFunction) => {
      try {
        // ✨ Hỗ trợ 2 chế độ:
        // A) { ids: number[], patch: UpdateProductPatch }
        // B) { action: 'position', positions: [{id, position}], updated_by_id?: number }
        const body = req.body as any;

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
          if (pairs.length === 0) {
            return res
              .status(400)
              .json({
                success: false,
                message: "Invalid positions/value payload",
              });
          }
          const updatedById =
            body.updated_by_id != null ? Number(body.updated_by_id) : undefined;
          const result = await uc.reorder.execute(pairs, updatedById);
          return res.json({ data: result });
        }

        // Mặc định: bulk patch
        const { ids, patch } = body as {
          ids: number[];
          patch: UpdateProductPatch;
        };
        const result = await uc.bulkEdit.execute(ids, patch);
        res.json({ data: result });
      } catch (e) {
        next(e);
      }
    },
  };
};

export type ProductsController = ReturnType<typeof makeProductsController>;
