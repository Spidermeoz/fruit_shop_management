import { Request, Response, NextFunction } from "express";
import { ListProducts } from "../../../../../application/products/usecases/ListProducts";
import { GetProductDetail } from "../../../../../application/products/usecases/GetProductDetail";
import { ProductListFilter } from "../../../../../domain/products/types";
import ProductCategoryModel from "../../../../../infrastructure/db/sequelize/models/ProductCategoryModel";
import { Op } from "sequelize";

const toNum = (v: any) => (v === undefined ? undefined : Number(v));

export const makeClientProductsController = (uc: {
  list: ListProducts;
  detail: GetProductDetail;
}) => {
  return {
    // ✅ GET /api/v1/client/products
    list: async (req: Request, res: Response, next: NextFunction) => {
      try {
        const {
          page,
          limit,
          q,
          categoryId,
          category,
          minPrice,
          maxPrice,
          sortBy,
          order,
          featured,
        } = req.query;

        let categoryIds: number[] | null = null;

        // ✅ Nếu có slug danh mục → lấy tất cả id con cháu
        if (category && !categoryId) {
          const cat = await ProductCategoryModel.findOne({
            where: {
              slug: String(category).replace(/_/g, "-"),
              deleted: 0,
            },
            attributes: ["id"],
          });

          if (cat) {
            const rootId = cat.getDataValue("id");

            // 🧠 Lấy toàn bộ danh mục con (đệ quy)
            interface CategoryNode {
              id: number;
              parent_id: number | null;
            }

            const allCategories = (await ProductCategoryModel.findAll({
              where: { deleted: 0 },
              attributes: ["id", "parent_id"],
              raw: true,
            })) as unknown as CategoryNode[];

            const collectChildren = (parentId: number): number[] => {
              const children = allCategories
                .filter((c) => c.parent_id === parentId)
                .map((c) => c.id);
              const deeper = children.flatMap((childId) =>
                collectChildren(childId)
              );
              return [...children, ...deeper];
            };

            const childrenIds = collectChildren(rootId);
            categoryIds = [rootId, ...childrenIds];
          }
        } else if (categoryId) {
          categoryIds = [Number(categoryId)];
        }

        const featuredAsBoolean =
          featured === "true" ? true : featured === "false" ? false : undefined;

        // ✅ Giữ nguyên toàn bộ logic filter cũ
        const data = await uc.list.execute({
          page: toNum(page) ?? 1,
          limit: toNum(limit) ?? 12,
          q: q as string,
          categoryId: categoryIds?.length ? categoryIds : null,
          status: "active",
          minPrice: minPrice ? Number(minPrice) : undefined,
          maxPrice: maxPrice ? Number(maxPrice) : undefined,
          sortBy: (sortBy as ProductListFilter["sortBy"]) ?? "position",
          order: (order as ProductListFilter["order"]) ?? "ASC",
          featured: featuredAsBoolean,
        });

        // ✅ Không rút gọn result — trả nguyên data.rows với đầy đủ field
        const result = data.rows.map((p) => ({
          id: p.id,
          categoryId: p.categoryId ?? p.product_category_id ?? null,
          product_category_id: p.product_category_id ?? p.categoryId ?? null,
          title: p.title,
          description: p.description,
          price: p.price,
          discountPercentage: p.discountPercentage,
          stock: p.stock,
          thumbnail: p.thumbnail,
          slug: p.slug,
          status: p.status,
          featured: p.featured,
          position: p.position,
          averageRating: p.averageRating ?? 0,
          reviewCount: p.reviewCount ?? 0,
          deleted: p.deleted,
          deletedAt: p.deletedAt,
          createdAt: p.createdAt,
          updatedAt: p.updatedAt,
          createdById: p.createdById ?? null,
          updatedById: p.updatedById ?? null,
          effectivePrice:
            p.price && p.discountPercentage && p.discountPercentage > 0
              ? p.price * (1 - p.discountPercentage / 100)
              : p.price,
          category: p.category
            ? {
                id: p.category.id,
                title: p.category.title,
              }
            : null,
        }));

        res.json({
          success: true,
          data: result,
          meta: {
            total: data.count,
            page: Number(page ?? 1),
            limit: Number(limit ?? 12),
          },
        });
      } catch (err) {
        next(err);
      }
    },

    // ✅ GET /api/v1/client/products/:id
    detail: async (req: Request, res: Response, next: NextFunction) => {
      try {
        const id = Number(req.params.id);
        const dto = await uc.detail.execute(id);

        if (!dto || dto.status !== "active") {
          return res.status(404).json({
            success: false,
            message: "Product not found or inactive",
          });
        }

        res.json({
          success: true,
          data: {
            id: dto.id,
            title: dto.title,
            description: dto.description,
            price: dto.price,
            discountPercentage: dto.discountPercentage,
            stock: dto.stock,
            thumbnail: dto.thumbnail,
            slug: dto.slug,
            featured: dto.featured,
            category: dto.category
              ? { id: dto.category.id, title: dto.category.title }
              : null,
          },
        });
      } catch (err) {
        next(err);
      }
    },
  };
};

export type ClientProductsController = ReturnType<
  typeof makeClientProductsController
>;
