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

const normalizeOptions = (
  options?: Array<{
    id?: number;
    name: string;
    position?: number;
    values?: Array<{
      id?: number;
      value: string;
      position?: number;
    }>;
  }>,
) =>
  Array.isArray(options)
    ? options.map((o, optionIndex) => ({
        id: o.id,
        name: String(o.name ?? "").trim(),
        position: o.position ?? optionIndex,
        values: Array.isArray(o.values)
          ? o.values.map((v, valueIndex) => ({
              id: v.id,
              value: String(v.value ?? "").trim(),
              position: v.position ?? valueIndex,
            }))
          : [],
      }))
    : undefined;

const normalizeVariants = (
  variants?: Array<{
    id?: number;
    sku?: string | null;
    title?: string | null;
    price?: number | null;
    compareAtPrice?: number | null;
    stock?: number;
    status?: ProductStatus;
    sortOrder?: number;
    optionValueIds?: number[];
    optionValues?: Array<{
      id?: number;
      value: string;
      optionId?: number;
      optionName?: string;
      position?: number;
    }>;
  }>,
) =>
  Array.isArray(variants)
    ? variants.map((v, index) => ({
        id: v.id,
        sku: v.sku ?? null,
        title: v.title ?? null,
        price: Number(v.price ?? 0),
        compareAtPrice:
          v.compareAtPrice !== undefined && v.compareAtPrice !== null
            ? Number(v.compareAtPrice)
            : null,
        stock: Number(v.stock ?? 0),
        status: v.status ?? "active",
        sortOrder: v.sortOrder ?? index,
        optionValueIds: Array.isArray(v.optionValueIds)
          ? v.optionValueIds
              .map(Number)
              .filter((id) => Number.isFinite(id) && id > 0)
          : [],
        optionValues: Array.isArray(v.optionValues)
          ? v.optionValues.map((ov) => ({
              id: ov.id,
              value: String(ov.value ?? "").trim(),
              optionId:
                ov.optionId !== undefined && ov.optionId !== null
                  ? Number(ov.optionId)
                  : undefined,
              optionName: String(ov.optionName ?? "").trim(),
              position:
                ov.position !== undefined && ov.position !== null
                  ? Number(ov.position)
                  : undefined,
            }))
          : [],
      }))
    : undefined;

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
          success: true,
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
        const dto = await uc.detail.execute(id);

        return res.json({
          success: true,
          data: {
            id: dto.id,
            title: dto.title,
            description: dto.description ?? "",
            product_category_id: dto.categoryId ?? "",
            category: dto.category ?? null,

            // product-level summary fields
            price: dto.price ?? 0,
            discount_percentage: dto.discountPercentage ?? 0,
            stock: dto.stock ?? 0,
            total_stock: dto.totalStock ?? dto.stock ?? 0,
            default_variant_id: dto.defaultVariantId ?? null,
            price_range: dto.priceRange ?? null,

            thumbnail: dto.thumbnail ?? "",
            status: dto.status,
            featured: dto.featured ? 1 : 0,
            position: dto.position ?? "",
            slug: dto.slug ?? "",
            average_rating: dto.averageRating ?? 0,
            review_count: dto.reviewCount ?? 0,

            origin_id: dto.originId ?? null,
            origin: dto.origin ?? null,
            tags: dto.tags ?? [],
            tagIds: dto.tagIds ?? [],

            short_description: dto.shortDescription ?? "",
            storage_guide: dto.storageGuide ?? "",
            usage_suggestions: dto.usageSuggestions ?? "",
            nutrition_notes: dto.nutritionNotes ?? "",

            options: dto.options ?? [],
            variants: dto.variants ?? [],

            created_by_id: dto.createdById ?? null,
            updated_by_id: dto.updatedById ?? null,
            created_at: dto.createdAt ?? null,
            updated_at: dto.updatedAt ?? null,
          },
        });
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
          originId?: number | null;
          shortDescription?: string | null;
          storageGuide?: string | null;
          usageSuggestions?: string | null;
          nutritionNotes?: string | null;
          tagIds?: number[];
          options?: Array<{
            id?: number;
            name: string;
            position?: number;
            values?: Array<{
              id?: number;
              value: string;
              position?: number;
            }>;
          }>;
          variants?: Array<{
            id?: number;
            sku?: string | null;
            title?: string | null;
            price?: number | null;
            compareAtPrice?: number | null;
            stock?: number;
            status?: ProductStatus;
            sortOrder?: number;
            optionValueIds?: number[];
            optionValues?: Array<{
              id?: number;
              value: string;
              optionId?: number;
              optionName?: string;
              position?: number;
            }>;
          }>;
        };
        const result = await uc.create.execute({
          ...payload,
          options: normalizeOptions(payload.options),
          variants: normalizeVariants(payload.variants),
        });
        res.status(201).json({
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
            title: dto.title,
            description: dto.description ?? "",
            product_category_id: dto.categoryId ?? "",
            category: dto.category ?? null,

            // product-level summary fields
            price: dto.price ?? 0,
            discount_percentage: dto.discountPercentage ?? 0,
            stock: dto.stock ?? 0,
            total_stock: dto.totalStock ?? dto.stock ?? 0,
            default_variant_id: dto.defaultVariantId ?? null,
            price_range: dto.priceRange ?? null,

            thumbnail: dto.thumbnail ?? "",
            status: dto.status,
            featured: dto.featured ? 1 : 0,
            position: dto.position ?? "",
            slug: dto.slug ?? "",
            average_rating: dto.averageRating ?? 0,
            review_count: dto.reviewCount ?? 0,

            origin_id: dto.originId ?? null,
            origin: dto.origin ?? null,
            tags: dto.tags ?? [],
            tagIds: dto.tagIds ?? [],

            short_description: dto.shortDescription ?? "",
            storage_guide: dto.storageGuide ?? "",
            usage_suggestions: dto.usageSuggestions ?? "",
            nutrition_notes: dto.nutritionNotes ?? "",

            options: dto.options ?? [],
            variants: dto.variants ?? [],

            created_by_id: dto.createdById ?? null,
            updated_by_id: dto.updatedById ?? null,
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
        const patch = req.body as UpdateProductPatch;

        const normalizedPatch: UpdateProductPatch = {
          ...patch,
          options: normalizeOptions(patch.options as any),
          variants: normalizeVariants(patch.variants as any),
        };

        const result = await uc.edit.execute(id, normalizedPatch);
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
        const { status } = req.body as { status: ProductStatus };
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

    bulkEdit: async (req: Request, res: Response, next: NextFunction) => {
      try {
        const body = req.body as any;

        // ===== A) action: 'status' =====
        if (body.action === "status") {
          const ids: number[] = Array.isArray(body.ids)
            ? body.ids.map(Number)
            : [];
          const value = String(body.value || "");
          const allowed = ["active", "inactive", "draft"]; // nếu bạn chỉ dùng active/inactive thì rút gọn mảng này
          if (!ids.length) {
            return res.status(400).json({
              success: false,
              message: "Field 'ids' must be a non-empty array",
              data: null,
            });
          }
          if (!allowed.includes(value)) {
            return res.status(400).json({
              success: false,
              message: `Invalid status value (must be ${allowed.join(" | ")})`,
              data: null,
            });
          }
          const updatedById =
            body.updated_by_id != null ? Number(body.updated_by_id) : null;
          const result = await uc.bulkEdit.execute(ids, {
            status: value as any,
            updatedById,
          });
          return res.json({
            success: true,
            data: result,
            meta: { total: 0, page: 1, limit: 10 },
          });
        }

        // ===== B) action: 'delete' (soft delete hàng loạt) =====
        if (body.action === "delete") {
          const ids: number[] = Array.isArray(body.ids)
            ? body.ids.map(Number)
            : [];
          if (!ids.length) {
            return res.status(400).json({
              success: false,
              message: "Field 'ids' must be a non-empty array",
              data: null,
            });
          }
          const deletedById =
            body.updated_by_id != null ? Number(body.updated_by_id) : null;
          const result = await uc.bulkEdit.execute(ids, {
            deleted: true,
            deletedById,
          });
          return res.json({
            success: true,
            data: result,
            meta: { total: 0, page: 1, limit: 10 },
          });
        }

        // ===== C) action: 'position' (đổi vị trí từng id) =====
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
          const updatedById =
            body.updated_by_id != null ? Number(body.updated_by_id) : undefined;
          const result = await uc.reorder.execute(pairs, updatedById);
          return res.json({
            success: true,
            data: result,
            meta: { total: 0, page: 1, limit: 10 },
          });
        }

        // ===== D) Mặc định: { ids, patch } =====
        const { ids, patch } = body as {
          ids: number[];
          patch: UpdateProductPatch;
        };
        if (!Array.isArray(ids) || !ids.length) {
          return res.status(400).json({
            success: false,
            message: "Field 'ids' must be a non-empty array",
            data: null,
          });
        }
        const result = await uc.bulkEdit.execute(ids, patch ?? {});
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

export type ProductsController = ReturnType<typeof makeProductsController>;
